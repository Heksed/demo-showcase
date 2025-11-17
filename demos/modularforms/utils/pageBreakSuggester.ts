import type { FormDefinition, RecoveryData, FormSection, PageBreak } from "../types";

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
];

// A4-sivun mitat (mm)
const A4_HEIGHT_MM = 297;
const MARGIN_TOP_MM = 20;
const MARGIN_BOTTOM_MM = 20;
const HEADER_HEIGHT_MM = 80; // Etusivulla (osoite, päivämäärä jne.)
const FOOTER_HEIGHT_MM = 40; // Kaikilla sivuilla
const TITLE_HEIGHT_MM = 20; // Otsikko "PÄÄTÖKSEN POISTAMINEN..."

// Käytettävissä oleva korkeus yhdelle sivulle
const getAvailableHeightForPage = (isFirstPage: boolean): number => {
  const marginHeight = MARGIN_TOP_MM + MARGIN_BOTTOM_MM;
  const headerHeight = isFirstPage ? HEADER_HEIGHT_MM : 0;
  const footerHeight = FOOTER_HEIGHT_MM;
  const titleHeight = isFirstPage ? TITLE_HEIGHT_MM : 0;
  return A4_HEIGHT_MM - marginHeight - headerHeight - footerHeight - titleHeight;
};

// Arvio elementin korkeudesta (mm)
// Tämä on yksinkertainen arvio, joka perustuu tekstin pituuteen ja moduuleihin
const estimateElementHeight = (
  elementId: string,
  recoveryData: RecoveryData,
  formSections: FormSection[],
  definition: FormDefinition
): number => {
  const baseHeightPerLine = 5; // mm per rivi
  const sectionSpacing = 10; // mm osioiden välillä
  const moduleHeight = 15; // mm per moduuli

  // Hae osion moduulit
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

  let height = sectionSpacing;

  // Arvioi korkeus elementin tyypin mukaan
  switch (elementId) {
    case "section-system_generated":
      const systemTextLines = Math.ceil((recoveryData.systemGeneratedText?.length || 0) / 80);
      height += systemTextLines * baseHeightPerLine;
      height += getSectionModules("system_generated").length * moduleHeight;
      break;

    case "section-overpayment_reason":
      const reasonLines = Math.ceil((recoveryData.overpaymentReason?.reason?.length || 0) / 80);
      height += 20; // Otsikko
      height += reasonLines * baseHeightPerLine;
      height += getSectionModules("overpayment_reason").length * moduleHeight;
      break;

    case "section-total_amounts":
      height += 20; // Otsikko
      height += 60; // Taulukko
      break;

    case "section-recovery":
      height += 20; // Otsikko
      height += getSectionModules("recovery").length * moduleHeight;
      break;

    case "section-recovery_justification":
      height += 20; // Otsikko
      height += getSectionModules("recovery_justification").length * moduleHeight;
      height += 15; // Yhteensä-teksti
      break;

    case "section-period_breakdown":
      if (definition.checkboxes.periodSpecification) {
        height += 20; // Otsikko
        height += recoveryData.periodBreakdown.length * 50; // Jokainen jakso
      }
      break;

    case "section-additional_payment":
      if (recoveryData.additionalPayment) {
        height += 20; // Otsikko
        height += getSectionModules("additional_payment").length * moduleHeight;
        height += recoveryData.additionalPayment.periods.length * 20;
      }
      break;

    case "section-decision_correction":
      if (recoveryData.decisionCorrection && definition.checkboxes.decisionsToCorrect) {
        height += 20; // Otsikko
        height += getSectionModules("decision_correction").length * moduleHeight;
        height += 40; // Päätöslista
        height += 30; // Lisäteksti
      }
      break;

    case "section-waiver":
      height += 20; // Otsikko
      height += getSectionModules("waiver").length * moduleHeight;
      break;

    case "section-recovery_hearing":
      height += 20; // Otsikko
      height += getSectionModules("recovery_hearing").length * moduleHeight;
      height += 30; // Lisäteksti
      break;

    case "section-payment_proposal":
      if (definition.checkboxes.paymentProposal) {
        height += 20; // Otsikko
        height += 60; // Sisältö
      }
      break;

    case "section-misuse_suspicion":
      height += 20; // Otsikko
      height += getSectionModules("misuse_suspicion").length * moduleHeight;
      break;

    case "section-misuse_hearing":
      height += 20; // Otsikko
      height += getSectionModules("misuse_hearing").length * moduleHeight;
      break;

    default:
      height += 20;
  }

  return height;
};

