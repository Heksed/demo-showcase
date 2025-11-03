"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { RecoveryData, FormSection, TextModule, FormDefinition } from "../types";

interface FormDocumentProps {
  recoveryData: RecoveryData;
  formSections: FormSection[];
  availableModules: TextModule[];
  definition: FormDefinition;
  onModuleMove?: (sectionId: string, moduleId: string, direction: "up" | "down") => void;
  onModuleContentChange?: (sectionId: string, moduleId: string, newContent: string) => void;
  onRecoveryDataChange?: (updates: Partial<RecoveryData>) => void;
}

export default function FormDocument({
  recoveryData,
  formSections,
  availableModules,
  definition,
  onModuleMove,
  onModuleContentChange,
  onRecoveryDataChange,
}: FormDocumentProps) {
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
              <Textarea
                value={module.content}
                onChange={(e) => onModuleContentChange(sectionId, module.id, e.target.value)}
                className="text-sm flex-1 min-h-[60px] resize-y"
                placeholder="Syötä perusteluteksti..."
              />
            ) : (
              <p className="text-sm flex-1">{module.content}</p>
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

        {/* 1. System-generated text with modules */}
        <div className="space-y-2">
          {onRecoveryDataChange ? (
            <Textarea
              value={recoveryData.systemGeneratedText}
              onChange={(e) =>
                onRecoveryDataChange({ systemGeneratedText: e.target.value })
              }
              className="text-sm min-h-[80px] resize-y"
              placeholder="Järjestelmän automaattisesti tuoma perusteksti..."
            />
          ) : (
            <p className="text-sm">{recoveryData.systemGeneratedText}</p>
          )}
          {renderModules(getSectionModules("system_generated"), "system_generated")}
        </div>

        {/* 2. Overpayment reason */}
        <div className="space-y-2">
          <h2 className="font-semibold text-base">LIIKAMAKSUN SYY</h2>
          {onRecoveryDataChange ? (
            <Textarea
              value={recoveryData.overpaymentReason.reason}
              onChange={(e) =>
                onRecoveryDataChange({
                  overpaymentReason: { reason: e.target.value },
                })
              }
              className="text-sm min-h-[80px] resize-y"
              placeholder="Liikamaksun syy..."
            />
          ) : (
            <p className="text-sm">{recoveryData.overpaymentReason.reason}</p>
          )}
          {renderModules(getSectionModules("overpayment_reason"), "overpayment_reason")}
        </div>

        {/* 3. Total amounts */}
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

        {/* 3.5. General recovery modules - default position after total amounts */}
        {getSectionModules("recovery").length > 0 && (
          <div className="space-y-2">
            <h2 className="font-semibold text-base">
              Takaisinperinnän perusteluteksti
            </h2>
            {renderModules(getSectionModules("recovery"), "recovery")}
          </div>
        )}

        {/* 4. Recovery justification */}
        {getSectionModules("recovery_justification").length > 0 && (
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
        )}

        {/* 5. Period breakdown - Only show if "Määräerittely jaksoittain" is checked */}
        {definition.checkboxes.periodSpecification && (
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
        )}

        {/* 6. Additional payment */}
        {recoveryData.additionalPayment &&
          (getSectionModules("additional_payment").length > 0 ||
            recoveryData.additionalPayment.periods.length > 0) && (
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
          )}

        {/* 7. Decision correction */}
        {recoveryData.decisionCorrection &&
          definition.checkboxes.decisionsToCorrect && (
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
                <Textarea
                  value={recoveryData.customTexts?.decisionCorrectionText || "Voit antaa suostumuksen..."}
                  onChange={(e) =>
                    onRecoveryDataChange({
                      customTexts: {
                        ...recoveryData.customTexts,
                        decisionCorrectionText: e.target.value,
                      },
                    })
                  }
                  className="text-sm font-medium mt-2 min-h-[60px] resize-y"
                  placeholder="Voit antaa suostumuksen..."
                />
              ) : (
                <h3 className="font-medium text-sm mt-2">
                  {recoveryData.customTexts?.decisionCorrectionText || "Voit antaa suostumuksen..."}
                </h3>
              )}
            </div>
          )}

        {/* 8. Waiver */}
        {getSectionModules("waiver").length > 0 && (
          <div className="space-y-2">
            <h2 className="font-semibold text-base">
              TAKAISINPERINNÄSTÄ LUOPUMINEN
            </h2>
            {renderModules(getSectionModules("waiver"), "waiver")}
          </div>
        )}

        {/* 9. Recovery hearing */}
        {getSectionModules("recovery_hearing").length > 0 && (
          <div className="space-y-2">
            <h2 className="font-semibold text-base">
              KULEMINEN TAKAISINPERINTÄASIASSA
            </h2>
            {renderModules(getSectionModules("recovery_hearing"), "recovery_hearing")}
            <div className="space-y-2 mt-2">
              {onRecoveryDataChange ? (
                <>
                  <Textarea
                    value={recoveryData.customTexts?.hearingRequestText || "Pyydämme sinua antamaan näkemyksesi takaisinperinnästä ja sen määrästä määräajalla mennessä"}
                    onChange={(e) =>
                      onRecoveryDataChange({
                        customTexts: {
                          ...recoveryData.customTexts,
                          hearingRequestText: e.target.value,
                        },
                      })
                    }
                    className="text-sm min-h-[60px] resize-y"
                    placeholder="Pyydämme sinua antamaan näkemyksesi..."
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
        )}

        {/* 10. Payment proposal */}
        {definition.checkboxes.paymentProposal && (
          <div className="space-y-2">
            <h2 className="font-semibold text-base">
              MAKSUEHDOTUS
            </h2>
            <div className="text-sm space-y-2 bg-gray-50 p-4 rounded border">
              <p className="font-medium">Voit maksaa takaisinperinnän erissä seuraavasti:</p>
              {onRecoveryDataChange ? (
                <div className="mt-3 space-y-2">
                  <Textarea
                    value={recoveryData.customTexts?.paymentProposalText || "Voit maksaa takaisinperinnän maksuerittäin. Vastaamme sinulle maksuehdottuksesta erikseen."}
                    onChange={(e) =>
                      onRecoveryDataChange({
                        customTexts: {
                          ...recoveryData.customTexts,
                          paymentProposalText: e.target.value,
                        },
                      })
                    }
                    className="text-sm min-h-[100px] resize-y whitespace-pre-wrap"
                    placeholder="Syötä maksuehdotuksen teksti..."
                  />
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-sm">Jos haluat keskustella maksuehdotuksesta, ota yhteyttä puhelimitse:</span>
                    <Input
                      value={recoveryData.contactNumber}
                      onChange={(e) =>
                        onRecoveryDataChange({ contactNumber: e.target.value })
                      }
                      className="text-sm w-40"
                      placeholder="XXXXXXXXXX"
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  <p className="whitespace-pre-wrap">
                    {recoveryData.customTexts?.paymentProposalText || "Voit maksaa takaisinperinnän maksuerittäin. Vastaamme sinulle maksuehdottuksesta erikseen."}
                  </p>
                  <p className="mt-2">
                    Jos haluat keskustella maksuehdottuksesta, ota yhteyttä puhelimitse: {recoveryData.contactNumber}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 11. Misuse suspicion */}
        {getSectionModules("misuse_suspicion").length > 0 && (
          <div className="space-y-2">
            <h2 className="font-semibold text-base">
              Väärinkäytösepäilyn perusteluteksti
            </h2>
            {renderModules(getSectionModules("misuse_suspicion"), "misuse_suspicion")}
          </div>
        )}

        {/* 12. Misuse hearing */}
        {getSectionModules("misuse_hearing").length > 0 && (
          <div className="space-y-2">
            <h2 className="font-semibold text-base">
              KULEMINEN VÄÄRINKÄYTÖSEPÄILYSSÄ
            </h2>
            {renderModules(getSectionModules("misuse_hearing"), "misuse_hearing")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

