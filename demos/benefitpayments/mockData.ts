import type { PaidBenefitPeriod, DailyPaymentRow } from "./types";
import { MOCK_PERIODS } from "../allocateincome/mockData";
import { calculateDailyPaymentsFromPeriods } from "./utils/calculatePayments";
import type { MonthPeriod } from "../allocateincome/types";

// Helper to calculate effective income (same logic as in calculatePayments)
// Note: This duplicates logic but needed for filtering in mockData
function calculateEffectiveIncomeTotal(period: MonthPeriod): number {
  if (!period || !period.rows || period.rows.length === 0) return 0;
  
  const NON_BENEFIT_AFFECTING_INCOME_TYPES = ["Kokouspalkkio", "Luentopalkkio"];
  
  return period.rows
    .filter(row => {
      if (!row) return false;
      const isDeleted = row.huom?.toLowerCase().includes("poistettu");
      const isNonAffecting = NON_BENEFIT_AFFECTING_INCOME_TYPES.includes(row.tulolaji);
      const isIncluded = row.huom?.includes("Huomioitu laskennassa");
      
      return !isDeleted && (!isNonAffecting || isIncluded);
    })
    .reduce((sum, row) => sum + (row.palkka || 0), 0);
}

// Mock data maksetuille etuusjaksoille
// Tämä simuloitu data yhdistää päivärahalaskurin ja allocate income -tiedot
export const MOCK_PAID_PERIODS: PaidBenefitPeriod[] = [
  {
    id: "paid-2025-12",
    periodStart: "2025-12-01",
    periodEnd: "2025-12-31",
    businessDays: 22,
    dailyAllowance: 45.50,
    gross: 1001.00,
    net: 751.25,
    taxPct: 25,
    memberFeePct: 1.5,
    baseSalary: 2030.61,
    incomeData: [
      {
        id: "1",
        maksupaiva: "10.12.2025",
        tulolaji: "Aikapalkka",
        palkka: 2100,
        alkuperainenTulo: 2100,
        ansaintaAika: "1.12.2025 - 31.12.2025",
        tyonantaja: "Posti Oyj",
      },
    ],
    priorPaidDays: 238.5,
    stepFactor: 0.75,
    toeMonths: 12,
    toeSalary: 2030.61,
    toeFulfillmentDate: "2024-12-15",
    paidDate: "2026-01-15",
    paymentReference: "MAKS-2026-001",
    sourceAllocationPeriods: ["2025-12"],
    sourceCalculationSnapshot: {
      calcDate: "2025-12-01",
      period: "1m",
      benefitType: "ansioturva",
      maxDays: 400,
      priorPaidDays: 238.5,
    },
  },
  {
    id: "paid-2025-11",
    periodStart: "2025-11-01",
    periodEnd: "2025-11-30",
    businessDays: 21,
    dailyAllowance: 46.20,
    gross: 970.20,
    net: 727.65,
    taxPct: 25,
    memberFeePct: 1.5,
    baseSalary: 2030.61,
    incomeData: [
      {
        id: "2",
        maksupaiva: "10.11.2025",
        tulolaji: "Aikapalkka",
        palkka: 2000,
        alkuperainenTulo: 2000,
        ansaintaAika: "1.11.2025 - 30.11.2025",
        tyonantaja: "Posti Oyj",
      },
    ],
    priorPaidDays: 217.5,
    stepFactor: 0.75,
    toeMonths: 11,
    toeSalary: 2030.61,
    toeFulfillmentDate: "2024-12-15",
    paidDate: "2025-12-15",
    paymentReference: "MAKS-2025-045",
    sourceAllocationPeriods: ["2025-11"],
    sourceCalculationSnapshot: {
      calcDate: "2025-11-01",
      period: "1m",
      benefitType: "ansioturva",
      maxDays: 400,
      priorPaidDays: 217.5,
    },
  },
  {
    id: "paid-2025-10",
    periodStart: "2025-10-01",
    periodEnd: "2025-10-31",
    businessDays: 23,
    dailyAllowance: 47.80,
    gross: 1099.40,
    net: 824.55,
    taxPct: 25,
    memberFeePct: 1.5,
    baseSalary: 2030.61,
    incomeData: [
      {
        id: "3",
        maksupaiva: "10.10.2025",
        tulolaji: "Aikapalkka",
        palkka: 200,
        alkuperainenTulo: 200,
        ansaintaAika: "1.10.2025 - 31.10.2025",
        tyonantaja: "Posti Oyj",
      },
    ],
    priorPaidDays: 194.5,
    stepFactor: 0.75,
    toeMonths: 10,
    toeSalary: 2030.61,
    toeFulfillmentDate: "2024-12-15",
    paidDate: "2025-11-15",
    paymentReference: "MAKS-2025-044",
    sourceAllocationPeriods: ["2025-10"],
    sourceCalculationSnapshot: {
      calcDate: "2025-10-01",
      period: "1m",
      benefitType: "ansioturva",
      maxDays: 400,
      priorPaidDays: 194.5,
    },
  },
  {
    id: "paid-2025-09",
    periodStart: "2025-09-01",
    periodEnd: "2025-09-30",
    businessDays: 22,
    dailyAllowance: 48.50,
    gross: 1067.00,
    net: 800.25,
    taxPct: 25,
    memberFeePct: 1.5,
    baseSalary: 2030.61,
    incomeData: [
      {
        id: "4",
        maksupaiva: "10.9.2025",
        tulolaji: "Aikapalkka",
        palkka: 150,
        alkuperainenTulo: 150,
        ansaintaAika: "1.9.2025 - 30.9.2025",
        tyonantaja: "Posti Oyj",
      },
    ],
    priorPaidDays: 172.5,
    stepFactor: 0.75,
    toeMonths: 9,
    toeSalary: 2030.61,
    toeFulfillmentDate: "2024-12-15",
    paidDate: "2025-10-15",
    paymentReference: "MAKS-2025-043",
    sourceAllocationPeriods: ["2025-09"],
    sourceCalculationSnapshot: {
      calcDate: "2025-09-01",
      period: "1m",
      benefitType: "ansioturva",
      maxDays: 400,
      priorPaidDays: 172.5,
    },
  },
];

