"use client";


import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import type { IncomeRow, SubsidyCorrection } from "../allocateincome/types";
import { INCOME_TYPES, NON_BENEFIT_AFFECTING_INCOME_TYPES } from "../allocateincome/types";
import SubsidizedWorkDrawer from "../allocateincome/components/SubsidizedWorkDrawer";

// ============================================================================
// Mass Income Split – Next.js + Tailwind (suomi.fi style) Prototype
// Notes
// - Filtering works: employer, income type (incl. "All"), time period, subsidized.
// - Summary shows filtered sum and 75% of subsidized.
// - Target income type = filter income type; if "All", selected in modal.
// - Split basis is always source row's SALARY; "Original income" shows source's original salary.
// - "Percentage + 1/3 and 2/3": 1/3 and 2/3 calculated from deducted amount and SOURCE ROW gets
//   remaining portion after deduction (base - deducted). In other splits source row is zeroed.
// - Modal is properly closed (no JSX errors). All state functions like setOpen are inside component.
// - Contains lightweight console tests for calcSplit function.
// ============================================================================

// --- Types & mock data ------------------------------------------------------

// Use shared IncomeRow type from allocateincome/types.ts instead of local Row type
// This allows us to use the same type across components and add subsidized work fields

// Subsidized employers
const SUBSIDIZED_EMPLOYERS = new Set<string>(["Nokia Oyj"]);

const MOCK_ROWS: IncomeRow[] = [
  { id: "0", maksupaiva: "1.11.2026", tulolaji: "Aikapalkka", palkka: 2500, alkuperainenTulo: 0, ansaintaAika: "1.10.2026 – 31.10.2026", tyonantaja: "Supercell Oy" },
  { id: "1", maksupaiva: "8.10.2026", tulolaji: "Aikapalkka", palkka: 800, alkuperainenTulo: 0, ansaintaAika: "1.1.2025 – 31.12.2025", tyonantaja: "Nokia Oyj", kohdistusTOE: "", isSubsidized: true },
  { id: "2", maksupaiva: "8.9.2026", tulolaji: "Aikapalkka", palkka: 800, alkuperainenTulo: 0, ansaintaAika: "1.1.2025 – 31.12.2025", tyonantaja: "Nokia Oyj", isSubsidized: true },
  { id: "3", maksupaiva: "8.8.2026", tulolaji: "Aikapalkka", palkka: 1200, alkuperainenTulo: 0, ansaintaAika: "1.1.2025 – 31.12.2025", tyonantaja: "Kone Oyj" },
  { id: "4", maksupaiva: "18.8.2026", tulolaji: "Vuosilomakorvaus", palkka: 600, alkuperainenTulo: 0, ansaintaAika: "1.6.2026 – 31.8.2026", tyonantaja: "Posti Oy" },
  { id: "5", maksupaiva: "28.8.2026", tulolaji: "Vuosilomakorvaus", palkka: 900, alkuperainenTulo: 0, ansaintaAika: "1.6.2026 – 31.8.2026", tyonantaja: "Nokia Oyj", isSubsidized: true },
  { id: "6", maksupaiva: "5.7.2026", tulolaji: "Lomaraha", palkka: 700, alkuperainenTulo: 0, ansaintaAika: "1.7.2026 – 31.7.2026", tyonantaja: "Kone Oyj" },
  { id: "7", maksupaiva: "15.6.2026", tulolaji: "Aikapalkka", palkka: 1600, alkuperainenTulo: 0, ansaintaAika: "1.6.2026 – 30.6.2026", tyonantaja: "Supercell Oy" },
  { id: "8", maksupaiva: "28.5.2026", tulolaji: "Vuosilomakorvaus", palkka: 500, alkuperainenTulo: 0, ansaintaAika: "1.5.2026 – 31.5.2026", tyonantaja: "Posti Oy" },
  { id: "9", maksupaiva: "10.4.2026", tulolaji: "Lomaraha", palkka: 450, alkuperainenTulo: 0, ansaintaAika: "1.4.2026 – 30.4.2026", tyonantaja: "Kone Oyj" },
  { id: "10", maksupaiva: "5.3.2026", tulolaji: "Aikapalkka", palkka: 2800, alkuperainenTulo: 0, ansaintaAika: "1.3.2026 – 31.3.2026", tyonantaja: "Nokia Oyj", isSubsidized: true }
];

