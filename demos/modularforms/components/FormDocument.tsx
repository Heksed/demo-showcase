"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ChevronUp, ChevronDown, X, FileText, Plus, AlertTriangle } from "lucide-react";
import type { RecoveryData, FormSection, TextModule, FormDefinition, PageBreak } from "../types";

interface FormDocumentProps {
  recoveryData: RecoveryData;
  formSections: FormSection[];
  availableModules: TextModule[];
  definition: FormDefinition;
  onModuleMove?: (sectionId: string, moduleId: string, direction: "up" | "down") => void;
  onModuleContentChange?: (sectionId: string, moduleId: string, newContent: string) => void;
  onModuleRemove?: (sectionId: string, moduleId: string) => void;
  onPageBreakAdd?: (elementId: string) => void;
  onPageBreakRemove?: (pageBreakId: string) => void;
  onRecoveryDataChange?: (updates: Partial<RecoveryData>) => void;
  onElementMove?: (elementId: string, direction: "up" | "down") => void;
}

// Element ID:t järjestyksessä (sama järjestys kuin LetterPreview.tsx)
const ELEMENT_IDS: readonly string[] = [
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
] as const;

// A4-sivun mitat (mm)
const A4_HEIGHT_MM = 297;
const MARGIN_TOP_MM = 20;
const MARGIN_BOTTOM_MM = 20;

// Header ja footer korkeudet (laskettu Tailwind CSS -luokista)
// Header: mb-8 (32px) + pb-6 (24px) + logo h-12 (48px) + teksti ≈ 100-120px ≈ 26-32mm
// Footer: mt-12 (48px) + pt-6 (24px) + teksti ≈ 80-100px ≈ 21-26mm
// Otsikko: mb-6 (24px) ≈ 6mm
const HEADER_HEIGHT_MM = 30; // Etusivulla (logo, osoite, päivämäärä jne.) - todellinen korkeus
const FOOTER_HEIGHT_MM = 25; // Kaikilla sivuilla - todellinen korkeus
const TITLE_HEIGHT_MM = 6; // Otsikko "PÄÄTÖKSEN POISTAMINEN..." - todellinen korkeus



// Automaattisesti kasvava Textarea-komponentti
const AutoResizeTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    maxHeight?: number;
  }
>(({ className, value, onChange, maxHeight = 400, ...props }, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Yhdistä ulkoinen ref ja sisäinen ref
  React.useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Nollaa korkeus, jotta scrollHeight lasketaan oikein
    textarea.style.height = "auto";
    
    // Aseta korkeus sisällön mukaan, mutta enintään maxHeight
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
    
    // Jos sisältö ylittää maxHeight, näytä scrollbar
    if (textarea.scrollHeight > maxHeight) {
      textarea.style.overflowY = "auto";
    } else {
      textarea.style.overflowY = "hidden";
    }
  }, [value, maxHeight]);

  // Käsittele myös onChange-tapahtuma, jotta korkeus päivittyy reaaliaikaisesti
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e);
    
    // Päivitä korkeus heti muutoksen jälkeen
    setTimeout(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
      
      if (textarea.scrollHeight > maxHeight) {
        textarea.style.overflowY = "auto";
      } else {
        textarea.style.overflowY = "hidden";
      }
    }, 0);
  };

  return (
    <Textarea
      ref={textareaRef}
      className={className}
      value={value}
      onChange={handleChange}
      style={{ resize: "none" }}
      {...props}
    />
  );
});

AutoResizeTextarea.displayName = "AutoResizeTextarea";

