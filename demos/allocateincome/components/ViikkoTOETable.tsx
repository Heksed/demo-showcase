"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MoreVertical, AlertCircle, CheckCircle2, RotateCcw } from "lucide-react";
import { parseFinnishDate, formatDateISO, isoToFI } from "../utils";

import type { } from "react";

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

type MonthPeriod = {
  id: string;
  viikkoTOERows?: ViikkoTOERow[];
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
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  const handleEdit = (rowId: string) => {
    const row = period.viikkoTOERows?.find(r => r.id === rowId);
    if (row) {
      setEditData({ ...row });
      setEditingRow(rowId);
    }
  };

  const handleSave = (rowId: string) => {
    onSave(period.id, rowId, editData);
    setEditingRow(null);
    setEditData({});
  };

  const handleCancel = () => {
    setEditingRow(null);
    setEditData({});
  };

  const handleDelete = (rowId: string) => {
    onDelete(period.id, rowId);
  };

  const handleInputChange = (field: string, value: any) => {
    setEditData((prev: any) => ({ ...prev, [field]: value }));
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
    <div>
      <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-sm text-yellow-800">
          <strong>ViikkoTOE-historia:</strong> Tämä kuukausi on ennen 2.9.2024,
          joten käytetään ViikkoTOE-laskentaa. TOE-kertymä tarvitaan täydentämään
          nykyistä EuroTOE-aikaa.
        </p>
      </div>

      <div className="flex justify-between items-center mb-3">
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Lisää viikkotieto</Button>
        </div>
        <Button variant="ghost" size="sm">Peruuta muutokset</Button>
      </div>

      <table className="min-w-full border border-gray-300 bg-white">
        <thead className="bg-[#003479] text-white">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium">Alkupäivä</th>
            <th className="px-3 py-2 text-left text-xs font-medium">Loppupäivä</th>
            <th className="px-3 py-2 text-left text-xs font-medium">Työnantaja</th>
            <th className="px-3 py-2 text-left text-xs font-medium">Selite</th>
            <th className="px-3 py-2 text-left text-xs font-medium">Palkka (€)</th>
            <th className="px-3 py-2 text-left text-xs font-medium">TOE-viikot (kpl)</th>
            <th className="px-3 py-2 text-left text-xs font-medium">Maksettavat arkipäivät</th>
            <th className="px-3 py-2 text-left text-xs font-medium">TOE-tunnit</th>
            <th className="px-3 py-2 text-left text-xs font-medium">Tunnit yhteensä</th>
            <th className="px-3 py-2 text-left text-xs font-medium">Toiminto</th>
          </tr>
        </thead>
        <tbody>
          {(period.viikkoTOERows || []).map((row) => (
            <tr key={row.id} className="border-b">
              {editingRow === row.id ? (
                <>
                  <td className="px-3 py-2 text-sm">
                    <input
                      type="date"
                      value={toISO(editData.alkupäivä || '')}
                      onChange={(e) => handleInputChange('alkupäivä', fromISO(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <input
                      type="date"
                      value={toISO(editData.loppupäivä || '')}
                      onChange={(e) => handleInputChange('loppupäivä', fromISO(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <input type="text" value={editData.työnantaja || ''} onChange={(e) => handleInputChange('työnantaja', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <input type="text" value={editData.selite || ''} onChange={(e) => handleInputChange('selite', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <input type="number" value={editData.palkka || ''} onChange={(e) => handleInputChange('palkka', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm" step="0.01" />
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <input type="number" value={editData.toeViikot || ''} onChange={(e) => handleInputChange('toeViikot', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm" step="0.1" />
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <input type="number" value={editData.jakaja || ''} onChange={(e) => handleInputChange('jakaja', parseInt(e.target.value) || 0)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm" min={0} max={5} />
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <input type="number" value={editData.toeTunnit || ''} onChange={(e) => handleInputChange('toeTunnit', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm" step="0.1" />
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <input type="number" value={editData.tunnitYhteensä || ''} onChange={(e) => handleInputChange('tunnitYhteensä', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm" step="0.1" />
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
                          <Button variant="ghost" className="justify-start text-sm font-normal text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleSave(row.id)}>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Tallenna muutokset
                          </Button>
                          <Button variant="ghost" className="justify-start text-sm font-normal text-gray-600 hover:text-gray-700" onClick={handleCancel}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Peruuta muutokset
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </td>
                </>
              ) : (
                <>
                  <td className="px-3 py-2 text-sm">{row.alkupäivä}</td>
                  <td className="px-3 py-2 text-sm">{row.loppupäivä}</td>
                  <td className="px-3 py-2 text-sm">{row.työnantaja}</td>
                  <td className="px-3 py-2 text-sm">{row.selite}</td>
                  <td className="px-3 py-2 text-sm">{formatCurrency(row.palkka)}</td>
                  <td className="px-3 py-2 text-sm">{row.toeViikot}</td>
                  <td className="px-3 py-2 text-sm">{row.jakaja}</td>
                  <td className="px-3 py-2 text-sm">{row.toeTunnit}</td>
                  <td className="px-3 py-2 text-sm">{row.tunnitYhteensä}</td>
                  <td className="px-3 py-2 text-sm">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-blue-600 hover:text-blue-800">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2" align="end">
                        <div className="flex flex-col gap-1">
                          <Button variant="ghost" className="justify-start text-sm font-normal" onClick={() => handleEdit(row.id)}>
                            Muokkaa viikkotietoa
                          </Button>
                          <Button variant="ghost" className="justify-start text-sm font-normal text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(row.id)}>
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Poista viikkotieto
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


