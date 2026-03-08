import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PendingApprovalPage from './pages/PendingApprovalPage';
import AdminPanel from './pages/admin/AdminPanel';

import type { AppData } from './types/portal';
import { DEFAULT_PORTAL_DATA, MENU_ORDER, MENU_ICONS, MENU_LABELS } from './data/defaultPortalData';
import { subscribePortalData, seedPortalDataIfEmpty } from './services/portalFirestore';
import { logout } from './services/authService';

/* ─────────────────────────────────────── CMG HUB Dashboard ──── */
function Dashboard() {
  const { userProfile, firebaseUser, sessionMinutesLeft } = useAuth();
  const navigate = useNavigate();
  const [appData, setAppData] = useState<AppData>(DEFAULT_PORTAL_DATA);
  const [activeTab, setActiveTab] = useState('info');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    const init = async () => {
      try {
        unsub = subscribePortalData((data) => setAppData(data ?? DEFAULT_PORTAL_DATA));
        await seedPortalDataIfEmpty();
      } catch (err) {
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
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const currentData = appData[activeTab];
  const isAdmin = userProfile?.role === 'SuperAdmin' || userProfile?.role === 'Admin';

  return (
    <div className="flex min-h-screen relative overflow-x-hidden" style={{ fontFamily: 'Sarabun, sans-serif', backgroundColor: '#f8fafc' }}>
      {dbError && (
        <div className="fixed top-4 right-4 z-[90] px-4 py-2 bg-amber-100 border border-amber-400 text-amber-800 rounded-lg text-sm shadow">
          {dbError}
        </div>
      )}

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:inset-auto md:flex`}>
        <div className="p-6 text-2xl font-bold text-white flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <i className="fas fa-layer-group text-blue-500"></i>
            <span>CMG HUB</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        <nav className="flex-1 mt-2 overflow-y-auto pb-4">
          {MENU_ORDER.filter((key) => appData[key]).map((key) => (
            <button
              key={key}
              onClick={() => switchTab(key)}
              className={`w-full flex items-center px-6 py-3 gap-3 transition-colors hover:bg-slate-800 ${activeTab === key ? 'bg-blue-700 text-white border-r-4 border-yellow-400' : ''}`}
            >
              <i className={`fas ${MENU_ICONS[key]} w-5 shrink-0`}></i>
              <span className="text-sm">{MENU_LABELS[key]}</span>
            </button>
          ))}
        </nav>

        {/* Admin link */}
        {isAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className="mx-4 mb-3 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            <i className="fas fa-shield-halved"></i>
            Admin Panel
          </button>
        )}

        <div className="p-4 border-t border-slate-800 text-xs text-center text-slate-500">
          © 2026 CMG Engineering & Construction
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        <header className="bg-white border-b h-16 flex items-center justify-between px-6 shadow-sm sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-600 hover:text-blue-600 p-2 rounded-lg hover:bg-slate-100">
              <i className="fas fa-bars text-xl"></i>
            </button>
            <h2 className="text-xl font-semibold text-slate-800 truncate">{currentData?.title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <input
                type="text"
                placeholder="ค้นหาเว็บแอป..."
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 w-64"
              />
              <i className="fas fa-search absolute left-3 top-2.5 text-slate-400"></i>
            </div>

            {/* User info + session timer */}
            <div className="flex items-center gap-2">
              {/* Session countdown badge */}
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
                className="bg-white p-6 rounded-2xl border border-slate-200 transition-all flex flex-col items-center text-center group hover:-translate-y-1 hover:shadow-xl"
                style={{ transition: 'all 0.3s ease' }}
              >
                <div className={`w-16 h-16 ${app.color} text-white rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <i className={`fas ${app.icon}`}></i>
                </div>
                <h3 className="font-bold text-slate-800 mb-2">{app.name}</h3>
                <p className="text-xs text-slate-500 mb-4 h-8 overflow-hidden">{app.desc}</p>
                <div className="mt-auto text-blue-600 text-sm font-semibold flex items-center gap-2 group-hover:underline">
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

  if (loading) {
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

  if (!userProfile) return <Navigate to="/login" replace />;
  if (userProfile.status === 'pending') return <Navigate to="/pending" replace />;
  return <Navigate to="/dashboard" replace />;
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

