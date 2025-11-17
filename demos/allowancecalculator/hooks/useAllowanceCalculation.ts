// ===============================
// Hook: Main allowance calculation
// ===============================

import { useMemo } from "react";
import type { FormulaConfig, BenefitRow, IncomeRow } from "../types";
import { DAYS_BY_PERIOD, type PeriodKey } from "../constants";
import {
  businessDaysBetween,
  addDaysISO,
  clamp,
  roundToCents,
  calculateDateByCumulativePaidDays,
} from "../utils";
import { fullDailyFromMonthlyBaseUsingConfig } from "../domain/allowance";

interface CalculationParams {
  formulaConfig: FormulaConfig;
  benefits: BenefitRow[];
  incomes: IncomeRow[];
  baseSalary: number;
  comparisonSalary: number;
  memberFeePct: number;
  autoPaidFromRange: boolean;
  manualPaidDays: number;
  periodStartDate: string;
  periodEndDate: string;
  taxPct: number;
  maxDays: number;
  flags: {
    baseOnlyW: boolean;
    kulukorvaus: boolean;
    kulukorvausKorotus: boolean;
    lapsikorotus: boolean;
  };
  childCount: number;
  calcDate: string;
  period: string;
  benefitStartDate: string;
  stepFactorOverride: string;
}

