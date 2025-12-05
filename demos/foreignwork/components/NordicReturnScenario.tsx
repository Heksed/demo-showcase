"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { NORDIC_RETURN_PERIODS } from "../mockData";
import type { MonthPeriod } from "../../allocateincome/types";
import { formatCurrency, parseFinnishDate, formatDateFI } from "../../allocateincome/utils";
import PeriodsTable from "../../allocateincome/components/PeriodsTable";
import WageDefinitionDrawer from "./WageDefinitionDrawer";
import ForeignWorkSummaryHeader from "./ForeignWorkSummaryHeader";
import ExtendingPeriodsDialog, { ExtendingPeriod } from "./ExtendingPeriodsDialog";
import useTOESummary from "../../allocateincome/hooks/useTOESummary";

// Suomen työn palkkatiedot täydennetään käsittelijän toimesta
const FINLAND_WAGE_TOTAL = 3624.91; // 7 viikkoa, 36 päivää
const FINLAND_DAILY_AVG = FINLAND_WAGE_TOTAL / 36; // Päiväkohtainen palkka

// Funktio joka täydentää Suomen työn palkkatiedot
const fillFinlandWorkData = (periods: MonthPeriod[]): MonthPeriod[] => {
  return periods.map(period => {
    // Tarkista onko kyseessä Suomen työn periodi (heinäkuu-elokuu 2022)
    const isFinlandPeriod = period.ajanjakso.startsWith("2022") && 
      ["Heinäkuu", "Elokuu"].includes(period.ajanjakso.split(" ")[1]);
    
    if (!isFinlandPeriod || period.rows.length > 0) {
      return period; // Ei Suomen periodi tai jo täytetty
    }

    const monthName = period.ajanjakso.split(" ")[1];
    let newPeriod = { ...period };

    // Heinäkuu: täysi kuukausi (1-31.7.2022)
    // Palkanmääritys: 1.7.-19.8.2022, yhteensä 36 päivää
    // Jakaja: 21.5 lähtötilanteessa vaikka työsuhde alkaisi keskeltä kuuta
    if (monthName === "Heinäkuu") {
      const heinakuuPalkka = Math.round(FINLAND_DAILY_AVG * 31); // 31 päivää
      newPeriod = {
        ...period,
        toe: 1.0, // Vähintään 930€, joten 1 TOE
        jakaja: 21.5, // Lähtötilanteessa 21,5 vaikka työsuhde alkaisi keskeltä kuuta (käsittelijä voi muokata)
        palkka: heinakuuPalkka,
        tyonantajat: "Suomen työnantaja",
        pidennettavatJaksot: 0,
        rows: [
          {
            id: `fin-07-2022-1`,
            maksupaiva: "31.7.2022",
            tulolaji: "Aikapalkka",
            palkka: heinakuuPalkka,
            alkuperainenTulo: heinakuuPalkka,
            ansaintaAika: "1.7.2022 - 31.7.2022",
            tyonantaja: "Suomen työnantaja"
          }
        ]
      };
    }
    // Elokuu: osittainen kuukausi (1-19.8.2022) = 19 päivää
    // Jakaja: 21.5 lähtötilanteessa vaikka työsuhde alkaisi keskeltä kuuta
    else if (monthName === "Elokuu") {
      const elokuuPalkka = Math.round(FINLAND_DAILY_AVG * 19); // 19 päivää
      // Tarkista TOE: 19 päivää * 100.69 €/pv = 1913.11 € -> 1.0 TOE
      const toeValue = elokuuPalkka >= 930 ? 1.0 : (elokuuPalkka >= 465 ? 0.5 : 0.0);
      newPeriod = {
        ...period,
        toe: toeValue,
        jakaja: 21.5, // Lähtötilanteessa 21,5 vaikka työsuhde alkaisi keskeltä kuuta (käsittelijä voi muokata)
        palkka: elokuuPalkka,
        tyonantajat: "Suomen työnantaja",
        pidennettavatJaksot: 0,
        rows: [
          {
            id: `fin-08-2022-1`,
            maksupaiva: "19.8.2022",
            tulolaji: "Aikapalkka",
            palkka: elokuuPalkka,
            alkuperainenTulo: elokuuPalkka,
            ansaintaAika: "1.8.2022 - 19.8.2022",
            tyonantaja: "Suomen työnantaja"
          }
        ]
      };
    }

    return newPeriod;
  });
};

