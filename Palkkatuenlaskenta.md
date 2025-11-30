You are helping me extend an existing React/TypeScript front-end for an unemployment benefit system.

We already have a main TOE summary page with month rows and a full benefit summary.  
Now we need to add a new **“Palkkatuettu työ” (subsidized work) process** that recalculates TOE + wage base according to business rules.

Do NOT change existing tests. Only add new tests for new utility functions.  
Comment all new calculation logic in English, explaining the business rules.

==================================================
1. CONTEXT – EXISTING UI (READ THIS CAREFULLY)
==================================================

We already have:

- A main page (React view) that shows:
  - TOE summary (TOE-kertymä)
  - TOE wage (TOE-palkka)
  - TOE reference period (TOE-tarkastelujakso)
  - Wage determination period (Palkanmäärittelyjakso)
  - Perustepalkka/kk, Täysi päiväraha, Päiväraha, etc.
- A month-level table (kuukausirivit), where the system has already:
  - calculated TOE per month (max 1 TOE per calendar month)
  - aggregated wages per month.

The new “Palkkatuettu työ” process is **NOT** another raw-income editor.  
It is a **process view** that:

- is opened from the main TOE summary page,
- uses the already calculated TOE months + wage data,
- applies subsidized work rules (palkkatuki) on top of that.

First, search the repo for the Finnish phrases:

- "TYÖSSÄOLOEHTO JA PERUSTEPALKKA"
- "TOE-kertymä"
- "Perustepalkka/kk"

Identify the main TOE summary component (I will call it `ToeSummaryView` in this prompt).  
Tell me the file path(s) you find before making changes.

==================================================
2. HIGH-LEVEL BUSINESS RULES
==================================================

The PPT we follow defines **how subsidized work affects TOE and wage base**.  
There are 4 key phases in the new process:

1. **Phase 1 – Starting point (system view)**  
   - The system has already found a TOE=12 months (or TOE full) based on some months.
   - It has a TOE reference period and wage period.
   - On the main page, if there is any subsidized work in this period, we show a CTA:
     - "Tarkista palkkatuetun työn vaikutus TOE:hen ja palkanmääritykseen"

2. **Phase 2 – Recalculate TOE with subsidized work rules**  
   We conceptually split time into:
   - **“Common time”**: periods where there is BOTH normal work and subsidized work in the same calendar months.
   - **“Subsidy-only time”**: periods where there is ONLY subsidized work.

   Business rules:
   - Normal work (non-subsidized):
     - TOE stays as calculated by the system (0, 0.5, 1 etc.).
   - Subsidized work:
     - If **no exception ground** → does NOT accrue TOE (0), only extends the reference period.
     - If **exception ground** (poikkeusperuste) → all TOE months from subsidized work are multiplied by 0.75.
   - For both common and subsidy-only time:
     - The **converted TOE** cannot exceed the number of calendar months in that period.  
       Example: if period covers 10 calendar months, final TOE from that period must be ≤ 10.

   We do NOT need to calculate TOE per individual row here.  
   We operate using aggregated “segments”.

3. **Phase 3 – Extend the reference period up to max 28 months**  
   - We start with the months/segments the system originally used to reach TOE=12.
   - We apply the conversion rules above and get a **real TOE total**.  
   - If the real TOE < 12 months:
     - extend the reference period backwards (add older months), up to a maximum of 28 months total,
     - reapply the segment logic and TOE conversion.
   - If after 28 calendar months real TOE is still < 12:
     - show clearly that the employment condition does not meet the requirement.
     - wage calculation is NOT done.

4. **Phase 4 – Wage determination from the TOE period**  
   Very important rule:

   > Wage determination uses **ALL months in the reference period used to obtain real TOE ≥ 12**,  
   > not just the “12 TOE months”.

   That means:
   - If we need 20 calendar months to reach 12 real TOE months, then **all those 20 months** are included in the wage base calculation.

   Wage rules for this period:
   - Normal work wages: **100 %**.
   - Subsidized work wages:
     - **0 %** if normal subsidy (no exception).
     - **75 %** if exception subsidy (poikkeusperuste).
   - In pure subsidized periods, PPT also shows comparisons like:
     - normal daily-wage logic vs 75 % of total wages / 12 months,
     - and selecting the **most favourable for the claimant**.  
     Implement the core logic so that:
       - we can plug this comparison in later,
       - but for now, we at least support:
         - normal 100 % for non-subsidized,
         - 0 % or 75 % for all subsidized wages in the chosen period.

