"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { RecoveryData, FormSection, FormDefinition } from "../types";

interface LetterPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recoveryData: RecoveryData;
  formSections: FormSection[];
  definition: FormDefinition;
}

export default function LetterPreview({
  open,
  onOpenChange,
  recoveryData,
  formSections,
  definition,
}: LetterPreviewProps) {
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
          <p key={module.id} className="text-sm leading-relaxed">
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto w-[95vw]">
        <DialogHeader>
          <DialogTitle>Kirjeen esikatselu</DialogTitle>
        </DialogHeader>
        
        <div className={`mt-4 ${definition.communication === "posti" ? "bg-white" : ""}`}>
          {/* Letter format */}
          <div className={`${definition.communication === "posti" ? "p-10 border-2 border-gray-300 min-h-[800px] shadow-sm" : "p-6"}`}>
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

            {/* 1. System-generated text with modules */}
            <div className="space-y-3 mb-6">
              <p className="text-sm leading-relaxed">{recoveryData.systemGeneratedText}</p>
              {renderModuleContent(getSectionModules("system_generated"))}
            </div>

            {/* 2. Overpayment reason */}
            <div className="space-y-3 mb-6">
              <h2 className="font-semibold text-base">LIIKAMAKSUN SYY</h2>
              <p className="text-sm leading-relaxed">{recoveryData.overpaymentReason.reason}</p>
              {renderModuleContent(getSectionModules("overpayment_reason"))}
            </div>

            {/* 3. Total amounts */}
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

            {/* 3.5. General recovery modules */}
            {getSectionModules("recovery").length > 0 && (
              <div className="space-y-3 mb-6">
                <h2 className="font-semibold text-base">
                  Takaisinperinnän perusteluteksti
                </h2>
                {renderModuleContent(getSectionModules("recovery"))}
              </div>
            )}

            {/* 4. Recovery justification */}
            {getSectionModules("recovery_justification").length > 0 && (
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
            )}

            {/* 5. Period breakdown */}
            {definition.checkboxes.periodSpecification && (
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
            )}

            {/* 6. Additional payment */}
            {recoveryData.additionalPayment &&
              (getSectionModules("additional_payment").length > 0 ||
                recoveryData.additionalPayment.periods.length > 0) && (
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
              )}

            {/* 7. Decision correction */}
            {recoveryData.decisionCorrection &&
              definition.checkboxes.decisionsToCorrect && (
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
                    Voit antaa suostumuksen...
                  </h3>
                </div>
              )}

            {/* 8. Waiver */}
            {getSectionModules("waiver").length > 0 && (
              <div className="space-y-3 mb-6">
                <h2 className="font-semibold text-base">
                  TAKAISINPERINNÄSTÄ LUOPUMINEN
                </h2>
                {renderModuleContent(getSectionModules("waiver"))}
              </div>
            )}

            {/* 9. Recovery hearing */}
            {getSectionModules("recovery_hearing").length > 0 && (
              <div className="space-y-3 mb-6">
                <h2 className="font-semibold text-base">
                  KULEMINEN TAKAISINPERINTÄASIASSA
                </h2>
                {renderModuleContent(getSectionModules("recovery_hearing"))}
                <p className="text-sm mt-2">
                  Pyydämme sinua antamaan näkemyksesi takaisinperinnästä ja sen
                  määrästä määräajalla mennessä {definition.hearingDeadline || recoveryData.hearingDeadline}{" "}
                  mennessä.
                </p>
                <p className="text-sm">
                  Lisätietoja saat puhelimitse: {recoveryData.contactNumber}
                </p>
              </div>
            )}

            {/* 10. Payment proposal */}
            {definition.checkboxes.paymentProposal && (
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
            )}

            {/* 11. Misuse suspicion */}
            {getSectionModules("misuse_suspicion").length > 0 && (
              <div className="space-y-3 mb-6">
                <h2 className="font-semibold text-base">
                  Väärinkäytösepäilyn perusteluteksti
                </h2>
                {renderModuleContent(getSectionModules("misuse_suspicion"))}
              </div>
            )}

            {/* 11. Misuse hearing */}
            {getSectionModules("misuse_hearing").length > 0 && (
              <div className="space-y-3 mb-6">
                <h2 className="font-semibold text-base">
                  KULEMINEN VÄÄRINKÄYTÖSEPÄILYSSÄ
                </h2>
                {renderModuleContent(getSectionModules("misuse_hearing"))}
              </div>
            )}

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

            {/* Letter Footer with Contact Information - Always shown */}
            {recoveryData.letterFooter && (
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
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

