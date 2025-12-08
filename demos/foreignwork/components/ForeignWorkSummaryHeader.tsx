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
  onWageDefinitionClick?: () => void; // Callback kun määrittelyjakso klikataan
}

export default function ForeignWorkSummaryHeader({
  summary,
  wageDefinitionResult,
  formatCurrency,
  toeStartDate,
  definitionType = "ulkomaan",
  setDefinitionType,
  onExtendingPeriodsClick,
  onWageDefinitionClick,
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
  
  // Jakaja: käytä palkanmäärityksen jakajaa jos saatavilla (määrittelyjakson mukainen), muuten summaryn jakajaa
  const displayJakaja = wageDefinitionResult?.divisorDays ?? summary.totalJakaja ?? 0;
  
  // TOE-palkka: käytä palkanmäärityksen palkkaa jos saatavilla (määrittelyjakson mukainen), muuten summaryn palkkaa
  const displayTOESalary = wageDefinitionResult?.totalSalary ?? summary.totalSalary ?? 0;
  
  // Laske täysi päiväraha TOE-palkan perusteella (dokumentaation mukaan)
  // 1. TOE-palkka / päivä = TOE-palkka / jakajanpäivät
  // 2. Täysi ansiopäiväraha = 37,21 + 0,45 × (TOE-palkka/pv - 37,21)
  let fullDailyAllowance = 0;
  if (displayTOESalary > 0 && displayJakaja > 0) {
    // 1. TOE-palkka / päivä
    const toeSalaryPerDay = displayTOESalary / displayJakaja;
    
    // 2. Täysi ansiopäiväraha = 37,21 + 0,45 × (TOE-palkka/pv - 37,21)
    const basicDailyAllowance = 37.21;
    const earningsPart = 0.45 * Math.max(0, toeSalaryPerDay - basicDailyAllowance);
    fullDailyAllowance = basicDailyAllowance + earningsPart;
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
                    <div 
                      className={cn(
                        "text-blue-600",
                        onWageDefinitionClick && definitionPeriod && "cursor-pointer hover:underline"
                      )}
                      onClick={onWageDefinitionClick && definitionPeriod ? onWageDefinitionClick : undefined}
                    >
                      {definitionPeriod || <span className="text-gray-400">—</span>}
                    </div>
                    <div className="text-gray-900">
                      {`${toeMonths.toFixed(1).replace(/\.0$/, '')}/12`}
                    </div>
                    <div className="text-gray-900">{displayJakaja}</div>
                    <div className="text-gray-900">
                      {displayTOESalary ? formatCurrency(displayTOESalary) : "—"}
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
                    <div 
                      className={cn(
                        "text-blue-600",
                        onWageDefinitionClick && definitionPeriod && "cursor-pointer hover:underline"
                      )}
                      onClick={onWageDefinitionClick && definitionPeriod ? onWageDefinitionClick : undefined}
                    >
                      {definitionPeriod || <span className="text-gray-400">—</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900">
                        {`${toeMonths.toFixed(1).replace(/\.0$/, '')}/${toeMax.toFixed(1).replace(/\.0$/, '')}`}
                      </span>
                    </div>
                    <div className="text-gray-900">{displayJakaja}</div>
                    <div className="text-gray-900">
                      {displayTOESalary ? formatCurrency(displayTOESalary) : "—"}
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

