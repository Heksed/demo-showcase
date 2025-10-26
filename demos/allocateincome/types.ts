// Shared types for Allocate Income demo

export type IncomeRow = {
  id: string;
  huom?: string;
  maksupaiva: string; // payDate
  tulolaji: string; // incomeType
  palkka: number; // salary
  alkuperainenTulo: number; // originalIncome
  parentId?: string;
  ansaintaAika: string; // earningPeriod
  kohdistusTOE?: string; // allocationTOE
  tyonantaja: string; // employer
  allocationData?: any; // Tallenna kohdistuksen tiedot
};

export type ViikkoTOERow = {
  id: string;
  alkupäivä: string;
  loppupäivä: string;
  työnantaja: string;
  lisäteksti?: string;
  selite: string;
  palkka: number;
  toeViikot: number;
  jakaja: number;
  toeTunnit: number;
  tunnitYhteensä: number;
};

export type MonthPeriod = {
  id: string;
  ajanjakso: string;
  toe: number;
  jakaja: number;
  palkka: number;
  tyonantajat: string;
  pidennettavatJaksot: number;
  rows: IncomeRow[];
  viikkoTOERows?: ViikkoTOERow[];
};

export type AllocationMode = "single" | "batch";
export type AllocationMethod = "employment" | "period"; // Employment duration or custom period
export type Direction = "forward" | "backward";
export type DistributionType = "byDays" | "equalMonths" | "manual";

export type AllocationContext = {
  mode: AllocationMode;
  payDate: string;
  sourceRows: IncomeRow[];
  totalAmount: number;
};

export type MonthSplit = {
  year: number;
  month: number; // 1-12
  earningStart: string; // YYYY-MM-DD
  earningEnd: string; // YYYY-MM-DD
  amount: number;
  incomeType?: string; // for batch mode
};

export const INCOME_TYPES: string[] = [
  "Tulospalkka",
  "Aikapalkka",
  "Lomaraha",
  "Vuosilomakorvaus",
  "Työkorvaus",
  "Jokin etuus",
  "Aloitepalkkio",
  "Kilometrikorvaus",
  "Tulospalkkio",
  "Bonus",
];

export const NON_BENEFIT_AFFECTING_INCOME_TYPES: string[] = [
  "Kokouspalkkio",
  "Luentopalkkio",
];


