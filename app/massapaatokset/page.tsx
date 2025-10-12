import React from "react";
import DemoPage from "../../components/DemoPage";
import DemoNavigation from "../../components/DemoNavigation";
import MassapaatoksetDemo from "../../demos/massapaatokset/Demo";

export default function Page() {
  return (
    <>
      <DemoNavigation currentSlug="massapaatokset" />
      <DemoPage>
        <MassapaatoksetDemo />
      </DemoPage>
    </>
  );
}
