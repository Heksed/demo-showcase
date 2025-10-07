import React from "react";

export default function DemoPage({
    title,
    description,
    children
  }: {
    title: string;
    description?: string;
    children: React.ReactNode;
  }) {
    return (
      <section style={{ display: "grid", gap: 16 }}>
        <header style={{ display: "grid", gap: 8 }}>
          <h1 style={{ margin: 0, fontSize: 22, color: "white" }}>{title}</h1>
          {description ? <p style={{ margin: 0, color: "#9fb1c4" }}>{description}</p> : null}
        </header>
        <div style={{ padding: 16, borderRadius: 16, background: "#0f172a", border: "1px solid #1f2937" }}>
          {children}
        </div>
      </section>
    );
  }
  