"use client";
import React from "react";
import Link from "next/link";

export function DemoCard({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-white/5 bg-[#0e141b]/60 p-4 hover:bg-[#101821]/70 transition-all"
    >
      <h3 className="font-medium text-white">{title}</h3>
      <p className="text-sm text-gray-400 mt-1">{description}</p>
    </Link>
  );
}