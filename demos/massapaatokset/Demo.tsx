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
import { toast } from "sonner";


// ------------------------------------------------------------
// Massapäätökset – Single-file prototype component
// ------------------------------------------------------------
// Notes
// - Tailwind & shadcn/ui assumed available in the host app.
// - Pure front-end prototype: state lives locally; no API calls.
// - Focus is on UX flows seen in the Figma image + features:
//   * Päätös ja selite -sarakkeessa +N-indikaattori jos asiakkaalla on useita päätöksiä (tooltip näyttää vain päätöksen & selitteen).
//   * Lukitut rivit näytetään lukkokuvakkeella.
//   * **Lukitse tarkasteltavat** lukitsee kaikki nykyiset suodatetut rivit tälle käsittelijälle ja valitsee ne.
//   * Riviltä voi "Palauttaa" asiakkaan kaikki päätökset takaisin käsittelyyn (poistaa lukituksen & valinnan).
//   * Bulk-palkissa on "Palauta valitut käsittelyyn" (palauttaa valittujen asiakkaiden kaikki päätökset).
//   * Lisätyt rivit näkyvät taulukossa vaikka "Tarkasteltavien määrä" -raja olisi pienempi (ne ohittavat rajan).
//   * Ryhmittely jäsennumeron mukaan aina ensisijaisena; valittu lajittelu toimii ryhmän sisällä.
//   * Pistotarkastusmerkintä – kun avaat rivin käsittelyjakso-linkistä, rivi merkitään "Avattu" ja laskuri kasvaa kerran/rivi.
//   * Pilleri näyttää lukitushetken määrän ja muutoksen (+/-X). Pilleri piiloutuu, jos kaikki on palautettu.
//   * Palautetut jäsenet piilotetaan näkymästä kunnes uusi lukitus/refresh.
//   * Asiakkaat, joilla on useita päätöksiä, nostetaan listan kärkeen.
//   * +N indikaattorit piilotetaan injektoiduilta riveiltä, jos ne eivät kuulu valittuun kategoriaan.
// ------------------------------------------------------------

// Mock options
const KATEGORIAT = [
  { value: "myonteiset", label: "Myönteiset sovittelut (85)" },
  { value: "kielteiset",  label: "Kielteiset sovittelut" },
  { value: "muu", label: "Muu" },
];

const LISATIETO = [
  { value: "LP34", label: "LP34 Palkka huomioidaan ansiossa" },
  { value: "LP12", label: "LP12 Kertakorotus" },
];

const LISATEKSTIT = [
  { value: "Takautuva", label: "Takautuva" },
  { value: "Korjaus", label: "Korjaus" },
  { value: "Lisämaksu", label: "Lisämaksu" },
  { value: "Manuaalinen", label: "Manuaalinen" },
];


const PERUSTE = [
  { value: "PS1", label: "PS1 Päivärahan määrää on alennettu" },
  { value: "PS7", label: "PS7 Ylityskorjaus" },
];

// Lisää tämän KATEGORIAT/LISATIETO/PERUSTE jälkeen
const PAATOSKOODIT = [
  { value: "IM002", label: "IM002 Soviteltu päiväraha" },
  { value: "IM002X", label: "IM003 Esimerkkiselite" },
  { value: "IM003", label: "IM003 Jatkopäätös" },
  { value: "HYL001", label: "HYL001 Hylkäysperuste X" },
  { value: "Muu", label: "Muu päätös" },
];


// --- Types ---
// types.ts tai saman tiedoston yläosa
export type DecisionRow = {
  id: string;
  jasennro: number;
  kasittelyjakso: string;
  paatoskoodi: string;
  ajanjakso: string;
  lomautustapa: string;   // "", "Kokonaan lomautettu", "Lyhennetty työviikko", "Lyhennetty työpäivä"
  toekert: string;
  tyoTyyppi: string;      // "Työtön", "Osa-aikainen", "Kokoaikainen"
  tulot: number;
  tyoaikaPct: number | null; // <-- voi puuttua (työttömät ja kokoaikaiset)
  tyonantaja: string;
  relatedCount?: number;
  category?: string; // EXPLICIT: "myonteiset-85" | "hylkays" | "muu"
};


type Sort = { key: keyof DecisionRow; dir: "asc" | "desc" } | null;

type Filters = {
  kategoria?: string;
  paatoskoodi?: string;
  // UUSI: tarkenne dropdownista (esim. IM002)
  paatosTyyppi?: string;
  lisatieto?: string;
  perustelu?: string;
  vireilletulo?: string; // yyyy-mm-dd
  tyonantaja?: string;
  vainLomautetut: boolean;
  sisaltaaLisamaksua: boolean;
  eiUseita: boolean;
  tarkasteltavienMaara?: number;
  lisateksti?: string;

};

const classifyCategory = (paatoskoodi: string): string => {
  const up = paatoskoodi.toUpperCase();
  if (up.startsWith("IM002")) return "myonteiset-85";
  if (up.startsWith("HYL")) return "hylkays";
  return "muu";
};

