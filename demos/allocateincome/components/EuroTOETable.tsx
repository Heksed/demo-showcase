"use client";

import React from "react";
import type { IncomeRow } from "../types";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, RotateCcw, Eye, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// IncomeRow imported from shared types

export default function EuroTOETable({
  rows,
  isRowDeleted,
  formatCurrency,
  NON_BENEFIT_AFFECTING_INCOME_TYPES,
  restoreIncomeType,
  openAllocationModalSingle,
  onOpenAllocationModalBatch,
  includeIncomeInCalculation,
  deleteIncomeType,
  openSplitModal,
  onShowSavedAllocation,
}: {
  rows: IncomeRow[];
  isRowDeleted: (row: IncomeRow) => boolean;
  formatCurrency: (n: number) => string;
  NON_BENEFIT_AFFECTING_INCOME_TYPES: string[];
  restoreIncomeType: (row: IncomeRow) => void;
  openAllocationModalSingle: (row: IncomeRow) => void;
  onOpenAllocationModalBatch: (row: IncomeRow) => void;
  includeIncomeInCalculation: (row: IncomeRow) => void;
  deleteIncomeType: (row: IncomeRow) => void;
  openSplitModal: (rowId: string) => void;
  onShowSavedAllocation: (row: IncomeRow) => void;
}) {
  return (
    <>
    <table className="min-w-full border border-gray-300 bg-white">
      <thead className="bg-[#003479] text-white">
        <tr>
          <th className="px-3 py-2 text-left text-xs font-medium">Huom</th>
          <th className="px-3 py-2 text-left text-xs font-medium">Maksupäivä</th>
          <th className="px-3 py-2 text-left text-xs font-medium">Tulolaji</th>
          <th className="px-3 py-2 text-left text-xs font-medium">Palkka</th>
          <th className="px-3 py-2 text-left text-xs font-medium">Alkuperäinen tulo</th>
          <th className="px-3 py-2 text-left text-xs font-medium">Ansainta-aika</th>
          <th className="px-3 py-2 text-left text-xs font-medium">Kohdistus TOE</th>
          <th className="px-3 py-2 text-left text-xs font-medium">Työnantaja</th>
          <th className="px-3 py-2 text-left text-xs font-medium">Toiminto</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.id}
            className={cn(
              "border-b",
              isRowDeleted(row)
                ? "bg-gray-100 text-gray-500"
                : (NON_BENEFIT_AFFECTING_INCOME_TYPES.includes(row.tulolaji) && !row.huom?.includes("Huomioitu laskennassa"))
                  ? "bg-orange-50"
                  : "bg-white"
            )}
          >
            <td className={cn("px-3 py-2 text-xs", isRowDeleted(row) && "text-gray-500")}>
              <div className="flex items-center gap-2 flex-wrap">
                {row.isNew && (
                  <Badge variant="default" className="bg-blue-600 text-white text-xs">
                    Uusi
                  </Badge>
                )}
                {row.huom && <span>{row.huom}</span>}
              </div>
            </td>
            <td className={cn("px-3 py-2 text-xs whitespace-nowrap", isRowDeleted(row) && "text-gray-500")}>{row.maksupaiva}</td>
            <td className={cn("px-3 py-2 text-xs", isRowDeleted(row) && "text-gray-500 line-through")}>{row.tulolaji}</td>
            <td className={cn("px-3 py-2 text-xs text-right", isRowDeleted(row) && "text-gray-500")}>{formatCurrency(row.palkka)}</td>
            <td className={cn("px-3 py-2 text-xs text-right", isRowDeleted(row) && "text-gray-500")}>{row.alkuperainenTulo > 0 ? formatCurrency(row.alkuperainenTulo) : ""}</td>
            <td 
              className={cn(
                "px-3 py-2 text-xs whitespace-nowrap",
                isRowDeleted(row) 
                  ? "text-gray-500 cursor-not-allowed" 
                  : row.ansaintaAika && (row.tulolaji === "Tulospalkkio" || row.tulolaji === "Bonus")
                    ? "cursor-pointer hover:bg-blue-50 hover:text-blue-700 underline"
                    : ""
              )}
              onClick={() => {
                if (!isRowDeleted(row)) {
                  openAllocationModalSingle(row);
                }
              }}
            >
              {(row.tulolaji === "Tulospalkkio" || row.tulolaji === "Bonus") && !row.huom?.startsWith('Kohdistettu') ? (row.ansaintaAika || "-") : ""}
            </td>
            <td className={cn("px-3 py-2 text-xs whitespace-nowrap", isRowDeleted(row) && "text-gray-500")}>{row.kohdistusTOE || ""}</td>
            <td className={cn("px-3 py-2 text-xs", isRowDeleted(row) && "text-gray-500")}>{row.tyonantaja}</td>
            <td className="px-3 py-2 text-xs">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-blue-600 hover:text-blue-800">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="end">
                  <div className="flex flex-col gap-1">
                    {isRowDeleted(row) ? (
                      <Button
                        variant="ghost"
                        className="justify-start text-sm font-normal text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => restoreIncomeType(row)}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Palauta aktiiviseksi
                      </Button>
                    ) : (
                      <>
                        {row.huom?.startsWith('Kohdistettu') && (
                          <Button
                            variant="ghost"
                            className="justify-start text-sm font-normal text-blue-600 hover:text-blue-700"
                            onClick={() => onShowSavedAllocation(row)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Näytä kohdistustiedot
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          className="justify-start text-sm font-normal"
                          onClick={() => openAllocationModalSingle(row)}
                        >
                          Kohdista tulotieto
                        </Button>
                        <Button
                          variant="ghost"
                          className="justify-start text-sm font-normal"
                          onClick={() => onOpenAllocationModalBatch(row)}
                        >
                          Kohdista maksupäivän tulolajit
                        </Button>
                        {NON_BENEFIT_AFFECTING_INCOME_TYPES.includes(row.tulolaji) && (
                          <Button
                            variant="ghost"
                            className="justify-start text-sm font-normal text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => includeIncomeInCalculation(row)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Huomioi tulo laskennassa
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          className="justify-start text-sm font-normal"
                          onClick={() => openSplitModal(row.id)}
                        >
                          Jaa tulolaji
                        </Button>
                        <Button
                          variant="ghost"
                          className="justify-start text-sm font-normal text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => deleteIncomeType(row)}
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Poista tulolaji
                        </Button>
                      </>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </>
  );
}


