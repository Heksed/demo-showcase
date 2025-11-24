"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  onApplyCorrection: (correction: SubsidyCorrection) => void;
}

export default function SubsidizedWorkDrawer({
  open,
  onOpenChange,
  rows,
  toeSystemTotal,
  systemTotalSalary,
  periodCount,
  onApplyCorrection,
}: SubsidizedWorkDrawerProps) {
  const [subsidyRule, setSubsidyRule] = useState<SubsidyRule>("PERCENT_75");
  const [useToeCorrection, setUseToeCorrection] = useState(true);
  const [useWageCorrection, setUseWageCorrection] = useState(true);

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
    
    onApplyCorrection(fullCorrection);
    onOpenChange(false);
  };

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
          {/* Selected rows summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Valitut palkkatuetut rivit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  Rivien määrä: <span className="font-semibold text-gray-900">{rows.length}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Brutto yhteensä: <span className="font-semibold text-gray-900">{formatCurrency(rows.reduce((sum, r) => sum + r.palkka, 0))}</span>
                </div>
                <div className="mt-4 max-h-48 overflow-y-auto border rounded p-2">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-1 text-left">Maksupäivä</th>
                        <th className="px-2 py-1 text-left">Tulolaji</th>
                        <th className="px-2 py-1 text-right">Palkka</th>
                        <th className="px-2 py-1 text-left">Työnantaja</th>
                        <th className="px-2 py-1 text-left">Ansainta-aika</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.id} className="border-b">
                          <td className="px-2 py-1">{row.maksupaiva}</td>
                          <td className="px-2 py-1">{row.tulolaji}</td>
                          <td className="px-2 py-1 text-right">{formatCurrency(row.palkka)}</td>
                          <td className="px-2 py-1">{row.tyonantaja}</td>
                          <td className="px-2 py-1">{row.ansaintaAika || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>

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
                      <div className="font-medium">Normaali palkkatuki</div>
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
                  
                  {/* Warning if TOE < 12kk */}
                  {correction.toeCorrectedTotal < 12 && (
                    <div className="mt-3 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-r">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm text-amber-800">
                            <span className="font-medium">Huomio:</span> Korjattu TOE yhteensä on alle 12kk. 
                            Palkanmääritystä ei lasketa ennen kuin työssäoloehto 12kk täyttyy.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Wage base calculation - only show if TOE >= 12kk */}
              {correction.toeCorrectedTotal >= 12 && (
                <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Palkkapohjan korjaus</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Palkkatuetun brutto:</div>
                      <div className="font-semibold text-gray-900">{formatCurrency(correction.subsidizedGrossTotal)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Hyväksyttävä osuus ({subsidyRule === "NO_TOE_EXTENDS" ? "0%" : "75%"}):</div>
                      <div className="font-semibold text-gray-900">{formatCurrency(correction.acceptedForWage)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">TOE-palkka (järjestelmä):</div>
                      <div className="font-semibold text-gray-900">{formatCurrency(systemTotalSalary)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Korjaus:</div>
                      <div className="font-semibold text-gray-900">
                        {correction.totalSalaryCorrection > 0 ? "+" : ""}{formatCurrency(correction.totalSalaryCorrection)}
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="text-gray-600 text-sm">TOE-palkka (korjattu):</div>
                    <div className="font-semibold text-gray-900">{formatCurrency(correction.totalSalaryCorrected)}</div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="text-gray-600 text-sm">Perustepalkka/kk (korjattu):</div>
                    <div className="font-semibold text-gray-900">{formatCurrency(correction.averageSalaryCorrected)}</div>
                  </div>
                </CardContent>
              </Card>
              )}
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
                    Käytä korjattua TOE-kertymää ({correction?.toeCorrectedTotal.toFixed(1)} kk)
                  </Label>
                </div>
                {/* Only show wage correction option if TOE >= 12kk */}
                {correction && correction.toeCorrectedTotal >= 12 && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="use-wage"
                      checked={useWageCorrection}
                      onCheckedChange={(checked) => setUseWageCorrection(checked === true)}
                    />
                    <Label htmlFor="use-wage" className="cursor-pointer">
                      Käytä korjattua palkkapohjaa ({correction ? formatCurrency(correction.averageSalaryCorrected) : "-"})
                    </Label>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
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