// --- Dataset ---
// utils/mock.ts tai komponentin sisään, korvaa vanha makeRow
const makeRow = (i: number): DecisionRow => {
  // Jakauma: 1/4 työtön, 1/4 kokonaan lomautettu, 1/4 lyhennetty (viikko/päivä), 1/4 osa-aikainen/kokoaikainen
  
  const paatoskoodi =
  i % 5 === 0
    ? "HYL001 kielteinen päätös"        // ← noin 20 % kielteisiä
    : (i % 3 === 0 ? "IM002 xxxxxxx" : "IM002"); // loput myönteisiä IM002-variaatioita
  const mod = i % 8;

  let lomautustapa = "";
  let tyoTyyppi = "Työtön";
  let tyoaikaPct: number | null = null;

  if (mod === 0 || mod === 4) {
    // Työtön → ei työaikaprosenttia
    tyoTyyppi = "Työtön";
    lomautustapa = "";
    tyoaikaPct = null;
  } else if (mod === 1) {
    // Kokonaan lomautettu → työaika 0 %
    tyoTyyppi = "Työtön";
    lomautustapa = "Kokonaan lomautettu";
    tyoaikaPct = 0;
  } else if (mod === 2 || mod === 6) {
    // Lyhennetty työviikko (soviteltava) → 40–80 %
    tyoTyyppi = "Osa-aikainen";
    lomautustapa = "Lyhennetty työviikko";
    const choices = [40, 50, 60, 70, 80];
    tyoaikaPct = choices[i % choices.length];
  } else if (mod === 3) {
    // Lyhennetty työpäivä (soviteltava) → 20–60 %
    tyoTyyppi = "Osa-aikainen";
    lomautustapa = "Lyhennetty työpäivä";
    const choices = [20, 30, 40, 50, 60];
    tyoaikaPct = choices[i % choices.length];
  } else if (mod === 5) {
    // Osa-aikainen ilman lomautusta (soviteltava) → 20–80 %
    tyoTyyppi = "Osa-aikainen";
    lomautustapa = "";
    const choices = [20, 30, 40, 50, 60, 70, 80];
    tyoaikaPct = choices[i % choices.length];
  } else {
    // Kokoaikainen (ei sovittelua) → ei %:ää
    tyoTyyppi = "Kokoaikainen";
    lomautustapa = "";
    tyoaikaPct = null;
  }

  return {
    id: String(1000 + i),
    jasennro: i * 111 + 13,
    kasittelyjakso: "01.02.2025-28.02.2025",
    paatoskoodi,
    ajanjakso: "01.02.2025-28.02.2025",
    lomautustapa,
    toekert: "—",
    tyoTyyppi,
    tulot: 1200 + (i % 7) * 50,
    tyoaikaPct,
    tyonantaja: ["Acme Oy", "Beta Ky", "Carrot Ab"][i % 3],
    relatedCount: i % 4 === 0 ? 2 : i % 7 === 0 ? 1 : 0,
  };
};



const MOCK_ROWS: DecisionRow[] = Array.from({ length: 120 }, (_, i) => makeRow(i + 1));
const BASE_ROWS: DecisionRow[] = MOCK_ROWS;
const BASE_ID_SET = new Set(BASE_ROWS.map(r => r.id));


// --- Helpers: labels & counts ---
function getCategoryLabel(value?: string) {
  const item = KATEGORIAT.find(k => k.value === value);
  return item ? item.label : value ?? "";
}
function extractCountFromLabel(label: string): number | null {
  const start = label.lastIndexOf("(");
  const end = label.lastIndexOf(")");
  if (start >= 0 && end > start) {
    const num = Number(label.slice(start + 1, end));
    return Number.isFinite(num) ? num : null;
  }
  return null;
}
function stripCountFromLabel(label: string): string {
  const start = label.lastIndexOf("(");
  const end = label.lastIndexOf(")");
  if (start >= 0 && end > start) return label.slice(0, start).trim();
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
// Palauttaa true, jos rivi on lomautettu (tukee eri muotoja)
function isLomautettu(row: DecisionRow): boolean {
  // Esimerkkidatassa: "Kokonaan lomautettu", "Lyhennetty työviikko", "Lyhennetty työpäivä"
  // Jos haluat tiukentaa, lisää ehtoja tähän.
  return /lomautet/i.test(row.lomautustapa) || /lyhennetty/i.test(row.lomautustapa);
}
function countAllRespectingOnlyLomautetut(
  onlyLomautetut: boolean,
  processed: Set<string>
): number {
  let arr = BASE_ROWS.filter(r => !processed.has(r.id));
  if (onlyLomautetut) arr = arr.filter(isLomautettu);
  return arr.length;
}
function countCategoryRespectingOnlyLomautetut(
  cat: string,
  onlyLomautetut: boolean,
  processed: Set<string>
): number {
  const f: Filters = { ...initialFilters, kategoria: cat };
  let arr = BASE_ROWS.filter(r => !processed.has(r.id))
                     .filter(r => rowMatchesSelectedCategory(r, f));
  if (onlyLomautetut) arr = arr.filter(isLomautettu);
  return arr.length;
}
function baseNameOfCategory(value?: string): string {
  if (!value) return "";
  const raw = KATEGORIAT.find(k => k.value === value)?.label ?? value;
  return raw.replace(/\s*\(\d+\)\s*$/, "");
}
// Yhtenäinen jäsenavain (string), jotta number/"123" eivät sekoita laskentaa
function memberKeyOf(row: { jasennro: number | string }): string {
  return String(row.jasennro);
}



// --- Category matching (mock; adjust to real rules as needed) ---
function rowMatchesSelectedCategory(r: DecisionRow, f: Filters): boolean {
  if (!f.kategoria) return true; // Ei kategoriaa → kaikki matchaa

  switch (f.kategoria) {
    case "myonteiset":
      return /^IM002\b/i.test(r.paatoskoodi);

    case "kielteiset":
      return /^HYL/i.test(r.paatoskoodi) || /kielteinen/i.test(r.paatoskoodi);

    

    case "muu":
      // Esimerkkina: kaikki, jotka eivät ole myönteisiä eikä kielteisiä
      return !/^IM002\b/i.test(r.paatoskoodi) && !(/^HYL/i.test(r.paatoskoodi) || /kielteinen/i.test(r.paatoskoodi));

    default:
      return true;
  }
}
// Jäsenet joilla >1 päätöstä jäljellä (BASE_ROWS – processed)
function computeMultiMemberSet(processed: Set<string>): Set<number> {
  const counts = new Map<number, number>();
  for (const r of BASE_ROWS) {
    if (processed.has(r.id)) continue; // hyväksytyt pois
    counts.set(r.jasennro, (counts.get(r.jasennro) ?? 0) + 1);
  }
  const multi = new Set<number>();
  for (const [member, n] of counts) {
    if (n > 1) multi.add(member);
  }
  return multi;
}




// --- Defaults derived from category ---
const DEFAULT_CATEGORY = "myonteiset-85";
const DEFAULT_CATEGORY_LABEL = getCategoryLabel(DEFAULT_CATEGORY);
const DEFAULT_CATEGORY_COUNT = extractCountFromLabel(DEFAULT_CATEGORY_LABEL) ?? 0; // initial pending count

const initialFilters: Filters = {
  kategoria: "",
  paatoskoodi: "",
  lisatieto: undefined,
  perustelu: undefined,
  vireilletulo: "",
  tyonantaja: "",
  vainLomautetut: false,
  sisaltaaLisamaksua: false,
  eiUseita: false,
  tarkasteltavienMaara: undefined, // ilman kategoriaa ei sidota määrää
  lisateksti: undefined,
};

// --- Other helpers ---
function mergeWithAlwaysInclude(rows: DecisionRow[], limit?: number, includeIds?: Set<string>) {
  if (!limit || limit <= 0) return rows;
  const main = rows.slice(0, limit);
  const existing = new Set(main.map(r => r.id));
  const extra = includeIds ? rows.filter(r => includeIds.has(r.id) && !existing.has(r.id)) : [];
  return [...main, ...extra];
}
function markOpened(prev: Set<string>, id: string) {
  const s = new Set(prev);
  const added = !s.has(id);
  if (added) s.add(id);
  return { set: s, added };
}
function getIdsByMember(rows: DecisionRow[], jasennro: number) {
  return rows.filter(r => r.jasennro === jasennro).map(r => r.id);
}
function computeLockedDelta(initial: number | null, current: number): number {
  if (initial == null) return 0;
  return current - initial; // voi olla negatiivinen palautuksissa
}

// Palauttaa "päätöstyypin" esim. "IM002" (ennen ensimmäistä välilyöntiä)
function decisionTypeOf(row: DecisionRow): string {
  return row.paatoskoodi.split(" ")[0] ?? row.paatoskoodi;
}
function formatLocal(ts: string) {
  const d = new Date(ts);
  return isNaN(d.getTime()) ? ts : d.toLocaleString("fi-FI");
}

function computeCategoryCountsFromRows(rows: DecisionRow[]): Record<string, number> {
  const next: Record<string, number> = {};
  for (const k of KATEGORIAT) {
    const f: Filters = { ...initialFilters, kategoria: k.value };
    next[k.value] = rows.filter(r => rowMatchesSelectedCategory(r, f)).length;
  }
  return next;
}

// Laske jäljellä olevat BASE_ROWS:sta, pois lukien processed
function computeCategoryCountsFromBaseExcluding(processed: Set<string>): Record<string, number> {
  const remaining = BASE_ROWS.filter(r => !processed.has(r.id));
  return computeCategoryCountsFromRows(remaining);
}


// Kun value on kategorian arvo → hae counts[value]
// Kun value on "__none" → laske kokonaismäärä processedIds ja vainLomautetut huomioiden
function formatCategoryLabelDynamic(
  value: string,
  counts: Record<string, number>,
  onlyLomautetut: boolean,
  processed: Set<string>
): string {
  if (value === "__none") {
    const n = countAllRespectingOnlyLomautetut(onlyLomautetut, processed);
    return `Ei kategoriaa (${n})`;
  }
  const name = baseNameOfCategory(value);
  const n = counts[value] ?? 0;
  return `${name} (${n})`;
}



// --- Related row generator (for demo) ---
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
    tulot: base.tulot + (idx + 1) * 25,
    tyoaikaPct: base.tyoaikaPct,
    tyonantaja: base.tyonantaja,
    relatedCount: 0,
    // DEMO: tee näistä nimenomaan muiden kategorioiden rivejä
    category: base.category === "myonteiset-85" ? "muu" : "myonteiset-85",
  }));
};