// Ehdottaa sivunvaihtoja sisällön perusteella
export const suggestPageBreaks = (
  recoveryData: RecoveryData,
  formSections: FormSection[],
  definition: FormDefinition
): PageBreak[] => {
  const suggestedBreaks: PageBreak[] = [];
  let currentPageHeight = 0;
  let pageNumber = 1;
  let isFirstPage = true;

  // Laske käytettävissä oleva korkeus ensimmäiselle sivulle
  // (otsikko on jo huomioitu getAvailableHeightForPage-funktiossa)
  let availableHeight = getAvailableHeightForPage(isFirstPage);

  // Käy läpi kaikki elementit järjestyksessä
  for (let i = 0; i < ELEMENT_IDS.length; i++) {
    const elementId = ELEMENT_IDS[i];
    
    // Tarkista onko elementti näkyvissä
    let isVisible = true;
    switch (elementId) {
      case "section-recovery":
        isVisible = formSections.find((s) => s.id === "recovery")?.selectedModules.length > 0;
        break;
      case "section-recovery_justification":
        isVisible = formSections.find((s) => s.id === "recovery_justification")?.selectedModules.length > 0;
        break;
      case "section-period_breakdown":
        isVisible = definition.checkboxes.periodSpecification;
        break;
      case "section-additional_payment":
        isVisible = !!recoveryData.additionalPayment && (
          formSections.find((s) => s.id === "additional_payment")?.selectedModules.length > 0 ||
          recoveryData.additionalPayment.periods.length > 0
        );
        break;
      case "section-decision_correction":
        isVisible = !!recoveryData.decisionCorrection && definition.checkboxes.decisionsToCorrect;
        break;
      case "section-waiver":
        isVisible = formSections.find((s) => s.id === "waiver")?.selectedModules.length > 0;
        break;
      case "section-recovery_hearing":
        isVisible = formSections.find((s) => s.id === "recovery_hearing")?.selectedModules.length > 0;
        break;
      case "section-payment_proposal":
        isVisible = definition.checkboxes.paymentProposal;
        break;
      case "section-misuse_suspicion":
        isVisible = formSections.find((s) => s.id === "misuse_suspicion")?.selectedModules.length > 0;
        break;
      case "section-misuse_hearing":
        isVisible = formSections.find((s) => s.id === "misuse_hearing")?.selectedModules.length > 0;
        break;
    }

    if (!isVisible) continue;

    // Arvioi elementin korkeus
    const elementHeight = estimateElementHeight(elementId, recoveryData, formSections, definition);

    // Tarkista mahtuuko elementti nykyiselle sivulle
    if (currentPageHeight + elementHeight > availableHeight && currentPageHeight > 0) {
      // Elementti ei mahdu, lisää sivunvaihto edellisen elementin jälkeen
      const previousElementId = ELEMENT_IDS[i - 1];
      if (previousElementId) {
        suggestedBreaks.push({
          id: `suggested-${pageNumber}-${Date.now()}`,
          elementId: previousElementId,
          pageNumber: pageNumber,
          position: "after",
        });
        pageNumber++;
        currentPageHeight = 0;
        isFirstPage = false;
        availableHeight = getAvailableHeightForPage(isFirstPage);
      }
    }

    // Lisää elementin korkeus nykyiseen sivun korkeuteen
    currentPageHeight += elementHeight;
  }

  return suggestedBreaks;
};

