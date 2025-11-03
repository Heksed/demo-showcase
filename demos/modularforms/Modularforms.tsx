"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Minimize2, X as CloseIcon, Eye, Save, Send } from "lucide-react";
import DefinitionSection from "./components/DefinitionSection";
import FormDocument from "./components/FormDocument";
import JustificationSections from "./components/JustificationSections";
import LetterPreview from "./components/LetterPreview";
import {
  AVAILABLE_MODULES,
  MOCK_RECOVERY_DATA,
  INITIAL_FORM_SECTIONS,
} from "./mockData";
import type { FormSection as FormSectionType, FormDefinition } from "./types";

export default function Modularforms() {
  // Form definition state
  const [definition, setDefinition] = useState<FormDefinition>({
    letterTemplate: "kuulemiskirje",
    hearingDeadline: "",
    communication: "electronic",
    checkboxes: {
      considerAdditionalPayment: true,
      paymentProposal: false,
      periodSpecification: false,
      decisionsToCorrect: true,
      misuseSuspicion: false,
      waiver: false,
    },
  });

  // Form sections state
  const [formSections, setFormSections] =
    useState<FormSectionType[]>(INITIAL_FORM_SECTIONS);

  // Recovery data state (editable)
  const [recoveryData, setRecoveryData] = useState(MOCK_RECOVERY_DATA);

  // Update form sections enabled state based on checkboxes
  useEffect(() => {
    setFormSections((prev) =>
      prev.map((section) => {
        if (section.id === "additional_payment") {
          return {
            ...section,
            enabled: definition.checkboxes.considerAdditionalPayment,
          };
        }
        if (section.id === "misuse_suspicion") {
          return {
            ...section,
            enabled: definition.checkboxes.misuseSuspicion,
          };
        }
        return section;
      })
    );
  }, [
    definition.checkboxes.considerAdditionalPayment,
    definition.checkboxes.misuseSuspicion,
  ]);

  // Handle module selection - preserve existing order and append new modules
  const handleModuleSelect = (sectionId: string, moduleIds: string[]) => {
    setFormSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        
        // Get currently selected module IDs in order
        const currentIds = section.selectedModules.map((m) => m.id);
        
        // Find new modules that aren't already selected
        const newModuleIds = moduleIds.filter((id) => !currentIds.includes(id));
        
        // Get all modules in order: existing + new
        const allModules = AVAILABLE_MODULES.filter((m) => moduleIds.includes(m.id));
        const orderedModules = moduleIds
          .map((id) => allModules.find((m) => m.id === id))
          .filter((m): m is typeof allModules[0] => m !== undefined);
        
        return { ...section, selectedModules: orderedModules };
      })
    );
  };

  // Handle module move (up or down) in form document
  const handleModuleMove = (sectionId: string, moduleId: string, direction: "up" | "down") => {
    setFormSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        
        const modules = [...section.selectedModules];
        const currentIndex = modules.findIndex((m) => m.id === moduleId);
        
        if (currentIndex === -1) return section;
        
        if (direction === "up" && currentIndex > 0) {
          // Move up: swap with previous
          [modules[currentIndex - 1], modules[currentIndex]] = [
            modules[currentIndex],
            modules[currentIndex - 1],
          ];
        } else if (direction === "down" && currentIndex < modules.length - 1) {
          // Move down: swap with next
          [modules[currentIndex], modules[currentIndex + 1]] = [
            modules[currentIndex + 1],
            modules[currentIndex],
          ];
        }
        
        return { ...section, selectedModules: modules };
      })
    );
  };

  // Handle module removal
  const handleModuleRemove = (sectionId: string, moduleId: string) => {
    setFormSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              selectedModules: section.selectedModules.filter(
                (m) => m.id !== moduleId
              ),
            }
          : section
      )
    );
  };

  // Handle clear all modules in a section
  const handleClearAll = (sectionId: string) => {
    setFormSections((prev) =>
      prev.map((section) =>
        section.id === sectionId ? { ...section, selectedModules: [] } : section
      )
    );
  };

  // Handle module content change
  const handleModuleContentChange = (
    sectionId: string,
    moduleId: string,
    newContent: string
  ) => {
    setFormSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          selectedModules: section.selectedModules.map((module) =>
            module.id === moduleId ? { ...module, content: newContent } : module
          ),
        };
      })
    );
  };

  // Preview state
  const [previewOpen, setPreviewOpen] = useState(false);

  // Handle save actions
  const handleSaveAndSend = () => {
    // TODO: Implement save and send logic
    console.log("Tallenna ja lähetä", { definition, formSections });
    alert("Lomake tallennettu ja lähetetty");
  };

  const handleSaveDraft = () => {
    // TODO: Implement save draft logic
    console.log("Tallenna keskeneräisenä", { definition, formSections });
    alert("Lomake tallennettu keskeneräisenä");
  };

  const handlePreview = () => {
    setPreviewOpen(true);
  };

  // Handle recovery data changes (for editable text fields)
  const handleRecoveryDataChange = (updates: Partial<typeof MOCK_RECOVERY_DATA>) => {
    setRecoveryData((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              SUOSTUMUS JA KUULEMINEN
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Tallennettu viimeksi: 2.10.2026 klo 8.32
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <CloseIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Definition Section */}
        <DefinitionSection
          definition={definition}
          onDefinitionChange={setDefinition}
        />

        {/* Justification Sections - All three in one block */}
        <JustificationSections
          formSections={formSections}
          availableModules={AVAILABLE_MODULES}
          onModuleSelect={handleModuleSelect}
          onModuleRemove={handleModuleRemove}
          onClearAll={handleClearAll}
        />

        {/* Form Document - Modular form at the bottom */}
        <FormDocument
          recoveryData={recoveryData}
          formSections={formSections}
          availableModules={AVAILABLE_MODULES}
          definition={definition}
          onModuleMove={handleModuleMove}
          onModuleContentChange={handleModuleContentChange}
          onRecoveryDataChange={handleRecoveryDataChange}
        />

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 pb-2">
          <Button
            variant="outline"
            onClick={handlePreview}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Esikatselu
          </Button>
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Tallenna keskeneräisenä
          </Button>
          <Button
            onClick={handleSaveAndSend}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Tallenna ja lähetä
          </Button>
        </div>
      </div>

      {/* Letter Preview Dialog */}
      <LetterPreview
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        recoveryData={recoveryData}
        formSections={formSections}
        definition={definition}
      />
    </div>
  );
}
