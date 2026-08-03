import React, { useState, useEffect, useRef } from 'react';
import type { App, AppData, TabData } from '../../types/portal';
import {
  getMenuOrder,
  getMenuIcon,
  getMenuColor,
  getMenuLabel,
  MENU_ORDER,
} from '../../data/defaultPortalData';
import {
  subscribePortalData,
  addAppCard,
  updateAppCard,
  deleteAppCard,
  addMenu,
  updateMenu,
  deleteMenu,
  reorderMenus,
} from '../../services/portalFirestore';

// ── สีที่เลือกได้สำหรับการ์ด ──────────────────────────────────────────────────
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

// ── สี Icon ที่เลือกได้สำหรับ เมนู Sidebar ─────────────────────────────────────
const MENU_ICON_COLOR_OPTIONS = [
  { label: 'Sky',      value: 'text-sky-400' },
  { label: 'Emerald',  value: 'text-emerald-400' },
  { label: 'Amber',    value: 'text-amber-400' },
  { label: 'Teal',     value: 'text-teal-400' },
  { label: 'Indigo',   value: 'text-indigo-400' },
  { label: 'Purple',   value: 'text-purple-400' },
  { label: 'Rose',     value: 'text-rose-400' },
  { label: 'Orange',   value: 'text-orange-400' },
  { label: 'Blue',     value: 'text-blue-400' },
  { label: 'Yellow',   value: 'text-yellow-400' },
  { label: 'Lime',     value: 'text-lime-400' },
  { label: 'Pink',     value: 'text-pink-400' },
  { label: 'Violet',   value: 'text-violet-400' },
  { label: 'Cyan',     value: 'text-cyan-400' },
  { label: 'Slate',    value: 'text-slate-300' },
  { label: 'Red',      value: 'text-red-400' },
];

// ── รายการ Icon ยอดนิยมสำหรับเลือกเมนู ───────────────────────────────────────
const POPULAR_MENU_ICONS = [
  'fa-circle-info',
  'fa-rocket',
  'fa-lightbulb',
  'fa-gear',
  'fa-folder',
  'fa-star',
  'fa-chart-pie',
  'fa-users',
  'fa-calculator',
  'fa-toolbox',
  'fa-shield-halved',
  'fa-handshake',
  'fa-headset',
  'fa-building',
  'fa-drafting-compass',
  'fa-calendar-check',
  'fa-gavel',
  'fa-cart-shopping',
  'fa-laptop-code',
  'fa-coins',
  'fa-chart-line',
  'fa-layer-group',
  'fa-helmet-safety',
  'fa-magnifying-glass-chart',
  'fa-house-chimney-user',
  'fa-certificate',
  'fa-external-link-alt',
  'fa-file-invoice',
  'fa-award',
  'fa-wrench',
  'fa-truck',
  'fa-boxes-packing',
];

// ── EMOJI CATEGORIES ──────────────────────────────────────────────────────────
const EMOJI_CATEGORIES: { title: string; emojis: string[] }[] = [
  {
    title: 'งานก่อสร้าง / Construction',
    emojis: ['🏗️','🔨','⛏️','🧱','📐','🚧','👷','🪖','🦺','⛑️','🔧','🛠️','🔩','⚙️','📦','🚛','🏕️','🪵','🪚','🪓','🚜','🚚','🛒','🧰','🏠','🌉','🪨'],
  },
  {
    title: 'รายงาน / เอกสาร / Report & Document',
    emojis: ['📋','📄','📑','📊','📈','📉','📝','📌','📎','🗂️','📁','📂','📅','📆','🗓️','📇','📃','🗃️','📒','📔','📕','📗','📘','📙','📜','🔖','📰','🗞️'],
  },
  {
    title: 'QC / ตรวจสอบ / Safety',
    emojis: ['🔬','✅','⚠️','🔍','🧪','📏','🎯','🏅','✔️','❌','🔎','🛡️','🔐','🚨','🔒'],
  },
  {
    title: 'สำนักงาน / Office & อื่นๆ',
    emojis: ['🏢','📰','🌐','💼','🖥️','👥','🖨️','📡','💻','📱','🕐','💰','💳','🏆','🤖','⚖️','🎓','🎉','✨','🎧','⬇️'],
  },
];

// ── Form state สำหรับ Card ────────────────────────────────────────────────────
interface CardFormState {
  name: string;
  url: string;
  emoji: string;
  desc: string;
  color: string;
  icon: string;
  active: boolean;
}

