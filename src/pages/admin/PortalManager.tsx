import React, { useState, useEffect, useRef } from 'react';
import type { App, AppData } from '../../types/portal';
import { MENU_ORDER, MENU_LABELS, MENU_ICONS, MENU_ICON_COLORS } from '../../data/defaultPortalData';
import {
  subscribePortalData,
  addAppCard,
  updateAppCard,
  deleteAppCard,
} from '../../services/portalFirestore';

// ── สีที่เลือกได้ ────────────────────────────────────────────────────────────
const COLOR_OPTIONS = [
  { label: 'Blue',     value: 'bg-blue-600' },
  { label: 'Sky',      value: 'bg-sky-500' },
  { label: 'Cyan',     value: 'bg-cyan-600' },
  { label: 'Teal',     value: 'bg-teal-600' },
  { label: 'Emerald',  value: 'bg-emerald-600' },
  { label: 'Green',    value: 'bg-green-600' },
  { label: 'Lime',     value: 'bg-lime-600' },
  { label: 'Amber',    value: 'bg-amber-500' },
  { label: 'Orange',   value: 'bg-orange-500' },
  { label: 'Red',      value: 'bg-red-500' },
  { label: 'Rose',     value: 'bg-rose-500' },
  { label: 'Pink',     value: 'bg-pink-500' },
  { label: 'Fuchsia',  value: 'bg-fuchsia-600' },
  { label: 'Purple',   value: 'bg-purple-600' },
  { label: 'Violet',   value: 'bg-violet-600' },
  { label: 'Indigo',   value: 'bg-indigo-600' },
  { label: 'Slate',    value: 'bg-slate-600' },
  { label: 'Zinc',     value: 'bg-zinc-600' },
];

// ── EMOJI CATEGORIES (งานก่อสร้าง, รายงานเอกสาร, และที่เกี่ยวข้อง) ─────────────
const EMOJI_CATEGORIES: { title: string; emojis: string[] }[] = [
  {
    title: 'งานก่อสร้าง / Construction',
    emojis: ['🏗️','🔨','⛏️','🧱','📐','🚧','👷','🪖','🦺','⛑️','🔧','🛠️','🔩','⚙️','📦','🚛','🏕️','🪵','🪚','🪓','🚜','🚚','🛒','🧰','🏠','🌉','🪨','⛏️','🔨','🧱','📦'],
  },
  {
    title: 'รายงาน / เอกสาร / Report & Document',
    emojis: ['📋','📄','📑','📊','📈','📉','📝','📌','📎','🗂️','📁','📂','📅','📆','🗓️','📇','📃','🗃️','📒','📔','📕','📗','📘','📙','📜','🔖','📰','🗞️','📑','📊','📈','📉'],
  },
  {
    title: 'QC / ตรวจสอบ / Safety',
    emojis: ['🔬','✅','⚠️','🔍','🧪','📏','🎯','🏅','✔️','❌','🔎','🛡️','🔐','🚨','🔒','🦺','⛑️','🚧','🔎'],
  },
  {
    title: 'สำนักงาน / Office & อื่นๆ',
    emojis: ['🏢','📰','🌐','💼','🖥️','👥','🖨️','📡','💻','📱','🕐','💰','💳','🏆','🤖','⚖️','🎓','🎉','✨','🗂️','📌','📎','🎧','⬇️'],
  },
];

// ── Form state ────────────────────────────────────────────────────────────────
interface FormState {
  name: string;
  url: string;
  emoji: string;
  desc: string;
  color: string;
  icon: string;
  active: boolean;
}

