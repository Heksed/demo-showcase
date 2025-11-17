"use client";

import DemoPage from "../../components/DemoPage";
import DemoNavigation from "../../components/DemoNavigation";
import CorrectionAnalysisView from "../../demos/correctionanalysis/CorrectionAnalysis";

export default function CorrectionAnalysisPage() {
  return (
    <>
      <DemoNavigation currentSlug="correctionanalysis" />
      <DemoPage>
        <CorrectionAnalysisView />
      </DemoPage>
    </>
  );
}

