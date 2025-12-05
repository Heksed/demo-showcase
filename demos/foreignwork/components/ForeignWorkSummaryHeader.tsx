"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { roundToeMonthsDown } from "../../allocateincome/utils/subsidyCalculations";

type Summary = {
  completionDate?: string; // Täyttymispäivä
  reviewPeriod: string;
  extendingPeriods: number;
  totalTOEMonths: number;
  displayTOEMonths?: number;
  displayTOEMax?: number;
  definitionPeriod?: string; // Määrittelyjakso
  totalJakaja?: number; // Jakaja
  totalSalary?: number; // TOE-palkka
};

type WageDefinitionResult = {
  totalSalary: number;
  divisorDays: number;
  monthlyWage: number;
  dailyWage: number;
  definitionPeriodStart: string;
  definitionPeriodEnd: string;
};

interface ForeignWorkSummaryHeaderProps {
  summary: Summary;
  wageDefinitionResult: WageDefinitionResult | null;
  formatCurrency: (n: number) => string;
  toeStartDate?: string; // TOE-alkupäivä
  definitionType?: "eurotoe" | "eurotoe6" | "viikkotoe" | "vuositulo" | "ulkomaan";
  setDefinitionType?: (v: "eurotoe" | "eurotoe6" | "viikkotoe" | "vuositulo" | "ulkomaan") => void;
  onExtendingPeriodsClick?: () => void; // Callback kun pidentävät jaksot klikataan
}

