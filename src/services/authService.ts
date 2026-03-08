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
import { PATHS } from './dbPaths';

async function initPersistence() {
  const auth = getFirebaseAuth();
  await setPersistence(auth, browserLocalPersistence);
}

async function createUserProfile(
  fbUser: FirebaseUser,
  extra: { firstName: string; lastName: string; position: string }
): Promise<UserProfile> {
  const db = getDb();
  const metaRef = doc(db, PATHS.appMetaConfig);
  const userRef = doc(db, PATHS.users, fbUser.uid);

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

  // log non-blocking
  logActivity({
    userId: fbUser.uid,
    userEmail: fbUser.email ?? '',
    userName: `${extra.firstName} ${extra.lastName}`,
    action: 'REGISTER',
    details: `New user registered: ${fbUser.email}`,
  }).catch(() => {});

  return profile;
}

export async function getUserProfile(uid: string): Promise<UserProfile> {
  const db = getDb();
  const snap = await getDoc(doc(db, PATHS.users, uid));
  if (!snap.exists()) throw new Error('User profile not found');
  return snap.data() as UserProfile;
}

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
  // ตั้ง session ทันที ก่อนที่ onAuthStateChanged จะ fire
  setSessionExpiry();
  await updateProfile(user, { displayName: `${firstName} ${lastName}` });
  await user.getIdToken(true);
  try {
    return await createUserProfile(user, { firstName, lastName, position });
  } catch (err) {
    console.error('[registerWithEmail] createUserProfile failed:', err);
    throw err;
  }
}

export async function loginWithEmail(email: string, password: string): Promise<UserProfile> {
  await initPersistence();
  const auth = getFirebaseAuth();
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  // ตั้ง session ทันที ก่อนที่ onAuthStateChanged จะ fire
  setSessionExpiry();
  await user.getIdToken(true);

  let profile: UserProfile;
  try {
    profile = await getUserProfile(user.uid);
  } catch (err) {
    console.error('[loginWithEmail] getUserProfile failed:', err);
    throw err;
  }

  logActivity({
    userId: user.uid,
    userEmail: user.email ?? '',
    userName: user.displayName ?? user.email ?? '',
    action: 'LOGIN',
    details: `Login via Email: ${user.email}`,
  }).catch(() => {});

  return profile;
}

export async function loginWithGoogle(): Promise<UserProfile> {
  await initPersistence();
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  const { user } = await signInWithPopup(auth, provider);
  // ตั้ง session ทันที ก่อนที่ onAuthStateChanged จะ fire
  setSessionExpiry();
  await user.getIdToken(true);

  const db = getDb();
  const userRef = doc(db, PATHS.users, user.uid);

  let snap;
  try {
    snap = await getDoc(userRef);
  } catch (err) {
    console.error('[loginWithGoogle] getDoc failed:', err);
    throw err;
  }

  let profile: UserProfile;
  if (snap.exists()) {
    profile = snap.data() as UserProfile;
    logActivity({
      userId: user.uid,
      userEmail: user.email ?? '',
      userName: `${profile.firstName} ${profile.lastName}`,
      action: 'LOGIN',
      details: `Login via Google: ${user.email}`,
    }).catch(() => {});
  } else {
    const nameParts = (user.displayName ?? '').split(' ');
    const firstName = nameParts[0] ?? '';
    const lastName = nameParts.slice(1).join(' ') ?? '';
    try {
      profile = await createUserProfile(user, { firstName, lastName, position: '' });
    } catch (err) {
      console.error('[loginWithGoogle] createUserProfile failed:', err);
      throw err;
    }
  }

  return profile;
}

export async function logout(): Promise<void> {
  const auth = getFirebaseAuth();
  clearSession();
  await signOut(auth);
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}
