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
import { migrateAllData, checkOldDataExists } from './services/dataMigration';

/* ─────────────────────────────────────── CMG HUB Dashboard ──── */
function Dashboard() {
  const { userProfile, sessionMinutesLeft } = useAuth();
  const navigate = useNavigate();
  const [appData, setAppData] = useState<AppData>(DEFAULT_PORTAL_DATA);
  const [activeTab, setActiveTab] = useState('info');
  const [dbError, setDbError] = useState<string | null>(null);

  // Desktop: collapsed by default, จำสถานะใน localStorage
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('cmg_sidebar_collapsed');
    return saved === null ? true : saved === 'true';
  });

  // Mobile: overlay sidebar
  const [mobileOpen, setMobileOpen] = useState(false);

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
    setMobileOpen(false);
  };

  const currentData = appData[activeTab];
  const isAdmin = userProfile?.role === 'SuperAdmin' || userProfile?.role === 'Admin';

  /* ── Sidebar content (shared between desktop & mobile) ── */
  const SidebarContent = ({ forceExpand = false }: { forceExpand?: boolean }) => {
    const expanded = forceExpand || !collapsed;
    return (
      <>
        {/* Logo */}
        <div className={`flex items-center h-16 border-b border-slate-800 shrink-0 ${expanded ? 'px-5 gap-3' : 'justify-center'}`}>
          <i className="fas fa-layer-group text-blue-400 text-xl shrink-0"></i>
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
              title={!expanded ? 'Admin Panel' : undefined}
              className={`bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors
                ${expanded ? 'w-full px-4 py-2.5' : 'w-10 h-10 justify-center'}`}
            >
              <i className="fas fa-shield-halved shrink-0"></i>
              {expanded && 'Admin Panel'}
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

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar (overlay, always expanded) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 flex flex-col transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:hidden`}>
        <div className="absolute top-3 right-3">
          <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800">
            <i className="fas fa-times"></i>
          </button>
        </div>
        <SidebarContent forceExpand />
      </aside>

      {/* Desktop sidebar (collapsible) */}
      <aside className={`hidden md:flex flex-col bg-slate-900 text-slate-300 transition-all duration-300 ease-in-out shrink-0
        ${collapsed ? 'w-16' : 'w-64'}`}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        <header className="bg-white border-b h-16 flex items-center justify-between px-4 shadow-sm sticky top-0 z-20">
          <div className="flex items-center gap-2">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-slate-600 hover:text-blue-600 p-2 rounded-lg hover:bg-slate-100"
            >
              <i className="fas fa-bars text-lg"></i>
            </button>
            {/* Desktop toggle */}
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

            {/* Session timer */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                sessionMinutesLeft <= 5
                  ? 'bg-red-50 border-red-200 text-red-600'
                  : sessionMinutesLeft <= 15
                  ? 'bg-amber-50 border-amber-200 text-amber-600'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
              title="เวลา session ที่เหลือ"
            >
              <i className={`fas fa-clock text-xs ${sessionMinutesLeft <= 5 ? 'animate-pulse' : ''}`}></i>
              <span>{sessionMinutesLeft} นาที</span>
            </div>

            {/* User info */}
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-700 leading-none">{userProfile?.firstName} {userProfile?.lastName}</p>
              <p className="text-xs text-slate-400 mt-0.5">{userProfile?.role}</p>
            </div>
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
              {userProfile?.firstName?.[0]?.toUpperCase() ?? 'U'}
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

        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
            {currentData?.apps.map((app, index) => (
              <a
                key={index}
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center group
                  hover:-translate-y-1 hover:shadow-xl hover:border-slate-300
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                style={{ transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease' }}
              >
                <div className="absolute right-4 top-4 text-slate-300 group-hover:text-slate-400 transition-colors" aria-hidden="true">
                  <i className="fas fa-arrow-up-right-from-square text-sm"></i>
                </div>
                <div className={`w-16 h-16 ${app.color} text-white rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-lg
                  ring-1 ring-black/5 group-hover:scale-110 transition-transform`}>
                  <i className={`fas ${app.icon}`}></i>
                </div>
                <h3 className="font-bold text-slate-800 mb-2">{app.name}</h3>
                <p className="text-xs text-slate-500 mb-4 h-10 overflow-hidden leading-relaxed">{app.desc}</p>
                <div className="mt-auto text-blue-600 text-sm font-semibold flex items-center gap-2 group-hover:underline underline-offset-4">
                  เข้าใช้งาน <i className="fas fa-arrow-right text-xs transition-transform group-hover:translate-x-1"></i>
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
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl mb-2">
          <i className="fas fa-layer-group text-white text-2xl"></i>
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


