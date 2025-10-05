"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2, Lock, LockOpen, Eye } from "lucide-react";

// ------------------------------------------------------------
// Massapäätökset – Single-file prototype component
// ------------------------------------------------------------
// Notes
// - Tailwind & shadcn/ui assumed available in the host app.
// - Pure front-end prototype: state lives locally; no API calls.
// - Focus is on UX flows seen in the Figma image + features:
//   * Päätös ja selite -sarakkeessa +N-indikaattori jos asiakkaalla on useita päätöksiä.
//   * Klikkaamalla avautuu popover, jossa on "Lisää tarkasteluun ja lukitse" (lisää rivit ja lukitsee ne).
//   * Lukitut rivit näytetään lukkokuvakkeella.
//   * **Rajaa tarkasteltavat** lukitsee kaikki nykyiset suodatetut rivit tälle käsittelijälle ja valitsee ne.
//   * Riviltä voi "Palauttaa" yksittäisen päätöksen takaisin käsittelyyn (poistaa lukituksen & valinnan).
//   * Bulk-palkissa on "Palauta valitut käsittelyyn".
//   * UUTTA: lisätyt rivit näkyvät taulukossa vaikka "Tarkasteltavien määrä" -raja olisi pienempi (ne ohittavat rajan).
//   * UUTTA: ryhmittely jäsennumeron mukaan aina ensisijaisena; valittu lajittelu toimii ryhmän sisällä.
//   * UUTTA: Pistotarkastusmerkintä – kun avaat rivin käsittelyjakso-linkistä, rivi merkitään "Avattu" ja laskuri kasvaa kerran/rivi.
// ------------------------------------------------------------

// Mock options
const KATEGORIAT = [
  { value: "myonteiset-85", label: "Myönteiset sovittelut (85)" },
  { value: "hylkays", label: "Hylkäys" },
  { value: "muu", label: "Muu" },
];

const LISATIETO = [
  { value: "LP34", label: "LP34 Palkka huomioidaan ansiossa" },
  { value: "LP12", label: "LP12 Kertakorotus" },
];

const PERUSTE = [
  { value: "PS1", label: "PS1 Päivärahan määrää on alennettu" },
  { value: "PS7", label: "PS7 Ylityskorjaus" },
];

// Mock dataset
export type DecisionRow = {
  id: string;
  jasennro: number; // käytetään asiakkaan tunnisteena
  kasittelyjakso: string; // PP.KK.VVVV-PP.KK.VVVV
  paatoskoodi: string;
  ajanjakso: string;
  lomautustapa: string;
  toekert: string;
  tyoTyyppi: string;
  tunnit: number;
  tulot: number; // pidetään datassa, ei näytetä taulukossa
  tyoaikaPct: number; // pidetään datassa, ei näytetä taulukossa
  tyonantaja: string;
  relatedCount?: number; // montako muuta hakemusta samalla asiakkaalla
};

const makeRow = (i: number): DecisionRow => ({
  id: String(1000 + i),
  jasennro: i * 111 + 13,
  kasittelyjakso: "01.02.2025-28.02.2025",
  paatoskoodi: i % 3 === 0 ? "IM002 xxxxxxx" : "IM002",
  ajanjakso: "01.02.2025-28.02.2025",
  lomautustapa: ["Lyhennetty työviikko", "Kokonaan lomautettu", "Lyhennetty työpäivä"][i % 3],
  toekert: "Table cells",
  tyoTyyppi: ["Kokoaikainen", "Osa-aikainen"][i % 2],
  tunnit: 80 + (i % 20),
  tulot: 1200 + (i % 7) * 50,
  tyoaikaPct: 50 + (i % 5) * 10,
  tyonantaja: ["Acme Oy", "Beta Ky", "Carrot Ab"][i % 3],
  relatedCount: i % 4 === 0 ? 2 : i % 7 === 0 ? 1 : 0, // joillakin asiakkailla on lisähakemuksia
});

const MOCK_ROWS: DecisionRow[] = Array.from({ length: 120 }, (_, i) => makeRow(i + 1));

