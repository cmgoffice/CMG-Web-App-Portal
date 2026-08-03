import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteField,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { getDb } from '../firebase';
import type { AppData, TabData, App } from '../types/portal';
import { DEFAULT_PORTAL_DATA, MENU_ORDER, getMenuOrder } from '../data/defaultPortalData';

const COLLECTION_NAME = 'CMG-web-portal';
const ROOT_DOC_ID = 'root';

export function getPortalDocRef() {
  return doc(getDb(), COLLECTION_NAME, ROOT_DOC_ID);
}

/** ดึงข้อมูล Portal จาก Firestore (ครั้งเดียว) */
export async function getPortalData(): Promise<AppData | null> {
  const ref = getPortalDocRef();
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as AppData;
  return data && Object.keys(data).length > 0 ? data : null;
}

/**
 * Merge Firestore data กับ default
 * - Firestore มี priority (ข้อมูลที่แก้ไขผ่าน Admin จะถูกเก็บไว้)
 * - รองรับทั้งเมนู Default และเมนู Custom ที่สร้างใหม่
 */
export function mergeWithDefaults(data: AppData | null): AppData {
  if (!data || Object.keys(data).length === 0) return DEFAULT_PORTAL_DATA;
  const merged: AppData = {};

  if (Array.isArray(data._menuOrder)) {
    merged._menuOrder = data._menuOrder;
  }

  const allKeys = Array.from(
    new Set([
      ...MENU_ORDER,
      ...Object.keys(data).filter((k) => k !== '_menuOrder'),
    ])
  );

  for (const key of allKeys) {
    const defaultSection = DEFAULT_PORTAL_DATA[key] as TabData | undefined;
    const dbSection = data[key] as TabData | undefined;
    if (!dbSection) {
      if (defaultSection) merged[key] = defaultSection;
      continue;
    }
    merged[key] = {
      title: dbSection.title ?? defaultSection?.title ?? key,
      apps: dbSection.apps || [],
      ...(dbSection.icon ? { icon: dbSection.icon } : defaultSection?.icon ? { icon: defaultSection.icon } : {}),
      ...(dbSection.color ? { color: dbSection.color } : defaultSection?.color ? { color: defaultSection.color } : {}),
      ...(dbSection.isCustom ? { isCustom: dbSection.isCustom } : {}),
    };
  }

  return merged;
}

/** ฟังการเปลี่ยนแปลงข้อมูล Portal แบบ realtime */
export function subscribePortalData(callback: (data: AppData | null) => void): Unsubscribe {
  const ref = getPortalDocRef();
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      const data = snap.data() as AppData;
      callback(mergeWithDefaults(data && Object.keys(data).length > 0 ? data : null));
    },
    (err) => {
      console.error('Firestore subscribe error:', err);
      callback(null);
    }
  );
}

/** สร้างข้อมูลเริ่มต้นใน Firebase ถ้า document ยังไม่มี */
export async function seedPortalDataIfEmpty(): Promise<boolean> {
  const existing = await getPortalData();
  if (existing) return false;
  const ref = getPortalDocRef();
  await setDoc(ref, DEFAULT_PORTAL_DATA);
  return true;
}

// ─── CRUD สำหรับ Admin Portal Manager ────────────────────────────────────────

/**
 * Firestore ไม่รับค่า undefined — ต้อง strip ออกก่อน save
 * ใช้ JSON.parse(JSON.stringify(...)) เพื่อ deep-clone และลบ undefined ทั้งหมด
 */
function sanitizeApps(apps: App[]): App[] {
  return JSON.parse(JSON.stringify(apps));
}

/** บันทึก apps ทั้งหมดของ section ลง Firestore */
async function saveMenuApps(menuKey: string, apps: App[]): Promise<void> {
  const ref = getPortalDocRef();
  const cleanApps = sanitizeApps(apps);
  try {
    await updateDoc(ref, { [`${menuKey}.apps`]: cleanApps });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'not-found') {
      const section = DEFAULT_PORTAL_DATA[menuKey] as TabData | undefined;
      await setDoc(
        ref,
        { [menuKey]: { title: section?.title ?? menuKey, apps: cleanApps } },
        { merge: true }
      );
    } else {
      throw err;
    }
  }
}

/** เพิ่มการ์ดใหม่ใน section */
export async function addAppCard(menuKey: string, newApp: App): Promise<void> {
  const current = await getPortalData();
  const merged = mergeWithDefaults(current);
  const currentApps = (merged[menuKey] as TabData)?.apps ?? [];
  await saveMenuApps(menuKey, [...currentApps, newApp]);
}

/** แก้ไขการ์ดตาม index */
export async function updateAppCard(menuKey: string, index: number, updatedApp: App): Promise<void> {
  const current = await getPortalData();
  const merged = mergeWithDefaults(current);
  const apps = [...((merged[menuKey] as TabData)?.apps ?? [])];
  apps[index] = updatedApp;
  await saveMenuApps(menuKey, apps);
}

/** ลบการ์ดตาม index */
export async function deleteAppCard(menuKey: string, index: number): Promise<void> {
  const current = await getPortalData();
  const merged = mergeWithDefaults(current);
  const apps = ((merged[menuKey] as TabData)?.apps ?? []).filter((_, i) => i !== index);
  await saveMenuApps(menuKey, apps);
}

/** เรียงลำดับการ์ดใหม่ */
export async function reorderAppCards(menuKey: string, apps: App[]): Promise<void> {
  await saveMenuApps(menuKey, apps);
}

// ─── CRUD สำหรับจัดการ Menus ──────────────────────────────────────────────────

/** เพิ่มเมนูใหม่ */
export async function addMenu(title: string, icon: string, color: string): Promise<string> {
  const ref = getPortalDocRef();
  const current = await getPortalData();
  const currentOrder = getMenuOrder(current);

  const menuKey = `menu_${Date.now()}`;
  const newOrder = [...currentOrder, menuKey];

  await setDoc(
    ref,
    {
      [menuKey]: {
        title,
        apps: [],
        icon,
        color,
        isCustom: true,
      },
      _menuOrder: newOrder,
    },
    { merge: true }
  );

  return menuKey;
}

/** แก้ไขเมนู (ชื่อ, icon, สี) */
export async function updateMenu(
  menuKey: string,
  updates: { title?: string; icon?: string; color?: string }
): Promise<void> {
  const ref = getPortalDocRef();
  const updatePayload: Record<string, string> = {};
  if (updates.title !== undefined) updatePayload[`${menuKey}.title`] = updates.title;
  if (updates.icon !== undefined)  updatePayload[`${menuKey}.icon`]  = updates.icon;
  if (updates.color !== undefined) updatePayload[`${menuKey}.color`] = updates.color;

  await updateDoc(ref, updatePayload);
}

/** ลบเมนู */
export async function deleteMenu(menuKey: string): Promise<void> {
  const ref = getPortalDocRef();
  const current = await getPortalData();
  const currentOrder = getMenuOrder(current);
  const newOrder = currentOrder.filter((k) => k !== menuKey);

  await updateDoc(ref, {
    [menuKey]: deleteField(),
    _menuOrder: newOrder,
  });
}

/** เรียงลำดับเมนูใหม่ */
export async function reorderMenus(newOrder: string[]): Promise<void> {
  const ref = getPortalDocRef();
  await updateDoc(ref, {
    _menuOrder: newOrder,
  });
}
