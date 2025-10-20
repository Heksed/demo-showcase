"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, ChevronRight, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import EuroTOETable from "./EuroTOETable";
import ViikkoTOETable from "./ViikkoTOETable";
import type { IncomeRow, MonthPeriod } from "../types";

type DefinitionType = 'eurotoe' | 'eurotoe6' | 'viikkotoe' | 'vuositulo' | 'ulkomaan';

type Props = {
  periods: MonthPeriod[];
  definitionType: DefinitionType;
  expandedPeriods: Set<string>;
  togglePeriod: (periodId: string) => void;
  isViikkoTOEPeriod: (period: MonthPeriod) => boolean;
  calculateTOEValue: (period: MonthPeriod) => number;
  calculateEffectiveIncomeTotal: (period: MonthPeriod) => number;
  getVisibleRows: (period: MonthPeriod) => IncomeRow[];
  isRowDeleted: (row: IncomeRow) => boolean;
  NON_BENEFIT_AFFECTING_INCOME_TYPES: string[];
  restoreIncomeType: (row: IncomeRow) => void;
  openAllocationModalSingle: (row: IncomeRow) => void;
  onOpenAllocationModalBatch: (row: IncomeRow, period: MonthPeriod) => void;
  includeIncomeInCalculation: (row: IncomeRow) => void;
  deleteIncomeType: (row: IncomeRow) => void;
  openSplitModal: (periodId: string, rowId: string) => void;
  onShowSavedAllocation: (row: IncomeRow) => void;
  onOpenAddIncome: () => void;
  onViikkoTOESave: (periodId: string, rowId: string, updatedRow: any) => void;
  onViikkoTOEDelete: (periodId: string, rowId: string) => void;
  formatCurrency: (n: number) => string;
};

export default function PeriodsTable({
  periods,
  definitionType,
  expandedPeriods,
  togglePeriod,
  isViikkoTOEPeriod,
  calculateTOEValue,
  calculateEffectiveIncomeTotal,
  getVisibleRows,
  isRowDeleted,
  NON_BENEFIT_AFFECTING_INCOME_TYPES,
  restoreIncomeType,
  openAllocationModalSingle,
  onOpenAllocationModalBatch,
  includeIncomeInCalculation,
  deleteIncomeType,
  openSplitModal,
  onShowSavedAllocation,
  onOpenAddIncome,
  onViikkoTOESave,
  onViikkoTOEDelete,
  formatCurrency,
}: Props) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-700 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium w-12"></th>
                <th className="px-4 py-3 text-left text-sm font-medium">Ajanjakso</th>
                <th className="px-4 py-3 text-left text-sm font-medium">TOE</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Jakaja</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Palkka</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Työnantajat</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Pidennettävät jaksot</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((period) => (
                <React.Fragment key={period.id}>
                  <tr
                    className={cn(
                      "border-b hover:bg-gray-50",
                      period.id.startsWith("2024-") && period.toe === 0
                        ? "bg-gray-100 text-gray-500"
                        : isViikkoTOEPeriod(period)
                          ? "bg-blue-50"
                          : "bg-white"
                    )}
                  >
                    <td className="px-4 py-3">
                      <button onClick={() => togglePeriod(period.id)} className="hover:bg-gray-200 rounded p-1">
                        {expandedPeriods.has(period.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button onClick={() => togglePeriod(period.id)} className="text-blue-600 hover:underline">
                        {period.ajanjakso}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {period.viikkoTOERows && period.viikkoTOERows.length > 0
                        ? Math.round(period.toe * 10) / 10
                        : calculateTOEValue(period)}
                    </td>
                    <td className="px-4 py-3 text-sm">{period.jakaja}</td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {period.viikkoTOERows && period.viikkoTOERows.length > 0
                        ? formatCurrency(period.palkka)
                        : formatCurrency(calculateEffectiveIncomeTotal(period))}
                    </td>
                    <td className="px-4 py-3 text-sm">{period.tyonantajat}</td>
                    <td className="px-4 py-3 text-sm">
                      {period.pidennettavatJaksot > 0 && (
                        <button className="text-blue-600 hover:underline">{period.pidennettavatJaksot}</button>
                      )}
                    </td>
                  </tr>

                  {expandedPeriods.has(period.id) && (
                    <tr>
                      <td colSpan={7} className="p-0">
                        <div className="bg-gray-100 p-4">
                          {definitionType === "viikkotoe" && period.viikkoTOERows && period.viikkoTOERows.length > 0 ? (
                            <ViikkoTOETable
                              period={period}
                              onSave={onViikkoTOESave}
                              onDelete={onViikkoTOEDelete}
                              formatCurrency={formatCurrency}
                            />
                          ) : (
                            period.rows.length > 0 && (
                              <>
                                <EuroTOETable
                                  rows={getVisibleRows(period)}
                                  isRowDeleted={isRowDeleted}
                                  formatCurrency={formatCurrency}
                                  NON_BENEFIT_AFFECTING_INCOME_TYPES={NON_BENEFIT_AFFECTING_INCOME_TYPES}
                                  restoreIncomeType={restoreIncomeType}
                                  openAllocationModalSingle={openAllocationModalSingle}
                                  onOpenAllocationModalBatch={(row) => onOpenAllocationModalBatch(row, period)}
                                  includeIncomeInCalculation={includeIncomeInCalculation}
                                  deleteIncomeType={deleteIncomeType}
                                  openSplitModal={(rowId: any) => openSplitModal(period.id, rowId as any)}
                                  onShowSavedAllocation={onShowSavedAllocation}
                                />
                                <div className="flex justify-between items-center mt-3">
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={onOpenAddIncome}>Lisää tulotieto</Button>
                                  </div>
                                  <Button variant="ghost" size="sm">Peruuta muutokset</Button>
                                </div>
                              </>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}


