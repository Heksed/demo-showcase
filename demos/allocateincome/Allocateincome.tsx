"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, ChevronRight, Calendar as CalendarIcon, MoreVertical, AlertCircle, CheckCircle2, RotateCcw, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

// ============================================================================
// Allocate Income – Income allocation demo
// ============================================================================

// --- Types ---
type IncomeRow = {
  id: string;
  huom?: string;
  maksupaiva: string; // payDate
  tulolaji: string; // incomeType
  palkka: number; // salary
  alkuperainenTulo: number; // originalIncome
  ansaintaAika: string; // earningPeriod
  kohdistusTOE?: string; // allocationTOE
  tyonantaja: string; // employer
  allocationData?: any; // Tallenna kohdistuksen tiedot
};

type MonthPeriod = {
  id: string;
  ajanjakso: string;
  toe: number;
  jakaja: number;
  palkka: number;
  tyonantajat: string;
  pidennettavatJaksot: number;
  rows: IncomeRow[];
};

type AllocationMode = "single" | "batch";
type AllocationMethod = "employment" | "period"; // Employment duration or custom period
type Direction = "forward" | "backward";
type DistributionType = "byDays" | "equalMonths" | "manual";

type AllocationContext = {
  mode: AllocationMode;
  payDate: string;
  sourceRows: IncomeRow[];
  totalAmount: number;
};

type MonthSplit = {
  year: number;
  month: number; // 1-12
  earningStart: string; // YYYY-MM-DD
  earningEnd: string; // YYYY-MM-DD
  amount: number;
  incomeType?: string; // for batch mode
};

// --- Mock Data ---

// Mock employment relationship (palvelussuhde)
const MOCK_EMPLOYMENT = {
  startDate: "1.10.2024",
  endDate: "31.12.2024",
  employer: "Nokia Oyj",
};

// Mock employment relationships for the add income modal
const MOCK_EMPLOYMENT_RELATIONSHIPS = [
  {
    id: "emp-1",
    employer: "Espoon kaupunki",
    description: "XXXXX",
    startDate: "15.10.2024",
    endDate: "11.11.2024",
  },
  {
    id: "emp-2",
    employer: "Espoon kaupunki",
    description: "XXXXXXX",
    startDate: "PP.KK.VVVV",
    endDate: "PP.KK.VVVV",
  },
  {
    id: "emp-3",
    employer: "Espoon kaupunki",
    description: "XXXXX",
    startDate: "PP.KK.VVVV",
    endDate: "PP.KK.VVVV",
  },
  {
    id: "emp-4",
    employer: "Espoon kaupunki",
    description: "XXXXXXX",
    startDate: "PP.KK.VVVV",
    endDate: "PP.KK.VVVV",
  },
  {
    id: "emp-5",
    employer: "Espoon kaupunki",
    description: "",
    startDate: "PP.KK.VVVV",
    endDate: "PP.KK.VVVV",
  },
];

// Income types for the dropdown
const INCOME_TYPES = [
  "Tulospalkka",
  "Aikapalkka",
  "Lomaraha",
  "Vuosilomakorvaus",
  "Työkorvaus",
  "Jokin etuus",
  "Aloitepalkkio",
  "Kilometrikorvaus",
];

// Income types that don't affect unemployment benefit calculation
const NON_BENEFIT_AFFECTING_INCOME_TYPES = [
  "Kokouspalkkio",
  "Luentopalkkio",
];

const MOCK_INCOME_ROWS: IncomeRow[] = [
  {
    id: "1-1",
    maksupaiva: "8.1.2026",
    tulolaji: "Aikapalkka",
    palkka: 2200,
    alkuperainenTulo: 0,
    ansaintaAika: "1.12.2025 - 31.12.2025",
    tyonantaja: "Nokia Oyj",
  },
  {
    id: "1-2",
    maksupaiva: "8.1.2026",
    tulolaji: "Lomaraha",
    palkka: 800,
    alkuperainenTulo: 0,
    ansaintaAika: "",
    tyonantaja: "Nokia Oyj",
  },
  {
    id: "1-3",
    maksupaiva: "8.1.2026",
    tulolaji: "Tulospalkka",
    palkka: 0,
    alkuperainenTulo: 0,
    ansaintaAika: "1.1.2025 - 31.12.2025",
    kohdistusTOE: "1.1.2025 - 31.12.2025",
    tyonantaja: "Nokia Oyj",
  },
 
  {
    id: "1-5",
    maksupaiva: "8.1.2026",
    tulolaji: "Jokin etuus",
    palkka: 100,
    alkuperainenTulo: 0,
    ansaintaAika: "",
    tyonantaja: "Nokia Oyj",
  },
  {
    id: "1-6",
    maksupaiva: "15.1.2026",
    tulolaji: "Aikapalkka",
    palkka: 200,
    alkuperainenTulo: 0,
    ansaintaAika: "",
    tyonantaja: "Posti Oyj",
  },
  {
    id: "1-7",
    maksupaiva: "15.1.2026",
    tulolaji: "Lomaraha",
    palkka: 500,
    alkuperainenTulo: 0,
    ansaintaAika: "",
    tyonantaja: "Posti Oyj",
  },
  {
    id: "1-8",
    maksupaiva: "15.1.2026",
    tulolaji: "Työkorvaus",
    palkka: 300,
    alkuperainenTulo: 0,
    ansaintaAika: "",
    tyonantaja: "Posti Oyj",
  },
  {
    id: "1-9",
    maksupaiva: "8.1.2026",
    tulolaji: "Kokouspalkkio",
    palkka: 500,
    alkuperainenTulo: 0,
    ansaintaAika: "",
    tyonantaja: "Nokia Oyj",
  },
  {
    id: "1-10",
    maksupaiva: "8.1.2026",
    tulolaji: "Luentopalkkio",
    palkka: 150,
    alkuperainenTulo: 0,
    ansaintaAika: "",
    tyonantaja: "Nokia Oyj",
  },
];

// Additional rows for other months
const MOCK_ROWS_2025_12: IncomeRow[] = [
  {
    id: "12-1",
    maksupaiva: "10.12.2025",
    tulolaji: "Aikapalkka",
    palkka: 2100,
    alkuperainenTulo: 0,
    ansaintaAika: "1.11.2025 - 30.11.2025",
    tyonantaja: "Nokia Oyj",
  },
  {
    id: "12-2",
    maksupaiva: "10.12.2025",
    tulolaji: "Lomaraha",
    palkka: 600,
    alkuperainenTulo: 0,
    ansaintaAika: "",
    tyonantaja: "Nokia Oyj",
  },
];

const MOCK_ROWS_2025_11: IncomeRow[] = [
  {
    id: "11-1",
    maksupaiva: "10.11.2025",
    tulolaji: "Aikapalkka",
    palkka: 2000,
    alkuperainenTulo: 0,
    ansaintaAika: "1.10.2025 - 31.10.2025",
    tyonantaja: "Nokia Oyj",
  },
];

const MOCK_ROWS_2025_03: IncomeRow[] = [
  {
    id: "03-1",
    maksupaiva: "10.3.2025",
    tulolaji: "Aikapalkka",
    palkka: 1800,
    alkuperainenTulo: 0,
    ansaintaAika: "1.2.2025 - 28.2.2025",
    tyonantaja: "Nokia Oyj",
  },
];

const MOCK_ROWS_2025_02: IncomeRow[] = [
  {
    id: "02-1",
    maksupaiva: "10.2.2025",
    tulolaji: "Aikapalkka",
    palkka: 1900,
    alkuperainenTulo: 0,
    ansaintaAika: "1.1.2025 - 31.1.2025",
    tyonantaja: "Nokia Oyj",
  },
];

