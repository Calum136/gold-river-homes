// ============================================
// The site TELLS users what things cost.
// Data-driven: adding a new option = one object in the array.
// No component changes needed for new categories.
// ============================================

export type WaterType = "drilled" | "dug" | "municipal" | null;
export type SewerType = "septic" | "municipal" | null;
export type FoundationType = "slab" | "crawlspace" | "basement";
export type LandSituation = "gold-river" | "own" | null;
export type LotTerrain = "wooded" | "meadow" | "coastal" | "town";
export type HomeCategory = "mini" | "modular" | "traditional" | "multistory";

// --- Cost estimates ---

export interface CostEstimate {
  low: number;
  mid: number;
  high: number;
  label: string;
  description: string;
  whyItMatters?: string;
}

// --- Lots ---

export interface LotOption {
  id: string;
  name: string;
  location: string;
  acreage: number;
  widthFt: number;
  depthFt: number;
  price: number;
  terrain: LotTerrain;
  /** Real lot photo — wins over the illustrated backdrop when present. See docs/visualization/02-lot-visuals.md */
  photoUrl?: string;
  description: string;
  availableServices: string[];
  preselectedWater?: Exclude<WaterType, null>;
  preselectedSewer?: Exclude<SewerType, null>;
}

// Own-land details are pricing/fit inputs only — lot visualization exists
// solely for Gold River lots (master plan amendment #7, Jun 9 2026).
export interface UploadedLot {
  widthFt: number;
  depthFt: number;
}

export const lotOptions: LotOption[] = [
  {
    id: "lot-maple-ridge",
    name: "Maple Ridge — Lot 4",
    location: "Chester Basin, NS",
    acreage: 1.4,
    widthFt: 185,
    depthFt: 330,
    price: 68000,
    terrain: "wooded",
    description: "Gently sloping lot with mature maple trees at the rear. Easy road access, power at the lot line.",
    availableServices: ["power", "drilled-well", "septic"],
    preselectedWater: "drilled",
    preselectedSewer: "septic",
  },
  {
    id: "lot-river-view",
    name: "River View — Lot 11",
    location: "Liverpool, NS",
    acreage: 2.1,
    widthFt: 220,
    depthFt: 415,
    price: 85000,
    terrain: "wooded",
    description: "Private wooded lot with seasonal river views. Well and septic required. Excellent for a traditional or multi-story build.",
    availableServices: ["power", "drilled-well", "septic"],
    preselectedWater: "drilled",
    preselectedSewer: "septic",
  },
  {
    id: "lot-harbour-heights",
    name: "Harbour Heights — Lot 2",
    location: "Bridgewater, NS",
    acreage: 0.6,
    widthFt: 110,
    depthFt: 240,
    price: 72000,
    terrain: "town",
    description: "Town lot with municipal water and sewer available. Level and cleared — move-in ready for a mini or modular home.",
    availableServices: ["power", "municipal-water", "municipal-sewer"],
    preselectedWater: "municipal",
    preselectedSewer: "municipal",
  },
  {
    id: "lot-pine-meadow",
    name: "Pine Meadow — Lot 7",
    location: "Shelburne, NS",
    acreage: 1.8,
    widthFt: 200,
    depthFt: 390,
    price: 58000,
    terrain: "meadow",
    description: "Open meadow lot on a quiet country road. Affordable and well-positioned for any home style.",
    availableServices: ["power", "drilled-well", "septic"],
    preselectedWater: "drilled",
    preselectedSewer: "septic",
  },
  {
    id: "lot-coastal-acres",
    name: "Coastal Acres — Lot 3",
    location: "Yarmouth, NS",
    acreage: 3.2,
    widthFt: 310,
    depthFt: 450,
    price: 95000,
    terrain: "coastal",
    description: "Large coastal lot with ocean views. Power and road access established. Ideal for our flagship models.",
    availableServices: ["power", "drilled-well", "septic"],
    preselectedWater: "drilled",
    preselectedSewer: "septic",
  },
];

