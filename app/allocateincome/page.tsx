import React from "react";
import DemoPage from "@/components/DemoPage";
import DemoNavigation from "@/components/DemoNavigation";
import AllocateIncome from "@/demos/allocateincome/Allocateincome";

export default function AllocateIncomePage() {
  return (
    <>
      <DemoNavigation currentSlug="allocateincome" />
      <DemoPage>
        <AllocateIncome />
      </DemoPage>
    </>
  );
}