// --- DEV sanity checks (run only in browser/dev) ---
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  const _testBase = makeRow(4); // i % 4 === 0 -> relatedCount should be 2
  console.assert((_testBase.relatedCount ?? 0) === 2, "Test failed: expected relatedCount=2 for makeRow(4)");
  const _rels = generateRelatedRows(_testBase);
  console.assert(_rels.length === 2, "Test failed: generateRelatedRows length should be 2");
  console.assert(_rels.every(r => r.jasennro === _testBase.jasennro), "Test failed: related rows must share jasennro");

  const _rows = [1,2,3,4,5,6].map(i => ({ id: String(i), jasennro: i, kasittelyjakso: "", paatoskoodi: "", ajanjakso: "", lomautustapa: "", toekert: "", tyoTyyppi: "", tyoaikaPct: 0, tyonantaja: "" } as DecisionRow));
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

  const formatted = formatCategoryLabel("myonteiset-85", { "myonteiset-85": 42 });
  console.assert(formatted.endsWith("(42)"), "Test failed: formatCategoryLabel should use override count 42");

  // Delta tests for pill
  console.assert(computeLockedDelta(10, 13) === 3, "Test failed: locked delta +3");
  console.assert(computeLockedDelta(10, 7) === -3, "Test failed: locked delta -3");

  // rowMatchesSelectedCategory tests (mock)
  console.assert(rowMatchesSelectedCategory({ ...makeRow(1), paatoskoodi: "IM002" } as DecisionRow, { ...initialFilters, kategoria: "myonteiset-85" }) === true, "IM002 should match myonteiset");
  console.assert(rowMatchesSelectedCategory({ ...makeRow(2), paatoskoodi: "HYL001" } as DecisionRow, { ...initialFilters, kategoria: "hylkays" }) === true, "HYL001 should match hylkays");
  console.assert(rowMatchesSelectedCategory({ ...makeRow(3), paatoskoodi: "XYZ" } as DecisionRow, { ...initialFilters, kategoria: "myonteiset-85" }) === false, "XYZ should not match myonteiset");
}