==================================================
3. DATA MODEL FOR THE NEW PROCESS
==================================================

Create a new types file for the process-level model, for example:

`src/types/palkkatuettuProcess.ts`

Define:

```ts
export type SegmentType = "COMMON" | "SUBSIDY_ONLY";

export interface SubsidySegment {
  id: string;
  type: SegmentType;

  // Number of calendar months in this segment (e.g. 10 for a 10-month common period)
  calendarMonths: number;

  // TOE as the system currently sees it (before any 0.75 conversion)
  toeNormalSystem: number;     // TOE from normal work in this segment
  toeSubsidizedSystem: number; // TOE from subsidized work in this segment

  // Wages for wage determination
  wageNormalTotal: number;       // wages from normal work in this segment
  wageSubsidizedTotal: number;   // wages from subsidized work in this segment

  // For manual adjustments (handler can override)
  includeInToe: boolean;       // include this segment in the TOE recalculation
  includeInWage: boolean;      // include this segment in the wage base (usually same as includeInToe)
}
We may later add metadata fields like startDate/endDate or a textual label.
The key is: TOE is represented as system values per segment; we will convert them.

==================================================
4. PURE UTILITY FUNCTIONS (WITH TESTS)
Create src/utils/palkkatuettuToe.ts with pure functions:

ts
Kopioi koodi
import { SubsidySegment } from "@/types/palkkatuettuProcess";

export interface ToeConversionResult {
  segments: (SubsidySegment & {
    toeNormalAccepted: number;
    toeSubsidizedConverted: number;
    toeTotalSegment: number;
  })[];
  totalToeReal: number;
}

/**
 * Convert TOE in each segment according to rules:
 * - Normal TOE remains as system value (subject to calendar month cap).
 * - Subsidized TOE is multiplied by 0.75 if exceptionSubsidy is true, else 0.
 * - Total TOE per segment is capped by segment.calendarMonths.
 */
export function convertToeForSegments(
  segments: SubsidySegment[],
  exceptionSubsidy: boolean,
): ToeConversionResult {
  // implement as described in the business rules
}
Algorithm for convertToeForSegments (comment in English in the code):

Iterate only segments where includeInToe === true.

For each segment:

toeNormalAccepted = min(segment.toeNormalSystem, segment.calendarMonths)

toeSubsidizedRaw = segment.toeSubsidizedSystem

toeSubsidizedConverted = exceptionSubsidy ? toeSubsidizedRaw * 0.75 : 0

toeTotalSegment = min( toeNormalAccepted + toeSubsidizedConverted, segment.calendarMonths )

Sum up toeTotalSegment over all segments to get totalToeReal.

Return augmented segments + totalToeReal.

Next, create a function to choose the reference period (up to 28 months):

ts
Kopioi koodi
export interface ToePeriodSelectionResult extends ToeConversionResult {
  segmentsUsed: SubsidySegment[];
}

/**
 * Given segments in chronological order (newest first),
 * select segments up to a maximum of 28 calendar months,
 * recompute TOE and determine if we reach 12 real TOE months.
 */
export function selectToePeriod(
  allSegments: SubsidySegment[],
  exceptionSubsidy: boolean,
  maxCalendarMonths: number = 28,
): ToePeriodSelectionResult {
  // Start from the system's original TOE period (first N segments)
  // Add segments until total calendarMonths <= maxCalendarMonths
  // For each growing set, call convertToeForSegments()
  // Stop as soon as totalToeReal >= 12 or we reached maxCalendarMonths.
}
Finally, create wage base utilities in src/utils/palkkatuettuWage.ts:

ts
Kopioi koodi
import { SubsidySegment } from "@/types/palkkatuettuProcess";

export interface WageBaseResult {
  wageNormal: number;
  wageSubsidizedGross: number;
  wageAcceptedSubsidized: number;
  wageBaseTotal: number;
}

/**
 * Wage base is calculated from ALL segments in the selected TOE period,
 * not just the 12 TOE months. Normal wages are 100 %.
 * Subsidized wages are 0 % or 75 % depending on exceptionSubsidy.
 */
export function calcWageBaseFromSegments(
  segments: SubsidySegment[],
  exceptionSubsidy: boolean,
): WageBaseResult {
  // Sum wageNormalTotal and wageSubsidizedTotal only from segments where includeInWage=true,
  // then apply 0 % / 75 % rule to subsidized wages.
}
Add unit tests for:

convertToeForSegments:

COMMON + SUBSIDY_ONLY combinations, caps by calendarMonths, exception vs no-exception.

selectToePeriod:

cases where initial system period gives < 12 TOE and we must extend,

and cases where 12 TOE is reached within 20 calendar months.

calcWageBaseFromSegments:

pure normal work, pure subsidized, mix.

==================================================
5. NEW REACT VIEW: PalkkatuettuProcessView
Create a new component:

src/components/PalkkatuettuProcessView.tsx

Props (you can adapt to your app's data flow, but start with):

ts
Kopioi koodi
interface PalkkatuettuProcessViewProps {
  segmentsInitial: SubsidySegment[]; // system's original TOE period, as segments
  segmentsExtended: SubsidySegment[]; // segments including older periods, up to 28 months
  exceptionSubsidy: boolean; // whether this claimant has a poikkeusperuste for subsidy
  onClose: () => void;
  onApply: (result: {
    toeReal: number;
    toeSegmentsUsed: SubsidySegment[];
    wageBase: number;
  }) => void;
}
Behaviour:

Show a header summarising the system view:

“Järjestelmän TOE: 12 kk (alkuperäinen tulkinta)”

“Tarkastelujakso: …”

“Palkkatuettua työtä havaittu N jaksossa”

Show a table of segments (NOT raw months), with columns:

Ajanjakso / kuvaus (use a label field or format from data)

Segment type: “Yhteinen aika” or “Vain palkkatuettu”

TOE (normal system), TOE (palkkatuettu system)

Kalenterikuukaudet (calendarMonths)

Include checkbox (includeInToe / includeInWage)

Under the table, show the TOE recalculation summary using convertToeForSegments:

“Muu työ (TOE): …”

“Palkkatuettu työ (TOE, järjestelmä): …”

“Palkkatuettu työ (TOE, muunto 75 %): …”

“Todelliset TOE-kuukaudet yhteensä: {totalToeReal} kk”

If totalToeReal < 12:

show info: “Todelliset TOE-kuukaudet eivät täyty. Laajenna tarkastelujaksoa (max 28 kk).”

provide a button “Laajenna 28 kuukauteen”

on click: replace segments with segmentsExtended, rerun conversion.

When totalToeReal >= 12:

show a block:
“Tällä jaksolla täyttyy 12 TOE-kuukautta.
Palkanmääritys tehdään kaikilta tämän jakson kuukausilta.”

call calcWageBaseFromSegments() and show:

normal wages total

subsidized wages total

accepted subsidized wages (0 % / 75 %)

wage base total

Footer buttons:

“Hyväksy ja palaa” → calls onApply({ toeReal, toeSegmentsUsed, wageBase }) then onClose()

“Peruuta” → onClose() without changes.

==================================================
6. INTEGRATION WITH THE MAIN TOE SUMMARY VIEW
In the TOE summary component (file you found at the beginning, e.g. ToeSummaryView.tsx):

Add state:

ts
Kopioi koodi
const [showPalkkatuettuProcess, setShowPalkkatuettuProcess] = useState(false);
const [palkkatuettuResult, setPalkkatuettuResult] = useState<{
  toeReal: number;
  toeSegmentsUsed: SubsidySegment[];
  wageBase: number;
} | null>(null);
Detect if the current TOE reference period contains subsidized work.
If yes, show a CTA button:

“Tarkista palkkatuetun työn vaikutus”

On click:

Build segmentsInitial from the existing month rows (group them into segments as needed).

Build segmentsExtended by adding older months up to 28 calendar months.

Open <PalkkatuettuProcessView />.

When onApply from PalkkatuettuProcessView is called:

store the result in palkkatuettuResult.

in the TOE summary page:

override the displayed TOE months with palkkatuettuResult.toeReal.

override the wage base with palkkatuettuResult.wageBase.

show a badge / info text:
“Palkkatuetun työn vaikutus huomioitu manuaalisessa laskennassa.”

Keep the original system values visible in smaller grey text for transparency:

e.g. “Järjestelmän TOE: 12 kk, korjattu TOE: 11,75 kk”

and similar for wage base.

==================================================
7. IMPLEMENTATION NOTES
Do not change existing tests. Add new ones only for the new utilities.

Comment all business logic in English, especially where:

0.75 conversion is applied,

TOE is capped by calendar months,

wage base includes the entire TOE period (not only 12 months).

Keep the UI simple but clear. No need for advanced styling – focus on correct data flow and visible explanation for the handler. 







You already have the base implementation for handling subsidized work (palkkatuettu työ).
Now extend it into a fully MANUAL correction tool that supports all real-world edge cases,
including the PPT logic, poikkeusperuste, and manual divisor (jakajalaskuri) adjustments.

The goal:  
The system must NEVER trust its own TOE or wage calculation when subsidized work exists.  
The handler must always perform a manual correction workflow.

=======================================================================
1. ALWAYS trigger a manual correction workflow when subsidized work exists
=======================================================================

If any period in the TOE window contains subsidized work:
- show CTA “Tarkista palkkatuettu työ (manuaalinen korjaus vaaditaan)”
- system must NOT use its TOE or wage calculation
- user must complete the correction modal before data becomes valid

Main page must show:
- “Palkkatuettu työ käsittelemättä” until corrections are approved
- After approval: “Palkkatuettu työ tarkistettu (manuaalinen korjaus käytössä)”

=======================================================================
2. The correction modal must support all subsidy rules
=======================================================================

At the top of the modal, user must choose the correct subsidy rule:

1) “Palkkatuki”  
   - TOE contribution = 0  
   - Wage contribution = 0  
   - Only extends the reference window

2) “Palkkatuettu työ alkanut ennen 2.9.2024”  
   - TOE contribution = systemTOE * 0.75  
   - Wage contribution = wage * 0.75

3) “Poikkeusperuste (10 kk ei TOE, sen jälkeen 75 %)”  
   - First 10 TOE months = 0  
   - Remaining TOE months = systemTOE * 0.75  
   - Wages follow the same logic

These conversion rules must be applied AFTER the segments are combined.

=======================================================================
3. Segment table functionality (critical)
=======================================================================

The modal shows all months/segments in the current TOE window:
- system raw TOE per segment
- system divisorDays per segment
- wage amounts per segment
- flags:
   includeInToe
   includeInWage
   subsidyType (from chosen rule)

User must be able to:
- manually zero out any segment (set TOE = 0 and divisorDays = 0)
- manually edit divisorDays (jakajan päivät)
- manually edit includeInToe / includeInWage switches
- manually change subsidy type per segment if needed

Zeroing out a block (e.g. the first 10 months for poikkeusperuste) must:
- set includeInToe = false
- set includeInWage = false
- set divisorDays = 0

The UI must allow zeroing out a continuous period exactly like PPT example:
“Vie 10 kk poissaoloiden jakajalaskuriin → ajanjakso 1.10.2024–31.7.2025 nollaksi”.

=======================================================================
4. Correct TOE calculation
=======================================================================

The system must show BOTH:

System TOE:  
   sum(systemTOE including subsidized months)

Corrected TOE (AFTER subsidy rule + manual zeroing + 0.75 conversion):  

   toeNormal = sum(toe of normal work segments)
   toeSubSystem = sum(system toe of subsidized segments)
   toeSubConverted = apply rule:
      - Palkkatuki: 0
      - Before 2.9.2024: toeSubSystem * 0.75
      - Poikkeusperuste:
           first 10 TOE months = 0
           remaining = 0.75 * systemTOE

   toeCorrected = toeNormal + toeSubConverted

The corrected TOE MUST be the only value used to evaluate whether TOE >= required months (6 or 12).

=======================================================================
5. Extending period to 28 months AND BEYOND
=======================================================================

When corrected TOE < requirement:
- show “Laajenna tarkastelujaksoa 28 kk”
- fetch raw data up to 28 months
- DO NOT trust system’s 12 kk fulfillment
- re-run corrected TOE calculation AFTER conversion

If still < 12 kk AND backend indicates “pidentävät jaksot” available:
- show button: “Hae pidentävät jaksot (TT180, TT109…)”
- append additional segments
- re-run conversion again

If even after pidentävät jaksot corrected TOE < requirement:
- show final state:
  “Työssäoloehto ei täyty pidentävistä jaksoista huolimatta.
   Palkanmääritystä ei voida tehdä.”

=======================================================================
6. Manual divisor (“jakajalaskuri”) logic
=======================================================================

Every segment has editable divisorDays.

Rules:
- Removing a segment from TOE must also remove its divisorDays.
- Zeroing out periods must zero divisorDays as well.
- Any manual change in divisorDays triggers full wage recomputation.

Wage calculation must always be:

totalDivisorDays =
   sum(segments where includeInWage == true).divisorDays

totalAcceptedWages =
   sum(segments where includeInWage == true).acceptedWages
   where:
      normal work: 100%
      subsidized work:
         rule: 0% / 75% depending on chosen logic

dailyWage =
   totalDivisorDays > 0
   ? totalAcceptedWages / totalDivisorDays
   : 0

Show result exactly as in PPT:
- “Jakaja: 43 + 325 = 368”
- “Jakajan päivät yhteensä: 359”
- etc.

=======================================================================
7. Wage determination AFTER corrected TOE >= 12 kk
=======================================================================

Only when toeCorrected >= requirement:
- enable wage calculation
- show full wage window with all segments still visible
- daily wage = totalAcceptedWages / totalDivisorDays
- monthly wage base = dailyWage * 21.5 (or system divisor)

Pure subsidy case:
- if only subsidized wages exist, show Method 1 vs Method 2:
   Method 1: divisor-based daily wage
   Method 2: (totalSubsidyWages * 0.75) / 12
- handler must explicitly choose one

=======================================================================
8. Final approval step
=======================================================================

Add checkbox:
“Käytä korjattua TOE-kertymää (X kk) sekä korjattuja jakajan päiviä”

And button:
“Hyväksy korjaus”

Upon approval:
- save corrected TOE
- save corrected divisorDays
- save chosen wage method
- save corrected wage base
- system displays status “Palkkatuettu työ tarkistettu”

=======================================================================
9. Tests to add
=======================================================================

Add test coverage for:
- zero-out blocks
- first-10-months exclusion rule
- 0.75 conversion
- manual divisorDays editing
- 28-month and pidentävät jaksot re-fetch cycle
- wage recalculation after manual adjustments
- NOT allowing wage calculation unless corrected TOE ≥ requirement
- storing both original system values and corrected values




### RULE: Wage calculation must include ONLY months that are accepted as TOE months

Implement the following rule across the entire subsidized work correction flow:

1. A calendar month is included in the wage calculation (palkanmääritys) ONLY IF:
   - includeInToe === true
   - AND monthToe > 0   // after normal + subsidized TOE conversion
   - AND includeInWage === true

2. Months that result in TOE = 0 (for any reason) MUST NOT contribute to:
   - accepted wages,
   - divisorDays (jakajan päivät),
   - daily wage calculation,
   - monthly wage base,
   - or any other wage metrics.

3. This applies to all cases:
   - Normal work (muu työ)
   - Subsidized work (palkkatuki)
   - Before 2.9.2024 75% rule
   - Poikkeusperuste (10 kk excluded, rest * 0.75)
   - Any manually zeroed months
   - Any automatically zeroed months (0.75 → 0)
   - All extended 28-month periods
   - All “pidentävät jaksot”

4. Technically:
   When preparing the wage calculation input set, filter rows as:

   ```ts
   const wageRows = segments.filter(s =>
       s.includeInToe === true &&
       s.includeInWage === true &&
       s.monthToe > 0
   );
