const SESSION_KEY = 'cmg_session_expires';
const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 ชั่วโมง

/** บันทึกเวลา session หมดอายุ (ปัจจุบัน + 1 ชั่วโมง) */
export function setSessionExpiry(): void {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  localStorage.setItem(SESSION_KEY, String(expiresAt));
}

/** ตรวจสอบว่า session หมดอายุแล้วหรือยัง */
export function isSessionExpired(): boolean {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return true;
  return Date.now() > Number(raw);
}

/** ลบ session ออก (ใช้ตอน logout) */
export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

/** คืนค่าเวลาที่ session จะหมดอายุ (Date object) หรือ null ถ้าไม่มี */
export function getSessionExpiresAt(): Date | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  return new Date(Number(raw));
}

/** คืนค่านาทีที่เหลือก่อน session หมด */
export function getRemainingMinutes(): number {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return 0;
  const remaining = Number(raw) - Date.now();
  return Math.max(0, Math.ceil(remaining / 60000));
}
