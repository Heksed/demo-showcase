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

    // Tarkista onko määrittelyjakso ennen 2.9.2024 (viikkoTOE-laskenta)
    const HYBRID_TOE_CUTOFF_DATE = new Date(2024, 8, 2); // 2.9.2024
    const isViikkoTOECalculation = endDate < HYBRID_TOE_CUTOFF_DATE;

    let divisorDays: number;
    let totalSalary = 0;

    if (isViikkoTOECalculation) {
      // ViikkoTOE-laskenta: käytetään työpäiviä jakajana (ei kalenteripäiviä)
      // Laske työpäivät määrittelyjaksossa (ma-pe, ei viikonloppuja)
      let workingDays = 0;
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay(); // 0 = sun, 6 = sat
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Ei sunnuntaita eikä lauantaita
          workingDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      divisorDays = workingDays;

      // Laske palkat periodien perusteella (päiväkohtaisesti)
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
          
          // Laske työpäivät leikkausjaksossa (ma-pe, ei viikonloppuja)
          let workingDaysInPeriod = 0;
          const periodCurrentDate = new Date(actualStart);
          while (periodCurrentDate <= actualEnd) {
            const dayOfWeek = periodCurrentDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Ei sunnuntaita eikä lauantaita
              workingDaysInPeriod++;
            }
            periodCurrentDate.setDate(periodCurrentDate.getDate() + 1);
          }
          
          // Laske periodin päiväkohtainen palkka (suodata pois siirtotiedot)
          const periodTotalSalary = period.rows
            .filter(row => !row.isTransferData) // Suodata pois siirtotiedot
            .reduce((sum, row) => sum + row.palkka, 0);
          const periodDays = period.jakaja || 0;
          
          if (periodDays > 0) {
            // Laske päiväkohtainen palkka periodille
            const dailySalary = periodTotalSalary / periodDays;
            // Laske palkka määrittelyjakson sisällä oleville työpäiville
            const salaryForPeriod = dailySalary * workingDaysInPeriod;
            totalSalary += salaryForPeriod;
          }
        }
      });
    } else {
      // Normaali laskenta: käytetään 21.5 päivän kuukausia
      // Laske kuinka monta kuukautta määrittelyjakso kattaa (21.5 päivän kuukausien perusteella)
      const monthsInRange = new Set<string>();
      const end = new Date(endDate);
      
      // Aloita kuukauden ensimmäisestä päivästä
      const startMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
      
      let monthIterator = new Date(startMonth);
      while (monthIterator <= endMonth) {
        const year = monthIterator.getFullYear();
        const month = monthIterator.getMonth();
        monthsInRange.add(`${year}-${month}`);
        monthIterator.setMonth(monthIterator.getMonth() + 1);
      }
      
      // Jakajanpäivät: jokainen kuukausi jota jakso leikkaa = 21.5 päivää
      divisorDays = monthsInRange.size * 21.5;

      // Laske palkat periodien perusteella
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
          
          // Laske kuinka monta kuukautta tämä periodi kattaa määrittelyjaksossa
          const periodMonths = new Set<string>();
          const periodStartMonth = new Date(actualStart.getFullYear(), actualStart.getMonth(), 1);
          const periodEndMonth = new Date(actualEnd.getFullYear(), actualEnd.getMonth(), 1);
          
          let periodMonthIterator = new Date(periodStartMonth);
          while (periodMonthIterator <= periodEndMonth) {
            const year = periodMonthIterator.getFullYear();
            const month = periodMonthIterator.getMonth();
            periodMonths.add(`${year}-${month}`);
            periodMonthIterator.setMonth(periodMonthIterator.getMonth() + 1);
          }
          
          // Laske periodin päiväkohtainen palkka (suodata pois siirtotiedot)
          const periodTotalSalary = period.rows
            .filter(row => !row.isTransferData) // Suodata pois siirtotiedot
            .reduce((sum, row) => sum + row.palkka, 0);
          const periodDays = period.jakaja || 0;
          
          if (periodDays > 0) {
            // Laske päiväkohtainen palkka periodille
            const dailySalary = periodTotalSalary / periodDays;
            // Laske palkka määrittelyjakson sisällä oleville kuukausille
            // Jokainen kuukausi = 21.5 päivää
            const daysForPeriod = periodMonths.size * 21.5;
            const salaryForPeriod = dailySalary * daysForPeriod;
            totalSalary += salaryForPeriod;
          }
        }
      });
    }

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