// Generate daily payment rows from allocateincome periods
// This simulates the integration with allocateincome data
// Calculate only ONE month's payment for the table (December 2025)
// But use all periods for TOE average salary calculation
const december2025Period = MOCK_PERIODS.find(p => p.id === "2025-12");

// For TOE average salary, use all available periods (at least the ones with TOE data)
// Base salary is calculated from 12 months of TOE periods (eurotoe calculation)
// December 2025 income is NOT used for base salary, only for income adjustment
// Use all 2025 periods that have TOE data or income data (for 12-month average)
const toeCalculationPeriods = MOCK_PERIODS.filter(p => {
  const year = parseInt(p.id.split('-')[0]);
  const month = parseInt(p.id.split('-')[1]);
  // Use periods from 2025 that have TOE data (toe > 0) or have income data
  // These will be used to calculate the 12-month average base salary
  const effectiveIncome = calculateEffectiveIncomeTotal(p);
  return year === 2025 && (p.toe > 0 || effectiveIncome > 0);
}).slice(0, 12); // Take up to 12 months for TOE calculation

// For payment table, calculate only one month (December 2025)
// Expected brutto: 1759,41
const periodsForPaymentTable = december2025Period ? [december2025Period] : [];

export const MOCK_DAILY_PAYMENT_ROWS: DailyPaymentRow[] = 
  calculateDailyPaymentsFromPeriods(
    periodsForPaymentTable,
    toeCalculationPeriods, // Pass TOE periods separately for average salary calculation
    25, // Tax %
    1.5, // Member fee %
    9 // Expense compensation per day
  );
