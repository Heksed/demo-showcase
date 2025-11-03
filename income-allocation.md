# Income Allocation (Tulotietojen kohdistaminen)

## Problem (Context & Impact)

### Context
The Finnish unemployment benefit system requires accurate allocation of income across time periods to determine benefit eligibility and amounts. The system uses complex concepts like TOE (työmarkkinatukea edellyttävän tulon määrä - income requirement for unemployment benefit), which requires income to be properly distributed across monthly or weekly periods.

Case workers and benefit administrators face significant challenges:
- **Income information arrives in various formats**: Single payments, lump sums, irregular payments
- **Multiple allocation methods needed**: Income must be distributed based on employment periods, payment dates, or earned periods
- **Complex period calculations**: EuroTOE (monthly) and ViikkoTOE (weekly) periods have different rules
- **Large datasets**: Hundreds of income records need to be allocated efficiently
- **Relationship tracking**: Income records may be split, deleted, or modified, requiring careful tracking

### Impact
Without effective allocation tools:
- **Time-consuming manual work**: Case workers spend hours manually calculating and distributing income
- **Error-prone processes**: Complex manual calculations lead to mistakes
- **Inconsistent allocations**: Different workers apply rules differently
- **Difficult verification**: It's hard to verify how income was allocated after the fact
- **User confusion**: Benefit recipients don't understand why their income affects benefits in specific ways
- **Backlog accumulation**: Complex cases pile up because they're too time-consuming

The inability to efficiently allocate income creates bottlenecks in the benefit processing workflow and increases the risk of errors that affect people's financial support.

---

## Constraints & Risks

### Regulatory Constraints
- **Multiple TOE calculation methods**: EuroTOE (€930/month threshold), EuroTOE6 (6-month average), ViikkoTOE (weekly hours-based), and annual income calculations
- **Strict allocation rules**: Income must be allocated to specific periods based on employment dates, payment dates, or earned periods
- **Income type distinctions**: Different income types (salary, benefits, etc.) have different allocation rules
- **Threshold calculations**: TOE values (0.0, 0.5, 1.0) depend on income amounts relative to thresholds
- **Historical data integrity**: Original income data must be preserved even after allocation

### Technical Constraints
- **Large datasets**: Handling hundreds of income records efficiently
- **Complex state management**: Tracking allocations, splits, deletions, and modifications
- **Period calculations**: Generating correct monthly/weekly periods based on different TOE definitions
- **Relationship tracking**: Maintaining parent-child relationships for split income records
- **Real-time validation**: Preventing invalid allocations before they're applied

### Data Constraints
- **Incomplete information**: Some income records may lack complete date or employment information
- **Multiple employers**: Income from multiple employers must be tracked separately
- **Temporal relationships**: Understanding which income affects which periods requires careful date tracking

### Risks
- **Calculation errors**: Incorrect allocations lead to wrong benefit determinations
- **Data loss**: Poor tracking of allocations makes it impossible to reconstruct decisions
- **User overwhelm**: Complex interfaces with many options can confuse users
- **Performance issues**: Large datasets with real-time calculations may cause performance problems
- **Audit trail**: Lack of clear history makes it difficult to verify allocations later

---

## UX Goals

### Primary Goals
1. **Efficiency**: Enable rapid allocation of income across periods with minimal clicks
2. **Accuracy**: Prevent errors through validation and clear visual feedback
3. **Transparency**: Make allocation logic visible and understandable
4. **Flexibility**: Support multiple allocation methods for different scenarios
5. **Verification**: Enable users to review and verify allocations before applying them

### User Experience Objectives
- **Batch operations**: Allow bulk allocation of multiple income records
- **Preview before apply**: Show allocation results before committing changes
- **Clear visual hierarchy**: Make it easy to understand which income affects which periods
- **Undo capability**: Allow users to remove allocations and restore original state
- **Contextual guidance**: Provide clear explanations of allocation methods and their effects

### Usability Goals
- **Learnability**: Users should understand allocation workflows without extensive training
- **Efficiency**: Experienced users should allocate income quickly with keyboard shortcuts and batch operations
- **Error prevention**: Validate allocations and prevent impossible configurations
- **Recoverability**: Provide clear paths to undo mistakes and correct errors

### Information Architecture Goals
- **Period-centric view**: Organize income around time periods rather than individual records
- **Relationship visualization**: Show how income records relate to each other (splits, parents, children)
- **Status indicators**: Clearly show which records are allocated, deleted, or modified
- **Summary information**: Provide overviews that help users understand the big picture

---

## What I Designed

### Core Features

**1. Period-Based Income Management**
- Visual table showing monthly or weekly periods with associated income records
- Expandable period rows showing detailed income breakdown
- Clear TOE value calculations (0.0, 0.5, 1.0) displayed for each period
- Summary header showing aggregate TOE calculations across all periods

**2. Multiple Allocation Methods**
- **Employment period allocation**: Distribute income based on employment start/end dates
- **Payment date allocation**: Allocate income to the period containing the payment date
- **Equal distribution**: Spread income evenly across specified number of months
- **Daily distribution**: Allocate income proportionally based on actual days in period
- **Forward/backward direction**: Control whether income is allocated forward or backward in time

**3. Single and Batch Allocation**
- **Single allocation**: Allocate individual income records to periods
- **Batch allocation**: Select multiple income records and allocate them together
- **Filter-based selection**: Filter income by employer, income type, or date range before batch allocation

**4. Income Splitting**
- Split single income records into multiple parts
- Support for splitting by amount, percentage, or fixed portions (1/3, 2/3)
- Automatic creation of parent-child relationships for split records
- Visual indication of split relationships in the income table

