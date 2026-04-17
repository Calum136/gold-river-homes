// ============================================
// The site TELLS users what things cost.
// Users answer simple questions, we show estimates.
// ============================================

export type WaterType = "well" | "municipal" | null;
export type SewerType = "septic" | "municipal" | null;
export type FoundationType = "slab" | "crawlspace" | "basement";
export type LandSituation = "own" | "buying";
export type HomeCategory = "mini" | "modular" | "traditional" | "multistory";

// --- Cost estimates (what we TELL the user) ---

export interface CostEstimate {
  low: number;
  mid: number;
  high: number;
  label: string;
  description: string;
  whyItMatters?: string;
}

export interface HomeModel {
  id: string;
  name: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  type: string;
  category: HomeCategory;
  description?: string;
}

export interface HomeCategoryDef {
  id: HomeCategory;
  label: string;
  description: string;
  priceRange: string;
}

export const homeCategories: HomeCategoryDef[] = [
  {
    id: "mini",
    label: "Mini Home",
    description: "Single-section homes, compact and efficient. Perfect for couples, retirees, or smaller lots.",
    priceRange: "$140k – $220k",
  },
  {
    id: "modular",
    label: "Modular Home",
    description: "Multi-section builds assembled on-site. More living space with room to customize your layout.",
    priceRange: "$180k – $310k",
  },
  {
    id: "traditional",
    label: "Traditional Build",
    description: "Classic bungalow and ranch-style designs with a conventional exterior and modern interior.",
    priceRange: "$220k – $390k",
  },
  {
    id: "multistory",
    label: "Multi-Story",
    description: "Two-storey designs that maximize living space on a smaller footprint. Great for families.",
    priceRange: "$280k – $460k",
  },
];

export const homeModels: HomeModel[] = [
  {
    id: "zen-ct-2",
    name: "Zen CT-2",
    price: 165000,
    beds: 2,
    baths: 1,
    sqft: 975,
    type: "Mini",
    category: "mini",
    description: "A smart, efficient 2-bedroom layout perfect for individuals or couples.",
  },
  {
    id: "zenith-ct",
    name: "Zenith CT",
    price: 195000,
    beds: 2,
    baths: 2,
    sqft: 1184,
    type: "Mini",
    category: "mini",
    description: "Spacious for its class, with two full bathrooms and an open-concept kitchen.",
  },
  {
    id: "fb10",
    name: "FB10",
    price: 210000,
    beds: 3,
    baths: 2,
    sqft: 1104,
    type: "Mini",
    category: "mini",
    description: "Three bedrooms in a compact footprint — a great choice for small families.",
  },
  {
    id: "fancy-tr-2",
    name: "Fancy TR-2",
    price: 185000,
    beds: 2,
    baths: 2,
    sqft: 1104,
    type: "Modular",
    category: "modular",
    description: "A well-appointed modular with two full baths and a stylish interior package.",
  },
  {
    id: "bali",
    name: "Bali Series",
    price: 245000,
    beds: 3,
    baths: 2,
    sqft: 1380,
    type: "Modular",
    category: "modular",
    description: "Generous open-plan living areas with a covered deck option and flexible layout.",
  },
  {
    id: "meza",
    name: "Meza Series",
    price: 285000,
    beds: 4,
    baths: 2,
    sqft: 1560,
    type: "Modular",
    category: "modular",
    description: "Our largest modular — four bedrooms and plenty of room for a growing family.",
  },
  {
    id: "heritage-28",
    name: "Heritage 28",
    price: 265000,
    beds: 3,
    baths: 2,
    sqft: 1450,
    type: "Traditional",
    category: "traditional",
    description: "A classic bungalow exterior with a warm, welcoming interior layout.",
  },
  {
    id: "countryside",
    name: "Countryside",
    price: 315000,
    beds: 4,
    baths: 2,
    sqft: 1720,
    type: "Traditional",
    category: "traditional",
    description: "Wide lot presence with covered front porch and an upgraded traditional trim package.",
  },
  {
    id: "summit-2",
    name: "Summit II",
    price: 355000,
    beds: 3,
    baths: 2,
    sqft: 1600,
    type: "Multi-Story",
    category: "multistory",
    description: "Full two-storey with master suite upstairs and an open-concept main floor.",
  },
  {
    id: "ridge-view",
    name: "Ridge View",
    price: 425000,
    beds: 4,
    baths: 3,
    sqft: 2050,
    type: "Multi-Story",
    category: "multistory",
    description: "Our flagship two-storey — four bedrooms, three bathrooms, commanding curb appeal.",
  },
  {
    id: "custom",
    name: "Enter a price",
    price: 0,
    beds: 0,
    baths: 0,
    sqft: 0,
    type: "Custom",
    category: "mini",
  },
];