export default function ForeignWorkSummaryHeader({
  summary,
  wageDefinitionResult,
  formatCurrency,
  toeStartDate,
  definitionType = "ulkomaan",
  setDefinitionType,
  onExtendingPeriodsClick,
}: ForeignWorkSummaryHeaderProps) {
  // Laske TOE-kuukaudet
  const toeMonthsRaw = summary.displayTOEMonths ?? summary.totalTOEMonths;
  const toeMonths = roundToeMonthsDown(toeMonthsRaw);
  const toeMax = roundToeMonthsDown(summary.displayTOEMax ?? 12);

  // Tarkista onko TOE täyttynyt (>= 12kk)
  const isTOEFulfilled = toeMonths >= 12;

  // Käytä palkanmäärityksen tuloksia jos saatavilla
  const wageBase = wageDefinitionResult?.monthlyWage ?? null;
  const hasWageDefinition = wageDefinitionResult !== null;

  // Määrittelyjakso on aina palkanmääritysjaksosta tuleva jakso
  const definitionPeriod = wageDefinitionResult 
    ? `${wageDefinitionResult.definitionPeriodStart} - ${wageDefinitionResult.definitionPeriodEnd}`
    : summary.definitionPeriod;

  // Laske päiväraha palkanmäärityksestä
  const dailySalary = wageDefinitionResult?.dailyWage ?? null;
  
  // Laske täysi päiväraha (sama logiikka kuin SummaryHeader:ssa)
  let fullDailyAllowance = 0;
  if (wageBase !== null) {
    const telDeductionRate = 0.0354;
    const salaryAfterTelDeduction = wageBase * (1 - telDeductionRate);
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
    const basicDailyAllowance = 37.21;
    fullDailyAllowance = basicDailyAllowance + unemploymentBenefitPerDay;
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="space-y-6">
          {isTOEFulfilled ? (
            // TOE >= 12kk: Näytä täyttymispäivä ja määrittelyjakso
            <>
              {/* Yläosa - Työssäoloehdon yhteenveto */}
              <div className="border-b border-gray-200 pb-4">
                <div className="flex flex-col gap-2">
                  {/* Otsikot */}
                  <div className="grid grid-cols-7 gap-4 text-sm">
                    <div className="font-medium text-gray-700">Täyttymispäivä</div>
                    <div className="font-medium text-gray-700">Tarkastelujakso</div>
                    <div className="font-medium text-gray-700">Pidentävät jaksot pv</div>
                    <div className="font-medium text-gray-700">Määrittelyjakso</div>
                    <div className="font-medium text-gray-700">TOE-kuukaudet</div>
                    <div className="font-medium text-gray-700">Jakaja</div>
                    <div className="font-medium text-gray-700">TOE-palkka</div>
                  </div>

                  {/* Arvot */}
                  <div className="grid grid-cols-7 gap-4 text-sm">
                    <div className="text-gray-900">
                      {summary.completionDate || <span className="text-gray-400">—</span>}
                    </div>
                    <div className="text-gray-900">{summary.reviewPeriod}</div>
                    <div 
                      className={cn(
                        "text-gray-900",
                        onExtendingPeriodsClick && "cursor-pointer hover:text-blue-600 hover:underline"
                      )}
                      onClick={onExtendingPeriodsClick}
                    >
                      {summary.extendingPeriods}
                    </div>
                    <div className="text-blue-600">
                      {definitionPeriod || <span className="text-gray-400">—</span>}
                    </div>
                    <div className="text-gray-900">
                      {`${toeMonths.toFixed(1).replace(/\.0$/, '')}/12`}
                    </div>
                    <div className="text-gray-900">{summary.totalJakaja || 0}</div>
                    <div className="text-gray-900">
                      {summary.totalSalary ? formatCurrency(summary.totalSalary) : "—"}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // TOE < 12kk: Näytä perustiedot
            <>
              {/* Yläosa - Työssäoloehdon yhteenveto */}
              <div className="border-b border-gray-200 pb-4">
                <div className="flex flex-col gap-2">
                  {/* Otsikot */}
                  <div className="grid grid-cols-7 gap-4 text-sm">
                    <div className="font-medium text-gray-700">Täyttymispäivä</div>
                    <div className="font-medium text-gray-700">Tarkastelujakso</div>
                    <div className="font-medium text-gray-700">Pidentävät jaksot pv</div>
                    <div className="font-medium text-gray-700">Määrittelyjakso</div>
                    <div className="font-medium text-gray-700">TOE-kuukaudet</div>
                    <div className="font-medium text-gray-700">Jakaja</div>
                    <div className="font-medium text-gray-700">TOE-palkka</div>
                  </div>

                  {/* Arvot */}
                  <div className="grid grid-cols-7 gap-4 text-sm">
                    <div className="text-gray-900">
                      {summary.completionDate || <span className="text-gray-400">—</span>}
                    </div>
                    <div className="text-gray-900">{summary.reviewPeriod}</div>
                    <div 
                      className={cn(
                        "text-gray-900",
                        onExtendingPeriodsClick && "cursor-pointer hover:text-blue-600 hover:underline"
                      )}
                      onClick={onExtendingPeriodsClick}
                    >
                      {summary.extendingPeriods}
                    </div>
                    <div className="text-blue-600">
                      {definitionPeriod || <span className="text-gray-400">—</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900">
                        {`${toeMonths.toFixed(1).replace(/\.0$/, '')}/${toeMax.toFixed(1).replace(/\.0$/, '')}`}
                      </span>
                    </div>
                    <div className="text-gray-900">{summary.totalJakaja || 0}</div>
                    <div className="text-gray-900">
                      {summary.totalSalary ? formatCurrency(summary.totalSalary) : "—"}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Keskiosa - Palkanmäärittelyn yhteenveto (näytetään vain kun palkanmääritys on tehty) */}
          {hasWageDefinition && wageBase !== null && (
            <div className="border-b border-gray-200 pb-4">
              <div className="flex flex-col gap-2">
                {/* Otsikot */}
                <div className="grid grid-cols-7 gap-4 text-sm">
                  <div className="font-medium text-gray-700">Perustepalkka/kk</div>
                  <div className="font-medium text-gray-700">Perustepalkka/pvä</div>
                  <div className="font-medium text-gray-700">Täysi päiväraha</div>
                  <div className="font-medium text-gray-700">80% suoja</div>
                  <div className="col-span-2 font-medium text-gray-700 whitespace-nowrap">TEL-vuosi ja vähennysprosentti</div>
                  <div className="font-medium text-gray-700">Yrittäjän jälkisuoja</div>
                </div>

                {/* Arvot */}
                <div className="grid grid-cols-7 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-gray-900",
                      hasWageDefinition && "text-blue-600 font-semibold"
                    )}>
                      {formatCurrency(wageBase)}
                    </span>
                    {hasWageDefinition && (
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                        Palkanmääritys
                      </span>
                    )}
                  </div>
                  <div className="text-gray-900">
                    {dailySalary !== null ? formatCurrency(dailySalary) : "—"}
                  </div>
                  <div className="text-gray-900">
                    {fullDailyAllowance > 0 ? formatCurrency(fullDailyAllowance) : "—"}
                  </div>
                  <div className="text-gray-900">Kyllä (vaikuttaa laskentaan)</div>
                  <div className="text-gray-900">2025/3,54</div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 border border-gray-400 rounded-full mr-2"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Alaosa - Määrittelytyyppi ja TOE-alkupäivä */}
          <div>
            <div className="flex flex-col gap-2">
              {/* Otsikot */}
              <div className="grid grid-cols-7 gap-4 text-sm">
                <div className="col-span-5 font-medium text-gray-700">Määrittelytyyppi</div>
                <div className="col-span-2 font-medium text-gray-700">TOE-alkupäivä</div>
              </div>

              {/* Arvot */}
              <div className="grid grid-cols-7 gap-4 text-sm">
                <div className="col-span-5 flex gap-4">
                  {([
                    { v: 'eurotoe', label: 'EuroTOE' },
                    { v: 'eurotoe6', label: 'EuroTOE (6kk)' },
                    { v: 'viikkotoe', label: 'ViikkoTOE' },
                    { v: 'vuositulo', label: 'Vuositulo' },
                    { v: 'ulkomaan', label: 'Ulkomaan työ' },
                  ] as const).map(opt => (
                    <label key={opt.v} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="definitionType"
                        value={opt.v}
                        checked={definitionType === opt.v}
                        onChange={(e) => setDefinitionType?.(e.target.value as any)}
                        className="mr-1"
                        disabled={!setDefinitionType}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
                <div className="col-span-2 text-blue-600">
                  {toeStartDate || <span className="text-gray-400">—</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

