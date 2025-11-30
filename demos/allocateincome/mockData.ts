import type { IncomeRow, MonthPeriod } from "./types";

export const MOCK_EMPLOYMENT = {
  startDate: "1.10.2024",
  endDate: "31.12.2024",
  employer: "Nokia Oyj",
};

export const MOCK_EMPLOYMENT_RELATIONSHIPS = [
  { id: "emp-1", employer: "Espoon kaupunki", description: "XXXXX", startDate: "15.10.2024", endDate: "11.11.2024" },
  { id: "emp-2", employer: "Espoon kaupunki", description: "XXXXXXX", startDate: "PP.KK.VVVV", endDate: "PP.KK.VVVV" },
  { id: "emp-3", employer: "Espoon kaupunki", description: "XXXXX", startDate: "PP.KK.VVVV", endDate: "PP.KK.VVVV" },
  { id: "emp-4", employer: "Espoon kaupunki", description: "XXXXXXX", startDate: "PP.KK.VVVV", endDate: "PP.KK.VVVV" },
  { id: "emp-5", employer: "Espoon kaupunki", description: "XXXXX", startDate: "PP.KK.VVVV", endDate: "PP.KK.VVVV" },
  { id: "emp-6", employer: "Espoon kaupunki", description: "XXXXXX", startDate: "PP.KK.VVVV", endDate: "PP.KK.VVVV" },
];

