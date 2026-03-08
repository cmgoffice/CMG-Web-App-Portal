import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { getDb } from '../firebase';
import type { ActivityLog } from '../types/activityLog';

const LOGS_COLL = 'activityLogs';

export async function logActivity(entry: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void> {
  const db = getDb();
  await addDoc(collection(db, LOGS_COLL), {
    ...entry,
    timestamp: serverTimestamp(),
  });
}

export async function getActivityLogs(limitCount = 100): Promise<ActivityLog[]> {
  const db = getDb();
  const q = query(
    collection(db, LOGS_COLL),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ActivityLog));
}

export function subscribeActivityLogs(
  callback: (logs: ActivityLog[]) => void,
  limitCount = 100
): Unsubscribe {
  const db = getDb();
  const q = query(
    collection(db, LOGS_COLL),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ActivityLog)));
  });
}
