"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { parseFinnishDate } from "../../allocateincome/utils";

export interface ExtendingPeriod {
  id: string;
  startDate: string; // PP.KK.VVVV
  endDate: string; // PP.KK.VVVV
  reason: string; // Syy (esim. "Opiskelu")
}

interface ExtendingPeriodsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periods: ExtendingPeriod[];
  onSave: (periods: ExtendingPeriod[]) => void;
}

export default function ExtendingPeriodsDialog({
  open,
  onOpenChange,
  periods: initialPeriods,
  onSave,
}: ExtendingPeriodsDialogProps) {
  const [periods, setPeriods] = useState<ExtendingPeriod[]>(initialPeriods);
  const [newPeriod, setNewPeriod] = useState<Partial<ExtendingPeriod>>({
    startDate: "",
    endDate: "",
    reason: "",
  });

  // Päivitä periods kun dialogi avataan
  React.useEffect(() => {
    if (open) {
      setPeriods(initialPeriods);
      setNewPeriod({ startDate: "", endDate: "", reason: "" });
    }
  }, [open, initialPeriods]);

  const handleAddPeriod = () => {
    if (!newPeriod.startDate || !newPeriod.endDate || !newPeriod.reason) {
      return;
    }

    const startDate = parseFinnishDate(newPeriod.startDate);
    const endDate = parseFinnishDate(newPeriod.endDate);
    
    if (!startDate || !endDate || endDate <= startDate) {
      return;
    }

    const period: ExtendingPeriod = {
      id: `extending-${Date.now()}`,
      startDate: newPeriod.startDate,
      endDate: newPeriod.endDate,
      reason: newPeriod.reason || "",
    };

    setPeriods([...periods, period]);
    setNewPeriod({ startDate: "", endDate: "", reason: "" });
  };

  const handleDeletePeriod = (id: string) => {
    setPeriods(periods.filter(p => p.id !== id));
  };

  const handleSave = () => {
    onSave(periods);
    onOpenChange(false);
  };

  // Laske päivien määrä
  const calculateDays = (startDate: string, endDate: string): number => {
    const start = parseFinnishDate(startDate);
    const end = parseFinnishDate(endDate);
    if (!start || !end) return 0;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const totalDays = periods.reduce((sum, period) => {
    return sum + calculateDays(period.startDate, period.endDate);
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pidentävät jaksot</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Olemassa olevat jaksot */}
          {periods.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Määritellyt pidentävät jaksot</Label>
              {periods.map((period) => (
                <div
                  key={period.id}
                  className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <div className="flex-1 grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-gray-600">Alkupäivä</Label>
                      <p className="text-sm font-medium">{period.startDate}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Loppupäivä</Label>
                      <p className="text-sm font-medium">{period.endDate}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Syy</Label>
                      <p className="text-sm font-medium">{period.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-600">
                      {calculateDays(period.startDate, period.endDate)} pv
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePeriod(period.id)}
                    >
                      Poista
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Uuden jakson lisäys */}
          <div className="border-t border-gray-200 pt-4">
            <Label className="text-sm font-semibold mb-4 block">Lisää uusi pidentävä jakso</Label>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Alkupäivä</Label>
                  <Input
                    type="text"
                    placeholder="PP.KK.VVVV"
                    value={newPeriod.startDate || ""}
                    onChange={(e) =>
                      setNewPeriod({ ...newPeriod, startDate: e.target.value })
                    }
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Loppupäivä</Label>
                  <Input
                    type="text"
                    placeholder="PP.KK.VVVV"
                    value={newPeriod.endDate || ""}
                    onChange={(e) =>
                      setNewPeriod({ ...newPeriod, endDate: e.target.value })
                    }
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Syy</Label>
                  <Select
                    value={newPeriod.reason || ""}
                    onValueChange={(value) =>
                      setNewPeriod({ ...newPeriod, reason: value })
                    }
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Valitse syy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Opiskelu">Opiskelu</SelectItem>
                      <SelectItem value="Sotilas- tai siviilipalvelus">Sotilas- tai siviilipalvelus</SelectItem>
                      <SelectItem value="Vankeus">Vankeus</SelectItem>
                      <SelectItem value="Sairaus">Sairaus</SelectItem>
                      <SelectItem value="Äitiys- tai isyysvapaa">Äitiys- tai isyysvapaa</SelectItem>
                      <SelectItem value="Hoitovapaa">Hoitovapaa</SelectItem>
                      <SelectItem value="Muu hyväksyttävä syy">Muu hyväksyttävä syy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleAddPeriod}
                disabled={
                  !newPeriod.startDate ||
                  !newPeriod.endDate ||
                  !newPeriod.reason
                }
                variant="outline"
              >
                Lisää jakso
              </Button>
            </div>
          </div>

          {/* Yhteenveto */}
          {totalDays > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-semibold">Yhteensä pidentäviä päiviä</Label>
                <p className="text-lg font-semibold text-blue-600">{totalDays} pv</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Peruuta
          </Button>
          <Button onClick={handleSave}>Tallenna</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

