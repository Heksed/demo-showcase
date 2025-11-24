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
import {
  isBusinessDay,
  businessDaysBetween,
  addDaysISO,
  calculateBusinessDate,
  calculateDateByCumulativePaidDays,
  euro,
  clamp,
  roundToCents,
} from "./utils";
import {
  PERIODS,
  type PeriodKey,
  DAYS_BY_PERIOD,
  BENEFIT_TYPES,
  BENEFIT_OPTIONS,
  BENEFIT_CATALOG,
  INCOME_OPTIONS,
  DAILY_BASE,
  SPLIT_POINT_MONTH,
  STAT_DEDUCTIONS,
  TRAVEL_ALLOWANCE_BASE,
  TRAVEL_ALLOWANCE_ELEVATED,
} from "./constants";
import type { BenefitType, IncomeRow } from "./types";
import { runSelfTests } from "./domain/tests";
import useFormulaConfig, { defaultFormulaConfig } from "./hooks/useFormulaConfig";
import useBenefitsAndIncomes from "./hooks/useBenefitsAndIncomes";
import useAllowanceCalculation from "./hooks/useAllowanceCalculation";
import useComparisonCalculation from "./hooks/useComparisonCalculation";
import SituationCard from "./components/SituationCard";
import BenefitsAndIncomesCard from "./components/BenefitsAndIncomesCard";
import SummaryCard from "./components/SummaryCard";
import StepPeriodsCard from "./components/StepPeriodsCard";
import FormulaCard from "./components/FormulaCard";

if (process.env.NODE_ENV !== 'production') {
  runSelfTests();
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

  // Calculation parameters
  const [baseSalary, setBaseSalary] = useState<number>(2030.61); // €/month
  const [comparisonSalary, setComparisonSalary] = useState<number>(0); // optional, not used in formulas now
  // Paid days source: auto from period or manual input
  const [autoPaidFromRange, setAutoPaidFromRange] = useState<boolean>(true);
  
  // Manually entered paid days (days) – used when autoPaidFromRange = false
  const [manualPaidDays, setManualPaidDays] = useState<number>(0);
  const [memberFeePct, setMemberFeePct] = useState<number>(0); // %
  const [taxPct, setTaxPct] = useState<number>(25); // tax percentage

  // Maximum duration selection (e.g. based on work history/age limits)
  const [maxDays, setMaxDays] = useState<number>(400); // 300 / 400 / 500

  // Step factor override
  const [stepFactorOverride, setStepFactorOverride] = useState<string>("auto");

  // Comparison
  const [compareMode, setCompareMode] = useState<boolean>(false);
  
  // Comparison manual inputs
  const [comparePaidDays, setComparePaidDays] = useState<number | null>(null); // null = use basic calculation days
  const [compareDailyManual, setCompareDailyManual] = useState<number>(0); // 0 = not set
  
  // Child increment
  const [childCount, setChildCount] = useState<number>(0); // 0-3+ children
  
  const [toeDateCompare, setToeDateCompare] = useState<string>("");


  // Additional settings (expandable if needed)
  const [flags, setFlags] = useState({
    baseOnlyW: false, // Base part only, employment type W
    tyossaoloehto80: false, // Employment condition 80%
    yrittajaPaivaraha: false, // Entrepreneur's allowance
    kulukorvaus: false, // Expense compensation (tax-free)
    kulukorvausKorotus: false, // Expense compensation increase portion
    lapsikorotus: false, // Child increment
    ulkomaanPaivaraha: false, // Foreign per diem
  });

  // Bridge Select's string callback to our union type for benefitType
  const handleBenefitTypeChange = (value: string) => setBenefitType(value as BenefitType);

  // ===============================
  // Hooks
  // ===============================
  const formulaConfigHook = useFormulaConfig();
  const { formulaConfig, editFormulas, setEditFormulas, setFormulaNumber, setFormulaInt, setFormulaPercent, resetFormulaConfig } = formulaConfigHook;

  const benefitsAndIncomesHook = useBenefitsAndIncomes();
  const { benefits, setBenefits, incomes, setIncomes, addBenefitRow, removeBenefitRow, addIncomeRow, removeIncomeRow } = benefitsAndIncomesHook;

  

  // ===============================
  // Calculation
  // ===============================
  const results = useAllowanceCalculation({
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
  });

  const periodRangeInvalid = useMemo(() => {
    if (!periodStartDate || !periodEndDate) return false;
    return new Date(periodEndDate) < new Date(periodStartDate);
  }, [periodStartDate, periodEndDate]);

  // Vertailupalkka
  const resultsCompare = useComparisonCalculation({
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
  });

  // Row3 and formulaList are now in SummaryCard and FormulaCard components

  // Benefits and incomes management functions are now in useBenefitsAndIncomes hook

  // Aktivoi sovittelujakso vain tuloista (ei etuuksista)
  React.useEffect(() => {
    const hasEarnings = incomes.some(i => i.type !== "none" && i.amount > 0);
    if (hasEarnings && !period) setPeriod("1m"); // oletuksena kuukausijakso
  }, [incomes, period]);

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 border bg-white">
        <div className="w-full max-w-[98%] mx-auto px-6 py-3 flex items-center justify-between">
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
    "w-full max-w-[98%] mx-auto px-6 py-6 grid gap-6 transition-all duration-300",
    compareMode
      ? "lg:grid-cols-[1.6fr_1.4fr]" // vertailutilassa: oikea leveämpi
      : "lg:grid-cols-[2fr_1fr]"     // normaali: vasen 2/3, oikea 1/3
  )}
