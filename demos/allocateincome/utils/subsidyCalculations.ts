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
 * Calculates gross income only from months that accrue TOE.
 * 
 * For LOCK_10_MONTHS_THEN_75: Only months after the 10th month accrue TOE,
 * so only those months' gross income should be used for wage base calculation.
 * 
 * Note: This function assumes that by the time wage base is calculated,
 * all months in the rows are already TOE-accruing months (after 10-month lock).
 * Wage base is calculated only after 12 months TOE is fulfilled, so at that point
 * all months in the calculation are TOE-accruing months.
 * 
 * @param rows - Subsidized income rows
 * @param rule - Subsidy rule to apply
 * @returns Gross income from TOE-accruing months only
 */
function calcGrossFromToeAccruingMonths(rows: IncomeRow[], rule: SubsidyRule): number {
  switch (rule) {
    case "NO_TOE_EXTENDS":
      // No months accrue TOE, so no gross income is used
      return 0;
      
    case "PERCENT_75":
      // All months accrue TOE (at 75%), so all gross income is used
      return rows.reduce((sum, row) => sum + (row.palkka || 0), 0);
      
    case "LOCK_10_MONTHS_THEN_75": {
      // TÄRKEÄ: Tämä funktio saa vain palkkatuetut rivit (rows-parametri)
      // Normaalityön palkat otetaan mukaan normaalisti systemTotalSalary-muuttujassa
      // Tässä poistetaan vain ensimmäiset 10 palkkatuettua kuukautta palkanmäärittelystä
      // Vain 11. kuukaudesta eteenpäin otetaan mukaan palkanmäärittelyyn
      
      // Kerää kaikki yksilölliset kuukaudet palkkatuettujen rivien perusteella
      const monthRows = new Map<string, IncomeRow[]>();
      
      for (const row of rows) {
        // Käytä ansaintaAikaa jos saatavilla, muuten maksupaivaa
        let dateStr = row.ansaintaAika;
        if (!dateStr || dateStr.trim() === "") {
          dateStr = row.maksupaiva;
        }
        
        if (!dateStr || dateStr.trim() === "") {
          continue;
        }
        
        // Parsitaan päivämäärä
        let date: Date | null = null;
        if (row.ansaintaAika && row.ansaintaAika.includes("–")) {
          // Jos on ansaintaAika muodossa "1.10.2025 – 31.10.2025", käytä alkupäivää
          const parts = row.ansaintaAika.split(/[–-]/).map(s => s.trim());
          if (parts.length === 2) {
            date = parseFinnishDate(parts[0]);
          }
        } else {
          // Muuten käytä maksupaivaa
          date = parseFinnishDate(dateStr);
        }
        
        if (!date) continue;
        
        // Muodosta kuukausiavain (YYYY-MM)
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
        
        if (!monthRows.has(yearMonth)) {
          monthRows.set(yearMonth, []);
        }
        monthRows.get(yearMonth)!.push(row);
      }
      
      // Järjestä kuukaudet aikajärjestykseen (vanhin ensin)
      const sortedMonths = Array.from(monthRows.keys()).sort();
      
      // Poista ensimmäiset 10 palkkatuettua kuukautta
      // Vain 11. kuukaudesta eteenpäin otetaan mukaan palkanmäärittelyyn
      const toeAccruingMonths = sortedMonths.slice(10);
      
      // Laske palkat vain TOE-kerryttävien kuukausien palkkatuettujen rivien perusteella
      let totalGross = 0;
      for (const month of toeAccruingMonths) {
        const monthRowsList = monthRows.get(month) || [];
        for (const row of monthRowsList) {
          totalGross += row.palkka || 0;
        }
      }
      
      return totalGross;
    }
    
    case "NONE":
    default:
      // Normal work, all months accrue TOE, so all gross income is used
      return rows.reduce((sum, row) => sum + (row.palkka || 0), 0);
  }
}

/**
 * Calculates accepted portion of subsidized gross income for wage base calculation.
 * 
 * TYJ rule: Only a portion of subsidized income from TOE-accruing months is used in wage base calculation.
 * - NO_TOE_EXTENDS: 0% (no months accrue TOE, so no income is used)
 * - PERCENT_75: 75% of gross income from all months (all accrue TOE at 75%)
 * - LOCK_10_MONTHS_THEN_75: 75% of gross income from months that accrue TOE (months 11+)
 * - NONE: 100% of gross income (normal work, all months accrue TOE)
 * 
 * Important: Palkanmääritys tehdään vasta sitten kun 12kk työssäoloehtoa on saatu täyteen,
 * eli sillä laskennalla ei ole merkitystä siinä vaiheessa kun TOE vielä kertyy.
 * Tämän takia LOCK_10_MONTHS_THEN_75 -säännössä kaikki kuukaudet ovat jo TOE-kerryttäviä.
 * 
 * @param rows - Subsidized income rows
 * @param rule - Subsidy rule to apply
 * @returns Accepted portion of gross income for wage base calculation
 */
