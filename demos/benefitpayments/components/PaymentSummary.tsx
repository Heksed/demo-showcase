"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "../utils";
import type { PaymentSummary } from "../types";

interface PaymentSummaryProps {
  summary: PaymentSummary;
}

export default function PaymentSummary({ summary }: PaymentSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Yhteenveto</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Brutto</p>
            <p className="text-2xl font-bold">{formatCurrency(summary.totalGross)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Ennakonpidätys</p>
            <p className="text-2xl font-bold">{formatCurrency(summary.totalTaxWithholding)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Maksetut päivät</p>
            <p className="text-2xl font-bold">{summary.totalPaidDays}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Kulukorvaus</p>
            <p className="text-2xl font-bold">{formatCurrency(summary.totalExpenseCompensation)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Kulukorvauspäivät</p>
            <p className="text-2xl font-bold">{summary.expenseCompensationDays}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Perinnät</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(summary.totalRecoveries)}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-600">Maksetaan</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.totalPayable)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

