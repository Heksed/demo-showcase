import type { CorrectionAnalysis, PeriodDifference } from "../correctionanalysis/types";

// Päiväkohtainen erittely korjausasiassa
export type DailyBreakdown = {
  date: string;
  dailyAllowance: number; // maksettu
  correctedDaily: number; // oikea määrä
  difference: number; // erotus (negatiivinen = takaisinperintä)
  paid: number; // maksettu summa
  corrected: number; // oikea summa
};

// Takaisinperintätiedot jaksoittain
export type RecoveryAmount = {
  periodId: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  gross: number;
  net: number;
  
  // Päiväkohtainen erittely
  dailyBreakdown: DailyBreakdown[];
};

// Korjausasia
export type CorrectionCase = {
  id: string;
  caseNumber: string; // esim. "KOR-2025-001"
  createdAt: string;
  analysisId: string;
  
  // Takaisinperintätiedot
  recoveryAmounts: RecoveryAmount[];
  
  totalRecoveryGross: number;
  totalRecoveryNet: number;
  
  // Prosessin vaiheet
  status: "draft" | "hearing_letter_sent" | "waiting_response" | "recovery_initiated" | "completed";
  
  // Kuulemiskirjeen tiedot (linkitetty modular formsiin)
  hearingLetter?: {
    documentId: string; // modular forms -dokumentti
    sentDate?: string;
    recipient: string;
  };
  
  // Muut tiedot
  notes?: string;
};