// --- Home models ---

export interface HomeModel {
  id: string;
  name: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  roofSqft: number;
  wallSqft: number;
  hasFireplace: boolean;
  type: string;
  category: HomeCategory;
  description?: string;
  photoUrl?: string;
  /** What the photo shows — interiors get an honest "Interior shown" tag on model cards. */
  photoKind?: "exterior" | "interior";
  /** Static photoreal render shown in the visualizer (Phase 7 demo). The caption
   *  states which options the render depicts, since it doesn't react to clicks yet. */
  demoRender?: { url: string; caption: string };
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
    label: "Contemporary Home",
    description: "Single-storey CT-series builds with open-concept layouts, modern kitchens, and energy-efficient design.",
    priceRange: "$210k – $300k",
  },
  {
    id: "traditional",
    label: "Craftsman",
    description: "CR-series craftsman exteriors with wide trim, covered porches, and warm traditional character.",
    priceRange: "$240k – $330k",
  },
  {
    id: "multistory",
    label: "Multi-Story",
    description: "Two-storey and large-footprint builds for families who need maximum space. Our most premium models.",
    priceRange: "$330k – $450k",
  },
];

export const homeModels: HomeModel[] = [
  {
    // Specs from the Supreme Homes BALI web sheet (Casita Series, 74'-0" × 16'-0").
    // The render demo uses Supreme's own archviz from that sheet — public/models/bali/exterior.webp.
    id: "bali",
    name: "Bali",
    price: 219000,
    beds: 3,
    baths: 2,
    sqft: 1440,
    roofSqft: 1360,
    wallSqft: 1620,
    hasFireplace: false,
    type: "Mini",
    category: "mini",
    description: "Casita Series flagship — three bedrooms and two full baths in a single 74-foot section, with a striking board & batten entry gable.",
    photoUrl: "/models/bali/exterior.webp",
    photoKind: "exterior",
    demoRender: {
      url: "/models/bali/exterior.webp",
      caption: "Shown: slate-blue board & batten entry, cedar-shake gable, white lap wings, architectural shingles",
    },
  },
  {
    id: "zen-ct-2",
    name: "Zen CT-2",
    price: 165000,
    beds: 2,
    baths: 1,
    sqft: 975,
    roofSqft: 800,
    wallSqft: 1050,
    hasFireplace: false,
    type: "Mini",
    category: "mini",
    description: "Minimalist 2-bedroom cottage — high ceilings, generous windows, open-concept living in a compact footprint.",
    photoUrl: "https://www.supremehomes.ca/wp-content/uploads/2021/05/ZEN-2.jpeg",
    photoKind: "exterior",
  },
  {
    id: "zenith-ct",
    name: "Zenith CT",
    price: 195000,
    beds: 3,
    baths: 2,
    sqft: 1184,
    roofSqft: 960,
    wallSqft: 1250,
    hasFireplace: true,
    type: "Mini",
    category: "mini",
    description: "Three bedrooms, two full baths, fireplace in the living room, and a master suite with walk-in closet.",
    photoUrl: "https://www.supremehomes.ca/wp-content/uploads/2021/06/01-1.png",
    photoKind: "interior",
  },
  {
    id: "fb10",
    name: "FB-10",
    price: 210000,
    beds: 3,
    baths: 2,
    sqft: 1104,
    roofSqft: 900,
    wallSqft: 1180,
    hasFireplace: false,
    type: "Mini",
    category: "mini",
    description: "Traditional mini home with three bedrooms in a compact footprint — ideal for small families.",
    photoUrl: "https://www.supremehomes.ca/wp-content/uploads/2021/04/Bordeaux_SupremeHomes-20.jpg",
    photoKind: "interior",
  },
  {
    id: "fancy-tr-2",
    name: "Fancy TR-2",
    price: 185000,
    beds: 2,
    baths: 2,
    sqft: 1104,
    roofSqft: 910,
    wallSqft: 1200,
    hasFireplace: false,
    type: "Mini",
    category: "mini",
    description: "Well-appointed traditional mini home with two full baths and a stylish interior package.",
    photoUrl: "https://www.supremehomes.ca/wp-content/uploads/2021/05/Copy-of-10-scaled.jpg",
    photoKind: "interior",
  },
  {
    id: "acadie-ct",
    name: "Acadie CT",
    price: 235000,
    beds: 3,
    baths: 2,
    sqft: 1250,
    roofSqft: 1440,
    wallSqft: 1260,
    hasFireplace: false,
    type: "Contemporary",
    category: "modular",
    description: "Closed entry vestibule, open-concept kitchen and living, master suite with walk-in closet. A proven layout.",
    photoUrl: "https://www.supremehomes.ca/wp-content/uploads/2021/04/Bordeaux_SupremeHomes-30.jpg",
    photoKind: "interior",
  },
  {
    id: "sauvignon-ct-2",
    name: "Sauvignon CT-2",
    price: 280000,
    beds: 3,
    baths: 2,
    sqft: 1672,
    roofSqft: 1925,
    wallSqft: 1476,
    hasFireplace: true,
    type: "Contemporary",
    category: "modular",
    description: "The house that has it all — covered porch, walk-in pantry, kitchen island, fireplace, and a luxury master ensuite.",
    photoUrl: "https://www.supremehomes.ca/wp-content/uploads/2021/06/ONLINE_SUPREME_Truro_18_3981-1.jpg",
    photoKind: "interior",
  },
  {
    id: "acadie-cr",
    name: "Acadie CR",
    price: 260000,
    beds: 3,
    baths: 2,
    sqft: 1350,
    roofSqft: 1555,
    wallSqft: 1332,
    hasFireplace: false,
    type: "Craftsman",
    category: "traditional",
    description: "A winning plan — craftsman exterior with efficient open-concept interior and a generous entry walk-in closet.",
    photoUrl: "https://www.supremehomes.ca/wp-content/uploads/2021/04/Bordeaux_SupremeHomes-23.jpg",
    photoKind: "interior",
  },
  {
    id: "porto",
    name: "Porto",
    price: 310000,
    beds: 3,
    baths: 2,
    sqft: 1500,
    roofSqft: 1730,
    wallSqft: 1400,
    hasFireplace: true,
    type: "Craftsman",
    category: "traditional",
    description: "Standout craftsman curb appeal with a wide covered porch, vaulted ceilings, and a well-appointed open kitchen.",
    photoUrl: "https://www.supremehomes.ca/wp-content/uploads/2021/10/Porto33-1.jpg",
    photoKind: "interior",
  },
  {
    id: "windsor-ct",
    name: "Windsor CT",
    price: 355000,
    beds: 3,
    baths: 2,
    sqft: 1600,
    roofSqft: 1000,
    wallSqft: 2016,
    hasFireplace: false,
    type: "Multi-Story",
    category: "multistory",
    description: "Two-storey contemporary with 2½ baths. Grand master bedroom with walk-in closet and ensuite. Laundry on the main floor.",
    photoUrl: "https://www.supremehomes.ca/wp-content/uploads/2021/05/DSC_8122-scaled.jpg",
    photoKind: "interior",
  },
  {
    id: "bordeaux-tr",
    name: "Bordeaux TR",
    price: 420000,
    beds: 4,
    baths: 2,
    sqft: 2000,
    roofSqft: 1250,
    wallSqft: 2304,
    hasFireplace: true,
    type: "Multi-Story",
    category: "multistory",
    description: "Majestic traditional exterior — large kitchen with walk-in pantry, master ensuite, and optional multi-car garage.",
    photoUrl: "https://www.supremehomes.ca/wp-content/uploads/2021/04/Bordeaux_SupremeHomes-32.jpg",
    photoKind: "interior",
  },
];