const MOCK_ROWS_2025_01: IncomeRow[] = [
  {
    id: "01-1",
    maksupaiva: "10.1.2025",
    tulolaji: "Aikapalkka",
    palkka: 2050,
    alkuperainenTulo: 0,
    ansaintaAika: "1.12.2024 - 31.12.2024",
    tyonantaja: "Nokia Oyj",
  },
  {
    id: "01-2",
    maksupaiva: "10.1.2025",
    tulolaji: "Lomaraha",
    palkka: 400,
    alkuperainenTulo: 0,
    ansaintaAika: "",
    tyonantaja: "Nokia Oyj",
  },
];

const MOCK_PERIODS: MonthPeriod[] = [
  {
    id: "2026-01",
    ajanjakso: "2026 Tammikuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 4000,
    tyonantajat: "Nokia Oyj, Posti Oyj",
    pidennettavatJaksot: 0,
    rows: MOCK_INCOME_ROWS,
  },
  {
    id: "2025-12",
    ajanjakso: "2025 Joulukuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 2700,
    tyonantajat: "Nokia Oyj",
    pidennettavatJaksot: 5,
    rows: MOCK_ROWS_2025_12,
  },
  {
    id: "2025-11",
    ajanjakso: "2025 Marraskuu",
    toe: 0.5,
    jakaja: 21.5,
    palkka: 2000,
    tyonantajat: "Nokia Oyj",
    pidennettavatJaksot: 0,
    rows: MOCK_ROWS_2025_11,
  },
  {
    id: "2025-10",
    ajanjakso: "2025 Lokakuu",
    toe: 0,
    jakaja: 0,
    palkka: 200,
    tyonantajat: "Nokia Oyj, Posti Oyj",
    pidennettavatJaksot: 0,
    rows: [],
  },
  {
    id: "2025-09",
    ajanjakso: "2025 Syyskuu",
    toe: 0,
    jakaja: 21.5,
    palkka: 0,
    tyonantajat: "",
    pidennettavatJaksot: 0,
    rows: [],
  },
  {
    id: "2025-08",
    ajanjakso: "2025 Elokuu",
    toe: 0,
    jakaja: 21.5,
    palkka: 0,
    tyonantajat: "",
    pidennettavatJaksot: 0,
    rows: [],
  },
  {
    id: "2025-07",
    ajanjakso: "2025 Heinäkuu",
    toe: 0,
    jakaja: 21.5,
    palkka: 0,
    tyonantajat: "",
    pidennettavatJaksot: 0,
    rows: [],
  },
  {
    id: "2025-06",
    ajanjakso: "2025 Kesäkuu",
    toe: 0,
    jakaja: 21.5,
    palkka: 0,
    tyonantajat: "",
    pidennettavatJaksot: 0,
    rows: [],
  },
  {
    id: "2025-05",
    ajanjakso: "2025 Toukokuu",
    toe: 0,
    jakaja: 21.5,
    palkka: 0,
    tyonantajat: "",
    pidennettavatJaksot: 0,
    rows: [],
  },
  {
    id: "2025-04",
    ajanjakso: "2025 Huhtikuu",
    toe: 0,
    jakaja: 21.5,
    palkka: 0,
    tyonantajat: "",
    pidennettavatJaksot: 0,
    rows: [],
  },
  {
    id: "2025-03",
    ajanjakso: "2025 Maaliskuu",
    toe: 0,
    jakaja: 21.5,
    palkka: 1800,
    tyonantajat: "Nokia Oyj",
    pidennettavatJaksot: 0,
    rows: MOCK_ROWS_2025_03,
  },
  {
    id: "2025-02",
    ajanjakso: "2025 Helmikuu",
    toe: 0,
    jakaja: 21.5,
    palkka: 1900,
    tyonantajat: "Nokia Oyj",
    pidennettavatJaksot: 0,
    rows: MOCK_ROWS_2025_02,
  },
  {
    id: "2025-01",
    ajanjakso: "2025 Tammikuu",
    toe: 0,
    jakaja: 21.5,
    palkka: 2450,
    tyonantajat: "Nokia Oyj",
    pidennettavatJaksot: 0,
    rows: MOCK_ROWS_2025_01,
  },
];

// --- Helper Functions ---

