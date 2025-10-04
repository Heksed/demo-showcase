"use client"; // jos laskurikomponentti käyttää hookkeja

import DemoPage from "../../components/DemoPage";
import AllowanceCalculator from "../../demos/allowancecalculator/Allowancecalculator";

export default function Page() {
  return (
    <DemoPage
      title="Daily allowance calculator"
      description="Table for edit of daily allowances, advance payments and balance."
    >
      <AllowanceCalculator />
    </DemoPage>
  );
}
