"use client";
import React from "react";
import Link from "next/link";

export function DemoCard({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link href={href} style={{
      display: "block",
      padding: 16,
      borderRadius: 16,
      background: "#111827",
      border: "1px solid #1f2937",
      textDecoration: "none"
    }}>
      <h2 style={{ margin: "0 0 8px", color: "#e6edf3", fontSize: 18 }}>{title}</h2>
      <p style={{ margin: 0, color: "#9fb1c4", lineHeight: 1.4 }}>{description}</p>
    </Link>
  );
}
