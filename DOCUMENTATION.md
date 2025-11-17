# Subsidized Employment TOE Calculation Rules & Implementation Guide

This document provides comprehensive rules and implementation guidelines for calculating TOE (Työssäoloehto - Employment Condition) months for subsidized employment in Finland.

## 1. Salary Thresholds (EuroTOE Model - After 2.9.2024)

- **Minimum salary for TOE:** 465€/month
- **Full month salary:** ≥ 930€/month = 1.0 TOE month
- **Half month salary:** 465-929€/month = 0.5 TOE month
- **Below minimum:** < 465€/month = 0 TOE months

## 2. Key Dates

- **RULE_DATE:** September 1, 2024 (2024-09-01)
- **RULE_DATE_AFTER:** September 2, 2024 (2024-09-02)
- Employment starting before/on September 1, 2024: Old law (6 months TOE requirement)
- Employment starting after September 2, 2024: New law (12 months TOE requirement)

## 3. Subsidized Employment Rules by Start Date

### 3.1 Employment Starting Before/On September 1, 2024

- 75% of total gross salary is accepted for TOE calculation
- Calculate TOE months normally based on salary thresholds
- Multiply total TOE months by 0.75
- Round down to nearest 0.5

### 3.2 Employment Starting After September 2, 2024

#### 3.2.1 Normal Wage Subsidy (normaali palkkatuki)

- **NO TOE accumulation**
- Extends the review period
- Note: This option has been removed from the UI dropdown but should still be handled in code

#### 3.2.2 Exception Basis (poikkeusperuste)

For: Reduced work ability (alentuneesti työkykyinen) or Over 60 long-term unemployed (yli 60-vuotias pitkäaikaistyötön)

- **First 10 months from employment start date:** NO TOE accumulation
- **After 10 months:** 75% of total gross salary accepted
- **Critical:** The 10-month period starts from the employment start date, NOT from the calculation date backwards
- Calculate TOE months for months after the 10th month
- Multiply by 0.75
- Round down to nearest 0.5

## 4. Rounding Rules

- All TOE month values must be rounded **down** to the nearest 0.5
- Examples:
  - 7.1 → 7.0
  - 7.6 → 7.5
  - 7.9 → 7.5
  - 7.5 → 7.5
- Display format: Only whole numbers or 0.5 (e.g., "7" or "7.5", never "7.1")

## 5. Salary Calculation for TOE Determination

**Important:** For subsidized employment, the 75% calculation is done on the **total gross salary** of months that accumulate TOE, not per month.

1. Collect all gross salaries for months that accumulate TOE
2. Calculate 75% of this total
3. This is the accepted salary amount for TOE determination

**Example:**
- Month 1-10: 1000€/month, but NO TOE (first 10 months rule)
- Month 11-12: 1000€/month, TOE accumulates
- Total gross for TOE-accumulating months: 2000€
- Accepted salary: 2000€ × 0.75 = 1500€

## 6. Implementation Guide for Developers

### 6.1 Monthly Calculation Approach

Always calculate TOE accumulation **month by month**, not as a total duration. This is critical for handling the 10-month rule correctly.

### 6.2 Step-by-Step Implementation

#### Step 1: Determine Employment Period

```javascript
// Get employment start and end dates
const startDate = new Date(employmentStartDate);
const endDate = employmentEndDate ? new Date(employmentEndDate) : new Date();

// Iterate through each month
let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
const end = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);

while (currentDate <= end) {
    // Process each month
}
```

#### Step 2: Check Salary Thresholds (Per Month)

```javascript
// For each month, check salary
if (monthlySalary < 465) {
    // No TOE accumulation
    toeMonths = 0;
} else if (monthlySalary >= 930) {
    // Full month (1.0 TOE month)
    toeMonths = 1.0;
} else {
    // Half month (0.5 TOE month)
    toeMonths = 0.5;
}
```

#### Step 3: Apply Date-Based Rules

