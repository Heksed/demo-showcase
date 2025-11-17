import type { DailyPaymentRow, PaymentSummary } from "../types";
import type { MonthPeriod, IncomeRow } from "../../allocateincome/types";

// Constants from allocateincome
const NON_BENEFIT_AFFECTING_INCOME_TYPES = [
  "Kokouspalkkio",
  "Luentopalkkio",
];

// Helper: check if date is business day
function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6; // Not Sunday or Saturday
}

// Helper: check if row is deleted
function isRowDeleted(row: IncomeRow): boolean {
  return row.huom?.toLowerCase().includes("poistettu") || false;
}

// Helper: calculate effective income total from period (same logic as allocateincome)
function calculateEffectiveIncomeTotal(period: MonthPeriod): number {
  return period.rows
    .filter(row => 
      !isRowDeleted(row) &&
      (!NON_BENEFIT_AFFECTING_INCOME_TYPES.includes(row.tulolaji) || 
       row.huom?.includes("Huomioitu laskennassa"))
    )
    .reduce((sum, row) => sum + row.palkka, 0);
}

// Helper: calculate average monthly salary from TOE periods (for base salary calculation)
// This is the salary used for daily allowance calculation, not individual period income
// Uses 12 months of TOE periods to calculate base salary (eurotoe calculation)
// Base salary from allocate income: 3120,83 €/kk (12 months average)
function calculateTOEAverageSalary(periods: MonthPeriod[]): number {
  if (periods.length === 0) return 3120.83; // Default base salary from allocate income
  
  // Filter to only periods with TOE data (toe > 0) or with income data
  // In allocate income, TOE uses last 12 months of data for base salary
  const toePeriods = periods.filter(p => {
    const effectiveIncome = calculateEffectiveIncomeTotal(p);
    return p.toe > 0 || effectiveIncome > 0;
  });
  
  if (toePeriods.length === 0) {
    // If no TOE periods, use default base salary from allocate income
    return 3120.83;
  }
  
  // Take up to 12 months (same logic as allocate income eurotoe)
  const last12Months = toePeriods.slice(0, 12);
  
  // Sum all effective income totals from TOE periods
  const totalSalary = last12Months.reduce((sum, period) => {
    const effectiveIncome = calculateEffectiveIncomeTotal(period);
    return sum + effectiveIncome;
  }, 0);
  
  // Average monthly salary from TOE periods (same logic as useTOESummary with 'eurotoe')
  // If we have less than 12 months, use what we have
  const avgSalary = last12Months.length > 0 ? totalSalary / last12Months.length : 3120.83;
  
  // Use default if calculated average is 0 or very small
  return avgSalary > 0 ? avgSalary : 3120.83;
}

// Helper: format date for decision type display
function formatDecisionType(
  stepLabel: string | undefined,
  expenseCompensation: number,
  decisionCode: string = "M000"
): string {
  if (stepLabel && stepLabel.includes("Porrastus")) {
    return `${stepLabel} (${decisionCode})`;
  }
  
  if (expenseCompensation > 0) {
    return `Myöntöpäätös + kulukorvaus (${decisionCode}+kk)`;
  }
  
  return `Myöntöpäätös (${decisionCode})`;
}

// Internal type for single-day rows before grouping
type SingleDayRow = {
  date: string;
  note?: string;
  dailyAllowance: number; // Täysi päiväraha (fullDaily) - näytetään taulukossa
  fullDaily: number; // Täysi päiväraha ennen tulosovittelua
  paidDays: number;
  decisionValidFrom: string;
  decisionValidTo?: string;
  decisionType: string;
  expenseCompensation: number;
  basePart: number;
  earningsPart: number;
  stepFactor: number;
  stepLabel?: string;
  taxWithholding: number;
  memberFee: number;
  gross: number; // adjustedDaily (täysi päiväraha miinus tulosovittelu)
  net: number;
};

/**
 * Muuntaa allocateincome-periodit päiväkohtaisiksi maksuriveiksi
 * Käyttää allocateincome-sivun tietoja päivärahan laskentaan
 * Palauttaa yksittäiset päivät ennen niputtamista
 */
