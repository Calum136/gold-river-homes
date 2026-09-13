// ============================================
// Owner-approved Nova Scotia reasoning copy.
// Approved verbatim by Calum — see the source doc referenced in the
// C2a workstream brief. Do not paraphrase; treat every string here as final.
// ============================================

export interface ChapterCopyEntry {
  title: string;
  opener: string;
}

export const chapterCopy: Record<"land" | "home" | "outside" | "inside" | "ready" | "cost", ChapterCopyEntry> = {
  land: {
    title: "Your land",
    opener: "Every home needs a place to sit, so start with the land before choosing what to build on it.",
  },
  home: {
    title: "Your home",
    opener: "Pick the floor plan that fits how you live, from a compact single level to a two-storey family home.",
  },
  outside: {
    title: "The outside",
    opener: "These choices shape how your home looks from the road and how it holds up to the weather.",
  },
  inside: {
    title: "The inside",
    opener: "Now choose the finishes you'll touch and see every day, from flooring to lighting.",
  },
  ready: {
    title: "Getting it ready",
    opener: "Before your home arrives, the land itself needs a foundation, water, and a way to handle waste.",
  },
  cost: {
    title: "What it costs",
    opener: "Here's how everything you've chosen adds up, so you can see the full picture before deciding.",
  },
};

export const landSituationCopy: Record<"gold-river" | "own", string> = {
  "gold-river": "Choosing an example lot adds typical land costs, so your estimate shows land and home together.",
  own: "If you already own land, the estimate skips lot costs and focuses on what building there will cost.",
};

export const porchCopy = {
  with: "A covered entry porch gives you a dry spot to arrive and leave in poor weather, and adds curb appeal.",
  without: "Without a porch, the entry is steps and a landing with no roof overhead, so there's no sheltered spot at the door.",
};

export const fireplaceCopy = {
  with: "An electric fireplace insert adds a warm focal point to the living room without the upkeep of a wood-burning unit.",
  without: "Skipping the fireplace keeps the living room layout simpler and open.",
};

export const estimateStatement =
  "This total is a planning estimate, not a quote. Your site's soil, slope, well depth and distance to power will change the final price.";

export const stageNote =
  "Home photos show real Supreme Homes models; option photos are real examples from other homes, with captions naming exactly what's shown.";
