// Utility functions for period-based UI with segment-based calculation
// These functions implement the segment-based logic from Palkkatuenlaskenta.md
// while providing period-based data for the UI

import type { MonthPeriod, IncomeRow, SubsidyRule, SegmentType, SubsidySegment, PeriodRow } from "../types";
import { parseFinnishDate } from "../utils";
import { roundToeMonthsDown } from "./subsidyCalculations";
import { calculateTOEValueFromSalary } from "../domain/toe";

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

/**
 * Groups periods into segments based on whether they contain normal work, subsidized work, or both.
 * 
 * COMMON: periods where there is BOTH normal work and subsidized work in the same calendar months.
 * SUBSIDY_ONLY: periods where there is ONLY subsidized work.
 * 
 * @param periods - Array of periods to group
 * @param calculateTOEValue - Function to calculate TOE value for a period
 * @param calculateEffectiveIncomeTotal - Function to calculate effective income total for a period
 * @param subsidizedEmployers - Set of subsidized employer names
 * @param reviewPeriodStart - Start date of review period (optional)
 * @param reviewPeriodEnd - End date of review period
 * @returns Array of segments
 */
export function groupPeriodsIntoSegments(
  periods: MonthPeriod[],
  calculateTOEValue: (period: MonthPeriod) => number,
  calculateEffectiveIncomeTotal: (period: MonthPeriod) => number,
  subsidizedEmployers: Set<string>,
  reviewPeriodStart: Date | null,
  reviewPeriodEnd: Date
): SubsidySegment[] {
  const segments: SubsidySegment[] = [];
  
  // Filter periods within review period
  const periodsInRange = periods.filter(p => {
    const periodDate = parsePeriodDate(p.ajanjakso);
    if (!periodDate) return false;
    if (periodDate > reviewPeriodEnd) return false;
    if (reviewPeriodStart && periodDate < reviewPeriodStart) return false;
    return true;
  });
  
  // IMPORTANT: Sort periods by date (newest first) so that selectToePeriod
  // processes them in the correct order (from review period end backwards)
  // This ensures that when extending the review period, we continue backwards
  // until we reach 12 TOE months or the 28-month limit
  const sortedPeriodsInRange = [...periodsInRange].sort((a, b) => {
    const dateA = parsePeriodDate(a.ajanjakso);
    const dateB = parsePeriodDate(b.ajanjakso);
    if (!dateA || !dateB) return 0;
    return dateB.getTime() - dateA.getTime(); // Newest first
  });
  
  // Group periods into segments
  // For simplicity, we'll create one segment per period type
  // In a more complex scenario, we could group consecutive periods of the same type
  
  for (const period of sortedPeriodsInRange) {
    const periodDate = parsePeriodDate(period.ajanjakso);
    if (!periodDate) continue;
    
    // Check if period has normal work (non-subsidized)
    const normalRows = period.rows.filter(row => !isSubsidizedRow(row, subsidizedEmployers));
    const subsidizedRows = period.rows.filter(row => isSubsidizedRow(row, subsidizedEmployers));
    
    const hasNormalWork = normalRows.length > 0;
    const hasSubsidizedWork = subsidizedRows.length > 0;
    
    // Determine segment type
    const segmentType: SegmentType = hasNormalWork && hasSubsidizedWork 
      ? "COMMON" 
      : hasSubsidizedWork 
        ? "SUBSIDY_ONLY" 
        : "COMMON"; // If only normal work, still COMMON (but won't be used in subsidy calculation)
    
    // Calculate wages first
    const normalWage = normalRows.reduce((sum, row) => sum + (row.palkka || 0), 0);
    const subsidizedWage = subsidizedRows.reduce((sum, row) => sum + (row.palkka || 0), 0);
    
    // Calculate TOE values separately for normal and subsidized work
    // IMPORTANT: TOE must be calculated separately, not from total period salary
    // This ensures correct TOE calculation when period has both normal and subsidized work
    const normalTOE = hasNormalWork ? calculateTOEValueFromSalary(normalWage) : 0;
    const subsidizedTOE = hasSubsidizedWork ? calculateTOEValueFromSalary(subsidizedWage) : 0;
    
    // Each period is 1 calendar month
    const calendarMonths = 1;
    
    segments.push({
      id: `segment-${period.id}`,
      type: segmentType,
      calendarMonths,
      toeNormalSystem: normalTOE,
      toeSubsidizedSystem: subsidizedTOE,
      wageNormalTotal: normalWage,
      wageSubsidizedTotal: subsidizedWage,
      periodIds: [period.id],
      includeInToe: true,
      includeInWage: true,
    });
  }
  
  return segments;
}

/**
 * Converts TOE in each segment according to rules:
 * - Normal TOE remains as system value (subject to calendar month cap).
 * - Subsidized TOE is multiplied by 0.75 if exceptionSubsidy is true, else 0.
 * - For LOCK_10_MONTHS_THEN_75 rule: first 10 subsidized months = 0, then 75% of remaining months.
 * - Total TOE per segment is capped by segment.calendarMonths.
 * 
 * @param segments - Array of segments to convert
 * @param exceptionSubsidy - Whether this claimant has a poikkeusperuste for subsidy
 * @param rule - Subsidy rule to apply (for LOCK_10_MONTHS_THEN_75 special handling)
 * @returns Conversion result with augmented segments and total real TOE
 */