Wage calculation must use ONLY these filtered wageRows:

ts
Kopioi koodi
const totalAcceptedWages = sum(wageRows.acceptedWages);
const totalDivisorDays = sum(wageRows.divisorDays);
const dailyWage =
    totalDivisorDays > 0
    ? totalAcceptedWages / totalDivisorDays
    : 0;
UI must reflect this clearly:

When a month becomes TOE=0, its wage and divisor fields become greyed out
or automatically excluded from the wage calculation section.

The wage preview must dynamically update as rows are toggled.

This ensures alignment with real-world handling rules where:

only months that contribute to the fulfilled employment condition (TOE)
can be used as part of the wage base,

and any months that are excluded from TOE (e.g. 10 kk nollaus) are also
excluded from palkanmääritys.






### RULE: Multiple subsidized work periods inside the 28-month extension must be handled independently

When the system fetches up to 28 months of data, there may be several separate
subsidized work periods (palkkatuetun työn jaksot). Each period may start under
a different legal rule:

- periods starting before 2.9.2024 → 75% rule
- periods starting on or after 2.9.2024 → 0% rule
- periods marked as poikkeusperuste → first 10 TOE months excluded, remaining 75%
- periods without TOE (normal palkkatuki) → 0%

The tool must NOT assume that all subsidized periods share the same rule.