function formatCurrency(n: number) {
  return n.toLocaleString("fi-FI", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Parse DD.MM.YYYY to Date
function parseDate(dateStr: string): Date {
  const parts = dateStr.split(".");
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date();
}

// Parse Finnish date like "8.10.2026" → Date | null (from massincomesplit)
function parseFinnishDate(s?: string | null): Date | null {
  if (!s) return null;
  const parts = String(s).trim().split(".").filter(Boolean);
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts;
  const d = parseInt(dd, 10);
  const m = parseInt(mm, 10) - 1;
  const y = parseInt(yyyy, 10);
  const dt = new Date(y, m, d);
  return isNaN(dt.getTime()) ? null : dt;
}

// Format Date to DD.MM.YYYY
function formatDateFI(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

// Convert ISO date string (YYYY-MM-DD) to Finnish format (DD.MM.YYYY)
function isoToFI(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}.${month}.${year}`;
}

// Round to 2 decimal places (cents)
function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}

// Get Finnish month name
function getFinnishMonthName(monthNum: number): string {
  const months = [
    "Tammikuu", "Helmikuu", "Maaliskuu", "Huhtikuu",
    "Toukokuu", "Kesäkuu", "Heinäkuu", "Elokuu",
    "Syyskuu", "Lokakuu", "Marraskuu", "Joulukuu"
  ];
  return months[monthNum - 1] || "";
}

// Format Date to YYYY-MM-DD
function formatDateISO(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
}

// Get days in month
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// Calculate inclusive day count between two dates
function daysBetween(start: Date, end: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((end.getTime() - start.getTime()) / oneDay) + 1;
}

// Split date range by months
function splitByMonths(startDate: Date, endDate: Date): Array<{ year: number; month: number; start: Date; end: Date; days: number }> {
  const result = [];
  let current = new Date(startDate);

  while (current <= endDate) {
    const year = current.getFullYear();
    const month = current.getMonth() + 1;
    const monthStart = new Date(Math.max(current.getTime(), startDate.getTime()));
    const lastDayOfMonth = new Date(year, month, 0);
    const monthEnd = new Date(Math.min(lastDayOfMonth.getTime(), endDate.getTime()));

    const days = daysBetween(monthStart, monthEnd);
    result.push({ year, month, start: monthStart, end: monthEnd, days });

    // Move to next month
    current = new Date(year, month, 1);
  }

  return result;
}

// Distribute amount by days with rounding
function distributeByDays(totalAmount: number, splits: Array<{ year: number; month: number; start: Date; end: Date; days: number }>, direction: Direction): MonthSplit[] {
  const totalDays = splits.reduce((sum, s) => sum + s.days, 0);
  
  // Calculate raw amounts
  const rawSplits = splits.map(s => ({
    ...s,
    rawAmount: (totalAmount * s.days) / totalDays,
  }));

  // Round down to 2 decimals
  const roundedSplits = rawSplits.map(s => ({
    ...s,
    amount: roundToCents(s.rawAmount),
    remainder: s.rawAmount - roundToCents(s.rawAmount),
  }));

  // Calculate total rounded and remainder
  const totalRounded = roundedSplits.reduce((sum, s) => sum + s.amount, 0);
  const totalRemainder = Math.round((totalAmount - totalRounded) * 100);

  // Distribute remainder cents using "biggest remainder first"
  const sorted = [...roundedSplits].sort((a, b) => {
    const diff = b.remainder - a.remainder;
    if (Math.abs(diff) > 0.0001) return diff;
    // Tie-breaker: use direction
    if (direction === "forward") {
      return splits.indexOf(a) - splits.indexOf(b);
    } else {
      return splits.indexOf(b) - splits.indexOf(a);
    }
  });

  for (let i = 0; i < totalRemainder; i++) {
    sorted[i].amount += 0.01;
  }

  // Return in original order
  return splits.map(s => {
    const found = sorted.find(rs => rs.year === s.year && rs.month === s.month);
    return {
      year: s.year,
      month: s.month,
      earningStart: formatDateISO(s.start),
      earningEnd: formatDateISO(s.end),
      amount: found?.amount ?? 0,
    };
  });
}

// Distribute amount equally across months
function distributeEqualMonths(totalAmount: number, splits: Array<{ year: number; month: number; start: Date; end: Date; days: number }>, direction: Direction): MonthSplit[] {
  const monthCount = splits.length;
  const baseAmount = roundToCents(totalAmount / monthCount);
  const totalBase = baseAmount * monthCount;
  const remainder = Math.round((totalAmount - totalBase) * 100);

  return splits.map((s, idx) => {
    let amount = baseAmount;
    
    // Distribute remainder cents
    if (direction === "forward" && idx < remainder) {
      amount += 0.01;
    } else if (direction === "backward" && idx >= monthCount - remainder) {
      amount += 0.01;
    }

    // For equal months, use full month dates (first to last day)
    const firstDay = new Date(s.year, s.month - 1, 1);
    const lastDay = new Date(s.year, s.month, 0);

    return {
      year: s.year,
      month: s.month,
      earningStart: formatDateISO(firstDay),
      earningEnd: formatDateISO(lastDay),
      amount,
    };
  });
}

// Generate months from employment period (always backward from end date)
function generateMonthsFromEmployment(): Array<{ year: number; month: number }> {
  const start = parseDate(MOCK_EMPLOYMENT.startDate);
  const end = parseDate(MOCK_EMPLOYMENT.endDate);
  
  if (!start || !end) return [];
  
  const months = [];
  let currentYear = start.getFullYear();
  let currentMonth = start.getMonth() + 1; // 1-12
  const endYear = end.getFullYear();
  const endMonth = end.getMonth() + 1;
  
  while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
    months.push({ year: currentYear, month: currentMonth });
    
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
  }
  
  // Return in reverse order (backward from end)
  return months.reverse();
}

// Generate months from payDate
function generateMonthsFromPayDate(payDate: string, monthCount: number, direction: Direction): Array<{ year: number; month: number }> {
  const date = parseDate(payDate);
  const payYear = date.getFullYear();
  const payMonth = date.getMonth() + 1; // 1-12

  const months = [];
  for (let i = 0; i < monthCount; i++) {
    let targetMonth = payMonth;
    let targetYear = payYear;

    if (direction === "forward") {
      targetMonth += i;
    } else {
      targetMonth -= i;
    }

    // Adjust year if needed
    while (targetMonth > 12) {
      targetMonth -= 12;
      targetYear++;
    }
    while (targetMonth < 1) {
      targetMonth += 12;
      targetYear--;
    }

    months.push({ year: targetYear, month: targetMonth });
  }

  // Sort chronologically
  months.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  return months;
}

// --- Main Component ---
export default function AllocateIncome() {
  const [periods, setPeriods] = useState<MonthPeriod[]>(MOCK_PERIODS);
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set(["2026-01"]));
  const [showNonBenefitAffecting, setShowNonBenefitAffecting] = useState(false);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [allocationContext, setAllocationContext] = useState<AllocationContext | null>(null);
  const [viewMode, setViewMode] = useState(false); // Lukittu näkymä silmäikonin kautta
  
  // Add income modal state
  const [addIncomeModalOpen, setAddIncomeModalOpen] = useState(false);
  const [selectedEmployer, setSelectedEmployer] = useState("");
  const [employmentStartDate, setEmploymentStartDate] = useState("");
  const [employmentEndDate, setEmploymentEndDate] = useState("");
  const [selectedEmploymentIds, setSelectedEmploymentIds] = useState<string[]>([]);
  const [paymentDate, setPaymentDate] = useState("");
  const [incomeType, setIncomeType] = useState("Tulospalkka");
  const [salaryAmount, setSalaryAmount] = useState("");
  const [earningStartDate, setEarningStartDate] = useState("");
  const [earningEndDate, setEarningEndDate] = useState("");

  // Allocation form state
  const [allocationMethod, setAllocationMethod] = useState<AllocationMethod>("period");
  const [direction, setDirection] = useState<Direction>("backward");
  const [distributionType, setDistributionType] = useState<DistributionType>("byDays");
  const [startDate, setStartDate] = useState("20.1.2025");
  const [endDate, setEndDate] = useState("10.2.2025");
  const [monthCount, setMonthCount] = useState(2);
  const [manualAmounts, setManualAmounts] = useState<Record<string, number>>({});

  // When allocationMethod changes to employment, set dates from MOCK_EMPLOYMENT and direction to backward
  useEffect(() => {
    if (allocationMethod === "employment") {
      setStartDate(MOCK_EMPLOYMENT.startDate);
      setEndDate(MOCK_EMPLOYMENT.endDate);
      setDirection("backward"); // Always backward for employment duration
    }
  }, [allocationMethod]);

  const togglePeriod = (periodId: string) => {
    setExpandedPeriods(prev => {
      const next = new Set(prev);
      if (next.has(periodId)) {
        next.delete(periodId);
      } else {
        next.add(periodId);
      }
      return next;
    });
  };

  // Filter rows to show based on showNonBenefitAffecting setting
  const getVisibleRows = (period: MonthPeriod) => {
    if (showNonBenefitAffecting) {
      return period.rows; // Show all rows including deleted and non-benefit affecting
    }
    return period.rows.filter(row => 
      !isRowDeleted(row) && // Hide deleted rows
      // Show: vaikuttavat tulot + huomioidut tulot
      (!NON_BENEFIT_AFFECTING_INCOME_TYPES.includes(row.tulolaji) || 
       row.huom?.includes("Huomioitu laskennassa"))
    );
  };

  // Calculate count of hidden rows
  const getHiddenRowsCount = (period: MonthPeriod) => {
    if (showNonBenefitAffecting) {
      return 0; // All rows are visible
    }
    
    const hiddenCount = period.rows.filter(row => 
      isRowDeleted(row) || // Deleted rows
      (NON_BENEFIT_AFFECTING_INCOME_TYPES.includes(row.tulolaji) && 
       !row.huom?.includes("Huomioitu laskennassa")) // Non-benefit affecting (not included)
    ).length;
    
    return hiddenCount;
  };

  // Open allocation modal for single row
  const openAllocationModalSingle = (row: IncomeRow) => {
    const context: AllocationContext = {
      mode: "single",
      payDate: row.maksupaiva,
      sourceRows: [row],
      totalAmount: row.alkuperainenTulo > 0 ? row.alkuperainenTulo : row.palkka,
    };
    setAllocationContext(context);
    setAllocationMethod("period"); // Reset to default
    setStartDate("20.1.2025");
    setEndDate("10.2.2025");
    setModalOpen(true);
    setViewMode(false); // Ei lukittu näkymä
  };

  // Open allocation modal for all rows with same payDate
  const openAllocationModalBatch = (row: IncomeRow, period: MonthPeriod) => {
    const payDate = row.maksupaiva;
    const rowsForPayDate = period.rows.filter(r => 
      r.maksupaiva === payDate && 
      !isRowDeleted(r) && // Filter out deleted income
      // Include: vaikuttavat tulot + huomioidut tulot
      (!NON_BENEFIT_AFFECTING_INCOME_TYPES.includes(r.tulolaji) || 
       r.huom?.includes("Huomioitu laskennassa"))
    );
    const totalAmount = rowsForPayDate.reduce((sum, r) => sum + (r.alkuperainenTulo > 0 ? r.alkuperainenTulo : r.palkka), 0);
    
    const context: AllocationContext = {
      mode: "batch",
      payDate,
      sourceRows: rowsForPayDate,
      totalAmount,
    };
    setAllocationContext(context);
    setAllocationMethod("period"); // Reset to default
    setStartDate("20.1.2025");
    setEndDate("10.2.2025");
    setModalOpen(true);
    setViewMode(false); // Ei lukittu näkymä
  };

  // Restore deleted income type
  const restoreIncomeType = (row: IncomeRow) => {
    setPeriods(prev => {
      return prev.map(period => ({
        ...period,
        rows: period.rows.map(r => {
          if (r.id === row.id) {
            return {
              ...r,
              huom: undefined, // Remove the "deleted" flag
            };
          }
          return r;
        }),
      }));
    });

    toast.success("Tulolaji palautettu", {
      description: `${row.tulolaji} on nyt aktiivinen.`,
    });
  };

  // Delete income type (mark as deleted)
  const deleteIncomeType = (row: IncomeRow) => {
    setPeriods(prev => {
      return prev.map(period => ({
        ...period,
        rows: period.rows.map(r => {
          if (r.id === row.id) {
            return {
              ...r,
              huom: `Poistettu (${new Date().toLocaleDateString('fi-FI')})`,
            };
          }
          return r;
        }),
      }));
    });

    toast.success("Tulolaji poistettu", {
      description: `${row.tulolaji} on poistettu laskennasta.`,
    });
  };

  // Include non-benefit affecting income in calculation
  const includeIncomeInCalculation = (row: IncomeRow) => {
    setPeriods(prev => {
      return prev.map(period => ({
        ...period,
        rows: period.rows.map(r => {
          if (r.id === row.id) {
            return {
              ...r,
              huom: `Huomioitu laskennassa (${new Date().toLocaleDateString('fi-FI')})`,
            };
          }
          return r;
        }),
      }));
    });

    toast.success("Tulo huomioitu laskennassa", {
      description: `${row.tulolaji} vaikuttaa nyt päivärahan laskentaan.`,
    });
  };

  // Check if row is deleted
  const isRowDeleted = (row: IncomeRow): boolean => {
    return row.huom?.toLowerCase().includes("poistettu") || false;
  };

  // Handle add income modal
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

    // Create new income row
    const newRow: IncomeRow = {
      id: `new-${Date.now()}`,
      maksupaiva: paymentDate,
      tulolaji: incomeType,
      palkka: amount,
      alkuperainenTulo: amount,
      ansaintaAika: earningStartDate && earningEndDate ? `${earningStartDate} - ${earningEndDate}` : "",
      tyonantaja: selectedEmployer || "Espoon kaupunki",
    };

    // Add to the current period (2026-01 for demo)
    setPeriods(prev => {
      return prev.map(period => {
        if (period.id === "2026-01") {
          return {
            ...period,
            rows: [...period.rows, newRow],
            palkka: period.palkka + amount,
          };
        }
        return period;
      });
    });

    // Reset form
    setSelectedEmployer("");
    setEmploymentStartDate("");
    setEmploymentEndDate("");
    setSelectedEmploymentIds([]);
    setPaymentDate("");
    setIncomeType("Tulospalkka");
    setSalaryAmount("");
    setEarningStartDate("");
    setEarningEndDate("");
    setAddIncomeModalOpen(false);

    toast.success("Tulotieto lisätty onnistuneesti");
  };

  const toggleEmploymentSelection = (id: string) => {
    setSelectedEmploymentIds(prev => 
      prev.includes(id) 
        ? prev.filter(empId => empId !== id)
        : [...prev, id]
    );
  };

  const filteredEmployments = useMemo(() => {
    return MOCK_EMPLOYMENT_RELATIONSHIPS.filter(emp => {
      if (selectedEmployer && emp.employer !== selectedEmployer) return false;
      
      // Parse both dates for comparison using parseFinnishDate
      const inputStart = parseFinnishDate(employmentStartDate);
      const empStart = parseFinnishDate(emp.startDate);
      const inputEnd = parseFinnishDate(employmentEndDate);
      const empEnd = parseFinnishDate(emp.endDate);
      
      // Only filter by start date if both dates are valid and different
      if (employmentStartDate && inputStart && empStart && inputStart.getTime() !== empStart.getTime()) return false;
      if (employmentEndDate && inputEnd && empEnd && inputEnd.getTime() !== empEnd.getTime()) return false;
      
      return true;
    });
  }, [selectedEmployer, employmentStartDate, employmentEndDate]);

  // Calculate preview splits
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
          if (distributionType === "byDays") {
            return distributeByDays(allocationContext.totalAmount, monthSplits, direction);
          } else {
            return distributeEqualMonths(allocationContext.totalAmount, monthSplits, direction);
          }
        } else {
          // Batch mode: split each income type separately
          const allSplits: MonthSplit[] = [];
          
          for (const row of allocationContext.sourceRows) {
            const rowAmount = row.alkuperainenTulo > 0 ? row.alkuperainenTulo : row.palkka;
            
            const rowSplits = distributionType === "byDays"
              ? distributeByDays(rowAmount, monthSplits, direction)
              : distributeEqualMonths(rowAmount, monthSplits, direction);
            
            // Add incomeType to each split
            rowSplits.forEach(split => {
              split.incomeType = row.tulolaji;
            });
            
            allSplits.push(...rowSplits);
          }
          
          return allSplits;
        }
      } else if (distributionType === "manual") {
        const months = allocationMethod === "employment" 
          ? generateMonthsFromEmployment() 
          : generateMonthsFromPayDate(allocationContext.payDate, monthCount, direction);
        
        if (allocationContext.mode === "single") {
          return months.map(m => {
            const key = `${m.year}-${m.month}`;
            const firstDay = new Date(m.year, m.month - 1, 1);
            const lastDay = new Date(m.year, m.month, 0);
            
            return {
              year: m.year,
              month: m.month,
              earningStart: formatDateISO(firstDay),
              earningEnd: formatDateISO(lastDay),
              amount: manualAmounts[key] ?? 0,
            };
          });
        } else {
          // Batch mode: for each income type, split across months
          const allSplits: MonthSplit[] = [];
          
          for (const row of allocationContext.sourceRows) {
            for (const m of months) {
              const key = `${row.id}-${m.year}-${m.month}`;
              const firstDay = new Date(m.year, m.month - 1, 1);
              const lastDay = new Date(m.year, m.month, 0);
              
              allSplits.push({
                year: m.year,
                month: m.month,
                earningStart: formatDateISO(firstDay),
                earningEnd: formatDateISO(lastDay),
                amount: manualAmounts[key] ?? 0,
                incomeType: row.tulolaji,
              });
            }
          }
          
          return allSplits;
        }
      }
    } catch (error) {
      console.error("Error calculating preview:", error);
    }

    return [];
  }, [allocationContext, distributionType, direction, startDate, endDate, monthCount, manualAmounts]);

  // Validate
  const validation = useMemo(() => {
    if (!allocationContext) return { valid: false, message: "" };

    if (allocationContext.totalAmount <= 0) {
      return { valid: false, message: "Summa on oltava suurempi kuin 0" };
    }

    if (distributionType === "byDays" || distributionType === "equalMonths") {
      const start = parseDate(startDate);
      const end = parseDate(endDate);
      
      if (start > end) {
        return { valid: false, message: "Alkupäivä ei voi olla loppupäivän jälkeen" };
      }

      const monthSplits = splitByMonths(start, end);
      if (monthSplits.length === 0) {
        return { valid: false, message: "Vähintään yksi kuukausi vaaditaan" };
      }
    }

    if (distributionType === "manual") {
      const previewTotal = previewSplits.reduce((sum, s) => sum + s.amount, 0);
      const diff = Math.abs(previewTotal - allocationContext.totalAmount);
      
      if (diff > 0.01) {
        return { valid: false, message: `Summa ei täsmää: ${formatCurrency(previewTotal)} / ${formatCurrency(allocationContext.totalAmount)}` };
      }
    }

    return { valid: true, message: "Summa täsmää" };
  }, [allocationContext, distributionType, startDate, endDate, previewSplits]);

  // Reset manual amounts when params change
  useEffect(() => {
    if (distributionType === "manual" && allocationContext) {
      const months = generateMonthsFromPayDate(allocationContext.payDate, monthCount, direction);
      const newAmounts: Record<string, number> = {};
      
      if (allocationContext.mode === "single") {
        // Initialize with equal distribution
        const equalAmount = roundToCents(allocationContext.totalAmount / monthCount);
        months.forEach(m => {
          const key = `${m.year}-${m.month}`;
          newAmounts[key] = manualAmounts[key] ?? equalAmount;
        });
      } else {
        // Batch: initialize each income type separately
        for (const row of allocationContext.sourceRows) {
          const rowAmount = row.alkuperainenTulo > 0 ? row.alkuperainenTulo : row.palkka;
          const equalAmount = roundToCents(rowAmount / monthCount);
          
          months.forEach(m => {
            const key = `${row.id}-${m.year}-${m.month}`;
            newAmounts[key] = manualAmounts[key] ?? equalAmount;
          });
        }
      }
      
      setManualAmounts(newAmounts);
    }
  }, [distributionType, monthCount, direction, allocationContext]);

  // Apply allocation
  const applyAllocation = () => {
    if (!allocationContext || !validation.valid) return;

    // Tallenna kohdistuksen tiedot myöhempää tarkastelua varten
    const allocationData = {
      id: `allocation-${Date.now()}`,
      originalContext: allocationContext,
      allocationMethod,
      startDate,
      endDate,
      distributionType,
      direction,
      monthCount,
      previewSplits: [...previewSplits], // Kopioi splits
      timestamp: new Date().toISOString(),
    };

    // Build allocation method description
    let allocationMethodDesc = "";
    if (allocationMethod === "employment") {
      allocationMethodDesc = `Palvelussuhteen kesto / ${distributionType === "byDays" ? "Päivien mukaan" : distributionType === "equalMonths" ? "Tasan kuukausille" : "Manuaalinen"} (${MOCK_EMPLOYMENT.startDate}–${MOCK_EMPLOYMENT.endDate})`;
    } else {
      if (distributionType === "byDays") {
        allocationMethodDesc = `(${startDate}–${endDate})`;
      } else if (distributionType === "equalMonths") {
        allocationMethodDesc = ` (${startDate}–${endDate})`;
      } else {
        allocationMethodDesc = ` (N=${monthCount})`;
      }
    }

    // Create new month rows from splits
    const newRows: IncomeRow[] = previewSplits.map((split, idx) => {
      const monthStr = `${split.month}/${split.year}`;
      const earningPeriod = `${isoToFI(split.earningStart)} - ${isoToFI(split.earningEnd)}`;
      
      // For single mode, use the single row's data
      // For batch mode, each split has incomeType
      const sourceRow = allocationContext.mode === "single" 
        ? allocationContext.sourceRows[0]
        : allocationContext.sourceRows.find(r => r.tulolaji === split.incomeType) || allocationContext.sourceRows[0];

      return {
        id: `${sourceRow.id}-allocated-${idx}-${Date.now()}`,
        maksupaiva: allocationContext.payDate,
        tulolaji: split.incomeType || sourceRow.tulolaji,
        palkka: roundToCents(split.amount),
        alkuperainenTulo: sourceRow.alkuperainenTulo > 0 ? sourceRow.alkuperainenTulo : sourceRow.palkka,
        ansaintaAika: earningPeriod,
        kohdistusTOE: allocationMethodDesc,
        tyonantaja: sourceRow.tyonantaja,
        huom: `Kohdistettu ${monthStr}`,
        allocationData, // Tallenna koko kohdistuksen tiedot
      };
    });

    // Update periods state - remove old rows and distribute new rows across periods
    setPeriods(prev => {
      const rowsToRemove = new Set(allocationContext.sourceRows.map(r => r.id));
      
      // First, remove the old rows from all periods
      let updatedPeriods = prev.map(period => ({
        ...period,
        rows: period.rows.filter(r => !rowsToRemove.has(r.id)),
      }));

      // Then, add new rows to appropriate periods based on their earning period
      for (const newRow of newRows) {
        // Extract month and year from earning period (format: "DD.MM.YYYY - DD.MM.YYYY")
        const [startDateStr] = newRow.ansaintaAika.split(' - ');
        const [day, month, year] = startDateStr.split('.');
        
        // Find the period that matches this month/year
        // Period ajanjakso format is "YYYY Kuukausi" (e.g., "2026 Tammikuu")
        const monthName = getFinnishMonthName(parseInt(month));
        const targetPeriodKey = `${year} ${monthName}`;
        
        const periodIndex = updatedPeriods.findIndex(p => p.ajanjakso === targetPeriodKey);
        
        if (periodIndex !== -1) {
          // Period exists - add row to it
          updatedPeriods[periodIndex] = {
            ...updatedPeriods[periodIndex],
            rows: [...updatedPeriods[periodIndex].rows, newRow],
          };
        }
        // If period doesn't exist, skip this row (don't create new periods)
      }

      // Recalculate totals for all affected periods
      return updatedPeriods.map(period => ({
        ...period,
        palkka: period.rows.reduce((sum, r) => sum + r.palkka, 0),
      }));
    });

    // Show success message
    const count = newRows.length;
    const rowWord = count === 1 ? "rivi" : "riviä";
    toast.success(`Kohdistus suoritettu`, {
      description: `${count} ${rowWord} luotu onnistuneesti.`,
    });

    // Close modal
    setModalOpen(false);
  };

  // Remove allocation and restore original rows
  const removeAllocation = () => {
    if (!allocationContext) return;
    
    // Poista kohdistetut rivit ja palauta alkuperäiset
    setPeriods(prev => {
      return prev.map(period => ({
        ...period,
        rows: period.rows.filter(row => {
          // Poista kohdistetut rivit
          if (row.huom?.startsWith('Kohdistettu')) {
            return false;
          }
          return true;
        })
      }));
    });
    
    // Lisää alkuperäiset rivit takaisin
    if (allocationContext.sourceRows) {
      setPeriods(prev => {
        const updatedPeriods = [...prev];
        
        allocationContext.sourceRows.forEach(sourceRow => {
          // Etsi oikea kuukausi maksupäivän perusteella
          const targetPeriod = updatedPeriods.find(p => 
            p.rows.some(r => r.maksupaiva === sourceRow.maksupaiva)
          );
          
          if (targetPeriod) {
            targetPeriod.rows.push({
              ...sourceRow,
              alkuperainenTulo: 0, // Nollaa alkuperäinen tulo
            });
          }
        });
        
        return updatedPeriods;
      });
    }
  };

  // Aggregate splits by month for display (batch mode)
  const aggregatedByMonth = useMemo(() => {
    if (allocationContext?.mode !== "batch") return [];

    const byMonth = new Map<string, { year: number; month: number; earningStart: string; earningEnd: string; total: number; items: MonthSplit[] }>();

    for (const split of previewSplits) {
      const key = `${split.year}-${split.month}`;
      
      if (!byMonth.has(key)) {
        byMonth.set(key, {
          year: split.year,
          month: split.month,
          earningStart: split.earningStart,
          earningEnd: split.earningEnd,
          total: 0,
          items: [],
        });
      }

      const entry = byMonth.get(key)!;
      entry.total += split.amount;
      entry.items.push(split);
    }

    return Array.from(byMonth.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  }, [allocationContext, previewSplits]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold tracking-tight">Kohdista tulotiedot</h1>
          <Link href="/massincomesplit">
            <Button className="bg-[#0e4c92] hover:bg-[#0d4383]">Suodata tulotietoja</Button>
          </Link>
        </header>

        {/* Periods Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-[#003479] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium w-12"></th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Ajanjakso</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">TOE</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Jakaja</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Palkka</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Työnantajat</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Pidennettävät jaksot</th>
                  </tr>
                </thead>
                <tbody>
                  {periods.map((period, idx) => (
                    <React.Fragment key={period.id}>
                      {/* Period Row */}
                      <tr className={cn("border-b hover:bg-gray-50", idx % 2 === 0 ? "bg-white" : "bg-gray-50")}>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => togglePeriod(period.id)}
                            className="hover:bg-gray-200 rounded p-1"
                          >
                            {expandedPeriods.has(period.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => togglePeriod(period.id)}
                            className="text-blue-600 hover:underline"
                          >
                            {period.ajanjakso}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm">{period.toe}</td>
                        <td className="px-4 py-3 text-sm">{period.jakaja}</td>
                        <td className="px-4 py-3 text-sm">{period.palkka}</td>
                        <td className="px-4 py-3 text-sm">{period.tyonantajat}</td>
                        <td className="px-4 py-3 text-sm">
                          {period.pidennettavatJaksot > 0 && (
                            <button className="text-blue-600 hover:underline">
                              {period.pidennettavatJaksot}
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Expanded Income Rows */}
                      {expandedPeriods.has(period.id) && period.rows.length > 0 && (
                        <tr>
                          <td colSpan={7} className="p-0">
                            <div className="bg-gray-100 p-4">
                              <div className="flex justify-between items-center mb-3">
                                {/* Vasen puoli - Kaksi painiketta vierekkäin */}
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setAddIncomeModalOpen(true)}
                                  >
                                    Lisää tulotieto
                                  </Button>
                                  
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setShowNonBenefitAffecting(!showNonBenefitAffecting)}
                                    className={showNonBenefitAffecting ? "bg-blue-100 text-blue-800" : ""}
                                  >
                                    {showNonBenefitAffecting 
                                      ? "Piilota poistetut ja ei-vaikuttavat tulot" 
                                      : `Näytä poistetut ja ei-vaikuttavat tulot (${getHiddenRowsCount(period)})`
                                    }
                                  </Button>
                                </div>
                                
                                {/* Oikea puoli - Peruuta muutokset */}
                                <Button variant="ghost" size="sm">
                                  Peruuta muutokset
                                </Button>
                              </div>

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
                                  {getVisibleRows(period).map((row, rowIdx) => (
                                    <tr
                                      key={row.id}
                                      className={cn(
                                        "border-b",
                                        isRowDeleted(row) 
                                          ? "bg-gray-100 text-gray-500" 
                                          : rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50",
                                        row.huom && !isRowDeleted(row) && !row.huom?.includes("Huomioitu laskennassa") && "bg-yellow-50", // Keltainen vain jos ei huomioitu
                                        NON_BENEFIT_AFFECTING_INCOME_TYPES.includes(row.tulolaji) && 
                                          !row.huom?.includes("Huomioitu laskennassa") && "bg-orange-50" // Oranssi vain jos ei huomioitu
                                      )}
                                    >
                                      <td className={cn("px-3 py-2 text-xs", isRowDeleted(row) && "text-gray-500")}>
                                        {row.huom || ""}
                                      </td>
                                      <td className={cn("px-3 py-2 text-xs whitespace-nowrap", isRowDeleted(row) && "text-gray-500")}>
                                        {row.maksupaiva}
                                      </td>
                                      <td className={cn("px-3 py-2 text-xs", isRowDeleted(row) && "text-gray-500 line-through")}>
                                        {row.tulolaji}
                                      </td>
                                      <td className={cn("px-3 py-2 text-xs text-right", isRowDeleted(row) && "text-gray-500")}>
                                        {formatCurrency(row.palkka)}
                                      </td>
                                      <td className={cn("px-3 py-2 text-xs text-right", isRowDeleted(row) && "text-gray-500")}>
                                        {row.alkuperainenTulo > 0 ? formatCurrency(row.alkuperainenTulo) : ""}
                                      </td>
                                      <td className={cn("px-3 py-2 text-xs whitespace-nowrap", isRowDeleted(row) && "text-gray-500")}>
                                        {/* {row.ansaintaAika} */}
                                      </td>
                                      <td className={cn("px-3 py-2 text-xs whitespace-nowrap", isRowDeleted(row) && "text-gray-500")}>
                                        {row.kohdistusTOE || ""}
                                      </td>
                                      <td className={cn("px-3 py-2 text-xs", isRowDeleted(row) && "text-gray-500")}>
                                        {row.tyonantaja}
                                      </td>
                                      <td className="px-3 py-2 text-xs">
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 px-2 text-blue-600 hover:text-blue-800"
                                            >
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
                                                  {/* Näytä kohdistustiedot vain kohdistetuille riveille */}
                                                  {row.huom?.startsWith('Kohdistettu') && (
                                                    <Button
                                                      variant="ghost"
                                                      className="justify-start text-sm font-normal text-blue-600 hover:text-blue-700"
                                                      onClick={() => {
                                                        // Hae tallennetut kohdistuksen tiedot
                                                        const savedAllocation = row.allocationData;
                                                        
                                                        if (savedAllocation) {
                                                          // Palauta koko kohdistuksen konteksti
                                                          setAllocationContext(savedAllocation.originalContext);
                                                          setAllocationMethod(savedAllocation.allocationMethod);
                                                          setStartDate(savedAllocation.startDate);
                                                          setEndDate(savedAllocation.endDate);
                                                          setDistributionType(savedAllocation.distributionType);
                                                          setDirection(savedAllocation.direction);
                                                          setMonthCount(savedAllocation.monthCount);
                                                          
                                                          setModalOpen(true);
                                                          setViewMode(true); // Lukittu näkymä
                                                        }
                                                      }}
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
                                                    onClick={() => openAllocationModalBatch(row, period)}
                                                  >
                                                    Kohdista maksupäivän tulolajit
                                                  </Button>
                                                  
                                                  {/* Huomioi tulo laskennassa painike ei-vaikuttaville tuloille */}
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
                                                  
                                                  {/* Poista tulolaji painike alimmaiseksi */}
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
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="px-3 py-1 border rounded hover:bg-gray-100">←</button>
            <span className="text-sm">sivu 1/1</span>
            <button className="px-3 py-1 border rounded hover:bg-gray-100">→</button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Tulosten määrä</span>
            <Select defaultValue="12">
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12</SelectItem>
                <SelectItem value="24">24</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm">1-12/86</span>
          </div>
        </div>
      </div>

      {/* Allocation Modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => {
        setModalOpen(open);
        if (!open) setViewMode(false); // Nollaa lukitus kun suljetaan
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="space-y-2">
              <DialogTitle>
                {viewMode ? "Kohdistustietojen tarkastelu" : (allocationContext?.mode === "single" ? "TULOLAJIN KOHDISTUS" : "MAKSUPÄIVÄN TULOLAJIEN KOHDISTUS")}
              </DialogTitle>
              <div className="flex gap-2 items-center">
                <span className="text-sm text-gray-600">Maksupäivä:</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {allocationContext?.payDate}
                </span>
              </div>
            </div>
          </DialogHeader>

          {/* Lukitus-tila näkyy VAIN silmäikonin kautta */}
          {viewMode && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              <p className="font-medium">Kohdistustietojen tarkastelu</p>
              <p className="text-xs mt-1">Näet alkuperäiset kohdistustiedot. Voit muokata tietoja tarvittaessa.</p>
            </div>
          )}

          {allocationContext && (
            <div className="space-y-6">
              {/* Income Type Display */}
              <div className="space-y-2">
                <Label>Kohdistettava tulolaji</Label>
                {allocationContext.mode === "single" ? (
                  <div className="px-3 py-2 border rounded bg-gray-50 text-sm">
                    {allocationContext.sourceRows[0]?.tulolaji}
                  </div>
                ) : (
                  <div className="px-3 py-2 border rounded bg-blue-50 text-sm text-blue-800">
                    Kaikki maksupäivän tulolajit huomioidaan ({allocationContext.sourceRows.length} kpl)
                  </div>
                )}
              </div>

              {/* Total Amount */}
              <div className="space-y-2">
                <Label>Kokonaissumma</Label>
                <div className="px-3 py-2 border rounded bg-gray-50 text-sm font-semibold">
                  {formatCurrency(allocationContext.totalAmount)} €
                </div>
              </div>

              {/* Allocation Method */}
              <div className="space-y-2">
                <Label>Kohdistustapa</Label>
                <Select value={allocationMethod} onValueChange={(v) => setAllocationMethod(v as AllocationMethod)} disabled={viewMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employment">Palvelussuhteen kesto</SelectItem>
                    <SelectItem value="period">Ajanjakso</SelectItem>
                  </SelectContent>
                </Select>
                {allocationMethod === "employment" && (
                  <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                    Palvelussuhde: {MOCK_EMPLOYMENT.startDate} – {MOCK_EMPLOYMENT.endDate} ({MOCK_EMPLOYMENT.employer})
                  </div>
                )}
              </div>

              {/* Direction - only show for manual distribution */}
              {distributionType === "manual" && (
                <div className="space-y-2">
                  <Label>Jaon suunta</Label>
                  <Select value={direction} onValueChange={(v) => setDirection(v as Direction)} disabled={viewMode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="backward">Maksukuukaudesta taaksepäin</SelectItem>
                      <SelectItem value="forward">Maksukuukaudesta eteenpäin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Distribution Type */}
              <div className="space-y-2">
                <Label>Jaon tyyppi</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="distributionType"
                      value="byDays"
                      checked={distributionType === "byDays"}
                      onChange={(e) => setDistributionType(e.target.value as DistributionType)}
                      disabled={viewMode}
                    />
                    <span className="text-sm">Päivien mukaan</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="distributionType"
                      value="equalMonths"
                      checked={distributionType === "equalMonths"}
                      onChange={(e) => setDistributionType(e.target.value as DistributionType)}
                      disabled={viewMode}
                    />
                    <span className="text-sm">Tasan kuukausille</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="distributionType"
                      value="manual"
                      checked={distributionType === "manual"}
                      onChange={(e) => setDistributionType(e.target.value as DistributionType)}
                      disabled={viewMode}
                    />
                    <span className="text-sm">Manuaalinen</span>
                  </label>
                </div>
              </div>

              {/* Date Range (for byDays and equalMonths) */}
              {(distributionType === "byDays" || distributionType === "equalMonths") && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Alkupäivä</Label>
                    <Input 
                      type="text" 
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)}
                      placeholder="DD.MM.YYYY"
                      disabled={allocationMethod === "employment" || viewMode}
                      className={cn((allocationMethod === "employment" || viewMode) && "bg-gray-100 cursor-not-allowed")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Loppupäivä</Label>
                    <Input 
                      type="text" 
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)}
                      placeholder="DD.MM.YYYY"
                      disabled={allocationMethod === "employment" || viewMode}
                      className={cn((allocationMethod === "employment" || viewMode) && "bg-gray-100 cursor-not-allowed")}
                    />
                  </div>
                </div>
              )}

              {/* Month Count (for manual) */}
              {distributionType === "manual" && (
                <div className="space-y-2">
                  <Label>Kuukausien määrä</Label>
                  {allocationMethod === "employment" ? (
                    <div className="p-2 bg-gray-50 border rounded-md">
                      <span className="text-sm text-gray-600">
                        {(() => {
                          const start = parseDate(MOCK_EMPLOYMENT.startDate);
                          const end = parseDate(MOCK_EMPLOYMENT.endDate);
                          if (start && end) {
                            const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                                         (end.getMonth() - start.getMonth()) + 1;
                            return `${months} kuukautta (palvelussuhteen mukaan)`;
                          }
                          return "3 kuukautta";
                        })()}
                      </span>
                    </div>
                  ) : (
                    <Select value={String(monthCount)} onValueChange={(v) => setMonthCount(Number(v))} disabled={viewMode}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4, 5, 6, 12].map(n => (
                          <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {/* Manual Amounts Input */}
              {distributionType === "manual" && (
                <div className="space-y-3">
                  <Label>Kuukausikohtaiset summat (€)</Label>
                  {allocationContext.mode === "single" ? (
                    <div className="space-y-2">
                      {(allocationMethod === "employment" 
                        ? generateMonthsFromEmployment() 
                        : generateMonthsFromPayDate(allocationContext.payDate, monthCount, direction)
                      ).map(m => {
                        const key = `${m.year}-${m.month}`;
                        const monthName = new Date(m.year, m.month - 1, 1).toLocaleDateString('fi-FI', { year: 'numeric', month: 'long' });
                        
                        return (
                          <div key={key} className="flex gap-3 items-center">
                            <div className="w-48 text-sm font-medium">{monthName}</div>
                            <Input
                              type="number"
                              step="0.01"
                              value={manualAmounts[key] ?? 0}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setManualAmounts(prev => ({ ...prev, [key]: val }));
                              }}
                              className="w-40"
                              disabled={viewMode}
                            />
                            <span className="text-sm text-gray-500">€</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {allocationContext.sourceRows.map(row => {
                        const rowAmount = row.alkuperainenTulo > 0 ? row.alkuperainenTulo : row.palkka;
                        const months = allocationMethod === "employment" 
                          ? generateMonthsFromEmployment() 
                          : generateMonthsFromPayDate(allocationContext.payDate, monthCount, direction);
                        
                        return (
                          <div key={row.id} className="border rounded-lg p-3 bg-gray-50">
                            <div className="text-sm font-semibold mb-2">{row.tulolaji} ({formatCurrency(rowAmount)} €)</div>
                            <div className="space-y-2">
                              {months.map(m => {
                                const key = `${row.id}-${m.year}-${m.month}`;
                                const monthName = new Date(m.year, m.month - 1, 1).toLocaleDateString('fi-FI', { year: 'numeric', month: 'long' });
                                
                                return (
                                  <div key={key} className="flex gap-3 items-center">
                                    <div className="w-40 text-sm">{monthName}</div>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={manualAmounts[key] ?? 0}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0;
                                        setManualAmounts(prev => ({ ...prev, [key]: val }));
                                      }}
                                      className="w-32 text-sm"
                                      disabled={viewMode}
                                    />
                                    <span className="text-xs text-gray-500">€</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Validation Status */}
              <div className="flex items-center gap-2">
                {validation.valid ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-700">{validation.message}</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-medium text-red-700">{validation.message}</span>
                  </>
                )}
              </div>

              {/* Preview */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Esikatselu</Label>
                
                {allocationContext.mode === "single" ? (
                  <div className="overflow-auto border rounded-lg">
                    <table className="min-w-full text-sm">
                      <thead className="bg-[#003479] text-white">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium">Kuukausi</th>
                          {distributionType === "byDays" && (
                            <>
                              <th className="px-4 py-2 text-left font-medium">Ajankohta</th>
                              <th className="px-4 py-2 text-center font-medium">Päivät</th>
                            </>
                          )}
                          <th className="px-4 py-2 text-right font-medium">Summa (€)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewSplits.map((split, idx) => {
                          const monthName = new Date(split.year, split.month - 1, 1).toLocaleDateString('fi-FI', { year: 'numeric', month: 'long' });
                          
                          // Calculate days for byDays mode
                          let days = 0;
                          if (distributionType === "byDays") {
                            const start = new Date(split.earningStart);
                            const end = new Date(split.earningEnd);
                            days = daysBetween(start, end);
                          }
                          
                          return (
                            <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                              <td className="px-4 py-2">{monthName}</td>
                              {distributionType === "byDays" && (
                                <>
                                  <td className="px-4 py-2 text-xs text-gray-600">
                                    {isoToFI(split.earningStart)} – {isoToFI(split.earningEnd)}
                                  </td>
                                  <td className="px-4 py-2 text-center font-medium">{days}</td>
                                </>
                              )}
                              <td className="px-4 py-2 text-right font-medium">{formatCurrency(split.amount)}</td>
                            </tr>
                          );
                        })}
                        <tr className="bg-gray-100 font-semibold">
                          <td className="px-4 py-2" colSpan={distributionType === "byDays" ? 3 : 1}>Yhteensä</td>
                          <td className="px-4 py-2 text-right">
                            {distributionType === "byDays" && (
                              <span className="mr-4 text-xs text-gray-600">
                                ({previewSplits.reduce((sum, s) => {
                                  const start = new Date(s.earningStart);
                                  const end = new Date(s.earningEnd);
                                  return sum + daysBetween(start, end);
                                }, 0)} pv yhteensä)
                              </span>
                            )}
                            {formatCurrency(previewSplits.reduce((sum, s) => sum + s.amount, 0))}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="overflow-auto border rounded-lg">
                    <table className="min-w-full text-sm">
                      <thead className="bg-[#003479] text-white">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium">Kuukausi</th>
                          <th className="px-4 py-2 text-left font-medium">Tulolaji</th>
                          {distributionType === "byDays" && (
                            <>
                              <th className="px-4 py-2 text-left font-medium">Ajankohta</th>
                              <th className="px-4 py-2 text-center font-medium">Päivät</th>
                            </>
                          )}
                          <th className="px-4 py-2 text-right font-medium">Summa (€)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aggregatedByMonth.map((monthData, mIdx) => {
                          const monthName = new Date(monthData.year, monthData.month - 1, 1).toLocaleDateString('fi-FI', { year: 'numeric', month: 'long' });
                          
                          return (
                            <React.Fragment key={`${monthData.year}-${monthData.month}`}>
                              {monthData.items.map((split, sIdx) => {
                                // Calculate days for byDays mode
                                let days = 0;
                                if (distributionType === "byDays") {
                                  const start = new Date(split.earningStart);
                                  const end = new Date(split.earningEnd);
                                  days = daysBetween(start, end);
                                }
                                
                                return (
                                  <tr key={`${mIdx}-${sIdx}`} className={mIdx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                    {sIdx === 0 && (
                                      <td className="px-4 py-2 font-medium" rowSpan={monthData.items.length}>
                                        {monthName}
                                      </td>
                                    )}
                                    <td className="px-4 py-2 text-xs">{split.incomeType}</td>
                                    {distributionType === "byDays" && (
                                      <>
                                        <td className="px-4 py-2 text-xs text-gray-600">
                                          {isoToFI(split.earningStart)} – {isoToFI(split.earningEnd)}
                                        </td>
                                        <td className="px-4 py-2 text-center font-medium">{days}</td>
                                      </>
                                    )}
                                    <td className="px-4 py-2 text-right">{formatCurrency(split.amount)}</td>
                                  </tr>
                                );
                              })}
                              <tr className={mIdx % 2 === 0 ? "bg-blue-50" : "bg-blue-100"}>
                                <td className="px-4 py-1 text-xs font-semibold" colSpan={distributionType === "byDays" ? 4 : 2}>
                                  Yhteensä {monthName}
                                </td>
                                <td className="px-4 py-1 text-right text-xs font-semibold">
                                  {formatCurrency(monthData.total)}
                                </td>
                              </tr>
                            </React.Fragment>
                          );
                        })}
                        <tr className="bg-gray-100 font-semibold">
                          <td className="px-4 py-2" colSpan={distributionType === "byDays" ? 4 : 2}>Kaikki yhteensä</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(previewSplits.reduce((sum, s) => sum + s.amount, 0))}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            {viewMode && (
              <Button 
                variant="destructive" 
                onClick={() => {
                  // Poista kohdistus ja mahdollista uusi
                  removeAllocation();
                  setViewMode(false); // Poista lukitus
                  // Modaali pysyy auki, käyttäjä voi tehdä uuden kohdistuksen
                }}
              >
                Poista kohdistus ja luo uusi
              </Button>
            )}
            <DialogClose asChild>
              <Button variant="secondary">Peruuta</Button>
            </DialogClose>
            {!viewMode && (
              <Button 
                onClick={applyAllocation} 
                disabled={!validation.valid}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300"
              >
                Suorita kohdistus
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Income Modal */}
      <Dialog open={addIncomeModalOpen} onOpenChange={setAddIncomeModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>LISÄÄ TULOTIETO</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Employment Relationships Section */}
            <div className="pt-4">
              <h3 className="text-lg font-semibold mb-4">Palvelussuhteet</h3>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-4">
                <div>
                  <Label>Työnantaja</Label>
                  <Select value={selectedEmployer} onValueChange={setSelectedEmployer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Valitse" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Espoon kaupunki">Espoon kaupunki</SelectItem>
                      <SelectItem value="Nokia Oyj">Nokia Oyj</SelectItem>
                      <SelectItem value="Posti Oyj">Posti Oyj</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Alkupäivä</Label>
                  <Input 
                    placeholder="PP.KK.VVVV" 
                    value={employmentStartDate}
                    onChange={(e) => setEmploymentStartDate(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Loppupäivä</Label>
                  <Input 
                    placeholder="PP.KK.VVVV" 
                    value={employmentEndDate}
                    onChange={(e) => setEmploymentEndDate(e.target.value)}
                  />
                </div>
                
                <div className="flex items-end">
                  
                </div>
              </div>

              {/* Employment Relationships Table */}
              <div className="overflow-auto rounded-xl border">
                <table className="min-w-full text-sm">
                <thead className="text-white" style={{backgroundColor: '#5F686D'}}>
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Valinta</th>
                      <th className="px-3 py-2 text-left font-medium">Työnantaja</th>
                      <th className="px-3 py-2 text-left font-medium">Selite</th>
                      <th className="px-3 py-2 text-left font-medium">Alkupäivä</th>
                      <th className="px-3 py-2 text-left font-medium">Loppupäivä</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployments.map((emp, idx) => (
                      <tr key={emp.id} className={cn("border-b", idx % 2 === 0 ? "bg-white" : "bg-gray-50")}>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedEmploymentIds.includes(emp.id)}
                            onChange={() => toggleEmploymentSelection(emp.id)}
                          />
                        </td>
                        <td className="px-3 py-2">{emp.employer}</td>
                        <td className="px-3 py-2">{emp.description}</td>
                        <td className="px-3 py-2">{emp.startDate}</td>
                        <td className="px-3 py-2">{emp.endDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-2">
                <Link href="#" className="text-blue-600 hover:underline text-sm">
                  Palvelussuhde- ja yritystoimintatiedot
                </Link>
              </div>
            </div>

            {/* Income Details Section */}
            <div className="pt-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Label>Maksupäivä</Label>
                  <Input 
                    placeholder="PP.KK.VVVV" 
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Tulolaji</Label>
                  <Select value={incomeType} onValueChange={setIncomeType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INCOME_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Palkka</Label>
                  <Input 
                    placeholder="Täydennä summa" 
                    value={salaryAmount}
                    onChange={(e) => setSalaryAmount(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Earning Period Section */}
            <div className="pt-4">
              <h3 className="text-lg font-semibold mb-4">Ansainta-aika</h3>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label>Alkupäivä</Label>
                  <Input 
                    placeholder="PP.KK.VVVV" 
                    value={earningStartDate}
                    onChange={(e) => setEarningStartDate(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Loppupäivä</Label>
                  <Input 
                    placeholder="PP.KK.VVVV" 
                    value={earningEndDate}
                    onChange={(e) => setEarningEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Peruuta</Button>
            </DialogClose>
            <Button 
              onClick={handleAddIncome}
              className="bg-green-600 hover:bg-green-700"
            >
              Tallenna ja sulje
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
