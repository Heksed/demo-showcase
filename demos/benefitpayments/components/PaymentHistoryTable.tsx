"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate, formatDateRange } from "../utils";
import type { PaidBenefitPeriod } from "../types";

interface PaymentHistoryTableProps {
  periods: PaidBenefitPeriod[];
}

export default function PaymentHistoryTable({ periods }: PaymentHistoryTableProps) {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Täyttymispäivä</TableHead>
            <TableHead>Tarkastelujakso</TableHead>
            <TableHead>Pidentävät jaksot pv</TableHead>
            <TableHead>Määrittelyjakso</TableHead>
            <TableHead>TOE-kuukaudet</TableHead>
            <TableHead>Jakaja</TableHead>
            <TableHead>TOE-palkka</TableHead>
            <TableHead>Brutto</TableHead>
            <TableHead>Netto</TableHead>
            <TableHead>Maksupäivä</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {periods.map((period) => (
            <TableRow key={period.id}>
              <TableCell>{formatDate(period.toeFulfillmentDate)}</TableCell>
              <TableCell>
                {formatDateRange(period.periodStart, period.periodEnd)}
              </TableCell>
              <TableCell>{period.priorPaidDays.toFixed(1)}</TableCell>
              <TableCell>{period.sourceCalculationSnapshot.period || "-"}</TableCell>
              <TableCell>{period.toeMonths}</TableCell>
              <TableCell>{period.toeSalary.toFixed(2)}</TableCell>
              <TableCell>
                {formatCurrency(period.baseSalary)}
              </TableCell>
              <TableCell className="font-medium">
                {formatCurrency(period.gross)}
              </TableCell>
              <TableCell className="font-medium">
                {formatCurrency(period.net)}
              </TableCell>
              <TableCell>{formatDate(period.paidDate)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

