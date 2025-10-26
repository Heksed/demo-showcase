"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useEuroTOEHandlers from "./hooks/useEuroTOEHandlers";
import Link from "next/link";
import { MOCK_EMPLOYMENT } from "./mockData";
import type { IncomeRow, MonthPeriod } from "./types";
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-4">

        {/* TOE Yhteenveto */}
        <SummaryHeader
          summary={summary as any}
          definitionType={definitionType}
          setDefinitionType={(v: any) => setDefinitionType(v)}
          formatCurrency={formatCurrency}
        />

        {/* Suodata tulotietoja painike */}
        <div className="flex justify-end mb-4">
          <Link href="/massincomesplit">
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
