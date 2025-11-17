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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { formatCurrency, formatDate } from "../utils";
import type { DailyPaymentRow } from "../types";

interface DailyPaymentTableProps {
  rows: DailyPaymentRow[];
  onActionClick?: (rowId: string, action: string) => void;
}

export default function DailyPaymentTable({ rows, onActionClick }: DailyPaymentTableProps) {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow className="bg-blue-600 text-white">
            <TableHead className="text-white">Huom</TableHead>
            <TableHead className="text-white">Ajanjakso</TableHead>
            <TableHead className="text-white">€/päivä</TableHead>
            <TableHead className="text-white">Maksetut päivät</TableHead>
            <TableHead className="text-white">Päätöksen voimassaolo</TableHead>
            <TableHead className="text-white">Päätös ja selite</TableHead>
            <TableHead className="text-white">Kulukorvaus</TableHead>
            <TableHead className="text-white">Toiminto</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.note || ""}</TableCell>
              <TableCell>
                {/* Format: "1.8.2026" for single day, or "1.8.2026 - 8.8.2026" for range */}
                {row.periodStart === row.periodEnd
                  ? formatDate(row.periodStart)
                  : `${formatDate(row.periodStart)} - ${formatDate(row.periodEnd)}`}
              </TableCell>
              <TableCell>{formatCurrency(row.dailyAllowance)}</TableCell>
              <TableCell>{row.paidDays}</TableCell>
              <TableCell>
                {formatDate(row.decisionValidFrom)}
                {row.decisionValidTo && ` - ${formatDate(row.decisionValidTo)}`}
              </TableCell>
              <TableCell>{row.decisionType}</TableCell>
              <TableCell>{row.expenseCompensation > 0 ? formatCurrency(row.expenseCompensation) : ""}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => onActionClick?.(row.id, "temporary_decision")}
                    >
                      Väliaikainen päätös
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onActionClick?.(row.id, "recovery_decision")}
                    >
                      Päätös annetaan takaisinperinnän yhteydessä
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onActionClick?.(row.id, "delete")}
                      className="text-red-600"
                    >
                      Poista päätös
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

