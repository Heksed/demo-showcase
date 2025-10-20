"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Any = any;

export default function AddIncomeDialog({
  open,
  onOpenChange,
  filteredEmployments,
  selectedEmploymentIds,
  toggleEmploymentSelection,
  paymentDate,
  setPaymentDate,
  incomeType,
  setIncomeType,
  salaryAmount,
  setSalaryAmount,
  employmentStartDate,
  setEmploymentStartDate,
  employmentEndDate,
  setEmploymentEndDate,
  INCOME_TYPES,
  handleAddIncome,
}: Any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>LISÄÄ TULOTIETO</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Employment Relationships Section */}
          <div className="pt-4">
            <h3 className="text-lg font-semibold mb-4">Palvelussuhteet</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-4">
              <div>
                <Label>Työnantaja</Label>
                <Select /* placeholder UI only */>
                  <SelectTrigger>
                    <SelectValue placeholder="Valitse" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Espoon kaupunki">Espoon kaupunki</SelectItem>
                    <SelectItem value="Nokia Oyj">Nokia Oyj</SelectItem>
                    <SelectItem value="Posti Oyj">Posti Oyj</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Alkupäivä</Label>
                <Input placeholder="PP.KK.VVVV" value={employmentStartDate} onChange={(e) => setEmploymentStartDate(e.target.value)} />
              </div>
              <div>
                <Label>Loppupäivä</Label>
                <Input placeholder="PP.KK.VVVV" value={employmentEndDate} onChange={(e) => setEmploymentEndDate(e.target.value)} />
              </div>
              <div className="flex items-end"></div>
            </div>

            {/* Employment Relationships Table */}
            <div className="overflow-auto rounded-xl border">
              <table className="min-w-full text-sm">
                <thead className="text-white" style={{ backgroundColor: '#5F686D' }}>
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Valinta</th>
                    <th className="px-3 py-2 text-left font-medium">Työnantaja</th>
                    <th className="px-3 py-2 text-left font-medium">Selite</th>
                    <th className="px-3 py-2 text-left font-medium">Alkupäivä</th>
                    <th className="px-3 py-2 text-left font-medium">Loppupäivä</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployments.map((emp: Any, idx: number) => (
                    <tr key={emp.id} className={cn("border-b", idx % 2 === 0 ? "bg-white" : "bg-gray-50")}> 
                      <td className="px-3 py-2">
                        <input type="checkbox" checked={selectedEmploymentIds.includes(emp.id)} onChange={() => toggleEmploymentSelection(emp.id)} />
                      </td>
                      <td className="px-3 py-2">{emp.employer}</td>
                      <td className="px-3 py-2">{emp.description}</td>
                      <td className="px-3 py-2">{emp.startDate}</td>
                      <td className="px-3 py-2">{emp.endDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-2">
              <Link href="#" className="text-blue-600 hover:underline text-sm">Palvelussuhde- ja yritystoimintatiedot</Link>
            </div>
          </div>

          {/* Income Details Section */}
          <div className="pt-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label>Maksupäivä</Label>
                <Input placeholder="PP.KK.VVVV" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
              </div>
              <div>
                <Label>Tulolaji</Label>
                <Select value={incomeType} onValueChange={setIncomeType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INCOME_TYPES.map((type: string) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Palkka</Label>
                <Input placeholder="Täydennä summa" value={salaryAmount} onChange={(e) => setSalaryAmount(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Earning Period Section */}
          <div className="pt-4">
            <h3 className="text-lg font-semibold mb-4">Ansainta-aika</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label>Alkupäivä</Label>
                <Input placeholder="PP.KK.VVVV" value={employmentStartDate} onChange={(e) => setEmploymentStartDate(e.target.value)} />
              </div>
              <div>
                <Label>Loppupäivä</Label>
                <Input placeholder="PP.KK.VVVV" value={employmentEndDate} onChange={(e) => setEmploymentEndDate(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Peruuta</Button>
          </DialogClose>
          <Button onClick={handleAddIncome} className="bg-green-600 hover:bg-green-700">Tallenna ja sulje</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


