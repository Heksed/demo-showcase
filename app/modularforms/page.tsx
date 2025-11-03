"use client";

import DemoPage from "../../components/DemoPage";
import DemoNavigation from "../../components/DemoNavigation";
import Modularforms from "../../demos/modularforms/Modularforms";

export default function Page() {
  return (
    <>
      <DemoNavigation currentSlug="modularforms" />
      <DemoPage>
        <Modularforms />
      </DemoPage>
    </>
  );
}