1. For every subsidized segment retrieved in the 28-month window, the handler
   must be able to manually choose or confirm the correct subsidy rule for that segment.

2. The conversion is applied per segment, not globally.

3. TOE for each calendar month is computed as:
      monthToe = min(normalToe + convertedSubsidyToe, 1)

4. Summed TOE = Σ monthToe

   This prevents invalid sums (e.g. "5.5 kk TOE during a 4-month overlapping period"),
   exactly as shown in the PPT example.

5. Wage calculation must include ONLY those months where:
      monthToe > 0 AND includeInWage == true

6. Months where the handler unchecks TOE or where convertedSubsidyToe == 0 must
   automatically be excluded from wage calculation and divisorDays.

This ensures correct handling of:
- subsidized work starting in the middle of 28 months
- older subsidized periods that apply a different rule
- mixed normal + subsidized work per month
- overlapping work sources
- preventing TOE inflation beyond the available calendar months





### RULE: Divisor days (jakajan päivät) must only come from TOE months

Update the wage calculation logic so that divisorDays are counted ONLY from months
that actually contribute to the TOE.

Concretely:

1. For each calendar month row we already compute:
   - monthToe  // 0…1 after normal + subsidized TOE conversion and capping at 1
   - includeInToe: boolean
   - includeInWage: boolean
   - divisorDays: number