export interface ToeConversionResult {
  segments: (SubsidySegment & {
    toeNormalAccepted: number;
    toeSubsidizedConverted: number;
    toeTotalSegment: number;
    subsidizedPosition?: number;
  })[];
  totalToeReal: number;
  // For LOCK_10_MONTHS_THEN_75: the total converted subsidized TOE (sum * 0.75, rounded down)
  totalSubsidizedTOEConverted?: number;
  // For LOCK_10_MONTHS_THEN_75: the total system TOE after 10 months (before conversion)
  totalSubsidizedTOEAfter10Months?: number;
}

/**
 * Gets the month date for a segment (from its first period).
 */
function getSegmentMonthDate(segment: SubsidySegment, periods: MonthPeriod[]): Date | null {
  if (segment.periodIds.length === 0) return null;
  const period = periods.find(p => p.id === segment.periodIds[0]);
  if (!period) return null;
  return parsePeriodDate(period.ajanjakso);
}

export function convertToeForSegments(
  segments: SubsidySegment[],
  exceptionSubsidy: boolean,
  rule?: "LOCK_10_MONTHS_THEN_75" | "PERCENT_75" | "NO_TOE_EXTENDS" | "NONE",
  periods?: MonthPeriod[],
  subsidizedEmployers?: Set<string>,
  employmentStartDate?: Date | null,
): ToeConversionResult {
  const augmentedSegments: (SubsidySegment & {
    toeNormalAccepted: number;
    toeSubsidizedConverted: number;
    toeTotalSegment: number;
    subsidizedPosition?: number; // Position from employment start (0-based, -1 if not subsidized or not applicable)
  })[] = [];
  
  let totalToeReal = 0;
  
  // For LOCK_10_MONTHS_THEN_75, we need to sort subsidized segments by employment start date
  // and count from employment start, not from review period start
  let subsidizedSegmentsWithDates: Array<{ segment: SubsidySegment; monthDate: Date }> = [];
  
  if (rule === "LOCK_10_MONTHS_THEN_75" && periods && employmentStartDate) {
    // CRITICAL: For LOCK_10_MONTHS_THEN_75, we need to collect ALL subsidized periods
    // from employment start date onwards, not just those in the review period.
    // This ensures that the first 10 months are correctly identified.
    
    // Collect all periods with subsidized work from employment start date onwards
    const allSubsidizedPeriods: Array<{ period: MonthPeriod; monthDate: Date; toeValue: number; subsidizedWage: number }> = [];
    
    for (const period of periods) {
      const periodDate = parsePeriodDate(period.ajanjakso);
      if (!periodDate) continue;
      
      // Only include periods from employment start date onwards
      if (periodDate < employmentStartDate) continue;
      
      // Check if period has subsidized work
      const hasSubsidizedWork = period.rows.some(row => {
        if (row.isSubsidized !== undefined) {
          return row.isSubsidized;
        }
        return subsidizedEmployers?.has(row.tyonantaja) || false;
      });
      
      if (hasSubsidizedWork) {
        // Calculate subsidized TOE for this period
        const subsidizedRows = period.rows.filter(row => {
          if (row.isSubsidized !== undefined) {
            return row.isSubsidized;
          }
          return subsidizedEmployers?.has(row.tyonantaja) || false;
        });
        const subsidizedWage = subsidizedRows.reduce((sum, row) => sum + (row.palkka || 0), 0);
        const subsidizedTOE = calculateTOEValueFromSalary(subsidizedWage);
        
        if (subsidizedTOE > 0) {
          allSubsidizedPeriods.push({
            period,
            monthDate: periodDate,
            toeValue: subsidizedTOE,
            subsidizedWage, // Store for later use
          });
        }
      }
    }
    
    // Sort by month date (oldest first) - this gives us chronological order from employment start
    allSubsidizedPeriods.sort((a, b) => a.monthDate.getTime() - b.monthDate.getTime());
    
    // Now map these periods to segments for the calculation
    // We'll use the segments from the parameter, but calculate cumulative TOE from all subsidized periods
    for (const { period, monthDate, toeValue, subsidizedWage } of allSubsidizedPeriods) {
      // Find corresponding segment from the segments parameter
      const segment = segments.find(s => s.periodIds.includes(period.id));
      if (segment && segment.includeInToe && segment.toeSubsidizedSystem > 0) {
        subsidizedSegmentsWithDates.push({ segment, monthDate });
      } else if (!segment) {
        // If segment not found in segments parameter, create a temporary one for calculation
        // This can happen if the period is outside the review period but after employment start
        const tempSegment: SubsidySegment = {
          id: `temp-segment-${period.id}`,
          type: "SUBSIDY_ONLY",
          calendarMonths: 1,
          toeNormalSystem: 0,
          toeSubsidizedSystem: toeValue,
          wageNormalTotal: 0,
          wageSubsidizedTotal: subsidizedWage,
          periodIds: [period.id],
          includeInToe: true,
          includeInWage: true,
        };
        subsidizedSegmentsWithDates.push({ segment: tempSegment, monthDate });
      }
    }
    
    // Sort by month date (oldest first) - this gives us chronological order from employment start
    subsidizedSegmentsWithDates.sort((a, b) => a.monthDate.getTime() - b.monthDate.getTime());
  } else if (rule === "LOCK_10_MONTHS_THEN_75" && periods) {
    // Fallback: if employment start date is not provided, use segments as-is
    for (const segment of segments) {
      if (segment.includeInToe && segment.toeSubsidizedSystem > 0) {
        const monthDate = getSegmentMonthDate(segment, periods);
        if (monthDate) {
          subsidizedSegmentsWithDates.push({ segment, monthDate });
        }
      }
    }
    
    // Sort by month date (oldest first)
    subsidizedSegmentsWithDates.sort((a, b) => a.monthDate.getTime() - b.monthDate.getTime());
  }
  
  // For LOCK_10_MONTHS_THEN_75: First sum all subsidized TOE months (after first 10), then multiply by 0.75, then round down to whole number
  let totalSubsidizedTOEAfter10Months = 0;
  let totalSubsidizedTOEConverted = 0; // This will be the total after 0.75 multiplication and rounding
  
  // For PERCENT_75: First sum all subsidized TOE months (from employment start date onwards), then multiply by 0.75, then round down
  let totalSubsidizedTOEForPercent75 = 0;
  let totalSubsidizedTOEConvertedPercent75 = 0; // This will be the total after 0.75 multiplication and rounding
  
  // Store cumulative TOE for each segment (for display purposes)
  const segmentCumulativeTOE = new Map<string, number>();
  
  // For PERCENT_75: Collect all subsidized TOE months from employment start date onwards
  if (rule === "PERCENT_75" && employmentStartDate && periods) {
    for (const segment of segments) {
      if (!segment.includeInToe || segment.toeSubsidizedSystem <= 0) continue;
      
      const segmentMonthDate = getSegmentMonthDate(segment, periods);
      if (segmentMonthDate && segmentMonthDate >= employmentStartDate) {
        totalSubsidizedTOEForPercent75 += segment.toeSubsidizedSystem;
      }
    }
    
    // Multiply by 0.75 and round down to whole number
    totalSubsidizedTOEConvertedPercent75 = Math.floor(totalSubsidizedTOEForPercent75 * 0.75);
  }
  
  if (rule === "LOCK_10_MONTHS_THEN_75" && employmentStartDate && periods) {
    // KORJAUS: Ensimmäiset 10 kuukautta lasketaan PALKATUKIKUUKAUSINA työsuhteen alkamispäivästä,
    // jonka käyttäjä on syöttänyt. Jokainen periodi/segmentti, jossa on palkkatuettua työtä,
    // on yksi palkkatukikuukausi. Ensimmäiset 10 palkkatukikuukautta eivät kerry TOE:ta,
    // 11. palkkatukikuukaudesta eteenpäin kerryttävät 75% TOE:sta.
    // 
    // The subsidizedSegmentsWithDates array is already sorted by monthDate (oldest first)
    // and contains only periods from employment start date onwards with subsidized work.
    
    // Count subsidized months (not TOE months) from employment start date
    // Each period/segment with subsidized work counts as one subsidized month
    let subsidizedMonthCounter = 0;
    
    for (const { segment, monthDate } of subsidizedSegmentsWithDates) {
      subsidizedMonthCounter++;
      const subsidizedMonthNumber = subsidizedMonthCounter;
      
      // Store subsidized month number (1-based: first month is 1, second is 2, etc.)
      // This represents the position in the sequence of subsidized months from employment start
      segmentCumulativeTOE.set(segment.id, subsidizedMonthNumber - 1); // 0-based for comparison
      
      // Determine if this segment is before, during, or after the 10-month mark
      if (subsidizedMonthNumber > 10) {
        // After the first 10 subsidized months - all TOE from this segment accrues
        totalSubsidizedTOEAfter10Months += segment.toeSubsidizedSystem;
      } else {
        // Within first 10 subsidized months - no TOE accrues
        // (Note: subsidizedMonthNumber is 1-based, so months 1-10 are excluded)
      }
    }
    
    // Multiply by 0.75 and round down to whole number
    totalSubsidizedTOEConverted = Math.floor(totalSubsidizedTOEAfter10Months * 0.75);
  }
  
  // Iterate only segments where includeInToe === true
  for (const segment of segments) {
    if (!segment.includeInToe) continue;
    
    // toeNormalAccepted = min(segment.toeNormalSystem, segment.calendarMonths)
    const toeNormalAccepted = Math.min(segment.toeNormalSystem, segment.calendarMonths);
    
    // toeSubsidizedRaw = segment.toeSubsidizedSystem
    const toeSubsidizedRaw = segment.toeSubsidizedSystem;
    
    // Calculate subsidized TOE conversion based on rule
    let toeSubsidizedConverted = 0;
    let subsidizedPosition: number | undefined = undefined;
    
    if (rule === "LOCK_10_MONTHS_THEN_75") {
      // LOCK_10_MONTHS_THEN_75: First 10 subsidized months from employment start = 0, then 75% of remaining months
      // KORJAUS: Lasketaan palkkatukikuukausien määrää, ei TOE-kuukausien määrää
      if (segment.toeSubsidizedSystem > 0) {
        if (employmentStartDate && periods) {
          // Find this segment's position in the sorted list (from employment start)
          const segmentIndex = subsidizedSegmentsWithDates.findIndex(
            s => s.segment.id === segment.id
          );
          
          if (segmentIndex >= 0) {
            // Get subsidized month number (1-based: first subsidized month is 1, second is 2, etc.)
            // This is the position in the sequence of subsidized months from employment start date
            const subsidizedMonthNumber = segmentIndex + 1;
            
            // Store subsidized month number (for display purposes)
            // This tells us which subsidized month this is from employment start (1, 2, 3, ..., 10, 11, ...)
            subsidizedPosition = subsidizedMonthNumber;
            
            // Determine if this segment is before, during, or after the 10-month mark
            if (subsidizedMonthNumber > 10) {
              // Entirely after 10 subsidized months - all TOE from this segment accrues
              // Individual segments show 0, total is in summary
              toeSubsidizedConverted = 0;
            } else {
              // Within first 10 subsidized months - no TOE accrues
              toeSubsidizedConverted = 0;
            }
          } else {
            // If segment not found in sorted list (shouldn't happen), use 0 as fallback
            toeSubsidizedConverted = 0;
          }
        } else {
          // Fallback: if employment start date is not provided, use old logic (count from review period)
          // This should not happen in normal use, but provides backward compatibility
          const subsidizedSegmentIndex = segments.filter(s => s.includeInToe && s.toeSubsidizedSystem > 0).indexOf(segment);
          subsidizedPosition = subsidizedSegmentIndex;
          if (subsidizedSegmentIndex < 10) {
            toeSubsidizedConverted = 0;
          } else {
            // For fallback, also sum first then multiply and round down
            const subsidizedSegmentsAfter10 = segments.filter(s => s.includeInToe && s.toeSubsidizedSystem > 0).slice(10);
            const totalAfter10 = subsidizedSegmentsAfter10.reduce((sum, s) => sum + s.toeSubsidizedSystem, 0);
            const totalConverted = Math.floor(totalAfter10 * 0.75);
            if (totalAfter10 > 0) {
              const proportion = toeSubsidizedRaw / totalAfter10;
              toeSubsidizedConverted = totalConverted * proportion;
            } else {
              toeSubsidizedConverted = 0;
            }
          }
        }
      }
    } else if (exceptionSubsidy) {
      // PERCENT_75: All subsidized months are counted at 75%
      // BUT: Only count months from employment start date onwards
      // IMPORTANT: Sum all subsidized TOE months first, then multiply by 0.75, then round down
      // Individual segments show 0, total is in summary (same as LOCK_10_MONTHS_THEN_75)
      if (rule === "PERCENT_75" && employmentStartDate && periods && segment.toeSubsidizedSystem > 0) {
        // Check if this segment has periods from employment start date onwards
        const segmentMonthDate = getSegmentMonthDate(segment, periods);
        if (segmentMonthDate && segmentMonthDate >= employmentStartDate) {
          // Individual segments show 0, total is in summary (same as LOCK_10_MONTHS_THEN_75)
          toeSubsidizedConverted = 0;
        } else {
          // Segment is before employment start date - no TOE accrues
          toeSubsidizedConverted = 0;
        }
      } else {
        // For other exception subsidies or if no employment start date, use normal logic
        toeSubsidizedConverted = toeSubsidizedRaw * 0.75;
      }
    } else {
      // NO_TOE_EXTENDS: Subsidized work doesn't accrue TOE
      toeSubsidizedConverted = 0;
    }
    
    // toeTotalSegment = min(toeNormalAccepted + toeSubsidizedConverted, segment.calendarMonths)
    const toeTotalSegment = Math.min(toeNormalAccepted + toeSubsidizedConverted, segment.calendarMonths);
    
    augmentedSegments.push({
      ...segment,
      toeNormalAccepted,
      toeSubsidizedConverted,
      toeTotalSegment,
      subsidizedPosition,
    });
    
    totalToeReal += toeTotalSegment;
  }
  
  // For LOCK_10_MONTHS_THEN_75, add temporary segments to augmentedSegments
  // These are segments that were created for periods outside the review period but after employment start
  if (rule === "LOCK_10_MONTHS_THEN_75" && employmentStartDate && periods) {
    for (const { segment } of subsidizedSegmentsWithDates) {
      // Check if this is a temporary segment (not in the original segments parameter)
      if (segment.id.startsWith("temp-segment-")) {
        // Get cumulative TOE before this segment
        const cumulativeBeforeSegment = segmentCumulativeTOE.get(segment.id) ?? 0;
        const segmentTOE = segment.toeSubsidizedSystem;
        
        // Calculate subsidized TOE conversion
        let toeSubsidizedConverted = 0;
        let subsidizedPosition: number | undefined = undefined;
        
        if (cumulativeBeforeSegment >= 10) {
          // Entirely after 10 months - all TOE from this segment accrues
          // Individual segments show 0, total is in summary
          toeSubsidizedConverted = 0;
          subsidizedPosition = Math.floor(cumulativeBeforeSegment);
        } else if (cumulativeBeforeSegment + segmentTOE <= 10) {
          // Entirely within first 10 months - no TOE accrues
          toeSubsidizedConverted = 0;
          subsidizedPosition = Math.floor(cumulativeBeforeSegment);
        } else {
          // Crosses the 10-month boundary
          // Only the part after 10 months accrues TOE
          // Individual segments show 0, total is in summary
          toeSubsidizedConverted = 0;
          subsidizedPosition = Math.floor(cumulativeBeforeSegment);
        }
        
        // toeNormalAccepted = 0 for temporary segments (only subsidized work)
        const toeNormalAccepted = 0;
        
        // toeTotalSegment = min(toeNormalAccepted + toeSubsidizedConverted, segment.calendarMonths)
        const toeTotalSegment = Math.min(toeNormalAccepted + toeSubsidizedConverted, segment.calendarMonths);
        
        augmentedSegments.push({
          ...segment,
          toeNormalAccepted,
          toeSubsidizedConverted,
          toeTotalSegment,
          subsidizedPosition,
        });
        
        totalToeReal += toeTotalSegment;
      }
    }
  }
  
  // For LOCK_10_MONTHS_THEN_75, recalculate totalToeReal using the total converted subsidized TOE
  if (rule === "LOCK_10_MONTHS_THEN_75" && totalSubsidizedTOEConverted !== undefined) {
    // Sum normal TOE from all segments
    let totalNormalTOE = 0;
    for (const seg of augmentedSegments) {
      totalNormalTOE += seg.toeNormalAccepted;
    }
    // Total TOE = normal TOE + total converted subsidized TOE (not distributed)
    totalToeReal = totalNormalTOE + totalSubsidizedTOEConverted;
  }
  
  // For PERCENT_75, recalculate totalToeReal using the total converted subsidized TOE
  if (rule === "PERCENT_75" && totalSubsidizedTOEConvertedPercent75 !== undefined) {
    // Sum normal TOE from all segments
    let totalNormalTOE = 0;
    for (const seg of augmentedSegments) {
      totalNormalTOE += seg.toeNormalAccepted;
    }
    // Total TOE = normal TOE + total converted subsidized TOE (not distributed)
    totalToeReal = totalNormalTOE + totalSubsidizedTOEConvertedPercent75;
  }
  
  return {
    segments: augmentedSegments,
    totalToeReal: roundToeMonthsDown(totalToeReal),
    totalSubsidizedTOEConverted: rule === "LOCK_10_MONTHS_THEN_75" ? totalSubsidizedTOEConverted : 
                                  rule === "PERCENT_75" ? totalSubsidizedTOEConvertedPercent75 : undefined,
    totalSubsidizedTOEAfter10Months: rule === "LOCK_10_MONTHS_THEN_75" ? totalSubsidizedTOEAfter10Months : undefined,
  };
}