>
  {/* Vasemmalla: tilanne + etuudet */}
  <div className="space-y-2 min-w-0">
          <SituationCard
            calcDate={calcDate}
            setCalcDate={setCalcDate}
            period={period}
            setPeriod={setPeriod}
            benefitType={benefitType}
            handleBenefitTypeChange={handleBenefitTypeChange}
            toeDate={toeDate}
            setToeDate={setToeDate}
            baseSalary={baseSalary}
            setBaseSalary={setBaseSalary}
            benefitStartDate={benefitStartDate}
            setBenefitStartDate={setBenefitStartDate}
            periodStartDate={periodStartDate}
            setPeriodStartDate={setPeriodStartDate}
            periodEndDate={periodEndDate}
            setPeriodEndDate={setPeriodEndDate}
            periodRangeInvalid={periodRangeInvalid}
            stepFactorOverride={stepFactorOverride}
            setStepFactorOverride={setStepFactorOverride}
            autoPaidFromRange={autoPaidFromRange}
            setAutoPaidFromRange={setAutoPaidFromRange}
            manualPaidDays={manualPaidDays}
            setManualPaidDays={setManualPaidDays}
            memberFeePct={memberFeePct}
            setMemberFeePct={setMemberFeePct}
            taxPct={taxPct}
            setTaxPct={setTaxPct}
            maxDays={maxDays}
            setMaxDays={setMaxDays}
            compareMode={compareMode}
            setCompareMode={setCompareMode}
            comparisonSalary={comparisonSalary}
            setComparisonSalary={setComparisonSalary}
            comparePaidDays={comparePaidDays}
            setComparePaidDays={setComparePaidDays}
            compareDailyManual={compareDailyManual}
            setCompareDailyManual={setCompareDailyManual}
            results={results}
            flags={flags}
            setFlags={setFlags}
            childCount={childCount}
            setChildCount={setChildCount}
          />

          <BenefitsAndIncomesCard
            benefits={benefits}
            setBenefits={setBenefits}
            incomes={incomes}
            setIncomes={setIncomes}
            addBenefitRow={addBenefitRow}
            removeBenefitRow={removeBenefitRow}
            addIncomeRow={addIncomeRow}
            removeIncomeRow={removeIncomeRow}
          />
        </div>

        {/* Oikealla: yhteenveto */}
        <div className="min-w-0">
          <SummaryCard
            compareMode={compareMode}
            resultsCompare={resultsCompare}
            results={results}
            benefits={benefits}
            maxDays={maxDays}
            taxPct={taxPct}
            memberFeePct={memberFeePct}
          />

          {compareMode && resultsCompare?.stepPeriods ? (
            <StepPeriodsCard
              stepPeriods={resultsCompare.stepPeriods}
              days={resultsCompare.days}
              periodStartDate={periodStartDate}
              periodEndDate={periodEndDate}
            />
          ) : results.stepPeriods ? (
            <StepPeriodsCard
              stepPeriods={results.stepPeriods}
              days={results.days}
              periodStartDate={periodStartDate}
              periodEndDate={periodEndDate}
            />
          ) : null}
        </div>
      </main>

      {/* Breakdown section */}
      <section className="w-full max-w-[98%] mx-auto px-6 pb-12">
        <FormulaCard
          formulaConfig={formulaConfig}
          editFormulas={editFormulas}
          setEditFormulas={setEditFormulas}
          setFormulaNumber={setFormulaNumber}
          setFormulaInt={setFormulaInt}
          setFormulaPercent={setFormulaPercent}
          resetFormulaConfig={resetFormulaConfig}
          baseSalary={baseSalary}
          taxPct={taxPct}
          memberFeePct={memberFeePct}
          results={results}
          flags={flags}
        />
      </section>
    </div>
  );
}
