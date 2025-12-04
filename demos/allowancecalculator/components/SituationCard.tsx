// ===============================
// Component: Situation Card
// ===============================

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DevField } from "@/components/DevField";
import { businessDaysBetween, addDaysISO } from "../utils";
import { PERIODS, BENEFIT_TYPES } from "../constants";
import type { BenefitType } from "../types";

interface SituationCardProps {
  // Basic information
  calcDate: string;
  setCalcDate: (value: string) => void;
  period: string;
  setPeriod: (value: string) => void;
  benefitType: BenefitType;
  handleBenefitTypeChange: (value: string) => void;
  toeDate: string;
  setToeDate: (value: string) => void;
  baseSalary: number;
  setBaseSalary: (value: number) => void;
  benefitStartDate: string;
  setBenefitStartDate: (value: string) => void;
  periodStartDate: string;
  setPeriodStartDate: (value: string) => void;
  periodEndDate: string;
  setPeriodEndDate: (value: string) => void;
  periodRangeInvalid: boolean;

  // Calculation parameters
  stepFactorOverride: string;
  setStepFactorOverride: (value: string) => void;
  autoPaidFromRange: boolean;
  setAutoPaidFromRange: (value: boolean) => void;
  manualPaidDays: number;
  setManualPaidDays: (value: number) => void;
  memberFeePct: number;
  setMemberFeePct: (value: number) => void;
  taxPct: number;
  setTaxPct: (value: number) => void;
  maxDays: number;
  setMaxDays: (value: number) => void;

  // Comparison
  compareMode: boolean;
  setCompareMode: (value: boolean) => void;
  comparisonSalary: number;
  setComparisonSalary: (value: number) => void;
  comparePaidDays: number | null;
  setComparePaidDays: (value: number | null) => void;
  compareDailyManual: number;
  setCompareDailyManual: (value: number) => void;
  results: {
    days: number;
  };

  // Flags
  flags: {
    baseOnlyW: boolean;
    tyossaoloehto80: boolean;
    kulukorvaus: boolean;
    kulukorvausKorotus: boolean;
    lapsikorotus: boolean;
    ulkomaanPaivaraha: boolean;
  };
  setFlags: React.Dispatch<React.SetStateAction<SituationCardProps["flags"]>>;
  childCount: number;
  setChildCount: (value: number) => void;
}

