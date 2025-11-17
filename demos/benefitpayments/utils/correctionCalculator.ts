import type { DailyPaymentRow } from "../types";
import type { MonthPeriod } from "../../allocateincome/types";
import { calculateDailyPaymentsFromPeriods } from "./calculatePayments";
import { simulateNewIncomeFromRegister } from "./newIncomeSimulator";
import type { IncomeRow } from "../../allocateincome/types";

/**
 * Laskee korjatut maksurivit uusilla tuloilla
 * Käyttää samaa laskentalogiikkaa kuin alkuperäinen maksutaulukko
 */
export function calculateCorrectedPaymentRows(
  originalRows: DailyPaymentRow[],
  periods: MonthPeriod[],
  toePeriods: MonthPeriod[],
  newIncomeData: IncomeRow[],
  periodId: string // Period jonka maksut halutaan laskea uudelleen
): DailyPaymentRow[] {
  // Päivitä periodit uusilla tuloilla
  const updatedPeriods = simulateNewIncomeFromRegister(
    periods,
    periodId,
    newIncomeData[0] // Käytetään ensimmäistä uutta tulotietoa
  );
  
  // Hae vain kyseinen period uudistetuilla tiedoilla
  const updatedPeriod = updatedPeriods.find(p => p.id === periodId);
  if (!updatedPeriod) return originalRows;
  
  // Laske uudet maksurivit (käyttää samaa logiikkaa kuin alkuperäinen)
  const correctedRows = calculateDailyPaymentsFromPeriods(
    [updatedPeriod],
    toePeriods,
    25, // Tax %
    1.5, // Member fee %
    9 // Expense compensation per day
  );
  
  return correctedRows;
}

/**
 * Vertaa alkuperäisiä ja korjattuja maksurivejä
 * 
 * Takaisinperintä: jos maksettiin liikaa (originalGross > correctedGross)
 * - Suuremmat tulot = suurempi tulosovittelu = pienempi päiväraha = maksettiin liikaa = takaisinperintä
 * - Pienemmät tulot = pienempi tulosovittelu = suurempi päiväraha = maksettiin liian vähän = lisämaksu
 */
export function comparePaymentRows(
  originalRows: DailyPaymentRow[],
  correctedRows: DailyPaymentRow[]
): {
  totalGrossDifference: number;
  totalNetDifference: number;
  totalRecoveryGross: number;
  totalRecoveryNet: number;
} {
  const originalGross = originalRows.reduce((sum, row) => sum + row.gross, 0);
  const correctedGross = correctedRows.reduce((sum, row) => sum + row.gross, 0);
  const originalNet = originalRows.reduce((sum, row) => sum + row.net, 0);
  const correctedNet = correctedRows.reduce((sum, row) => sum + row.net, 0);
  
  // Ero: positiivinen = lisämaksu, negatiivinen = takaisinperintä
  const grossDifference = correctedGross - originalGross;
  const netDifference = correctedNet - originalNet;
  
  // Takaisinperintä = jos maksettiin liikaa (originalGross > correctedGross)
  // Eli suuremmat tulot → suurempi tulosovittelu → pienempi päiväraha → maksettiin liikaa
  return {
    totalGrossDifference: grossDifference,
    totalNetDifference: netDifference,
    totalRecoveryGross: originalGross > correctedGross ? originalGross - correctedGross : 0,
    totalRecoveryNet: originalNet > correctedNet ? originalNet - correctedNet : 0,
  };
}