export default function NordicReturnScenario() {
  const [periods, setPeriods] = useState<MonthPeriod[]>(NORDIC_RETURN_PERIODS);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [isCalculatingTOE, setIsCalculatingTOE] = useState(false);
  const [reviewPeriodStart, setReviewPeriodStart] = useState<string>("");
  const [reviewPeriodEnd, setReviewPeriodEnd] = useState<string>("");
  const [wageDefinitionOpen, setWageDefinitionOpen] = useState(false);
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set());
  const [finlandDataFilled, setFinlandDataFilled] = useState(false);
  const [definitionType, setDefinitionType] = useState<"eurotoe" | "eurotoe6" | "viikkotoe" | "vuositulo" | "ulkomaan">("ulkomaan");
  const [extendingPeriods, setExtendingPeriods] = useState<ExtendingPeriod[]>([]);
  const [extendingPeriodsDialogOpen, setExtendingPeriodsDialogOpen] = useState(false);
  
  // Palkanmäärityksen tiedot
  const [wageDefinitionResult, setWageDefinitionResult] = useState<{
    totalSalary: number;
    divisorDays: number;
    monthlyWage: number;
    dailyWage: number;
    definitionPeriodStart: string;
    definitionPeriodEnd: string;
    indexAdjustment?: boolean; // Indeksikorotus
  } | null>(null);

  // Alusta päättymispäivä
  useEffect(() => {
    if (!hasCalculated) {
      const today = new Date();
      setReviewPeriodEnd(formatDateFI(today));
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
    // Laske tarkastelujakson alkupäivä (14kk taaksepäin - järjestelmä hakee palkat 14 kk)
    const endDate = parseFinnishDate(reviewPeriodEnd);
    if (endDate) {
      const startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - 14);
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
    // Palkanmääritys tehdään viikkotoen puolella
    return wageDefinitionResult !== null;
  }, [wageDefinitionResult]);

  const togglePeriod = useCallback((periodId: string) => {
    setExpandedPeriods(prev => {
      const next = new Set(prev);
      if (next.has(periodId)) next.delete(periodId); else next.add(periodId);
      return next;
    });
  }, []);

  // Täydennä Suomen työn palkkatiedot
  const handleFillFinlandWorkData = useCallback(() => {
    setPeriods(prev => fillFinlandWorkData(prev));
    setFinlandDataFilled(true);
  }, []);

  // Generoi kaikki 14 kk tarkastelujaksolta (tyhjät kuukaudet mukaan lukien)
  const filteredPeriods = useMemo(() => {
    if (!hasCalculated) return [];
    if (!reviewPeriodStart || !reviewPeriodEnd) return [];
    
    const startDate = parseFinnishDate(reviewPeriodStart);
    const endDate = parseFinnishDate(reviewPeriodEnd);
    if (!startDate || !endDate) return [];
    
    // Generoi kaikki kuukaudet tarkastelujaksolta (14 kk taaksepäin loppupäivästä)
    const monthNames = [
      'Tammikuu', 'Helmikuu', 'Maaliskuu', 'Huhtikuu',
      'Toukokuu', 'Kesäkuu', 'Heinäkuu', 'Elokuu',
      'Syyskuu', 'Lokakuu', 'Marraskuu', 'Joulukuu'
    ];
    
    const generatedPeriods: MonthPeriod[] = [];
    const endDateLastDay = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
    
    // Aloita loppupäivästä ja mene 14 kk taaksepäin
    const currentDate = new Date(endDate);
    for (let i = 0; i < 14; i++) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const monthName = monthNames[month];
      const ajanjakso = `${year} ${monthName}`;
      
      // Tarkista onko tämä kuukausi tarkastelujakson sisällä
      const periodStart = new Date(year, month, 1);
      const periodEnd = new Date(year, month + 1, 0);
      
      if (periodStart <= endDateLastDay && periodEnd >= startDate) {
        // Etsi onko mock datassa periodi tälle kuukaudelle
        const existingPeriod = periods.find(p => {
          const periodDate = parsePeriodDate(p.ajanjakso);
          if (!periodDate) return false;
          return periodDate.getFullYear() === year && periodDate.getMonth() === month;
        });
        
        if (existingPeriod) {
          generatedPeriods.push(existingPeriod);
        } else {
          // Luo tyhjä periodi jos sitä ei löydy mock datasta
          const periodId = `${year}-${String(month + 1).padStart(2, '0')}`;
          generatedPeriods.push({
            id: periodId,
            ajanjakso: ajanjakso,
            toe: 0.0,
            jakaja: 0,
            palkka: 0,
            tyonantajat: "",
            pidennettavatJaksot: 0,
            rows: []
          });
        }
      }
      
      // Siirry edelliseen kuukauteen
      currentDate.setMonth(currentDate.getMonth() - 1);
    }
    
    return generatedPeriods;
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

  // Laske pidentävien jaksojen päivien määrä
  const additionalExtendingDays = useMemo(() => {
    return extendingPeriods.reduce((sum, period) => {
      const start = parseFinnishDate(period.startDate);
      const end = parseFinnishDate(period.endDate);
      if (!start || !end) return sum;
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return sum + diffDays;
    }, 0);
  }, [extendingPeriods]);

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
    additionalExtendingDays,
    subsidyCorrection: null,
  });

  // Laske TOE-alkupäivä
  const toeStartDate = useMemo(() => {
    if (!hasCalculated || !reviewPeriodStart) return undefined;
    return reviewPeriodStart;
  }, [hasCalculated, reviewPeriodStart]);

  // Get visible rows
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
              Täydennä kuukausille Suomen työn palkat jotta palkka voidaan laskea.
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
            onExtendingPeriodsClick={() => setExtendingPeriodsDialogOpen(true)}
          />
        )}

        {/* Palkanmääritys-painike */}
        {hasCalculated && (
          <div className="flex justify-start gap-2 mb-4">
            {!finlandDataFilled && (
              <Button 
                onClick={handleFillFinlandWorkData}
                variant="outline"
                className="whitespace-nowrap bg-green-50 hover:bg-green-100 border-green-300"
              >
                Täydennä Suomen työn palkat
              </Button>
            )}
            {finlandDataFilled && (
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
          defaultStartDate="1.7.2022"
          defaultEndDate="19.8.2022"
          showIndexAdjustment={true}
          onApply={(result) => {
            setWageDefinitionResult(result);
            setWageDefinitionOpen(false);
          }}
        />

        <ExtendingPeriodsDialog
          open={extendingPeriodsDialogOpen}
          onOpenChange={setExtendingPeriodsDialogOpen}
          periods={extendingPeriods}
          onSave={(periods) => {
            setExtendingPeriods(periods);
          }}
        />
      </div>
    </div>
  );
}

