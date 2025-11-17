// ===============================
// Domain: Allowance calculation functions
// ===============================

import {
  DAILY_BASE,
  SPLIT_POINT_MONTH,
  STAT_DEDUCTIONS,
  DAYS_BY_PERIOD,
  type PeriodKey,
} from "../constants";

export function toDailyWage(monthlyGross: number, periodDays = 21.5): number {
  const afterDeductions = monthlyGross * (1 - STAT_DEDUCTIONS);
  return afterDeductions / periodDays;
}

export function earningsPartFromDaily(
  dailyWage: number,
  splitPointMonth = SPLIT_POINT_MONTH,
  periodDays = 21.5
): number {
  const splitDaily = splitPointMonth / periodDays;
  const baseDiffAt45 = Math.max(Math.min(dailyWage, splitDaily) - DAILY_BASE, 0);
  const aboveSplit = Math.max(dailyWage - splitDaily, 0);
  return 0.45 * baseDiffAt45 + 0.20 * aboveSplit;
}

export function stepFactorByCumulativeDays(cumulativeDays: number): {
  factor: number;
  label: string;
} {
  if (cumulativeDays >= 170) return { factor: 0.75, label: "Porrastus 75%" } as const;
  if (cumulativeDays >= 40) return { factor: 0.80, label: "Porrastus 80%" } as const;
  return { factor: 1.0, label: "Ei porrastusta" } as const;
}

export function computePerDayReduction(incomesTotal: number, period: string): number {
  if (!period) return 0; // ei sovittelua
  const pd = DAYS_BY_PERIOD[period as PeriodKey];
  if (!pd) return 0;
  return (incomesTotal * 0.5) / pd; // 50% / jakson pv
}

// Calculates full daily allowance €/day from monthly salary using same formulas as basic calculation
export function fullDailyFromMonthlyBaseUsingConfig(
  monthlyBase: number,
  periodDays: number,
  cfg: {
    dailyBase: number;
    splitPointMonth: number;
    statDeductions: number;
    rateBelow: number;
    rateAbove: number;
  },
  baseOnlyW: boolean,
  stepFactor: number
): number {
  const dailySalary = (monthlyBase * (1 - cfg.statDeductions)) / (periodDays || 21.5);
  const splitDaily = cfg.splitPointMonth / (periodDays || 21.5);
  const below = Math.max(Math.min(dailySalary, splitDaily) - cfg.dailyBase, 0);
  const above = Math.max(dailySalary - splitDaily, 0);
  const earningsPartRaw = baseOnlyW ? 0 : (cfg.rateBelow * below + cfg.rateAbove * above);
  const earningsPart = earningsPartRaw * stepFactor;
  return cfg.dailyBase + earningsPart;
}

