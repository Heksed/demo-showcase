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
  if (!isoDate || isoDate === "") return "";
  const parts = isoDate.split('-');
  if (parts.length !== 3) return "";
  const [year, month, day] = parts;
  // Varmista että vuosi on oikea (ei päivä)
  if (year.length !== 4 || parseInt(year) < 1900 || parseInt(year) > 2100) {
    console.error("Invalid year in isoToFI:", isoDate);
    return "";
  }
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

// Palauttaa nykyisen ajan muodossa "DD.MM.YYYY HH:mm"
export function getCurrentTimestamp(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

/**
 * Calculates working days (Mon-Fri) between two dates
 * For example: 1.10 - 5.10 = 3 days (1=Tue, 5=Sat, so Tue-Thu = 3 days)
 */
export function getWorkingDaysInPeriod(startDate: Date, endDate: Date): number {
  let workingDays = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  while (current <= end) {
    const dayOfWeek = current.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }
  return workingDays;
}

/**
 * Calculates working days in a month period
 * Splits by weeks and calculates working days for each partial/full week
 */
export function getWorkingDaysInMonthPeriod(year: number, month: number, startDate: Date, endDate: Date): number {
  let workingDays = 0;
  const current = new Date(Math.max(startDate.getTime(), new Date(year, month - 1, 1).getTime()));
  const end = new Date(Math.min(endDate.getTime(), new Date(year, month, 0).getTime()));
  
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }
  return workingDays;
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

/**
 * Distributes income by working days method
 * Used for Tulospalkkio and Bonus income types
 * 
 * Formula:
 * 1. Calculate daily rate: totalAmount / totalWorkingDays in earning period
 * 2. For each month: dailyRate * workingDaysInMonth
 * 3. Ensure rounding adjustment so total = original amount
 */
export function distributeByWorkingDays(
  totalAmount: number,
  earningStartDate: Date,
  earningEndDate: Date,
  splits: Array<{ year: number; month: number; start: Date; end: Date; days: number }>,
  direction: Direction
): MonthSplit[] {
  // Check if earning period is <= 1 month
  const earningDays = Math.floor((earningEndDate.getTime() - earningStartDate.getTime()) / (24 * 60 * 60 * 1000));
  
  // If earning period is <= 31 days, allocate to payment date month only
  if (earningDays <= 31 && splits.length > 0) {
    const firstSplit = splits[0];
    const totalWorkingDays = getWorkingDaysInMonthPeriod(
      firstSplit.year, 
      firstSplit.month, 
      new Date(Math.max(earningStartDate.getTime(), new Date(firstSplit.year, firstSplit.month - 1, 1).getTime())),
      new Date(Math.min(earningEndDate.getTime(), new Date(firstSplit.year, firstSplit.month, 0).getTime()))
    );
    
    if (totalWorkingDays === 0) return [];
    
    const dailyRate = totalAmount / totalWorkingDays;
    const adjustedAmount = roundToCents(dailyRate * totalWorkingDays);
    
    return [{
      year: firstSplit.year,
      month: firstSplit.month,
      earningStart: formatDateISO(earningStartDate),
      earningEnd: formatDateISO(earningEndDate),
      amount: adjustedAmount
    }];
  }
  
  // Normal case: multi-month allocation by working days
  
  // 1. Calculate total working days in earning period
  const totalWorkingDays = getWorkingDaysInPeriod(earningStartDate, earningEndDate);
  if (totalWorkingDays === 0) {
    return [];
  }
  
  // 2. Calculate working days per month
  const monthWorkingDays = splits.map(s => {
    const monthStart = new Date(Math.max(earningStartDate.getTime(), s.start.getTime()));
    const monthEnd = new Date(Math.min(earningEndDate.getTime(), s.end.getTime()));
    return {
      ...s,
      workingDays: getWorkingDaysInMonthPeriod(s.year, s.month, monthStart, monthEnd)
    };
  });
  
  const totalMonthWorkingDays = monthWorkingDays.reduce((sum, s) => sum + s.workingDays, 0);
  
  // 3. Calculate daily rate
  const dailyRate = totalAmount / totalWorkingDays;
  
  // 4. Calculate raw amounts per month
  const rawSplits = monthWorkingDays.map(s => ({
    ...s,
    rawAmount: dailyRate * s.workingDays
  }));
  
  // 5. Round to cents and calculate remainder for rounding adjustment
  const roundedSplits = rawSplits.map(s => ({
    ...s,
    amount: roundToCents(s.rawAmount),
    remainder: s.rawAmount - roundToCents(s.rawAmount)
  }));
  
  const totalRounded = roundedSplits.reduce((sum, s) => sum + s.amount, 0);
  const totalRemainder = Math.round((totalAmount - totalRounded) * 100);
  
  // 6. Distribute remainder
  const sorted = [...roundedSplits].sort((a, b) => {
    const diff = b.remainder - a.remainder;
    if (Math.abs(diff) > 0.0001) return diff;
    return direction === "forward" ? splits.indexOf(a as any) - splits.indexOf(b as any) : splits.indexOf(b as any) - splits.indexOf(a as any);
  });
  
  for (let i = 0; i < totalRemainder; i++) {
    sorted[i].amount += 0.01;
  }
  
  // 7. Return final splits
  return splits.map(s => {
    const found = sorted.find(rs => rs.year === s.year && rs.month === s.month);
    return {
      year: s.year,
      month: s.month,
      earningStart: formatDateISO(s.start),
      earningEnd: formatDateISO(s.end),
      amount: found?.amount ?? 0
    };
  });
}


// ---- Table helpers ----
export function getVisibleRows(period: MonthPeriod): IncomeRow[] {
  // Preserve insertion order so split child rows appear right after their parent
  return period.rows;
}



