"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import type { FormSection as FormSectionType, FormDefinition, RecoveryData, TextModule, PageBreak } from "./types";
import { convertCorrectionCaseToRecoveryData } from "./utils/correctionCaseConverter";

export default function Modularforms() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const correctionCaseId = searchParams.get("correctionCaseId");
  const mode = searchParams.get("mode"); // "hearing_letter"
  
  const [isLoadingCase, setIsLoadingCase] = useState(false);
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
  const [recoveryData, setRecoveryData] = useState<RecoveryData>(MOCK_RECOVERY_DATA);

  // Load correction case data if in correction case mode
  useEffect(() => {
    if (correctionCaseId && mode === "hearing_letter") {
      setIsLoadingCase(true);
      
      // Simuloitu korjausasian tiedon haku
      // Oikeassa järjestelmässä tämä olisi API-kutsu
      const loadCorrectionCaseData = async () => {
        try {
          // Tässä simuloidaan että haetaan korjausasian tiedot
          // Oikeassa järjestelmässä käytettäisiin correctionCaseId:ta
          
          // Mock korjausasian tiedot - tämä korvataan oikealla datalla
          const mockCaseData = {
            totalRecoveryGross: 241.20,
            totalRecoveryNet: 181.40,
            recoveryAmounts: [
              {
                periodLabel: "2025 Marraskuu",
                periodStart: "2025-11-01",
                periodEnd: "2025-11-30",
                gross: 120.20,
                net: 90.15,
              },
              {
                periodLabel: "2025 Joulukuu",
                periodStart: "2025-12-01",
                periodEnd: "2025-12-31",
                gross: 121.00,
                net: 91.25,
              },
            ],
          };
          
          // Muunna korjausasian tiedot RecoveryData-muotoon
          const convertedData = convertCorrectionCaseToRecoveryData(mockCaseData);
          
          setRecoveryData(convertedData);
          
          // Aseta kuulemiskirjeen oletustiedot
          setDefinition(prev => ({
            ...prev,
            letterTemplate: "kuulemiskirje",
            communication: "posti", // Kuulemiskirje lähetetään postitse
            checkboxes: {
              ...prev.checkboxes,
              considerAdditionalPayment: false,
              paymentProposal: true, // Näytä maksuehdotus
              periodSpecification: true, // Näytä jaksokohtainen erittely
              decisionsToCorrect: false,
              misuseSuspicion: false,
              waiver: false,
            },
          }));
        } catch (error) {
          console.error("Error loading correction case data:", error);
        } finally {
          setIsLoadingCase(false);
        }
      };
      
      loadCorrectionCaseData();
    }
  }, [correctionCaseId, mode]);

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
  // IMPORTANT: Preserves manually edited content of existing modules
  const handleModuleSelect = (sectionId: string, moduleIds: string[]) => {
    setFormSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        
        // Create a map of existing modules with their edited content
        const existingModulesMap = new Map(
          section.selectedModules.map((m) => [m.id, m])
        );
        
        // Build new module list preserving edited content
        const orderedModules = moduleIds
          .map((id) => {
            // First, check if we already have this module with edited content
            const existingModule = existingModulesMap.get(id);
            if (existingModule) {
              // Preserve the existing module with its edited content
              return existingModule;
            }
            // New module - get default content from AVAILABLE_MODULES
            const defaultModule = AVAILABLE_MODULES.find((m) => m.id === id);
            return defaultModule;
          })
          .filter((m): m is TextModule => m !== undefined);
        
        return { ...section, selectedModules: orderedModules };
      })
    );
  };

  // Handle module move (up or down) in form document
  // Handle element move
  const handleElementMove = (elementId: string, direction: "up" | "down") => {
    setDefinition((prev) => {
      const currentOrder = prev.elementOrder || [
        "section-system_generated",
        "section-overpayment_reason",
        "section-total_amounts",
        "section-recovery",
        "section-recovery_justification",
        "section-period_breakdown",
        "section-additional_payment",
        "section-decision_correction",
        "section-waiver",
        "section-recovery_hearing",
        "section-payment_proposal",
        "section-misuse_suspicion",
        "section-misuse_hearing",
      ];
      
      const currentIndex = currentOrder.indexOf(elementId);
      if (currentIndex < 0) return prev;
      
      const newOrder = [...currentOrder];
      if (direction === "up" && currentIndex > 0) {
        [newOrder[currentIndex - 1], newOrder[currentIndex]] = [
          newOrder[currentIndex],
          newOrder[currentIndex - 1],
        ];
      } else if (direction === "down" && currentIndex < newOrder.length - 1) {
        [newOrder[currentIndex], newOrder[currentIndex + 1]] = [
          newOrder[currentIndex + 1],
          newOrder[currentIndex],
        ];
      }
      
      return {
        ...prev,
        elementOrder: newOrder,
      };
    });
  };

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

  // Handle page break add - luo yksinkertainen UUID-generaattori
  const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Handle page break add
  const handlePageBreakAdd = (elementId: string) => {
    setDefinition((prev) => {
      const currentPageBreaks = prev.pageBreaks || [];
      
      // Tarkista onko elementissä jo sivunvaihto
      if (currentPageBreaks.some((pb) => pb.elementId === elementId)) {
        return prev; // Ei lisätä duplikaattia
      }

      // Laske seuraava sivunumero
      const maxPageNumber =
        currentPageBreaks.length > 0
          ? Math.max(...currentPageBreaks.map((pb) => pb.pageNumber))
          : 0;
      const nextPageNumber = maxPageNumber + 1;

      const newPageBreak: PageBreak = {
        id: generateId(),
        elementId,
        pageNumber: nextPageNumber,
        position: "after",
      };

      return {
        ...prev,
        pageBreaks: [...currentPageBreaks, newPageBreak],
      };
    });
  };

  // Handle page break remove
  const handlePageBreakRemove = (pageBreakId: string) => {
    setDefinition((prev) => {
      const currentPageBreaks = prev.pageBreaks || [];

      // Poista sivunvaihto
      const filtered = currentPageBreaks.filter((pb) => pb.id !== pageBreakId);

      // Järjestä sivunumerot uudelleen (1, 2, 3, ...)
      const sorted = filtered.sort((a, b) => {
        // Järjestä alkuperäisen sivunumeron mukaan
        return a.pageNumber - b.pageNumber;
      });

      // Päivitä sivunumerot peräkkäisiksi
      const renumbered = sorted.map((pb, index) => ({
        ...pb,
        pageNumber: index + 1,
      }));

      return {
        ...prev,
        pageBreaks: renumbered,
      };
    });
  };

  // Automaattinen sivunvaihtoehdotus on poistettu - käyttäjä määrittelee sivutuksen manuaalisesti

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

  // Show loading state while loading correction case
  if (isLoadingCase) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Ladataan korjausasian tiedoja...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
               <div>
                 <h1 className="text-2xl font-bold text-gray-900">
                   {correctionCaseId && mode === "hearing_letter" 
                     ? "KUULEMISKIRJE" 
                     : "SUOSTUMUS JA KUULEMINEN"}
                 </h1>
                 <p className="text-sm text-gray-600 mt-1">
                   {correctionCaseId && mode === "hearing_letter" ? (
                     <>
                       Korjausasia: {correctionCaseId}
                       <br />
                       Tallennettu viimeksi: {new Date().toLocaleString("fi-FI")}
                     </>
                   ) : (
                     "Tallennettu viimeksi: 2.10.2026 klo 8.32"
                   )}
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
          onElementMove={handleElementMove}
          onModuleContentChange={handleModuleContentChange}
          onModuleRemove={handleModuleRemove}
          onPageBreakAdd={handlePageBreakAdd}
          onPageBreakRemove={handlePageBreakRemove}
          onRecoveryDataChange={handleRecoveryDataChange}
        />

        {/* Action buttons */}
        <div className="flex items-center justify-start gap-3 pt-4 pb-2">
          <Button
            onClick={handleSaveAndSend}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Tallenna ja lähetä
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
            variant="outline"
            onClick={handlePreview}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Esikatselu
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
