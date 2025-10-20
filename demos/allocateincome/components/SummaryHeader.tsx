"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Summary = {
  completionDate: string;
  reviewPeriod: string;
  definitionPeriod: string;
  extendingPeriods: number;
  totalTOEMonths: number;
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
}: {
  summary: Summary;
  definitionType: "eurotoe" | "eurotoe6" | "viikkotoe" | "vuositulo" | "ulkomaan";
  setDefinitionType: (v: SummaryHeaderProps["definitionType"]) => void;
  formatCurrency: (n: number) => string;
}) {
  return (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="space-y-6">
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
                <div className="text-gray-900">{`${Math.round(summary.totalTOEMonths * 2) / 2}/12`}</div>
                <div className="text-gray-900">{definitionType === 'vuositulo' ? formatCurrency(summary.totalSalary) : summary.totalJakaja}</div>
                <div className="text-gray-900">{formatCurrency(summary.totalSalary)}</div>
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
                <div className="text-gray-900">{formatCurrency(summary.averageSalary)}</div>
                <div className="text-gray-900">{formatCurrency(summary.dailySalary)}</div>
                <div className="text-gray-900">{formatCurrency(summary.fullDailyAllowance)}</div>
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
        </div>
      </CardContent>
    </Card>
  );
}

type SummaryHeaderProps = React.ComponentProps<typeof SummaryHeader>;


