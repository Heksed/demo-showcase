import type { RecoveryData } from "../types";

/**
 * Muuntaa korjausasian tiedot RecoveryData-muotoon modular formsia varten
 */
export function convertCorrectionCaseToRecoveryData(caseData: {
  totalRecoveryGross: number;
  totalRecoveryNet: number;
  recoveryAmounts: Array<{
    periodLabel: string;
    periodStart: string;
    periodEnd: string;
    gross: number;
    net: number;
  }>;
}): RecoveryData {
  // Laske verot ja muut vähennykset
  // Oletetaan että netto = brutto - vero - jäsenmaksu
  // Yksinkertaistettu: vero ~25%, jäsenmaksu ~1.5%
  const taxRate = 0.25;
  const memberFeeRate = 0.015;
  
  // Laske vero ja jäsenmaksu
  const estimatedTax = caseData.totalRecoveryGross * taxRate;
  const estimatedMemberFee = caseData.totalRecoveryGross * memberFeeRate;
  const estimatedExpenseCompensation = 0; // Ei kulukorvausta takaisinperinnässä
  
  // Muunna periodBreakdown-muotoon
  const periodBreakdown = caseData.recoveryAmounts.map(recovery => ({
    period: recovery.periodLabel,
    gross: recovery.gross,
    tax: recovery.gross * taxRate,
    membershipFee: recovery.gross * memberFeeRate,
    net: recovery.net,
    expenseCompensation: 0,
  }));
  
  return {
    systemGeneratedText: `On havaittu, että sinulle on maksettu liikamaksu työttömyysetuuksia korjausasiatilanteen perusteella. Yhteensä takaisinperintää vaaditaan ${caseData.totalRecoveryGross.toFixed(2)} euroa (brutto), ${caseData.totalRecoveryNet.toFixed(2)} euroa (netto).`,
    
    overpaymentReason: {
      reason: "Korjausasiatilanne: tulorekisteristä saapuneet tiedot osoittavat, että maksettu etuus on ollut suurempi kuin minkä sen olisi pitänyt olla korjattujen tulotietojen perusteella.",
    },
    
    totalAmounts: {
      gross: caseData.totalRecoveryGross,
      tax: estimatedTax,
      net: caseData.totalRecoveryNet,
      expenseCompensation: estimatedExpenseCompensation,
      membershipFee: estimatedMemberFee,
    },
    
    periodBreakdown: periodBreakdown,
    
    hearingDeadline: "",
    contactNumber: "XXXXXXXXXX",
    
    customTexts: {
      hearingRequestText: "Pyydämme sinua antamaan näkemyksesi takaisinperinnästä ja sen määrästä määräajalla mennessä.",
      paymentProposalText: "Voit maksaa takaisinperinnän maksuerittäin. Vastaamme sinulle maksuehdottuksesta erikseen.",
    },
    
    letterHeader: {
      logoUrl: "/Profilepicture.png",
      organizationName: "Työttömyyskassa",
      address: "Mannerheimintie 12\n00100 Helsinki",
    },
    
    letterFooter: {
      contactInfo: "Työttömyyskassa\nMannerheimintie 12\n00100 Helsinki",
      website: "www.tyottomyyskassa.fi",
      email: "asiakaspalvelu@tyottomyyskassa.fi",
      phone: "09 1234 5678",
    },
  };
}