**5. Allocation Preview and Validation**
- Preview allocation results before applying changes
- Show how income will be distributed across periods
- Aggregate preview showing totals per period
- Validation to prevent invalid allocations (e.g., negative amounts, invalid dates)

**6. Income Record Management**
- Add new income records with employment and payment information
- Delete income records (with visual indication)
- Restore deleted income records
- Modify income records including income type and amounts

**7. TOE Summary Calculations**
- Multiple TOE definition types: EuroTOE, EuroTOE6, ViikkoTOE, annual income, foreign income
- Summary calculations showing overall TOE status
- Period-specific TOE values based on effective income totals
- Handling of special cases (e.g., ViikkoTOE weekly hour requirements)

**8. Saved Allocation Context**
- Save allocation configurations for later reference
- View previously applied allocations
- Ability to remove allocations and restore original income distribution

### Design Decisions

**Period-Centric Architecture**
- Organized interface around time periods rather than individual income records
- Makes it easier to understand which income affects which benefit periods
- Supports the mental model of benefit calculations

**Modal-Based Allocation Workflows**
- Dedicated allocation dialog provides focused environment for allocation tasks
- Step-by-step process guides users through allocation configuration
- Preview functionality integrated into modal workflow

**Progressive Disclosure**
- Period rows collapsed by default, expanded when needed
- Detailed income breakdowns available on demand
- Advanced allocation options (like custom date ranges) available but not prominent

**Visual Status Indicators**
- Color coding and icons indicate income record status (allocated, deleted, split)
- TOE value badges clearly show period eligibility
- Relationship lines (where applicable) show split income connections

**Real-Time Calculations**
- TOE values recalculate immediately when income changes
- Summary totals update in real-time
- No need to manually refresh or recalculate

**Batch Operation Support**
- Multi-select capabilities for bulk allocation
- Filter interface for selecting income records by criteria
- Clear visual indication of selected records

**Validation and Error Prevention**
- Date range validation prevents invalid period selections
- Amount validation ensures allocations don't exceed available income
- Clear error messages explain validation failures

---

## Validation and Outcome

### User Testing Approach
- **Workflow testing**: Tested complete allocation workflows from start to finish
- **Edge case testing**: Tested with various income patterns (lump sums, irregular payments, multiple employers)
- **Performance testing**: Verified system handles large datasets efficiently
- **Validation testing**: Confirmed allocation rules match regulatory requirements

### Key Findings

**Strengths**
- **Efficient workflows**: Batch allocation significantly reduces time needed for large datasets
- **Clear visual feedback**: Period-based view makes allocation results easy to understand
- **Flexible methods**: Multiple allocation methods handle various real-world scenarios
- **Preview functionality**: Preview before apply reduces errors and increases confidence

**Areas for Improvement**
- **Learning curve**: Multiple allocation methods require some training to understand when to use each
- **Complex state**: Managing allocations, splits, and deletions in large datasets can be cognitively demanding
- **Mobile optimization**: Complex tables and dialogs need mobile-specific designs

### Outcome
The prototype successfully demonstrates:
- **Workflow efficiency**: Complex allocation tasks can be streamlined through thoughtful UI design
- **Scalability**: System handles large datasets with real-time calculations
- **Error prevention**: Validation and preview features reduce allocation errors
- **User empowerment**: Case workers can handle complex cases more confidently

---

## Why This Matters for UX/UI Work

### Complex Workflow Design
This project demonstrates the ability to **design efficient workflows for complex, multi-step tasks**. It showcases:
- Breaking down complex processes into manageable steps
- Providing clear progress indicators and next actions
- Supporting both single-item and batch operations

### Information Architecture for Complex Data
The period-centric design shows effective **information architecture for complex relational data**:
- Organizing data around user mental models (time periods) rather than raw data structure
- Making relationships between data entities visible and understandable
- Balancing detail with overview through progressive disclosure

### Batch Operations and Efficiency
The design demonstrates **supporting power users** through batch operations:
- Multi-select interfaces that scale to large datasets
- Filter-then-operate patterns for bulk actions
- Keyboard shortcuts and efficient interaction patterns

### Preview Before Commit Pattern
The allocation preview functionality illustrates the **preview-before-commit pattern**:
- Reducing errors by showing results before applying changes
- Building user confidence through transparency
- Allowing experimentation without permanent changes

### State Management in Complex Interfaces
The project shows effective **state management in complex UIs**:
- Tracking multiple related entities (income records, periods, allocations)
- Managing relationships (splits, parent-child relationships)
- Providing clear visual indicators of state changes

### Validation and Error Prevention
The validation system demonstrates **proactive error prevention**:
- Real-time validation prevents invalid configurations
- Clear error messages explain what went wrong
- Visual feedback guides users toward correct configurations

### Professional Relevance
For UX/UI portfolios, this demonstrates:
- **Problem-solving**: Addressing real workflow pain points with systematic solutions
- **System thinking**: Designing for complex, interconnected data and workflows
- **Efficiency focus**: Prioritizing user productivity and reducing time-to-completion
- **Scalability**: Handling large datasets and complex operations without performance degradation

### Enterprise Tool Design
This prototype shows skills relevant to **enterprise and B2B tool design**:
- Complex data management interfaces
- Administrative and case management workflows
- Regulatory compliance in interface design
- Supporting expert users while maintaining learnability

This prototype demonstrates that even the most complex administrative workflows can be made efficient and error-resistant through thoughtful UX design, clear information architecture, and intelligent interaction patterns.