export default function Massapaatokset() {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [queryVersion] = useState(0); // simuloitu hakuversio

  // Table state
  const [sort, setSort] = useState<Sort>({ key: "jasennro", dir: "asc" });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [locked, setLocked] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [loading, setLoading] = useState(false);

  // Lisätyt rivit (popoverista "Lisää tarkasteluun ja lukitse")
  const [injectedRows, setInjectedRows] = useState<DecisionRow[]>([]);
  // Rivit, jotka tulee aina näyttää, vaikka raja olisi saavutettu
  const [alwaysIncludeIds, setAlwaysIncludeIds] = useState<Set<string>>(new Set());
  // Hyväksytyt/poistetut rivit (eivät enää näy listassa)
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());
  // Jäsenet, jotka on palautettu (piilotetaan näkymästä kunnes uusi lukitus/refresh)
  const [hiddenMemberIds, setHiddenMemberIds] = useState<Set<number>>(new Set());
  // Kategorioiden dynaamiset jäljellä olevat määrät
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>(
    () => computeCategoryCountsFromRows(BASE_ROWS)
  );

  // Pistotarkastuksen tilat
  const [openedIds, setOpenedIds] = useState<Set<string>>(new Set());
  const [spotChecks, setSpotChecks] = useState(0);
  type AuditEntry = { id: string; jasennro: number; at: string; kategoria?: string; paatos?: string;      // esim. "IM002 xxxxxxx"
  };
  
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  
  const [lockedBatchSize, setLockedBatchSize] = useState<number | null>(null);
  const lockedDelta = useMemo(() => computeLockedDelta(lockedBatchSize, locked.size), [lockedBatchSize, locked]);

  // Yhdistetty tietolähde
  const allRows = useMemo(() => {
    const base = MOCK_ROWS.filter(r => !processedIds.has(r.id));
    const inj = injectedRows.filter(r => !processedIds.has(r.id));
    return [...base, ...inj];
  }, [injectedRows, processedIds]);

  // Helppo tarkistus onko rivi injektoitu (ulkopuolinen lisätty päätös)
  const injectedIdSet = useMemo(() => new Set(injectedRows.map(r => r.id)), [injectedRows]);

  // Laske tehokas muiden hakemusten määrä per jäsen: max(relatedCount, näkymässä olevat - 1)
  const getEffectiveRelatedCount = useMemo(() => {
    const counts = new Map<number, number>();
    allRows.forEach(r => counts.set(r.jasennro, (counts.get(r.jasennro) ?? 0) + 1));
    return (row: DecisionRow) => Math.max((row.relatedCount ?? 0), (counts.get(row.jasennro) ?? 1) - 1);
  }, [allRows]);

  // Jäsenet joilla on >1 päätöstä jäljellä (BASE_ROWS – processedIds)
  // Käytetään kategorialaskureissa ja "Ei useita päätöksiä" -suodatuksessa
const multiMemberSetBase = useMemo(() => {
  const counts = new Map<number, number>();

  // Lasketaan perusdatasta ja ohitetaan jo hyväksytyt rivit
  for (const r of BASE_ROWS) {
    if (processedIds.has(r.id)) continue;
    counts.set(r.jasennro, (counts.get(r.jasennro) ?? 0) + 1);
  }

  const set = new Set<number>();
  for (const [member, n] of counts) {
    if (n > 1) set.add(member);
  }
  return set;
}, [processedIds]);

// Jäsenet joilla on >1 päätöstä NÄKYVISSÄ riveissä (priorisointia varten taulukossa)
const multiMemberSetVisible = useMemo(() => {
  const counts = new Map<number, number>();
  const hasRelated = new Set<number>(); // Members with relatedCount > 0
  
  // Laske kaikista näkyvistä riveistä (allRows sisältää BASE + injektoidut)
  for (const r of allRows) {
    if (hiddenMemberIds.has(r.jasennro)) continue;
    counts.set(r.jasennro, (counts.get(r.jasennro) ?? 0) + 1);
    // Jos rivissä on relatedCount > 0, tällä jäsenellä on useita päätöksiä
    if ((r.relatedCount ?? 0) > 0) {
      hasRelated.add(r.jasennro);
    }
  }

  const set = new Set<number>();
  for (const [member, n] of counts) {
    // Jäsenellä on useita päätöksiä jos:
    // 1) Hänellä on jo useampi rivi näkyvissä, TAI
    // 2) Hänellä on relatedCount > 0 (muita päätöksiä saatavilla)
    if (n > 1 || hasRelated.has(member)) {
      set.add(member);
    }
  }
  return set;
}, [allRows, hiddenMemberIds]);



  // Rivit, jotka pitää aina näyttää riippumatta määrärajasta (jäsenillä useita päätöksiä)
const priorityIdSet = useMemo(() => {
  // vain niiltä riveiltä, jotka kuuluvat multiMember-asiakkaille
  return new Set(
    allRows
      .filter(r => multiMemberSetVisible.has(r.jasennro))
      .map(r => r.id)
  );
}, [allRows, multiMemberSetVisible]);


const categoryLabel = useMemo(() => {
  // Normalisoi: käsittele __none kuten "ei kategoriaa"
  const cat = !filters.kategoria || filters.kategoria === "__none"
    ? undefined
    : filters.kategoria;

  if (!cat) {
    const n = countAllRespectingOnlyLomautetut(
      filters.vainLomautetut,
      processedIds
    );
    return `Kaikki päätökset (${n})`;
  }

  const n = countCategoryRespectingOnlyLomautetut(
    cat,
    filters.vainLomautetut,
    processedIds
  );
  const baseName = baseNameOfCategory(cat);
  return `${baseName} (${n})`;
}, [filters.kategoria, filters.vainLomautetut, processedIds]);



  
  // Hook valikon optioille:
const decisionTypeOptions = React.useMemo(() => {
  const rowsInCategory = allRows.filter(r => !filters.kategoria || rowMatchesSelectedCategory(r, filters));
  const set = new Set<string>();
  rowsInCategory.forEach(r => set.add(decisionTypeOf(r)));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}, [allRows, filters.kategoria]);

  // Derived rows from mock + filters
 
 
  const baseFiltered = useMemo(() => {
    // Aloita kaikista näkyvistä riveistä (ilman palautettuja jäseniä)
    let rows = [...allRows];
  
    // Piilota palautetut jäsenet
    if (hiddenMemberIds.size > 0) {
      rows = rows.filter(r => !hiddenMemberIds.has(r.jasennro));
    }
  
    const f = filters;
  
    // Säilytä aina lukitut TAI "lisätty tarkasteluun" -rivit,
    // vaikka ne eivät täsmäisi aktiiviseen kategoriaan / filttereihin.
    const keepAlways = (r: DecisionRow) => locked.has(r.id) || alwaysIncludeIds.has(r.id);
  
    // KATEGORIA: kun kategoria on valittu → rajaa; kun EI ole → ei rajausta
    if (f.kategoria) {
      rows = rows.filter(r => keepAlways(r) || rowMatchesSelectedCategory(r, f));
    }
  
    // Päätöskoodi ja selite – vapaa teksti (jos annettu)
    if (f.paatoskoodi && f.paatoskoodi.trim().length > 0) {
      const q = f.paatoskoodi.trim().toLowerCase();
      rows = rows.filter(r => r.paatoskoodi.toLowerCase().includes(q));
    }
  
    // Muut suodattimet (pidä nykyinen demo-logiikka)
    if (f.tyonantaja && f.tyonantaja.trim().length > 0) {
      const q = f.tyonantaja.trim().toLowerCase();
      rows = rows.filter(r => r.tyonantaja.toLowerCase().includes(q));
    }
    if (f.vireilletulo) {
      rows = rows.filter((_, idx) => idx % 2 === 0);
    }
  
    // Vain lomautetut – rajaa, mutta säilytä always-keep -rivit
    if (f.vainLomautetut) {
      rows = rows.filter(r => keepAlways(r) || isLomautettu(r));
    }
  
    // Ei useita päätöksiä – poista jäsenet, joilla on >1 päätöstä
    //    (mukaan lukien ne, joilla on relatedCount > 0)
    if (f.eiUseita) {
    rows = rows.filter(r => keepAlways(r) || !multiMemberSetVisible.has(r.jasennro));
}
  
    // Poista duplikaatit varmuuden vuoksi
    const seen = new Set<string>();
    rows = rows.filter(r => (seen.has(r.id) ? false : (seen.add(r.id), true)));
  
    return rows;
  }, [
    allRows,
    hiddenMemberIds,
    locked,
    alwaysIncludeIds,
    filters.kategoria,
    filters.paatoskoodi,
    filters.tyonantaja,
    filters.vireilletulo,
    filters.vainLomautetut,
    filters.eiUseita,
    multiMemberSetVisible,
  ]);
  

  
  


 
