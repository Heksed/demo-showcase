import type { IncomeRow } from "../allocateincome/types";

// Maksettu etuusjakso (yhdistää päivärahalaskurin ja allocate income -tiedot)
export type PaidBenefitPeriod = {
  id: string;
  
  // Jakson tiedot
  periodStart: string; // ISO date
  periodEnd: string; // ISO date
  businessDays: number;
  
  // Maksutiedot
  dailyAllowance: number; // €/day (soviteltu)
  gross: number; // maksettu brutto
  net: number; // maksettu netto
  taxPct: number;
  memberFeePct: number;
  
  // Laskentatiedot
  baseSalary: number; // käytetty perustepalkka
  incomeData: IncomeRow[]; // mitä tuloja oli laskennassa
  priorPaidDays: number; // kumulatiiviset päivät ennen tätä jaksoa
  stepFactor: number; // käytetty porrastuskerroin
  
  // TOE-tiedot (yhdistetty allocate income -sivulta)
  toeMonths: number; // TOE-kuukaudet
  toeSalary: number; // TOE-palkka (jakaja)
  toeFulfillmentDate: string; // TOE täyttymispäivä
  
  // Maksutiedot
  paidDate: string; // milloin maksettiin
  paymentReference: string; // maksuviite
  
  // Linkit muihin tietoihin
  sourceAllocationPeriods: string[]; // allocate income -jakson ID:t
  sourceCalculationSnapshot: {
    calcDate: string;
    period: string;
    benefitType: string;
    maxDays: number;
    priorPaidDays: number;
    // ... muut relevantit tiedot päivärahalaskurista
  };
};

// Päiväkohtainen maksurivi (kuvan mukainen)
// Niputettu jakso: jos peräkkäisiä päiviä joissa maksetut päivät > 0 tai = 0
export type DailyPaymentRow = {
  id: string;
  periodStart: string; // ISO date - jakson alkupäivä
  periodEnd: string; // ISO date - jakson loppupäivä
  note?: string; // Huom-kenttä
  dailyAllowance: number; // €/päivä (keskiarvo tai pääpäivän määrä)
  paidDays: number; // Maksetut päivät yhteensä jaksolla
  totalDays: number; // Yhteensä päiviä jaksolla (mukaan lukien viikonloput)
  decisionValidFrom: string; // Päätöksen voimassaolo alkaa
  decisionValidTo?: string; // Päätöksen voimassaolo päättyy
  decisionType: string; // Päätös ja selite (esim. "Myöntöpäätös + kulukorvaus (M000+kk)", "Ei maksua", "Porrastus 20% (M000)")
  expenseCompensation: number; // Kulukorvaus yhteensä jaksolla
  // Päivärahan laskennan tiedot (keskiarvo tai pääpäivän tiedot)
  basePart: number;
  earningsPart: number;
  stepFactor: number;
  stepLabel?: string; // esim. "Porrastus 20%"
  taxWithholding: number; // Ennakonpidätys yhteensä jaksolla
  memberFee: number; // Jäsenmaksu yhteensä jaksolla
  gross: number; // Brutto yhteensä jaksolla
  net: number; // Netto yhteensä jaksolla
};

// Yhteenveto
export type PaymentSummary = {
  totalGross: number;
  totalTaxWithholding: number;
  totalPaidDays: number;
  totalExpenseCompensation: number;
  expenseCompensationDays: number;
  totalRecoveries: number; // Perinnät
  totalPayable: number; // Maksetaan (netto + kulukorvaus - perinnät)
};

// Maksutaulukon rakenne
export type PaymentHistoryTable = {
  periods: PaidBenefitPeriod[];
  totalPaid: number;
  totalGross: number;
  totalNet: number;
};

