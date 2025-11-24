// ===============================
// Hook: Comparison calculation
// ===============================

import { useMemo } from "react";
import type { FormulaConfig } from "../types";
import { clamp, roundToCents, calculateDateByCumulativePaidDays } from "../utils";

interface ComparisonParams {
  compareMode: boolean;
  comparePaidDays: number | null;
  compareDailyManual: number;
  comparisonSalary: number;
  baseSalary: number;
  taxPct: number;
  memberFeePct: number;
  formulaConfig: FormulaConfig;
  flags: {
    baseOnlyW: boolean;
  };
  results: {
    periodDays: number;
    stepFactor: number;
    perDayReductionBenefits: number;
    perDayReductionIncome: number;
    travelAllowanceTotal: number;
    days: number;
    priorPaidDays: number;
  };
  periodStartDate: string;
  stepFactorOverride: string;
}

export default function useComparisonCalculation(params: ComparisonParams) {
  const {
    compareMode,
    comparePaidDays,
    compareDailyManual,
    comparisonSalary,
    baseSalary,
    taxPct,
    memberFeePct,
    formulaConfig,
    flags,
    results,
    periodStartDate,
    stepFactorOverride,
  } = params;

  const resultsCompare = useMemo(() => {
    if (!compareMode) return null;

    // ✨ 2.1 Päivät vertailussa — käytä vertailun omaa arvoa, jos annettu
    const cmpDays = comparePaidDays ?? results.days;

    // ✨ 2.2 Täysi pv vertailussa: manuaali voittaa, muuten lasketaan kuten perus
    let cmpFullDaily = 0;
    if (compareDailyManual > 0) {
      cmpFullDaily = compareDailyManual;
    } else {
      const pd = results.periodDays || 21.5;
      // Käytä vertailupalkkaa jos se on annettu, muuten käytä peruslaskennan perustepalkkaa
      const cmpBaseSalary = comparisonSalary > 0 ? comparisonSalary : baseSalary;
      const dailySalaryCmp =
        (cmpBaseSalary * (1 - formulaConfig.statDeductions)) / pd;
      const splitDaily = formulaConfig.splitPointMonth / pd;
      const below = Math.max(
        Math.min(dailySalaryCmp, splitDaily) - formulaConfig.dailyBase,
        0
      );
      const above = Math.max(dailySalaryCmp - splitDaily, 0);
      const earningsPartRawCmp = flags.baseOnlyW
        ? 0
        : formulaConfig.rateBelow * below + formulaConfig.rateAbove * above;
      const earningsPartCmp = earningsPartRawCmp * results.stepFactor; // sama porrastuksen kerroin
      cmpFullDaily = formulaConfig.dailyBase + earningsPartCmp;
    }

    // ✨ 2.3 Per-pv vähennykset — sama logiikka kuin peruslaskennassa
    const perDayReductionCmp =
      (results.perDayReductionBenefits ?? 0) +
      (results.perDayReductionIncome ?? 0);

    const cmpAdjustedDaily = clamp(
      cmpFullDaily - perDayReductionCmp,
      0,
      cmpFullDaily
    );

    // ✨ 2.4 Kulutussuhde + ekvivalentit täydet päivät (riippuu cmpDays-muuttujasta)
    const cmpConsumptionRatio =
      cmpFullDaily > 0 ? cmpAdjustedDaily / cmpFullDaily : 0;
    const cmpFullDaysEquivalent = cmpConsumptionRatio * cmpDays;

    // ✨ 2.5 Jakson summat – KAIKKI käyttävät cmpDays-arvoa
    const cmpGross = roundToCents(cmpAdjustedDaily * cmpDays);
    const cmpWithholding = roundToCents(cmpGross * (taxPct / 100));
    const cmpMemberFee = roundToCents((memberFeePct / 100) * cmpGross);
    const cmpNet = roundToCents(cmpGross - cmpWithholding - cmpMemberFee);
    const cmpTotal = roundToCents(
      cmpNet + results.travelAllowanceTotal
    ); // kulukorvaus/ pv samana

    // ✨ 2.6 Porrastusajanjaksot vertailulaskennassa
    const stepFactorByCumulativeDaysCfg = (dayInPeriod: number) => {
      if (dayInPeriod > formulaConfig.step2Threshold)
        return {
          factor: formulaConfig.step2Factor,
          label: `Porrastus ${Math.round(formulaConfig.step2Factor * 100)}%`,
        } as const;
      if (dayInPeriod > formulaConfig.step1Threshold)
        return {
          factor: formulaConfig.step1Factor,
          label: `Porrastus ${Math.round(formulaConfig.step1Factor * 100)}%`,
        } as const;
      return { factor: 1.0, label: "Ei porrastusta" } as const;
    };

    const cmpStepPeriods = (() => {
      if (stepFactorOverride && stepFactorOverride !== "auto") {
        return null; // Ei näytetä kun override on käytössä
      }

      const periods: Array<{
        factor: number;
        percentage: number;
        days: number;
        startDay: number;
        endDay: number;
        amount: number;
        dailyAmount: number;
        startDate: string;
        endDate: string;
      }> = [];
      let currentFactor: number | null = null;
      let currentStart = 1;
      let currentDays = 0;
      let currentAmount = 0;

      for (let i = 0; i < cmpDays; i++) {
        const dayInPeriod = i + 1; // Jakson sisäinen päivä (1, 2, 3, ...)
        const { factor } = stepFactorByCumulativeDaysCfg(dayInPeriod);
        const dailyAmount = cmpAdjustedDaily * factor;

        if (currentFactor !== factor) {
          // Tallenna edellinen jakso
          if (currentFactor !== null) {
            periods.push({
              factor: currentFactor,
              percentage: Math.round(currentFactor * 100),
              days: currentDays,
              startDay: currentStart,
              endDay: currentStart + currentDays - 1,
              amount: roundToCents(currentAmount),
              dailyAmount: roundToCents(cmpAdjustedDaily * currentFactor),
              startDate: calculateDateByCumulativePaidDays(
                periodStartDate,
                results.priorPaidDays + currentStart
              ),
              endDate: calculateDateByCumulativePaidDays(
                periodStartDate,
                results.priorPaidDays + currentStart + currentDays - 1
              ),
            });
          }

          // Aloita uusi jakso
          currentFactor = factor;
          currentStart = i + 1;
          currentDays = 1;
          currentAmount = dailyAmount;
        } else {
          currentDays++;
          currentAmount += dailyAmount;
        }
      }

      // Tallenna viimeinen jakso
      if (currentFactor !== null) {
        periods.push({
          factor: currentFactor,
          percentage: Math.round(currentFactor * 100),
          days: currentDays,
          startDay: currentStart,
          endDay: currentStart + currentDays - 1,
          amount: roundToCents(currentAmount),
          dailyAmount: roundToCents(cmpAdjustedDaily * currentFactor),
          startDate: calculateDateByCumulativePaidDays(
            periodStartDate,
            results.priorPaidDays + currentStart
          ),
          endDate: calculateDateByCumulativePaidDays(
            periodStartDate,
            results.priorPaidDays + currentStart + currentDays - 1
          ),
        });
      }

      return periods;
    })();

    return {
      days: cmpDays,
      fullDaily: cmpFullDaily,
      adjustedDaily: cmpAdjustedDaily,
      consumptionRatio: cmpConsumptionRatio,
      fullDaysEquivalent: cmpFullDaysEquivalent,
      gross: cmpGross,
      withholding: cmpWithholding,
      memberFee: cmpMemberFee,
      net: cmpNet,
      totalPayable: cmpTotal,
      stepPeriods: cmpStepPeriods,
    };
  }, [
    compareMode,
    comparePaidDays,
    compareDailyManual,
    comparisonSalary,
    baseSalary,
    taxPct,
    memberFeePct,
    formulaConfig,
    flags.baseOnlyW,
    results.periodDays,
    results.stepFactor,
    results.perDayReductionBenefits,
    results.perDayReductionIncome,
    results.travelAllowanceTotal,
    results.days,
    results.priorPaidDays,
    periodStartDate,
    stepFactorOverride,
  ]);

  return resultsCompare;
}