/**
 * Given segments in chronological order (newest first),
 * select segments up to a maximum of 28 calendar months,
 * recompute TOE and determine if we reach 12 real TOE months.
 * 
 * @param allSegments - All available segments
 * @param exceptionSubsidy - Whether this claimant has a poikkeusperuste for subsidy
 * @param maxCalendarMonths - Maximum calendar months to include (default 28)
 * @returns Period selection result with segments used and conversion result
 */
export interface ToePeriodSelectionResult extends ToeConversionResult {
  segmentsUsed: SubsidySegment[];
}

export function selectToePeriod(
  allSegments: SubsidySegment[],
  exceptionSubsidy: boolean,
  maxCalendarMonths: number = 28,
  rule?: "LOCK_10_MONTHS_THEN_75" | "PERCENT_75" | "NO_TOE_EXTENDS" | "NONE",
  periods?: MonthPeriod[],
  subsidizedEmployers?: Set<string>,
  employmentStartDate?: Date | null,
): ToePeriodSelectionResult {
  // Start from the system's original TOE period (first N segments)
  // Add segments until total calendarMonths <= maxCalendarMonths
  // For each growing set, call convertToeForSegments()
  // Stop as soon as totalToeReal >= 12 or we reached maxCalendarMonths.
  // IMPORTANT: For LOCK_10_MONTHS_THEN_75, we need to continue until we have enough TOE,
  // because the first 10 months don't accrue TOE, so we may need more calendar months.
  
  const segmentsUsed: SubsidySegment[] = [];
  let totalCalendarMonths = 0;
  let bestConversion: ToeConversionResult | null = null;
  let bestSegmentsUsed: SubsidySegment[] = [];
  
  for (const segment of allSegments) {
    if (totalCalendarMonths + segment.calendarMonths > maxCalendarMonths) {
      break;
    }
    
    segmentsUsed.push(segment);
    totalCalendarMonths += segment.calendarMonths;
    
    // Check if we've reached 12 TOE months
    const conversion = convertToeForSegments(
      segmentsUsed, 
      exceptionSubsidy, 
      rule,
      periods,
      subsidizedEmployers,
      employmentStartDate
    );
    
    // Keep track of the best result so far
    if (!bestConversion || conversion.totalToeReal > bestConversion.totalToeReal) {
      bestConversion = conversion;
      bestSegmentsUsed = [...segmentsUsed];
    }
    
    // If we've reached 12 TOE months, return immediately
    if (conversion.totalToeReal >= 12) {
      return {
        ...conversion,
        segmentsUsed,
      };
    }
  }
  
  // Return the best result we found (even if we didn't reach 12 TOE months)
  // This ensures we use all available segments up to the 28-month limit
  if (bestConversion) {
    return {
      ...bestConversion,
      segmentsUsed: bestSegmentsUsed,
    };
  }
  
  // Fallback: return result with all segments used
  const conversion = convertToeForSegments(
    segmentsUsed, 
    exceptionSubsidy, 
    rule,
    periods,
    subsidizedEmployers,
    employmentStartDate
  );
  return {
    ...conversion,
    segmentsUsed,
  };
}

