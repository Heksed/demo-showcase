Logiikan tiivistys (mitä työkalu tekee)

Tilanne:

Järjestelmä laskee jokaisen kuukauden TOE-kertyväksi, myös palkkatuetun työn.

Tämä ei vastaa tyj-sääntöjä → palkkatuettu pitää korjata manuaalisesti.

Sinulla on “Suodata tulotiedot” -näkymä (raakadata-taulukko), josta tämä on looginen paikka tehdä korjaus.

1.1. Mitä tietoja tarvitaan per tulorivi

Tulorivissä (income row) tarvitaan vähintään:

id

paymentDate

incomeType

grossAmount

earningStart, earningEnd

employerName

isSelected (checkbox)

UUTTA:

isSubsidized / subsidyEmployer (esim. “Nokia (palkkatuettu)”)

subsidyRule (enum):

type SubsidyRule =
  | "NONE" // ei palkkatuettu
  | "NO_TOE_EXTENDS" // ei TOE-kertymää, vain pidentää
  | "PERCENT_75" // kaikki palkkatuetut kuukaudet 75 %
  | "LOCK_10_MONTHS_THEN_75"; // 10 kk = 0, sen jälkeen 75 %

1.2. Mitä työkalu laskee

Kun käsittelijä avaa “Suodata tulotiedot”:

Käsittelijä suodattaa / valitsee palkkatuetut rivit, joihin haluaa soveltaa sääntöä.

Työkalu kokoaa näistä:

subsidizedGrossTotal = sum(grossAmount)

subsidizedMonthsCounted = kuinka monelle kuukaudelle nämä rivit kohdistuvat ja jotka järjestelmä on laskenut TOE-kuukausiksi
(käytännössä: unikot YYYY-MM earning-ajanjakson sisällä).

Työkalu laskee oikean TOE-kertymän palkkatuetusta:

function calcCorrectToeFromSubsidy(
  months: number,
  rule: SubsidyRule
): number {
  switch (rule) {
    case "NO_TOE_EXTENDS":
      return 0;
    case "PERCENT_75":
      return months * 0.75;
    case "LOCK_10_MONTHS_THEN_75": {
      const eligibleMonths = Math.max(months - 10, 0);
      return eligibleMonths * 0.75;
    }
    case "NONE":
    default:
      return months;
  }
}


Työkalu saa syötteenä myös järjestelmän TOE-kertymän (esim. toeSystemTotal = 12).

correctToeFromSubsidy = calcCorrectToeFromSubsidy(subsidizedMonthsCounted, rule)

toeCorrection = correctToeFromSubsidy - subsidizedMonthsCounted (negatiivinen)

toeCorrectedTotal = toeSystemTotal + toeCorrection

Palkanmääritys:

Anna komponentille myös:

systemWageBase = järjestelmän nyt laskema palkkapohja (sis. 100 % palkkatuetut)

Sitten:

function calcAcceptedSubsidizedForWage(
  gross: number,
  rule: SubsidyRule
): number {
  switch (rule) {
    case "NO_TOE_EXTENDS":
      return 0;         // näissä ei käytetä ollenkaan palkkaperusteessa
    case "PERCENT_75":
    case "LOCK_10_MONTHS_THEN_75":
      return gross * 0.75;
    case "NONE":
    default:
      return gross;
  }
}

const acceptedForWage = calcAcceptedSubsidizedForWage(
  subsidizedGrossTotal,
  rule
);

const wageBaseCorrected =
  systemWageBase - subsidizedGrossTotal + acceptedForWage;

const wageCorrection = wageBaseCorrected - systemWageBase; // yleensä negatiivinen


Käsittelijä näkee paneelissa:

toeSystemTotal vs toeCorrectedTotal

systemWageBase vs wageBaseCorrected

selkokielinen selite: “järjestelmä laski 4 kk, oikea 3 kk → –1 kk” ja “4 200 € → 3 150 €”

Käsittelijä klikkaa:

[Käytä korjattua TOE-kertymää]

[Käytä korjattua palkkapohjaa]

→ nämä arvot viedään takaisin pää-komponentille (TOE-näkymä), joko propsien tai jonkin onManualSubsidyCorrection-callbackin kautta.

2. Cursor-prompt, jonka voit liittää sellaisenaan

Alla valmis promptti englanniksi.
Muokkaa polkuja jos tiedät tarkkaan tiedostonimet, muuten anna Cursorin etsiä tekstiä.

You are helping me extend an existing React/TypeScript application.

### Goal

Our system currently miscalculates the employment condition (TOE) and wage base when there is subsidized work (palkkatuettu työ).

