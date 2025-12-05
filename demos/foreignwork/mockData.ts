import type { IncomeRow, MonthPeriod } from "../allocateincome/types";

// ============================================================================
// Mock Data for Foreign Work Scenarios
// ============================================================================

// ============================================================================
// Scenario 1: Työ Espanjassa
// ============================================================================
// Päivärahan hakijaksi: 4.9.2025
// Työ Espanjassa: 14.1.2025 – 3.9.2025 (7,5 kk)
// Työ Suomessa: 25.3.2019 – 3.1.2025
// TOE täyttyy Suomen ja Espanjan työstä yhteensä
// Palkanmääritys: Espanjan palkkatiedosta 14.1.-3.9.2025
// Jakaja: 172 (8 x 21,5)
// Laskennallinen kk-palkka: 1581,91 €
// TEL-vähennetty: 1525,91 €
// Päiväraha: 52,40 €

// Espanjan työn palkat (14.1.2025 - 3.9.2025)
// Yhteensä: 12655,30 €
// Jakautuminen: tammikuu 0,5 kk (14-31.1.), helmikuu-elokuu täysi, syyskuu 0,5 kk (1-3.9.)

const SPAIN_WAGE_TOTAL = 12655.30;
const SPAIN_MONTHLY_AVG = SPAIN_WAGE_TOTAL / 7.5; // 7,5 kuukautta

