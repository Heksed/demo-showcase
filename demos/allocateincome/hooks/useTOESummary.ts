"use client";

import { useMemo } from "react";
import type { MonthPeriod } from "../types";
type DefinitionType = 'eurotoe' | 'eurotoe6' | 'viikkotoe' | 'vuositulo' | 'ulkomaan';

type Params = {
  periods: MonthPeriod[];
  definitionType: DefinitionType;
  definitionOverride?: {start: string, end: string} | null;
  calculateTOEValue: (period: MonthPeriod) => number;
  calculateEffectiveIncomeTotal: (period: MonthPeriod) => number;
  isViikkoTOEPeriod: (period: MonthPeriod) => boolean;
  viikkoTOEVähennysSummat?: {[periodId: string]: number};
};

export default function useTOESummary({
  periods,
  definitionType,
  definitionOverride,
  calculateTOEValue,
  calculateEffectiveIncomeTotal,
  isViikkoTOEPeriod,
  viikkoTOEVähennysSummat = {},
}: Params) {
  const summary = useMemo(() => {
    const totalTOEMonthsCalc = periods.reduce((sum, period) => sum + calculateTOEValue(period), 0);
    const totalJakaja = periods.reduce((sum, period) => sum + period.jakaja, 0);

    const totalSalary = definitionType === 'viikkotoe' ?
      periods.filter(p => !p.viikkoTOERows || p.viikkoTOERows.length === 0).reduce((sum, p) => sum + calculateEffectiveIncomeTotal(p), 0) +
      periods.filter(p => p.viikkoTOERows && p.viikkoTOERows.length > 0).reduce((sum, p) => sum + p.palkka - (viikkoTOEVähennysSummat[p.id] || 0), 0) :
      periods.reduce((sum, period) => sum + calculateEffectiveIncomeTotal(period), 0);

    let averageSalary = 0;
    let dailySalary = 0;
    let definitionPeriod = '';
    let workingDaysTotal = 0;

    switch (definitionType) {
      case 'eurotoe': {
        averageSalary = periods.length > 0 ? totalSalary / periods.length : 0;
        dailySalary = averageSalary / 21.5;
        workingDaysTotal = totalJakaja;
        definitionPeriod = periods.length > 0 ? "01.01.2025 - 31.12.2025" : '';
        break;
      }
      case 'eurotoe6': {
        const last6Months = periods.slice(-6);
        const salary6Months = last6Months.reduce((sum, period) => sum + calculateEffectiveIncomeTotal(period), 0);
        const jakaja6Months = last6Months.reduce((sum, period) => sum + period.jakaja, 0);
        averageSalary = last6Months.length > 0 ? salary6Months / last6Months.length : 0;
        dailySalary = averageSalary / 21.5;
        workingDaysTotal = jakaja6Months;
        definitionPeriod = last6Months.length > 0 ? "01.07.2025 - 31.12.2025" : '';
        break;
      }
      case 'viikkotoe': {
        const euroTOEPeriods = periods.filter(p => !p.viikkoTOERows || p.viikkoTOERows.length === 0);
        const viikkoTOEPeriods = periods.filter(p => p.viikkoTOERows && p.viikkoTOERows.length > 0);

        const euroTOESalary = euroTOEPeriods.reduce((sum, p) => sum + calculateEffectiveIncomeTotal(p), 0);
        const viikkoTOESalary = viikkoTOEPeriods.reduce((sum, p) => sum + p.palkka, 0);
        void euroTOESalary; void viikkoTOESalary; // values not directly returned but useful for debugging

        averageSalary = periods.length > 0 ? totalSalary / periods.length : 0;
        dailySalary = averageSalary / 21.5;
        workingDaysTotal = totalJakaja;

        let collectedTOEMonths = 0;
        let monthsBack = 0;
        const completionDate = new Date('2025-12-15');

        while (collectedTOEMonths < 12 && monthsBack < 24) {
          const checkDate = new Date(completionDate);
          checkDate.setMonth(checkDate.getMonth() - monthsBack);
          const year = checkDate.getFullYear();
          const month = checkDate.getMonth() + 1;
          const periodId = `${year}-${String(month).padStart(2, '0')}`;

          const period = periods.find(p => p.id === periodId);
          if (period) {
            if (isViikkoTOEPeriod(period)) {
              collectedTOEMonths += period.toe;
            } else {
              collectedTOEMonths += calculateTOEValue(period);
            }
          }
          monthsBack++;
        }

        const reviewStartDate = new Date(completionDate);
        reviewStartDate.setMonth(reviewStartDate.getMonth() - monthsBack);
        const reviewStartStr = `${String(reviewStartDate.getDate()).padStart(2, '0')}.${String(reviewStartDate.getMonth() + 1).padStart(2, '0')}.${reviewStartDate.getFullYear()}`;
        const reviewEndStr = "15.12.2025";
        definitionPeriod = `${reviewStartStr} - ${reviewEndStr}`;
        break;
      }
      case 'vuositulo': {
        averageSalary = totalSalary;
        dailySalary = averageSalary / 365;
        workingDaysTotal = 365;
        definitionPeriod = periods.length > 0 ? "01.01.2025 - 31.12.2025" : '';
        break;
      }
      case 'ulkomaan': {
        averageSalary = periods.length > 0 ? totalSalary / periods.length : 0;
        dailySalary = averageSalary / 21.5;
        workingDaysTotal = totalJakaja;
        definitionPeriod = periods.length > 0 ? "01.01.2025 - 31.12.2025" : '';
        break;
      }
    }

    const telDeductionRate = 0.0354;
    const salaryAfterTelDeduction = averageSalary * (1 - telDeductionRate);
    const basicDailyAllowance = 37.21;
    const incomeThreshold = 3291;

    let unemploymentBenefit = 0;
    if (salaryAfterTelDeduction <= incomeThreshold) {
      unemploymentBenefit = salaryAfterTelDeduction * 0.45;
    } else {
      const firstPart = incomeThreshold * 0.45;
      const excessPart = (salaryAfterTelDeduction - incomeThreshold) * 0.20;
      unemploymentBenefit = firstPart + excessPart;
    }

    const unemploymentBenefitPerDay = unemploymentBenefit / 21.5;
    const fullDailyAllowance = basicDailyAllowance + unemploymentBenefitPerDay;

    const reviewPeriod = definitionType === 'viikkotoe' ? definitionPeriod : "01.01.2025 - 31.12.2025";
    const completionDate = periods.length > 0 ? "15.12.2025" : '';
    const extendingPeriods = periods.reduce((sum, period) => sum + period.pidennettavatJaksot, 0);

    return {
      totalTOEMonths: definitionType === 'viikkotoe'
        ? periods.filter(p => !p.viikkoTOERows || p.viikkoTOERows.length === 0).reduce((sum, p) => sum + calculateTOEValue(p), 0)
          + periods.filter(p => p.viikkoTOERows && p.viikkoTOERows.length > 0).reduce((sum, p) => sum + p.toe, 0)
        : totalTOEMonthsCalc,
      totalJakaja: workingDaysTotal,
      totalSalary,
      averageSalary,
      dailySalary,
      fullDailyAllowance,
      reviewPeriod,
      completionDate,
      definitionPeriod,
      extendingPeriods,
      definitionType,
      euroTOEMonths: definitionType === 'viikkotoe'
        ? periods.filter(p => !p.viikkoTOERows || p.viikkoTOERows.length === 0).reduce((sum, p) => sum + calculateTOEValue(p), 0)
        : 0,
      viikkoTOEMonths: definitionType === 'viikkotoe'
        ? periods.filter(p => p.viikkoTOERows && p.viikkoTOERows.length > 0).reduce((sum, p) => sum + p.toe, 0)
        : 0,
    } as any;
  }, [periods, definitionType, viikkoTOEVähennysSummat]);

  return summary;
}


