"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { IncomeRow, SubsidyRule, SubsidyCorrection, MonthPeriod } from "../types";
import { calculateSubsidyCorrection } from "../utils/subsidyCalculations";
import { formatCurrency, parseFinnishDate, formatDateFI } from "../utils";
import {
  groupPeriodsIntoSegments,
  convertToeForSegments,
  selectToePeriod,
  distributeCorrectedTOEToPeriods,
  calcWageBaseFromSegments,
  type ToeConversionResult,
  type WageBaseResult,
} from "../utils/palkkatuettuProcess";

// SUBSIDIZED_EMPLOYERS set (should match the one in Allocateincome.tsx)
const SUBSIDIZED_EMPLOYERS = new Set(["Nokia Oyj"]);

// Rule date: 2.9.2024 (September 2, 2024)
// Employment starting before this date: automatic PERCENT_75 rule
// Employment starting on or after this date: user selects rule
const RULE_DATE_AFTER = new Date(2024, 8, 2); // month is 0-based, so 8 = September

interface SubsidizedWorkDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: IncomeRow[];
  periods: MonthPeriod[]; // Added: periods for period-based UI
  toeSystemTotal: number;
  systemTotalSalary: number;
  periodCount: number;
  totalExtendingDays: number;
  reviewPeriodStart: string | null; // Added: review period start
  reviewPeriodEnd: string; // Added: review period end
  calculateTOEValue: (period: MonthPeriod) => number; // Added: function to calculate TOE value
  calculateEffectiveIncomeTotal: (period: MonthPeriod) => number; // Added: function to calculate effective income
  onApplyCorrection: (correction: SubsidyCorrection) => void;
  onExtendPeriod: (additionalDays: number, correction: SubsidyCorrection) => void;
  estimateTOEWithExtending: (additionalDays: number, correction: SubsidyCorrection) => number;
  onExtendReviewPeriodTo28Months: () => void;
}

