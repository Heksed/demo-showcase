"use client";

export default function CalmKoi() {
  return (
    <div aria-hidden className="calm-koi-stage">
      <svg className="koi koi--main" viewBox="0 0 200 80" width="200" height="80">
        <ellipse cx="80" cy="40" rx="60" ry="22" fill="rgba(255,255,255,0.10)" />
        <ellipse cx="130" cy="40" rx="18" ry="14" fill="rgba(255,255,255,0.10)" />
        <path d="M25 40 L5 20 L5 60 Z" fill="rgba(255,255,255,0.08)" />
        <circle cx="70" cy="35" r="8" fill="rgba(0,153,255,0.09)" />
        <circle cx="95" cy="46" r="6" fill="rgba(255,0,153,0.09)" />
      </svg>

      <svg className="koi koi--slow" viewBox="0 0 160 64" width="160" height="64">
        <ellipse cx="64" cy="32" rx="48" ry="18" fill="rgba(255,255,255,0.08)" />
        <ellipse cx="104" cy="32" rx="14" ry="12" fill="rgba(255,255,255,0.08)" />
        <path d="M20 32 L4 18 L4 46 Z" fill="rgba(255,255,255,0.06)" />
        <circle cx="58" cy="28" r="7" fill="rgba(0,153,255,0.08)" />
      </svg>
    </div>
  );
}

