"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import PeriodComparisonTable from "./components/PeriodComparisonTable";
import { 
  calculateCorrectedPeriods, 
  calculatePeriodDifferences,
  calculateCorrectedDailyPaymentRows 
} from "./utils";
import { MOCK_PAID_PERIODS } from "../benefitpayments/mockData";
import { MOCK_NEW_INCOME_DATA } from "./mockData";
import { MOCK_DAILY_PAYMENT_ROWS } from "../benefitpayments/mockData";
import { MOCK_PERIODS } from "../allocateincome/mockData";
import type { CorrectionAnalysis } from "./types";
import type { DailyPaymentRow } from "../benefitpayments/types";
import { formatCurrency } from "../benefitpayments/utils";

export default function CorrectionAnalysisView() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<CorrectionAnalysis | null>(null);
  const [isCalculating, setIsCalculating] = useState(true);

  useEffect(() => {
    // Simuloi korjausanalyysin laskenta
    // Käyttää SAMOJA alkutietoja kuin benefit payments -sivu
    const calculateAnalysis = async () => {
      setIsCalculating(true);
      
      // Käytä SAMOJA alkutietoja kuin benefit payments
      // Tämä varmistaa että korjausanalyysi käyttää samoja laskentatietoja
      const originalDailyRows = MOCK_DAILY_PAYMENT_ROWS; // Sama kuin benefit payments käyttää
      const originalPeriods = MOCK_PERIODS; // Sama kuin benefit payments käyttää
      
      // Laske TOE-periodit (tarvitaan perustepalkan laskentaan)
      // Käytä samaa logiikkaa kuin mockData.ts:ssä
      const toeCalculationPeriods = originalPeriods.filter(p => {
        const year = parseInt(p.id.split('-')[0]);
        const month = parseInt(p.id.split('-')[1]);
        // Use periods from 2025 that have TOE data (toe > 0 or has income data)
        // Sama logiikka kuin MOCK_DAILY_PAYMENT_ROWS laskennassa
        return year === 2025 && (p.toe > 0 || (p.rows && p.rows.length > 0 && p.rows.some(r => r.palkka > 0)));
      });
      
      // Laske korjatut DailyPaymentRow:t käyttäen oikeaa laskentalogiikkaa
      // Käytä joulukuun 2025 periodia (sama kuin maksutaulukossa)
      const affectedPeriodIds: string[] = [];
      
      // Etsi mitkä periodit vaikuttuvat
      MOCK_NEW_INCOME_DATA.incomeRows.forEach(income => {
        // Parsee maksupäivän period ID:ksi (esim. "10.12.2025" -> "2025-12")
        const payDateParts = income.maksupaiva.split('.');
        const periodId = `${payDateParts[2]}-${payDateParts[1].padStart(2, '0')}`;
        
        if (!affectedPeriodIds.includes(periodId)) {
          affectedPeriodIds.push(periodId);
        }
      });
      
      // Laske korjatut rivit joulukuun 2025 periodille (sama kuin maksutaulukossa)
      const correctedDailyRows = affectedPeriodIds.length > 0
        ? calculateCorrectedDailyPaymentRows(
            originalDailyRows,
            originalPeriods,
            toeCalculationPeriods,
            MOCK_NEW_INCOME_DATA.incomeRows,
            "2025-12" // Joulukuu 2025 (sama kuin maksutaulukko)
          )
        : originalDailyRows;
      
      // Hae vaikuttuneet jaksot (PaidBenefitPeriod-tyyppi legacy-tueksi)
      const affectedPeriods = MOCK_PAID_PERIODS.filter(p => 
        MOCK_NEW_INCOME_DATA.affectedPeriodIds.includes(p.id)
      );
      
      // Laske korjatut PaidBenefitPeriod:t (legacy-tueksi vertailutaulukkoon)
      const correctedPeriods = calculateCorrectedPeriods(
        affectedPeriods,
        MOCK_NEW_INCOME_DATA.incomeRows
      );
      
      // Laske erot
      const periodDifferences = calculatePeriodDifferences(
        affectedPeriods,
        correctedPeriods
      );
      
      // Laske yhteenvedot DailyPaymentRow:ista
      const originalGross = originalDailyRows.reduce((sum, row) => sum + row.gross, 0);
      const correctedGross = correctedDailyRows.reduce((sum, row) => sum + row.gross, 0);
      const originalNet = originalDailyRows.reduce((sum, row) => sum + row.net, 0);
      const correctedNet = correctedDailyRows.reduce((sum, row) => sum + row.net, 0);
      
      // Takaisinperintä = jos maksettiin liikaa (originalGross > correctedGross)
      // Suurempi tulo = suurempi tulosovittelu = pienempi päiväraha = maksettiin liikaa = takaisinperintä
      const totalRecoveryGross = originalGross > correctedGross ? originalGross - correctedGross : 0;
      const totalRecoveryNet = originalNet > correctedNet ? originalNet - correctedNet : 0;
      
      const newAnalysis: CorrectionAnalysis = {
        id: `analysis-${Date.now()}`,
        createdAt: new Date().toISOString(),
        triggerEvent: MOCK_NEW_INCOME_DATA,
        originalPeriods: affectedPeriods,
        correctedPeriods: correctedPeriods,
        periodDifferences: periodDifferences,
        totalRecoveryGross: totalRecoveryGross,
        totalRecoveryNet: totalRecoveryNet,
        affectedPeriodsCount: affectedPeriodIds.length,
        status: "pending",
      };
      
      setAnalysis(newAnalysis);
      setIsCalculating(false);
    };
    
    calculateAnalysis();
  }, []);

  const handleApprove = () => {
    if (!analysis) return;
    
    // Luoda korjausasia ja navigoida sinne
    const caseId = `case-${Date.now()}`;
    router.push(`/correctioncase/${caseId}?analysisId=${analysis.id}`);
  };

  const handleReject = () => {
    // Palaa takaisin maksutaulukkoon
    router.push("/benefitpayments");
  };

  if (isCalculating || !analysis) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Lasketaan korjausanalyysia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Korjausanalyysi
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Luotu: {new Date(analysis.createdAt).toLocaleString("fi-FI")}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReject}
            className="flex items-center gap-2"
          >
            <XCircle className="h-4 w-4" />
            Hylkää
          </Button>
          
          <Button
            onClick={handleApprove}
            className="flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Hyväksy korjaus ja luo korjausasia
          </Button>
        </div>
      </div>

      {/* Varoitus */}
      {analysis.totalRecoveryGross > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-900">
                  Takaisinperintää vaaditaan
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Yhteensä takaisinperintää: {formatCurrency(analysis.totalRecoveryGross)} (brutto)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Yhteenveto */}
      <Card>
        <CardHeader>
          <CardTitle>Yhteenveto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Vaikuttuneita jaksoja</p>
              <p className="text-2xl font-bold">{analysis.affectedPeriodsCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Takaisinperintä (brutto)</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(analysis.totalRecoveryGross)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Takaisinperintä (netto)</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(analysis.totalRecoveryNet)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tila</p>
              <p className="text-lg font-medium">
                {analysis.status === "pending" && "Odottaa hyväksyntää"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vertailutaulukko */}
      <PeriodComparisonTable differences={analysis.periodDifferences} />
      
      {/* Uuden tulotiedon tiedot */}
      <Card>
        <CardHeader>
          <CardTitle>Uusi tulotieto tulorekisteristä</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-2">
            {analysis.triggerEvent.description}
          </p>
          <p className="text-xs text-gray-500">
            Saatu: {new Date(analysis.triggerEvent.receivedDate).toLocaleString("fi-FI")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