export default function SubsidizedWorkDrawer({
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
  onExtendReviewPeriodTo28Months,
}: SubsidizedWorkDrawerProps) {
  const [subsidyRule, setSubsidyRule] = useState<SubsidyRule>("PERCENT_75");
  const [useToeCorrection, setUseToeCorrection] = useState(true);
  const [useWageCorrection, setUseWageCorrection] = useState(true);
  const [employmentStartDate, setEmploymentStartDate] = useState<string>("");
  
  // State for manual period adjustments
  const [manualAdjustments, setManualAdjustments] = useState<Map<string, {
    includeInToe?: boolean;
    includeInWage?: boolean;
    divisorDays?: number;
    subsidyType?: SubsidyRule;
    isZeroedOut?: boolean;
  }>>(new Map());

  // Parse review period dates
  const reviewPeriodStartDate = useMemo(() => {
    if (!reviewPeriodStart) return null;
    return parseFinnishDate(reviewPeriodStart);
  }, [reviewPeriodStart]);

  const reviewPeriodEndDate = useMemo(() => {
    if (!reviewPeriodEnd) return new Date();
    return parseFinnishDate(reviewPeriodEnd) || new Date();
  }, [reviewPeriodEnd]);

  // Determine if exception subsidy (poikkeusperuste)
  // PERCENT_75 and LOCK_10_MONTHS_THEN_75 are exception subsidies
  const exceptionSubsidy = useMemo(() => {
    return subsidyRule === "PERCENT_75" || subsidyRule === "LOCK_10_MONTHS_THEN_75";
  }, [subsidyRule]);

  // Group periods into segments
  const segments = useMemo(() => {
    if (!reviewPeriodEndDate) return [];
    return groupPeriodsIntoSegments(
      periods,
      calculateTOEValue,
      calculateEffectiveIncomeTotal,
      SUBSIDIZED_EMPLOYERS,
      reviewPeriodStartDate,
      reviewPeriodEndDate
    );
  }, [periods, calculateTOEValue, calculateEffectiveIncomeTotal, reviewPeriodStartDate, reviewPeriodEndDate]);

  // Parse employment start date (must be defined before toePeriodSelection)
  // Store original parsed date for comparison with RULE_DATE_AFTER
  const employmentStartDateOriginal = useMemo(() => {
    if (!employmentStartDate || employmentStartDate.trim() === "") return null;
    return parseFinnishDate(employmentStartDate);
  }, [employmentStartDate]);

  // Parse employment start date and set to first day of month for calculations
  const employmentStartDateParsed = useMemo(() => {
    if (!employmentStartDateOriginal) return null;
    // Set to first day of month for use in calculations
    return new Date(employmentStartDateOriginal.getFullYear(), employmentStartDateOriginal.getMonth(), 1);
  }, [employmentStartDateOriginal]);

  // Auto-select subsidy rule based on employment start date
  useEffect(() => {
    if (!employmentStartDateOriginal) {
      // If no employment start date is entered, don't auto-select
      return;
    }
    
    // If employment start date is before 2.9.2024, automatically select PERCENT_75
    // Use original date for comparison, not the first day of month
    if (employmentStartDateOriginal < RULE_DATE_AFTER) {
      setSubsidyRule("PERCENT_75");
    }
    // If employment start date is on or after 2.9.2024, user can select the rule
    // (no automatic selection)
  }, [employmentStartDateOriginal]);

  // Select TOE period (up to 28 months)
  const toePeriodSelection = useMemo(() => {
    if (segments.length === 0) return null;
    return selectToePeriod(
      segments, 
      exceptionSubsidy, 
      28, 
      subsidyRule,
      periods,
      SUBSIDIZED_EMPLOYERS,
      employmentStartDateParsed
    );
  }, [segments, exceptionSubsidy, subsidyRule, periods, employmentStartDateParsed]);

  // Check if employment start date is required and valid for LOCK_10_MONTHS_THEN_75
  const isEmploymentStartDateRequired = subsidyRule === "LOCK_10_MONTHS_THEN_75";
  // For table display: require employment start date for both PERCENT_75 and LOCK_10_MONTHS_THEN_75
  const hasValidEmploymentStartDate = (subsidyRule === "PERCENT_75" || subsidyRule === "LOCK_10_MONTHS_THEN_75")
    ? employmentStartDateParsed !== null 
    : true; // Not required for other rules

  // Determine TOE requirement based on employment start date
  // Old law (before 2.9.2024): 6 months TOE required
  // New law (on or after 2.9.2024): 12 months TOE required
  const requiredTOEMonths = useMemo(() => {
    // If employment start date is provided and it's before 2.9.2024, use old law (6kk)
    // Use original date for comparison, not the first day of month
    if (employmentStartDateOriginal && employmentStartDateOriginal < RULE_DATE_AFTER) {
      return 6;
    }
    // Otherwise, use new law (12kk)
    return 12;
  }, [employmentStartDateOriginal]);

  // Convert TOE for selected segments
  // Don't calculate if LOCK_10_MONTHS_THEN_75 is selected but employment start date is missing
  const toeConversion = useMemo(() => {
    if (!toePeriodSelection) return null;
    if (isEmploymentStartDateRequired && !hasValidEmploymentStartDate) return null;
    return convertToeForSegments(
      toePeriodSelection.segmentsUsed, 
      exceptionSubsidy, 
      subsidyRule,
      periods,
      SUBSIDIZED_EMPLOYERS,
      employmentStartDateParsed
    );
  }, [toePeriodSelection, exceptionSubsidy, subsidyRule, periods, employmentStartDateParsed, isEmploymentStartDateRequired, hasValidEmploymentStartDate]);

  // Distribute corrected TOE to periods
  // Don't calculate if LOCK_10_MONTHS_THEN_75 is selected but employment start date is missing
  const periodRowsBase = useMemo(() => {
    if (!toeConversion || !toePeriodSelection) return [];
    if (isEmploymentStartDateRequired && !hasValidEmploymentStartDate) return [];
    return distributeCorrectedTOEToPeriods(
      toeConversion,
      periods,
      calculateTOEValue,
      SUBSIDIZED_EMPLOYERS,
      toePeriodSelection.segmentsUsed, // Pass segmentsUsed to include all periods
      subsidyRule, // Pass rule for LOCK_10_MONTHS_THEN_75 distribution logic
      employmentStartDateParsed // Pass employment start date for PERCENT_75 filtering
    );
  }, [toeConversion, toePeriodSelection, periods, calculateTOEValue, isEmploymentStartDateRequired, hasValidEmploymentStartDate, subsidyRule, employmentStartDateParsed]);

  // Calculate subsidized month numbers from employment start (for LOCK_10_MONTHS_THEN_75)
  const subsidizedMonthNumbers = useMemo(() => {
    if (subsidyRule !== "LOCK_10_MONTHS_THEN_75" || !employmentStartDateParsed) {
      return new Map<string, number>();
    }
    
    const monthNumbers = new Map<string, number>();
    let monthCounter = 0;
    
    // Helper function to parse period date
    const parsePeriodDate = (ajanjakso: string): Date | null => {
      // Parse "2024 Joulukuu" format
      const parts = ajanjakso.trim().split(/\s+/);
      if (parts.length < 2) return null;
      
      const year = parseInt(parts[0]);
      if (isNaN(year)) return null;
      
      const monthNames: { [key: string]: number } = {
        "Tammikuu": 0, "Helmikuu": 1, "Maaliskuu": 2, "Huhtikuu": 3,
        "Toukokuu": 4, "Kesäkuu": 5, "Heinäkuu": 6, "Elokuu": 7,
        "Syyskuu": 8, "Lokakuu": 9, "Marraskuu": 10, "Joulukuu": 11
      };
      
      const monthName = parts.slice(1).join(" ");
      const month = monthNames[monthName];
      if (month === undefined) return null;
      
      return new Date(year, month, 1);
    };
    
    // Sort periods by date (oldest first)
    const sortedPeriods = [...periods].sort((a, b) => {
      const dateA = parsePeriodDate(a.ajanjakso);
      const dateB = parsePeriodDate(b.ajanjakso);
      if (!dateA || !dateB) return 0;
      return dateA.getTime() - dateB.getTime();
    });
    
    // Count subsidized months from employment start
    for (const period of sortedPeriods) {
      const periodDate = parsePeriodDate(period.ajanjakso);
      if (!periodDate || periodDate < employmentStartDateParsed) continue;
      
      // Check if period has subsidized work
      const hasSubsidizedWork = period.rows.some(row => {
        if (row.isSubsidized !== undefined) {
          return row.isSubsidized;
        }
        return SUBSIDIZED_EMPLOYERS.has(row.tyonantaja);
      });
      
      if (hasSubsidizedWork) {
        monthCounter++;
        monthNumbers.set(period.id, monthCounter);
      }
    }
    
    return monthNumbers;
  }, [subsidyRule, employmentStartDateParsed, periods]);

  // Apply manual adjustments to period rows
  const periodRows = useMemo(() => {
    return periodRowsBase.map(row => {
      const adjustment = manualAdjustments.get(row.periodId);
      if (!adjustment) return row;
      
      // Apply manual adjustments
      const adjustedRow: typeof row = {
        ...row,
        manualIncludeInToe: adjustment.includeInToe,
        manualIncludeInWage: adjustment.includeInWage,
        manualDivisorDays: adjustment.divisorDays,
        manualSubsidyType: adjustment.subsidyType,
        isZeroedOut: adjustment.isZeroedOut,
      };
      
      // If zeroed out, set TOE to 0 and divisorDays to 0
      if (adjustment.isZeroedOut) {
        adjustedRow.correctedTOE = 0;
        adjustedRow.correctedSubsidizedTOE = 0;
        adjustedRow.normalWorkTOE = 0;
        adjustedRow.jakaja = 0;
        adjustedRow.manualIncludeInToe = false;
        adjustedRow.manualIncludeInWage = false;
      } else {
        // Apply manual divisorDays if set
        if (adjustment.divisorDays !== undefined) {
          adjustedRow.jakaja = adjustment.divisorDays;
        }
      }
      
      return adjustedRow;
    });
  }, [periodRowsBase, manualAdjustments]);

  // Calculate corrected TOE total considering manual adjustments
  const correctedTOETotal = useMemo(() => {
    // IMPORTANT: For each calendar month (period):
    // 1. Compute normalToeMonth (from "Muu työ")
    // 2. Compute subToeMonth (from "Palkkatukityö" after applying 0/75% rule)
    // 3. Compute monthToe = min(normalToeMonth + subToeMonth, 1.0)
    // 4. Sum monthToe over all included months: toeCorrected = Σ monthToe
    //
    // This guarantees that the TOE for any calendar period can never exceed
    // the number of calendar months in that period, matching the PPT example
    // where 4 overlapping months yield max 4 TOE months even if the raw sum
    // (normal + converted subsidy) would be higher.
    
    // For LOCK_10_MONTHS_THEN_75, we need special handling:
    // - First 10 months: subToeMonth = 0
    // - After 10 months: subToeMonth = subsidizedSystemTOE * 0.75
    if (subsidyRule === "LOCK_10_MONTHS_THEN_75" && toeConversion?.totalSubsidizedTOEAfter10Months !== undefined) {
      let totalTOE = 0;
      
      periodRows.forEach(row => {
        const adjustment = manualAdjustments.get(row.periodId);
        if (adjustment?.isZeroedOut || adjustment?.includeInToe === false) return;
        
        // Step 1: Compute normalToeMonth (from "Muu työ")
        const normalToeMonth = row.normalWorkTOE || 0;
        
        // Step 2: Compute subToeMonth (from "Palkkatukityö" after applying 0/75% rule)
        // For LOCK_10_MONTHS_THEN_75:
        // - If period is after 10 months: subToeMonth = subsidizedSystemTOE * 0.75
        // - If period is within first 10 months: subToeMonth = 0
        let subToeMonth = 0;
        // KORJAUS: subsidizedPosition on 1-based, joten 10. kuukausi = 10, 11. kuukausi = 11
        // Ensimmäiset 10 kuukautta (1-10) eivät kerry TOE:ta, joten tarkistus pitää olla > 10
        if (row.subsidizedPosition !== undefined && row.subsidizedPosition > 10) {
          // Period is after 10 months, apply 0.75 conversion
          // row.correctedSubsidizedTOE shows system TOE for periods after 10
          const subsidizedSystemTOE = row.correctedSubsidizedTOE || 0;
          subToeMonth = subsidizedSystemTOE * 0.75;
        }
        // If period is within first 10 months, subToeMonth remains 0
        
        // Step 3: Compute monthToe = min(normalToeMonth + subToeMonth, 1.0)
        const monthToe = Math.min(normalToeMonth + subToeMonth, 1.0);
        
        // Step 4: Sum monthToe (will be rounded down at the end)
        totalTOE += monthToe;
      });
      
      // Round down the final total
      return Math.floor(totalTOE);
    }
    
    // For other rules (PERCENT_75, NO_TOE_EXTENDS, NONE):
    // Calculate from period rows where correctedTOE is already computed correctly
    // row.correctedTOE is already computed as:
    // monthToe = min(normalToeMonth + subToeMonth, 1.0)
    // where subToeMonth has been converted according to the rule
    return periodRows.reduce((sum, row) => {
      const adjustment = manualAdjustments.get(row.periodId);
      const includeInToe = adjustment?.includeInToe !== undefined 
        ? adjustment.includeInToe 
        : !(adjustment?.isZeroedOut || false);
      
      if (!includeInToe) return sum;
      
      // If zeroed out, TOE is 0
      if (adjustment?.isZeroedOut) return sum;
      
      // row.correctedTOE is already computed as monthToe = min(normalToeMonth + subToeMonth, 1.0)
      // where subToeMonth has been converted according to the rule (0% or 75%)
      return sum + row.correctedTOE;
    }, 0);
  }, [periodRows, manualAdjustments, subsidyRule, toeConversion]);

  // Calculate wage base from segments
  // Don't calculate if LOCK_10_MONTHS_THEN_75 is selected but employment start date is missing
  // Use correctedTOETotal instead of toeConversion.totalToeReal to account for manual adjustments
  const wageBaseResultBase = useMemo(() => {
    if (!toePeriodSelection || !toeConversion || correctedTOETotal < requiredTOEMonths) return null;
    if (isEmploymentStartDateRequired && !hasValidEmploymentStartDate) return null;
    return calcWageBaseFromSegments(
      toePeriodSelection.segmentsUsed, 
      exceptionSubsidy, 
      subsidyRule,
      periods,
      SUBSIDIZED_EMPLOYERS,
      employmentStartDateParsed
    );
  }, [toePeriodSelection, toeConversion, correctedTOETotal, exceptionSubsidy, subsidyRule, periods, employmentStartDateParsed, isEmploymentStartDateRequired, hasValidEmploymentStartDate]);

  // Calculate corrected wage base considering manual adjustments
  const wageBaseResult = useMemo(() => {
    if (!wageBaseResultBase || correctedTOETotal < requiredTOEMonths) return null;
    
    // Calculate total accepted wages and divisor days from periods with manual adjustments
    // IMPORTANT: Only include months where:
    // 1. includeInToe === true
    // 2. monthToe > 0 (after normal + subsidized TOE conversion)
    // 3. includeInWage === true
    // This ensures that months that result in TOE = 0 (for any reason) 
    // do NOT contribute to wage calculation
    let totalAcceptedWages = 0;
    let totalDivisorDays = 0;
    let wageNormal = 0;
    let wageSubsidizedGross = 0;
    let wageAcceptedSubsidized = 0;
    
    periodRows.forEach(row => {
      const adjustment = manualAdjustments.get(row.periodId);
      
      // Check 1: includeInToe must be true
      const includeInToe = adjustment?.includeInToe !== undefined 
        ? adjustment.includeInToe 
        : !(adjustment?.isZeroedOut || false);
      
      if (!includeInToe) return;
      
      // Check 2: monthToe must be > 0 (row.correctedTOE > 0)
      // This ensures that months that result in TOE = 0 (for any reason) 
      // do NOT contribute to wage calculation
      if (row.correctedTOE <= 0) return;
      
      // Check 3: includeInWage must be true
      const includeInWage = adjustment?.includeInWage !== undefined 
        ? adjustment.includeInWage 
        : !(adjustment?.isZeroedOut || false);
      
      if (!includeInWage) return;
      
      // If zeroed out, skip
      if (adjustment?.isZeroedOut) return;
      
      // Calculate accepted wages for this period
      const periodRule = adjustment?.subsidyType || subsidyRule;
      const isException = periodRule === "PERCENT_75" || periodRule === "LOCK_10_MONTHS_THEN_75";
      
      // Normal work: 100%
      const normalWage = row.normalWorkWage || 0;
      wageNormal += normalWage;
      
      // Subsidized work: 0% or 75% depending on rule
      const subsidizedWage = row.subsidizedWorkWage || 0;
      wageSubsidizedGross += subsidizedWage;
      const acceptedSubsidizedWage = isException ? subsidizedWage * 0.75 : 0;
      wageAcceptedSubsidized += acceptedSubsidizedWage;
      
      totalAcceptedWages += normalWage + acceptedSubsidizedWage;
      
      // Use manual divisorDays if set, otherwise use original jakaja
      const divisorDays = adjustment?.divisorDays !== undefined 
        ? adjustment.divisorDays 
        : row.jakaja;
      totalDivisorDays += divisorDays;
    });
    
    // Calculate daily wage
    const dailyWage = totalDivisorDays > 0 ? totalAcceptedWages / totalDivisorDays : 0;
    const monthlyWageBase = dailyWage * 21.5;
    
    return {
      wageNormal,
      wageSubsidizedGross,
      wageAcceptedSubsidized,
      wageBaseTotal: monthlyWageBase * periodCount, // Total wage base
      totalDivisorDays,
      totalAcceptedWages,
      dailyWage,
    };
  }, [wageBaseResultBase, periodRows, manualAdjustments, subsidyRule, periodCount, correctedTOETotal]);

  // Check if any period has normal work (to show "Muu työ" column)
  const hasNormalWork = useMemo(() => {
    return periodRows.some(row => row.normalWorkWage !== undefined && row.normalWorkWage > 0);
  }, [periodRows]);

  // Calculate detailed divisor days breakdown for display
  const divisorDaysBreakdown = useMemo(() => {
    if (!wageBaseResult || correctedTOETotal < requiredTOEMonths) return null;
    
    const breakdown: Array<{
      periodId: string;
      maksupaiva: string;
      divisorDays: number;
      normalWage: number;
      subsidizedWage: number;
      acceptedSubsidizedWage: number;
      totalAcceptedWage: number;
    }> = [];
    
    periodRows.forEach(row => {
      const adjustment = manualAdjustments.get(row.periodId);
      
      // Check 1: includeInToe must be true
      const includeInToe = adjustment?.includeInToe !== undefined 
        ? adjustment.includeInToe 
        : !(adjustment?.isZeroedOut || false);
      
      if (!includeInToe) return;
      
      // Check 2: monthToe must be > 0 (row.correctedTOE > 0)
      // This ensures that months that result in TOE = 0 (for any reason) 
      // do NOT contribute to wage calculation
      if (row.correctedTOE <= 0) return;
      
      // Check 3: includeInWage must be true
      const includeInWage = adjustment?.includeInWage !== undefined 
        ? adjustment.includeInWage 
        : !(adjustment?.isZeroedOut || false);
      
      if (!includeInWage) return;
      
      if (adjustment?.isZeroedOut) return;
      
      // Calculate accepted wages for this period
      const periodRule = adjustment?.subsidyType || subsidyRule;
      const isException = periodRule === "PERCENT_75" || periodRule === "LOCK_10_MONTHS_THEN_75";
      
      // Normal work: 100%
      const normalWage = row.normalWorkWage || 0;
      
      // Subsidized work: 0% or 75% depending on rule
      const subsidizedWage = row.subsidizedWorkWage || 0;
      const acceptedSubsidizedWage = isException ? subsidizedWage * 0.75 : 0;
      const totalAcceptedWage = normalWage + acceptedSubsidizedWage;
      
      // Use manual divisorDays if set, otherwise use original jakaja
      const divisorDays = adjustment?.divisorDays !== undefined 
        ? adjustment.divisorDays 
        : row.jakaja;
      
      breakdown.push({
        periodId: row.periodId,
        maksupaiva: row.maksupaiva,
        divisorDays,
        normalWage,
        subsidizedWage,
        acceptedSubsidizedWage,
        totalAcceptedWage,
      });
    });
    
    return breakdown;
  }, [periodRows, manualAdjustments, subsidyRule, wageBaseResult, correctedTOETotal]);

  // Functions for manual adjustments
  const handleZeroOutPeriod = (periodId: string) => {
    setManualAdjustments(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(periodId) || {};
      newMap.set(periodId, {
        ...existing,
        isZeroedOut: true,
        includeInToe: false,
        includeInWage: false,
        divisorDays: 0,
      });
      return newMap;
    });
  };

  const handleRestorePeriod = (periodId: string) => {
    setManualAdjustments(prev => {
      const newMap = new Map(prev);
      newMap.delete(periodId);
      return newMap;
    });
  };

  const handleToggleIncludeInToe = (periodId: string, include: boolean) => {
    setManualAdjustments(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(periodId) || {};
      newMap.set(periodId, {
        ...existing,
        includeInToe: include,
        isZeroedOut: false, // Restore if toggling include
      });
      return newMap;
    });
  };

  const handleToggleIncludeInWage = (periodId: string, include: boolean) => {
    setManualAdjustments(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(periodId) || {};
      newMap.set(periodId, {
        ...existing,
        includeInWage: include,
        isZeroedOut: false, // Restore if toggling include
      });
      return newMap;
    });
  };

  const handleDivisorDaysChange = (periodId: string, divisorDays: number) => {
    setManualAdjustments(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(periodId) || {};
      newMap.set(periodId, {
        ...existing,
        divisorDays: divisorDays,
        isZeroedOut: false, // Restore if editing divisorDays
      });
      return newMap;
    });
  };

  const handleZeroOutDateRange = (startDate: Date, endDate: Date) => {
    setManualAdjustments(prev => {
      const newMap = new Map(prev);
      periodRows.forEach(row => {
        if (row.periodDate >= startDate && row.periodDate <= endDate) {
          const existing = newMap.get(row.periodId) || {};
          newMap.set(row.periodId, {
            ...existing,
            isZeroedOut: true,
            includeInToe: false,
            includeInWage: false,
            divisorDays: 0,
          });
        }
      });
      return newMap;
    });
  };

  // Calculate corrections based on selected rule (for backward compatibility)
  const correction = useMemo(() => {
    if (rows.length === 0) {
      return null;
    }
    return calculateSubsidyCorrection(rows, subsidyRule, toeSystemTotal, systemTotalSalary, periodCount);
  }, [rows, subsidyRule, toeSystemTotal, systemTotalSalary, periodCount]);

  const handleApply = () => {
    if (!correction) return;
    
    // Only apply corrections that are checked
    const systemAverageSalary = periodCount > 0 ? systemTotalSalary / periodCount : 0;
    // Use corrected TOE total considering manual adjustments
    const finalTOETotal = useToeCorrection ? correctedTOETotal : toeSystemTotal;
    const canUseWageCorrection = finalTOETotal >= requiredTOEMonths;
    
    // Collect manual period adjustments
    const manualPeriodAdjustments: Array<{
      periodId: string;
      includeInToe: boolean;
      includeInWage: boolean;
      divisorDays: number;
      subsidyType?: SubsidyRule;
    }> = [];
    
    periodRows.forEach(row => {
      const adjustment = manualAdjustments.get(row.periodId);
      if (adjustment) {
        const includeInToe = adjustment.includeInToe !== undefined 
          ? adjustment.includeInToe 
          : !(adjustment.isZeroedOut || false);
        const includeInWage = adjustment.includeInWage !== undefined 
          ? adjustment.includeInWage 
          : !(adjustment.isZeroedOut || false);
        const divisorDays = adjustment.divisorDays !== undefined 
          ? adjustment.divisorDays 
          : (adjustment.isZeroedOut ? 0 : row.jakaja);
        
        manualPeriodAdjustments.push({
          periodId: row.periodId,
          includeInToe,
          includeInWage,
          divisorDays,
          subsidyType: adjustment.subsidyType,
        });
      }
    });
    
    // Calculate definition period from segmentsUsed periods
    // Helper function to parse period date
    const parsePeriodDate = (ajanjakso: string): Date | null => {
      const parts = ajanjakso.trim().split(/\s+/);
      if (parts.length < 2) return null;
      
      const year = parseInt(parts[0]);
      if (isNaN(year)) return null;
      
      const monthNames: { [key: string]: number } = {
        "Tammikuu": 0, "Helmikuu": 1, "Maaliskuu": 2, "Huhtikuu": 3,
        "Toukokuu": 4, "Kesäkuu": 5, "Heinäkuu": 6, "Elokuu": 7,
        "Syyskuu": 8, "Lokakuu": 9, "Marraskuu": 10, "Joulukuu": 11
      };
      
      const monthName = parts.slice(1).join(" ");
      const month = monthNames[monthName];
      if (month === undefined) return null;
      
      return new Date(year, month, 1);
    };
    
    // Collect all period IDs from segmentsUsed
    const periodIdsInSegments = new Set<string>();
    if (toePeriodSelection?.segmentsUsed) {
      toePeriodSelection.segmentsUsed.forEach(segment => {
        segment.periodIds.forEach(periodId => {
          periodIdsInSegments.add(periodId);
        });
      });
    }
    
    // Find periods that are in segmentsUsed and parse their dates
    const periodsInSegments = periods
      .filter(p => periodIdsInSegments.has(p.id))
      .map(p => {
        const date = parsePeriodDate(p.ajanjakso);
        return { period: p, date };
      })
      .filter((p): p is { period: MonthPeriod; date: Date } => p.date !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime()); // Sort by date (oldest first)
    
    // Calculate definition period start and end
    let definitionPeriodStart: string | undefined;
    let definitionPeriodEnd: string | undefined;
    
    if (periodsInSegments.length > 0 && finalTOETotal >= requiredTOEMonths) {
      // Start date: first period's first day of month
      const firstPeriodDate = periodsInSegments[0].date;
      definitionPeriodStart = formatDateFI(firstPeriodDate);
      
      // End date: last period's last day of month
      const lastPeriodDate = periodsInSegments[periodsInSegments.length - 1].date;
      // Set to last day of month
      const lastDayOfMonth = new Date(lastPeriodDate.getFullYear(), lastPeriodDate.getMonth() + 1, 0);
      definitionPeriodEnd = formatDateFI(lastDayOfMonth);
    }
    
    const fullCorrection: SubsidyCorrection = {
      ...correction,
      rule: subsidyRule,
      // Override values if user doesn't want to use the correction
      toeCorrectedTotal: finalTOETotal,
      toeCorrection: useToeCorrection ? (finalTOETotal - toeSystemTotal) : 0,
      // Only apply wage correction if TOE >= requiredTOEMonths and user wants to use it
      totalSalaryCorrected: (canUseWageCorrection && useWageCorrection && wageBaseResult) 
        ? wageBaseResult.wageBaseTotal 
        : systemTotalSalary,
      totalSalaryCorrection: (canUseWageCorrection && useWageCorrection && wageBaseResult) 
        ? (wageBaseResult.wageBaseTotal - systemTotalSalary) 
        : 0,
      averageSalaryCorrected: (canUseWageCorrection && useWageCorrection && wageBaseResult) 
        ? (periodCount > 0 ? wageBaseResult.wageBaseTotal / periodCount : 0) 
        : systemAverageSalary,
      averageSalaryCorrection: (canUseWageCorrection && useWageCorrection && wageBaseResult) 
        ? ((periodCount > 0 ? wageBaseResult.wageBaseTotal / periodCount : 0) - systemAverageSalary) 
        : 0,
      // Save manual period adjustments
      manualPeriodAdjustments: manualPeriodAdjustments.length > 0 ? manualPeriodAdjustments : undefined,
      // Save definition period
      definitionPeriodStart,
      definitionPeriodEnd,
    };
    
    // Sovelleta korjaus
    onApplyCorrection(fullCorrection);
    onOpenChange(false);
  };

  // Laske näytettävä TOE-kertymä (considering manual adjustments)
  const displayTOE = useMemo(() => {
    if (!correction) return null;
    // Use corrected TOE total if manual adjustments are applied
    return useToeCorrection ? correctedTOETotal : (toeConversion?.totalToeReal ?? correction.toeCorrectedTotal);
  }, [correction, toeConversion, correctedTOETotal, useToeCorrection]);

  // Don't return null if employment start date is required but missing
  // This allows the component to show the message asking for the date
  if (rows.length === 0) {
    return null;
  }
  
  // If periodRows is empty but employment start date is required and missing,
  // still show the component so user can input the date
  if (periodRows.length === 0 && !(isEmploymentStartDateRequired && !hasValidEmploymentStartDate)) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Palkkatuetun työn korjaus</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Subsidy rule selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Palkkatuen sääntö</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Employment start date input - first in the card */}
              <div className="mb-6 space-y-2">
                <Label htmlFor="employment-start-date">
                  Palkkatuetun työsuhteen alkamispäivä
                  {(subsidyRule === "LOCK_10_MONTHS_THEN_75" || subsidyRule === "PERCENT_75") && (
                    <span className="text-red-500"> *</span>
                  )}
                </Label>
                <Input
                  id="employment-start-date"
                  type="text"
                  placeholder="PP.KK.VVVV"
                  value={employmentStartDate}
                  onChange={(e) => setEmploymentStartDate(e.target.value)}
                  className={`w-40 ${subsidyRule === "LOCK_10_MONTHS_THEN_75" && !hasValidEmploymentStartDate ? 'border-red-500' : ''}`}
                  pattern="\d{1,2}\.\d{1,2}\.\d{4}"
                  title="Syötä päivämäärä muodossa PP.KK.VVVV (esim. 01.01.2025)"
                />
                {employmentStartDateOriginal && (
                  <p className="text-xs text-gray-500">
                    {employmentStartDateOriginal < RULE_DATE_AFTER 
                      ? "Työsuhteen alkamispäivä on ennen 2.9.2024. Sääntö valitaan automaattisesti."
                      : "Työsuhteen alkamispäivä on 2.9.2024 tai sen jälkeen. Valitse palkkatuen sääntö alla."}
                  </p>
                )}
                {subsidyRule === "LOCK_10_MONTHS_THEN_75" && !hasValidEmploymentStartDate && (
                  <p className="text-xs text-red-500">
                    Työsuhteen alkamispäivä on pakollinen poikkeusperusteen laskennassa
                  </p>
                )}
                {subsidyRule === "LOCK_10_MONTHS_THEN_75" && hasValidEmploymentStartDate && (
                  <p className="text-xs text-gray-500">
                    Ensimmäiset 10 kuukautta työsuhteen alkamisesta eivät kerry TOE:ta
                  </p>
                )}
              </div>
              <RadioGroup 
                value={subsidyRule} 
                onValueChange={(value) => {
                  // Prevent selecting PERCENT_75 if employment start date is on or after 2.9.2024
                  // Use original date for comparison, not the first day of month
                  if (value === "PERCENT_75" && employmentStartDateOriginal && employmentStartDateOriginal >= RULE_DATE_AFTER) {
                    return;
                  }
                  // Prevent manual change if rule is auto-selected (employment start date before 2.9.2024)
                  // Use original date for comparison, not the first day of month
                  if (employmentStartDateOriginal && employmentStartDateOriginal < RULE_DATE_AFTER && value !== "PERCENT_75") {
                    // Rule is auto-selected, don't allow manual change
                    return;
                  }
                  setSubsidyRule(value as SubsidyRule);
                }}
              >
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem 
                      value="NO_TOE_EXTENDS" 
                      id="rule-no-toe"
                      disabled={employmentStartDateOriginal !== null && employmentStartDateOriginal < RULE_DATE_AFTER}
                    />
                    <Label 
                      htmlFor="rule-no-toe" 
                      className={`flex-1 ${employmentStartDateOriginal !== null && employmentStartDateOriginal < RULE_DATE_AFTER ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    >
                      <div className="font-medium">Palkkatuki</div>
                      <div className="text-sm text-gray-600">Ei TOE-kertymää, vain pidentää viitejaksoa</div>
                    </Label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem 
                      value="PERCENT_75" 
                      id="rule-75"
                      disabled={employmentStartDateOriginal !== null && employmentStartDateOriginal >= RULE_DATE_AFTER}
                    />
                    <Label 
                      htmlFor="rule-75" 
                      className={`flex-1 ${employmentStartDateOriginal !== null && employmentStartDateOriginal >= RULE_DATE_AFTER ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    >
                      <div className="font-medium">Palkkatuettu työ alkanut ennen 2.9.2024</div>
                      <div className="text-sm text-gray-600">75% kaikista kuukausista</div>
                      {employmentStartDateOriginal && employmentStartDateOriginal < RULE_DATE_AFTER && (
                        <div className="text-xs text-blue-600 mt-1 font-medium">(Valittu automaattisesti)</div>
                      )}
                    </Label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem 
                      value="LOCK_10_MONTHS_THEN_75" 
                      id="rule-lock"
                      disabled={employmentStartDateOriginal !== null && employmentStartDateOriginal < RULE_DATE_AFTER}
                    />
                    <Label 
                      htmlFor="rule-lock" 
                      className={`flex-1 ${employmentStartDateOriginal !== null && employmentStartDateOriginal < RULE_DATE_AFTER ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    >
                      <div className="font-medium">Poikkeusperuste</div>
                      <div className="text-sm text-gray-600">10 kk ei TOE, sen jälkeen 75%</div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Show message if employment start date is required but missing */}
          {isEmploymentStartDateRequired && !hasValidEmploymentStartDate && (
            <Card>
              <CardContent className="py-6">
                <div className="text-center text-gray-600">
                  <p className="font-medium mb-2">Syötä työsuhteen alkamispäivä</p>
                  <p className="text-sm">
                    Poikkeusperusteen laskentaa varten tarvitaan työsuhteen alkamispäivä, jotta voidaan määrittää ensimmäiset 10 kuukautta, jotka eivät kerry TOE:ta.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Period-based table - only show if calculation is possible */}
          {toeConversion && hasValidEmploymentStartDate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Palkkatuetun työn periodit</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Tarkastelujakso */}
                <div className="mb-4 p-3 bg-gray-50 rounded border">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs text-gray-600 font-medium mb-1 block">
                        Tarkastelujakso
                      </Label>
                      <div className="text-sm text-gray-900 font-semibold">
                        {reviewPeriodStart && reviewPeriodEnd 
                          ? `${reviewPeriodStart} - ${reviewPeriodEnd}`
                          : reviewPeriodEnd 
                            ? `- ${reviewPeriodEnd}`
                            : '-'}
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
                        <th className="px-3 py-2 text-left text-xs font-medium">Jakaja</th>
                        <th className="px-3 py-2 text-left text-xs font-medium">TOE</th>
                        <th className="px-3 py-2 text-left text-xs font-medium">Palkka</th>
                        <th className="px-3 py-2 text-left text-xs font-medium">Toiminnot</th>
                      </tr>
                    </thead>
                    <tbody>
                      {periodRows.map((row) => {
                        const adjustment = manualAdjustments.get(row.periodId);
                        const isZeroedOut = adjustment?.isZeroedOut || false;
                        const includeInToe = adjustment?.includeInToe !== undefined 
                          ? adjustment.includeInToe 
                          : !isZeroedOut; // Default: include if not zeroed out
                        const includeInWage = adjustment?.includeInWage !== undefined 
                          ? adjustment.includeInWage 
                          : !isZeroedOut; // Default: include if not zeroed out
                        const divisorDays = adjustment?.divisorDays !== undefined 
                          ? adjustment.divisorDays 
                          : (isZeroedOut ? 0 : row.jakaja);
                        
                        return (
                          <tr 
                            key={row.periodId} 
                            className={`border-b hover:bg-gray-50 ${isZeroedOut ? 'bg-red-50 opacity-60' : ''}`}
                          >
                            <td className="px-3 py-2 text-xs">{row.maksupaiva}</td>
                            {hasNormalWork && (
                              <td className="px-3 py-2 text-xs">
                                {row.normalWorkWage !== undefined && row.normalWorkWage > 0 ? (
                                  <>
                                    {formatCurrency(row.normalWorkWage)} ({row.normalWorkTOE?.toFixed(1) || '0.0'} kk)
                                  </>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                            )}
                            <td className="px-3 py-2 text-xs">
                              {row.subsidizedWorkWage > 0 ? (
                                <>
                                  {(() => {
                                    const monthNumber = subsidizedMonthNumbers.get(row.periodId);
                                    // KORJAUS: subsidizedPosition on 1-based (10. kuukausi = 10, 11. kuukausi = 11)
                                    // Ensimmäiset 10 kuukautta (1-10) eivät kerry TOE:ta, joten highlighting pitää olla > 10
                                    const isAfter10Months = row.subsidizedPosition !== undefined && row.subsidizedPosition > 10;
                                    
                                    const displayText = monthNumber !== undefined
                                      ? `${formatCurrency(row.subsidizedWorkWage)} (${row.correctedSubsidizedTOE.toFixed(1)}kk/${monthNumber})`
                                      : `${formatCurrency(row.subsidizedWorkWage)} (${row.correctedSubsidizedTOE.toFixed(1)} kk)`;
                                    
                                    return (
                                      <span className={isAfter10Months ? "text-blue-600 font-medium" : ""}>
                                        {displayText}
                                      </span>
                                    );
                                  })()}
                                  {subsidyRule !== "LOCK_10_MONTHS_THEN_75" && row.correctedSubsidizedTOE !== row.subsidizedWorkTOE && (
                                    <span className="ml-1 text-xs text-gray-500">
                                      (järjestelmä: {row.subsidizedWorkTOE.toFixed(1)} kk)
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-xs">
                              <Input
                                type="number"
                                value={divisorDays.toFixed(1)}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0;
                                  handleDivisorDaysChange(row.periodId, value);
                                }}
                                className="w-20"
                                step="0.1"
                                min="0"
                              />
                            </td>
                            <td className="px-3 py-2 text-xs">
                              <Checkbox
                                checked={includeInToe}
                                onCheckedChange={(checked) => {
                                  handleToggleIncludeInToe(row.periodId, checked === true);
                                }}
                              />
                            </td>
                            <td className="px-3 py-2 text-xs">
                              <Checkbox
                                checked={includeInWage}
                                onCheckedChange={(checked) => {
                                  handleToggleIncludeInWage(row.periodId, checked === true);
                                }}
                              />
                            </td>
                            <td className="px-3 py-2 text-xs">
                              {isZeroedOut ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRestorePeriod(row.periodId)}
                                >
                                  Palauta
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleZeroOutPeriod(row.periodId)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  Nollaa
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {/* Yhteenvedot taulukon alle */}
                    <tfoot className="bg-gray-50">
                      <tr className="border-t-2 border-gray-300 font-semibold">
                        <td className="px-3 py-2 text-xs">Yhteensä</td>
                        {hasNormalWork && (
                          <td className="px-3 py-2 text-xs">
                            {formatCurrency(
                              periodRows.reduce((sum, row) => sum + (row.normalWorkWage || 0), 0)
                            )} ({periodRows.reduce((sum, row) => sum + (row.normalWorkTOE || 0), 0).toFixed(1)} kk)
                          </td>
                        )}
                        <td className="px-3 py-2 text-xs">
                          {formatCurrency(
                            periodRows.reduce((sum, row) => sum + (row.subsidizedWorkWage || 0), 0)
                          )} ({periodRows.reduce((sum, row) => sum + (row.correctedSubsidizedTOE || 0), 0).toFixed(1)} kk)
                          {periodRows.some(row => row.correctedSubsidizedTOE !== row.subsidizedWorkTOE) && (
                            <span className="ml-1 text-xs text-gray-500 font-normal">
                              (järjestelmä: {periodRows.reduce((sum, row) => sum + (row.subsidizedWorkTOE || 0), 0).toFixed(1)} kk)
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {(() => {
                            // Laske kaikkien periodien jakajien yhteissumma
                            const totalAllDivisorDays = periodRows.reduce((sum, row) => sum + (row.jakaja || 0), 0);
                            
                            // Laske vaikuttavien kuukausien jakajien yhteissumma
                            // (sama logiikka kuin wageBaseResult.totalDivisorDays)
                            const totalEffectiveDivisorDays = wageBaseResult && correctedTOETotal >= requiredTOEMonths
                              ? wageBaseResult.totalDivisorDays
                              : periodRows.reduce((sum, row) => {
                                  // Laske vain vaikuttavien kuukausien jakajat
                                  const adjustment = manualAdjustments.get(row.periodId);
                                  const includeInToe = adjustment?.includeInToe !== undefined 
                                    ? adjustment.includeInToe 
                                    : !(adjustment?.isZeroedOut || false);
                                  const includeInWage = adjustment?.includeInWage !== undefined 
                                    ? adjustment.includeInWage 
                                    : !(adjustment?.isZeroedOut || false);
                                  
                                  // Vain jos includeInToe === true, monthToe > 0, ja includeInWage === true
                                  if (!includeInToe || row.correctedTOE <= 0 || !includeInWage || adjustment?.isZeroedOut) {
                                    return sum;
                                  }
                                  
                                  const divisorDays = adjustment?.divisorDays !== undefined 
                                    ? adjustment.divisorDays 
                                    : row.jakaja;
                                  return sum + divisorDays;
                                }, 0);
                            
                            // Näytä vaikuttavien kuukausien jakajat tärkeämpänä, kaikkien jakajat suluissa
                            if (totalEffectiveDivisorDays !== totalAllDivisorDays) {
                              return (
                                <>
                                  <span className="font-semibold">{totalEffectiveDivisorDays.toFixed(1)}</span>
                                  <span className="text-gray-500"> ({totalAllDivisorDays.toFixed(1)})</span>
                                </>
                              );
                            } else {
                              // Jos sama, näytä vain yksi luku
                              return totalEffectiveDivisorDays.toFixed(1);
                            }
                          })()}
                        </td>
                      </tr>
                      {/* TOE-kertymän yhteenvedot */}
                      <tr className="border-t border-gray-200">
                        <td colSpan={hasNormalWork ? 2 : 1} className="px-3 py-2 text-xs text-gray-600">
                          Palkkatuetun työn TOE (muunto {exceptionSubsidy ? "75%" : "0%"}):
                        </td>
                        <td className="px-3 py-2 text-xs font-semibold">
                          {subsidyRule === "LOCK_10_MONTHS_THEN_75" && toeConversion?.totalSubsidizedTOEConverted !== undefined
                            ? toeConversion.totalSubsidizedTOEConverted.toFixed(0) + " kk"
                            : periodRows.reduce((sum, row) => sum + (row.correctedSubsidizedTOE || 0), 0).toFixed(1) + " kk"}
                        </td>
                        <td></td>
                      </tr>
                      {periodRows.some(row => row.correctedSubsidizedTOE !== row.subsidizedWorkTOE) && (
                        <tr className="border-t border-gray-200">
                          <td colSpan={hasNormalWork ? 2 : 1} className="px-3 py-2 text-xs text-gray-600">
                            Palkkatuetun työn TOE (järjestelmä):
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {periodRows.reduce((sum, row) => sum + (row.subsidizedWorkTOE || 0), 0).toFixed(1)} kk
                          </td>
                          <td></td>
                        </tr>
                      )}
                      {hasNormalWork && (
                        <tr className="border-t border-gray-200">
                          <td colSpan={2} className="px-3 py-2 text-xs text-gray-600">
                            Muu työ (TOE):
                          </td>
                          <td className="px-3 py-2 text-xs font-semibold">
                            {periodRows.reduce((sum, row) => sum + (row.normalWorkTOE || 0), 0).toFixed(1)} kk
                          </td>
                          <td></td>
                        </tr>
                      )}
                      <tr className="border-t-2 border-gray-300 bg-gray-100">
                        <td colSpan={hasNormalWork ? 2 : 1} className="px-3 py-2 text-xs font-semibold">
                          TOE yhteensä:
                        </td>
                        <td className="px-3 py-2 text-xs font-semibold">
                          {correctedTOETotal.toFixed(1)} kk
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                
                {/* TOE calculation summary - moved from separate card to below table */}
                {toeConversion && hasValidEmploymentStartDate && (
                  <div className="mt-6 space-y-3">
                    {/* System TOE vs Corrected TOE comparison - grid layout */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Corrected TOE yhteensä */}
                      <div className="p-3 bg-blue-50 rounded border border-blue-200">
                        <div className="text-xs text-blue-700 mb-1 font-medium">Korjattu TOE:</div>
                        <div className="text-2xl font-semibold text-blue-900">
                          {correctedTOETotal.toFixed(1)} kk
                        </div>
                        <div className="text-xs text-blue-700 mt-1">
                          Normaalityö: {periodRows.reduce((sum, row) => sum + (row.normalWorkTOE || 0), 0).toFixed(1)} kk + 
                          Palkkatuettu (muunto): {
                            (subsidyRule === "LOCK_10_MONTHS_THEN_75" || subsidyRule === "PERCENT_75") && toeConversion?.totalSubsidizedTOEConverted !== undefined
                              ? toeConversion.totalSubsidizedTOEConverted.toFixed(0)
                              : periodRows.reduce((sum, row) => sum + (row.correctedSubsidizedTOE || 0), 0).toFixed(1)
                          } kk
                        </div>
                      </div>
                      
                      {/* System TOE yhteensä */}
                      <div className="p-3 bg-gray-50 rounded border">
                        <div className="text-xs text-gray-500 mb-1">Järjestelmän TOE (ennen korjausta):</div>
                        <div className="text-2xl font-semibold text-gray-600">
                          {(() => {
                            const normalWorkTOE = periodRows.reduce((sum, row) => sum + (row.normalWorkTOE || 0), 0);
                            const subsidizedSystemTOE = periodRows.reduce((sum, row) => sum + (row.subsidizedWorkTOE || 0), 0);
                            return (normalWorkTOE + subsidizedSystemTOE).toFixed(1);
                          })()} kk
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Normaalityö: {periodRows.reduce((sum, row) => sum + (row.normalWorkTOE || 0), 0).toFixed(1)} kk + 
                          Palkkatuettu (järjestelmä): {periodRows.reduce((sum, row) => sum + (row.subsidizedWorkTOE || 0), 0).toFixed(1)} kk
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Laajenna tarkastelujaksoa -osio kun TOE < requiredTOEMonths */}
          {toeConversion && hasValidEmploymentStartDate && subsidyRule !== "NONE" && correctedTOETotal < requiredTOEMonths && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Laajenna tarkastelujaksoa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button
                    onClick={onExtendReviewPeriodTo28Months}
                    variant="outline"
                    className="w-full"
                  >
                    Laajenna tarkastelujakso 28kk
                  </Button>
                  <p className="text-xs text-gray-500">
                    Laajentaa tarkastelujakson alkupäivää taaksepäin enintään 28 kuukauteen päättymispäivästä.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Wage base calculation - only show if calculation is possible */}
          {toeConversion && hasValidEmploymentStartDate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Palkanmäärittelyn korjaus</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Näytä huomio jos TOE < requiredTOEMonths */}
                {correctedTOETotal < requiredTOEMonths && (
                  <div className="p-3 bg-amber-50 border-l-4 border-amber-400 rounded-r">
                    <p className="text-sm text-amber-800">
                      <span className="font-medium">Huomio:</span> Korjattu TOE yhteensä on alle {requiredTOEMonths}kk ({correctedTOETotal.toFixed(1)} kk / {requiredTOEMonths} kk). 
                      Palkanmääritystä ei lasketa ennen kuin työssäoloehto {requiredTOEMonths}kk täyttyy.
                    </p>
                  </div>
                )}
                
                {(() => {
                  // Tarkista onko TOE täyttynyt
                  const toeFulfilled = correctedTOETotal >= requiredTOEMonths;
                  
                  if (!toeFulfilled || !wageBaseResult) {
                    return (
                      <div className="text-sm text-gray-600">
                        Palkanmääritystä ei voida laskea ennen kuin TOE täyttyy ({requiredTOEMonths} kk).
                      </div>
                    );
                  }
                  
                  return (
                    <>
                      {/* Hyväksyttävät palkat ja Perustepalkka/kk - grid layout (top priority cards) */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        {/* Hyväksyttävät palkat yhteensä */}
                        <div className="p-3 bg-green-50 rounded border border-green-200">
                          <div className="text-xs text-green-700 mb-1 font-medium">Hyväksyttävät palkat yhteensä:</div>
                          <div className="text-2xl font-semibold text-green-900">
                            {formatCurrency(wageBaseResult.totalAcceptedWages)}
                          </div>
                          <div className="text-xs text-green-700 mt-1">
                            Jakaja: {wageBaseResult.totalDivisorDays.toFixed(1)} päivää
                          </div>
                        </div>
                        
                        {/* Perustepalkka/kk (korjattu) */}
                        <div className="p-3 bg-purple-50 rounded border border-purple-200">
                          <div className="text-xs text-purple-700 mb-1 font-medium">Perustepalkka/kk (korjattu):</div>
                          <div className="text-2xl font-semibold text-purple-900">
                            {formatCurrency(periodCount > 0 ? wageBaseResult.wageBaseTotal / periodCount : 0)}
                          </div>
                          <div className="text-xs text-purple-700 mt-1">
                            Päiväpalkka: {formatCurrency(wageBaseResult.dailyWage)} / päivä
                          </div>
                        </div>
                      </div>
                      
                      {/* Päiväpalkka-laskenta */}
                      {divisorDaysBreakdown && divisorDaysBreakdown.length > 0 && (
                        <div className="pt-3 border-t mb-4">
                          <div className="text-xs text-gray-600 mb-1">Päiväpalkka-laskenta:</div>
                          <div className="text-sm text-gray-700 font-mono bg-gray-50 p-2 rounded">
                            Päiväpalkka = Hyväksyttävät palkat yhteensä / Jakajan päivät yhteensä
                            <br />
                            Päiväpalkka = {formatCurrency(wageBaseResult.totalAcceptedWages)} / {wageBaseResult.totalDivisorDays.toFixed(1)} päivää
                            <br />
                            <span className="font-semibold text-gray-900">
                              Päiväpalkka = {formatCurrency(wageBaseResult.dailyWage)} / päivä
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Korjattu palkka ja Järjestelmän palkka - plain text format */}
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">Korjattu palkka:</span>
                          <span className="font-semibold text-gray-900 ml-2">
                            {formatCurrency(wageBaseResult.wageBaseTotal)}
                          </span>
                          <span className="text-gray-500 text-xs ml-2">
                            (Muu työ: {formatCurrency(wageBaseResult.wageNormal)} + Palkkatuettu (muunto): {formatCurrency(wageBaseResult.wageAcceptedSubsidized)})
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Järjestelmän palkka (ennen korjausta):</span>
                          <span className="font-semibold text-gray-900 ml-2">
                            {formatCurrency(systemTotalSalary)}
                          </span>
                          <span className="text-gray-500 text-xs ml-2">
                            (Muu työ: {formatCurrency(wageBaseResult.wageNormal)} + Palkkatuettu (järjestelmä): {formatCurrency(wageBaseResult.wageSubsidizedGross)})
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Apply options - only show if calculation is possible */}
          {toeConversion && hasValidEmploymentStartDate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Käytä korjauksia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="use-toe"
                      checked={useToeCorrection}
                      onCheckedChange={(checked) => setUseToeCorrection(checked === true)}
                    />
                    <Label htmlFor="use-toe" className="cursor-pointer">
                      Käytä korjattua TOE-kertymää ({displayTOE?.toFixed(1) || toeConversion?.totalToeReal.toFixed(1) || "0"} kk)
                    </Label>
                  </div>
                  {/* Show wage correction option if TOE >= requiredTOEMonths (joko korjauksen jälkeen tai laajennuksen jälkeen) */}
                  {toeConversion && correctedTOETotal >= requiredTOEMonths && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="use-wage"
                        checked={useWageCorrection}
                        onCheckedChange={(checked) => setUseWageCorrection(checked === true)}
                      />
                      <Label htmlFor="use-wage" className="cursor-pointer">
                        Käytä korjattua perustepalkkaa ({
                          wageBaseResult
                            ? formatCurrency(periodCount > 0 ? wageBaseResult.wageBaseTotal / periodCount : 0)
                            : "-"
                        })
                      </Label>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => {
            onOpenChange(false);
          }}>
            Peruuta
          </Button>
          <Button
            onClick={handleApply}
            disabled={
              !correction || 
              !toeConversion || 
              subsidyRule === "NONE" ||
              !hasValidEmploymentStartDate ||
              (!useToeCorrection && ((correctedTOETotal < requiredTOEMonths) || !useWageCorrection))
            }
            className="bg-green-600 hover:bg-green-700"
          >
            Hyväksy korjaus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