function calculateDailyPaymentsFromPeriodsRaw(
  periods: MonthPeriod[],
  toePeriods: MonthPeriod[],
  taxPct: number = 25,
  memberFeePct: number = 1.5,
  expenseCompensationPerDay: number = 9
): SingleDayRow[] {
  const rows: SingleDayRow[] = [];
  let priorPaidDays = 0;
  let cumulativePaidDays = 0;

  // Calculate base salary from TOE periods (average monthly salary)
  // This is used for daily allowance calculation, not individual period income
  // Base salary comes from 12-month TOE average (eurotoe calculation)
  // Use toePeriods (12 months) for average, not just the payment periods
  // If toePeriods is empty, fall back to using payment periods for TOE calculation
  const periodsForTOE = toePeriods.length > 0 ? toePeriods : periods;
  const baseSalary = calculateTOEAverageSalary(periodsForTOE);
  
  // Base salary should be ~3120.83 €/month (from allocate income)
  // This is used to calculate fullDaily allowance (100.22 €/day)

  // Käy läpi jokainen period
  periods.forEach((period, periodIndex) => {
    if (!period || !period.id) return;
    
    // Parse period dates (assuming format "2025-12" from period.id)
    const periodMonth = period.id.split('-')[1]; // e.g. "12" from "2025-12"
    const periodYear = parseInt(period.id.split('-')[0]); // e.g. 2025
    
    if (!periodMonth || isNaN(periodYear)) {
      console.warn(`Invalid period format: ${period.id}`);
      return;
    }
    
    const month = parseInt(periodMonth);
    if (isNaN(month) || month < 1 || month > 12) {
      console.warn(`Invalid month in period: ${period.id}`);
      return;
    }
    
    // Calculate days in month
    const daysInMonth = new Date(periodYear, month, 0).getDate();
    
    // Use period's jakaja (working days) for calculations
    const periodDays = period.jakaja || 21.5;
    
    // Income adjustment from period (for tulosovittelu only)
    // Period income (e.g., December 2025) is used ONLY for income adjustment, NOT for base salary
    // Base salary comes from 12-month TOE average, not from individual payment period
    const incomeTotal = calculateEffectiveIncomeTotal(period);
    
    
    // Käy läpi jokainen päivä kuukaudessa
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(periodYear, month - 1, day);
      const dateStr = date.toISOString().slice(0, 10);
      
      // Skip weekends - add "Ei maksua" row for weekends
      if (!isBusinessDay(date)) {
        rows.push({
          date: dateStr,
          note: "",
          dailyAllowance: 0,
          fullDaily: 0,
          paidDays: 0,
          decisionValidFrom: dateStr,
          decisionType: "Ei maksua",
          expenseCompensation: 0,
          basePart: 0,
          earningsPart: 0,
          stepFactor: 1.0,
          taxWithholding: 0,
          memberFee: 0,
          gross: 0,
          net: 0,
        });
        continue;
      }
      
      // Calculate step factor based on cumulative days
      const dayInSequence = cumulativePaidDays + 1;
      let stepFactor = 1.0;
      let stepLabel = "Ei porrastusta";
      
      if (dayInSequence >= 170) {
        stepFactor = 0.75;
        stepLabel = "Porrastus 75%";
      } else if (dayInSequence >= 40) {
        stepFactor = 0.80;
        stepLabel = "Porrastus 80%";
      }
      
      // Calculate daily allowance using simplified formula
      // Real system would use full allowance calculator logic
      const DAILY_BASE = 37.21;
      const STAT_DEDUCTIONS = 0.0354;
      const SPLIT_POINT_MONTH = 3534.95;
      
      const dailySalary = (baseSalary * (1 - STAT_DEDUCTIONS)) / periodDays;
      const splitDaily = SPLIT_POINT_MONTH / periodDays;
      
      const below = Math.max(Math.min(dailySalary, splitDaily) - DAILY_BASE, 0);
      const above = Math.max(dailySalary - splitDaily, 0);
      
      const earningsPartRaw = 0.45 * below + 0.20 * above;
      const earningsPart = earningsPartRaw * stepFactor;
      const fullDaily = DAILY_BASE + earningsPart;
      
      // Income adjustment from December 2025 income (for tulosovittelu)
      // This reduces the daily allowance based on income in the payment period
      // December income does NOT affect base salary calculation (which uses 12-month TOE average)
      const incomeAdjustment = incomeTotal > 0 ? (incomeTotal * 0.5) / periodDays : 0;
      const adjustedDaily = Math.max(0, fullDaily - incomeAdjustment);
      
      // Debug: Log December 2025 calculation values
      if (day === 1 && period.id === "2025-12") {
        console.log(`December 2025 calculation:`, {
          baseSalary: baseSalary.toFixed(2),
          fullDaily: fullDaily.toFixed(2),
          incomeTotal: incomeTotal.toFixed(2),
          incomeAdjustment: incomeAdjustment.toFixed(2),
          adjustedDaily: adjustedDaily.toFixed(2),
          periodDays
        });
      }
      
      // Calculate tax and fees from adjusted daily allowance
      // Gross = adjustedDaily * paidDays (will be summed per period)
      const gross = adjustedDaily;
      const taxWithholding = gross * (taxPct / 100);
      const memberFeeAmount = gross * (memberFeePct / 100);
      const net = gross - taxWithholding - memberFeeAmount;
      
      // Expense compensation (simplified - could be conditional based on actual data)
      const expenseCompensation = expenseCompensationPerDay; // Could be conditional
      
      // Decision type
      const decisionType = formatDecisionType(
        stepLabel !== "Ei porrastusta" ? stepLabel : undefined,
        expenseCompensation,
        "M000"
      );
      
      rows.push({
        date: dateStr,
        note: "",
        dailyAllowance: adjustedDaily, // Näytetään soviteltu päiväraha taulukossa (adjustedDaily, ei fullDaily)
        fullDaily: fullDaily, // Täysi päiväraha ennen tulosovittelua
        paidDays: 1,
        decisionValidFrom: dateStr,
        decisionType: decisionType,
        expenseCompensation: expenseCompensation,
        basePart: DAILY_BASE,
        earningsPart: earningsPart,
        stepFactor: stepFactor,
        stepLabel: stepLabel !== "Ei porrastusta" ? stepLabel : undefined,
        taxWithholding: taxWithholding,
        memberFee: memberFeeAmount,
        gross: gross, // adjustedDaily (täysi päiväraha miinus tulosovittelu)
        net: net,
      });
      
      cumulativePaidDays++;
    }
    
    priorPaidDays += cumulativePaidDays;
  });
  
  return rows;
}

