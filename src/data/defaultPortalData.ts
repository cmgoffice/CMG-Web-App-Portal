import type { AppData } from '../types/portal';

/** ลำดับเมนู sidebar — ตายตัว ห้ามเปลี่ยน */
export const MENU_ORDER = [
  'info',
  'planning',
  'construction',
  'qc',
  'bidding',
  'procurement',
  'hr',
  'safety',
  'workshop',
  'labour',
  'it',
  'iso',
] as const;

export type MenuKey = (typeof MENU_ORDER)[number];

export const MENU_ICONS: Record<MenuKey, string> = {
  info:         'fa-circle-info',
  planning:     'fa-calendar-check',
  construction: 'fa-helmet-safety',
  qc:           'fa-magnifying-glass-chart',
  bidding:      'fa-gavel',
  procurement:  'fa-cart-shopping',
  hr:           'fa-handshake',
  safety:       'fa-shield-halved',
  workshop:     'fa-screwdriver-wrench',
  labour:       'fa-house-chimney-user',
  it:           'fa-laptop-code',
  iso:          'fa-certificate',
};

export const MENU_ICON_COLORS: Record<MenuKey, string> = {
  info:         'text-sky-400',
  planning:     'text-emerald-400',
  construction: 'text-amber-400',
  qc:           'text-teal-400',
  bidding:      'text-indigo-400',
  procurement:  'text-purple-400',
  hr:           'text-rose-400',
  safety:       'text-orange-400',
  workshop:     'text-slate-300',
  labour:       'text-cyan-400',
  it:           'text-blue-400',
  iso:          'text-emerald-300',
};

export const MENU_LABELS: Record<MenuKey, string> = {
  info:         'CMG Information',
  planning:     'Project Planning',
  construction: 'Construction',
  qc:           'QC System',
  bidding:      'Bidding',
  procurement:  'Procurement',
  hr:           'Human Resource',
  safety:       'Safety Control',
  workshop:     'CMG Workshop',
  labour:       'CMG Labour Camp',
  it:           'CMG IT',
  iso:          'ISO Management',
};

