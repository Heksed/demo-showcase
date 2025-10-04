import React from "react";
import { DemoCard } from "../components/cards/Democard";

const demos = [
  {
    slug: "massapaatokset",
    title: "Mass decisions",
    description: "UI for mass decision making and status overview."
  },
  {
    slug: "allowancecalculator",
    title: "Daily allowance calculator",
    description: "Table for calculating daily allowances."
  },
  {
    slug: "virheilmoitukset",
    title: "Virheilmoitukset",
    description: "Kriittiset virheet taulukkona priorisoituna (IR & maksatus)."
  }
];

export default function Page() {
  return (
    <main style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
      {demos.map(d => (
        <DemoCard key={d.slug} href={`/${d.slug}`} title={d.title} description={d.description} />
      ))}
    </main>
  );
}
