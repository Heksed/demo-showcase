"use client";

import React, { useState, useMemo } from "react";
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
import { parseFinnishDate, formatDateFI, formatCurrency } from "../../allocateincome/utils";
import type { MonthPeriod } from "../../allocateincome/types";

interface TransferDataTOEDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periods: MonthPeriod[];
  onSave: (updatedPeriods: MonthPeriod[]) => void;
}

interface TOEMonthEntry {
  id: string;
  year: number;
  month: number; // 0-11
  toe: number; // 0.0, 0.5, 1.0
  palkka?: number; // Vapaaehtoinen palkka siirtotiedoille
}

export default function TransferDataTOEDialog({
  open,
  onOpenChange,
  periods: initialPeriods,
  onSave,
}: TransferDataTOEDialogProps) {
  const [entries, setEntries] = useState<TOEMonthEntry[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedTOE, setSelectedTOE] = useState<string>("1.0");
  const [selectedSalary, setSelectedSalary] = useState<string>("");
  
  // Päivämäärävälin lisäämiseen
  const [rangeStartDate, setRangeStartDate] = useState<string>("");
  const [rangeEndDate, setRangeEndDate] = useState<string>("");
  const [rangeTOE, setRangeTOE] = useState<string>("1.0");
  const [rangeSalary, setRangeSalary] = useState<string>("");

  // Parse period date from ajanjakso string
  const parsePeriodDate = (ajanjakso: string): { year: number; month: number } | null => {
    const parts = ajanjakso.split(' ');
    if (parts.length !== 2) return null;
    const year = parseInt(parts[0], 10);
    const monthName = parts[1];
    const monthMap: { [key: string]: number } = {
      'Tammikuu': 0, 'Helmikuu': 1, 'Maaliskuu': 2, 'Huhtikuu': 3,
      'Toukokuu': 4, 'Kesäkuu': 5, 'Heinäkuu': 6, 'Elokuu': 7,
      'Syyskuu': 8, 'Lokakuu': 9, 'Marraskuu': 10, 'Joulukuu': 11
    };
    const month = monthMap[monthName];
    if (month === undefined || isNaN(year)) return null;
    return { year, month };
  };

  // Alusta entries periodien perusteella kun dialogi avataan
  React.useEffect(() => {
    if (open) {
      // Etsi periodsit joissa on TOE-arvo mutta ei palkkatietoja (siirtotiedot)
      const transferDataEntries: TOEMonthEntry[] = [];
      
      initialPeriods.forEach(period => {
        // Tarkista onko periodi siirtotieto (joko ei ole palkkatietoja tai on isTransferData merkintä)
        const isTransferData = period.rows.length === 0 || period.rows.some(row => row.isTransferData);
        if (isTransferData && period.toe > 0) {
          const periodDate = parsePeriodDate(period.ajanjakso);
          if (periodDate) {
            // Etsi palkka siirtotiedoista
            const transferDataRow = period.rows.find(row => row.isTransferData);
            const palkka = transferDataRow ? transferDataRow.palkka : undefined;
            
            transferDataEntries.push({
              id: period.id,
              year: periodDate.year,
              month: periodDate.month,
              toe: period.toe,
              palkka,
            });
          }
        }
      });
      
      setEntries(transferDataEntries);
      setSelectedYear("");
      setSelectedMonth("");
      setSelectedTOE("1.0");
      setSelectedSalary("");
      setRangeStartDate("");
      setRangeEndDate("");
      setRangeTOE("1.0");
      setRangeSalary("");
    }
  }, [open, initialPeriods]);

  // Generoi vuodet (2022-2025)
  const availableYears = useMemo(() => {
    const years: number[] = [];
    for (let year = 2022; year <= 2025; year++) {
      years.push(year);
    }
    return years;
  }, []);

  const monthNames = [
    'Tammikuu', 'Helmikuu', 'Maaliskuu', 'Huhtikuu',
    'Toukokuu', 'Kesäkuu', 'Heinäkuu', 'Elokuu',
    'Syyskuu', 'Lokakuu', 'Marraskuu', 'Joulukuu'
  ];

  const handleAddEntry = () => {
    if (!selectedYear || !selectedMonth) return;
    
    const year = parseInt(selectedYear, 10);
    const month = parseInt(selectedMonth, 10);
    const toe = parseFloat(selectedTOE);
    const palkka = selectedSalary ? parseFloat(selectedSalary) : undefined;
    
    // Tarkista onko jo olemassa
    const exists = entries.some(e => e.year === year && e.month === month);
    if (exists) return;
    
    const newEntry: TOEMonthEntry = {
      id: `transfer-${year}-${month}`,
      year,
      month,
      toe,
      palkka,
    };
    
    setEntries([...entries, newEntry]);
    setSelectedYear("");
    setSelectedMonth("");
    setSelectedTOE("1.0");
    setSelectedSalary("");
  };

  const handleDeleteEntry = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  // Lisää kaikki kuukaudet päivämäärävälistä
  const handleAddRange = () => {
    if (!rangeStartDate || !rangeEndDate) return;
    
    const start = parseFinnishDate(rangeStartDate);
    const end = parseFinnishDate(rangeEndDate);
    if (!start || !end || end < start) return;
    
    const toe = parseFloat(rangeTOE);
    const palkka = rangeSalary ? parseFloat(rangeSalary) : undefined;
    const newEntries: TOEMonthEntry[] = [];
    
    // Generoi kaikki kuukaudet väliltä
    const currentDate = new Date(start);
    currentDate.setDate(1); // Aloita kuukauden ensimmäisestä päivästä
    
    const endDate = new Date(end);
    endDate.setDate(1);
    
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      // Tarkista onko jo olemassa
      const exists = entries.some(e => e.year === year && e.month === month);
      if (!exists) {
        newEntries.push({
          id: `transfer-${year}-${month}`,
          year,
          month,
          toe,
          palkka,
        });
      }
      
      // Siirry seuraavaan kuukauteen
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    if (newEntries.length > 0) {
      setEntries([...entries, ...newEntries]);
      setRangeStartDate("");
      setRangeEndDate("");
      setRangeTOE("1.0");
      setRangeSalary("");
    }
  };

  const handleSave = () => {
    // Päivitä periodsit: lisää TOE-arvot periodien joissa ei ole palkkatietoja
    const updatedPeriods = initialPeriods.map(period => {
      const periodDate = parsePeriodDate(period.ajanjakso);
      if (!periodDate) return period;
      
      // Etsi entry tälle kuukaudelle
      const entry = entries.find(e => e.year === periodDate.year && e.month === periodDate.month);
      
      if (entry) {
        // Jos periodilla ei ole palkkatietoja tai on vain siirtotietoja, päivitä TOE-arvo ja palkka
        const hasOnlyTransferData = period.rows.length === 0 || period.rows.every(row => row.isTransferData);
        if (hasOnlyTransferData) {
          // Poista vanhat siirtotietojen rivit
          const nonTransferRows = period.rows.filter(row => !row.isTransferData);
          
          // Luo uusi rivi jos palkka on annettu
          const newRows = entry.palkka ? [{
            id: `transfer-${entry.year}-${entry.month}-1`,
            maksupaiva: `${new Date(entry.year, entry.month + 1, 0).getDate()}.${String(entry.month + 1).padStart(2, '0')}.${entry.year}`,
            tulolaji: "Siirtotiedot",
            palkka: entry.palkka,
            alkuperainenTulo: entry.palkka,
            ansaintaAika: `${entry.year} ${monthNames[entry.month]}`,
            tyonantaja: "Ruotsin työnantaja (siirtotiedot)",
            isTransferData: true,
          }] : [];
          
          return {
            ...period,
            toe: entry.toe,
            palkka: entry.palkka || 0,
            jakaja: entry.palkka ? 21.5 : 0,
            tyonantajat: "Ruotsin työnantaja (siirtotiedot)",
            rows: [...nonTransferRows, ...newRows],
          };
        }
      } else {
        // Jos entry poistettiin, poista siirtotietojen rivit
        const hasTransferData = period.rows.some(row => row.isTransferData);
        if (hasTransferData) {
          const nonTransferRows = period.rows.filter(row => !row.isTransferData);
          const wasTransferDataOnly = period.rows.every(row => row.isTransferData);
          
          if (wasTransferDataOnly) {
            // Jos kaikki rivit olivat siirtotietoja, nollaa kaikki
            return {
              ...period,
              toe: 0.0,
              palkka: 0,
              jakaja: 0,
              tyonantajat: "",
              rows: [],
            };
          } else {
            // Jos oli myös muita rivejä, poista vain siirtotietojen rivit
            return {
              ...period,
              rows: nonTransferRows,
            };
          }
        }
      }
      
      return period;
    });
    
    // Lisää uudet periodsit joita ei vielä ole
    entries.forEach(entry => {
      const periodId = `${entry.year}-${String(entry.month + 1).padStart(2, '0')}`;
      const exists = updatedPeriods.some(p => p.id === periodId);
      
      if (!exists) {
        const ajanjakso = `${entry.year} ${monthNames[entry.month]}`;
        const lastDayOfMonth = new Date(entry.year, entry.month + 1, 0).getDate();
        const newRows = entry.palkka ? [{
          id: `transfer-${entry.year}-${entry.month}-1`,
          maksupaiva: `${lastDayOfMonth}.${String(entry.month + 1).padStart(2, '0')}.${entry.year}`,
          tulolaji: "Siirtotiedot",
          palkka: entry.palkka,
          alkuperainenTulo: entry.palkka,
          ansaintaAika: ajanjakso,
          tyonantaja: "Ruotsin työnantaja (siirtotiedot)",
          isTransferData: true,
        }] : [];
        
        updatedPeriods.push({
          id: periodId,
          ajanjakso: ajanjakso,
          toe: entry.toe,
          jakaja: entry.palkka ? 21.5 : 0,
          palkka: entry.palkka || 0,
          tyonantajat: "Ruotsin työnantaja (siirtotiedot)",
          pidennettavatJaksot: 0,
          rows: newRows,
        });
      }
    });
    
    onSave(updatedPeriods);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Siirtotiedot TOE:lle (Ruotsin työskentely)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Olemassa olevat TOE-kuukaudet */}
          {entries.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Määritellyt TOE-kuukaudet</Label>
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <div className="flex-1 grid grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs text-gray-600">Vuosi</Label>
                      <p className="text-sm font-medium">{entry.year}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Kuukausi</Label>
                      <p className="text-sm font-medium">{monthNames[entry.month]}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">TOE</Label>
                      <p className="text-sm font-medium">{entry.toe.toFixed(1)} kk</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Palkka</Label>
                      <p className="text-sm font-medium">
                        {entry.palkka ? formatCurrency(entry.palkka) : "—"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteEntry(entry.id)}
                  >
                    Poista
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Lisää päivämäärävälin perusteella */}
          <div className="border-t border-gray-200 pt-4">
            <Label className="text-sm font-semibold mb-4 block">
              Lisää TOE-kuukausia päivämäärävälin perusteella
            </Label>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Alkupäivä</Label>
                  <Input
                    type="text"
                    placeholder="PP.KK.VVVV"
                    value={rangeStartDate}
                    onChange={(e) => setRangeStartDate(e.target.value)}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Loppupäivä</Label>
                  <Input
                    type="text"
                    placeholder="PP.KK.VVVV"
                    value={rangeEndDate}
                    onChange={(e) => setRangeEndDate(e.target.value)}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>TOE</Label>
                  <Select
                    value={rangeTOE}
                    onValueChange={setRangeTOE}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.0">0.0 kk</SelectItem>
                      <SelectItem value="0.5">0.5 kk</SelectItem>
                      <SelectItem value="1.0">1.0 kk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Palkka (vapaaehtoinen)</Label>
                  <Input
                    type="number"
                    placeholder="€"
                    value={rangeSalary}
                    onChange={(e) => setRangeSalary(e.target.value)}
                    className="bg-white"
                  />
                </div>
              </div>
              <Button
                onClick={handleAddRange}
                disabled={!rangeStartDate || !rangeEndDate}
                variant="outline"
              >
                Lisää kaikki kuukaudet väliltä
              </Button>
            </div>
          </div>

          {/* Uuden TOE-kuukauden lisäys (yksi kerrallaan) */}
          <div className="border-t border-gray-200 pt-4">
            <Label className="text-sm font-semibold mb-4 block">Lisää uusi TOE-kuukausi</Label>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Vuosi</Label>
                  <Select
                    value={selectedYear}
                    onValueChange={setSelectedYear}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Valitse vuosi" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map(year => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Kuukausi</Label>
                  <Select
                    value={selectedMonth}
                    onValueChange={setSelectedMonth}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Valitse kuukausi" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthNames.map((name, index) => (
                        <SelectItem key={index} value={String(index)}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>TOE</Label>
                  <Select
                    value={selectedTOE}
                    onValueChange={setSelectedTOE}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.0">0.0 kk</SelectItem>
                      <SelectItem value="0.5">0.5 kk</SelectItem>
                      <SelectItem value="1.0">1.0 kk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Palkka (vapaaehtoinen)</Label>
                  <Input
                    type="number"
                    placeholder="€"
                    value={selectedSalary}
                    onChange={(e) => setSelectedSalary(e.target.value)}
                    className="bg-white"
                  />
                </div>
              </div>
              <Button
                onClick={handleAddEntry}
                disabled={!selectedYear || !selectedMonth}
                variant="outline"
              >
                Lisää kuukausi
              </Button>
            </div>
          </div>

          {/* Yhteenveto */}
          {entries.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-semibold">Yhteensä TOE-kuukausia</Label>
                <p className="text-lg font-semibold text-blue-600">
                  {entries.reduce((sum, e) => sum + e.toe, 0).toFixed(1)} kk
                </p>
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