const EMPTY_FORM: FormState = {
  name: '', url: '', emoji: '', desc: '', color: 'bg-blue-600', icon: 'fa-globe', active: false,
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function PortalManager() {
  const [portalData, setPortalData]     = useState<AppData | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<string>(MENU_ORDER[0]);
  const [modalOpen, setModalOpen]       = useState(false);
  const [editIndex, setEditIndex]       = useState<number | null>(null);
  const [form, setForm]                 = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving]             = useState(false);
  const [deleting, setDeleting]         = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [toast, setToast]               = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribePortalData((data) => setPortalData(data));
    return unsub;
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const currentApps = portalData?.[selectedMenu]?.apps ?? [];

  // ── open modal for Add ──────────────────────────────────────────────────────
  // ปิด Emoji picker เมื่อคลิกนอกกล่อง
  useEffect(() => {
    if (!emojiPickerOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setEmojiPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [emojiPickerOpen]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditIndex(null);
    setEmojiPickerOpen(false);
    setModalOpen(true);
  };

  // ── open modal for Edit ─────────────────────────────────────────────────────
  const openEdit = (index: number) => {
    const app = currentApps[index];
    setForm({
      name:   app.name,
      url:    app.url,
      emoji:  app.emoji ?? '',
      desc:   app.desc,
      color:  app.color,
      icon:   app.icon,
      active: app.active ?? false,
    });
    setEditIndex(index);
    setEmojiPickerOpen(false);
    setModalOpen(true);
  };

  // ── save (add or update) ────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim()) { showToast('กรุณากรอกชื่อ Card', 'error'); return; }
    if (!form.url.trim())  { showToast('กรุณากรอก URL', 'error'); return; }

    setSaving(true);
    try {
      // สร้าง object โดยไม่มี undefined — Firestore ไม่รับ undefined
      const emojiVal = form.emoji.trim();
      const appData: App = {
        name:   form.name.trim(),
        url:    form.url.trim(),
        desc:   form.desc.trim(),
        color:  form.color,
        icon:   form.icon || 'fa-globe',
        active: form.active,
        ...(emojiVal ? { emoji: emojiVal } : {}),
      };
      if (editIndex !== null) {
        await updateAppCard(selectedMenu, editIndex, appData);
        showToast('แก้ไข Card สำเร็จ');
      } else {
        await addAppCard(selectedMenu, appData);
        showToast('เพิ่ม Card สำเร็จ');
      }
      setModalOpen(false);
    } catch (err) {
      console.error('[PortalManager] save error:', err);
      showToast('เกิดข้อผิดพลาด กรุณาลองใหม่', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (index: number) => {
    setDeleting(index);
    try {
      await deleteAppCard(selectedMenu, index);
      showToast('ลบ Card สำเร็จ');
    } catch (err) {
      console.error(err);
      showToast('ลบไม่สำเร็จ กรุณาลองใหม่', 'error');
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  return (
    <div className="relative" style={{ fontFamily: 'Sarabun, sans-serif' }}>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[200] px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 transition-all
          ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          <i className={`fas ${toast.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">จัดการ Cards</h3>
          <p className="text-xs text-slate-500 mt-0.5">เพิ่ม แก้ไข หรือลบ Card ในแต่ละหมวดเมนู</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
        >
          <i className="fas fa-plus text-xs"></i>
          เพิ่ม Card ใหม่
        </button>
      </div>

      {/* Menu Tabs */}
      <div className="flex gap-1 flex-wrap mb-4 bg-slate-100 p-1 rounded-xl">
        {MENU_ORDER.map((key) => (
          <button
            key={key}
            onClick={() => setSelectedMenu(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap
              ${selectedMenu === key
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'}`}
          >
            <i className={`fas ${MENU_ICONS[key as keyof typeof MENU_ICONS]} ${MENU_ICON_COLORS[key as keyof typeof MENU_ICON_COLORS]} text-xs`}></i>
            {MENU_LABELS[key as keyof typeof MENU_LABELS]}
            <span className="ml-1 px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded-full text-[10px] leading-none">
              {portalData?.[key]?.apps?.length ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Card List */}
      <div className="space-y-2">
        {currentApps.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <i className="fas fa-inbox text-3xl mb-3 block opacity-40"></i>
            <p className="text-sm">ยังไม่มี Card ในหมวดนี้</p>
            <button onClick={openAdd} className="mt-3 text-blue-600 text-xs hover:underline">
              + เพิ่ม Card แรก
            </button>
          </div>
        )}

        {currentApps.map((app, index) => (
          <div
            key={index}
            className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-slate-300 transition-colors"
          >
            {/* Icon/Emoji Preview */}
            <div className={`w-10 h-10 shrink-0 ${app.emoji ? 'bg-slate-50' : app.color} rounded-xl flex items-center justify-center text-xl shadow-sm`}>
              {app.emoji
                ? <span role="img">{app.emoji}</span>
                : <i className={`fas ${app.icon} text-white text-sm`}></i>
              }
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-800 text-sm">{app.name}</span>
                {app.url === '#' && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">ยังไม่มี URL</span>
                )}
                {app.active
                  ? <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-1"><i className="fas fa-check text-[9px]"></i>Active</span>
                  : <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded-full">Inactive</span>
                }
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">{app.url !== '#' ? app.url : '—'}</p>
              {app.desc && <p className="text-xs text-slate-500 truncate mt-0.5">{app.desc}</p>}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Quick-toggle Active */}
              <button
                onClick={async () => {
                  try {
                    await updateAppCard(selectedMenu, index, { ...app, active: !app.active });
                    showToast(app.active ? 'ตั้งเป็น Inactive แล้ว' : 'ตั้งเป็น Active แล้ว');
                  } catch { showToast('อัปเดตไม่สำเร็จ', 'error'); }
                }}
                className={`p-2 rounded-lg transition-colors ${app.active
                  ? 'text-emerald-600 hover:bg-emerald-50'
                  : 'text-slate-300 hover:text-emerald-500 hover:bg-emerald-50'}`}
                title={app.active ? 'Active — คลิกเพื่อตั้งเป็น Inactive' : 'Inactive — คลิกเพื่อตั้งเป็น Active'}
              >
                <i className="fas fa-check-circle text-sm"></i>
              </button>

              <button
                onClick={() => openEdit(index)}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="แก้ไข"
              >
                <i className="fas fa-pen text-xs"></i>
              </button>

              {confirmDelete === index ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDelete(index)}
                    disabled={deleting === index}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors disabled:opacity-60"
                  >
                    {deleting === index ? <i className="fas fa-spinner fa-spin text-xs"></i> : 'ยืนยัน'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-lg transition-colors"
                  >
                    ยกเลิก
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(index)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="ลบ"
                >
                  <i className="fas fa-trash text-xs"></i>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Modal Add/Edit ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className={`fas ${editIndex !== null ? 'fa-pen' : 'fa-plus'} text-blue-600 text-sm`}></i>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    {editIndex !== null ? 'แก้ไข Card' : 'เพิ่ม Card ใหม่'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    หมวด: {MENU_LABELS[selectedMenu as keyof typeof MENU_LABELS]}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4">

              {/* Preview */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className={`w-12 h-12 shrink-0 ${form.emoji ? 'bg-white border border-slate-200' : form.color} rounded-xl flex items-center justify-center text-2xl shadow-sm`}>
                  {form.emoji
                    ? <span role="img">{form.emoji}</span>
                    : <i className={`fas ${form.icon || 'fa-globe'} text-white`}></i>
                  }
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{form.name || 'ชื่อ Card'}</p>
                  <p className="text-xs text-slate-400 truncate">{form.url || 'https://...'}</p>
                  <p className="text-xs text-slate-500 truncate">{form.desc || 'คำอธิบาย...'}</p>
                </div>
              </div>

              {/* Emoji — กล่องกดเปิดเลือก (ประหยัดพื้นที่) */}
              <div ref={emojiPickerRef} className="relative">
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                  Emoji (รูปภาพ)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEmojiPickerOpen((o) => !o)}
                    className="flex items-center gap-2 min-h-[40px] px-3 py-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left w-full max-w-[200px]"
                  >
                    {form.emoji ? (
                      <span className="text-2xl" role="img">{form.emoji}</span>
                    ) : (
                      <span className="text-slate-400 text-sm flex items-center gap-1.5">
                        <i className="fas fa-face-smile"></i> เลือก Emoji
                      </span>
                    )}
                    <i className={`fas fa-chevron-down text-slate-400 text-xs ml-auto transition-transform ${emojiPickerOpen ? 'rotate-180' : ''}`}></i>
                  </button>
                  {form.emoji && (
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, emoji: '' }))}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-300 rounded-lg transition-colors"
                      title="ล้าง emoji"
                    >
                      <i className="fas fa-times text-xs"></i>
                    </button>
                  )}
                </div>

                {/* Popover เลือก Emoji */}
                {emojiPickerOpen && (
                  <div className="absolute left-0 top-full mt-1 z-50 w-[320px] max-h-[280px] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl py-2">
                    {EMOJI_CATEGORIES.map((cat) => (
                      <div key={cat.title} className="mb-3 last:mb-0">
                        <p className="px-3 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wide sticky top-0 bg-slate-50 border-b border-slate-100">
                          {cat.title}
                        </p>
                        <div className="flex flex-wrap gap-1 p-2">
                          {cat.emojis.map((em) => (
                            <button
                              key={em}
                              type="button"
                              onClick={() => {
                                setForm((f) => ({ ...f, emoji: em }));
                                setEmojiPickerOpen(false);
                              }}
                              className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg hover:bg-blue-50 transition-colors border
                                ${form.emoji === em ? 'border-blue-400 bg-blue-50' : 'border-transparent'}`}
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                  ชื่อ Card <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="เช่น QC Dashboard"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                  URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://example.web.app"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <p className="text-xs text-slate-400 mt-1">ใส่ # ถ้ายังไม่มี URL</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                  คำอธิบาย
                </label>
                <input
                  type="text"
                  value={form.desc}
                  onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
                  placeholder="อธิบายระบบสั้นๆ..."
                  maxLength={80}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-400 mt-1 text-right">{form.desc.length}/80</p>
              </div>

              {/* Color (fallback เมื่อไม่มี emoji) */}
              {!form.emoji && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                    สีพื้นหลัง Icon (fallback)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setForm((f) => ({ ...f, color: c.value }))}
                        title={c.label}
                        className={`w-7 h-7 rounded-lg ${c.value} transition-transform hover:scale-110
                          ${form.color === c.value ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Active toggle */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">สถานะการแสดงผล</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    เมื่อตั้งเป็น <span className="text-emerald-600 font-medium">Active</span> จะมีเครื่องหมาย ✅ สีเขียวแสดงที่มุมบนซ้ายของ Card
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
                    ${form.active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  role="switch"
                  aria-checked={form.active}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform
                      ${form.active ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
                <span className={`ml-3 text-xs font-semibold w-14 text-center
                  ${form.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {form.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {saving
                  ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>กำลังบันทึก...</>
                  : <><i className="fas fa-floppy-disk text-xs"></i>{editIndex !== null ? 'บันทึกการแก้ไข' : 'เพิ่ม Card'}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
