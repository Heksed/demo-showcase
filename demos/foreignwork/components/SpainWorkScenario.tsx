"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { SPAIN_WORK_PERIODS } from "../mockData";
import type { MonthPeriod, IncomeRow } from "../../allocateincome/types";
import { formatCurrency, parseFinnishDate, formatDateFI } from "../../allocateincome/utils";

// Espanjan työn palkkatiedot täydennetään käsittelijän toimesta
const SPAIN_WAGE_TOTAL = 12655.30;
const SPAIN_MONTHLY_AVG = SPAIN_WAGE_TOTAL / 7.5; // 7,5 kuukautta

// Funktio joka täydentää Espanjan työn palkkatiedot
const fillSpainWorkData = (periods: MonthPeriod[]): MonthPeriod[] => {
  return periods.map(period => {
    // Tarkista onko kyseessä Espanjan työn periodi (tammikuu-syyskuu 2025)
    const isSpainPeriod = period.ajanjakso.startsWith("2025") && 
      ["Tammikuu", "Helmikuu", "Maaliskuu", "Huhtikuu", "Toukokuu", "Kesäkuu", "Heinäkuu", "Elokuu", "Syyskuu"].includes(period.ajanjakso.split(" ")[1]);
    
    if (!isSpainPeriod || period.rows.length > 0) {
      return period; // Ei Espanjan periodi tai jo täytetty
    }

    const monthName = period.ajanjakso.split(" ")[1];
    let newPeriod = { ...period };

    // Tammikuu: 0,5 kk (14-31.1.) = 18 päivää
    // Palkka vähintään 930€ jotta kerryttää 1 TOE
    // Jakaja: 21.5 lähtötilanteessa vaikka työsuhde alkaisi keskeltä kuuta
    if (monthName === "Tammikuu") {
      const tammikuuPalkka = Math.max(930, Math.round(SPAIN_MONTHLY_AVG * 0.5));
      newPeriod = {
        ...period,
        toe: 1.0, // Vähintään 930€, joten 1 TOE
        jakaja: 21.5, // Lähtötilanteessa 21,5 vaikka työsuhde alkaisi keskeltä kuuta (käsittelijä voi muokata)
        palkka: tammikuuPalkka,
        tyonantajat: "Espanjan työnantaja",
        pidennettavatJaksot: 0,
        rows: [
          {
            id: `spain-01-1`,
            maksupaiva: "31.1.2025",
            tulolaji: "Aikapalkka",
            palkka: tammikuuPalkka,
            alkuperainenTulo: tammikuuPalkka,
            ansaintaAika: "14.1.2025 - 31.1.2025",
            tyonantaja: "Espanjan työnantaja"
          }
        ]
      };
    }
    // Helmikuu-elokuu: täysi kuukausi
    else if (["Helmikuu", "Maaliskuu", "Huhtikuu", "Toukokuu", "Kesäkuu", "Heinäkuu", "Elokuu"].includes(monthName)) {
      const monthPalkka = Math.round(SPAIN_MONTHLY_AVG);
      const monthMap: { [key: string]: { num: number; days: number } } = {
        "Helmikuu": { num: 2, days: 28 },
        "Maaliskuu": { num: 3, days: 31 },
        "Huhtikuu": { num: 4, days: 30 },
        "Toukokuu": { num: 5, days: 31 },
        "Kesäkuu": { num: 6, days: 30 },
        "Heinäkuu": { num: 7, days: 31 },
        "Elokuu": { num: 8, days: 31 }
      };
      const monthInfo = monthMap[monthName];
      
      // Varmista että palkka on vähintään 930€ jotta kerryttää 1 TOE
      const finalPalkka = Math.max(930, monthPalkka);
      
      newPeriod = {
        ...period,
        toe: 1.0,
        jakaja: 21.5,
        palkka: finalPalkka,
        tyonantajat: "Espanjan työnantaja",
        pidennettavatJaksot: 0,
        rows: [
          {
            id: `spain-${String(monthInfo.num).padStart(2, '0')}-1`,
            maksupaiva: `${monthInfo.days}.${monthInfo.num}.2025`,
            tulolaji: "Aikapalkka",
            palkka: finalPalkka,
            alkuperainenTulo: finalPalkka,
            ansaintaAika: `1.${monthInfo.num}.2025 - ${monthInfo.days}.${monthInfo.num}.2025`,
            tyonantaja: "Espanjan työnantaja"
          }
        ]
      };
    }
    // Syyskuu: 0,5 kk (1-3.9.) = 3 päivää
    // Palkka vähintään 930€ jotta kerryttää 1 TOE
    // Jakaja: 21.5 lähtötilanteessa vaikka työsuhde alkaisi keskeltä kuuta
    else if (monthName === "Syyskuu") {
      const syyskuuPalkka = Math.max(930, Math.round(SPAIN_MONTHLY_AVG * 0.5));
      newPeriod = {
        ...period,
        toe: 1.0, // Vähintään 930€, joten 1 TOE
        jakaja: 21.5, // Lähtötilanteessa 21,5 vaikka työsuhde alkaisi keskeltä kuuta (käsittelijä voi muokata)
        palkka: syyskuuPalkka,
        tyonantajat: "Espanjan työnantaja",
        pidennettavatJaksot: 0,
        rows: [
          {
            id: `spain-09-1`,
            maksupaiva: "3.9.2025",
            tulolaji: "Aikapalkka",
            palkka: syyskuuPalkka,
            alkuperainenTulo: syyskuuPalkka,
            ansaintaAika: "1.9.2025 - 3.9.2025",
            tyonantaja: "Espanjan työnantaja"
          }
        ]
      };
    }

    return newPeriod;
  });
};