// apufunktio luomaan lisähakemukset samalle asiakkaalle
const generateRelatedRows = (base: DecisionRow): DecisionRow[] => {
  const n = base.relatedCount ?? 0;
  return Array.from({ length: n }, (_, idx) => ({
    id: `${base.id}-R${idx + 1}`,
    jasennro: base.jasennro,
    kasittelyjakso: base.kasittelyjakso,
    paatoskoodi: `${base.paatoskoodi} (muu ${idx + 1})`,
    ajanjakso: base.ajanjakso,
    lomautustapa: base.lomautustapa,
    toekert: base.toekert,
    tyoTyyppi: base.tyoTyyppi,
    tunnit: base.tunnit + (idx + 1) * 2,
    tulot: base.tulot + (idx + 1) * 25,
    tyoaikaPct: base.tyoaikaPct,
    tyonantaja: base.tyonantaja,
    relatedCount: 0,
  }));
};

// --- Helper: include rows beyond limit when explicitly added ---
function mergeWithAlwaysInclude(rows: DecisionRow[], limit?: number, includeIds?: Set<string>) {
  if (!limit || limit <= 0) return rows;
  const main = rows.slice(0, limit);
  const existing = new Set(main.map(r => r.id));
  const extra = includeIds ? rows.filter(r => includeIds.has(r.id) && !existing.has(r.id)) : [];
  return [...main, ...extra];
}

// --- Helper: mark opened once ---
function markOpened(prev: Set<string>, id: string) {
  const s = new Set(prev);
  const added = !s.has(id);
  if (added) s.add(id);
  return { set: s, added };
}

