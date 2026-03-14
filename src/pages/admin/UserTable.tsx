import React, { useState, useMemo } from 'react';
import type { UserProfile, UserRole, UserStatus } from '../../types/auth';
import type { Project } from '../../types/project';
import { USER_ROLES } from '../../types/auth';
import { updateUserProfile, deleteUser } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  users: UserProfile[];
  projects: Project[];
  searchQuery: string;
}

const STATUS_STYLES: Record<UserStatus, string> = {
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pending:  'bg-amber-100 text-amber-700 border-amber-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
};

const STATUS_LABELS: Record<UserStatus, string> = {
  approved: 'อนุมัติ',
  pending:  'รอดำเนินการ',
  rejected: 'ปฏิเสธ',
};

interface EditState {
  uid: string;
  firstName: string;
  lastName: string;
  position: string;
  role: UserRole;
  status: UserStatus;
  assignedProjects: string[];
}

const INPUT = 'px-1.5 py-0.5 border border-blue-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500';

export default function UserTable({ users, projects, searchQuery }: Props) {
  const { userProfile: actor } = useAuth();
  const [editState, setEditState] = useState<EditState | null>(null);
  const [savingUid, setSavingUid] = useState<string | null>(null);
  const [deletingUid, setDeletingUid] = useState<string | null>(null);
  const [confirmDeleteUid, setConfirmDeleteUid] = useState<string | null>(null);
  const [projectDropdownUid, setProjectDropdownUid] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.position.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const startEdit = (u: UserProfile) =>
    setEditState({ uid: u.uid, firstName: u.firstName, lastName: u.lastName, position: u.position, role: u.role, status: u.status, assignedProjects: [...u.assignedProjects] });

  const cancelEdit = () => { setEditState(null); setProjectDropdownUid(null); };

  const saveEdit = async () => {
    if (!editState || !actor) return;
    setSavingUid(editState.uid);
    try {
      await updateUserProfile(
        editState.uid,
        { firstName: editState.firstName, lastName: editState.lastName, position: editState.position, role: editState.role, status: editState.status, assignedProjects: editState.assignedProjects },
        actor.email,
        `${actor.firstName} ${actor.lastName}`
      );
      setEditState(null);
    } finally { setSavingUid(null); }
  };

  const handleDelete = async (uid: string) => {
    if (!actor) return;
    setDeletingUid(uid);
    try { await deleteUser(uid, actor.email, `${actor.firstName} ${actor.lastName}`); }
    finally { setDeletingUid(null); setConfirmDeleteUid(null); }
  };

  const toggleProject = (pid: string) =>
    setEditState((prev) => !prev ? prev : {
      ...prev,
      assignedProjects: prev.assignedProjects.includes(pid)
        ? prev.assignedProjects.filter((p) => p !== pid)
        : [...prev.assignedProjects, pid],
    });

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-xs">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {['ชื่อ-นามสกุล', 'อีเมล', 'ตำแหน่ง', 'สถานะ', 'บทบาท', 'โปรเจกต์', 'การจัดการ'].map((h) => (
              <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filtered.length === 0 && (
            <tr>
              <td colSpan={7} className="px-3 py-8 text-center text-slate-400 text-xs">
                ไม่พบข้อมูลผู้ใช้
              </td>
            </tr>
          )}
          {filtered.map((u) => {
            const editing = editState?.uid === u.uid;
            const es = editState;

            return (
              <tr key={u.uid} className={`${editing ? 'bg-blue-50/40' : 'hover:bg-slate-50'} transition-colors`}>

                {/* Name */}
                <td className="px-3 py-2 min-w-[160px]">
                  {editing ? (
                    <div className="flex gap-1.5">
                      <input value={es!.firstName} onChange={(e) => setEditState((p) => p ? { ...p, firstName: e.target.value } : p)} className={`w-16 ${INPUT}`} placeholder="ชื่อ" />
                      <input value={es!.lastName}  onChange={(e) => setEditState((p) => p ? { ...p, lastName: e.target.value } : p)}  className={`w-20 ${INPUT}`} placeholder="นามสกุล" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full overflow-hidden bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0 relative">
                        {u.photoURL ? (
                          <>
                            <img
                              src={u.photoURL}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling;
                                if (fallback) (fallback as HTMLElement).classList.remove('hidden');
                              }}
                            />
                            <span className="hidden absolute inset-0 bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                              {u.firstName?.[0]?.toUpperCase() ?? 'U'}
                            </span>
                          </>
                        ) : (
                          <span className="w-full h-full flex items-center justify-center">
                            {u.firstName?.[0]?.toUpperCase() ?? 'U'}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 text-xs">{u.firstName} {u.lastName}</p>
                        {u.isFirstUser && (
                          <span className="text-amber-600 text-[10px]"><i className="fas fa-crown mr-0.5"></i>First User</span>
                        )}
                      </div>
                    </div>
                  )}
                </td>

                {/* Email */}
                <td className="px-3 py-2 text-slate-500 min-w-[160px] text-xs">{u.email}</td>

                {/* Position */}
                <td className="px-3 py-2 min-w-[110px]">
                  {editing
                    ? <input value={es!.position} onChange={(e) => setEditState((p) => p ? { ...p, position: e.target.value } : p)} className={`w-full ${INPUT}`} placeholder="ตำแหน่ง" />
                    : <span className="text-slate-600">{u.position || '—'}</span>
                  }
                </td>

                {/* Status */}
                <td className="px-3 py-2 min-w-[110px]">
                  {editing ? (
                    <select value={es!.status} onChange={(e) => setEditState((p) => p ? { ...p, status: e.target.value as UserStatus } : p)} className={INPUT}>
                      <option value="approved">อนุมัติ</option>
                      <option value="pending">รอดำเนินการ</option>
                      <option value="rejected">ปฏิเสธ</option>
                    </select>
                  ) : (
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_STYLES[u.status]}`}>
                      {STATUS_LABELS[u.status]}
                    </span>
                  )}
                </td>

                {/* Role */}
                <td className="px-3 py-2 min-w-[110px]">
                  {editing ? (
                    <select value={es!.role} onChange={(e) => setEditState((p) => p ? { ...p, role: e.target.value as UserRole } : p)} className={INPUT}>
                      {USER_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  ) : (
                    <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold">{u.role}</span>
                  )}
                </td>

                {/* Projects */}
                <td className="px-3 py-2 min-w-[160px]">
                  {editing ? (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setProjectDropdownUid(projectDropdownUid === u.uid ? null : u.uid)}
                        className={`${INPUT} w-full text-left flex items-center justify-between gap-1`}
                      >
                        <span className="truncate">{es!.assignedProjects.length === 0 ? 'เลือกโปรเจกต์...' : `${es!.assignedProjects.length} โปรเจกต์`}</span>
                        <i className="fas fa-chevron-down text-slate-400 text-[10px]"></i>
                      </button>
                      {projectDropdownUid === u.uid && (
                        <div className="absolute z-50 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg max-h-44 overflow-y-auto">
                          {projects.length === 0 && <p className="px-3 py-2 text-slate-400 text-xs">ยังไม่มีโปรเจกต์</p>}
                          {projects.map((p) => (
                            <label key={p.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer text-xs">
                              <input type="checkbox" checked={es!.assignedProjects.includes(p.id)} onChange={() => toggleProject(p.id)} className="accent-blue-600" />
                              <span className="text-slate-700">{p.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {u.assignedProjects.length === 0
                        ? <span className="text-slate-400">ไม่มี</span>
                        : u.assignedProjects.slice(0, 2).map((pid) => {
                            const name = projects.find((p) => p.id === pid)?.name ?? pid;
                            return <span key={pid} className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] truncate max-w-[90px]" title={name}>{name}</span>;
                          })
                      }
                      {u.assignedProjects.length > 2 && (
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px]">+{u.assignedProjects.length - 2}</span>
                      )}
                    </div>
                  )}
                </td>

                {/* Actions */}
                <td className="px-3 py-2 whitespace-nowrap">
                  {editing ? (
                    <div className="flex items-center gap-1.5">
                      <button onClick={saveEdit} disabled={savingUid === u.uid}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded text-xs font-medium flex items-center gap-1 transition-colors">
                        {savingUid === u.uid ? <span className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <i className="fas fa-check"></i>}
                        บันทึก
                      </button>
                      <button onClick={cancelEdit} className="px-2.5 py-1 border border-slate-300 hover:bg-slate-100 text-slate-600 rounded text-xs font-medium transition-colors">
                        ยกเลิก
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => startEdit(u)} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium flex items-center gap-1 transition-colors">
                        <i className="fas fa-pen-to-square text-[10px]"></i> แก้ไข
                      </button>
                      {confirmDeleteUid === u.uid ? (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-500">แน่ใจ?</span>
                          <button onClick={() => handleDelete(u.uid)} disabled={deletingUid === u.uid}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded text-xs font-medium transition-colors">
                            {deletingUid === u.uid ? '...' : 'ยืนยัน'}
                          </button>
                          <button onClick={() => setConfirmDeleteUid(null)} className="px-2 py-1 border border-slate-200 text-slate-500 rounded text-xs hover:bg-slate-50">
                            ไม่
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDeleteUid(u.uid)} disabled={u.isFirstUser}
                          title={u.isFirstUser ? 'ไม่สามารถลบ Super Admin คนแรกได้' : undefined}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-40">
                          <i className="fas fa-trash-can text-[10px]"></i> ลบ
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