export function calcAcceptedSubsidizedForWage(rows: IncomeRow[], rule: SubsidyRule): number {
  // First, get gross income only from TOE-accruing months
  const grossFromToeAccruingMonths = calcGrossFromToeAccruingMonths(rows, rule);
  
  switch (rule) {
    case "NO_TOE_EXTENDS":
      // No months accrue TOE, so no income is used in wage base
      return 0;
      
    case "PERCENT_75":
      // 75% of gross income from TOE-accruing months
      return grossFromToeAccruingMonths * 0.75;
      
    case "LOCK_10_MONTHS_THEN_75":
      // 75% of gross income from TOE-accruing months (months 11+)
      return grossFromToeAccruingMonths * 0.75;
      
    case "NONE":
    default:
      // Normal work, full gross income from TOE-accruing months
      return grossFromToeAccruingMonths;
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
  
  // Step 2: Calculate total gross amount from subsidized rows that accrue TOE
  // TÄRKEÄ: Laske vain niiden palkkatuettujen rivien palkat, jotka osallistuvat TOE-laskentaan
  // Tämä on sama kuin calcGrossFromToeAccruingMonths, joka palauttaa vain TOE-kerryttävien kuukausien palkat
  const subsidizedGrossFromToeAccruingMonths = calcGrossFromToeAccruingMonths(rows, rule);
  
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
  // Only use gross income from months that accrue TOE
  const acceptedForWage = calcAcceptedSubsidizedForWage(rows, rule);
  
  // TÄRKEÄ: subsidizedGrossTotal näytetään UI:ssa, joten se pitäisi näyttää vain TOE-laskentaan osallistuvien kuukausien palkat
  // Jos palkkatuettua työtä ei ole mukana TOE-laskentaan, näytetään 0
  const subsidizedGrossTotal = correctToeFromSubsidy > 0 
    ? subsidizedGrossFromToeAccruingMonths 
    : 0;
  
  // Step 7: Calculate corrected TOE-palkka (totalSalary)
  // IMPORTANT: Palkanmääritys lasketaan vasta kun TOE on vähintään 12kk
  // Mikäli palkkatukityö pelkästään tai yhdessä toisen työn kanssa kerryttää alle 12kk työssäoloehtoa,
  // ei tarvitse laskea palkanmäärittelyä. Vasta kun Työssäoloehto 12kk täyttyy lasketaan palkanmääritys.
  const shouldCalculateWageBase = toeCorrectedTotal >= 12;
  
  let totalSalaryCorrected: number;
  let totalSalaryCorrection: number;
  let averageSalaryCorrected: number;
  let averageSalaryCorrection: number;
  
  if (shouldCalculateWageBase) {
    // TÄRKEÄ: Vähennä vain niiden palkkatuettujen työn palkat, jotka osallistuvat TOE-laskentaan
    // Jos palkkatuettua työtä ei ole mukana TOE-laskentaan (esim. TOE täyttyy normaalityöstä),
    // niin ei vähennetä mitään palkkatuettua työtä palkanmäärittelystä
    
    // Jos palkkatuettua työtä ei ole mukana TOE-laskentaan (correctToeFromSubsidy = 0),
    // niin ei vähennetä mitään palkkatuettua työtä palkanmäärittelystä
    if (correctToeFromSubsidy === 0) {
      // Palkkatuettua työtä ei ole mukana TOE-laskentaan, joten ei vähennetä mitään
      totalSalaryCorrected = systemTotalSalary;
      totalSalaryCorrection = 0;
    } else {
      // Palkkatuettua työtä on mukana TOE-laskentaan, joten vähennetään vain TOE-kerryttävien kuukausien palkat
      // Remove subsidized gross from TOE-accruing months, add back only accepted portion
      totalSalaryCorrected = systemTotalSalary - subsidizedGrossFromToeAccruingMonths + acceptedForWage;
      totalSalaryCorrection = totalSalaryCorrected - systemTotalSalary;
    }
    
    // Step 8: Calculate corrected perustepalkka/kk (averageSalary)
    // This is calculated from corrected totalSalary
    const systemAverageSalary = periodCount > 0 ? systemTotalSalary / periodCount : 0;
    averageSalaryCorrected = periodCount > 0 ? totalSalaryCorrected / periodCount : 0;
    averageSalaryCorrection = averageSalaryCorrected - systemAverageSalary;
  } else {
    // TOE < 12kk: Do not calculate wage base corrections
    // Keep system values unchanged
    totalSalaryCorrected = systemTotalSalary;
    totalSalaryCorrection = 0;
    const systemAverageSalary = periodCount > 0 ? systemTotalSalary / periodCount : 0;
    averageSalaryCorrected = systemAverageSalary;
    averageSalaryCorrection = 0;
  }
  
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

