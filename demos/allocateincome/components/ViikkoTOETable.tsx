"use client";

import React, { useState, useEffect } from "react";
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
  formatCurrency,
}: {
  period: MonthPeriod;
  onSave: (periodId: string, rowId: string, updatedRow: any) => void;
  onDelete: (periodId: string, rowId: string) => void;
  formatCurrency: (n: number) => string;
}) {
  const [rowData, setRowData] = useState<{[key: string]: any}>({});
  const [expandedWeeks, setExpandedWeeks] = useState<boolean>(false);
  const [expandedSalary, setExpandedSalary] = useState<boolean>(true);

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

  const handleInputChange = (rowId: string, field: string, value: any) => {
    // Estä vain TOEviikot muokkaus - jakaja voi olla muokattavissa
    if (field === 'toeViikot') {
      return;
    }
    
    const currentRowData = rowData[rowId] || period.viikkoTOERows?.find(r => r.id === rowId) || {};
    const newData = { ...currentRowData, [field]: value };
    
    // Laske automaattisesti jos tunnit muuttuvat
    if (field === 'tunnitYhteensä') {
      newData.toeViikot = calculateTOEWeeks(value || 0);
      // Aseta jakaja aina tuntimääriin perustuen
      newData.jakaja = calculateWorkingDays(value || 0);
      
      // Tallenna automaattisesti
      onSave(period.id, rowId, newData);
    }
    
    setRowData(prev => ({ ...prev, [rowId]: newData }));
  };

  const toISO = (fi: string): string => {
    const d = parseFinnishDate(fi);
    return d ? formatDateISO(d) : "";
  };

  const fromISO = (iso: string): string => {
    if (!iso) return "";
    return isoToFI(iso);
  };

  return (
    <div className="space-y-4">
      {/* Summary Section */}
      <div className="bg-blue-50 border border-blue-200 rounded p-3">
        <div className="text-sm text-blue-800">
          <strong>ViikkoTOE-historia:</strong> Tämä kuukausi on ennen 2.9.2024, 
          joten käytetään ViikkoTOE-laskentaa. TOE-kertymä tarvitaan täydentämään 
          nykyistä EuroTOE-aikaa.
        </div>
      </div>

      {/* Salary Details Section */}
      <div className="border border-gray-300 bg-white rounded">
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex justify-between items-center">
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
              <thead className="bg-gray-50">
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
                          <td className="px-3 py-2 text-sm">{tulolaji.ansaintaAika}</td>
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

      {/* Summary Row */}
      <table className="min-w-full border border-gray-300 bg-white">
        <thead className="bg-[#003479] text-white">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium">Huom</th>
            <th className="px-3 py-2 text-left text-xs font-medium">Alkupäivä</th>
            <th className="px-3 py-2 text-left text-xs font-medium">Loppupäivä</th>
            <th className="px-3 py-2 text-left text-xs font-medium">Työnantaja</th>
            <th className="px-3 py-2 text-left text-xs font-medium">Selite</th>
            <th className="px-3 py-2 text-left text-xs font-medium">Palkka</th>
            <th className="px-3 py-2 text-left text-xs font-medium">TOEviikot</th>
            <th className="px-3 py-2 text-left text-xs font-medium">Jakaja</th>
            <th className="px-3 py-2 text-left text-xs font-medium">TOE-tunnit</th>
            <th className="px-3 py-2 text-left text-xs font-medium">Tunnit yhteensä</th>
            <th className="px-3 py-2 text-left text-xs font-medium">Toiminto</th>
          </tr>
        </thead>
        <tbody>
          {/* Summary Row */}
          <tr className="bg-gray-50">
            <td className="px-3 py-2 text-sm"></td>
            <td className="px-3 py-2 text-sm">
              {period.viikkoTOERows?.[0]?.alkupäivä || ""}
            </td>
            <td className="px-3 py-2 text-sm">
              {period.viikkoTOERows?.[period.viikkoTOERows.length - 1]?.loppupäivä || ""}
            </td>
            <td className="px-3 py-2 text-sm">
              {period.viikkoTOERows?.[0]?.työnantaja || ""}
            </td>
            <td className="px-3 py-2 text-sm"></td>
            <td className="px-3 py-2 text-sm font-medium">{formatCurrency(period.palkka)}</td>
            <td className="px-3 py-2 text-sm font-medium">
              {Math.floor(period.viikkoTOERows?.reduce((sum, row) => sum + row.toeViikot, 0) || 0)}
            </td>
            <td className="px-3 py-2 text-sm font-medium">
              {period.viikkoTOERows?.reduce((sum, row) => sum + row.jakaja, 0) || 0}
            </td>
            <td className="px-3 py-2 text-sm font-medium">
              {period.viikkoTOERows?.reduce((sum, row) => sum + row.toeTunnit, 0) || 0}
            </td>
            <td className="px-3 py-2 text-sm font-medium">
              {period.viikkoTOERows?.reduce((sum, row) => sum + row.tunnitYhteensä, 0) || 0}
            </td>
            <td className="px-3 py-2 text-sm"></td>
          </tr>
        </tbody>
      </table>

      {/* Muokkaa viikkotietoja Button */}
      <div className="flex justify-start">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setExpandedWeeks(!expandedWeeks)}
        >
          {expandedWeeks ? 'Piilota viikkotiedot' : 'Muokkaa viikkotietoja'}
        </Button>
      </div>

      {/* Detailed Weekly Rows */}
      {expandedWeeks && (
        <table className="min-w-full border border-gray-300 bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium">Huom</th>
              <th className="px-3 py-2 text-left text-xs font-medium">Alkupäivä</th>
              <th className="px-3 py-2 text-left text-xs font-medium">Loppupäivä</th>
              <th className="px-3 py-2 text-left text-xs font-medium">Työnantaja</th>
              <th className="px-3 py-2 text-left text-xs font-medium">Palkka</th>
              <th className="px-3 py-2 text-left text-xs font-medium">Tunnit</th>
              <th className="px-3 py-2 text-left text-xs font-medium">TOEviikot</th>
              <th className="px-3 py-2 text-left text-xs font-medium">Jakaja</th>
              <th className="px-3 py-2 text-left text-xs font-medium">Toiminto</th>
            </tr>
          </thead>
          <tbody>
            {(period.viikkoTOERows || []).map((row) => {
              const currentData = rowData[row.id] || row;
              
              return (
                <tr key={row.id} className="border-b">
                  <td className="px-3 py-2 text-sm"></td>
                  <td className="px-3 py-2 text-sm">{currentData.alkupäivä}</td>
                  <td className="px-3 py-2 text-sm">{currentData.loppupäivä}</td>
                  <td className="px-3 py-2 text-sm">{currentData.työnantaja}</td>
                  <td className="px-3 py-2 text-sm">{formatCurrency(currentData.palkka)}</td>
                  <td className="px-3 py-2 text-sm">
                    <input 
                      type="number" 
                      value={currentData.tunnitYhteensä || ''} 
                      onChange={(e) => handleInputChange(row.id, 'tunnitYhteensä', parseFloat(e.target.value) || 0)} 
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm" 
                      step="0.1" 
                    />
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <span className="font-medium text-blue-600">{calculateTOEWeeks(currentData.tunnitYhteensä || 0)}</span>
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <input 
                      type="number" 
                      value={currentData.jakaja || calculateWorkingDays(currentData.tunnitYhteensä || 0)} 
                      onChange={(e) => handleInputChange(row.id, 'jakaja', parseFloat(e.target.value) || 0)} 
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
                      onClick={() => onDelete(period.id, row.id)}
                      className="h-7 px-2 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
              <td className="px-3 py-2 text-sm">
                {period.viikkoTOERows?.reduce((sum, row) => sum + row.tunnitYhteensä, 0) || 0}
              </td>
              <td className="px-3 py-2 text-sm">
                {period.viikkoTOERows?.reduce((sum, row) => sum + row.toeViikot, 0) || 0}
              </td>
              <td className="px-3 py-2 text-sm">
                {period.viikkoTOERows?.reduce((sum, row) => sum + row.jakaja, 0) || 0}
              </td>
              <td className="px-3 py-2 text-sm"></td>
            </tr>
          </tbody>
        </table>
      )}


      {/* Action Buttons */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm">Peruuta muutokset</Button>
      </div>
    </div>
  );
}


