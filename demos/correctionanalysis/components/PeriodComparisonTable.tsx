"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, formatDateRange } from "../../benefitpayments/utils";
import type { PeriodDifference } from "../types";

interface PeriodComparisonTableProps {
  differences: PeriodDifference[];
}

export default function PeriodComparisonTable({ differences }: PeriodComparisonTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vertailu jaksokohtaisesti</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jakso</TableHead>
              <TableHead>Ajanjakso</TableHead>
              <TableHead className="text-right">Maksettu (brutto)</TableHead>
              <TableHead className="text-right">Korjattu (brutto)</TableHead>
              <TableHead className="text-right">Erotus (brutto)</TableHead>
              <TableHead className="text-right">Maksettu (netto)</TableHead>
              <TableHead className="text-right">Korjattu (netto)</TableHead>
              <TableHead className="text-right">Erotus (netto)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {differences.map((diff) => (
              <TableRow key={diff.periodId}>
                <TableCell className="font-medium">{diff.periodLabel}</TableCell>
                <TableCell>{formatDateRange(diff.periodStart, diff.periodEnd)}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(diff.originalGross)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(diff.correctedGross)}
                </TableCell>
                <TableCell className={`text-right font-semibold ${
                  diff.grossDifference < 0 ? "text-red-600" : "text-green-600"
                }`}>
                  {formatCurrency(diff.grossDifference)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(diff.originalNet)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(diff.correctedNet)}
                </TableCell>
                <TableCell className={`text-right font-semibold ${
                  diff.netDifference < 0 ? "text-red-600" : "text-green-600"
                }`}>
                  {formatCurrency(diff.netDifference)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

