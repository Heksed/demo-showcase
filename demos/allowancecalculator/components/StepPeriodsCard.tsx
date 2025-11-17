// ===============================
// Component: Step Periods Card
// ===============================

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { euro } from "../utils";

interface StepPeriod {
  days: number;
  percentage: number;
  amount: number;
  dailyAmount: number;
  startDate?: string;
  endDate?: string;
  startDay?: number;
  endDay?: number;
}

interface StepPeriodsCardProps {
  stepPeriods: StepPeriod[] | null | undefined;
  days: number;
  periodStartDate?: string;
  periodEndDate?: string;
}

export default function StepPeriodsCard({
  stepPeriods,
  days,
  periodStartDate,
  periodEndDate,
}: StepPeriodsCardProps) {
  if (!stepPeriods || stepPeriods.length === 0) {
    return null;
  }

  return (
    <Card className="mt-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Porrastusajanjaksot</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 p-4">
        <div className="space-y-2">
          {/* Yhtenäinen jana kolmessa osassa */}
          <div className="space-y-1">
            {/* Ajanjakso tiedot palkin yläpuolella */}
            <div className="flex">
              {stepPeriods.map((period, index) => (
                <div
                  key={index}
                  className="text-sm text-gray-600 text-center"
                  style={{
                    width: `${(period.days / days) * 100}%`,
                    minWidth: "60px",
                  }}
                >
                  {periodStartDate && periodEndDate ? (
                    `${new Date(period.startDate || "").toLocaleDateString("fi-FI")} - ${new Date(period.endDate || "").toLocaleDateString("fi-FI")}`
                  ) : (
                    `Päivät ${period.startDay}-${period.endDay}`
                  )}
                </div>
              ))}
            </div>

            {/* Yhtenäinen palkki */}
            <div className="flex rounded-lg overflow-hidden">
              {stepPeriods.map((period, index) => (
                <div
                  key={index}
                  className={`h-8 flex items-center justify-center text-sm font-medium text-white ${
                    period.percentage === 100
                      ? "bg-green-600"
                      : period.percentage === 80
                        ? "bg-green-500"
                        : "bg-green-400"
                  }`}
                  style={{
                    width: `${(period.days / days) * 100}%`,
                    minWidth: "60px",
                  }}
                >
                  {period.percentage}%
                </div>
              ))}
            </div>

            {/* Jaksojen tiedot palkin alle */}
            <div className="flex">
              {stepPeriods.map((period, index) => (
                <div
                  key={index}
                  className="text-sm text-center"
                  style={{
                    width: `${(period.days / days) * 100}%`,
                    minWidth: "60px",
                  }}
                >
                  <div className="font-medium text-gray-900">{euro(period.amount)}</div>
                  <div className="text-gray-600">{euro(period.dailyAmount)}/pv</div>
                  <div className="text-xs text-gray-500 mt-0.5">{period.days} pv</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

