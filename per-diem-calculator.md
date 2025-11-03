# Per Diem Calculator (Päivärahalaskuri)

## Problem (Context & Impact)

### Context
The Finnish unemployment benefit system uses complex calculations to determine daily allowance amounts (päiväraha). These calculations depend on numerous variables including salary history, benefit type, cumulative paid days, period adjustments, step factors (porrastus), and various regulatory parameters. Case workers and benefit recipients need to understand how these calculations work, but the complexity makes it difficult to:

- **Predict benefit amounts** before submitting applications
- **Understand why** certain amounts are calculated
- **Explore different scenarios** (e.g., different salary levels, period lengths)
- **Verify calculations** independently

### Impact
Without transparent calculation tools:
- **Users experience uncertainty** about their benefit amounts
- **Case workers spend excessive time** explaining calculations verbally
- **Errors go undetected** until formal calculations are processed
- **Trust in the system decreases** due to perceived lack of transparency
- **Users cannot plan financially** because they don't understand their entitlements

The lack of accessible calculation tools creates a barrier between users and the complex regulatory framework that determines their financial support.

---

## Constraints & Risks

### Regulatory Constraints
- **Complex formulas**: Calculations involve multiple steps with official thresholds (e.g., 40-day step reduction at 80%, 170-day step reduction at 75%)
- **Official parameters**: Base amounts, split points, and deduction rates must match official regulations
- **Business day calculations**: Only business days count toward paid days, requiring accurate date calculations
- **Period-based adjustments**: Different period types (1 month, 2 weeks, 4 weeks) affect calculations differently

### Technical Constraints
- **Formula accuracy**: All calculations must exactly match official benefit calculation logic
- **Date handling**: Business day counting must be precise (excluding weekends)
- **Multiple benefit types**: Different benefit types (ansioturva, peruspäiväraha, työmarkkinatuki) have different calculation rules
- **Cumulative tracking**: Step factors depend on cumulative paid days, requiring accurate tracking

### Risks
- **Regulatory compliance**: Incorrect calculations could mislead users about their entitlements
- **User expectations**: Showing calculation results might create expectations that don't match final official determinations
- **Complexity management**: Too much detail can overwhelm users, while too little lacks transparency
- **Maintenance burden**: Formula parameters change annually with regulations

---

## UX Goals

### Primary Goals
1. **Transparency**: Make calculation logic visible and understandable
2. **Predictability**: Enable users to estimate their benefit amounts accurately
3. **Explorability**: Allow users to test different scenarios and see results immediately
4. **Education**: Help users understand how the benefit system works

### User Experience Objectives
- **Clear input/output relationship**: Users should see how changing inputs affects results
- **Progressive disclosure**: Show basic calculations first, with options to explore details
- **Real-time feedback**: Calculations update immediately as inputs change
- **Contextual help**: Provide explanations for complex terms and calculations where needed
- **Comparison capability**: Allow users to compare different scenarios side-by-side

### Usability Goals
- **Learnability**: New users should understand the tool within minutes
- **Efficiency**: Experienced users should quickly test multiple scenarios
- **Error prevention**: Validate inputs and prevent invalid configurations
- **Accessibility**: Ensure calculations work for users with varying technical skills

---

## What I Designed

### Core Features

**1. Real-Time Calculation Engine**
- Input fields for salary, dates, benefit type, and period settings
- Automatic calculation of daily allowance amounts based on official formulas
- Support for multiple benefit types (ansioturva, peruspäiväraha, työmarkkinatuki)
- Business day counting for accurate paid day calculations

**2. Interactive Formula Configuration**
- Editable formula parameters (base amounts, split points, deduction rates, step thresholds)
- Visual representation of how formulas work
- Ability to test with official 2025 values or custom parameters

**3. Period-Based Adjustments**
- Selection of adjustment periods (1 month/21.5 days, 2 weeks/10 days, 4 weeks/20 days)
- Automatic calculation of per-day reductions when income adjustments apply
- Clear indication of how adjustments affect daily amounts

