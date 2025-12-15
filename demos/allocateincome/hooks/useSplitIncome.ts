"use client";

import { useState } from "react";
import type { IncomeRow, MonthPeriod } from "../types";
import { getCurrentTimestamp } from "../utils";

export default function useSplitIncome(setPeriods: React.Dispatch<React.SetStateAction<MonthPeriod[]>>) {
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [splitContext, setSplitContext] = useState<{ periodId: string; rowId: string } | null>(null);
  const [splitMode, setSplitMode] = useState<'amount' | 'percent'>('amount');
  const [splitTargetType, setSplitTargetType] = useState<string>('');
  const [splitValue, setSplitValue] = useState<number>(0);

  const openSplitModal = (periodId: string, rowId: string) => {
    setSplitContext({ periodId, rowId });
    setSplitMode('amount');
    setSplitTargetType('');
    setSplitValue(0);
    setSplitModalOpen(true);
  };

  const closeSplitModal = () => {
    setSplitModalOpen(false);
    setSplitContext(null);
    setSplitMode('amount');
    setSplitTargetType('');
    setSplitValue(0);
  };

  const makeId = () => Math.random().toString(36).slice(2, 10);

  const applySplit = () => {
    if (!splitContext) return;

    setPeriods(prev => prev.map(period => {
      if (period.id !== splitContext.periodId) return period;

      const original = period.rows.find(r => r.id === splitContext.rowId);
      if (!original) return period;

      const originalAmount = Number(original.palkka || 0);
      const splitAmount = splitMode === 'amount'
        ? Number(splitValue || 0)
        : Math.round((originalAmount * (Number(splitValue || 0) / 100)) * 100) / 100;

      if (!splitTargetType || splitAmount <= 0 || splitAmount >= originalAmount) {
        return period;
      }

      const childRow: IncomeRow = {
        ...original,
        id: `split-${makeId()}`,
        palkka: splitAmount,
        tulolaji: splitTargetType,
        parentId: original.id,
        huom: (original.huom ? String(original.huom) + ' ' : '') + '(jaettu osuus)',
        dataSource: 'manual',
        modifiedAt: getCurrentTimestamp(),
      };

      const updatedOriginal: IncomeRow = {
        ...original,
        palkka: Math.round((originalAmount - splitAmount) * 100) / 100,
        dataSource: 'manual',
        modifiedAt: getCurrentTimestamp(),
      };

      const newRows: IncomeRow[] = [];
      for (const r of period.rows) {
        if (r.id === original.id) newRows.push(updatedOriginal, childRow); else newRows.push(r);
      }

      const newPalkka = newRows.reduce((s, r) => s + (Number(r.palkka) || 0), 0);

      return { ...period, rows: newRows, palkka: newPalkka };
    }));

    closeSplitModal();
  };

  return {
    splitModalOpen, setSplitModalOpen,
    splitContext, setSplitContext,
    splitMode, setSplitMode,
    splitTargetType, setSplitTargetType,
    splitValue, setSplitValue,
    openSplitModal, closeSplitModal, applySplit,
  };
}


