import type { MonthPeriod } from "../../allocateincome/types";
import type { IncomeRow } from "../../allocateincome/types";

/**
 * Simuloi uusien tulotietojen lisääminen allocateincome-periodiin
 * Tämä muuttaa periodin tuloja, mikä vaikuttaa päivärahan laskentaan
 * 
 * Jos periodissa on jo sama tyyppinen tulo samalta maksupäivältä, korvataan se
 * Muuten lisätään uusi tulo
 */
export function simulateNewIncomeFromRegister(
  periods: MonthPeriod[],
  periodId: string,
  newIncomeRow: IncomeRow
): MonthPeriod[] {
  return periods.map((period) => {
    if (period.id !== periodId) return period;
    
    // Etsi onko jo olemassa samanlainen tulo (sama maksupäivä ja tyyppi)
    // Jos on, korvataan se uudella. Muuten lisätään uusi.
    const existingIndex = period.rows.findIndex(row => 
      row.maksupaiva === newIncomeRow.maksupaiva && 
      row.tulolaji === newIncomeRow.tulolaji &&
      row.tyonantaja === newIncomeRow.tyonantaja
    );
    
    let updatedRows: IncomeRow[];
    if (existingIndex >= 0) {
      // Korvaa olemassa oleva tulo
      updatedRows = [...period.rows];
      updatedRows[existingIndex] = newIncomeRow;
    } else {
      // Lisää uusi tulo
      updatedRows = [...period.rows, newIncomeRow];
    }
    
    // Päivitä periodin palkka (effective income total)
    // Tämä on yksinkertaistettu - oikeassa järjestelmässä käytettäisiin calculateEffectiveIncomeTotal
    const totalSalary = updatedRows.reduce((sum, row) => {
      // Poista poistetut rivit ja ei-etuuteen vaikuttavat tyypit (jos ei merkitty huomioituksi)
      const isDeleted = row.huom?.toLowerCase().includes("poistettu");
      const nonAffectingTypes = ["Kokouspalkkio", "Luentopalkkio"];
      const isNonAffecting = nonAffectingTypes.includes(row.tulolaji);
      const isIncluded = row.huom?.includes("Huomioitu laskennassa");
      
      if (isDeleted) return sum;
      if (isNonAffecting && !isIncluded) return sum;
      
      return sum + row.palkka;
    }, 0);
    
    return {
      ...period,
      rows: updatedRows,
      palkka: totalSalary, // Päivitä periodin palkka
    };
  });
}

/**
 * Vertaa vanhoja ja uusia maksurivejä
 */
export function comparePaymentRows(
  originalRows: any[],
  updatedRows: any[]
): {
  totalGrossDifference: number;
  totalNetDifference: number;
  rowsChanged: number;
} {
  const originalGross = originalRows.reduce((sum, row) => sum + row.gross, 0);
  const updatedGross = updatedRows.reduce((sum, row) => sum + row.gross, 0);
  const originalNet = originalRows.reduce((sum, row) => sum + row.net, 0);
  const updatedNet = updatedRows.reduce((sum, row) => sum + row.net, 0);
  
  return {
    totalGrossDifference: updatedGross - originalGross, // Negatiivinen = takaisinperintä
    totalNetDifference: updatedNet - originalNet,
    rowsChanged: originalRows.length !== updatedRows.length ? 1 : 0,
  };
}

