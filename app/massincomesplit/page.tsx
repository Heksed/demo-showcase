"use client";

import MassIncomeSplitPrototype from "@/demos/massincomesplit/Massincomesplit";
import DemoPage from "@/components/DemoPage";
import DemoNavigation from "@/components/DemoNavigation";

export default function Page() {
  return (
    <>
      <DemoNavigation currentSlug="massincomesplit" />
      <DemoPage>
        <MassIncomeSplitPrototype />
      </DemoPage>
    </>
  );
}