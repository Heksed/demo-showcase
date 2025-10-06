import React from "react";
import { DemoCard } from "../components/cards/Democard";
import CalmKoi from "@/components/CalmKoi";

const demos = [
  {
    slug: "massapaatokset",
    title: "Mass decisions",
    description: "Whenever you feel like making A LOT of decisions",
  },
  {
    slug: "allowancecalculator",
    title: "Daily allowance calculator",
    description: "Sometimes it's good to mingle with numbers",
  },
  {
    slug: "massincomesplit",
    title: "Mass-splitting income types",
    description: "Place to slice some income types",
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
