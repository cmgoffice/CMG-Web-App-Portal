import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { getDb } from '../firebase';
import type { AppData, TabData } from '../types/portal';
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

/** รวมข้อมูลจาก Firestore กับ default — การ์ดที่เพิ่มใน default จะโผล่แม้ข้อมูลใน Firestore ยังเป็นเวอร์ชันเก่า */
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
    const missingFromDb = defaultApps.filter((a) => !namesInDb.has(a.name));
    // การ์ดที่มีใน Firestore ให้ใช้ข้อมูลจาก default ทับ (url, icon, color, desc) เพื่อให้การเปลี่ยน URL ในโค้ดมีผล
    const defaultByName = new Map(defaultApps.map((a) => [a.name, a]));
    const mergedDbApps = dbApps.map((dbApp) => {
      const def = defaultByName.get(dbApp.name);
      return def ? { ...dbApp, ...def } : dbApp;
    });
    const apps = [...missingFromDb, ...mergedDbApps];
    merged[key] = { title: dbSection?.title ?? defaultSection.title, apps };
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

/** สร้างข้อมูล Mock ใน Firebase ถ้า document ยังไม่มี (ทุก User ใช้ข้อมูลชุดเดียวกัน) */
export async function seedPortalDataIfEmpty(): Promise<boolean> {
  const existing = await getPortalData();
  if (existing) return false;
  const ref = getPortalDocRef();
  await setDoc(ref, DEFAULT_PORTAL_DATA);
  return true;
}