// --- Finish options ---

export interface FinishOption {
  id: string;
  label: string;
  description: string;
  priceDelta: number;
}

export interface FinishCategory {
  id: string;
  label: string;
  options: FinishOption[];
}

export const finishCategories: FinishCategory[] = [
  {
    id: "insulation",
    label: "Insulation",
    options: [
      {
        id: "standard",
        label: "Standard",
        description: "Code-minimum insulation. Adequate for milder seasons.",
        priceDelta: 0,
      },
      {
        id: "enhanced",
        label: "Enhanced",
        description: "Upgraded batt insulation in walls and attic. Noticeably warmer winters and lower heating bills.",
        priceDelta: 3000,
      },
      {
        id: "premium",
        label: "Premium",
        description: "Spray foam + high-R batts with full air sealing. Best possible energy performance.",
        priceDelta: 6000,
      },
    ],
  },
  {
    id: "siding",
    label: "Exterior Siding",
    options: [
      {
        id: "vinyl-horizontal",
        label: "Vinyl Horizontal",
        description: "Classic horizontal lap siding. Durable, low-maintenance, and timeless.",
        priceDelta: 0,
      },
      {
        id: "vinyl-vertical",
        label: "Vinyl Vertical",
        description: "Board and batten vertical profile. Clean, modern look that photographs beautifully.",
        priceDelta: 1500,
      },
      {
        id: "premium-board-batten",
        label: "Premium Board & Batten",
        description: "Wide-profile board & batten with an upgraded trim package. A standout exterior.",
        priceDelta: 3000,
      },
    ],
  },
  {
    id: "roofing",
    label: "Roofing",
    options: [
      {
        id: "shingles",
        label: "Architectural Shingles",
        description: "30-year rated asphalt shingles. Reliable, attractive, and industry standard.",
        priceDelta: 0,
      },
      {
        id: "metal",
        label: "Metal Roof",
        description: "50+ year standing seam metal roof. Higher upfront, but lower lifetime cost and superior in heavy snow.",
        priceDelta: 4000,
      },
    ],
  },
  {
    id: "flooring",
    label: "Flooring",
    options: [
      {
        id: "standard",
        label: "Standard Vinyl Plank",
        description: "Durable, waterproof LVP throughout. Easy to clean and maintain.",
        priceDelta: 0,
      },
      {
        id: "upgraded-laminate",
        label: "Upgraded Laminate",
        description: "Thicker planks with a more authentic wood appearance and a softer underfoot feel.",
        priceDelta: 2500,
      },
      {
        id: "hardwood",
        label: "Engineered Hardwood",
        description: "Real wood veneer over plywood core. Warm, premium aesthetic that adds resale value.",
        priceDelta: 6000,
      },
    ],
  },
  {
    id: "countertops",
    label: "Countertops",
    options: [
      {
        id: "laminate",
        label: "Laminate",
        description: "Clean laminate counters in a range of colours. Practical and affordable.",
        priceDelta: 0,
      },
      {
        id: "quartz",
        label: "Quartz",
        description: "Engineered stone with a high-end look, excellent durability, and zero maintenance.",
        priceDelta: 3500,
      },
    ],
  },
];

// --- Extensions & add-ons ---

export interface Extension {
  id: string;
  label: string;
  description: string;
  low: number;
  mid: number;
  high: number;
}

export const extensionOptions: Extension[] = [
  {
    id: "front-extension",
    label: "Front Extension / Covered Porch",
    description: "A covered entry porch or bump-out. Improves curb appeal and gives a transitional indoor/outdoor space.",
    low: 12000,
    mid: 20000,
    high: 30000,
  },
  {
    id: "garage",
    label: "Attached Garage",
    description: "Single-car attached garage with concrete slab, overhead door, and electrical.",
    low: 25000,
    mid: 35000,
    high: 45000,
  },
  {
    id: "second-story",
    label: "Second Storey Addition",
    description: "Full second floor for models that support it. Significantly increases livable square footage.",
    low: 60000,
    mid: 90000,
    high: 120000,
  },
];

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

// Category labels for display (used by chart)
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
  upgrades: "Add-ons & Extensions",
  sitePrep: "Site Preparation",
};
