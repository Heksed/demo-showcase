// ===============================
// Component: Benefits and Incomes Card
// ===============================

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { DevField } from "@/components/DevField";
import type { BenefitRow, IncomeRow } from "../types";
import { INCOME_OPTIONS, BENEFIT_CATALOG } from "../constants";

interface BenefitsAndIncomesCardProps {
  benefits: BenefitRow[];
  setBenefits: React.Dispatch<React.SetStateAction<BenefitRow[]>>;
  incomes: IncomeRow[];
  setIncomes: React.Dispatch<React.SetStateAction<IncomeRow[]>>;
  addBenefitRow: () => void;
  removeBenefitRow: (id: string) => void;
  addIncomeRow: () => void;
  removeIncomeRow: (id: string) => void;
}

export default function BenefitsAndIncomesCard({
  benefits,
  setBenefits,
  incomes,
  setIncomes,
  addBenefitRow,
  removeBenefitRow,
  addIncomeRow,
  removeIncomeRow,
}: BenefitsAndIncomesCardProps) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Etuudet ja Tulot</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addBenefitRow}>
            <Plus className="h-4 w-4" /> Lisää etuus
          </Button>
          <Button variant="outline" size="sm" onClick={addIncomeRow}>
            <Plus className="h-4 w-4" /> Lisää tulo
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4">
        {/* TULOT (SOVITTELU) */}
        {incomes.map((i) => (
          <div
            key={i.id}
            className="grid grid-cols-1 md:grid-cols-12 items-end gap-3 p-3 rounded-xl border bg-white"
          >
            <div className="md:col-span-5 space-y-2">
              <Label>Tulon tyyppi</Label>
              <Select
                value={i.type}
                onValueChange={(v) =>
                  setIncomes((prev) =>
                    prev.map((x) => (x.id === i.id ? { ...x, type: v as IncomeRow["type"] } : x))
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ei tuloja" />
                </SelectTrigger>
                <SelectContent>
                  {INCOME_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-5 space-y-2">
              <Label>Tulot jaksolla (€)</Label>
              <DevField
                fieldId={`income-amount-${i.id}`}
                fieldLabel="Tulot jaksolla (Income Amount)"
                userStory="User enters the income amount received during the benefit period. This income will reduce the daily allowance through income adjustment."
                business="Income during the benefit period reduces the allowance. The system applies protected income rules and adjustment percentages based on the income type."
                formula="adjustment = max(0, (income - protectedIncome) × adjustmentPct)"
                code={`const protectedAmount = protectedIncome * (incomeDays / periodDays);
const adjustmentBase = Math.max(0, income - protectedAmount);
const reduction = adjustmentBase * adjustmentPct;
const dailyAllowanceAfterIncome = dailyAllowance - (reduction / incomeDays);`}
                example="If income = 500€, protected = 300€, adjustment = 50%: reduction = (500-300) × 0.5 = 100€"
              >
                <Input
                  type="number"
                  step={0.01}
                  value={i.amount}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value || "0");
                    setIncomes((prev) =>
                      prev.map((x) => (x.id === i.id ? { ...x, amount: v } : x))
                    );
                  }}
                  disabled={i.type === "none"}
                />
              </DevField>
            </div>

            <div className="md:col-span-2 flex justify-end">
              <Button variant="ghost" size="icon" onClick={() => removeIncomeRow(i.id)}>
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        ))}

        {/* ETUUDET (VÄHENTÄVÄT, EIVÄT KÄYNNISTÄ SOVITTELUA) */}
        {benefits.map((b) => (
          <div
            key={b.id}
            className="grid grid-cols-1 md:grid-cols-12 items-end gap-3 p-3 rounded-xl border bg-white"
          >
            <div className="md:col-span-5 space-y-2">
              <Label>Etuus (vähentävä)</Label>
              <Select
                value={b.name}
                onValueChange={(v) => {
                  setBenefits((prev) =>
                    prev.map((x) => (x.id === b.id ? { ...x, name: v } : x))
                  );
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Valitse etuus" />
                </SelectTrigger>
                <SelectContent>
                  {BENEFIT_CATALOG.map((opt) => (
                    <SelectItem key={opt.value} value={opt.label}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3 space-y-2">
              <Label>Määrä jaksolla (€)</Label>
              <DevField
                fieldId={`benefit-amount-${b.id}`}
                fieldLabel="Etuuden määrä (Benefit Amount)"
                userStory="User enters the amount of other benefits (e.g., parental allowance, sickness benefit) received during the period. This reduces unemployment allowance."
                business="Other social security benefits reduce unemployment allowance. The reduction is calculated after protected amount is subtracted."
                formula="reduction = (benefitAmount - protectedAmount) / days"
                code={`let totalBenefitReduction = 0;
for (const ben of benefits) {
  const excess = Math.max(ben.amount - (ben.protectedAmount || 0), 0);
  totalBenefitReduction += excess / days;
}
adjustedDaily = fullDaily - totalBenefitReduction;`}
                example="If benefit = 800€, protected = 300€, days = 20: reduction = (800-300) / 20 = 25€/day"
              >
                <Input
                  type="number"
                  step={0.01}
                  value={b.amount}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value || "0");
                    setBenefits((prev) =>
                      prev.map((x) => (x.id === b.id ? { ...x, amount: v } : x))
                    );
                  }}
                />
              </DevField>
            </div>

            <div className="md:col-span-3 space-y-2">
              <Label>Suojaosa (€)</Label>
              <DevField
                fieldId={`benefit-protected-${b.id}`}
                fieldLabel="Suojaosa (Protected Amount)"
                userStory="User sets the protected amount of the benefit that doesn't reduce unemployment allowance. Amount above this is deducted."
                business="Protected amount allows receiving a certain amount of other benefits without reduction. Only the excess amount reduces unemployment allowance."
                formula="excessBenefit = max(0, benefitAmount - protectedAmount)"
                code={`const excess = Math.max(ben.amount - (ben.protectedAmount || 0), 0);
const reduction = excess / days;`}
                example="If benefit = 800€ and protected = 300€: only (800-300) = 500€ reduces allowance."
              >
                <Input
                  type="number"
                  step={0.01}
                  value={b.protectedAmount || 0}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value || "0");
                    setBenefits((prev) =>
                      prev.map((x) => (x.id === b.id ? { ...x, protectedAmount: v } : x))
                    );
                  }}
                />
              </DevField>
            </div>

            <div className="md:col-span-1 flex justify-end">
              <Button variant="ghost" size="icon" onClick={() => removeBenefitRow(b.id)}>
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

