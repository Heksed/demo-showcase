"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import useEuroTOEHandlers from "./hooks/useEuroTOEHandlers";
import Link from "next/link";
import { MOCK_EMPLOYMENT } from "./mockData";
import type { IncomeRow, MonthPeriod, SubsidyCorrection } from "./types";
import { INCOME_TYPES, NON_BENEFIT_AFFECTING_INCOME_TYPES } from "./types";
import SplitIncomeDialog from "./components/SplitIncomeDialog";
import useSplitIncome from "./hooks/useSplitIncome";
import SummaryHeader from "./components/SummaryHeader";
import useTOESummary from "./hooks/useTOESummary";
import usePeriodsModel from "./hooks/usePeriodsModel";
import AllocationDialog from "./components/AllocationDialog";
import useAllocationModal from "./hooks/useAllocationModal";
import AddIncomeDialog from "./components/AddIncomeDialog";
import useAddIncomeModal from "./hooks/useAddIncomeModal";
import PeriodsTable from "./components/PeriodsTable";
import SubsidizedWorkDrawer from "./components/SubsidizedWorkDrawer";
import ManualSubsidizedWorkDrawer from "./components/ManualSubsidizedWorkDrawer";
import useOpenAllocation from "./hooks/useOpenAllocation";
import useViikkoTOEHandlers from "./hooks/useViikkoTOEHandlers";

// ============================================================================
// Allocate Income – Income allocation demo
// ============================================================================

// types moved to ./types

// --- Mock Data moved to mockData.ts ---

// Income type lists moved to types.ts

/* Local MOCK_PERIODS fallback removed */

// --- Helper Functions ---
import { formatCurrency, parseFinnishDate, formatDateFI } from "./utils";
import { isoToFI } from "./utils";
import { getFinnishMonthName } from "./utils";
import { getVisibleRows } from "./utils";
import { daysBetween } from "./utils";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

// distributeByDays / distributeEqualMonths moved to utils

// Local month generator functions removed; handled inside hooks/utils

// Subsidized employers - same list as in Massincomesplit
const SUBSIDIZED_EMPLOYERS = new Set<string>(["Nokia Oyj"]);

