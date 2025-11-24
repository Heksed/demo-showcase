"use client";

import { useCallback, useEffect, useState } from "react";
import type { MonthPeriod } from "../types";
type DefinitionType = 'eurotoe' | 'eurotoe6' | 'viikkotoe' | 'vuositulo' | 'ulkomaan';
import { MOCK_PERIODS } from "../mockData";

export default function usePeriodsModel(definitionType: DefinitionType) {
  const [periods, setPeriods] = useState<MonthPeriod[]>(() => {
    // Palauta kaikki periodsit, filtteröinti tehdään tarkastelujakson mukaan Allocateincome-komponentissa
    if (definitionType === 'viikkotoe') {
      // Viikkotoe tarvitsee erityiskäsittelyn
      return MOCK_PERIODS;
    }
    // Muille tyypeille (eurotoe, eurotoe6, vuositulo, ulkomaan) palauta kaikki periodsit
    return MOCK_PERIODS;
  });

  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set(["2025-12", "viikkotoe-combined"]));

  const togglePeriod = useCallback((periodId: string) => {
    setExpandedPeriods(prev => {
      const next = new Set(prev);
      if (next.has(periodId)) next.delete(periodId); else next.add(periodId);
      return next;
    });
  }, []);

  const isViikkoTOEPeriod = useCallback((period: MonthPeriod): boolean => {
    const parts = period.ajanjakso.split(' ');
    const year = parts[0];
    const monthName = parts[1];
    const monthMap: { [key: string]: string } = {
      'Tammikuu': '01', 'Helmikuu': '02', 'Maaliskuu': '03', 'Huhtikuu': '04',
      'Toukokuu': '05', 'Kesäkuu': '06', 'Heinäkuu': '07', 'Elokuu': '08',
      'Syyskuu': '09', 'Lokakuu': '10', 'Marraskuu': '11', 'Joulukuu': '12'
    };
    const monthNumber = monthMap[monthName];
    if (!monthNumber) return false;
    const periodDate = new Date(`${year}-${monthNumber}-01`);
    const viikkoTOEStart = new Date('2024-05-01');
    const viikkoTOEEnd = new Date('2024-08-31');
    return periodDate >= viikkoTOEStart && periodDate <= viikkoTOEEnd;
  }, []);

  useEffect(() => {
    if (definitionType === 'viikkotoe') {
      const viikkoTOEPeriods = MOCK_PERIODS.filter(p => isViikkoTOEPeriod(p));
      const euroTOEPeriods2025 = MOCK_PERIODS.filter(p => p.id.startsWith('2025-'));
      const euroTOEPeriods2024After = MOCK_PERIODS.filter(p => p.id.startsWith('2024-') && !isViikkoTOEPeriod(p) && p.id >= '2024-09');

      // Convert ViikkoTOE weeks to EuroTOE months with official logic
      const convertToEuroTOEMonths = (viikkoTOEWeeks: number): number => {
        // Virallinen muunnos: 2 viikkoa = 0.5 kuukautta
        // Pyöristä lähimpään 0.5:een
        return Math.round(viikkoTOEWeeks / 2) * 0.5;
      };

      const totalViikkoTOEWeeks = viikkoTOEPeriods.flatMap(p => p.viikkoTOERows || []).reduce((sum, row) => sum + row.toeViikot, 0);

      const combinedViikkoTOE: MonthPeriod = {
        id: "viikkotoe-combined",
        ajanjakso: "ViikkoTOE-aika (2024-05 - 2024-08)",
        toe: convertToEuroTOEMonths(totalViikkoTOEWeeks),
        jakaja: viikkoTOEPeriods.flatMap(p => p.viikkoTOERows || []).reduce((sum, row) => sum + row.jakaja, 0),
        palkka: viikkoTOEPeriods.flatMap(p => p.viikkoTOERows || []).reduce((sum, row) => sum + row.palkka, 0),
        tyonantajat: [...new Set(viikkoTOEPeriods.map(p => p.tyonantajat))].join(", "),
        pidennettavatJaksot: 0,
        rows: [],
        viikkoTOERows: viikkoTOEPeriods.flatMap(p => p.viikkoTOERows || []),
      } as MonthPeriod;

      setPeriods([...euroTOEPeriods2025, ...euroTOEPeriods2024After, combinedViikkoTOE]);
    } else {
      // EuroTOE, EuroTOE6, vuositulo, ulkomaan: palauta kaikki periodsit (2023-2025)
      // Filtteröinti tehdään tarkastelujakson mukaan Allocateincome-komponentissa
      setPeriods(MOCK_PERIODS);
    }
  }, [definitionType, isViikkoTOEPeriod]);

  return { periods, setPeriods, expandedPeriods, togglePeriod, isViikkoTOEPeriod };
}