**4. Step Factor (Porrastus) System**
- Automatic application of step factors based on cumulative paid days
- Visual indicators showing which step factor applies
- Calculation of average step factors for periods spanning thresholds

**5. Comparison Mode**
- Side-by-side comparison of different calculation scenarios
- Ability to test different salaries, dates, and configurations
- Clear visual differentiation between compared scenarios

**6. Detailed Calculation Breakdown**
- Step-by-step display of how daily amounts are calculated
- Breakdown of base amount, earnings part, adjustments, and final amounts
- Visual representation of calculation components

### Design Decisions

**Progressive Disclosure**
- Basic calculation shown prominently
- Advanced options (formula editing, comparison mode) available but not overwhelming
- Expandable sections for detailed breakdowns

**Visual Feedback**
- Real-time calculation updates as inputs change
- Color coding and visual indicators for important values
- Clear labeling of all inputs and outputs

**Error Prevention**
- Input validation prevents invalid date ranges
- Automatic business day calculation prevents manual errors
- Default values provide sensible starting points

**Accessibility**
- Clear labels and descriptions for all fields
- Finnish language support for domain-specific terms
- Consistent formatting for currency and dates

---

## Validation and Outcome

### User Testing Approach
- **Internal testing**: Verified calculations against official examples and edge cases
- **Scenario testing**: Tested various salary levels, benefit types, and date combinations
- **Formula validation**: Cross-referenced calculations with official benefit calculation documentation

### Key Findings

**Strengths**
- **Accurate calculations**: Formula implementation matches official calculation logic
- **Immediate feedback**: Real-time updates help users understand relationships quickly
- **Scenario exploration**: Comparison mode enables effective "what-if" analysis
- **Transparency**: Detailed breakdowns help users understand calculations

**Areas for Improvement**
- **Initial complexity**: First-time users may find the number of inputs overwhelming
- **Help content**: Additional contextual help could improve learnability
- **Mobile experience**: Complex forms may need optimization for smaller screens

### Outcome
The prototype successfully demonstrates:
- **Technical capability**: Complex financial calculations can be made accessible through UI
- **User empowerment**: Transparent tools help users understand complex systems
- **Design pattern**: Progressive disclosure and real-time feedback work well for calculation-heavy interfaces
- **Regulatory transparency**: Making complex formulas visible builds trust and understanding

---

## Why This Matters for UX/UI Work

### Demonstrating Complex System Design
This project showcases the ability to **simplify complex financial and regulatory systems** through thoughtful UX design. It demonstrates:
- Breaking down multi-step calculations into understandable components
- Making abstract formulas concrete and visual
- Balancing detailed information with usability

### User Empowerment Through Transparency
The tool addresses a critical UX principle: **transparency builds trust**. By making calculations visible:
- Users feel more in control
- Errors and misunderstandings decrease
- The system becomes more accessible to non-experts

### Progressive Disclosure in Practice
The design demonstrates effective use of **progressive disclosure**:
- Core functionality is immediately accessible
- Advanced features don't clutter the primary experience
- Users can drill down into details when needed

### Real-Time Feedback Patterns
The instant calculation updates illustrate the value of **immediate feedback**:
- Users learn by doing, seeing results change as they experiment
- Reduces cognitive load by showing consequences immediately
- Makes abstract relationships concrete

### Handling Regulatory Constraints
This work shows how to **design within strict regulatory constraints**:
- Accuracy requirements don't prevent good UX
- Complex rules can be made understandable
- Users can work with systems they don't fully control

### Accessibility in Complex Domains
The project demonstrates **making complex domains accessible**:
- Domain expertise shouldn't be required to use the tool
- Clear labels and explanations bridge knowledge gaps
- Visual design supports understanding of abstract concepts

### Professional Relevance
For UX/UI portfolios, this demonstrates:
- **Problem-solving**: Addressing real user pain points with transparency tools
- **Technical understanding**: Working with complex calculations and formulas
- **Design thinking**: Balancing regulatory accuracy with user needs
- **User advocacy**: Prioritizing user understanding and empowerment

This prototype shows that even the most complex, regulation-heavy systems can be made accessible and empowering through thoughtful UX design.