// --- Main Component ---
export default function AllocateIncome() {
  const [definitionType, setDefinitionType] = useState<'eurotoe' | 'eurotoe6' | 'viikkotoe' | 'vuositulo' | 'ulkomaan'>('eurotoe');
  const [definitionOverride, setDefinitionOverride] = useState<{start: string, end: string} | null>(null);
  const [viikkoTOEVähennysSummat, setViikkoTOEVähennysSummat] = useState<{[periodId: string]: number}>({});
  
  // State, joka kertoo onko laskenta tehty
  // Alustetaan false, ja luetaan sessionStoragesta useEffect:issa client-puolella
  const [hasCalculated, setHasCalculated] = useState<boolean>(false);
  
  // Loading state "Laske TOE" -painikkeelle
  const [isCalculatingTOE, setIsCalculatingTOE] = useState<boolean>(false);
  
  // Lue hasCalculated sessionStoragesta client-puolella
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("hasCalculated");
      if (stored === "true") {
        setHasCalculated(true);
      }
    }
  }, []);
  
  const { periods, setPeriods, expandedPeriods, togglePeriod, isViikkoTOEPeriod } = usePeriodsModel(definitionType as any);

  // Tarkastelujakson muokkausmahdollisuus
  // Alkupäivä: tyhjä ensimmäisellä kerralla, asetetaan laskennan jälkeen
  // Päättymispäivä: kuluva päivä automaattisesti
  const [reviewPeriodStart, setReviewPeriodStart] = useState<string>("");
  const [reviewPeriodEnd, setReviewPeriodEnd] = useState<string>("");
  
  // Lisäpidentävät jaksot (päivinä) - syötetään laajennuksen yhteydessä
  const [additionalExtendingDays, setAdditionalExtendingDays] = useState<number>(0);
  
  // Subsidy correction state - read from sessionStorage on mount
  const [subsidyCorrection, setSubsidyCorrection] = useState<SubsidyCorrection | null>(null);
  const [subsidyDrawerOpen, setSubsidyDrawerOpen] = useState(false);
  const [correctionMode, setCorrectionMode] = useState<"automatic" | "manual">("automatic");
  
  // Aseta tarkastelujakson päättymispäiväksi kuluva päivä automaattisesti
  useEffect(() => {
    if (typeof window !== "undefined" && !hasCalculated) {
      // Jos laskentaa ei ole vielä tehty, aseta päättymispäiväksi kuluva päivä
      const today = new Date();
      const todayStr = formatDateFI(today);
      setReviewPeriodEnd(todayStr);
    }
  }, [hasCalculated]);
  
  // Lue tarkastelujakso sessionStoragesta client-puolella
  // Vain jos laskenta on jo tehty (hasCalculated === true)
  useEffect(() => {
    if (typeof window !== "undefined" && hasCalculated) {
      const storedStart = sessionStorage.getItem("reviewPeriodStart");
      const storedEnd = sessionStorage.getItem("reviewPeriodEnd");
      if (storedStart) {
        setReviewPeriodStart(storedStart);
      }
      if (storedEnd) {
        setReviewPeriodEnd(storedEnd);
      }
      // Lue lisäpidentävät jaksot
      const storedAdditional = sessionStorage.getItem("additionalExtendingDays");
      if (storedAdditional) {
        setAdditionalExtendingDays(parseInt(storedAdditional, 10) || 0);
      }
    }
  }, [hasCalculated]);

  // Parse period date from ajanjakso string (e.g., "2025 Joulukuu" -> Date)
  const parsePeriodDate = (ajanjakso: string): Date | null => {
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
  };

  // Filter periods based on review period
  const filteredPeriods = useMemo(() => {
    // Jos laskentaa ei ole vielä tehty, palauta tyhjä taulukko (paitsi ViikkoTOE)
    if (!hasCalculated && definitionType !== 'viikkotoe') {
      return [];
    }
    
    // ViikkoTOE-tyypillä käytetään suoraan usePeriodsModel hookin palauttamia periodsit
    // eikä filtteröidä niitä, koska viikkoTOE-näkymä on erillinen
    if (definitionType === 'viikkotoe') {
      return periods;
    }
    
    // Jos laskenta on tehty, näytetään vain ne periodsit, jotka kuuluvat tarkastelujaksoon
    // Molempien päivämäärien pitää olla asetettu
    const startDate = parseFinnishDate(reviewPeriodStart);
    const endDate = parseFinnishDate(reviewPeriodEnd);
    
    // Jos laskenta on tehty mutta päivämäärät eivät ole vielä asetettu, ei näytetä periodsit
    if (hasCalculated && (!startDate || !endDate)) {
      return [];
    }
    
    // Jos päivämäärät eivät ole asetettu, ei näytetä periodsit
    if (!startDate || !endDate) {
      return [];
    }
    
    // Set end date to last day of the month
    const endDateLastDay = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
    
    return periods.filter(period => {
      // Special handling for viikkotoe-combined period (ei pitäisi tulla tänne viikkoTOE-tyypillä)
      if (period.id === "viikkotoe-combined") {
        // ViikkoTOE-aika on 2024-05 - 2024-08, joten tarkista onko tarkastelujakso sisältää tämän
        const viikkoTOEStart = new Date(2024, 4, 1); // May 2024 (month index 4)
        const viikkoTOEEnd = new Date(2024, 7, 31); // August 2024 (month index 7)
        // Include if review period overlaps with ViikkoTOE period
        return viikkoTOEStart <= endDateLastDay && viikkoTOEEnd >= startDate;
      }
      
      const periodDate = parsePeriodDate(period.ajanjakso);
      if (!periodDate) return false;
      
      // Check if period's first day is within review period
      // Periodi kuuluu tarkastelujaksoon, jos sen ensimmäinen päivä on tarkastelujakson sisällä
      return periodDate >= startDate && periodDate <= endDateLastDay;
    });
  }, [periods, reviewPeriodStart, reviewPeriodEnd, definitionType, hasCalculated]);

  const handleVähennysSummaChange = (periodId: string, summa: number) => {
    setViikkoTOEVähennysSummat(prev => ({
      ...prev,
      [periodId]: summa
    }));
  };

  // --- Split income modal state moved to hook ---
  const split = useSplitIncome(setPeriods);
  // Päivityslogiikka siirretty usePeriodsModel-hookkiin
  
  // Allocation modal state moved to hook
  const allocation = useAllocationModal({ setPeriods, getFinnishMonthName });
  // Add income modal state moved to hook
  const addIncome = useAddIncomeModal(setPeriods);

  // Allocation form state moved to hook

  // isViikkoTOEPeriod ja togglePeriod tulevat usePeriodsModel-hookista

  // Calculate TOE value based on salary and working days (jakaja)
  const calculateTOEValue = (period: MonthPeriod): number => {
    const totalSalary = calculateEffectiveIncomeTotal(period);
    if (totalSalary >= 930) {
      return 1.0;
    } else if (totalSalary >= 465) {
      return 0.5;
    } else {
      return 0.0;
    }
  };

  const isRowDeleted = (row: IncomeRow): boolean => {
    return row.huom?.toLowerCase().includes("poistettu") || false;
  };

  const calculateEffectiveIncomeTotal = (period: MonthPeriod): number => {
    return period.rows
      .filter(row => 
        !isRowDeleted(row) &&
      (!NON_BENEFIT_AFFECTING_INCOME_TYPES.includes(row.tulolaji) || 
         row.huom?.includes("Huomioitu laskennassa"))
      )
      .reduce((sum, row) => sum + row.palkka, 0);
  };

  const { handleViikkoTOESave, handleViikkoTOEDelete, handleViikkoTOEAdd } = useViikkoTOEHandlers(setPeriods);

  // Format review period for display
  // Näytetään tyhjä ennen laskentaa, vasta laskennan jälkeen näytetään arvo
  const reviewPeriodDisplay = useMemo(() => {
    // Jos laskentaa ei ole tehty, palauta tyhjä
    if (!hasCalculated) {
      return "";
    }
    // Jos tarkastelujakso on tyhjä, käytä nykyistä päivää
    if (!reviewPeriodStart || !reviewPeriodEnd) {
      const today = new Date();
      return formatDateFI(today) + " - " + formatDateFI(today);
    }
    return `${reviewPeriodStart} - ${reviewPeriodEnd}`;
  }, [reviewPeriodStart, reviewPeriodEnd, hasCalculated]);

  // Järjestä filteredPeriods uusimmasta vanhimpaan (uusin ensin)
  const sortedFilteredPeriods = useMemo(() => {
    return [...filteredPeriods].sort((a, b) => {
      // Erikoistapaus: viikkotoe-combined periodi pysyy omalla paikallaan (tulee viimeiseksi)
      if (a.id === "viikkotoe-combined") return 1;
      if (b.id === "viikkotoe-combined") return -1;
      
      // Järjestä period ID:n mukaan (uusin ensin)
      // Period ID on muodossa "YYYY-MM", joten string vertailu toimii
      return b.id.localeCompare(a.id);
    });
  }, [filteredPeriods]);

  // Laske pidentävien jaksojen kokonaispäivämäärä
  const totalExtendingDays = useMemo(() => {
    if (!hasCalculated) return 0;
    const periodsExtendingDays = sortedFilteredPeriods.reduce((sum, period) => sum + period.pidennettavatJaksot, 0);
    return periodsExtendingDays + additionalExtendingDays;
  }, [sortedFilteredPeriods, hasCalculated, additionalExtendingDays]);

  const summary = useTOESummary({
    periods: sortedFilteredPeriods,
      definitionType,
    definitionOverride,
    calculateTOEValue,
    calculateEffectiveIncomeTotal,
    isViikkoTOEPeriod,
    viikkoTOEVähennysSummat,
    reviewPeriod: reviewPeriodDisplay,
    additionalExtendingDays,
    subsidyCorrection,
  }) as any;

  // getVisibleRows moved to utils to ensure split-child rows are shown correctly
  const { openAllocationModalSingle, openAllocationModalBatch } = useOpenAllocation(
    allocation,
    isRowDeleted,
    NON_BENEFIT_AFFECTING_INCOME_TYPES
  );

  const { restoreIncomeType, deleteIncomeType, includeIncomeInCalculation } = useEuroTOEHandlers(setPeriods);

  // Handle add income modal moved to hook

  // Employment filtering moved to useAddIncomeModal

  // Allocation preview/validation/apply/remove moved to useAllocationModal

  useEffect(() => {
    // Read subsidy correction from sessionStorage when component mounts
    // Älä poista sessionStoragesta, jotta se pysyy tallennettuna
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("subsidyCorrection");
      if (stored) {
        try {
          const correction = JSON.parse(stored) as SubsidyCorrection;
          setSubsidyCorrection(correction);
          // Älä poista sessionStoragesta, jotta se pysyy tallennettuna
        } catch (e) {
          console.error("Failed to parse subsidy correction from sessionStorage:", e);
        }
      }
    }
  }, []);

  // Lisää funktio, joka kerää kaikki palkkatuetut rivit periodsista
  const subsidizedRows = useMemo(() => {
    if (!hasCalculated) return [];
    return sortedFilteredPeriods.flatMap(period => 
      period.rows.filter(row => {
        const isSubsidized = row.isSubsidized !== undefined
          ? row.isSubsidized
          : SUBSIDIZED_EMPLOYERS.has(row.tyonantaja);
        return isSubsidized;
      })
    );
  }, [sortedFilteredPeriods, hasCalculated]);

  // Laske TOE-täyttymispäivä taaksepäin tarkastelujakson päättymispäivästä
  const calculateTOECompletion = useCallback(() => {
    // Hae tarkastelujakson päättymispäivä
    // Jos loppupäivä on tyhjä, käytä nykyistä päivää
    let endDate = parseFinnishDate(reviewPeriodEnd);
    if (!endDate) {
      // Jos tarkastelujakson loppupäivä on tyhjä, käytä nykyistä päivää
      endDate = new Date();
    }
    
    // Käytä KAIKKIA periodsit laskennassa, ei vain filtteröityjä
    // Laskenta tehdään taaksepäin kuluvasta päivästä niin pitkälle kuin tarvitaan
    const sortedPeriods = periods
      .filter(p => p.id !== "viikkotoe-combined")
      .sort((a, b) => {
        const dateA = parsePeriodDate(a.ajanjakso);
        const dateB = parsePeriodDate(b.ajanjakso);
        if (!dateA || !dateB) return 0;
        return dateB.getTime() - dateA.getTime(); // Uusin ensin
      });
    
    let collectedTOEMonths = 0;
    let completionDate: Date | null = null;
    let startDate: Date | null = null; // Tarkastelujakson alkupäivä (ensimmäisen periodin ensimmäinen päivä)
    
    // Käy periodsit läpi taaksepäin tarkastelujakson päättymispäivästä
    for (const period of sortedPeriods) {
      const periodDate = parsePeriodDate(period.ajanjakso);
      if (!periodDate) continue;
      
      // Tarkista, että periodi on tarkastelujakson sisällä (ennen päättymispäivää)
      if (periodDate > endDate) continue;
      
      // Laske periodin TOE
      let periodTOE = definitionType === 'viikkotoe' && period.viikkoTOERows && period.viikkoTOERows.length > 0
        ? period.toe
        : calculateTOEValue(period);
      
      // Jos palkkatuetun työn korjaus on tehty, korjaa periodin TOE
      if (subsidyCorrection && subsidyCorrection.toeCorrection !== 0) {
        // Tarkista, onko periodissa palkkatuettua työtä
        const periodHasSubsidized = period.rows.some(row => {
          const isSubsidized = row.isSubsidized !== undefined
            ? row.isSubsidized
            : SUBSIDIZED_EMPLOYERS.has(row.tyonantaja);
          return isSubsidized;
        });
        
        if (periodHasSubsidized) {
          // Laske korjaus tälle periodille
          // Käytetään yksinkertaistettua logiikkaa: korjaus jakautuu tasaisesti
          // palkkatuetuille periodsille
          const subsidizedPeriodsCount = sortedPeriods.filter(p => 
            p.rows.some(row => {
              const isSubsidized = row.isSubsidized !== undefined
                ? row.isSubsidized
                : SUBSIDIZED_EMPLOYERS.has(row.tyonantaja);
              return isSubsidized;
            })
          ).length;
          
          if (subsidizedPeriodsCount > 0) {
            const correctionPerPeriod = subsidyCorrection.toeCorrection / subsidizedPeriodsCount;
            periodTOE = Math.max(0, periodTOE + correctionPerPeriod); // Varmista ettei mene negatiiviseksi
          }
        }
      }
      
      collectedTOEMonths += periodTOE;
      
      // Jos 12kk saavutettu, aseta alkupäivä tämän periodin ensimmäiseksi päiväksi
      // Tämä on ensimmäinen periodi (vanhin) joka osallistui TOE:n täyttymiseen
      if (collectedTOEMonths >= 12 && !completionDate) {
        // Alkupäivä on tämän periodin ensimmäinen päivä
        startDate = new Date(periodDate.getFullYear(), periodDate.getMonth(), 1);
        // Täyttymispäivä on tarkastelujakson päättymispäivä (nykyinen päivä)
        completionDate = endDate;
        break;
      }
    }
    
    return {
      completionDate,
      startDate, // Lisätään alkupäivä palautusarvoon
      collectedTOEMonths,
      willFulfill: collectedTOEMonths >= 12,
    };
  }, [periods, reviewPeriodEnd, calculateTOEValue, subsidyCorrection, definitionType]);

  // Funktio, joka laskee TOE:n laajennetulla tarkastelujaksolla (pidentävät jaksot huomioiden)
  const calculateTOECompletionWithExtending = useCallback((correction?: SubsidyCorrection, additionalDays: number = 0) => {
    // Hae tarkastelujakson päättymispäivä (nykyinen päivä tai reviewPeriodEnd jos asetettu)
    let endDate = parseFinnishDate(reviewPeriodEnd);
    if (!endDate) {
      endDate = new Date();
    }
    
    // TÄRKEÄ: Käytä alkuperäistä laskennan tulosta (reviewPeriodStart) alkuperäisenä alkupäivänä
    // Jos reviewPeriodStart on asetettu, käytä sitä. Muuten käytä normalStartDate (28kk taaksepäin)
    let baseStartDate: Date;
    if (reviewPeriodStart) {
      const parsedStart = parseFinnishDate(reviewPeriodStart);
      if (parsedStart) {
        baseStartDate = parsedStart;
      } else {
        // Jos parsinta epäonnistui, käytä normalStartDate
        baseStartDate = new Date(endDate);
        baseStartDate.setMonth(baseStartDate.getMonth() - 28);
        baseStartDate.setDate(1);
      }
    } else {
      // Jos reviewPeriodStart ei ole asetettu, käytä normalStartDate (28kk taaksepäin)
      baseStartDate = new Date(endDate);
      baseStartDate.setMonth(baseStartDate.getMonth() - 28);
      baseStartDate.setDate(1);
    }
    
    // Laajenna alkupäivää pidentävillä jaksoilla + lisäpäivillä
    // Laajennus tehdään alkuperäisestä alkupäivästä (reviewPeriodStart) taaksepäin
    const extendedStartDate = new Date(baseStartDate);
    extendedStartDate.setDate(extendedStartDate.getDate() - totalExtendingDays - additionalDays);
    
    // TÄRKEÄ: Aseta extendedStartDate kuukauden ensimmäiseksi päiväksi
    // jotta vertailu toimii oikein kuukausiperiodien kanssa
    // Jos extendedStartDate on esim. 15.6.2022, asetetaan se 1.6.2022
    // jotta kesäkuun periodi (1.6.2022) tulee mukaan
    extendedStartDate.setDate(1);
    
    // Käytä KAIKKIA periodsit laskennassa
    const sortedPeriods = periods
      .filter(p => p.id !== "viikkotoe-combined")
      .sort((a, b) => {
        const dateA = parsePeriodDate(a.ajanjakso);
        const dateB = parsePeriodDate(b.ajanjakso);
        if (!dateA || !dateB) return 0;
        return dateB.getTime() - dateA.getTime(); // Uusin ensin
      });
    
    // Laske palkkatuetut periodsit laajennetun tarkastelujakson perusteella
    // Järjestä ne aikajärjestykseen (vanhin ensin) 10kk säännön vuoksi
    const subsidizedPeriodsInExtendedRange = sortedPeriods
      .filter(p => {
        const pDate = parsePeriodDate(p.ajanjakso);
        if (!pDate) return false;
        return pDate >= extendedStartDate && pDate <= endDate && 
               p.rows.some(row => {
                 const isSubsidized = row.isSubsidized !== undefined
                   ? row.isSubsidized
                   : SUBSIDIZED_EMPLOYERS.has(row.tyonantaja);
                 return isSubsidized;
               });
      })
      .sort((a, b) => {
        // Järjestä aikajärjestykseen (vanhin ensin) 10kk säännön vuoksi
        const dateA = parsePeriodDate(a.ajanjakso);
        const dateB = parsePeriodDate(b.ajanjakso);
        if (!dateA || !dateB) return 0;
        return dateA.getTime() - dateB.getTime();
      });
    
    let collectedTOEMonths = 0;
    let completionDate: Date | null = null;
    let startDate: Date | null = null;
    
    // Käy periodsit läpi taaksepäin laajennetusta tarkastelujaksosta
    for (const period of sortedPeriods) {
      const periodDate = parsePeriodDate(period.ajanjakso);
      if (!periodDate) continue;
      
      // Tarkista, että periodi on laajennetun tarkastelujakson sisällä
      // periodDate on aina kuukauden ensimmäinen päivä, extendedStartDate myös
      // joten vertailu toimii oikein
      if (periodDate < extendedStartDate || periodDate > endDate) continue;
      
      // Laske periodin TOE (korjaus huomioiden jos annettu)
      let periodTOE = definitionType === 'viikkotoe' && period.viikkoTOERows && period.viikkoTOERows.length > 0
        ? period.toe
        : calculateTOEValue(period);
      
      // Käytä korjattua TOE-arvoa jos korjaus on annettu
      if (correction && correction.toeCorrection !== 0) {
        const periodHasSubsidized = period.rows.some(row => {
          const isSubsidized = row.isSubsidized !== undefined
            ? row.isSubsidized
            : SUBSIDIZED_EMPLOYERS.has(row.tyonantaja);
          return isSubsidized;
        });
        
        if (periodHasSubsidized) {
          // Etsi periodin sijainti järjestetyssä listassa (10kk säännön vuoksi)
          const periodIndex = subsidizedPeriodsInExtendedRange.findIndex(p => p.id === period.id);
          
          if (periodIndex >= 0 && correction.rule === "LOCK_10_MONTHS_THEN_75") {
            // LOCK_10_MONTHS_THEN_75 -sääntö: ensimmäiset 10kk eivät kerry TOE:ta, loput 75%
            if (periodIndex < 10) {
              // Ensimmäiset 10 palkkatuettua periodia eivät kerry TOE:ta
              periodTOE = 0;
            } else {
              // Loput periodit kerryttävät 75% TOE:sta
              // Alkuperäinen TOE on 1.0 (täysi kuukausi), korjattu TOE on 0.75
              periodTOE = periodTOE * 0.75;
            }
          } else {
            // Muille säännöille (PERCENT_75, NO_TOE_EXTENDS), käytä tasajakoa
            const subsidizedPeriodsInRange = subsidizedPeriodsInExtendedRange.length;
            if (subsidizedPeriodsInRange > 0) {
              const correctionPerPeriod = correction.toeCorrection / subsidizedPeriodsInRange;
              periodTOE = Math.max(0, periodTOE + correctionPerPeriod);
            }
          }
        }
      }
      
      // TÄRKEÄ: Vain TOE > 0 periodsit osallistuvat laskentaan
      if (periodTOE > 0) {
        collectedTOEMonths += periodTOE;
        
        // Jos 12kk saavutettu, aseta alkupäivä ja täyttymispäivä, sitten BREAK
        // Tämä on oikea logiikka: lasketaan vain niin paljon TOE:ta kuin tarvitaan 12kk täyttymiseen
        if (collectedTOEMonths >= 12 && !completionDate) {
          startDate = new Date(periodDate.getFullYear(), periodDate.getMonth(), 1);
          completionDate = endDate;
          break; // Pysähdytään kun 12kk täyttyy
        }
      }
    }
    
    return {
      completionDate,
      startDate,
      collectedTOEMonths, // Palauta TOE-määrä (joko 12kk+ jos täyttyy, tai vähemmän jos ei täyty)
      willFulfill: collectedTOEMonths >= 12,
      extendedStartDate, // Palauta laajennettu alkupäivä
    };
  }, [periods, calculateTOEValue, definitionType, totalExtendingDays, reviewPeriodStart, reviewPeriodEnd]);

  // Funktio, joka laskee arvioidun TOE:n lisäpäivillä (ilman että se muuttaa tarkastelujaksoa)
  const estimateTOEWithExtending = useCallback((additionalDays: number, correction: SubsidyCorrection): number => {
    const result = calculateTOECompletionWithExtending(correction, additionalDays);
    return result.collectedTOEMonths;
  }, [calculateTOECompletionWithExtending]);

  // Funktio, joka suorittaa laskennan uudelleen lisäpäivillä ja päivittää tarkastelujakson
  const handleExtendPeriod = useCallback((additionalDays: number, correction: SubsidyCorrection) => {
    // Sovelleta korjaus ensin
    setSubsidyCorrection(correction);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("subsidyCorrection", JSON.stringify(correction));
    }

    // Tallenna lisäpidentävät jaksot
    setAdditionalExtendingDays(additionalDays);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("additionalExtendingDays", additionalDays.toString());
    }

    // Varmista että reviewPeriodEnd on asetettu (pitäisi olla jo kuluva päivä)
    if (!reviewPeriodEnd) {
      const today = new Date();
      const todayStr = formatDateFI(today);
      setReviewPeriodEnd(todayStr);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("reviewPeriodEnd", todayStr);
      }
    }

    // Laske uudelleen laajennetulla tarkastelujaksolla
    const result = calculateTOECompletionWithExtending(correction, additionalDays);
    
    if (result && result.willFulfill && result.startDate) {
      // Päivitä tarkastelujakson alkupäivä laajennetulla arvolla
      const startDateStr = formatDateFI(result.startDate);
      setReviewPeriodStart(startDateStr);
      
      if (typeof window !== "undefined") {
        sessionStorage.setItem("reviewPeriodStart", startDateStr);
      }
    } else {
      // TOE ei täyty edes laajennetulla tarkastelujaksolla
      // Päivitä silti tarkastelujakson alkupäivä laajennetulla arvolla
      if (result && result.extendedStartDate) {
        const startDateStr = formatDateFI(result.extendedStartDate);
        setReviewPeriodStart(startDateStr);
        
        if (typeof window !== "undefined") {
          sessionStorage.setItem("reviewPeriodStart", startDateStr);
        }
      }
      
      const monthsNeeded = 12 - correction.toeCorrectedTotal;
      alert(
        `Korjauksen jälkeen TOE on ${correction.toeCorrectedTotal.toFixed(1)} kk / 12 kk. ` +
        `Laajennetulla tarkastelujaksolla (${totalExtendingDays - additionalExtendingDays + additionalDays} pv pidentäviä jaksoja) saatiin ${result?.collectedTOEMonths.toFixed(1) || 0} kk. ` +
        `Tarvitaan vielä ${monthsNeeded.toFixed(1)} kk. Hae lisää tietoja taaksepäin tai tarkista korjaukset.`
      );
    }
  }, [calculateTOECompletionWithExtending, totalExtendingDays, additionalExtendingDays, reviewPeriodEnd]);

  // Handler "Laske TOE" -painikkeelle
  const handleCalculateTOE = useCallback(async () => {
    // Varmista että päättymispäivä on asetettu (pitäisi olla jo kuluva päivä)
    let endDateStr = reviewPeriodEnd;
    if (!endDateStr || endDateStr.trim() === "") {
      const today = new Date();
      endDateStr = formatDateFI(today);
      setReviewPeriodEnd(endDateStr);
    }
    
    // Aseta loading-tila päälle
    setIsCalculatingTOE(true);
    
    // Simuloi tietokannasta latausta (1-2 sekuntia)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Aseta laskenta tehtyksi - tämä näyttää periodsit ja päivittää laskennat
    setHasCalculated(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("hasCalculated", "true");
      sessionStorage.setItem("reviewPeriodEnd", endDateStr);
    }
    
    const result = calculateTOECompletion();
    
    // Poista loading-tila
    setIsCalculatingTOE(false);
    
    if (!result) {
      alert("Tarkastelujakson päättymispäivää ei voitu parsia. Tarkista päivämäärän muoto (PP.KK.VVVV).");
      return;
    }
    
    if (result.willFulfill && result.completionDate && result.startDate) {
      // Päivitä tarkastelujakson alkupäivä ensimmäisen periodin ensimmäiseksi päiväksi
      // Tämä on ensimmäinen periodi (vanhin) joka osallistui TOE:n täyttymiseen
      const startDateStr = formatDateFI(result.startDate);
      setReviewPeriodStart(startDateStr);
      
      // Tallenna sessionStorageen
      if (typeof window !== "undefined") {
        sessionStorage.setItem("reviewPeriodStart", startDateStr);
      }
      
      // Tarkastelujakson loppupäivä pysyy kuluvana päivänä
      // SummaryHeader päivittyy automaattisesti, koska se käyttää reviewPeriodDisplay:ia
    } else {
      // TOE ei täyty nykyisellä tarkastelujaksolla
      alert(`TOE ei täyty nykyisellä tarkastelujaksolla. Kerrytetty: ${result.collectedTOEMonths.toFixed(1)} kk / 12 kk`);
    }
  }, [calculateTOECompletion, reviewPeriodEnd]);

  // Tallenna tarkastelujakso sessionStorageen kun se muuttuu
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("reviewPeriodStart", reviewPeriodStart);
      sessionStorage.setItem("reviewPeriodEnd", reviewPeriodEnd);
    }
  }, [reviewPeriodStart, reviewPeriodEnd]);

  // Tallenna hasCalculated sessionStorageen kun se muuttuu
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (hasCalculated) {
        sessionStorage.setItem("hasCalculated", "true");
      } else {
        sessionStorage.removeItem("hasCalculated");
      }
    }
  }, [hasCalculated]);

  // Collect all income rows from periods for Massincomesplit
  const collectAllIncomeRows = (periods: MonthPeriod[]): IncomeRow[] => {
    return periods.flatMap(period => period.rows || []);
  };

  // Check if periods contain subsidized work
  // Näytetään vasta laskennan jälkeen
  const hasSubsidizedWork = useMemo(() => {
    // Näytetään vasta laskennan jälkeen
    if (!hasCalculated) return false;
    
    // Check all periods for subsidized work
    return periods.some(period => 
      period.rows.some(row => {
        // Check isSubsidized field if it's set
        if (row.isSubsidized !== undefined) {
          return row.isSubsidized;
        }
        // Fallback: check employer name against SUBSIDIZED_EMPLOYERS set
        return SUBSIDIZED_EMPLOYERS.has(row.tyonantaja);
      })
    );
  }, [periods, hasCalculated]);

  // Hae palkkatuetun työn työnantajan nimi
  const subsidizedEmployerName = useMemo(() => {
    for (const period of periods) {
      for (const row of period.rows) {
        const isSubsidized = row.isSubsidized !== undefined
          ? row.isSubsidized
          : SUBSIDIZED_EMPLOYERS.has(row.tyonantaja);
        if (isSubsidized) {
          return row.tyonantaja;
        }
      }
    }
    return undefined;
  }, [periods]);

  // Handler for navigating to Massincomesplit with data
  const handleNavigateToMassIncomeSplit = () => {
    // Collect all income rows from filtered periods (within review period)
    const allRows = collectAllIncomeRows(sortedFilteredPeriods);
    
    // Save to sessionStorage
    if (typeof window !== "undefined") {
      sessionStorage.setItem("incomeRows", JSON.stringify(allRows));
      // Also save TOE and total salary for drawer
      sessionStorage.setItem("toeSystemTotal", JSON.stringify(summary.totalTOEMonths));
      sessionStorage.setItem("systemTotalSalary", JSON.stringify(summary.totalSalary));
      sessionStorage.setItem("periodCount", JSON.stringify(sortedFilteredPeriods.length));
    }
  };

  // Handler for extending review period to 28 months

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-4">

        {/* Tarkastelujakson muokkaus - näytetään vain muille tyypeille kuin viikkotoe */}
        {definitionType !== 'viikkotoe' && (
          <Card className="p-4 mb-4">
            <div className="flex items-center gap-4 flex-wrap">
              <Label className="font-medium text-gray-700 whitespace-nowrap">Tarkastelujakso:</Label>
              <div className="flex items-center gap-2">
                <Input 
                  type="text" 
                  placeholder="PP.KK.VVVV" 
                  value={reviewPeriodStart}
                  onChange={(e) => setReviewPeriodStart(e.target.value)}
                  className="w-32"
                />
                <span className="text-gray-600">-</span>
                <Input 
                  type="text" 
                  placeholder="PP.KK.VVVV" 
                  value={reviewPeriodEnd}
                  onChange={(e) => setReviewPeriodEnd(e.target.value)}
                  className="w-32"
                />
              </div>
              <Button 
                onClick={handleCalculateTOE}
                variant="outline"
                className="whitespace-nowrap"
                disabled={isCalculatingTOE}
              >
                {isCalculatingTOE ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Ladataan...
                  </>
                ) : (
                  "Laske TOE"
                )}
              </Button>
              
            </div>
          </Card>
        )}

        {/* Palkkatuetun työn indikaattori - näytetään vasta laskennan jälkeen */}
        {hasCalculated && hasSubsidizedWork && (
          <div className="mb-4 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-r">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm text-amber-800">
                    <span className="font-medium">Haetut palkat sisältävät palkkatuettua työtä</span>
                  </p>
                </div>
              </div>
              <div className="ml-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="correction-mode" className="text-xs text-gray-600">
                    Manuaalinen
                  </Label>
                  <Switch
                    id="correction-mode"
                    checked={correctionMode === "manual"}
                    onCheckedChange={(checked) => setCorrectionMode(checked ? "manual" : "automatic")}
                  />
                </div>
                <Button 
                  onClick={() => setSubsidyDrawerOpen(true)}
                  variant="outline"
                  size="sm"
                >
                  Korjaa palkkatuen vaikutukset
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* TOE Yhteenveto - näytetään vasta laskennan jälkeen */}
        {hasCalculated && (
        <SummaryHeader
          summary={summary as any}
          definitionType={definitionType}
          setDefinitionType={(v: any) => setDefinitionType(v)}
          formatCurrency={formatCurrency}
            subsidyCorrection={subsidyCorrection}
            hasSubsidizedWork={hasSubsidizedWork}
            subsidizedEmployerName={subsidizedEmployerName}
        />
        )}

        {/* Suodata tulotietoja painike - näytetään vasta laskennan jälkeen */}
        {hasCalculated && (
        <div className="flex justify-end mb-4">
            <Link href="/massincomesplit" onClick={handleNavigateToMassIncomeSplit}>
            <Button className="bg-[#0e4c92] hover:bg-[#0d4383]">Suodata tulotietoja</Button>
          </Link>
        </div>
        )}

        {/* Periods Table - näytetään vasta laskennan jälkeen */}
        {hasCalculated && (
        <PeriodsTable
            periods={sortedFilteredPeriods}
          definitionType={definitionType as any}
          expandedPeriods={expandedPeriods}
          togglePeriod={togglePeriod}
          isViikkoTOEPeriod={isViikkoTOEPeriod}
          calculateTOEValue={calculateTOEValue}
          calculateEffectiveIncomeTotal={calculateEffectiveIncomeTotal}
          getVisibleRows={getVisibleRows}
          isRowDeleted={isRowDeleted}
          NON_BENEFIT_AFFECTING_INCOME_TYPES={NON_BENEFIT_AFFECTING_INCOME_TYPES}
          restoreIncomeType={restoreIncomeType}
          openAllocationModalSingle={openAllocationModalSingle}
          onOpenAllocationModalBatch={openAllocationModalBatch}
          includeIncomeInCalculation={includeIncomeInCalculation}
          deleteIncomeType={deleteIncomeType}
          openSplitModal={(periodId, rowId) => split.openSplitModal(periodId, rowId)}
          onShowSavedAllocation={(row) => {
                                                        const savedAllocation = row.allocationData;
                                                        if (savedAllocation) {
              allocation.setAllocationContext(savedAllocation.originalContext);
              allocation.setAllocationMethod(savedAllocation.allocationMethod);
              allocation.setStartDate(savedAllocation.startDate);
              allocation.setEndDate(savedAllocation.endDate);
              allocation.setDistributionType(savedAllocation.distributionType);
              allocation.setDirection(savedAllocation.direction);
              allocation.setMonthCount(savedAllocation.monthCount);
              allocation.setModalOpen(true);
              allocation.setViewMode(true);
            }
          }}
          onOpenAddIncome={() => addIncome.setOpen(true)}
          onViikkoTOESave={handleViikkoTOESave}
          onViikkoTOEDelete={handleViikkoTOEDelete}
          onViikkoTOEAdd={handleViikkoTOEAdd}
          onVähennysSummaChange={handleVähennysSummaChange}
          formatCurrency={formatCurrency}
          subsidyCorrection={subsidyCorrection}
        />
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="px-3 py-1 border rounded hover:bg-gray-100">←</button>
            <span className="text-sm">sivu 1/1</span>
            <button className="px-3 py-1 border rounded hover:bg-gray-100">→</button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Tulosten määrä</span>
            <Select defaultValue="12">
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12</SelectItem>
                <SelectItem value="24">24</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm">1-12/86</span>
          </div>
        </div>
      </div>

      {/* Split income modal */}
      <SplitIncomeDialog
        open={split.splitModalOpen}
        onOpenChange={(open) => { if (!open) split.closeSplitModal(); }}
        mode={split.splitMode}
        onModeChange={(m) => split.setSplitMode(m)}
        targetType={split.splitTargetType}
        onTargetTypeChange={(v) => split.setSplitTargetType(v)}
        value={split.splitValue}
        onValueChange={(v) => split.setSplitValue(v)}
        onApply={split.applySplit}
      />

      {/* Allocation Modal */}
      <AllocationDialog
        open={allocation.modalOpen}
        onOpenChange={(open: boolean) => { allocation.setModalOpen(open); if (!open) allocation.setViewMode(false); }}
        viewMode={allocation.viewMode}
        setViewMode={allocation.setViewMode}
        allocationContext={allocation.allocationContext}
        allocationMethod={allocation.allocationMethod}
        setAllocationMethod={allocation.setAllocationMethod}
        distributionType={allocation.distributionType}
        setDistributionType={allocation.setDistributionType}
        direction={allocation.direction}
        setDirection={allocation.setDirection}
        startDate={allocation.startDate}
        setStartDate={allocation.setStartDate}
        endDate={allocation.endDate}
        setEndDate={allocation.setEndDate}
        monthCount={allocation.monthCount}
        setMonthCount={allocation.setMonthCount}
        manualAmounts={allocation.manualAmounts}
        setManualAmounts={allocation.setManualAmounts}
        generateMonthsFromEmployment={allocation.generateMonthsFromEmployment}
        generateMonthsFromPayDate={allocation.generateMonthsFromPayDate}
        validation={allocation.validation}
        previewSplits={allocation.previewSplits}
        aggregatedByMonth={allocation.aggregatedByMonth}
        formatCurrency={formatCurrency}
        isoToFI={isoToFI}
        daysBetween={daysBetween}
        applyAllocation={allocation.applyAllocation}
        removeAllocation={allocation.removeAllocation}
        MOCK_EMPLOYMENT={MOCK_EMPLOYMENT}
      />

      {/* Add Income Modal */}
      <AddIncomeDialog
        open={addIncome.open}
        onOpenChange={addIncome.setOpen}
        filteredEmployments={addIncome.filteredEmployments}
        selectedEmploymentIds={addIncome.selectedEmploymentIds}
        toggleEmploymentSelection={addIncome.toggleEmploymentSelection}
        paymentDate={addIncome.paymentDate}
        setPaymentDate={addIncome.setPaymentDate}
        incomeType={addIncome.incomeType}
        setIncomeType={addIncome.setIncomeType}
        salaryAmount={addIncome.salaryAmount}
        setSalaryAmount={addIncome.setSalaryAmount}
        employmentStartDate={addIncome.employmentStartDate}
        setEmploymentStartDate={addIncome.setEmploymentStartDate}
        employmentEndDate={addIncome.employmentEndDate}
        setEmploymentEndDate={addIncome.setEmploymentEndDate}
        INCOME_TYPES={INCOME_TYPES}
        handleAddIncome={addIncome.handleAddIncome}
      />

      {/* Subsidized Work Drawer */}
      {hasCalculated && (
        <>
          {correctionMode === "automatic" ? (
            <SubsidizedWorkDrawer
              open={subsidyDrawerOpen}
              onOpenChange={setSubsidyDrawerOpen}
              rows={subsidizedRows}
              periods={sortedFilteredPeriods}
              toeSystemTotal={summary.totalTOEMonths}
              systemTotalSalary={summary.totalSalaryAllPeriods || summary.totalSalary}
              periodCount={summary.requiredPeriodsCount || sortedFilteredPeriods.length}
              totalExtendingDays={totalExtendingDays}
              reviewPeriodStart={reviewPeriodStart}
              reviewPeriodEnd={reviewPeriodEnd}
              calculateTOEValue={calculateTOEValue}
              calculateEffectiveIncomeTotal={calculateEffectiveIncomeTotal}
              onReviewPeriodChange={(start, end) => {
                setReviewPeriodStart(start || "");
                setReviewPeriodEnd(end);
                // Save to sessionStorage
                if (typeof window !== "undefined") {
                  if (start) {
                    sessionStorage.setItem("reviewPeriodStart", start);
                  } else {
                    sessionStorage.removeItem("reviewPeriodStart");
                  }
                  sessionStorage.setItem("reviewPeriodEnd", end);
                }
              }}
              onApplyCorrection={(correction) => {
                setSubsidyCorrection(correction);
                // Tallenna sessionStorageen pysyvyyttä varten
                if (typeof window !== "undefined") {
                  sessionStorage.setItem("subsidyCorrection", JSON.stringify(correction));
                }
                
                // Jos korjauksen jälkeen TOE >= 12kk, päivitä tarkastelujakso normaalisti
                if (correction.toeCorrectedTotal >= 12) {
                  // calculateTOECompletion käyttää jo subsidyCorrection statea, joten se päivittyy automaattisesti
                  // Tässä tapauksessa korjaus on jo asetettu, joten laskenta tapahtuu automaattisesti
                  // Ei tarvitse kutsua calculateTOECompletion uudelleen
                }
                // Jos TOE < 12kk, dialogi avataan SubsidizedWorkDrawer-komponentissa
              }}
              onExtendPeriod={handleExtendPeriod}
              estimateTOEWithExtending={estimateTOEWithExtending}
            />
          ) : (
            <ManualSubsidizedWorkDrawer
              open={subsidyDrawerOpen}
              onOpenChange={setSubsidyDrawerOpen}
              rows={subsidizedRows}
              periods={sortedFilteredPeriods}
              toeSystemTotal={summary.totalTOEMonths}
              systemTotalSalary={summary.totalSalaryAllPeriods || summary.totalSalary}
              periodCount={summary.requiredPeriodsCount || sortedFilteredPeriods.length}
              totalExtendingDays={totalExtendingDays}
              reviewPeriodStart={reviewPeriodStart}
              reviewPeriodEnd={reviewPeriodEnd}
              calculateTOEValue={calculateTOEValue}
              calculateEffectiveIncomeTotal={calculateEffectiveIncomeTotal}
              onReviewPeriodChange={(start, end) => {
                setReviewPeriodStart(start || "");
                setReviewPeriodEnd(end);
                // Save to sessionStorage
                if (typeof window !== "undefined") {
                  if (start) {
                    sessionStorage.setItem("reviewPeriodStart", start);
                  } else {
                    sessionStorage.removeItem("reviewPeriodStart");
                  }
                  sessionStorage.setItem("reviewPeriodEnd", end);
                }
              }}
              onApplyCorrection={(correction) => {
                setSubsidyCorrection(correction);
                // Tallenna sessionStorageen pysyvyyttä varten
                if (typeof window !== "undefined") {
                  sessionStorage.setItem("subsidyCorrection", JSON.stringify(correction));
                }
                
                // Jos korjauksen jälkeen TOE >= 12kk, päivitä tarkastelujakso normaalisti
                if (correction.toeCorrectedTotal >= 12) {
                  // calculateTOECompletion käyttää jo subsidyCorrection statea, joten se päivittyy automaattisesti
                  // Tässä tapauksessa korjaus on jo asetettu, joten laskenta tapahtuu automaattisesti
                  // Ei tarvitse kutsua calculateTOECompletion uudelleen
                }
              }}
              onExtendPeriod={handleExtendPeriod}
              estimateTOEWithExtending={estimateTOEWithExtending}
            />
          )}
        </>
      )}
    </div>
  );
}
