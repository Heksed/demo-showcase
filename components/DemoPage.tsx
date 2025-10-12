import React from "react";

export default function DemoPage({
    children
  }: {
    children: React.ReactNode;
  }) {
    return (
      <div style={{ padding: 16, borderRadius: 16, background: "#0f172a", border: "1px solid #1f2937" }}>
        {children}
      </div>
    );
  }
  