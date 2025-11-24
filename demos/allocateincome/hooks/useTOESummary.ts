"use client";

import { useMemo } from "react";
import type { MonthPeriod } from "../types";
import { parseFinnishDate } from "../utils";
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
}: Params) {
  const summary = useMemo(() => {
    const totalTOEMonthsCalc = periods.reduce((sum, period) => sum + calculateTOEValue(period), 0);
    const totalJakaja = periods.reduce((sum, period) => sum + period.jakaja, 0);

    const totalSalary = definitionType === 'viikkotoe' ?
      periods.filter(p => !p.viikkoTOERows || p.viikkoTOERows.length === 0).reduce((sum, p) => sum + calculateEffectiveIncomeTotal(p), 0) +
      periods.filter(p => p.viikkoTOERows && p.viikkoTOERows.length > 0).reduce((sum, p) => sum + p.palkka - (viikkoTOEVähennysSummat[p.id] || 0), 0) :
      periods.reduce((sum, period) => sum + calculateEffectiveIncomeTotal(period), 0);

    // Laske täyttymispäivä: milloin TOE-kertymä saavuttaa 12kk
    // Käydään periodsit läpi aikajärjestyksessä (vanhimmasta uusimpaan)
    let completionDate: Date | null = null;
    let collectedTOEMonths = 0;
    let requiredTOEMonths = 0; // Tarvittu TOE-määrä täyttymiseen (kun TOE >= 12)
    const requiredPeriods: MonthPeriod[] = []; // Periodsit jotka olivat tarvittu täyttämään TOE
    
    // Järjestä periodsit aikajärjestykseen (vanhimmasta uusimpaan)
    // Poista viikkotoe-combined periodi, koska se ei ole yksittäinen kuukausi
    const sortedPeriods = periods
      .filter(p => p.id !== "viikkotoe-combined")
      .sort((a, b) => {
        const dateA = parsePeriodDate(a.ajanjakso);
        const dateB = parsePeriodDate(b.ajanjakso);
        if (!dateA || !dateB) return 0;
        return dateA.getTime() - dateB.getTime();
      });
    
    // Käy periodsit läpi ja laske TOE-kertymä kunnes saavutetaan 12kk
    for (const period of sortedPeriods) {
      const periodTOE = definitionType === 'viikkotoe' && period.viikkoTOERows && period.viikkoTOERows.length > 0
        ? period.toe
        : calculateTOEValue(period);
      
      collectedTOEMonths += periodTOE;
      requiredPeriods.push(period); // Lisää periodi tarvittujen periodsien listaan
      
      // Jos 12kk saavutettu, aseta täyttymispäivä tämän kuukauden viimeiseksi päiväksi
      if (collectedTOEMonths >= 12 && !completionDate) {
        // Tallenna tarvittu määrä (tämä on se määrä joka oli tarvittu täyttämään TOE)
        requiredTOEMonths = collectedTOEMonths;
        const periodDate = parsePeriodDate(period.ajanjakso);
        if (periodDate) {
          // Viimeinen päivä kuukaudesta
          completionDate = new Date(periodDate.getFullYear(), periodDate.getMonth() + 1, 0);
        }
        break;
      }
    }
    
    // Jos TOE < 12kk, käytä tarkastelujakson loppupäivää tai oletuspäivää
    if (!completionDate) {
      if (reviewPeriod) {
        const endDateStr = reviewPeriod.split(' - ')[1];
        const endDate = parseFinnishDate(endDateStr);
        completionDate = endDate || new Date();
      } else {
        // Jos ei tarkastelujaksoa, käytä viimeisimmän periodin päivää
        if (sortedPeriods.length > 0) {
          const lastPeriod = sortedPeriods[sortedPeriods.length - 1];
          const lastPeriodDate = parsePeriodDate(lastPeriod.ajanjakso);
          if (lastPeriodDate) {
            completionDate = new Date(lastPeriodDate.getFullYear(), lastPeriodDate.getMonth() + 1, 0);
          } else {
            completionDate = new Date();
          }
        } else {
          completionDate = new Date();
        }
      }
    }

    // Laske Jakaja ja TOE-palkka vain tarvittujen periodsien perusteella
    const requiredJakaja = requiredTOEMonths > 0
      ? requiredPeriods.reduce((sum, period) => sum + period.jakaja, 0)
      : totalJakaja; // Jos TOE ei täyty, käytä kaikkia periodsien jakaja-arvoja
    
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
        if (completionDate) {
          const definitionStart = new Date(completionDate);
          definitionStart.setMonth(definitionStart.getMonth() - 12);
          // Aseta kuukauden ensimmäiseksi päiväksi
          definitionStart.setDate(1);
          const definitionStartStr = formatDateFI(definitionStart);
          const definitionEndStr = formatDateFI(completionDate);
          definitionPeriod = `${definitionStartStr} - ${definitionEndStr}`;
        } else {
          definitionPeriod = periods.length > 0 ? "01.01.2025 - 31.12.2025" : '';
        }
        
        // Käytä requiredSalary ja requiredPeriods jos TOE täyttyy
        averageSalary = requiredTOEMonths > 0 && requiredPeriods.length > 0
          ? requiredSalary / requiredPeriods.length
          : (periods.length > 0 ? totalSalary / periods.length : 0);
        dailySalary = averageSalary / 21.5;
        workingDaysTotal = requiredTOEMonths > 0 ? requiredJakaja : totalJakaja;
        break;
      }
      case 'eurotoe6': {
        // Määrittelyjakso: 6kk taaksepäin täyttymispäivästä
        if (completionDate) {
          const definitionStart = new Date(completionDate);
          definitionStart.setMonth(definitionStart.getMonth() - 6);
          // Aseta kuukauden ensimmäiseksi päiväksi
          definitionStart.setDate(1);
          const definitionStartStr = formatDateFI(definitionStart);
          const definitionEndStr = formatDateFI(completionDate);
          definitionPeriod = `${definitionStartStr} - ${definitionEndStr}`;
        } else {
          definitionPeriod = periods.length > 0 ? "01.07.2025 - 31.12.2025" : '';
        }
        
        // EuroTOE6: käytä viimeisiä 6 periodia tarvittujen periodsien joukosta
        const periodsToUse = requiredTOEMonths > 0 
          ? requiredPeriods.slice(-6)
          : periods.slice(-6);
        const salary6Months = periodsToUse.reduce((sum, period) => sum + calculateEffectiveIncomeTotal(period), 0);
        const jakaja6Months = periodsToUse.reduce((sum, period) => sum + period.jakaja, 0);
        averageSalary = periodsToUse.length > 0 ? salary6Months / periodsToUse.length : 0;
        dailySalary = averageSalary / 21.5;
        workingDaysTotal = jakaja6Months;
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
        workingDaysTotal = requiredTOEMonths > 0 ? requiredJakaja : totalJakaja;

        // ViikkoTOE: käytetään laskettua completionDate:ä
        // Määrittelyjakso lasketaan taaksepäin täyttymispäivästä
        if (completionDate) {
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
          definitionPeriod = periods.length > 0 ? "01.01.2025 - 31.12.2025" : '';
        }
        break;
      }
      case 'vuositulo': {
        // Vuositulo: määrittelyjakso on täyttymispäivän vuosi
        if (completionDate) {
          const year = completionDate.getFullYear();
          definitionPeriod = `01.01.${year} - 31.12.${year}`;
        } else {
          definitionPeriod = periods.length > 0 ? "01.01.2025 - 31.12.2025" : '';
        }
        
        averageSalary = totalSalary;
        dailySalary = averageSalary / 365;
        workingDaysTotal = 365;
        break;
      }
      case 'ulkomaan': {
        // Ulkomaan: määrittelyjakso 12kk taaksepäin täyttymispäivästä
        if (completionDate) {
          const definitionStart = new Date(completionDate);
          definitionStart.setMonth(definitionStart.getMonth() - 12);
          definitionStart.setDate(1);
          const definitionStartStr = formatDateFI(definitionStart);
          const definitionEndStr = formatDateFI(completionDate);
          definitionPeriod = `${definitionStartStr} - ${definitionEndStr}`;
        } else {
          definitionPeriod = periods.length > 0 ? "01.01.2025 - 31.12.2025" : '';
        }
        
        averageSalary = periods.length > 0 ? totalSalary / periods.length : 0;
        dailySalary = averageSalary / 21.5;
        workingDaysTotal = totalJakaja;
        break;
      }
    }

    const telDeductionRate = 0.0354;
    const salaryAfterTelDeduction = averageSalary * (1 - telDeductionRate);
    const basicDailyAllowance = 37.21;
    const incomeThreshold = 3291;

    let unemploymentBenefit = 0;
    if (salaryAfterTelDeduction <= incomeThreshold) {
      unemploymentBenefit = salaryAfterTelDeduction * 0.45;
    } else {
      const firstPart = incomeThreshold * 0.45;
      const excessPart = (salaryAfterTelDeduction - incomeThreshold) * 0.20;
      unemploymentBenefit = firstPart + excessPart;
    }

    const unemploymentBenefitPerDay = unemploymentBenefit / 21.5;
    const fullDailyAllowance = basicDailyAllowance + unemploymentBenefitPerDay;

    // Käytä käyttäjän määrittelemää tarkastelujaksoa jos se on annettu, muuten käytä oletusarvoa
    const reviewPeriodDisplay = reviewPeriod || (definitionType === 'viikkotoe' ? definitionPeriod : "01.01.2025 - 31.12.2025");
    const completionDateStr = completionDate ? formatDateFI(completionDate) : '';
    const extendingPeriods = periods.reduce((sum, period) => sum + period.pidennettavatJaksot, 0);

    // Laske näytettävä TOE-määrä: jos TOE täyttyy, näytetään vain tarvittu määrä
    const displayTOEMonths = requiredTOEMonths > 0 ? requiredTOEMonths : totalTOEMonthsCalc;
    const displayTOEMax = requiredTOEMonths > 0 ? requiredTOEMonths : 12;

    return {
      totalTOEMonths: definitionType === 'viikkotoe'
        ? periods.filter(p => !p.viikkoTOERows || p.viikkoTOERows.length === 0).reduce((sum, p) => sum + calculateTOEValue(p), 0)
          + periods.filter(p => p.viikkoTOERows && p.viikkoTOERows.length > 0).reduce((sum, p) => sum + p.toe, 0)
        : totalTOEMonthsCalc,
      displayTOEMonths, // Näytettävä TOE-määrä (tarvittu määrä jos täyttyy, muuten kaikki)
      displayTOEMax, // Näytettävä maksimi (tarvittu määrä jos täyttyy, muuten 12)
      totalJakaja: workingDaysTotal,
      totalSalary: requiredTOEMonths > 0 ? requiredSalary : totalSalary,
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
    } as any;
  }, [periods, definitionType, viikkoTOEVähennysSummat, reviewPeriod, calculateTOEValue, calculateEffectiveIncomeTotal, isViikkoTOEPeriod]);

  return summary;
}