export const SPAIN_WORK_PERIODS: MonthPeriod[] = [
  // 2025 - Espanjan työ
  // LÄHTÖTILANNE: Järjestelmä hakee palkat 14 kk ja saa tammikuu-syyskuu välille tyhjät tiedot
  // Käsittelijä täydentää nämä tiedot myöhemmin
  {
    id: "2025-09",
    ajanjakso: "2025 Syyskuu",
    toe: 0.0, // Nollakuukausi (käsittelijä täydentää tiedot)
    jakaja: 0, // Tyhjä kuukausi, ei jakajanpäiviä
    palkka: 0,
    tyonantajat: "",
    pidennettavatJaksot: 0,
    rows: [] // Lähtötilanteessa tyhjä, käsittelijä täydentää
  },
  {
    id: "2025-08",
    ajanjakso: "2025 Elokuu",
    toe: 0.0, // Nollakuukausi (käsittelijä täydentää tiedot)
    jakaja: 0, // Tyhjä kuukausi, ei jakajanpäiviä
    palkka: 0,
    tyonantajat: "",
    pidennettavatJaksot: 0,
    rows: [] // Lähtötilanteessa tyhjä, käsittelijä täydentää
  },
  {
    id: "2025-07",
    ajanjakso: "2025 Heinäkuu",
    toe: 0.0, // Nollakuukausi (käsittelijä täydentää tiedot)
    jakaja: 0, // Tyhjä kuukausi, ei jakajanpäiviä
    palkka: 0,
    tyonantajat: "",
    pidennettavatJaksot: 0,
    rows: [] // Lähtötilanteessa tyhjä, käsittelijä täydentää
  },
  {
    id: "2025-06",
    ajanjakso: "2025 Kesäkuu",
    toe: 0.0, // Nollakuukausi (käsittelijä täydentää tiedot)
    jakaja: 0, // Tyhjä kuukausi, ei jakajanpäiviä
    palkka: 0,
    tyonantajat: "",
    pidennettavatJaksot: 0,
    rows: [] // Lähtötilanteessa tyhjä, käsittelijä täydentää
  },
  {
    id: "2025-05",
    ajanjakso: "2025 Toukokuu",
    toe: 0.0, // Nollakuukausi (käsittelijä täydentää tiedot)
    jakaja: 0, // Tyhjä kuukausi, ei jakajanpäiviä
    palkka: 0,
    tyonantajat: "",
    pidennettavatJaksot: 0,
    rows: [] // Lähtötilanteessa tyhjä, käsittelijä täydentää
  },
  {
    id: "2025-04",
    ajanjakso: "2025 Huhtikuu",
    toe: 0.0, // Nollakuukausi (käsittelijä täydentää tiedot)
    jakaja: 0, // Tyhjä kuukausi, ei jakajanpäiviä
    palkka: 0,
    tyonantajat: "",
    pidennettavatJaksot: 0,
    rows: [] // Lähtötilanteessa tyhjä, käsittelijä täydentää
  },
  {
    id: "2025-03",
    ajanjakso: "2025 Maaliskuu",
    toe: 0.0, // Nollakuukausi (käsittelijä täydentää tiedot)
    jakaja: 0, // Tyhjä kuukausi, ei jakajanpäiviä
    palkka: 0,
    tyonantajat: "",
    pidennettavatJaksot: 0,
    rows: [] // Lähtötilanteessa tyhjä, käsittelijä täydentää
  },
  {
    id: "2025-02",
    ajanjakso: "2025 Helmikuu",
    toe: 0.0, // Nollakuukausi (käsittelijä täydentää tiedot)
    jakaja: 0, // Tyhjä kuukausi, ei jakajanpäiviä
    palkka: 0,
    tyonantajat: "",
    pidennettavatJaksot: 0,
    rows: [] // Lähtötilanteessa tyhjä, käsittelijä täydentää
  },
  {
    id: "2025-01",
    ajanjakso: "2025 Tammikuu",
    toe: 0.0, // Nollakuukausi (käsittelijä täydentää tiedot)
    jakaja: 0, // Tyhjä kuukausi, ei jakajanpäiviä
    palkka: 0,
    tyonantajat: "",
    pidennettavatJaksot: 0,
    rows: [] // Lähtötilanteessa tyhjä, käsittelijä täydentää
  },

  // Suomen työ: 2024-2025 (taaksepäin 2019 asti, mutta näytetään vain relevantit)
  // 14 kk tarkastelujakso: 4.9.2024 - 4.9.2025
  // Järjestelmä hakee palkat ja löytää Suomen palkat 2024 syyskuu - 2025 tammikuu (1-13.1.)
  // Sen jälkeen tammikuu-syyskuu 2025 ovat tyhjiä (Espanjan työ, mutta järjestelmä ei löydä palkkoja)
  
  {
    id: "2024-09",
    ajanjakso: "2024 Syyskuu",
    toe: 1.0, // Täysi kuukausi (4.9.-30.9.2024, 14 kk tarkastelujakso alkaa 4.9.2024)
    jakaja: 21.5,
    palkka: 2200,
    tyonantajat: "Suomen työnantaja",
    pidennettavatJaksot: 0,
    rows: [
      {
        id: "fin-09-2024-1",
        maksupaiva: "30.9.2024",
        tulolaji: "Aikapalkka",
        palkka: 2200,
        alkuperainenTulo: 2200,
        ansaintaAika: "4.9.2024 - 30.9.2024",
        tyonantaja: "Suomen työnantaja"
      }
    ]
  },
  {
    id: "2024-10",
    ajanjakso: "2024 Lokakuu",
    toe: 1.0,
    jakaja: 21.5,
    palkka: 2300,
    tyonantajat: "Suomen työnantaja",
    pidennettavatJaksot: 0,
    rows: [
      {
        id: "fin-10-1",
        maksupaiva: "20.10.2024",
        tulolaji: "Aikapalkka",
        palkka: 2300,
        alkuperainenTulo: 2300,
        ansaintaAika: "1.10.2024 - 31.10.2024",
        tyonantaja: "Suomen työnantaja"
      }
    ]
  },
  {
    id: "2024-11",
    ajanjakso: "2024 Marraskuu",
    toe: 1.0,
    jakaja: 21.5,
    palkka: 2400,
    tyonantajat: "Suomen työnantaja",
    pidennettavatJaksot: 0,
    rows: [
      {
        id: "fin-11-1",
        maksupaiva: "20.11.2024",
        tulolaji: "Aikapalkka",
        palkka: 2400,
        alkuperainenTulo: 2400,
        ansaintaAika: "1.11.2024 - 30.11.2024",
        tyonantaja: "Suomen työnantaja"
      }
    ]
  },
  {
    id: "2024-12",
    ajanjakso: "2024 Joulukuu",
    toe: 1.0,
    jakaja: 21.5,
    palkka: 2500,
    tyonantajat: "Suomen työnantaja",
    pidennettavatJaksot: 0,
    rows: [
      {
        id: "fin-12-1",
        maksupaiva: "20.12.2024",
        tulolaji: "Aikapalkka",
        palkka: 2500,
        alkuperainenTulo: 2500,
        ansaintaAika: "1.12.2024 - 31.12.2024",
        tyonantaja: "Suomen työnantaja"
      }
    ]
  },
  {
    id: "2025-01-fin",
    ajanjakso: "2025 Tammikuu (Suomi)",
    toe: 0.5, // Vain 1-13.1. (ennen Espanjan työn alkamista)
    jakaja: 9, // 9 päivää
    palkka: 800,
    tyonantajat: "Suomen työnantaja",
    pidennettavatJaksot: 0,
    rows: [
      {
        id: "fin-01-1",
        maksupaiva: "13.1.2025",
        tulolaji: "Aikapalkka",
        palkka: 800,
        alkuperainenTulo: 800,
        ansaintaAika: "1.1.2025 - 13.1.2025",
        tyonantaja: "Suomen työnantaja"
      }
    ]
  },
  {
    id: "2024-08",
    ajanjakso: "2024 Elokuu",
    toe: 1.0,
    jakaja: 21.5,
    palkka: 2100,
    tyonantajat: "Suomen työnantaja",
    pidennettavatJaksot: 0,
    rows: [
      {
        id: "fin-08-1",
        maksupaiva: "20.8.2024",
        tulolaji: "Aikapalkka",
        palkka: 2100,
        alkuperainenTulo: 2100,
        ansaintaAika: "1.8.2024 - 31.8.2024",
        tyonantaja: "Suomen työnantaja"
      }
    ]
  },
  {
    id: "2024-07",
    ajanjakso: "2024 Heinäkuu",
    toe: 1.0,
    jakaja: 21.5,
    palkka: 2000,
    tyonantajat: "Suomen työnantaja",
    pidennettavatJaksot: 0,
    rows: [
      {
        id: "fin-07-1",
        maksupaiva: "20.7.2024",
        tulolaji: "Aikapalkka",
        palkka: 2000,
        alkuperainenTulo: 2000,
        ansaintaAika: "1.7.2024 - 31.7.2024",
        tyonantaja: "Suomen työnantaja"
      }
    ]
  },
  {
    id: "2024-06",
    ajanjakso: "2024 Kesäkuu",
    toe: 1.0,
    jakaja: 21.5,
    palkka: 1900,
    tyonantajat: "Suomen työnantaja",
    pidennettavatJaksot: 0,
    rows: [
      {
        id: "fin-06-1",
        maksupaiva: "20.6.2024",
        tulolaji: "Aikapalkka",
        palkka: 1900,
        alkuperainenTulo: 1900,
        ansaintaAika: "1.6.2024 - 30.6.2024",
        tyonantaja: "Suomen työnantaja"
      }
    ]
  },
  {
    id: "2024-05",
    ajanjakso: "2024 Toukokuu",
    toe: 1.0,
    jakaja: 21.5,
    palkka: 1800,
    tyonantajat: "Suomen työnantaja",
    pidennettavatJaksot: 0,
    rows: [
      {
        id: "fin-05-1",
        maksupaiva: "20.5.2024",
        tulolaji: "Aikapalkka",
        palkka: 1800,
        alkuperainenTulo: 1800,
        ansaintaAika: "1.5.2024 - 31.5.2024",
        tyonantaja: "Suomen työnantaja"
      }
    ]
  },
  {
    id: "2024-04",
    ajanjakso: "2024 Huhtikuu",
    toe: 1.0,
    jakaja: 21.5,
    palkka: 1700,
    tyonantajat: "Suomen työnantaja",
    pidennettavatJaksot: 0,
    rows: [
      {
        id: "fin-04-1",
        maksupaiva: "20.4.2024",
        tulolaji: "Aikapalkka",
        palkka: 1700,
        alkuperainenTulo: 1700,
        ansaintaAika: "1.4.2024 - 30.4.2024",
        tyonantaja: "Suomen työnantaja"
      }
    ]
  },
  {
    id: "2024-03",
    ajanjakso: "2024 Maaliskuu",
    toe: 1.0,
    jakaja: 21.5,
    palkka: 1600,
    tyonantajat: "Suomen työnantaja",
    pidennettavatJaksot: 0,
    rows: [
      {
        id: "fin-03-1",
        maksupaiva: "20.3.2024",
        tulolaji: "Aikapalkka",
        palkka: 1600,
        alkuperainenTulo: 1600,
        ansaintaAika: "1.3.2024 - 31.3.2024",
        tyonantaja: "Suomen työnantaja"
      }
    ]
  },
  {
    id: "2024-02",
    ajanjakso: "2024 Helmikuu",
    toe: 1.0,
    jakaja: 21.5,
    palkka: 1500,
    tyonantajat: "Suomen työnantaja",
    pidennettavatJaksot: 0,
    rows: [
      {
        id: "fin-02-1",
        maksupaiva: "20.2.2024",
        tulolaji: "Aikapalkka",
        palkka: 1500,
        alkuperainenTulo: 1500,
        ansaintaAika: "1.2.2024 - 29.2.2024",
        tyonantaja: "Suomen työnantaja"
      }
    ]
  },
  {
    id: "2024-01",
    ajanjakso: "2024 Tammikuu",
    toe: 1.0,
    jakaja: 21.5,
    palkka: 1400,
    tyonantajat: "Suomen työnantaja",
    pidennettavatJaksot: 0,
    rows: [
      {
        id: "fin-01-1",
        maksupaiva: "20.1.2024",
        tulolaji: "Aikapalkka",
        palkka: 1400,
        alkuperainenTulo: 1400,
        ansaintaAika: "1.1.2024 - 31.1.2024",
        tyonantaja: "Suomen työnantaja"
      }
    ]
  }
];

