// Subsidy calculation utilities for palkkatuettu työ (subsidized work)
// These functions implement TYJ (Työttömyysturvalaki) rules for calculating
// correct TOE (työssäoloehto) months and wage base when subsidized work is involved.

import type { IncomeRow, SubsidyRule } from "../types";
import { parseFinnishDate } from "../utils";

/**
 * Rounds TOE months down to the nearest 0.5 according to TYJ rules.
 * Examples: 7.1 → 7.0, 7.6 → 7.5, 7.9 → 7.5, 7.5 → 7.5
 * 
 * @param value - TOE months value to round
 * @returns Rounded value (always 0, 0.5, 1.0, 1.5, etc.)
 */
export function roundToeMonthsDown(value: number): number {
  if (value === 0) return 0;
  const full = Math.floor(value);
  const decimal = value - full;
  if (decimal >= 0.5) {
    return full + 0.5;
  } else {
    return full;
  }
}

/**
 * Calculates unique months from subsidized income rows based on earning periods.
 * 
 * TYJ rule: Each unique YYYY-MM month within earning periods counts as one month.
 * The system counts how many unique months the subsidized income rows span,
 * which is used to determine how many months were incorrectly counted as TOE months.
 * 
 * Example:
 * - Row 1: ansaintaAika "1.10.2025 – 31.10.2025" → counts as 1 month (2025-10)
 * - Row 2: ansaintaAika "1.11.2025 – 30.11.2025" → counts as 1 month (2025-11)
 * - Row 3: ansaintaAika "1.10.2025 – 15.10.2025" → still counts as 1 month (2025-10, already counted)
 * Result: 2 unique months
 */
export function calcSubsidizedMonths(rows: IncomeRow[]): number {
  const months = new Set<string>();
  
  for (const row of rows) {
    if (!row.ansaintaAika || row.ansaintaAika.trim() === "") {
      continue;
    }
    
    // Parse "1.10.2025 – 31.10.2025" format (note: uses en dash, not hyphen)
    const parts = row.ansaintaAika.split(/[–-]/).map(s => s.trim());
    if (parts.length !== 2) {
      continue;
    }
    
    const [startStr, endStr] = parts;
    const start = parseFinnishDate(startStr);
    const end = parseFinnishDate(endStr);
    
    if (!start || !end) {
      continue;
    }
    
    // Iterate through all months between start and end (inclusive)
    // We need to include both the start month and end month
    const current = new Date(start);
    current.setDate(1); // Start from first day of month to avoid day overflow issues
    
    const endDate = new Date(end);
    endDate.setDate(1); // Also set to first day for comparison
    
    while (current <= endDate) {
      const year = current.getFullYear();
      const month = current.getMonth() + 1; // getMonth() returns 0-11
      const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
      months.add(yearMonth);
      
      // Move to next month
      current.setMonth(current.getMonth() + 1);
    }
  }
  
  return months.size;
}

/**
 * Calculates correct TOE months from subsidized work based on TYJ rules.
 * 
 * TYJ rules for subsidized work:
 * - NO_TOE_EXTENDS: 0 months (subsidized work doesn't accrue TOE, only extends reference period)
 * - PERCENT_75: 75% of months (all subsidized months counted at 75%, rule for work started before 2.9.2024)
 * - LOCK_10_MONTHS_THEN_75: First 10 months = 0, then 75% of remaining months (exception rule)
 * - NONE: 100% of months (normal work, no subsidy rules apply)
 * 
 * @param months - Number of unique months from subsidized income rows
 * @param rule - Subsidy rule to apply
 * @returns Correct TOE months according to the rule
 */
export function calcCorrectToeFromSubsidy(months: number, rule: SubsidyRule): number {
  switch (rule) {
    case "NO_TOE_EXTENDS":
      // Subsidized work doesn't accrue TOE months, only extends the reference period
      return 0;
      
    case "PERCENT_75":
      // All subsidized months are counted at 75%
      return months * 0.75;
      
    case "LOCK_10_MONTHS_THEN_75": {
      // First 10 months don't count, then 75% of remaining months
      const eligibleMonths = Math.max(months - 10, 0);
      return eligibleMonths * 0.75;
    }
    
    case "NONE":
    default:
      // Normal work, no subsidy rules, counts as full months
      return months;
  }
}

/**
 * Calculates accepted portion of subsidized gross income for wage base calculation.
 * 
 * TYJ rule: Only a portion of subsidized income is used in wage base calculation.
 * - NO_TOE_EXTENDS: 0% (subsidized income is not used in wage base at all)
 * - PERCENT_75: 75% of gross income is used
 * - LOCK_10_MONTHS_THEN_75: 75% of gross income is used (same as PERCENT_75 for wage base)
 * - NONE: 100% of gross income is used (normal work)
 * 
 * @param gross - Total gross amount from subsidized income rows
 * @param rule - Subsidy rule to apply
 * @returns Accepted portion of gross income for wage base calculation
 */
