"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle } from "lucide-react";
import type { MonthPeriod } from "../../allocateincome/types";
import { formatCurrency, parseFinnishDate, formatDateFI } from "../../allocateincome/utils";

interface WageDefinitionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periods: MonthPeriod[];
  defaultStartDate?: string; // Oletusarvo palkanmääritysjaksolle
  defaultEndDate?: string; // Oletusarvo palkanmääritysjaksolle
  showIndexAdjustment?: boolean; // Näytetäänkö indeksikorotus-kenttä (vain pohjoismaisessa paluumuuttaja -skenaariossa)
  onApply: (result: {
    totalSalary: number;
    divisorDays: number;
    monthlyWage: number;
    dailyWage: number;
    definitionPeriodStart: string;
    definitionPeriodEnd: string;
    indexAdjustment?: boolean;
  }) => void;
}

export default function WageDefinitionDrawer({
  open,
  onOpenChange,
  periods,
  defaultStartDate = "14.1.2025",
  defaultEndDate = "3.9.2025",
  showIndexAdjustment = false,
  onApply,
}: WageDefinitionDrawerProps) {
  const [definitionPeriodStart, setDefinitionPeriodStart] = useState<string>(defaultStartDate);
  const [definitionPeriodEnd, setDefinitionPeriodEnd] = useState<string>(defaultEndDate);
  const [indexAdjustment, setIndexAdjustment] = useState<boolean>(false);

  // Päivitä oletusarvot kun drawer avataan
  useEffect(() => {
    if (open) {
      setDefinitionPeriodStart(defaultStartDate);
      setDefinitionPeriodEnd(defaultEndDate);
      setIndexAdjustment(false);
    }
  }, [open, defaultStartDate, defaultEndDate]);

  // Parse period date from ajanjakso string (e.g., "2025 Joulukuu" -> Date)
  const parsePeriodDate = (ajanjakso: string): Date | null => {
    const parts = ajanjakso.split(' ');
    if (parts.length !== 2) return null;
    const year = parseInt(parts[0], 10);
    const monthName = parts[1];
    const monthMap: { [key: string]: number } = {
      'Tammikuu': 0, 'Helmikuu': 1, 'Maaliskuu': 2, 'Huhtikuu': 3,
      'Toukokuu': 4, 'Kesäkuu': 5, 'Heinäkuu': 6, 'Elokuu': 7,
      'Syyskuu': 8, 'Lokakuu': 9, 'Marraskuu': 10, 'Joulukuu': 11
    };
    const month = monthMap[monthName];
    if (month === undefined || isNaN(year)) return null;
    return new Date(year, month, 1);
  };

  // Validoi että palkanmääritysjakso on yhden maan palkoista
  const validationError = useMemo(() => {
    const startDate = parseFinnishDate(definitionPeriodStart);
    const endDate = parseFinnishDate(definitionPeriodEnd);
    if (!startDate || !endDate) {
      return "Tarkista päivämäärät";
    }
    if (endDate <= startDate) {
      return "Loppupäivämäärän pitää olla alkupäivämäärän jälkeen";
    }

    // Tarkista periodsit jotka kuuluvat määrittelyjaksoon
    const relevantPeriods = periods.filter(period => {
      const periodDate = parsePeriodDate(period.ajanjakso);
      if (!periodDate) return false;
      
      // Tarkista onko periodi määrittelyjakson sisällä
      const periodStart = new Date(periodDate);
      const periodEnd = new Date(periodDate.getFullYear(), periodDate.getMonth() + 1, 0);
      
      return periodStart <= endDate && periodEnd >= startDate;
    });

    if (relevantPeriods.length === 0) {
      return "Valitulla jaksolla ei ole palkkatietoja";
    }

    // Tarkista että kaikki palkat ovat samasta maasta
    const countries = new Set<string>();
    relevantPeriods.forEach(period => {
      period.rows.forEach(row => {
        const tyonantaja = row.tyonantaja.toLowerCase();
        if (tyonantaja.includes("espanja") || tyonantaja.includes("spain")) {
          countries.add("espanja");
        } else if (tyonantaja.includes("suomi") || tyonantaja.includes("finland")) {
          countries.add("suomi");
        } else {
          // Jos ei tunnisteta, oletetaan että on jokin maa
          countries.add("tuntematon");
        }
      });
    });

    if (countries.size > 1) {
      return "Palkanmääritys tehdään aina vain yhden maan palkoista. Valitse jakso, joka sisältää vain yhden maan palkkoja.";
    }

    return null;
  }, [definitionPeriodStart, definitionPeriodEnd, periods]);

  // Laske palkanmäärityksen tulokset
  const calculateWageDefinition = useMemo(() => {
    const startDate = parseFinnishDate(definitionPeriodStart);
    const endDate = parseFinnishDate(definitionPeriodEnd);
    if (!startDate || !endDate || validationError) {
      return null;
    }

    // Laske päiväkohtaisesti määrittelyjakson sisällä olevat palkat ja päivät
    let totalSalary = 0;
    let divisorDays = 0;

    periods.forEach(period => {
      const periodDate = parsePeriodDate(period.ajanjakso);
      if (!periodDate) return;
      
      const periodStart = new Date(periodDate);
      const periodEnd = new Date(periodDate.getFullYear(), periodDate.getMonth() + 1, 0);
      
      // Tarkista leikkaako periodi määrittelyjakson
      if (periodStart <= endDate && periodEnd >= startDate) {
        // Laske leikkausjakso (määrittelyjakson sisällä oleva osa periodia)
        const actualStart = periodStart < startDate ? startDate : periodStart;
        const actualEnd = periodEnd > endDate ? endDate : periodEnd;
        
        // Laske päivien määrä leikkausjaksossa
        const daysInPeriod = Math.ceil((actualEnd.getTime() - actualStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        // Laske periodin päiväkohtainen palkka
        const periodTotalSalary = period.rows.reduce((sum, row) => sum + row.palkka, 0);
        const periodDays = period.jakaja || 0;
        
        if (periodDays > 0) {
          // Laske päiväkohtainen palkka periodille
          const dailySalary = periodTotalSalary / periodDays;
          // Laske palkka määrittelyjakson sisällä oleville päiville
          const salaryForPeriod = dailySalary * daysInPeriod;
          totalSalary += salaryForPeriod;
          divisorDays += daysInPeriod;
        }
      }
    });

    if (divisorDays === 0) {
      return null;
    }

    // Laskennallinen kk-palkka
    // Palkka/päivä * 21,5
    const dailyWage = totalSalary / divisorDays;
    let monthlyWage = dailyWage * 21.5;
    
    // Indeksikorotus (jos tarkastelujaksoa on pidentävä aika, esim. opiskelu)
    // Indeksikorotus vaikuttaa laskennalliseen kk-palkkaan
    // Esimerkki dokumentaatiosta: 3 624,91 € / 36 pv * 21.5 = 2 164,89 €
    // Indeksikorotettuna: 2 412,95 €
    // Kerroin: 2 412,95 / 2 164,89 ≈ 1.115
    // Tämä on yksinkertaistettu laskenta - todellinen indeksikorotus riippuu ajankohdasta ja pidentävän jakson pituudesta
    if (indexAdjustment) {
      // Indeksikorotus: kerrotaan kertoimella
      // Todellinen korotus lasketaan tarkastelujakson pidentämisen perusteella
      // Tässä käytetään dokumentaation esimerkin mukaista kerrointa
      const indexMultiplier = 1.115; // Yksinkertaistettu (todellinen riippuu ajankohdasta)
      monthlyWage = monthlyWage * indexMultiplier;
    }
    
    // TEL-vähennys (3,54%)
    const telDeduction = monthlyWage * 0.0354;
    const monthlyWageAfterTel = monthlyWage - telDeduction;
    
    // Päiväraha
    const dailyAllowance = monthlyWageAfterTel / 21.5;
    
    return {
      totalSalary,
      divisorDays,
      monthlyWage: monthlyWageAfterTel,
      dailyWage: dailyAllowance,
      definitionPeriodStart,
      definitionPeriodEnd,
      indexAdjustment,
    };
  }, [definitionPeriodStart, definitionPeriodEnd, periods, validationError, indexAdjustment]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Palkanmääritys</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Varoitus */}
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Palkanmääritys tehdään aina vain yhden maan palkoista.
            </AlertDescription>
          </Alert>

          {/* Palkanmäärityksen asetukset */}
          <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-white">
            <div className="space-y-4">
              {/* Palkanmäärittelyjakso */}
              <div className="space-y-2">
                <Label>Palkanmäärittelyjakso</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="PP.KK.VVVV"
                    value={definitionPeriodStart}
                    onChange={(e) => setDefinitionPeriodStart(e.target.value)}
                    className="w-40 bg-white"
                  />
                  <span className="text-gray-600">-</span>
                  <Input
                    type="text"
                    placeholder="PP.KK.VVVV"
                    value={definitionPeriodEnd}
                    onChange={(e) => setDefinitionPeriodEnd(e.target.value)}
                    className="w-40 bg-white"
                  />
                </div>
                {validationError && (
                  <p className="text-sm text-red-600">{validationError}</p>
                )}
              </div>

              {/* Indeksikorotus - näytetään vain pohjoismaisessa paluumuuttaja -skenaariossa */}
              {showIndexAdjustment && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Switch
                        id="index-adjustment"
                        checked={indexAdjustment}
                        onCheckedChange={setIndexAdjustment}
                      />
                      <Label htmlFor="index-adjustment" className="cursor-pointer">
                        Indeksikorotus
                      </Label>
                    </div>
                    <p className="text-sm text-gray-600 ml-9">
                      Merkitse tämä, jos tarkastelujaksoa on pidentävä aika (esim. opiskelu). 
                      Indeksikorotus vaikuttaa laskennalliseen kk-palkkaan.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tulokset */}
          {calculateWageDefinition && (
            <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="font-semibold text-base text-gray-900">Palkanmäärityksen tulokset</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white rounded border border-gray-200">
                  <Label className="text-sm text-gray-600">Palkka yhteensä</Label>
                  <p className="text-lg font-semibold mt-1">
                    {formatCurrency(calculateWageDefinition.totalSalary)}
                  </p>
                </div>
                <div className="p-3 bg-white rounded border border-gray-200">
                  <Label className="text-sm text-gray-600">Jakaja (päivät)</Label>
                  <p className="text-lg font-semibold mt-1">
                    {calculateWageDefinition.divisorDays}
                  </p>
                </div>
                <div className="p-3 bg-white rounded border border-gray-200">
                  <Label className="text-sm text-gray-600">Laskennallinen kk-palkka</Label>
                  <p className="text-lg font-semibold mt-1">
                    {formatCurrency(calculateWageDefinition.monthlyWage)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    (TEL-vähennys 3,54% huomioitu)
                  </p>
                </div>
                <div className="p-3 bg-white rounded border border-gray-200">
                  <Label className="text-sm text-gray-600">Päiväraha</Label>
                  <p className="text-lg font-semibold mt-1">
                    {formatCurrency(calculateWageDefinition.dailyWage)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Peruuta
          </Button>
          <Button
            onClick={() => {
              if (calculateWageDefinition) {
                onApply(calculateWageDefinition);
              }
            }}
            disabled={!calculateWageDefinition || !!validationError}
          >
            Tallenna
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

