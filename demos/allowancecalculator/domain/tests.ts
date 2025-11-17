// ===============================
// Domain: Self-tests for allowance calculation
// ===============================

import {
  toDailyWage,
  earningsPartFromDaily,
  stepFactorByCumulativeDays,
  computePerDayReduction,
} from "./allowance";
import { DAILY_BASE, SPLIT_POINT_MONTH } from "../constants";
import { businessDaysBetween, clamp } from "../utils";

// (Lightweight) self-tests – run once
export function runSelfTests(): void {
  try {
    const pDays = 21.5;

    // 1) Daily wage and earnings part scale correctly
    const d1 = toDailyWage(2573, pDays);
    const ep1 = earningsPartFromDaily(d1, SPLIT_POINT_MONTH, pDays);
    const d2 = toDailyWage(3700, pDays);
    const ep2 = earningsPartFromDaily(d2, SPLIT_POINT_MONTH, pDays);
    if (!(ep2 > ep1)) console.warn("[TEST] Monotonicity not met");

    // 2) Adjustment direction: larger benefit income -> smaller adjusted per day
    const full = DAILY_BASE + ep1;
    const redLow = (200 * 0.5) / pDays;
    const redHigh = (1000 * 0.5) / pDays;
    const adjLow = clamp(full - redLow, 0, full);
    const adjHigh = clamp(full - redHigh, 0, full);
    if (!(adjHigh <= adjLow)) console.warn("[TEST] Adjustment direction doesn't match");

    // 3) Step reduction: average within period
    function avgFactor(priorPaid: number, days: number): number {
      let s = 0;
      for (let i = 0; i < days; i++) {
        s += stepFactorByCumulativeDays(priorPaid + i + 1).factor;
      }
      return days ? s / days : 1;
    }
    const avg1 = avgFactor(39, 2); // 40 and 41 -> 0.8
    if (Math.abs(avg1 - 0.8) > 1e-9) console.warn("[TEST] Step 40+ average wrong", avg1);
    const avg2 = avgFactor(169, 2); // 170 and 171 -> 0.75
    if (Math.abs(avg2 - 0.75) > 1e-9) console.warn("[TEST] Step 170+ average wrong", avg2);

    // 4) Business day counter: Tue -> Thu (2 days)
    const tue = new Date("2025-09-02"); // Tue
    const thu = new Date("2025-09-04"); // Thu
    const bd = businessDaysBetween(tue.toISOString().slice(0, 10), thu.toISOString().slice(0, 10));
    if (bd !== 2) console.warn("[TEST] businessDaysBetween Tue->Thu should be 2, now", bd);

    // 5) Business day counter: Sat -> Mon (0 days, because Sat/Sun don't count)
    const sat = new Date("2025-09-06");
    const mon = new Date("2025-09-08");
    const bd2 = businessDaysBetween(sat.toISOString().slice(0, 10), mon.toISOString().slice(0, 10));
    if (bd2 !== 0) console.warn("[TEST] Sat->Mon should be 0, now", bd2);

    // 6) Step thresholds directly: 0 -> 1.0, 40 -> 0.8, 170 -> 0.75
    const f0 = stepFactorByCumulativeDays(0).factor;
    const f40 = stepFactorByCumulativeDays(40).factor;
    const f170 = stepFactorByCumulativeDays(170).factor;
    if (f0 !== 1 || f40 !== 0.8 || f170 !== 0.75) console.warn("[TEST] Step thresholds unexpected", { f0, f40, f170 });

    // 7) Adjusted limits work (not negative nor exceeding full)
    const fullDailyTest = 60;
    const bigReduction = 100; // large deduction -> 0
    const smallReduction = 5; // small deduction -> < full
    const adj1 = clamp(fullDailyTest - bigReduction, 0, fullDailyTest);
    const adj2 = clamp(fullDailyTest - smallReduction, 0, fullDailyTest);
    if (adj1 !== 0 || !(adj2 > 0 && adj2 < fullDailyTest)) console.warn("[TEST] Adjusted limits don't hold");

    // 8) Empty adjustment period -> perDayReduction = 0
    const redNone = computePerDayReduction(1000, "");
    if (redNone !== 0) console.warn("[TEST] Empty period -> should be 0, now", redNone);
  } catch (e) {
    console.error("[TEST] Error in tests", e);
  }
}

