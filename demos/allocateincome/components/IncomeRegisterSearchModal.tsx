"use client";

import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, CheckCircle2, XCircle, Calendar, FileText } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { IncomeRow, MonthPeriod } from "../types";
import { parseFinnishDate, formatDateFI, formatCurrency } from "../utils";
import { cn } from "@/lib/utils";

interface IncomeRegisterSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periods: MonthPeriod[];
  onApplySearch: (updatedPeriods: MonthPeriod[], conflicts: ConflictRow[]) => void;
}

export interface ConflictRow {
  periodId: string;
  oldRow: IncomeRow;
  newRow: IncomeRow;
}

interface ChangeItem {
  id: string;
  type: 'updated' | 'new' | 'conflict' | 'protected';
  periodId: string;
  periodName: string;
  oldRow?: IncomeRow;
  newRow: IncomeRow;
}

// Simuloi tulorekisterihaku - palauttaa uudet tulotiedot
function simulateIncomeRegisterSearch(
  periods: MonthPeriod[],
  startDate: Date,
  endDate: Date
): IncomeRow[] {
  // Simuloi uusia tulotietoja - tässä esimerkki, jossa muutetaan joitain palkkoja
  const newRows: IncomeRow[] = [];
  
  periods.forEach(period => {
    const periodDate = parsePeriodDate(period.ajanjakso);
    if (!periodDate) return;
    
    // Tarkista onko period päivämäärävälin sisällä
    if (periodDate < startDate || periodDate > endDate) return;
    
    period.rows.forEach(row => {
      // Älä palauta jaettuja rivejä (child-rivit) - tulorekisteri ei voi palauttaa jaettua osaa
      if (row.parentId) return; // Jaettu rivi (child)
      
      // Älä palauta jos huom-kenttä sisältää "jaettu"
      if (row.huom && row.huom.toLowerCase().includes('jaettu')) return;
      
      // Älä palauta lomarahaa (ei ole tulorekisterissä)
      if (row.tulolaji === "Lomaraha") return;
      
      // Älä palauta manuaalisesti muokattuja rivejä (kohdistettu, manuaalisesti korjattu)
      if (row.huom) {
        const huomLower = row.huom.toLowerCase();
        if (
          huomLower.includes('kohdistettu') ||
          huomLower.includes('manuaalisesti korjattu') ||
          huomLower.includes('manuaalisesti muokattu')
        ) {
          return;
        }
      }
      
      // Älä palauta jos dataSource on 'manual'
      if (row.dataSource === 'manual') return;
      
      // Simuloi päivitettyjä tietoja - esimerkiksi palkka voi olla hieman eri
      const randomChange = Math.random() > 0.7; // 30% todennäköisyys muutokselle
      const newPalkka = randomChange 
        ? row.palkka + Math.floor(Math.random() * 200 - 100) // ±100€ muutos
        : row.palkka;
      
      newRows.push({
        ...row,
        id: `new-${row.id}`,
        palkka: Math.max(0, newPalkka), // Varmista että ei negatiivinen
        isNew: true,
        dataSource: 'tulorekisteri',
        originalRowData: row,
      });
    });
  });
  
  return newRows;
}

function parsePeriodDate(ajanjakso: string): Date | null {
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
  return new Date(year, month, 1);
}