```javascript
// Check if employment started before or after rule date
if (startDate <= RULE_DATE) {
    // Before/on Sept 1, 2024: 75% rule applies to all months
    // Collect TOE months normally, multiply by 0.75 at the end
} else if (startDate >= RULE_DATE_AFTER) {
    // After Sept 2, 2024
    if (subsidyBasis === 'normal') {
        // Normal wage subsidy: NO TOE accumulation
        toeMonths = 0;
    } else if (subsidyBasis === 'disabled' || subsidyBasis === 'senior') {
        // Exception basis: Check 10-month rule
        const monthsSinceStart = calculateMonthsSinceStart(currentMonth, startDate);
        if (monthsSinceStart < 10) {
            // First 10 months: NO TOE accumulation
            toeMonths = 0;
        } else {
            // After 10 months: TOE accumulates (will be multiplied by 0.75 later)
            toeMonths = calculateToeMonths(monthlySalary);
        }
    }
}
```

#### Step 4: Calculate Months Since Start

```javascript
function calculateMonthsSinceStart(monthDate, employmentStartDate) {
    const monthYear = monthDate.getFullYear();
    const monthMonth = monthDate.getMonth();
    const startYear = employmentStartDate.getFullYear();
    const startMonth = employmentStartDate.getMonth();
    
    // Calculate difference in months
    return (monthYear - startYear) * 12 + (monthMonth - startMonth);
}
```

#### Step 5: Apply 75% Rule and Rounding

```javascript
// After collecting all TOE months for subsidized employment
let totalSubsidizedToe = 0;
// ... accumulate months ...

// Multiply by 0.75
const subsidizedToeBeforeRounding = totalSubsidizedToe * 0.75;

// Round down to nearest 0.5
const finalSubsidizedToe = roundToeMonthsDown(subsidizedToeBeforeRounding);

function roundToeMonthsDown(value) {
    if (value === 0) return 0;
    const full = Math.floor(value);
    const decimal = value - full;
    if (decimal >= 0.5) {
        return full + 0.5;
    } else {
        return full;
    }
}
```

#### Step 6: Salary Calculation for TOE Determination

```javascript
// Collect gross salaries for months that accumulate TOE
let totalGrossForToeMonths = 0;

for (each month) {
    if (month accumulates TOE) {
        totalGrossForToeMonths += monthlySalary;
    }
}

// Calculate accepted salary (75% of total)
const acceptedSalary = totalGrossForToeMonths * 0.75;
```

### 6.3 Common Pitfalls to Avoid

- **Don't:** Calculate 10 months backwards from calculation date
- **Do:** Calculate 10 months forward from employment start date
- **Don't:** Apply 75% per month
- **Do:** Apply 75% to total gross salary of TOE-accumulating months
- **Don't:** Round normally (up or to nearest)
- **Do:** Always round down to nearest 0.5
- **Don't:** Show months before employment started
- **Do:** Only show months when employment is active

### 6.4 Testing Scenarios

1. **Before Sept 1, 2024:** Employment starts Aug 1, 2024, salary 1000€/month, 12 months → Should get 9 TOE months (12 × 0.75 = 9.0)

2. **After Sept 2, 2024 - Normal subsidy:** Employment starts Oct 1, 2024, salary 1000€/month → Should get 0 TOE months

3. **After Sept 2, 2024 - Exception basis:** Employment starts Oct 1, 2024, salary 1000€/month, 12 months → First 10 months: 0 TOE, months 11-12: 1.5 TOE months (2 × 0.75 = 1.5)

4. **Combined work:** Normal work (1000€/month) + Subsidized work (800€/month, exception basis, after 10 months) → Normal: 12 TOE months, Subsidized: 1.5 TOE months (2 × 0.75), Total: 13.5 TOE months

## 7. Code Constants Reference

