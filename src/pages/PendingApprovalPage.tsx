import React from 'react';
import { logout } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PendingApprovalPage() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900"
      style={{ fontFamily: 'Sarabun, sans-serif' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full mx-6 text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fas fa-clock-rotate-left text-3xl text-amber-500"></i>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">รอการอนุมัติ</h2>
        <p className="text-slate-500 text-sm mb-2">
          สวัสดี <strong>{userProfile?.firstName} {userProfile?.lastName}</strong>
        </p>
        <p className="text-slate-400 text-sm mb-8">
          บัญชีของคุณกำลังรอการอนุมัติจากผู้ดูแลระบบ กรุณารอสักครู่
          หรือติดต่อผู้ดูแลระบบเพื่อขออนุมัติสิทธิ์การใช้งาน
        </p>
        <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
            <i className="fas fa-envelope text-blue-500 w-5"></i>
            <span>{userProfile?.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
            <i className="fas fa-briefcase text-blue-500 w-5"></i>
            <span>{userProfile?.position || '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <i className="fas fa-user-tag text-blue-500 w-5"></i>
            <span>บทบาท: {userProfile?.role}</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <i className="fas fa-right-from-bracket"></i>
          ออกจากระบบ
        </button>
      </div>
    </div>
  );
}
