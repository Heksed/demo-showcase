"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, X, FileText, AlertTriangle } from "lucide-react";
import type { RecoveryData, FormSection, FormDefinition, PageBreak } from "../types";

interface LetterPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recoveryData: RecoveryData;
  formSections: FormSection[];
  definition: FormDefinition;
  onPageBreakAdd?: (elementId: string) => void;
  onPageBreakRemove?: (pageBreakId: string) => void;
}

// Element ID:t järjestyksessä (sama järjestys kuin FormDocument.tsx)
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

export default function LetterPreview({
  open,
  onOpenChange,
  recoveryData,
  formSections,
  definition,
  onPageBreakAdd,
  onPageBreakRemove,
}: LetterPreviewProps) {
  // Hae elementtien järjestys (jos määritelty, muuten käytä oletusjärjestystä)
  const elementOrder = definition.elementOrder || [...ELEMENT_IDS];
  
  // Refit elementtien korkeuksien mittaukselle
  const elementRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [elementHeights, setElementHeights] = useState<Record<string, number>>({});
  
  // A4-sivun mitat (mm) - sama kuin FormDocumentissa
  const A4_HEIGHT_MM = 297;
  const MARGIN_TOP_MM = 20;
  const MARGIN_BOTTOM_MM = 20;
  const HEADER_HEIGHT_MM = 30;
  const FOOTER_HEIGHT_MM = 25;
  const TITLE_HEIGHT_MM = 6;
  
  // Käytettävissä oleva korkeus yhdelle sivulle
  const getAvailableHeightForPage = (isFirstPage: boolean): number => {
    const marginHeight = MARGIN_TOP_MM + MARGIN_BOTTOM_MM;
    const headerHeight = isFirstPage ? HEADER_HEIGHT_MM : 0;
    const footerHeight = FOOTER_HEIGHT_MM;
    const titleHeight = isFirstPage ? TITLE_HEIGHT_MM : 0;
    return A4_HEIGHT_MM - marginHeight - headerHeight - footerHeight - titleHeight;
  };
  
  // Mittaa elementtien korkeudet
  useEffect(() => {
    if (!open) return;
    
    const measureHeights = () => {
      const heights: Record<string, number> = {};
      
      elementOrder.forEach((elementId) => {
        const elementRef = elementRefs.current[elementId];
        if (elementRef) {
          const heightPx = elementRef.offsetHeight;
          const heightMm = (heightPx / 96) * 25.4;
          
          if (heightMm > 0) {
            heights[elementId] = heightMm;
          }
        }
      });
      
      setElementHeights((prev) => {
        let hasChanges = false;
        const newHeights = { ...prev };
        
        Object.keys(heights).forEach((elementId) => {
          const newHeight = heights[elementId];
          const prevHeight = prev[elementId] || 0;
          if (Math.abs(newHeight - prevHeight) > 1) {
            newHeights[elementId] = newHeight;
            hasChanges = true;
          }
        });
        
        return hasChanges ? newHeights : prev;
      });
    };
    
    const timeoutId = setTimeout(measureHeights, 100);
    return () => clearTimeout(timeoutId);
  }, [open, recoveryData, formSections, definition, elementOrder]);
  
  const getSectionModules = (sectionId: string) => {
    const section = formSections.find((s) => s.id === sectionId);
    const systemGeneratedSections = [
      "system_generated",
      "overpayment_reason",
      "recovery_justification",
      "recovery_hearing",
    ];
    if (systemGeneratedSections.includes(sectionId)) {
      if (section && section.selectedModules.length > 0) {
        return section.selectedModules;
      }
      return [];
    }
    if (!section || !section.enabled) return [];
    return section.selectedModules;
  };
  
  // Tarkista onko elementti näkyvissä
  const checkElementVisibility = (elementId: string): boolean => {
    const sectionId = elementId.replace("section-", "");
    
    const systemGeneratedSections = [
      "system_generated",
      "overpayment_reason",
      "total_amounts",
    ];
    if (systemGeneratedSections.includes(sectionId)) {
      return true;
    }
    
    const section = formSections.find((s) => s.id === sectionId);
    if (!section) {
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
  
  // Helper: Tarkista onko elementissä sivunvaihto
  const getPageBreakForElement = (elementId: string): PageBreak | undefined => {
    return definition.pageBreaks?.find((pb) => pb.elementId === elementId);
  };

  // Laske missä kohdissa tapahtuu automaattiset sivunvaihdot
  // Tämä lasketaan kerran ja tallennetaan muistiin
  const autoPageBreaks = useMemo(() => {
    const breaks = new Set<number>();
    let cumulativeHeight = 0;
    let isFirstPage = true;
    let availableHeight = getAvailableHeightForPage(isFirstPage);
    let lastManualBreakIndex = -1;
    
    for (let i = 0; i < elementOrder.length; i++) {
      const elementId = elementOrder[i];
      
      // Tarkista manuaalinen sivunvaihto
      const pageBreak = getPageBreakForElement(elementId);
      if (pageBreak) {
        lastManualBreakIndex = i;
        cumulativeHeight = 0;
        isFirstPage = false;
        availableHeight = getAvailableHeightForPage(isFirstPage);
        continue;
      }
      
      // Tarkista automaattinen sivunvaihto (jos edellinen elementti täytti sivun)
      if (lastManualBreakIndex < i - 1) {
        // Tarkista täyttikö edellinen elementti sivun
        const prevElementId = elementOrder[i - 1];
        if (checkElementVisibility(prevElementId)) {
          const prevHeight = elementHeights[prevElementId] || 0;
          const prevCumulative = cumulativeHeight - prevHeight;
          
          // Jos edellinen elementti täytti sivun, lisää automaattinen sivunvaihto
          if (prevCumulative + prevHeight >= availableHeight) {
            breaks.add(i - 1);
            cumulativeHeight = prevHeight; // Aloita uudelta sivulta
            isFirstPage = false;
            availableHeight = getAvailableHeightForPage(isFirstPage);
            continue;
          }
        }
      }
      
      if (!checkElementVisibility(elementId)) continue;
      
      const height = elementHeights[elementId] || 0;
      cumulativeHeight += height;
      
      // Jos sivu täyttyy tämän elementin kanssa, lisää automaattinen sivunvaihto
      if (cumulativeHeight >= availableHeight) {
        breaks.add(i);
        cumulativeHeight = 0;
        isFirstPage = false;
        availableHeight = getAvailableHeightForPage(isFirstPage);
      }
    }
    
    return breaks;
  }, [elementOrder, elementHeights, definition.pageBreaks, formSections, recoveryData]);

  // Laske kumulatiivinen korkeus ja tarkista kapasiteetti
  // Ottaa huomioon sekä manuaaliset että automaattiset sivunvaihdot
  const checkPageCapacity = (elementId: string) => {
    const currentIndex = elementOrder.indexOf(elementId);
    if (currentIndex < 0) return { isOverCapacity: false, usedHeight: 0, availableHeight: 0 };
    
    let cumulativeHeight = 0;
    let isFirstPage = true;
    let availableHeight = getAvailableHeightForPage(isFirstPage);
    
    // Etsi viimeisin sivunvaihto (joko manuaalinen tai automaattinen) ennen tätä elementtiä
    let lastPageBreakIndex = -1;
    
    for (let i = currentIndex - 1; i >= 0; i--) {
      // Tarkista manuaalinen sivunvaihto
      const pageBreak = getPageBreakForElement(elementOrder[i]);
      if (pageBreak) {
        lastPageBreakIndex = i;
        isFirstPage = false;
        availableHeight = getAvailableHeightForPage(isFirstPage);
        break;
      }
      
      // Tarkista automaattinen sivunvaihto
      if (autoPageBreaks.has(i)) {
        lastPageBreakIndex = i;
        isFirstPage = false;
        availableHeight = getAvailableHeightForPage(isFirstPage);
        break;
      }
    }
    
    // Laske kumulatiivinen korkeus alkaen viimeisimmästä sivunvaihdosta
    const startIndex = lastPageBreakIndex + 1;
    for (let i = startIndex; i <= currentIndex; i++) {
      const currentElementId = elementOrder[i];
      if (!checkElementVisibility(currentElementId)) continue;
      
      const height = elementHeights[currentElementId] || 0;
      cumulativeHeight += height;
    }
    
    const warningThreshold = availableHeight * 0.9; // 90% varoituskynnys
    const isOverCapacity = cumulativeHeight > warningThreshold;
    
    return { isOverCapacity, usedHeight: cumulativeHeight, availableHeight };
  };

  const renderModuleContent = (modules: typeof formSections[0]['selectedModules']) => {
    if (modules.length === 0) return null;
    return (
      <div className="space-y-3 mt-2">
        {modules.map((module) => (
          <p key={module.id} className="text-sm leading-relaxed break-words" style={{ wordBreak: "break-word", overflowWrap: "break-word" }}>
            {module.content}
          </p>
        ))}
      </div>
    );
  };

  // Format date for letter
  const formatLetterDate = () => {
    const today = new Date();
    return today.toLocaleDateString("fi-FI", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Mock recipient address (in real app, this would come from data)
  const recipientAddress = "Esimerkki Asiakas\nKadunnimi 123\n00100 Helsinki";

  // A4-sivun mitat (mm) - käytetään vain renderöinnissä
  const A4_WIDTH_MM = 210;
  const A4_WIDTH_PX = 794; // 96 DPI
  const A4_HEIGHT_PX = 1123; // 96 DPI
  
  // Marginaalit (mm) - käytetään vain renderöinnissä
  const MARGIN_LEFT_MM = 20;
  const MARGIN_RIGHT_MM = 20;

  // Helper: Laske sivumäärä (sivunvaihtojen määrä + 1, tai automaattinen jos ei ole sivunvaihtoja)
  const getTotalPages = (): number => {
    const manualPageBreaks = definition.pageBreaks?.length || 0;
    if (manualPageBreaks > 0) {
      return manualPageBreaks + 1;
    }
    // Jos ei ole manuaalisia sivunvaihtoja, palautetaan 1 (footer näkyy silti)
    return 1;
  };

  // Helper: Laske sivunumero elementille
  const getPageNumberForElement = (elementId: string): number | null => {
    const pageBreak = getPageBreakForElement(elementId);
    if (!pageBreak) return null;

    const sortedBreaks = [...(definition.pageBreaks || [])].sort(
      (a, b) => a.pageNumber - b.pageNumber
    );
    const index = sortedBreaks.findIndex((pb) => pb.id === pageBreak.id);
    return index >= 0 ? index + 1 : null;
  };

  // Renderöi footer
  const renderFooter = () => {
    if (!recoveryData.letterFooter) return null;

    return (
      <div className={`mt-12 pt-6 border-t border-gray-200 ${definition.communication === "posti" ? "" : "mt-8"}`}>
        <div className="text-xs text-gray-600 space-y-1">
          <div className="whitespace-pre-line font-medium">
            {recoveryData.letterFooter.contactInfo}
          </div>
          <div className="flex flex-wrap gap-4 mt-2">
            {recoveryData.letterFooter.phone && (
              <span>Puhelin: {recoveryData.letterFooter.phone}</span>
            )}
            {recoveryData.letterFooter.email && (
              <span>Sähköposti: {recoveryData.letterFooter.email}</span>
            )}
            {recoveryData.letterFooter.website && (
              <span>Verkkosivu: {recoveryData.letterFooter.website}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Renderöi sivunvaihto-visualisointi (PDF-tyylinen sivun erottelu)
  const renderPageBreak = (pageNumber: number) => {
    return (
      <div className="relative my-12 flex items-center justify-center">
        {/* Sivun erottelulinja - PDF-tyylinen katkoviiva */}
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-dashed border-gray-400"></div>
        </div>
        {/* Sivunumero - PDF-tyylinen badge */}
        <div className="relative bg-white px-4 py-1 rounded-md border border-gray-300 shadow-sm">
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Sivu {pageNumber}
          </span>
        </div>
      </div>
    );
  };

  // Helper: Renderöi sivunvaihdon asetukset (ei näytetä mitään)
  const renderPageBreakOptions = (elementId: string, isOverCapacity: boolean) => {
    // Ei näytetä mitään ilmoitusta
    return null;
  };

  // Tarkista onko sivu täynnä (100% kapasiteetti ylitetty)
  const isPageFull = (elementId: string): boolean => {
    const capacityCheck = checkPageCapacity(elementId);
    return capacityCheck.usedHeight >= capacityCheck.availableHeight;
  };

  // Renderöi automaattinen sivunvaihto-indikaattori kun sivu täyttyy
  const renderAutoPageBreak = (elementId: string) => {
    const pageBreak = getPageBreakForElement(elementId);
    // Älä näytä automaattista sivunvaihtoa, jos on jo manuaalinen sivunvaihto
    if (pageBreak) return null;
    
    const isFull = isPageFull(elementId);
    if (!isFull) return null;

    return (
      <div className="relative my-8 flex items-center justify-center print:hidden">
        {/* Automaattinen sivunvaihto - katkoviiva */}
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-dashed border-red-400"></div>
        </div>
        {/* Indikaattori */}
        <div className="relative bg-red-50 px-4 py-1 rounded-md border border-red-300 shadow-sm">
          <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">
            Sivu vaihtuu
          </span>
        </div>
      </div>
    );
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

  // Helper: Renderöi elementin sen elementId:n perusteella
  const renderElementContent = (elementId: string): React.ReactNode | null => {
    switch (elementId) {
      case "section-system_generated":
        return (
          <div className="space-y-3 mb-6">
            <p className="text-sm leading-relaxed break-words" style={{ wordBreak: "break-word", overflowWrap: "break-word" }}>{recoveryData.systemGeneratedText}</p>
            {renderModuleContent(getSectionModules("system_generated"))}
          </div>
        );
      
      case "section-overpayment_reason":
        return (
          <div className="space-y-3 mb-6">
            <h2 className="font-semibold text-base">LIIKAMAKSUN SYY</h2>
            <p className="text-sm leading-relaxed break-words" style={{ wordBreak: "break-word", overflowWrap: "break-word" }}>{recoveryData.overpaymentReason.reason}</p>
            {renderModuleContent(getSectionModules("overpayment_reason"))}
          </div>
        );
      
      case "section-total_amounts":
        return (
          <div className="space-y-3 mb-6">
            <h2 className="font-semibold text-base">Liikamaksun määrä yhteensä</h2>
            <div className="text-sm space-y-1 bg-gray-50 p-4 rounded border">
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
          <div className="space-y-3 mb-6">
            <h2 className="font-semibold text-base">
              Takaisinperinnän perusteluteksti
            </h2>
            {renderModuleContent(getSectionModules("recovery"))}
          </div>
        );
      
      case "section-recovery_justification":
        if (getSectionModules("recovery_justification").length === 0) return null;
        return (
          <div className="space-y-3 mb-6">
            <h2 className="font-semibold text-base">
              Kassakohtainen tape perusteluteksti
            </h2>
            <p className="text-xs text-gray-600">
              (Muokattava poislukien euromäärät)
            </p>
            {renderModuleContent(getSectionModules("recovery_justification"))}
            <p className="text-sm mt-2">
              Takaisinperintä on yhteensä{" "}
              {recoveryData.totalAmounts.gross.toFixed(2)} euroa.
            </p>
          </div>
        );
      
      case "section-period_breakdown":
        if (!definition.checkboxes.periodSpecification) return null;
        return (
          <div className="space-y-3 mb-6">
            <h2 className="font-semibold text-base">
              Jaksokohtainen erittely liikamaksun määrästä
            </h2>
            <div className="text-sm space-y-3">
              {recoveryData.periodBreakdown.map((period, idx) => (
                <div key={idx} className="bg-gray-50 p-4 rounded border">
                  <p className="font-medium mb-2">{period.period}</p>
                  <div className="space-y-1">
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
          <div className="space-y-3 mb-6">
            <h2 className="font-semibold text-base">
              LISÄÄ MAKSETTAVA ETUUS
            </h2>
            <h3 className="font-medium text-sm">
              Kassakohtainen lisämaksun perusteluteksti
            </h3>
            {renderModuleContent(getSectionModules("additional_payment"))}
            {recoveryData.additionalPayment.periods.length > 0 && (
              <div className="text-sm space-y-2 mt-3">
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
          <div className="space-y-3 mb-6">
            <h2 className="font-semibold text-base">
              VIRHEELLISEN PÄÄTÖKSEN KORJAAMINEN
            </h2>
            {renderModuleContent(getSectionModules("decision_correction"))}
            
            {/* List of decisions to correct */}
            {recoveryData.decisionCorrection.decisionsToCorrect &&
              recoveryData.decisionCorrection.decisionsToCorrect.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium mb-2">Korjattavat päätökset:</p>
                  <div className="text-sm bg-gray-50 p-4 rounded border">
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
            
            <p className="text-sm leading-relaxed break-words mt-2" style={{ wordBreak: "break-word", overflowWrap: "break-word" }}>
              Edeltävä päätös {recoveryData.decisionCorrection.decisionDate}{" "}
              {recoveryData.decisionCorrection.decisionNumber} on virheellinen
              ja se korjataan antamalla uudet päätökset.
            </p>
            <p className="text-sm leading-relaxed break-words mt-2" style={{ wordBreak: "break-word", overflowWrap: "break-word" }}>
              {recoveryData.customTexts?.decisionCorrectionText || "Voit antaa suostumuksen..."}
            </p>
          </div>
        );
      
      case "section-waiver":
        if (getSectionModules("waiver").length === 0) return null;
        return (
          <div className="space-y-3 mb-6">
            <h2 className="font-semibold text-base">
              TAKAISINPERINNÄSTÄ LUOPUMINEN
            </h2>
            {renderModuleContent(getSectionModules("waiver"))}
          </div>
        );
      
      case "section-recovery_hearing":
        if (getSectionModules("recovery_hearing").length === 0) return null;
        return (
          <div className="space-y-3 mb-6">
            <h2 className="font-semibold text-base">
              KULEMINEN TAKAISINPERINTÄASIASSA
            </h2>
            {renderModuleContent(getSectionModules("recovery_hearing"))}
            <p className="text-sm leading-relaxed break-words mt-2" style={{ wordBreak: "break-word", overflowWrap: "break-word" }}>
              {recoveryData.customTexts?.hearingRequestText || "Pyydämme sinua antamaan näkemyksesi takaisinperinnästä ja sen määrästä määräajalla mennessä"}{" "}
              {definition.hearingDeadline || recoveryData.hearingDeadline} mennessä.
            </p>
            <p className="text-sm leading-relaxed break-words" style={{ wordBreak: "break-word", overflowWrap: "break-word" }}>
              Lisätietoja saat puhelimitse: {recoveryData.contactNumber}
            </p>
          </div>
        );
      
      case "section-payment_proposal":
        if (!definition.checkboxes.paymentProposal) return null;
        return (
          <div className="space-y-3 mb-6">
            <h2 className="font-semibold text-base">
              MAKSUEHOTUS
            </h2>
            <div className="text-sm space-y-2 bg-gray-50 p-4 rounded border">
              <p className="font-medium">Voit maksaa takaisinperinnän erissä seuraavasti:</p>
              <div className="mt-3 space-y-2">
                <p className="text-sm leading-relaxed break-words whitespace-pre-wrap" style={{ wordBreak: "break-word", overflowWrap: "break-word" }}>
                  {recoveryData.customTexts?.paymentProposalText || "Voit maksaa takaisinperinnän maksuerittäin. Vastaamme sinulle maksuehdottuksesta erikseen."}
                </p>
                <p className="text-sm leading-relaxed break-words mt-2" style={{ wordBreak: "break-word", overflowWrap: "break-word" }}>
                  Jos haluat keskustella maksuehdottuksesta, ota yhteyttä puhelimitse: {recoveryData.contactNumber}
                </p>
              </div>
            </div>
          </div>
        );
      
      case "section-misuse_suspicion":
        if (getSectionModules("misuse_suspicion").length === 0) return null;
        return (
          <div className="space-y-3 mb-6">
            <h2 className="font-semibold text-base">
              Väärinkäytösepäilyn perusteluteksti
            </h2>
            {renderModuleContent(getSectionModules("misuse_suspicion"))}
          </div>
        );
      
      case "section-misuse_hearing":
        if (getSectionModules("misuse_hearing").length === 0) return null;
        return (
          <div className="space-y-3 mb-6">
            <h2 className="font-semibold text-base">
              KULEMINEN VÄÄRINKÄYTÖSEPÄILYSSÄ
            </h2>
            {renderModuleContent(getSectionModules("misuse_hearing"))}
          </div>
        );
      
      default:
        return null;
    }
  };

  // Renderöi elementti sivunvaihdon kanssa
  const renderElementWithPageBreak = (
    elementId: string,
    content: React.ReactNode,
    isFirst: boolean = false,
    isLast: boolean = false
  ) => {
    const pageBreak = getPageBreakForElement(elementId);
    const pageNumber = getPageNumberForElement(elementId);
    const capacityCheck = checkPageCapacity(elementId);
    const currentIndex = elementOrder.indexOf(elementId);
    const hasAutoPageBreak = autoPageBreaks.has(currentIndex);

    return (
      <div 
        ref={(el) => {
          elementRefs.current[elementId] = el;
        }}
        className={pageBreak ? "relative" : ""}
      >
        {content}
        {renderPageBreakOptions(elementId, capacityCheck.isOverCapacity)}
        {renderPageBreakIndicator(elementId)}
        {/* Footer näkyy kaikilla sivuilla ennen sivunvaihtoa (joko manuaalinen tai automaattinen) */}
        {/* Footer on aina sivun viimeinen asia ennen sivunvaihtoa */}
        {(pageBreak || hasAutoPageBreak) && renderFooter()}
        {/* Näytä automaattinen sivunvaihto-indikaattori kun sivu täyttyy (footerin jälkeen) */}
        {hasAutoPageBreak && !pageBreak && renderAutoPageBreak(elementId)}
        {/* Sivunvaihto renderöidään elementin ja footerin jälkeen */}
        {pageBreak && pageNumber && renderPageBreak(pageNumber)}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto w-[95vw]">
        <DialogHeader>
          <DialogTitle>Kirjeen asettelu</DialogTitle>
        </DialogHeader>
        
        <div className={`mt-4 ${definition.communication === "posti" ? "bg-white" : ""}`}>
          {/* Letter format */}
          <div 
            className={`${definition.communication === "posti" ? "p-10 border-2 border-gray-300 min-h-[800px] shadow-sm" : "p-6"} max-w-[210mm] break-words`} 
            style={{ 
              wordBreak: "break-word", 
              overflowWrap: "break-word",
              maxWidth: "210mm",
              width: "100%"
            }}
          >
            {/* Letter Header with Logo and Organization - Always shown */}
            {recoveryData.letterHeader && (
              <div className="mb-8 pb-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {recoveryData.letterHeader.logoUrl && (
                      <div className="flex items-center justify-center">
                        <img 
                          src={recoveryData.letterHeader.logoUrl} 
                          alt={`${recoveryData.letterHeader.organizationName} logo`} 
                          className="h-12 w-auto max-w-32 object-contain" 
                        />
                      </div>
                    )}
                    <div>
                      <h2 className="text-lg font-bold">{recoveryData.letterHeader.organizationName}</h2>
                      {recoveryData.letterHeader.address && (
                        <p className="text-xs text-gray-600 mt-1 whitespace-pre-line">
                          {recoveryData.letterHeader.address}
                        </p>
                      )}
                    </div>
                  </div>
                  {definition.communication === "posti" && (
                    <div className="text-right text-sm text-gray-600">
                      <div className="text-left whitespace-pre-line mb-2">
                        {recipientAddress}
                      </div>
                      <div>Helsinki, {formatLetterDate()}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Header - Only for post if no letterHeader */}
            {!recoveryData.letterHeader && definition.communication === "posti" && (
              <div className="mb-8 text-right">
                <div className="text-sm text-gray-600 mb-4">
                  <div className="text-left whitespace-pre-line mb-2">
                    {recipientAddress}
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Helsinki, {formatLetterDate()}
                </div>
              </div>
            )}

            {/* Title */}
            <h1 className="text-lg font-bold mb-6 uppercase">
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

            {/* Signature area - Only for post */}
            {definition.communication === "posti" && (
              <div className="mt-12 pt-6">
                <div className="text-sm">
                  <p className="mb-4">Ystävällisin terveisin,</p>
                  <div className="mt-8">
                    <p className="font-semibold">
                      {recoveryData.letterHeader?.organizationName || "Työttömyyskassa"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Footerit: jokaiselle sivulle, jossa on sivunvaihto (sivunvaihdon yläpuolella) + viimeiselle sivulle */}
            {/* Footer näkyy viimeisellä sivulla vain, jos viimeisellä sivulla ei ole sivunvaihtoa */}
            {(() => {
              // Tarkista onko viimeisellä näkyvällä elementillä sivunvaihto
              // Käytä elementOrder-taulukkoa (käänteisessä järjestyksessä)
              let lastVisibleElementId: string | null = null;
              
              // Etsi viimeinen näkyvä elementti (käänteisessä järjestyksessä)
              for (let i = elementOrder.length - 1; i >= 0; i--) {
                const elementId = elementOrder[i];
                const content = renderElementContent(elementId);
                
                if (content) {
                  lastVisibleElementId = elementId;
                  break;
                }
              }
              
              // Jos viimeisellä elementillä on sivunvaihto, footer näkyy jo sivunvaihdon yläpuolella
              // joten loppuun ei tarvita erillistä footeria
              if (lastVisibleElementId) {
                const lastElementPageBreak = getPageBreakForElement(lastVisibleElementId);
                if (lastElementPageBreak) {
                  return null; // Footer näkyy jo sivunvaihdon yläpuolella
                }
              }
              
              // Jos viimeisellä elementillä ei ole sivunvaihtoa, näytetään footer loppuun
              return renderFooter();
            })()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

