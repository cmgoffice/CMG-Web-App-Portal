import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { getDb } from '../firebase';
import type { AppData, TabData, App } from '../types/portal';
import { DEFAULT_PORTAL_DATA, MENU_ORDER } from '../data/defaultPortalData';

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
 * - การ์ดที่อยู่ใน default แต่ไม่มีใน Firestore จะถูกเพิ่มต่อท้าย (ของใหม่ที่เพิ่มในโค้ด)
 */
export function mergeWithDefaults(data: AppData | null): AppData {
  if (!data || Object.keys(data).length === 0) return DEFAULT_PORTAL_DATA;
  const merged: AppData = {};
  for (const key of MENU_ORDER) {
    const defaultSection = DEFAULT_PORTAL_DATA[key] as TabData | undefined;
    const dbSection = data[key] as TabData | undefined;
    if (!defaultSection) {
      if (dbSection) merged[key] = dbSection;
      continue;
    }
    const defaultApps = defaultSection.apps || [];
    const dbApps = dbSection?.apps || [];
    const namesInDb = new Set(dbApps.map((a) => a.name));
    // เพิ่มเฉพาะการ์ด default ที่ยังไม่มีใน Firestore (Firestore มี priority)
    const missingFromDb = defaultApps.filter((a) => !namesInDb.has(a.name));
    merged[key] = {
      title: dbSection?.title ?? defaultSection.title,
      apps: [...dbApps, ...missingFromDb],
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
      // Document ยังไม่มี — สร้างใหม่
      const section = DEFAULT_PORTAL_DATA[menuKey];
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
  const currentApps = merged[menuKey]?.apps ?? [];
  await saveMenuApps(menuKey, [...currentApps, newApp]);
}

/** แก้ไขการ์ดตาม index */
export async function updateAppCard(menuKey: string, index: number, updatedApp: App): Promise<void> {
  const current = await getPortalData();
  const merged = mergeWithDefaults(current);
  const apps = [...(merged[menuKey]?.apps ?? [])];
  apps[index] = updatedApp;
  await saveMenuApps(menuKey, apps);
}

/** ลบการ์ดตาม index */
export async function deleteAppCard(menuKey: string, index: number): Promise<void> {
  const current = await getPortalData();
  const merged = mergeWithDefaults(current);
  const apps = (merged[menuKey]?.apps ?? []).filter((_, i) => i !== index);
  await saveMenuApps(menuKey, apps);
}

/** เรียงลำดับการ์ดใหม่ */
export async function reorderAppCards(menuKey: string, apps: App[]): Promise<void> {
  await saveMenuApps(menuKey, apps);
}
