"use client";

// app/massincomesplit/page.tsx
import MassIncomeSplitPrototype from "@/demos/massincomesplit/Massincomesplit";
import DemoPage from "@/components/DemoPage";

export default function Page() {
  return (
    <DemoPage
      title="Mass Income Split"
      description="Make some great splits."
    >
      <MassIncomeSplitPrototype />
    </DemoPage>
  );
}