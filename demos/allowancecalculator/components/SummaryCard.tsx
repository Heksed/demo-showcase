// ===============================
// Component: Summary Card
// ===============================

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { euro } from "../utils";
import { DAILY_BASE } from "../constants";
import type { BenefitRow } from "../types";

interface Row3Props {
  label: string;
  base: number;
  compare?: number | null;
}

function Row3({ label, base, compare }: Row3Props) {
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
          <div
            className={cn(
              "text-right font-semibold",
              delta >= 0 ? "text-emerald-600" : "text-rose-600"
            )}
          >
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

interface SummaryCardProps {
  compareMode: boolean;
  resultsCompare: {
    adjustedDaily?: number | null;
    fullDaily?: number | null;
    days: number;
  } | null;
  results: {
    eightyRuleTriggered: boolean;
    fullDailyBeforeProtection: number;
    prevFullDailyRef: number;
    eightyFloor: number;
    stepLabel: string;
    days: number;
    fullDaysEquivalent: number;
    priorPaidDays: number;
    cumulativePaidAfter: number;
    basePart: number;
    earningsPart: number;
    fullDaily: number;
    benefitsTotalPure: number;
    adjustedDaily: number;
    incomesTotal: number;
    perDayReductionBenefits: number;
    perDayReductionIncome: number;
    gross: number;
    withholding: number;
    memberFee: number;
    net: number;
    travelAllowancePerDay: number;
    travelAllowanceTotal: number;
    totalPayable: number;
  };
  benefits: BenefitRow[];
  maxDays: number;
  taxPct: number;
  memberFeePct: number;
}

export default function SummaryCard({
  compareMode,
  resultsCompare,
  results,
  benefits,
  maxDays,
  taxPct,
  memberFeePct,
}: SummaryCardProps) {
  return (
    <Card className="sticky top-20">
      <CardHeader>
        <CardTitle>Päiväraha</CardTitle>
      </CardHeader>
      <CardContent
        className={cn(
          "transition-all duration-300",
          compareMode && resultsCompare
            ? "space-y-10 p-4" // enemmän tilaa kun vertailu päällä
            : "space-y-6 p-4" // tiiviimpi oletus
        )}
      >
        {/* 80% suoja -notifikaatio */}
        {results.eightyRuleTriggered && (
          <div className="p-3 rounded-md border bg-amber-50 text-amber-900 text-sm">
            <div className="font-medium mb-1">80 % -suoja aktivoitui</div>
            <p>
              Nykyinen täysi päiväraha ({euro(results.fullDailyBeforeProtection)}/pv) jäi alle
              80 % vertailutasosta ({euro(results.prevFullDailyRef)}/pv → min{" "}
              {euro(results.eightyFloor)}/pv). Laskenta käyttää vähintään 80 % tasoa ennen
              sovittelua.
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
          <div className="text-right">{results.priorPaidDays.toFixed(2)} pv</div>

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
                    <Row3
                      label="Perusosa"
                      base={results.basePart * results.days}
                      compare={basePartCmp}
                    />
                    <Row3
                      label="Ansio-osa"
                      base={results.earningsPart * results.days}
                      compare={earningsPartCmp}
                    />
                    <Row3
                      label="Ennakonpidätyksen määrä"
                      base={results.withholding}
                      compare={withholdingCmp}
                    />
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
                    <Row3
                      label="Kulukorvaus / pv"
                      base={results.travelAllowancePerDay}
                      compare={results.travelAllowancePerDay}
                    />
                    <Row3
                      label="Kulukorvaus yhteensä"
                      base={results.travelAllowanceTotal}
                      compare={results.travelAllowanceTotal}
                    />
                    <Row3
                      label="Maksettava yhteensä"
                      base={results.totalPayable}
                      compare={totalPayableCmp}
                    />
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

