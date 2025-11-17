// ===============================
// Hook: Formula configuration
// ===============================

import { useState } from "react";
import type { FormulaConfig } from "../types";
import {
  DAILY_BASE,
  SPLIT_POINT_MONTH,
  STAT_DEDUCTIONS,
  TRAVEL_ALLOWANCE_BASE,
  TRAVEL_ALLOWANCE_ELEVATED,
} from "../constants";

export const defaultFormulaConfig: FormulaConfig = {
  dailyBase: DAILY_BASE, // €/pv
  splitPointMonth: SPLIT_POINT_MONTH, // €/kk
  statDeductions: STAT_DEDUCTIONS, // 0..1
  rateBelow: 0.45, // 45 %
  rateAbove: 0.20, // 20 %
  step1Threshold: 40,
  step1Factor: 0.8,
  step2Threshold: 170,
  step2Factor: 0.75,
  travelBase: TRAVEL_ALLOWANCE_BASE,
  travelElevated: TRAVEL_ALLOWANCE_ELEVATED,
};

export default function useFormulaConfig() {
  const [formulaConfig, setFormulaConfig] = useState<FormulaConfig>(() => ({
    dailyBase: Number(DAILY_BASE),
    splitPointMonth: Number(SPLIT_POINT_MONTH),
    statDeductions: Number(STAT_DEDUCTIONS),
    rateBelow: 0.45,
    rateAbove: 0.20,
    step1Threshold: 40,
    step1Factor: 0.8,
    step2Threshold: 170,
    step2Factor: 0.75,
    travelBase: Number(TRAVEL_ALLOWANCE_BASE),
    travelElevated: Number(TRAVEL_ALLOWANCE_ELEVATED),
  }));
  const [editFormulas, setEditFormulas] = useState(false);

  const setFormulaNumber =
    <K extends keyof FormulaConfig>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setFormulaConfig((v) => ({ ...v, [key]: parseFloat(e.target.value || "0") }));

  const setFormulaInt =
    <K extends keyof FormulaConfig>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setFormulaConfig((v) => ({ ...v, [key]: parseInt(e.target.value || "0", 10) }));

  const setFormulaPercent =
    (key: "statDeductions" | "rateBelow" | "rateAbove") =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setFormulaConfig((v) => ({ ...v, [key]: (parseFloat(e.target.value || "0") / 100) }));

  const resetFormulaConfig = () => {
    setFormulaConfig({ ...defaultFormulaConfig });
  };

  return {
    formulaConfig,
    setFormulaConfig,
    editFormulas,
    setEditFormulas,
    setFormulaNumber,
    setFormulaInt,
    setFormulaPercent,
    resetFormulaConfig,
  };
}