/**
 * Niputtaa päiväkohtaiset rivit jaksoiksi
 * Peräkkäiset päivät joissa maksetut päivät > 0 niputetaan yhteen jaksoksi
 * Peräkkäiset päivät joissa maksetut päivät = 0 niputetaan yhteen jaksoksi
 * Jakso katkeaa kun tulee eri tyyppinen jakso (maksu vs ei maksua)
 */
function groupSingleDayRowsIntoPeriods(singleDayRows: SingleDayRow[]): DailyPaymentRow[] {
  if (singleDayRows.length === 0) return [];
  
  const periods: DailyPaymentRow[] = [];
  let currentPeriod: DailyPaymentRow | null = null;
  let periodIdCounter = 1;
  
  // Helper to check if two rows should be in the same period
  // Same period if both have paidDays > 0 OR both have paidDays = 0
  const shouldGroup = (row1: SingleDayRow, row2: SingleDayRow): boolean => {
    const row1HasPayment = row1.paidDays > 0;
    const row2HasPayment = row2.paidDays > 0;
    return row1HasPayment === row2HasPayment;
  };
  
  singleDayRows.forEach((row, index) => {
    // Check if this row should continue the current period
    const shouldContinuePeriod = currentPeriod && shouldGroup(
      { paidDays: currentPeriod.paidDays } as SingleDayRow,
      row
    );
    
    if (shouldContinuePeriod && currentPeriod) {
      // Extend current period
      currentPeriod.periodEnd = row.date;
      currentPeriod.paidDays += row.paidDays;
      currentPeriod.totalDays += 1; // Count all days including weekends
      currentPeriod.gross += row.gross;
      currentPeriod.net += row.net;
      currentPeriod.taxWithholding += row.taxWithholding;
      currentPeriod.memberFee += row.memberFee;
      currentPeriod.expenseCompensation += row.expenseCompensation;
      
      // Recalculate daily allowance: soviteltu päiväraha (adjustedDaily) per paid day
      // Käytetään gross summaa (adjustedDaily summa), ei fullDaily summaa
      // Gross summa on jo laskettu yllä (currentPeriod.gross += row.gross), joten päivitetään vain dailyAllowance
      if (currentPeriod.paidDays > 0) {
        // Päivitetään dailyAllowance gross-summasta (keskimääräinen adjustedDaily)
        currentPeriod.dailyAllowance = currentPeriod.gross / currentPeriod.paidDays;
        // Säilytetään fullDaily summa erillisenä (ei näytetä taulukossa)
        const currentFullDailySum = (currentPeriod.fullDailySum || 0);
        const newFullDailySum = currentFullDailySum + row.fullDaily;
        currentPeriod.fullDailySum = newFullDailySum;
      } else {
        currentPeriod.dailyAllowance = 0;
        currentPeriod.fullDailySum = 0;
      }
    } else {
      // Start new period
      if (currentPeriod) {
        // Remove fullDailySum before adding to periods (it's not in DailyPaymentRow type)
        const { fullDailySum, ...periodWithoutTemp } = currentPeriod;
        periods.push(periodWithoutTemp);
      }
      
      currentPeriod = {
        id: `period-${periodIdCounter++}`,
        periodStart: row.date,
        periodEnd: row.date,
        note: row.note,
        dailyAllowance: row.paidDays > 0 ? row.dailyAllowance : 0, // Näytetään soviteltu päiväraha (adjustedDaily)
        fullDailySum: row.paidDays > 0 ? row.fullDaily : 0, // Alustetaan fullDaily summa
        paidDays: row.paidDays,
        totalDays: 1,
        decisionValidFrom: row.decisionValidFrom,
        decisionValidTo: row.decisionValidTo,
        decisionType: row.decisionType,
        expenseCompensation: row.expenseCompensation,
        basePart: row.basePart,
        earningsPart: row.earningsPart,
        stepFactor: row.stepFactor,
        stepLabel: row.stepLabel,
        taxWithholding: row.taxWithholding,
        memberFee: row.memberFee,
        gross: row.gross,
        net: row.net,
      };
    }
  });
  
  // Don't forget the last period
  if (currentPeriod) {
    // Remove fullDailySum before adding to periods (it's not in DailyPaymentRow type)
    const { fullDailySum, ...periodWithoutTemp } = currentPeriod;
    periods.push(periodWithoutTemp);
  }
  
  return periods;
}

