// Shared utility functions for Allocate Income demo

export function formatCurrency(n: number): string {
  return n.toLocaleString("fi-FI", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function parseFinnishDate(s?: string | null): Date | null {
  if (!s) return null;
  const parts = String(s).trim().split(".").filter(Boolean);
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts.map((p) => parseInt(p, 10));
  if (!yyyy || !mm || !dd) return null;
  const d = new Date(yyyy, mm - 1, dd);
  return isNaN(d.getTime()) ? null : d;
}

export function isoToFI(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}.${month}.${year}`;
}

export function parseDate(dateStr: string): Date {
  const parts = dateStr.split(".");
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date();
}

export function formatDateFI(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

export function getFinnishMonthName(monthNum: number): string {
  const months = [
    "Tammikuu", "Helmikuu", "Maaliskuu", "Huhtikuu",
    "Toukokuu", "Kesäkuu", "Heinäkuu", "Elokuu",
    "Syyskuu", "Lokakuu", "Marraskuu", "Joulukuu",
  ];
  return months[Math.max(0, Math.min(11, monthNum - 1))] || "";
}

export function daysBetween(start: Date, end: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((end.getTime() - start.getTime()) / oneDay) + 1;
}

export function splitByMonths(startDate: Date, endDate: Date): Array<{ year: number; month: number; start: Date; end: Date; days: number }> {
  const result: Array<{ year: number; month: number; start: Date; end: Date; days: number }> = [];
  let current = new Date(startDate);
  current.setDate(1);
  const last = new Date(endDate);
  last.setDate(1);
  while (current <= last) {
    const year = current.getFullYear();
    const month = current.getMonth() + 1;
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    const days = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    result.push({ year, month, start, end, days });
    current.setMonth(current.getMonth() + 1);
  }
  return result;
}

export function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function formatDateISO(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// ---- Allocation helpers ----
import type { Direction, MonthSplit, IncomeRow, MonthPeriod } from "./types";

export function distributeByDays(
  totalAmount: number,
  splits: Array<{ year: number; month: number; start: Date; end: Date; days: number }>,
  direction: Direction
): MonthSplit[] {
  const totalDays = splits.reduce((sum, s) => sum + s.days, 0);
  const rawSplits = splits.map(s => ({ ...s, rawAmount: (totalAmount * s.days) / totalDays }));
  const roundedSplits = rawSplits.map(s => ({ ...s, amount: roundToCents(s.rawAmount), remainder: s.rawAmount - roundToCents(s.rawAmount) }));
  const totalRounded = roundedSplits.reduce((sum, s) => sum + s.amount, 0);
  const totalRemainder = Math.round((totalAmount - totalRounded) * 100);
  const sorted = [...roundedSplits].sort((a, b) => {
    const diff = b.remainder - a.remainder;
    if (Math.abs(diff) > 0.0001) return diff;
    return direction === "forward" ? splits.indexOf(a as any) - splits.indexOf(b as any) : splits.indexOf(b as any) - splits.indexOf(a as any);
  });
  for (let i = 0; i < totalRemainder; i++) sorted[i].amount += 0.01;
  return splits.map(s => {
    const found = sorted.find(rs => rs.year === s.year && rs.month === s.month);
    return { year: s.year, month: s.month, earningStart: formatDateISO(s.start), earningEnd: formatDateISO(s.end), amount: found?.amount ?? 0 };
  });
}

export function distributeEqualMonths(
  totalAmount: number,
  splits: Array<{ year: number; month: number; start: Date; end: Date; days: number }>,
  direction: Direction
): MonthSplit[] {
  const monthCount = splits.length;
  const baseAmount = roundToCents(totalAmount / monthCount);
  const totalBase = baseAmount * monthCount;
  const remainder = Math.round((totalAmount - totalBase) * 100);
  return splits.map((s, idx) => {
    let amount = baseAmount;
    if (direction === "forward" && idx < remainder) amount += 0.01;
    else if (direction === "backward" && idx >= monthCount - remainder) amount += 0.01;
    const firstDay = new Date(s.year, s.month - 1, 1);
    const lastDay = new Date(s.year, s.month, 0);
    return { year: s.year, month: s.month, earningStart: formatDateISO(firstDay), earningEnd: formatDateISO(lastDay), amount };
  });
}


// ---- Table helpers ----
export function getVisibleRows(period: MonthPeriod): IncomeRow[] {
  // Preserve insertion order so split child rows appear right after their parent
  return period.rows;
}