const filteredRows = useMemo(() => {
 
  // Jos käyttäjä on antanut määrän, käytä sitä aina (myös "Ei kategoriaa").
// Muuten näytetään kaikki suodatetut.
const limit = Math.max(0, Number(filters.tarkasteltavienMaara ?? baseFiltered.length));


  

  // 1) Lukitut rivit (kategorian sisällä) näkyvät aina ja KULUTTAVAT quota-a
  const lockedRows = baseFiltered.filter(r => locked.has(r.id));
  const lockedIdSet = new Set(lockedRows.map(r => r.id));

  // 2) Injektoidut (alwaysIncludeIds) näkyvät aina (mutta EIVÄT kuluta quota-a)
  const injectedAlwaysRows = baseFiltered.filter(r => !lockedIdSet.has(r.id) && alwaysIncludeIds.has(r.id));
  const injectedIdSet = new Set(injectedAlwaysRows.map(r => r.id));

  // 3) Loput ehdokkaat = ei-lukitut, ei-injektoidut
  const candidates = baseFiltered.filter(r => !lockedIdSet.has(r.id) && !injectedIdSet.has(r.id));

  // 4) Priorisoi: multi-jäsenet ensin, sitten jasennro, sitten id
  candidates.sort((a, b) => {
    const aMulti = multiMemberSetVisible.has(a.jasennro) ? 1 : 0;
    const bMulti = multiMemberSetVisible.has(b.jasennro) ? 1 : 0;
    if (aMulti !== bMulti) return bMulti - aMulti; // multi ylös
    if (a.jasennro !== b.jasennro) return a.jasennro - b.jasennro;
    return String(a.id).localeCompare(String(b.id));
  });

  // 5) Täytä quota: lukitut kuluttavat, injektoidut eivät
  const remainingQuota = Math.max(0, limit - lockedRows.length);
  const take = candidates.slice(0, remainingQuota);

  // 6) Palauta yhdistelmä:
  // - lukitut (kuluttavat quota-a)
  // - määrärajalla otetut candidate-rivit
  // - injektoidut (ohittavat quota-rajan)
  // Huom: järjestys lajitellaan uudelleen myöhemmin sortedRows-memossa.
  return [...lockedRows, ...take, ...injectedAlwaysRows];
}, [
  baseFiltered,
  filters.tarkasteltavienMaara,
  locked,
  alwaysIncludeIds,
  multiMemberSetVisible
]);

