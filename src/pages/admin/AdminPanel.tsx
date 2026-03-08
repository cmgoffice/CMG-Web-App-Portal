import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeAllUsers } from '../../services/userService';
import { subscribeProjects, seedProjectsIfEmpty } from '../../services/projectService';
import type { UserProfile } from '../../types/auth';
import type { Project } from '../../types/project';
import UserTable from './UserTable';
import ActivityLogs from './ActivityLogs';
import { useAuth } from '../../contexts/AuthContext';

type Tab = 'users' | 'logs';

export default function AdminPanel() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    const unsubUsers = subscribeAllUsers((data) => {
      setUsers(data);
      setTotalUsers(data.length);
      setLoadingUsers(false);
    });
    const unsubProjects = subscribeProjects(setProjects);
    seedProjectsIfEmpty();
    return () => { unsubUsers(); unsubProjects(); };
  }, []);

  const approvedCount = users.filter((u) => u.status === 'approved').length;
  const pendingCount = users.filter((u) => u.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: 'Sarabun, sans-serif' }}>
      {/* Top bar */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-20">
        <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-lg text-sm font-medium transition-colors"
            >
              <i className="fas fa-arrow-left text-xs"></i>
              กลับหน้าหลัก
            </button>
            <span className="text-slate-300">|</span>
            <i className="fas fa-layer-group text-blue-600 text-lg"></i>
            <span className="text-base font-bold text-slate-800">CMG HUB</span>
            <span className="text-slate-300 hidden sm:block">|</span>
            <span className="text-sm text-slate-500 font-medium hidden sm:block">Admin Panel</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 hidden sm:block">
              {userProfile?.firstName} {userProfile?.lastName}
            </span>
            <span className="inline-block px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
              {userProfile?.role}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 py-5">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <StatCard icon="fa-users"        color="bg-blue-500"    label="ผู้ใช้ทั้งหมด"  value={totalUsers} />
          <StatCard icon="fa-circle-check" color="bg-emerald-500" label="อนุมัติแล้ว"    value={approvedCount} />
          <StatCard icon="fa-clock"        color="bg-amber-500"   label="รอการอนุมัติ"  value={pendingCount} />
        </div>

        {/* Tabs + Search */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 pt-3 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100">
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
              <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')}>
                <i className="fas fa-users-gear text-xs"></i>
                User Management
              </TabButton>
              <TabButton active={activeTab === 'logs'} onClick={() => setActiveTab('logs')}>
                <i className="fas fa-clock-rotate-left text-xs"></i>
                Log การใช้งาน
              </TabButton>
            </div>

            {activeTab === 'users' && (
              <div className="relative w-full sm:w-auto">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อ, อีเมล, ตำแหน่ง, บทบาท..."
                  className="pl-8 pr-4 py-1.5 bg-slate-100 rounded-lg text-xs w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
                <i className="fas fa-search absolute left-2.5 top-2 text-slate-400 text-xs"></i>
              </div>
            )}
          </div>

          <div className="p-3">
            {activeTab === 'users' ? (
              loadingUsers ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-7 h-7 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <UserTable users={users} projects={projects} searchQuery={searchQuery} />
              )
            ) : (
              <ActivityLogs />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, color, label, value }: { icon: string; color: string; label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
      <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center text-white shrink-0`}>
        <i className={`fas ${icon} text-sm`}></i>
      </div>
      <div>
        <p className="text-xl font-bold text-slate-800 leading-none">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
        active ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {children}
    </button>
  );
}
