import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PendingApprovalPage from './pages/PendingApprovalPage';
import AdminPanel from './pages/admin/AdminPanel';

import type { AppData } from './types/portal';
import { DEFAULT_PORTAL_DATA, MENU_ORDER, MENU_ICONS, MENU_ICON_COLORS, MENU_LABELS } from './data/defaultPortalData';
import { subscribePortalData, seedPortalDataIfEmpty } from './services/portalFirestore';
import { logout } from './services/authService';
import { logActivity } from './services/activityLogService';
import { migrateAllData, checkOldDataExists } from './services/dataMigration';
import { subscribeAllUsers } from './services/userService';

/* ─────────────────────────────────────── CMG HUB Dashboard ──── */
function Dashboard() {
  const { userProfile, firebaseUser } = useAuth();
  const profilePhotoUrl = userProfile?.photoURL ?? firebaseUser?.photoURL ?? null;
  const [profilePhotoError, setProfilePhotoError] = useState(false);
  const navigate = useNavigate();
  const [appData, setAppData] = useState<AppData>(DEFAULT_PORTAL_DATA);
  const [activeTab, setActiveTab] = useState('info');
  const [dbError, setDbError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    setProfilePhotoError(false);
  }, [profilePhotoUrl]);

  // Desktop: collapsed by default, จำสถานะใน localStorage
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('cmg_sidebar_collapsed');
    return saved === null ? true : saved === 'true';
  });

  // Mobile view: sidebar เป็นแถบ icon-only ตลอด
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      localStorage.setItem('cmg_sidebar_collapsed', String(!prev));
      return !prev;
    });
  };

  useEffect(() => {
    let unsub: (() => void) | undefined;
    const init = async () => {
      try {
        const hasOldData = await checkOldDataExists();
        if (hasOldData) {
          console.log('🔄 Found old data structure, migrating...');
          await migrateAllData();
        }
      } catch {
        // old collections ไม่มีสิทธิ์อ่าน — ข้ามไป
      }

      try {
        unsub = subscribePortalData((data) => setAppData(data ?? DEFAULT_PORTAL_DATA));
        seedPortalDataIfEmpty().catch(() => {});
      } catch (err) {
        console.error('[Dashboard] Firestore init failed:', err);
        setDbError('ใช้ข้อมูล Offline');
        setAppData(DEFAULT_PORTAL_DATA);
      }
    };
    init();
    return () => { if (unsub) unsub(); };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const switchTab = (key: string) => {
    setActiveTab(key);
    if (userProfile) {
      const menuTitle = appData[key]?.title ?? (MENU_LABELS as Record<string, string>)[key] ?? key;
      logActivity({
        userId: userProfile.uid,
        userEmail: userProfile.email,
        userName: `${userProfile.firstName ?? ''} ${userProfile.lastName ?? ''}`.trim() || userProfile.email,
        action: 'VIEW_MENU',
        details: `เข้าเมนู: ${menuTitle}`,
      }).catch(() => {});
    }
  };

  // Subscribe pending users count (เฉพาะ admin เท่านั้น)
  const isAdmin = userProfile?.role === 'SuperAdmin' || userProfile?.role === 'Admin';

  useEffect(() => {
    if (!isAdmin) return;
    const unsub = subscribeAllUsers((users) => {
      setPendingCount(users.filter((u) => u.status === 'pending').length);
    });
    return unsub;
  }, [isAdmin]);

  const currentData = appData[activeTab];

  /* ── Sidebar content (shared between desktop & mobile) ── */
  const SidebarContent = ({ forceExpand = false }: { forceExpand?: boolean }) => {
    // มือถือ: โชว์แค่ icon; เดสก์ท็อป: ตาม collapsed
    const expanded = !isMobile && (forceExpand || !collapsed);
    const showBadge = isAdmin && pendingCount > 0;
    return (
      <>
        {/* Logo */}
        <div className={`flex items-center h-16 border-b border-slate-800 shrink-0 ${expanded ? 'px-4 gap-3' : 'justify-center'}`}>
          <img
            src="/logo.png"
            alt="CMG HUB"
            className="w-10 h-10 shrink-0 object-contain"
            onError={(e) => {
              // fallback ถ้าไม่มีรูป
              (e.currentTarget as HTMLImageElement).style.display = 'none';
              const icon = document.createElement('i');
              icon.className = 'fas fa-layer-group text-blue-400 text-xl';
              e.currentTarget.parentElement?.insertBefore(icon, e.currentTarget);
            }}
          />
          {expanded && (
            <span className="text-white font-bold text-lg tracking-wide truncate">CMG HUB</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3">
          {MENU_ORDER.filter((key) => appData[key]).map((key) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => switchTab(key)}
                title={!expanded ? MENU_LABELS[key] : undefined}
                className={`w-full flex items-center py-2.5 transition-colors group relative
                  ${expanded ? 'px-4 gap-3' : 'justify-center px-0'}
                  ${active
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                  }`}
              >
                {active && <span className="absolute left-0 top-0 h-full w-1 bg-yellow-400 rounded-r" />}
                <i
                  className={`fas ${MENU_ICONS[key]} w-5 text-center shrink-0 text-base ${MENU_ICON_COLORS[key]} ${
                    active ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.15)]' : 'group-hover:text-slate-100'
                  }`}
                ></i>
                {expanded && <span className="text-sm truncate">{MENU_LABELS[key]}</span>}
              </button>
            );
          })}
        </nav>

        {/* Admin button */}
        {isAdmin && (
          <div className={`px-3 mb-3 ${!expanded ? 'flex justify-center' : ''}`}>
            <button
              onClick={() => navigate('/admin')}
              title={!expanded ? `Admin Panel${showBadge ? ` (${pendingCount} รอดำเนินการ)` : ''}` : undefined}
              className={`relative bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors
                ${expanded ? 'w-full px-4 py-2.5' : 'w-10 h-10 justify-center'}`}
            >
              <i className="fas fa-shield-halved shrink-0"></i>
              {expanded && <span className="flex-1 text-left">Admin Panel</span>}

              {/* Badge */}
              {showBadge && (
                expanded ? (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full leading-none animate-pulse">
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
                ) : (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full leading-none">
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
                )
              )}
            </button>
          </div>
        )}

        {/* Footer */}
        {expanded && (
          <div className="px-4 py-3 border-t border-slate-800 text-xs text-center text-slate-600">
            © 2026 CMG Engineering & Construction
          </div>
        )}
      </>
    );
  };

  return (
    <div className="flex min-h-screen relative overflow-x-hidden" style={{ fontFamily: 'Sarabun, sans-serif', backgroundColor: '#f8fafc' }}>
      {dbError && (
        <div className="fixed top-4 right-4 z-[90] px-4 py-2 bg-amber-100 border border-amber-400 text-amber-800 rounded-lg text-sm shadow">
          {dbError}
        </div>
      )}

      {/* Sidebar: มือถือ = แถบซ้ายโชว์แต่ icon, เดสก์ท็อป = ย่อ/ขยายได้ */}
      <aside className={`flex flex-col bg-slate-900 text-slate-300 shrink-0
        fixed md:relative inset-y-0 left-0 z-30
        w-14 md:transition-all md:duration-300 md:ease-in-out
        ${isMobile ? 'w-14' : collapsed ? 'md:w-16' : 'md:w-64'}`}>
        <SidebarContent />
      </aside>

      {/* Main — มือถือมี padding ซ้ายให้พ้นแถบ sidebar */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 pl-14 md:pl-0">
        <header className="bg-white border-b h-16 flex items-center justify-between px-4 shadow-sm sticky top-0 z-20">
          <div className="flex items-center gap-2">
            {/* Desktop toggle sidebar */}
            <button
              onClick={toggleCollapsed}
              title={collapsed ? 'ขยาย Sidebar' : 'ย่อ Sidebar'}
              className="hidden md:flex items-center justify-center w-8 h-8 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <i className={`fas ${collapsed ? 'fa-chevron-right' : 'fa-chevron-left'} text-sm`}></i>
            </button>
            <h2 className="text-lg font-semibold text-slate-800 truncate ml-1">{currentData?.title}</h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <input
                type="text"
                placeholder="ค้นหาเว็บแอป..."
                className="pl-9 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 w-52"
              />
              <i className="fas fa-search absolute left-3 top-2.5 text-slate-400 text-sm"></i>
            </div>

            {/* User info */}
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-700 leading-none">{userProfile?.firstName} {userProfile?.lastName}</p>
              <p className="text-xs text-slate-400 mt-0.5">{userProfile?.role}</p>
            </div>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden bg-blue-600">
              {profilePhotoUrl && !profilePhotoError ? (
                <img
                  src={profilePhotoUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={() => setProfilePhotoError(true)}
                />
              ) : (
                <span className="w-full h-full flex items-center justify-center bg-blue-600">
                  {userProfile?.firstName?.[0]?.toUpperCase() ?? 'U'}
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              title="ออกจากระบบ"
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <i className="fas fa-right-from-bracket text-sm"></i>
            </button>
          </div>
        </header>

        <div className="p-3 md:p-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 md:gap-3 pb-8">
            {currentData?.apps.map((app, index) => (
              <a
                key={index}
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  if (userProfile) {
                    const menuTitle = currentData?.title ?? (MENU_LABELS as Record<string, string>)[activeTab] ?? activeTab;
                    logActivity({
                      userId: userProfile.uid,
                      userEmail: userProfile.email,
                      userName: `${userProfile.firstName ?? ''} ${userProfile.lastName ?? ''}`.trim() || userProfile.email,
                      action: 'CLICK_CARD',
                      details: `กด Card: ${app.name} | URL: ${app.url} | เมนู: ${menuTitle}`,
                    }).catch(() => {});
                  }
                }}
                className="relative bg-white p-2.5 md:p-4 rounded-lg md:rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center group
                  hover:-translate-y-1 hover:shadow-lg hover:border-blue-200
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                style={{ transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease' }}
              >
                {/* Active badge — มุมบนซ้าย */}
                {app.active && (
                  <span className="absolute left-1 top-1 md:left-2 md:top-2 flex items-center justify-center w-4 h-4 md:w-5 md:h-5 bg-emerald-500 rounded-full shadow-sm"
                    title="พร้อมใช้งาน">
                    <i className="fas fa-check text-white text-[8px] md:text-[9px]"></i>
                  </span>
                )}

                <div className="absolute right-1.5 top-1.5 md:right-2.5 md:top-2.5 text-slate-200 group-hover:text-slate-400 transition-colors" aria-hidden="true">
                  <i className="fas fa-arrow-up-right-from-square text-[10px] md:text-xs"></i>
                </div>

                {/* Emoji icon — mini บนมือถือ */}
                <div className="w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center text-xl md:text-3xl mb-1.5 md:mb-3
                  bg-slate-50 group-hover:scale-110 transition-transform select-none">
                  {app.emoji
                    ? <span role="img" aria-label={app.name}>{app.emoji}</span>
                    : <span className={`w-8 h-8 md:w-10 md:h-10 ${app.color} text-white rounded-md md:rounded-lg flex items-center justify-center text-sm md:text-lg`}>
                        <i className={`fas ${app.icon}`}></i>
                      </span>
                  }
                </div>

                <h3 className="font-semibold text-slate-800 text-[11px] md:text-xs leading-tight mb-0.5 md:mb-1.5 line-clamp-2">{app.name}</h3>
                <p className="text-[10px] md:text-xs text-slate-400 leading-snug line-clamp-1 md:line-clamp-2 mb-1.5 md:mb-3">{app.desc}</p>
                <div className="mt-auto text-blue-500 text-[10px] md:text-xs font-semibold flex items-center gap-0.5 md:gap-1 group-hover:text-blue-700 transition-colors">
                  เข้าใช้งาน <i className="fas fa-arrow-right text-[10px] md:text-xs transition-transform group-hover:translate-x-0.5"></i>
                </div>
              </a>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ─────────────────────────────────────── Root redirect ─────── */
function RootRedirect() {
  const { userProfile, loading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (loading) return;
    
    if (!userProfile) {
      navigate('/login', { replace: true });
      return;
    }
    
    if (userProfile.status === 'rejected') {
      navigate('/login', { replace: true, state: { rejected: true } });
      return;
    }
    
    if (userProfile.status === 'pending') {
      navigate('/pending', { replace: true });
      return;
    }
    
    if (userProfile.status === 'approved') {
      navigate('/dashboard', { replace: true });
      return;
    }
  }, [userProfile, loading, navigate]);

  // Loading screen
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
        fontFamily: 'Sarabun, sans-serif',
      }}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl mb-2 overflow-hidden">
          <img src="/logo.png" alt="CMG HUB" className="w-14 h-14 object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
              const icon = document.createElement('i');
              icon.className = 'fas fa-layer-group text-white text-2xl';
              e.currentTarget.parentElement?.appendChild(icon);
            }}
          />
        </div>
        <div className="w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
        <p className="text-blue-200 text-sm">กำลังตรวจสอบสิทธิ์...</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────── App ───────────────── */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Semi-protected: must be logged in but not necessarily approved */}
          <Route
            path="/pending"
            element={
              <ProtectedRoute requireApproved={false}>
                <PendingApprovalPage />
              </ProtectedRoute>
            }
          />

          {/* Admin only */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireRoles={['SuperAdmin', 'Admin']}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          {/* Main dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Root redirect */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}


