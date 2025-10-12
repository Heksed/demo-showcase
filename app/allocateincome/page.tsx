import React from "react";
import DemoPage from "@/components/DemoPage";
import AllocateIncome from "@/demos/allocateincome/Allocateincome";

export default function AllocateIncomePage() {
  return (
    <DemoPage
      title="Tulotietojen kohdistaminen"
      description="Kohdista tulotiedot oikeisiin ajanjaksoihin eri menetelmillä."
    >
      <AllocateIncome />
    </DemoPage>
  );
}

