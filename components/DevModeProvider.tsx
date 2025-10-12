"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { Code2, X } from "lucide-react";
import { DevContextProvider } from "./DevContextPanel";

type DevModeContextType = {
  devMode: boolean;
  toggle: () => void;
};

const DevModeContext = createContext<DevModeContextType>({
  devMode: false,
  toggle: () => {},
});

export function DevModeProvider({ children }: { children: React.ReactNode }) {
  const [devMode, setDevMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load from localStorage
    const stored = localStorage.getItem("dev-mode");
    if (stored === "true") {
      setDevMode(true);
    }
  }, []);

  const toggle = () => {
    const newState = !devMode;
    setDevMode(newState);
    localStorage.setItem("dev-mode", newState.toString());
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <DevModeContext.Provider value={{ devMode, toggle }}>
      <DevContextProvider>
        {children}
      </DevContextProvider>

      {/* Minimalist floating toggle button */}
      <button
        onClick={toggle}
        className={`fixed bottom-6 right-6 z-50 p-3 rounded-full shadow-lg
          transition-all duration-300 hover:scale-110 active:scale-95
          ${devMode 
            ? 'bg-purple-600 hover:bg-purple-700 text-white' 
            : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
        title={devMode ? "Disable Developer Mode" : "Enable Developer Mode"}
      >
        {devMode ? <X size={20} /> : <Code2 size={20} />}
      </button>

      {/* Subtle indicator when active */}
      {devMode && (
        <div className="fixed top-6 right-6 z-50 px-3 py-1.5 rounded-full 
          bg-purple-600/90 backdrop-blur-sm text-white text-xs font-medium 
          flex items-center gap-2 shadow-lg animate-fade-in">
          <Code2 size={14} />
          <span>Dev Mode</span>
        </div>
      )}
    </DevModeContext.Provider>
  );
}

export const useDevMode = () => useContext(DevModeContext);