import PeriodsTable from "../../allocateincome/components/PeriodsTable";
import WageDefinitionDrawer from "./WageDefinitionDrawer";
import ForeignWorkSummaryHeader from "./ForeignWorkSummaryHeader";
import useTOESummary from "../../allocateincome/hooks/useTOESummary";

export default function SpainWorkScenario() {
  const [periods, setPeriods] = useState<MonthPeriod[]>(SPAIN_WORK_PERIODS);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [isCalculatingTOE, setIsCalculatingTOE] = useState(false);
  const [reviewPeriodStart, setReviewPeriodStart] = useState<string>("");
  const [reviewPeriodEnd, setReviewPeriodEnd] = useState<string>("");
  const [wageDefinitionOpen, setWageDefinitionOpen] = useState(false);
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set());
  const [spainDataFilled, setSpainDataFilled] = useState(false);
  const [definitionType, setDefinitionType] = useState<"eurotoe" | "eurotoe6" | "viikkotoe" | "vuositulo" | "ulkomaan">("ulkomaan");
  
  // Palkanmäärityksen tiedot
  const [wageDefinitionResult, setWageDefinitionResult] = useState<{
    totalSalary: number;
    divisorDays: number;
    monthlyWage: number;
    dailyWage: number;
    definitionPeriodStart: string;
    definitionPeriodEnd: string;
  } | null>(null);

  // Täydennä Espanjan työn palkkatiedot
  const handleFillSpainWorkData = useCallback(() => {
    setPeriods(prev => fillSpainWorkData(prev));
    setSpainDataFilled(true);
  }, []);

  // Alusta päättymispäivä
  useEffect(() => {
    if (!hasCalculated) {
      // Päivärahan hakijaksi: 4.9.2025
      setReviewPeriodEnd("4.9.2025");
    }
  }, [hasCalculated]);

  // Parse period date from ajanjakso string
  const parsePeriodDate = useCallback((ajanjakso: string): Date | null => {
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
  }, []);

  // Laske TOE
  const handleCalculateTOE = useCallback(async () => {
    setIsCalculatingTOE(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setHasCalculated(true);
    // Laske tarkastelujakson alkupäivä (12kk taaksepäin)
    const endDate = parseFinnishDate(reviewPeriodEnd);
    if (endDate) {
      const startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - 12);
      setReviewPeriodStart(formatDateFI(startDate));
    }
    
    setIsCalculatingTOE(false);
  }, [reviewPeriodEnd]);

  // Laske TOE-arvo periodille
  const calculateTOEValue = useCallback((period: MonthPeriod): number => {
    const totalSalary = period.rows.reduce((sum, row) => sum + row.palkka, 0);
    if (totalSalary >= 930) return 1.0;
    if (totalSalary >= 465) return 0.5;
    return 0.0;
  }, []);

  const calculateEffectiveIncomeTotal = useCallback((period: MonthPeriod): number => {
    return period.rows.reduce((sum, row) => sum + row.palkka, 0);
  }, []);

  const isViikkoTOEPeriod = useCallback((period: MonthPeriod): boolean => {
    return false;
  }, []);

  const togglePeriod = useCallback((periodId: string) => {
    setExpandedPeriods(prev => {
      const next = new Set(prev);
      if (next.has(periodId)) next.delete(periodId); else next.add(periodId);
      return next;
    });
  }, []);

  // Filtteröi periodsit tarkastelujakson mukaan
  const filteredPeriods = useMemo(() => {
    if (!hasCalculated) return [];
    if (!reviewPeriodStart || !reviewPeriodEnd) return [];
    
    const startDate = parseFinnishDate(reviewPeriodStart);
    const endDate = parseFinnishDate(reviewPeriodEnd);
    if (!startDate || !endDate) return [];
    
    const endDateLastDay = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
    
    return periods.filter(period => {
      const periodDate = parsePeriodDate(period.ajanjakso);
      if (!periodDate) return false;
      
      return periodDate >= startDate && periodDate <= endDateLastDay;
    });
  }, [periods, reviewPeriodStart, reviewPeriodEnd, hasCalculated, parsePeriodDate]);

  // Järjestä periodsit uusimmasta vanhimpaan
  const sortedFilteredPeriods = useMemo(() => {
    return [...filteredPeriods].sort((a, b) => {
      const dateA = parsePeriodDate(a.ajanjakso);
      const dateB = parsePeriodDate(b.ajanjakso);
      if (!dateA || !dateB) return 0;
      return dateB.getTime() - dateA.getTime();
    });
  }, [filteredPeriods, parsePeriodDate]);

  // TOE Summary
  const summary = useTOESummary({
    periods: sortedFilteredPeriods,
    definitionType: 'ulkomaan',
    definitionOverride: null,
    calculateTOEValue,
    calculateEffectiveIncomeTotal,
    isViikkoTOEPeriod,
    viikkoTOEVähennysSummat: {},
    reviewPeriod: `${reviewPeriodStart} - ${reviewPeriodEnd}`,
    additionalExtendingDays: 0,
    subsidyCorrection: null,
  });

  // Laske TOE-alkupäivä
  const toeStartDate = useMemo(() => {
    if (!hasCalculated || !reviewPeriodEnd) return undefined;
    // TOE-alkupäivä on aina seuraavan TOE-kertymän alkupäivä
    // Eli tarkastelujakson päättymispäivän seuraava päivä
    const endDate = parseFinnishDate(reviewPeriodEnd);
    if (!endDate) return undefined;
    
    const nextDay = new Date(endDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    return formatDateFI(nextDay);
  }, [hasCalculated, reviewPeriodEnd]);

  // Get visible rows (no special filtering needed)
  const getVisibleRows = useCallback((period: MonthPeriod) => {
    return period.rows;
  }, []);

  // Empty handlers for PeriodsTable
  const emptyHandlers = {
    isRowDeleted: () => false,
    restoreIncomeType: () => {},
    openAllocationModalSingle: () => {},
    onOpenAllocationModalBatch: () => {},
    includeIncomeInCalculation: () => {},
    deleteIncomeType: () => {},
    openSplitModal: () => {},
    onShowSavedAllocation: () => {},
    onOpenAddIncome: () => {},
    onViikkoTOESave: () => {},
    onViikkoTOEDelete: () => {},
    onViikkoTOEAdd: () => {},
    onVähennysSummaChange: () => {},
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        {/* Varoitus: Automaattinen palkanmääritys estetty */}
        {hasCalculated && (
          <Alert className="mb-4 border-amber-400 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Ulkomaan työ:</strong> Järjestelmä ei voi automaattisesti päätellä palkanmääritystä. 
              Täydennä kuukausille ulkomaan työn palkat jotta palkka voidaan laskea.
            </AlertDescription>
          </Alert>
        )}

        {/* Tarkastelujakson muokkaus */}
        <Card className="p-4 mb-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Label className="font-medium text-gray-700 whitespace-nowrap">Tarkastelujakso:</Label>
            <div className="flex items-center gap-2">
              <Input 
                type="text" 
                placeholder="PP.KK.VVVV" 
                value={reviewPeriodStart}
                onChange={(e) => setReviewPeriodStart(e.target.value)}
                className="w-32 bg-white"
              />
              <span className="text-gray-600">-</span>
              <Input 
                type="text" 
                placeholder="PP.KK.VVVV" 
                value={reviewPeriodEnd}
                onChange={(e) => setReviewPeriodEnd(e.target.value)}
                className="w-32 bg-white"
              />
            </div>
            <Button 
              onClick={handleCalculateTOE}
              variant="outline"
              className="whitespace-nowrap"
              disabled={isCalculatingTOE}
            >
              {isCalculatingTOE ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Ladataan...
                </>
              ) : (
                "Laske TOE"
              )}
            </Button>
          </div>
        </Card>

        {/* TOE Yhteenveto */}
        {hasCalculated && (
          <ForeignWorkSummaryHeader
            summary={summary as any}
            wageDefinitionResult={wageDefinitionResult}
            formatCurrency={formatCurrency}
            toeStartDate={toeStartDate}
            definitionType={definitionType}
            setDefinitionType={setDefinitionType}
            onWageDefinitionClick={() => setWageDefinitionOpen(true)}
          />
        )}

        {/* Palkanmääritys-painike */}
        {hasCalculated && (
          <div className="flex justify-start gap-2 mb-4">
            {!spainDataFilled && (
              <Button 
                onClick={handleFillSpainWorkData}
                variant="outline"
                className="whitespace-nowrap bg-green-50 hover:bg-green-100 border-green-300"
              >
                Täydennä ulkomaan työn palkat
              </Button>
            )}
            {spainDataFilled && (
              <Button 
                onClick={() => setWageDefinitionOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Palkanmääritys
              </Button>
            )}
          </div>
        )}


        {/* Periods Table */}
        {hasCalculated && (
          <PeriodsTable
            periods={sortedFilteredPeriods}
            definitionType="ulkomaan"
            expandedPeriods={expandedPeriods}
            togglePeriod={togglePeriod}
            isViikkoTOEPeriod={isViikkoTOEPeriod}
            calculateTOEValue={calculateTOEValue}
            calculateEffectiveIncomeTotal={calculateEffectiveIncomeTotal}
            getVisibleRows={getVisibleRows}
            isRowDeleted={emptyHandlers.isRowDeleted}
            NON_BENEFIT_AFFECTING_INCOME_TYPES={[]}
            restoreIncomeType={emptyHandlers.restoreIncomeType}
            openAllocationModalSingle={emptyHandlers.openAllocationModalSingle}
            onOpenAllocationModalBatch={emptyHandlers.onOpenAllocationModalBatch}
            includeIncomeInCalculation={emptyHandlers.includeIncomeInCalculation}
            deleteIncomeType={emptyHandlers.deleteIncomeType}
            openSplitModal={emptyHandlers.openSplitModal}
            onShowSavedAllocation={emptyHandlers.onShowSavedAllocation}
            onOpenAddIncome={emptyHandlers.onOpenAddIncome}
            onViikkoTOESave={emptyHandlers.onViikkoTOESave}
            onViikkoTOEDelete={emptyHandlers.onViikkoTOEDelete}
            onViikkoTOEAdd={emptyHandlers.onViikkoTOEAdd}
            onVähennysSummaChange={emptyHandlers.onVähennysSummaChange}
            formatCurrency={formatCurrency}
            subsidyCorrection={null}
          />
        )}

        {/* Palkanmääritysikkuna */}
        <WageDefinitionDrawer
          open={wageDefinitionOpen}
          onOpenChange={setWageDefinitionOpen}
          periods={sortedFilteredPeriods}
          onApply={(result) => {
            setWageDefinitionResult(result);
            setWageDefinitionOpen(false);
          }}
        />
      </div>
    </div>
  );
}