// ============================================================================
// Scenario 2: Pohjoismainen paluumuuttaja
// ============================================================================
// Hakijaksi: 22.7.2025
// Työ Ruotsissa: 1.3.2024 – 24.6.2025
// Ruotsin kassan jäsen: 5.8.2025 asti -> työssäoloehto täyttyy
// Kassan jäsenyys Suomessa: 6.8.2025 alkaen
// Opiskellut: 20.8.2022 – 28.2.2024 (pidentävä jakso)
// Työ Suomessa: 1.7.-19.8.2022 (palkanmääritys tästä)
// Palkanmääritys: 1.7.-19.8.2022, 3 624,91 €, 7 viikkoa, 36 päivää = 1,5 kk
// Indeksikorotettuna: 2 412,95 €
// TEL-vähennetty: 2 327,53 €
// Päiväraha: 69,18 €

// Suomen työn palkat (1.7.-19.8.2022)
const FINLAND_WAGE_TOTAL = 3624.91; // 7 viikkoa, 36 päivää
const FINLAND_DAILY_AVG = FINLAND_WAGE_TOTAL / 36; // Päiväkohtainen palkka

export const NORDIC_RETURN_PERIODS: MonthPeriod[] = [
  // Lähtötilanne: Järjestelmä hakee palkat 14 kk (22.7.2024 - 22.7.2025) ja saa pelkkää tyhjää
  // Siirtotiedot Ruotsin kassasta täyttävät TOE:n (simuloidaan myöhemmin)
  
  // 14 kk tarkastelujakso: 22.7.2024 - 22.7.2025
  // Kaikki periodsit tyhjiä lähtötilanteessa
  {
    id: "2025-07",
    ajanjakso: "2025 Heinäkuu",
    toe: 0.0, // Lähtötilanteessa tyhjä
    jakaja: 0, // Tyhjä kuukausi, ei jakajanpäiviä
    palkka: 0,
    tyonantajat: "",
    pidennettavatJaksot: 0,
    rows: []
  },
  {
    id: "2025-06",
    ajanjakso: "2025 Kesäkuu",
    toe: 0.0,
    jakaja: 0, // Tyhjä kuukausi, ei jakajanpäiviä
    palkka: 0,
    tyonantajat: "",
    pidennettavatJaksot: 0,
    rows: []
  },
  {
    id: "2025-05",
    ajanjakso: "2025 Toukokuu",
    toe: 0.0,
    jakaja: 0, // Tyhjä kuukausi, ei jakajanpäiviä
    palkka: 0,
    tyonantajat: "",
    pidennettavatJaksot: 0,
    rows: []
  },
  {
    id: "2025-04",
    ajanjakso: "2025 Huhtikuu",
    toe: 0.0,
    jakaja: 0, // Tyhjä kuukausi, ei jakajanpäiviä
    palkka: 0,
    tyonantajat: "",
    pidennettavatJaksot: 0,
    rows: []
  },
  {
    id: "2025-03",
    ajanjakso: "2025 Maaliskuu",
    toe: 0.0,
    jakaja: 0, // Tyhjä kuukausi, ei jakajanpäiviä
    palkka: 0,
    tyonantajat: "",
    pidennettavatJaksot: 0,
    rows: []
  },
  {
    id: "2025-02",
    ajanjakso: "2025 Helmikuu",
    toe: 0.0,
    jakaja: 0, // Tyhjä kuukausi, ei jakajanpäiviä
    palkka: 0,
    tyonantajat: "",
    pidennettavatJaksot: 0,
    rows: []
  },
  {
    id: "2025-01",
    ajanjakso: "2025 Tammikuu",
    toe: 0.0,
    jakaja: 0, // Tyhjä kuukausi, ei jakajanpäiviä
    palkka: 0,
    tyonantajat: "",
    pidennettavatJaksot: 0,
    rows: []
  },
  {
    id: "2024-12",
    ajanjakso: "2024 Joulukuu",
    toe: 0.0,
    jakaja: 0, // Tyhjä kuukausi, ei jakajanpäiviä
    palkka: 0,
    tyonantajat: "",
    pidennettavatJaksot: 0,
    rows: []
  },
  {
    id: "2024-11",
    ajanjakso: "2024 Marraskuu",
    toe: 0.0,
    jakaja: 0, // Tyhjä kuukausi, ei jakajanpäiviä
    palkka: 0,
    tyonantajat: "",
    pidennettavatJaksot: 0,
    rows: []
  },
  {
    id: "2024-10",
    ajanjakso: "2024 Lokakuu",
    toe: 0.0,
    jakaja: 0, // Tyhjä kuukausi, ei jakajanpäiviä
    palkka: 0,
    tyonantajat: "",
    pidennettavatJaksot: 0,
    rows: []
  },
  {
    id: "2024-09",
    ajanjakso: "2024 Syyskuu",
    toe: 0.0,
    jakaja: 0, // Tyhjä kuukausi, ei jakajanpäiviä
    palkka: 0,
    tyonantajat: "",
    pidennettavatJaksot: 0,
    rows: []
  },
  {
    id: "2024-08",
    ajanjakso: "2024 Elokuu",
    toe: 0.0,
    jakaja: 0, // Tyhjä kuukausi, ei jakajanpäiviä
    palkka: 0,
    tyonantajat: "",
    pidennettavatJaksot: 0,
    rows: []
  },
  {
    id: "2024-07",
    ajanjakso: "2024 Heinäkuu",
    toe: 0.0, // 22.7.2024 alkaa, joten osittainen kuukausi
    jakaja: 0, // Tyhjä kuukausi, ei jakajanpäiviä
    palkka: 0,
    tyonantajat: "",
    pidennettavatJaksot: 0,
    rows: []
  },
  
  // Suomen työ: 1.7.-19.8.2022 (palkanmääritys)
  // Lähtötilanteessa tyhjät, käsittelijä täydentää
  {
    id: "2022-08",
    ajanjakso: "2022 Elokuu",
    toe: 0.0, // Lähtötilanteessa tyhjä, käsittelijä täydentää
    jakaja: 0, // Tyhjä kuukausi, ei jakajanpäiviä
    palkka: 0,
    tyonantajat: "",
    pidennettavatJaksot: 0,
    rows: [] // Käsittelijä täydentää Suomen työn palkkatiedot (1-19.8.2022)
  },
  {
    id: "2022-07",
    ajanjakso: "2022 Heinäkuu",
    toe: 0.0, // Lähtötilanteessa tyhjä, käsittelijä täydentää
    jakaja: 0, // Tyhjä kuukausi, ei jakajanpäiviä
    palkka: 0,
    tyonantajat: "",
    pidennettavatJaksot: 0,
    rows: [] // Käsittelijä täydentää Suomen työn palkkatiedot (1-31.7.2022)
  },
  
  // Pidentävä jakso: opiskelua 20.8.2022 – 28.2.2024
  // Tämä lisätään erikseen käsittelijän toimesta (pidennettavatJaksot)
];

