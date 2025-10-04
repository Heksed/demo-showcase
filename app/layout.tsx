import React from "react";
import "./globals.css";


export const metadata = {
    title: "Demo Showcase",
    description: "Kokoelma UX/UI demoja (Next.js)"
  };
  
  export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
      <html lang="fi">
        <body className="bg-[#0b0f14] text-[#e6edf3]">
          <div className="max-w-[1100px] mx-auto p-6">
            <header className="py-2 pb-6 border-b border-[#1f2630] mb-6">
              <h1 className="m-0 text-[24px]">Demo Showcase</h1>
              <p className="mt-[6px] text-[#9fb1c4]">Working prototypes for components</p>
            </header>
            {children}
          </div>
        </body>
      </html>
    );
  }
  