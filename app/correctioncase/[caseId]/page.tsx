"use client";

import { useParams, useSearchParams } from "next/navigation";
import DemoPage from "@/components/DemoPage";
import DemoNavigation from "@/components/DemoNavigation";
import CorrectionCaseView from "@/demos/correctioncase/CorrectionCase";

export default function CorrectionCasePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const caseId = params.caseId as string;
  const analysisId = searchParams.get("analysisId");
  
  return (
    <>
      <DemoNavigation currentSlug="correctioncase" />
      <DemoPage>
        <CorrectionCaseView caseId={caseId} analysisId={analysisId || undefined} />
      </DemoPage>
    </>
  );
}

