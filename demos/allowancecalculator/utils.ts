// ===============================
// Helper: dates & math
// ===============================

export function isBusinessDay(d: Date): boolean {
  const day = d.getDay(); // 0=Sun,6=Sat
  return day !== 0 && day !== 6;
}

export function businessDaysBetween(startISO: string, endISO: string): number {
  // counts business days from start (inclusive) to end (exclusive)
  const start = new Date(startISO);
  const end = new Date(endISO);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return 0;
  let count = 0;
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);
  while (cur < endDate) {
    if (isBusinessDay(cur)) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export function addDaysISO(iso: string, n: number): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export function calculateBusinessDate(startDate: string, businessDaysOffset: number): string {
  const start = new Date(startDate);
  let dayCount = 0;
  let currentDate = new Date(start);
  
  while (dayCount < businessDaysOffset) {
    currentDate.setDate(currentDate.getDate() + 1);
    if (isBusinessDay(currentDate)) {
      dayCount++;
    }
  }
  
  return currentDate.toISOString().slice(0, 10);
}

export function calculateDateByCumulativePaidDays(startDate: string, cumulativePaidDays: number): string {
  const start = new Date(startDate);
  let paidDayCount = 0;
  let currentDate = new Date(start);
  
  while (paidDayCount < cumulativePaidDays) {
    if (isBusinessDay(currentDate)) {
      paidDayCount++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return currentDate.toISOString().slice(0, 10);
}

export function euro(n: number): string {
  return n.toLocaleString("fi-FI", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

