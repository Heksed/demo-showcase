"use client";

import { useMemo } from "react";
import type { MonthPeriod, SubsidyCorrection } from "../types";
import { parseFinnishDate } from "../utils";
import { roundToeMonthsDown } from "../utils/subsidyCalculations";
type DefinitionType = 'eurotoe' | 'eurotoe6' | 'viikkotoe' | 'vuositulo' | 'ulkomaan';

// Parse period date from ajanjakso string (e.g., "2025 Joulukuu" -> Date)
function parsePeriodDate(ajanjakso: string): Date | null {
  const parts = ajanjakso.split(' ');
  if (parts.length !== 2) return null;
  const year = parseInt(parts[0], 10);
  const monthName = parts[1];
  const monthMap: { [key: string]: number } = {
    'Tammikuu': 0, 'Helmikuu': 1, 'Maaliskuu': 2, 'Huhtikuu': 3,
    'Toukokuu': 4, 'Kesäkuu': 5, 'Heinäkuu': 6, 'Elokuu': 7,
    'Syyskuu': 8, 'Lokakuu': 9, 'Marraskuu': 10, 'Joulukuu': 11
  };
  const month = monthMap[monthName];
  if (month === undefined || isNaN(year)) return null;
  return new Date(year, month, 1);
}

// Format date to Finnish format (DD.MM.YYYY)
function formatDateFI(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

type Params = {
  periods: MonthPeriod[];
  definitionType: DefinitionType;
  definitionOverride?: {start: string, end: string} | null;
  calculateTOEValue: (period: MonthPeriod) => number;
  calculateEffectiveIncomeTotal: (period: MonthPeriod) => number;
  isViikkoTOEPeriod: (period: MonthPeriod) => boolean;
  viikkoTOEVähennysSummat?: {[periodId: string]: number};
  reviewPeriod?: string; // Käyttäjän määrittelemä tarkastelujakso
  additionalExtendingDays?: number; // Lisäpidentävät jaksot (päivinä) syötetty laajennuksen yhteydessä
  subsidyCorrection?: SubsidyCorrection | null; // Palkkatuen korjaus
};

export default function useTOESummary({
  periods,
  definitionType,
  definitionOverride,
  calculateTOEValue,
  calculateEffectiveIncomeTotal,
  isViikkoTOEPeriod,
  viikkoTOEVähennysSummat = {},
  reviewPeriod,
  additionalExtendingDays = 0,
  subsidyCorrection = null,
}: Params) {
  const summary = useMemo(() => {
    // Hybridi-TOE-laskenta: ennen 2.9.2024 = viikkoTOE, 2.9.2024 alkaen = EUROTOE
    const HYBRID_TOE_CUTOFF_DATE = new Date(2024, 8, 2); // 2.9.2024
    const DEFAULT_HOURS_PER_WEEK = 18; // Default tuntimäärä viikossa
    const WEEKS_PER_MONTH = 4.33; // Keskimääräinen viikkojen määrä kuukaudessa
    const VIKKO_TOE_TO_EURO_TOE_RATIO = 4; // 4 viikkoTOE-yksikköä = 1 EUROTOE-yksikkö
    const VIKKO_TOE_HOURS_THRESHOLD = 18; // Tuntiraja viikkoTOE-yksikölle
    
    // Laske default tuntit periodille (18h/viikko jos puuttuu)
    const getDefaultHoursForPeriod = (period: MonthPeriod): number => {
      const periodDate = parsePeriodDate(period.ajanjakso);
      if (!periodDate || periodDate >= HYBRID_TOE_CUTOFF_DATE) return 0;
      
      // Jos periodilla ei ole tuntitietoja, käytä defaultia
      if (period.tunnitYhteensä === undefined || period.tunnitYhteensä === null) {
        return DEFAULT_HOURS_PER_WEEK * WEEKS_PER_MONTH; // ~78h/kk
      }
      return period.tunnitYhteensä;
    };
    
    // Laske viikkoTOE-viikot periodille (ennen 2.9.2024)
    const calculateViikkoTOEWeeks = (period: MonthPeriod): number => {
      const periodDate = parsePeriodDate(period.ajanjakso);
      if (!periodDate || periodDate >= HYBRID_TOE_CUTOFF_DATE) return 0;
      
      // Jos periodilla ei ole palkkatietoja EIKÄ tuntitietoja, ei kerrytä TOE:ta
      // Tämä varmistaa että tyhjät periodit eivät kerrytä TOE:ta
      if (period.rows.length === 0 && (period.tunnitYhteensä === undefined || period.tunnitYhteensä === null)) {
        return 0;
      }
      
      const hours = getDefaultHoursForPeriod(period);
      const hoursPerWeek = hours / WEEKS_PER_MONTH; // Laske tunnit/viikko
      
      // Jos >= 18h/viikko, periodi kerryttää 1 viikkoTOE-yksikön per viikko
      if (hoursPerWeek >= VIKKO_TOE_HOURS_THRESHOLD) {
        return WEEKS_PER_MONTH; // ~4.33 viikkoa/kk
      }
      return 0;
    };
    
    // Muunna viikkoTOE-viikot EUROTOE-kuukausiksi
    const convertViikkoTOEToEuroTOE = (viikkoTOEWeeks: number): number => {
      return viikkoTOEWeeks / VIKKO_TOE_TO_EURO_TOE_RATIO;
    };
    
    // Laske hybridi-TOE: ennen 2.9.2024 = viikkoTOE, 2.9.2024 alkaen = EUROTOE
    let viikkoTOEMonthsAsEuroTOE = 0;
    let euroTOEMonths = 0;
    
    periods.forEach(period => {
      const periodDate = parsePeriodDate(period.ajanjakso);
      if (!periodDate) return;
      
      if (periodDate < HYBRID_TOE_CUTOFF_DATE) {
        // Ennen 2.9.2024: laske viikkoTOE-säännöillä
        const viikkoTOEWeeks = calculateViikkoTOEWeeks(period);
        const euroTOEFromViikko = convertViikkoTOEToEuroTOE(viikkoTOEWeeks);
        viikkoTOEMonthsAsEuroTOE += euroTOEFromViikko;
      } else {
        // 2.9.2024 alkaen: laske EUROTOE-säännöillä
        const periodTOE = calculateTOEValue(period);
        euroTOEMonths += periodTOE;
      }
    });
    
    // Yhdistä arvot ja pyöristä 0.5 tarkkuudella
    const totalTOEMonthsCalcRaw = viikkoTOEMonthsAsEuroTOE + euroTOEMonths;
    const totalTOEMonthsCalc = roundToeMonthsDown(totalTOEMonthsCalcRaw);
    
    // Helper function to get corrected jakaja for a period
    const getCorrectedJakaja = (period: MonthPeriod): number => {
      if (subsidyCorrection && subsidyCorrection.periodCorrectedTOE) {
        const corrected = subsidyCorrection.periodCorrectedTOE.find(p => p.periodId === period.id);
        if (corrected) {
          return corrected.correctedJakaja;
        }
      }
      return period.jakaja;
    };
    
    const totalJakaja = periods.reduce((sum, period) => sum + getCorrectedJakaja(period), 0);

    const totalSalary = definitionType === 'viikkotoe' ?
      periods.filter(p => !p.viikkoTOERows || p.viikkoTOERows.length === 0).reduce((sum, p) => sum + calculateEffectiveIncomeTotal(p), 0) +
      periods.filter(p => p.viikkoTOERows && p.viikkoTOERows.length > 0).reduce((sum, p) => sum + p.palkka - (viikkoTOEVähennysSummat[p.id] || 0), 0) :
      periods.reduce((sum, period) => sum + calculateEffectiveIncomeTotal(period), 0);

    // Laske täyttymispäivä: tarkastelujakson päättymispäivä, jos TOE täyttyy
    // Laskenta tehdään taaksepäin tarkastelujakson päättymispäivästä
    let completionDate: Date | null = null;
    let collectedTOEMonths = 0;
    let requiredTOEMonths = 0; // Tarvittu TOE-määrä täyttymiseen (kun TOE >= 12)
    const requiredPeriods: MonthPeriod[] = []; // Periodsit jotka olivat tarvittu täyttämään TOE
    
    // Hae tarkastelujakson alkupäivä ja päättymispäivä
    // Laskenta lähtee aina kuluvasta päivästä taaksepäin
    let reviewPeriodEndDate: Date | null = null;
    let reviewPeriodStartDate: Date | null = null;
    if (reviewPeriod && reviewPeriod.trim() !== "") {
      const parts = reviewPeriod.split(' - ');
      if (parts.length === 2) {
        const startDateStr = parts[0];
        const endDateStr = parts[1];
        reviewPeriodStartDate = parseFinnishDate(startDateStr);
        reviewPeriodEndDate = parseFinnishDate(endDateStr);
      }
    }
    
    // Jos ei tarkastelujaksoa tai se on tyhjä, käytä nykyistä päivää
    // Laskenta lähtee aina kuluvasta päivästä taaksepäin
    if (!reviewPeriodEndDate) {
      reviewPeriodEndDate = new Date(); // Kuluvan päivän viimeinen päivä
    }
    
    // Järjestä periodsit taaksepäin (uusimmasta vanhimpaan) tarkastelujakson päättymispäivästä
    const sortedPeriods = periods
      .filter(p => p.id !== "viikkotoe-combined")
      .sort((a, b) => {
        const dateA = parsePeriodDate(a.ajanjakso);
        const dateB = parsePeriodDate(b.ajanjakso);
        if (!dateA || !dateB) return 0;
        return dateB.getTime() - dateA.getTime(); // Käänteinen järjestys: uusin ensin
      });
    
    // Käy periodsit läpi taaksepäin tarkastelujakson päättymispäivästä
    for (const period of sortedPeriods) {
      const periodDate = parsePeriodDate(period.ajanjakso);
      if (!periodDate || !reviewPeriodEndDate) continue;
      
      // Tarkista, että periodi on tarkastelujakson sisällä (ennen päättymispäivää)
      if (periodDate > reviewPeriodEndDate) continue;
      
      // Tarkista myös, että periodi on tarkastelujakson alkupäivän jälkeen
      if (reviewPeriodStartDate && periodDate < reviewPeriodStartDate) continue;
      
      // Laske periodin TOE-arvo hybridi-TOE-logiikalla
      let periodTOE: number;
      if (definitionType === 'viikkotoe' && period.viikkoTOERows && period.viikkoTOERows.length > 0) {
        // ViikkoTOE-tyyppinen periodi (erillinen käsittely)
        periodTOE = period.toe;
      } else if (periodDate < HYBRID_TOE_CUTOFF_DATE) {
        // Ennen 2.9.2024: laske viikkoTOE-säännöillä
        const viikkoTOEWeeks = calculateViikkoTOEWeeks(period);
        const euroTOEFromViikko = convertViikkoTOEToEuroTOE(viikkoTOEWeeks);
        periodTOE = roundToeMonthsDown(euroTOEFromViikko);
      } else {
        // 2.9.2024 alkaen: laske EUROTOE-säännöillä
        periodTOE = calculateTOEValue(period);
      }
      
      // Jos palkkatuetun työn korjaus on tehty, korjaa periodin TOE
      if (subsidyCorrection && subsidyCorrection.toeCorrection !== 0) {
        // Tarkista, onko periodissa palkkatuettua työtä
        const periodHasSubsidized = period.rows.some(row => {
          const isSubsidized = row.isSubsidized !== undefined
            ? row.isSubsidized
            : (row.tyonantaja === "Nokia Oyj"); // Käytetään samaa logiikkaa kuin Allocateincome.tsx
          return isSubsidized;
        });
        
        if (periodHasSubsidized) {
          // Laske korjaus tälle periodille
          // Käytetään yksinkertaistettua logiikkaa: korjaus jakautuu tasaisesti
          // palkkatuetuille periodsille
          const subsidizedPeriodsCount = sortedPeriods.filter(p => {
            const pDate = parsePeriodDate(p.ajanjakso);
            if (!pDate) return false;
            return pDate >= (reviewPeriodStartDate || new Date(0)) && pDate <= reviewPeriodEndDate &&
                   p.rows.some(row => {
                     const isSubsidized = row.isSubsidized !== undefined
                       ? row.isSubsidized
                       : (row.tyonantaja === "Nokia Oyj");
                     return isSubsidized;
                   });
          }).length;
          
          if (subsidizedPeriodsCount > 0) {
            const correctionPerPeriod = subsidyCorrection.toeCorrection / subsidizedPeriodsCount;
            periodTOE = Math.max(0, periodTOE + correctionPerPeriod); // Varmista ettei mene negatiiviseksi
          }
        }
      }
      
      // TÄRKEÄ: Lisää periodi requiredPeriods-taulukkoon VASTA jos periodin TOE > 0
      // Tämä varmistaa että vain TOE-kerryttävät periodsit osallistuvat laskentaan
      if (periodTOE > 0) {
        collectedTOEMonths += periodTOE;
        
        // Jos 12kk saavutettu, rajoita requiredPeriods vain niihin periodsit jotka osallistuivat täyttymiseen
        if (collectedTOEMonths >= 12 && requiredTOEMonths === 0) {
          requiredTOEMonths = collectedTOEMonths;
          completionDate = reviewPeriodEndDate; // Täyttymispäivä on tarkastelujakson päättymispäivä
          
          // Rajoita requiredPeriods vain niihin periodsit jotka osallistuivat täyttymiseen
          // Lasketaan taaksepäin: montako periodia tarvitaan täyttämään 12kk
          // TÄRKEÄ: Tallenna vain ne periodsit, joilla on TOE > 0 ja jotka osallistuvat täyttymiseen
          let tempCollected = 0;
          const periodsNeeded: MonthPeriod[] = []; // Tallenna periodsit, joilla on TOE > 0
          
          // Käy periodsit läpi taaksepäin (uusimmasta vanhimpaan) ja kerää ne, jotka osallistuvat täyttymiseen
          for (let i = sortedPeriods.length - 1; i >= 0; i--) {
            const p = sortedPeriods[i];
            const pDate = parsePeriodDate(p.ajanjakso);
            if (!pDate || !reviewPeriodEndDate) continue;
            
            // Tarkista, että periodi on tarkastelujakson sisällä
            if (pDate > reviewPeriodEndDate) continue;
            if (reviewPeriodStartDate && pDate < reviewPeriodStartDate) continue;
            
            let pTOE = definitionType === 'viikkotoe' && p.viikkoTOERows && p.viikkoTOERows.length > 0
              ? p.toe
              : calculateTOEValue(p);
            
            // Käytä korjattua TOE-arvoa jos korjaus on annettu
            if (subsidyCorrection && subsidyCorrection.toeCorrection !== 0) {
              const pHasSubsidized = p.rows.some(row => {
                const isSubsidized = row.isSubsidized !== undefined
                  ? row.isSubsidized
                  : (row.tyonantaja === "Nokia Oyj");
                return isSubsidized;
              });
              
              if (pHasSubsidized) {
                const subsidizedPeriodsCount = sortedPeriods.filter(pp => {
                  const ppDate = parsePeriodDate(pp.ajanjakso);
                  if (!ppDate) return false;
                  return ppDate >= (reviewPeriodStartDate || new Date(0)) && ppDate <= reviewPeriodEndDate &&
                         pp.rows.some(row => {
                           const isSubsidized = row.isSubsidized !== undefined
                             ? row.isSubsidized
                             : (row.tyonantaja === "Nokia Oyj");
                           return isSubsidized;
                         });
                }).length;
                
                if (subsidizedPeriodsCount > 0) {
                  const correctionPerPeriod = subsidyCorrection.toeCorrection / subsidizedPeriodsCount;
                  pTOE = Math.max(0, pTOE + correctionPerPeriod);
                }
              }
            }
            
            // Varmista että periodin TOE > 0 ennen kuin lisätään
            if (pTOE > 0) {
              tempCollected += pTOE;
              periodsNeeded.unshift(p); // Lisää alkuun (uusin ensin, koska käydään taaksepäin)
              if (tempCollected >= 12) {
                break;
              }
            }
          }
          
          // Pidä vain ne periodit jotka osallistuivat täyttymiseen ja joilla on TOE > 0
          // Korvaa requiredPeriods täysin periodsNeeded-taulukolla
          requiredPeriods.splice(0, requiredPeriods.length);
          requiredPeriods.push(...periodsNeeded);
          break;
        } else {
          // Jos 12kk ei ole vielä saavutettu, lisää periodi requiredPeriods-taulukkoon
          // Tämä varmistaa että periodi on mukana jos se osallistuu täyttymiseen
          requiredPeriods.unshift(period); // Lisää alkuun (vanhin ensin, jotta järjestys on oikea)
        }
      }
      // Jos periodin TOE on 0, ei lisätä sitä requiredPeriods-taulukkoon
      // eikä lisätä sitä collectedTOEMonths-muuttujaan
    }
    
    // Jos TOE ei täyty (< 12kk), completionDate pysyy null (näytetään viiva)

    // Laske Jakaja ja TOE-palkka vain tarvittujen periodsien perusteella
    // requiredPeriods sisältää jo vain periodsit, joilla on TOE > 0 (koska ne lisätään vain jos periodTOE > 0)
    // Mutta tarkistetaan vielä kerran varmuuden vuoksi, koska subsidyCorrection voi muuttaa TOE-arvoja
    const requiredJakaja = requiredTOEMonths > 0
      ? requiredPeriods.reduce((sum, period) => {
          // Laske jakaja vain niiltä periodsilta, joilla on TOE > 0
          let periodTOE = definitionType === 'viikkotoe' && period.viikkoTOERows && period.viikkoTOERows.length > 0
            ? period.toe
            : calculateTOEValue(period);
          
          // Käytä korjattua TOE-arvoa jos korjaus on annettu
          if (subsidyCorrection && subsidyCorrection.toeCorrection !== 0) {
            const periodHasSubsidized = period.rows.some(row => {
              const isSubsidized = row.isSubsidized !== undefined
                ? row.isSubsidized
                : (row.tyonantaja === "Nokia Oyj");
              return isSubsidized;
            });
            
            if (periodHasSubsidized) {
              const subsidizedPeriodsCount = sortedPeriods.filter(p => {
                const pDate = parsePeriodDate(p.ajanjakso);
                if (!pDate) return false;
                return pDate >= (reviewPeriodStartDate || new Date(0)) && pDate <= reviewPeriodEndDate &&
                       p.rows.some(row => {
                         const isSubsidized = row.isSubsidized !== undefined
                           ? row.isSubsidized
                           : (row.tyonantaja === "Nokia Oyj");
                         return isSubsidized;
                       });
              }).length;
              
              if (subsidizedPeriodsCount > 0) {
                const correctionPerPeriod = subsidyCorrection.toeCorrection / subsidizedPeriodsCount;
                periodTOE = Math.max(0, periodTOE + correctionPerPeriod);
              }
            }
          }
          
          // Jos periodin TOE on 0, ei lisätä jakajaa
          // Käytä korjattua jakajaa jos saatavilla
          const periodJakaja = getCorrectedJakaja(period);
          return periodTOE > 0 ? sum + periodJakaja : sum;
        }, 0)
      : totalJakaja; // Jos TOE ei täyty, käytä kaikkia periodsien jakaja-arvoja
    
    // Laske requiredSalary vain niistä periodsit, joilla on TOE > 0
    // requiredPeriods sisältää jo vain periodsit, joilla on TOE > 0 (koska ne lisätään vain jos periodTOE > 0)
    const requiredSalary = requiredTOEMonths > 0
      ? (definitionType === 'viikkotoe'
          ? requiredPeriods.filter(p => !p.viikkoTOERows || p.viikkoTOERows.length === 0).reduce((sum, p) => sum + calculateEffectiveIncomeTotal(p), 0) +
            requiredPeriods.filter(p => p.viikkoTOERows && p.viikkoTOERows.length > 0).reduce((sum, p) => sum + p.palkka - (viikkoTOEVähennysSummat[p.id] || 0), 0)
          : requiredPeriods.reduce((sum, period) => sum + calculateEffectiveIncomeTotal(period), 0))
      : totalSalary; // Jos TOE ei täyty, käytä kaikkia periodsien palkkoja

    let averageSalary = 0;
    let dailySalary = 0;
    let definitionPeriod = '';
    let workingDaysTotal = 0;

    switch (definitionType) {
      case 'eurotoe': {
        // Määrittelyjakso: 12kk taaksepäin täyttymispäivästä
        // Jos korjaus on tehty ja määrittelyjakso on tallennettu, käytä sitä
        if (subsidyCorrection?.definitionPeriodStart && subsidyCorrection?.definitionPeriodEnd) {
          definitionPeriod = `${subsidyCorrection.definitionPeriodStart} - ${subsidyCorrection.definitionPeriodEnd}`;
        } else if (completionDate) {
          const definitionStart = new Date(completionDate);
          definitionStart.setMonth(definitionStart.getMonth() - 12);
          // Aseta kuukauden ensimmäiseksi päiväksi
          definitionStart.setDate(1);
          const definitionStartStr = formatDateFI(definitionStart);
          const definitionEndStr = formatDateFI(completionDate);
          definitionPeriod = `${definitionStartStr} - ${definitionEndStr}`;
        } else {
          definitionPeriod = ''; // Näytetään viiva, jos TOE ei täyty
        }
        
        // Käytä requiredSalary ja requiredPeriods jos TOE täyttyy
        averageSalary = requiredTOEMonths > 0 && requiredPeriods.length > 0
          ? requiredSalary / requiredPeriods.length
          : (periods.length > 0 ? totalSalary / periods.length : 0);
        dailySalary = averageSalary / 21.5;
        
        // Käytä korjauksen jakajaa, jos se on saatavilla
        workingDaysTotal = requiredTOEMonths > 0 ? requiredJakaja : totalJakaja;
        
        // Jos korjaus on tehty ja siinä on totalDivisorDays, käytä sitä
        if (subsidyCorrection && subsidyCorrection.totalDivisorDays !== undefined && requiredTOEMonths > 0) {
          workingDaysTotal = subsidyCorrection.totalDivisorDays;
        }
        break;
      }
      case 'eurotoe6': {
        // Määrittelyjakso: 6kk taaksepäin täyttymispäivästä
        // Jos korjaus on tehty ja määrittelyjakso on tallennettu, käytä sitä
        // (EuroTOE6 käyttää viimeisiä 6 periodia, mutta näytetään koko määrittelyjakso)
        if (subsidyCorrection?.definitionPeriodStart && subsidyCorrection?.definitionPeriodEnd) {
          definitionPeriod = `${subsidyCorrection.definitionPeriodStart} - ${subsidyCorrection.definitionPeriodEnd}`;
        } else if (completionDate) {
          const definitionStart = new Date(completionDate);
          definitionStart.setMonth(definitionStart.getMonth() - 6);
          // Aseta kuukauden ensimmäiseksi päiväksi
          definitionStart.setDate(1);
          const definitionStartStr = formatDateFI(definitionStart);
          const definitionEndStr = formatDateFI(completionDate);
          definitionPeriod = `${definitionStartStr} - ${definitionEndStr}`;
        } else {
          definitionPeriod = ''; // Näytetään viiva, jos TOE ei täyty
        }
        
        // EuroTOE6: käytä viimeisiä 6 periodia tarvittujen periodsien joukosta
        const periodsToUse = requiredTOEMonths > 0 
          ? requiredPeriods.slice(-6)
          : periods.slice(-6);
        const salary6Months = periodsToUse.reduce((sum, period) => sum + calculateEffectiveIncomeTotal(period), 0);
        const jakaja6Months = periodsToUse.reduce((sum, period) => sum + getCorrectedJakaja(period), 0);
        averageSalary = periodsToUse.length > 0 ? salary6Months / periodsToUse.length : 0;
        dailySalary = averageSalary / 21.5;
        
        // Käytä korjauksen jakajaa, jos se on saatavilla
        // jakaja6Months on jo laskettu käyttäen getCorrectedJakaja-funktiota
        workingDaysTotal = jakaja6Months;
        
        // Jos korjaus on tehty ja siinä on totalDivisorDays, käytä sitä
        // (jakaja6Months käyttää jo korjattuja arvoja, mutta totalDivisorDays on tarkempi)
        if (subsidyCorrection && subsidyCorrection.totalDivisorDays !== undefined && requiredTOEMonths > 0) {
          workingDaysTotal = subsidyCorrection.totalDivisorDays;
        }
        break;
      }
      case 'viikkotoe': {
        // ViikkoTOE: käytä requiredPeriods jos TOE täyttyy
        const periodsToUse = requiredTOEMonths > 0 ? requiredPeriods : periods;
        const euroTOEPeriods = periodsToUse.filter(p => !p.viikkoTOERows || p.viikkoTOERows.length === 0);
        const viikkoTOEPeriods = periodsToUse.filter(p => p.viikkoTOERows && p.viikkoTOERows.length > 0);

        const euroTOESalary = euroTOEPeriods.reduce((sum, p) => sum + calculateEffectiveIncomeTotal(p), 0);
        const viikkoTOESalary = viikkoTOEPeriods.reduce((sum, p) => sum + p.palkka, 0);
        void euroTOESalary; void viikkoTOESalary; // values not directly returned but useful for debugging

        const salaryToUse = requiredTOEMonths > 0 ? requiredSalary : totalSalary;
        averageSalary = periodsToUse.length > 0 ? salaryToUse / periodsToUse.length : 0;
        dailySalary = averageSalary / 21.5;
        
        // Käytä korjauksen jakajaa, jos se on saatavilla
        workingDaysTotal = requiredTOEMonths > 0 ? requiredJakaja : totalJakaja;
        
        // Jos korjaus on tehty ja siinä on totalDivisorDays, käytä sitä
        if (subsidyCorrection && subsidyCorrection.totalDivisorDays !== undefined && requiredTOEMonths > 0) {
          workingDaysTotal = subsidyCorrection.totalDivisorDays;
        }

        // ViikkoTOE: käytetään laskettua completionDate:ä
        // Määrittelyjakso lasketaan taaksepäin täyttymispäivästä
        // Jos korjaus on tehty ja määrittelyjakso on tallennettu, käytä sitä
        if (subsidyCorrection?.definitionPeriodStart && subsidyCorrection?.definitionPeriodEnd) {
          definitionPeriod = `${subsidyCorrection.definitionPeriodStart} - ${subsidyCorrection.definitionPeriodEnd}`;
        } else if (completionDate) {
          let collectedTOEMonths = 0;
          let monthsBack = 0;
          
          // Käy periodsit läpi taaksepäin täyttymispäivästä
          while (collectedTOEMonths < 12 && monthsBack < 24) {
            const checkDate = new Date(completionDate);
            checkDate.setMonth(checkDate.getMonth() - monthsBack);
            const year = checkDate.getFullYear();
            const month = checkDate.getMonth() + 1;
            const periodId = `${year}-${String(month).padStart(2, '0')}`;

            const period = periods.find(p => p.id === periodId);
            if (period) {
              if (isViikkoTOEPeriod(period)) {
                collectedTOEMonths += period.toe;
              } else {
                collectedTOEMonths += calculateTOEValue(period);
              }
            }
            monthsBack++;
          }

          const reviewStartDate = new Date(completionDate);
          reviewStartDate.setMonth(reviewStartDate.getMonth() - monthsBack);
          reviewStartDate.setDate(1); // Kuukauden ensimmäinen päivä
          const reviewStartStr = formatDateFI(reviewStartDate);
          const reviewEndStr = formatDateFI(completionDate);
          definitionPeriod = `${reviewStartStr} - ${reviewEndStr}`;
        } else {
          definitionPeriod = ''; // Näytetään viiva, jos TOE ei täyty
        }
        break;
      }
      case 'vuositulo': {
        // Vuositulo: määrittelyjakso on täyttymispäivän vuosi
        // Jos korjaus on tehty ja määrittelyjakso on tallennettu, käytä sitä
        if (subsidyCorrection?.definitionPeriodStart && subsidyCorrection?.definitionPeriodEnd) {
          definitionPeriod = `${subsidyCorrection.definitionPeriodStart} - ${subsidyCorrection.definitionPeriodEnd}`;
        } else if (completionDate) {
          const year = completionDate.getFullYear();
          definitionPeriod = `01.01.${year} - 31.12.${year}`;
        } else {
          definitionPeriod = ''; // Näytetään viiva, jos TOE ei täyty
        }
        
        averageSalary = totalSalary;
        dailySalary = averageSalary / 365;
        workingDaysTotal = 365;
        break;
      }
      case 'ulkomaan': {
        // Ulkomaan: määrittelyjakso 12kk taaksepäin täyttymispäivästä
        // Jos korjaus on tehty ja määrittelyjakso on tallennettu, käytä sitä
        if (subsidyCorrection?.definitionPeriodStart && subsidyCorrection?.definitionPeriodEnd) {
          definitionPeriod = `${subsidyCorrection.definitionPeriodStart} - ${subsidyCorrection.definitionPeriodEnd}`;
        } else if (completionDate) {
          const definitionStart = new Date(completionDate);
          definitionStart.setMonth(definitionStart.getMonth() - 12);
          definitionStart.setDate(1);
          const definitionStartStr = formatDateFI(definitionStart);
          const definitionEndStr = formatDateFI(completionDate);
          definitionPeriod = `${definitionStartStr} - ${definitionEndStr}`;
        } else {
          definitionPeriod = ''; // Näytetään viiva, jos TOE ei täyty
        }
        
        averageSalary = periods.length > 0 ? totalSalary / periods.length : 0;
        dailySalary = averageSalary / 21.5;
        
        // Käytä korjauksen jakajaa, jos se on saatavilla
        workingDaysTotal = totalJakaja;
        
        // Jos korjaus on tehty ja siinä on totalDivisorDays, käytä sitä
        if (subsidyCorrection && subsidyCorrection.totalDivisorDays !== undefined && requiredTOEMonths > 0) {
          workingDaysTotal = subsidyCorrection.totalDivisorDays;
        }
        break;
      }
    }

    // Laske täysi päiväraha TOE-palkan perusteella (dokumentaation mukaan)
    // 1. TOE-palkka / päivä = TOE-palkka / jakajanpäivät
    // 2. Täysi ansiopäiväraha = 37,21 + 0,45 × (TOE-palkka/pv - 37,21)
    const basicDailyAllowance = 37.21;
    let fullDailyAllowance = 0;
    if (totalSalary > 0 && workingDaysTotal > 0) {
      // 1. TOE-palkka / päivä
      const toeSalaryPerDay = totalSalary / workingDaysTotal;
      
      // 2. Täysi ansiopäiväraha = 37,21 + 0,45 × (TOE-palkka/pv - 37,21)
      const earningsPart = 0.45 * Math.max(0, toeSalaryPerDay - basicDailyAllowance);
      fullDailyAllowance = basicDailyAllowance + earningsPart;
    }

    // Käytä käyttäjän määrittelemää tarkastelujaksoa jos se on annettu, muuten käytä oletusarvoa
    const reviewPeriodDisplay = reviewPeriod || (definitionType === 'viikkotoe' ? definitionPeriod : "01.01.2025 - 31.12.2025");
    const completionDateStr = completionDate ? formatDateFI(completionDate) : '';
    const periodsExtendingDays = periods.reduce((sum, period) => sum + period.pidennettavatJaksot, 0);
    const extendingPeriods = periodsExtendingDays + additionalExtendingDays;

    // Laske näytettävä TOE-määrä: jos TOE täyttyy, näytetään vain tarvittu määrä
    const displayTOEMonths = requiredTOEMonths > 0 ? requiredTOEMonths : totalTOEMonthsCalc;
    const displayTOEMax = requiredTOEMonths > 0 ? requiredTOEMonths : 12;

    return {
      // Käytä hybridi-TOE-laskentaa kaikille määrittelytyypeille (paitsi viikkotoe jolla on erillinen käsittely)
      totalTOEMonths: definitionType === 'viikkotoe'
        ? periods.filter(p => !p.viikkoTOERows || p.viikkoTOERows.length === 0).reduce((sum, p) => sum + calculateTOEValue(p), 0)
          + periods.filter(p => p.viikkoTOERows && p.viikkoTOERows.length > 0).reduce((sum, p) => sum + p.toe, 0)
        : totalTOEMonthsCalc, // Hybridi-TOE-laskenta: viikkoTOE muunnettu + suora EUROTOE
      displayTOEMonths, // Näytettävä TOE-määrä (tarvittu määrä jos täyttyy, muuten kaikki)
      displayTOEMax, // Näytettävä maksimi (tarvittu määrä jos täyttyy, muuten 12)
      totalJakaja: workingDaysTotal,
      totalSalary: requiredTOEMonths > 0 ? requiredSalary : totalSalary,
      totalSalaryAllPeriods: totalSalary, // Kaikkien periodsien kokonaispalkka (käytetään calculateSubsidyCorrection-funktiossa)
      averageSalary,
      dailySalary,
      fullDailyAllowance,
      reviewPeriod: reviewPeriodDisplay,
      completionDate: completionDateStr,
      definitionPeriod,
      extendingPeriods,
      definitionType,
      euroTOEMonths: definitionType === 'viikkotoe'
        ? periods.filter(p => !p.viikkoTOERows || p.viikkoTOERows.length === 0).reduce((sum, p) => sum + calculateTOEValue(p), 0)
        : 0,
      viikkoTOEMonths: definitionType === 'viikkotoe'
        ? periods.filter(p => p.viikkoTOERows && p.viikkoTOERows.length > 0).reduce((sum, p) => sum + p.toe, 0)
        : 0,
      requiredPeriodsCount: requiredTOEMonths > 0 ? requiredPeriods.length : periods.length, // Periodsien määrä, joilla on TOE > 0 ja jotka osallistuivat täyttymiseen
    } as any;
  }, [periods, definitionType, viikkoTOEVähennysSummat, reviewPeriod, calculateTOEValue, calculateEffectiveIncomeTotal, isViikkoTOEPeriod, additionalExtendingDays, subsidyCorrection]);

  return summary;
}


