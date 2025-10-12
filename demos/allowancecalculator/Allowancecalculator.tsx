"use client";


import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Download, Loader2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DevField } from "@/components/DevField";



// ===============================
// Helper: dates & math
// ===============================
function isBusinessDay(d: Date) {
  const day = d.getDay(); // 0=Sun,6=Sat
  return day !== 0 && day !== 6;
}

function businessDaysBetween(startISO: string, endISO: string) {
  // counts business days from start (inclusive) to end (exclusive)
  const start = new Date(startISO);
  const end = new Date(endISO);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return 0;
  let count = 0;
  const cur = new Date(start);
  while (cur < end) {
    if (isBusinessDay(cur)) count++;
    cur.setDate(cur.getDate() + 1);
    cur.setHours(0, 0, 0, 0);
  }
  return count;
}

function addDaysISO(iso: string, n: number) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function euro(n: number) {
  return n.toLocaleString("fi-FI", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// ===============================
// Constants & options
// ===============================


const PERIODS = [
  { value: "1m", label: "1 kuukausi (21,5 pv)" },
  { value: "2w", label: "2 viikkoa (10 pv)" },
  { value: "4w", label: "4 viikkoa (20 pv)" },
] as const;

type PeriodKey = (typeof PERIODS)[number]["value"];

const DAYS_BY_PERIOD: Record<PeriodKey, number> = {
  "1m": 21.5,
  "2w": 10,
  "4w": 20,
};

const BENEFIT_TYPES = [
  { value: "ansioturva", label: "Ansioturva" },
  { value: "peruspaivaraha", label: "Peruspäiväraha" },
  { value: "tyomarkkinatuki", label: "Työmarkkinatuki" },
] as const;

// Etuuden valintalista (esimerkkivaihtoehtoja)
const BENEFIT_OPTIONS = [
  { value: "31-osa-aikatyö", label: "31 - Osa-aikatyö" },
  { value: "32-sivutoimiyrittäjyys", label: "32 - Sivutoimiyrittäjyys" },
  { value: "33-sairauspäiväraha", label: "33 - Sairauspäiväraha" },
  { value: "34-vanhempainraha", label: "34 - Vanhempainraha" },
  { value: "35-muu-etuus", label: "35 - Muu etuus" },
];

// Etuudet dropdown (esimerkkivaihtoehdot)
const BENEFIT_CATALOG = [
  { value: "vanhempainraha", label: "Vanhempainpäiväraha" },
  { value: "sairauspaivaraha", label: "Sairauspäiväraha" },
  { value: "kuntoutusraha", label: "Kuntoutusraha" },
  { value: "muu", label: "Muu etuus" },
] as const;

// Tulot (sovittelu) – dropdown
const INCOME_OPTIONS = [
  { value: "none", label: "Ei tuloja" },
  { value: "parttime", label: "Osa-aikatyö (≤ 80 %)" },
  { value: "ft_short", label: "Kokoaikatyö ≤ 2 viikkoa" },
  { value: "selfemp", label: "Sivutoiminen yrittäjyys" },
] as const;

// Viralliset perusarvot (2025 – esimerkkitaso)
const DAILY_BASE = 37.21; // perusosa €/pv
const SPLIT_POINT_MONTH = 3534.95; // taitekohta €/kk
const STAT_DEDUCTIONS = 0.0354; // 3.54 % vähennys ennen päiväansiota
const TRAVEL_ALLOWANCE_BASE = 9; // €/pv veroton
const TRAVEL_ALLOWANCE_ELEVATED = 18; // €/pv veroton

function toDailyWage(monthlyGross: number, periodDays = 21.5) {
  const afterDeductions = monthlyGross * (1 - STAT_DEDUCTIONS);
  return afterDeductions / periodDays;
}

function earningsPartFromDaily(dailyWage: number, splitPointMonth = SPLIT_POINT_MONTH, periodDays = 21.5) {
  const splitDaily = splitPointMonth / periodDays;
  const baseDiffAt45 = Math.max(Math.min(dailyWage, splitDaily) - DAILY_BASE, 0);
  const aboveSplit = Math.max(dailyWage - splitDaily, 0);
  return 0.45 * baseDiffAt45 + 0.20 * aboveSplit;
}

function stepFactorByCumulativeDays(cumulativeDays: number) {
  if (cumulativeDays >= 170) return { factor: 0.75, label: "Porrastus 75%" } as const;
  if (cumulativeDays >= 40) return { factor: 0.80, label: "Porrastus 80%" } as const;
  return { factor: 1.0, label: "Ei porrastusta" } as const;
}

function computePerDayReduction(incomesTotal: number, period: string): number {
  if (!period) return 0; // ei sovittelua
  const pd = DAYS_BY_PERIOD[period as PeriodKey];
  if (!pd) return 0;
  return (incomesTotal * 0.5) / pd; // 50% / jakson pv
}

// Calculates full daily allowance €/day from monthly salary using same formulas as basic calculation
function fullDailyFromMonthlyBaseUsingConfig(
  monthlyBase: number,
  periodDays: number,
  cfg: {
    dailyBase: number;
    splitPointMonth: number;
    statDeductions: number;
    rateBelow: number;
    rateAbove: number;
  },
  baseOnlyW: boolean,
  stepFactor: number
) {
  const dailySalary = (monthlyBase * (1 - cfg.statDeductions)) / (periodDays || 21.5);
  const splitDaily = cfg.splitPointMonth / (periodDays || 21.5);
  const below = Math.max(Math.min(dailySalary, splitDaily) - cfg.dailyBase, 0);
  const above = Math.max(dailySalary - splitDaily, 0);
  const earningsPartRaw = baseOnlyW ? 0 : (cfg.rateBelow * below + cfg.rateAbove * above);
  const earningsPart = earningsPartRaw * stepFactor;
  return cfg.dailyBase + earningsPart;
}

// ===============================
// (Lightweight) self-tests – run once
// ===============================
function runSelfTests() {
  try {
    const pDays = 21.5;

    // 1) Daily wage and earnings part scale correctly
    const d1 = toDailyWage(2573, pDays);
    const ep1 = earningsPartFromDaily(d1, SPLIT_POINT_MONTH, pDays);
    const d2 = toDailyWage(3700, pDays);
    const ep2 = earningsPartFromDaily(d2, SPLIT_POINT_MONTH, pDays);
    if (!(ep2 > ep1)) console.warn("[TEST] Monotonicity not met");

    // 2) Adjustment direction: larger benefit income -> smaller adjusted per day
    const full = DAILY_BASE + ep1;
    const redLow = (200 * 0.5) / pDays;
    const redHigh = (1000 * 0.5) / pDays;
    const adjLow = clamp(full - redLow, 0, full);
    const adjHigh = clamp(full - redHigh, 0, full);
    if (!(adjHigh <= adjLow)) console.warn("[TEST] Adjustment direction doesn't match");

    // 3) Step reduction: average within period
    function avgFactor(priorPaid: number, days: number) {
      let s = 0;
      for (let i = 0; i < days; i++) {
        s += stepFactorByCumulativeDays(priorPaid + i + 1).factor;
      }
      return days ? s / days : 1;
    }
    const avg1 = avgFactor(39, 2); // 40 and 41 -> 0.8
    if (Math.abs(avg1 - 0.8) > 1e-9) console.warn("[TEST] Step 40+ average wrong", avg1);
    const avg2 = avgFactor(169, 2); // 170 and 171 -> 0.75
    if (Math.abs(avg2 - 0.75) > 1e-9) console.warn("[TEST] Step 170+ average wrong", avg2);

    // 4) Business day counter: Tue -> Thu (2 days)
    const tue = new Date("2025-09-02"); // Tue
    const thu = new Date("2025-09-04"); // Thu
    const bd = businessDaysBetween(tue.toISOString().slice(0, 10), thu.toISOString().slice(0, 10));
    if (bd !== 2) console.warn("[TEST] businessDaysBetween Tue->Thu should be 2, now", bd);

    // 5) Business day counter: Sat -> Mon (0 days, because Sat/Sun don't count)
    const sat = new Date("2025-09-06");
    const mon = new Date("2025-09-08");
    const bd2 = businessDaysBetween(sat.toISOString().slice(0, 10), mon.toISOString().slice(0, 10));
    if (bd2 !== 0) console.warn("[TEST] Sat->Mon should be 0, now", bd2);

    // 6) Step thresholds directly: 0 -> 1.0, 40 -> 0.8, 170 -> 0.75
    const f0 = stepFactorByCumulativeDays(0).factor;
    const f40 = stepFactorByCumulativeDays(40).factor;
    const f170 = stepFactorByCumulativeDays(170).factor;
    if (f0 !== 1 || f40 !== 0.8 || f170 !== 0.75) console.warn("[TEST] Step thresholds unexpected", { f0, f40, f170 });

    // 7) Adjusted limits work (not negative nor exceeding full)
    const fullDailyTest = 60;
    const bigReduction = 100; // large deduction -> 0
    const smallReduction = 5; // small deduction -> < full
    const adj1 = clamp(fullDailyTest - bigReduction, 0, fullDailyTest);
    const adj2 = clamp(fullDailyTest - smallReduction, 0, fullDailyTest);
    if (adj1 !== 0 || !(adj2 > 0 && adj2 < fullDailyTest)) console.warn("[TEST] Adjusted limits don't hold");

    // 8) Empty adjustment period -> perDayReduction = 0
    const redNone = computePerDayReduction(1000, "");
    if (redNone !== 0) console.warn("[TEST] Empty period -> should be 0, now", redNone);
  } catch (e) {
    console.error("[TEST] Error in tests", e);
  }
}
runSelfTests();

// ===============================
// Types
// ===============================
interface BenefitRow {
  id: string;
  name: string;
  amount: number; // hakujakson tulot/etuus
  protectedAmount?: number; // suojaosa
}

// Income row
interface IncomeRow {
  id: string;
  type: (typeof INCOME_OPTIONS)[number]["value"];
  amount: number; // € per period
}

// ===============================
// Component
// ===============================


export default function PaivarahaLaskuri() {
  // Basic information
  const [calcDate, setCalcDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [period, setPeriod] = useState<string>(""); // allow empty -> no adjustment
  const [benefitType, setBenefitType] = useState<(typeof BENEFIT_TYPES)[number]["value"]>("ansioturva");
  const [toeDate, setToeDate] = useState<string>(new Date().toISOString().slice(0, 10)); // Employment condition fulfillment date
  const [benefitStartDate, setBenefitStartDate] = useState<string>(new Date().toISOString().slice(0, 10)); // First payment date
  const [periodStartDate, setPeriodStartDate] = useState<string>(new Date().toISOString().slice(0, 10)); // Period start date
  // Period end date (new)
  const [periodEndDate, setPeriodEndDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [autoPorrastus, setAutoPorrastus] = useState<boolean>(true);

  // Calculation parameters
  const [baseSalary, setBaseSalary] = useState<number>(2030.61); // €/month
  const [comparisonSalary, setComparisonSalary] = useState<number>(0); // optional, not used in formulas now
  // Paid days source: auto from period or manual input
  const [autoPaidFromRange, setAutoPaidFromRange] = useState<boolean>(true);
  
  // Manually entered paid days (days) – used when autoPaidFromRange = false
  const [manualPaidDays, setManualPaidDays] = useState<number>(0);
  const [memberFeePct, setMemberFeePct] = useState<number>(0); // %
  const [taxPct, setTaxPct] = useState<number>(25); // tax percentage
  const [priorPaidDaysManual, setPriorPaidDaysManual] = useState<number>(0); // paid days before this period (manual)

  // Maximum duration selection (e.g. based on work history/age limits)
  const [maxDays, setMaxDays] = useState<number>(400); // 300 / 400 / 500

  // Comparison
  const [compareMode, setCompareMode] = useState<boolean>(false);
  
  // Comparison manual inputs
  const [comparePaidDays, setComparePaidDays] = useState<number | null>(null); // null = use basic calculation days
  const [compareDailyManual, setCompareDailyManual] = useState<number>(0); // 0 = not set
  
  const [toeDateCompare, setToeDateCompare] = useState<string>("");


  // Additional settings (expandable if needed)
  const [flags, setFlags] = useState({
    baseOnlyW: false, // Base part only, employment type W
    tyossaoloehto80: false, // Employment condition 80%
    yrittajaPaivaraha: false, // Entrepreneur's allowance
    kulukorvaus: false, // Expense compensation (tax-free)
    kulukorvausKorotus: false, // Expense compensation increase portion
  });

  const setFormulaNumber =
  <K extends keyof FormulaConfig>(key: K) =>
  (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormulaConfig(v => ({ ...v, [key]: parseFloat(e.target.value || "0") }));

const setFormulaInt =
  <K extends keyof FormulaConfig>(key: K) =>
  (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormulaConfig(v => ({ ...v, [key]: parseInt(e.target.value || "0", 10) }));

const setFormulaPercent =
  (key: "statDeductions" | "rateBelow" | "rateAbove") =>
  (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormulaConfig(v => ({ ...v, [key]: (parseFloat(e.target.value || "0") / 100) }));

  const [benefits, setBenefits] = useState<BenefitRow[]>([]);

  const [incomes, setIncomes] = useState<IncomeRow[]>([]);

  // Bridge Select's string callback to our union type for benefitType
  type BenefitType = (typeof BENEFIT_TYPES)[number]["value"];
  const handleBenefitTypeChange = (value: string) => setBenefitType(value as BenefitType);

  // ===============================
  // Formula editing (configurable values)
  // ===============================
  type FormulaConfig = {
    dailyBase: number;
    splitPointMonth: number;
    statDeductions: number;
    rateBelow: number;
    rateAbove: number;
    step1Threshold: number;
    step1Factor: number;
    step2Threshold: number;
    step2Factor: number;
    travelBase: number;
    travelElevated: number;
  };

  const defaultFormulaConfig: FormulaConfig = {
    dailyBase: DAILY_BASE, // €/pv
    splitPointMonth: SPLIT_POINT_MONTH, // €/kk
    statDeductions: STAT_DEDUCTIONS, // 0..1
    rateBelow: 0.45, // 45 %
    rateAbove: 0.20, // 20 %
    step1Threshold: 40,
    step1Factor: 0.8,
    step2Threshold: 170,
    step2Factor: 0.75,
    travelBase: TRAVEL_ALLOWANCE_BASE,
    travelElevated: TRAVEL_ALLOWANCE_ELEVATED,
  };

  const [formulaConfig, setFormulaConfig] = useState<FormulaConfig>(() => ({ 
    dailyBase: Number(DAILY_BASE),
    splitPointMonth: Number(SPLIT_POINT_MONTH),
    statDeductions: Number(STAT_DEDUCTIONS),
    rateBelow: 0.45,
    rateAbove: 0.20,
    step1Threshold: 40,
    step1Factor: 0.8,
    step2Threshold: 170,
    step2Factor: 0.75,
    travelBase: Number(TRAVEL_ALLOWANCE_BASE),
    travelElevated: Number(TRAVEL_ALLOWANCE_ELEVATED), }));
  const [editFormulas, setEditFormulas] = useState(false);

  

  // ===============================
  // Calculation
  // ===============================
  const results = useMemo(() => {
    const cfg = formulaConfig;
    const periodDays = period ? DAYS_BY_PERIOD[period as PeriodKey] : 0;
    

    // Automatic vs. manual accumulation of paid days before this period's start
    const priorPaidAuto = businessDaysBetween(benefitStartDate, periodStartDate);
    const priorPaidDays = autoPorrastus ? priorPaidAuto : priorPaidDaysManual;

    // Benefits total (after protected amount)
    const benefitsTotal = benefits.reduce((s, b) => s + Math.max((b.amount - (b.protectedAmount || 0)), 0), 0);

    // Benefits (only benefits, after protected amount)
    const benefitsTotalPure = benefits.reduce(
      (s, b) => s + Math.max((b.amount - (b.protectedAmount || 0)), 0),
      0
    );
    const hasBenefits = benefits.some(b => b.amount > 0);

    // Income (for adjustment)
    const incomesTotal = incomes.reduce((s, i) => s + (i.type !== "none" ? i.amount : 0), 0);
    const sovitteluOn = incomes.some(i => i.type !== "none" && i.amount > 0);

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
    
    const stepFactorByCumulativeDaysCfg = (cum: number) => {
      if (cum >= cfg.step2Threshold) return { factor: cfg.step2Factor, label: `Porrastus ${Math.round(cfg.step2Factor*100)}%` } as const;
      if (cum >= cfg.step1Threshold) return { factor: cfg.step1Factor, label: `Porrastus ${Math.round(cfg.step1Factor*100)}%` } as const;
      return { factor: 1.0, label: "Ei porrastusta" } as const;
    };

    let sumFactor = 0;
    for (let i = 0; i < days; i++) {
      const cumulative = priorPaidDays + (i + 1); // 1..days
      const { factor } = stepFactorByCumulativeDaysCfg(cumulative);
      sumFactor += factor;
    }
    const stepFactor = days > 0 ? sumFactor / days : 1;
    const startInfo = stepFactorByCumulativeDaysCfg(priorPaidDays + 1);
    const endInfo = stepFactorByCumulativeDaysCfg(priorPaidDays + days);
    const stepLabel = endInfo.factor < startInfo.factor ? endInfo.label : startInfo.label;

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
    const fullDailyAfterCap = Math.max(cfg.dailyBase, Math.min(fullDailyAfter80, cap90));

    // Vähennykset per päivä
    // Etuudet: suora vähennys 100% (eivät käynnistä sovittelua)
    const perDayReductionBenefits = (benefitsTotalPure * 1.0) / pdForBenefits;

    // Tulot: sovittelun vaikutus 50% per päivä (käynnistyy vain tuloista)
    const perDayReductionIncome = sovitteluOn ? (incomesTotal * 0.5) / pdForIncome : 0;

    // Yhteensä
    const perDayReduction = perDayReductionBenefits + perDayReductionIncome;

    // Soviteltu päiväraha (sovittelu tehdään suojatusta/capatusta täydestä)
    const adjustedDaily = clamp(fullDailyAfterCap - perDayReduction, 0, fullDailyAfterCap);
    
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
    const travelAllowancePerDay = flags.kulukorvaus ? (flags.kulukorvausKorotus ? cfg.travelElevated : cfg.travelBase) : 0;
    const travelAllowanceTotal = travelAllowancePerDay * days;

    // Yhteenveto
    const gross = adjustedDaily * days;
    const withholding = gross * (taxPct / 100);
    const memberFee = (memberFeePct / 100) * gross;
    const net = gross - withholding - memberFee;
    const totalPayable = net + travelAllowanceTotal; // netto + veroton kulukorvaus

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
      // period totals
      days,
      gross,
      withholding,
      memberFee,
      net,
      travelAllowanceTotal,
      totalPayable,
      // meta
      priorPaidDays,
      priorPaidAuto,
      // 80% suoja
      fullDailyBeforeProtection: fullDailyRaw,
      eightyRuleTriggered,
      eightyFloor,
      prevFullDailyRef,
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
    priorPaidDaysManual,
    taxPct,
    maxDays,
    flags.baseOnlyW,
    flags.kulukorvaus,
    flags.kulukorvausKorotus,
    period,
    benefitStartDate,
    periodStartDate,
    autoPorrastus,
  ]);

  const periodRangeInvalid = useMemo(() => {
    if (!periodStartDate || !periodEndDate) return false;
    return new Date(periodEndDate) < new Date(periodStartDate);
  }, [periodStartDate, periodEndDate]);

// Vertailupalkka
  const resultsCompare = useMemo(() => {
    if (!compareMode) return null;

    // ✨ 2.1 Päivät vertailussa — käytä vertailun omaa arvoa, jos annettu
    const cmpDays = (comparePaidDays ?? results.days);

    // ✨ 2.2 Täysi pv vertailussa: manuaali voittaa, muuten lasketaan kuten perus
    let cmpFullDaily = 0;
    if (compareDailyManual > 0) {
      cmpFullDaily = compareDailyManual;
    } else {
      const pd = results.periodDays || 21.5;
      // Käytä vertailupalkkaa jos se on annettu, muuten käytä peruslaskennan perustepalkkaa
      const cmpBaseSalary = comparisonSalary > 0 ? comparisonSalary : baseSalary;
      const dailySalaryCmp = (cmpBaseSalary * (1 - formulaConfig.statDeductions)) / pd;
      const splitDaily = formulaConfig.splitPointMonth / pd;
      const below = Math.max(Math.min(dailySalaryCmp, splitDaily) - formulaConfig.dailyBase, 0);
      const above = Math.max(dailySalaryCmp - splitDaily, 0);
      const earningsPartRawCmp = flags.baseOnlyW
        ? 0
        : (formulaConfig.rateBelow * below + formulaConfig.rateAbove * above);
      const earningsPartCmp = earningsPartRawCmp * results.stepFactor; // sama porrastuksen kerroin
      cmpFullDaily = formulaConfig.dailyBase + earningsPartCmp;
    }

    // ✨ 2.3 Per-pv vähennykset — sama logiikka kuin peruslaskennassa
    const perDayReductionCmp =
      (results.perDayReductionBenefits ?? 0) + (results.perDayReductionIncome ?? 0);

    const cmpAdjustedDaily = clamp(cmpFullDaily - perDayReductionCmp, 0, cmpFullDaily);

    // ✨ 2.4 Kulutussuhde + ekvivalentit täydet päivät (riippuu cmpDays-muuttujasta)
    const cmpConsumptionRatio = cmpFullDaily > 0 ? (cmpAdjustedDaily / cmpFullDaily) : 0;
    const cmpFullDaysEquivalent = cmpConsumptionRatio * cmpDays;

    // ✨ 2.5 Jakson summat – KAIKKI käyttävät cmpDays-arvoa
    const cmpGross = cmpAdjustedDaily * cmpDays;
    const cmpWithholding = cmpGross * (taxPct / 100);
    const cmpMemberFee = (memberFeePct / 100) * cmpGross;
    const cmpNet = cmpGross - cmpWithholding - cmpMemberFee;
    const cmpTotal = cmpNet + results.travelAllowanceTotal; // kulukorvaus/ pv samana

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
    };
  }, [
    compareMode,
    comparePaidDays,          // ✅ varmista että on deps-listassa
    compareDailyManual,       // ✅
    comparisonSalary,         // ✅ vertailupalkka
    // base/kaavat
    baseSalary,
    taxPct,
    memberFeePct,
    formulaConfig,
    flags.baseOnlyW,
    // peilataan peruslaskennan tuloksia
    results.periodDays,
    results.stepFactor,
    results.perDayReductionBenefits,
    results.perDayReductionIncome,
    results.travelAllowanceTotal,
    results.days,             // käytetään fallbackina kun comparePaidDays on null
  ]);

  function Row3({
    label,
    base,
    compare,
  }: {
    label: string;
    base: number;
    compare?: number | null;
  }) {
    const hasCompare = typeof compare === "number";
    const delta = hasCompare ? (compare as number) - base : 0;
    const sign = delta >= 0 ? "+" : "−";
    const abs = Math.abs(delta);
  
    return (
      <>
        <div className="text-gray-500">{label}</div>
        <div className="text-right font-medium">{euro(base)}</div>
        {hasCompare ? (
          <>
            <div className="text-right">{euro(compare as number)}</div>
            <div className={cn("text-right font-semibold", delta >= 0 ? "text-emerald-600" : "text-rose-600")}>
              {sign}
              {euro(abs)}
            </div>
          </>
        ) : (
          <>
            <div className="text-right text-gray-400">—</div>
            <div className="text-right text-gray-400">—</div>
          </>
        )}
      </>
    );
  }

  // Selkokielinen kaavalista korttia varten
  const formulaList = useMemo(() => {
    const cfg = formulaConfig;
    const pd = results.periodDays || 21.5;
    const splitDaily = cfg.splitPointMonth / pd;
    return [
      {
        key: "dailyWage",
        title: "Päiväpalkka",
        formula: `päiväpalkka = (kuukausipalkka × (1 − ${(cfg.statDeductions*100).toFixed(2)}%)) / ${pd}`,
        explain: `Kuukausipalkka muunnetaan päiväkohtaiseksi. Vähennys ${(cfg.statDeductions*100).toFixed(2)} %. Esimerkin arvoilla: ${(
          (baseSalary * (1 - cfg.statDeductions)) /
          pd
        ).toFixed(2)} €/pv.`,
      },
      {
        key: "earningsPart",
        title: "Ansio-osa",
        formula: `ansio-osa = ${(cfg.rateBelow*100).toFixed(0)}% × max(0, min(päiväpalkka, ${splitDaily.toFixed(2)}) − ${cfg.dailyBase.toFixed(
          2
        )}) + ${(cfg.rateAbove*100).toFixed(0)}% × max(0, päiväpalkka − ${splitDaily.toFixed(2)})`,
        explain: `Taitekohta kuukausitasolla on ${cfg.splitPointMonth.toFixed(2)} € (=${splitDaily.toFixed(
          2
        )} €/pv tällä jaksolla).`,
      },
      {
        key: "step",
        title: "Porrastus",
        formula: `kerroin = 1.0 / ${cfg.step1Threshold - 1}päivään asti, sitten ${cfg.step1Factor} (≥ ${cfg.step1Threshold} pv), ja ${cfg.step2Factor} (≥ ${cfg.step2Threshold} pv). Jaksolla keskiarvo = ${results.stepFactor.toFixed(2)}`,
        explain: `Kun etuutta on maksettu pitkään, ansio-osa pienenee porrastuksilla. Raja-arvot ja kertoimet ovat muokattavissa.`,
      },
      {
        key: "fullDaily",
        title: "Täysi päiväraha",
        formula: `täysi = perusosa (${cfg.dailyBase.toFixed(2)} €/pv) + ansio-osa`,
        explain: `Päiväraha ilman sovittelua. Lapsikorotus ei ole mukana.`,
      },
      {
        key: "reduction",
        title: "Vähennykset per päivä",
        formula: results.periodDays
          ? `Tulot (sovittelu): vähennys/pv = (tulot − suoja) × 50% / ${results.periodDays}\nEtuudet (suora): vähennys/pv = (etuudet − suoja) × 100% / ${results.periodDays}`
          : `ei vähennystä, koska sovittelujaksoa ei ole valittu`,
        explain: `Tulot sovitellaan 50 %:lla, vähentävät etuudet vähennetään täysimääräisesti (100 %). Suojaosa vähennetään ensin. Jos jaksoa ei ole, vähennystä ei tehdä.`,
      },
      {
        key: "adjusted",
        title: "Soviteltu päiväraha",
        formula: `soviteltu = max(0, min(täysi, täysi − vähennys/pv))`,
        explain: `Soviteltu ei voi olla negatiivinen tai ylittää täyttä päivärahaa.`,
      },
      {
        key: "gross",
        title: "Brutto jaksolta",
        formula: `brutto = soviteltu × täydet päivät (${results.days})`,
        explain: `Jakson maksettava bruttomäärä ennen vähennyksiä.`,
      },
      {
        key: "withholding",
        title: "Ennakonpidätys",
        formula: `ennakonpidätys = brutto × veroprosentti (${taxPct}%)`,
        explain: `Vähennetään verokortin mukaisella prosentilla.`,
      },
      {
        key: "memberFee",
        title: "Jäsenmaksu",
        formula: `jäsenmaksu = brutto × jäsenmaksu% (${memberFeePct}%)`,
        explain: `Mahdollinen kassan jäsenmaksu.`,
      },
      {
        key: "net",
        title: "Maksettava netto",
        formula: `netto = brutto − ennakonpidätys − jäsenmaksu`,
        explain: `Käteen jäävä summa vähennysten jälkeen.`,
      },
      {
        key: "travel",
        title: "Kulukorvaus (veroton)",
        formula: flags.kulukorvaus
          ? `kulukorvaus = ${flags.kulukorvausKorotus ? cfg.travelElevated : cfg.travelBase} €/pv × päivät (${results.days})`
          : `ei kulukorvausta`,
        explain: `Kulukorvaus on veroton lisä työllistymistä edistävien palvelujen ajalta. Korotusosa nostaa sen ${formulaConfig.travelElevated} €/pv.`,
      },
    ];
  }, [
    baseSalary,
    memberFeePct,
    results.days,
    results.periodDays,
    results.stepFactor,
    taxPct,
    flags.kulukorvaus,
    flags.kulukorvausKorotus,
    formulaConfig,
  ]);

  // Etuudet – käytetään olemassa olevaa `benefits`-listaa
  function addBenefitRow() {
    const n = benefits.length + 1;
    setBenefits(prev => [
      ...prev,
      { id: `b${n}`, name: "Vanhempainpäiväraha", amount: 0, protectedAmount: 0 },
    ]);
  }
  function removeBenefitRow(id: string) {
    setBenefits(prev => prev.filter(b => b.id !== id));
  }

  // Tulot (sovittelu)
  function addIncomeRow() {
    const n = incomes.length + 1;
    setIncomes(prev => [...prev, { id: `i${n}`, type: "parttime", amount: 0 }]);
  }
  function removeIncomeRow(id: string) {
    setIncomes(prev => prev.filter(i => i.id !== id));
  }

  // Aktivoi sovittelujakso vain tuloista (ei etuuksista)
  React.useEffect(() => {
    const hasEarnings = incomes.some(i => i.type !== "none" && i.amount > 0);
    if (hasEarnings && !period) setPeriod("1m"); // oletuksena kuukausijakso
  }, [incomes, period]);

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 border bg-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Päivärahalaskuri</h1>
          <div className="flex items-center gap-2">
            
            <Button className="gap-2">
              <Loader2 className="h-4 w-4" />Hae tiedot
            </Button>
          </div>
        </div>
      </header>

      <main
  className={cn(
    "max-w-8xl mx-auto px-4 py-6 grid gap-6 transition-all duration-300",
    compareMode
      ? "lg:grid-cols-[1.6fr_1.4fr]" // vertailutilassa: oikea leveämpi
      : "lg:grid-cols-[2fr_1fr]"     // normaali: vasen 2/3, oikea 1/3
  )}
>
  {/* Vasemmalla: tilanne + etuudet */}
  <div className="space-y-6 min-w-0">
          <Card>
            <CardHeader>
              <CardTitle>Tilanne</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-6">
                <Label>Laskentapäivä *</Label>
                <Input type="date" value={calcDate} onChange={(e) => setCalcDate(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Sovittelujakso</Label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ei sovittelua" />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIODS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Etuus *</Label>
                <Select value={benefitType} onValueChange={handleBenefitTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Valitse" />
                  </SelectTrigger>
                  <SelectContent>
                    {BENEFIT_TYPES.map((b) => (
                      <SelectItem key={b.value} value={b.value}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>TOE täyttymispäivä</Label>
                <DevField
                  fieldId="toe-date"
                  fieldLabel="TOE täyttymispäivä (Employment Condition Fulfillment Date)"
                  userStory="User enters the date when they fulfilled the employment condition (TOE) to become eligible for earnings-related allowance."
                  business="TOE date determines eligibility for earnings-related unemployment benefit. Prior paid days are calculated from this date to determine step factor."
                  formula="priorPaidDays = businessDaysBetween(toeDate, periodStartDate)"
                  code={`const priorPaidDays = businessDaysBetween(toeDate, periodStartDate);
// Used to calculate step factor for allowance increase`}
                  example="If TOE date is 2024-01-01 and period starts 2024-12-01, prior days determine if step 1 (300+ days) or step 2 (400+ days) applies."
                >
                  <Input type="date" value={toeDate} onChange={(e) => setToeDate(e.target.value)} />
                </DevField>
              </div>

             
              <div className="space-y-2">
                <Label>Perustepalkka €/kk *</Label>
                <DevField
                  fieldId="base-salary"
                  fieldLabel="Perustepalkka (Base Salary)"
                  userStory="User enters their monthly base salary to calculate the daily allowance amount. This is the foundation for all benefit calculations."
                  business="The base salary is used to calculate the daily wage after statutory deductions. The daily wage determines the earnings-related part of the allowance."
                  formula="dailySalary = (baseSalary × (1 - statDeductions)) / dailySalaryBasisDays"
                  code={`const dailySalary = (baseSalary * (1 - cfg.statDeductions)) / dailySalaryBasisDays;
// statDeductions typically 0.0634 (6.34%)
// dailySalaryBasisDays typically 21.5`}
                  example="If baseSalary = 2030.61€, statDeductions = 6.34%, and 21.5 days: dailySalary = (2030.61 × 0.9366) / 21.5 = 88.47€/day"
                >
                  <Input
                    type="number"
                    step={0.01}
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(parseFloat(e.target.value || "0"))}
                  />
                </DevField>
              </div>
             
             
              <div className="space-y-2">
                <Label>Ensimmäinen maksupäivä</Label>
                <DevField
                  fieldId="benefit-start-date"
                  fieldLabel="Ensimmäinen maksupäivä (First Payment Date)"
                  userStory="User sets the date when the first unemployment benefit payment will be made."
                  business="This date is used for informational purposes and scheduling. It helps users understand when to expect their first payment."
                  code={`const [benefitStartDate, setBenefitStartDate] = useState<string>("");
// Used for payment scheduling`}
                  example="If set to 2025-02-01, user knows to expect their first payment on that date."
                >
                  <Input type="date" value={benefitStartDate} onChange={(e) => setBenefitStartDate(e.target.value)} />
                </DevField>
              </div>

            

              <div className="space-y-2 md:col-span-2">
                <Label>Ajanjakso</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-500">Alkupäivä</Label>
                    <DevField
                      fieldId="period-start-date"
                      fieldLabel="Alkupäivä (Period Start Date)"
                      userStory="User sets the start date of the benefit period to calculate daily allowances for the specified range."
                      business="The start date marks the beginning of the calculation period. All business days between start and end dates are counted for the allowance calculation."
                      formula="businessDays = businessDaysBetween(startDate, endDate)"
                      code={`const businessDays = businessDaysBetween(periodStartDate, periodEndDate);
// Counts all weekdays (Mon-Fri) in the range`}
                      example="If start is 2025-01-15 and end is 2025-01-19, that's 5 business days."
                    >
                      <Input
                        type="date"
                        value={periodStartDate}
                        onChange={(e) => setPeriodStartDate(e.target.value)}
                      />
                    </DevField>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-500">Loppupäivä</Label>
                    <DevField
                      fieldId="period-end-date"
                      fieldLabel="Loppupäivä (Period End Date)"
                      userStory="User sets the end date of the benefit period to define the calculation range."
                      business="The end date marks the end of the calculation period (inclusive). Must be the same or later than the start date."
                      formula="businessDays = businessDaysBetween(startDate, endDate)"
                      code={`const businessDays = businessDaysBetween(periodStartDate, periodEndDate);
if (periodEndDate < periodStartDate) {
  // Show validation error
}`}
                      example="If start is 2025-01-15 and end is 2025-01-19, that's 5 business days (Mon-Fri)."
                    >
                      <Input
                        type="date"
                        value={periodEndDate}
                        onChange={(e) => setPeriodEndDate(e.target.value)}
                      />
                    </DevField>
                  </div>
                </div>
                {periodRangeInvalid && (
                  <p className="text-xs text-rose-600 mt-1">
                    Loppupäivän tulee olla sama tai myöhäisempi kuin alkupäivä.
                  </p>
                )}
              </div>

        

              {/* Vertailu – kytkin */}
              <div className="space-y-2 md:col-span-2">
          <Label>Näytä vertailujakso</Label>
            <div className="flex items-center gap-3 p-2 rounded-xl border bg-white">
             <Switch checked={compareMode} onCheckedChange={setCompareMode} />
              <span className="text-sm text-gray-600">
                Vertaa laskentaa eri perustepalkalla
              </span>
            </div>
          </div>

          {compareMode && (
            <fieldset className="md:col-span-2 p-4 rounded-lg border border-blue-200 bg-blue-50/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vertailupalkka €/kk</Label>
                  <DevField
                    fieldId="comparison-salary"
                    fieldLabel="Vertailupalkka (Comparison Salary)"
                    userStory="User enters an alternative salary amount to compare how different salary levels affect the daily allowance calculation."
                    business="Allows side-by-side comparison of unemployment benefits with different salary bases. Useful for salary negotiation scenarios."
                    code={`const [comparisonSalary, setComparisonSalary] = useState<number>(0);
// Optional comparison calculation with different base salary`}
                    example="Compare 2000€ vs 2500€ salary to see benefit differences."
                  >
                    <Input
                      type="number"
                      step={0.01}
                      value={comparisonSalary}
                      onChange={(e) => setComparisonSalary(parseFloat(e.target.value || "0"))}
                    />
                  </DevField>
                </div>
                
                <div className="space-y-2">
                  <Label>VERTAILU – Maksetut päivät (pv)</Label>
                  <DevField
                    fieldId="comparison-paid-days"
                    fieldLabel="Vertailu – Maksetut päivät (Comparison Paid Days)"
                    userStory="User manually enters an alternative number of paid days for comparison purposes to see how different paid day counts affect the calculation."
                    business="Allows side-by-side comparison with different paid days. Used when comparing scenarios with different working patterns or leave days."
                    formula="gross = adjustedDaily × comparePaidDays"
                    code={`const paidDays = comparePaidDays ?? results.days;
const gross = adjustedDaily * paidDays;`}
                    example="Compare calculation with 20 days vs 22 days to see impact on total benefit amount."
                  >
                    <Input
                      type="number"
                      step={1}
                      min={0}
                      value={comparePaidDays ?? ""}
                      onChange={(e) => {
                        const v = e.target.value.trim();
                        setComparePaidDays(v === "" ? null : Math.max(0, parseInt(v, 10) || 0));
                      }}
                      placeholder={`Oletus: ${results.days} pv`}
                    />
                  </DevField>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>VERTAILU – Päiväraha €/pv</Label>
                  <Input
                    type="number"
                    step={0.01}
                    value={compareDailyManual}
                    onChange={(e)=> setCompareDailyManual(parseFloat(e.target.value || "0"))}
                    placeholder="0,00"
                  />
                </div>
              </div>
            </fieldset>
          )}

              <div className="space-y-2 md:col-span-2">
                <Label>Maksetut päivät</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-2 rounded-xl border bg-white">
                    <Switch checked={autoPaidFromRange} onCheckedChange={setAutoPaidFromRange} />
                    <span className="text-sm text-gray-600">
                      Automaattinen jakson perusteella
                    </span>
                  </div>
                  <div className="space-y-1">
                    <Input
                      type="number"
                      value={businessDaysBetween(periodStartDate, addDaysISO(periodEndDate, 1))}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500">Lasketut arkipäivät</p>
                  </div>
                </div>
              </div>

              {!autoPaidFromRange && (
                <div className="space-y-2">
                  <Label>Maksetut päivät (manuaalinen)</Label>
                  <DevField
                    fieldId="manual-paid-days"
                    fieldLabel="Maksetut päivät (Manual Paid Days)"
                    userStory="User manually enters the number of paid days when automatic calculation from date range doesn't match their actual working days."
                    business="Overrides automatic business day calculation. Used when actual paid days differ from calendar business days (e.g., unpaid sick days, holidays)."
                    formula="gross = adjustedDaily × manualPaidDays"
                    code={`const paidDays = autoPaidFromRange 
  ? businessDaysBetween(periodStartDate, addDaysISO(periodEndDate, 1))
  : manualPaidDays;
const gross = adjustedDaily * paidDays;`}
                    example="If calendar shows 22 business days but user worked only 18 days, enter 18 manually."
                  >
                    <Input
                      type="number"
                      step={1}
                      value={manualPaidDays}
                      onChange={(e) => setManualPaidDays(parseInt(e.target.value || "0", 10))}
                    />
                  </DevField>
                  <p className="text-xs text-gray-500">Syötä maksetut päivät manuaalisesti.</p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Jäsenmaksu %</Label>
                <DevField
                  fieldId="member-fee-percent"
                  fieldLabel="Jäsenmaksu % (Member Fee Percentage)"
                  userStory="User sets the unemployment fund membership fee percentage, typically 1.5%, which is deducted from the gross benefit amount."
                  business="Unemployment fund membership fee is a percentage deduction from the gross benefit. Standard rate is 1.5% but may vary by fund."
                  formula="memberFee = gross × (memberFeePct / 100)"
                  code={`const memberFee = roundToCents(gross * (memberFeePct / 100));
const net = gross - withholding - memberFee;`}
                  example="If gross = 1000€ and memberFee = 1.5%: fee = 15€"
                >
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={memberFeePct}
                    onChange={(e) => setMemberFeePct(parseFloat(e.target.value || "0"))}
                  />
                </DevField>
              </div>

              <div className="space-y-2">
                <Label>Veroprosentti</Label>
                <DevField
                  fieldId="tax-percent"
                  fieldLabel="Veroprosentti (Tax Percentage)"
                  userStory="User enters their tax withholding percentage, typically 25%, which is deducted from the gross unemployment benefit."
                  business="Tax is withheld at source from unemployment benefits. Standard rate is 25% but user's actual tax rate may vary based on their tax card."
                  formula="withholding = gross × (taxPct / 100)"
                  code={`const withholding = roundToCents(gross * (taxPct / 100));
const net = gross - withholding - memberFee;`}
                  example="If gross = 1000€ and tax = 25%: withholding = 250€"
                >
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={taxPct}
                    onChange={(e) => setTaxPct(parseFloat(e.target.value || "0"))}
                  />
                </DevField>
              </div>

              <div className="space-y-2">
                <Label>Enimmäiskesto</Label>
                <Select value={String(maxDays)} onValueChange={(v) => setMaxDays(parseInt(v, 10))}>
                  <SelectTrigger><SelectValue placeholder="Valitse" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="300">300 pv</SelectItem>
                    <SelectItem value="400">400 pv</SelectItem>
                    <SelectItem value="500">500 pv</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Porrastus</Label>
                <DevField
                  fieldId="porrastus-auto"
                  fieldLabel="Porrastus (Benefit Stepping)"
                  userStory="User enables automatic benefit stepping where the daily allowance gradually decreases as unemployment continues. This reflects the Finnish unemployment benefit system where payments reduce over time."
                  business="Benefit stepping (porrastus) applies to those whose employment condition (TOE) was fulfilled on or after Sept 2, 2024. The benefit is paid at 100% for the first 40 days, 80% for days 41-170, and 75% after 170 days. Stepping is calculated relative to the full earnings-related allowance, not adjusted amounts. The benefit cannot return to 100% until the person fulfills the employment condition again."
                  formula={`Days 1-40: 100% of full benefit
Days 41-170: 80% of full benefit  
Days 171+: 75% of full benefit

avgFactor = Σ(factor per day) / totalDays`}
                  code={`const stepFactorByCumulativeDays = (cum: number) => {
  if (cum >= 170) return { factor: 0.75, label: "Porrastus 75%" };
  if (cum >= 40) return { factor: 0.80, label: "Porrastus 80%" };
  return { factor: 1.0, label: "Ei porrastusta" };
};

// Calculate weighted average for period
let sumFactor = 0;
for (let i = 0; i < days; i++) {
  const cumulative = priorPaidDays + (i + 1);
  sumFactor += stepFactorByCumulativeDays(cumulative).factor;
}
const avgStepFactor = sumFactor / days;
const fullDaily = (basePart + earningsPart) * avgStepFactor;`}
                  example="If prior paid days = 35 and current period = 10 days: Days 1-5 at 100%, days 6-10 at 80%. Average factor ≈ 0.90, so daily allowance is reduced to 90% of full amount."
                >
                  <div className="flex items-center gap-3 p-2 rounded-xl border bg-white">
                    <Switch checked={autoPorrastus} onCheckedChange={setAutoPorrastus} />
                    <span className="text-sm text-gray-600">
                      Automaattinen porrastus jakson mukaan
                    </span>
                  </div>
                </DevField>
              </div>

              {!autoPorrastus && (
                <div className="space-y-2">
                  <Label>Maksetut pv ennen jaksoa (manuaalinen)</Label>
                  <DevField
                    fieldId="prior-paid-days-manual"
                    fieldLabel="Maksetut pv ennen jaksoa (Prior Paid Days Manual)"
                    userStory="User manually enters the number of days they have already received unemployment benefits before this calculation period. This determines which benefit stepping level applies."
                    business="Prior paid days determine the stepping factor. If total (prior + current period) exceeds 40 days, the 80% step applies. After 170 days, the 75% step applies. This is used when automatic calculation doesn't match actual benefit history."
                    formula="cumulativeDays = priorPaidDays + currentDayIndex"
                    code={`const priorPaidDays = autoPorrastus 
  ? businessDaysBetween(benefitStartDate, periodStartDate)
  : priorPaidDaysManual;

for (let i = 0; i < days; i++) {
  const cumulative = priorPaidDays + (i + 1);
  const { factor } = stepFactorByCumulativeDays(cumulative);
  sumFactor += factor;
}`}
                    example="If prior paid = 38 days and current period = 10 days: Days 1-2 at 100% (cumulative 39-40), days 3-10 at 80% (cumulative 41-48)."
                  >
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={priorPaidDaysManual}
                      onChange={(e) => setPriorPaidDaysManual(parseInt(e.target.value || "0", 10))}
                    />
                  </DevField>
                </div>
              )}

              <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { key: "baseOnlyW", label: "Vain perusosa, työt.laji W" },
                  { key: "tyossaoloehto80", label: "Työssäoloehto 80%" },
                  { key: "yrittajaPaivaraha", label: "Yrittäjäpäiväraha" },
                  { key: "kulukorvaus", label: "Kulukorvaus" },
                  { key: "kulukorvausKorotus", label: "Kulukorvauksen korotusosa" },
                ].map((f: any) => (
                  <label key={f.key} className="flex items-center gap-2 p-2 rounded-xl border bg-white">
                    <Switch
                      checked={(flags as any)[f.key]}
                      onCheckedChange={(v) => setFlags((prev) => ({ ...prev, [f.key]: v }))}
                    />
                    <span>{f.label}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Etuudet ja Tulot</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={addBenefitRow}>
                  <Plus className="h-4 w-4" /> Lisää etuus
                </Button>
                <Button variant="outline" size="sm" onClick={addIncomeRow}>
                  <Plus className="h-4 w-4" /> Lisää tulo
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* TULOT (SOVITTELU) */}
              {incomes.map((i) => (
                <div
                  key={i.id}
                  className="grid grid-cols-1 md:grid-cols-12 items-end gap-3 p-3 rounded-xl border bg-white"
                >
                  <div className="md:col-span-5 space-y-2">
                    <Label>Tulon tyyppi</Label>
                    <Select
                      value={i.type}
                      onValueChange={(v) =>
                        setIncomes(prev => prev.map(x => x.id === i.id ? ({ ...x, type: v as IncomeRow["type"] }) : x))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Ei tuloja" />
                      </SelectTrigger>
                      <SelectContent>
                        {INCOME_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-5 space-y-2">
                    <Label>Tulot jaksolla (€)</Label>
                    <DevField
                      fieldId={`income-amount-${i.id}`}
                      fieldLabel="Tulot jaksolla (Income Amount)"
                      userStory="User enters the income amount received during the benefit period. This income will reduce the daily allowance through income adjustment."
                      business="Income during the benefit period reduces the allowance. The system applies protected income rules and adjustment percentages based on the income type."
                      formula="adjustment = max(0, (income - protectedIncome) × adjustmentPct)"
                      code={`const protectedAmount = protectedIncome * (incomeDays / periodDays);
const adjustmentBase = Math.max(0, income - protectedAmount);
const reduction = adjustmentBase * adjustmentPct;
const dailyAllowanceAfterIncome = dailyAllowance - (reduction / incomeDays);`}
                      example="If income = 500€, protected = 300€, adjustment = 50%: reduction = (500-300) × 0.5 = 100€"
                    >
                      <Input
                        type="number"
                        step={0.01}
                        value={i.amount}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value || "0");
                          setIncomes(prev => prev.map(x => x.id === i.id ? ({ ...x, amount: v }) : x));
                        }}
                        disabled={i.type === "none"}
                      />
                    </DevField>
                  </div>

                  <div className="md:col-span-2 flex justify-end">
                    <Button variant="ghost" size="icon" onClick={() => removeIncomeRow(i.id)}>
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* ETUUDET (VÄHENTÄVÄT, EIVÄT KÄYNNISTÄ SOVITTELUA) */}
              {benefits.map((b) => (
                <div
                  key={b.id}
                  className="grid grid-cols-1 md:grid-cols-12 items-end gap-3 p-3 rounded-xl border bg-white"
                >
                  <div className="md:col-span-5 space-y-2">
                    <Label>Etuus (vähentävä)</Label>
                    <Select
                      value={b.name}
                      onValueChange={(v) => {
                        setBenefits(prev => prev.map(x => x.id === b.id ? ({ ...x, name: v }) : x));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Valitse etuus" />
                      </SelectTrigger>
                      <SelectContent>
                        {BENEFIT_CATALOG.map((opt) => (
                          <SelectItem key={opt.value} value={opt.label}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-3 space-y-2">
                    <Label>Määrä jaksolla (€)</Label>
                    <DevField
                      fieldId={`benefit-amount-${b.id}`}
                      fieldLabel="Etuuden määrä (Benefit Amount)"
                      userStory="User enters the amount of other benefits (e.g., parental allowance, sickness benefit) received during the period. This reduces unemployment allowance."
                      business="Other social security benefits reduce unemployment allowance. The reduction is calculated after protected amount is subtracted."
                      formula="reduction = (benefitAmount - protectedAmount) / days"
                      code={`let totalBenefitReduction = 0;
for (const ben of benefits) {
  const excess = Math.max(ben.amount - (ben.protectedAmount || 0), 0);
  totalBenefitReduction += excess / days;
}
adjustedDaily = fullDaily - totalBenefitReduction;`}
                      example="If benefit = 800€, protected = 300€, days = 20: reduction = (800-300) / 20 = 25€/day"
                    >
                      <Input
                        type="number"
                        step={0.01}
                        value={b.amount}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value || "0");
                          setBenefits(prev => prev.map(x => x.id === b.id ? ({ ...x, amount: v }) : x));
                        }}
                      />
                    </DevField>
                  </div>

                  <div className="md:col-span-3 space-y-2">
                    <Label>Suojaosa (€)</Label>
                    <DevField
                      fieldId={`benefit-protected-${b.id}`}
                      fieldLabel="Suojaosa (Protected Amount)"
                      userStory="User sets the protected amount of the benefit that doesn't reduce unemployment allowance. Amount above this is deducted."
                      business="Protected amount allows receiving a certain amount of other benefits without reduction. Only the excess amount reduces unemployment allowance."
                      formula="excessBenefit = max(0, benefitAmount - protectedAmount)"
                      code={`const excess = Math.max(ben.amount - (ben.protectedAmount || 0), 0);
const reduction = excess / days;`}
                      example="If benefit = 800€ and protected = 300€: only (800-300) = 500€ reduces allowance."
                    >
                      <Input
                        type="number"
                        step={0.01}
                        value={b.protectedAmount || 0}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value || "0");
                          setBenefits(prev => prev.map(x => x.id === b.id ? ({ ...x, protectedAmount: v }) : x));
                        }}
                      />
                    </DevField>
                  </div>

                  <div className="md:col-span-1 flex justify-end">
                    <Button variant="ghost" size="icon" onClick={() => removeBenefitRow(b.id)}>
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Oikealla: yhteenveto */}
        <div className="min-w-0">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Päiväraha</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
            <CardContent
  className={cn("transition-all duration-300",compareMode && resultsCompare
      ? "space-y-10 px-6 py-6" // enemmän tilaa kun vertailu päällä
      : "space-y-6 px-4 py-4" // tiiviimpi oletus
  )}
>
  {/* 80% suoja -notifikaatio */}
  {results.eightyRuleTriggered && (
    <div className="p-3 rounded-md border bg-amber-50 text-amber-900 text-sm">
      <div className="font-medium mb-1">80 % -suoja aktivoitui</div>
      <p>
        Nykyinen täysi päiväraha ({euro(results.fullDailyBeforeProtection)}/pv) jäi alle
        80 % vertailutasosta ({euro(results.prevFullDailyRef)}/pv → min {euro(results.eightyFloor)}/pv).
        Laskenta käyttää vähintään 80 % tasoa ennen sovittelua.
      </p>
    </div>
  )}

  {/* 1) Meta-rivit – aina 2-sarakkeisena */}
  <div className="grid grid-cols-2 gap-2 text-sm">
    <div className="text-gray-500">Porrastus</div>
    <div className="text-right font-medium">{results.stepLabel}</div>

    <div className="text-gray-500">Suojaosuus</div>
    <div className="text-right font-medium">
      {euro(benefits.reduce((s, b) => s + (b.protectedAmount || 0), 0))}
    </div>

    <div className="text-gray-500">Maksetut päivät</div>
    <div className="text-right">{results.days} pv</div>

    <div className="text-gray-500">Täydet päivät</div>
    <div className="text-right">{results.fullDaysEquivalent.toFixed(2)} pv</div>

   

   

    <div className="text-gray-500">Kertyneet ennen jaksoa</div>
    <div className="text-right">
      {results.priorPaidDays.toFixed(2)} pv
    </div>

   

    <div className="text-gray-500">Enimmäiskesto</div>
    <div className="text-right">
      {Math.max(0, maxDays - results.cumulativePaidAfter).toFixed(2)} pv
    </div>

    <div className="text-gray-500">Perusosa</div>
    <div className="text-right">{euro(results.basePart)}</div>

    <div className="text-gray-500">Ansio-osa</div>
    <div className="text-right">{euro(results.earningsPart)}</div>

    <div className="text-gray-700">Täysi päiväraha</div>
    <div className="text-right font-semibold">{euro(results.fullDaily)}</div>

    {/* Vähennetty ansiopäiväraha - näytetään kun on etuuksia */}
    {results.benefitsTotalPure > 0 && (
      <>
        <div className="text-gray-700">Vähennetty ansiopäiväraha</div>
        <div className="text-right font-semibold">{euro(results.adjustedDaily)}</div>
      </>
    )}

    {/* Soviteltu päiväraha - näytetään kun on tuloja */}
    {results.incomesTotal > 0 && (
      <>
        <div className="text-gray-700">Soviteltu päiväraha</div>
        <div className="text-right font-semibold">{euro(results.adjustedDaily)}</div>
      </>
    )}

    {/* Näytä vain jos on etuuksia */}
    {results.benefitsTotalPure > 0 && (
      <>
        <div className="text-gray-500">Vähentävät etuudet / yht.</div>
        <div className="text-right font-medium">{euro(results.benefitsTotalPure)}</div>

        <div className="text-gray-500">Vähentävät etuudet / pv</div>
        <div className="text-right">{euro(results.perDayReductionBenefits)}</div>
      </>
    )}

    {/* Näytä vain jos on tuloja */}
    {results.incomesTotal > 0 && (
      <>
        <div className="text-gray-500">Tulot sovittelussa / yht.</div>
        <div className="text-right font-medium">{euro(results.incomesTotal)}</div>

        <div className="text-gray-500">Tulot sovittelussa / pv</div>
        <div className="text-right">{euro(results.perDayReductionIncome)}</div>
      </>
    )}
  </div>

  {/* 2) Verollinen osio – 2-col kun ei vertailua, muuten 4-col (Peruste | Vertailu | Δ) */}
  <div>
    <h3 className="font-medium mb-2">Verollisen etuuden määrä jaksolta</h3>

    {!(compareMode && resultsCompare) ? (
      /* --- EI vertailua: 2 saraketta --- */
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="text-gray-500">Brutto</div>
        <div className="text-right font-semibold">{euro(results.gross)}</div>

        <div className="text-gray-500">Perusosa</div>
        <div className="text-right">{euro(results.basePart * results.days)}</div>

        <div className="text-gray-500">Ansio-osa</div>
        <div className="text-right">{euro(results.earningsPart * results.days)}</div>

        <div className="text-gray-500">Ennakonpidätyksen määrä</div>
        <div className="text-right">{euro(results.withholding)}</div>

        <div className="text-gray-500">Netto ennakonpidätyksen jälkeen</div>
        <div className="text-right">{euro(results.gross - results.withholding)}</div>

        <div className="text-gray-500">Jäsenmaksu</div>
        <div className="text-right">{euro(results.memberFee)}</div>

        <div className="text-gray-700">Maksettava netto</div>
        <div className="text-right text-lg font-bold">{euro(results.net)}</div>
      </div>
    ) : (
      /* --- Vertailu: 4 saraketta --- */
      <div className={cn("gap-2 text-sm", "grid grid-cols-4")}>
        <div />
        <div className="text-right text-gray-600">Peruste</div>
        <div className="text-right text-gray-600">Vertailu</div>
        <div className="text-right text-gray-600">Erotus</div>

        {/* Vertailulaskennan apuarvot */}
        {(() => {
          const grossCmp = (resultsCompare!.adjustedDaily ?? 0) * resultsCompare!.days;
          const basePartCmpPerDay = DAILY_BASE; // sama perusosa
          const earningsPartCmpPerDay = (resultsCompare!.fullDaily ?? 0) - DAILY_BASE;
          const basePartCmp = basePartCmpPerDay * resultsCompare!.days;
          const earningsPartCmp = earningsPartCmpPerDay * resultsCompare!.days;
          const withholdingCmp = grossCmp * (taxPct / 100);
          const memberFeeCmp = grossCmp * (memberFeePct / 100);
          const netAfterWithholdingCmp = grossCmp - withholdingCmp;
          const netCmp = netAfterWithholdingCmp - memberFeeCmp;

          return (
            <>
              <Row3 label="Brutto" base={results.gross} compare={grossCmp} />
              <Row3 label="Perusosa" base={results.basePart * results.days} compare={basePartCmp} />
              <Row3 label="Ansio-osa" base={results.earningsPart * results.days} compare={earningsPartCmp} />
              <Row3 label="Ennakonpidätyksen määrä" base={results.withholding} compare={withholdingCmp} />
              <Row3
                label="Netto ennakonpidätyksen jälkeen"
                base={results.gross - results.withholding}
                compare={netAfterWithholdingCmp}
              />
              <Row3 label="Jäsenmaksu" base={results.memberFee} compare={memberFeeCmp} />
              <Row3 label="Maksettava netto" base={results.net} compare={netCmp} />
            </>
          );
        })()}
      </div>
    )}
  </div>

  {/* 3) Veroton osio – 2-col / 4-col vastaavasti */}
  <div>
    <h3 className="font-medium mb-2">Verottoman etuuden määrä jaksolta</h3>

    {!(compareMode && resultsCompare) ? (
      /* --- EI vertailua: 2 saraketta --- */
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="text-gray-500">Kulukorvaus / pv</div>
        <div className="text-right">{euro(results.travelAllowancePerDay)}</div>

        <div className="text-gray-500">Kulukorvaus yhteensä</div>
        <div className="text-right">{euro(results.travelAllowanceTotal)}</div>

        <div className="text-gray-700">Maksettava yhteensä</div>
        <div className="text-right font-semibold">{euro(results.totalPayable)}</div>
      </div>
    ) : (
      /* --- Vertailu: 4 saraketta --- */
      <div className={cn("gap-2 text-sm", "grid grid-cols-4")}>
        <div />
        <div className="text-right text-gray-600">Peruste</div>
        <div className="text-right text-gray-600">Vertailu</div>
        <div className="text-right text-gray-600">Erotus</div>

        {(() => {
          const grossCmp = (resultsCompare!.adjustedDaily ?? 0) * results.days;
          const withholdingCmp = grossCmp * (taxPct / 100);
          const memberFeeCmp = grossCmp * (memberFeePct / 100);
          const netCmp = grossCmp - withholdingCmp - memberFeeCmp;
          const totalPayableCmp = netCmp + results.travelAllowanceTotal; // kulukorvaus sama

          return (
            <>
              <Row3 label="Kulukorvaus / pv" base={results.travelAllowancePerDay} compare={results.travelAllowancePerDay} />
              <Row3
                label="Kulukorvaus yhteensä"
                base={results.travelAllowanceTotal}
                compare={results.travelAllowanceTotal}
              />
              <Row3 label="Maksettava yhteensä" base={results.totalPayable} compare={totalPayableCmp} />
            </>
          );
        })()}
      </div>
    )}
  </div>
</CardContent>


   </CardContent>
          </Card>
        </div>
      </main>

      {/* Breakdown section */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         
        </div>

        {/* Kaavakortti selkokielellä */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Laskukaavat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Switch checked={editFormulas} onCheckedChange={setEditFormulas} />
                  <span className="text-sm text-gray-700">Muokkaa kaavoja käyttöliittymästä</span>
                </div>
                {editFormulas && (
                  <Button variant="outline" onClick={() => setFormulaConfig({ ...defaultFormulaConfig })}>
                    Palauta oletukset
                  </Button>
                )}
              </div>

              {editFormulas && (
               <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
         <div className="space-y-1 p-3 border rounded-xl bg-white">
        <Label>Perusosa €/pv</Label>
        <Input
          type="number"
          step={0.01}
          value={formulaConfig.dailyBase}
          onChange={setFormulaNumber("dailyBase")}
        />
      </div>

      <div className="space-y-1 p-3 border rounded-xl bg-white">
        <Label>Taitekohta €/kk</Label>
        <Input
          type="number"
          step={0.01}
          value={formulaConfig.splitPointMonth}
          onChange={setFormulaNumber("splitPointMonth")}
        />
      </div>

      <div className="space-y-1 p-3 border rounded-xl bg-white">
        <Label>Tilastolliset vähennykset %</Label>
        <Input
          type="number"
          step={0.01}
          value={(formulaConfig.statDeductions * 100).toFixed(2)}
          onChange={setFormulaPercent("statDeductions")}
        />
      </div>

      <div className="space-y-1 p-3 border rounded-xl bg-white">
        <Label>Ansio-osa alempi kerroin %</Label>
        <Input
          type="number"
          step={1}
          value={(formulaConfig.rateBelow * 100).toFixed(0)}
          onChange={setFormulaPercent("rateBelow")}
        />
      </div>

      <div className="space-y-1 p-3 border rounded-xl bg-white">
        <Label>Ansio-osa ylempi kerroin %</Label>
        <Input
          type="number"
          step={1}
          value={(formulaConfig.rateAbove * 100).toFixed(0)}
          onChange={setFormulaPercent("rateAbove")}
        />
      </div>

      <div className="space-y-1 p-3 border rounded-xl bg-white">
        <Label>Porrastusraja 1 (pv)</Label>
        <Input
          type="number"
          step={1}
          value={formulaConfig.step1Threshold}
          onChange={setFormulaInt("step1Threshold")}
        />
      </div>

      <div className="space-y-1 p-3 border rounded-xl bg-white">
        <Label>Porrastuskerroin 1</Label>
        <Input
          type="number"
          step={0.01}
          value={formulaConfig.step1Factor}
          onChange={setFormulaNumber("step1Factor")}
        />
      </div>

      <div className="space-y-1 p-3 border rounded-xl bg-white">
        <Label>Porrastusraja 2 (pv)</Label>
        <Input
          type="number"
          step={1}
          value={formulaConfig.step2Threshold}
          onChange={setFormulaInt("step2Threshold")}
        />
      </div>

      <div className="space-y-1 p-3 border rounded-xl bg-white">
        <Label>Porrastuskerroin 2</Label>
        <Input
          type="number"
          step={0.01}
          value={formulaConfig.step2Factor}
          onChange={setFormulaNumber("step2Factor")}
        />
      </div>

      <div className="space-y-1 p-3 border rounded-xl bg-white">
        <Label>Kulukorvaus €/pv</Label>
        <Input
          type="number"
          step={1}
          value={formulaConfig.travelBase}
          onChange={setFormulaNumber("travelBase")}
        />
      </div>

      <div className="space-y-1 p-3 border rounded-xl bg-white">
        <Label>Kulukorvaus korotettuna €/pv</Label>
        <Input
          type="number"
          step={1}
          value={formulaConfig.travelElevated}
          onChange={setFormulaNumber("travelElevated")}
        />
      </div>
    </div>
  </>
)}

              <ul className="space-y-4">
                {formulaList.map((f) => (
                  <li key={f.key}>
                    <div className="text-sm font-medium text-gray-800">{f.title}</div>
                    <div className="font-mono text-xs bg-gray-50 border rounded-md px-2 py-1 inline-block mt-1">
                      {f.formula}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{f.explain}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
