"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

export function DemoCard({ 
  href, 
  title, 
  description,
  icon,
  slug,
  funFacts
}: { 
  href: string; 
  title: string; 
  description: string;
  icon?: React.ReactNode;
  slug: string;
  funFacts?: string[];
}) {
  const [views, setViews] = useState(0);
  const [randomFact, setRandomFact] = useState("");

  useEffect(() => {
    // Load view count from localStorage
    const key = `demo-${slug}-views`;
    const stored = localStorage.getItem(key);
    setViews(stored ? parseInt(stored) : 0);

    // Pick a random fun fact
    if (funFacts && funFacts.length > 0) {
      const fact = funFacts[Math.floor(Math.random() * funFacts.length)];
      setRandomFact(fact);
    }
  }, [slug, funFacts]);

  const handleClick = () => {
    const newViews = views + 1;
    setViews(newViews);
    localStorage.setItem(`demo-${slug}-views`, newViews.toString());
  };

  const getFunMessage = (count: number) => {
    if (count === 0) return "🆕 Brand new!";
    if (count === 1) return "🎯 First visit!";
    if (count < 5) return `👀 Visited ${count} times`;
    if (count < 10) return `⭐ ${count} visits - Getting cozy!`;
    if (count < 20) return `🔥 ${count} visits - On fire!`;
    return `🏆 ${count} visits - Legend!`;
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className="block rounded-xl border border-white/5 bg-[#0e141b]/60 p-4 hover:bg-[#101821]/70 transition-all group"
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex-shrink-0 mt-0.5 text-blue-400 group-hover:text-blue-300 transition-colors">
            {icon}
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-medium text-white">{title}</h3>
          <p className="text-sm text-gray-400 mt-1">{description}</p>
          
          {/* Fun stats */}
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
            <span className="text-blue-400">{getFunMessage(views)}</span>
            {randomFact && (
              <>
                <span className="text-gray-600">•</span>
                <span className="text-gray-500">{randomFact}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}