# Decisions Log

## D001: Next.js over plain React
**Date**: 2026-04-12
**Decision**: Use Next.js App Router
**Why**: Netlify has first-class Next.js support, SSG for fast loading, easy routing for future pages (models, contact, etc.)

## D002: Tailwind CSS for styling
**Date**: 2026-04-12
**Decision**: Use Tailwind with custom theme tokens
**Why**: Matches the dark theme + gold accent approach efficiently. Custom CSS variables map directly to extracted design tokens.

## D003: Question-driven flow, NOT slider-driven
**Date**: 2026-04-13
**Decision**: The site TELLS users what things cost. Users answer simple questions (well vs municipal? own land or buying?), and the site provides cost estimates with explanations.
**Why**: Target audience doesn't know what a well or septic costs — that's literally why they're using this tool. Sliders asking them to set their own values is backwards. This aligns with the "Grandma Test" from the PDF brief.

## D004: Client-side only calculations
**Date**: 2026-04-12
**Decision**: No server/API needed for POC
**Why**: Mortgage math is simple arithmetic. No user data persistence. Keeps deployment simple on Netlify.

## D005: Default values based on Nova Scotia market
**Date**: 2026-04-12
**Decision**: Pre-populate with realistic NS cost estimates with low/mid/high ranges
**Why**: Owner's clients are in rural NS (Lunenburg, Queens, etc.). Costs should reflect local reality. We show the mid estimate by default with the typical range visible.

## D006: Proof of concept scope
**Date**: 2026-04-12
**Decision**: Calculator + basic landing page. No models page, no contact forms, no AI features yet.
**Why**: Owner wants to see the calculator concept first, then steer direction. PDF brief has bigger vision (AI, MLS integration, guided walkthrough) but that's Phase 2+.

## D007: Educational cost cards over simple toggles
**Date**: 2026-04-13
**Decision**: Each cost option (well, septic, foundation type) is a rich card showing price, range, description, and "why it matters" context.
**Why**: The whole point is transparency and education. Users should understand not just what something costs, but what it is and why the price varies.
