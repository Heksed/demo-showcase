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
  
  // Siirtotiedot: palkat joita ei huomioida palkanmäärityksessä
  isTransferData?: boolean;
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
  // Manual period adjustments (for manual correction workflow)
  manualPeriodAdjustments?: Array<{
    periodId: string;
    includeInToe: boolean;
    includeInWage: boolean;
    divisorDays: number;
    subsidyType?: SubsidyRule;
    correctedTOE?: number; // Korjattu TOE-arvo periodille
  }>;
  // Periodikohtaiset korjatut TOE-arvot (kaikille periodille)
  periodCorrectedTOE?: Array<{
    periodId: string;
    correctedTOE: number;
    correctedJakaja: number;
  }>;
  // Määrittelyjakso korjatun TOE:n perusteella
  definitionPeriodStart?: string; // Format: "DD.MM.YYYY"
  definitionPeriodEnd?: string; // Format: "DD.MM.YYYY"
  // Korjattu jakaja (todelliset TOE jakajanpäivät)
  totalDivisorDays?: number; // Korjattu jakaja, jota käytetään TOE-laskennassa
  // Korjausmoodi: automaattinen tai manuaalinen
  correctionMode?: "automatic" | "manual";
  // Manuaaliset periodikohtaiset arvot (vain manuaalisessa moodissa)
  manualPeriodValues?: Array<{
    periodId: string;
    manualSubsidizedWage: number; // Manuaalinen palkkatukityön palkka
    originalSubsidizedWage: number; // Alkuperäinen palkkatukityön palkka (ennen korjausta)
    manualTOE: number; // Manuaalinen TOE-arvo
    manualJakaja: number; // Manuaalinen jakaja
    includeInToe: boolean;
    includeInWage: boolean;
  }>;
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
  tunnitYhteensä?: number; // Tuntitiedot viikkoTOE-laskentaan (ennen 2.9.2024)
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

// Types for period-based UI with segment-based calculation
export type SegmentType = "COMMON" | "SUBSIDY_ONLY";

export interface SubsidySegment {
  id: string;
  type: SegmentType;
  
  // Number of calendar months in this segment (e.g. 10 for a 10-month common period)
  calendarMonths: number;
  
  // TOE as the system currently sees it (before any 0.75 conversion)
  toeNormalSystem: number;     // TOE from normal work in this segment
  toeSubsidizedSystem: number; // TOE from subsidized work in this segment
  
  // Wages for wage determination
  wageNormalTotal: number;       // wages from normal work in this segment
  wageSubsidizedTotal: number;   // wages from subsidized work in this segment
  
  // Period IDs that belong to this segment
  periodIds: string[];
  
  // For manual adjustments (handler can override)
  includeInToe: boolean;       // include this segment in the TOE recalculation
  includeInWage: boolean;      // include this segment in the wage base (usually same as includeInToe)
}

export interface PeriodRow {
  periodId: string;
  periodDate: Date; // Periodin kuukausi
  maksupaiva: string; // Näytettävä maksupäivä (ensimmäinen maksupäivä tai periodin kuukausi)
  
  // Normaalityö (näytetään vain jos on)
  normalWorkWage?: number;
  normalWorkTOE?: number; // Korjattu normaalityön TOE periodille
  
  // Palkkatuettu työ
  subsidizedWorkWage: number;
  subsidizedWorkEmployer: string; // Yritys
  subsidizedWorkTOE: number; // Järjestelmän TOE (ennen korjausta)
  correctedSubsidizedTOE: number; // Korjattu palkkatuetun työn TOE periodille
  
  // Yhteensä korjattu TOE periodille (normalWorkTOE + correctedSubsidizedTOE)
  correctedTOE: number;
  jakaja: number; // Jakaja-päivät
  
  // Segment-tyyppi (taustalla, ei näytetä suoraan)
  segmentType: SegmentType;
  
  // For LOCK_10_MONTHS_THEN_75: position from employment start (0-based, undefined if not applicable)
  subsidizedPosition?: number;
  
  // Original period data
  originalPeriod: MonthPeriod;
  
  // Manually editable fields (for manual correction workflow)
  manualIncludeInToe?: boolean; // Override for includeInToe (undefined = use calculated value)
  manualIncludeInWage?: boolean; // Override for includeInWage (undefined = use calculated value)
  manualDivisorDays?: number; // Override for divisorDays (undefined = use original jakaja)
  manualSubsidyType?: SubsidyRule; // Override for subsidy rule per period (undefined = use global rule)
  isZeroedOut?: boolean; // Flag for zeroed out periods (TOE = 0, divisorDays = 0, includeInToe = false, includeInWage = false)
}


