"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { EU_WORK_PERIODS } from "../mockData";
import type { MonthPeriod, IncomeRow } from "../../allocateincome/types";
import { formatCurrency, parseFinnishDate, formatDateFI } from "../../allocateincome/utils";
import PeriodsTable from "../../allocateincome/components/PeriodsTable";
import WageDefinitionDrawer from "./WageDefinitionDrawer";
import ForeignWorkSummaryHeader from "./ForeignWorkSummaryHeader";
import TransferDataTOEDialog from "./TransferDataTOEDialog";
import useTOESummary from "../../allocateincome/hooks/useTOESummary";

// Suomen työn palkkatiedot täydennetään käsittelijän toimesta
// Palkka: 2301,26 € (maksetaan 15.6.2025)
// Palkka jaetaan: toukokuu 1801,09 €, kesäkuu 500,30 €
const FINLAND_WAGE_MAY = 1801.09;
const FINLAND_WAGE_JUNE = 500.30;
const FINLAND_WAGE_TOTAL = FINLAND_WAGE_MAY + FINLAND_WAGE_JUNE;

// Funktio joka täydentää Suomen työn palkkatiedot
const fillFinlandWorkData = (periods: MonthPeriod[]): MonthPeriod[] => {
  return periods.map(period => {
    // Tarkista onko kyseessä Suomen työn periodi (toukokuu-kesäkuu 2025)
    // Tarkista sekä ajanjakso että ID
    const isFinlandPeriod = 
      period.ajanjakso === "2025 Toukokuu" || period.ajanjakso === "2025 Kesäkuu" ||
      period.id === "2025-05" || period.id === "2025-06" ||
      period.ajanjakso.includes("2025") && (period.ajanjakso.includes("Toukokuu") || period.ajanjakso.includes("Kesäkuu"));
    
    if (!isFinlandPeriod || period.rows.length > 0) {
      return period; // Ei Suomen periodi tai jo täytetty
    }

    let newPeriod = { ...period };
    
    // Tarkista toukokuu: ajanjakso tai ID
    const isMay = period.ajanjakso === "2025 Toukokuu" || period.id === "2025-05" || 
                  (period.ajanjakso.includes("2025") && period.ajanjakso.includes("Toukokuu"));
    
    if (isMay) {
      // Toukokuu: 7.5.2025 - 31.5.2025 (25 päivää)
      // Jakaja: 21.5 (täysi kuukausi)
      newPeriod = {
        ...period,
        toe: 1.0, // 1801,09 € >= 930 €
        jakaja: 21.5,
        palkka: FINLAND_WAGE_MAY,
        tyonantajat: "Suomen työnantaja",
        pidennettavatJaksot: 0,
        rows: [
          {
            id: `fin-05-1`,
            maksupaiva: "15.6.2025",
            tulolaji: "Aikapalkka",
            palkka: FINLAND_WAGE_MAY,
            alkuperainenTulo: FINLAND_WAGE_TOTAL, // Alkuperäinen kokonaispalkka
            ansaintaAika: "7.5.2025 - 31.5.2025",
            tyonantaja: "Suomen työnantaja"
          }
        ]
      };
    } 
    // Tarkista kesäkuu: ajanjakso tai ID
    const isJune = period.ajanjakso === "2025 Kesäkuu" || period.id === "2025-06" || 
                    (period.ajanjakso.includes("2025") && period.ajanjakso.includes("Kesäkuu"));
    
    if (isJune) {
      // Kesäkuu: 1.6.2025 - 7.6.2025 (7 päivää)
      // Jakaja: 21.5 (täysi kuukausi)
      newPeriod = {
        ...period,
        toe: 0.5, // 500,30 € >= 465 € mutta < 930 €
        jakaja: 21.5,
        palkka: FINLAND_WAGE_JUNE,
        tyonantajat: "Suomen työnantaja",
        pidennettavatJaksot: 0,
        rows: [
          {
            id: `fin-06-1`,
            maksupaiva: "15.6.2025",
            tulolaji: "Aikapalkka",
            palkka: FINLAND_WAGE_JUNE,
            alkuperainenTulo: FINLAND_WAGE_TOTAL, // Alkuperäinen kokonaispalkka
            ansaintaAika: "1.6.2025 - 7.6.2025",
            tyonantaja: "Suomen työnantaja"
          }
        ]
      };
    }

    return newPeriod;
  });
};

