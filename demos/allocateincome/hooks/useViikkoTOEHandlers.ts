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
        const newToe = updatedViikkoRows.reduce((sum, row) => sum + (row.toeViikot / 4.33), 0);
        return {
          ...period,
          viikkoTOERows: updatedViikkoRows,
          palkka: newPalkka,
          toe: newToe,
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
          const newToe = updatedViikkoRows.reduce((sum, row) => sum + (row.toeViikot / 4.33), 0);
          return {
            ...period,
            viikkoTOERows: updatedViikkoRows,
            palkka: newPalkka,
            toe: newToe,
          };
        }
        return period;
      }));
    }
  };

  return { handleViikkoTOESave, handleViikkoTOEDelete };
}


