import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { getDb } from '../firebase';
import type { AppData } from '../types/portal';
import { DEFAULT_PORTAL_DATA } from '../data/defaultPortalData';

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
      callback(data && Object.keys(data).length > 0 ? data : null);
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
