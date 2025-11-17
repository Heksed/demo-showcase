import type { PaidBenefitPeriod } from "../benefitpayments/types";
import type { IncomeRow } from "../allocateincome/types";

// Uusi tulotieto tulorekisteristä (simulaatio)
export type NewIncomeDataFromRegister = {
  id: string;
  receivedDate: string; // milloin saatu tulorekisteristä
  incomeRows: IncomeRow[]; // uudet/muutetut tulorivit
  affectedPeriodIds: string[]; // mitkä maksujaksot vaikuttuvat
  description: string; // kuvaus muutoksesta
};

// Päiväkohtaiset erot
export type DailyDifference = {
  date: string;
  originalDaily: number;
  correctedDaily: number;
  difference: number; // negatiivinen = takaisinperintä
};

// Jaksokohtaiset erot
export type PeriodDifference = {
  periodId: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  
  // Maksutiedot
  originalGross: number;
  correctedGross: number;
  grossDifference: number; // negatiivinen = takaisinperintä
  
  originalNet: number;
  correctedNet: number;
  netDifference: number;
  
  // Päiväkohtaiset erot
  dailyDifferences: DailyDifference[];
};

// Korjausanalyysi
export type CorrectionAnalysis = {
  id: string;
  createdAt: string;
  triggerEvent: NewIncomeDataFromRegister;
  
  // Vertailutiedot
  originalPeriods: PaidBenefitPeriod[];
  correctedPeriods: PaidBenefitPeriod[]; // laskettu uusilla tiedoilla
  
  // Erot jaksokohtaisesti
  periodDifferences: PeriodDifference[];
  
  // Yhteenvedot
  totalRecoveryGross: number;
  totalRecoveryNet: number;
  affectedPeriodsCount: number;
  
  status: "pending" | "approved" | "rejected";
};