// --- Option system (data-driven, extensible) ---

export type OptionDisplayType = "tiles" | "swatches" | "toggle";

export interface OptionItem {
  id: string;
  label: string;
  description?: string;
  priceDelta: number;
  perSqftId?: string;
  swatchHex?: string;
  paletteHexes?: string[];
  imageUrl?: string;
  isDefault?: boolean;
  /** When set, this option is only offered on the listed model IDs.
   *  Populate from Supreme's factory options matrix (Phase 7 reliability layer). */
  availableForModels?: string[];
}

/** True when an option can be ordered on the given model. No list = available everywhere. */
export function isOptionAvailable(opt: OptionItem, modelId: string | null): boolean {
  if (!opt.availableForModels || !modelId) return true;
  return opt.availableForModels.includes(modelId);
}

export interface OptionGroup {
  id: string;
  label: string;
  subtitle?: string;
  displayType: OptionDisplayType;
  options: OptionItem[];
}

// --- Siding colors ---

export const sidingColors: OptionItem[] = [
  { id: "white", label: "White", priceDelta: 0, swatchHex: "#F2EDE3", isDefault: true },
  { id: "cream", label: "Cream", priceDelta: 0, swatchHex: "#DED0A8" },
  { id: "warm-gray", label: "Warm Gray", priceDelta: 0, swatchHex: "#A09890" },
  { id: "slate", label: "Slate", priceDelta: 0, swatchHex: "#7A8898" },
  { id: "charcoal", label: "Charcoal", priceDelta: 0, swatchHex: "#3C434A" },
  { id: "navy", label: "Navy", priceDelta: 0, swatchHex: "#1D3050" },
  { id: "sage", label: "Sage Green", priceDelta: 0, swatchHex: "#6A8468" },
  { id: "brick-red", label: "Brick Red", priceDelta: 0, swatchHex: "#8C3A2A" },
  { id: "forest", label: "Forest Green", priceDelta: 0, swatchHex: "#2D4A30" },
  { id: "black", label: "Black", priceDelta: 0, swatchHex: "#1A1D20" },
];