// --- Category label helpers ---
function getCategoryLabel(value?: string) {
  const item = KATEGORIAT.find(k => k.value === value);
  return item ? item.label : value ?? "";
}
function extractCountFromLabel(label: string): number | null {
  const start = label.lastIndexOf('(');
  const end = label.lastIndexOf(')');
  if (start >= 0 && end > start) {
    const num = Number(label.slice(start + 1, end));
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

function stripCountFromLabel(label: string): string {
  const start = label.lastIndexOf('(');
  const end = label.lastIndexOf(')');
  if (start >= 0 && end > start) {
    return label.slice(0, start).trim();
  }
  return label;
}
function initialCategoryCountsFromConfig(): Record<string, number> {
  const map: Record<string, number> = {};
  for (const k of KATEGORIAT) {
    const c = extractCountFromLabel(k.label);
    if (c !== null) map[k.value] = c;
  }
  return map;
}
function formatCategoryLabel(value?: string, counts?: Record<string, number>) {
  if (!value) return "";
  const raw = getCategoryLabel(value);
  const base = stripCountFromLabel(raw);
  const count = counts && value in counts ? counts[value] : extractCountFromLabel(raw);
  return count != null ? `${base} (${count})` : base;
}

// --- Defaults derived from category ---
const DEFAULT_CATEGORY = "myonteiset-85";
const DEFAULT_CATEGORY_LABEL = getCategoryLabel(DEFAULT_CATEGORY);
const DEFAULT_CATEGORY_COUNT = extractCountFromLabel(DEFAULT_CATEGORY_LABEL) ?? 0; // initial pending count

// --- DEV sanity checks (lightweight tests) ---
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  const _testBase = makeRow(4); // i % 4 === 0 -> relatedCount should be 2
  console.assert((_testBase.relatedCount ?? 0) === 2, "Test failed: expected relatedCount=2 for makeRow(4)");
  const _rels = generateRelatedRows(_testBase);
  console.assert(_rels.length === 2, "Test failed: generateRelatedRows length should be 2");
  console.assert(_rels.every(r => r.jasennro === _testBase.jasennro), "Test failed: related rows must share jasennro");

  const _rows = [1,2,3,4,5,6].map(i => ({ id: String(i), jasennro: i, kasittelyjakso: "", paatoskoodi: "", ajanjakso: "", lomautustapa: "", toekert: "", tyoTyyppi: "", tunnit: 0, tulot: 0, tyoaikaPct: 0, tyonantaja: "" } as DecisionRow));
  const _inc = new Set(["6"]);
  const _merged = mergeWithAlwaysInclude(_rows, 5, _inc);
  console.assert(_merged.length === 6 && _merged.some(r => r.id === "6"), "Test failed: mergeWithAlwaysInclude should bring included ids beyond limit");

  const _m1 = markOpened(new Set(), "a");
  console.assert(_m1.added && _m1.set.has("a"), "Test failed: markOpened should add when new");
  const _m2 = markOpened(_m1.set, "a");
  console.assert(!_m2.added && _m2.set.size === 1, "Test failed: markOpened should not double-add");

  const _lbl = getCategoryLabel("myonteiset-85");
  console.assert(_lbl.includes("(85)"), "Test failed: getCategoryLabel should include count");
  console.assert(extractCountFromLabel(_lbl) === 85, "Test failed: extractCountFromLabel should read 85");
  console.assert(DEFAULT_CATEGORY_COUNT === 85, "Test failed: DEFAULT_CATEGORY_COUNT should be 85");
}

// --- Sorting ---
type Sort = { key: keyof DecisionRow; dir: "asc" | "desc" } | null;

// --- Filters ---
type Filters = {
  kategoria?: string;
  paatoskoodi?: string;
  lisatieto?: string;
  perustelu?: string;
  vireilletulo?: string; // yyyy-mm-dd
  tyonantaja?: string;
  vainLomautetut: boolean;
  sisaltaaLisamaksua: boolean;
  eiUseita: boolean;
  tarkasteltavienMaara?: number;
};

const initialFilters: Filters = {
  kategoria: DEFAULT_CATEGORY,
  paatoskoodi: "IM002",
  lisatieto: "LP34",
  perustelu: "PS1",
  vireilletulo: "",
  tyonantaja: "",
  vainLomautetut: false,
  sisaltaaLisamaksua: false,
  eiUseita: false,
  tarkasteltavienMaara: DEFAULT_CATEGORY_COUNT,
};

export default function Massapaatokset() {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [queryVersion, setQueryVersion] = useState(0); // simuloitu hakuversio

  // Table state
  const [sort, setSort] = useState<Sort>({ key: "jasennro", dir: "asc" });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [locked, setLocked] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [loading, setLoading] = useState(false);

  // Lisätyt rivit (popoverista "Lisää tarkasteluun ja lukitse")
  const [injectedRows, setInjectedRows] = useState<DecisionRow[]>([]);
  // Rivit, jotka tulee aina näyttää, vaikka raja olisi saavutettu
  const [alwaysIncludeIds, setAlwaysIncludeIds] = useState<Set<string>>(new Set());
  // Hyväksytyt/poistetut rivit (eivät enää näy listassa)
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());
  // Kategorioiden dynaamiset jäljellä olevat määrät
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>(() => initialCategoryCountsFromConfig());

  // Pistotarkastuksen tilat
  const [openedIds, setOpenedIds] = useState<Set<string>>(new Set());
  const [spotChecks, setSpotChecks] = useState(0);
  const [auditLog, setAuditLog] = useState<Array<{ id: string; jasennro: number; at: string }>>([]);
  const [lockedBatchSize, setLockedBatchSize] = useState<number | null>(null);

  // Yhdistetty tietolähde
  const allRows = useMemo(() => {
    const base = MOCK_ROWS.filter(r => !processedIds.has(r.id));
    const inj = injectedRows.filter(r => !processedIds.has(r.id));
    return [...base, ...inj];
  }, [injectedRows, processedIds]);

  const categoryLabel = useMemo(() => formatCategoryLabel(filters.kategoria, categoryCounts), [filters.kategoria, categoryCounts]);

  // Derived rows from mock + filters
  const baseFiltered = useMemo(() => {
    let rows = [...allRows];
    const f = filters;
    if (f.tyonantaja) rows = rows.filter(r => r.tyonantaja.toLowerCase().includes(f.tyonantaja!.toLowerCase()));
    if (f.vireilletulo) {
      // Purely demonstrative: keep every other row when date is given
      rows = rows.filter((_, idx) => idx % 2 === 0);
    }
    if (f.vainLomautetut) rows = rows.filter(r => r.lomautustapa !== "");
    if (f.eiUseita) rows = rows.filter(r => r.paatoskoodi.startsWith("IM002"));
    if (f.sisaltaaLisamaksua) rows = rows.filter((_, i) => i % 3 !== 0);
    return rows;
  }, [filters.kategoria, filters.paatoskoodi, filters.lisatieto, filters.perustelu, filters.vireilletulo, filters.tyonantaja, filters.vainLomautetut, filters.eiUseita, filters.sisaltaaLisamaksua, allRows]);

  const filteredRows = useMemo(() => {
    const withLimit = mergeWithAlwaysInclude(baseFiltered, filters.tarkasteltavienMaara, alwaysIncludeIds);
    return withLimit;
  }, [baseFiltered, filters.tarkasteltavienMaara, alwaysIncludeIds]);

  const sortedRows = useMemo(() => {
    const rows = [...filteredRows];
    // Ensisijainen ryhmittely jasennron mukaan
    rows.sort((a, b) => {
      if (a.jasennro !== b.jasennro) return a.jasennro - b.jasennro;
      if (!sort || sort.key === "jasennro") {
        return String(a.id).localeCompare(String(b.id));
      }
      const va = (a[sort.key] as any);
      const vb = (b[sort.key] as any);
      if (typeof va === "number" && typeof vb === "number") return sort.dir === "asc" ? va - vb : vb - va;
      const cmp = String(va).localeCompare(String(vb));
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [filteredRows, sort]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page, pageSize]);

  useEffect(() => {
    // Reset selection when rows change via filter limit change
    setSelected(new Set());
    setPage(1);
  }, [queryVersion, filters.tarkasteltavienMaara]);

  const toggleAllOnPage = (checked: boolean) => {
    const copy = new Set(selected);
    pagedRows.forEach(r => (checked ? copy.add(r.id) : copy.delete(r.id)));
    setSelected(copy);
  };

  const isAllOnPageChecked = pagedRows.length > 0 && pagedRows.every(r => selected.has(r.id));
  const isAnyChecked = selected.size > 0;

  // UUSI: Rajaa tarkasteltavat – lukitse & valitse kaikki nykyiset suodatetut rivit
  const narrowAndLock = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 650));
    const ids = new Set(filteredRows.map(r => r.id));
    setLocked(prev => new Set([...prev, ...ids]));
    setSelected(new Set(ids));
    setLockedBatchSize(filters.tarkasteltavienMaara ?? null);
    setLoading(false);
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setAlwaysIncludeIds(new Set());
  };

  // Lisää asiakkaan muut hakemukset näkymään ja lukitse ne automaattisesti
  const addRelatedToView = (base: DecisionRow, lockAlso: boolean) => {
    const rel = generateRelatedRows(base);
    if (rel.length === 0) return;
    setInjectedRows(prev => {
      const existingIds = new Set(prev.map(r => r.id));
      const toAdd = rel.filter(r => !existingIds.has(r.id));
      return [...prev, ...toAdd];
    });
    setSelected(prev => new Set([...prev, ...rel.map(r => r.id)]));
    if (lockAlso) setLocked(prev => new Set([...prev, ...rel.map(r => r.id)]));
    setAlwaysIncludeIds(prev => new Set([...Array.from(prev), ...rel.map(r => r.id)]));
  };

  const toggleLock = (id: string) => {
    setLocked(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  };

  const handleOpen = (row: DecisionRow) => {
    const res = markOpened(openedIds, row.id);
    if (res.added) {
      setOpenedIds(res.set);
      setSpotChecks(n => n + 1);
      setAuditLog(prev => [...prev, { id: row.id, jasennro: row.jasennro, at: new Date().toISOString() }]);
      // TODO: API-kutsu taustaan pistotarkastuksen kirjaamiseksi
      // fetch("/api/spot-check", { method: "POST", body: JSON.stringify({ id: row.id }) })
      //   .catch(() => console.warn("spot-check report failed (mock)"));
    }
  };

  const headerCell = (label: string, key: keyof DecisionRow) => (
    <th
      key={String(key)}
      className="sticky top-0 z-10 bg-slate-800 text-slate-50 px-3 py-2 text-left text-sm font-medium cursor-pointer select-none"
      onClick={() =>
        setSort(prev => {
          if (!prev || prev.key !== key) return { key, dir: "asc" };
          if (prev.dir === "asc") return { key, dir: "desc" };
          return null; // third click removes sorting
        })
      }
      title="Lajittele"
    >
      <span className="inline-flex items-center gap-2">
        {label}
        {sort?.key === key && (
          <span className="text-xs rounded px-1 border border-slate-300/30">{sort.dir === "asc" ? "↑" : "↓"}</span>
        )}
      </span>
    </th>
  );

  return (
    <div className="p-4 md:p-6 lg:p-2 w-full">
      <Card className="max-w-[1200px] mx-auto shadow-xl border-slate-200">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-start justify-between">
            <h1 className="text-xl font-semibold tracking-tight">MASSAPÄÄTÖKSET</h1>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">Sulje</Button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label>Kategoria</Label>
              <Select value={filters.kategoria} onValueChange={(v) => setFilters(f => {
                const count = (categoryCounts as any)[v] ?? extractCountFromLabel(getCategoryLabel(v));
                return { ...f, kategoria: v, ...(count !== null && count !== undefined ? { tarkasteltavienMaara: count } : {}) };
              })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {KATEGORIAT.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Päätöskoodi ja selite</Label>
              <Input value={filters.paatoskoodi} onChange={(e) => setFilters(f => ({ ...f, paatoskoodi: e.target.value }))} placeholder="IM002" />
            </div>

            <div className="space-y-2">
              <Label>Lisätieto</Label>
              <Select value={filters.lisatieto} onValueChange={(v) => setFilters(f => ({ ...f, lisatieto: v }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LISATIETO.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Perustelut</Label>
              <Select value={filters.perustelu} onValueChange={(v) => setFilters(f => ({ ...f, perustelu: v }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PERUSTE.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Vireilletulopäivä</Label>
              <div className="relative">
                <Input type="date" value={filters.vireilletulo} onChange={(e) => setFilters(f => ({ ...f, vireilletulo: e.target.value }))} />
                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Työnantajan nimi tai Y-tunnus</Label>
              <Input placeholder="Täydennä" value={filters.tyonantaja}
                     onChange={(e) => setFilters(f => ({ ...f, tyonantaja: e.target.value }))} />
            </div>

            <div className="flex items-center gap-3 mt-6">
              <Checkbox id="vainL" checked={filters.vainLomautetut} onCheckedChange={(v: any) => setFilters(f => ({ ...f, vainLomautetut: Boolean(v) }))} />
              <Label htmlFor="vainL">Vain lomautetut</Label>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <Checkbox id="lisa" checked={filters.sisaltaaLisamaksua} onCheckedChange={(v: any) => setFilters(f => ({ ...f, sisaltaaLisamaksua: Boolean(v) }))} />
              <Label htmlFor="lisa">Sisältää lisämaksua</Label>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <Checkbox id="eiuseita" checked={filters.eiUseita} onCheckedChange={(v: any) => setFilters(f => ({ ...f, eiUseita: Boolean(v) }))} />
              <Label htmlFor="eiuseita">Ei useita päätöksiä</Label>
            </div>

            <div className="space-y-2">
              <Label>Tarkasteltavien päätösten määrä</Label>
              <Input type="number" min={1} value={filters.tarkasteltavienMaara}
                     onChange={(e) => setFilters(f => ({ ...f, tarkasteltavienMaara: Number(e.target.value) }))} />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={narrowAndLock} disabled={loading}>
              {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Lukitaan…</>) : "Lukitse tarkasteltavat"}
            </Button>
            <Button variant="ghost" onClick={clearFilters}>Tyhjennä hakuvalinnat</Button>
          </div>

          {/* Bulk action bar */}
          {isAnyChecked && (
            <div className="sticky top-0 mt-4 z-20 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
              <div className="text-sm">
                <strong>{selected.size}</strong> riviä valittuna
              </div>
              <div className="flex gap-2">
                
                <Button onClick={() => {
                if (selected.size === 0) return;
                // Poista rivit näkymästä
                setProcessedIds(prev => new Set([...prev, ...selected]));
                // Päivitä kategorian jäljellä oleva määrä
                setCategoryCounts(prev => {
                  const key = filters.kategoria as string | undefined;
                  if (!key) return prev;
                  const cur = prev[key] ?? extractCountFromLabel(getCategoryLabel(key)) ?? 0;
                  const next = Math.max(0, cur - selected.size);
                  return { ...prev, [key]: next };
                });
                // Siivoa lukitukset ja valinnat
                setLocked(prev => { const s = new Set(prev); selected.forEach(id => s.delete(id)); return s; });
                setAlwaysIncludeIds(prev => { const s = new Set(prev); selected.forEach(id => s.delete(id)); return s; });
                setSelected(new Set());
              }}>Hyväksy päätökset</Button>
                <Button variant="outline" onClick={() => setSelected(new Set())}>Poista valinnat</Button>
                <Button variant="ghost" onClick={() => {
                  // Palauta valitut takaisin käsittelyyn (poista lukitus ja valinta) + poista "always include"
                  setLocked(prev => { const s = new Set(prev); selected.forEach(id => s.delete(id)); return s; });
                  setAlwaysIncludeIds(prev => { const s = new Set(prev); selected.forEach(id => s.delete(id)); return s; });
                  setSelected(new Set());
                }}>Palauta valitut käsittelyyn</Button>
              </div>
            </div>
          )}

          {/* Results */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-base font-semibold">Hakutulokset</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-xs rounded-full px-2 py-0.5 bg-slate-100">Kategoria: {categoryLabel}</span>
                  {lockedBatchSize !== null && (
                    <span className="text-xs rounded-full px-2 py-0.5 bg-amber-100">Tarkasteltavien määrä (lukittu): {lockedBatchSize}</span>
                  )}
                </div>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-xs rounded-full px-3 py-1 bg-slate-100 hover:bg-slate-200">
                    Pistotarkastuksia: {spotChecks}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-96" align="end">
                  <div className="text-sm font-medium mb-1">Tarkastusten loki</div>
                  {auditLog.length === 0 ? (
                    <div className="text-xs text-slate-500">Ei kirjauksia vielä.</div>
                  ) : (
                    <ul className="text-xs max-h-60 overflow-auto list-disc pl-5">
                      {auditLog.slice().reverse().map((e, idx) => (
                        <li key={idx}>
                          {e.at.replace("T", " ").replace("Z", "")} – id {e.id}, jäsennro {e.jasennro}
                        </li>
                      ))}
                    </ul>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            <div className="overflow-auto rounded-xl border">
              <table className="min-w-[900px] w-full border-collapse">
                <thead>
                  <tr>
                    <th className="sticky top-0 z-10 bg-slate-800 text-slate-50 px-3 py-2 text-left text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Checkbox id="all" checked={isAllOnPageChecked} onCheckedChange={(v: any) => toggleAllOnPage(Boolean(v))} />
                        <Label htmlFor="all" className="text-slate-50">Valitse</Label>
                      </div>
                    </th>
                    {headerCell("Jäsennro", "jasennro")}
                    {headerCell("Käsittelyjakso", "kasittelyjakso")}
                    {headerCell("Päätös ja selite", "paatoskoodi")}
                    {headerCell("Päätöksen ajanjakso", "ajanjakso")}
                    {headerCell("Lomautustapa", "lomautustapa")}
                    {headerCell("TOE-kertymä", "toekert")}
                    {headerCell("Työn tyyppi", "tyoTyyppi")}
                    {headerCell("Tunnit", "tunnit")}
                    {headerCell("Työnantaja", "tyonantaja")}
                  </tr>
                </thead>
                <tbody>
                  {pagedRows.map((r) => (
                    <tr key={r.id} className="odd:bg-white even:bg-slate-50 hover:bg-blue-50 transition-colors">
                      <td className="px-3 py-2 align-top">
                        <div className="flex items-center gap-2">
                          <Checkbox checked={selected.has(r.id)} onCheckedChange={(v: any) => {
                            const copy = new Set(selected);
                            if (v) copy.add(r.id); else copy.delete(r.id);
                            setSelected(copy);
                          }} />
                          {/* Lukitusindikaattori + Palauta */}
                          <div className="flex items-center gap-1">
                            {locked.has(r.id) ? (
                              <span title="Lukittu sinulle">
                                <Lock className="h-4 w-4 text-amber-600" aria-hidden="true" focusable="false" />
                              </span>
                            ) : (
                              <span title="Ei lukittu">
                                <LockOpen className="h-4 w-4 text-slate-300" aria-hidden="true" focusable="false" />
                              </span>
                            )}
                            {locked.has(r.id) && (
                              <Button variant="link" size="sm" className="px-1 h-6 text-xs" onClick={() => {
                                // Palauta yksi rivi käsittelyyn: poista lukitus & valinta + poista always-include
                                setLocked(prev => { const s = new Set(prev); s.delete(r.id); return s; });
                                setSelected(prev => { const s = new Set(prev); s.delete(r.id); return s; });
                                setAlwaysIncludeIds(prev => { const s = new Set(prev); s.delete(r.id); return s; });
                              }}>Palauta</Button>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-sm">{r.jasennro}</td>
                      <td className="px-3 py-2 text-sm">
                        <button
                          onClick={() => handleOpen(r)}
                          className={`underline ${openedIds.has(r.id) ? "text-emerald-700" : "text-blue-700 hover:text-blue-900"} cursor-pointer inline-flex items-center gap-2`}
                        >
                          {r.kasittelyjakso}
                          {openedIds.has(r.id) && (
                            <span className="inline-flex items-center text-[10px] rounded-full px-1.5 py-0.5 bg-emerald-100 text-emerald-800">
                              <Eye className="h-3 w-3 mr-1" /> Avattu
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span>{r.paatoskoodi}</span>
                          {r.relatedCount && r.relatedCount > 0 && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="text-xs rounded-full px-2 py-0.5 bg-sky-100 text-sky-800 hover:bg-sky-200 transition" title={`+${r.relatedCount} muuta päätöstä`}>
                                  +{r.relatedCount}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80" align="start">
                                <div className="space-y-2">
                                  <div className="text-sm font-medium">Asiakkaalla on {r.relatedCount} muuta hakemusta</div>
                                  <ul className="list-disc pl-5 text-sm text-slate-700">
                                    {generateRelatedRows(r).map(rr => (
                                      <li key={rr.id}>{rr.paatoskoodi} – {rr.ajanjakso}</li>
                                    ))}
                                  </ul>
                                  <div className="flex gap-2 pt-2">
                                    <Button size="sm" onClick={() => addRelatedToView(r, true)}>Lisää tarkasteluun ja lukitse</Button>
                                  </div>
                                  <div className="pt-1">
                                    <Button variant="ghost" size="sm" onClick={() => toggleLock(r.id)}>
                                      {locked.has(r.id) ? "Poista lukitus tältä" : "Lukitse tämä hakemus"}
                                    </Button>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-sm">{r.ajanjakso}</td>
                      <td className="px-3 py-2 text-sm">{r.lomautustapa}</td>
                      <td className="px-3 py-2 text-sm">{r.toekert}</td>
                      <td className="px-3 py-2 text-sm">{r.tyoTyyppi}</td>
                      <td className="px-3 py-2 text-sm">{r.tunnit}</td>
                      <td className="px-3 py-2 text-sm">{r.tyonantaja}</td>
                    </tr>
                  ))}

                  {pagedRows.length === 0 && (
                    <tr>
                      <td colSpan={10} className="text-center text-sm text-slate-500 py-10">Ei tuloksia nykyisillä suodattimilla.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer / Pagination */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-slate-600">Tulosten määrä</div>
              <div className="flex items-center gap-2">
                <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                  <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[12, 25, 50].map(n => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="ml-auto flex items-center gap-2 text-sm">
                <Button variant="outline" size="icon" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span>
                  sivu {page}/{totalPages}
                </span>
                <Button variant="outline" size="icon" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-xs text-slate-500">{sortedRows.length} / {MOCK_ROWS.length + injectedRows.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
