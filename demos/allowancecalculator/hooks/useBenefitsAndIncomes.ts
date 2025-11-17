// ===============================
// Hook: Benefits and incomes management
// ===============================

import { useState } from "react";
import type { BenefitRow, IncomeRow } from "../types";

export default function useBenefitsAndIncomes() {
  const [benefits, setBenefits] = useState<BenefitRow[]>([]);
  const [incomes, setIncomes] = useState<IncomeRow[]>([]);

  // Benefits management
  const addBenefitRow = () => {
    const n = benefits.length + 1;
    setBenefits((prev) => [
      ...prev,
      { id: `b${n}`, name: "Vanhempainpäiväraha", amount: 0, protectedAmount: 0 },
    ]);
  };

  const removeBenefitRow = (id: string) => {
    setBenefits((prev) => prev.filter((b) => b.id !== id));
  };

  // Incomes management
  const addIncomeRow = () => {
    const n = incomes.length + 1;
    setIncomes((prev) => [...prev, { id: `i${n}`, type: "parttime", amount: 0 }]);
  };

  const removeIncomeRow = (id: string) => {
    setIncomes((prev) => prev.filter((i) => i.id !== id));
  };

  return {
    benefits,
    setBenefits,
    incomes,
    setIncomes,
    addBenefitRow,
    removeBenefitRow,
    addIncomeRow,
    removeIncomeRow,
  };
}

