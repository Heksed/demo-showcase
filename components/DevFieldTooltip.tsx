"use client";
import React from "react";
import { useDevMode } from "./DevModeProvider";
import { HelpCircle } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

export function DevFieldTooltip({
  fieldId,
  userStory,
  business,
  formula,
  code,
  onFocus,
}: {
  fieldId: string;
  userStory: string;
  business: string;
  formula?: string;
  code?: string;
  onFocus?: () => void;
}) {
  const { devMode } = useDevMode();

  if (!devMode) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="ml-2 text-purple-400 hover:text-purple-300 transition-colors inline-flex"
          onClick={(e) => {
            e.preventDefault();
            onFocus?.();
          }}
          type="button"
        >
          <HelpCircle size={16} />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 bg-gray-900 border-purple-500/30 text-white p-4"
        align="start"
      >
        <div className="space-y-3">
          <div>
            <div className="text-xs font-semibold text-blue-400 mb-1">User Story</div>
            <p className="text-xs text-gray-300">{userStory}</p>
          </div>

          <div>
            <div className="text-xs font-semibold text-green-400 mb-1">Business Logic</div>
            <p className="text-xs text-gray-300">{business}</p>
          </div>

          {formula && (
            <div>
              <div className="text-xs font-semibold text-cyan-400 mb-1">Formula</div>
              <div className="p-2 rounded bg-black/40 font-mono text-xs text-cyan-300">
                {formula}
              </div>
            </div>
          )}

          {code && (
            <div>
              <div className="text-xs font-semibold text-purple-400 mb-1">Code</div>
              <div className="p-2 rounded bg-black/40 font-mono text-xs text-gray-300 overflow-x-auto max-h-32 overflow-y-auto">
                <pre>{code}</pre>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

