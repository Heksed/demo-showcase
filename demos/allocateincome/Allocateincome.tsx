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
import { formatCurrency } from "./utils";
import { isoToFI } from "./utils";
import { getFinnishMonthName } from "./utils";
import { getVisibleRows } from "./utils";
import { daysBetween } from "./utils";

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

  const summary = useTOESummary({
    periods,
      definitionType,
    definitionOverride,
    calculateTOEValue,
    calculateEffectiveIncomeTotal,
    isViikkoTOEPeriod,
    viikkoTOEVähennysSummat,
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

  // Handler for navigating to Massincomesplit with data
  const handleNavigateToMassIncomeSplit = () => {
    // Collect all income rows from periods
    const allRows = collectAllIncomeRows(periods);
    
    // Save to sessionStorage
    if (typeof window !== "undefined") {
      sessionStorage.setItem("incomeRows", JSON.stringify(allRows));
      // Also save TOE and total salary for drawer
      sessionStorage.setItem("toeSystemTotal", JSON.stringify(summary.totalTOEMonths));
      sessionStorage.setItem("systemTotalSalary", JSON.stringify(summary.totalSalary));
      sessionStorage.setItem("periodCount", JSON.stringify(periods.length));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-4">

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
        />

        {/* Suodata tulotietoja painike */}
        <div className="flex justify-end mb-4">
          <Link href="/massincomesplit" onClick={handleNavigateToMassIncomeSplit}>
            <Button className="bg-[#0e4c92] hover:bg-[#0d4383]">Suodata tulotietoja</Button>
          </Link>
        </div>

        {/* Periods Table */}
        <PeriodsTable
          periods={periods}
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
