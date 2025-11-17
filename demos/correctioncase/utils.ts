import type { CorrectionCase, RecoveryAmount, DailyBreakdown } from "./types";
import type { CorrectionAnalysis, PeriodDifference } from "../correctionanalysis/types";

/**
 * Muuntaa korjausanalyysin korjausasiaksi
 */
export function createCorrectionCase(
  caseId: string,
  analysis: CorrectionAnalysis
): CorrectionCase {
  // Muunna jaksokohtaiset erot takaisinperintätiedoiksi
  const recoveryAmounts: RecoveryAmount[] = analysis.periodDifferences
    .filter(diff => diff.grossDifference < 0) // Vain ne joissa on takaisinperintää
    .map(diff => {
      // Muunna päiväkohtaiset erot DailyBreakdown-muotoon
      const dailyBreakdown: DailyBreakdown[] = diff.dailyDifferences.map(dailyDiff => ({
        date: dailyDiff.date,
        dailyAllowance: dailyDiff.originalDaily,
        correctedDaily: dailyDiff.correctedDaily,
        difference: dailyDiff.difference,
        paid: dailyDiff.originalDaily, // Oletus: maksettu = päiväraha
        corrected: dailyDiff.correctedDaily,
      }));

      return {
        periodId: diff.periodId,
        periodLabel: diff.periodLabel,
        periodStart: diff.periodStart,
        periodEnd: diff.periodEnd,
        gross: Math.abs(diff.grossDifference), // Takaisinperintä = positiivinen
        net: Math.abs(diff.netDifference),
        dailyBreakdown: dailyBreakdown,
      };
    });

  // Laske yhteenvedot
  const totalRecoveryGross = recoveryAmounts.reduce((sum, r) => sum + r.gross, 0);
  const totalRecoveryNet = recoveryAmounts.reduce((sum, r) => sum + r.net, 0);

  // Generoi asianumero
  const year = new Date().getFullYear();
  const caseNumber = `KOR-${year}-${String(caseId.split('-').pop() || '000').slice(-3)}`;

  return {
    id: caseId,
    caseNumber: caseNumber,
    createdAt: new Date().toISOString(),
    analysisId: analysis.id,
    recoveryAmounts: recoveryAmounts,
    totalRecoveryGross: totalRecoveryGross,
    totalRecoveryNet: totalRecoveryNet,
    status: "draft",
  };
}

/**
 * Hakee korjausasian tiedot
 */
export async function getCorrectionCase(
  caseId: string,
  analysisId?: string
): Promise<CorrectionCase | null> {
  // Tässä oikeassa järjestelmässä haettaisiin tietokannasta
  // Tässä mock-datalla:
  
  if (!analysisId) {
    // Jos ei analysisId:tä, luodaan mock-data
    return null; // Tarvitaan analysisId
  }
  
  // Oikeassa järjestelmässä haettaisiin analysis ja luotaisiin case
  // Tässä palautetaan null ja luodaan CorrectionCaseView:ssa
  return null;
}

