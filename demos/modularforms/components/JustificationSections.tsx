"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FormSection from "./FormSection";
import type { FormSection as FormSectionType, TextModule } from "../types";

interface JustificationSectionsProps {
  formSections: FormSectionType[];
  availableModules: TextModule[];
  onModuleSelect: (sectionId: string, moduleIds: string[]) => void;
  onModuleRemove: (sectionId: string, moduleId: string) => void;
  onClearAll: (sectionId: string) => void;
}

export default function JustificationSections({
  formSections,
  availableModules,
  onModuleSelect,
  onModuleRemove,
  onClearAll,
}: JustificationSectionsProps) {
  // Show all modular sections in defined order
  // These are the three main justification sections that appear together
  const mainJustificationSections = [
    formSections.find((s) => s.id === "recovery"),
    formSections.find((s) => s.id === "additional_payment"),
    formSections.find((s) => s.id === "misuse_suspicion"),
  ].filter((s): s is FormSectionType => s !== undefined);

  // Show other modular sections separately if needed
  // Filter out system-generated sections that are not user-selectable:
  // system_generated, overpayment_reason, recovery_justification, recovery_hearing
  const systemGeneratedSections = [
    "system_generated",
    "overpayment_reason",
    "recovery_justification",
    "recovery_hearing",
  ];
  const otherModularSections = formSections.filter(
    (s) =>
      !["recovery", "additional_payment", "misuse_suspicion"].includes(s.id) &&
      !systemGeneratedSections.includes(s.id)
  );

  if (mainJustificationSections.length === 0 && otherModularSections.length === 0)
    return null;

  return (
    <>
      {/* Main justification sections (recovery, additional_payment, misuse_suspicion) */}
      {mainJustificationSections.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {mainJustificationSections.map((section) => (
                <FormSection
                  key={section.id}
                  section={section}
                  availableModules={availableModules}
                  onModuleSelect={onModuleSelect}
                  onModuleRemove={onModuleRemove}
                  onClearAll={onClearAll}
                  nested={true}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other modular sections */}
      {otherModularSections
        .filter((s) => s.enabled)
        .map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle className="text-base">{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <FormSection
                section={section}
                availableModules={availableModules}
                onModuleSelect={onModuleSelect}
                onModuleRemove={onModuleRemove}
                onClearAll={onClearAll}
                nested={false}
              />
            </CardContent>
          </Card>
        ))}
    </>
  );
}

