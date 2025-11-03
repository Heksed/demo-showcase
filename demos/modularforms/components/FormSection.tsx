"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ModuleTag from "./ModuleTag";
import ModuleSelector from "./ModuleSelector";
import type { FormSection as FormSectionType, TextModule } from "../types";

interface FormSectionProps {
  section: FormSectionType;
  availableModules: TextModule[];
  onModuleSelect: (sectionId: string, moduleIds: string[]) => void;
  onModuleRemove: (sectionId: string, moduleId: string) => void;
  onClearAll: (sectionId: string) => void;
  nested?: boolean; // If true, don't render Card wrapper
}

export default function FormSection({
  section,
  availableModules,
  onModuleSelect,
  onModuleRemove,
  onClearAll,
  nested = false,
}: FormSectionProps) {
  // If not nested, only show enabled sections
  // If nested, always show all sections (even if disabled)
  if (!nested && !section.enabled) return null;

  // Use selectedModules directly to preserve order
  const selectedModules = section.selectedModules;

  const content = (
    <>
      {section.enabled ? (
        <ModuleSelector
          sectionId={section.id}
          availableModules={availableModules}
          selectedModuleIds={section.selectedModules.map((m) => m.id)}
          onSelect={(moduleIds) => onModuleSelect(section.id, moduleIds)}
        />
      ) : (
        <div className="text-sm text-muted-foreground">
          Osa-alue ei ole käytössä. Aktivoi osa-alue valitsemalla asianmukainen valintaruutu yläpuolella.
        </div>
      )}

      {selectedModules.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {selectedModules.map((module) => (
            <ModuleTag
              key={module.id}
              module={module}
              onRemove={() => onModuleRemove(section.id, module.id)}
            />
          ))}
        </div>
      )}
    </>
  );

  if (nested) {
    const firstThreeChips = selectedModules.slice(0, 3);
    const remainingChips = selectedModules.slice(3);

    return (
      <div className="space-y-2">
        {/* Title */}
        <h3 className="text-base font-semibold">{section.title}</h3>
        
        {/* Grid: Multiselect first, then chips horizontally */}
        <div className="grid grid-cols-4 gap-2 items-start">
          {/* Multiselect column - first */}
          <div className="col-span-1">
            {section.enabled ? (
              <ModuleSelector
                sectionId={section.id}
                availableModules={availableModules}
                selectedModuleIds={section.selectedModules.map((m) => m.id)}
                onSelect={(moduleIds) => onModuleSelect(section.id, moduleIds)}
              />
            ) : (
              <div className="text-sm text-muted-foreground">
                Osa-alue ei ole käytössä.
              </div>
            )}
          </div>
          
          {/* Selected chips columns - spans 3 columns */}
          <div className="col-span-3">
            {selectedModules.length > 0 ? (
              <div className="flex flex-col gap-2">
                {/* First 3 chips on same row horizontally */}
                {firstThreeChips.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {firstThreeChips.map((module) => (
                      <ModuleTag
                        key={module.id}
                        module={module}
                        onRemove={() => onModuleRemove(section.id, module.id)}
                      />
                    ))}
                  </div>
                )}
                {/* Remaining chips wrap to next row */}
                {remainingChips.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {remainingChips.map((module) => (
                      <ModuleTag
                        key={module.id}
                        module={module}
                        onRemove={() => onModuleRemove(section.id, module.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{section.title}</CardTitle>
          {selectedModules.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onClearAll(section.id)}
              className="text-sm"
            >
              Poista valinnat
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">{content}</CardContent>
    </Card>
  );
}
