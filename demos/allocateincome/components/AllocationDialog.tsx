"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";

type Any = any;

export default function AllocationDialog({
  open,
  onOpenChange,
  viewMode,
  setViewMode,
  allocationContext,
  allocationMethod,
  setAllocationMethod,
  distributionType,
  setDistributionType,
  direction,
  setDirection,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  monthCount,
  setMonthCount,
  manualAmounts,
  setManualAmounts,
  generateMonthsFromEmployment,
  generateMonthsFromPayDate,
  validation,
  previewSplits,
  aggregatedByMonth,
  formatCurrency,
  isoToFI,
  daysBetween,
  applyAllocation,
  removeAllocation,
  MOCK_EMPLOYMENT,
  // Add Income Modal pieces to keep structure identical if needed (optional)
  children,
}: Any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="space-y-2">
            <DialogTitle>
              {viewMode ? "Kohdistustietojen tarkastelu" : (allocationContext?.mode === "single" ? "TULOLAJIN KOHDISTUS" : "MAKSUPÄIVÄN TULOLAJIEN KOHDISTUS")}
            </DialogTitle>
            <div className="flex gap-2 items-center">
              <span className="text-sm text-gray-600">Maksupäivä:</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {allocationContext?.payDate}
              </span>
            </div>
          </div>
        </DialogHeader>

        {viewMode && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
            <p className="font-medium">Kohdistustietojen tarkastelu</p>
            <p className="text-xs mt-1">Näet alkuperäiset kohdistustiedot. Voit muokata tietoja tarvittaessa.</p>
          </div>
        )}

        {allocationContext && (
          <div className="space-y-6">
            {/* Income Type Display */}
            <div className="space-y-2">
              <Label>Kohdistettava tulolaji</Label>
              {allocationContext.mode === "single" ? (
                <div className="px-3 py-2 border rounded bg-gray-50 text-sm">
                  {allocationContext.sourceRows[0]?.tulolaji}
                </div>
              ) : (
                <div className="px-3 py-2 border rounded bg-blue-50 text-sm text-blue-800">
                  Kaikki maksupäivän tulolajit huomioidaan ({allocationContext.sourceRows.length} kpl)
                </div>
              )}
            </div>

            {/* Total Amount */}
            <div className="space-y-2">
              <Label>Kokonaissumma</Label>
              <div className="px-3 py-2 border rounded bg-gray-50 text-sm font-semibold">
                {formatCurrency(allocationContext.totalAmount)} €
              </div>
            </div>

            {/* Allocation Method */}
            <div className="space-y-2">
              <Label>Kohdistustapa</Label>
              <Select value={allocationMethod} onValueChange={(v) => setAllocationMethod(v)} disabled={viewMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employment">Palvelussuhteen kesto</SelectItem>
                  <SelectItem value="period">Ajanjakso</SelectItem>
                </SelectContent>
              </Select>
              {allocationMethod === "employment" && (
                <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                  Palvelussuhde: {MOCK_EMPLOYMENT.startDate} – {MOCK_EMPLOYMENT.endDate} ({MOCK_EMPLOYMENT.employer})
                </div>
              )}
            </div>

            {/* Direction - only show for manual distribution */}
            {distributionType === "manual" && (
              <div className="space-y-2">
                <Label>Jaon suunta</Label>
                <Select value={direction} onValueChange={(v) => setDirection(v)} disabled={viewMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="backward">Maksukuukaudesta taaksepäin</SelectItem>
                    <SelectItem value="forward">Maksukuukaudesta eteenpäin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Distribution Type */}
            <div className="space-y-2">
              <Label>Jaon tyyppi</Label>
              <div className="flex gap-4">
                {([
                  { v: "byDays", label: "Päivien mukaan" },
                  { v: "equalMonths", label: "Tasan kuukausille" },
                  { v: "manual", label: "Manuaalinen" },
                ] as const).map(opt => (
                  <label key={opt.v} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="distributionType"
                      value={opt.v}
                      checked={distributionType === opt.v}
                      onChange={(e) => setDistributionType(e.target.value)}
                      disabled={viewMode}
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range (for byDays and equalMonths) */}
            {(distributionType === "byDays" || distributionType === "equalMonths") && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Alkupäivä</Label>
                  <Input 
                    type="text" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="DD.MM.YYYY"
                    disabled={allocationMethod === "employment" || viewMode}
                    className={cn((allocationMethod === "employment" || viewMode) && "bg-gray-100 cursor-not-allowed")}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Loppupäivä</Label>
                  <Input 
                    type="text" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="DD.MM.YYYY"
                    disabled={allocationMethod === "employment" || viewMode}
                    className={cn((allocationMethod === "employment" || viewMode) && "bg-gray-100 cursor-not-allowed")}
                  />
                </div>
              </div>
            )}

            {/* Month Count (for manual) */}
            {distributionType === "manual" && (
              <div className="space-y-2">
                <Label>Kuukausien määrä</Label>
                {allocationMethod === "employment" ? (
                  <div className="p-2 bg-gray-50 border rounded-md">
                    <span className="text-sm text-gray-600">
                      {(() => {
                        const start = new Date(MOCK_EMPLOYMENT.startDate.split(".").reverse().join("-"));
                        const end = new Date(MOCK_EMPLOYMENT.endDate.split(".").reverse().join("-"));
                        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                          const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
                          return `${months} kuukautta (palvelussuhteen mukaan)`;
                        }
                        return "3 kuukautta";
                      })()}
                    </span>
                  </div>
                ) : (
                  <Select value={String(monthCount)} onValueChange={(v) => setMonthCount(Number(v))} disabled={viewMode}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 5, 6, 12].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Manual Amounts Input */}
            {distributionType === "manual" && (
              <div className="space-y-3">
                <Label>Kuukausikohtaiset summat (€)</Label>
                {allocationContext.mode === "single" ? (
                  <div className="space-y-2">
                    {(allocationMethod === "employment" ? generateMonthsFromEmployment() : generateMonthsFromPayDate(allocationContext.payDate, monthCount, direction)).map((m: Any) => {
                      const key = `${m.year}-${m.month}`;
                      const monthName = new Date(m.year, m.month - 1, 1).toLocaleDateString('fi-FI', { year: 'numeric', month: 'long' });
                      return (
                        <div key={key} className="flex gap-3 items-center">
                          <div className="w-48 text-sm font-medium">{monthName}</div>
                          <Input
                            type="number"
                            step="0.01"
                            value={manualAmounts[key] ?? 0}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setManualAmounts((prev: Any) => ({ ...prev, [key]: val }));
                            }}
                            className="w-40"
                            disabled={viewMode}
                          />
                          <span className="text-sm text-gray-500">€</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allocationContext.sourceRows.map((row: Any) => {
                      const rowAmount = row.alkuperainenTulo > 0 ? row.alkuperainenTulo : row.palkka;
                      const months = allocationMethod === "employment" ? generateMonthsFromEmployment() : generateMonthsFromPayDate(allocationContext.payDate, monthCount, direction);
                      return (
                        <div key={row.id} className="border rounded-lg p-3 bg-gray-50">
                          <div className="text-sm font-semibold mb-2">{row.tulolaji} ({formatCurrency(rowAmount)} €)</div>
                          <div className="space-y-2">
                            {months.map((m: Any) => {
                              const key = `${row.id}-${m.year}-${m.month}`;
                              const monthName = new Date(m.year, m.month - 1, 1).toLocaleDateString('fi-FI', { year: 'numeric', month: 'long' });
                              return (
                                <div key={key} className="flex gap-3 items-center">
                                  <div className="w-40 text-sm">{monthName}</div>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={manualAmounts[key] ?? 0}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      setManualAmounts((prev: Any) => ({ ...prev, [key]: val }));
                                    }}
                                    className="w-32 text-sm"
                                    disabled={viewMode}
                                  />
                                  <span className="text-xs text-gray-500">€</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Validation Status */}
            <div className="flex items-center gap-2">
              {validation.valid ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700">{validation.message}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium text-red-700">{validation.message}</span>
                </>
              )}
            </div>

            {/* Preview */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Esikatselu</Label>
              {allocationContext.mode === "single" ? (
                <div className="overflow-auto border rounded-lg">
                  <table className="min-w-full text-sm">
                    <thead className="bg-[#003479] text-white">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Kuukausi</th>
                        {distributionType === "byDays" && (
                          <>
                            <th className="px-4 py-2 text-left font-medium">Ajankohta</th>
                            <th className="px-4 py-2 text-center font-medium">Päivät</th>
                          </>
                        )}
                        <th className="px-4 py-2 text-right font-medium">Summa (€)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewSplits.map((split: Any, idx: number) => {
                        const monthName = new Date(split.year, split.month - 1, 1).toLocaleDateString('fi-FI', { year: 'numeric', month: 'long' });
                        let days = 0;
                        if (distributionType === "byDays") {
                          const start = new Date(split.earningStart);
                          const end = new Date(split.earningEnd);
                          days = daysBetween(start, end);
                        }
                        return (
                          <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-4 py-2">{monthName}</td>
                            {distributionType === "byDays" && (
                              <>
                                <td className="px-4 py-2 text-xs text-gray-600">{isoToFI(split.earningStart)} – {isoToFI(split.earningEnd)}</td>
                                <td className="px-4 py-2 text-center font-medium">{days}</td>
                              </>
                            )}
                            <td className="px-4 py-2 text-right font-medium">{formatCurrency(split.amount)}</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-gray-100 font-semibold">
                        <td className="px-4 py-2" colSpan={distributionType === "byDays" ? 3 : 1}>Yhteensä</td>
                        <td className="px-4 py-2 text-right">
                          {distributionType === "byDays" && (
                            <span className="mr-4 text-xs text-gray-600">
                              ({previewSplits.reduce((sum: number, s: Any) => {
                                const start = new Date(s.earningStart);
                                const end = new Date(s.earningEnd);
                                return sum + daysBetween(start, end);
                              }, 0)} pv yhteensä)
                            </span>
                          )}
                          {formatCurrency(previewSplits.reduce((sum: number, s: Any) => sum + s.amount, 0))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-auto border rounded-lg">
                  <table className="min-w-full text-sm">
                    <thead className="bg-[#003479] text-white">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Kuukausi</th>
                        <th className="px-4 py-2 text-left font-medium">Tulolaji</th>
                        {distributionType === "byDays" && (
                          <>
                            <th className="px-4 py-2 text-left font-medium">Ajankohta</th>
                            <th className="px-4 py-2 text-center font-medium">Päivät</th>
                          </>
                        )}
                        <th className="px-4 py-2 text-right font-medium">Summa (€)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aggregatedByMonth.map((monthData: Any, mIdx: number) => {
                        const monthName = new Date(monthData.year, monthData.month - 1, 1).toLocaleDateString('fi-FI', { year: 'numeric', month: 'long' });
                        return (
                          <React.Fragment key={`${monthData.year}-${monthData.month}`}>
                            {monthData.items.map((split: Any, sIdx: number) => {
                              let days = 0;
                              if (distributionType === "byDays") {
                                const start = new Date(split.earningStart);
                                const end = new Date(split.earningEnd);
                                days = daysBetween(start, end);
                              }
                              return (
                                <tr key={`${mIdx}-${sIdx}`} className={mIdx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                  {sIdx === 0 && (
                                    <td className="px-4 py-2 font-medium" rowSpan={monthData.items.length}>{monthName}</td>
                                  )}
                                  <td className="px-4 py-2 text-xs">{split.incomeType}</td>
                                  {distributionType === "byDays" && (
                                    <>
                                      <td className="px-4 py-2 text-xs text-gray-600">{isoToFI(split.earningStart)} – {isoToFI(split.earningEnd)}</td>
                                      <td className="px-4 py-2 text-center font-medium">{days}</td>
                                    </>
                                  )}
                                  <td className="px-4 py-2 text-right">{formatCurrency(monthData.total)}</td>
                                </tr>
                              );
                            })}
                            <tr className={mIdx % 2 === 0 ? "bg-blue-50" : "bg-blue-100"}>
                              <td className="px-4 py-1 text-xs font-semibold" colSpan={distributionType === "byDays" ? 4 : 2}>Yhteensä {monthName}</td>
                              <td className="px-4 py-1 text-right text-xs font-semibold">{formatCurrency(monthData.total)}</td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                      <tr className="bg-gray-100 font-semibold">
                        <td className="px-4 py-2" colSpan={distributionType === "byDays" ? 4 : 2}>Kaikki yhteensä</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(previewSplits.reduce((sum: number, s: Any) => sum + s.amount, 0))}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {viewMode && (
            <Button variant="destructive" onClick={() => { removeAllocation(); setViewMode(false); }}>
              Poista kohdistus ja luo uusi
            </Button>
          )}
          <DialogClose asChild>
            <Button variant="secondary">Peruuta</Button>
          </DialogClose>
          {!viewMode && (
            <Button onClick={applyAllocation} disabled={!validation.valid} className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300">
              Suorita kohdistus
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


