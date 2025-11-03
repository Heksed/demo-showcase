// Types for Modular Forms demo

export type SectionId = 
  | "recovery" 
  | "additional_payment" 
  | "misuse_suspicion"
  | "system_generated" // Järjestelmän tuoma kassakohtainen tekstikappale
  | "overpayment_reason" // LIIKAMAKSUN SYY
  | "recovery_justification" // Kassakohtainen tape perusteluteksti
  | "decision_correction" // VIRHEELLISEN PÄÄTÖKSEN KORJAAMINEN
  | "waiver" // TAKAISINPERINNÄSTÄ LUOPUMINEN
  | "recovery_hearing" // KULEMINEN TAKAISINPERINTÄASIASSA
  | "misuse_hearing"; // KULEMINEN VÄÄRINKÄYTÖSEPÄILYSSÄ

export type TextModule = {
  id: string;
  label: string;
  content: string;
  sectionId: SectionId;
};

export type FormSection = {
  id: SectionId;
  title: string;
  enabled: boolean;
  selectedModules: TextModule[];
};

export type FormDefinition = {
  letterTemplate: string;
  hearingDeadline: string;
  communication: string;
  checkboxes: {
    considerAdditionalPayment: boolean;
    paymentProposal: boolean;
    periodSpecification: boolean;
    decisionsToCorrect: boolean;
    misuseSuspicion: boolean;
    waiver: boolean;
  };
};

export type RecoveryData = {
  // System-generated base text
  systemGeneratedText: string;
  
  // Overpayment reason
  overpaymentReason: {
    reason: string;
  };
  
  // Total overpayment amounts
  totalAmounts: {
    gross: number;
    tax: number;
    net: number;
    expenseCompensation: number;
    membershipFee: number;
  };
  
  // Period breakdown
  periodBreakdown: Array<{
    period: string;
    gross: number;
    tax: number;
    membershipFee: number;
    net: number;
    expenseCompensation: number;
  }>;
  
  // Additional payment data
  additionalPayment?: {
    periods: Array<{
      period: string;
      paid: number;
      corrected: number;
      difference: number;
    }>;
    grossTotal: number;
  };
  
  // Decision correction data
  decisionCorrection?: {
    decisionDate: string;
    decisionNumber: string;
    decisionsToCorrect?: Array<{
      type: string; // e.g., "Myöntöpäätös", "Omavastuuajan hylky"
      code: string; // e.g., "M001", "XXXX"
    }>;
  };
  
  // Hearing deadline
  hearingDeadline: string;
  
  // Contact information
  contactNumber: string;

  // Editable custom texts
  customTexts?: {
    decisionCorrectionText?: string; // "Voit antaa suostumuksen..." text
    hearingRequestText?: string; // "Pyydämme sinua antamaan näkemyksesi..." text
    paymentProposalText?: string; // Payment proposal text
  };

  // Letter header and footer
  letterHeader?: {
    logoUrl?: string; // URL to logo image
    organizationName: string;
    address?: string;
  };
  
  letterFooter?: {
    contactInfo: string; // Yleiset yhteystiedot
    website?: string;
    email?: string;
    phone?: string;
  };
};