export function calcAcceptedSubsidizedForWage(gross: number, rule: SubsidyRule): number {
  switch (rule) {
    case "NO_TOE_EXTENDS":
      // Subsidized income is not used in wage base calculation
      return 0;
      
    case "PERCENT_75":
    case "LOCK_10_MONTHS_THEN_75":
      // 75% of subsidized income is used in wage base
      return gross * 0.75;
      
    case "NONE":
    default:
      // Normal work, full gross income is used
      return gross;
  }
}

/**
 * Calculates the complete subsidy correction including TOE and wage base corrections.
 * 
 * This is the main function that combines all calculations:
 * 1. Counts unique months from subsidized rows
 * 2. Calculates correct TOE months based on rule
 * 3. Calculates TOE correction (difference from system calculation)
 * 4. Calculates accepted portion of gross income for wage base
 * 5. Calculates TOE-palkka (totalSalary) correction
 * 6. Calculates perustepalkka/kk (averageSalary) correction from corrected totalSalary
 * 
 * @param rows - Selected subsidized income rows
 * @param rule - Subsidy rule to apply
 * @param toeSystemTotal - Total TOE months as calculated by the system (before correction)
 * @param systemTotalSalary - Total salary (TOE-palkka) as calculated by the system (before correction)
 * @param periodCount - Number of periods used in calculation
 * @returns Complete correction data
 */
export function calculateSubsidyCorrection(
  rows: IncomeRow[],
  rule: SubsidyRule,
  toeSystemTotal: number,
  systemTotalSalary: number,
  periodCount: number
): {
  subsidizedMonthsCounted: number;
  subsidizedGrossTotal: number;
  correctToeFromSubsidy: number;
  toeCorrection: number;
  toeCorrectedTotal: number;
  acceptedForWage: number;
  totalSalaryCorrected: number;
  totalSalaryCorrection: number;
  averageSalaryCorrected: number;
  averageSalaryCorrection: number;
} {
  // Step 1: Calculate unique months from subsidized rows
  const subsidizedMonthsCounted = calcSubsidizedMonths(rows);
  
  // Step 2: Calculate total gross amount from subsidized rows
  const subsidizedGrossTotal = rows.reduce((sum, row) => sum + (row.palkka || 0), 0);
  
  // Step 3: Calculate correct TOE months from subsidized work
  const correctToeFromSubsidyRaw = calcCorrectToeFromSubsidy(subsidizedMonthsCounted, rule);
  // Round down to nearest 0.5 according to TYJ rules
  const correctToeFromSubsidy = roundToeMonthsDown(correctToeFromSubsidyRaw);
  
  // Step 4: Calculate TOE correction
  // The system counted subsidizedMonthsCounted as full months, but correct is correctToeFromSubsidy
  // Correction is the difference (usually negative)
  const toeCorrection = correctToeFromSubsidy - subsidizedMonthsCounted;
  
  // Step 5: Calculate corrected TOE total and round down to nearest 0.5
  const toeCorrectedTotalRaw = toeSystemTotal + toeCorrection;
  const toeCorrectedTotal = roundToeMonthsDown(toeCorrectedTotalRaw);
  
  // Step 6: Calculate accepted portion of subsidized gross for wage base
  const acceptedForWage = calcAcceptedSubsidizedForWage(subsidizedGrossTotal, rule);
  
  // Step 7: Calculate corrected TOE-palkka (totalSalary)
  // Remove full subsidized gross, add back only accepted portion
  const totalSalaryCorrected = systemTotalSalary - subsidizedGrossTotal + acceptedForWage;
  const totalSalaryCorrection = totalSalaryCorrected - systemTotalSalary;
  
  // Step 8: Calculate corrected perustepalkka/kk (averageSalary)
  // This is calculated from corrected totalSalary
  const systemAverageSalary = periodCount > 0 ? systemTotalSalary / periodCount : 0;
  const averageSalaryCorrected = periodCount > 0 ? totalSalaryCorrected / periodCount : 0;
  const averageSalaryCorrection = averageSalaryCorrected - systemAverageSalary;
  
  return {
    subsidizedMonthsCounted,
    subsidizedGrossTotal,
    correctToeFromSubsidy,
    toeCorrection,
    toeCorrectedTotal,
    acceptedForWage,
    totalSalaryCorrected,
    totalSalaryCorrection,
    averageSalaryCorrected,
    averageSalaryCorrection,
  };
}

