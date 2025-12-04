// ===============================
// Constants & options
// ===============================

export const PERIODS = [
  { value: "1m", label: "1 kuukausi (21,5 pv)" },
  { value: "4w", label: "4 viikkoa (20 pv)" },
] as const;

export type PeriodKey = (typeof PERIODS)[number]["value"];

export const DAYS_BY_PERIOD: Record<PeriodKey, number> = {
  "1m": 21.5,
  "4w": 20,
};

export const BENEFIT_TYPES = [
  { value: "ansioturva", label: "Ansioturva" },
] as const;

// Etuuden valintalista (esimerkkivaihtoehtoja)
export const BENEFIT_OPTIONS = [
  { value: "31-osa-aikatyö", label: "31 - Osa-aikatyö" },
  { value: "32-sivutoimiyrittäjyys", label: "32 - Sivutoimiyrittäjyys" },
  { value: "33-sairauspäiväraha", label: "33 - Sairauspäiväraha" },
  { value: "34-vanhempainraha", label: "34 - Vanhempainraha" },
  { value: "35-muu-etuus", label: "35 - Muu etuus" },
];

// Etuudet dropdown (esimerkkivaihtoehdot)
export const BENEFIT_CATALOG = [
  { value: "vanhempainraha", label: "Vanhempainpäiväraha" },
  { value: "sairauspaivaraha", label: "Sairauspäiväraha" },
  { value: "kuntoutusraha", label: "Kuntoutusraha" },
  { value: "muu", label: "Muu etuus" },
] as const;

// Tulot (sovittelu) – dropdown
export const INCOME_OPTIONS = [
  { value: "none", label: "Ei tuloja" },
  { value: "parttime", label: "Osa-aikatyö (≤ 80 %)" },
  { value: "ft_short", label: "Kokoaikatyö ≤ 2 viikkoa" },
  { value: "selfemp", label: "Sivutoiminen yrittäjyys" },
] as const;

// Viralliset perusarvot (2025 – esimerkkitaso)
export const DAILY_BASE = 37.21; // perusosa €/pv
export const SPLIT_POINT_MONTH = 3534.95; // taitekohta €/kk
export const STAT_DEDUCTIONS = 0.0354; // 3.54 % vähennys ennen päiväansiota
export const TRAVEL_ALLOWANCE_BASE = 9; // €/pv veroton
export const TRAVEL_ALLOWANCE_ELEVATED = 18; // €/pv veroton

