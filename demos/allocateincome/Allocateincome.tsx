"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useEuroTOEHandlers from "./hooks/useEuroTOEHandlers";
import Link from "next/link";
import { MOCK_EMPLOYMENT } from "./mockData";
import type { IncomeRow, MonthPeriod, SubsidyCorrection } from "./types";
import { INCOME_TYPES, NON_BENEFIT_AFFECTING_INCOME_TYPES } from "./types";
import SplitIncomeDialog from "./components/SplitIncomeDialog";
import useSplitIncome from "./hooks/useSplitIncome";
import SummaryHeader from "./components/SummaryHeader";
import useTOESummary from "./hooks/useTOESummary";
import usePeriodsModel from "./hooks/usePeriodsModel";
import AllocationDialog from "./components/AllocationDialog";
import useAllocationModal from "./hooks/useAllocationModal";
import AddIncomeDialog from "./components/AddIncomeDialog";
import useAddIncomeModal from "./hooks/useAddIncomeModal";
import PeriodsTable from "./components/PeriodsTable";
import useOpenAllocation from "./hooks/useOpenAllocation";
import useViikkoTOEHandlers from "./hooks/useViikkoTOEHandlers";

// ============================================================================
// Allocate Income – Income allocation demo
// ============================================================================

// types moved to ./types

// --- Mock Data moved to mockData.ts ---

// Income type lists moved to types.ts

/* Local MOCK_PERIODS fallback removed */

// --- Helper Functions ---
import { formatCurrency, parseFinnishDate } from "./utils";
import { isoToFI } from "./utils";
import { getFinnishMonthName } from "./utils";
import { getVisibleRows } from "./utils";
import { daysBetween } from "./utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

// distributeByDays / distributeEqualMonths moved to utils

// Local month generator functions removed; handled inside hooks/utils

// Subsidized employers - same list as in Massincomesplit
const SUBSIDIZED_EMPLOYERS = new Set<string>(["Nokia Oyj"]);

