"use client";

import DemoPage from "../../components/DemoPage";
import DemoNavigation from "../../components/DemoNavigation";
import AllowanceCalculator from "../../demos/allowancecalculator/Allowancecalculator";

export default function Page() {
  return (
    <>
      <DemoNavigation currentSlug="allowancecalculator" />
      <DemoPage>
        <AllowanceCalculator />
      </DemoPage>
    </>
  );
}
