# Gold River Homes — Total Cost Calculator
# Last updated: Apr 13, 2026

@AGENTS.md

## Status: ACTIVE — POC complete, pushed to GitHub, ready for Netlify deploy. Awaiting owner feedback.
## Next: Deploy to Netlify, share with owner, iterate based on feedback.
## Completion: ~30% (POC phase — full vision includes AI images, MLS integration, guided walkthrough)

- **Client:** Gold River Homes (Supreme Homes retailer)
- **Location:** 219 NS-12, Chester Basin, NS B0J 1K0
- **Contact:** info@goldriverhomes.ca / 902-273-3033
- **Service Area:** Lunenburg, Queens, Shelburne, Annapolis, Digby, Yarmouth (NS)
- **Repo:** https://github.com/Calum136/gold-river-homes

## Project Scope
POC modular/mini home total cost calculator. Owner's ask: "build a modular/mini home mortgage calculator that encompasses the servicing costs, well, septic, municipal hookup, land purchases and etc."

Full vision (from PDF brief) includes AI-generated home visuals, MLS land data integration, and a guided "Grandma-friendly" walkthrough — but POC comes first.

## Tech Stack
| Tech | Role |
|------|------|
| Next.js 14 (App Router) | Framework |
| Tailwind CSS | Styling (custom dark theme matching supremehomes.ca) |
| Recharts | Donut chart for cost breakdown |
| Netlify | Deployment (netlify.toml configured) |

## Design Tokens (from supremehomes.ca)
- Dark bg: `#111415`, Gold accent: `#97764E`, Gold bright: `#C4882A`
- Fonts: Playfair Display (headings), Poppins (body), Teko (accents)
- Warm cream text: `#E8DCCC`

## Architecture
```
app/
├── page.tsx              # Landing page
├── calculator/page.tsx   # Main calculator (question-driven flow)
components/
├── calculator/           # ChoiceCard, QuestionCard, CostLineItem, MortgageInputs, ResultsPanel, CostBreakdownChart
├── layout/               # Navbar, Footer
lib/
├── calculator.ts         # Mortgage math
├── defaults.ts           # Cost estimates with low/mid/high ranges
docs/
├── MASTER.md             # Doc index
├── design-tokens.md      # Colors, fonts, spacing
├── architecture.md       # File structure, component hierarchy
├── calculator-logic.md   # Cost categories, formulas, defaults
├── decisions.md          # Key decisions and rationale
├── business-context.md   # Client info, models, service area
```

## Key Design Decision
**The site TELLS users what things cost** — not sliders where users guess. Target audience is first-time home buyers who don't know what a well or septic costs. Users answer simple questions (well vs municipal? own land or buying? foundation type?) and the site shows estimated costs with educational descriptions and typical ranges.

## Rules for Claude
1. Target user is a first-time home buyer who knows NOTHING about site servicing costs — explain, don't ask
2. All cost estimates should have low/mid/high ranges based on Nova Scotia market
3. Design must match supremehomes.ca dark/gold aesthetic
4. Keep POC scope tight — owner will steer direction for Phase 2+
5. Docs in `docs/` folder — update MASTER.md index when adding new docs

## Session Notes
- **Apr 13, 2026:** Built full POC from scratch. Inspected supremehomes.ca for design tokens (dark #111415, gold #97764E, Playfair Display + Poppins). Created Next.js 14 + Tailwind + Recharts project. Initial build had sliders for user-input costs — Calum corrected: target audience doesn't know costs, site should TELL them. Redesigned as 6-step question-driven flow (pick home model, own land?, foundation type, well/municipal, septic/municipal, mortgage terms) with educational cost cards showing prices + ranges + explanations. Pushed to GitHub: https://github.com/Calum136/gold-river-homes. Ready for Netlify deploy.
