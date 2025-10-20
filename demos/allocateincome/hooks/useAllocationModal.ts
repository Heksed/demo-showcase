"use client";

import { useEffect, useMemo, useState } from "react";
import type { AllocationContext, AllocationMethod, Direction, DistributionType, IncomeRow, MonthPeriod, MonthSplit } from "../types";
import { MOCK_EMPLOYMENT } from "../mockData";
import { parseDate, formatDateISO, isoToFI, splitByMonths, distributeByDays, distributeEqualMonths, roundToCents } from "../utils";
import { toast } from "sonner";

type Params = {
  setPeriods: React.Dispatch<React.SetStateAction<MonthPeriod[]>>;
  getFinnishMonthName: (monthNum: number) => string;
};

export default function useAllocationModal({ setPeriods, getFinnishMonthName }: Params) {
  const [modalOpen, setModalOpen] = useState(false);
  const [allocationContext, setAllocationContext] = useState<AllocationContext | null>(null);
  const [viewMode, setViewMode] = useState(false);

  const [allocationMethod, setAllocationMethod] = useState<AllocationMethod>("period");
  const [direction, setDirection] = useState<Direction>("backward");
  const [distributionType, setDistributionType] = useState<DistributionType>("byDays");
  const [startDate, setStartDate] = useState("20.1.2025");
  const [endDate, setEndDate] = useState("10.2.2025");
  const [monthCount, setMonthCount] = useState(2);
  const [manualAmounts, setManualAmounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (allocationMethod === "employment") {
      setStartDate(MOCK_EMPLOYMENT.startDate);
      setEndDate(MOCK_EMPLOYMENT.endDate);
      setDirection("backward");
    }
  }, [allocationMethod]);

  function generateMonthsFromEmployment(): Array<{ year: number; month: number }> {
    const start = parseDate(MOCK_EMPLOYMENT.startDate);
    const end = parseDate(MOCK_EMPLOYMENT.endDate);
    if (!start || !end) return [];
    const months: Array<{ year: number; month: number }> = [];
    let currentYear = start.getFullYear();
    let currentMonth = start.getMonth() + 1;
    const endYear = end.getFullYear();
    const endMonth = end.getMonth() + 1;
    while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
      months.push({ year: currentYear, month: currentMonth });
      currentMonth++;
      if (currentMonth > 12) { currentMonth = 1; currentYear++; }
    }
    return months.reverse();
  }

  function generateMonthsFromPayDate(payDate: string, count: number, dir: Direction): Array<{ year: number; month: number }> {
    const date = parseDate(payDate);
    const payYear = date.getFullYear();
    const payMonth = date.getMonth() + 1;
    const months: Array<{ year: number; month: number }> = [];
    for (let i = 0; i < count; i++) {
      let targetMonth = payMonth;
      let targetYear = payYear;
      if (dir === "forward") targetMonth += i; else targetMonth -= i;
      while (targetMonth > 12) { targetMonth -= 12; targetYear++; }
      while (targetMonth < 1) { targetMonth += 12; targetYear--; }
      months.push({ year: targetYear, month: targetMonth });
    }
    months.sort((a, b) => (a.year - b.year) || (a.month - b.month));
    return months;
  }

  const previewSplits = useMemo<MonthSplit[]>(() => {
    if (!allocationContext) return [];
    try {
      if (distributionType === "byDays" || distributionType === "equalMonths") {
        const start = parseDate(startDate);
        const end = parseDate(endDate);
        if (start > end) return [];
        const monthSplits = splitByMonths(start, end);
        if (monthSplits.length === 0) return [];
        if (allocationContext.mode === "single") {
          return distributionType === "byDays"
            ? distributeByDays(allocationContext.totalAmount, monthSplits, direction)
            : distributeEqualMonths(allocationContext.totalAmount, monthSplits, direction);
        } else {
          const all: MonthSplit[] = [];
          for (const row of allocationContext.sourceRows) {
            const rowAmount = row.alkuperainenTulo > 0 ? row.alkuperainenTulo : row.palkka;
            const splits = distributionType === "byDays"
              ? distributeByDays(rowAmount, monthSplits, direction)
              : distributeEqualMonths(rowAmount, monthSplits, direction);
            splits.forEach(s => { (s as any).incomeType = row.tulolaji; });
            all.push(...splits);
          }
          return all;
        }
      } else if (distributionType === "manual") {
        const months = allocationMethod === "employment"
          ? generateMonthsFromEmployment()
          : generateMonthsFromPayDate(allocationContext.payDate, monthCount, direction);
        if (allocationContext.mode === "single") {
          return months.map(m => {
            const first = new Date(m.year, m.month - 1, 1);
            const last = new Date(m.year, m.month, 0);
            const key = `${m.year}-${m.month}`;
            return { year: m.year, month: m.month, earningStart: formatDateISO(first), earningEnd: formatDateISO(last), amount: manualAmounts[key] ?? 0 };
          });
        } else {
          const all: MonthSplit[] = [];
          for (const row of allocationContext.sourceRows) {
            for (const m of months) {
              const first = new Date(m.year, m.month - 1, 1);
              const last = new Date(m.year, m.month, 0);
              const key = `${row.id}-${m.year}-${m.month}`;
              all.push({ year: m.year, month: m.month, earningStart: formatDateISO(first), earningEnd: formatDateISO(last), amount: manualAmounts[key] ?? 0, incomeType: row.tulolaji });
            }
          }
          return all;
        }
      }
    } catch (e) {
      console.error("Error calculating preview:", e);
    }
    return [];
  }, [allocationContext, distributionType, direction, startDate, endDate, monthCount, manualAmounts]);

  const validation = useMemo(() => {
    if (!allocationContext) return { valid: false, message: "" };
    if (allocationContext.totalAmount <= 0) return { valid: false, message: "Summa on oltava suurempi kuin 0" };
    if (distributionType === "byDays" || distributionType === "equalMonths") {
      const start = parseDate(startDate);
      const end = parseDate(endDate);
      if (start > end) return { valid: false, message: "Alkupäivä ei voi olla loppupäivän jälkeen" };
      const monthSplits = splitByMonths(start, end);
      if (monthSplits.length === 0) return { valid: false, message: "Vähintään yksi kuukausi vaaditaan" };
    }
    if (distributionType === "manual") {
      const previewTotal = previewSplits.reduce((s, x) => s + x.amount, 0);
      const diff = Math.abs(previewTotal - (allocationContext?.totalAmount ?? 0));
      if (diff > 0.01) return { valid: false, message: `Summa ei täsmää` };
    }
    return { valid: true, message: "Summa täsmää" };
  }, [allocationContext, distributionType, startDate, endDate, previewSplits]);

  useEffect(() => {
    if (distributionType === "manual" && allocationContext) {
      const months = generateMonthsFromPayDate(allocationContext.payDate, monthCount, direction);
      const newAmounts: Record<string, number> = {};
      if (allocationContext.mode === "single") {
        const equalAmount = roundToCents(allocationContext.totalAmount / monthCount);
        months.forEach(m => { const key = `${m.year}-${m.month}`; newAmounts[key] = manualAmounts[key] ?? equalAmount; });
      } else {
        for (const row of allocationContext.sourceRows) {
          const rowAmount = row.alkuperainenTulo > 0 ? row.alkuperainenTulo : row.palkka;
          const equalAmount = roundToCents(rowAmount / monthCount);
          months.forEach(m => { const key = `${row.id}-${m.year}-${m.month}`; newAmounts[key] = manualAmounts[key] ?? equalAmount; });
        }
      }
      setManualAmounts(newAmounts);
    }
  }, [distributionType, monthCount, direction, allocationContext]);

  const applyAllocation = () => {
    if (!allocationContext || !validation.valid) return;
    const allocationData = {
      id: `allocation-${Date.now()}`,
      originalContext: allocationContext,
      allocationMethod,
      startDate,
      endDate,
      distributionType,
      direction,
      monthCount,
      previewSplits: [...previewSplits],
      timestamp: new Date().toISOString(),
    };
    let allocationMethodDesc = "";
    if (allocationMethod === "employment") {
      allocationMethodDesc = `Palvelussuhteen kesto / ${distributionType === "byDays" ? "Päivien mukaan" : distributionType === "equalMonths" ? "Tasan kuukausille" : "Manuaalinen"} (${MOCK_EMPLOYMENT.startDate}–${MOCK_EMPLOYMENT.endDate})`;
    } else {
      if (distributionType === "byDays") allocationMethodDesc = `(${startDate}–${endDate})`;
      else if (distributionType === "equalMonths") allocationMethodDesc = ` (${startDate}–${endDate})`;
      else allocationMethodDesc = ` (N=${monthCount})`;
    }
    const newRows: IncomeRow[] = previewSplits.map((split, idx) => {
      const monthStr = `${split.month}/${split.year}`;
      const earningPeriod = `${isoToFI(split.earningStart)} - ${isoToFI(split.earningEnd)}`;
      const sourceRow = allocationContext.mode === "single"
        ? allocationContext.sourceRows[0]
        : allocationContext.sourceRows.find(r => r.tulolaji === (split as any).incomeType) || allocationContext.sourceRows[0];
      return {
        id: `${sourceRow.id}-allocated-${idx}-${Date.now()}`,
        maksupaiva: allocationContext.payDate,
        tulolaji: (split as any).incomeType || sourceRow.tulolaji,
        palkka: roundToCents(split.amount),
        alkuperainenTulo: sourceRow.alkuperainenTulo > 0 ? sourceRow.alkuperainenTulo : sourceRow.palkka,
        ansaintaAika: earningPeriod,
        kohdistusTOE: allocationMethodDesc,
        tyonantaja: sourceRow.tyonantaja,
        huom: `Kohdistettu ${monthStr}`,
        allocationData,
      };
    });

    setPeriods(prev => {
      const rowsToRemove = new Set(allocationContext.sourceRows.map(r => r.id));
      let updatedPeriods = prev.map(period => ({ ...period, rows: period.rows.filter(r => !rowsToRemove.has(r.id)) }));
      for (const newRow of newRows) {
        const [startDateStr] = newRow.ansaintaAika.split(' - ');
        const [day, month, year] = startDateStr.split('.');
        const monthName = getFinnishMonthName(parseInt(month));
        const targetPeriodKey = `${year} ${monthName}`;
        const idx = updatedPeriods.findIndex(p => p.ajanjakso === targetPeriodKey);
        if (idx !== -1) {
          updatedPeriods[idx] = { ...updatedPeriods[idx], rows: [...updatedPeriods[idx].rows, newRow] };
        }
      }
      return updatedPeriods.map(period => ({ ...period, palkka: period.rows.reduce((s, r) => s + r.palkka, 0) }));
    });

    const count = newRows.length;
    toast.success(`Kohdistus suoritettu`, { description: `${count} ${count === 1 ? "rivi" : "riviä"} luotu onnistuneesti.` });
    setModalOpen(false);
  };

  const removeAllocation = () => {
    if (!allocationContext) return;
    setPeriods(prev => prev.map(period => ({ ...period, rows: period.rows.filter(row => !(row.huom?.startsWith('Kohdistettu'))) })));
    if (allocationContext.sourceRows) {
      setPeriods(prev => {
        const updated = [...prev];
        allocationContext.sourceRows.forEach(sourceRow => {
          const targetPeriod = updated.find(p => p.rows.some(r => r.maksupaiva === sourceRow.maksupaiva));
          if (targetPeriod) targetPeriod.rows.push({ ...sourceRow, alkuperainenTulo: 0 });
        });
        return updated;
      });
    }
  };

  const aggregatedByMonth = useMemo(() => {
    if (allocationContext?.mode !== "batch") return [] as any[];
    const byMonth = new Map<string, { year: number; month: number; earningStart: string; earningEnd: string; total: number; items: MonthSplit[] }>();
    for (const split of previewSplits) {
      const key = `${split.year}-${split.month}`;
      if (!byMonth.has(key)) byMonth.set(key, { year: split.year, month: split.month, earningStart: split.earningStart, earningEnd: split.earningEnd, total: 0, items: [] });
      const entry = byMonth.get(key)!; entry.total += split.amount; entry.items.push(split);
    }
    return Array.from(byMonth.values()).sort((a, b) => (a.year - b.year) || (a.month - b.month));
  }, [allocationContext, previewSplits]);

  return {
    modalOpen, setModalOpen,
    allocationContext, setAllocationContext,
    viewMode, setViewMode,
    allocationMethod, setAllocationMethod,
    direction, setDirection,
    distributionType, setDistributionType,
    startDate, setStartDate,
    endDate, setEndDate,
    monthCount, setMonthCount,
    manualAmounts, setManualAmounts,
    previewSplits,
    validation,
    aggregatedByMonth,
    applyAllocation,
    removeAllocation,
    generateMonthsFromEmployment,
    generateMonthsFromPayDate,
  };
}


