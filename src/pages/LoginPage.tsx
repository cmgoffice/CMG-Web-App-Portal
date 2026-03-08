import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loginWithEmail, loginWithGoogle } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, loading: authLoading, refreshProfile } = useAuth();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';

  const [showEmailForm, setShowEmailForm] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  /**
   * ตัวเดียวที่จัดการ redirect ทั้งหมด —
   * จะทำงานเมื่อ authLoading เสร็จแล้ว และ userProfile เปลี่ยน
   * (รวมถึงหลัง Google / Email login สำเร็จ)
   */
  useEffect(() => {
    if (authLoading) return;   // ยังโหลดอยู่ รอก่อน
    if (!userProfile) return;  // ยังไม่ได้ login ค้างอยู่หน้านี้

    if (userProfile.status === 'rejected') {
      setError('บัญชีของคุณถูกปฏิเสธ กรุณาติดต่อผู้ดูแลระบบ');
      return;
    }

    if (userProfile.status === 'pending') {
      navigate('/pending', { replace: true });
      return;
    }

    // approved → ไปหน้าที่ตั้งใจจะเข้า หรือ dashboard
    const destination =
      !from || from === '/login' || from === '/register' ? '/dashboard' : from;
    navigate(destination, { replace: true });
  }, [userProfile, authLoading, navigate, from]);

  /* ─── Google Sign-In ─── */
  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      // force refresh AuthContext เพราะ onAuthStateChanged อาจ fire ก่อน profile ถูกสร้าง
      await refreshProfile();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('popup-closed-by-user') || msg.includes('cancelled-popup-request')) {
        /* User closed popup — silent */
      } else if (msg.includes('unauthorized-domain')) {
        setError('Domain ยังไม่ได้รับอนุญาต — Firebase Console → Authentication → Authorized domains');
      } else {
        setError('เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองใหม่');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  /* ─── Email / Password Sign-In ─── */
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      // force refresh AuthContext หลัง login สำเร็จ
      await refreshProfile();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (
        msg.includes('user-not-found') ||
        msg.includes('wrong-password') ||
        msg.includes('invalid-credential') ||
        msg.includes('INVALID_LOGIN_CREDENTIALS')
      ) {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      } else {
        setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setLoading(false);
    }
  };

  const isWorking = loading || googleLoading;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        fontFamily: 'Sarabun, sans-serif',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
      }}
    >
      <div className="absolute top-[-80px] left-[-80px] w-72 h-72 bg-blue-700/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-60px] right-[-60px] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm px-5">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl shadow-2xl mb-5 ring-4 ring-blue-500/20">
            <i className="fas fa-layer-group text-white text-3xl"></i>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">CMG HUB</h1>
          <p className="text-blue-300 mt-2 text-sm font-medium tracking-wide">
            CMG Engineering & Construction
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-7">
          <p className="text-center text-sm text-slate-500 mb-6">เข้าสู่ระบบเพื่อใช้งาน</p>

          {/* Error */}
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
              <i className="fas fa-circle-exclamation shrink-0 mt-0.5"></i>
              <span>{error}</span>
            </div>
          )}

          {/* Pending notice */}
          {!authLoading && userProfile?.status === 'pending' && (
            <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 flex items-start gap-2">
              <i className="fas fa-clock shrink-0 mt-0.5"></i>
              <span>บัญชีของคุณยังรอการอนุมัติจากผู้ดูแลระบบ กรุณารอสักครู่</span>
            </div>
          )}

          {/* Google Sign-In */}
          <button
            onClick={handleGoogleLogin}
            disabled={isWorking}
            className="w-full py-3.5 bg-white border-2 border-slate-200 hover:border-blue-400 hover:shadow-md disabled:opacity-60 text-slate-700 font-semibold rounded-2xl transition-all flex items-center justify-center gap-3 group"
          >
            {googleLoading ? (
              <>
                <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-slate-500">กำลังเข้าสู่ระบบ...</span>
              </>
            ) : (
              <>
                <svg width="22" height="22" viewBox="0 0 18 18" className="shrink-0">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
                </svg>
                <span className="group-hover:text-blue-700 transition-colors">Sign in with Google</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <hr className="flex-1 border-slate-200" />
            <button
              onClick={() => { setShowEmailForm(!showEmailForm); setError(''); }}
              className="text-xs text-slate-400 hover:text-blue-600 transition-colors whitespace-nowrap"
            >
              หรือใช้ Email / Password
            </button>
            <hr className="flex-1 border-slate-200" />
          </div>

          {/* Email form */}
          {showEmailForm && (
            <form onSubmit={handleEmailLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">อีเมล</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="example@cmg.co.th"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">รหัสผ่าน</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={isWorking}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  <>
                    <i className="fas fa-right-to-bracket" />
                    เข้าสู่ระบบด้วย Email
                  </>
                )}
              </button>
            </form>
          )}

          <p className="mt-5 text-center text-xs text-slate-500">
            ยังไม่มีบัญชี?{' '}
            <Link to="/register" className="text-blue-600 font-semibold hover:underline">
              สมัครสมาชิก
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-500 mt-5">
          © 2026 CMG Engineering & Construction
        </p>
      </div>
    </div>
  );
}
