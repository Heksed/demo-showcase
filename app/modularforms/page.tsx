"use client";

import { Suspense } from "react";
import DemoPage from "../../components/DemoPage";
import DemoNavigation from "../../components/DemoNavigation";
import Modularforms from "../../demos/modularforms/Modularforms";

export default function Page() {
  return (
    <>
      <DemoNavigation currentSlug="modularforms" />
      <DemoPage>
        <Suspense fallback={<div>Loading...</div>}>
          <Modularforms />
        </Suspense>
      </DemoPage>
    </>
  );
}

