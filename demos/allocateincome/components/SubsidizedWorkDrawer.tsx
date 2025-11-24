"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { IncomeRow, SubsidyRule, SubsidyCorrection } from "../types";
import { calculateSubsidyCorrection } from "../utils/subsidyCalculations";
import { formatCurrency } from "../utils";

interface SubsidizedWorkDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: IncomeRow[];
  toeSystemTotal: number;
  systemTotalSalary: number;
  periodCount: number;
  totalExtendingDays: number;
  onApplyCorrection: (correction: SubsidyCorrection) => void;
  onExtendPeriod: (additionalDays: number, correction: SubsidyCorrection) => void;
  estimateTOEWithExtending: (additionalDays: number, correction: SubsidyCorrection) => number;
}

export default function SubsidizedWorkDrawer({
  open,
  onOpenChange,
  rows,
  toeSystemTotal,
  systemTotalSalary,
  periodCount,
  totalExtendingDays,
  onApplyCorrection,
  onExtendPeriod,
  estimateTOEWithExtending,
}: SubsidizedWorkDrawerProps) {
  const [subsidyRule, setSubsidyRule] = useState<SubsidyRule>("PERCENT_75");
  const [useToeCorrection, setUseToeCorrection] = useState(true);
  const [useWageCorrection, setUseWageCorrection] = useState(true);
  const [additionalExtendingDays, setAdditionalExtendingDays] = useState<string>("0");

  // Calculate corrections based on selected rule
  const correction = useMemo(() => {
    if (rows.length === 0) {
      return null;
    }
    return calculateSubsidyCorrection(rows, subsidyRule, toeSystemTotal, systemTotalSalary, periodCount);
  }, [rows, subsidyRule, toeSystemTotal, systemTotalSalary, periodCount]);

  const handleApply = () => {
    if (!correction) return;
    
    // Only apply corrections that are checked
    const systemAverageSalary = periodCount > 0 ? systemTotalSalary / periodCount : 0;
    // If TOE < 12kk, wage base corrections are not calculated (already set to system values)
    const canUseWageCorrection = correction.toeCorrectedTotal >= 12;
    const fullCorrection: SubsidyCorrection = {
      ...correction,
      rule: subsidyRule,
      // Override values if user doesn't want to use the correction
      toeCorrectedTotal: useToeCorrection ? correction.toeCorrectedTotal : toeSystemTotal,
      toeCorrection: useToeCorrection ? correction.toeCorrection : 0,
      // Only apply wage correction if TOE >= 12kk and user wants to use it
      totalSalaryCorrected: (canUseWageCorrection && useWageCorrection) ? correction.totalSalaryCorrected : systemTotalSalary,
      totalSalaryCorrection: (canUseWageCorrection && useWageCorrection) ? correction.totalSalaryCorrection : 0,
      averageSalaryCorrected: (canUseWageCorrection && useWageCorrection) ? correction.averageSalaryCorrected : systemAverageSalary,
      averageSalaryCorrection: (canUseWageCorrection && useWageCorrection) ? correction.averageSalaryCorrection : 0,
    };
    
    // Jos on lisätty pidentäviä jaksoja, käytä laajennusta
    const additionalDays = parseInt(additionalExtendingDays) || 0;
    if (additionalDays > 0 && fullCorrection.toeCorrectedTotal < 12) {
      // Sovelleta korjaus ja laajenna tarkastelujaksoa
      onExtendPeriod(additionalDays, fullCorrection);
    } else {
      // Sovelleta vain korjaus
      onApplyCorrection(fullCorrection);
    }
    onOpenChange(false);
  };

  // Laske arvioitu TOE lisäpäivillä
  const estimatedTOE = useMemo(() => {
    if (!correction || correction.toeCorrectedTotal >= 12) return null;
    const additionalDays = parseInt(additionalExtendingDays) || 0;
    if (additionalDays <= 0) return correction.toeCorrectedTotal;
    // Varmista että correction sisältää rule-kentän
    const correctionWithRule: SubsidyCorrection = {
      ...correction,
      rule: subsidyRule,
    };
    return estimateTOEWithExtending(additionalDays, correctionWithRule);
  }, [correction, additionalExtendingDays, estimateTOEWithExtending, subsidyRule]);

  // Laske näytettävä TOE-kertymä: jos on lisätty pidentäviä jaksoja, näytetään arvioitu TOE
  const displayTOE = useMemo(() => {
    if (!correction) return null;
    const additionalDays = parseInt(additionalExtendingDays) || 0;
    if (additionalDays > 0 && estimatedTOE !== null) {
      return estimatedTOE;
    }
    return correction.toeCorrectedTotal;
  }, [correction, additionalExtendingDays, estimatedTOE]);

  // Laske palkanmäärittely arvioidulla TOE:lla jos TOE täyttyy laajennuksen jälkeen
  const estimatedWageCorrection = useMemo(() => {
    if (!correction || !estimatedTOE || estimatedTOE < 12) return null;
    
    // Laske palkanmäärittely uudelleen arvioidulla TOE:lla
    // Käytetään samaa logiikkaa kuin calculateSubsidyCorrection, mutta arvioidulla TOE:lla
    const acceptedForWage = correction.acceptedForWage; // Tämä on jo laskettu oikein säännön perusteella
    const totalSalaryCorrected = systemTotalSalary - correction.subsidizedGrossTotal + acceptedForWage;
    const totalSalaryCorrection = totalSalaryCorrected - systemTotalSalary;
    const systemAverageSalary = periodCount > 0 ? systemTotalSalary / periodCount : 0;
    const averageSalaryCorrected = periodCount > 0 ? totalSalaryCorrected / periodCount : 0;
    const averageSalaryCorrection = averageSalaryCorrected - systemAverageSalary;

    return {
      totalSalaryCorrected,
      totalSalaryCorrection,
      averageSalaryCorrected,
      averageSalaryCorrection,
      acceptedForWage,
    };
  }, [correction, estimatedTOE, systemTotalSalary, periodCount]);

  if (rows.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Palkkatuetun työn korjaus</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Subsidy rule selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Palkkatuen sääntö</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={subsidyRule} onValueChange={(value) => setSubsidyRule(value as SubsidyRule)}>
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="NO_TOE_EXTENDS" id="rule-no-toe" />
                    <Label htmlFor="rule-no-toe" className="flex-1 cursor-pointer">
                      <div className="font-medium">Palkkatuki</div>
                      <div className="text-sm text-gray-600">Ei TOE-kertymää, vain pidentää viitejaksoa</div>
                    </Label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="PERCENT_75" id="rule-75" />
                    <Label htmlFor="rule-75" className="flex-1 cursor-pointer">
                      <div className="font-medium">Palkkatuettu työ alkanut ennen 2.9.2024</div>
                      <div className="text-sm text-gray-600">75% kaikista kuukausista</div>
                    </Label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="LOCK_10_MONTHS_THEN_75" id="rule-lock" />
                    <Label htmlFor="rule-lock" className="flex-1 cursor-pointer">
                      <div className="font-medium">Poikkeusperuste</div>
                      <div className="text-sm text-gray-600">10 kk ei TOE, sen jälkeen 75%</div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Calculation results */}
          {correction && (
            <>
              {/* TOE calculation */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">TOE-kertymän korjaus</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">TOE (järjestelmä):</div>
                      <div className="font-semibold text-gray-900">{toeSystemTotal.toFixed(1)} kk</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Palkkatuetun työn TOE (järjestelmä):</div>
                      <div className="font-semibold text-gray-900">{correction.subsidizedMonthsCounted.toFixed(1)} kk</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Palkkatuetun työn TOE (oikea):</div>
                      <div className="font-semibold text-gray-900">{correction.correctToeFromSubsidy.toFixed(1)} kk</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Korjaus:</div>
                      <div className="font-semibold text-gray-900">
                        {correction.toeCorrection > 0 ? "+" : ""}{correction.toeCorrection.toFixed(1)} kk
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="text-gray-600 text-sm">Korjattu TOE yhteensä:</div>
                    <div className="font-semibold text-gray-900">{correction.toeCorrectedTotal.toFixed(1)} kk</div>
                  </div>
                </CardContent>
              </Card>

              {/* Laajenna tarkastelujaksoa -osio kun TOE < 12kk */}
          {correction && correction.toeCorrectedTotal < 12 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Laajenna tarkastelujaksoa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                <div className="space-y-2">
                  <Label htmlFor="additional-days">
                    Lisää pidentäviä jaksoja (päivinä)
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="additional-days"
                      type="number"
                      min="0"
                      value={additionalExtendingDays}
                      onChange={(e) => setAdditionalExtendingDays(e.target.value)}
                      placeholder="0"
                      className="w-32"
                    />
                    <span className="text-sm text-gray-600">pv</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Nykyiset pidentävät jaksot: {totalExtendingDays} pv
                  </p>
                </div>

                {estimatedTOE !== null && (
                  <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Arvioitu TOE laajennuksen jälkeen:</span>
                      <span className="block mt-1 text-lg font-semibold">
                        {estimatedTOE.toFixed(1)} kk / 12 kk
                      </span>
                      {estimatedTOE >= 12 && (
                        <span className="block mt-1 text-green-700 font-medium">
                          ✓ TOE täyttyy laajennuksen jälkeen
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

              {/* Wage base calculation - näytetään aina, mutta null arvot jos TOE < 12kk */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Palkanmäärittelyn korjaus</CardTitle>
                  {estimatedTOE !== null && estimatedTOE >= 12 && correction.toeCorrectedTotal < 12 && (
                    <p className="text-sm text-gray-600 mt-1">
                      Laskettu laajennuksen jälkeen (TOE: {estimatedTOE.toFixed(1)} kk)
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Näytä huomio jos TOE < 12kk */}
                  {correction.toeCorrectedTotal < 12 && (estimatedTOE === null || estimatedTOE < 12) && (
                    <div className="p-3 bg-amber-50 border-l-4 border-amber-400 rounded-r">
                      <p className="text-sm text-amber-800">
                        <span className="font-medium">Huomio:</span> Korjattu TOE yhteensä on alle 12kk ({correction.toeCorrectedTotal.toFixed(1)} kk / 12 kk). 
                        Palkanmääritystä ei lasketa ennen kuin työssäoloehto 12kk täyttyy.
                      </p>
                    </div>
                  )}
                  
                  {(() => {
                    // Tarkista onko TOE täyttynyt (joko korjauksen jälkeen tai laajennuksen jälkeen)
                    const toeFulfilled = correction.toeCorrectedTotal >= 12 || (estimatedTOE !== null && estimatedTOE >= 12);
                    
                    // Käytä arvioitua palkanmäärittelyä jos TOE täyttyy laajennuksen jälkeen
                    const wageData = (estimatedTOE !== null && estimatedTOE >= 12 && correction.toeCorrectedTotal < 12 && estimatedWageCorrection)
                      ? estimatedWageCorrection
                      : toeFulfilled
                        ? {
                            totalSalaryCorrected: correction.totalSalaryCorrected,
                            totalSalaryCorrection: correction.totalSalaryCorrection,
                            averageSalaryCorrected: correction.averageSalaryCorrected,
                            averageSalaryCorrection: correction.averageSalaryCorrection,
                            acceptedForWage: correction.acceptedForWage,
                          }
                        : {
                            totalSalaryCorrected: 0,
                            totalSalaryCorrection: 0,
                            averageSalaryCorrected: 0,
                            averageSalaryCorrection: 0,
                            acceptedForWage: 0,
                          };
                    
                    return (
                      <>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600">Palkkatuetun brutto:</div>
                            <div className="font-semibold text-gray-900">
                              {toeFulfilled ? formatCurrency(correction.subsidizedGrossTotal) : "—"}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600">Hyväksyttävä osuus ({subsidyRule === "NO_TOE_EXTENDS" ? "0%" : "75%"}):</div>
                            <div className="font-semibold text-gray-900">
                              {toeFulfilled ? formatCurrency(wageData.acceptedForWage) : "—"}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600">TOE-palkka (järjestelmä):</div>
                            <div className="font-semibold text-gray-900">
                              {toeFulfilled ? formatCurrency(systemTotalSalary) : "—"}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600">Korjaus:</div>
                            <div className="font-semibold text-gray-900">
                              {toeFulfilled 
                                ? (wageData.totalSalaryCorrection > 0 ? "+" : "") + formatCurrency(wageData.totalSalaryCorrection)
                                : "—"}
                            </div>
                          </div>
                        </div>
                        <div className="pt-3 border-t">
                          <div className="text-gray-600 text-sm">TOE-palkka (korjattu):</div>
                          <div className="font-semibold text-gray-900">
                            {toeFulfilled ? formatCurrency(wageData.totalSalaryCorrected) : "—"}
                          </div>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="text-gray-600 text-sm">Perustepalkka/kk (korjattu):</div>
                          <div className="font-semibold text-gray-900">
                            {toeFulfilled ? formatCurrency(wageData.averageSalaryCorrected) : "—"}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            </>
          )}

          {/* Apply options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Käytä korjauksia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="use-toe"
                    checked={useToeCorrection}
                    onCheckedChange={(checked) => setUseToeCorrection(checked === true)}
                  />
                  <Label htmlFor="use-toe" className="cursor-pointer">
                    Käytä korjattua TOE-kertymää ({displayTOE?.toFixed(1) || correction?.toeCorrectedTotal.toFixed(1)} kk)
                    {estimatedTOE !== null && estimatedTOE !== correction?.toeCorrectedTotal && (
                      <span className="ml-2 text-xs text-gray-500">
                        (alkuperäinen: {correction?.toeCorrectedTotal.toFixed(1)} kk)
                      </span>
                    )}
                  </Label>
                </div>
                {/* Show wage correction option if TOE >= 12kk (joko korjauksen jälkeen tai laajennuksen jälkeen) */}
                {correction && (displayTOE ?? correction.toeCorrectedTotal) >= 12 && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="use-wage"
                      checked={useWageCorrection}
                      onCheckedChange={(checked) => setUseWageCorrection(checked === true)}
                    />
                    <Label htmlFor="use-wage" className="cursor-pointer">
                      Käytä korjattua perustepalkkaa ({
                        (estimatedTOE !== null && estimatedTOE >= 12 && correction.toeCorrectedTotal < 12 && estimatedWageCorrection)
                          ? formatCurrency(estimatedWageCorrection.averageSalaryCorrected)
                          : correction
                          ? formatCurrency(correction.averageSalaryCorrected)
                          : "-"
                      })
                    </Label>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => {
            onOpenChange(false);
            setAdditionalExtendingDays("0");
          }}>
            Peruuta
          </Button>
          <Button
            onClick={handleApply}
            disabled={!correction || (!useToeCorrection && (correction.toeCorrectedTotal < 12 || !useWageCorrection))}
            className="bg-green-600 hover:bg-green-700"
          >
            Hyväksy korjaus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