export const metalRoofColors: OptionItem[] = [
  { id: "charcoal", label: "Charcoal", priceDelta: 0, swatchHex: "#3C434A", isDefault: true },
  { id: "slate-pewter", label: "Slate Pewter", priceDelta: 0, swatchHex: "#6B7280" },
  { id: "forest-green", label: "Forest Green", priceDelta: 0, swatchHex: "#2D4A30" },
  { id: "barn-red", label: "Barn Red", priceDelta: 0, swatchHex: "#7A2020" },
  { id: "arctic-white", label: "Arctic White", priceDelta: 0, swatchHex: "#E8EAF0" },
];

// --- Exterior option groups ---

export const exteriorGroups: OptionGroup[] = [
  {
    id: "sidingStyle",
    label: "Siding Style",
    subtitle: "Choose the profile for your exterior cladding.",
    displayType: "tiles",
    options: [
      {
        id: "horizontal",
        label: "Horizontal Lap",
        description: "Classic horizontal clapboard. Durable, timeless, and low-maintenance.",
        priceDelta: 0,
        isDefault: true,
      },
      {
        id: "vertical",
        label: "Vertical Board",
        description: "Clean board and batten vertical profile. Modern look that photographs beautifully.",
        priceDelta: 1500,
      },
      {
        id: "board-batten",
        label: "Premium Board & Batten",
        description: "Wide-profile board & batten with an upgraded trim package. A standout exterior.",
        priceDelta: 3000,
      },
    ],
  },
  {
    id: "roofType",
    label: "Roofing",
    subtitle: "Shingles are industry standard; metal adds decades of life.",
    displayType: "tiles",
    options: [
      {
        id: "shingles",
        label: "Architectural Shingles",
        description: "30-year rated asphalt shingles. Reliable, attractive, and industry standard.",
        priceDelta: 0,
        isDefault: true,
        perSqftId: "shingles",
      },
      {
        id: "metal",
        label: "Metal Roof",
        description: "50+ year standing seam metal. Higher upfront cost, lower lifetime cost, superior in heavy NS snow.",
        priceDelta: 0,
        perSqftId: "metal",
      },
    ],
  },
  {
    id: "exteriorTrim",
    label: "Window & Door Trim",
    subtitle: "The trim style defines the character of your home's exterior.",
    displayType: "tiles",
    options: [
      {
        id: "standard",
        label: "Standard",
        description: "Clean flat casing with a contemporary profile. Included.",
        priceDelta: 0,
        isDefault: true,
      },
      {
        id: "craftsman",
        label: "Craftsman",
        description: "Wide flat casing with corner block accents. Arts & Crafts heritage.",
        priceDelta: 800,
      },
      {
        id: "colonial",
        label: "Colonial",
        description: "Stepped profile casing with traditional moulded detail.",
        priceDelta: 1200,
      },
    ],
  },
];

