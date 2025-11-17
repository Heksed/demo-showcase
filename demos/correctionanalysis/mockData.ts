import type { NewIncomeDataFromRegister, CorrectionAnalysis, PaidBenefitPeriod } from "./types";
import { MOCK_PAID_PERIODS } from "../benefitpayments/mockData";
import type { IncomeRow } from "../allocateincome/types";

// Mock uusi tulotieto tulorekisteristä
// Simuloitu tilanne: Joulukuussa 2025 oli suurempi palkka kuin alun perin ilmoitettiin
// Suurempi palkka = suurempi tulosovittelu = pienempi päiväraha = maksettiin liikaa = takaisinperintä
// HUOM: Koko korjausanalyysi lasketaan oikeilla tuloilla, tämä on vain esimerkkitieto
// Oikeassa järjestelmässä nämä tieto tulevat PaymentHistory-sivulta kun klikataan "Hae uusi tulotieto"
// Alkuperäinen brutto maksutaulukossa: 1759,41
export const MOCK_NEW_INCOME_DATA: NewIncomeDataFromRegister = {
  id: "new-income-001",
  receivedDate: new Date().toISOString(),
  incomeRows: [
    {
      id: "new-1",
      maksupaiva: "10.12.2025",
      tulolaji: "Aikapalkka",
      palkka: 2900, // UUSI suurempi summa (ennen oli 2100)
      alkuperainenTulo: 2900,
      ansaintaAika: "1.12.2025 - 31.12.2025",
      tyonantaja: "Posti Oyj",
    },
  ],
  affectedPeriodIds: ["paid-2025-12"], // Joulukuu vaikuttuu
  description: "Posti Oyj:n palkan korjaus tulorekisteristä. Joulukuun palkka oli suurempi kuin alun perin ilmoitettiin (2900 € vs. 2100 €). Suurempi tulo vähentää päivärahaa, joten maksettiin liikaa ja vaaditaan takaisinperintää. Alkuperäinen brutto: 1759,41 €.",
};

// Mock korjausanalyysi (tämä laskettaisiin oikeasti utility-funktiolla)
// Tässä vain esimerkki-rakenteella
export const MOCK_CORRECTION_ANALYSIS: CorrectionAnalysis = {
  id: "analysis-001",
  createdAt: new Date().toISOString(),
  triggerEvent: MOCK_NEW_INCOME_DATA,
  originalPeriods: MOCK_PAID_PERIODS.filter(p => 
    MOCK_NEW_INCOME_DATA.affectedPeriodIds.includes(p.id)
  ),
  correctedPeriods: [], // Tämä täyttyisi laskennan tuloksella
  periodDifferences: [
    {
      periodId: "paid-2025-11",
      periodLabel: "2025 Marraskuu",
      periodStart: "2025-11-01",
      periodEnd: "2025-11-30",
      originalGross: 970.20,
      correctedGross: 850.00, // Pienempi koska suurempi tulo vähentää etuutta
      grossDifference: -120.20, // Takaisinperintä
      originalNet: 727.65,
      correctedNet: 637.50,
      netDifference: -90.15,
      dailyDifferences: [], // Täyttyisi päiväkohtaisella laskennalla
    },
    {
      periodId: "paid-2025-12",
      periodLabel: "2025 Joulukuu",
      periodStart: "2025-12-01",
      periodEnd: "2025-12-31",
      originalGross: 1001.00,
      correctedGross: 880.00,
      grossDifference: -121.00,
      originalNet: 751.25,
      correctedNet: 660.00,
      netDifference: -91.25,
      dailyDifferences: [],
    },
  ],
  totalRecoveryGross: 241.20,
  totalRecoveryNet: 181.40,
  affectedPeriodsCount: 2,
  status: "pending",
};

