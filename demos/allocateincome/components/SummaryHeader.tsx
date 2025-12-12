"use client";

import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SubsidyCorrection } from "../types";
import { roundToeMonthsDown } from "../utils/subsidyCalculations";
import { parseFinnishDate, formatDateFI } from "../utils";

type Summary = {
  completionDate: string;
  reviewPeriod: string;
  definitionPeriod: string;
  extendingPeriods: number;
  totalTOEMonths: number;
  displayTOEMonths?: number; // Näytettävä TOE-määrä (tarvittu määrä jos täyttyy)
  displayTOEMax?: number; // Näytettävä maksimi (tarvittu määrä jos täyttyy, muuten 12)
  totalJakaja: number;
  totalSalary: number;
  averageSalary: number;
  dailySalary: number;
  fullDailyAllowance: number;
  definitionType: string;
};

export default function SummaryHeader({
  summary,
  definitionType,
  setDefinitionType,
  formatCurrency,
  subsidyCorrection,
  hasSubsidizedWork,
  subsidizedEmployerName,
  reviewPeriodEnd,
  onWageDefinitionClick,
  wageDefinitionResult,
}: {
  summary: Summary;
  definitionType: "eurotoe" | "eurotoe6" | "viikkotoe" | "vuositulo" | "ulkomaan";
  setDefinitionType: (v: SummaryHeaderProps["definitionType"]) => void;
  formatCurrency: (n: number) => string;
  subsidyCorrection?: SubsidyCorrection | null;
  hasSubsidizedWork?: boolean;
  subsidizedEmployerName?: string;
  reviewPeriodEnd?: string;
  onWageDefinitionClick?: () => void; // Callback kun määrittelyjakso klikataan
  wageDefinitionResult?: { // Palkanmäärityksen tulos (määrittelyjakson mukainen)
    totalSalary: number;
    divisorDays: number;
    monthlyWage: number;
    dailyWage: number;
    definitionPeriodStart: string;
    definitionPeriodEnd: string;
  } | null;
}) {
  // Laske TOE-alkupäivä: aina seuraavan TOE-kertymän alkupäivä
  // Eli tarkastelujakson päättymispäivän seuraava päivä
  const toeStartDate = useMemo(() => {
    if (!reviewPeriodEnd) return undefined;
    const endDate = parseFinnishDate(reviewPeriodEnd);
    if (!endDate) return undefined;
    
    const nextDay = new Date(endDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    return formatDateFI(nextDay);
  }, [reviewPeriodEnd]);
  // Use corrected values if available, otherwise use system values
  // Always round TOE months down to nearest 0.5
  // Jos TOE täyttyy (displayTOEMonths > 0), käytä tarvittua määrää, muuten käytä kaikkia TOE-kuukausia
  const hasTOEFulfilled = summary.displayTOEMonths && summary.displayTOEMonths > 0;
  
  // Jos TOE täyttyy, käytä tarvittua määrää, muuten käytä kaikkia TOE-kuukausia
  const baseTOEMonths = hasTOEFulfilled
    ? (summary.displayTOEMonths ?? summary.totalTOEMonths)  // Jos TOE täyttyy, käytä tarvittua määrää (fallback totalTOEMonths)
    : summary.totalTOEMonths;  // Jos TOE ei täyty, käytä kaikkia TOE-kuukausia
  
  // Tarkista onko TOE täyttynyt laajennetun tarkastelujakson perusteella
  // Jos on, käytetään summary-arvoja subsidyCorrection-arvojen sijaan
  // MUTTA: Jos korjaus on tehty ja käytössä, käytetään korjauksen arvoja
  const hasActiveCorrection = subsidyCorrection && (
    subsidyCorrection.totalSalaryCorrection !== 0 || 
    subsidyCorrection.averageSalaryCorrection !== 0
  );
  const useSummaryValues = hasTOEFulfilled && summary.displayTOEMonths && summary.displayTOEMonths >= 12 
    && !hasActiveCorrection;
  
  const toeMonthsRaw = useSummaryValues
    ? baseTOEMonths  // Käytä summary-arvoja jos TOE täyttyy laajennetun tarkastelujakson perusteella
    : (subsidyCorrection && subsidyCorrection.toeCorrection !== 0 
        ? subsidyCorrection.toeCorrectedTotal 
        : baseTOEMonths);
  const toeMonths = roundToeMonthsDown(toeMonthsRaw);
  
  // Jos palkkatukityö korjataan, käytä korjattua arvoa
  // Jos TOE täyttyy laajennetun tarkastelujakson perusteella, käytä summary-arvoja
  // Jos korjattu arvo on >= 12, käytä korjattua arvoa / korjattu arvo
  // Jos korjattu arvo on < 12, käytä korjattua arvoa / 12
  const displayTOE = useSummaryValues
    ? roundToeMonthsDown(summary.displayTOEMonths ?? summary.totalTOEMonths)
    : (subsidyCorrection && subsidyCorrection.toeCorrection !== 0
        ? roundToeMonthsDown(subsidyCorrection.toeCorrectedTotal)
        : (hasTOEFulfilled
            ? roundToeMonthsDown(summary.displayTOEMonths ?? summary.totalTOEMonths)
            : toeMonths));
  
  const displayTOEMax = useSummaryValues
    ? roundToeMonthsDown(summary.displayTOEMax ?? 12)
    : (subsidyCorrection && subsidyCorrection.toeCorrection !== 0
        ? (toeMonths >= 12 
            ? roundToeMonthsDown(subsidyCorrection.toeCorrectedTotal)  // Jos korjattu >= 12, käytä korjattua arvoa
            : 12)  // Jos korjattu < 12, käytä 12
        : (hasTOEFulfilled && summary.displayTOEMax
            ? roundToeMonthsDown(summary.displayTOEMax ?? 12)
            : 12));
  
  // Tarkista onko TOE-kertymä alle 12kk (käytä korjattua arvoa jos saatavilla)
  const isTOELessThan12 = toeMonths < 12;
  
  // Korjattu TOE-palkka (totalSalary)
  // Jos palkanmääritys on tehty, käytä sen arvoa (määrittelyjakson mukainen)
  // Jos korjaus on tehty ja käytössä, käytä korjauksen arvoja
  // Muuten käytä summary-arvoja jos TOE täyttyy laajennetun tarkastelujakson perusteella
  const toeSalary = wageDefinitionResult?.totalSalary ?? (hasActiveCorrection
    ? subsidyCorrection.totalSalaryCorrected
    : (useSummaryValues
        ? summary.totalSalary
        : summary.totalSalary));
  
  // Jakaja: käytä palkanmäärityksen jakajaa jos saatavilla (määrittelyjakson mukainen), muuten summaryn jakajaa
  const displayJakaja = wageDefinitionResult?.divisorDays ?? summary.totalJakaja ?? 0;
  
  // Korjattu perustepalkka/kk (averageSalary) - lasketaan korjatusta TOE-palkasta
  // Jos korjaus on tehty ja käytössä, käytä korjauksen arvoja
  // Muuten käytä summary-arvoja jos TOE täyttyy laajennetun tarkastelujakson perusteella
  const wageBase = hasActiveCorrection
    ? subsidyCorrection.averageSalaryCorrected
    : (useSummaryValues
        ? summary.averageSalary
        : summary.averageSalary);
  
  // Recalculate daily salary and full daily allowance
  const dailySalary = wageBase / 21.5;
  
  // Laske täysi päiväraha TOE-palkan perusteella (dokumentaation mukaan)
  // 1. TOE-palkka / päivä = TOE-palkka / jakajanpäivät
  // 2. Täysi ansiopäiväraha = 37,21 + 0,45 × (TOE-palkka/pv - 37,21)
  let fullDailyAllowance = 0;
  if (toeSalary > 0 && displayJakaja > 0) {
    // 1. TOE-palkka / päivä
    const toeSalaryPerDay = toeSalary / displayJakaja;
    
    // 2. Täysi ansiopäiväraha = 37,21 + 0,45 × (TOE-palkka/pv - 37,21)
    const basicDailyAllowance = 37.21;
    const earningsPart = 0.45 * Math.max(0, toeSalaryPerDay - basicDailyAllowance);
    fullDailyAllowance = basicDailyAllowance + earningsPart;
  }
  return (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="space-y-6">
          {isTOELessThan12 ? (
            // Rajoitettu näkymä kun TOE < 12kk
            <>
              <div className="border-b border-gray-200 pb-4">
                <div className="flex flex-col gap-2">
                  {/* Otsikot */}
                  <div className="grid grid-cols-5 gap-4 text-sm">
                    <div className="font-medium text-gray-700">Täyttymispäivä</div>
                    <div className="font-medium text-gray-700">Tarkastelujakso</div>
                    <div className="font-medium text-gray-700">TOE-kuukaudet</div>
                    <div className="font-medium text-gray-700">Pidentävät jaksot pv</div>
                    <div className="font-medium text-gray-700">Palkkatuki</div>
                  </div>

                  {/* Arvot */}
                  <div className="grid grid-cols-5 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      {/* Jos korjaus on tehty, näytetään täyttymispäivä tai viiva */}
                      {subsidyCorrection && (subsidyCorrection.toeCorrection !== 0 || subsidyCorrection.totalSalaryCorrection !== 0 || subsidyCorrection.averageSalaryCorrection !== 0) ? (
                        // Jos TOE on täyttynyt, näytetään täyttymispäivä
                        summary.completionDate ? (
                          <span className="text-gray-900">
                            {summary.completionDate}
                          </span>
                        ) : (
                          // Jos TOE ei ole täyttynyt, näytetään viiva
                          <span className="text-gray-400">—</span>
                        )
                      ) : (
                        // Jos korjausta ei ole tehty, näytetään perustepalkka normaalisti
                        <>
                          <span className={cn(
                            "text-gray-900",
                            !useSummaryValues && subsidyCorrection && subsidyCorrection.averageSalaryCorrection !== 0 && "text-blue-600 font-semibold"
                          )}>
                            {formatCurrency(wageBase)}
                          </span>
                          {!useSummaryValues && subsidyCorrection && subsidyCorrection.averageSalaryCorrection !== 0 && (
                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                              Korjattu
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <div className="text-gray-900">{summary.reviewPeriod}</div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-gray-900",
                        !useSummaryValues && subsidyCorrection && subsidyCorrection.toeCorrection !== 0 && "text-blue-600 font-semibold"
                      )}>
                        {`${displayTOE.toFixed(1).replace(/\.0$/, '')}/${displayTOEMax.toFixed(1).replace(/\.0$/, '')}`}
                      </span>
                      {!useSummaryValues && subsidyCorrection && subsidyCorrection.toeCorrection !== 0 && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                          Korjattu
                        </span>
                      )}
                    </div>
                    <div className="text-gray-900">{summary.extendingPeriods}</div>
                    <div className="text-gray-900">
                      {hasSubsidizedWork && subsidizedEmployerName ? subsidizedEmployerName : "-"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Määrittelytyypit - näytetään aina */}
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
                            onChange={(e) => setDefinitionType(e.target.value as any)}
                            className="mr-1"
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
            </>
          ) : (
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
                <div className="font-medium text-gray-700">{definitionType === 'vuositulo' ? 'Vuositulo' : 'Jakaja'}</div>
                <div className="font-medium text-gray-700">{definitionType === 'vuositulo' ? 'Vuositulo' : 'TOE-palkka'}</div>
              </div>

              {/* Arvot */}
              <div className="grid grid-cols-7 gap-4 text-sm">
                <div className="text-gray-900">
                  {summary.completionDate || <span className="text-gray-400">—</span>}
                </div>
                <div className="text-gray-900">{summary.reviewPeriod}</div>
                <div className="text-gray-900">{summary.extendingPeriods}</div>
                <div 
                  className={cn(
                    "text-blue-600",
                    onWageDefinitionClick && (wageDefinitionResult || summary.definitionPeriod) && "cursor-pointer hover:underline"
                  )}
                  onClick={onWageDefinitionClick && (wageDefinitionResult || summary.definitionPeriod) ? onWageDefinitionClick : undefined}
                >
                  {wageDefinitionResult 
                    ? `${wageDefinitionResult.definitionPeriodStart} - ${wageDefinitionResult.definitionPeriodEnd}`
                    : (summary.definitionPeriod || <span className="text-gray-400">—</span>)}
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-gray-900",
                    !useSummaryValues && subsidyCorrection && subsidyCorrection.toeCorrection !== 0 && "text-blue-600 font-semibold"
                  )}>
                    {`${toeMonths.toFixed(1).replace(/\.0$/, '')}/12`}
                  </span>
                  {!useSummaryValues && subsidyCorrection && subsidyCorrection.toeCorrection !== 0 && (
                    <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                      Korjattu
                    </span>
                  )}
                </div>
                <div className="text-gray-900">{definitionType === 'vuositulo' ? formatCurrency(toeSalary) : displayJakaja}</div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-gray-900",
                    !useSummaryValues && subsidyCorrection && subsidyCorrection.totalSalaryCorrection !== 0 && "text-blue-600 font-semibold"
                  )}>
                    {formatCurrency(toeSalary)}
                  </span>
                  {!useSummaryValues && subsidyCorrection && subsidyCorrection.totalSalaryCorrection !== 0 && (
                    <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                      Korjattu
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Keskiosa - Palkanmäärittelyn yhteenveto */}
          <div className="border-b border-gray-200 pb-4">
            <div className="flex flex-col gap-2">
              {/* Otsikot */}
              <div className="grid grid-cols-7 gap-4 text-sm" >
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
                  {/* Jos korjaus on tehty, näytetään täyttymispäivä tai viiva */}
                  {subsidyCorrection && (subsidyCorrection.toeCorrection !== 0 || subsidyCorrection.totalSalaryCorrection !== 0 || subsidyCorrection.averageSalaryCorrection !== 0) ? (
                    // Jos TOE on täyttynyt, näytetään täyttymispäivä
                    summary.completionDate ? (
                      <span className="text-gray-900">
                        {summary.completionDate}
                      </span>
                    ) : (
                      // Jos TOE ei ole täyttynyt, näytetään viiva
                      <span className="text-gray-400">—</span>
                    )
                  ) : (
                    // Jos korjausta ei ole tehty, näytetään perustepalkka normaalisti
                    <>
                      <span className={cn(
                        "text-gray-900",
                        subsidyCorrection && subsidyCorrection.averageSalaryCorrection !== 0 && "text-blue-600 font-semibold"
                      )}>
                        {formatCurrency(wageBase)}
                      </span>
                      {subsidyCorrection && subsidyCorrection.averageSalaryCorrection !== 0 && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                          Korjattu
                        </span>
                      )}
                    </>
                  )}
                </div>
                <div className="text-gray-900">{formatCurrency(dailySalary)}</div>
                <div className="text-gray-900">{formatCurrency(fullDailyAllowance)}</div>
                <div className="text-gray-900">Kyllä (vaikuttaa laskentaan)</div>
                <div className="text-gray-900">2025/3,54</div>
                <div className="flex items-center">
                  <div className="w-4 h-4 border border-gray-400 rounded-full mr-2"></div>
                </div>
              </div>
            </div>
          </div>

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
                        onChange={(e) => setDefinitionType(e.target.value as any)}
                        className="mr-1"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
                <div className="col-span-2 text-blue-600">1.1.2026</div>
              </div>
            </div>
          </div>
            </>
          )}

          {/* Subsidy correction info banner */}
          {/* Näytetään vain jos TOE ei täyty laajennuksen jälkeen */}
          {subsidyCorrection && (subsidyCorrection.toeCorrection !== 0 || subsidyCorrection.totalSalaryCorrection !== 0) && !useSummaryValues && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
              <div className="font-medium text-blue-900 mb-1">Palkkatuettu työ korjattu manuaalisesti</div>
              <div className="text-blue-700 space-y-1">
                {subsidyCorrection.toeCorrection !== 0 && (
                  <div>
                    TOE-kertymä: {summary.totalTOEMonths.toFixed(1)} kk → {subsidyCorrection.toeCorrectedTotal.toFixed(1)} kk 
                    ({subsidyCorrection.toeCorrection > 0 ? "+" : ""}{subsidyCorrection.toeCorrection.toFixed(1)} kk)
                  </div>
                )}
                {subsidyCorrection.totalSalaryCorrection !== 0 && (
                  <div>
                    TOE-palkka: {formatCurrency(summary.totalSalary)} → {formatCurrency(subsidyCorrection.totalSalaryCorrected)}
                    ({subsidyCorrection.totalSalaryCorrection > 0 ? "+" : ""}{formatCurrency(subsidyCorrection.totalSalaryCorrection)})
                  </div>
                )}
                {subsidyCorrection.averageSalaryCorrection !== 0 && (
                  <div>
                    Perustepalkka/kk: {formatCurrency(summary.averageSalary)} → {formatCurrency(subsidyCorrection.averageSalaryCorrected)}
                    ({subsidyCorrection.averageSalaryCorrection > 0 ? "+" : ""}{formatCurrency(subsidyCorrection.averageSalaryCorrection)})
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

type SummaryHeaderProps = React.ComponentProps<typeof SummaryHeader>;