export default function useAllowanceCalculation(params: CalculationParams) {
  const {
    formulaConfig,
    benefits,
    incomes,
    baseSalary,
    comparisonSalary,
    memberFeePct,
    autoPaidFromRange,
    manualPaidDays,
    periodStartDate,
    periodEndDate,
    taxPct,
    maxDays,
    flags,
    childCount,
    calcDate,
    period,
    benefitStartDate,
    stepFactorOverride,
  } = params;

  const results = useMemo(() => {
    const cfg = formulaConfig;
    const periodDays = period ? DAYS_BY_PERIOD[period as PeriodKey] : 0;

    // Automatic vs. manual accumulation of paid days before this period's start
    const priorPaidAuto = businessDaysBetween(benefitStartDate, periodStartDate);
    const priorPaidDays = priorPaidAuto;

    // Benefits total (after protected amount)
    const benefitsTotal = benefits.reduce(
      (s, b) => s + Math.max(b.amount - (b.protectedAmount || 0), 0),
      0
    );

    // Benefits (only benefits, after protected amount)
    const benefitsTotalPure = benefits.reduce(
      (s, b) => s + Math.max(b.amount - (b.protectedAmount || 0), 0),
      0
    );
    const hasBenefits = benefits.some((b) => b.amount > 0);

    // Income (for adjustment)
    const incomesTotal = incomes.reduce(
      (s, i) => s + (i.type !== "none" ? i.amount : 0),
      0
    );
    const sovitteluOn = incomes.some((i) => i.type !== "none" && i.amount > 0);

    // Day counts
    const pdForBenefits = periodDays || 21.5;
    const pdForIncome = periodDays || 21.5;

    // Daily wage and earnings part (raw before step reduction)
    const dailySalaryBasisDays = periodDays || 21.5; // jos ei jaksoa, käytä 21.5 oletusta
    const dailySalary = (baseSalary * (1 - cfg.statDeductions)) / dailySalaryBasisDays;

    const earningsPartFromDailyCfg = (dw: number) => {
      const splitDaily = cfg.splitPointMonth / dailySalaryBasisDays;
      const baseDiffAtBelow = Math.max(Math.min(dw, splitDaily) - cfg.dailyBase, 0);
      const aboveSplit = Math.max(dw - splitDaily, 0);
      return cfg.rateBelow * baseDiffAtBelow + cfg.rateAbove * aboveSplit;
    };

    const earningsPartRaw = flags.baseOnlyW ? 0 : earningsPartFromDailyCfg(dailySalary);

    // Porrastus päiväkohtaisesti: mahdollinen rajanylitys (40/170 pv) huomioidaan
    // Maksetut päivät: automaattisesti ajanjaksosta tai manuaalisesti syötetty
    const days = autoPaidFromRange
      ? businessDaysBetween(periodStartDate, addDaysISO(periodEndDate, 1))
      : manualPaidDays;

    const stepFactorByCumulativeDaysCfg = (dayInPeriod: number) => {
      if (dayInPeriod > cfg.step2Threshold)
        return {
          factor: cfg.step2Factor,
          label: `Porrastus ${Math.round(cfg.step2Factor * 100)}%`,
        } as const;
      if (dayInPeriod > cfg.step1Threshold)
        return {
          factor: cfg.step1Factor,
          label: `Porrastus ${Math.round(cfg.step1Factor * 100)}%`,
        } as const;
      return { factor: 1.0, label: "Ei porrastusta" } as const;
    };

    let sumFactor = 0;
    for (let i = 0; i < days; i++) {
      const dayInPeriod = i + 1; // Jakson sisäinen päivä
      const { factor } = stepFactorByCumulativeDaysCfg(dayInPeriod);
      sumFactor += factor;
    }
    const stepFactor =
      stepFactorOverride && stepFactorOverride !== "auto"
        ? parseFloat(stepFactorOverride)
        : days > 0
          ? sumFactor / days
          : 1;
    const startInfo = stepFactorByCumulativeDaysCfg(1);
    const endInfo = stepFactorByCumulativeDaysCfg(days);
    const stepLabel =
      endInfo.factor < startInfo.factor ? endInfo.label : startInfo.label;

    // Täysi päiväraha (raaka, ennen suojia/capeja)
    const basePart = cfg.dailyBase;
    const earningsPart = earningsPartRaw * stepFactor;
    const fullDailyRaw = basePart + earningsPart;

    // --- 80 % -SUOJA (vertailupalkka = comparisonSalary) ---
    // Lasketaan vertailupalkasta täysi €/pv samoilla kaavoilla ja samalla porrastuskertoimella.
    // Käytetään vain jos comparisonSalary > 0.
    let fullDailyAfter80 = fullDailyRaw;
    let eightyRuleTriggered = false;
    let prevFullDailyRef = 0;
    let eightyFloor = 0;

    if (comparisonSalary && comparisonSalary > 0) {
      const pdRef = periodDays || 21.5;
      const prevFullDaily = fullDailyFromMonthlyBaseUsingConfig(
        comparisonSalary,
        pdRef,
        cfg,
        flags.baseOnlyW,
        stepFactor
      );
      prevFullDailyRef = prevFullDaily;
      eightyFloor = 0.8 * prevFullDaily;

      if (fullDailyAfter80 < eightyFloor) {
        eightyRuleTriggered = true;
        fullDailyAfter80 = eightyFloor; // nosta täysi pv vähintään 80 % tasolle
      }
    }

    // --- 90 % -cap (päiväpalkasta) ---
    const cap90 = 0.90 * dailySalary;
    const fullDailyAfterCap = Math.max(
      cfg.dailyBase,
      Math.min(fullDailyAfter80, cap90)
    );

    // Vähennykset per päivä
    // Etuudet: suora vähennys 100% (eivät käynnistä sovittelua)
    const perDayReductionBenefits = (benefitsTotalPure * 1.0) / pdForBenefits;

    // Tulot: sovittelun vaikutus 50% per päivä (käynnistyy vain tuloista)
    const perDayReductionIncome = sovitteluOn
      ? (incomesTotal * 0.5) / pdForIncome
      : 0;

    // Yhteensä
    const perDayReduction = perDayReductionBenefits + perDayReductionIncome;

    // Soviteltu päiväraha (sovittelu tehdään suojatusta/capatusta täydestä)
    const adjustedDaily = clamp(
      fullDailyAfterCap - perDayReduction,
      0,
      fullDailyAfterCap
    );

    // Käytä suojattua/capattua täyttä päivärahaa kulutussuhteiden laskentaan
    const fullDaily = fullDailyAfterCap;

    // Kulutussuhde: kuinka paljon yksi maksettu päivä kuluttaa enimmäisaikaa
    const consumptionRatio = fullDaily > 0 ? adjustedDaily / fullDaily : 0;

    // Täydet päivät (ekv.) tällä jaksolla = maksetut × kulutussuhde
    const fullDaysEquivalent = consumptionRatio * days;

    // --- Enimmäisajan kuluminen sovittelussa ---
    // Kulutussuhde = soviteltu / täysi (0..1). Jos täysi=0 → 0.
    // Tällä jaksolla kertyvät "ekvivalentit" maksetut päivät:
    const paidDaysThisPeriod = consumptionRatio * days;

    // Kumulatiivinen ennen tätä jaksoa teillä on 'priorPaidDays' (manuaali/auto).
    // Tämän jälkeen kumulatiivinen (pyöristämättä):
    const cumulativePaidAfter = priorPaidDays + paidDaysThisPeriod;

    // Veroton kulukorvaus (oletus: 9 €/pv, korotettuna 18 €/pv)
    const travelAllowancePerDay = flags.kulukorvaus
      ? flags.kulukorvausKorotus
        ? cfg.travelElevated
        : cfg.travelBase
      : 0;
    const travelAllowanceTotal = roundToCents(travelAllowancePerDay * days);

    // Lapsikorotus (poistui 1.4.2024)
    const childIncrementPerDay =
      flags.lapsikorotus && calcDate < "2024-04-01"
        ? (() => {
            if (childCount <= 0) return 0;
            if (childCount === 1) return 5.84;
            if (childCount === 2) return 8.57;
            return 11.05; // 3+ children
          })()
        : 0;
    const childIncrementTotal = roundToCents(childIncrementPerDay * days);

    // Yhteenveto
    const gross = roundToCents(adjustedDaily * days);
    const withholding = roundToCents(gross * (taxPct / 100));
    const memberFee = roundToCents((memberFeePct / 100) * gross);
    const net = roundToCents(gross - withholding - memberFee);
    const totalPayable = roundToCents(
      net + travelAllowanceTotal + childIncrementTotal
    ); // netto + veroton kulukorvaus + lapsikorotus

    const benefitsPerDay = periodDays ? benefitsTotal / periodDays : 0;

    return {
      // per-day
      periodDays,
      benefitsTotal,
      benefitsTotalPure,
      hasBenefits,
      incomesTotal,
      perDayReductionBenefits,
      perDayReductionIncome,
      sovitteluOn,
      benefitsPerDay,
      dailySalary,
      basePart,
      earningsPartRaw,
      stepFactor,
      stepLabel,
      earningsPart,
      fullDaily,
      perDayReduction,
      adjustedDaily,
      consumptionRatio,
      fullDaysEquivalent,
      paidDaysThisPeriod,
      cumulativePaidAfter,
      maxDays,
      travelAllowancePerDay,
      childIncrementPerDay,
      // period totals
      days,
      gross,
      withholding,
      memberFee,
      net,
      travelAllowanceTotal,
      childIncrementTotal,
      totalPayable,
      // meta
      priorPaidDays,
      priorPaidAuto,
      // 80% suoja
      fullDailyBeforeProtection: fullDailyRaw,
      eightyRuleTriggered,
      eightyFloor,
      prevFullDailyRef,
      // step periods
      stepPeriods: (() => {
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

        for (let i = 0; i < days; i++) {
          const dayInPeriod = i + 1; // Jakson sisäinen päivä (1, 2, 3, ...)
          const { factor } = stepFactorByCumulativeDaysCfg(dayInPeriod);
          const dailyAmount = adjustedDaily * factor;

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
                dailyAmount: roundToCents(adjustedDaily * currentFactor),
                startDate: calculateDateByCumulativePaidDays(
                  periodStartDate,
                  priorPaidDays + currentStart
                ),
                endDate: calculateDateByCumulativePaidDays(
                  periodStartDate,
                  priorPaidDays + currentStart + currentDays - 1
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
            dailyAmount: roundToCents(adjustedDaily * currentFactor),
            startDate: calculateDateByCumulativePaidDays(
              periodStartDate,
              priorPaidDays + currentStart
            ),
            endDate: calculateDateByCumulativePaidDays(
              periodStartDate,
              priorPaidDays + currentStart + currentDays - 1
            ),
          });
        }

        return periods;
      })(),
    };
  }, [
    formulaConfig,
    benefits,
    incomes,
    baseSalary,
    comparisonSalary,
    memberFeePct,
    autoPaidFromRange,
    manualPaidDays,
    periodStartDate,
    periodEndDate,
    taxPct,
    maxDays,
    flags.baseOnlyW,
    flags.kulukorvaus,
    flags.kulukorvausKorotus,
    flags.lapsikorotus,
    childCount,
    calcDate,
    period,
    benefitStartDate,
    stepFactorOverride,
  ]);

  return results;
}