```javascript
const RULE_DATE = new Date('2024-09-01'); // September 1, 2024
const RULE_DATE_AFTER = new Date('2024-09-02'); // September 2, 2024
const MIN_SALARY_FOR_TOE = 465; // Minimum monthly salary for TOE
const FULL_MONTH_SALARY = 930; // Full month TOE threshold
// 465-929€ = half month (0.5 TOE)
```

## 8. TOE Requirement Rules

- **Old law (employment before Sept 2, 2024):** 6 months TOE required
- **New law (employment after Sept 2, 2024):** 12 months TOE required
- If employment periods span both rules, use the earliest start date to determine requirement

## 9. Normal Employment Rules

Normal (non-subsidized) employment:
- 100% of TOE months are accepted
- Same salary thresholds apply (465€ minimum, 930€ for full month)
- No special rules or exceptions

## 10. Combined Employment (Normal + Subsidized)

When both normal and subsidized employment exist:
- Calculate each separately according to their respective rules
- Sum the TOE months from both
- Normal employment: 100% of calculated TOE months
- Subsidized employment: 75% of calculated TOE months (after applying all rules)
- Round final total down to nearest 0.5

## 11. Important Implementation Notes

### 11.1 Month Calculation

- Always iterate month by month, not by total duration
- Use calendar months (not 30-day periods)
- Start from the first day of the employment start month
- End at the last day of the employment end month

### 11.2 10-Month Rule Calculation

The 10-month exclusion period for exception basis subsidized employment:
- Starts from the **employment start date**
- Counts forward, not backward
- Month 0 = employment start month
- Months 0-9 = NO TOE accumulation
- Month 10+ = TOE accumulates (with 75% rule)

Example:
- Employment starts: October 1, 2024
- Month 0: October 2024 (no TOE)
- Month 1: November 2024 (no TOE)
- ...
- Month 9: July 2025 (no TOE)
- Month 10: August 2025 (TOE accumulates)
- Month 11: September 2025 (TOE accumulates)

### 11.3 Salary Collection for TOE Determination

For subsidized employment, collect gross salaries only for months that actually accumulate TOE:
- Before Sept 1, 2024: All months
- After Sept 2, 2024, exception basis: Only months after the 10th month
- After Sept 2, 2024, normal subsidy: No months (no TOE accumulation)

Then calculate: `acceptedSalary = totalGrossForToeMonths × 0.75`

## 12. Edge Cases

### 12.1 Employment Starting Exactly on Rule Date

- Employment starting on September 1, 2024: Use old law rules (75% for all months)
- Employment starting on September 2, 2024: Use new law rules

### 12.2 Employment Spanning Rule Date

If employment starts before Sept 2, 2024 and continues after:
- Apply old law rules (75% for all months)
- Use the start date to determine which rules apply

### 12.3 Multiple Employment Periods

If there are multiple subsidized employment periods:
- Calculate each period separately
- Apply rules based on each period's start date
- Sum the results

### 12.4 Salary Below Minimum

If monthly salary is below 465€:
- No TOE accumulation for that month
- Still count the month for duration calculations
- Do not include in salary collection for TOE determination

## 13. Validation and Testing Checklist

When implementing, ensure:

- [ ] Monthly iteration is used, not duration-based calculation
- [ ] 10-month rule counts forward from start date
- [ ] 75% is applied to total gross, not per month
- [ ] Rounding is always down to nearest 0.5
- [ ] Only active employment months are shown
- [ ] Old law (6 months) vs new law (12 months) requirement is correctly determined
- [ ] Normal wage subsidy after Sept 2, 2024 returns 0 TOE months
- [ ] Exception basis correctly excludes first 10 months
- [ ] Combined employment calculates each type separately

## 14. Reference Implementation

See `script.js` in this project for a complete reference implementation:
- `calculateMonthlyTOEBackward()` - Monthly calculation function
- `calculateTOEMonths()` - Rule application function
- `roundToeMonthsDown()` - Rounding function
- `calculateSubsidizedWorkTOEMonths()` - Core calculation logic

