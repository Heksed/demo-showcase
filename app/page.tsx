import React from "react";
import { DemoCard } from "../components/cards/Democard";
import { ArrowLeftRight, CheckSquare, Calculator, Split } from "lucide-react";


const demos = [
  {
    slug: "massapaatokset",
    title: "Mass decisions",
    description: "Whenever you feel like making A LOT of decisions",
    icon: <CheckSquare size={24} />,
    funFacts: [
      "Decide faster than humanly possible",
      "Bulk decisions: Because time is money",
      "Handle 1000s of decisions at once",
      "Making decisions since 2024",
      "Most popular demo of the week",
      "Powered by TypeScript magic",
    ],
  },
  {
    slug: "allowancecalculator",
    title: "Daily allowance calculator",
    description: "Sometimes it's good to mingle with numbers",
    icon: <Calculator size={24} />,
    funFacts: [
      "Crunching numbers since day one",
      "100% accuracy guaranteed*",
      "Speed: Faster than Excel",
      "Precision to the cent",
      "Math has never been this fun",
      "Calculating your success",
    ],
  },
  {
    slug: "massincomesplit",
    title: "Mass-splitting income types",
    description: "Place to slice some income types",
    icon: <Split size={24} />,
    funFacts: [
      "Slicing income like a pro",
      "Split it your way",
      "1/3 + 2/3 = Perfect balance",
      "Bulk operations FTW",
      "The most precise slicer",
      "Flexibility is our middle name",
    ],
  },
  {
    slug: "allocateincome",
    title: "Allocate income data",
    description: "The money is there but it's in the wrong place",
    icon: <ArrowLeftRight size={24} />,
    funFacts: [
      "Money loves to travel!",
      "100% relocation success rate",
      "Moving money at light speed",
      "The ultimate money mover",
      "Powered by pure TypeScript",
      "Relocating finances since 2024",
      "Your money's best friend",
    ],
  },
];

export default function Page() {
  return (
    <main className="relative overflow-hidden" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>

  {demos.map(d => (
    <DemoCard 
      key={d.slug} 
      href={`/${d.slug}`} 
      title={d.title} 
      description={d.description} 
      icon={d.icon}
      slug={d.slug}
      funFacts={d.funFacts}
    />
  ))}
</main>

  );
}
