"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useDevMode } from "./DevModeProvider";
import { Code2, User, Briefcase, Terminal } from "lucide-react";

type FieldDoc = {
  fieldId: string;
  fieldLabel: string;
  userStory: string;
  business: string;
  formula?: string;
  code?: string;
  example?: string;
};

type DevContextType = {
  activeField: FieldDoc | null;
  setActiveField: (field: FieldDoc | null) => void;
  registerField: (fieldId: string, doc: Omit<FieldDoc, "fieldId">) => void;
};

const DevContext = createContext<DevContextType>({
  activeField: null,
  setActiveField: () => {},
  registerField: () => {},
});

export function DevContextProvider({ children }: { children: ReactNode }) {
  const [activeField, setActiveField] = useState<FieldDoc | null>(null);
  const [fieldDocs] = useState<Map<string, FieldDoc>>(new Map());
  const pathname = usePathname();

  // Clear active field when navigating to a different page
  useEffect(() => {
    setActiveField(null);
    fieldDocs.clear();
  }, [pathname, fieldDocs]);

  const registerField = (fieldId: string, doc: Omit<FieldDoc, "fieldId">) => {
    fieldDocs.set(fieldId, { fieldId, ...doc });
  };

  return (
    <DevContext.Provider value={{ activeField, setActiveField, registerField }}>
      {children}
      <DevContextPanelUI />
    </DevContext.Provider>
  );
}

export const useDevContext = () => useContext(DevContext);

function DevContextPanelUI() {
  const { devMode } = useDevMode();
  const { activeField } = useDevContext();
  const [activeTab, setActiveTab] = useState<"user" | "business" | "tech">("user");

  if (!devMode || !activeField) return null;

  return (
    <div className="fixed right-6 top-24 w-96 max-h-[70vh] bg-gray-900/95 backdrop-blur-sm 
      border border-purple-500/30 rounded-lg shadow-2xl z-40 overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 px-4 py-2.5 
        border-b border-purple-500/20 flex items-center gap-2">
        <Code2 size={16} className="text-purple-400" />
        <div className="flex-1">
          <h4 className="font-medium text-white text-sm">{activeField.fieldLabel}</h4>
          <p className="text-xs text-purple-300/60">Active Field Context</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700/50 bg-gray-900/30">
        <button
          onClick={() => setActiveTab("user")}
          className={`flex-1 px-3 py-2 text-xs font-medium flex items-center 
            justify-center gap-1.5 transition-all ${
              activeTab === "user"
                ? "bg-blue-600/20 text-blue-300 border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
        >
          <User size={14} />
          User
        </button>
        <button
          onClick={() => setActiveTab("business")}
          className={`flex-1 px-3 py-2 text-xs font-medium flex items-center 
            justify-center gap-1.5 transition-all ${
              activeTab === "business"
                ? "bg-green-600/20 text-green-300 border-b-2 border-green-500"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
        >
          <Briefcase size={14} />
          Business
        </button>
        <button
          onClick={() => setActiveTab("tech")}
          className={`flex-1 px-3 py-2 text-xs font-medium flex items-center 
            justify-center gap-1.5 transition-all ${
              activeTab === "tech"
                ? "bg-purple-600/20 text-purple-300 border-b-2 border-purple-500"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
        >
          <Terminal size={14} />
          Code
        </button>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto max-h-[calc(70vh-8rem)]">
        {activeTab === "user" && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-blue-400 mb-1">What the user does</div>
            <p className="text-sm text-gray-300 leading-relaxed">{activeField.userStory}</p>
          </div>
        )}

        {activeTab === "business" && (
          <div className="space-y-3">
            <div>
              <div className="text-xs font-semibold text-green-400 mb-1">Business Logic</div>
              <p className="text-sm text-gray-300 leading-relaxed">{activeField.business}</p>
            </div>

            {activeField.formula && (
              <div>
                <div className="text-xs font-semibold text-cyan-400 mb-1">Formula</div>
                <div className="p-2.5 rounded bg-black/40 font-mono text-xs text-cyan-300 
                  border border-green-500/20">
                  <pre className="whitespace-pre-wrap">{activeField.formula}</pre>
                </div>
              </div>
            )}

            {activeField.example && (
              <div>
                <div className="text-xs font-semibold text-yellow-400 mb-1">Example</div>
                <div className="p-2 rounded bg-black/30 text-xs text-gray-300">
                  {activeField.example}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "tech" && (
          <div className="space-y-3">
            {activeField.code && (
              <div>
                <div className="text-xs font-semibold text-purple-400 mb-1">Implementation</div>
                <div className="p-2.5 rounded bg-black/50 font-mono text-xs text-gray-300 
                  overflow-x-auto border border-purple-500/20">
                  <pre>{activeField.code}</pre>
                </div>
              </div>
            )}
            {!activeField.code && (
              <p className="text-sm text-gray-400 italic">No code example available for this field.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

