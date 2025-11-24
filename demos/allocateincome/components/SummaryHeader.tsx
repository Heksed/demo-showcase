"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SubsidyCorrection } from "../types";
import { roundToeMonthsDown } from "../utils/subsidyCalculations";

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
}: {
  summary: Summary;
  definitionType: "eurotoe" | "eurotoe6" | "viikkotoe" | "vuositulo" | "ulkomaan";
  setDefinitionType: (v: SummaryHeaderProps["definitionType"]) => void;
  formatCurrency: (n: number) => string;
  subsidyCorrection?: SubsidyCorrection | null;
  hasSubsidizedWork?: boolean;
  subsidizedEmployerName?: string;
}) {
  // Use corrected values if available, otherwise use system values
  // Always round TOE months down to nearest 0.5
  // Jos TOE täyttyy (displayTOEMonths > 0), käytä tarvittua määrää, muuten käytä kaikkia TOE-kuukausia
  const hasTOEFulfilled = summary.displayTOEMonths && summary.displayTOEMonths > 0;
  
  // Jos TOE täyttyy, käytä tarvittua määrää, muuten käytä kaikkia TOE-kuukausia
  const baseTOEMonths = hasTOEFulfilled
    ? summary.displayTOEMonths  // Jos TOE täyttyy, käytä tarvittua määrää
    : summary.totalTOEMonths;  // Jos TOE ei täyty, käytä kaikkia TOE-kuukausia
  
  const toeMonthsRaw = subsidyCorrection && subsidyCorrection.toeCorrection !== 0 
    ? subsidyCorrection.toeCorrectedTotal 
    : baseTOEMonths;
  const toeMonths = roundToeMonthsDown(toeMonthsRaw);
  
  // Jos palkkatukityö korjataan, käytä korjattua arvoa
  // Jos korjattu arvo on >= 12, käytä korjattua arvoa / korjattu arvo
  // Jos korjattu arvo on < 12, käytä korjattua arvoa / 12
  const displayTOE = subsidyCorrection && subsidyCorrection.toeCorrection !== 0
    ? roundToeMonthsDown(subsidyCorrection.toeCorrectedTotal)
    : (hasTOEFulfilled
        ? roundToeMonthsDown(summary.displayTOEMonths!)
        : toeMonths);
  
  const displayTOEMax = subsidyCorrection && subsidyCorrection.toeCorrection !== 0
    ? (toeMonths >= 12 
        ? roundToeMonthsDown(subsidyCorrection.toeCorrectedTotal)  // Jos korjattu >= 12, käytä korjattua arvoa
        : 12)  // Jos korjattu < 12, käytä 12
    : (hasTOEFulfilled && summary.displayTOEMax
        ? roundToeMonthsDown(summary.displayTOEMax)
        : 12);
  
  // Tarkista onko TOE-kertymä alle 12kk (käytä korjattua arvoa jos saatavilla)
  const isTOELessThan12 = toeMonths < 12;
  
  // Korjattu TOE-palkka (totalSalary)
  const toeSalary = subsidyCorrection && subsidyCorrection.totalSalaryCorrection !== 0
    ? subsidyCorrection.totalSalaryCorrected
    : summary.totalSalary;
  
  // Korjattu perustepalkka/kk (averageSalary) - lasketaan korjatusta TOE-palkasta
  const wageBase = subsidyCorrection && subsidyCorrection.averageSalaryCorrection !== 0
    ? subsidyCorrection.averageSalaryCorrected
    : summary.averageSalary;
  
  // Recalculate daily salary and full daily allowance if wage base changed
  const dailySalary = wageBase / 21.5;
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
  const fullDailyAllowance = basicDailyAllowance + unemploymentBenefitPerDay;
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
                    <div className="font-medium text-gray-700">Perustepalkka/kk</div>
                    <div className="font-medium text-gray-700">Tarkastelujakso</div>
                    <div className="font-medium text-gray-700">TOE-kuukaudet</div>
                    <div className="font-medium text-gray-700">Pidentävät jaksot pv</div>
                    <div className="font-medium text-gray-700">Palkkatuki</div>
                  </div>

                  {/* Arvot */}
                  <div className="grid grid-cols-5 gap-4 text-sm">
                    <div className="flex items-center gap-2">
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
                    </div>
                    <div className="text-gray-900">{summary.reviewPeriod}</div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-gray-900",
                        subsidyCorrection && subsidyCorrection.toeCorrection !== 0 && "text-blue-600 font-semibold"
                      )}>
                        {`${displayTOE.toFixed(1).replace(/\.0$/, '')}/${displayTOEMax.toFixed(1).replace(/\.0$/, '')}`}
                      </span>
                      {subsidyCorrection && subsidyCorrection.toeCorrection !== 0 && (
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
                    <div className="col-span-2 text-blue-600">1.1.2026</div>
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
                <div className="text-gray-900">{summary.completionDate}</div>
                <div className="text-gray-900">{summary.reviewPeriod}</div>
                <div className="text-gray-900">{summary.extendingPeriods}</div>
                <div className="text-blue-600">{summary.definitionPeriod}</div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-gray-900",
                    subsidyCorrection && subsidyCorrection.toeCorrection !== 0 && "text-blue-600 font-semibold"
                  )}>
                    {`${toeMonths.toFixed(1).replace(/\.0$/, '')}/12`}
                  </span>
                  {subsidyCorrection && subsidyCorrection.toeCorrection !== 0 && (
                    <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                      Korjattu
                    </span>
                  )}
                </div>
                <div className="text-gray-900">{definitionType === 'vuositulo' ? formatCurrency(toeSalary) : summary.totalJakaja}</div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-gray-900",
                    subsidyCorrection && subsidyCorrection.totalSalaryCorrection !== 0 && "text-blue-600 font-semibold"
                  )}>
                    {formatCurrency(toeSalary)}
                  </span>
                  {subsidyCorrection && subsidyCorrection.totalSalaryCorrection !== 0 && (
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
          {subsidyCorrection && (subsidyCorrection.toeCorrection !== 0 || subsidyCorrection.totalSalaryCorrection !== 0) && (
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