/**
 * Distributes corrected TOE values back to periods.
 * 
 * @param conversionResult - Result from convertToeForSegments
 * @param periods - Original periods
 * @param calculateTOEValue - Function to calculate TOE value for a period
 * @param subsidizedEmployers - Set of subsidized employer names
 * @param segmentsUsed - Optional: segments that were used in TOE period selection (to include all periods, not just subsidized)
 * @param rule - Optional: subsidy rule (needed for LOCK_10_MONTHS_THEN_75 to show system TOE in periods)
 * @returns Array of PeriodRow with corrected TOE values
 */
export function distributeCorrectedTOEToPeriods(
  conversionResult: ToeConversionResult,
  periods: MonthPeriod[],
  calculateTOEValue: (period: MonthPeriod) => number,
  subsidizedEmployers: Set<string>,
  segmentsUsed?: SubsidySegment[], // Optional: to filter only periods in selected segments
  rule?: "LOCK_10_MONTHS_THEN_75" | "PERCENT_75" | "NO_TOE_EXTENDS" | "NONE",
  employmentStartDate?: Date | null, // Added: employment start date for PERCENT_75 filtering
  reviewPeriodStart?: Date | null, // Added: review period start for filtering
  reviewPeriodEnd?: Date | null // Added: review period end for filtering
): PeriodRow[] {
  const periodRows: PeriodRow[] = [];
  
  // Create a map of segment ID to conversion data
  const segmentMap = new Map(
    conversionResult.segments.map(seg => [seg.id, seg])
  );
  
  // If segmentsUsed is provided, create a set of period IDs that are in the selected segments
  const selectedPeriodIds = segmentsUsed 
    ? new Set(segmentsUsed.flatMap(seg => seg.periodIds))
    : null;
  
  // For LOCK_10_MONTHS_THEN_75, also include period IDs from temporary segments
  // These are periods that are after employment start but outside the review period
  const tempSegmentPeriodIds = rule === "LOCK_10_MONTHS_THEN_75"
    ? new Set(conversionResult.segments
        .filter(seg => seg.id.startsWith("temp-segment-"))
        .flatMap(seg => seg.periodIds))
    : new Set<string>();
  
  for (const period of periods) {
    const periodDate = parsePeriodDate(period.ajanjakso);
    if (!periodDate) continue;
    
    // Filter by review period: only include periods within review period
    if (reviewPeriodEnd && periodDate > reviewPeriodEnd) {
      continue; // Skip periods after review period end
    }
    if (reviewPeriodStart && periodDate < reviewPeriodStart) {
      continue; // Skip periods before review period start
    }
    
    // For PERCENT_75 rule: only include periods from employment start date onwards
    if (rule === "PERCENT_75" && employmentStartDate && periodDate < employmentStartDate) {
      continue; // Skip periods before employment start date
    }
    
    // Find the segment for this period
    const segment = conversionResult.segments.find(s => s.periodIds.includes(period.id));
    if (!segment) continue;
    
    // If segmentsUsed is provided, only include periods that are in the selected segments
    // OR in temporary segments (for LOCK_10_MONTHS_THEN_75)
    // BUT: For PERCENT_75, include all periods from employment start date onwards, regardless of segmentsUsed
    if (selectedPeriodIds && !selectedPeriodIds.has(period.id) && !tempSegmentPeriodIds.has(period.id)) {
      // For PERCENT_75 rule, don't filter by selectedPeriodIds - include all periods from employment start date onwards
      if (rule !== "PERCENT_75") {
        continue;
      }
    }
    
    // Check if period has normal work and subsidized work
    const normalRows = period.rows.filter(row => !isSubsidizedRow(row, subsidizedEmployers));
    const subsidizedRows = period.rows.filter(row => isSubsidizedRow(row, subsidizedEmployers));
    
    const hasNormalWork = normalRows.length > 0;
    const hasSubsidizedWork = subsidizedRows.length > 0;
    
    // IMPORTANT: Include all periods that are in the selected segments, not just subsidized ones
    // This ensures we show all periods that were used to reach 12 TOE months
    // If segmentsUsed is not provided, fall back to old behavior (only subsidized periods)
    if (!selectedPeriodIds && !hasSubsidizedWork) continue;
    
    // Calculate wages
    const normalWage = normalRows.reduce((sum, row) => sum + (row.palkka || 0), 0);
    const subsidizedWage = subsidizedRows.reduce((sum, row) => sum + (row.palkka || 0), 0);
    
    // Get first payment date or use period date
    const firstPaymentDate = period.rows.length > 0 
      ? period.rows[0].maksupaiva 
      : `${periodDate.getDate()}.${periodDate.getMonth() + 1}.${periodDate.getFullYear()}`;
    
    // Get subsidized employer name (first one found, or empty if no subsidized work)
    const subsidizedWorkEmployer = subsidizedRows.length > 0 && subsidizedRows[0].tyonantaja
      ? subsidizedRows[0].tyonantaja 
      : "";
    
    // Calculate corrected TOE for this period
    // Distribute the segment's corrected TOE separately for normal and subsidized work
    const periodTOE = calculateTOEValue(period);
    const segmentTotalTOE = segment.toeNormalSystem + segment.toeSubsidizedSystem;
    
    // Calculate corrected TOE separately for normal and subsidized work
    let correctedNormalTOE = 0;
    let correctedSubsidizedTOE = 0;
    
    const conversion = segmentMap.get(segment.id);
    
    // For PERCENT_75 rule, if conversion not found, show system TOE (conversion happens at total level)
    if (!conversion) {
      if (rule === "PERCENT_75" && hasSubsidizedWork && segment.toeSubsidizedSystem > 0) {
        // For PERCENT_75: Show system TOE in individual periods
        // The total converted TOE is shown in the summary (sum first, then multiply by 0.75)
        correctedSubsidizedTOE = segment.toeSubsidizedSystem;
        correctedNormalTOE = hasNormalWork ? calculateTOEValueFromSalary(normalWage) : 0;
      } else {
        // For other rules, skip if conversion not found
        continue;
      }
    } else if (segmentTotalTOE > 0) {
      // Distribute normal TOE proportionally based on segment's normal TOE
      if (segment.toeNormalSystem > 0 && hasNormalWork) {
        // If this period has normal work, distribute the segment's normal TOE
        // Each period in a segment gets its proportional share
        // Since we're creating one segment per period, the period gets the full segment value
        correctedNormalTOE = conversion.toeNormalAccepted;
      }
      
      // Distribute subsidized TOE proportionally based on segment's subsidized TOE
      if (segment.toeSubsidizedSystem > 0 && hasSubsidizedWork) {
        // For LOCK_10_MONTHS_THEN_75: Show system TOE for periods after 10 months
        // The total converted TOE is shown in the summary
        if (rule === "LOCK_10_MONTHS_THEN_75" && 
            conversionResult.totalSubsidizedTOEConverted !== undefined &&
            conversionResult.totalSubsidizedTOEAfter10Months !== undefined) {
          const subsidizedPosition = (conversion as any).subsidizedPosition;
          const segmentTOE = segment.toeSubsidizedSystem;
          
          if (subsidizedPosition !== undefined) {
            // KORJAUS: subsidizedPosition on 1-based, joten 10. kuukausi = 10, 11. kuukausi = 11
            // Ensimmäiset 10 kuukautta (1-10) eivät kerry TOE:ta, joten tarkistus pitää olla > 10
            // Jos subsidizedPosition <= 10, periodi on kokonaan ensimmäisten 10 kuukauden sisällä
            if (subsidizedPosition <= 10) {
              // Entirely within first 10 months (including month 10) - 0 TOE
              correctedSubsidizedTOE = 0;
            } else {
              // After 10 months (month 11+) - show system TOE
              correctedSubsidizedTOE = segmentTOE;
            }
          } else {
            // Fallback: if position not available, use 0
            correctedSubsidizedTOE = 0;
          }
        } else if (rule === "PERCENT_75" && 
                   conversionResult.totalSubsidizedTOEConverted !== undefined) {
          // For PERCENT_75: Show system TOE in individual periods
          // The total converted TOE is shown in the summary
          // Individual segments show system TOE, total is in summary
          correctedSubsidizedTOE = segment.toeSubsidizedSystem;
        } else {
          // For other rules, distribute normally
          correctedSubsidizedTOE = conversion.toeSubsidizedConverted;
        }
      }
    } else {
      // Fallback: if no TOE in segment, use period TOE
      correctedNormalTOE = hasNormalWork ? periodTOE : 0;
      correctedSubsidizedTOE = hasSubsidizedWork ? periodTOE : 0;
    }
    
    // Total corrected TOE for this period
    // IMPORTANT: One period can only give maximum 1.0 TOE months
    // If both normal and subsidized work exist in the same period, cap at 1.0
    const correctedTOE = Math.min(correctedNormalTOE + correctedSubsidizedTOE, 1.0);
    
    // Get subsidized position from conversion (for LOCK_10_MONTHS_THEN_75 display)
    const subsidizedPosition = conversion ? (conversion as any).subsidizedPosition : undefined;
    
    periodRows.push({
      periodId: period.id,
      periodDate,
      maksupaiva: firstPaymentDate,
      normalWorkWage: hasNormalWork ? normalWage : undefined,
      normalWorkTOE: hasNormalWork ? roundToeMonthsDown(correctedNormalTOE) : undefined,
      subsidizedWorkWage: hasSubsidizedWork ? subsidizedWage : 0, // 0 if no subsidized work
      subsidizedWorkEmployer,
      subsidizedWorkTOE: hasSubsidizedWork ? segment.toeSubsidizedSystem : 0, // Use segment's subsidized TOE, not period TOE
      correctedSubsidizedTOE: hasSubsidizedWork ? roundToeMonthsDown(correctedSubsidizedTOE) : 0,
      correctedTOE: roundToeMonthsDown(correctedTOE), // Total corrected TOE
      jakaja: period.jakaja,
      segmentType: segment.type,
      subsidizedPosition,
      originalPeriod: period,
    });
  }
  
  return periodRows;
}

