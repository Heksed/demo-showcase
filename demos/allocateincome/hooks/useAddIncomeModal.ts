"use client";

import { useMemo, useState } from "react";
import type { IncomeRow, MonthPeriod } from "../types";
import { MOCK_EMPLOYMENT_RELATIONSHIPS } from "../mockData";
import { parseFinnishDate, getFinnishMonthName } from "../utils";
import { toast } from "sonner";

export default function useAddIncomeModal(setPeriods: React.Dispatch<React.SetStateAction<MonthPeriod[]>>) {
  const [open, setOpen] = useState(false);
  const [selectedEmployer, setSelectedEmployer] = useState("");
  const [employmentStartDate, setEmploymentStartDate] = useState("");
  const [employmentEndDate, setEmploymentEndDate] = useState("");
  const [selectedEmploymentIds, setSelectedEmploymentIds] = useState<string[]>([]);
  const [paymentDate, setPaymentDate] = useState("");
  const [incomeType, setIncomeType] = useState("Tulospalkka");
  const [salaryAmount, setSalaryAmount] = useState("");
  const [earningStartDate, setEarningStartDate] = useState("");
  const [earningEndDate, setEarningEndDate] = useState("");

  const toggleEmploymentSelection = (id: string) => {
    setSelectedEmploymentIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const filteredEmployments = useMemo(() => {
    return MOCK_EMPLOYMENT_RELATIONSHIPS.filter(emp => {
      if (selectedEmployer && emp.employer !== selectedEmployer) return false;
      const inputStart = parseFinnishDate(employmentStartDate);
      const empStart = parseFinnishDate(emp.startDate);
      const inputEnd = parseFinnishDate(employmentEndDate);
      const empEnd = parseFinnishDate(emp.endDate);
      if (employmentStartDate && inputStart && empStart && inputStart.getTime() !== empStart.getTime()) return false;
      if (employmentEndDate && inputEnd && empEnd && inputEnd.getTime() !== empEnd.getTime()) return false;
      return true;
    });
  }, [selectedEmployer, employmentStartDate, employmentEndDate]);

  const handleAddIncome = () => {
    if (!paymentDate || !incomeType || !salaryAmount || selectedEmploymentIds.length === 0) {
      toast.error("Täytä kaikki pakolliset kentät");
      return;
    }
    const amount = parseFloat(salaryAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Syötä kelvollinen summa");
      return;
    }

    const newRow: IncomeRow = {
      id: `new-${Date.now()}`,
      maksupaiva: paymentDate,
      tulolaji: incomeType,
      palkka: amount,
      alkuperainenTulo: amount,
      ansaintaAika: earningStartDate && earningEndDate ? `${earningStartDate} - ${earningEndDate}` : "",
      tyonantaja: selectedEmployer || "Espoon kaupunki",
    };

    setPeriods(prev => {
      const [day, month, year] = paymentDate.split('.');
      const monthName = getFinnishMonthName(parseInt(month));
      const targetPeriodKey = `${year} ${monthName}`;
      return prev.map(period => period.ajanjakso === targetPeriodKey
        ? { ...period, rows: [...period.rows, newRow], palkka: period.palkka + amount }
        : period);
    });

    setSelectedEmployer("");
    setEmploymentStartDate("");
    setEmploymentEndDate("");
    setSelectedEmploymentIds([]);
    setPaymentDate("");
    setIncomeType("Tulospalkka");
    setSalaryAmount("");
    setEarningStartDate("");
    setEarningEndDate("");
    setOpen(false);
    toast.success("Tulotieto lisätty onnistuneesti");
  };

  return {
    open, setOpen,
    selectedEmployer, setSelectedEmployer,
    employmentStartDate, setEmploymentStartDate,
    employmentEndDate, setEmploymentEndDate,
    selectedEmploymentIds, toggleEmploymentSelection,
    paymentDate, setPaymentDate,
    incomeType, setIncomeType,
    salaryAmount, setSalaryAmount,
    earningStartDate, setEarningStartDate,
    earningEndDate, setEarningEndDate,
    filteredEmployments,
    handleAddIncome,
  };
}


