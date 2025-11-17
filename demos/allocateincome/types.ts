// Shared types for Allocate Income demo

export type SubsidyRule =
  | "NONE"                // Normal work, no subsidy rules
  | "NO_TOE_EXTENDS"      // Subsidized work that does NOT accrue TOE, only extends the reference period
  | "PERCENT_75"          // Subsidized work before 2.9.2024 → every month is counted at 75%
  | "LOCK_10_MONTHS_THEN_75"; // Subsidized work with 10-month lock: first 10 months 0%, then 75%

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
  
  // Subsidized work fields (optional, for palkkatuettu työ correction)
  isSubsidized?: boolean;
  subsidyRule?: SubsidyRule;
};

export type SubsidyCorrection = {
  subsidizedMonthsCounted: number;
  subsidizedGrossTotal: number;
  correctToeFromSubsidy: number;
  toeCorrection: number;
  toeCorrectedTotal: number;
  acceptedForWage: number;
  totalSalaryCorrected: number; // Korjattu TOE-palkka (totalSalary)
  totalSalaryCorrection: number; // Korjaus TOE-palkkaan
  averageSalaryCorrected: number; // Korjattu perustepalkka/kk (laskettu korjatusta totalSalarysta)
  averageSalaryCorrection: number; // Korjaus perustepalkkaan
  rule: SubsidyRule;
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