export const DEFAULT_PORTAL_DATA: AppData = {
  info: {
    title: "CMG Information",
    apps: [
      { name: "Company Profile",  url: "#", icon: "fa-building",  color: "bg-blue-500",  desc: "ข้อมูลประวัติบริษัทและผลงาน",          emoji: "🏢" },
      { name: "Intranet News",    url: "#", icon: "fa-newspaper", color: "bg-blue-400",  desc: "ข่าวสารภายในองค์กรล่าสุด",             emoji: "📰" },
      { name: "Org Chart",        url: "#", icon: "fa-sitemap",   color: "bg-indigo-500",desc: "แผนผังองค์กรรายแผนก",                  emoji: "🏗️" },
      { name: "Policy & Manual",  url: "#", icon: "fa-book",      color: "bg-slate-600", desc: "ระเบียบและคู่มือการปฏิบัติงาน",        emoji: "📋" },
    ],
  },
  planning: {
    title: "Project Planning",
    apps: [
      { name: "Master Schedule",           url: "#",                                          icon: "fa-calendar-days",      color: "bg-emerald-600", desc: "แผนงานโครงการหลัก (Gantt Chart)",              emoji: "📅" },
      { name: "Resource Allocation",       url: "#",                                          icon: "fa-users-gear",         color: "bg-emerald-500", desc: "การจัดสรรกำลังคนและเครื่องจักร",               emoji: "👥" },
      { name: "Budget Control System",     url: "https://cmg-budget-control.web.app/",        icon: "fa-money-bill-trend-up",color: "bg-green-600",   desc: "ระบบติดตามงบประมาณโครงการ",                    emoji: "💰" },
      { name: "CMG Payment System",        url: "https://cmg-payment-system.web.app/",        icon: "fa-credit-card",        color: "bg-emerald-700", desc: "ระบบชำระเงินและการจ่ายเงิน",                   emoji: "💳" },
      { name: "Project Planning-Organize", url: "https://project-planning-organize.web.app/", icon: "fa-folder-tree",        color: "bg-teal-600",    desc: "จัดระเบียบและบริหารแผนงานโครงการ",             emoji: "📁" },
      { name: "Project Progress Tracking", url: "https://5wj2lz.csb.app/",                    icon: "fa-bars-progress",      color: "bg-teal-600",    desc: "รายงานความก้าวหน้าของแต่ละโครงการ",            emoji: "📈" },
      { name: "Mile Stone Progress",       url: "https://milesoneprogress.web.app/",          icon: "fa-flag-checkered",     color: "bg-violet-600",  desc: "การติดตามงานแบบ Project Mile Stone",            emoji: "🏁" },
    ],
  },
  construction: {
    title: "Construction",
    apps: [
      { name: "Daily Report",                   url: "#",                                          icon: "fa-file-pen",        color: "bg-amber-600",  desc: "บันทึกรายงานหน้างานประจำวัน",          emoji: "📝" },
      { name: "Site Monitoring",                url: "#",                                          icon: "fa-video",           color: "bg-red-500",    desc: "กล้อง CCTV และการตรวจงานหน้างาน",     emoji: "📹" },
      { name: "Material Log",                   url: "#",                                          icon: "fa-boxes-stacked",   color: "bg-orange-600", desc: "บันทึกการรับเข้า-จ่ายวัสดุหน้างาน",   emoji: "📦" },
      { name: "Drawing Viewer",                 url: "#",                                          icon: "fa-drafting-compass",color: "bg-cyan-600",   desc: "ระบบดูแบบก่อสร้างออนไลน์",            emoji: "📐" },
      { name: "Construction Site Daily Report", url: "https://constructioncontrol-37f21.web.app/", icon: "fa-clipboard-list",  color: "bg-orange-500", desc: "รายงานความก้าวหน้าประจำวัน",           emoji: "🏗️" },
    ],
  },
  qc: {
    title: "QC System",
    apps: [
      { name: "QC-System",         url: "https://cmg-qc-system.web.app", icon: "fa-magnifying-glass-chart", color: "bg-teal-700", desc: "ระบบบริหารจัดการคุณภาพงานก่อสร้าง CMG", emoji: "🔬" },
      { name: "Quality Checklist", url: "#",                              icon: "fa-list-check",             color: "bg-teal-600", desc: "แบบตรวจสอบคุณภาพงาน",                  emoji: "✅" },
      { name: "NCR Management",    url: "#",                              icon: "fa-triangle-exclamation",   color: "bg-red-500",  desc: "ระบบจัดการรายงานความไม่สอดคล้อง",      emoji: "⚠️" },
      { name: "Inspection Report", url: "#",                              icon: "fa-file-circle-check",      color: "bg-teal-500", desc: "รายงานการตรวจสอบคุณภาพ",               emoji: "🔍" },
      { name: "Material Testing",  url: "#",                              icon: "fa-flask",                  color: "bg-cyan-600", desc: "ผลการทดสอบวัสดุก่อสร้าง",              emoji: "🧪" },
    ],
  },
  bidding: {
    title: "Bidding",
    apps: [
      { name: "CMG Bidding Project",       url: "https://cmg-bidding-tracker.web.app/",       icon: "fa-list-check",   color: "bg-blue-700",   desc: "ระบบติดตามสถานะการประมูลโครงการ",      emoji: "🏆" },
      { name: "Project Planning-Organize", url: "https://project-planning-organize.web.app/", icon: "fa-folder-tree",  color: "bg-teal-600",   desc: "จัดระเบียบและบริหารแผนงานโครงการ",     emoji: "📁" },
      { name: "AI-Estimation Tool",        url: "https://bidding-costestimate.web.app/",       icon: "fa-calculator",   color: "bg-blue-600",   desc: "เครื่องมือคำนวณราคากลางและต้นทุน",     emoji: "🧮" },
      { name: "Bid Comparison",            url: "#",                                           icon: "fa-code-compare", color: "bg-indigo-600", desc: "ระบบเปรียบเทียบราคาเสนอประมูล",        emoji: "⚖️" },
      { name: "E-Bidding Portal",          url: "#",                                           icon: "fa-fingerprint",  color: "bg-blue-800",   desc: "ช่องทางยื่นซองประมูลอิเล็กทรอนิกส์",  emoji: "🖥️" },
      { name: "Quick AI Estimate",         url: "https://p5lrdx.csb.app/",                    icon: "fa-robot",        color: "bg-cyan-600",   desc: "การคำนวณราคาโดยใช้ AI อย่างง่าย",      emoji: "🤖" },
    ],
  },
  procurement: {
    title: "Procurement",
    apps: [
      { name: "PR/PO System",              url: "https://43np74.csb.app/",                          icon: "fa-file-invoice-dollar", color: "bg-purple-600", desc: "ระบบขอซื้อและสั่งซื้อสินค้า",          emoji: "🧾" },
      { name: "CMG Tool Store Management", url: "https://cmg-tool-store-management.web.app/",       icon: "fa-toolbox",             color: "bg-purple-700", desc: "ระบบบริหารจัดการคลังเครื่องมือ",        emoji: "🧰" },
      { name: "CMG Petty Cash Management", url: "https://cmg-petty-cash-management.web.app/login",  icon: "fa-money-bill-wave",     color: "bg-purple-600", desc: "ระบบบริหารจัดการเงินสดย่อย",            emoji: "💵" },
      { name: "Vendor List",               url: "#",                                                 icon: "fa-address-book",        color: "bg-purple-500", desc: "รายชื่อผู้ขายและผู้รับเหมาช่วง",        emoji: "📒" },
      { name: "Price Database",            url: "#",                                                 icon: "fa-database",            color: "bg-pink-600",   desc: "ฐานข้อมูลราคากลางวัสดุ",                emoji: "🗄️" },
      { name: "CMG Equipment",             url: "https://xtg3nm.csb.app/",                          icon: "fa-truck-front",         color: "bg-purple-700", desc: "บริหารการใช้เครื่องจักรและดูแลรักษา",   emoji: "🚛" },
    ],
  },
  hr: {
    title: "Human Resource",
    apps: [
      { name: "E-Leave",                url: "#",                                        icon: "fa-calendar-minus", color: "bg-rose-500",    desc: "ระบบลางานออนไลน์",                         emoji: "🗓️" },
      { name: "Payslip Online",         url: "#",                                        icon: "fa-receipt",        color: "bg-rose-600",    desc: "ระบบเรียกดูสลิปเงินเดือน",                 emoji: "💴" },
      { name: "Training Portal",        url: "#",                                        icon: "fa-graduation-cap", color: "bg-sky-600",     desc: "ระบบบันทึกการฝึกอบรม",                     emoji: "🎓" },
      { name: "Event Manager",          url: "https://3glrw4.csb.app/",                 icon: "fa-calendar-star",  color: "bg-fuchsia-600", desc: "ระบบบริหารจัดการกิจกรรมภายในบริษัท CMG",   emoji: "🎉" },
      { name: "Master Database CMG",    url: "https://cmg-hr-database.web.app/",        icon: "fa-database",       color: "bg-slate-600",   desc: "ระบบจัดการฐานข้อมูล",                      emoji: "🗃️" },
      { name: "Work for Success",       url: "https://cnpg5q.csb.app/",                 icon: "fa-trophy",         color: "bg-amber-500",   desc: "ร่วมด้วยช่วยกันเพื่อความฝันของเรา",        emoji: "🏆" },
      { name: "Performance Evaluation", url: "https://cmg-performance-system.web.app/", icon: "fa-chart-line",     color: "bg-green-600",   desc: "งานประเมินพนักงาน",                         emoji: "📊" },
    ],
  },
  safety: {
    title: "Safety Control",
    apps: [
      { name: "CMG Safety Management System", url: "https://cmgsafetydatabase.web.app/", icon: "fa-shield-halved",         color: "bg-emerald-600", desc: "ระบบจัดการความปลอดภัย CMG",                 emoji: "🦺" },
      { name: "JSA Work Method",              url: "https://jsa-work-method.web.app",    icon: "fa-clipboard-list",         color: "bg-sky-600",     desc: "วิเคราะห์ความปลอดภัยในการทำงาน (JSA)",     emoji: "📋" },
      { name: "Incident Report",              url: "#",                                  icon: "fa-triangle-exclamation",   color: "bg-yellow-600",  desc: "รายงานอุบัติเหตุและเหตุการณ์อันตราย",      emoji: "🚨" },
      { name: "Safety Checklist",             url: "#",                                  icon: "fa-list-check",             color: "bg-orange-500",  desc: "แบบตรวจความปลอดภัยหน้างาน",                emoji: "✅" },
      { name: "PPE Inventory",                url: "#",                                  icon: "fa-hard-hat",               color: "bg-yellow-700",  desc: "ระบบเบิกจ่ายอุปกรณ์ความปลอดภัย",           emoji: "🪖" },
      { name: "Root Cause Analysis: RCA",     url: "https://szx5qx.csb.app/",           icon: "fa-magnifying-glass-chart", color: "bg-red-600",     desc: "กระบวนการค้นหาสาเหตุหลักของปัญหา",         emoji: "🔎" },
    ],
  },
  workshop: {
    title: "CMG Workshop",
    apps: [
      { name: "Machine Maintenance", url: "#", icon: "fa-gears",             color: "bg-slate-700", desc: "ระบบแจ้งซ่อมและบำรุงรักษาเครื่องจักร", emoji: "⚙️" },
      { name: "Tools Inventory",     url: "#", icon: "fa-toolbox",           color: "bg-zinc-600",  desc: "ระบบจัดการคลังเครื่องมือและอุปกรณ์",   emoji: "🧰" },
      { name: "Workshop Schedule",   url: "#", icon: "fa-clock-rotate-left", color: "bg-blue-900",  desc: "ตารางเวลาการใช้งานโรงซ่อม",            emoji: "🕐" },
      { name: "Spare Parts Request", url: "#", icon: "fa-nut-bolt",          color: "bg-slate-800", desc: "ระบบเบิกจ่ายอะไหล่สำรอง",              emoji: "🔩" },
    ],
  },
  labour: {
    title: "CMG Labour Camp",
    apps: [
      { name: "Resident Registry", url: "#", icon: "fa-id-card-clip",    color: "bg-teal-600", desc: "ระบบลงทะเบียนและตรวจสอบรายชื่อผู้พักอาศัย", emoji: "🪪" },
      { name: "Room Allocation",   url: "#", icon: "fa-bed",             color: "bg-teal-500", desc: "ระบบจัดสรรห้องพักและสถานะความหนาแน่น",        emoji: "🛏️" },
      { name: "Utility Tracking",  url: "#", icon: "fa-droplet",         color: "bg-cyan-700", desc: "ระบบบันทึกค่าน้ำ-ค่าไฟในแคมป์ที่พัก",         emoji: "💧" },
      { name: "Camp Inspection",   url: "#", icon: "fa-clipboard-check", color: "bg-teal-700", desc: "แบบตรวจประเมินสุขอนามัยและความเรียบร้อย",      emoji: "🏕️" },
    ],
  },
  it: {
    title: "CMG Information Technology",
    apps: [
      { name: "IT Helpdesk",     url: "#",                        icon: "fa-headset",            color: "bg-blue-600",   desc: "ระบบแจ้งซ่อมคอมพิวเตอร์และอุปกรณ์ไอที", emoji: "🎧" },
      { name: "IT Asset",        url: "#",                        icon: "fa-desktop",            color: "bg-slate-600",  desc: "ระบบจัดการทรัพย์สินและอุปกรณ์ไอที",     emoji: "🖥️" },
      { name: "Network Status",  url: "#",                        icon: "fa-server",             color: "bg-green-600",  desc: "สถานะเครือข่ายและเซิร์ฟเวอร์บริษัท",   emoji: "🌐" },
      { name: "Software Center", url: "#",                        icon: "fa-download",           color: "bg-indigo-600", desc: "ดาวน์โหลดโปรแกรมและไดรเวอร์มาตรฐาน",   emoji: "⬇️" },
      { name: "Web App CMG",     url: "https://37fx3m.csb.app/", icon: "fa-wand-magic-sparkles", color: "bg-rose-600",   desc: "ระบบบริหารจัดการ Web App",               emoji: "✨" },
    ],
  },
  iso: {
    title: "ISO Management",
    apps: [
      { name: "ISO Document Control", url: "#", icon: "fa-file-shield",     color: "bg-emerald-700", desc: "ระบบควบคุมเอกสาร ISO",               emoji: "🛡️" },
      { name: "Internal Audit",       url: "#", icon: "fa-magnifying-glass", color: "bg-emerald-600", desc: "การตรวจสอบภายในระบบ ISO",            emoji: "🔍" },
      { name: "Corrective Action",    url: "#", icon: "fa-circle-check",    color: "bg-green-600",   desc: "ระบบการดำเนินการแก้ไข (CAR/PAR)",    emoji: "✅" },
      { name: "Management Review",    url: "#", icon: "fa-chart-bar",       color: "bg-teal-600",    desc: "การทบทวนของฝ่ายบริหาร",              emoji: "📊" },
    ],
  },
};
