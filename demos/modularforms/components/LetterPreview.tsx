"use client";

import React, { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { RecoveryData, FormSection, FormDefinition, PageBreak } from "../types";

interface LetterPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recoveryData: RecoveryData;
  formSections: FormSection[];
  definition: FormDefinition;
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
}: LetterPreviewProps) {
  // Hae elementtien järjestys (jos määritelty, muuten käytä oletusjärjestystä)
  const elementOrder = definition.elementOrder || [...ELEMENT_IDS];

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

  // A4-sivun mitat (mm)
  const A4_WIDTH_MM = 210;
  const A4_HEIGHT_MM = 297;
  const A4_WIDTH_PX = 794; // 96 DPI
  const A4_HEIGHT_PX = 1123; // 96 DPI
  
  // Marginaalit (mm)
  const MARGIN_TOP_MM = 20;
  const MARGIN_BOTTOM_MM = 20;
  const MARGIN_LEFT_MM = 20;
  const MARGIN_RIGHT_MM = 20;
  
  // Header ja footer korkeus (arvio)
  const HEADER_HEIGHT_MM = 80; // Etusivulla
  const FOOTER_HEIGHT_MM = 40; // Kaikilla sivuilla
  
  // Käytettävissä oleva korkeus yhdelle sivulle
  const getAvailableHeightForPage = (isFirstPage: boolean): number => {
    const marginHeight = MARGIN_TOP_MM + MARGIN_BOTTOM_MM;
    const headerHeight = isFirstPage ? HEADER_HEIGHT_MM : 0;
    const footerHeight = FOOTER_HEIGHT_MM;
    return A4_HEIGHT_MM - marginHeight - headerHeight - footerHeight;
  };

  // Helper: Laske sivumäärä (sivunvaihtojen määrä + 1, tai automaattinen jos ei ole sivunvaihtoja)
  const getTotalPages = (): number => {
    const manualPageBreaks = definition.pageBreaks?.length || 0;
    if (manualPageBreaks > 0) {
      return manualPageBreaks + 1;
    }
    // Jos ei ole manuaalisia sivunvaihtoja, palautetaan 1 (footer näkyy silti)
    return 1;
  };

  // Helper: Tarkista onko elementissä sivunvaihto
  const getPageBreakForElement = (elementId: string): PageBreak | undefined => {
    return definition.pageBreaks?.find((pb) => pb.elementId === elementId);
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
            
            <p className="text-sm mt-2">
              Edeltävä päätös {recoveryData.decisionCorrection.decisionDate}{" "}
              {recoveryData.decisionCorrection.decisionNumber} on virheellinen
              ja se korjataan antamalla uudet päätökset.
            </p>
            <h3 className="font-medium text-sm mt-2">
              {recoveryData.customTexts?.decisionCorrectionText || "Voit antaa suostumuksen..."}
            </h3>
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
            <p className="text-sm mt-2">
              {recoveryData.customTexts?.hearingRequestText || "Pyydämme sinua antamaan näkemyksesi takaisinperinnästä ja sen määrästä määräajalla mennessä"}{" "}
              {definition.hearingDeadline || recoveryData.hearingDeadline} mennessä.
            </p>
            <p className="text-sm">
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
                <p className="whitespace-pre-wrap">
                  {recoveryData.customTexts?.paymentProposalText || "Voit maksaa takaisinperinnän maksuerittäin. Vastaamme sinulle maksuehdottuksesta erikseen."}
                </p>
                <p className="mt-2">
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

    return (
      <>
        <div 
          className={pageBreak ? "relative" : ""}
        >
          {content}
          {/* Footer näkyy vain, jos sivunvaihto on määritelty, ja se tulee sivunvaihdon yläpuolelle */}
          {/* Sivunvaihto tapahtuu elementin jälkeen (position: "after"), joten footer tulee ennen sivunvaihtoa */}
          {pageBreak && renderFooter()}
          {/* Sivunvaihto renderöidään elementin ja footerin jälkeen */}
          {pageBreak && pageNumber && renderPageBreak(pageNumber)}
        </div>
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto w-[95vw]">
        <DialogHeader>
          <DialogTitle>Kirjeen esikatselu</DialogTitle>
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

