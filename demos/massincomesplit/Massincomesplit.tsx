"use client";


import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";

// ============================================================================
// Mass Income Split – Next.js + Tailwind (suomi.fi style) Prototype
// Notes
// - Suodatus toimii: työnantaja, tulolaji (sis. "Kaikki"), aikaväli, palkkatuettu.
// - Yhteenveto näyttää suodatetun summan ja 75% palkkatuetuista.
// - Kohdistettu tulolaji = suodattimen tulolaji; jos "Kaikki", valitaan modaalissa.
// - Jaon perusta on aina lähderivin PALKKA; "Alkuperäinen tulo" näyttää lähteen alkuperäisen palkan.
// - "Prosentti + 1/3 ja 2/3": 1/3 ja 2/3 lasketaan erotettavasta määrästä ja LÄHDERIVILLE jää
//   erotuksen jäljelle jäävä osuus (base - erotettava). Muissa jaoissa lähderivi nollataan.
// - Modal on suljettu oikein (ei JSX-virheitä). Kaikki state-funktiot, kuten setOpen, ovat komponentin sisällä.
// - Sisältää kevyet konsolitestit calcSplit-funktiolle.
// ============================================================================

// --- Types & mock data ------------------------------------------------------

type Row = {
  id: string;
  maksupaiva: string; // esim. "8.10.2026"
  tulolaji: string;   // esim. "Aikapalkka"
  palkka: number;     // käytetään jaon perustana
  alkuperainenTulo: number; // näytetään mitä lähteellä oli ennen jakoa
  ansaintaAika?: string;
  kohdistusTOE?: string;
  tyonantaja: string;
};

// Palkkatuetut työnantajat
const SUBSIDIZED_EMPLOYERS = new Set<string>(["Nokia Oyj"]);

