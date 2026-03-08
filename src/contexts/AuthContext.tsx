import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthChange, getUserProfile, logout } from '../services/authService';
import { isSessionExpired, getRemainingMinutes, clearSession } from '../services/sessionService';
import type { UserProfile } from '../types/auth';

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  sessionMinutesLeft: number;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  userProfile: null,
  loading: true,
  sessionMinutesLeft: 60,
  refreshProfile: async () => {},
});

const CHECK_INTERVAL_MS = 60_000; // ตรวจสอบทุก 1 นาที

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionMinutesLeft, setSessionMinutesLeft] = useState(60);

  const fetchProfile = async (uid: string) => {
    try {
      const profile = await getUserProfile(uid);
      setUserProfile(profile);
    } catch {
      setUserProfile(null);
    }
  };

  const refreshProfile = useCallback(async () => {
    if (firebaseUser) await fetchProfile(firebaseUser.uid);
  }, [firebaseUser]);

  /** ตรวจสอบว่า session หมดอายุหรือยัง ถ้าหมดให้ logout */
  const checkSession = useCallback(async () => {
    if (!firebaseUser) return;
    if (isSessionExpired()) {
      clearSession();
      await logout();
      setFirebaseUser(null);
      setUserProfile(null);
    } else {
      setSessionMinutesLeft(getRemainingMinutes());
    }
  }, [firebaseUser]);

  /* ── Auth state listener ── */
  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        // ถ้า Firebase บอกว่า login อยู่ แต่ session ของเราหมดแล้ว → force logout
        if (isSessionExpired()) {
          clearSession();
          await logout();
          setFirebaseUser(null);
          setUserProfile(null);
          setLoading(false);
          return;
        }
        setFirebaseUser(user);
        setSessionMinutesLeft(getRemainingMinutes());
        await fetchProfile(user.uid);
      } else {
        setFirebaseUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  /* ── ตรวจสอบ session ทุก 1 นาที ── */
  useEffect(() => {
    if (!firebaseUser) return;
    const timer = setInterval(checkSession, CHECK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [firebaseUser, checkSession]);

  return (
    <AuthContext.Provider
      value={{ firebaseUser, userProfile, loading, sessionMinutesLeft, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
