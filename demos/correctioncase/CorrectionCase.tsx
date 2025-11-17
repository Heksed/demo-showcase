"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Send, CheckCircle2 } from "lucide-react";
import DailyBreakdownTable from "./components/DailyBreakdownTable";
import { createCorrectionCase } from "./utils";
import { 
  calculateCorrectedPeriods, 
  calculatePeriodDifferences 
} from "../correctionanalysis/utils";
import { MOCK_PAID_PERIODS } from "../benefitpayments/mockData";
import { MOCK_NEW_INCOME_DATA } from "../correctionanalysis/mockData";
import type { CorrectionCase } from "./types";
import { formatCurrency, formatDate } from "../benefitpayments/utils";

interface CorrectionCaseViewProps {
  caseId: string;
  analysisId?: string;
}

export default function CorrectionCaseView({ caseId, analysisId }: CorrectionCaseViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const analysisIdFromQuery = searchParams.get("analysisId");
  const effectiveAnalysisId = analysisId || analysisIdFromQuery || "";
  
  const [correctionCase, setCorrectionCase] = useState<CorrectionCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Hae korjausasian tiedot
    const loadCase = async () => {
      setIsLoading(true);
      
      // Laske korjausanalyysi (samalla tavalla kuin CorrectionAnalysis-sivulla)
      const affectedPeriods = MOCK_PAID_PERIODS.filter(p => 
        MOCK_NEW_INCOME_DATA.affectedPeriodIds.includes(p.id)
      );
      
      const correctedPeriods = calculateCorrectedPeriods(
        affectedPeriods,
        MOCK_NEW_INCOME_DATA.incomeRows
      );
      
      const periodDifferences = calculatePeriodDifferences(
        affectedPeriods,
        correctedPeriods
      );
      
      const totalRecoveryGross = periodDifferences.reduce(
        (sum, diff) => sum + (diff.grossDifference < 0 ? Math.abs(diff.grossDifference) : 0),
        0
      );
      const totalRecoveryNet = periodDifferences.reduce(
        (sum, diff) => sum + (diff.netDifference < 0 ? Math.abs(diff.netDifference) : 0),
        0
      );
      
      // Luoda mock analyysi korjausasian luomiseen
      const mockAnalysis = {
        id: effectiveAnalysisId || `analysis-${Date.now()}`,
        createdAt: new Date().toISOString(),
        triggerEvent: MOCK_NEW_INCOME_DATA,
        originalPeriods: affectedPeriods,
        correctedPeriods: correctedPeriods,
        periodDifferences: periodDifferences,
        totalRecoveryGross: totalRecoveryGross,
        totalRecoveryNet: totalRecoveryNet,
        affectedPeriodsCount: affectedPeriods.length,
        status: "approved" as const,
      };
      
      // Luo korjausasia analyysistä
      const caseData = createCorrectionCase(caseId, mockAnalysis);
      setCorrectionCase(caseData);
      setIsLoading(false);
    };
    
    loadCase();
  }, [caseId, effectiveAnalysisId]);

  const handleCreateHearingLetter = () => {
    // Navigoi modular formsiin korjausasian tiedoilla
    router.push(`/modularforms?correctionCaseId=${caseId}&mode=hearing_letter`);
  };

  if (isLoading || !correctionCase) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Ladataan korjausasiaa...</p>
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
            Korjausasia {correctionCase.caseNumber}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Luotu: {formatDate(correctionCase.createdAt)}
          </p>
        </div>
        
        <div className="flex gap-2">
          {correctionCase.status === "draft" && (
            <Button
              onClick={handleCreateHearingLetter}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Muodosta kuulemiskirje
            </Button>
          )}
          
          {correctionCase.status === "hearing_letter_sent" && (
            <Button variant="outline" className="flex items-center gap-2" disabled>
              <Send className="h-4 w-4" />
              Kuulemiskirje lähetetty
            </Button>
          )}
        </div>
      </div>

      {/* Yhteenveto */}
      <Card>
        <CardHeader>
          <CardTitle>Takaisinperintätiedot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Takaisinperintä (brutto)</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(correctionCase.totalRecoveryGross)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Takaisinperintä (netto)</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(correctionCase.totalRecoveryNet)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tila</p>
              <p className="text-lg font-medium">
                {correctionCase.status === "draft" && "Luonnos"}
                {correctionCase.status === "hearing_letter_sent" && "Kuulemiskirje lähetetty"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Päiväkohtainen erittely */}
      {correctionCase.recoveryAmounts.map((recovery) => (
        <Card key={recovery.periodId}>
          <CardHeader>
            <CardTitle>{recovery.periodLabel}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {formatDate(recovery.periodStart)} - {formatDate(recovery.periodEnd)}
            </p>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Takaisinperintä (brutto)</p>
                <p className="text-xl font-semibold text-red-600">
                  {formatCurrency(recovery.gross)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Takaisinperintä (netto)</p>
                <p className="text-xl font-semibold text-red-600">
                  {formatCurrency(recovery.net)}
                </p>
              </div>
            </div>
            
            {recovery.dailyBreakdown.length > 0 && (
              <DailyBreakdownTable breakdown={recovery.dailyBreakdown} />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

