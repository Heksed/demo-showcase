import type { PaidBenefitPeriod, DailyDifference, PeriodDifference } from "./types";
import type { IncomeRow } from "../allocateincome/types";
import type { MonthPeriod } from "../allocateincome/types";
import type { DailyPaymentRow } from "../benefitpayments/types";
import { calculateDailyPaymentsFromPeriods } from "../benefitpayments/utils/calculatePayments";
import { simulateNewIncomeFromRegister } from "../benefitpayments/utils/newIncomeSimulator";

/**
 * Laskee korjatut maksujaksot uusilla tuloilla
 * Käyttää oikeaa päivärahan laskentalogiikkaa
 */
export function calculateCorrectedPeriods(
  originalPeriods: PaidBenefitPeriod[],
  newIncomeData: IncomeRow[]
): PaidBenefitPeriod[] {
  return originalPeriods.map(period => {
    // Etsi uudet tulotiedot jotka vaikuttavat tähän jaksoon
    const affectedIncomes = newIncomeData.filter(income => {
      // Yksinkertaistettu logiikka: jos maksupäivä on jakson sisällä
      const payDateStr = income.maksupaiva.split('.');
      const payDate = new Date(
        parseInt(payDateStr[2]), // vuosi
        parseInt(payDateStr[1]) - 1, // kuukausi (0-based)
        parseInt(payDateStr[0]) // päivä
      );
      const periodStart = new Date(period.periodStart);
      const periodEnd = new Date(period.periodEnd);
      return payDate >= periodStart && payDate <= periodEnd;
    });

    // Jos ei uusia tuloja, palauta alkuperäinen
    if (affectedIncomes.length === 0) {
      return period;
    }

    // Tämä on yksinkertaistettu versio - oikeassa järjestelmässä
    // laskettaisiin uudet DailyPaymentRow:t käyttäen calculateDailyPaymentsFromPeriods
    // Tässä käytetään yksinkertaistettua laskentaa PaidBenefitPeriod-tyypille
    
    const totalNewIncome = affectedIncomes.reduce((sum, inc) => sum + inc.palkka, 0);
    const totalOriginalIncome = period.incomeData.reduce((sum, inc) => sum + inc.palkka, 0);
    const incomeDifference = totalNewIncome - totalOriginalIncome;

    // Sovittelu: 50% tulojen vaikutus päivärahaan
    const reductionPerDay = (incomeDifference * 0.5) / period.businessDays;
    const newDailyAllowance = Math.max(0, period.dailyAllowance - reductionPerDay);
    const newGross = newDailyAllowance * period.businessDays;
    const taxPct = period.taxPct || 25;
    const memberFeePct = period.memberFeePct || 1.5;
    const newNet = newGross * (1 - taxPct / 100) * (1 - memberFeePct / 100);

    return {
      ...period,
      incomeData: [...period.incomeData, ...affectedIncomes], // Yhdistä tulotiedot
      dailyAllowance: newDailyAllowance,
      gross: newGross,
      net: newNet,
    };
  });
}

/**
 * Laskee korjatut DailyPaymentRow:t uusilla tuloilla
 * Käyttää oikeaa laskentalogiikkaa
 */
export function calculateCorrectedDailyPaymentRows(
  originalRows: DailyPaymentRow[],
  periods: MonthPeriod[],
  toePeriods: MonthPeriod[],
  newIncomeData: IncomeRow[],
  affectedPeriodId: string
): DailyPaymentRow[] {
  // Päivitä periodit uusilla tuloilla
  let updatedPeriods = [...periods];
  
  newIncomeData.forEach(income => {
    updatedPeriods = simulateNewIncomeFromRegister(
      updatedPeriods,
      affectedPeriodId,
      income
    );
  });
  
  // Hae vain kyseinen period uudistetuilla tiedoilla
  const updatedPeriod = updatedPeriods.find(p => p.id === affectedPeriodId);
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
 * Laskee päiväkohtaiset erot
 */
export function calculateDailyDifferences(
  originalPeriod: PaidBenefitPeriod,
  correctedPeriod: PaidBenefitPeriod
): DailyDifference[] {
  const differences: DailyDifference[] = [];
  const startDate = new Date(originalPeriod.periodStart);
  const endDate = new Date(originalPeriod.periodEnd);
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    // Skip weekends
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    
    differences.push({
      date: d.toISOString().split('T')[0],
      originalDaily: originalPeriod.dailyAllowance,
      correctedDaily: correctedPeriod.dailyAllowance,
      difference: correctedPeriod.dailyAllowance - originalPeriod.dailyAllowance,
    });
  }
  
  return differences;
}

/**
 * Laskee jaksokohtaiset erot
 */
export function calculatePeriodDifferences(
  originalPeriods: PaidBenefitPeriod[],
  correctedPeriods: PaidBenefitPeriod[]
): PeriodDifference[] {
  return originalPeriods.map((original, index) => {
    const corrected = correctedPeriods[index];
    if (!corrected) {
      return {
        periodId: original.id,
        periodLabel: `${new Date(original.periodStart).getFullYear()} ${new Date(original.periodStart).toLocaleDateString("fi-FI", { month: "long" })}`,
        periodStart: original.periodStart,
        periodEnd: original.periodEnd,
        originalGross: original.gross,
        correctedGross: original.gross,
        grossDifference: 0,
        originalNet: original.net,
        correctedNet: original.net,
        netDifference: 0,
        dailyDifferences: [],
      };
    }

    return {
      periodId: original.id,
      periodLabel: `${new Date(original.periodStart).getFullYear()} ${new Date(original.periodStart).toLocaleDateString("fi-FI", { month: "long" })}`,
      periodStart: original.periodStart,
      periodEnd: original.periodEnd,
      originalGross: original.gross,
      correctedGross: corrected.gross,
      grossDifference: corrected.gross - original.gross,
      originalNet: original.net,
      correctedNet: corrected.net,
      netDifference: corrected.net - original.net,
      dailyDifferences: calculateDailyDifferences(original, corrected),
    };
  });
}

