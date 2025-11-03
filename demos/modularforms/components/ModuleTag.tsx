"use client";

import { X } from "lucide-react";
import type { TextModule } from "../types";

interface ModuleTagProps {
  module: TextModule;
  onRemove: () => void;
}

export default function ModuleTag({ module, onRemove }: ModuleTagProps) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
      <span>{module.label}</span>
      <button
        onClick={onRemove}
        className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
        aria-label={`Poista ${module.label}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

