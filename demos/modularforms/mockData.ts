// Mock data for Modular Forms demo
// Simulates data from configuration service

import type { TextModule, RecoveryData, FormSection } from "./types";

// Available text modules from configuration service
export const AVAILABLE_MODULES: TextModule[] = [
  // Järjestelmän tuoma kassakohtainen tekstikappale -moduulit
  {
    id: "sys-1",
    label: "Perusteksti takaisinperinnästä",
    content: "On havaittu, että sinulle on maksettu liikamaksu työttömyysetuuksia...",
    sectionId: "system_generated",
  },
  {
    id: "sys-2",
    label: "Yleinen perustelu",
    content: "Lain mukaan ylimääräinen etuus on palautettava...",
    sectionId: "system_generated",
  },

  // LIIKAMAKSUN SYY -moduulit
  {
    id: "reason-1",
    label: "Irtisanomiskorvaus",
    content: "Saatu tieto osoittaa, että olit oikeutettu irtisanomiskorvaukseen. Työttömyyslain mukaan irtisanomiskorvauskauden aikana ei ole oikeutta työttömyysetuuksiin.",
    sectionId: "overpayment_reason",
  },
  {
    id: "reason-2",
    label: "Sosiaalietuus",
    content: "Olet saanut sosiaalietuutta samaan aikaan kuin työttömyysetuuksia, mikä vaikuttaa etuuksien oikeuteen.",
    sectionId: "overpayment_reason",
  },
  {
    id: "reason-3",
    label: "Ansiotulot",
    content: "Olet ansainnut tuloja etuuden saamisen aikana, mikä on vaikuttanut etuuden määrään.",
    sectionId: "overpayment_reason",
  },

  // Kassakohtainen tape perusteluteksti -moduulit
  {
    id: "just-1",
    label: "Takaisinperinnän laskentaperusteet",
    content: "Takaisinperintä lasketaan seuraavasti: nettomäärä ajanjaksoon PP.KK.VVVV asti, jonka jälkeen brutto mukaan lukien vero. Veroviranomainen korjaa verotuksen myöhemmin. Tämä perustuu tuloverolakiin.",
    sectionId: "recovery_justification",
  },
  {
    id: "just-2",
    label: "Maksutapa",
    content: "Takaisinperintä voidaan suorittaa pankkisiirtona tai vähentää nykyisistä etuuksista.",
    sectionId: "recovery_justification",
  },
  {
    id: "just-3",
    label: "Erillislaskenta",
    content: "Takaisinperintä lasketaan erillisinä jaksoina, kuten alla olevassa jaksokohtaisessa erittelyssä näkyy.",
    sectionId: "recovery_justification",
  },

  // Takaisinperinnän perusteluteksti -moduulit (yleinen)
  {
    id: "rec-1",
    label: "Lain mukainen takaisinperintä",
    content: "Takaisinperintä perustuu työttömyyslain säännöksiin...",
    sectionId: "recovery",
  },
  {
    id: "rec-2",
    label: "Kuuleminen ja poistohakemus",
    content: "Voit pyytää kuulemista ja tehdä poistohakemuksen...",
    sectionId: "recovery",
  },
  {
    id: "rec-3",
    label: "Maksuvelvollisuus",
    content: "Olet velvollinen maksamaan takaisinperinnän...",
    sectionId: "recovery",
  },
  {
    id: "rec-4",
    label: "Laskentaperusteet",
    content: "Takaisinperintä on laskettu seuraavien perusteiden mukaan...",
    sectionId: "recovery",
  },

  // Lisämaksun perusteluteksti -moduulit
  {
    id: "add-1",
    label: "Työssäoloehto",
    content: "Työssäoloehto tulee täyttää aktiivisen työnhaun osalta...",
    sectionId: "additional_payment",
  },
  {
    id: "add-2",
    label: "Määrittelyajankohta",
    content: "Määrittelyajankohta on asetettu seuraavasti...",
    sectionId: "additional_payment",
  },
  {
    id: "add-3",
    label: "Kuuleminen ja poistohakemus",
    content: "Voit pyytää kuulemista ja tehdä poistohakemuksen...",
    sectionId: "additional_payment",
  },
  {
    id: "add-4",
    label: "Tulojen vaikutus",
    content: "Tulot vaikuttavat etuuteen seuraavasti...",
    sectionId: "additional_payment",
  },

  // Väärinkäytösepäilyn perusteluteksti -moduulit
  {
    id: "mis-1",
    label: "Epäily perustelut",
    content: "Väärinkäytösepäily perustuu saataviin tietoihin...",
    sectionId: "misuse_suspicion",
  },
  {
    id: "mis-2",
    label: "Tarkasteluperusteet",
    content: "Tarkastelussa on selvitettävä seuraavat asiat...",
    sectionId: "misuse_suspicion",
  },
  {
    id: "mis-3",
    label: "Kuuleminen ja poistohakemus",
    content: "Voit pyytää kuulemista ja tehdä poistohakemuksen...",
    sectionId: "misuse_suspicion",
  },
  {
    id: "mis-4",
    label: "Seuraukset",
    content: "Väärinkäytöksestä voi seurata seuraavat seuraukset...",
    sectionId: "misuse_suspicion",
  },

  // VIRHEELLISEN PÄÄTÖKSEN KORJAAMINEN -moduulit
  {
    id: "dec-1",
    label: "Päätöksen korjaamisperusteet",
    content: "Edeltävä päätös on virheellinen ja se korjataan antamalla uudet päätökset.",
    sectionId: "decision_correction",
  },
  {
    id: "dec-2",
    label: "Suostumuksen merkitys",
    content: "Suostumus poistamiseen ei estä valitusten tekemistä. Jos et anna suostumusta, pyydetään sosiaaliturvan muutoksenhakulautakuntaa poistamaan päätös.",
    sectionId: "decision_correction",
  },

  // TAKAISINPERINNÄSTÄ LUOPUMINEN -moduulit
  {
    id: "wav-1",
    label: "Luopumisen edellytykset",
    content: "Takaisinperinnästä voidaan luopua kokonaan tai osittain, jos se on perusteltua eikä perustu väärinkäytökseen.",
    sectionId: "waiver",
  },
  {
    id: "wav-2",
    label: "Arviointikriteerit",
    content: "Luopumisesta päätetään sosiaalisesti ja taloudellisesti perustellusti.",
    sectionId: "waiver",
  },

  // KULEMINEN TAKAISINPERINTÄASIASSA -moduulit
  {
    id: "hear-1",
    label: "Kuulemisohjeet",
    content: "Pyydämme sinua antamaan näkemyksesi takaisinperinnästä ja sen määrästä määräajalla mennessä PP.KK.VVVV mennessä.",
    sectionId: "recovery_hearing",
  },
  {
    id: "hear-2",
    label: "Maksuvaihtoehdot",
    content: "Takaisinperintä voidaan suorittaa pankkisiirtona tai erissä. Jos olet päivärahan hakija, liikamaksu voidaan vähentää nykyisistä etuuksista.",
    sectionId: "recovery_hearing",
  },
  {
    id: "hear-3",
    label: "Yhteystiedot",
    content: "Lisätietoja saat puhelimitse: XXXXXXXXXX",
    sectionId: "recovery_hearing",
  },

  // KULEMINEN VÄÄRINKÄYTÖSEPÄILYSSÄ -moduulit
  {
    id: "mish-1",
    label: "Epäilyn perustelut",
    content: "Olet hakenut työttömyysetuuksia ajanjaksolta PP.KK.VVVV - PP.KK.VVVV, mutta hakemuksestasi puuttui tietoja jotka vaikuttavat etuutesi oikeuteen.",
    sectionId: "misuse_hearing",
  },
  {
    id: "mish-2",
    label: "Selityksen pyyntö",
    content: "Pyydämme selittämään, miksi et raportoinut työskentelyäsi/sosiaalietuutta määrätyn ajanjakson aikana.",
    sectionId: "misuse_hearing",
  },
  {
    id: "mish-3",
    label: "Mahdolliset seuraukset",
    content: "Väärinkäytöksestä voi seurata huomautus, varoitus tai erottaminen työttömyyskassasta. Jos käytös on tahallista, toistuvaa tai vakavaa, asia siirretään poliisitutkintaan.",
    sectionId: "misuse_hearing",
  },
];

