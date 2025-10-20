import type { MonthPeriod, IncomeRow } from "../types";

export function isRowDeleted(row: IncomeRow): boolean {
  return row.huom?.toLowerCase().includes("poistettu") || false;
}

export function calculateEffectiveIncomeTotal(
  period: MonthPeriod,
  nonAffectingTypes: string[]
): number {
  return period.rows
    .filter(row =>
      !isRowDeleted(row) &&
      (!nonAffectingTypes.includes(row.tulolaji) || row.huom?.includes("Huomioitu laskennassa"))
    )
    .reduce((sum, row) => sum + row.palkka, 0);
}