The core problem:
- The backend / existing logic treats **all income** as if it were fully TOE-eligible.
- Subsidized work must follow special rules (0 %, 75 %, 10-month lock, etc.).
- We want to add a **manual correction tool** on the “Suodata tulotiedot” screen that:
  1) lets the handler mark which income rows are subsidized work and what rule applies,  
  2) calculates the **corrected TOE months** and **corrected wage base**,  
  3) passes those corrected values back to the main TOE view.

Do NOT change any existing tests. Add tests if there are none.

---

### Step 1 – Find the existing components

1. Search the repo for the Finnish text `"Suodata tulotiedot"` and `"Tallenna ja sulje"`.
2. Identify:
   - The component that renders the **income filter / edit** modal (the raw data table, I call it `IncomeFilterModal` here).
   - The component that renders the **TOE summary** / main view (“TYÖSSÄOLOEHTO JA PERUSTEPALKKA”), I’ll call it `ToeView`.

Please tell me the exact file paths you found before editing anything.

---

### Step 2 – Data model for income rows

In the component that holds the raw income data (probably in the state for the income table), extend the row type.

If there is an `IncomeRow` or similar type/interface, extend it like this:

```ts
type SubsidyRule =
  | "NONE"                // normal work, no subsidy rules
  | "NO_TOE_EXTENDS"      // subsidized work that does NOT accrue TOE, only extends the reference period
  | "PERCENT_75"          // subsidized work before 2.9.2024 → every month is counted at 75 %
  | "LOCK_10_MONTHS_THEN_75"; // subsidized work with 10-month lock: first 10 months 0 %, then 75 %

interface IncomeRow {
  id: string;
  paymentDate: string;
  incomeType: string;
  grossAmount: number;
  earningStart: string;
  earningEnd: string;
  employerName: string;

  // existing fields...
  isSelected: boolean;

  // NEW fields:
  isSubsidized?: boolean;
  subsidyRule?: SubsidyRule;
}


If there is already a way to mark “palkkatuettu”, reuse that flag and map it into isSubsidized / subsidyRule instead of duplicating.

Step 3 – UI changes in the “Suodata tulotiedot” view

In the income filter / edit screen:

At the top, where we currently show:

filters for employer, income type, date range

a label like Valitut rivit X / Y

and the total sum (e.g. Yhteensä 12 850,00),

add a compact summary for subsidized rows:

Show:

number of selected subsidized rows

total gross amount of those rows

If there is at least one subsidized row, also show a button:

Text: "Avaa palkkatuetun työn työkalu"

On click: open a side-drawer / right panel that will implement the manual tool (see Step 4).

In the table of income rows:

Either add a new column for the subsidy rule (or reuse an existing “Työnantajat (palkkatuettu)” indicator).

For now keep it simple:

For each row, if isSubsidized === true, show a small badge “Palkkatuettu”.

Later, the drawer will be responsible for editing the rule; we don’t need a full dropdown in every cell.

In the “Massatoiminnot” area, add a menu item:

“Merkitse valitut rivit palkkatuetuksi”

For now, assume the typical case is PERCENT_75. We can open the drawer right away so the user can refine the rule.

Focus on minimal, but clean, UX: we only need enough controls to select subsidized rows and open the manual tool.

Step 4 – Implement the “SubsidizedWorkDrawer” component

Create a new component in the same module or in a new file, for example:

src/components/SubsidizedWorkDrawer.tsx

Responsibilities:

Receives props:

rows: IncomeRow[] – only the selected subsidized rows.

toeSystemTotal: number – total TOE months as calculated by the system.
(Prop should come from the main TOE view.)

systemWageBase: number – wage base as calculated by the system.

onApplyCorrection(correction: { toeCorrectedTotal: number; toeCorrection: number; wageBaseCorrected: number; wageCorrection: number; meta: any }).

Internal state:

subsidyRule: SubsidyRule – selected rule.

Derived values:

subsidizedGrossTotal

subsidizedMonthsCounted

correctToeFromSubsidy

toeCorrection

toeCorrectedTotal

acceptedForWage

wageBaseCorrected

wageCorrection

Implement the calculation logic as pure functions near the top of the file:

function calcSubsidizedMonths(rows: IncomeRow[]): number {
  // Group rows by earning month (YYYY-MM) and count unique months.
  const months = new Set<string>();
  for (const row of rows) {
    const start = new Date(row.earningStart);
    const end = new Date(row.earningEnd);
    // Iterate months between start and end, add YYYY-MM to the set.
    // Be careful with off-by-one: include the month of 'start', and of 'end'.
  }
  return months.size;
}

function calcCorrectToeFromSubsidy(months: number, rule: SubsidyRule): number {
  switch (rule) {
    case "NO_TOE_EXTENDS":
      return 0;
    case "PERCENT_75":
      return months * 0.75;
    case "LOCK_10_MONTHS_THEN_75": {
      const eligibleMonths = Math.max(months - 10, 0);
      return eligibleMonths * 0.75;
    }
    case "NONE":
    default:
      return months;
  }
}

function calcAcceptedSubsidizedForWage(
  gross: number,
  rule: SubsidyRule
): number {
  switch (rule) {
    case "NO_TOE_EXTENDS":
      return 0;
    case "PERCENT_75":
    case "LOCK_10_MONTHS_THEN_75":
      return gross * 0.75;
    case "NONE":
    default:
      return gross;
  }
}


In the drawer UI, display:

A list / summary of the selected subsidized rows (date, employer, gross).

Radio buttons for selecting subsidyRule with Finnish labels:

“Normaali palkkatuki (ei kerrytä TOE:ta, vain pidentää)”

“Palkkatuettu työ alkanut ennen 2.9.2024 (75 % kaikista kuukausista)”

“Poikkeusperuste (10 kk ei TOE, sen jälkeen 75 %)”

A “calculation” card that shows:

TOE (järjestelmä): 12 kk

Palkkatuetun työn TOE (järjestelmä): 4 kk

Palkkatuetun työn TOE (oikea): 3 kk

Korjaus: –1 kk

Korjattu TOE yhteensä: 11 kk

And for wage:

Palkkatuetun brutto: 4 200 €

Hyväksyttävä osuus (75 %): 3 150 €

Palkkapohja (järjestelmä): 36 600 €

Palkkapohja (korjattu): 35 550 €

Korjaus: –1 050 €

At the bottom of the drawer:

Two checkboxes:

“Käytä korjattua TOE-kertymää”

“Käytä korjattua palkkapohjaa”

A primary button "Hyväksy korjaus" that calls onApplyCorrection with the calculated values when pressed.

Step 5 – Wire the drawer into the IncomeFilterModal and the main TOE view

In the income filter component (IncomeFilterModal), hold local state:

const [isSubsidyDrawerOpen, setIsSubsidyDrawerOpen] = useState(false);
const [subsidizedRowsForDrawer, setSubsidizedRowsForDrawer] = useState<IncomeRow[]>([]);


When the user clicks "Avaa palkkatuetun työn työkalu":

Build subsidizedRowsForDrawer from currently selected rows with isSubsidized === true.

Set isSubsidyDrawerOpen = true.

Add SubsidizedWorkDrawer as a child of the modal, controlled by isSubsidyDrawerOpen.

Propagate the correction up:

The parent TOE view already opens IncomeFilterModal. Extend its props with something like:

interface IncomeFilterModalProps {
  onClose(): void;
  onApplySubsidyCorrection(c: SubsidyCorrection): void;
  toeSystemTotal: number;
  systemWageBase: number;
  // ...
}


In SubsidizedWorkDrawer.onApplyCorrection, call onApplySubsidyCorrection from the modal, then close the drawer.

In the main TOE view (ToeView), maintain:

const [toeManualCorrection, setToeManualCorrection] = useState<SubsidyCorrection | null>(null);


When onApplySubsidyCorrection is called, update this state.

Use toeManualCorrection.toeCorrectedTotal and toeManualCorrection.wageBaseCorrected to display:

The corrected TOE months

The corrected wage base

Alongside a small info badge “Palkkatuettu työ korjattu manuaalisesti”.

Make sure that we do not silently overwrite backend data: show clearly in the UI that these are manual overrides.

Step 6 – Tests

If there are no tests for this view yet, add at least:

A pure unit test for calcCorrectToeFromSubsidy:

months=4, rule="PERCENT_75" → 3

months=4, rule="NO_TOE_EXTENDS" → 0

months=14, rule="LOCK_10_MONTHS_THEN_75" → 3

A unit test for calcAcceptedSubsidizedForWage:

gross=4200, rule="PERCENT_75" → 3150

gross=4200, rule="NO_TOE_EXTENDS" → 0

A component test (React Testing Library) that:

Opens the drawer with some mocked IncomeRows,

Selects rule "PERCENT_75",

Checks that the rendered corrected TOE and wage base match the expected values.

Please implement all of the above in small, focused commits:

first the pure calculation utilities + tests,

then the drawer UI,

then the wiring between the drawer, the income filter modal and the main TOE view.

Comment the code in English where the calculation logic is, explaining the TYJ / TOE rules in simple terms.