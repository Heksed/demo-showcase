"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { TextModule } from "../types";

interface ModuleSelectorProps {
  sectionId: string;
  availableModules: TextModule[];
  selectedModuleIds: string[];
  onSelect: (moduleIds: string[]) => void;
}

export default function ModuleSelector({
  sectionId,
  availableModules,
  selectedModuleIds,
  onSelect,
}: ModuleSelectorProps) {
  const [open, setOpen] = useState(false);

  const availableForSection = availableModules.filter(
    (m) => m.sectionId === sectionId
  );
  const unselectedModules = availableForSection.filter(
    (m) => !selectedModuleIds.includes(m.id)
  );

  const handleToggle = (moduleId: string) => {
    if (selectedModuleIds.includes(moduleId)) {
      onSelect(selectedModuleIds.filter((id) => id !== moduleId));
    } else {
      onSelect([...selectedModuleIds, moduleId]);
      setOpen(false); // Close after selection for better UX
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          Valitse
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-2">
          {unselectedModules.length === 0 ? (
            <div className="py-4 text-sm text-muted-foreground text-center">
              Kaikki saatavilla olevat moduulit on valittu
            </div>
          ) : (
            <div className="space-y-1">
              {unselectedModules.map((module) => (
                <div
                  key={module.id}
                  className="flex items-center space-x-2 p-2 hover:bg-accent rounded cursor-pointer"
                  onClick={() => handleToggle(module.id)}
                >
                  <Checkbox
                    checked={selectedModuleIds.includes(module.id)}
                    onCheckedChange={() => handleToggle(module.id)}
                  />
                  <Label className="cursor-pointer flex-1">{module.label}</Label>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

