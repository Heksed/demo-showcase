"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { RefreshCw, AlertCircle, Download } from "lucide-react";
import DailyPaymentTable from "./components/DailyPaymentTable";
import PaymentSummary from "./components/PaymentSummary";
import { MOCK_DAILY_PAYMENT_ROWS } from "./mockData";
import { calculateSummary } from "./utils/calculatePayments";
import { MOCK_PERIODS } from "../allocateincome/mockData";
import { calculateCorrectedPaymentRows, comparePaymentRows } from "./utils/correctionCalculator";
import type { DailyPaymentRow, PaymentSummary as PaymentSummaryType } from "./types";
import type { IncomeRow } from "../allocateincome/types";
import { formatCurrency } from "./utils";

export default function PaymentHistory() {
  const router = useRouter();
  
  // Alkuperäiset maksutiedot (säilytetään)
  const [originalRows, setOriginalRows] = useState<DailyPaymentRow[]>(MOCK_DAILY_PAYMENT_ROWS);
  
  // Nykyiset maksutiedot (voi olla korjatut jos on uusia tuloja)
  const [dailyRows, setDailyRows] = useState<DailyPaymentRow[]>(MOCK_DAILY_PAYMENT_ROWS);
  
  // Allocateincome-periodit (voivat muuttua uusilla tuloilla)
  const [periods, setPeriods] = useState(MOCK_PERIODS);
  
  const [hasNewIncomeData, setHasNewIncomeData] = useState(false);
  const [newIncomeData, setNewIncomeData] = useState<IncomeRow[] | null>(null);

  // Calculate summary from daily rows
  const summary = useMemo<PaymentSummaryType>(() => {
    return calculateSummary(dailyRows);
  }, [dailyRows]);

  // Laske vertailu jos on uusia tuloja
  const comparison = useMemo(() => {
    if (!hasNewIncomeData || !newIncomeData || !originalRows.length) return null;
    
    return comparePaymentRows(originalRows, dailyRows);
  }, [hasNewIncomeData, newIncomeData, originalRows, dailyRows]);

  // Simuloi uuden tulotiedon haun tulorekisteristä
  const handleFetchNewIncomeFromRegister = () => {
    // Simuloi että tulorekisteristä tulee uusia/muuttuneita tietoja
    // Esimerkki: joulukuussa oli suurempi palkka kuin alun perin ilmoitettiin
    const simulatedNewIncome: IncomeRow = {
      id: `new-${Date.now()}`,
      maksupaiva: "10.12.2025",
      tulolaji: "Aikapalkka",
      palkka: 2900, // UUSI suurempi summa (ennen oli 2100)
      alkuperainenTulo: 2900,
      ansaintaAika: "1.12.2025 - 31.12.2025",
      tyonantaja: "Posti Oyj",
    };
    
    setNewIncomeData([simulatedNewIncome]);
    
    // Laske TOE-periodit (tarvitaan perustepalkan laskentaan)
    const toeCalculationPeriods = MOCK_PERIODS.filter(p => {
      const year = parseInt(p.id.split('-')[0]);
      return year === 2025 && (p.toe > 0 || p.rows.some(r => r.palkka > 0));
    });
    
    // Laske korjatut maksurivit uusilla tuloilla
    // Käytetään joulukuun 2025 periodia (sama kuin maksutaulukossa)
    const correctedRows = calculateCorrectedPaymentRows(
      originalRows,
      periods,
      toeCalculationPeriods,
      [simulatedNewIncome],
      "2025-12" // Joulukuu 2025 (sama kuin maksutaulukko)
    );
    
    // Päivitä maksurivit
    setDailyRows(correctedRows);
    
    // Päivitä allocateincome-periodit
    const updatedPeriods = periods.map(p => {
      if (p.id === "2025-12") {
        // Korvaa olemassa oleva Aikapalkka-rivi uudella
        const updatedRows = p.rows.map(row => 
          row.maksupaiva === simulatedNewIncome.maksupaiva && 
          row.tulolaji === simulatedNewIncome.tulolaji &&
          row.tyonantaja === simulatedNewIncome.tyonantaja
            ? simulatedNewIncome
            : row
        );
        return {
          ...p,
          rows: updatedRows,
          palkka: updatedRows.reduce((sum, r) => {
            // Poista poistetut rivit ja ei-etuuteen vaikuttavat tyypit (jos ei merkitty huomioituksi)
            const isDeleted = r.huom?.toLowerCase().includes("poistettu");
            const nonAffectingTypes = ["Kokouspalkkio", "Luentopalkkio"];
            const isNonAffecting = nonAffectingTypes.includes(r.tulolaji);
            const isIncluded = r.huom?.includes("Huomioitu laskennassa");
            
            if (isDeleted) return sum;
            if (isNonAffecting && !isIncluded) return sum;
            
            return sum + r.palkka;
          }, 0),
        };
      }
      return p;
    });
    setPeriods(updatedPeriods);
    
    setHasNewIncomeData(true);
    
    // Navigoi korjausanalyysiin (siellä lasketaan tarkemmat erot)
    router.push("/correctionanalysis");
  };

  // Handle action clicks from table
  const handleActionClick = (rowId: string, action: string) => {
    console.log("Action clicked:", { rowId, action });
    // TODO: Implement action handling (temporary decision, recovery decision, delete)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Maksetut etuusjaksot
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Yhteensä maksettu: {formatCurrency(summary.totalGross)} (brutto)
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleFetchNewIncomeFromRegister}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Hae uusi tulotieto tulorekisteristä
          </Button>
          
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Vie tiedot
          </Button>
        </div>
      </div>

      {/* Varoitus jos on uusia tietoja */}
      {hasNewIncomeData && comparison && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div className="flex-1">
                <p className="font-medium text-amber-900">
                  Uusi tulotieto haettu tulorekisteristä
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  Maksutaulukko päivittynyt. Takaisinperintää: {formatCurrency(comparison.totalRecoveryGross)} (brutto)
                </p>
                {comparison.totalRecoveryGross > 0 && (
                  <p className="text-sm text-red-700 mt-1 font-medium">
                    Tarkista korjausanalyysi ja luo korjausasia tarvittaessa.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Päiväkohtainen maksutaulukko */}
      <DailyPaymentTable rows={dailyRows} onActionClick={handleActionClick} />

      {/* Yhteenveto */}
      <PaymentSummary summary={summary} />
    </div>
  );
}

