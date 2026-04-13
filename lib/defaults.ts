// ============================================
// The site TELLS users what things cost.
// Users answer simple questions, we show estimates.
// ============================================

export type WaterType = "well" | "municipal" | null;
export type SewerType = "septic" | "municipal" | null;
export type FoundationType = "slab" | "crawlspace" | "basement";
export type LandSituation = "own" | "buying";

// --- Cost estimates (what we TELL the user) ---

export interface CostEstimate {
  low: number;
  mid: number;
  high: number;
  label: string;
  description: string;
  whyItMatters?: string;
}

export const homeModels = [
  { id: "custom", name: "Enter a price", price: 0, beds: 0, baths: 0, sqft: 0 },
  { id: "zen-ct-2", name: "Zen CT-2", price: 165000, beds: 2, baths: 1, sqft: 975, type: "Mini" },
  { id: "fancy-tr-2", name: "Fancy TR-2", price: 185000, beds: 2, baths: 2, sqft: 1104, type: "Mini" },
  { id: "zenith-ct", name: "Zenith CT", price: 195000, beds: 2, baths: 2, sqft: 1184, type: "Mini" },
  { id: "fb10", name: "FB10", price: 210000, beds: 3, baths: 2, sqft: 1104, type: "Mini" },
] as const;

export const waterCosts: Record<Exclude<WaterType, null>, CostEstimate> = {
  well: {
    low: 6000,
    mid: 10000,
    high: 15000,
    label: "Private Well",
    description: "Includes drilling, pump, pressure tank, and water testing. Most rural properties in our service area require a drilled well.",
    whyItMatters: "Well depth varies by location — deeper wells cost more. Average well depth in the Lunenburg/Queens area is 100-250 feet.",
  },
  municipal: {
    low: 3000,
    mid: 6000,
    high: 10000,
    label: "Municipal Water",
    description: "Connection fee and trenching from the property line to your home. Available in towns like Chester Basin, Bridgewater, and Liverpool.",
    whyItMatters: "Municipal water means no well maintenance, but you'll have a monthly water bill.",
  },
};

export const sewerCosts: Record<Exclude<SewerType, null>, CostEstimate> = {
  septic: {
    low: 12000,
    mid: 18000,
    high: 30000,
    label: "Septic System",
    description: "Includes percolation test, septic tank, distribution box, and drain field installation. Required for most rural properties.",
    whyItMatters: "Soil conditions determine system type and cost. Clay-heavy soil may need an engineered system (higher cost).",
  },
  municipal: {
    low: 3000,
    mid: 6000,
    high: 10000,
    label: "Municipal Sewer",
    description: "Connection fee and trenching to the municipal sewer line. Only available within town boundaries.",
    whyItMatters: "Municipal sewer means no septic maintenance, but you'll have a monthly sewer charge.",
  },
};

export const foundationCosts: Record<FoundationType, CostEstimate> = {
  slab: {
    low: 8000,
    mid: 14000,
    high: 22000,
    label: "Concrete Slab",
    description: "A flat concrete pad poured directly on prepared ground. The most affordable foundation option.",
    whyItMatters: "Great for flat lots. No crawlspace or basement storage, but lowest cost and fastest to build.",
  },
  crawlspace: {
    low: 12000,
    mid: 20000,
    high: 30000,
    label: "Crawlspace",
    description: "Elevated foundation with access underneath for plumbing and utilities. Good balance of cost and practicality.",
    whyItMatters: "Easier access for repairs and protects against ground moisture. Most popular choice for modular homes in NS.",
  },
  basement: {
    low: 25000,
    mid: 40000,
    high: 60000,
    label: "Full Basement",
    description: "A full below-grade basement adds livable/storage space. Significant additional cost but adds value to the home.",
    whyItMatters: "Adds usable square footage and increases resale value, but is the most expensive foundation option.",
  },
};

export const siteEstimates: Record<string, CostEstimate> = {
  clearing: {
    low: 2000,
    mid: 5000,
    high: 12000,
    label: "Land Clearing & Grading",
    description: "Removing trees, stumps, and leveling the building site. Cost depends on lot size and how heavily wooded it is.",
  },
  driveway: {
    low: 3000,
    mid: 8000,
    high: 18000,
    label: "Driveway",
    description: "Gravel driveway is standard for rural properties. Length and terrain determine the cost.",
  },
  electrical: {
    low: 3000,
    mid: 8000,
    high: 15000,
    label: "Electrical Service",
    description: "Running power from the road to your home. Includes the utility pole (if needed), meter, and main panel.",
    whyItMatters: "Distance from the road to your home is the biggest cost factor. Nova Scotia Power handles the connection.",
  },
  delivery: {
    low: 5000,
    mid: 12000,
    high: 20000,
    label: "Home Delivery & Setup",
    description: "Transporting your modular home from the factory and setting it on the foundation with a crane.",
    whyItMatters: "Distance from the factory and road accessibility affect cost. Narrow roads or tight turns may add to the price.",
  },
  permits: {
    low: 1500,
    mid: 4000,
    high: 8000,
    label: "Permits & Inspections",
    description: "Building permit, septic permit, electrical inspection, and development fees required by your municipality.",
  },
};

// Mortgage defaults
export const mortgageDefaults = {
  downPaymentPercent: 5,
  interestRate: 5.5,
  amortizationYears: 25,
};

export const amortizationOptions = [15, 20, 25, 30];

// Category labels for display
export const costLabels: Record<string, string> = {
  homePrice: "Home Purchase",
  landPrice: "Land Purchase",
  foundation: "Foundation",
  clearing: "Land Clearing",
  driveway: "Driveway",
  waterService: "Water Service",
  sewerService: "Sewer / Waste",
  electrical: "Electrical Service",
  delivery: "Delivery & Setup",
  permits: "Permits & Inspections",
  contingency: "Contingency (10%)",
};
