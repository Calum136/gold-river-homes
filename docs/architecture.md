# Architecture

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS (custom theme matching Supreme Homes design tokens)
- **Charts**: Recharts (lightweight, React-native charting)
- **Deployment**: Netlify with `@netlify/plugin-nextjs`
- **State**: React useState/useReducer (no external state library needed for POC)

## File Structure
```
gold-river-homes/
├── app/
│   ├── layout.tsx          # Root layout with nav, footer, fonts
│   ├── page.tsx            # Landing/home page
│   ├── calculator/
│   │   └── page.tsx        # Main calculator page
│   └── globals.css         # Tailwind + custom CSS variables
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   ├── calculator/
│   │   ├── CostSection.tsx       # Reusable cost input section
│   │   ├── CostSlider.tsx        # Slider + manual input combo
│   │   ├── OptionToggle.tsx      # A/B toggle (Municipal vs Well)
│   │   ├── MortgageInputs.tsx    # Down payment, rate, term
│   │   ├── CostSummary.tsx       # Running total sidebar
│   │   ├── ResultsPanel.tsx      # Final results with chart
│   │   └── CostBreakdownChart.tsx # Pie/donut chart
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       └── Input.tsx
├── lib/
│   ├── calculator.ts       # Mortgage math functions
│   └── defaults.ts         # Default cost values and ranges
├── docs/                   # This documentation
├── public/
│   └── images/
├── tailwind.config.ts
├── next.config.js
├── netlify.toml
└── package.json
```

## Component Hierarchy
```
Layout (Navbar + Footer)
└── CalculatorPage
    ├── CostSection: "Home Purchase"
    │   └── CostSlider (home price)
    ├── CostSection: "Land Purchase"
    │   └── CostSlider (land price)
    ├── CostSection: "Site Preparation"
    │   ├── CostSlider (clearing)
    │   ├── CostSlider (foundation)
    │   └── CostSlider (driveway)
    ├── CostSection: "Water Service"
    │   ├── OptionToggle (Municipal / Well)
    │   └── CostSlider (cost)
    ├── CostSection: "Sewer/Waste"
    │   ├── OptionToggle (Municipal / Septic)
    │   └── CostSlider (cost)
    ├── CostSection: "Electrical"
    │   └── CostSlider (cost)
    ├── CostSection: "Delivery & Setup"
    │   └── CostSlider (cost)
    ├── CostSection: "Permits"
    │   └── CostSlider (cost)
    ├── CostSection: "Contingency"
    │   └── CostSlider (percentage or amount)
    ├── MortgageInputs (down payment, rate, term)
    └── ResultsPanel
        ├── CostSummary (itemized table)
        └── CostBreakdownChart (visual)
```

## Key Decisions
- **Tailwind CSS** over styled-components: faster dev, easy theme customization, good Next.js support
- **App Router** over Pages Router: modern Next.js default, better for Netlify
- **No database**: All calculations client-side, no persistence needed for POC
- **Recharts**: Small bundle, declarative, good for pie/donut charts
