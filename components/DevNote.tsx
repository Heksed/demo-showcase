"use client";
import React, { useState } from "react";
import { useDevMode } from "./DevModeProvider";
import { Code2, Copy, Check, User, Briefcase, Terminal } from "lucide-react";

export function DevNote({
  title,
  userStory,
  businessLogic,
  technical,
}: {
  title: string;
  userStory: {
    goal: string;
    scenario: string;
    expectation: string;
  };
  businessLogic: {
    description: string;
    rules: string[];
    formula?: string;
    constraints?: string[];
  };
  technical: {
    description: string;
    inputs?: Record<string, any>;
    outputs?: Record<string, any>;
    code?: string;
    dependencies?: string[];
  };
}) {
  const { devMode } = useDevMode();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"user" | "business" | "tech">("user");

  if (!devMode) return null;

  const copyCode = () => {
    if (technical.code) {
      navigator.clipboard.writeText(technical.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="my-4 rounded-lg border border-purple-500/20 bg-gray-900/50 
      backdrop-blur-sm overflow-hidden shadow-lg animate-fade-in">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 px-4 py-2 
        border-b border-purple-500/20 flex items-center gap-2">
        <Code2 size={16} className="text-purple-400" />
        <h4 className="font-medium text-white text-sm">{title}</h4>
        <span className="ml-auto text-xs text-purple-300/60">Developer Docs</span>
      </div>

      {/* Minimal Tabs */}
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
          User Story
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

      {/* Content Area */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {/* USER STORY TAB */}
        {activeTab === "user" && (
          <div className="space-y-3">
            <div>
              <div className="text-xs font-semibold text-blue-400 mb-1">
                What the user wants
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                {userStory.goal}
              </p>
            </div>

            <div>
              <div className="text-xs font-semibold text-blue-400 mb-1">
                Scenario
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                {userStory.scenario}
              </p>
            </div>

            <div>
              <div className="text-xs font-semibold text-blue-400 mb-1">
                Expected outcome
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                {userStory.expectation}
              </p>
            </div>
          </div>
        )}

        {/* BUSINESS LOGIC TAB */}
        {activeTab === "business" && (
          <div className="space-y-3">
            <div>
              <div className="text-xs font-semibold text-green-400 mb-1">
                Description
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                {businessLogic.description}
              </p>
            </div>

            {businessLogic.rules && businessLogic.rules.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-green-400 mb-2">
                  Business Rules
                </div>
                <ul className="space-y-1.5">
                  {businessLogic.rules.map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-green-400 text-xs mt-0.5">✓</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {businessLogic.formula && (
              <div>
                <div className="text-xs font-semibold text-green-400 mb-1">
                  Formula
                </div>
                <div className="p-2.5 rounded bg-black/40 font-mono text-xs text-cyan-300 
                  border border-green-500/20">
                  <pre className="whitespace-pre-wrap">{businessLogic.formula}</pre>
                </div>
              </div>
            )}

            {businessLogic.constraints && businessLogic.constraints.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-yellow-400 mb-2">
                  Constraints
                </div>
                <ul className="space-y-1">
                  {businessLogic.constraints.map((constraint, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-yellow-400 text-xs">⚠</span>
                      <span>{constraint}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* TECHNICAL TAB */}
        {activeTab === "tech" && (
          <div className="space-y-3">
            <p className="text-sm text-gray-300 leading-relaxed">
              {technical.description}
            </p>

            {/* Input/Output */}
            {(technical.inputs || technical.outputs) && (
              <div className="grid grid-cols-2 gap-2">
                {technical.inputs && (
                  <div>
                    <div className="text-xs font-semibold text-purple-400 mb-1">
                      Inputs
                    </div>
                    <div className="p-2 rounded bg-black/40 font-mono text-xs text-green-300 
                      overflow-x-auto border border-purple-500/20">
                      <pre>{JSON.stringify(technical.inputs, null, 2)}</pre>
                    </div>
                  </div>
                )}
                {technical.outputs && (
                  <div>
                    <div className="text-xs font-semibold text-purple-400 mb-1">
                      Outputs
                    </div>
                    <div className="p-2 rounded bg-black/40 font-mono text-xs text-blue-300 
                      overflow-x-auto border border-purple-500/20">
                      <pre>{JSON.stringify(technical.outputs, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Dependencies */}
            {technical.dependencies && technical.dependencies.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-purple-400 mb-1.5">
                  Dependencies
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {technical.dependencies.map((dep, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-purple-900/30 text-xs 
                        text-purple-200 font-mono border border-purple-500/20"
                    >
                      {dep}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Code */}
            {technical.code && (
              <div className="relative">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-xs font-semibold text-purple-400">
                    Implementation
                  </div>
                  <button
                    onClick={copyCode}
                    className="px-2 py-1 rounded bg-gray-700/50 hover:bg-gray-600/50 
                      transition-colors text-xs flex items-center gap-1.5"
                    title="Copy code"
                  >
                    {copied ? (
                      <>
                        <Check size={12} className="text-green-400" />
                        <span className="text-green-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-2.5 rounded bg-black/50 font-mono text-xs text-gray-300 
                  overflow-x-auto border border-purple-500/20 max-h-64 overflow-y-auto">
                  <pre>{technical.code}</pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

