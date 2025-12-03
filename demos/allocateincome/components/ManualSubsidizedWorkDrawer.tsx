"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { IncomeRow, SubsidyCorrection, MonthPeriod, SubsidyRule } from "../types";
import { formatCurrency, parseFinnishDate, formatDateFI } from "../utils";
import { calculateTOEValueFromSalary } from "../domain/toe";

// SUBSIDIZED_EMPLOYERS set (should match the one in Allocateincome.tsx)
const SUBSIDIZED_EMPLOYERS = new Set(["Nokia Oyj"]);

interface ManualSubsidizedWorkDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: IncomeRow[];
  periods: MonthPeriod[];
  toeSystemTotal: number;
  systemTotalSalary: number;
  periodCount: number;
  totalExtendingDays: number;
  reviewPeriodStart: string | null;
  reviewPeriodEnd: string;
  calculateTOEValue: (period: MonthPeriod) => number;
  calculateEffectiveIncomeTotal: (period: MonthPeriod) => number;
  onApplyCorrection: (correction: SubsidyCorrection) => void;
  onExtendPeriod: (additionalDays: number, correction: SubsidyCorrection) => void;
  estimateTOEWithExtending: (additionalDays: number, correction: SubsidyCorrection) => number;
  onReviewPeriodChange?: (start: string | null, end: string) => void;
}

// Parse period date from ajanjakso string (e.g., "2025 Joulukuu" -> Date)
function parsePeriodDate(ajanjakso: string): Date | null {
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
}

// Check if a row is subsidized
function isSubsidizedRow(row: IncomeRow, subsidizedEmployers: Set<string>): boolean {
  if (row.isSubsidized !== undefined) {
    return row.isSubsidized;
  }
  return subsidizedEmployers.has(row.tyonantaja);
}

// Get first payment date from period rows
function getFirstPaymentDate(period: MonthPeriod): string {
  const subsidizedRows = period.rows.filter(row => isSubsidizedRow(row, SUBSIDIZED_EMPLOYERS));
  if (subsidizedRows.length > 0 && subsidizedRows[0].maksupaiva) {
    return subsidizedRows[0].maksupaiva;
  }
  // Fallback to period month
  const periodDate = parsePeriodDate(period.ajanjakso);
  if (periodDate) {
    return formatDateFI(periodDate);
  }
  return period.ajanjakso;
}

interface ManualPeriodRow {
  periodId: string;
  periodDate: Date;
  maksupaiva: string;
  normalWorkWage: number; // Muu työ (ei muokattavissa)
  originalSubsidizedWage: number; // Palkkatukityö alkuperäinen (ei muokattavissa)
  manualSubsidizedWage: number; // Palkkatukityö (muokattava)
  manualTOE: number; // TOE (muokattava)
  manualJakaja: number; // Jakaja (muokattava)
  includeInToe: boolean;
  includeInWage: boolean;
  originalPeriod: MonthPeriod;
}