export default function FormDocument({
  recoveryData,
  formSections,
  availableModules,
  definition,
  onModuleMove,
  onModuleContentChange,
  onModuleRemove,
  onPageBreakAdd,
  onPageBreakRemove,
  onRecoveryDataChange,
  onElementMove,
}: FormDocumentProps) {
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  
  // Hae elementtien järjestys (jos määritelty, muuten käytä oletusjärjestystä)
  const elementOrder = definition.elementOrder || [...ELEMENT_IDS];
  // Helper to get modules for a section - preserve order from selectedModules
  // For system-generated sections, we don't need to check formSections
  // They come directly from recoveryData but can still have modules if selected
  const getSectionModules = (sectionId: string): TextModule[] => {
    const section = formSections.find((s) => s.id === sectionId);
    // System-generated sections are always enabled and shown
    const systemGeneratedSections = [
      "system_generated",
      "overpayment_reason",
      "recovery_justification",
      "recovery_hearing",
    ];
    if (systemGeneratedSections.includes(sectionId)) {
      // For system sections, still allow modules if section exists in formSections
      if (section && section.selectedModules.length > 0) {
        // Return modules in the order they were selected (preserve order)
        return section.selectedModules;
      }
      return [];
    }
    if (!section || !section.enabled) return [];
    // Return modules in the order they were selected (preserve order)
    return section.selectedModules;
  };

  // Helper: Tarkista onko elementissä sivunvaihto
  const getPageBreakForElement = (elementId: string): PageBreak | undefined => {
    return definition.pageBreaks?.find((pb) => pb.elementId === elementId);
  };

  // Helper: Laske sivunumero elementille
  const getPageNumberForElement = (elementId: string): number | null => {
    const pageBreak = getPageBreakForElement(elementId);
    if (!pageBreak) return null;

    // Järjestä sivunvaihdot sivunumeron mukaan
    const sortedBreaks = [...(definition.pageBreaks || [])].sort(
      (a, b) => a.pageNumber - b.pageNumber
    );
    const index = sortedBreaks.findIndex((pb) => pb.id === pageBreak.id);
    return index >= 0 ? index + 1 : null;
  };

  // Helper: Renderöi sivunvaihdon indikaattori
  const renderPageBreakIndicator = (elementId: string) => {
    const pageBreak = getPageBreakForElement(elementId);
    if (!pageBreak) return null;

    const pageNumber = getPageNumberForElement(elementId);
    if (!pageNumber) return null;

    return (
      <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 border-l-4 border-blue-500 rounded print:hidden">
        <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
        <span className="text-sm font-medium text-blue-700">
          Sivu {pageNumber} päättyy tähän
        </span>
        {onPageBreakRemove && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 ml-auto flex-shrink-0"
            onClick={() => onPageBreakRemove(pageBreak.id)}
            aria-label="Poista sivunvaihto"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  };

  // Helper: Etsi edellinen näkyvä elementti
  const getPreviousVisibleElement = (elementId: string): string | null => {
    const currentIndex = elementOrder.indexOf(elementId);
    if (currentIndex <= 0) return null;

    for (let i = currentIndex - 1; i >= 0; i--) {
      const prevElementId = elementOrder[i];
      const isVisible = checkElementVisibility(prevElementId);
      if (isVisible) {
        return prevElementId;
      }
    }
    return null;
  };

  // Helper: Etsi seuraava näkyvä elementti
  const getNextVisibleElement = (elementId: string): string | null => {
    const currentIndex = elementOrder.indexOf(elementId);
    if (currentIndex < 0 || currentIndex >= elementOrder.length - 1) return null;

    for (let i = currentIndex + 1; i < elementOrder.length; i++) {
      const nextElementId = elementOrder[i];
      const isVisible = checkElementVisibility(nextElementId);
      if (isVisible) {
        return nextElementId;
      }
    }
    return null;
  };


  // Tarkista onko elementti näkyvissä
  const checkElementVisibility = (elementId: string): boolean => {
    const sectionId = elementId.replace("section-", "");
    
    // System-generated sections ovat aina näkyvissä
    const systemGeneratedSections = [
      "system_generated",
      "overpayment_reason",
      "total_amounts",
    ];
    if (systemGeneratedSections.includes(sectionId)) {
      return true;
    }

    // Tarkista onko osio käytössä
    const section = formSections.find((s) => s.id === sectionId);
    if (!section) {
      // Jos osiota ei löydy, tarkista erikoistapaukset
      if (sectionId === "recovery") {
        return getSectionModules("recovery").length > 0;
      }
      if (sectionId === "recovery_justification") {
        return getSectionModules("recovery_justification").length > 0;
      }
      if (sectionId === "period_breakdown") {
        return definition.checkboxes.periodSpecification;
      }
      if (sectionId === "additional_payment") {
        return !!(
          recoveryData.additionalPayment &&
          (getSectionModules("additional_payment").length > 0 ||
            recoveryData.additionalPayment.periods.length > 0)
        );
      }
      if (sectionId === "decision_correction") {
        return !!(
          recoveryData.decisionCorrection &&
          definition.checkboxes.decisionsToCorrect
        );
      }
      if (sectionId === "waiver") {
        return getSectionModules("waiver").length > 0;
      }
      if (sectionId === "recovery_hearing") {
        return getSectionModules("recovery_hearing").length > 0;
      }
      if (sectionId === "payment_proposal") {
        return definition.checkboxes.paymentProposal;
      }
      if (sectionId === "misuse_suspicion") {
        return getSectionModules("misuse_suspicion").length > 0;
      }
      if (sectionId === "misuse_hearing") {
        return getSectionModules("misuse_hearing").length > 0;
      }
      return false;
    }

    return section.enabled;
  };

  // Laske millä sivulla elementti on (1 = ensimmäinen sivu, 2 = toinen sivu, jne.)
  const getCurrentPageForElement = (elementId: string): number => {
    let currentPage = 1;
    
    for (const currentElementId of ELEMENT_IDS) {
      // Jos tämä on kohdeelementti, palauta nykyinen sivu
      if (currentElementId === elementId) {
        return currentPage;
      }
      
      // Jos tässä elementissä on sivunvaihto, siirry seuraavalle sivulle
      const pageBreak = getPageBreakForElement(currentElementId);
      if (pageBreak) {
        currentPage++;
      }
    }
    
    return currentPage;
  };


  // Helper: Renderöi elementin siirtonapit (ylös/alas)
  const renderElementMoveButtons = (elementId: string) => {
    if (!onElementMove) return null;

    const currentIndex = elementOrder.indexOf(elementId);
    if (currentIndex < 0) return null;

    const canMoveUp = currentIndex > 0;
    const canMoveDown = currentIndex < elementOrder.length - 1;

    return (
      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute left-0 top-0 -ml-8 print:hidden">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => onElementMove(elementId, "up")}
          disabled={!canMoveUp}
          aria-label="Siirrä ylös"
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => onElementMove(elementId, "down")}
          disabled={!canMoveDown}
          aria-label="Siirrä alas"
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>
    );
  };

  // Helper: Renderöi elementti sivunvaihdon hallinnalla
  const renderElementWithPageBreak = (
    elementId: string,
    content: React.ReactNode,
    className: string = ""
  ) => {
    const pageBreak = getPageBreakForElement(elementId);
    const pageBreakClass = pageBreak ? "print:page-break-after-always" : "";

    return (
      <div
        className={`relative group ${pageBreakClass} ${className}`}
        onMouseEnter={() => setHoveredElement(elementId)}
        onMouseLeave={() => setHoveredElement(null)}
      >
        {/* Elementin siirtonapit */}
        {renderElementMoveButtons(elementId)}
        
        {content}
        {renderPageBreakIndicator(elementId)}
      </div>
    );
  };

  // Helper: Renderöi elementin sen elementId:n perusteella
  const renderElementContent = (elementId: string): React.ReactNode | null => {
    const sectionId = elementId.replace("section-", "");
    
    switch (elementId) {
      case "section-system_generated":
        return (
          <div className="space-y-2">
            {onRecoveryDataChange ? (
              <AutoResizeTextarea
                value={recoveryData.systemGeneratedText}
                onChange={(e) =>
                  onRecoveryDataChange({ systemGeneratedText: e.target.value })
                }
                className="text-sm leading-relaxed min-h-[80px]"
                placeholder="Järjestelmän automaattisesti tuoma perusteksti..."
                maxHeight={400}
                style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
              />
            ) : (
              <p className="text-sm">{recoveryData.systemGeneratedText}</p>
            )}
            {renderModules(getSectionModules("system_generated"), "system_generated")}
          </div>
        );
      
      case "section-overpayment_reason":
        return (
          <div className="space-y-2">
            <h2 className="font-semibold text-base">LIIKAMAKSUN SYY</h2>
            {onRecoveryDataChange ? (
              <AutoResizeTextarea
                value={recoveryData.overpaymentReason.reason}
                onChange={(e) =>
                  onRecoveryDataChange({
                    overpaymentReason: { reason: e.target.value },
                  })
                }
                className="text-sm leading-relaxed min-h-[80px]"
                placeholder="Liikamaksun syy..."
                maxHeight={400}
                style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
              />
            ) : (
              <p className="text-sm">{recoveryData.overpaymentReason.reason}</p>
            )}
            {renderModules(getSectionModules("overpayment_reason"), "overpayment_reason")}
          </div>
        );
      
      case "section-total_amounts":
        return (
          <div className="space-y-2">
            <h2 className="font-semibold text-base">Liikamaksun määrä yhteensä</h2>
            <div className="text-sm space-y-1 bg-gray-50 p-3 rounded">
              <p>Brutto: {recoveryData.totalAmounts.gross.toFixed(2)} euroa</p>
              <p>Vero: {recoveryData.totalAmounts.tax.toFixed(2)} euroa</p>
              <p>Netto: {recoveryData.totalAmounts.net.toFixed(2)} euroa</p>
              <p>
                Kulukorvaus:{" "}
                {recoveryData.totalAmounts.expenseCompensation.toFixed(2)} euroa
              </p>
              <p>
                Jäsenmaksu:{" "}
                {recoveryData.totalAmounts.membershipFee.toFixed(2)} euroa
              </p>
            </div>
          </div>
        );
      
      case "section-recovery":
        if (getSectionModules("recovery").length === 0) return null;
        return (
          <div className="space-y-2">
            <h2 className="font-semibold text-base">
              Takaisinperinnän perusteluteksti
            </h2>
            {renderModules(getSectionModules("recovery"), "recovery")}
          </div>
        );
      
      case "section-recovery_justification":
        if (getSectionModules("recovery_justification").length === 0) return null;
        return (
          <div className="space-y-2">
            <h2 className="font-semibold text-base">
              Kassakohtainen tape perusteluteksti
            </h2>
            <p className="text-xs text-gray-600">
              (Muokattava poislukien euromäärät)
            </p>
            {renderModules(getSectionModules("recovery_justification"), "recovery_justification")}
            <p className="text-sm mt-2">
              Takaisinperintä on yhteensä{" "}
              {recoveryData.totalAmounts.gross.toFixed(2)} euroa.
            </p>
          </div>
        );
      
      case "section-period_breakdown":
        if (!definition.checkboxes.periodSpecification) return null;
        return (
          <div className="space-y-2">
            <h2 className="font-semibold text-base">
              Jaksokohtainen erittely liikamaksun määrästä
            </h2>
            <div className="text-sm space-y-2">
              {recoveryData.periodBreakdown.map((period, idx) => (
                <div key={idx} className="bg-gray-50 p-3 rounded">
                  <p className="font-medium">{period.period}</p>
                  <div className="mt-1 space-y-1">
                    <p>Brutto: {period.gross.toFixed(2)} €</p>
                    <p>Vero: {period.tax.toFixed(2)} €</p>
                    <p>Jäsenmaksu: {period.membershipFee.toFixed(2)} €</p>
                    <p>Netto: {period.net.toFixed(2)} €</p>
                    <p>Kulukorvaus: {period.expenseCompensation.toFixed(2)} €</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case "section-additional_payment":
        if (!recoveryData.additionalPayment ||
            (getSectionModules("additional_payment").length === 0 &&
             recoveryData.additionalPayment.periods.length === 0)) return null;
        return (
          <div className="space-y-2">
            <h2 className="font-semibold text-base">
              LISÄÄ MAKSETTAVA ETUUS
            </h2>
            <h3 className="font-medium text-sm">
              Kassakohtainen lisämaksun perusteluteksti
            </h3>
            {renderModules(getSectionModules("additional_payment"), "additional_payment")}
            {recoveryData.additionalPayment.periods.length > 0 && (
              <div className="text-sm space-y-2 mt-2">
                {recoveryData.additionalPayment.periods.map((period, idx) => (
                  <div key={idx}>
                    <span className="font-medium">{period.period}:</span>{" "}
                    Maksettu {period.paid.toFixed(2)}, Korjattu{" "}
                    {period.corrected.toFixed(2)}, Erotus{" "}
                    {period.difference.toFixed(2)}
                  </div>
                ))}
                <p className="font-medium mt-2">
                  Brutto yhteensä:{" "}
                  {recoveryData.additionalPayment.grossTotal.toFixed(2)} euroa
                </p>
              </div>
            )}
          </div>
        );
      
      case "section-decision_correction":
        if (!recoveryData.decisionCorrection ||
            !definition.checkboxes.decisionsToCorrect) return null;
        return (
          <div className="space-y-2">
            <h2 className="font-semibold text-base">
              VIRHEELLISEN PÄÄTÖKSEN KORJAAMINEN
            </h2>
            {renderModules(getSectionModules("decision_correction"), "decision_correction")}
            
            {/* List of decisions to correct */}
            {recoveryData.decisionCorrection.decisionsToCorrect &&
              recoveryData.decisionCorrection.decisionsToCorrect.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium mb-2">Korjattavat päätökset:</p>
                  <div className="text-sm bg-gray-50 p-3 rounded">
                    {recoveryData.decisionCorrection.decisionsToCorrect
                      .map((decision) => decision.type)
                      .join(" + ")}{" "}
                    (
                    {recoveryData.decisionCorrection.decisionsToCorrect
                      .map((decision) => decision.code)
                      .join(" + ")}
                    )
                  </div>
                </div>
              )}
            
            <p className="text-sm mt-2">
              Edeltävä päätös {recoveryData.decisionCorrection.decisionDate}{" "}
              {recoveryData.decisionCorrection.decisionNumber} on virheellinen
              ja se korjataan antamalla uudet päätökset.
            </p>
            {onRecoveryDataChange ? (
              <AutoResizeTextarea
                value={recoveryData.customTexts?.decisionCorrectionText || "Voit antaa suostumuksen..."}
                onChange={(e) =>
                  onRecoveryDataChange({
                    customTexts: {
                      ...recoveryData.customTexts,
                      decisionCorrectionText: e.target.value,
                    },
                  })
                }
                className="text-sm leading-relaxed mt-2 min-h-[60px]"
                placeholder="Voit antaa suostumuksen..."
                maxHeight={300}
                style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
              />
            ) : (
              <h3 className="font-medium text-sm mt-2">
                {recoveryData.customTexts?.decisionCorrectionText || "Voit antaa suostumuksen..."}
              </h3>
            )}
          </div>
        );
      
      case "section-waiver":
        if (getSectionModules("waiver").length === 0) return null;
        return (
          <div className="space-y-2">
            <h2 className="font-semibold text-base">
              TAKAISINPERINNÄSTÄ LUOPUMINEN
            </h2>
            {renderModules(getSectionModules("waiver"), "waiver")}
          </div>
        );
      
      case "section-recovery_hearing":
        if (getSectionModules("recovery_hearing").length === 0) return null;
        return (
          <div className="space-y-2">
            <h2 className="font-semibold text-base">
              KULEMINEN TAKAISINPERINTÄASIASSA
            </h2>
            {renderModules(getSectionModules("recovery_hearing"), "recovery_hearing")}
            <div className="space-y-2 mt-2">
              {onRecoveryDataChange ? (
                <>
                  <AutoResizeTextarea
                    value={recoveryData.customTexts?.hearingRequestText || "Pyydämme sinua antamaan näkemyksesi takaisinperinnästä ja sen määrästä määräajalla mennessä"}
                    onChange={(e) =>
                      onRecoveryDataChange({
                        customTexts: {
                          ...recoveryData.customTexts,
                          hearingRequestText: e.target.value,
                        },
                      })
                    }
                    className="text-sm leading-relaxed min-h-[60px]"
                    placeholder="Pyydämme sinua antamaan näkemyksesi..."
                    maxHeight={300}
                    style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Määräaika:</span>
                    <Input
                      value={recoveryData.hearingDeadline}
                      onChange={(e) =>
                        onRecoveryDataChange({ hearingDeadline: e.target.value })
                      }
                      className="text-sm w-32"
                      placeholder="PP.KK.VVVV"
                    />
                    <span className="text-sm">mennessä.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Lisätietoja saat puhelimitse:</span>
                    <Input
                      value={recoveryData.contactNumber}
                      onChange={(e) =>
                        onRecoveryDataChange({ contactNumber: e.target.value })
                      }
                      className="text-sm w-40"
                      placeholder="XXXXXXXXXX"
                    />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm">
                    {recoveryData.customTexts?.hearingRequestText || "Pyydämme sinua antamaan näkemyksesi takaisinperinnästä ja sen määrästä määräajalla mennessä"}{" "}
                    {recoveryData.hearingDeadline} mennessä.
                  </p>
                  <p className="text-sm">
                    Lisätietoja saat puhelimitse: {recoveryData.contactNumber}
                  </p>
                </>
              )}
            </div>
          </div>
        );
      
      case "section-payment_proposal":
        if (!definition.checkboxes.paymentProposal) return null;
        return (
          <div className="space-y-2">
            <h2 className="font-semibold text-base">
              MAKSUEHDOTUS
            </h2>
            {onRecoveryDataChange ? (
              <AutoResizeTextarea
                value={recoveryData.customTexts?.paymentProposalText || "Voit maksaa takaisinperinnän maksuerittäin. Vastaamme sinulle maksuehdottuksesta erikseen."}
                onChange={(e) =>
                  onRecoveryDataChange({
                    customTexts: {
                      ...recoveryData.customTexts,
                      paymentProposalText: e.target.value,
                    },
                  })
                }
                className="text-sm leading-relaxed min-h-[100px] whitespace-pre-wrap bg-white"
                placeholder="Syötä maksuehdotuksen teksti..."
                maxHeight={400}
                style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
              />
            ) : (
              <p className="text-sm leading-relaxed break-words whitespace-pre-wrap bg-white p-3 rounded border" style={{ wordBreak: "break-word", overflowWrap: "break-word" }}>
                {recoveryData.customTexts?.paymentProposalText || "Voit maksaa takaisinperinnän maksuerittäin. Vastaamme sinulle maksuehdottuksesta erikseen."}
              </p>
            )}
          </div>
        );
      
      case "section-misuse_suspicion":
        if (getSectionModules("misuse_suspicion").length === 0) return null;
        return (
          <div className="space-y-2">
            <h2 className="font-semibold text-base">
              Väärinkäytösepäilyn perusteluteksti
            </h2>
            {renderModules(getSectionModules("misuse_suspicion"), "misuse_suspicion")}
          </div>
        );
      
      case "section-misuse_hearing":
        if (getSectionModules("misuse_hearing").length === 0) return null;
        return (
          <div className="space-y-2">
            <h2 className="font-semibold text-base">
              KULEMINEN VÄÄRINKÄYTÖSEPÄILYSSÄ
            </h2>
            {renderModules(getSectionModules("misuse_hearing"), "misuse_hearing")}
          </div>
        );
      
      default:
        return null;
    }
  };

  // Helper to render module content with up/down buttons for reordering and editable textarea
  const renderModules = (modules: TextModule[], sectionId: string) => {
    if (modules.length === 0) return null;
    return (
      <div className="space-y-2 mt-2">
        {modules.map((module, index) => (
          <div
            key={module.id}
            className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded group"
          >
            {onModuleMove && (
              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => onModuleMove(sectionId, module.id, "up")}
                  disabled={index === 0}
                  aria-label="Siirrä ylös"
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => onModuleMove(sectionId, module.id, "down")}
                  disabled={index === modules.length - 1}
                  aria-label="Siirrä alas"
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>
            )}
            {onModuleContentChange ? (
              <AutoResizeTextarea
                value={module.content}
                onChange={(e) => onModuleContentChange(sectionId, module.id, e.target.value)}
                className="text-sm leading-relaxed flex-1 min-h-[60px]"
                placeholder="Syötä perusteluteksti..."
                maxHeight={300}
                style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
              />
            ) : (
              <p className="text-sm flex-1">{module.content}</p>
            )}
            {onModuleRemove && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => onModuleRemove(sectionId, module.id)}
                aria-label="Poista kenttä"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        {/* Title */}
        <h1 className="text-xl font-bold mb-4">
          PÄÄTÖKSEN POISTAMINEN JA KUULEMINEN TAKAISINPERINTÄÄ KOSKEVASSA ASIASSA
        </h1>

        {/* Render elements in the order specified by elementOrder */}
        {elementOrder.map((elementId) => {
          const content = renderElementContent(elementId);
          if (!content) return null;
          return (
            <React.Fragment key={elementId}>
              {renderElementWithPageBreak(elementId, content)}
            </React.Fragment>
          );
        })}
      </CardContent>
    </Card>
  );
}