const EMPTY_CARD_FORM: CardFormState = {
  name: '', url: '', emoji: '', desc: '', color: 'bg-blue-600', icon: 'fa-globe', active: false,
};

// ── Form state สำหรับ Menu ────────────────────────────────────────────────────
interface MenuFormState {
  title: string;
  icon: string;
  color: string;
}

const EMPTY_MENU_FORM: MenuFormState = {
  title: '',
  icon: 'fa-layer-group',
  color: 'text-blue-400',
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function PortalManager() {
  const [portalData, setPortalData]     = useState<AppData | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<string>('info');

  // Card modal & states
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [editCardIndex, setEditCardIndex] = useState<number | null>(null);
  const [cardForm, setCardForm]           = useState<CardFormState>(EMPTY_CARD_FORM);
  const [savingCard, setSavingCard]       = useState(false);
  const [deletingCard, setDeletingCard]   = useState<number | null>(null);
  const [confirmDeleteCard, setConfirmDeleteCard] = useState<number | null>(null);

  // Menu modal & states
  const [menuModalOpen, setMenuModalOpen]   = useState(false);
  const [editMenuKey, setEditMenuKey]       = useState<string | null>(null);
  const [menuForm, setMenuForm]             = useState<MenuFormState>(EMPTY_MENU_FORM);
  const [savingMenu, setSavingMenu]         = useState(false);
  const [deletingMenuKey, setDeletingMenuKey] = useState<string | null>(null);

  // Reorder modal & states
  const [reorderModalOpen, setReorderModalOpen] = useState(false);
  const [menuOrderState, setMenuOrderState]     = useState<string[]>([]);
  const [savingOrder, setSavingOrder]           = useState(false);

  // Toast & Pickers
  const [toast, setToast]               = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribePortalData((data) => {
      setPortalData(data);
    });
    return unsub;
  }, []);

  const menuKeys = getMenuOrder(portalData);

  // ให้ selectedMenu เลือกเมนูแรกในอาร์เรย์ถ้ายังไม่มี
  useEffect(() => {
    if (menuKeys.length > 0 && !menuKeys.includes(selectedMenu)) {
      setSelectedMenu(menuKeys[0]);
    }
  }, [menuKeys, selectedMenu]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const currentSection = portalData?.[selectedMenu] as TabData | undefined;
  const currentApps = currentSection?.apps ?? [];

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

  // ── Card Actions ────────────────────────────────────────────────────────────
  const openAddCard = () => {
    setCardForm(EMPTY_CARD_FORM);
    setEditCardIndex(null);
    setEmojiPickerOpen(false);
    setCardModalOpen(true);
  };

  const openEditCard = (index: number) => {
    const app = currentApps[index];
    setCardForm({
      name:   app.name,
      url:    app.url,
      emoji:  app.emoji ?? '',
      desc:   app.desc,
      color:  app.color,
      icon:   app.icon,
      active: app.active ?? false,
    });
    setEditCardIndex(index);
    setEmojiPickerOpen(false);
    setCardModalOpen(true);
  };

  const handleSaveCard = async () => {
    if (!cardForm.name.trim()) { showToast('กรุณากรอกชื่อ Card', 'error'); return; }
    if (!cardForm.url.trim())  { showToast('กรุณากรอก URL', 'error'); return; }

    setSavingCard(true);
    try {
      const emojiVal = cardForm.emoji.trim();
      const appData: App = {
        name:   cardForm.name.trim(),
        url:    cardForm.url.trim() === '#' || /^https?:\/\//i.test(cardForm.url.trim()) ? cardForm.url.trim() : `https://${cardForm.url.trim()}`,
        desc:   cardForm.desc.trim(),
        color:  cardForm.color,
        icon:   cardForm.icon || 'fa-globe',
        active: cardForm.active,
        ...(emojiVal ? { emoji: emojiVal } : {}),
      };
      if (editCardIndex !== null) {
        await updateAppCard(selectedMenu, editCardIndex, appData);
        showToast('แก้ไข Card สำเร็จ');
      } else {
        await addAppCard(selectedMenu, appData);
        showToast('เพิ่ม Card สำเร็จ');
      }
      setCardModalOpen(false);
    } catch (err) {
      console.error('[PortalManager] save card error:', err);
      showToast('เกิดข้อผิดพลาด กรุณาลองใหม่', 'error');
    } finally {
      setSavingCard(false);
    }
  };

  const handleDeleteCard = async (index: number) => {
    setDeletingCard(index);
    try {
      await deleteAppCard(selectedMenu, index);
      showToast('ลบ Card สำเร็จ');
    } catch (err) {
      console.error(err);
      showToast('ลบไม่สำเร็จ กรุณาลองใหม่', 'error');
    } finally {
      setDeletingCard(null);
      setConfirmDeleteCard(null);
    }
  };

  // ── Menu Actions ────────────────────────────────────────────────────────────
  const openAddMenu = () => {
    setMenuForm(EMPTY_MENU_FORM);
    setEditMenuKey(null);
    setMenuModalOpen(true);
  };

  const openEditMenu = (key: string) => {
    const title = getMenuLabel(key, portalData);
    const icon  = getMenuIcon(key, portalData);
    const color = getMenuColor(key, portalData);

    setMenuForm({ title, icon, color });
    setEditMenuKey(key);
    setMenuModalOpen(true);
  };

  const handleSaveMenu = async () => {
    if (!menuForm.title.trim()) {
      showToast('กรุณากรอกชื่อเมนู', 'error');
      return;
    }

    setSavingMenu(true);
    try {
      if (editMenuKey) {
        await updateMenu(editMenuKey, {
          title: menuForm.title.trim(),
          icon:  menuForm.icon,
          color: menuForm.color,
        });
        showToast('แก้ไขเมนูสำเร็จ');
      } else {
        const newKey = await addMenu(
          menuForm.title.trim(),
          menuForm.icon,
          menuForm.color
        );
        setSelectedMenu(newKey);
        showToast('เพิ่มเมนูใหม่สำเร็จ');
      }
      setMenuModalOpen(false);
    } catch (err) {
      console.error('[PortalManager] save menu error:', err);
      showToast('เกิดข้อผิดพลาดในการบันทึกเมนู', 'error');
    } finally {
      setSavingMenu(false);
    }
  };

  const handleDeleteMenu = async (key: string) => {
    setDeletingMenuKey(key);
    try {
      await deleteMenu(key);
      showToast('ลบเมนูเรียบร้อยแล้ว');
      const updatedKeys = menuKeys.filter((k) => k !== key);
      if (updatedKeys.length > 0) {
        setSelectedMenu(updatedKeys[0]);
      }
    } catch (err) {
      console.error(err);
      showToast('เกิดข้อผิดพลาดในการลบเมนู', 'error');
    } finally {
      setDeletingMenuKey(null);
    }
  };

  // ── Reorder Menu Actions ────────────────────────────────────────────────────
  const openReorderModal = () => {
    setMenuOrderState([...menuKeys]);
    setReorderModalOpen(true);
  };

  const handleMoveMenu = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= menuOrderState.length) return;

    const updated = [...menuOrderState];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setMenuOrderState(updated);
  };

  const handleSaveOrder = async () => {
    setSavingOrder(true);
    try {
      await reorderMenus(menuOrderState);
      showToast('บันทึกลำดับเมนูสำเร็จ');
      setReorderModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast('บันทึกลำดับไม่สำเร็จ', 'error');
    } finally {
      setSavingOrder(false);
    }
  };

  return (
    <div className="relative" style={{ fontFamily: 'Sarabun, sans-serif' }}>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[200] px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 transition-all
          ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          <i className={`fas ${toast.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
          {toast.msg}
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">จัดการ Cards & เมนู</h3>
          <p className="text-xs text-slate-500 mt-0.5">เพิ่ม แก้ไข ลบ และจัดเรียงหมวดเมนูและ Card ต่างๆ</p>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={openReorderModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-800 text-slate-100 text-xs font-semibold rounded-lg transition-colors shadow-sm"
            title="จัดเรียงลำดับเมนูใน Sidebar"
          >
            <i className="fas fa-arrows-up-down text-xs text-yellow-400"></i>
            เรียงลำดับเมนู
          </button>

          <button
            onClick={openAddMenu}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            <i className="fas fa-[#fa-plus] fa-plus text-xs"></i>
            + เพิ่มเมนูใหม่
          </button>

          <button
            onClick={openAddCard}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            <i className="fas fa-plus text-xs"></i>
            + เพิ่ม Card ใหม่
          </button>
        </div>
      </div>

      {/* Menu Tabs Bar */}
      <div className="flex gap-1 flex-wrap mb-4 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
        {menuKeys.map((key) => {
          const isSelected = selectedMenu === key;
          const label = getMenuLabel(key, portalData);
          const icon  = getMenuIcon(key, portalData);
          const color = getMenuColor(key, portalData);
          const cardCount = (portalData?.[key] as TabData | undefined)?.apps?.length ?? 0;
          const isCustom = (portalData?.[key] as TabData | undefined)?.isCustom || !(MENU_ORDER as readonly string[]).includes(key);

          return (
            <div
              key={key}
              className={`group flex items-center rounded-lg transition-colors relative
                ${isSelected ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'hover:bg-slate-200/60'}`}
            >
              <button
                onClick={() => setSelectedMenu(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold whitespace-nowrap
                  ${isSelected ? 'text-blue-700' : 'text-slate-600 hover:text-slate-800'}`}
              >
                <i className={`fas ${icon} ${color} text-xs`}></i>
                {label}
                <span className="ml-1 px-1.5 py-0.5 bg-slate-200/80 text-slate-600 rounded-full text-[10px] leading-none">
                  {cardCount}
                </span>
              </button>

              {/* Edit / Delete menu options on active or custom tab */}
              {isSelected && (
                <div className="flex items-center gap-0.5 pr-1.5 border-l border-slate-200 ml-0.5 pl-1">
                  <button
                    onClick={() => openEditMenu(key)}
                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="แก้ไขเมนูนี้ (ชื่อ / Icon / สี)"
                  >
                    <i className="fas fa-gear text-[10px]"></i>
                  </button>

                  {isCustom && (
                    <button
                      onClick={() => {
                        if (confirm(`คุณต้องการลบเมนู "${label}" ใช่หรือไม่?`)) {
                          handleDeleteMenu(key);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="ลบเมนูนี้"
                    >
                      <i className="fas fa-trash text-[10px]"></i>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Menu Information Banner */}
      <div className="flex items-center justify-between bg-blue-50/60 border border-blue-100 rounded-xl px-4 py-2.5 mb-3">
        <div className="flex items-center gap-2 truncate">
          <i className={`fas ${getMenuIcon(selectedMenu, portalData)} ${getMenuColor(selectedMenu, portalData)} text-base`}></i>
          <span className="font-bold text-slate-800 text-sm">{getMenuLabel(selectedMenu, portalData)}</span>
          <span className="text-xs text-slate-400 truncate">({currentApps.length} Cards)</span>
        </div>
        <button
          onClick={() => openEditMenu(selectedMenu)}
          className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium shrink-0 flex items-center gap-1"
        >
          <i className="fas fa-pen text-[10px]"></i> ตั้งค่าเมนูนี้
        </button>
      </div>

      {/* Card List */}
      <div className="space-y-2">
        {currentApps.length === 0 && (
          <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            <i className="fas fa-inbox text-3xl mb-3 block opacity-40"></i>
            <p className="text-sm">ยังไม่มี Card ในหมวด "{getMenuLabel(selectedMenu, portalData)}"</p>
            <button onClick={openAddCard} className="mt-3 text-blue-600 text-xs font-semibold hover:underline">
              + เพิ่ม Card แรกในหมวดนี้
            </button>
          </div>
        )}

        {currentApps.map((app, index) => (
          <div
            key={index}
            className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-slate-300 transition-colors shadow-xs"
          >
            {/* Icon/Emoji Preview */}
            <div className={`w-10 h-10 shrink-0 ${app.emoji ? 'bg-slate-50 border border-slate-100' : app.color} rounded-xl flex items-center justify-center text-xl shadow-xs`}>
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
                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">ยังไม่มี URL</span>
                )}
                {app.active
                  ? <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium flex items-center gap-1"><i className="fas fa-check text-[9px]"></i>Active</span>
                  : <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded-full">Inactive</span>
                }
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5 font-mono">{app.url !== '#' ? app.url : '—'}</p>
              {app.desc && <p className="text-xs text-slate-500 truncate mt-0.5">{app.desc}</p>}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
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
                onClick={() => openEditCard(index)}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="แก้ไข Card"
              >
                <i className="fas fa-pen text-xs"></i>
              </button>

              {confirmDeleteCard === index ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDeleteCard(index)}
                    disabled={deletingCard === index}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors disabled:opacity-60 font-semibold"
                  >
                    {deletingCard === index ? <i className="fas fa-spinner fa-spin text-xs"></i> : 'ยืนยัน'}
                  </button>
                  <button
                    onClick={() => setConfirmDeleteCard(null)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-lg transition-colors"
                  >
                    ยกเลิก
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeleteCard(index)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="ลบ Card"
                >
                  <i className="fas fa-trash text-xs"></i>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>


      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* ── MODAL 1: เพิ่ม / แก้ไข เมนูใหม่ ────────────────────────────────────── */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {menuModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                  <i className={`fas ${editMenuKey ? 'fa-gear' : 'fa-folder-plus'} text-base`}></i>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    {editMenuKey ? 'ตั้งค่า / แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}
                  </h4>
                  <p className="text-xs text-slate-400">จะแสดงบน Sidebar และ Dashboard</p>
                </div>
              </div>
              <button
                onClick={() => setMenuModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Preview */}
              <div className="flex items-center gap-3 p-3.5 bg-slate-900 text-slate-100 rounded-xl">
                <i className={`fas ${menuForm.icon || 'fa-layer-group'} ${menuForm.color} text-lg w-6 text-center`}></i>
                <span className="font-semibold text-sm truncate">{menuForm.title || 'ตัวอย่างชื่อเมนู'}</span>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  ชื่อเมนู <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={menuForm.title}
                  onChange={(e) => setMenuForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="เช่น CMG Innovation, Safety Control..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              </div>

              {/* Icon selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Icon (FontAwesome Class)
                </label>
                <input
                  type="text"
                  value={menuForm.icon}
                  onChange={(e) => setMenuForm((f) => ({ ...f, icon: e.target.value }))}
                  placeholder="เช่น fa-lightbulb, fa-rocket..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs mb-2"
                />

                <p className="text-[11px] text-slate-400 mb-1.5">เลือก Icon ยอดนิยม:</p>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                  {POPULAR_MENU_ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setMenuForm((f) => ({ ...f, icon: ic }))}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors border text-sm
                        ${menuForm.icon === ic
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                          : 'border-transparent text-slate-600 hover:bg-white hover:border-slate-300'}`}
                      title={ic}
                    >
                      <i className={`fas ${ic}`}></i>
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Color selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  สี Icon บน Sidebar
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {MENU_ICON_COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setMenuForm((f) => ({ ...f, color: c.value }))}
                      title={c.label}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all bg-slate-900 ${c.value}
                        ${menuForm.color === c.value ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110' : 'hover:scale-105'}`}
                    >
                      <i className="fas fa-circle text-[10px]"></i>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-slate-100 bg-slate-50">
              <button
                type="button"
                onClick={() => setMenuModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl text-sm transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveMenu}
                disabled={savingMenu}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
              >
                {savingMenu ? (
                  <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>กำลังบันทึก...</>
                ) : (
                  <><i className="fas fa-floppy-disk text-xs"></i>{editMenuKey ? 'บันทึกการแก้ไข' : 'เพิ่มเมนูใหม่'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* ── MODAL 2: เรียงลำดับเมนู (Reorder Menus) ──────────────────────────────── */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {reorderModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-slate-800 text-yellow-400 rounded-xl flex items-center justify-center">
                  <i className="fas fa-arrows-up-down text-base"></i>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">เรียงลำดับเมนู (Menu Reordering)</h4>
                  <p className="text-xs text-slate-400">ใช้ปุ่มขึ้น-ลง เพื่อเปลี่ยนลำดับเมนูที่จะแสดงผล</p>
                </div>
              </div>
              <button
                onClick={() => setReorderModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-2 flex-1">
              {menuOrderState.map((key, index) => {
                const label = getMenuLabel(key, portalData);
                const icon  = getMenuIcon(key, portalData);
                const color = getMenuColor(key, portalData);

                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 text-center font-mono text-xs text-slate-400 font-bold">{index + 1}.</span>
                      <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center shrink-0">
                        <i className={`fas ${icon} ${color} text-sm`}></i>
                      </div>
                      <span className="font-semibold text-slate-800 text-sm truncate">{label}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveMenu(index, 'up')}
                        disabled={index === 0}
                        className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-white"
                        title="เลื่อนขึ้น"
                      >
                        <i className="fas fa-chevron-up text-xs"></i>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveMenu(index, 'down')}
                        disabled={index === menuOrderState.length - 1}
                        className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-white"
                        title="เลื่อนลง"
                      >
                        <i className="fas fa-chevron-down text-xs"></i>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm(`คุณต้องการลบเมนู "${label}" ออกจากระบบใช่หรือไม่?`)) {
                            setMenuOrderState((prev) => prev.filter((k) => k !== key));
                            await handleDeleteMenu(key);
                          }
                        }}
                        className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 text-slate-400 hover:text-red-600 rounded-lg transition-colors ml-1"
                        title="ลบเมนูนี้"
                      >
                        <i className="fas fa-trash text-xs"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-slate-100 bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={() => setReorderModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl text-sm transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveOrder}
                disabled={savingOrder}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
              >
                {savingOrder ? (
                  <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>กำลังบันทึก...</>
                ) : (
                  <><i className="fas fa-floppy-disk text-xs"></i>บันทึกลำดับเมนู</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* ── MODAL 3: เพิ่ม / แก้ไข Card ────────────────────────────────────────── */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {cardModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className={`fas ${editCardIndex !== null ? 'fa-pen' : 'fa-plus'} text-blue-600 text-sm`}></i>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    {editCardIndex !== null ? 'แก้ไข Card' : 'เพิ่ม Card ใหม่'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    หมวด: {getMenuLabel(selectedMenu, portalData)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCardModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4">

              {/* Preview */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className={`w-12 h-12 shrink-0 ${cardForm.emoji ? 'bg-white border border-slate-200' : cardForm.color} rounded-xl flex items-center justify-center text-2xl shadow-sm`}>
                  {cardForm.emoji
                    ? <span role="img">{cardForm.emoji}</span>
                    : <i className={`fas ${cardForm.icon || 'fa-globe'} text-white`}></i>
                  }
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{cardForm.name || 'ชื่อ Card'}</p>
                  <p className="text-xs text-slate-400 truncate">{cardForm.url || 'https://...'}</p>
                  <p className="text-xs text-slate-500 truncate">{cardForm.desc || 'คำอธิบาย...'}</p>
                </div>
              </div>

              {/* Emoji Picker */}
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
                    {cardForm.emoji ? (
                      <span className="text-2xl" role="img">{cardForm.emoji}</span>
                    ) : (
                      <span className="text-slate-400 text-sm flex items-center gap-1.5">
                        <i className="fas fa-face-smile"></i> เลือก Emoji
                      </span>
                    )}
                    <i className={`fas fa-chevron-down text-slate-400 text-xs ml-auto transition-transform ${emojiPickerOpen ? 'rotate-180' : ''}`}></i>
                  </button>
                  {cardForm.emoji && (
                    <button
                      type="button"
                      onClick={() => setCardForm((f) => ({ ...f, emoji: '' }))}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-300 rounded-lg transition-colors"
                      title="ล้าง emoji"
                    >
                      <i className="fas fa-times text-xs"></i>
                    </button>
                  )}
                </div>

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
                                setCardForm((f) => ({ ...f, emoji: em }));
                                setEmojiPickerOpen(false);
                              }}
                              className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg hover:bg-blue-50 transition-colors border
                                ${cardForm.emoji === em ? 'border-blue-400 bg-blue-50' : 'border-transparent'}`}
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
                  value={cardForm.name}
                  onChange={(e) => setCardForm((f) => ({ ...f, name: e.target.value }))}
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
                  value={cardForm.url}
                  onChange={(e) => setCardForm((f) => ({ ...f, url: e.target.value }))}
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
                  value={cardForm.desc}
                  onChange={(e) => setCardForm((f) => ({ ...f, desc: e.target.value }))}
                  placeholder="อธิบายระบบสั้นๆ..."
                  maxLength={80}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-400 mt-1 text-right">{cardForm.desc.length}/80</p>
              </div>

              {/* Color */}
              {!cardForm.emoji && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                    สีพื้นหลัง Icon (fallback)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setCardForm((f) => ({ ...f, color: c.value }))}
                        title={c.label}
                        className={`w-7 h-7 rounded-lg ${c.value} transition-transform hover:scale-110
                          ${cardForm.color === c.value ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''}`}
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
                  onClick={() => setCardForm((f) => ({ ...f, active: !f.active }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
                    ${cardForm.active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  role="switch"
                  aria-checked={cardForm.active}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform
                      ${cardForm.active ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
                <span className={`ml-3 text-xs font-semibold w-14 text-center
                  ${cardForm.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {cardForm.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setCardModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveCard}
                disabled={savingCard}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {savingCard
                  ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>กำลังบันทึก...</>
                  : <><i className="fas fa-floppy-disk text-xs"></i>{editCardIndex !== null ? 'บันทึกการแก้ไข' : 'เพิ่ม Card'}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