/**
 * Calculates wage base from segments.
 * Wage base is calculated from ALL segments in the selected TOE period,
 * not just the 12 TOE months. Normal wages are 100%.
 * Subsidized wages are 0% or 75% depending on exceptionSubsidy.
 * For LOCK_10_MONTHS_THEN_75: Only wages from months 11+ are included (first 10 months excluded).
 * 
 * @param segments - Segments to calculate wage base from
 * @param exceptionSubsidy - Whether this claimant has a poikkeusperuste for subsidy
 * @param rule - Subsidy rule to apply (for LOCK_10_MONTHS_THEN_75 special handling)
 * @returns Wage base result
 */
export interface WageBaseResult {
  wageNormal: number;
  wageSubsidizedGross: number;
  wageAcceptedSubsidized: number;
  wageBaseTotal: number;
}

export function calcWageBaseFromSegments(
  segments: SubsidySegment[],
  exceptionSubsidy: boolean,
  rule?: "LOCK_10_MONTHS_THEN_75" | "PERCENT_75" | "NO_TOE_EXTENDS" | "NONE",
  periods?: MonthPeriod[],
  subsidizedEmployers?: Set<string>,
  employmentStartDate?: Date | null,
): WageBaseResult {
  let wageNormal = 0;
  let wageSubsidizedGross = 0;
  
  // For LOCK_10_MONTHS_THEN_75, we need to sort subsidized segments by employment start date
  let subsidizedSegmentsWithDates: Array<{ segment: SubsidySegment; monthDate: Date }> = [];
  
  if (rule === "LOCK_10_MONTHS_THEN_75" && periods && employmentStartDate) {
    // Collect subsidized segments with their month dates
    for (const segment of segments) {
      if (segment.wageSubsidizedTotal > 0) {
        const monthDate = getSegmentMonthDate(segment, periods);
        if (monthDate) {
          subsidizedSegmentsWithDates.push({ segment, monthDate });
        }
      }
    }
    
    // Sort by month date (oldest first) - this gives us chronological order from employment start
    subsidizedSegmentsWithDates.sort((a, b) => a.monthDate.getTime() - b.monthDate.getTime());
  }
  
  // Sum wageNormalTotal and wageSubsidizedTotal only from segments where includeInWage=true
  for (const segment of segments) {
    if (!segment.includeInWage) continue;
    
    wageNormal += segment.wageNormalTotal;
    
    // For LOCK_10_MONTHS_THEN_75, only include wages from months 11+ (after first 10 from employment start)
    if (rule === "LOCK_10_MONTHS_THEN_75" && segment.wageSubsidizedTotal > 0) {
      if (employmentStartDate && periods) {
        // Find this segment's position in the sorted list (from employment start)
        const segmentPosition = subsidizedSegmentsWithDates.findIndex(
          s => s.segment.id === segment.id
        );
        
        if (segmentPosition >= 10) {
          // Months 11+: include in wage base calculation
          wageSubsidizedGross += segment.wageSubsidizedTotal;
        }
        // Months 1-10: exclude from wage base calculation (do nothing)
      } else {
        // Fallback: if employment start date is not provided, use old logic
        const subsidizedSegmentIndex = segments.filter(s => s.includeInWage && s.wageSubsidizedTotal > 0).indexOf(segment);
        if (subsidizedSegmentIndex >= 10) {
          wageSubsidizedGross += segment.wageSubsidizedTotal;
        }
      }
    } else if (rule === "PERCENT_75" && employmentStartDate && periods && segment.wageSubsidizedTotal > 0) {
      // For PERCENT_75: only include wages from segments after employment start date
      const segmentMonthDate = getSegmentMonthDate(segment, periods);
      if (segmentMonthDate && segmentMonthDate >= employmentStartDate) {
        wageSubsidizedGross += segment.wageSubsidizedTotal;
      }
      // Skip segments before employment start date
    } else {
      // For other rules, include all subsidized wages
      wageSubsidizedGross += segment.wageSubsidizedTotal;
    }
  }
  
  // Apply 0% / 75% rule to subsidized wages
  const wageAcceptedSubsidized = exceptionSubsidy 
    ? wageSubsidizedGross * 0.75 
    : 0;
  
  const wageBaseTotal = wageNormal + wageAcceptedSubsidized;
  
  return {
    wageNormal,
    wageSubsidizedGross,
    wageAcceptedSubsidized,
    wageBaseTotal,
  };
}

