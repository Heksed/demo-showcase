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
  { id: "1-8", maksupaiva: "15.1.2026", tulolaji: "Työkorvaus", palkka: 300, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Espoon kaupunki" },
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
    palkka: 0,
    tyonantajat: "Posti Oyj",
    pidennettavatJaksot: 0,
    rows: MOCK_ROWS_2025_12
  },
  {
    id: "2025-11",
    ajanjakso: "2025 Marraskuu",
    toe: 0.0,
    jakaja: 21.5,
    palkka: 0,
    tyonantajat: "Posti Oyj",
    pidennettavatJaksot: 0,
    rows: MOCK_ROWS_2025_11
  },
  {
    id: "2025-10",
    ajanjakso: "2025 Lokakuu",
    toe: 0.0,
    jakaja: 21.5,
    palkka: 0,
    tyonantajat: "Posti Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "10-1", maksupaiva: "10.10.2025", tulolaji: "Aikapalkka", palkka: 200, alkuperainenTulo: 0, ansaintaAika: "1.10.2025 - 31.10.2025", tyonantaja: "Posti Oyj" },
      { id: "10-2", maksupaiva: "10.10.2025", tulolaji: "Lomaraha", palkka: 100, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" }
    ]
  },
  {
    id: "2025-09",
    ajanjakso: "2025 Syyskuu",
    toe: 0.0,
    jakaja: 21.5,
    palkka: 0,
    tyonantajat: "Posti Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "09-1", maksupaiva: "10.9.2025", tulolaji: "Aikapalkka", palkka: 150, alkuperainenTulo: 0, ansaintaAika: "1.9.2025 - 30.9.2025", tyonantaja: "Posti Oyj" },
      { id: "09-2", maksupaiva: "15.9.2025", tulolaji: "Tulospalkka", palkka: 100, alkuperainenTulo: 0, ansaintaAika: "1.9.2025 - 30.9.2025", tyonantaja: "Posti Oyj" }
    ]
  },
  {
    id: "2025-08",
    ajanjakso: "2025 Elokuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 4000,
    tyonantajat: "Posti Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "8-1", maksupaiva: "10.8.2025", tulolaji: "Aikapalkka", palkka: 3200, alkuperainenTulo: 0, ansaintaAika: "1.8.2025 - 31.8.2025", tyonantaja: "Posti Oyj" },
      { id: "8-2", maksupaiva: "10.8.2025", tulolaji: "Lomaraha", palkka: 400, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" },
      { id: "8-3", maksupaiva: "15.8.2025", tulolaji: "Tulospalkka", palkka: 260, alkuperainenTulo: 0, ansaintaAika: "1.8.2025 - 31.8.2025", tyonantaja: "Posti Oyj" },
      { id: "8-4", maksupaiva: "20.8.2025", tulolaji: "Työkorvaus", palkka: 130, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" },
      { id: "8-5", maksupaiva: "25.8.2025", tulolaji: "Kokouspalkkio", palkka: 170, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" },
      { id: "8-6", maksupaiva: "30.8.2025", tulolaji: "Luentopalkkio", palkka: 220, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" }
    ]
  },
  {
    id: "2025-07",
    ajanjakso: "2025 Heinäkuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 3900,
    tyonantajat: "Posti Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "7-1", maksupaiva: "10.7.2025", tulolaji: "Aikapalkka", palkka: 3100, alkuperainenTulo: 0, ansaintaAika: "1.7.2025 - 31.7.2025", tyonantaja: "Posti Oyj" },
      { id: "7-2", maksupaiva: "10.7.2025", tulolaji: "Lomaraha", palkka: 400, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" },
      { id: "7-3", maksupaiva: "15.7.2025", tulolaji: "Tulospalkka", palkka: 240, alkuperainenTulo: 0, ansaintaAika: "1.7.2025 - 31.7.2025", tyonantaja: "Posti Oyj" },
      { id: "7-4", maksupaiva: "20.7.2025", tulolaji: "Työkorvaus", palkka: 120, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" },
      { id: "7-5", maksupaiva: "25.7.2025", tulolaji: "Kokouspalkkio", palkka: 160, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" },
      { id: "7-6", maksupaiva: "30.7.2025", tulolaji: "Luentopalkkio", palkka: 210, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" }
    ]
  },
  {
    id: "2025-06",
    ajanjakso: "2025 Kesäkuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 3800,
    tyonantajat: "Posti Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "6-1", maksupaiva: "10.6.2025", tulolaji: "Aikapalkka", palkka: 3000, alkuperainenTulo: 0, ansaintaAika: "1.6.2025 - 30.6.2025", tyonantaja: "Posti Oyj" },
      { id: "6-2", maksupaiva: "10.6.2025", tulolaji: "Lomaraha", palkka: 400, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" },
      { id: "6-3", maksupaiva: "15.6.2025", tulolaji: "Tulospalkka", palkka: 220, alkuperainenTulo: 0, ansaintaAika: "1.6.2025 - 30.6.2025", tyonantaja: "Posti Oyj" },
      { id: "6-4", maksupaiva: "20.6.2025", tulolaji: "Työkorvaus", palkka: 110, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" },
      { id: "6-5", maksupaiva: "25.6.2025", tulolaji: "Kokouspalkkio", palkka: 140, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" },
      { id: "6-6", maksupaiva: "30.6.2025", tulolaji: "Luentopalkkio", palkka: 190, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Posti Oyj" }
    ]
  },
  {
    id: "2025-05",
    ajanjakso: "2025 Toukokuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 3800,
    tyonantajat: "Nokia Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "5-1", maksupaiva: "10.5.2025", tulolaji: "Aikapalkka", palkka: 3200, alkuperainenTulo: 0, ansaintaAika: "1.5.2025 - 31.5.2025", tyonantaja: "Nokia Oyj" },
      { id: "5-2", maksupaiva: "10.5.2025", tulolaji: "Lomaraha", palkka: 400, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj" },
      { id: "5-3", maksupaiva: "15.5.2025", tulolaji: "Tulospalkka", palkka: 210, alkuperainenTulo: 0, ansaintaAika: "1.5.2025 - 31.5.2025", tyonantaja: "Nokia Oyj" },
      { id: "5-4", maksupaiva: "20.5.2025", tulolaji: "Työkorvaus", palkka: 110, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj" },
      { id: "5-5", maksupaiva: "25.5.2025", tulolaji: "Kokouspalkkio", palkka: 160, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj" },
      { id: "5-6", maksupaiva: "30.5.2025", tulolaji: "Luentopalkkio", palkka: 210, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj" }
    ]
  },
  {
    id: "2025-04",
    ajanjakso: "2025 Huhtikuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 3700,
    tyonantajat: "Nokia Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "4-1", maksupaiva: "10.4.2025", tulolaji: "Aikapalkka", palkka: 3100, alkuperainenTulo: 0, ansaintaAika: "1.4.2025 - 30.4.2025", tyonantaja: "Nokia Oyj" },
      { id: "4-2", maksupaiva: "10.4.2025", tulolaji: "Lomaraha", palkka: 400, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj" },
      { id: "4-3", maksupaiva: "15.4.2025", tulolaji: "Tulospalkka", palkka: 200, alkuperainenTulo: 0, ansaintaAika: "1.4.2025 - 30.4.2025", tyonantaja: "Nokia Oyj" },
      { id: "4-4", maksupaiva: "20.4.2025", tulolaji: "Työkorvaus", palkka: 100, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj" },
      { id: "4-5", maksupaiva: "25.4.2025", tulolaji: "Kokouspalkkio", palkka: 150, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj" },
      { id: "4-6", maksupaiva: "30.4.2025", tulolaji: "Luentopalkkio", palkka: 200, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj" }
    ]
  },
  {
    id: "2025-03",
    ajanjakso: "2025 Maaliskuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 3600,
    tyonantajat: "Nokia Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "3-1", maksupaiva: "10.3.2025", tulolaji: "Aikapalkka", palkka: 2900, alkuperainenTulo: 0, ansaintaAika: "1.3.2025 - 31.3.2025", tyonantaja: "Nokia Oyj" },
      { id: "3-2", maksupaiva: "10.3.2025", tulolaji: "Lomaraha", palkka: 400, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj" },
      { id: "3-3", maksupaiva: "15.3.2025", tulolaji: "Tulospalkka", palkka: 180, alkuperainenTulo: 0, ansaintaAika: "1.3.2025 - 31.3.2025", tyonantaja: "Nokia Oyj" },
      { id: "3-4", maksupaiva: "20.3.2025", tulolaji: "Työkorvaus", palkka: 90, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj" },
      { id: "3-5", maksupaiva: "25.3.2025", tulolaji: "Kokouspalkkio", palkka: 130, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj" },
      { id: "3-6", maksupaiva: "30.3.2025", tulolaji: "Luentopalkkio", palkka: 200, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj" }
    ]
  },
  {
    id: "2025-02",
    ajanjakso: "2025 Helmikuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 3400,
    tyonantajat: "Nokia Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "2-1", maksupaiva: "10.2.2025", tulolaji: "Aikapalkka", palkka: 2700, alkuperainenTulo: 0, ansaintaAika: "1.2.2025 - 28.2.2025", tyonantaja: "Nokia Oyj" },
      { id: "2-2", maksupaiva: "10.2.2025", tulolaji: "Lomaraha", palkka: 400, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj" },
      { id: "2-3", maksupaiva: "15.2.2025", tulolaji: "Tulospalkka", palkka: 150, alkuperainenTulo: 0, ansaintaAika: "1.2.2025 - 28.2.2025", tyonantaja: "Nokia Oyj" },
      { id: "2-4", maksupaiva: "20.2.2025", tulolaji: "Työkorvaus", palkka: 80, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj" },
      { id: "2-5", maksupaiva: "25.2.2025", tulolaji: "Kokouspalkkio", palkka: 120, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj" },
      { id: "2-6", maksupaiva: "28.2.2025", tulolaji: "Luentopalkkio", palkka: 180, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj" }
    ]
  },
  {
    id: "2025-01",
    ajanjakso: "2025 Tammikuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 3200,
    tyonantajat: "Nokia Oyj",
    pidennettavatJaksot: 0,
    rows: [
      { id: "1-1", maksupaiva: "10.1.2025", tulolaji: "Aikapalkka", palkka: 2500, alkuperainenTulo: 0, ansaintaAika: "1.1.2025 - 31.1.2025", tyonantaja: "Nokia Oyj" },
      { id: "1-2", maksupaiva: "10.1.2025", tulolaji: "Lomaraha", palkka: 400, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj" },
      { id: "1-3", maksupaiva: "15.1.2025", tulolaji: "Tulospalkka", palkka: 120, alkuperainenTulo: 0, ansaintaAika: "1.1.2025 - 31.1.2025", tyonantaja: "Nokia Oyj" },
      { id: "1-4", maksupaiva: "20.1.2025", tulolaji: "Työkorvaus", palkka: 60, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj" },
      { id: "1-5", maksupaiva: "25.1.2025", tulolaji: "Kokouspalkkio", palkka: 100, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj" },
      { id: "1-6", maksupaiva: "31.1.2025", tulolaji: "Luentopalkkio", palkka: 150, alkuperainenTulo: 0, ansaintaAika: "", tyonantaja: "Nokia Oyj" }
    ]
  },
  {
    id: "2024-12",
    ajanjakso: "2024 Joulukuu",
    toe: 0,
    jakaja: 0,
    palkka: 0,
    tyonantajat: "Ei työtä",
    pidennettavatJaksot: 0,
    rows: []
  },
  {
    id: "2024-11",
    ajanjakso: "2024 Marraskuu",
    toe: 0,
    jakaja: 0,
    palkka: 0,
    tyonantajat: "Ei työtä",
    pidennettavatJaksot: 0,
    rows: []
  },
  {
    id: "2024-10",
    ajanjakso: "2024 Lokakuu",
    toe: 0,
    jakaja: 0,
    palkka: 0,
    tyonantajat: "Ei työtä",
    pidennettavatJaksot: 0,
    rows: []
  },
  {
    id: "2024-09",
    ajanjakso: "2024 Syyskuu",
    toe: 0,
    jakaja: 0,
    palkka: 0,
    tyonantajat: "Ei työtä",
    pidennettavatJaksot: 0,
    rows: []
  },
  {
    id: "2024-08",
    ajanjakso: "2024 Elokuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 3500,
    tyonantajat: "Osa-aikatyö Oy",
    pidennettavatJaksot: 0,
    rows: [],
    viikkoTOERows: [
      {
        id: "v2024-08-1",
        alkupäivä: "5.8.2024",
        loppupäivä: "11.8.2024",
        työnantaja: "Osa-aikatyö Oy",
        selite: "Viikko 1",
        palkka: 800,
        toeViikot: 1,
        jakaja: 5,
        toeTunnit: 18,
        tunnitYhteensä: 20
      },
      {
        id: "v2024-08-2",
        alkupäivä: "12.8.2024",
        loppupäivä: "18.8.2024",
        työnantaja: "Osa-aikatyö Oy",
        selite: "Viikko 2",
        palkka: 800,
        toeViikot: 1,
        jakaja: 5,
        toeTunnit: 20,
        tunnitYhteensä: 22
      },
      {
        id: "v2024-08-3",
        alkupäivä: "19.8.2024",
        loppupäivä: "25.8.2024",
        työnantaja: "Osa-aikatyö Oy",
        selite: "Viikko 3",
        palkka: 800,
        toeViikot: 1,
        jakaja: 5,
        toeTunnit: 19,
        tunnitYhteensä: 21
      },
      {
        id: "v2024-08-4",
        alkupäivä: "26.8.2024",
        loppupäivä: "31.8.2024",
        työnantaja: "Osa-aikatyö Oy",
        selite: "Viikko 4 (osittainen)",
        palkka: 480,
        toeViikot: 0.6,
        jakaja: 3,
        toeTunnit: 11,
        tunnitYhteensä: 12
      }
    ]
  },
  {
    id: "2024-07",
    ajanjakso: "2024 Heinäkuu",
    toe: 0.5,
    jakaja: 11.0,
    palkka: 1600,
    tyonantajat: "Osa-aikatyö Oy",
    pidennettavatJaksot: 0,
    rows: [],
    viikkoTOERows: [
      {
        id: "v2024-07-1",
        alkupäivä: "1.7.2024",
        loppupäivä: "7.7.2024",
        työnantaja: "Osa-aikatyö Oy",
        selite: "Viikko 1",
        palkka: 750,
        toeViikot: 1,
        jakaja: 5,
        toeTunnit: 18,
        tunnitYhteensä: 20
      },
      {
        id: "v2024-07-2",
        alkupäivä: "8.7.2024",
        loppupäivä: "14.7.2024",
        työnantaja: "Osa-aikatyö Oy",
        selite: "Viikko 2",
        palkka: 750,
        toeViikot: 1,
        jakaja: 5,
        toeTunnit: 19,
        tunnitYhteensä: 21
      },
      {
        id: "v2024-07-3",
        alkupäivä: "15.7.2024",
        loppupäivä: "21.7.2024",
        työnantaja: "Osa-aikatyö Oy",
        selite: "Viikko 3",
        palkka: 750,
        toeViikot: 1,
        jakaja: 5,
        toeTunnit: 20,
        tunnitYhteensä: 22
      },
      {
        id: "v2024-07-4",
        alkupäivä: "22.7.2024",
        loppupäivä: "28.7.2024",
        työnantaja: "Osa-aikatyö Oy",
        selite: "Viikko 4",
        palkka: 750,
        toeViikot: 1,
        jakaja: 5,
        toeTunnit: 18,
        tunnitYhteensä: 20
      },
      {
        id: "v2024-07-5",
        alkupäivä: "29.7.2024",
        loppupäivä: "31.7.2024",
        työnantaja: "Osa-aikatyö Oy",
        selite: "Viikko 5 (osittainen)",
        palkka: 150,
        toeViikot: 0.2,
        jakaja: 1,
        toeTunnit: 4,
        tunnitYhteensä: 4
      }
    ]
  },
  {
    id: "2024-06",
    ajanjakso: "2024 Kesäkuu",
    toe: 1,
    jakaja: 21.5,
    palkka: 3200,
    tyonantajat: "Osa-aikatyö Oy",
    pidennettavatJaksot: 0,
    rows: [],
    viikkoTOERows: [
      {
        id: "v2024-06-1",
        alkupäivä: "3.6.2024",
        loppupäivä: "9.6.2024",
        työnantaja: "Osa-aikatyö Oy",
        selite: "Viikko 1",
        palkka: 700,
        toeViikot: 1,
        jakaja: 5,
        toeTunnit: 18,
        tunnitYhteensä: 20
      },
      {
        id: "v2024-06-2",
        alkupäivä: "10.6.2024",
        loppupäivä: "16.6.2024",
        työnantaja: "Osa-aikatyö Oy",
        selite: "Viikko 2",
        palkka: 700,
        toeViikot: 1,
        jakaja: 5,
        toeTunnit: 19,
        tunnitYhteensä: 21
      },
      {
        id: "v2024-06-3",
        alkupäivä: "17.6.2024",
        loppupäivä: "23.6.2024",
        työnantaja: "Osa-aikatyö Oy",
        selite: "Viikko 3",
        palkka: 700,
        toeViikot: 1,
        jakaja: 5,
        toeTunnit: 20,
        tunnitYhteensä: 22
      },
      {
        id: "v2024-06-4",
        alkupäivä: "24.6.2024",
        loppupäivä: "30.6.2024",
        työnantaja: "Osa-aikatyö Oy",
        selite: "Viikko 4",
        palkka: 700,
        toeViikot: 1,
        jakaja: 5,
        toeTunnit: 18,
        tunnitYhteensä: 20
      }
    ]
  },
  {
    id: "2024-05",
    ajanjakso: "2024 Toukokuu",
    toe: 0.5,
    jakaja: 10.5,
    palkka: 1800,
    tyonantajat: "Osa-aikatyö Oy",
    pidennettavatJaksot: 0,
    rows: [],
    viikkoTOERows: [
      {
        id: "v2024-05-1",
        alkupäivä: "6.5.2024",
        loppupäivä: "12.5.2024",
        työnantaja: "Osa-aikatyö Oy",
        selite: "Viikko 1",
        palkka: 600,
        toeViikot: 1,
        jakaja: 5,
        toeTunnit: 18,
        tunnitYhteensä: 20
      },
      {
        id: "v2024-05-2",
        alkupäivä: "13.5.2024",
        loppupäivä: "19.5.2024",
        työnantaja: "Osa-aikatyö Oy",
        selite: "Viikko 2",
        palkka: 600,
        toeViikot: 1,
        jakaja: 5,
        toeTunnit: 19,
        tunnitYhteensä: 21
      },
      {
        id: "v2024-05-3",
        alkupäivä: "20.5.2024",
        loppupäivä: "26.5.2024",
        työnantaja: "Osa-aikatyö Oy",
        selite: "Viikko 3",
        palkka: 600,
        toeViikot: 1,
        jakaja: 5,
        toeTunnit: 20,
        tunnitYhteensä: 22
      },
      {
        id: "v2024-05-4",
        alkupäivä: "27.5.2024",
        loppupäivä: "31.5.2024",
        työnantaja: "Osa-aikatyö Oy",
        selite: "Viikko 4 (osittainen)",
        palkka: 300,
        toeViikot: 0.5,
        jakaja: 2.5,
        toeTunnit: 9,
        tunnitYhteensä: 10
      }
    ]
  },
  {
    id: "2024-04",
    ajanjakso: "2024 Huhtikuu",
    toe: 0,
    jakaja: 0,
    palkka: 0,
    tyonantajat: "Ei työtä",
    pidennettavatJaksot: 0,
    rows: []
  },
  {
    id: "2024-03",
    ajanjakso: "2024 Maaliskuu",
    toe: 0,
    jakaja: 0,
    palkka: 0,
    tyonantajat: "Ei työtä",
    pidennettavatJaksot: 0,
    rows: []
  },
  {
    id: "2024-02",
    ajanjakso: "2024 Helmikuu",
    toe: 0,
    jakaja: 0,
    palkka: 0,
    tyonantajat: "Ei työtä",
    pidennettavatJaksot: 0,
    rows: []
  },
  {
    id: "2024-01",
    ajanjakso: "2024 Tammikuu",
    toe: 0,
    jakaja: 0,
    palkka: 0,
    tyonantajat: "Ei työtä",
    pidennettavatJaksot: 0,
    rows: []
  }
];


