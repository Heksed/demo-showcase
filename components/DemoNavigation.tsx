import React from "react";
import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const demos = [
  { slug: "allowancecalculator", title: "Daily allowance calculator" },
  { slug: "massapaatokset", title: "Mass decisions" },
  { slug: "massincomesplit", title: "Mass Income Split" },
  { slug: "allocateincome", title: "Allocate income" },
  { slug: "modularforms", title: "Modular forms" },
];

export default function DemoNavigation({ currentSlug }: { currentSlug: string }) {
  return (
    <div className="mb-6 p-4 bg-gray-50 border rounded-lg">
      <div className="flex items-center gap-4 mb-3">
        <Link href="/">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Etusivu
          </Button>
        </Link>
        <div className="text-sm text-gray-600">
          <ArrowLeft className="h-4 w-4 inline mr-1" />
          Demot
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {demos.map((demo) => (
          <Link key={demo.slug} href={`/${demo.slug}`}>
            <Button 
              variant={currentSlug === demo.slug ? "default" : "outline"}
              size="sm"
              className="text-xs"
            >
              {demo.title}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}