// --- Interior option groups ---

export const interiorGroups: OptionGroup[] = [
  {
    id: "flooring",
    label: "Flooring",
    subtitle: "Applied throughout the main living areas.",
    displayType: "tiles",
    options: [
      {
        id: "lvp",
        label: "Standard Vinyl Plank",
        description: "Durable, waterproof LVP throughout. Easy to clean and maintain.",
        priceDelta: 0,
        isDefault: true,
        perSqftId: "flooring-lvp",
      },
      {
        id: "laminate",
        label: "Upgraded Laminate",
        description: "Thicker planks with a more authentic wood appearance and a softer underfoot feel.",
        priceDelta: 2500,
        perSqftId: "flooring-laminate",
      },
      {
        id: "hardwood",
        label: "Engineered Hardwood",
        description: "Real wood veneer over plywood core. Warm, premium aesthetic that adds resale value.",
        priceDelta: 6000,
        perSqftId: "flooring-hardwood",
      },
    ],
  },
  {
    id: "countertops",
    label: "Countertops",
    subtitle: "Kitchen and bathroom counters.",
    displayType: "tiles",
    options: [
      {
        id: "laminate",
        label: "Laminate",
        description: "Clean laminate counters in a range of colours. Practical and affordable.",
        priceDelta: 0,
        isDefault: true,
      },
      {
        id: "quartz",
        label: "Quartz",
        description: "Engineered stone with a high-end look, excellent durability, and zero maintenance.",
        priceDelta: 3500,
      },
    ],
  },
  {
    id: "cabinetStyle",
    label: "Cabinet Style",
    subtitle: "Kitchen and bathroom cabinetry.",
    displayType: "tiles",
    options: [
      {
        id: "standard",
        label: "Standard",
        description: "Flat-panel thermofoil cabinets in a clean white or light grey finish.",
        priceDelta: 0,
        isDefault: true,
      },
      {
        id: "shaker",
        label: "Shaker",
        description: "Classic 5-piece shaker door style. Clean, versatile, and adds perceived value.",
        priceDelta: 2000,
      },
      {
        id: "premium-shaker",
        label: "Premium Shaker",
        description: "Solid wood shaker with soft-close hinges, dovetail drawers, and crown moulding.",
        priceDelta: 4500,
      },
    ],
  },
  {
    id: "paintPackage",
    label: "Interior Paint Package",
    subtitle: "Wall colours throughout the main living areas.",
    displayType: "tiles",
    options: [
      {
        id: "builder-white",
        label: "Builder White",
        description: "Standard off-white throughout. Clean, neutral, and easy to personalize later.",
        priceDelta: 0,
        paletteHexes: ["#F5F2ED", "#F0EDE8", "#EAE6E0"],
        isDefault: true,
      },
      {
        id: "warm-neutral",
        label: "Warm Neutral Package",
        description: "A coordinated palette of warm greiges, soft taupes, and creamy whites — ready to live in.",
        priceDelta: 800,
        paletteHexes: ["#D9C9B0", "#C4B090", "#A89070"],
      },
      {
        id: "premium-custom",
        label: "Premium Custom Palette",
        description: "Work with our design consultant to select a fully personalized palette for every room.",
        priceDelta: 1800,
        paletteHexes: ["#8B9E8C", "#C4A882", "#6B7D8E"],
      },
    ],
  },
  {
    id: "interiorTrim",
    label: "Interior Trim & Millwork",
    subtitle: "Baseboards, door casings, and crown moulding.",
    displayType: "tiles",
    options: [
      {
        id: "standard",
        label: "Standard Flat",
        description: "Clean 3¼\" flat baseboard and simple door casings. Contemporary and low-profile.",
        priceDelta: 0,
        isDefault: true,
      },
      {
        id: "colonial",
        label: "Colonial",
        description: "Stepped casing profile with 4\" baseboard. Traditional character throughout.",
        priceDelta: 1500,
      },
      {
        id: "craftsman",
        label: "Craftsman",
        description: "Wide 5¼\" flat baseboard with corner blocks and picture-frame door surround.",
        priceDelta: 2500,
      },
    ],
  },
  {
    id: "lightingPackage",
    label: "Lighting Package",
    subtitle: "Fixtures throughout the home.",
    displayType: "tiles",
    options: [
      {
        id: "standard",
        label: "Standard",
        description: "Builder-grade flush-mount ceiling fixtures and basic pot lights.",
        priceDelta: 0,
        isDefault: true,
      },
      {
        id: "mid-range",
        label: "Mid-Range",
        description: "Pendant lights over islands, upgraded flush-mounts, and dimmable pot lights throughout.",
        priceDelta: 2000,
      },
      {
        id: "premium",
        label: "Premium",
        description: "Statement entry fixture, under-cabinet LEDs, smart dimmers, and curated fixtures in every room.",
        priceDelta: 4500,
      },
    ],
  },
  {
    id: "hardwareFinish",
    label: "Hardware Finish",
    subtitle: "Door handles, cabinet pulls, and faucets.",
    displayType: "swatches",
    options: [
      {
        id: "brushed-nickel",
        label: "Brushed Nickel",
        description: "Warm silver tone. Timeless and versatile.",
        priceDelta: 0,
        swatchHex: "#C0C0B8",
        isDefault: true,
      },
      {
        id: "matte-black",
        label: "Matte Black",
        description: "Bold, modern, and sophisticated.",
        priceDelta: 300,
        swatchHex: "#2A2A2A",
      },
      {
        id: "aged-bronze",
        label: "Aged Bronze",
        description: "Warm antique tone with rich depth.",
        priceDelta: 300,
        swatchHex: "#6B4A28",
      },
    ],
  },
  {
    id: "insulation",
    label: "Insulation",
    subtitle: "Affects your energy rating and heating costs.",
    displayType: "tiles",
    options: [
      {
        id: "standard",
        label: "Standard",
        description: "Code-minimum insulation. Adequate for milder seasons.",
        priceDelta: 0,
        isDefault: true,
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
];

// --- Room → finish map (Phase 5: which selections affect which room) ---

export interface RoomDef {
  id: "kitchen" | "living" | "bath" | "bedroom";
  label: string;
  /** ConfiguratorState keys whose selections are visible in this room */
  finishKeys: string[];
}

export const roomFinishMap: RoomDef[] = [
  { id: "kitchen", label: "Kitchen", finishKeys: ["flooringId", "countertopsId", "cabinetStyleId", "hardwareFinishId", "lightingPackageId"] },
  { id: "living", label: "Living Room", finishKeys: ["flooringId", "paintPackageId", "interiorTrimId", "lightingPackageId", "hasFireplace"] },
  { id: "bath", label: "Bathroom", finishKeys: ["flooringId", "countertopsId", "cabinetStyleId", "hardwareFinishId"] },
  { id: "bedroom", label: "Bedroom", finishKeys: ["flooringId", "paintPackageId", "interiorTrimId"] },
];

// --- Site costs ---

export const waterCosts: Record<Exclude<WaterType, null>, CostEstimate> = {
  drilled: {
    low: 8000,
    mid: 12000,
    high: 18000,
    label: "Drilled Well",
    description: "Most common in rural NS. Drilled 100–250 ft, includes pump, pressure tank, and water testing.",
    whyItMatters: "Well depth varies by location — deeper means higher cost. Most of our service area requires a drilled well.",
  },
  dug: {
    low: 3000,
    mid: 5500,
    high: 9000,
    label: "Dug Well",
    description: "Shallower hand-dug well, typically 15–30 ft. Lower cost but lower yield and more susceptible to contamination.",
    whyItMatters: "Only suitable on certain lots with high water tables. Ask us if your property is a candidate.",
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
    whyItMatters: "Soil conditions determine system type and cost. Clay-heavy soil may need an engineered system.",
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
    whyItMatters: "Distance from the factory and road accessibility affect cost.",
  },
  permits: {
    low: 1500,
    mid: 4000,
    high: 8000,
    label: "Permits & Inspections",
    description: "Building permit, septic permit, electrical inspection, and development fees required by your municipality.",
  },
};

// --- Extensions ---

export interface Extension {
  id: string;
  label: string;
  description: string;
  low: number;
  mid: number;
  high: number;
  addedRoofSqft?: number;
}

export const extensionOptions: Extension[] = [
  {
    id: "front-porch",
    label: "Covered Front Porch",
    description: "A covered entry porch. Improves curb appeal and gives a transitional indoor/outdoor space.",
    low: 12000,
    mid: 18000,
    high: 28000,
    addedRoofSqft: 200,
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
    addedRoofSqft: 0,
  },
];

// --- Legacy finish categories (kept for /calculator backward compat) ---

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
      { id: "standard", label: "Standard", description: "Code-minimum insulation.", priceDelta: 0 },
      { id: "enhanced", label: "Enhanced", description: "Upgraded batt insulation.", priceDelta: 3000 },
      { id: "premium", label: "Premium", description: "Spray foam + high-R batts.", priceDelta: 6000 },
    ],
  },
  {
    id: "siding",
    label: "Exterior Siding",
    options: [
      { id: "vinyl-horizontal", label: "Vinyl Horizontal", description: "Classic horizontal lap siding.", priceDelta: 0 },
      { id: "vinyl-vertical", label: "Vinyl Vertical", description: "Vertical profile. Clean, modern look.", priceDelta: 1500 },
      { id: "premium-board-batten", label: "Premium Board & Batten", description: "Upgraded trim package.", priceDelta: 3000 },
    ],
  },
  {
    id: "roofing",
    label: "Roofing",
    options: [
      { id: "shingles", label: "Architectural Shingles", description: "30-year rated asphalt shingles.", priceDelta: 0 },
      { id: "metal", label: "Metal Roof", description: "50+ year standing seam metal roof.", priceDelta: 4000 },
    ],
  },
  {
    id: "flooring",
    label: "Flooring",
    options: [
      { id: "standard", label: "Standard Vinyl Plank", description: "Durable, waterproof LVP throughout.", priceDelta: 0 },
      { id: "upgraded-laminate", label: "Upgraded Laminate", description: "Thicker planks, more authentic appearance.", priceDelta: 2500 },
      { id: "hardwood", label: "Engineered Hardwood", description: "Real wood veneer over plywood core.", priceDelta: 6000 },
    ],
  },
  {
    id: "countertops",
    label: "Countertops",
    options: [
      { id: "laminate", label: "Laminate", description: "Clean laminate counters.", priceDelta: 0 },
      { id: "quartz", label: "Quartz", description: "Engineered stone with high-end look.", priceDelta: 3500 },
    ],
  },
];

// --- Mortgage defaults ---

export const mortgageDefaults = {
  downPaymentPercent: 5,
  interestRate: 5.5,
  amortizationYears: 25,
};

export const amortizationOptions = [15, 20, 25, 30];

// --- Chart labels ---

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
  finishUpgrades: "Finish Upgrades",
};