// Mock data - Automaattisesti generoitu lomaketiedot
export const MOCK_RECOVERY_DATA: RecoveryData = {
  systemGeneratedText: "On havaittu, että sinulle on maksettu liikamaksu työttömyysetuuksia ajanjaksoille [11.2.2026 - 11.2.2026, 20.2.2026-24.2.2026]. Lain mukaan ylimääräinen etuus on palautettava virheen vuoksi.",
  overpaymentReason: {
    reason: "Saatu tieto osoittaa, että olit oikeutettu irtisanomiskorvaukseen. Työttömyyslain mukaan irtisanomiskorvauskauden aikana ei ole oikeutta työttömyysetuuksiin.",
  },
  totalAmounts: {
    gross: 331.64,
    tax: 96.18,
    net: 235.46,
    expenseCompensation: 0.0,
    membershipFee: 0.0,
  },
  periodBreakdown: [
    {
      period: "11.2.2026-11.2.2026",
      gross: 331.64,
      tax: 96.18,
      membershipFee: 0.0,
      net: 235.46,
      expenseCompensation: 0.0,
    },
    {
      period: "20.2.2026-24.2.2026",
      gross: 0.0,
      tax: 0.0,
      membershipFee: 0.0,
      net: 0.0,
      expenseCompensation: 0.0,
    },
  ],
  additionalPayment: {
    periods: [
      {
        period: "12.2.2026-19.2.2026",
        paid: 82.49,
        corrected: 86.30,
        difference: 3.81,
      },
    ],
    grossTotal: 34.29,
  },
  decisionCorrection: {
    decisionDate: "05.03.2026",
    decisionNumber: "1234456",
    decisionsToCorrect: [
      {
        type: "Myöntöpäätös",
        code: "M001",
      },
      {
        type: "Omavastuuajan hylky",
        code: "XXXX",
      },
    ],
  },
  hearingDeadline: "PP.KK.VVVV",
  contactNumber: "XXXXXXXXXX",
  customTexts: {
    decisionCorrectionText: "Voit antaa suostumuksen...",
    hearingRequestText: "Pyydämme sinua antamaan näkemyksesi takaisinperinnästä ja sen määrästä määräajalla mennessä",
    paymentProposalText: "Voit maksaa takaisinperinnän maksuerittäin. Vastaamme sinulle maksuehdottuksesta erikseen.\n\nJos haluat keskustella maksuehdottuksesta, ota yhteyttä puhelimitse:",
  },
};

// Initial form sections configuration - only user-selectable sections
// System-generated sections (system_generated, overpayment_reason, recovery_justification, recovery_hearing)
// are not user-selectable - they come directly from system and are rendered in FormDocument
export const INITIAL_FORM_SECTIONS: FormSection[] = [
  {
    id: "recovery",
    title: "Takaisinperinnän perusteluteksti",
    enabled: true,
    selectedModules: [],
  },
  {
    id: "additional_payment",
    title: "Lisämaksun perusteluteksti",
    enabled: false,
    selectedModules: [],
  },
  {
    id: "decision_correction",
    title: "VIRHEELLISEN PÄÄTÖKSEN KORJAAMINEN",
    enabled: false,
    selectedModules: [],
  },
  {
    id: "waiver",
    title: "TAKAISINPERINNÄSTÄ LUOPUMINEN",
    enabled: false,
    selectedModules: [],
  },
  {
    id: "misuse_hearing",
    title: "KUULEMINEN VÄÄRINKÄYTÖSEPÄILYSSÄ",
    enabled: false,
    selectedModules: [],
  },
  {
    id: "misuse_suspicion",
    title: "Väärinkäytösepäilyn perusteluteksti",
    enabled: false,
    selectedModules: [],
  },
];