2. A month is eligible for the divisor (jakaja) ONLY IF:
   - includeInToe === true
   - includeInWage === true
   - monthToe > 0

3. Implement the divisor sum as:

```ts
const divisorRows = rows.filter(
  (r) => r.includeInToe && r.includeInWage && r.monthToe > 0,
);

const totalDivisorDays = divisorRows.reduce(
  (sum, r) => sum + r.divisorDays,
  0,
);
Wage calculation must also use ONLY these same rows:

ts
Kopioi koodi
const totalAcceptedWages = divisorRows.reduce(
  (sum, r) => sum + r.acceptedWage, // 100% normal, 0% or 75% subsidized
  0,
);

const dailyWage =
  totalDivisorDays > 0 ? totalAcceptedWages / totalDivisorDays : 0;
Any month where monthToe == 0 (e.g.:

normal palkkatuki with 0 TOE,

poikkeusperusteen 10 first months excluded,

manually unchecked TOE rows)
MUST:

NOT contribute to totalDivisorDays,

NOT contribute to totalAcceptedWages.

In the UI, when monthToe becomes 0 or includeInToe is unchecked:

visually grey out the wage + divisor fields for that month,

and ensure it disappears from the divisorRows set above.

This guarantees:

only months that actually contribute to the employment condition (TOE)
can also contribute to the wage divisor,

and months explicitly excluded from TOE are automatically excluded
from jakaja and wage base.

perl
Kopioi koodi