export default function EUWorkScenario() {
  const [periods, setPeriods] = useState<MonthPeriod[]>(EU_WORK_PERIODS);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [isCalculatingTOE, setIsCalculatingTOE] = useState(false);
  const [reviewPeriodStart, setReviewPeriodStart] = useState<string>("");
  const [reviewPeriodEnd, setReviewPeriodEnd] = useState<string>("");
  const [wageDefinitionOpen, setWageDefinitionOpen] = useState(false);
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set());
  const [finlandDataFilled, setFinlandDataFilled] = useState(false);
  const [definitionType, setDefinitionType] = useState<"eurotoe" | "eurotoe6" | "viikkotoe" | "vuositulo" | "ulkomaan">("ulkomaan");
  const [transferDataTOEDialogOpen, setTransferDataTOEDialogOpen] = useState(false);
  
  // Palkanmäärityksen tiedot
  const [wageDefinitionResult, setWageDefinitionResult] = useState<{
    totalSalary: number;
    divisorDays: number;
    monthlyWage: number;
    dailyWage: number;
    definitionPeriodStart: string;
    definitionPeriodEnd: string;
  } | null>(null);

  // Alusta päättymispäivä
  useEffect(() => {
    if (!hasCalculated) {
      // Päivärahan hakijaksi: 12.2.2025
      setReviewPeriodEnd("12.2.2025");
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
    // Laske tarkastelujakson alkupäivä (14kk taaksepäin)
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
    // Jos periodilla on TOE-arvo mutta ei palkkatietoja (esim. siirtotiedot Tanskasta),
    // käytetään periodien toe-kenttää suoraan
    if (period.rows.length === 0 && period.toe > 0) {
      return period.toe;
    }
    
    // Muuten lasketaan palkkatietojen perusteella
    const totalSalary = period.rows.reduce((sum, row) => sum + row.palkka, 0);
    if (totalSalary >= 930) return 1.0;
    if (totalSalary >= 465) return 0.5;
    return 0.0;
  }, []);

  const calculateEffectiveIncomeTotal = useCallback((period: MonthPeriod): number => {
    return period.rows.reduce((sum, row) => sum + row.palkka, 0);
  }, []);

  const isViikkoTOEPeriod = useCallback((period: MonthPeriod): boolean => {
    return false; // Ei viikkoTOE-laskentaa tässä skenaariossa
  }, []);

  const togglePeriod = useCallback((periodId: string) => {
    setExpandedPeriods(prev => {
      const next = new Set(prev);
      if (next.has(periodId)) next.delete(periodId); else next.add(periodId);
      return next;
    });
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
    
    // Laske tarkastelujakson alkupäivä (14 kk taaksepäin)
    const effectiveStartDate = new Date(startDate);
    effectiveStartDate.setDate(1); // Kuukauden ensimmäinen päivä
    
    // Aloita loppupäivästä ja mene taaksepäin effectiveStartDate asti
    const currentDate = new Date(endDate);
    const minDate = new Date(effectiveStartDate);
    minDate.setDate(1);
    
    while (currentDate >= minDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const monthName = monthNames[month];
      const ajanjakso = `${year} ${monthName}`;
      
      // Tarkista onko tämä kuukausi tarkastelujakson sisällä
      const periodStart = new Date(year, month, 1);
      const periodEnd = new Date(year, month + 1, 0);
      
      if (periodStart <= endDateLastDay && periodEnd >= effectiveStartDate) {
        // Etsi onko periods state:ssa periodi tälle kuukaudelle
        // Tarkista ensin ID:llä, sitten ajanjaksolla
        const periodId = `${year}-${String(month + 1).padStart(2, '0')}`;
        let existingPeriod = periods.find(p => p.id === periodId);
        
        // Jos ei löydy ID:llä, etsi ajanjaksolla
        if (!existingPeriod) {
          existingPeriod = periods.find(p => {
            const periodDate = parsePeriodDate(p.ajanjakso);
            if (!periodDate) return false;
            return periodDate.getFullYear() === year && periodDate.getMonth() === month;
          });
        }
        
        if (existingPeriod) {
          // Käytä periods state:sta löytyvää periodia (sisältää päivitetyt tiedot)
          generatedPeriods.push(existingPeriod);
        } else {
          // Luo tyhjä periodi jos sitä ei löydy periods state:sta
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

  // Täydennä Suomen työn palkkatiedot
  const handleFillFinlandWorkData = useCallback(() => {
    // Käytä filteredPeriods:ia, jotta dynaamisesti generoidut periodit päivittyvät
    // filteredPeriods sisältää kaikki tarkastelujakson periodit, mukaan lukien toukokuu ja kesäkuu 2025
    setPeriods(prev => {
      // Yhdistä filteredPeriods ja prev state, jotta kaikki periodit päivittyvät
      const allPeriods = [...filteredPeriods];
      
      // Lisää prev state:n periodit, joita ei ole filteredPeriods:issa
      const filteredIds = new Set(filteredPeriods.map(p => p.id));
      prev.forEach(p => {
        if (!filteredIds.has(p.id)) {
          allPeriods.push(p);
        }
      });
      
      // Päivitä periodit fillFinlandWorkData:lla
      const updatedPeriods = fillFinlandWorkData(allPeriods);
      
      // Yhdistä päivitetyt periodit prev stateen ja lisää uudet periodit
      const periodMap = new Map(updatedPeriods.map(p => [p.id, p]));
      const prevMap = new Map(prev.map(p => [p.id, p]));
      
      // Yhdistä: päivitä olemassa olevat periodit ja lisää uudet
      const result = prev.map(p => periodMap.get(p.id) || p);
      
      // Lisää uudet periodit, joita ei ole prev state:ssa
      updatedPeriods.forEach(p => {
        if (!prevMap.has(p.id)) {
          result.push(p);
        }
      });
      
      return result;
    });
    setFinlandDataFilled(true);
  }, [filteredPeriods]);

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
        {hasCalculated && !finlandDataFilled && (
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
            onWageDefinitionClick={() => setWageDefinitionOpen(true)}
          />
        )}

        {/* Palkanmääritys-painike ja siirtotiedot */}
        {hasCalculated && (
          <div className="flex justify-start gap-2 mb-4">
            <Button 
              onClick={() => setTransferDataTOEDialogOpen(true)}
              variant="outline"
              className="whitespace-nowrap"
            >
              Lisää siirtotiedot
            </Button>
            {!finlandDataFilled && (
              <Button 
                onClick={handleFillFinlandWorkData}
                variant="outline"
                className="whitespace-nowrap bg-green-50 hover:bg-green-100 border-green-300"
              >
                Tulorekisterihaku
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
          onApply={(result) => {
            setWageDefinitionResult(result);
            setWageDefinitionOpen(false);
          }}
          showIndexAdjustment={false}
        />

        {/* Transfer Data TOE Dialog */}
        <TransferDataTOEDialog
          open={transferDataTOEDialogOpen}
          onOpenChange={setTransferDataTOEDialogOpen}
          periods={sortedFilteredPeriods}
          onSave={(updatedPeriods) => {
            setPeriods(updatedPeriods);
          }}
        />
      </div>
    </div>
  );
}

