import React, { useEffect, useState } from 'react';
import { subscribeActivityLogs } from '../../services/activityLogService';
import type { ActivityLog } from '../../types/activityLog';

const ACTION_STYLES: Record<string, string> = {
  REGISTER: 'bg-blue-100 text-blue-700',
  LOGIN: 'bg-green-100 text-green-700',
  LOGOUT: 'bg-slate-100 text-slate-600',
  UPDATE_USER: 'bg-amber-100 text-amber-700',
  DELETE_USER: 'bg-red-100 text-red-700',
  VIEW_MENU: 'bg-violet-100 text-violet-700',
  CLICK_CARD: 'bg-sky-100 text-sky-700',
};

function formatTimestamp(ts: ActivityLog['timestamp']): string {
  if (!ts) return '—';
  const date = typeof ts === 'object' && 'toDate' in ts ? ts.toDate() : ts as Date;
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeActivityLogs((data) => {
      setLogs(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {['เวลา', 'ผู้ใช้', 'อีเมล', 'การกระทำ', 'รายละเอียด'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {logs.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                ยังไม่มีประวัติการใช้งาน
              </td>
            </tr>
          )}
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                {formatTimestamp(log.timestamp)}
              </td>
              <td className="px-4 py-3 font-medium text-slate-800">{log.userName}</td>
              <td className="px-4 py-3 text-slate-600">{log.userEmail}</td>
              <td className="px-4 py-3">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${ACTION_STYLES[log.action] ?? 'bg-slate-100 text-slate-600'}`}>
                  {log.action}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate" title={log.details}>
                {log.details ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
