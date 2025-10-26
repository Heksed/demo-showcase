"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MoreVertical, AlertCircle, CheckCircle2, RotateCcw, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { parseFinnishDate, formatDateISO, isoToFI } from "../utils";
import type { IncomeRow, MonthPeriod } from "../types";

type ViikkoTOERow = {
  id: string;
  alkupäivä: string;
  loppupäivä: string;
  työnantaja: string;
  selite: string;
  palkka: number;
  toeViikot: number;
  jakaja: number;
  toeTunnit: number;
  tunnitYhteensä: number;
};

export default function ViikkoTOETable({
  period,
  onSave,
  onDelete,
  onAdd,
  formatCurrency,
  onVähennysSummaChange
}: {
  period: MonthPeriod;
  onSave: (periodId: string, rowId: string, updatedRow: any) => void;
  onDelete: (periodId: string, rowId: string) => void;
  onAdd?: (periodId: string, newRowData: any) => void;
  formatCurrency: (n: number) => string;
  onVähennysSummaChange: (summa: number) => void;
}) {
  const [rowData, setRowData] = useState<{[key: string]: any}>({});
  const [expandedWeeks, setExpandedWeeks] = useState<boolean>(false);
  const [expandedSalary, setExpandedSalary] = useState<boolean>(false);
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [newRowData, setNewRowData] = useState<any>({
    alkupäivä: '',
    loppupäivä: '',
    työnantaja: '',
    lisäteksti: '',
    vähennäTOE: 0,
    tunnitYhteensä: 0,
    toeViikot: 0,
    jakaja: 0
  });

  // Calculate TOE weeks: 0 if <=17h, 1 if >=18h
  const calculateTOEWeeks = (hours: number): number => {
    return hours >= 18 ? 1 : 0;
  };

  // Calculate working days from hours (jakaja logic)
  const calculateWorkingDays = (hours: number): number => {
    if (hours >= 18) {
      return 5; // Täysi työviikko
    } else {
      return 0; // Ei täyttävä työpäivä (alle 18h)
    }
  };

  // Convert ViikkoTOE weeks to EuroTOE months with official logic
  const convertToEuroTOEMonths = (viikkoTOEWeeks: number): number => {
    // Virallinen muunnos: 2 viikkoa = 0.5 kuukautta
    // Pyöristä lähimpään 0.5:een
    return Math.round(viikkoTOEWeeks / 2) * 0.5;
  };

  // Suodatettu viikkotietojen lista
  const filteredWeeks = (period.viikkoTOERows || [])
    .filter(row => {
      if (!filterStartDate && !filterEndDate) return true; // Näytä kaikki jos ei suodattimia
      
      const rowStartDate = parseFinnishDate(row.alkupäivä);
      const rowEndDate = parseFinnishDate(row.loppupäivä);
      
      if (filterStartDate && rowEndDate && rowEndDate < new Date(filterStartDate)) return false;
      if (filterEndDate && rowStartDate && rowStartDate > new Date(filterEndDate)) return false;
      
      return true;
    })
    .sort((a, b) => {
      // Sort by start date (newest first)
      const dateA = parseFinnishDate(a.alkupäivä);
      const dateB = parseFinnishDate(b.alkupäivä);
      if (!dateA || !dateB) return 0;
      return dateB.getTime() - dateA.getTime();
    });

  // Laske ViikkoTOE:n vähentävä summa useMemo:lla varmistamaan päivitys
  const viikkoTOEVähennysSumma = useMemo(() => {
    return period.viikkoTOERows?.reduce((sum, row) => {
      const vähennys = rowData[row.id]?.vähennäTOE ?? 0;
      return sum + vähennys;
    }, 0) || 0;
  }, [period.viikkoTOERows, rowData]);

  // Ilmoita vähentävän summan muutoksesta parent komponentille
  useEffect(() => {
    onVähennysSummaChange(viikkoTOEVähennysSumma);
  }, [viikkoTOEVähennysSumma]); // Poistettu onVähennysSummaChange dependency array:sta

  // Laske ViikkoTOE:n tunnit-yhteissumma useMemo:lla varmistamaan päivitys
  const viikkoTOETunnitSumma = useMemo(() => {
    return period.viikkoTOERows?.reduce((sum, row) => {
      const currentData = {
        ...row,
        ...rowData[row.id],
        tunnitYhteensä: rowData[row.id]?.tunnitYhteensä ?? row.tunnitYhteensä ?? 0
      };
      return sum + currentData.tunnitYhteensä;
    }, 0) || 0;
  }, [period.viikkoTOERows, rowData]);

  // Laske ViikkoTOE:n toeTunnit-yhteissumma useMemo:lla varmistamaan päivitys
  const viikkoTOEToeTunnitSumma = useMemo(() => {
    return period.viikkoTOERows?.reduce((sum, row) => {
      const currentData = {
        ...row,
        ...rowData[row.id],
        tunnitYhteensä: rowData[row.id]?.tunnitYhteensä ?? row.tunnitYhteensä ?? 0
      };
      // Calculate TOE hours based on current hours: if >= 18h then use actual hours, else 0
      const toeTunnit = currentData.tunnitYhteensä >= 18 ? currentData.tunnitYhteensä : 0;
      return sum + toeTunnit;
    }, 0) || 0;
  }, [period.viikkoTOERows, rowData]);

  const handleInputChange = (rowId: string, field: string, value: any) => {
    const mockRow = period.viikkoTOERows?.find(r => r.id === rowId);
      const currentRowData = rowData[rowId] || {
        // Mock data muut kentät (ei palkka, tunnitYhteensä, toeViikot, jakaja)
        ...mockRow,
        // Korvaa mock datan default arvoilla
        vähennäTOE: 0, // Käytä aina 0:ta default arvona
        tunnitYhteensä: mockRow?.tunnitYhteensä ?? 0,
        toeViikot: mockRow?.toeViikot ?? 0,
        jakaja: mockRow?.jakaja ?? 0
      };
    
    let newData = { ...currentRowData, [field]: value };
    
    // Kaikki kentät ovat nyt itsenäisiä - ei automaattisia laskentoja
    setRowData(prev => ({ ...prev, [rowId]: newData }));
    
    // Tallennetaan vain jos käyttäjä muuttaa
    if (field === 'toeViikot' || field === 'tunnitYhteensä' || field === 'jakaja' || field === 'vähennäTOE' || field === 'lisäteksti') {
      onSave(period.id, rowId, newData);
    }
  };

  const toISO = (fi: string): string => {
    const d = parseFinnishDate(fi);
    return d ? formatDateISO(d) : "";
  };

  const fromISO = (iso: string): string => {
    if (!iso) return "";
    return isoToFI(iso);
  };

  const handleAddNewRow = () => {
    setIsAddingRow(true);
    setNewRowData({
      alkupäivä: '',
      loppupäivä: '',
      työnantaja: '',
      lisäteksti: '',
      vähennäTOE: 0,
      tunnitYhteensä: 0,
      toeViikot: 0,
      jakaja: 0
    });
  };

  const handleAutoSave = () => {
    if (newRowData.alkupäivä && newRowData.loppupäivä && onAdd) {
      // Varmista että vähennäTOE ei ole tyhjä
      const finalData = {
        ...newRowData,
        vähennäTOE: newRowData.vähennäTOE || 0
      };
      
      onAdd(period.id, finalData);
      setIsAddingRow(false);
      setNewRowData({
        alkupäivä: '',
        loppupäivä: '',
        työnantaja: '',
        lisäteksti: '',
        vähennäTOE: 0,
        tunnitYhteensä: 0,
        toeViikot: 0,
        jakaja: 0
      });
    }
  };

  const handleCancelAdd = () => {
    setIsAddingRow(false);
    setNewRowData({
      alkupäivä: '',
      loppupäivä: '',
      työnantaja: '',
      lisäteksti: '',
      vähennäTOE: 0,
      tunnitYhteensä: 0,
      toeViikot: 0,
      jakaja: 0
    });
  };

  return (
    <div className="space-y-4">
      {/* Salary Details Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="bg-white px-4 py-2 border-b border-gray-300 flex justify-between items-center">
          <h3 className="text-sm font-medium">Palkkatiedot</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpandedSalary(!expandedSalary)}
            className="h-7 px-2"
          >
            {expandedSalary ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        
        {expandedSalary && (
          <div className="p-0">
            <table className="min-w-full">
              <thead className="bg-[#003479] text-white">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium">Huom</th>
                  <th className="px-3 py-2 text-left text-xs font-medium">Maksupäivä</th>
                  <th className="px-3 py-2 text-left text-xs font-medium">Tulolaji</th>
                  <th className="px-3 py-2 text-left text-xs font-medium">Palkka</th>
                  <th className="px-3 py-2 text-left text-xs font-medium">Alkuperäinen tulo</th>
                  <th className="px-3 py-2 text-left text-xs font-medium">Ansainta-aika</th>
                  <th className="px-3 py-2 text-left text-xs font-medium">Kohdistus TOE</th>
                  <th className="px-3 py-2 text-left text-xs font-medium">Työnantajat</th>
                  <th className="px-3 py-2 text-left text-xs font-medium">Toiminto</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Ryhmittele viikkotiedot kuukausittain
                  const monthlyData: {[key: string]: any} = {};
                  
                  period.viikkoTOERows?.forEach((week) => {
                    const month = week.alkupäivä.split('.')[1]; // "8" elokuusta
                    if (!monthlyData[month]) {
                      monthlyData[month] = {
                        maksupaiva: `25.${month}.2024`,
                        weeks: [],
                        totalPalkka: 0,
                        totalTunnit: 0
                      };
                    }
                    monthlyData[month].weeks.push(week);
                    monthlyData[month].totalPalkka += week.palkka;
                    monthlyData[month].totalTunnit += week.tunnitYhteensä;
                  });
                  
                  // Luo tulolajit jokaiselle kuukaudelle (käytä samoja tulolajeja kuin EuroTOE)
                  return Object.values(monthlyData)
                    .sort((a: any, b: any) => b.maksupaiva.localeCompare(a.maksupaiva)) // Tuorein ylimmäksi
                    .map((monthData: any, monthIndex: number) => {
                      const tulolajit: any[] = [];
                      
                      // Aikapalkka (pääasiallinen palkka)
                      tulolajit.push({
                        id: `aikapalkka-${monthIndex}`,
                        maksupaiva: monthData.maksupaiva,
                        tulolaji: "Aikapalkka",
                        palkka: Math.round(monthData.totalPalkka * 0.7), // Päivittyy kun ViikkoTOE muuttuu
                        alkuperainenTulo: 2800, // Tulorekisterin alkuperäinen arvo (ei muutu)
                        ansaintaAika: `${monthData.weeks[0].alkupäivä} - ${monthData.weeks[monthData.weeks.length-1].loppupäivä}`,
                        kohdistusTOE: "",
                        tyonantajat: monthData.weeks[0].työnantaja
                      });
                      
                      // Lomaraha
                      tulolajit.push({
                        id: `lomaraha-${monthIndex}`,
                        maksupaiva: monthData.maksupaiva,
                        tulolaji: "Lomaraha",
                        palkka: Math.round(monthData.totalPalkka * 0.15), // Päivittyy kun ViikkoTOE muuttuu
                        alkuperainenTulo: 400, // Tulorekisterin alkuperäinen arvo (ei muutu)
                        ansaintaAika: `${monthData.weeks[0].alkupäivä} - ${monthData.weeks[monthData.weeks.length-1].loppupäivä}`,
                        kohdistusTOE: "",
                        tyonantajat: monthData.weeks[0].työnantaja
                      });
                      
                      // Tulospalkka (jos keskimäärin > 18h/viikko)
                      const avgHoursPerWeek = monthData.totalTunnit / monthData.weeks.length;
                      if (avgHoursPerWeek > 18) {
                        tulolajit.push({
                          id: `tulospalkka-${monthIndex}`,
                          maksupaiva: monthData.maksupaiva,
                          tulolaji: "Tulospalkka",
                          palkka: Math.round(monthData.totalPalkka * 0.1), // Päivittyy kun ViikkoTOE muuttuu
                          alkuperainenTulo: 200, // Tulorekisterin alkuperäinen arvo (ei muutu)
                          ansaintaAika: `${monthData.weeks[0].alkupäivä} - ${monthData.weeks[monthData.weeks.length-1].loppupäivä}`,
                          kohdistusTOE: "",
                          tyonantajat: monthData.weeks[0].työnantaja
                        });
                      }
                      
                      // Työkorvaus (jos keskimäärin > 18h/viikko)
                      if (avgHoursPerWeek > 18) {
                        tulolajit.push({
                          id: `tyokorvaus-${monthIndex}`,
                          maksupaiva: monthData.maksupaiva,
                          tulolaji: "Työkorvaus",
                          palkka: Math.round(monthData.totalPalkka * 0.05), // Päivittyy kun ViikkoTOE muuttuu
                          alkuperainenTulo: 100, // Tulorekisterin alkuperäinen arvo (ei muutu)
                          ansaintaAika: `${monthData.weeks[0].alkupäivä} - ${monthData.weeks[monthData.weeks.length-1].loppupäivä}`,
                          kohdistusTOE: "",
                          tyonantajat: monthData.weeks[0].työnantaja
                        });
                      }
                    
                    return tulolajit.map((tulolaji, tulolajiIndex) => {
                      // Tunnista kuukauden vaihtuminen
                      const isFirstRowOfMonth = tulolajiIndex === 0;
                      const isMonthChange = tulolajiIndex > 0 && 
                        tulolajit[tulolajiIndex - 1].maksupaiva !== tulolaji.maksupaiva;
                      
                      return (
                        <tr 
                          key={tulolaji.id} 
                          className={`border-b ${isFirstRowOfMonth || isMonthChange ? 'bg-blue-50 border-blue-200' : ''}`}
                        >
                          <td className="px-3 py-2 text-sm"></td>
                          <td className="px-3 py-2 text-sm">{tulolaji.maksupaiva}</td>
                          <td className="px-3 py-2 text-sm">{tulolaji.tulolaji}</td>
                          <td className="px-3 py-2 text-sm">{formatCurrency(tulolaji.palkka)}</td> {/* Päivittyy */}
                          <td className="px-3 py-2 text-sm">{formatCurrency(tulolaji.alkuperainenTulo)}</td> {/* Ei muutu */}
                          <td className="px-3 py-2 text-sm">{(tulolaji.tulolaji === "Tulospalkkio" || tulolaji.tulolaji === "Bonus") && !tulolaji.huom?.startsWith('Kohdistettu') ? tulolaji.ansaintaAika : ""}</td>
                          <td className="px-3 py-2 text-sm">{tulolaji.kohdistusTOE}</td>
                          <td className="px-3 py-2 text-sm">{tulolaji.tyonantajat}</td>
                          <td className="px-3 py-2 text-sm">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-blue-600 hover:text-blue-800">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-56 p-2" align="end">
                                <div className="flex flex-col gap-1">
                                  <Button variant="ghost" className="justify-start text-sm font-normal">
                                    Muokkaa palkkatietoa
                                  </Button>
                                  <Button variant="ghost" className="justify-start text-sm font-normal text-red-600 hover:text-red-700 hover:bg-red-50">
                                    <AlertCircle className="h-4 w-4 mr-2" />
                                    Poista palkkatieto
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </td>
                        </tr>
                      );
                    });
                  }).flat();
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ViikkoTOE Yhteenvetokortti */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="grid grid-cols-8 gap-3 mb-4">
          <div className="text-center">
            <div className="text-xs font-medium text-gray-600 mb-1">Alkupäivä</div>
            <div className="text-sm font-bold text-gray-900">{period.viikkoTOERows?.[0]?.alkupäivä || ""}</div>
          </div>
          
          <div className="text-center">
            <div className="text-xs font-medium text-gray-600 mb-1">Loppupäivä</div>
            <div className="text-sm font-bold text-gray-900">{period.viikkoTOERows?.[period.viikkoTOERows.length - 1]?.loppupäivä || ""}</div>
          </div>
          
          <div className="text-center">
            <div className="text-xs font-medium text-gray-600 mb-1">Työnantaja</div>
            <div className="text-sm font-bold text-gray-900">{period.viikkoTOERows?.[0]?.työnantaja || ""}</div>
          </div>
          
          <div className="text-center">
            <div className="text-xs font-medium text-gray-600 mb-1">Palkat yhteensä</div>
            <div className="text-sm font-bold text-gray-900">{formatCurrency(period.palkka - viikkoTOEVähennysSumma)}</div>
          </div>
          
          <div className="text-center">
            <div className="text-xs font-medium text-gray-600 mb-1">TOEviikot</div>
            <div className="text-sm font-bold text-gray-900">
              {Math.floor(period.viikkoTOERows?.reduce((sum, row) => {
                const currentData = {
                  ...row,
                  ...rowData[row.id],
                  toeViikot: rowData[row.id]?.toeViikot ?? row.toeViikot ?? 0
                };
                return sum + currentData.toeViikot;
              }, 0) || 0)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xs font-medium text-gray-600 mb-1">Jakaja</div>
            <div className="text-sm font-bold text-gray-900">
              {Math.round(period.viikkoTOERows?.reduce((sum, row) => {
                const currentData = {
                  ...row,
                  ...rowData[row.id],
                  jakaja: rowData[row.id]?.jakaja ?? row.jakaja ?? 0
                };
                return sum + currentData.jakaja;
              }, 0) || 0)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xs font-medium text-gray-600 mb-1">TOE-tunnit</div>
            <div className="text-sm font-bold text-gray-900">{viikkoTOEToeTunnitSumma}</div>
          </div>
          
          <div className="text-center">
            <div className="text-xs font-medium text-gray-600 mb-1">Tunnit yhteensä</div>
            <div className="text-sm font-bold text-gray-900">{viikkoTOETunnitSumma}</div>
          </div>
        </div>
        
        <div className="w-full h-1 bg-teal-500 rounded-full"></div>
      </div>

      {/* Date Filter Section ja Muokkaa viikkotietoja Button */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Alkupäivä:</label>
            <input 
              type="date" 
              value={filterStartDate} 
              onChange={(e) => {
                setFilterStartDate(e.target.value);
                if (e.target.value && !expandedWeeks) {
                  setExpandedWeeks(true);
                }
              }} 
              className="px-2 py-1 border border-gray-300 rounded text-sm" 
              max="2024-09-01"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Loppupäivä:</label>
            <input 
              type="date" 
              value={filterEndDate} 
              onChange={(e) => {
                setFilterEndDate(e.target.value);
                if (e.target.value && !expandedWeeks) {
                  setExpandedWeeks(true);
                }
              }} 
              className="px-2 py-1 border border-gray-300 rounded text-sm" 
              max="2024-09-01"
            />
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setExpandedWeeks(!expandedWeeks)}
        >
          {expandedWeeks ? 'Piilota ajanjaksot' : 'Näytä ajanjaksot'}
        </Button>
        </div>
      </div>

      {/* Detailed Weekly Rows */}
      {expandedWeeks && (
        <table className="min-w-full border border-gray-300 bg-white">
          <thead className="bg-[#003479] text-white">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium">Huom</th>
              <th className="px-3 py-2 text-left text-xs font-medium">Alkupäivä</th>
              <th className="px-3 py-2 text-left text-xs font-medium">Loppupäivä</th>
              <th className="px-3 py-2 text-left text-xs font-medium">Työnantaja</th>
              <th className="px-3 py-2 text-left text-xs font-medium">Lisäteksti</th>
              <th className="px-3 py-2 text-left text-xs font-medium">Palkka</th>
              <th className="px-3 py-2 text-left text-xs font-medium">Tunnit</th>
              <th className="px-3 py-2 text-left text-xs font-medium">TOEviikot</th>
              <th className="px-3 py-2 text-left text-xs font-medium">Jakaja</th>
              <th className="px-3 py-2 text-left text-xs font-medium">Toiminto</th>
            </tr>
          </thead>
          <tbody>
            {/* New row form */}
            {isAddingRow && (
              <tr className="bg-blue-50 border-2 border-blue-300">
                <td className="px-3 py-2 text-sm"></td>
                <td className="px-3 py-2 text-sm">
                  <input
                    type="date"
                    value={toISO(newRowData.alkupäivä)}
                    onChange={(e) => setNewRowData({...newRowData, alkupäivä: fromISO(e.target.value)})}
                    onBlur={() => setTimeout(handleAutoSave, 200)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    max="2024-09-01"
                  />
                </td>
                <td className="px-3 py-2 text-sm">
                  <input
                    type="date"
                    value={toISO(newRowData.loppupäivä)}
                    onChange={(e) => setNewRowData({...newRowData, loppupäivä: fromISO(e.target.value)})}
                    onBlur={() => setTimeout(handleAutoSave, 200)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    max="2024-09-01"
                  />
                </td>
                <td className="px-3 py-2 text-sm">
                  <input
                    type="text"
                    value={newRowData.työnantaja}
                    onChange={(e) => setNewRowData({...newRowData, työnantaja: e.target.value})}
                    onBlur={() => setTimeout(handleAutoSave, 200)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </td>
                <td className="px-3 py-2 text-sm">
                  <input
                    type="text"
                    value={newRowData.lisäteksti || ""}
                    onChange={(e) => setNewRowData({...newRowData, lisäteksti: e.target.value})}
                    onBlur={() => setTimeout(handleAutoSave, 200)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Lisää teksti..."
                  />
                </td>
                <td className="px-3 py-2 text-sm">
                  <input
                    type="number"
                    value={newRowData.vähennäTOE || 0}
                    onChange={(e) => setNewRowData({...newRowData, vähennäTOE: parseFloat(e.target.value) || 0})}
                    onBlur={() => setTimeout(handleAutoSave, 200)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    step="0.01"
                  />
                </td>
                <td className="px-3 py-2 text-sm">
                  <input
                    type="number"
                    value={newRowData.tunnitYhteensä || 18}
                    onChange={(e) => setNewRowData({...newRowData, tunnitYhteensä: parseInt(e.target.value) || 0})}
                    onBlur={() => setTimeout(handleAutoSave, 200)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    step="1"
                  />
                </td>
                <td className="px-3 py-2 text-sm">
                  <input
                    type="number"
                    value={newRowData.toeViikot || 1}
                    onChange={(e) => setNewRowData({...newRowData, toeViikot: parseFloat(e.target.value) || 0})}
                    onBlur={() => setTimeout(handleAutoSave, 200)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    step="0.5"
                  />
                </td>
                <td className="px-3 py-2 text-sm">
                  <input
                    type="number"
                    value={newRowData.jakaja || 5}
                    onChange={(e) => setNewRowData({...newRowData, jakaja: parseInt(e.target.value) || 0})}
                    onBlur={() => setTimeout(handleAutoSave, 200)}
                    className="w-16 px-1 py-1 border border-gray-300 rounded text-xs"
                    min="0"
                    max="5"
                    step="1"
                  />
                </td>
                <td className="px-3 py-2 text-sm">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-600 hover:text-red-700"
                    onClick={handleCancelAdd}
                  >
                    Peruuta
                  </Button>
                </td>
              </tr>
            )}
            
            {filteredWeeks.map((row) => {
              const currentData = {
                ...row, // Mock data kaikki kentät
                ...rowData[row.id], // Muokatut arvot jos on
                // Default arvot jos ei ole muokattu - käytä mock datan arvoja tai 0
                palkka: rowData[row.id]?.palkka ?? 0,
                tunnitYhteensä: rowData[row.id]?.tunnitYhteensä ?? row.tunnitYhteensä ?? 0,
                toeViikot: rowData[row.id]?.toeViikot ?? row.toeViikot ?? 0,
                jakaja: rowData[row.id]?.jakaja ?? row.jakaja ?? 0
              };
              
              return (
                <tr key={row.id} className="border-b">
                  <td className="px-3 py-2 text-sm"></td>
                  <td className="px-3 py-2 text-sm">{currentData.alkupäivä}</td>
                  <td className="px-3 py-2 text-sm">{currentData.loppupäivä}</td>
                  <td className="px-3 py-2 text-sm">{currentData.työnantaja}</td>
                  <td className="px-3 py-2 text-sm">
                    <input 
                      type="text" 
                      value={currentData.lisäteksti || ""} 
                      onChange={(e) => handleInputChange(row.id, 'lisäteksti', e.target.value)} 
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm" 
                      placeholder="Lisää teksti..."
                    />
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <input 
                      type="number" 
                      value={currentData.vähennäTOE || 0} 
                      onChange={(e) => handleInputChange(row.id, 'vähennäTOE', parseFloat(e.target.value) || 0)} 
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm" 
                      step="0.01" 
                    />
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <input 
                      type="number" 
                      value={currentData.tunnitYhteensä ?? 0} 
                      onChange={(e) => handleInputChange(row.id, 'tunnitYhteensä', parseFloat(e.target.value) || 0)} 
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm" 
                      step="1" 
                    />
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <input 
                      type="number" 
                      value={currentData.toeViikot ?? 0} 
                      onChange={(e) => handleInputChange(row.id, 'toeViikot', parseFloat(e.target.value) || 0)} 
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm" 
                      step="0.5"
                    />
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <input 
                      type="number" 
                      value={currentData.jakaja ?? 0} 
                      onChange={(e) => handleInputChange(row.id, 'jakaja', parseFloat(e.target.value) || 0)} 
                      className="w-16 px-1 py-1 border border-gray-300 rounded text-xs" 
                      min="0"
                      max="5"
                      step="1"
                    />
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-blue-600 hover:text-blue-800">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2" align="end">
                        <div className="flex flex-col gap-1">
                          <Button variant="ghost" className="justify-start text-sm font-normal">
                            Muokkaa viikkotietoa
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="justify-start text-sm font-normal text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => onDelete(period.id, row.id)}
                          >
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Poista viikkotieto
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </td>
                </tr>
              );
            })}
            {/* Total Row */}
            <tr className="bg-gray-50 font-medium">
              <td className="px-3 py-2 text-sm"></td>
              <td className="px-3 py-2 text-sm"></td>
              <td className="px-3 py-2 text-sm"></td>
              <td className="px-3 py-2 text-sm"></td>
              <td className="px-3 py-2 text-sm"></td>
              <td className="px-3 py-2 text-sm"></td>
              <td className="px-3 py-2 text-sm">
                {viikkoTOETunnitSumma}
              </td>
              <td className="px-3 py-2 text-sm">
                {period.viikkoTOERows?.reduce((sum, row) => {
                  const currentData = {
                    ...row,
                    ...rowData[row.id],
                    toeViikot: rowData[row.id]?.toeViikot ?? row.toeViikot ?? 0
                  };
                  return sum + currentData.toeViikot;
                }, 0) || 0}
              </td>
              <td className="px-3 py-2 text-sm">
                {Math.round(period.viikkoTOERows?.reduce((sum, row) => {
                const currentData = {
                  ...row,
                  ...rowData[row.id],
                  jakaja: rowData[row.id]?.jakaja ?? row.jakaja ?? 0
                };
                return sum + currentData.jakaja;
              }, 0) || 0)}
              </td>
              <td className="px-3 py-2 text-sm"></td>
            </tr>
          </tbody>
        </table>
      )}


      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="ghost" size="sm" onClick={handleAddNewRow} disabled={isAddingRow}>
          Lisää jakso
        </Button>
        <Button variant="ghost" size="sm">Peruuta muutokset</Button>
      </div>
    </div>
  );
}