/**
 * Muuntaa allocateincome-periodit niputetuiksi jaksoiksi
 * Ensin luodaan päiväkohtaiset rivit, sitten niputetaan jaksoiksi
 * Käyttää allocateincome-sivun tietoja (periodin palkka ja jakaja)
 * 
 * @param periods Periodit joille lasketaan maksut (yleensä yksi kuukausi)
 * @param toePeriods Periodit TOE-perustepalkan laskentaan (useita kuukausia)
 */
export function calculateDailyPaymentsFromPeriods(
  periods: MonthPeriod[],
  toePeriods: MonthPeriod[],
  taxPct: number = 25,
  memberFeePct: number = 1.5,
  expenseCompensationPerDay: number = 9
): DailyPaymentRow[] {
  // First calculate daily rows (raw)
  // Use toePeriods for base salary calculation, but only periods for actual payment calculation
  const dailyRows = calculateDailyPaymentsFromPeriodsRaw(
    periods,
    toePeriods, // Pass TOE periods for average salary
    taxPct,
    memberFeePct,
    expenseCompensationPerDay
  );
  
  // Group into periods
  return groupSingleDayRowsIntoPeriods(dailyRows);
}

/**
 * Laskee yhteenvedon päiväkohtaisista riveistä
 */
export function calculateSummary(rows: DailyPaymentRow[]): PaymentSummary {
  const totalGross = rows.reduce((sum, row) => sum + row.gross, 0);
  const totalTaxWithholding = rows.reduce((sum, row) => sum + row.taxWithholding, 0);
  const totalPaidDays = rows.reduce((sum, row) => sum + row.paidDays, 0);
  const totalExpenseCompensation = rows.reduce((sum, row) => sum + row.expenseCompensation, 0);
  const expenseCompensationDays = rows.filter(row => row.expenseCompensation > 0).reduce((sum, row) => sum + row.totalDays, 0);
  const totalRecoveries = 0; // TODO: Calculate from recovery data
  const totalPayable = rows.reduce((sum, row) => sum + row.net + row.expenseCompensation, 0) - totalRecoveries;
  
  return {
    totalGross,
    totalTaxWithholding,
    totalPaidDays,
    totalExpenseCompensation,
    expenseCompensationDays,
    totalRecoveries,
    totalPayable,
  };
}

