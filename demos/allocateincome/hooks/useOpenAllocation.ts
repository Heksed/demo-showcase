import type { IncomeRow, MonthPeriod, AllocationContext } from "../types";

type AllocationApi = {
  setAllocationContext: (ctx: any) => void;
  setAllocationMethod: (method: any) => void;
  setStartDate: (d: any) => void;
  setEndDate: (d: any) => void;
  setModalOpen: (open: any) => void;
  setViewMode: (view: any) => void;
};

export default function useOpenAllocation(
  allocation: AllocationApi,
  isRowDeleted: (row: IncomeRow) => boolean,
  NON_BENEFIT_AFFECTING_INCOME_TYPES: string[]
) {
  const openAllocationModalSingle = (row: IncomeRow) => {
    const context: AllocationContext = {
      mode: "single",
      payDate: row.maksupaiva,
      sourceRows: [row],
      totalAmount: row.alkuperainenTulo > 0 ? row.alkuperainenTulo : row.palkka,
    } as AllocationContext;
    allocation.setAllocationContext(context);
    allocation.setAllocationMethod("period");
    allocation.setStartDate("20.1.2025");
    allocation.setEndDate("10.2.2025");
    allocation.setModalOpen(true);
    allocation.setViewMode(false);
  };

  const openAllocationModalBatch = (row: IncomeRow, period: MonthPeriod) => {
    const payDate = row.maksupaiva;
    const rowsForPayDate = period.rows.filter(r => 
      r.maksupaiva === payDate && 
      !isRowDeleted(r) &&
      (!NON_BENEFIT_AFFECTING_INCOME_TYPES.includes(r.tulolaji) || 
       r.huom?.includes("Huomioitu laskennassa"))
    );
    const totalAmount = rowsForPayDate.reduce((sum, r) => sum + (r.alkuperainenTulo > 0 ? r.alkuperainenTulo : r.palkka), 0);
    const context: AllocationContext = {
      mode: "batch",
      payDate,
      sourceRows: rowsForPayDate,
      totalAmount,
    } as AllocationContext;
    allocation.setAllocationContext(context);
    allocation.setAllocationMethod("period");
    allocation.setStartDate("20.1.2025");
    allocation.setEndDate("10.2.2025");
    allocation.setModalOpen(true);
    allocation.setViewMode(false);
  };

  return { openAllocationModalSingle, openAllocationModalBatch };
}


