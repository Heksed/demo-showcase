import type { MonthPeriod } from "../types";

export function calculateTOEValueFromSalary(totalSalary: number): number {
  if (totalSalary >= 930) return 1.0; // Täysi kuukausi
  if (totalSalary >= 465) return 0.5; // Puolikas kuukausi
  return 0.0; // Ei kuukautta
}