// --- Utils -----------------------------------------------------------------
function formatCurrency(n: number) {
  return n.toLocaleString("fi-FI", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function roundToCents(n: number) {
  return Math.round(n * 100) / 100;
}

// Parse date like "8.10.2026" → Date | null
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

// --- Splitting -------------------------------------------------------------

type SplitType = "ONE_THIRD_TWO_THIRDS" | "PERCENT" | "PERCENT_PLUS_SPLIT";

export function calcSplit(rows: IncomeRow[], opts: { splitType: SplitType; percent?: number }) {
  const percent = (opts.percent ?? 0) / 100;
  return rows.map((r) => {
    const base = r.palkka; // base from current palkka
    if (opts.splitType === "ONE_THIRD_TWO_THIRDS") {
      return {
        id: r.id,
        maksupaiva: r.maksupaiva,
        alkuperainenTulo: base,
        oneThird: roundToCents(base / 3),
        twoThirds: roundToCents((base / 3) * 2),
      } as any;
    }
    if (opts.splitType === "PERCENT") {
      const amount = roundToCents(base * percent);
      return { id: r.id, maksupaiva: r.maksupaiva, alkuperainenTulo: base, prosentti: opts.percent, erotettava: amount } as any;
    }
    const erotettavaMaara = roundToCents(base * percent);
    const oneThird = roundToCents(erotettavaMaara / 3);
    const twoThirds = roundToCents((erotettavaMaara / 3) * 2);
    return { id: r.id, maksupaiva: r.maksupaiva, alkuperainenTulo: base, prosentti: opts.percent, erotettava: erotettavaMaara, oneThird, twoThirds } as any;
  });
}

// --- Lightweight tests for calcSplit --------------------------------------
function almostEqual(a: number, b: number, eps = 0.01) { return Math.abs(a - b) <= eps; }
function assertAlmostEqual(actual: number, expected: number, msg: string) {
  if (!almostEqual(actual, expected)) {
    console.error(`❌ ${msg}. Expected ${expected}, got ${actual}`);
    throw new Error(msg);
  }
}
function runCalcSplitTests() {
  // 1: 1/3–2/3 from 2400
  const t1 = calcSplit([{ id: "t1", maksupaiva: "", tulolaji: "", palkka: 2400, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "" } as IncomeRow], { splitType: "ONE_THIRD_TWO_THIRDS" });
  assertAlmostEqual((t1[0] as any).oneThird, 800, "ONE_THIRD_TWO_THIRDS oneThird");
  assertAlmostEqual((t1[0] as any).twoThirds, 1600, "ONE_THIRD_TWO_THIRDS twoThirds");

  // 2: 9% of 2000 → 180
  const t2 = calcSplit([{ id: "t2", maksupaiva: "", tulolaji: "", palkka: 2000, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "" } as IncomeRow], { splitType: "PERCENT", percent: 9 });
  assertAlmostEqual((t2[0] as any).erotettava, 180, "PERCENT erotettava");

  // 3: 18.5% of 2100 = 388.5 → thirds from deducted
  const t3 = calcSplit([{ id: "t3", maksupaiva: "", tulolaji: "", palkka: 2100, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "" } as IncomeRow], { splitType: "PERCENT_PLUS_SPLIT", percent: 18.5 });
  assertAlmostEqual((t3[0] as any).erotettava, 388.5, "PERCENT_PLUS_SPLIT erotettava");
  assertAlmostEqual((t3[0] as any).oneThird, 129.5, "PERCENT_PLUS_SPLIT oneThird");
  assertAlmostEqual((t3[0] as any).twoThirds, 259.0, "PERCENT_PLUS_SPLIT twoThirds");

  // 4: zero percent
  const t4 = calcSplit([{ id: "t4", maksupaiva: "", tulolaji: "", palkka: 1999, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "" } as IncomeRow], { splitType: "PERCENT", percent: 0 });
  assertAlmostEqual((t4[0] as any).erotettava, 0, "PERCENT zero percent");

  // 5: 9% of 2400 in percent+split → 216, 72, 144
  const t5 = calcSplit([{ id: "t5", maksupaiva: "", tulolaji: "", palkka: 2400, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "" } as IncomeRow], { splitType: "PERCENT_PLUS_SPLIT", percent: 9 });
  assertAlmostEqual((t5[0] as any).erotettava, 216, "PERCENT_PLUS_SPLIT 9% deducted");
  assertAlmostEqual((t5[0] as any).oneThird, 72, "PERCENT_PLUS_SPLIT 1/3 of deducted");
  assertAlmostEqual((t5[0] as any).twoThirds, 144, "PERCENT_PLUS_SPLIT 2/3 of deducted");

  // 6: empty input
  const t6 = calcSplit([], { splitType: "PERCENT", percent: 50 });
  if (t6.length !== 0) throw new Error("Empty input should yield empty result");

  // 7: rounding
  const t7 = calcSplit([{ id: "t7", maksupaiva: "", tulolaji: "", palkka: 1234.56, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "" } as IncomeRow], { splitType: "PERCENT", percent: 12.345 });
  assertAlmostEqual((t7[0] as any).erotettava, 152.41, "Rounding to cents");

  // 8: 100% case
  const t8 = calcSplit([{ id: "t8", maksupaiva: "", tulolaji: "", palkka: 90, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "" } as IncomeRow], { splitType: "PERCENT_PLUS_SPLIT", percent: 100 });
  assertAlmostEqual((t8[0] as any).erotettava, 90, "PERCENT_PLUS_SPLIT 100% deducted");
  assertAlmostEqual((t8[0] as any).oneThird, 30, "PERCENT_PLUS_SPLIT 1/3 at 100%");
  assertAlmostEqual((t8[0] as any).twoThirds, 60, "PERCENT_PLUS_SPLIT 2/3 at 100%");

  // 9: remainder idea check (base - erotettava)
  const base = 1000;
  const p = 15;
  const t9 = calcSplit([{ id: "t9", maksupaiva: "", tulolaji: "", palkka: base, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "" } as IncomeRow], { splitType: "PERCENT_PLUS_SPLIT", percent: p });
  const deducted = (t9[0] as any).erotettava as number;
  assertAlmostEqual(base - deducted, 850, "Remainder = base - deducted");

  console.log("✅ calcSplit tests passed");
}
if (typeof window !== "undefined") {
  // run once in browser
  // @ts-ignore
  if (!(window as any).__MASS_SPLIT_TESTED__) {
    // @ts-ignore
    (window as any).__MASS_SPLIT_TESTED__ = true;
    try { runCalcSplitTests(); } catch (e) { /* surface in console */ }
  }
}

// --- Helpers ---------------------------------------------------------------
function newId() {
  try {
    // @ts-ignore
    if (typeof crypto !== "undefined" && (crypto as any).randomUUID) return (crypto as any).randomUUID();
  } catch {}
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// --- Main component --------------------------------------------------------
export default function MassIncomeSplitPrototype() {
  // Read income rows from sessionStorage (from Allocateincome), fallback to MOCK_ROWS
  const [rows, setRows] = useState<IncomeRow[]>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("incomeRows");
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as IncomeRow[];
          // Only use stored data if it's not empty
          if (parsed && parsed.length > 0) {
            return parsed;
          }
        } catch (e) {
          console.error("Failed to parse income rows from sessionStorage:", e);
        }
      }
    }
    // Fallback to mock data if sessionStorage doesn't have data
    return MOCK_ROWS;
  });

  // Dynaamiset työnantajavaihtoehdot + "Kaikki työnantajat"
  const employerOptions = useMemo(
    () => ["Kaikki työnantajat", ...Array.from(new Set(rows.map(r => r.tyonantaja)))],
    [rows]
  );

  // Filters
  const [employer, setEmployer] = useState("Kaikki työnantajat");
  const [incomeType, setIncomeType] = useState("Aikapalkka"); // voi olla "Kaikki"
  const [onlySubsidized, setOnlySubsidized] = useState(false); // Changed default to false to show all rows
  const [hideNonBenefitAffecting, setHideNonBenefitAffecting] = useState(true); // Default: hide non-benefit affecting income types
  const [dateFromStr, setDateFromStr] = useState("");
  const [dateToStr, setDateToStr] = useState("");

  const dateFrom = useMemo(() => parseFinnishDate(dateFromStr), [dateFromStr]);
  const dateTo = useMemo(() => parseFinnishDate(dateToStr), [dateToStr]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (employer !== "Kaikki työnantajat" && r.tyonantaja !== employer) return false;
      if (incomeType && incomeType !== "Kaikki" && r.tulolaji !== incomeType) return false;
      // Use isSubsidized field if available, otherwise fall back to SUBSIDIZED_EMPLOYERS set
      if (onlySubsidized) {
        if (r.isSubsidized !== undefined) {
          if (!r.isSubsidized) return false;
        } else {
          // Fallback to old logic if isSubsidized is not set
          if (!SUBSIDIZED_EMPLOYERS.has(r.tyonantaja)) return false;
        }
      }
      // Filter out non-benefit affecting income types if hideNonBenefitAffecting is true
      // UNLESS they are explicitly marked as "Huomioitu laskennassa"
      if (hideNonBenefitAffecting) {
        if (NON_BENEFIT_AFFECTING_INCOME_TYPES.includes(r.tulolaji)) {
          // Only show if explicitly marked as included in calculation
          if (!r.huom?.includes("Huomioitu laskennassa")) {
            return false;
          }
        }
      }
      const d = parseFinnishDate(r.maksupaiva);
      if (dateFrom && d && d < dateFrom) return false;
      if (dateTo && d && d > dateTo) return false;
      return true;
    });
  }, [rows, employer, incomeType, onlySubsidized, hideNonBenefitAffecting, dateFrom, dateTo]);

  // Selection (for filtered set) - initialize with all row IDs
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    // Initialize with all row IDs when component mounts
    return rows.map((r) => r.id);
  });
  
  // Update selectedIds when rows change (e.g., when data is loaded from sessionStorage)
  // This ensures that when new data is loaded, all rows are selected by default
  const rowIdsString = useMemo(() => rows.map(r => r.id).join(','), [rows]);
  React.useEffect(() => {
    if (rows.length > 0) {
      const currentRowIds = rows.map(r => r.id);
      // Reset selection to all rows when data changes
      setSelectedIds(currentRowIds);
    }
  }, [rowIdsString]); // Depend on row IDs string to detect changes
  const selectedRowsFiltered = useMemo(() => filteredRows.filter((r) => selectedIds.includes(r.id)), [filteredRows, selectedIds]);
  
  // Selected subsidized rows for drawer
  const selectedSubsidizedRows = useMemo(() => {
    return selectedRowsFiltered.filter((r) => {
      const isSubsidized = r.isSubsidized !== undefined 
        ? r.isSubsidized 
        : SUBSIDIZED_EMPLOYERS.has(r.tyonantaja);
      return isSubsidized;
    });
  }, [selectedRowsFiltered]);

  // Summary over filtered
  const totalFiltered = useMemo(() => filteredRows.reduce((s, r) => s + r.palkka, 0), [filteredRows]);
  const subsidizedFiltered = useMemo(() => {
    return filteredRows.reduce((s, r) => {
      // Use isSubsidized field if available, otherwise fall back to SUBSIDIZED_EMPLOYERS set
      const isSubsidized = r.isSubsidized !== undefined 
        ? r.isSubsidized 
        : SUBSIDIZED_EMPLOYERS.has(r.tyonantaja);
      return s + (isSubsidized ? r.palkka : 0);
    }, 0);
  }, [filteredRows]);

  // Show "Original income" column only if any filtered row has it
  const showOriginal = useMemo(() => filteredRows.some(r => (r.alkuperainenTulo ?? 0) > 0), [filteredRows]);

  // Modal state & split config
  const [open, setOpen] = useState(false);
  
  // Subsidized work drawer state
  const [subsidyDrawerOpen, setSubsidyDrawerOpen] = useState(false);
  
  // Read TOE and total salary from sessionStorage (from Allocateincome), fallback to defaults
  const [toeSystemTotal] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("toeSystemTotal");
      if (stored) {
        try {
          return JSON.parse(stored) as number;
        } catch (e) {
          console.error("Failed to parse toeSystemTotal from sessionStorage:", e);
        }
      }
    }
    return 12; // Default fallback
  });

  const [systemTotalSalary] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("systemTotalSalary");
      if (stored) {
        try {
          return JSON.parse(stored) as number;
        } catch (e) {
          console.error("Failed to parse systemTotalSalary from sessionStorage:", e);
        }
      }
    }
    return 0; // Default fallback
  });

  const [periodCount] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("periodCount");
      if (stored) {
        try {
          return JSON.parse(stored) as number;
        } catch (e) {
          console.error("Failed to parse periodCount from sessionStorage:", e);
        }
      }
    }
    return 12; // Default fallback
  });
  const [splitType, setSplitType] = useState<SplitType>("ONE_THIRD_TWO_THIRDS");
  const [modalSourceType, setModalSourceType] = useState<string>("");
  const uniqueSelectedTypes = useMemo(() => Array.from(new Set(selectedRowsFiltered.map(r => r.tulolaji))), [selectedRowsFiltered]);
  const kohdistettuTulolaji = incomeType === "Kaikki" ? modalSourceType : incomeType; // lähde
  const [erotettavaTulolaji, setErotettavaTulolaji] = useState("Vuosilomakorvaus"); // vain prosentuaalinen
  const [selectOneThird, setSelectOneThird] = useState("Lomaraha");
  const [selectTwoThirds, setSelectTwoThirds] = useState("Aikapalkka");
  const [percent, setPercent] = useState<number>(18.5);

  const selectedSourceRows = useMemo(
    () => (kohdistettuTulolaji ? selectedRowsFiltered.filter((r) => r.tulolaji === kohdistettuTulolaji) : []),
    [selectedRowsFiltered, kohdistettuTulolaji]
  );
  const preview = useMemo(
    () => calcSplit(selectedSourceRows.map((r) => ({ ...r, alkuperainenTulo: r.palkka })), { splitType, percent }),
    [selectedSourceRows, splitType, percent]
  );

  function toggleSelectAllFiltered(checked: boolean) {
    setSelectedIds((prev) => {
      if (checked) {
        const ids = new Set(prev);
        filteredRows.forEach((r) => ids.add(r.id));
        return Array.from(ids);
      } else {
        return prev.filter((id) => !filteredRows.some((r) => r.id === id));
      }
    });
  }
  function isAllFilteredSelected() {
    return filteredRows.length > 0 && filteredRows.every((r) => selectedIds.includes(r.id));
  }

  // --- performSplit lives INSIDE the component and uses setOpen from state ---
  function performSplit() {
    if (!kohdistettuTulolaji) return; // when income type = "All", source must be selected first
    const next: IncomeRow[] = [];
    for (const r of rows) {
      const rowIsSelected = selectedIds.includes(r.id);
      const typeMatches = r.tulolaji === kohdistettuTulolaji;
      if (!rowIsSelected || !typeMatches) {
        next.push(r);
        continue;
      }
      const base = r.palkka;

      if (splitType === "ONE_THIRD_TWO_THIRDS") {
        const oneThird = roundToCents(base / 3);
        const twoThirds = roundToCents((base / 3) * 2);
        // source is zeroed
        const zeroed: IncomeRow = { ...r, palkka: 0, alkuperainenTulo: base };
        next.push(zeroed);
        // for target rows "Original income" = base
        next.push({ ...r, id: newId(), tulolaji: selectOneThird, palkka: oneThird, alkuperainenTulo: base });
        next.push({ ...r, id: newId(), tulolaji: selectTwoThirds, palkka: twoThirds, alkuperainenTulo: base });
     } else if (splitType === "PERCENT") {
  const erotettava = roundToCents(base * (percent / 100));
  const remaining = roundToCents(base - erotettava);

  // Source gets reduced amount (NOT zeroed)
  const updatedSource: IncomeRow = { ...r, palkka: remaining, alkuperainenTulo: base };
  next.push(updatedSource);

  // New row for deducted amount to selected income type
  next.push({
    ...r,
    id: newId(),
    tulolaji: erotettavaTulolaji,
    palkka: erotettava,
    alkuperainenTulo: base,
  });
} else if (splitType === "PERCENT_PLUS_SPLIT") {

        const erotettava = roundToCents(base * (percent / 100));
        const oneThird = roundToCents(erotettava / 3);
        const twoThirds = roundToCents((erotettava / 3) * 2);
        const remaining = roundToCents(base - erotettava);
        // source gets remaining portion after deduction
        const updatedSource: IncomeRow = { ...r, palkka: remaining, alkuperainenTulo: base };
        next.push(updatedSource);
        next.push({ ...r, id: newId(), tulolaji: selectOneThird, palkka: oneThird, alkuperainenTulo: base });
        next.push({ ...r, id: newId(), tulolaji: selectTwoThirds, palkka: twoThirds, alkuperainenTulo: base });
      }
    }
    setRows(next);
    setOpen(false);
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Suodata tulotiedot</h1>
        </header>

        <Card className="p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            <div className="md:col-span-1">
              <Label className="mb-1">Työnantaja</Label>
              <Select value={employer} onValueChange={(v) => setEmployer(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Valitse työnantaja" />
                </SelectTrigger>
                <SelectContent>
                  {employerOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-1">
              <Label className="mb-1">Tulolaji</Label>
              <Select value={incomeType} onValueChange={(v) => setIncomeType(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Valitse tulolaji" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kaikki">Kaikki</SelectItem>
                  {INCOME_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-1">
              <Label className="mb-1">Alkaen</Label>
              <Input placeholder="PP.KK.VVVV" value={dateFromStr} onChange={(e) => setDateFromStr(e.target.value)} />
            </div>
            <div className="md:col-span-1">
              <Label className="mb-1">Päättyen</Label>
              <Input placeholder="PP.KK.VVVV" value={dateToStr} onChange={(e) => setDateToStr(e.target.value)} />
            </div>
            <div className="md:col-span-2 flex items-end gap-4">
              <div className="flex items-center gap-2">
                <Checkbox checked={onlySubsidized} onCheckedChange={(v) => setOnlySubsidized(Boolean(v))} id="only-subsidized" />
                <Label htmlFor="only-subsidized">Vain palkkatuettu</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={hideNonBenefitAffecting} onCheckedChange={(v) => setHideNonBenefitAffecting(Boolean(v))} id="hide-non-benefit" />
                <Label htmlFor="hide-non-benefit" className="text-sm">Piilota laskentaan vaikuttamattomat</Label>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-teal-50 px-4 py-3 text-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">
                Valitut rivit <span className="font-semibold">{selectedRowsFiltered.length}</span> / {filteredRows.length}
              </div>
              <div className="flex items-center gap-6">
                <div>Yhteensä <span className="font-semibold">{formatCurrency(totalFiltered)}</span></div>
                {onlySubsidized && subsidizedFiltered > 0 && (
                  <div>75% palkkatuetuista <span className="font-semibold">{formatCurrency(roundToCents(subsidizedFiltered * 0.75))}</span></div>
                )}
              </div>
            </div>
            {selectedSubsidizedRows.length > 0 && (
              <div className="mt-3 pt-3 border-t border-teal-200 flex items-center justify-between">
                <div>
                  <span className="font-medium">Palkkatuetut rivit: </span>
                  <span className="font-semibold">{selectedSubsidizedRows.length}</span>
                  <span className="ml-2">Brutto: </span>
                  <span className="font-semibold">{formatCurrency(selectedSubsidizedRows.reduce((sum, r) => sum + r.palkka, 0))}</span>
                </div>
                <Button
                  onClick={() => setSubsidyDrawerOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Korjaa palkkatukityön vaikutukset laskentaan
                </Button>
              </div>
            )}
          </div>

          <div className="mt-4 overflow-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-[#003479] text-white text-left">
                <tr>
                  <th className="px-3 py-2 w-10">
                    <input
                      type="checkbox"
                      aria-label="Valitse kaikki"
                      checked={isAllFilteredSelected()}
                      onChange={(e) => toggleSelectAllFiltered(e.target.checked)}
                    />
                  </th>
                  <th className="px-3 py-2">Maksupäivä</th>
                  <th className="px-3 py-2">Tulolaji</th>
                  <th className="px-3 py-2">Palkka</th>
                  {showOriginal && (<th className="px-3 py-2">Alkuperäinen tulo</th>) }
                  <th className="px-3 py-2">Ansainta-aika</th>
                  <th className="px-3 py-2">Kohdistus TOE</th>
                  <th className="px-3 py-2">Työnantajat</th>
                  <th className="px-3 py-2">Toiminto</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r) => (
                  <tr key={r.id} className="odd:bg-white even:bg-gray-50">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(r.id)}
                        onChange={(e) =>
                          setSelectedIds((prev) =>
                            e.target.checked ? [...prev, r.id] : prev.filter((id) => id !== r.id)
                          )
                        }
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.maksupaiva}</td>
                    <td className="px-3 py-2">{r.tulolaji}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(r.palkka)}</td>
                    {showOriginal && (<td className="px-3 py-2 text-right">{formatCurrency(r.alkuperainenTulo)}</td>)}
                    <td className="px-3 py-2 whitespace-nowrap">{r.ansaintaAika ?? ""}</td>
                    <td className="px-3 py-2">{r.kohdistusTOE ?? ""}</td>
                    <td className="px-3 py-2">
                      {r.tyonantaja}
                      {(r.isSubsidized !== undefined ? r.isSubsidized : SUBSIDIZED_EMPLOYERS.has(r.tyonantaja)) 
                        ? " (palkkatuettu)" 
                        : ""}
                    </td>
                    <td className="px-3 py-2 text-right">⋯⋯⋯</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={() => setOpen(true)}>Massatoiminnot</Button>
            <Button variant="ghost" onClick={() => setSelectedIds([])}>Tyhjennä valinnat</Button>
          </div>
        </Card>

        <div className="flex justify-between">
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => {
              // Save updated rows back to sessionStorage so Allocateincome can read them
              if (typeof window !== "undefined") {
                sessionStorage.setItem("incomeRows", JSON.stringify(rows));
              }
              // Navigate back to Allocateincome
              if (typeof window !== "undefined") {
                window.history.back();
              }
            }}
          >
            Tallenna ja sulje
          </Button>
        </div>
      </div>

      {/* Subsidized Work Drawer */}
      <SubsidizedWorkDrawer
        open={subsidyDrawerOpen}
        onOpenChange={setSubsidyDrawerOpen}
        rows={selectedSubsidizedRows}
        toeSystemTotal={toeSystemTotal}
        systemTotalSalary={systemTotalSalary}
        periodCount={periodCount}
        onApplyCorrection={(correction) => {
          // Save correction to sessionStorage for Allocateincome to read
          if (typeof window !== "undefined") {
            sessionStorage.setItem("subsidyCorrection", JSON.stringify(correction));
          }
          // Update rows with subsidy rule if needed
          setRows((prevRows) =>
            prevRows.map((row) => {
              if (selectedSubsidizedRows.some((sr) => sr.id === row.id)) {
                return {
                  ...row,
                  isSubsidized: true,
                  subsidyRule: correction.rule,
                };
              }
              return row;
            })
          );
        }}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle><div className="text-gray-900 dark:text-gray-100">Massatoiminnot</div></DialogTitle>
            <div className="text-gray-900 dark:text-gray-100"></div>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <div className="px-1 text-sm font-medium text-gray-600 mb-2">Kohdejoukko</div>
              <div className="flex gap-6 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="kohde" defaultChecked /> Valitut rivit
                </label>
                <label className="inline-flex items-center gap-2 opacity-100">
                  <input type="radio" name="kohde" disabled /> Kaikki suodatetut
                </label>
              </div>
            </div>

            <div>
              <div className="px-1 text-sm font-medium text-gray-600 mb-2">Jaon tyyppi</div>
              <Select value={splitType} onValueChange={(v: any) => setSplitType(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONE_THIRD_TWO_THIRDS">1/3 ja 2/3</SelectItem>
                  <SelectItem value="PERCENT">Prosentuaalinen</SelectItem>
                  <SelectItem value="PERCENT_PLUS_SPLIT">Prosentti + 1/3 ja 2/3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label className="px-1 text-sm font-medium text-gray-600 mb-2">Kohdistettu tulolaji (lähde)</Label>
                {incomeType === "Kaikki" ? (
                  <Select value={modalSourceType} onValueChange={setModalSourceType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Valitse tulolaji…" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueSelectedTypes.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="px-3 py-2 border rounded-lg text-sm bg-gray-50">{kohdistettuTulolaji}</div>
                )}
              </div>

              {splitType !== "ONE_THIRD_TWO_THIRDS" && (
                <div>
                  <Label className="mb-1">Erotettava määrä %</Label>
                  <Input type="number" step="0.1" min={0} max={100} value={Number.isFinite(percent) ? percent : 0} onChange={(e) => setPercent(parseFloat(e.target.value || "0"))} />
                </div>
              )}

              {splitType === "PERCENT" ? (
                <div>
                  <Label className="mb-1">Erotettava tulolaji (kohde)</Label>
                  <Select value={erotettavaTulolaji} onValueChange={setErotettavaTulolaji}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INCOME_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <>
                  <div>
                    <Label className="mb-1">Valitse 1/3</Label>
                    <Select value={selectOneThird} onValueChange={setSelectOneThird}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {INCOME_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1">Valitse 2/3</Label>
                    <Select value={selectTwoThirds} onValueChange={setSelectTwoThirds}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Aikapalkka">Aikapalkka</SelectItem>
                        <SelectItem value="Vuosilomakorvaus">Vuosilomakorvaus</SelectItem>
                        <SelectItem value="Lomaraha">Lomaraha</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold">Esikatselu</div>
              <div className="overflow-auto rounded-xl border">
                <table className="min-w-full text-sm">
                  <thead className="bg-[#003479] text-white text-left">
                    <tr>
                      <th className="px-3 py-2">Maksupäivä</th>
                      <th className="px-3 py-2 text-right">Alkuperäinen tulo</th>
                      {splitType === "PERCENT" && (
                        <>
                          <th className="px-3 py-2 text-right">Erotettava määrä</th>
                          <th className="px-3 py-2 text-right">Jäljelle jäävä</th>
                        </>
                      )}
                      {splitType === "ONE_THIRD_TWO_THIRDS" && (
                        <>
                          <th className="px-3 py-2 text-right">1/3</th>
                          <th className="px-3 py-2 text-right">2/3</th>
                        </>
                      )}
                      {splitType === "PERCENT_PLUS_SPLIT" && (
                        <>
                          <th className="px-3 py-2 text-right">Erotettava määrä</th>
                          <th className="px-3 py-2 text-right">1/3 </th>
                          <th className="px-3 py-2 text-right">2/3)</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((p: any) => (
                      <tr key={p.id} className="odd:bg-white even:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap">{p.maksupaiva}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(p.alkuperainenTulo)}</td>
                        {splitType === "PERCENT" && (
                          <>
                            <td className="px-3 py-2 text-right">{formatCurrency(p.erotettava)}</td>
                            <td className="px-3 py-2 text-right">
                              {formatCurrency(roundToCents(p.alkuperainenTulo - p.erotettava))}
                            </td>
                          </>
                        )}
                        {splitType === "ONE_THIRD_TWO_THIRDS" && (
                          <>
                            <td className="px-3 py-2 text-right">{formatCurrency(p.oneThird)}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(p.twoThirds)}</td>
                          </>
                        )}
                        {splitType === "PERCENT_PLUS_SPLIT" && (
                          <>
                            <td className="px-3 py-2 text-right">{formatCurrency(p.erotettava)}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(p.oneThird)}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(p.twoThirds)}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <DialogClose asChild>
              <Button variant="secondary">Sulje</Button>
            </DialogClose>
            <Button onClick={performSplit} disabled={!kohdistettuTulolaji || selectedSourceRows.length === 0}>Suorita jako</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
