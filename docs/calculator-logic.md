# Calculator Logic

## Overview
The site TELLS users what things cost. Users answer simple questions about their situation, and the calculator shows them the estimated cost of each component with educational context.

## User Flow
1. **Choose your home** — pick a Supreme Homes model or enter a custom price
2. **Do you own land?** — yes (skip land cost) or no (enter estimated land price)
3. **Foundation type** — slab / crawlspace / basement (site shows costs + descriptions)
4. **Water service** — well or municipal (site shows costs + explains the difference)
5. **Sewer service** — septic or municipal (site shows costs + explains the difference)
6. **Mortgage details** — down payment %, interest rate, amortization period

## Cost Categories

### User-Selected (with site-provided estimates)

| Category | Options | Low | Mid | High |
|----------|---------|-----|-----|------|
| Foundation | Slab | $8,000 | $14,000 | $22,000 |
| Foundation | Crawlspace | $12,000 | $20,000 | $30,000 |
| Foundation | Basement | $25,000 | $40,000 | $60,000 |
| Water | Private Well | $6,000 | $10,000 | $15,000 |
| Water | Municipal | $3,000 | $6,000 | $10,000 |
| Sewer | Septic | $12,000 | $18,000 | $30,000 |
| Sewer | Municipal | $3,000 | $6,000 | $10,000 |

### Auto-Included (site estimates, shown in "What Else Is Included")

| Category | Low | Mid | High |
|----------|-----|-----|------|
| Land Clearing & Grading | $2,000 | $5,000 | $12,000 |
| Driveway | $3,000 | $8,000 | $18,000 |
| Electrical Service | $3,000 | $8,000 | $15,000 |
| Delivery & Setup | $5,000 | $12,000 | $20,000 |
| Permits & Inspections | $1,500 | $4,000 | $8,000 |

### Calculated
- **Contingency**: 10% of subtotal (buffer for unexpected costs)

## Mortgage Calculation

### Formula
```
M = P * [r(1+r)^n] / [(1+r)^n - 1]

Where:
  M = Monthly payment
  P = Principal (Total Cost - Down Payment)
  r = Monthly interest rate (annual rate / 12)
  n = Total number of payments (years * 12)
```

### Output
- Monthly payment
- Bi-weekly payment (monthly * 12 / 26)
- Total interest over life of mortgage
- Total amount paid
- Itemized cost breakdown with donut chart

## Typical Total (default selections)
- Zenith CT home: $195,000
- Land: $75,000
- Crawlspace foundation: $20,000
- Clearing + Driveway: $13,000
- Well: $10,000
- Septic: $18,000
- Electrical: $8,000
- Delivery: $12,000
- Permits: $4,000
- Contingency (10%): $35,500
- **Total: ~$390,500**
