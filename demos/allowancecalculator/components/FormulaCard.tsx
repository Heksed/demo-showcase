// ===============================
// Component: Formula Card
// ===============================

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { FormulaConfig } from "../types";

interface FormulaCardProps {
  formulaConfig: FormulaConfig;
  editFormulas: boolean;
  setEditFormulas: (value: boolean) => void;
  setFormulaNumber: <K extends keyof FormulaConfig>(key: K) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  setFormulaInt: <K extends keyof FormulaConfig>(key: K) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  setFormulaPercent: (key: "statDeductions" | "rateBelow" | "rateAbove") => (e: React.ChangeEvent<HTMLInputElement>) => void;
  resetFormulaConfig: () => void;
  baseSalary: number;
  taxPct: number;
  memberFeePct: number;
  results: {
    days: number;
    periodDays?: number | null;
    stepFactor: number;
  };
  flags: {
    kulukorvaus: boolean;
    kulukorvausKorotus: boolean;
  };
}

export default function FormulaCard({
  formulaConfig,
  editFormulas,
  setEditFormulas,
  setFormulaNumber,
  setFormulaInt,
  setFormulaPercent,
  resetFormulaConfig,
  baseSalary,
  taxPct,
  memberFeePct,
  results,
  flags,
}: FormulaCardProps) {
  const formulaList = useMemo(() => {
    const cfg = formulaConfig;
    const pd = results.periodDays || 21.5;
    const splitDaily = cfg.splitPointMonth / pd;
    return [
      {
        key: "dailyWage",
        title: "Päiväpalkka",
        formula: `päiväpalkka = (kuukausipalkka × (1 − ${(cfg.statDeductions * 100).toFixed(2)}%)) / ${pd}`,
        explain: `Kuukausipalkka muunnetaan päiväkohtaiseksi. Vähennys ${(cfg.statDeductions * 100).toFixed(2)} %. Esimerkin arvoilla: ${(
          (baseSalary * (1 - cfg.statDeductions)) /
          pd
        ).toFixed(2)} €/pv.`,
      },
      {
        key: "earningsPart",
        title: "Ansio-osa",
        formula: `ansio-osa = ${(cfg.rateBelow * 100).toFixed(0)}% × max(0, min(päiväpalkka, ${splitDaily.toFixed(
          2
        )}) − ${cfg.dailyBase.toFixed(2)}) + ${(cfg.rateAbove * 100).toFixed(0)}% × max(0, päiväpalkka − ${splitDaily.toFixed(2)})`,
        explain: `Taitekohta kuukausitasolla on ${cfg.splitPointMonth.toFixed(2)} € (=${splitDaily.toFixed(
          2
        )} €/pv tällä jaksolla).`,
      },
      {
        key: "step",
        title: "Porrastus",
        formula: `kerroin = 1.0 / ${cfg.step1Threshold - 1}päivään asti, sitten ${cfg.step1Factor} (≥ ${cfg.step1Threshold} pv), ja ${cfg.step2Factor} (≥ ${cfg.step2Threshold} pv). Jaksolla keskiarvo = ${results.stepFactor.toFixed(2)}`,
        explain: `Kun etuutta on maksettu pitkään, ansio-osa pienenee porrastuksilla. Raja-arvot ja kertoimet ovat muokattavissa.`,
      },
      {
        key: "fullDaily",
        title: "Täysi päiväraha",
        formula: `täysi = perusosa (${cfg.dailyBase.toFixed(2)} €/pv) + ansio-osa`,
        explain: `Päiväraha ilman sovittelua. Lapsikorotus ei ole mukana.`,
      },
      {
        key: "reduction",
        title: "Vähennykset per päivä",
        formula: results.periodDays
          ? `Tulot (sovittelu): vähennys/pv = (tulot − suoja) × 50% / ${results.periodDays}\nEtuudet (suora): vähennys/pv = (etuudet − suoja) × 100% / ${results.periodDays}`
          : `ei vähennystä, koska sovittelujaksoa ei ole valittu`,
        explain: `Tulot sovitellaan 50 %:lla, vähentävät etuudet vähennetään täysimääräisesti (100 %). Suojaosa vähennetään ensin. Jos jaksoa ei ole, vähennystä ei tehdä.`,
      },
      {
        key: "adjusted",
        title: "Soviteltu päiväraha",
        formula: `soviteltu = max(0, min(täysi, täysi − vähennys/pv))`,
        explain: `Soviteltu ei voi olla negatiivinen tai ylittää täyttä päivärahaa.`,
      },
      {
        key: "gross",
        title: "Brutto jaksolta",
        formula: `brutto = soviteltu × täydet päivät (${results.days})`,
        explain: `Jakson maksettava bruttomäärä ennen vähennyksiä.`,
      },
      {
        key: "withholding",
        title: "Ennakonpidätys",
        formula: `ennakonpidätys = brutto × veroprosentti (${taxPct}%)`,
        explain: `Vähennetään verokortin mukaisella prosentilla.`,
      },
      {
        key: "memberFee",
        title: "Jäsenmaksu",
        formula: `jäsenmaksu = brutto × jäsenmaksu% (${memberFeePct}%)`,
        explain: `Mahdollinen kassan jäsenmaksu.`,
      },
      {
        key: "net",
        title: "Maksettava netto",
        formula: `netto = brutto − ennakonpidätys − jäsenmaksu`,
        explain: `Käteen jäävä summa vähennysten jälkeen.`,
      },
      {
        key: "travel",
        title: "Kulukorvaus (veroton)",
        formula: flags.kulukorvaus
          ? `kulukorvaus = ${flags.kulukorvausKorotus ? cfg.travelElevated : cfg.travelBase} €/pv × päivät (${results.days})`
          : `ei kulukorvausta`,
        explain: `Kulukorvaus on veroton lisä työllistymistä edistävien palvelujen ajalta. Korotusosa nostaa sen ${formulaConfig.travelElevated} €/pv.`,
      },
    ];
  }, [
    baseSalary,
    memberFeePct,
    results.days,
    results.periodDays,
    results.stepFactor,
    taxPct,
    flags.kulukorvaus,
    flags.kulukorvausKorotus,
    formulaConfig,
  ]);

  return (
    <div className="mt-2">
      <Card>
        <CardHeader>
          <CardTitle>Laskukaavat</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Switch checked={editFormulas} onCheckedChange={setEditFormulas} />
              <span className="text-sm text-gray-700">Muokkaa kaavoja käyttöliittymästä</span>
            </div>
            {editFormulas && (
              <Button variant="outline" onClick={resetFormulaConfig}>
                Palauta oletukset
              </Button>
            )}
          </div>

          {editFormulas && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                <div className="space-y-1 p-3 border rounded-xl bg-white">
                  <Label>Perusosa €/pv</Label>
                  <Input
                    type="number"
                    step={0.01}
                    value={formulaConfig.dailyBase}
                    onChange={setFormulaNumber("dailyBase")}
                  />
                </div>

                <div className="space-y-1 p-3 border rounded-xl bg-white">
                  <Label>Taitekohta €/kk</Label>
                  <Input
                    type="number"
                    step={0.01}
                    value={formulaConfig.splitPointMonth}
                    onChange={setFormulaNumber("splitPointMonth")}
                  />
                </div>

                <div className="space-y-1 p-3 border rounded-xl bg-white">
                  <Label>Tilastolliset vähennykset %</Label>
                  <Input
                    type="number"
                    step={0.01}
                    value={(formulaConfig.statDeductions * 100).toFixed(2)}
                    onChange={setFormulaPercent("statDeductions")}
                  />
                </div>

                <div className="space-y-1 p-3 border rounded-xl bg-white">
                  <Label>Ansio-osa alempi kerroin %</Label>
                  <Input
                    type="number"
                    step={1}
                    value={(formulaConfig.rateBelow * 100).toFixed(0)}
                    onChange={setFormulaPercent("rateBelow")}
                  />
                </div>

                <div className="space-y-1 p-3 border rounded-xl bg-white">
                  <Label>Ansio-osa ylempi kerroin %</Label>
                  <Input
                    type="number"
                    step={1}
                    value={(formulaConfig.rateAbove * 100).toFixed(0)}
                    onChange={setFormulaPercent("rateAbove")}
                  />
                </div>

                <div className="space-y-1 p-3 border rounded-xl bg-white">
                  <Label>Porrastusraja 1 (pv)</Label>
                  <Input
                    type="number"
                    step={1}
                    value={formulaConfig.step1Threshold}
                    onChange={setFormulaInt("step1Threshold")}
                  />
                </div>

                <div className="space-y-1 p-3 border rounded-xl bg-white">
                  <Label>Porrastuskerroin 1</Label>
                  <Input
                    type="number"
                    step={0.01}
                    value={formulaConfig.step1Factor}
                    onChange={setFormulaNumber("step1Factor")}
                  />
                </div>

                <div className="space-y-1 p-3 border rounded-xl bg-white">
                  <Label>Porrastusraja 2 (pv)</Label>
                  <Input
                    type="number"
                    step={1}
                    value={formulaConfig.step2Threshold}
                    onChange={setFormulaInt("step2Threshold")}
                  />
                </div>

                <div className="space-y-1 p-3 border rounded-xl bg-white">
                  <Label>Porrastuskerroin 2</Label>
                  <Input
                    type="number"
                    step={0.01}
                    value={formulaConfig.step2Factor}
                    onChange={setFormulaNumber("step2Factor")}
                  />
                </div>

                <div className="space-y-1 p-3 border rounded-xl bg-white">
                  <Label>Kulukorvaus €/pv</Label>
                  <Input
                    type="number"
                    step={1}
                    value={formulaConfig.travelBase}
                    onChange={setFormulaNumber("travelBase")}
                  />
                </div>

                <div className="space-y-1 p-3 border rounded-xl bg-white">
                  <Label>Kulukorvaus korotettuna €/pv</Label>
                  <Input
                    type="number"
                    step={1}
                    value={formulaConfig.travelElevated}
                    onChange={setFormulaNumber("travelElevated")}
                  />
                </div>
              </div>
            </>
          )}

          <ul className="space-y-4">
            {formulaList.map((f) => (
              <li key={f.key}>
                <div className="text-sm font-medium text-gray-800">{f.title}</div>
                <div className="font-mono text-xs bg-gray-50 border rounded-md px-2 py-1 inline-block mt-1">
                  {f.formula}
                </div>
                <p className="text-xs text-gray-600 mt-1">{f.explain}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

