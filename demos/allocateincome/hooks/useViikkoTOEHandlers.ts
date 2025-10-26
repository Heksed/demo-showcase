import type { MonthPeriod, ViikkoTOERow } from "../types";

export default function useViikkoTOEHandlers(
  setPeriods: React.Dispatch<React.SetStateAction<MonthPeriod[]>>
) {
  const handleViikkoTOESave = (periodId: string, rowId: string, updatedRow: ViikkoTOERow) => {
    setPeriods(prev => prev.map(period => {
      if (period.id === periodId) {
        const updatedViikkoRows = (period.viikkoTOERows || []).map(row =>
          row.id === rowId ? updatedRow : row
        );
        const newPalkka = updatedViikkoRows.reduce((sum, row) => sum + row.palkka, 0);
        // Fix: Use official conversion formula instead of / 4.33
        const totalViikkoTOEWeeks = updatedViikkoRows.reduce((sum, row) => sum + row.toeViikot, 0);
        const newToe = Math.round(totalViikkoTOEWeeks / 2) * 0.5;
        // Calculate jakaja as sum of all jakaja values
        const newJakaja = updatedViikkoRows.reduce((sum, row) => sum + row.jakaja, 0);
        return {
          ...period,
          viikkoTOERows: updatedViikkoRows,
          palkka: newPalkka,
          toe: newToe,
          jakaja: newJakaja,
        };
      }
      return period;
    }));
  };

  const handleViikkoTOEDelete = (periodId: string, rowId: string) => {
    if (confirm('Haluatko varmasti poistaa tämän rivin?')) {
      setPeriods(prev => prev.map(period => {
        if (period.id === periodId) {
          const updatedViikkoRows = (period.viikkoTOERows || []).filter(row => row.id !== rowId);
          const newPalkka = updatedViikkoRows.reduce((sum, row) => sum + row.palkka, 0);
          // Fix: Use official conversion formula instead of / 4.33
          const totalViikkoTOEWeeks = updatedViikkoRows.reduce((sum, row) => sum + row.toeViikot, 0);
          const newToe = Math.round(totalViikkoTOEWeeks / 2) * 0.5;
          // Calculate jakaja as sum of all jakaja values
          const newJakaja = updatedViikkoRows.reduce((sum, row) => sum + row.jakaja, 0);
          return {
            ...period,
            viikkoTOERows: updatedViikkoRows,
            palkka: newPalkka,
            toe: newToe,
            jakaja: newJakaja,
          };
        }
        return period;
      }));
    }
  };

  const handleViikkoTOEAdd = (periodId: string, newRowData: any) => {
    const rowId = `v${periodId}-${Date.now()}`;
    const fullRow: ViikkoTOERow = {
      id: rowId,
      alkupäivä: newRowData.alkupäivä || "",
      loppupäivä: newRowData.loppupäivä || "",
      työnantaja: newRowData.työnantaja || "",
      lisäteksti: newRowData.lisäteksti || "",
      selite: "Muokattu rivi",
      palkka: newRowData.vähennäTOE || 0,
      toeViikot: newRowData.toeViikot || 1,
      jakaja: newRowData.jakaja || 5,
      toeTunnit: 18,
      tunnitYhteensä: newRowData.tunnitYhteensä || 18,
    };
    
    setPeriods(prev => prev.map(period => {
      if (period.id === periodId) {
        const updatedViikkoRows = [...(period.viikkoTOERows || []), fullRow];
        const newPalkka = updatedViikkoRows.reduce((sum, row) => sum + row.palkka, 0);
        const totalViikkoTOEWeeks = updatedViikkoRows.reduce((sum, row) => sum + row.toeViikot, 0);
        const newToe = Math.round(totalViikkoTOEWeeks / 2) * 0.5;
        // Calculate jakaja as sum of all jakaja values
        const newJakaja = updatedViikkoRows.reduce((sum, row) => sum + row.jakaja, 0);
        return {
          ...period,
          viikkoTOERows: updatedViikkoRows,
          palkka: newPalkka,
          toe: newToe,
          jakaja: newJakaja,
        };
      }
      return period;
    }));
  };

  return { handleViikkoTOESave, handleViikkoTOEDelete, handleViikkoTOEAdd };
}


