import React from "react";
import { DemoCard } from "../components/cards/Democard";
import CalmKoi from "@/components/CalmKoi";

const demos = [
  {
    slug: "massapaatokset",
    title: "Mass decisions",
    description: "UI for mass decision making and status overview.",
  },
  {
    slug: "allowancecalculator",
    title: "Daily allowance calculator",
    description: "Table for calculating daily allowances.",
  },
];

export default function Page() {
  return (
    <main className="relative overflow-hidden" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
<CalmKoi />
  {demos.map(d => (
    <DemoCard key={d.slug} href={`/${d.slug}`} title={d.title} description={d.description} />
  ))}
</main>

  );
}