const selectedCategoryText = useMemo(() => {
  if (!filters.kategoria || filters.kategoria === "__none") {
    const n = countAllRespectingOnlyLomautetut(filters.vainLomautetut, processedIds);
    return `Ei kategoriaa (${n})`;
  }
  const n = countCategoryRespectingOnlyLomautetut(
    filters.kategoria,
    filters.vainLomautetut,
    processedIds
  );
  return `${baseNameOfCategory(filters.kategoria)} (${n})`;
}, [filters.kategoria, filters.vainLomautetut, processedIds]);


  const sortedRows = useMemo(() => {
    const rows = [...filteredRows];
    // Ensisijainen: asiakkaat joilla useita päätöksiä ylös
    rows.sort((a, b) => {
      const aMulti = multiMemberSetVisible.has(a.jasennro) ? 1 : 0;
      const bMulti = multiMemberSetVisible.has(b.jasennro) ? 1 : 0;
      if (aMulti !== bMulti) return bMulti - aMulti; // 1 ennen 0
      // Toinen: ryhmittely jasennron mukaan
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
  }, [filteredRows, sort, multiMemberSetVisible, filters.kategoria]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page, pageSize]);

  useEffect(() => {
    if (!filters.kategoria) return;
  const n = countCategoryRespectingOnlyLomautetut(
    filters.kategoria,
    filters.vainLomautetut,
    processedIds
  );
  setFilters((f) => (f.tarkasteltavienMaara === n ? f : { ...f, tarkasteltavienMaara: n }));
}, [filters.kategoria, filters.vainLomautetut, processedIds]);

  

  const toggleAllOnPage = (checked: boolean) => {
    const copy = new Set(selected);
    pagedRows.forEach(r => (checked ? copy.add(r.id) : copy.delete(r.id)));
    setSelected(copy);
  };

  const isAllOnPageChecked = pagedRows.length > 0 && pagedRows.every(r => selected.has(r.id));
  const lockedInCategoryCount = useMemo(() => allRows.filter(r => locked.has(r.id) && rowMatchesSelectedCategory(r, filters)).length, [allRows, locked, filters]);
  const showBulkBar = selected.size > 0 || lockedInCategoryCount > 0;

  // Kokonaismäärä Y: käytä dynaamista categoryCounts-arvoa jos saatavilla,
// muuten fallback nykyiseen baseFiltered-lukumäärään.
const totalInCategoryCount = useMemo(() => {
  const key = filters.kategoria as string | undefined;
  if (key && categoryCounts[key] != null) return categoryCounts[key];
  return baseFiltered.length;
}, [filters.kategoria, categoryCounts, baseFiltered]);

// Näkyvien quota-rivien määrä X: vähintään lukitut (kuluttavat quota-a),
// muuten rajaus (tarkasteltavienMaara). Ei laske mukaan alwaysIncludeIds/injektoituja.
const visibleFromQuotaCount = useMemo(() => {
  const quota = Number.isFinite(filters.tarkasteltavienMaara as number)
    ? (filters.tarkasteltavienMaara as number)
    : baseFiltered.length;

  // Lukitut rivit vain valitussa kategoriassa
  const lockedCount = baseFiltered.filter(r => locked.has(r.id)).length;

  // Jos lukittuja on yli rajan, näytetään vähintään lukitut.
  // Yläraja on kuitenkin kategorian nykyinen kokonaismäärä.
  return Math.min(baseFiltered.length, Math.max(lockedCount, quota));
}, [baseFiltered, locked, filters.tarkasteltavienMaara]);


  // Lukittujen rivien jäsennumerot
  const lockedMemberSet = useMemo(() => {
    const s = new Set<number>();
    allRows.forEach(r => { if (locked.has(r.id)) s.add(r.jasennro); });
    return s;
  }, [locked, allRows]);

  // Näytetään "Lisää & lukitse asiakkaiden muut hakemukset" vasta kun käyttäjä on lukinnut jotain
  const canBulkAddRelated = useMemo(() => {
    if (lockedMemberSet.size === 0) return false;
    // Onko lukituilla asiakkailla muita hakemuksia?
    return allRows.some(r => lockedMemberSet.has(r.jasennro) && (r.relatedCount ?? 0) > 0);
  }, [lockedMemberSet, allRows]);

  // Lukitse & valitse kaikki nykyiset suodatetut rivit
  const narrowAndLock = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 650));
    const ids = new Set(filteredRows.map(r => r.id));
    setLocked(prev => new Set([...prev, ...ids]));
    setSelected(new Set(ids));
    setLockedBatchSize(ids.size);
    setLoading(false);
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setAlwaysIncludeIds(new Set());
  };

  // Lisää kaikkien lukittujen asiakkaiden muut hakemukset kerralla ja lukitse ne
  const addAllRelatedToViewAndLock = () => {
    if (lockedMemberSet.size === 0) return;
    const bases = allRows.filter(r => lockedMemberSet.has(r.jasennro) && (r.relatedCount ?? 0) > 0);
    const allRelated = bases.flatMap(b => generateRelatedRows(b));
    if (allRelated.length === 0) return;
    setInjectedRows(prev => {
      const existingIds = new Set(prev.map(r => r.id));
      const toAdd = allRelated.filter(r => !existingIds.has(r.id));
      return [...prev, ...toAdd];
    });
    const ids = new Set(allRelated.map(r => r.id));
    setSelected(prev => new Set([...prev, ...ids]));
    setLocked(prev => new Set([...prev, ...ids]));
    setAlwaysIncludeIds(prev => new Set([...Array.from(prev), ...ids]));
  };

  // Lisää yhden asiakkaan muut hakemukset (tooltipista) ja lukitse ne
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
      const categoryLabelNow = formatCategoryLabel(filters.kategoria, categoryCounts) || "Ei kategoriaa";setAuditLog(prev => [...prev,
  {
    id: row.id,
    jasennro: row.jasennro,
    at: new Date().toISOString(),
    kategoria: categoryLabelNow,
    paatos: row.paatoskoodi,
  }
]);

      // TODO: API-kutsu taustaan pistotarkastuksen kirjaamiseksi
    }
  };

  // Palauttaa mapin { jasennro -> { missingCount, missingIds } } jos jäseneltä puuttuu lukittuja/tuotuja päätöksiä