// --- Main Component ---
export default function AllocateIncome() {
  const [definitionType, setDefinitionType] = useState<'eurotoe' | 'eurotoe6' | 'viikkotoe' | 'vuositulo' | 'ulkomaan'>('eurotoe');
  const [definitionOverride, setDefinitionOverride] = useState<{start: string, end: string} | null>(null);
  const [viikkoTOEVähennysSummat, setViikkoTOEVähennysSummat] = useState<{[periodId: string]: number}>({});
  const { periods, setPeriods, expandedPeriods, togglePeriod, isViikkoTOEPeriod } = usePeriodsModel(definitionType as any);

  // Tarkastelujakson muokkausmahdollisuus - lue sessionStoragesta jos saatavilla
  const [reviewPeriodStart, setReviewPeriodStart] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("reviewPeriodStart");
      if (stored) {
        return stored;
      }
    }
    // Oletusarvo riippuu definitionType:sta, mutta koska se on state, käytetään yleistä oletusarvoa
    // Päivitetään useEffect:issa jos definitionType on eurotoe
    return "01.01.2023";
  });
  
  const [reviewPeriodEnd, setReviewPeriodEnd] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("reviewPeriodEnd");
      if (stored) {
        return stored;
      }
    }
    // Oletusarvo riippuu definitionType:sta, mutta koska se on state, käytetään yleistä oletusarvoa
    // Päivitetään useEffect:issa jos definitionType on eurotoe
    return "31.12.2025";
  });

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

  // Filter periods based on review period
  const filteredPeriods = useMemo(() => {
    // ViikkoTOE-tyypillä käytetään suoraan usePeriodsModel hookin palauttamia periodsit
    // eikä filtteröidä niitä, koska viikkoTOE-näkymä on erillinen
    if (definitionType === 'viikkotoe') {
      return periods;
    }
    
    const startDate = parseFinnishDate(reviewPeriodStart);
    const endDate = parseFinnishDate(reviewPeriodEnd);
    
    if (!startDate || !endDate) return periods;
    
    // Set end date to last day of the month
    const endDateLastDay = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
    
    return periods.filter(period => {
      // Special handling for viikkotoe-combined period (ei pitäisi tulla tänne viikkoTOE-tyypillä)
      if (period.id === "viikkotoe-combined") {
        // ViikkoTOE-aika on 2024-05 - 2024-08, joten tarkista onko tarkastelujakso sisältää tämän
        const viikkoTOEStart = new Date(2024, 4, 1); // May 2024 (month index 4)
        const viikkoTOEEnd = new Date(2024, 7, 31); // August 2024 (month index 7)
        // Include if review period overlaps with ViikkoTOE period
        return viikkoTOEStart <= endDateLastDay && viikkoTOEEnd >= startDate;
      }
      
      const periodDate = parsePeriodDate(period.ajanjakso);
      if (!periodDate) return false;
      
      // Check if period's first day is within review period
      return periodDate >= startDate && periodDate <= endDateLastDay;
    });
  }, [periods, reviewPeriodStart, reviewPeriodEnd, definitionType]);

  const handleVähennysSummaChange = (periodId: string, summa: number) => {
    setViikkoTOEVähennysSummat(prev => ({
      ...prev,
      [periodId]: summa
    }));
  };

  // --- Split income modal state moved to hook ---
  const split = useSplitIncome(setPeriods);
  // Päivityslogiikka siirretty usePeriodsModel-hookkiin
  
  // Allocation modal state moved to hook
  const allocation = useAllocationModal({ setPeriods, getFinnishMonthName });
  // Add income modal state moved to hook
  const addIncome = useAddIncomeModal(setPeriods);

  // Allocation form state moved to hook

  // isViikkoTOEPeriod ja togglePeriod tulevat usePeriodsModel-hookista

  // Calculate TOE value based on salary and working days (jakaja)
  const calculateTOEValue = (period: MonthPeriod): number => {
    const totalSalary = calculateEffectiveIncomeTotal(period);
    if (totalSalary >= 930) {
      return 1.0;
    } else if (totalSalary >= 465) {
      return 0.5;
    } else {
      return 0.0;
    }
  };

  const isRowDeleted = (row: IncomeRow): boolean => {
    return row.huom?.toLowerCase().includes("poistettu") || false;
  };

  const calculateEffectiveIncomeTotal = (period: MonthPeriod): number => {
    return period.rows
      .filter(row => 
        !isRowDeleted(row) &&
      (!NON_BENEFIT_AFFECTING_INCOME_TYPES.includes(row.tulolaji) || 
         row.huom?.includes("Huomioitu laskennassa"))
      )
      .reduce((sum, row) => sum + row.palkka, 0);
  };

  const { handleViikkoTOESave, handleViikkoTOEDelete, handleViikkoTOEAdd } = useViikkoTOEHandlers(setPeriods);

  // Format review period for display
  const reviewPeriodDisplay = useMemo(() => {
    return `${reviewPeriodStart} - ${reviewPeriodEnd}`;
  }, [reviewPeriodStart, reviewPeriodEnd]);

  // Järjestä filteredPeriods uusimmasta vanhimpaan (uusin ensin)
  const sortedFilteredPeriods = useMemo(() => {
    return [...filteredPeriods].sort((a, b) => {
      // Erikoistapaus: viikkotoe-combined periodi pysyy omalla paikallaan (tulee viimeiseksi)
      if (a.id === "viikkotoe-combined") return 1;
      if (b.id === "viikkotoe-combined") return -1;
      
      // Järjestä period ID:n mukaan (uusin ensin)
      // Period ID on muodossa "YYYY-MM", joten string vertailu toimii
      return b.id.localeCompare(a.id);
    });
  }, [filteredPeriods]);

  const summary = useTOESummary({
    periods: sortedFilteredPeriods,
    definitionType,
    definitionOverride,
    calculateTOEValue,
    calculateEffectiveIncomeTotal,
    isViikkoTOEPeriod,
    viikkoTOEVähennysSummat,
    reviewPeriod: reviewPeriodDisplay,
  }) as any;

  // getVisibleRows moved to utils to ensure split-child rows are shown correctly
  const { openAllocationModalSingle, openAllocationModalBatch } = useOpenAllocation(
    allocation,
    isRowDeleted,
    NON_BENEFIT_AFFECTING_INCOME_TYPES
  );

  const { restoreIncomeType, deleteIncomeType, includeIncomeInCalculation } = useEuroTOEHandlers(setPeriods);

  // Handle add income modal moved to hook

  // Employment filtering moved to useAddIncomeModal

  // Allocation preview/validation/apply/remove moved to useAllocationModal

  // Subsidy correction state - read from sessionStorage on mount
  const [subsidyCorrection, setSubsidyCorrection] = useState<SubsidyCorrection | null>(null);

  useEffect(() => {
    // Read subsidy correction from sessionStorage when component mounts
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("subsidyCorrection");
      if (stored) {
        try {
          const correction = JSON.parse(stored) as SubsidyCorrection;
          setSubsidyCorrection(correction);
          // Clear from sessionStorage after reading (one-time use)
          sessionStorage.removeItem("subsidyCorrection");
        } catch (e) {
          console.error("Failed to parse subsidy correction from sessionStorage:", e);
        }
      }
    }
  }, []);

  // Aseta default tarkastelujakso euroTOE näkymässä (ei viikkoTOE)
  useEffect(() => {
    // Jos definitionType on viikkoTOE, ei muuteta arvoja
    if (definitionType === 'viikkotoe') {
      return;
    }
    
    // Jos definitionType on eurotoe (tai eurotoe6, vuositulo, ulkomaan), aseta default 2026
    if (definitionType === 'eurotoe' || definitionType === 'eurotoe6' || definitionType === 'vuositulo' || definitionType === 'ulkomaan') {
      // Tarkista ovatko nykyiset arvot vanhat oletusarvot (1.1.2023 - 31.12.2025)
      // Tarkista myös sessionStoragesta, koska arvot voivat olla sieltä luettu
      let storedStart = reviewPeriodStart;
      let storedEnd = reviewPeriodEnd;
      
      if (typeof window !== "undefined") {
        const sessionStart = sessionStorage.getItem("reviewPeriodStart");
        const sessionEnd = sessionStorage.getItem("reviewPeriodEnd");
        if (sessionStart && sessionEnd) {
          storedStart = sessionStart;
          storedEnd = sessionEnd;
        }
      }
      
      const isOldDefault = storedStart === "01.01.2023" && storedEnd === "31.12.2025";
      
      if (isOldDefault) {
        // Päivitä uusiin oletusarvoihin (1.1.2026 - 31.12.2026)
        setReviewPeriodStart("01.01.2026");
        setReviewPeriodEnd("31.12.2026");
        // Päivitä myös sessionStorage
        if (typeof window !== "undefined") {
          sessionStorage.setItem("reviewPeriodStart", "01.01.2026");
          sessionStorage.setItem("reviewPeriodEnd", "31.12.2026");
        }
      }
    }
  }, [definitionType]); // Suoritetaan kun definitionType muuttuu

  // Tallenna tarkastelujakso sessionStorageen kun se muuttuu
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("reviewPeriodStart", reviewPeriodStart);
      sessionStorage.setItem("reviewPeriodEnd", reviewPeriodEnd);
    }
  }, [reviewPeriodStart, reviewPeriodEnd]);

  // Collect all income rows from periods for Massincomesplit
  const collectAllIncomeRows = (periods: MonthPeriod[]): IncomeRow[] => {
    return periods.flatMap(period => period.rows || []);
  };

  // Check if periods contain subsidized work
  const hasSubsidizedWork = useMemo(() => {
    // Check all periods for subsidized work
    return periods.some(period => 
      period.rows.some(row => {
        // Check isSubsidized field if it's set
        if (row.isSubsidized !== undefined) {
          return row.isSubsidized;
        }
        // Fallback: check employer name against SUBSIDIZED_EMPLOYERS set
        return SUBSIDIZED_EMPLOYERS.has(row.tyonantaja);
      })
    );
  }, [periods]);

  // Hae palkkatuetun työn työnantajan nimi
  const subsidizedEmployerName = useMemo(() => {
    for (const period of periods) {
      for (const row of period.rows) {
        const isSubsidized = row.isSubsidized !== undefined
          ? row.isSubsidized
          : SUBSIDIZED_EMPLOYERS.has(row.tyonantaja);
        if (isSubsidized) {
          return row.tyonantaja;
        }
      }
    }
    return undefined;
  }, [periods]);

  // Handler for navigating to Massincomesplit with data
  const handleNavigateToMassIncomeSplit = () => {
    // Collect all income rows from filtered periods (within review period)
    const allRows = collectAllIncomeRows(sortedFilteredPeriods);
    
    // Save to sessionStorage
    if (typeof window !== "undefined") {
      sessionStorage.setItem("incomeRows", JSON.stringify(allRows));
      // Also save TOE and total salary for drawer
      sessionStorage.setItem("toeSystemTotal", JSON.stringify(summary.totalTOEMonths));
      sessionStorage.setItem("systemTotalSalary", JSON.stringify(summary.totalSalary));
      sessionStorage.setItem("periodCount", JSON.stringify(sortedFilteredPeriods.length));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-4">

        {/* Tarkastelujakson muokkaus - näytetään vain muille tyypeille kuin viikkotoe */}
        {definitionType !== 'viikkotoe' && (
          <Card className="p-4 mb-4">
            <div className="flex items-center gap-4">
              <Label className="font-medium text-gray-700 whitespace-nowrap">Tarkastelujakso:</Label>
              <div className="flex items-center gap-2">
                <Input 
                  type="text" 
                  placeholder="PP.KK.VVVV" 
                  value={reviewPeriodStart}
                  onChange={(e) => setReviewPeriodStart(e.target.value)}
                  className="w-32"
                />
                <span className="text-gray-600">-</span>
                <Input 
                  type="text" 
                  placeholder="PP.KK.VVVV" 
                  value={reviewPeriodEnd}
                  onChange={(e) => setReviewPeriodEnd(e.target.value)}
                  className="w-32"
                />
              </div>
              <div className="text-sm text-gray-600">
                TOE lasketaan tämän jakson sisällä olevista kuukausista
              </div>
            </div>
          </Card>
        )}

        {/* Palkkatuetun työn indikaattori */}
        {hasSubsidizedWork && (
          <div className="mb-4 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-r">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-amber-800">
                  <span className="font-medium">Palkkatuettu työ havaittu</span>
                  <span className="ml-2">Käytä "Suodata tulotietoja" -toimintoa tarkistaaksesi ja korjataksesi palkkatuetun työn vaikutukset.</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TOE Yhteenveto */}
        <SummaryHeader
          summary={summary as any}
          definitionType={definitionType}
          setDefinitionType={(v: any) => setDefinitionType(v)}
          formatCurrency={formatCurrency}
          subsidyCorrection={subsidyCorrection}
          hasSubsidizedWork={hasSubsidizedWork}
          subsidizedEmployerName={subsidizedEmployerName}
        />

        {/* Suodata tulotietoja painike */}
        <div className="flex justify-end mb-4">
          <Link href="/massincomesplit" onClick={handleNavigateToMassIncomeSplit}>
            <Button className="bg-[#0e4c92] hover:bg-[#0d4383]">Suodata tulotietoja</Button>
          </Link>
        </div>

        {/* Periods Table */}
        <PeriodsTable
          periods={sortedFilteredPeriods}
          definitionType={definitionType as any}
          expandedPeriods={expandedPeriods}
          togglePeriod={togglePeriod}
          isViikkoTOEPeriod={isViikkoTOEPeriod}
          calculateTOEValue={calculateTOEValue}
          calculateEffectiveIncomeTotal={calculateEffectiveIncomeTotal}
          getVisibleRows={getVisibleRows}
          isRowDeleted={isRowDeleted}
          NON_BENEFIT_AFFECTING_INCOME_TYPES={NON_BENEFIT_AFFECTING_INCOME_TYPES}
          restoreIncomeType={restoreIncomeType}
          openAllocationModalSingle={openAllocationModalSingle}
          onOpenAllocationModalBatch={openAllocationModalBatch}
          includeIncomeInCalculation={includeIncomeInCalculation}
          deleteIncomeType={deleteIncomeType}
          openSplitModal={(periodId, rowId) => split.openSplitModal(periodId, rowId)}
          onShowSavedAllocation={(row) => {
                                                        const savedAllocation = row.allocationData;
                                                        if (savedAllocation) {
              allocation.setAllocationContext(savedAllocation.originalContext);
              allocation.setAllocationMethod(savedAllocation.allocationMethod);
              allocation.setStartDate(savedAllocation.startDate);
              allocation.setEndDate(savedAllocation.endDate);
              allocation.setDistributionType(savedAllocation.distributionType);
              allocation.setDirection(savedAllocation.direction);
              allocation.setMonthCount(savedAllocation.monthCount);
              allocation.setModalOpen(true);
              allocation.setViewMode(true);
            }
          }}
          onOpenAddIncome={() => addIncome.setOpen(true)}
          onViikkoTOESave={handleViikkoTOESave}
          onViikkoTOEDelete={handleViikkoTOEDelete}
          onViikkoTOEAdd={handleViikkoTOEAdd}
          onVähennysSummaChange={handleVähennysSummaChange}
          formatCurrency={formatCurrency}
        />

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="px-3 py-1 border rounded hover:bg-gray-100">←</button>
            <span className="text-sm">sivu 1/1</span>
            <button className="px-3 py-1 border rounded hover:bg-gray-100">→</button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Tulosten määrä</span>
            <Select defaultValue="12">
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12</SelectItem>
                <SelectItem value="24">24</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm">1-12/86</span>
          </div>
        </div>
      </div>

      {/* Split income modal */}
      <SplitIncomeDialog
        open={split.splitModalOpen}
        onOpenChange={(open) => { if (!open) split.closeSplitModal(); }}
        mode={split.splitMode}
        onModeChange={(m) => split.setSplitMode(m)}
        targetType={split.splitTargetType}
        onTargetTypeChange={(v) => split.setSplitTargetType(v)}
        value={split.splitValue}
        onValueChange={(v) => split.setSplitValue(v)}
        onApply={split.applySplit}
      />

      {/* Allocation Modal */}
      <AllocationDialog
        open={allocation.modalOpen}
        onOpenChange={(open: boolean) => { allocation.setModalOpen(open); if (!open) allocation.setViewMode(false); }}
        viewMode={allocation.viewMode}
        setViewMode={allocation.setViewMode}
        allocationContext={allocation.allocationContext}
        allocationMethod={allocation.allocationMethod}
        setAllocationMethod={allocation.setAllocationMethod}
        distributionType={allocation.distributionType}
        setDistributionType={allocation.setDistributionType}
        direction={allocation.direction}
        setDirection={allocation.setDirection}
        startDate={allocation.startDate}
        setStartDate={allocation.setStartDate}
        endDate={allocation.endDate}
        setEndDate={allocation.setEndDate}
        monthCount={allocation.monthCount}
        setMonthCount={allocation.setMonthCount}
        manualAmounts={allocation.manualAmounts}
        setManualAmounts={allocation.setManualAmounts}
        generateMonthsFromEmployment={allocation.generateMonthsFromEmployment}
        generateMonthsFromPayDate={allocation.generateMonthsFromPayDate}
        validation={allocation.validation}
        previewSplits={allocation.previewSplits}
        aggregatedByMonth={allocation.aggregatedByMonth}
        formatCurrency={formatCurrency}
        isoToFI={isoToFI}
        daysBetween={daysBetween}
        applyAllocation={allocation.applyAllocation}
        removeAllocation={allocation.removeAllocation}
        MOCK_EMPLOYMENT={MOCK_EMPLOYMENT}
      />

      {/* Add Income Modal */}
      <AddIncomeDialog
        open={addIncome.open}
        onOpenChange={addIncome.setOpen}
        filteredEmployments={addIncome.filteredEmployments}
        selectedEmploymentIds={addIncome.selectedEmploymentIds}
        toggleEmploymentSelection={addIncome.toggleEmploymentSelection}
        paymentDate={addIncome.paymentDate}
        setPaymentDate={addIncome.setPaymentDate}
        incomeType={addIncome.incomeType}
        setIncomeType={addIncome.setIncomeType}
        salaryAmount={addIncome.salaryAmount}
        setSalaryAmount={addIncome.setSalaryAmount}
        employmentStartDate={addIncome.employmentStartDate}
        setEmploymentStartDate={addIncome.setEmploymentStartDate}
        employmentEndDate={addIncome.employmentEndDate}
        setEmploymentEndDate={addIncome.setEmploymentEndDate}
        INCOME_TYPES={INCOME_TYPES}
        handleAddIncome={addIncome.handleAddIncome}
      />
    </div>
  );
}