export default function SituationCard({
  calcDate,
  setCalcDate,
  period,
  setPeriod,
  benefitType,
  handleBenefitTypeChange,
  toeDate,
  setToeDate,
  baseSalary,
  setBaseSalary,
  benefitStartDate,
  setBenefitStartDate,
  periodStartDate,
  setPeriodStartDate,
  periodEndDate,
  setPeriodEndDate,
  periodRangeInvalid,
  stepFactorOverride,
  setStepFactorOverride,
  autoPaidFromRange,
  setAutoPaidFromRange,
  manualPaidDays,
  setManualPaidDays,
  memberFeePct,
  setMemberFeePct,
  taxPct,
  setTaxPct,
  maxDays,
  setMaxDays,
  compareMode,
  setCompareMode,
  comparisonSalary,
  setComparisonSalary,
  comparePaidDays,
  setComparePaidDays,
  compareDailyManual,
  setCompareDailyManual,
  results,
  flags,
  setFlags,
  childCount,
  setChildCount,
}: SituationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tilanne</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        <div className="space-y-6">
          <Label>Laskentapäivä *</Label>
          <DevField
            fieldId="calculation-date"
            fieldLabel="Laskentapäivä (Calculation Day)"
            userStory="The user selects or confirms the Calculation Day used by the benefit calculator. By default this is the payable day being simulated (or the period start), but the user can override it to test retroactive/what-if scenarios. The calculator then fetches the correct rates and rules that are in force on that date."
            business="The Calculation Day is the effective-date anchor for all time-dependent parameters in the unemployment benefit calculation (e.g., index-linked amounts, child increments, earnings-disregard rules, tax settings, and step thresholds). For a single day, use that day as the Calculation Day. For multi-day periods, compute day-by-day using each day as its own Calculation Day and sum the results. If a simplified mode is needed, use the period start date as the Calculation Day only if no rule changes occur inside the period."
            formula="params(calcDay) = ruleset.effectiveAt(calcDay)\nstep(calcDay) = stepFrom(priorPaidDaysBefore(calcDay), params(calcDay).stepThresholds)\ndailyAmount(calcDay) = computeDaily(baseInputs, params(calcDay), step(calcDay))\nperiodAmount = Σ dailyAmount(d) for each payable day d in [periodStart, periodEnd]"
            code={`const [calcDate, setCalcDate] = useState<string>(new Date().toISOString().slice(0, 10));

// Get effective parameters for the calculation date
const effectiveParams = getEffectiveParams(calcDate);
const stepThresholds = effectiveParams.stepThresholds;
const dailyBase = effectiveParams.dailyBase;
const splitPointMonth = effectiveParams.splitPointMonth;

// Calculate step factor based on prior paid days before calc date
const priorPaidDays = businessDaysBetween(benefitStartDate, calcDate);
const stepFactor = calculateStepFactor(priorPaidDays, stepThresholds);`}
            example="Rates change on 2025-01-01.\n• Calculating 2024-12-30 → use 2024 rules.\n• Calculating 2025-01-02 → use 2025 rules.\nFor a period 2024-12-29…2025-01-03, compute each day with its own Calculation Day so the rule change on 2025-01-01 is handled correctly."
          >
            <Input type="date" value={calcDate} onChange={(e) => setCalcDate(e.target.value)} />
          </DevField>
        </div>

        <div className="space-y-2">
          <Label>Sovittelujakso</Label>
          <DevField
            fieldId="adjustment-period"
            fieldLabel="Sovittelujakso (Adjustment Period)"
            userStory="The user reviews or inputs the adjustment period to ensure that all income within that time frame is correctly included in the benefit calculation. The user can view, edit, or confirm the start and end dates of the adjustment period before benefit processing."
            business="The adjustment period (settlement period) defines the time range during which earned income affects the amount of unemployment benefit paid. Any income received within this period is adjusted against the daily allowance according to the applicable earnings disregard rules. The adjustment period typically corresponds to the employer's pay cycle or a 4-week/1-month benefit period determined by the fund."
            formula="adjustedBenefit = baseBenefit – adjustment(incomeDuringPeriod, disregardRules)"
            code={`const periodDays = period ? DAYS_BY_PERIOD[period as PeriodKey] : 0;
const perDayReduction = (incomesTotal * 0.5) / periodDays; // 50% / jakson pv
const adjustedBenefit = baseBenefit - perDayReduction;`}
            example="If the adjustment period is 2025-03-01 – 2025-03-31 and the person earns €600 during that time, the income is distributed evenly over the period and reduces the daily allowance according to the earnings disregard. The next adjustment period starts immediately after the previous one ends."
          >
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
          </DevField>
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
            business="The TOE (fulfilment of the employment condition) date establishes eligibility for the earnings-related unemployment benefit, but it does not define the starting point for step calculation. The step counter (prior paid days) begins from the first paid unemployment benefit day, i.e. the first day for which the benefit has actually been paid."
            formula="priorPaidDays = businessDaysBetween(toeDate, periodStartDate)"
            code={`const priorPaidDays = businessDaysBetween(toeDate, periodStartDate);
                `}
            example="If the TOE date is 2024-01-01 but the person applies for unemployment benefit on 2025-01-01 and the first paid day is 2025-01-02, the step calculation starts from 2025-01-02, not from the TOE date."
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

        {/* Porrastusvalinta */}
        <div className="space-y-2 md:col-span-2">
          <Label>Porrastus</Label>
          <DevField
            fieldId="step-factor-override"
            fieldLabel="Porrastus (Step Factor Override)"
            userStory="User can override the automatic step factor calculation to see how the allowance would look at different stepping levels (80% or 75%)."
            business="Allows testing different benefit reduction scenarios. Normal stepping: 100% for first 40 days, 80% for days 41-170, 75% for days 171+. This override applies a fixed factor to the entire period."
            formula="stepFactor = selectedOverride || calculatedStepFactor"
            code={`const stepFactor = stepFactorOverride || calculatedStepFactor;
const earningsPart = earningsPartRaw * stepFactor;
const fullDaily = basePart + earningsPart;`}
            example="Select 80% to see how allowance looks if you're already in the 80% stepping phase, or 75% for the final stepping phase."
          >
            <Select value={stepFactorOverride} onValueChange={setStepFactorOverride}>
              <SelectTrigger>
                <SelectValue placeholder="Automaattinen porrastus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automaattinen porrastus</SelectItem>
                <SelectItem value="1.0">100% (ei porrastusta)</SelectItem>
                <SelectItem value="0.8">80% porrastus</SelectItem>
                <SelectItem value="0.75">75% porrastus</SelectItem>
              </SelectContent>
            </Select>
          </DevField>
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
                <DevField
                  fieldId="comparison-daily-allowance"
                  fieldLabel="VERTAILU – Päiväraha €/pv (Comparison Daily Allowance)"
                  userStory="The user manually enters a daily allowance amount for comparison purposes to see how different daily allowance rates affect the total benefit calculation and net income."
                  business="This field allows users to override the calculated daily allowance with a custom value for comparison scenarios. When set to a value greater than 0, it takes precedence over the automatically calculated daily allowance in the comparison calculation. This is useful for testing different allowance rates, negotiating scenarios, or comparing with alternative benefit schemes."
                  formula="comparisonDailyAllowance = compareDailyManual > 0 ? compareDailyManual : calculatedDailyAllowance\ncomparisonGross = comparisonDailyAllowance × paidDays\ncomparisonNet = comparisonGross - withholding - memberFee"
                  code={`const [compareDailyManual, setCompareDailyManual] = useState<number>(0);

// In comparison calculation
let cmpFullDaily = 0;
if (compareDailyManual > 0) {
  cmpFullDaily = compareDailyManual; // Use manual override
} else {
  cmpFullDaily = calculatedDailyAllowance; // Use calculated value
}

const comparisonGross = cmpFullDaily * paidDays;`}
                  example="If the calculated daily allowance is €45.50 but the user wants to compare with €50.00, they enter 50.00 in this field. The comparison will then show results using €50.00 daily allowance instead of the calculated €45.50."
                >
                  <Input
                    type="number"
                    step={0.01}
                    value={compareDailyManual}
                    onChange={(e) => setCompareDailyManual(parseFloat(e.target.value || "0"))}
                    placeholder="0,00"
                  />
                </DevField>
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

        <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { key: "baseOnlyW", label: "Vain perusosa" },
            { key: "tyossaoloehto80", label: "Työssäoloehto 80%" },
            { key: "kulukorvaus", label: "Kulukorvaus" },
            { key: "kulukorvausKorotus", label: "Kulukorvauksen korotusosa" },
            { key: "lapsikorotus", label: "Lapsikorotus" },
            { key: "ulkomaanPaivaraha", label: "Ulkomaan päiväraha" },
          ].map((f) => (
            <label key={f.key} className="flex items-center gap-2 p-2 rounded-xl border bg-white">
              <Switch
                checked={(flags as any)[f.key]}
                onCheckedChange={(v) => setFlags((prev) => ({ ...prev, [f.key]: v }))}
              />
              <span>{f.label}</span>
            </label>
          ))}
        </div>

        {flags.lapsikorotus && (
          <div className="space-y-2">
            <Label className="text-xs text-gray-500">Huollettavien lasten määrä</Label>
            <Select value={childCount.toString()} onValueChange={(v) => setChildCount(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Ei lapsia</SelectItem>
                <SelectItem value="1">1 lapsi (+5,84 €/pv)</SelectItem>
                <SelectItem value="2">2 lasta (+8,57 €/pv)</SelectItem>
                <SelectItem value="3">3+ lasta (+11,05 €/pv)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {flags.ulkomaanPaivaraha && (
          <div className="space-y-2">
            <DevField
              fieldId="foreign-per-diem"
              fieldLabel="Ulkomaan päiväraha (Foreign Per Diem)"
              userStory="The user selects destination countries, travel start and end times, and meal/accommodation benefits. The system calculates foreign per diem according to tax administration regulations."
              business="Foreign per diem is determined per travel day (24-hour periods) based on the country where the travel day ends. If it ends on a ship or plane, the decisive country is the last departure/first arrival country. Each country has an annual maximum amount (2025: country-specific euro amounts). Domestic per diems (2025: full day 53 €, partial day 24 €) are determined separately."
              formula="for each 24h travelDay: country = countryWhereDayEnds(travelDay), base = perDiemTable2025[country], base = applyPartialDayRules(base, hoursInFinalDay), base = applyMealReductions(base, providedMeals), totalPerDiem = Σ base"
              code={`type PerDiemTable = Record<string, number>; // e.g. { "NL": 86, "DE": 76, ... } for 2025
type TravelLeg = { from: ISO; to: ISO; endCountry: string };
type Meal = 'breakfast' | 'lunch' | 'dinner';

function perDiemForSegment(endCountry: string, hours: number, p: PerDiemParams, providedMeals: Meal[]): number {
  const base = p.table[endCountry] ?? 0;
  let amount = p.partialDayRule(hours, base);
  for (const m of providedMeals) {
    const r = p.mealReductions[m] ?? 0;
    amount -= amount * r;
  }
  return Math.max(0, roundToCents(amount));
}`}
              example="Business trip 2025-02-10 08:00 → 2025-02-12 13:00. 1st travel day ends 2025-02-11 08:00 in Netherlands → use NL per diem (e.g. 86 €). 2nd travel day ends 2025-02-12 08:00 in Netherlands → 86 €. Remaining 5h → partial day rule/tax authority guidelines. Sum and deduct provided meals."
            >
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                <p className="font-medium">Ulkomaan päiväraha (työmatkojen verovapaa päiväraha)</p>
                <p className="text-xs mt-1">Tarvitaanko tässä laskurissa? Vaaditaan monimutkainen laskentalogiikka matkavuorokausien, maakohtaisten määrien ja aterioiden vähennysten kanssa.</p>
              </div>
            </DevField>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