function membersWithMissingForApproval(
  ids: Set<string>,
  allRows: DecisionRow[],
  locked: Set<string>,
  getEffectiveRelatedCount: (row: DecisionRow) => number
): Map<number, { missingCount: number; missingIds: string[] }> {
  const selectedRows = allRows.filter(r => ids.has(r.id));
  const members = new Set(selectedRows.map(r => r.jasennro));

  const result = new Map<number, { missingCount: number; missingIds: string[] }>();

  for (const m of members) {
    const rowsOfMember = allRows.filter(r => r.jasennro === m);
    const notLocked = rowsOfMember.filter(r => !locked.has(r.id)); // rivit, jotka ovat olemassa mutteivät lukittuja

    // Tarkista onko "taustalla" olemassa myös injektoimattomia (tooltipista ilmeneviä) muita päätöksiä:
    const anyRow = rowsOfMember[0] ?? selectedRows.find(r => r.jasennro === m);
    const effRelated = anyRow ? getEffectiveRelatedCount(anyRow) : 0; // kokonaismäärä "muita" päätöksiä
    const shownOthers = Math.max(0, rowsOfMember.length - 1);        // montako "muu päätös" näkyy jo listassa
    const offList = Math.max(0, effRelated - shownOthers);           // arvio injektoimattomista päätöksistä

    const missingCount = notLocked.length + offList;
    if (missingCount > 0) {
      result.set(m, { missingCount, missingIds: notLocked.map(r => r.id) });
    }
  }

  return result;
}


  
const approveByIds = (ids: Set<string>) => {
  if (ids.size === 0) return;

  const count = ids.size;

  setProcessedIds(prevProcessed => {
    const nextProcessed = new Set([...prevProcessed, ...ids]);
    // 🔒 LASKURI: vain BASE_ROWS → ulkopuoliset eivät lisää tai vähennä kategoriaa
    setCategoryCounts(computeCategoryCountsFromBaseExcluding(nextProcessed));
    return nextProcessed;
  });

  setLocked(prev => { const s = new Set(prev); ids.forEach(id => s.delete(id)); if (s.size === 0) setLockedBatchSize(null); return s; });
  setAlwaysIncludeIds(prev => { const s = new Set(prev); ids.forEach(id => s.delete(id)); return s; });
  setSelected(prev => { const s = new Set(prev); ids.forEach(id => s.delete(id)); return s; });

  // Näytä onnistumisviesti
  toast.success(`${count} päätöstä hyväksytty`, {
    duration: 3000,
  });
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
    <div className="p-4 md:p-6 lg:p-8 w-full">
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
            <Select
  value={filters.kategoria ?? "__none"}
  onValueChange={(v) =>
    setFilters((f) => {
      if (v === "__none") {
        // Ei kategoriaa → ei määrärajausta kategorian mukaan
        return { ...f, kategoria: undefined, tarkasteltavienMaara: undefined };
      }
      // Kategoria valittu → laske sen määrä (voit huomioida vainLomautetut halutessasi)
     
      const nextCount = countCategoryRespectingOnlyLomautetut(
        v,
        f.vainLomautetut,
        processedIds
      );
      return { ...f, kategoria: v, tarkasteltavienMaara: nextCount };
    })
  }
>
<SelectTrigger className="w-full">
<span className="truncate">{selectedCategoryText}</span>
  </SelectTrigger>
  <SelectContent>
  {/* Ei kategoriaa – koko populaatio BASE_ROWS:sta (–processedIds), opt. vain lomautetut */}
  <SelectItem value="__none">
    {(() => {
      const n = countAllRespectingOnlyLomautetut(filters.vainLomautetut, processedIds);
      return `Ei kategoriaa (${n})`;
    })()}
  </SelectItem>

  {/* Kaikki kategoriat – dynaaminen laskenta, ei injektoituja */}
  {KATEGORIAT.map((o) => (
    <SelectItem key={o.value} value={o.value}>
      {(() => {
        const n = countCategoryRespectingOnlyLomautetut(
          o.value,
          filters.vainLomautetut,
          processedIds
        );
        const name = (o.label || o.value).replace(/\s*\(\d+\)\s*$/, "");
        return `${name} (${n})`;
      })()}
    </SelectItem>
  ))}
</SelectContent>

</Select>



            </div>

            <div className="space-y-2">
  <Label>Päätöskoodi ja selite</Label>
  <Select
    value={filters.paatoskoodi ?? "__none"}
    onValueChange={(v) =>
      setFilters(f => ({
        ...f,
        // "__none" = ei valintaa → poista suodatus
        paatoskoodi: v === "__none" ? undefined : v
      }))
    }
  >
    <SelectTrigger className="w-full">
      <SelectValue placeholder="(Ei valintaa)" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="__none">(Ei valintaa)</SelectItem>
      {PAATOSKOODIT.map(opt => (
        <SelectItem key={opt.value} value={opt.value}>
          {opt.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>


<div className="space-y-2">
  <Label>Lisätieto</Label>
  <Select
    value={filters.lisatieto ?? "__none"}
    onValueChange={(v) =>
      setFilters((f) => ({
        ...f,
        lisatieto: v === "__none" ? undefined : v,
      }))
    }
  >
    <SelectTrigger className="w-full">
      <SelectValue placeholder="(Ei valintaa)" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="__none">(Ei valintaa)</SelectItem>
      {LISATIETO.map((o) => (
        <SelectItem key={o.value} value={o.value}>
          {o.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>


            {/* Lisäteksti */}
            <div className="space-y-2">
            <Label>Lisäteksti</Label>
          <Select
          value={filters.lisateksti ?? "__none"}
         onValueChange={(v) =>
             setFilters((f) => ({ ...f, lisateksti: v === "__none" ? undefined : v }))
    }
  >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="(Ei valintaa)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">(Ei valintaa)</SelectItem>
             {LISATEKSTIT.map((o) => (
          <SelectItem key={o.value} value={o.value}>
          {o.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>


<div className="space-y-2">
  <Label>Perustelut</Label>
  <Select
    value={filters.perustelu ?? "__none"}
    onValueChange={(v) =>
      setFilters((f) => ({
        ...f,
        perustelu: v === "__none" ? undefined : v,
      }))
    }
  >
    <SelectTrigger className="w-full">
      <SelectValue placeholder="(Ei valintaa)" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="__none">(Ei valintaa)</SelectItem>
      {PERUSTE.map((o) => (
        <SelectItem key={o.value} value={o.value}>
          {o.label}
        </SelectItem>
      ))}
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
            <Checkbox id="vainL"checked={filters.vainLomautetut}
            onCheckedChange={(v: any) =>
            setFilters(f => ({ ...f, vainLomautetut: Boolean(v) }))}/>
           <Label htmlFor="vainL">Vain lomautetut</Label>
          </div>


            <div className="flex items-center gap-3 mt-6">
              <Checkbox id="lisa" checked={filters.sisaltaaLisamaksua} onCheckedChange={(v: any) => setFilters(f => ({ ...f, sisaltaaLisamaksua: Boolean(v) }))} />
              <Label htmlFor="lisa">Sisältää lisämaksua</Label>
            </div>

            <div className="flex items-center gap-3">
            <Checkbox id="eiUseita"checked={filters.eiUseita === true}
            onCheckedChange={(v) => setFilters(f => ({ ...f, eiUseita: v === true }))}/>
            <Label htmlFor="eiUseita">Ei useita päätöksiä</Label>
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
            {canBulkAddRelated && (
              <Button
                variant="secondary"
                onClick={addAllRelatedToViewAndLock}
                title="Lisää lukittujen asiakkaiden muut hakemukset ja lukitse ne kerralla"
              >
                Lisää & lukitse asiakkaiden muut hakemukset
              </Button>
            )}
            <Button variant="ghost" onClick={clearFilters}>Tyhjennä hakuvalinnat</Button>
          </div>

          {/* Bulk action bar */}
          {showBulkBar && (
            <div className="sticky top-0 mt-4 z-20 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
              <div className="text-sm">
                <strong>{selected.size > 0 ? selected.size : lockedInCategoryCount}</strong> riviä hyväksyttävissä
              </div>
              <div className="flex gap-2">
                
              <Button
  onClick={() => {
    // Jos mitään ei ole valittu, hyväksy kaikki lukitut rivit valitussa kategoriassa
    const ids =
      selected.size > 0
        ? selected
        : new Set(
            allRows
              .filter(
                (r) => locked.has(r.id) && rowMatchesSelectedCategory(r, filters)
              )
              .map((r) => r.id)
          );
    if (ids.size === 0) return;

    // Estä hyväksyntä, jos valitulla jäsenellä on muita päätöksiä lukitsematta/tuomatta
    const blocking = membersWithMissingForApproval(
      ids,
      allRows,
      locked,
      getEffectiveRelatedCount
    );
    
    if (blocking.size > 0) {
      const list = Array.from(blocking.entries())
        .map(([m, info]) => `jäsen ${m} (puuttuu ${info.missingCount})`)
        .join(", ");
    
      toast.error("Et voi vielä hyväksyä", {
        description: (
          <div className="text-xs text-slate-700">
            Seuraavilta jäseniltä puuttuu lukittuja/tuotuja päätöksiä: {list}
          </div>
        ),
        action: {
          label: "Lisää & lukitse nyt",
          onClick: () => {
            addAllRelatedToViewAndLock();
          },
        },
        duration: 7000,
        style: { maxWidth: "672px" }, // 672px = max-w-2xl
      });
      return;
    }
    

    // Hyväksy
    approveByIds(ids);
  }}
>
  Hyväksy päätökset
</Button>

                
                <Button variant="ghost" onClick={() => {
                  // Palauta VALITTUJEN jäsenten kaikki rivit kerralla
                  const memberSet = new Set(Array.from(selected).map(id => (allRows.find(r => r.id === id)?.jasennro)).filter(Boolean) as number[]);
                  const idsToClear = new Set(
                    allRows.filter(r => memberSet.has(r.jasennro)).map(r => r.id)
                  );
                  setLocked(prev => { const s = new Set(prev); idsToClear.forEach(id => s.delete(id)); if (s.size === 0) setLockedBatchSize(null); return s; });
                  setAlwaysIncludeIds(prev => { const s = new Set(prev); idsToClear.forEach(id => s.delete(id)); return s; });
                  setSelected(prev => { const s = new Set(prev); idsToClear.forEach(id => s.delete(id)); return s; });
                  // Piilota palautettujen jäsenten rivit näkymästä
                  setHiddenMemberIds(prev => new Set([...prev, ...memberSet]));
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
                <span className="text-xs rounded-full px-2 py-0.5 bg-slate-100"> Kategoria: {categoryLabel || "Ei kategoriaa"}</span>

                  {lockedBatchSize !== null && locked.size > 0 && (
                    <span className="text-xs rounded-full px-2 py-0.5 bg-amber-100">Tarkasteltavien määrä (lukittu): {lockedBatchSize}{lockedDelta !== 0 && ` (${lockedDelta > 0 ? "+" : ""}${lockedDelta})`}</span>
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
                      <li key={idx} className="mb-1">
                        <div className="font-medium">
                        {formatLocal(e.at)} – id {e.id}, jäsennro {e.jasennro}
                       </div>
                     <div className="text-[11px] text-slate-600">
                    Kategoria: {e.kategoria ?? "Ei kategoriaa"} · Päätös: {e.paatos ?? "-"}
                 </div>
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
                    {headerCell("Id", "id")}
                    {headerCell("Käsittelyjakso", "kasittelyjakso")}
                    {headerCell("Päätöksen ajanjakso", "ajanjakso")}
                    {headerCell("Päätös ja selite", "paatoskoodi")}
                    {headerCell("Lomautustapa", "lomautustapa")}
                    {headerCell("Työn tyyppi", "tyoTyyppi")}
                    {headerCell("Työaika %", "tyoaikaPct")}
                    {headerCell("TOE-kertymä", "toekert")}
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
                              <Lock className="h-4 w-4 text-amber-600" />
                            ) : (
                              <LockOpen className="h-4 w-4 text-slate-300" />
                            )}
                            {locked.has(r.id) && (
                              <Button variant="link" size="sm" className="px-1 h-6 text-xs" onClick={() => {
                                // Palauta KAIKKI tämän jäsenen rivit kerralla: poista lukitus & valinta + poista always-include
                                const memberIds = new Set(getIdsByMember(allRows, r.jasennro));
                                setLocked(prev => { const s = new Set(prev); memberIds.forEach(id => s.delete(id)); if (s.size === 0) setLockedBatchSize(null); return s; });
                                setSelected(prev => { const s = new Set(prev); memberIds.forEach(id => s.delete(id)); return s; });
                                setAlwaysIncludeIds(prev => { const s = new Set(prev); memberIds.forEach(id => s.delete(id)); return s; });
                                // Piilota tämän jäsenen kaikki rivit näkymästä
                                setHiddenMemberIds(prev => new Set([...prev, r.jasennro]));
                              }}>Palauta</Button>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-sm">{r.jasennro}</td>
                      <td className="px-3 py-2 text-sm">{r.id}</td>
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
                      <td className="px-3 py-2 text-sm">{r.ajanjakso}</td>
                      <td className="px-3 py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span>{r.paatoskoodi}</span>
                          {(() => {
                            const count = getEffectiveRelatedCount(r);
                            const show = count > 0 && (!injectedIdSet.has(r.id) || rowMatchesSelectedCategory(r, filters));
                            return show;
                          })() && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  className="text-xs rounded-full px-2 py-0.5 bg-sky-100 text-sky-800 hover:bg-sky-200 transition"
                                  title={`+${getEffectiveRelatedCount(r)} muuta päätöstä`}
                                >
                                  +{getEffectiveRelatedCount(r)}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80" align="start">
                                <div className="text-sm font-medium mb-2">Muut hakemukset ({getEffectiveRelatedCount(r)})</div>
                                <ul className="list-disc pl-5 text-sm text-slate-700">
                                  {(() => {
                                    const others = allRows.filter(x => x.jasennro === r.jasennro && x.id !== r.id);
                                    const list = others.length > 0 ? others : generateRelatedRows(r);
                                    return list.map(item => (
                                      <li key={item.id}>{item.paatoskoodi}</li>
                                    ));
                                  })()}
                                </ul>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-3 py-2 text-sm">{r.lomautustapa}</td>
                      <td className="px-3 py-2 text-sm">{r.tyoTyyppi}</td>
                      <td className="px-3 py-2 text-sm">{r.tyoaikaPct == null ? "—" : `${r.tyoaikaPct}%`}</td>


                      <td className="px-3 py-2 text-sm">{r.toekert}</td>
                      <td className="px-3 py-2 text-sm">{r.tyonantaja}</td>
                     
                      
                      
                    </tr>
                  ))}

                  {pagedRows.length === 0 && (
                    <tr>
                      <td colSpan={11} className="text-center text-sm text-slate-500 py-10">Ei päätöksiä.</td>
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

              <div className="text-xs text-slate-500">{visibleFromQuotaCount} / {totalInCategoryCount}</div>

            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
