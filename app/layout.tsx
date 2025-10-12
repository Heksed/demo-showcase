import React from "react";
import "./globals.css";
import type { Metadata } from "next";
import { Toaster } from "sonner";



export const metadata = {
    title: "Demo Showcase",
    description: "Kokoelma UX/UI demoja (Next.js)"
  };
  
  export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
      <html lang="fi">
        <body className="relative bg-[#0b0f14] ">
          {/* Rauhallinen tausta koko sivulle */}
          
          <div className="max-w-[1200px] mx-auto p-6">
            <header className="py-2 pb-6 border-b border-[#1f2630] mb-6">
              <h1 className="m-0 text-[24px] text-white">Heikki's little demos</h1>
              <p className="mt-[6px] text-[#9fb1c4]">Where boring components come to PARTY!</p>
            </header>
            {children}
          </div>
          <Toaster richColors closeButton position="top-right" />
        </body>
      </html>
      
    );
  }
  