const MOCK_ROWS: Row[] = [
  { id: "0", maksupaiva: "1.11.2026", tulolaji: "Aikapalkka", palkka: 2500, alkuperainenTulo: 0, ansaintaAika: "1.10.2026 – 31.10.2026", tyonantaja: "Supercell Oy" },
  { id: "1", maksupaiva: "8.10.2026", tulolaji: "Aikapalkka", palkka: 800, alkuperainenTulo: 0, ansaintaAika: "1.1.2025 – 31.12.2025", tyonantaja: "Nokia Oyj", kohdistusTOE: "" },
  { id: "2", maksupaiva: "8.9.2026", tulolaji: "Aikapalkka", palkka: 800, alkuperainenTulo: 0, ansaintaAika: "1.1.2025 – 31.12.2025", tyonantaja: "Nokia Oyj" },
  { id: "3", maksupaiva: "8.8.2026", tulolaji: "Aikapalkka", palkka: 1200, alkuperainenTulo: 0, ansaintaAika: "1.1.2025 – 31.12.2025", tyonantaja: "Kone Oyj" },
  { id: "4", maksupaiva: "18.8.2026", tulolaji: "Vuosilomakorvaus", palkka: 600, alkuperainenTulo: 0, ansaintaAika: "1.6.2026 – 31.8.2026", tyonantaja: "Posti Oy" },
  { id: "5", maksupaiva: "28.8.2026", tulolaji: "Vuosilomakorvaus", palkka: 900, alkuperainenTulo: 0, ansaintaAika: "1.6.2026 – 31.8.2026", tyonantaja: "Nokia Oyj" },
  { id: "6", maksupaiva: "5.7.2026", tulolaji: "Lomaraha", palkka: 700, alkuperainenTulo: 0, ansaintaAika: "1.7.2026 – 31.7.2026", tyonantaja: "Kone Oyj" },
  { id: "7", maksupaiva: "15.6.2026", tulolaji: "Aikapalkka", palkka: 1600, alkuperainenTulo: 0, ansaintaAika: "1.6.2026 – 30.6.2026", tyonantaja: "Supercell Oy" },
  { id: "8", maksupaiva: "28.5.2026", tulolaji: "Vuosilomakorvaus", palkka: 500, alkuperainenTulo: 0, ansaintaAika: "1.5.2026 – 31.5.2026", tyonantaja: "Posti Oy" },
  { id: "9", maksupaiva: "10.4.2026", tulolaji: "Lomaraha", palkka: 450, alkuperainenTulo: 0, ansaintaAika: "1.4.2026 – 30.4.2026", tyonantaja: "Kone Oyj" },
  { id: "10", maksupaiva: "5.3.2026", tulolaji: "Aikapalkka", palkka: 2800, alkuperainenTulo: 0, ansaintaAika: "1.3.2026 – 31.3.2026", tyonantaja: "Nokia Oyj" }
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

export function calcSplit(rows: Row[], opts: { splitType: SplitType; percent?: number }) {
  const percent = (opts.percent ?? 0) / 100;
  return rows.map((r) => {
    const base = r.palkka; // base from current palkka
    if (opts.splitType === "ONE_THIRD_TWO_THIRDS") {
      return {
        id: r.id,
        maksupaiva: r.maksupaiva,
        alkuperainenTulo: base,
        oneThird: base / 3,
        twoThirds: (base / 3) * 2,
      } as any;
    }
    if (opts.splitType === "PERCENT") {
      const amount = roundToCents(base * percent);
      return { id: r.id, maksupaiva: r.maksupaiva, alkuperainenTulo: base, prosentti: opts.percent, erotettava: amount } as any;
    }
    const erotettavaMaara = roundToCents(base * percent);
    const oneThird = erotettavaMaara / 3;
    const twoThirds = (erotettavaMaara / 3) * 2;
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
  const t1 = calcSplit([{ id: "t1", maksupaiva: "", tulolaji: "", palkka: 2400, alkuperainenTulo: 0, tyonantaja: "" } as Row], { splitType: "ONE_THIRD_TWO_THIRDS" });
  assertAlmostEqual((t1[0] as any).oneThird, 800, "ONE_THIRD_TWO_THIRDS oneThird");
  assertAlmostEqual((t1[0] as any).twoThirds, 1600, "ONE_THIRD_TWO_THIRDS twoThirds");

  // 2: 9% of 2000 → 180
  const t2 = calcSplit([{ id: "t2", maksupaiva: "", tulolaji: "", palkka: 2000, alkuperainenTulo: 0, tyonantaja: "" } as Row], { splitType: "PERCENT", percent: 9 });
  assertAlmostEqual((t2[0] as any).erotettava, 180, "PERCENT erotettava");

  // 3: 18.5% of 2100 = 388.5 → thirds from deducted
  const t3 = calcSplit([{ id: "t3", maksupaiva: "", tulolaji: "", palkka: 2100, alkuperainenTulo: 0, tyonantaja: "" } as Row], { splitType: "PERCENT_PLUS_SPLIT", percent: 18.5 });
  assertAlmostEqual((t3[0] as any).erotettava, 388.5, "PERCENT_PLUS_SPLIT erotettava");
  assertAlmostEqual((t3[0] as any).oneThird, 129.5, "PERCENT_PLUS_SPLIT oneThird");
  assertAlmostEqual((t3[0] as any).twoThirds, 259.0, "PERCENT_PLUS_SPLIT twoThirds");

  // 4: zero percent
  const t4 = calcSplit([{ id: "t4", maksupaiva: "", tulolaji: "", palkka: 1999, alkuperainenTulo: 0, tyonantaja: "" } as Row], { splitType: "PERCENT", percent: 0 });
  assertAlmostEqual((t4[0] as any).erotettava, 0, "PERCENT zero percent");

  // 5: 9% of 2400 in percent+split → 216, 72, 144
  const t5 = calcSplit([{ id: "t5", maksupaiva: "", tulolaji: "", palkka: 2400, alkuperainenTulo: 0, tyonantaja: "" } as Row], { splitType: "PERCENT_PLUS_SPLIT", percent: 9 });
  assertAlmostEqual((t5[0] as any).erotettava, 216, "PERCENT_PLUS_SPLIT 9% deducted");
  assertAlmostEqual((t5[0] as any).oneThird, 72, "PERCENT_PLUS_SPLIT 1/3 of deducted");
  assertAlmostEqual((t5[0] as any).twoThirds, 144, "PERCENT_PLUS_SPLIT 2/3 of deducted");

  // 6: empty input
  const t6 = calcSplit([], { splitType: "PERCENT", percent: 50 });
  if (t6.length !== 0) throw new Error("Empty input should yield empty result");

  // 7: rounding
  const t7 = calcSplit([{ id: "t7", maksupaiva: "", tulolaji: "", palkka: 1234.56, alkuperainenTulo: 0, tyonantaja: "" } as Row], { splitType: "PERCENT", percent: 12.345 });
  assertAlmostEqual((t7[0] as any).erotettava, 152.41, "Rounding to cents");

  // 8: 100% case
  const t8 = calcSplit([{ id: "t8", maksupaiva: "", tulolaji: "", palkka: 90, alkuperainenTulo: 0, tyonantaja: "" } as Row], { splitType: "PERCENT_PLUS_SPLIT", percent: 100 });
  assertAlmostEqual((t8[0] as any).erotettava, 90, "PERCENT_PLUS_SPLIT 100% deducted");
  assertAlmostEqual((t8[0] as any).oneThird, 30, "PERCENT_PLUS_SPLIT 1/3 at 100%");
  assertAlmostEqual((t8[0] as any).twoThirds, 60, "PERCENT_PLUS_SPLIT 2/3 at 100%");

  // 9: remainder idea check (base - erotettava)
  const base = 1000;
  const p = 15;
  const t9 = calcSplit([{ id: "t9", maksupaiva: "", tulolaji: "", palkka: base, alkuperainenTulo: 0, tyonantaja: "" } as Row], { splitType: "PERCENT_PLUS_SPLIT", percent: p });
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
  const [rows, setRows] = useState<Row[]>(MOCK_ROWS);

  // Dynaamiset työnantajavaihtoehdot + "Kaikki työnantajat"
  const employerOptions = useMemo(
    () => ["Kaikki työnantajat", ...Array.from(new Set(rows.map(r => r.tyonantaja)))],
    [rows]
  );

  // Filters
  const [employer, setEmployer] = useState("Kaikki työnantajat");
  const [incomeType, setIncomeType] = useState("Aikapalkka"); // voi olla "Kaikki"
  const [onlySubsidized, setOnlySubsidized] = useState(true); // Vain palkkatuettu
  const [dateFromStr, setDateFromStr] = useState("");
  const [dateToStr, setDateToStr] = useState("");

  const dateFrom = useMemo(() => parseFinnishDate(dateFromStr), [dateFromStr]);
  const dateTo = useMemo(() => parseFinnishDate(dateToStr), [dateToStr]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (employer !== "Kaikki työnantajat" && r.tyonantaja !== employer) return false;
      if (incomeType && incomeType !== "Kaikki" && r.tulolaji !== incomeType) return false;
      if (onlySubsidized && !SUBSIDIZED_EMPLOYERS.has(r.tyonantaja)) return false;
      const d = parseFinnishDate(r.maksupaiva);
      if (dateFrom && d && d < dateFrom) return false;
      if (dateTo && d && d > dateTo) return false;
      return true;
    });
  }, [rows, employer, incomeType, onlySubsidized, dateFrom, dateTo]);

  // Selection (for filtered set)
  const [selectedIds, setSelectedIds] = useState<string[]>(() => rows.map((r) => r.id));
  const selectedRowsFiltered = useMemo(() => filteredRows.filter((r) => selectedIds.includes(r.id)), [filteredRows, selectedIds]);

  // Summary over filtered
  const totalFiltered = useMemo(() => filteredRows.reduce((s, r) => s + r.palkka, 0), [filteredRows]);
  const subsidizedFiltered = useMemo(() => filteredRows.reduce((s, r) => s + (SUBSIDIZED_EMPLOYERS.has(r.tyonantaja) ? r.palkka : 0), 0), [filteredRows]);

  // Näytetään "Alkuperäinen tulo" -sarake vain, jos sitä on jollakin suodatetulla rivillä
  const showOriginal = useMemo(() => filteredRows.some(r => (r.alkuperainenTulo ?? 0) > 0), [filteredRows]);

  // Modal state & split config
  const [open, setOpen] = useState(false);
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
    if (!kohdistettuTulolaji) return; // kun tulolaji = "Kaikki", lähde on valittava ensin
    const next: Row[] = [];
    for (const r of rows) {
      const rowIsSelected = selectedIds.includes(r.id);
      const typeMatches = r.tulolaji === kohdistettuTulolaji;
      if (!rowIsSelected || !typeMatches) {
        next.push(r);
        continue;
      }
      const base = r.palkka;

      if (splitType === "ONE_THIRD_TWO_THIRDS") {
        const oneThird = base / 3;
        const twoThirds = (base / 3) * 2;
        // lähde nollataan
        const zeroed: Row = { ...r, palkka: 0, alkuperainenTulo: base };
        next.push(zeroed);
        // kohderiveille "Alkuperäinen tulo" = base
        next.push({ ...r, id: newId(), tulolaji: selectOneThird, palkka: oneThird, alkuperainenTulo: base });
        next.push({ ...r, id: newId(), tulolaji: selectTwoThirds, palkka: twoThirds, alkuperainenTulo: base });
     } else if (splitType === "PERCENT") {
  const erotettava = roundToCents(base * (percent / 100));
  const remaining = roundToCents(base - erotettava);

  // Lähteelle jää vähennetty määrä (EI nollata)
  const updatedSource: Row = { ...r, palkka: remaining, alkuperainenTulo: base };
  next.push(updatedSource);

  // Uusi rivi erotetulle summalle valittuun tulolajiin
  next.push({
    ...r,
    id: newId(),
    tulolaji: erotettavaTulolaji,
    palkka: erotettava,
    alkuperainenTulo: base,
  });
} else if (splitType === "PERCENT_PLUS_SPLIT") {

        const erotettava = roundToCents(base * (percent / 100));
        const oneThird = erotettava / 3;
        const twoThirds = (erotettava / 3) * 2;
        const remaining = roundToCents(base - erotettava);
        // lähteelle jää erotuksen jälkeen jäljelle jäänyt osuus
        const updatedSource: Row = { ...r, palkka: remaining, alkuperainenTulo: base };
        next.push(updatedSource);
        next.push({ ...r, id: newId(), tulolaji: selectOneThird, palkka: oneThird, alkuperainenTulo: base });
        next.push({ ...r, id: newId(), tulolaji: selectTwoThirds, palkka: twoThirds, alkuperainenTulo: base });
      }
    }
    setRows(next);
    setOpen(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Suodata tulotiedot</h1>
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
                  <SelectItem value="Aikapalkka">Aikapalkka</SelectItem>
                  <SelectItem value="Vuosilomakorvaus">Vuosilomakorvaus</SelectItem>
                  <SelectItem value="Lomaraha">Lomaraha</SelectItem>
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
            <div className="md:col-span-2 flex items-end">
              <div className="flex items-center gap-2">
              <Checkbox checked={onlySubsidized} onCheckedChange={(v) => setOnlySubsidized(Boolean(v))} id="only-subsidized" />
              <Label htmlFor="only-subsidized">Vain palkkatuettu</Label>
            </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-teal-50 px-4 py-3 text-sm flex items-center justify-between">
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

          <div className="mt-4 overflow-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-left">
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
                  <tr key={r.id} className="odd:bg-white even:bg-slate-50">
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
                    <td className="px-3 py-2">{r.tyonantaja}{SUBSIDIZED_EMPLOYERS.has(r.tyonantaja) ? " (palkkatuettu)" : ""}</td>
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
          <Button className="bg-green-600 hover:bg-green-700">Tallenna ja sulje</Button>
        </div>
      </div>

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
                  <div className="px-3 py-2 border rounded-lg text-sm bg-slate-50">{kohdistettuTulolaji}</div>
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
                      <SelectItem value="Vuosilomakorvaus">Vuosilomakorvaus</SelectItem>
                      <SelectItem value="Lomaraha">Lomaraha</SelectItem>
                      <SelectItem value="Aikapalkka">Aikapalkka</SelectItem>
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
                        <SelectItem value="Lomaraha">Lomaraha</SelectItem>
                        <SelectItem value="Vuosilomakorvaus">Vuosilomakorvaus</SelectItem>
                        <SelectItem value="Aikapalkka">Aikapalkka</SelectItem>
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
                  <thead className="bg-slate-100 text-left">
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
                      <tr key={p.id} className="odd:bg-white even:bg-slate-50">
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