export const MOCK_INCOME_ROWS: IncomeRow[] = [
  { id: "1-1", maksupaiva: "8.1.2026", tulolaji: "Aikapalkka", palkka: 2200, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Espoon kaupunki" },
  { id: "1-2", maksupaiva: "8.1.2026", tulolaji: "Lomaraha", palkka: 800, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Espoon kaupunki" },
  { id: "1-3", maksupaiva: "8.1.2026", tulolaji: "Tulospalkka", palkka: 0, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Espoon kaupunki" },
  { id: "1-5", maksupaiva: "8.1.2026", tulolaji: "Jokin etuus", palkka: 100, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Espoon kaupunki" },
  { id: "1-6", maksupaiva: "15.1.2026", tulolaji: "Aikapalkka", palkka: 200, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Espoon kaupunki" },
  { id: "1-7", maksupaiva: "15.1.2026", tulolaji: "Lomaraha", palkka: 500, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Espoon kaupunki" },
  { id: "1-9", maksupaiva: "8.1.2026", tulolaji: "Kokouspalkkio", palkka: 500, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Espoon kaupunki" },
  { id: "1-10", maksupaiva: "8.1.2026", tulolaji: "Luentopalkkio", palkka: 150, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Espoon kaupunki" },
];

export const MOCK_ROWS_2025_12: IncomeRow[] = [
  { id: "12-1", maksupaiva: "10.12.2025", tulolaji: "Aikapalkka", palkka: 2100, alkuperainenTulo: 0, ansaintaAika: "1.12.2025 - 31.12.2025", tyonantaja: "Posti Oyj" },
  { id: "12-2", maksupaiva: "10.12.2025", tulolaji: "Lomaraha", palkka: 600, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" },
  { id: "12-3", maksupaiva: "15.12.2025", tulolaji: "Tulospalkka", palkka: 280, alkuperainenTulo: 0, ansaintaAika: "1.12.2025 - 31.12.2025", tyonantaja: "Posti Oyj" },
  { id: "12-4", maksupaiva: "20.12.2025", tulolaji: "Työkorvaus", palkka: 140, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" },
  { id: "12-5", maksupaiva: "25.12.2025", tulolaji: "Kokouspalkkio", palkka: 180, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" },
  { id: "12-6", maksupaiva: "30.12.2025", tulolaji: "Luentopalkkio", palkka: 230, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" },
  { id: "12-7", maksupaiva: "31.12.2025", tulolaji: "Tulospalkkio", palkka: 1500, alkuperainenTulo: 1500, ansaintaAika: "1.1.2025 - 31.12.2025", tyonantaja: "Posti Oyj" },
];

export const MOCK_ROWS_2025_11: IncomeRow[] = [
  { id: "11-1", maksupaiva: "10.11.2025", tulolaji: "Aikapalkka", palkka: 2000, alkuperainenTulo: 0, ansaintaAika: "1.11.2025 - 30.11.2025", tyonantaja: "Posti Oyj" },
  { id: "11-2", maksupaiva: "10.11.2025", tulolaji: "Lomaraha", palkka: 500, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" },
  { id: "11-3", maksupaiva: "15.11.2025", tulolaji: "Tulospalkka", palkka: 300, alkuperainenTulo: 0, ansaintaAika: "1.11.2025 - 30.11.2025", tyonantaja: "Posti Oyj" },
  { id: "11-4", maksupaiva: "20.11.2025", tulolaji: "Työkorvaus", palkka: 200, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" },
  { id: "11-5", maksupaiva: "25.11.2025", tulolaji: "Kokouspalkkio", palkka: 100, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" },
];

export const MOCK_ROWS_2025_03: IncomeRow[] = [
  { id: "03-1", maksupaiva: "10.3.2025", tulolaji: "Aikapalkka", palkka: 1800, alkuperainenTulo: 0, ansaintaAika: "1.3.2025 - 31.3.2025", tyonantaja: "Posti Oyj" },
];

export const MOCK_ROWS_2025_02: IncomeRow[] = [
  { id: "02-1", maksupaiva: "10.2.2025", tulolaji: "Aikapalkka", palkka: 1900, alkuperainenTulo: 0, ansaintaAika: "1.2.2025 - 28.2.2025", tyonantaja: "Posti Oyj" },
];

export const MOCK_ROWS_2025_01: IncomeRow[] = [
  { id: "01-1", maksupaiva: "10.1.2025", tulolaji: "Aikapalkka", palkka: 2050, alkuperainenTulo: 0, ansaintaAika: "1.1.2025 - 31.1.2025", tyonantaja: "Posti Oyj" },
  { id: "01-2", maksupaiva: "10.1.2025", tulolaji: "Lomaraha", palkka: 400, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" },
];

export const MOCK_PERIODS: MonthPeriod[] = [
  // 2025 kuukaudet 09–12 (lisätty)
  {
    id: "2025-12",
    ajanjakso: "2025 Joulukuu",
    toe: 0.0,
    jakaja: 21.5,
    palkka: 900,
    tyonantajat: "Posti Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "12-1", maksupaiva: "10.12.2025", tulolaji: "Aikapalkka", palkka: 800, alkuperainenTulo: 0, ansaintaAika: "1.12.2025 - 31.12.2025", tyonantaja: "Posti Oyj" },
      { id: "12-2", maksupaiva: "10.12.2025", tulolaji: "Lomaraha", palkka: 100, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" }
    ]
  },
  {
    id: "2025-11",
    ajanjakso: "2025 Marraskuu",
    toe: 0.5,
    jakaja: 21.5,
    palkka: 1500, // Normaalityö (800) + palkkatuettu työ (700)
    tyonantajat: "Posti Oyj, Nokia Oyj",
    pidennettavatJaksot: 0,
    rows: [
      // Normaalityö (Posti Oyj)
      { id: "11-1", maksupaiva: "10.11.2025", tulolaji: "Aikapalkka", palkka: 700, alkuperainenTulo: 0, ansaintaAika: "1.11.2025 - 30.11.2025", tyonantaja: "Posti Oyj" },
      { id: "11-2", maksupaiva: "10.11.2025", tulolaji: "Lomaraha", palkka: 100, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" },
      // Palkkatuettu työ (Nokia Oyj)
      { id: "11-3", maksupaiva: "20.11.2025", tulolaji: "Aikapalkka", palkka: 700, alkuperainenTulo: 0, ansaintaAika: "1.11.2025 - 30.11.2025", tyonantaja: "Nokia Oyj", isSubsidized: true }
    ]
  },
  {
    id: "2025-10",
    ajanjakso: "2025 Lokakuu",
    toe: 0.5,
    jakaja: 21.5,
    palkka: 1300, // Normaalityö (600) + palkkatuettu työ (700)
    tyonantajat: "Posti Oyj, Nokia Oyj",
    pidennettavatJaksot: 0,
    rows: [
      // Normaalityö (Posti Oyj)
      { id: "10-1", maksupaiva: "10.10.2025", tulolaji: "Aikapalkka", palkka: 500, alkuperainenTulo: 0, ansaintaAika: "1.10.2025 - 31.10.2025", tyonantaja: "Posti Oyj" },
      { id: "10-2", maksupaiva: "10.10.2025", tulolaji: "Lomaraha", palkka: 100, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" },
      // Palkkatuettu työ (Nokia Oyj)
      { id: "10-3", maksupaiva: "20.10.2025", tulolaji: "Aikapalkka", palkka: 700, alkuperainenTulo: 0, ansaintaAika: "1.10.2025 - 31.10.2025", tyonantaja: "Nokia Oyj", isSubsidized: true }
    ]
  },
  {
    id: "2025-09",
    ajanjakso: "2025 Syyskuu",
    toe: 0.5,
    jakaja: 21.5,
    palkka: 1200, // Normaalityö (500) + palkkatuettu työ (700)
    tyonantajat: "Posti Oyj, Nokia Oyj",
    pidennettavatJaksot: 0,
    rows: [
      // Normaalityö (Posti Oyj)
      { id: "09-1", maksupaiva: "10.9.2025", tulolaji: "Aikapalkka", palkka: 500, alkuperainenTulo: 0, ansaintaAika: "1.9.2025 - 30.9.2025", tyonantaja: "Posti Oyj" },
      // Palkkatuettu työ (Nokia Oyj)
      { id: "09-2", maksupaiva: "20.9.2025", tulolaji: "Aikapalkka", palkka: 700, alkuperainenTulo: 0, ansaintaAika: "1.9.2025 - 30.9.2025", tyonantaja: "Nokia Oyj", isSubsidized: true }
    ]
  },
  {
    id: "2025-08",
    ajanjakso: "2025 Elokuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 1600, // Normaalityö (900) + palkkatuettu työ (700)
    tyonantajat: "Posti Oyj, Nokia Oyj",
    pidennettavatJaksot: 0,
    rows: [
      // Normaalityö (Posti Oyj)
      { id: "8-1", maksupaiva: "10.8.2025", tulolaji: "Aikapalkka", palkka: 800, alkuperainenTulo: 0, ansaintaAika: "1.8.2025 - 31.8.2025", tyonantaja: "Posti Oyj" },
      { id: "8-2", maksupaiva: "10.8.2025", tulolaji: "Lomaraha", palkka: 100, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" },
      // Palkkatuettu työ (Nokia Oyj)
      { id: "8-3", maksupaiva: "20.8.2025", tulolaji: "Aikapalkka", palkka: 600, alkuperainenTulo: 0, ansaintaAika: "1.8.2025 - 31.8.2025", tyonantaja: "Nokia Oyj", isSubsidized: true },
      { id: "8-4", maksupaiva: "20.8.2025", tulolaji: "Lomaraha", palkka: 100, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj", isSubsidized: true }
    ]
  },
  {
    id: "2025-07",
    ajanjakso: "2025 Heinäkuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 1500, // Normaalityö (800) + palkkatuettu työ (700)
    tyonantajat: "Posti Oyj, Nokia Oyj",
    pidennettavatJaksot: 0,
    rows: [
      // Normaalityö (Posti Oyj)
      { id: "7-1", maksupaiva: "10.7.2025", tulolaji: "Aikapalkka", palkka: 700, alkuperainenTulo: 0, ansaintaAika: "1.7.2025 - 31.7.2025", tyonantaja: "Posti Oyj" },
      { id: "7-2", maksupaiva: "10.7.2025", tulolaji: "Lomaraha", palkka: 100, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" },
      // Palkkatuettu työ (Nokia Oyj)
      { id: "7-3", maksupaiva: "20.7.2025", tulolaji: "Aikapalkka", palkka: 600, alkuperainenTulo: 0, ansaintaAika: "1.7.2025 - 31.7.2025", tyonantaja: "Nokia Oyj", isSubsidized: true },
      { id: "7-4", maksupaiva: "20.7.2025", tulolaji: "Lomaraha", palkka: 100, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj", isSubsidized: true }
    ]
  },
  {
    id: "2025-06",
    ajanjakso: "2025 Kesäkuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 1400, // Normaalityö (800) + palkkatuettu työ (600)
    tyonantajat: "Posti Oyj, Nokia Oyj",
    pidennettavatJaksot: 0,
    rows: [
      // Normaalityö (Posti Oyj)
      { id: "6-1", maksupaiva: "10.6.2025", tulolaji: "Aikapalkka", palkka: 700, alkuperainenTulo: 0, ansaintaAika: "1.6.2025 - 30.6.2025", tyonantaja: "Posti Oyj" },
      { id: "6-2", maksupaiva: "10.6.2025", tulolaji: "Lomaraha", palkka: 100, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" },
      // Palkkatuettu työ (Nokia Oyj)
      { id: "6-3", maksupaiva: "20.6.2025", tulolaji: "Aikapalkka", palkka: 500, alkuperainenTulo: 0, ansaintaAika: "1.6.2025 - 30.6.2025", tyonantaja: "Nokia Oyj", isSubsidized: true },
      { id: "6-4", maksupaiva: "20.6.2025", tulolaji: "Lomaraha", palkka: 100, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj", isSubsidized: true }
    ]
  },
  {
    id: "2025-05",
    ajanjakso: "2025 Toukokuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 600,
    tyonantajat: "Nokia Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "5-1", maksupaiva: "10.5.2025", tulolaji: "Aikapalkka", palkka: 500, alkuperainenTulo: 0, ansaintaAika: "1.5.2025 - 31.5.2025", tyonantaja: "Nokia Oyj", isSubsidized: true },
      { id: "5-2", maksupaiva: "10.5.2025", tulolaji: "Lomaraha", palkka: 100, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj", isSubsidized: true }
    ]
  },
  {
    id: "2025-04",
    ajanjakso: "2025 Huhtikuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 650,
    tyonantajat: "Nokia Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "4-1", maksupaiva: "10.4.2025", tulolaji: "Aikapalkka", palkka: 550, alkuperainenTulo: 0, ansaintaAika: "1.4.2025 - 30.4.2025", tyonantaja: "Nokia Oyj", isSubsidized: true },
      { id: "4-2", maksupaiva: "10.4.2025", tulolaji: "Lomaraha", palkka: 100, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj", isSubsidized: true }
    ]
  },
  {
    id: "2025-03",
    ajanjakso: "2025 Maaliskuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 700,
    tyonantajat: "Nokia Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "3-1", maksupaiva: "10.3.2025", tulolaji: "Aikapalkka", palkka: 600, alkuperainenTulo: 0, ansaintaAika: "1.3.2025 - 31.3.2025", tyonantaja: "Nokia Oyj", isSubsidized: true },
      { id: "3-2", maksupaiva: "10.3.2025", tulolaji: "Lomaraha", palkka: 100, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj", isSubsidized: true }
    ]
  },
  {
    id: "2025-02",
    ajanjakso: "2025 Helmikuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 650,
    tyonantajat: "Nokia Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "2-1", maksupaiva: "10.2.2025", tulolaji: "Aikapalkka", palkka: 550, alkuperainenTulo: 0, ansaintaAika: "1.2.2025 - 28.2.2025", tyonantaja: "Nokia Oyj", isSubsidized: true },
      { id: "2-2", maksupaiva: "10.2.2025", tulolaji: "Lomaraha", palkka: 100, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj", isSubsidized: true }
    ]
  },
  {
    id: "2025-01",
    ajanjakso: "2025 Tammikuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 600,
    tyonantajat: "Nokia Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "1-1", maksupaiva: "10.1.2025", tulolaji: "Aikapalkka", palkka: 500, alkuperainenTulo: 0, ansaintaAika: "1.1.2025 - 31.1.2025", tyonantaja: "Nokia Oyj", isSubsidized: true },
      { id: "1-2", maksupaiva: "10.1.2025", tulolaji: "Lomaraha", palkka: 100, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj", isSubsidized: true }
    ]
  },
  {
    id: "2024-12",
    ajanjakso: "2024 Joulukuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 3300, // Normaalityö (2300) + palkkatuettu työ (1000)
    tyonantajat: "Posti Oyj, Nokia Oyj",
    pidennettavatJaksot: 0,
    rows: [
      // Normaalityö (Posti Oyj) - vähennetty 500e
      { id: "2024-12-1", maksupaiva: "10.12.2024", tulolaji: "Aikapalkka", palkka: 2300, alkuperainenTulo: 0, ansaintaAika: "1.12.2024 - 31.12.2024", tyonantaja: "Posti Oyj" },
      { id: "2024-12-2", maksupaiva: "10.12.2024", tulolaji: "Lomaraha", palkka: 500, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" },
      // Palkkatuettu työ (Nokia Oyj) - lisätty 1000e
      { id: "2024-12-3", maksupaiva: "20.12.2024", tulolaji: "Aikapalkka", palkka: 800, alkuperainenTulo: 0, ansaintaAika: "1.12.2024 - 31.12.2024", tyonantaja: "Nokia Oyj", isSubsidized: true },
      { id: "2024-12-4", maksupaiva: "20.12.2024", tulolaji: "Lomaraha", palkka: 200, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj", isSubsidized: true }
    ]
  },
  {
    id: "2024-11",
    ajanjakso: "2024 Marraskuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 3200, // Normaalityö (2200) + palkkatuettu työ (1000)
    tyonantajat: "Posti Oyj, Nokia Oyj",
    pidennettavatJaksot: 0,
    rows: [
      // Normaalityö (Posti Oyj) - vähennetty 500e
      { id: "2024-11-1", maksupaiva: "10.11.2024", tulolaji: "Aikapalkka", palkka: 2200, alkuperainenTulo: 0, ansaintaAika: "1.11.2024 - 30.11.2024", tyonantaja: "Posti Oyj" },
      { id: "2024-11-2", maksupaiva: "10.11.2024", tulolaji: "Lomaraha", palkka: 500, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" },
      // Palkkatuettu työ (Nokia Oyj) - lisätty 1000e
      { id: "2024-11-3", maksupaiva: "20.11.2024", tulolaji: "Aikapalkka", palkka: 800, alkuperainenTulo: 0, ansaintaAika: "1.11.2024 - 30.11.2024", tyonantaja: "Nokia Oyj", isSubsidized: true },
      { id: "2024-11-4", maksupaiva: "20.11.2024", tulolaji: "Lomaraha", palkka: 200, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj", isSubsidized: true }
    ]
  },
  {
    id: "2024-10",
    ajanjakso: "2024 Lokakuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 3100,
    tyonantajat: "Nokia Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "2024-10-1", maksupaiva: "10.10.2024", tulolaji: "Aikapalkka", palkka: 2600, alkuperainenTulo: 0, ansaintaAika: "1.10.2024 - 31.10.2024", tyonantaja: "Nokia Oyj", isSubsidized: true },
      { id: "2024-10-2", maksupaiva: "10.10.2024", tulolaji: "Lomaraha", palkka: 500, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj", isSubsidized: true }
    ]
  },
  {
    id: "2024-09",
    ajanjakso: "2024 Syyskuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 3000,
    tyonantajat: "Nokia Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "2024-09-1", maksupaiva: "10.9.2024", tulolaji: "Aikapalkka", palkka: 2500, alkuperainenTulo: 0, ansaintaAika: "1.9.2024 - 30.9.2024", tyonantaja: "Nokia Oyj", isSubsidized: true },
      { id: "2024-09-2", maksupaiva: "10.9.2024", tulolaji: "Lomaraha", palkka: 500, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj", isSubsidized: true }
    ]
  },
  {
    id: "2024-08",
    ajanjakso: "2024 Elokuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 2900, // Normaalityö (1900) + palkkatuettu työ (1000)
    tyonantajat: "Posti Oyj, Nokia Oyj",
    pidennettavatJaksot: 0,
    rows: [
      // Normaalityö (Posti Oyj) - vähennetty 500e
      { id: "2024-08-1", maksupaiva: "10.8.2024", tulolaji: "Aikapalkka", palkka: 1900, alkuperainenTulo: 0, ansaintaAika: "1.8.2024 - 31.8.2024", tyonantaja: "Posti Oyj" },
      { id: "2024-08-2", maksupaiva: "10.8.2024", tulolaji: "Lomaraha", palkka: 500, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" },
      // Palkkatuettu työ (Nokia Oyj) - lisätty 1000e
      { id: "2024-08-3", maksupaiva: "20.8.2024", tulolaji: "Aikapalkka", palkka: 800, alkuperainenTulo: 0, ansaintaAika: "1.8.2024 - 31.8.2024", tyonantaja: "Nokia Oyj", isSubsidized: true },
      { id: "2024-08-4", maksupaiva: "20.8.2024", tulolaji: "Lomaraha", palkka: 200, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj", isSubsidized: true }
    ],
    viikkoTOERows: [] // Säilytetään tyhjä, koska viikkoTOE-näkymä käyttää tätä
  },
  {
    id: "2024-07",
    ajanjakso: "2024 Heinäkuu",
    toe: 0.5,
    jakaja: 21.5,
    palkka: 750,
    tyonantajat: "Posti Oyj, Osa-aikatyö Oy",
    pidennettavatJaksot: 0,
    rows: [
      { id: "2024-07-1", maksupaiva: "10.7.2024", tulolaji: "Aikapalkka", palkka: 750, alkuperainenTulo: 0, ansaintaAika: "1.7.2024 - 31.7.2024", tyonantaja: "Posti Oyj" }
    ],
    viikkoTOERows: [
      {
        id: "v2024-07-1",
        alkupäivä: "1.7.2024",
        loppupäivä: "31.8.2024",
        työnantaja: "Osa-aikatyö Oy",
        selite: "Jakso 2 (1.7-31.8)",
        palkka: 5000,
        toeViikot: 9,
        jakaja: 45,
        toeTunnit: 162,
        tunnitYhteensä: 180
      }
    ]
  },
  {
    id: "2024-06",
    ajanjakso: "2024 Kesäkuu",
    toe: 0.5,
    jakaja: 21.5,
    palkka: 600,
    tyonantajat: "Posti Oyj, Osa-aikatyö Oy",
    pidennettavatJaksot: 0,
    rows: [
      { id: "2024-06-1", maksupaiva: "10.6.2024", tulolaji: "Aikapalkka", palkka: 600, alkuperainenTulo: 0, ansaintaAika: "1.6.2024 - 30.6.2024", tyonantaja: "Posti Oyj" }
    ],
    viikkoTOERows: [
      {
        id: "v2024-06-1",
        alkupäivä: "5.5.2024",
        loppupäivä: "30.6.2024",
        työnantaja: "Osa-aikatyö Oy",
        selite: "Jakso 1 (5.5-30.6)",
        palkka: 4000,
        toeViikot: 8,
        jakaja: 40,
        toeTunnit: 144,
        tunnitYhteensä: 160
      }
    ]
  },
  {
    id: "2024-05",
    ajanjakso: "2024 Toukokuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 2400, // Normaalityö (1900 + 500)
    tyonantajat: "Posti Oyj",
    pidennettavatJaksot: 0,
    rows: [
      // Normaalityö (Posti Oyj) - vähennetty 500e
      { id: "2024-05-1", maksupaiva: "10.5.2024", tulolaji: "Aikapalkka", palkka: 1900, alkuperainenTulo: 0, ansaintaAika: "1.5.2024 - 31.5.2024", tyonantaja: "Posti Oyj" },
      { id: "2024-05-2", maksupaiva: "10.5.2024", tulolaji: "Lomaraha", palkka: 500, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" }
    ],
    viikkoTOERows: [] // Säilytetään tyhjä, koska viikkoTOE-näkymä käyttää tätä
  },
  {
    id: "2024-04",
    ajanjakso: "2024 Huhtikuu",
    toe: 0.5,
    jakaja: 21.5,
    palkka: 650,
    tyonantajat: "Posti Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "2024-04-1", maksupaiva: "10.4.2024", tulolaji: "Aikapalkka", palkka: 650, alkuperainenTulo: 0, ansaintaAika: "1.4.2024 - 30.4.2024", tyonantaja: "Posti Oyj" }
    ]
  },
  {
    id: "2024-03",
    ajanjakso: "2024 Maaliskuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 2700,
    tyonantajat: "Posti Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "2024-03-1", maksupaiva: "10.3.2024", tulolaji: "Aikapalkka", palkka: 2200, alkuperainenTulo: 0, ansaintaAika: "1.3.2024 - 31.3.2024", tyonantaja: "Posti Oyj" },
      { id: "2024-03-2", maksupaiva: "10.3.2024", tulolaji: "Lomaraha", palkka: 500, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" }
    ]
  },
  {
    id: "2024-02",
    ajanjakso: "2024 Helmikuu",
    toe: 0.5,
    jakaja: 21.5,
    palkka: 700,
    tyonantajat: "Posti Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "2024-02-1", maksupaiva: "10.2.2024", tulolaji: "Aikapalkka", palkka: 700, alkuperainenTulo: 0, ansaintaAika: "1.2.2024 - 28.2.2024", tyonantaja: "Posti Oyj" }
    ]
  },
  {
    id: "2024-01",
    ajanjakso: "2024 Tammikuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 2500,
    tyonantajat: "Posti Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "2024-01-1", maksupaiva: "10.1.2024", tulolaji: "Aikapalkka", palkka: 2000, alkuperainenTulo: 0, ansaintaAika: "1.1.2024 - 31.1.2024", tyonantaja: "Posti Oyj" },
      { id: "2024-01-2", maksupaiva: "10.1.2024", tulolaji: "Lomaraha", palkka: 500, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" }
    ]
  },
  // 2023 kuukaudet - 28kk taaksepäin mock dataa
  {
    id: "2023-12",
    ajanjakso: "2023 Joulukuu",
    toe: 0,
    jakaja: 0,
    palkka: 0,
    tyonantajat: "",
    pidennettavatJaksot: 0,
    rows: []
  },
  {
    id: "2023-11",
    ajanjakso: "2023 Marraskuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 3400,
    tyonantajat: "Posti Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "2023-11-1", maksupaiva: "10.11.2023", tulolaji: "Aikapalkka", palkka: 2900, alkuperainenTulo: 0, ansaintaAika: "1.11.2023 - 30.11.2023", tyonantaja: "Posti Oyj" },
      { id: "2023-11-2", maksupaiva: "10.11.2023", tulolaji: "Lomaraha", palkka: 500, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" }
    ]
  },
  {
    id: "2023-10",
    ajanjakso: "2023 Lokakuu",
    toe: 0,
    jakaja: 0,
    palkka: 0,
    tyonantajat: "",
    pidennettavatJaksot: 0,
    rows: []
  },
  {
    id: "2023-09",
    ajanjakso: "2023 Syyskuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 3200,
    tyonantajat: "Posti Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "2023-09-1", maksupaiva: "10.9.2023", tulolaji: "Aikapalkka", palkka: 2700, alkuperainenTulo: 0, ansaintaAika: "1.9.2023 - 30.9.2023", tyonantaja: "Posti Oyj" },
      { id: "2023-09-2", maksupaiva: "10.9.2023", tulolaji: "Lomaraha", palkka: 500, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" }
    ]
  },
  {
    id: "2023-08",
    ajanjakso: "2023 Elokuu",
    toe: 0,
    jakaja: 0,
    palkka: 0,
    tyonantajat: "",
    pidennettavatJaksot: 0,
    rows: []
  },
  {
    id: "2023-07",
    ajanjakso: "2023 Heinäkuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 3000,
    tyonantajat: "Posti Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "2023-07-1", maksupaiva: "10.7.2023", tulolaji: "Aikapalkka", palkka: 2500, alkuperainenTulo: 0, ansaintaAika: "1.7.2023 - 31.7.2023", tyonantaja: "Posti Oyj" },
      { id: "2023-07-2", maksupaiva: "10.7.2023", tulolaji: "Lomaraha", palkka: 500, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" }
    ]
  },
  {
    id: "2023-06",
    ajanjakso: "2023 Kesäkuu",
    toe: 0,
    jakaja: 0,
    palkka: 0,
    tyonantajat: "",
    pidennettavatJaksot: 0,
    rows: []
  },
  {
    id: "2023-05",
    ajanjakso: "2023 Toukokuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 2800,
    tyonantajat: "Posti Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "2023-05-1", maksupaiva: "10.5.2023", tulolaji: "Aikapalkka", palkka: 2300, alkuperainenTulo: 0, ansaintaAika: "1.5.2023 - 31.5.2023", tyonantaja: "Posti Oyj" },
      { id: "2023-05-2", maksupaiva: "10.5.2023", tulolaji: "Lomaraha", palkka: 500, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" }
    ]
  },
  {
    id: "2023-04",
    ajanjakso: "2023 Huhtikuu",
    toe: 0,
    jakaja: 0,
    palkka: 0,
    tyonantajat: "",
    pidennettavatJaksot: 0,
    rows: []
  },
  {
    id: "2023-03",
    ajanjakso: "2023 Maaliskuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 2600,
    tyonantajat: "Posti Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "2023-03-1", maksupaiva: "10.3.2023", tulolaji: "Aikapalkka", palkka: 2100, alkuperainenTulo: 0, ansaintaAika: "1.3.2023 - 31.3.2023", tyonantaja: "Posti Oyj" },
      { id: "2023-03-2", maksupaiva: "10.3.2023", tulolaji: "Lomaraha", palkka: 500, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" }
    ]
  },
  {
    id: "2023-02",
    ajanjakso: "2023 Helmikuu",
    toe: 0,
    jakaja: 0,
    palkka: 0,
    tyonantajat: "",
    pidennettavatJaksot: 0,
    rows: []
  },
  {
    id: "2023-01",
    ajanjakso: "2023 Tammikuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 2400,
    tyonantajat: "Posti Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "2023-01-1", maksupaiva: "10.1.2023", tulolaji: "Aikapalkka", palkka: 1900, alkuperainenTulo: 0, ansaintaAika: "1.1.2023 - 31.1.2023", tyonantaja: "Posti Oyj" },
      { id: "2023-01-2", maksupaiva: "10.1.2023", tulolaji: "Lomaraha", palkka: 500, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" }
    ]
  },
  // 2026 kuukaudet - tulevaisuuden mock dataa
  {
    id: "2026-12",
    ajanjakso: "2026 Joulukuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 3600,
    tyonantajat: "Nokia Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "2026-12-1", maksupaiva: "10.12.2026", tulolaji: "Aikapalkka", palkka: 3100, alkuperainenTulo: 0, ansaintaAika: "1.12.2026 - 31.12.2026", tyonantaja: "Nokia Oyj", isSubsidized: true },
      { id: "2026-12-2", maksupaiva: "10.12.2026", tulolaji: "Lomaraha", palkka: 500, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj", isSubsidized: true }
    ]
  },
  {
    id: "2026-11",
    ajanjakso: "2026 Marraskuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 3500,
    tyonantajat: "Posti Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "2026-11-1", maksupaiva: "10.11.2026", tulolaji: "Aikapalkka", palkka: 3000, alkuperainenTulo: 0, ansaintaAika: "1.11.2026 - 30.11.2026", tyonantaja: "Posti Oyj" },
      { id: "2026-11-2", maksupaiva: "10.11.2026", tulolaji: "Lomaraha", palkka: 500, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" }
    ]
  },
  {
    id: "2026-10",
    ajanjakso: "2026 Lokakuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 3400,
    tyonantajat: "Nokia Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "2026-10-1", maksupaiva: "10.10.2026", tulolaji: "Aikapalkka", palkka: 2900, alkuperainenTulo: 0, ansaintaAika: "1.10.2026 - 31.10.2026", tyonantaja: "Nokia Oyj", isSubsidized: true },
      { id: "2026-10-2", maksupaiva: "10.10.2026", tulolaji: "Lomaraha", palkka: 500, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj", isSubsidized: true }
    ]
  },
  {
    id: "2026-09",
    ajanjakso: "2026 Syyskuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 3300,
    tyonantajat: "Posti Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "2026-09-1", maksupaiva: "10.9.2026", tulolaji: "Aikapalkka", palkka: 2800, alkuperainenTulo: 0, ansaintaAika: "1.9.2026 - 30.9.2026", tyonantaja: "Posti Oyj" },
      { id: "2026-09-2", maksupaiva: "10.9.2026", tulolaji: "Lomaraha", palkka: 500, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" }
    ]
  },
  {
    id: "2026-08",
    ajanjakso: "2026 Elokuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 3200,
    tyonantajat: "Nokia Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "2026-08-1", maksupaiva: "10.8.2026", tulolaji: "Aikapalkka", palkka: 2700, alkuperainenTulo: 0, ansaintaAika: "1.8.2026 - 31.8.2026", tyonantaja: "Nokia Oyj", isSubsidized: true },
      { id: "2026-08-2", maksupaiva: "10.8.2026", tulolaji: "Lomaraha", palkka: 500, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj", isSubsidized: true }
    ]
  },
  {
    id: "2026-07",
    ajanjakso: "2026 Heinäkuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 3100,
    tyonantajat: "Posti Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "2026-07-1", maksupaiva: "10.7.2026", tulolaji: "Aikapalkka", palkka: 2600, alkuperainenTulo: 0, ansaintaAika: "1.7.2026 - 31.7.2026", tyonantaja: "Posti Oyj" },
      { id: "2026-07-2", maksupaiva: "10.7.2026", tulolaji: "Lomaraha", palkka: 500, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" }
    ]
  },
  {
    id: "2026-06",
    ajanjakso: "2026 Kesäkuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 3000,
    tyonantajat: "Nokia Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "2026-06-1", maksupaiva: "10.6.2026", tulolaji: "Aikapalkka", palkka: 2500, alkuperainenTulo: 0, ansaintaAika: "1.6.2026 - 30.6.2026", tyonantaja: "Nokia Oyj", isSubsidized: true },
      { id: "2026-06-2", maksupaiva: "10.6.2026", tulolaji: "Lomaraha", palkka: 500, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj", isSubsidized: true }
    ]
  },
  {
    id: "2026-05",
    ajanjakso: "2026 Toukokuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 2900,
    tyonantajat: "Posti Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "2026-05-1", maksupaiva: "10.5.2026", tulolaji: "Aikapalkka", palkka: 2400, alkuperainenTulo: 0, ansaintaAika: "1.5.2026 - 31.5.2026", tyonantaja: "Posti Oyj" },
      { id: "2026-05-2", maksupaiva: "10.5.2026", tulolaji: "Lomaraha", palkka: 500, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" }
    ]
  },
  {
    id: "2026-04",
    ajanjakso: "2026 Huhtikuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 2800,
    tyonantajat: "Nokia Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "2026-04-1", maksupaiva: "10.4.2026", tulolaji: "Aikapalkka", palkka: 2300, alkuperainenTulo: 0, ansaintaAika: "1.4.2026 - 30.4.2026", tyonantaja: "Nokia Oyj", isSubsidized: true },
      { id: "2026-04-2", maksupaiva: "10.4.2026", tulolaji: "Lomaraha", palkka: 500, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj", isSubsidized: true }
    ]
  },
  {
    id: "2026-03",
    ajanjakso: "2026 Maaliskuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 2700,
    tyonantajat: "Posti Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "2026-03-1", maksupaiva: "10.3.2026", tulolaji: "Aikapalkka", palkka: 2200, alkuperainenTulo: 0, ansaintaAika: "1.3.2026 - 31.3.2026", tyonantaja: "Posti Oyj" },
      { id: "2026-03-2", maksupaiva: "10.3.2026", tulolaji: "Lomaraha", palkka: 500, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" }
    ]
  },
  {
    id: "2026-02",
    ajanjakso: "2026 Helmikuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 2600,
    tyonantajat: "Nokia Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "2026-02-1", maksupaiva: "10.2.2026", tulolaji: "Aikapalkka", palkka: 2100, alkuperainenTulo: 0, ansaintaAika: "1.2.2026 - 28.2.2026", tyonantaja: "Nokia Oyj", isSubsidized: true },
      { id: "2026-02-2", maksupaiva: "10.2.2026", tulolaji: "Lomaraha", palkka: 500, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj", isSubsidized: true }
    ]
  },
  {
    id: "2026-01",
    ajanjakso: "2026 Tammikuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 2500,
    tyonantajat: "Posti Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "2026-01-1", maksupaiva: "10.1.2026", tulolaji: "Aikapalkka", palkka: 2000, alkuperainenTulo: 0, ansaintaAika: "1.1.2026 - 31.1.2026", tyonantaja: "Posti Oyj" },
      { id: "2026-01-2", maksupaiva: "10.1.2026", tulolaji: "Lomaraha", palkka: 500, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" }
    ]
  }
];


