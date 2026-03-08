import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
  increment,
  UpdateData,
} from 'firebase/firestore';
import { getDb } from '../firebase';
import type { UserProfile, UserRole, UserStatus } from '../types/auth';
import { logActivity } from './activityLogService';
import { PATHS } from './dbPaths';

export async function getAllUsers(): Promise<UserProfile[]> {
  const db = getDb();
  const q = query(collection(db, PATHS.users), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data() } as UserProfile));
}

export function subscribeAllUsers(callback: (users: UserProfile[]) => void): Unsubscribe {
  const db = getDb();
  const q = query(collection(db, PATHS.users), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ ...d.data() } as UserProfile)));
  });
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<Pick<UserProfile, 'firstName' | 'lastName' | 'position' | 'role' | 'status' | 'assignedProjects'>>,
  actorEmail: string,
  actorName: string
): Promise<void> {
  const db = getDb();
  await updateDoc(doc(db, PATHS.users, uid), updates as UpdateData<UserProfile>);
  await logActivity({
    userId: uid,
    userEmail: actorEmail,
    userName: actorName,
    action: 'UPDATE_USER',
    details: `Updated user ${uid}: ${JSON.stringify(updates)}`,
  });
}

export async function deleteUser(
  uid: string,
  actorEmail: string,
  actorName: string
): Promise<void> {
  const db = getDb();
  const snap = await getDoc(doc(db, PATHS.users, uid));
  const email = snap.exists() ? (snap.data() as UserProfile).email : uid;

  await deleteDoc(doc(db, PATHS.users, uid));

  const metaRef = doc(db, PATHS.appMetaConfig);
  await updateDoc(metaRef, { totalUsers: increment(-1) });

  await logActivity({
    userId: uid,
    userEmail: actorEmail,
    userName: actorName,
    action: 'DELETE_USER',
    details: `Deleted user: ${email}`,
  });
}

export async function getTotalUserCount(): Promise<number> {
  const db = getDb();
  const snap = await getDoc(doc(db, PATHS.appMetaConfig));
  if (!snap.exists()) return 0;
  return (snap.data()?.totalUsers as number) ?? 0;
}
