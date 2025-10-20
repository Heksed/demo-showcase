"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "amount" | "percent";
  onModeChange: (mode: "amount" | "percent") => void;
  targetType: string;
  onTargetTypeChange: (value: string) => void;
  value: number;
  onValueChange: (value: number) => void;
  onApply: () => void;
};

export default function SplitIncomeDialog({
  open,
  onOpenChange,
  mode,
  onModeChange,
  targetType,
  onTargetTypeChange,
  value,
  onValueChange,
  onApply,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Jaa tulolaji</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <Label>Jaon tapa</Label>
          <Select value={mode} onValueChange={(v) => onModeChange(v as "amount" | "percent")}>
            <SelectTrigger>
              <SelectValue placeholder="Valitse" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="amount">Euromääräisesti</SelectItem>
              <SelectItem value="percent">Prosentuaalisesti</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Kohdetulolaji</Label>
          <Select value={targetType} onValueChange={onTargetTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Valitse tulolaji" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Aikapalkka">Aikapalkka</SelectItem>
              <SelectItem value="Lomaraha">Lomaraha</SelectItem>
              <SelectItem value="Tulospalkka">Tulospalkka</SelectItem>
              <SelectItem value="Työkorvaus">Työkorvaus</SelectItem>
              <SelectItem value="Kokouspalkkio">Kokouspalkkio</SelectItem>
              <SelectItem value="Luentopalkkio">Luentopalkkio</SelectItem>
              <SelectItem value="Muu">Muu</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{mode === "amount" ? "Euromäärä" : "Prosentti (%)"}</Label>
          <Input
            type="number"
            step={mode === "amount" ? 0.01 : 0.1}
            min={0}
            value={Number.isFinite(value) ? value : 0}
            onChange={(e) => onValueChange(parseFloat(e.target.value || "0"))}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Peruuta
          </Button>
          <Button onClick={onApply}>Jaa</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


