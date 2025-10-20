"use client";

import { toast } from "sonner";
import type { IncomeRow, MonthPeriod } from "../types";

export default function useEuroTOEHandlers(setPeriods: React.Dispatch<React.SetStateAction<MonthPeriod[]>>) {
  const restoreIncomeType = (row: IncomeRow) => {
    setPeriods(prev => prev.map(period => ({
      ...period,
      rows: period.rows.map(r => (r.id === row.id ? { ...r, huom: undefined } : r)),
    })));
    toast.success("Tulolaji palautettu", { description: `${row.tulolaji} on nyt aktiivinen.` });
  };

  const deleteIncomeType = (row: IncomeRow) => {
    setPeriods(prev => prev.map(period => ({
      ...period,
      rows: period.rows.map(r => (r.id === row.id ? { ...r, huom: `Poistettu (${new Date().toLocaleDateString('fi-FI')})` } : r)),
    })));
    toast.success("Tulolaji poistettu", { description: `${row.tulolaji} on poistettu laskennasta.` });
  };

  const includeIncomeInCalculation = (row: IncomeRow) => {
    setPeriods(prev => prev.map(period => ({
      ...period,
      rows: period.rows.map(r => (r.id === row.id ? { ...r, huom: `Huomioitu laskennassa (${new Date().toLocaleDateString('fi-FI')})` } : r)),
    })));
    toast.success("Tulo huomioitu laskennassa", { description: `${row.tulolaji} vaikuttaa nyt päivärahan laskentaan.` });
  };

  return { restoreIncomeType, deleteIncomeType, includeIncomeInCalculation };
}