export default function ManualSubsidizedWorkDrawer({
  open,
  onOpenChange,
  rows,
  periods,
  toeSystemTotal,
  systemTotalSalary,
  periodCount,
  totalExtendingDays,
  reviewPeriodStart,
  reviewPeriodEnd,
  calculateTOEValue,
  calculateEffectiveIncomeTotal,
  onApplyCorrection,
  onExtendPeriod,
  estimateTOEWithExtending,
  onReviewPeriodChange,
}: ManualSubsidizedWorkDrawerProps) {
  // State for subsidy rule and employment start date
  const [subsidyRule, setSubsidyRule] = useState<SubsidyRule>("NONE");
  const [employmentStartDate, setEmploymentStartDate] = useState<string>("");
  
  // Local state for editable review period
  const [localReviewPeriodStart, setLocalReviewPeriodStart] = useState<string>(reviewPeriodStart || "");
  const [localReviewPeriodEnd, setLocalReviewPeriodEnd] = useState<string>(reviewPeriodEnd);
  
  // Sync with props when they change externally
  useEffect(() => {
    setLocalReviewPeriodStart(reviewPeriodStart || "");
    setLocalReviewPeriodEnd(reviewPeriodEnd);
  }, [reviewPeriodStart, reviewPeriodEnd]);
  
  // Handle review period changes - only update local state on change
  const handleReviewPeriodStartChange = (value: string) => {
    setLocalReviewPeriodStart(value);
    // Don't call callback on every keystroke, only update local state
  };
  
  const handleReviewPeriodEndChange = (value: string) => {
    setLocalReviewPeriodEnd(value);
    // Don't call callback on every keystroke, only update local state
  };
  
  // Call callback when user leaves the input field
  const handleReviewPeriodStartBlur = () => {
    if (onReviewPeriodChange) {
      onReviewPeriodChange(localReviewPeriodStart || null, localReviewPeriodEnd);
    }
  };
  
  const handleReviewPeriodEndBlur = () => {
    if (onReviewPeriodChange) {
      onReviewPeriodChange(localReviewPeriodStart || null, localReviewPeriodEnd);
    }
  };

  // Parse review period dates
  const reviewPeriodStartDate = useMemo(() => {
    if (!localReviewPeriodStart) return null;
    return parseFinnishDate(localReviewPeriodStart);
  }, [localReviewPeriodStart]);

  const reviewPeriodEndDate = useMemo(() => {
    if (!localReviewPeriodEnd) return new Date();
    return parseFinnishDate(localReviewPeriodEnd) || new Date();
  }, [localReviewPeriodEnd]);

  // Parse employment start date
  const employmentStartDateParsed = useMemo(() => {
    if (!employmentStartDate || employmentStartDate.trim() === "") return null;
    const parsed = parseFinnishDate(employmentStartDate);
    if (!parsed) return null;
    // Set to first day of month for calculations
    return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
  }, [employmentStartDate]);

  // Build initial period rows from periods
  const initialPeriodRows = useMemo(() => {
    const periodRows: ManualPeriodRow[] = [];
    
    for (const period of periods) {
      const periodDate = parsePeriodDate(period.ajanjakso);
      if (!periodDate) continue;
      
      // Filter by review period
      if (reviewPeriodEndDate && periodDate > reviewPeriodEndDate) continue;
      if (reviewPeriodStartDate && periodDate < reviewPeriodStartDate) continue;
      
      // Separate normal and subsidized work
      const normalRows = period.rows.filter(row => !isSubsidizedRow(row, SUBSIDIZED_EMPLOYERS));
      const subsidizedRows = period.rows.filter(row => isSubsidizedRow(row, SUBSIDIZED_EMPLOYERS));
      
      const normalWorkWage = normalRows.reduce((sum, row) => sum + (row.palkka || 0), 0);
      const originalSubsidizedWage = subsidizedRows.reduce((sum, row) => sum + (row.palkka || 0), 0);
      
      // Initialize manual values: always start with 0 for subsidized wage in manual mode
      const initialSubsidizedWage = 0;
      const initialTOE = 0;
      const initialJakaja = period.jakaja;
      
      periodRows.push({
        periodId: period.id,
        periodDate,
        maksupaiva: getFirstPaymentDate(period),
        normalWorkWage,
        originalSubsidizedWage,
        manualSubsidizedWage: initialSubsidizedWage,
        manualTOE: initialTOE,
        manualJakaja: initialJakaja,
        includeInToe: true,
        includeInWage: true,
        originalPeriod: period,
      });
    }
    
    // Sort by date (newest first)
    return periodRows.sort((a, b) => b.periodDate.getTime() - a.periodDate.getTime());
  }, [periods, reviewPeriodStartDate, reviewPeriodEndDate]);

  // State for manual period values
  const [manualPeriodRows, setManualPeriodRows] = useState<ManualPeriodRow[]>(initialPeriodRows);

  // Update manualPeriodRows when initialPeriodRows changes
  useEffect(() => {
    setManualPeriodRows(initialPeriodRows);
  }, [initialPeriodRows]);

  // Check if there's normal work
  const hasNormalWork = useMemo(() => {
    return manualPeriodRows.some(row => row.normalWorkWage > 0);
  }, [manualPeriodRows]);

  // Calculate which periods are included based on rule
  const periodInclusion = useMemo(() => {
    const inclusion = new Map<string, {
      isIncluded: boolean;
      monthNumber?: number; // For LOCK_10_MONTHS_THEN_75: which month from start
      reason: string;
    }>();

    if (subsidyRule === "NO_TOE_EXTENDS") {
      // No periods included in TOE
      manualPeriodRows.forEach(row => {
        inclusion.set(row.periodId, {
          isIncluded: false,
          reason: "Ei TOE-kertymää (vain pidentää viitejaksoa)"
        });
      });
    } else if (subsidyRule === "PERCENT_75") {
      // All periods from employment start date onwards are included at 75%
      manualPeriodRows.forEach(row => {
        if (!employmentStartDateParsed) {
          inclusion.set(row.periodId, {
            isIncluded: false,
            reason: "Alkamispäivä puuttuu"
          });
          return;
        }
        const isAfterStart = row.periodDate >= employmentStartDateParsed;
        inclusion.set(row.periodId, {
          isIncluded: isAfterStart && row.originalSubsidizedWage > 0,
          reason: isAfterStart 
            ? "Mukana (75% TOE)" 
            : "Ennen alkamispäivää"
        });
      });
    } else if (subsidyRule === "LOCK_10_MONTHS_THEN_75") {
      // First 10 months: 0% TOE, after that: 75% TOE
      if (!employmentStartDateParsed) {
        manualPeriodRows.forEach(row => {
          inclusion.set(row.periodId, {
            isIncluded: false,
            reason: "Alkamispäivä puuttuu"
          });
        });
      } else {
        // Sort periods by date (oldest first)
        const sortedRows = [...manualPeriodRows]
          .filter(row => row.originalSubsidizedWage > 0)
          .sort((a, b) => a.periodDate.getTime() - b.periodDate.getTime());
        
        let monthCounter = 0;
        const monthNumbers = new Map<string, number>();
        
        sortedRows.forEach(row => {
          if (row.periodDate >= employmentStartDateParsed) {
            monthCounter++;
            monthNumbers.set(row.periodId, monthCounter);
          }
        });
        
        manualPeriodRows.forEach(row => {
          const monthNumber = monthNumbers.get(row.periodId);
          if (monthNumber === undefined) {
            inclusion.set(row.periodId, {
              isIncluded: false,
              reason: row.originalSubsidizedWage > 0 
                ? "Ennen alkamispäivää" 
                : "Ei palkkatukityötä"
            });
          } else if (monthNumber <= 10) {
            inclusion.set(row.periodId, {
              isIncluded: false,
              monthNumber,
              reason: `${monthNumber}. kuukausi - ei TOE:ta (0%)`
            });
          } else {
            inclusion.set(row.periodId, {
              isIncluded: true,
              monthNumber,
              reason: `${monthNumber}. kuukausi - mukana (75% TOE)`
            });
          }
        });
      }
    } else {
      // NONE: all periods included normally
      manualPeriodRows.forEach(row => {
        inclusion.set(row.periodId, {
          isIncluded: row.originalSubsidizedWage > 0,
          reason: row.originalSubsidizedWage > 0 ? "Mukana" : "Ei palkkatukityötä"
        });
      });
    }

    return inclusion;
  }, [subsidyRule, employmentStartDateParsed, manualPeriodRows]);

  // Calculate totals from manual inputs (only for periods that are included)
  const manualTotals = useMemo(() => {
    const includedRows = manualPeriodRows.filter(row => row.includeInToe || row.includeInWage);
    
    const totalSubsidizedWage = includedRows
      .filter(row => row.includeInWage)
      .reduce((sum, row) => sum + row.manualSubsidizedWage, 0);
    
    // Calculate totalJakaja only from rows that are included in TOE and have jakaja > 0
    // Use all manualPeriodRows, not just includedRows, to ensure we count correctly
    // Also check that there's work (normal or subsidized) - same logic as display
    const totalJakaja = manualPeriodRows
      .filter(row => {
        const hasWork = row.normalWorkWage > 0 || row.manualSubsidizedWage > 0;
        const effectiveJakaja = hasWork ? row.manualJakaja : 0;
        return row.includeInToe && effectiveJakaja > 0;
      })
      .reduce((sum, row) => {
        const hasWork = row.normalWorkWage > 0 || row.manualSubsidizedWage > 0;
        const effectiveJakaja = hasWork ? row.manualJakaja : 0;
        return sum + effectiveJakaja;
      }, 0);
    
    const totalNormalWage = includedRows
      .filter(row => row.includeInWage)
      .reduce((sum, row) => sum + row.normalWorkWage, 0);
    
    // Calculate normal work TOE from periods (always calculated from normal work wage)
    const totalNormalWorkTOE = includedRows
      .filter(row => row.includeInToe && row.normalWorkWage > 0)
      .reduce((sum, row) => {
        const normalTOE = calculateTOEValueFromSalary(row.normalWorkWage);
        return sum + normalTOE;
      }, 0);
    
    // Calculate subsidized TOE (only from manual TOE values)
    const totalSubsidizedTOE = includedRows
      .filter(row => row.includeInToe && row.manualSubsidizedWage > 0)
      .reduce((sum, row) => sum + row.manualTOE, 0);
    
    // Total TOE = normal work TOE + subsidized TOE (manual)
    const totalTOE = totalNormalWorkTOE + totalSubsidizedTOE;
    
    // Calculate original subsidized TOE (from original wage)
    const totalOriginalSubsidizedTOE = manualPeriodRows
      .filter(row => row.originalSubsidizedWage > 0)
      .reduce((sum, row) => {
        const originalTOE = calculateTOEValueFromSalary(row.originalSubsidizedWage);
        return sum + originalTOE;
      }, 0);
    
    return {
      totalSubsidizedWage,
      totalTOE,
      totalJakaja,
      totalNormalWage,
      totalAcceptedWage: totalNormalWage + totalSubsidizedWage,
      totalNormalWorkTOE,
      totalSubsidizedTOE,
      totalOriginalSubsidizedTOE,
    };
  }, [manualPeriodRows]);

  // Handlers for manual edits
  const handleSubsidizedWageChange = (periodId: string, value: number) => {
    setManualPeriodRows(prev => prev.map(row => {
      if (row.periodId === periodId) {
        const newSubsidizedWage = Math.max(0, value);
        const hasWork = row.normalWorkWage > 0 || newSubsidizedWage > 0;
        // Auto-set jakaja to 0 if there's no work
        const newJakaja = hasWork ? row.manualJakaja : 0;
        return { ...row, manualSubsidizedWage: newSubsidizedWage, manualJakaja: newJakaja };
      }
      return row;
    }));
  };

  const handleTOEChange = (periodId: string, value: number) => {
    setManualPeriodRows(prev => prev.map(row => 
      row.periodId === periodId 
        ? { ...row, manualTOE: Math.max(0, value) }
        : row
    ));
  };

  const handleJakajaChange = (periodId: string, value: number) => {
    setManualPeriodRows(prev => prev.map(row => {
      if (row.periodId === periodId) {
        const hasWork = row.normalWorkWage > 0 || row.manualSubsidizedWage > 0;
        // Only allow jakaja > 0 if there's work
        const newJakaja = hasWork ? Math.max(0, value) : 0;
        return { ...row, manualJakaja: newJakaja };
      }
      return row;
    }));
  };

  const handleToggleIncludeInToe = (periodId: string) => {
    setManualPeriodRows(prev => prev.map(row => 
      row.periodId === periodId 
        ? { ...row, includeInToe: !row.includeInToe }
        : row
    ));
  };

  const handleToggleIncludeInWage = (periodId: string) => {
    setManualPeriodRows(prev => prev.map(row => 
      row.periodId === periodId 
        ? { ...row, includeInWage: !row.includeInWage }
        : row
    ));
  };

  // Apply correction
  const handleApply = () => {
    // Calculate correction values
    const correctedTOETotal = manualTotals.totalTOE;
    const toeCorrection = correctedTOETotal - toeSystemTotal;
    
    // Calculate wage base from manual values
    const wageBaseTotal = manualTotals.totalAcceptedWage;
    const wageCorrection = wageBaseTotal - systemTotalSalary;
    
    // Calculate average salary
    const averageSalaryCorrected = periodCount > 0 ? wageBaseTotal / periodCount : 0;
    const systemAverageSalary = periodCount > 0 ? systemTotalSalary / periodCount : 0;
    const averageSalaryCorrection = averageSalaryCorrected - systemAverageSalary;
    
    // Build period-corrected TOE array for ALL periods
    // This includes both normal work TOE (calculated by system) and subsidized work TOE (manual)
    const periodCorrectedTOE = manualPeriodRows.map(row => {
      // Calculate normal work TOE using system logic
      const normalWorkTOE = row.normalWorkWage > 0 
        ? calculateTOEValueFromSalary(row.normalWorkWage) 
        : 0;
      
      // Get subsidized work TOE (manual value)
      const subsidizedWorkTOE = row.manualSubsidizedWage > 0 
        ? row.manualTOE 
        : 0;
      
      // Total corrected TOE for this period (max 1.0 per period)
      const correctedTOE = Math.min(normalWorkTOE + subsidizedWorkTOE, 1.0);
      
      // Determine corrected jakaja
      // If period is not included in TOE, jakaja should be 0
      // Otherwise use manualJakaja (or 0 if TOE is 0)
      let correctedJakaja = 0;
      if (row.includeInToe && correctedTOE > 0) {
        // Check if there's work (normal or subsidized)
        const hasWork = row.normalWorkWage > 0 || row.manualSubsidizedWage > 0;
        correctedJakaja = hasWork ? row.manualJakaja : 0;
      }
      
      return {
        periodId: row.periodId,
        correctedTOE,
        correctedJakaja,
      };
    });
    
    // Build manual period values array
    const manualPeriodValues = manualPeriodRows.map(row => ({
      periodId: row.periodId,
      manualSubsidizedWage: row.manualSubsidizedWage,
      manualTOE: row.manualTOE,
      manualJakaja: row.manualJakaja,
      includeInToe: row.includeInToe,
      includeInWage: row.includeInWage,
    }));
    
    // Calculate total divisor days (sum of manualJakaja for included periods, excluding 0 values)
    const totalDivisorDays = manualPeriodRows
      .filter(row => row.includeInToe && row.manualJakaja > 0)
      .reduce((sum, row) => sum + row.manualJakaja, 0);
    
    const correction: SubsidyCorrection = {
      subsidizedMonthsCounted: manualPeriodRows.filter(row => row.includeInToe && row.manualSubsidizedWage > 0).length,
      subsidizedGrossTotal: manualTotals.totalSubsidizedWage,
      correctToeFromSubsidy: correctedTOETotal,
      toeCorrection,
      toeCorrectedTotal: correctedTOETotal,
      acceptedForWage: manualTotals.totalSubsidizedWage,
      totalSalaryCorrected: wageBaseTotal,
      totalSalaryCorrection: wageCorrection,
      averageSalaryCorrected,
      averageSalaryCorrection,
      rule: subsidyRule, // Use selected subsidy rule
      correctionMode: "manual",
      manualPeriodValues,
      periodCorrectedTOE: periodCorrectedTOE.length > 0 ? periodCorrectedTOE : undefined,
      totalDivisorDays,
    };
    
    onApplyCorrection(correction);
    onOpenChange(false);
  };

  if (rows.length === 0 || manualPeriodRows.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Palkkatuetun työn korjaus (Manuaalinen)</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Palkkatuetun työn periodit</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Tarkastelujakso - editable */}
              <div className="mb-4 p-3 bg-gray-50 rounded border">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <Label className="text-xs text-gray-600 font-medium mb-1 block">
                      Tarkastelujakso
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        placeholder="PP.KK.VVVV"
                        value={localReviewPeriodStart}
                        onChange={(e) => handleReviewPeriodStartChange(e.target.value)}
                        onBlur={handleReviewPeriodStartBlur}
                        className="w-32 text-sm bg-white"
                        pattern="\d{1,2}\.\d{1,2}\.\d{4}"
                        title="Syötä päivämäärä muodossa PP.KK.VVVV"
                      />
                      <span className="text-gray-500">-</span>
                      <Input
                        type="text"
                        placeholder="PP.KK.VVVV"
                        value={localReviewPeriodEnd}
                        onChange={(e) => handleReviewPeriodEndChange(e.target.value)}
                        onBlur={handleReviewPeriodEndBlur}
                        className="w-32 text-sm bg-white"
                        pattern="\d{1,2}\.\d{1,2}\.\d{4}"
                        title="Syötä päivämäärä muodossa PP.KK.VVVV"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Palkkatuen sääntö */}
              <div className="mb-4 p-3 bg-gray-50 rounded border">
                <Label className="text-sm font-medium mb-3 block">Palkkatuen sääntö</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="font-medium">Palkkatuki</div>
                      <div className="text-xs text-gray-600 mt-1">Ei TOE-kertymää, vain pidentää viitejaksoa</div>
                    </div>
                    <Switch
                      checked={subsidyRule === "NO_TOE_EXTENDS"}
                      onCheckedChange={(checked) => {
                        if (checked) setSubsidyRule("NO_TOE_EXTENDS");
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="font-medium">Palkkatuettu työ alkanut ennen 2.9.2024</div>
                      <div className="text-xs text-gray-600 mt-1">75% kaikista kuukausista</div>
                    </div>
                    <Switch
                      checked={subsidyRule === "PERCENT_75"}
                      onCheckedChange={(checked) => {
                        if (checked) setSubsidyRule("PERCENT_75");
                      }}
                    />
                  </div>
                  <div className="p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium">Poikkeusperuste</div>
                        <div className="text-xs text-gray-600 mt-1">10 kk ei TOE, sen jälkeen 75%</div>
                      </div>
                      <Switch
                        checked={subsidyRule === "LOCK_10_MONTHS_THEN_75"}
                        onCheckedChange={(checked) => {
                          if (checked) setSubsidyRule("LOCK_10_MONTHS_THEN_75");
                        }}
                      />
                    </div>
                    {(subsidyRule === "LOCK_10_MONTHS_THEN_75" || subsidyRule === "PERCENT_75") && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        <Label htmlFor="employment-start-date" className="text-sm">
                          Palkkatuetun työsuhteen alkamispäivä
                        </Label>
                        <Input
                          id="employment-start-date"
                          type="text"
                          placeholder="PP.KK.VVVV"
                          value={employmentStartDate}
                          onChange={(e) => setEmploymentStartDate(e.target.value)}
                          className="w-40 bg-white"
                          pattern="\d{1,2}\.\d{1,2}\.\d{4}"
                          title="Syötä päivämäärä muodossa PP.KK.VVVV (esim. 01.01.2025)"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* TOE calculation summary - siirretty tarkastelujakson ja taulukon väliin */}
              <div className="mb-4 space-y-3">
                {/* System TOE vs Corrected TOE comparison - grid layout */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Corrected TOE yhteensä */}
                  <div className="p-3 bg-blue-50 rounded border border-blue-200">
                    <div className="text-xs text-blue-700 mb-1 font-medium">Korjattu TOE:</div>
                    <div className="text-2xl font-semibold text-blue-900">
                      {manualTotals.totalTOE.toFixed(1)} kk
                    </div>
                    <div className="text-xs text-blue-700 mt-1">
                      Normaalityö: {manualTotals.totalNormalWorkTOE.toFixed(1)} kk + 
                      Palkkatuettu (muunto): {manualTotals.totalSubsidizedTOE.toFixed(1)} kk
                    </div>
                  </div>
                  
                  {/* System TOE yhteensä */}
                  <div className="p-3 bg-gray-50 rounded border">
                    <div className="text-xs text-gray-500 mb-1">Järjestelmän TOE (ennen korjausta):</div>
                    <div className="text-2xl font-semibold text-gray-600">
                      {(manualTotals.totalNormalWorkTOE + manualTotals.totalOriginalSubsidizedTOE).toFixed(1)} kk
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Normaalityö: {manualTotals.totalNormalWorkTOE.toFixed(1)} kk + 
                      Palkkatuettu (järjestelmä): {manualTotals.totalOriginalSubsidizedTOE.toFixed(1)} kk
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 bg-white">
                  <thead className="bg-[#003479] text-white">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium">Maksupäivä</th>
                      {hasNormalWork && (
                        <th className="px-3 py-2 text-left text-xs font-medium">Muu työ</th>
                      )}
                      <th className="px-3 py-2 text-left text-xs font-medium">Palkkatukityö</th>
                      <th className="px-3 py-2 text-left text-xs font-medium">Palkkatukityö alkuperäinen</th>
                      <th className="px-3 py-2 text-left text-xs font-medium">PT TOE</th>
                      <th className="px-3 py-2 text-left text-xs font-medium">Jakaja</th>
                      <th className="px-3 py-2 text-left text-xs font-medium">Toiminnot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manualPeriodRows.map((row) => {
                      const inclusion = periodInclusion.get(row.periodId);
                      const isIncluded = inclusion?.isIncluded ?? false;
                      const monthNumber = inclusion?.monthNumber;
                      const reason = inclusion?.reason ?? "";
                      
                      return (
                      <tr 
                        key={row.periodId} 
                        className={`border-b hover:bg-gray-50 ${
                          !isIncluded && row.originalSubsidizedWage > 0 
                            ? 'border-l-4 border-l-gray-400' 
                            : isIncluded && row.originalSubsidizedWage > 0
                              ? 'border-l-4 border-l-blue-500' 
                              : ''
                        }`}
                      >
                        <td className="px-3 py-2 text-xs">{row.maksupaiva}</td>
                        {hasNormalWork && (
                          <td className="px-3 py-2 text-xs">
                            {row.normalWorkWage > 0 ? (
                              <>
                                {formatCurrency(row.normalWorkWage)} ({calculateTOEValueFromSalary(row.normalWorkWage).toFixed(1)} kk)
                              </>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        )}
                        <td className="px-3 py-2 text-xs">
                          <Input
                            type="number"
                            value={row.manualSubsidizedWage.toFixed(2)}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              handleSubsidizedWageChange(row.periodId, value);
                            }}
                            className="w-32"
                            step="0.01"
                            min="0"
                          />
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">
                          {row.originalSubsidizedWage > 0 ? (
                            <div>
                              {formatCurrency(row.originalSubsidizedWage)}
                              {subsidyRule === "LOCK_10_MONTHS_THEN_75" && (() => {
                                const inclusion = periodInclusion.get(row.periodId);
                                const monthNumber = inclusion?.monthNumber;
                                return monthNumber ? (
                                  <span className="ml-2 text-gray-600">({monthNumber}. kk)</span>
                                ) : null;
                              })()}
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          <Select
                            value={row.manualTOE.toString()}
                            onValueChange={(value) => {
                              const numValue = parseFloat(value) || 0;
                              handleTOEChange(row.periodId, numValue);
                            }}
                          >
                            <SelectTrigger className="w-20 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">0</SelectItem>
                              <SelectItem value="0.5">0.5</SelectItem>
                              <SelectItem value="1">1</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2 text-xs">
                          <Input
                            type="number"
                            value={(() => {
                              // Auto-set jakaja to 0 if there's no work
                              const hasWork = row.normalWorkWage > 0 || row.manualSubsidizedWage > 0;
                              const displayJakaja = hasWork ? row.manualJakaja : 0;
                              return displayJakaja.toFixed(1);
                            })()}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              handleJakajaChange(row.periodId, value);
                            }}
                            className="w-20"
                            step="0.1"
                            min="0"
                            disabled={row.normalWorkWage === 0 && row.manualSubsidizedWage === 0}
                          />
                        </td>
                        <td className="px-3 py-2 text-xs">
                          <div className="flex flex-col gap-1">
                            <Label className="text-xs flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={row.includeInToe}
                                onChange={() => handleToggleIncludeInToe(row.periodId)}
                                className="w-4 h-4"
                              />
                              TOE
                            </Label>
                            <Label className="text-xs flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={row.includeInWage}
                                onChange={() => handleToggleIncludeInWage(row.periodId)}
                                className="w-4 h-4"
                              />
                              Palkka
                            </Label>
                          </div>
                        </td>
                      </tr>
                    );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-100 font-medium">
                    <tr>
                      <td className="px-3 py-2 text-xs">Yhteensä</td>
                      {hasNormalWork && (
                        <td className="px-3 py-2 text-xs">
                          {formatCurrency(manualTotals.totalNormalWage)}
                        </td>
                      )}
                      <td className="px-3 py-2 text-xs">
                        {formatCurrency(manualTotals.totalSubsidizedWage)}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-500">—</td>
                      <td className="px-3 py-2 text-xs">
                        {manualTotals.totalTOE.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {manualTotals.totalJakaja.toFixed(1)}
                      </td>
                      <td className="px-3 py-2 text-xs">—</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Wage base calculation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Palkanmäärittelyn korjaus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Hyväksyttävät palkat ja Perustepalkka/kk - grid layout */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Hyväksyttävät palkat yhteensä */}
                <div className="p-3 bg-green-50 rounded border border-green-200">
                  <div className="text-xs text-green-700 mb-1 font-medium">Hyväksyttävät palkat yhteensä:</div>
                  <div className="text-2xl font-semibold text-green-900">
                    {formatCurrency(manualTotals.totalAcceptedWage)}
                  </div>
                  <div className="text-xs text-green-700 mt-1">
                    Jakaja: {manualTotals.totalJakaja.toFixed(1)} päivää
                  </div>
                </div>
                
                {/* Perustepalkka/kk (korjattu) */}
                <div className="p-3 bg-purple-50 rounded border border-purple-200">
                  <div className="text-xs text-purple-700 mb-1 font-medium">Perustepalkka/kk (korjattu):</div>
                  <div className="text-2xl font-semibold text-purple-900">
                    {formatCurrency(periodCount > 0 ? manualTotals.totalAcceptedWage / periodCount : 0)}
                  </div>
                  <div className="text-xs text-purple-700 mt-1">
                    Päiväpalkka: {formatCurrency(manualTotals.totalJakaja > 0 ? manualTotals.totalAcceptedWage / manualTotals.totalJakaja : 0)} / päivä
                  </div>
                </div>
              </div>
              
              {/* Päiväpalkka-laskenta */}
              {manualTotals.totalJakaja > 0 && (
                <div className="pt-3 border-t mb-4">
                  <div className="text-xs text-gray-600 mb-1">Päiväpalkka-laskenta:</div>
                  <div className="text-sm text-gray-700 font-mono bg-gray-50 p-2 rounded">
                    Päiväpalkka = Hyväksyttävät palkat yhteensä / Jakajan päivät yhteensä
                    <br />
                    Päiväpalkka = {formatCurrency(manualTotals.totalAcceptedWage)} / {manualTotals.totalJakaja.toFixed(1)} päivää
                    <br />
                    <span className="font-semibold text-gray-900">
                      Päiväpalkka = {formatCurrency(manualTotals.totalJakaja > 0 ? manualTotals.totalAcceptedWage / manualTotals.totalJakaja : 0)} / päivä
                    </span>
                  </div>
                </div>
              )}
              
              {/* Korjattu palkka ja Järjestelmän palkka */}
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Korjattu palkka:</span>
                  <span className="font-semibold text-gray-900 ml-2">
                    {formatCurrency(manualTotals.totalAcceptedWage)}
                  </span>
                  <span className="text-gray-500 text-xs ml-2">
                    (Muu työ: {formatCurrency(manualTotals.totalNormalWage)} + Palkkatuettu (muunto): {formatCurrency(manualTotals.totalSubsidizedWage)})
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Järjestelmän palkka (ennen korjausta):</span>
                  <span className="font-semibold text-gray-900 ml-2">
                    {formatCurrency(systemTotalSalary)}
                  </span>
                  <span className="text-gray-500 text-xs ml-2">
                    (Muu työ: {formatCurrency(manualTotals.totalNormalWage)} + Palkkatuettu (järjestelmä): {formatCurrency(manualPeriodRows.reduce((sum, row) => sum + row.originalSubsidizedWage, 0))})
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Peruuta
            </Button>
            <Button onClick={handleApply}>
              Sovella korjaus
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

