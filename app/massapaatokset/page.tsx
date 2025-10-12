import React from "react";
import DemoPage from "../../components/DemoPage";
import MassapaatoksetDemo from "../../demos/massapaatokset/Demo";




export default function Page() {
  return (
    <DemoPage
      title="Mass decisions"
      description="Make some great decisions."
    >
      <MassapaatoksetDemo />
    </DemoPage>
  );
 
}
