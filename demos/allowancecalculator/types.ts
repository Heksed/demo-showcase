// ===============================
// Types
// ===============================

import { BENEFIT_TYPES, INCOME_OPTIONS } from "./constants";

export interface BenefitRow {
  id: string;
  name: string;
  amount: number; // hakujakson tulot/etuus
  protectedAmount?: number; // suojaosa
}

// Income row
export interface IncomeRow {
  id: string;
  type: (typeof INCOME_OPTIONS)[number]["value"];
  amount: number; // € per period
  protectedAmount?: number; // suojaosa
}

// Benefit type
export type BenefitType = (typeof BENEFIT_TYPES)[number]["value"];

// Formula configuration
export type FormulaConfig = {
  dailyBase: number;
  splitPointMonth: number;
  statDeductions: number;
  rateBelow: number;
  rateAbove: number;
  step1Threshold: number;
  step1Factor: number;
  step2Threshold: number;
  step2Factor: number;
  travelBase: number;
  travelElevated: number;
};

