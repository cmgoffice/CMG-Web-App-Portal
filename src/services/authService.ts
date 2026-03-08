import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  runTransaction,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { getFirebaseAuth, getDb } from '../firebase';
import type { UserProfile, UserRole, UserStatus } from '../types/auth';
import { logActivity } from './activityLogService';
import { setSessionExpiry, clearSession } from './sessionService';

const USERS_COLL = 'users';

/** ตั้งค่า persistence เป็น local (เก็บข้ามหน้าต่าง) */
async function initPersistence() {
  const auth = getFirebaseAuth();
  await setPersistence(auth, browserLocalPersistence);
}

/** สร้าง UserProfile ใน Firestore (รองรับ first-user logic ด้วย transaction) */
async function createUserProfile(
  fbUser: FirebaseUser,
  extra: { firstName: string; lastName: string; position: string }
): Promise<UserProfile> {
  const db = getDb();
  const metaRef = doc(db, 'appMeta', 'config');
  const userRef = doc(db, USERS_COLL, fbUser.uid);

  let profile!: UserProfile;

  await runTransaction(db, async (tx) => {
    const metaSnap = await tx.get(metaRef);
    const isFirst = !metaSnap.exists() || !metaSnap.data()?.firstUserRegistered;

    profile = {
      uid: fbUser.uid,
      email: fbUser.email ?? '',
      firstName: extra.firstName,
      lastName: extra.lastName,
      position: extra.position,
      role: isFirst ? ('SuperAdmin' as UserRole) : ('Staff' as UserRole),
      status: isFirst ? ('approved' as UserStatus) : ('pending' as UserStatus),
      assignedProjects: [],
      createdAt: new Date(),
      photoURL: fbUser.photoURL ?? undefined,
      isFirstUser: isFirst,
    };

    tx.set(userRef, { ...profile, createdAt: serverTimestamp() });

    if (isFirst) {
      tx.set(metaRef, {
        firstUserRegistered: true,
        totalUsers: 1,
        createdAt: serverTimestamp(),
      });
    } else {
      tx.update(metaRef, { totalUsers: increment(1) });
    }
  });

  await logActivity({
    userId: fbUser.uid,
    userEmail: fbUser.email ?? '',
    userName: `${extra.firstName} ${extra.lastName}`,
    action: 'REGISTER',
    details: `New user registered: ${fbUser.email}`,
  });

  return profile;
}

/** ดึง UserProfile จาก Firestore */
export async function getUserProfile(uid: string): Promise<UserProfile> {
  const db = getDb();
  const snap = await getDoc(doc(db, USERS_COLL, uid));
  if (!snap.exists()) throw new Error('User profile not found');
  return snap.data() as UserProfile;
}

/** สมัครสมาชิกด้วย Email/Password */
export async function registerWithEmail(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  position: string
): Promise<UserProfile> {
  await initPersistence();
  const auth = getFirebaseAuth();
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName: `${firstName} ${lastName}` });
  const profile = await createUserProfile(user, { firstName, lastName, position });
  setSessionExpiry();
  return profile;
}

/** เข้าสู่ระบบด้วย Email/Password */
export async function loginWithEmail(email: string, password: string): Promise<UserProfile> {
  await initPersistence();
  const auth = getFirebaseAuth();
  const { user } = await signInWithEmailAndPassword(auth, email, password);

  await logActivity({
    userId: user.uid,
    userEmail: user.email ?? '',
    userName: user.displayName ?? user.email ?? '',
    action: 'LOGIN',
    details: `Login via Email: ${user.email}`,
  });

  setSessionExpiry();
  return getUserProfile(user.uid);
}

/** เข้าสู่ระบบหรือสมัครด้วย Google */
export async function loginWithGoogle(): Promise<UserProfile> {
  await initPersistence();
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  const { user } = await signInWithPopup(auth, provider);

  const db = getDb();
  const userRef = doc(db, USERS_COLL, user.uid);
  const snap = await getDoc(userRef);

  let profile: UserProfile;
  if (snap.exists()) {
    profile = snap.data() as UserProfile;
    await logActivity({
      userId: user.uid,
      userEmail: user.email ?? '',
      userName: `${profile.firstName} ${profile.lastName}`,
      action: 'LOGIN',
      details: `Login via Google: ${user.email}`,
    });
  } else {
    const nameParts = (user.displayName ?? '').split(' ');
    const firstName = nameParts[0] ?? '';
    const lastName = nameParts.slice(1).join(' ') ?? '';
    profile = await createUserProfile(user, { firstName, lastName, position: '' });
  }

  setSessionExpiry();
  return profile;
}

/** ออกจากระบบ */
export async function logout(): Promise<void> {
  const auth = getFirebaseAuth();
  clearSession();
  await signOut(auth);
}

/** Subscribe ต่อ auth state */
export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}