export default function IncomeRegisterSearchModal({
  open,
  onOpenChange,
  periods,
  onApplySearch,
}: IncomeRegisterSearchModalProps) {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    newRows: IncomeRow[];
    conflicts: ConflictRow[];
    updatedPeriods: MonthPeriod[];
    changes: ChangeItem[];
  } | null>(null);
  
  // Valinnat ristiriitojen ratkaisemiseen
  const [conflictChoices, setConflictChoices] = useState<Record<string, 'old' | 'new'>>({});
  
  // Näytä kaikki haetut tiedot vai vain muuttuneet
  const [showAllChanges, setShowAllChanges] = useState(false);
  
  // Funktio joka tunnistaa jaetut rivit
  const isSplitRow = (row: IncomeRow, allRows: IncomeRow[]): boolean => {
    // Jos rivi on child (parentId on olemassa)
    if (row.parentId) return true;
    
    // Jos rivi on parent (sillä on child-rivejä)
    const hasChild = allRows.some(r => r.parentId === row.id);
    if (hasChild) return true;
    
    // Tarkista huom-kenttä
    if (row.huom) {
      const huomLower = row.huom.toLowerCase();
      if (huomLower.includes('jaettu')) return true;
    }
    
    return false;
  };
  
  // Funktio joka tunnistaa manuaalisesti muokatut rivit
  const isManuallyModified = (row: IncomeRow): boolean => {
    // Tarkista dataSource
    if (row.dataSource === 'manual') return true;
    
    // Tarkista huom-kenttä
    if (row.huom) {
      const huomLower = row.huom.toLowerCase();
      return (
        huomLower.includes('kohdistettu') ||
        huomLower.includes('jaettu') ||
        huomLower.includes('manuaalisesti korjattu') ||
        huomLower.includes('manuaalisesti muokattu')
      );
    }
    
    return false;
  };
  
  // Funktio joka tarkistaa onko muutos todellinen
  const hasRealChange = (change: ChangeItem): boolean => {
    // Jos ei ole vanhaa riviä, se on kokonaan uusi → näytetään aina
    if (!change.oldRow) return true;
    
    // Ristiriidat näytetään aina (ne ovat muuttuneita)
    if (change.type === 'conflict') return true;
    
    // Suojatut rivit näytetään aina (ne eivät voi yliajautua)
    if (change.type === 'protected') return true;
    
    // Tarkista eroavatko kentät
    return (
      change.oldRow.maksupaiva !== change.newRow.maksupaiva ||
      change.oldRow.tulolaji !== change.newRow.tulolaji ||
      change.oldRow.palkka !== change.newRow.palkka ||
      change.oldRow.ansaintaAika !== change.newRow.ansaintaAika ||
      change.oldRow.tyonantaja !== change.newRow.tyonantaja
    );
  };
  
  // Suodatettu lista muutoksista
  const filteredChanges = useMemo(() => {
    if (!searchResults) return [];
    if (showAllChanges) {
      return searchResults.changes;
    }
    return searchResults.changes.filter(hasRealChange);
  }, [searchResults?.changes, showAllChanges]);

  // Laske hakutulokset kun päivämäärät muuttuvat
  const handleSearch = () => {
    const start = parseFinnishDate(startDate);
    const end = parseFinnishDate(endDate);
    
    if (!start || !end) {
      alert("Tarkista päivämäärät");
      return;
    }
    
    if (start > end) {
      alert("Alkupäivämäärän pitää olla ennen päättymispäivämäärää");
      return;
    }
    
    setIsSearching(true);
    
    // Simuloi hakua
    setTimeout(() => {
      const newRows = simulateIncomeRegisterSearch(periods, start, end);
      
      // Etsi ristiriidat (manuaalisesti muokatut rivit)
      const conflicts: ConflictRow[] = [];
      const changes: ChangeItem[] = [];
      const updatedPeriods: MonthPeriod[] = periods.map(period => {
        const periodNewRows = newRows.filter(row => {
          const originalRow = row.originalRowData;
          if (!originalRow) return false;
          // Etsi vastaava rivi periodista
          return period.rows.some(pRow => pRow.id === originalRow.id);
        });
        
        const updatedRows: IncomeRow[] = period.rows.map(oldRow => {
          // Tarkista onko rivi jaettu (child-rivi)
          const isSplitChild = !!oldRow.parentId;
          
          // Jos rivi on jaettu child-rivi, se ei voi löytyä tulorekisteristä
          // Tarkistetaan parent-rivi sen sijaan
          if (isSplitChild) {
            // Child-rivit eivät voi löytyä tulorekisteristä, joten ne käsitellään myöhemmin protected-logiikassa
            return oldRow;
          }
          
          // Tarkista onko rivi parent (sillä on child-rivejä)
          const childRows = period.rows.filter(r => r.parentId === oldRow.id);
          const isSplitParent = childRows.length > 0;
          
          // Jos rivi on parent (alkuperäinen aikapalkka joka on jaettu)
          if (isSplitParent) {
            // Laske alkuperäinen palkka ennen jakoa (parent + kaikki child-rivit)
            const originalPalkka = oldRow.palkka + childRows.reduce((sum, child) => sum + child.palkka, 0);
            
            // Etsi vastaava rivi tulorekisteristä (sama maksupäivä, tulolaji, työnantaja)
            const matchingNewRow = periodNewRows.find(nr => 
              nr.maksupaiva === oldRow.maksupaiva &&
              nr.tulolaji === oldRow.tulolaji &&
              nr.tyonantaja === oldRow.tyonantaja
            );
            
            if (matchingNewRow) {
              // Jos tulorekisterin palkka eroaa alkuperäisestä (ennen jakoa), luo konflikti
              if (matchingNewRow.palkka !== originalPalkka) {
                const conflict: ConflictRow = {
                  periodId: period.id,
                  oldRow: {
                    ...oldRow,
                    palkka: originalPalkka, // Näytetään alkuperäinen palkka ennen jakoa
                  },
                  newRow: matchingNewRow,
                };
                conflicts.push(conflict);
                
                changes.push({
                  id: `conflict-${oldRow.id}`,
                  type: 'conflict',
                  periodId: period.id,
                  periodName: period.ajanjakso,
                  oldRow: {
                    ...oldRow,
                    palkka: originalPalkka, // Näytetään alkuperäinen palkka ennen jakoa
                  },
                  newRow: matchingNewRow,
                });
                
                return {
                  ...oldRow,
                  hasConflict: true,
                };
              }
            }
            // Jos ei löytynyt tai palkka on sama, pidä vanha rivi
            return oldRow;
          }
          
          // Tarkista onko rivi jaettu (muu tapa, esim. huom-kenttä)
          const isSplit = isSplitRow(oldRow, period.rows);
          
          // Jos rivi on jaettu muulla tavalla, tarkista löytyykö uusi rivi
          if (isSplit && !isSplitParent) {
            const matchingNewRow = periodNewRows.find(nr => 
              nr.maksupaiva === oldRow.maksupaiva &&
              nr.tyonantaja === oldRow.tyonantaja
            );
            
            if (matchingNewRow) {
              // Aina conflict jos jaettu rivi ja uusi rivi löytyy
              const conflict: ConflictRow = {
                periodId: period.id,
                oldRow,
                newRow: matchingNewRow,
              };
              conflicts.push(conflict);
              
              changes.push({
                id: `conflict-${oldRow.id}`,
                type: 'conflict',
                periodId: period.id,
                periodName: period.ajanjakso,
                oldRow: oldRow,
                newRow: matchingNewRow,
              });
              
              return {
                ...oldRow,
                hasConflict: true,
              };
            }
          }
          
          // Etsi vastaava uusi rivi (tarkempi täsmäys)
          const newRow = periodNewRows.find(nr => {
            // Tarkista onko sama rivi (sama maksupäivä, tulolaji ja työnantaja)
            return (
              nr.maksupaiva === oldRow.maksupaiva &&
              nr.tulolaji === oldRow.tulolaji &&
              nr.tyonantaja === oldRow.tyonantaja
            ) || (
              nr.originalRowData?.id === oldRow.id
            );
          });
          
          // Jos rivi on manuaalisesti muokattu, älä yliaja sitä
          if (isManuallyModified(oldRow)) {
            if (newRow && (
              newRow.palkka !== oldRow.palkka ||
              newRow.tyonantaja !== oldRow.tyonantaja ||
              newRow.ansaintaAika !== oldRow.ansaintaAika
            )) {
              // Merkitse ristiriita, mutta pidä vanha (manuaalisesti muokattu) rivi
              const conflict: ConflictRow = {
                periodId: period.id,
                oldRow,
                newRow,
              };
              conflicts.push(conflict);
              
              // Lisää ristiriita muutoksiin
              changes.push({
                id: `conflict-${oldRow.id}`,
                type: 'conflict',
                periodId: period.id,
                periodName: period.ajanjakso,
                oldRow: oldRow,
                newRow: newRow,
              });
              
              return {
                ...oldRow,
                hasConflict: true,
              };
            }
            // Jos ei ristiriitaa, pidä vanha rivi
            return oldRow;
          }
          
          // Jos rivi ei ole manuaalisesti muokattu, päivitä se uudella tiedolla
          if (newRow) {
            const updatedRow = {
              ...newRow,
              dataSource: 'tulorekisteri',
              isNew: true,
              originalRowData: oldRow,
            };
            
            // Lisää muutos listaan
            changes.push({
              id: updatedRow.id,
              type: 'updated',
              periodId: period.id,
              periodName: period.ajanjakso,
              oldRow: oldRow,
              newRow: updatedRow,
            });
            
            return updatedRow;
          }
          
          return oldRow;
        });
        
        // Lisää kokonaan uudet rivit (ei vastaavaa vanhaa riviä)
        const completelyNewRows = periodNewRows.filter(nr => {
          const hasMatch = period.rows.some(pRow => 
            pRow.maksupaiva === nr.maksupaiva &&
            pRow.tulolaji === nr.tulolaji &&
            pRow.tyonantaja === nr.tyonantaja
          );
          return !hasMatch;
        }).map(nr => {
          const newRow = {
            ...nr,
            dataSource: 'tulorekisteri' as const,
            isNew: true,
          };
          
          // Lisää uusi rivi muutoksiin
          changes.push({
            id: newRow.id,
            type: 'new',
            periodId: period.id,
            periodName: period.ajanjakso,
            newRow: newRow,
          });
          
          return newRow;
        });
        
        // Lisää manuaalisesti muokatut rivit, joille ei löytynyt uutta tietoa
        period.rows.forEach(oldRow => {
          // Tarkista onko rivi jo lisätty changes-listaan (conflictina tai muuna)
          const alreadyAdded = changes.some(c => 
            c.oldRow?.id === oldRow.id || 
            c.id === `conflict-${oldRow.id}` ||
            c.id === `protected-${oldRow.id}`
          );
          
          if (alreadyAdded) {
            // Rivi on jo lisätty, ei tarvitse lisätä uudelleen
            return;
          }
          
          // Tarkista onko rivi jaettu
          const isSplit = isSplitRow(oldRow, period.rows);
          
          if (isManuallyModified(oldRow) || isSplit) {
            // Tarkista onko uusi rivi löytynyt (jos on, se käsitellään jo conflict-logiikassa)
            // Jaetut rivit tarkistetaan laajemmin (sama maksupäivä, työnantaja)
            const newRow = isSplit 
              ? periodNewRows.find(nr => 
                  nr.maksupaiva === oldRow.maksupaiva &&
                  nr.tyonantaja === oldRow.tyonantaja
                )
              : periodNewRows.find(nr => 
                  nr.maksupaiva === oldRow.maksupaiva &&
                  nr.tulolaji === oldRow.tulolaji &&
                  nr.tyonantaja === oldRow.tyonantaja
                );
            
            // Jos ei uutta riviä, lisää se suojattuina muutoksina
            if (!newRow) {
              changes.push({
                id: `protected-${oldRow.id}`,
                type: 'protected',
                periodId: period.id,
                periodName: period.ajanjakso,
                oldRow: oldRow,
                newRow: oldRow, // Sama kuin vanha, koska ei uutta
              });
            }
          }
        });
        
        return {
          ...period,
          rows: [...updatedRows, ...completelyNewRows],
        };
      });
      
      setSearchResults({
        newRows,
        conflicts,
        updatedPeriods,
        changes,
      });
      
      // Alusta valinnat: oletuksena käytetään vanhaa ristiriitoissa
      const initialChoices: Record<string, 'old' | 'new'> = {};
      conflicts.forEach(conflict => {
        initialChoices[`conflict-${conflict.oldRow.id}`] = 'old';
      });
      setConflictChoices(initialChoices);
      
      setIsSearching(false);
    }, 1000);
  };

  const handleApply = () => {
    if (!searchResults) return;
    
    // Ratkaise ristiriidat käyttäen valintoja
    const finalPeriods = searchResults.updatedPeriods.map(period => {
      return {
        ...period,
        rows: period.rows.map(row => {
          if (row.hasConflict) {
            const choiceId = `conflict-${row.id}`;
            const choice = conflictChoices[choiceId] || 'old';
            
            if (choice === 'new') {
              // Käytä uutta tietoa
              const conflict = searchResults.conflicts.find(c => c.oldRow.id === row.id);
              if (conflict) {
                return {
                  ...conflict.newRow,
                  dataSource: 'tulorekisteri',
                  isNew: true,
                  originalRowData: conflict.oldRow,
                };
              }
            }
            // Oletuksena käytetään vanhaa (manuaalisesti muokattua)
            return {
              ...row,
              hasConflict: false,
            };
          }
          return row;
        }),
      };
    });
    
    onApplySearch(finalPeriods, searchResults.conflicts);
    onOpenChange(false);
    setSearchResults(null);
    setStartDate("");
    setEndDate("");
    setConflictChoices({});
  };

  const conflictCount = searchResults?.conflicts.length || 0;
  const newRowCount = searchResults?.newRows.length || 0;
  const changesCount = searchResults?.changes.length || 0;
  const filteredChangesCount = filteredChanges.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tulorekisterihaku</DialogTitle>
          <DialogDescription>
            Hae uudet tulotiedot tulorekisteristä valitulta ajanjaksolta
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Alkupäivämäärä</Label>
              <Input
                id="startDate"
                type="text"
                placeholder="DD.MM.YYYY"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Päättymispäivämäärä</Label>
              <Input
                id="endDate"
                type="text"
                placeholder="DD.MM.YYYY"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleSearch} 
            disabled={isSearching || !startDate || !endDate}
            className="w-full"
          >
            {isSearching ? "Haetaan..." : "Hae tulotiedot"}
          </Button>
          
          {searchResults && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Löytyi {changesCount} muutosta: {newRowCount} uutta/päivitettyä tulotietoa.
                  {!showAllChanges && filteredChangesCount < changesCount && (
                    <span className="block mt-1 text-blue-600">
                      Näytetään {filteredChangesCount} muutosta ({changesCount - filteredChangesCount} piilotettu).
                    </span>
                  )}
                  {conflictCount > 0 && (
                    <span className="block mt-1 text-amber-600">
                      {conflictCount} ristiriitaa manuaalisesti muokattujen rivien kanssa.
                    </span>
                  )}
                </AlertDescription>
              </Alert>
              
              {/* Muutosten taulukko */}
              <div className="border rounded-lg">
                <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h3 className="font-semibold">Muutokset</h3>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="show-all"
                        checked={showAllChanges}
                        onCheckedChange={setShowAllChanges}
                      />
                      <Label htmlFor="show-all" className="cursor-pointer text-sm">
                        Näytä kaikki haetut tiedot
                      </Label>
                    </div>
                  </div>
                  {conflictCount > 0 && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const allOld: Record<string, 'old' | 'new'> = {};
                          searchResults.changes
                            .filter(c => c.type === 'conflict')
                            .forEach(c => {
                              allOld[c.id] = 'old';
                            });
                          setConflictChoices(prev => ({ ...prev, ...allOld }));
                        }}
                      >
                        Valitse kaikki vanhat
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const allNew: Record<string, 'old' | 'new'> = {};
                          searchResults.changes
                            .filter(c => c.type === 'conflict')
                            .forEach(c => {
                              allNew[c.id] = 'new';
                            });
                          setConflictChoices(prev => ({ ...prev, ...allNew }));
                        }}
                      >
                        Valitse kaikki uudet
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Huom</TableHead>
                        <TableHead className="w-[120px]">Maksupäivä</TableHead>
                        <TableHead className="w-[120px]">Tulolaji</TableHead>
                        <TableHead className="w-[120px]">Palkka</TableHead>
                        <TableHead className="w-[150px]">Ansainta-aika</TableHead>
                        <TableHead className="w-[150px]">Työnantaja</TableHead>
                        <TableHead className="w-[120px]">Lähde</TableHead>
                        <TableHead className="w-[150px]">Muokattu</TableHead>
                        <TableHead className="w-[150px]">Valinta</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredChanges.map((change) => {
                        const hasOldRow = !!change.oldRow;
                        const isConflict = change.type === 'conflict';
                        const isProtected = change.type === 'protected';
                        
                        return (
                          <React.Fragment key={change.id}>
                            {/* Uusi tieto (ylärivi) - tyhjä protected-tyypeille */}
                            {!isProtected && (
                              <TableRow className={cn(
                                isConflict && hasOldRow && "border-l-4 border-red-500"
                              )}>
                                {hasOldRow && (
                                  <TableCell rowSpan={2} className="align-top">
                                    {change.newRow.isNew && (
                                      <Badge variant="default" className="bg-blue-600 text-white text-xs">
                                        Uusi
                                      </Badge>
                                    )}
                                  </TableCell>
                                )}
                                {!hasOldRow && (
                                  <TableCell>
                                    {change.newRow.isNew && (
                                      <Badge variant="default" className="bg-blue-600 text-white text-xs">
                                        Uusi
                                      </Badge>
                                    )}
                                  </TableCell>
                                )}
                                <TableCell className="font-semibold">{change.newRow.maksupaiva}</TableCell>
                                <TableCell className="font-semibold">{change.newRow.tulolaji}</TableCell>
                                <TableCell className={cn(
                                  "text-right font-semibold",
                                  hasOldRow && change.oldRow && change.oldRow.palkka !== change.newRow.palkka && "text-blue-600"
                                )}>
                                  {formatCurrency(change.newRow.palkka)}
                                </TableCell>
                                <TableCell className="font-semibold">{change.newRow.ansaintaAika || '-'}</TableCell>
                                <TableCell className="font-semibold">{change.newRow.tyonantaja}</TableCell>
                                <TableCell className="font-semibold">
                                  Tulorekisteri
                                </TableCell>
                                {hasOldRow && (
                                  <TableCell rowSpan={2} className="align-top">
                                    {change.oldRow.modifiedAt ? (
                                      <div className="text-sm">
                                        {change.oldRow.modifiedAt}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </TableCell>
                                )}
                                {!hasOldRow && (
                                  <TableCell>
                                    <span className="text-gray-400">-</span>
                                  </TableCell>
                                )}
                                {hasOldRow && isConflict && (
                                  <TableCell rowSpan={2} className="align-top">
                                    <RadioGroup
                                      value={conflictChoices[change.id] || 'old'}
                                      onValueChange={(value) => {
                                        setConflictChoices(prev => ({
                                          ...prev,
                                          [change.id]: value as 'old' | 'new',
                                        }));
                                      }}
                                    >
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="old" id={`${change.id}-old`} />
                                        <Label htmlFor={`${change.id}-old`} className="cursor-pointer text-sm">
                                          Vanha
                                        </Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="new" id={`${change.id}-new`} />
                                        <Label htmlFor={`${change.id}-new`} className="cursor-pointer text-sm">
                                          Uusi
                                        </Label>
                                      </div>
                                    </RadioGroup>
                                  </TableCell>
                                )}
                                {hasOldRow && !isConflict && (
                                  <TableCell rowSpan={2} className="align-top">
                                    <span className="text-gray-400">-</span>
                                  </TableCell>
                                )}
                                {!hasOldRow && (
                                  <TableCell>
                                    <span className="text-gray-400">-</span>
                                  </TableCell>
                                )}
                              </TableRow>
                            )}
                            
                            {/* Vanha tieto (alarivi) - näytetään aina jos on vanha rivi ja ei protected */}
                            {hasOldRow && !isProtected && (
                              <TableRow className={cn(
                                "bg-gray-50",
                                isConflict && "border-l-4 border-red-500"
                              )}>
                                <TableCell>{change.oldRow.maksupaiva}</TableCell>
                                <TableCell>{change.oldRow.tulolaji}</TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(change.oldRow.palkka)}
                                </TableCell>
                                <TableCell>{change.oldRow.ansaintaAika || '-'}</TableCell>
                                <TableCell>{change.oldRow.tyonantaja}</TableCell>
                                <TableCell>
                                  {change.oldRow.dataSource === 'manual' ? 'Manuaalinen' : 
                                   change.oldRow.dataSource === 'integratio' ? 'Integraatio' : 
                                   'Tulorekisteri'}
                                </TableCell>
                              </TableRow>
                            )}
                            
                            {/* Protected-tyyppi: näytetään vain yksi rivi (ei uutta tietoa, ei voi yliajautua) */}
                            {isProtected && change.oldRow && (
                              <TableRow className="bg-gray-50 border-l-4 border-amber-500">
                                <TableCell>
                                  <Badge variant="outline" className="text-xs border-amber-500 text-amber-700 bg-amber-50 whitespace-nowrap">
                                    Ei korvata
                                  </Badge>
                                </TableCell>
                                <TableCell>{change.oldRow.maksupaiva}</TableCell>
                                <TableCell>{change.oldRow.tulolaji}</TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(change.oldRow.palkka)}
                                </TableCell>
                                <TableCell>{change.oldRow.ansaintaAika || '-'}</TableCell>
                                <TableCell>{change.oldRow.tyonantaja}</TableCell>
                                <TableCell>
                                  {change.oldRow.dataSource === 'manual' ? 'Manuaalinen' : 
                                   change.oldRow.dataSource === 'integratio' ? 'Integraatio' : 
                                   'Tulorekisteri'}
                                </TableCell>
                                <TableCell>
                                  {change.oldRow.modifiedAt ? (
                                    <div className="text-sm">
                                      {change.oldRow.modifiedAt}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <span className="text-gray-400">-</span>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleApply} className="flex-1">
                  Sovella hakutulokset
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchResults(null);
                    setStartDate("");
                    setEndDate("");
                    setConflictChoices({});
                  }}
                >
                  Peruuta
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

