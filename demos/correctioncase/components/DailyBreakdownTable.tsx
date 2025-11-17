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
import { formatCurrency, formatDate } from "../../benefitpayments/utils";
import type { DailyBreakdown } from "../types";

interface DailyBreakdownTableProps {
  breakdown: DailyBreakdown[];
}

export default function DailyBreakdownTable({ breakdown }: DailyBreakdownTableProps) {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Päivämäärä</TableHead>
            <TableHead className="text-right">Maksettu (€/pv)</TableHead>
            <TableHead className="text-right">Korjattu (€/pv)</TableHead>
            <TableHead className="text-right">Erotus (€/pv)</TableHead>
            <TableHead className="text-right">Maksettu (yhteensä)</TableHead>
            <TableHead className="text-right">Korjattu (yhteensä)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {breakdown.map((day, index) => (
            <TableRow key={index}>
              <TableCell>{formatDate(day.date)}</TableCell>
              <TableCell className="text-right">
                {formatCurrency(day.dailyAllowance)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(day.correctedDaily)}
              </TableCell>
              <TableCell className={`text-right font-semibold ${
                day.difference < 0 ? "text-red-600" : "text-green-600"
              }`}>
                {formatCurrency(day.difference)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(day.paid)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(day.corrected)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

