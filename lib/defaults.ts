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

// Supreme Homes 2026 standard spec sheets (revised 2026-02-13), transcribed by the
// lead from the images below. These are the source for every "Supreme's standard"
// option and description in this file.
export const SUPREME_SPEC_SOURCES = {
  modular: "https://www.supremehomes.ca/wp-content/uploads/2023/11/2026-Modular-Specs_EN-1-of-1.png",
  mini: "https://www.supremehomes.ca/wp-content/uploads/2023/11/2026-MiniHome-Specs_EN-1-of-1.png",
  revised: "2026-02-13",
};

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
    name: "Example: wooded lot near Chester Basin",
    location: "Chester Basin, NS",
    acreage: 1.4,
    widthFt: 185,
    depthFt: 330,
    price: 68000,
    terrain: "wooded",
    description: "Shown to illustrate typical land costs in this area. Ask Gold River Homes about lots available now.",
    availableServices: ["power", "drilled-well", "septic"],
    preselectedWater: "drilled",
    preselectedSewer: "septic",
  },
  {
    id: "lot-river-view",
    name: "Example: larger wooded lot near Liverpool",
    location: "Liverpool, NS",
    acreage: 2.1,
    widthFt: 220,
    depthFt: 415,
    price: 85000,
    terrain: "wooded",
    description: "Shown to illustrate typical land costs in this area. Ask Gold River Homes about lots available now.",
    availableServices: ["power", "drilled-well", "septic"],
    preselectedWater: "drilled",
    preselectedSewer: "septic",
  },
  {
    id: "lot-harbour-heights",
    name: "Example: town lot in Bridgewater with municipal services",
    location: "Bridgewater, NS",
    acreage: 0.6,
    widthFt: 110,
    depthFt: 240,
    price: 72000,
    terrain: "town",
    description: "Shown to illustrate typical land costs in this area. Ask Gold River Homes about lots available now.",
    availableServices: ["power", "municipal-water", "municipal-sewer"],
    preselectedWater: "municipal",
    preselectedSewer: "municipal",
  },
  {
    id: "lot-pine-meadow",
    name: "Example: open meadow lot near Shelburne",
    location: "Shelburne, NS",
    acreage: 1.8,
    widthFt: 200,
    depthFt: 390,
    price: 58000,
    terrain: "meadow",
    description: "Shown to illustrate typical land costs in this area. Ask Gold River Homes about lots available now.",
    availableServices: ["power", "drilled-well", "septic"],
    preselectedWater: "drilled",
    preselectedSewer: "septic",
  },
  {
    id: "lot-coastal-acres",
    name: "Example: coastal lot near Yarmouth",
    location: "Yarmouth, NS",
    acreage: 3.2,
    widthFt: 310,
    depthFt: 450,
    price: 95000,
    terrain: "coastal",
    description: "Shown to illustrate typical land costs in this area. Ask Gold River Homes about lots available now.",
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
  /** Overall dimensions as stated on the Supreme web sheet (per floor for two-storey models). */
  lengthFt: number;
  widthFt: number;
  storeys: 1 | 2;
  sections: "single" | "multi";
  /** The Supreme Homes web sheet this model's specs were sourced from. */
  specSource: string;
  garage?: { lengthFt: number; widthFt: number; sqft: number };
  description?: string;
  /** Owner-approved sentence explaining why this model matters / what it offers. */
  whyItMatters?: string;
}

// --- Roof / wall area estimates ---
// Supreme's web sheets don't publish roof or wall takeoffs, only overall
// dimensions. These helpers derive rough-but-documented estimates from the
// real footprint instead of the unsourced numbers that used to sit here.

/**
 * Roof area = top-floor footprint (home + any attached garage) × 1.15,
 * rounded. The 1.15 multiplier is an estimate covering a typical
 * low-to-moderate roof pitch plus eave/gable overhangs — not a real takeoff.
 */
function estimateRoofSqft(
  lengthFt: number,
  widthFt: number,
  garage?: { lengthFt: number; widthFt: number }
): number {
  const footprint = lengthFt * widthFt + (garage ? garage.lengthFt * garage.widthFt : 0);
  return Math.round(footprint * 1.15);
}

/**
 * Wall area = 2 × (length + width) × wall height × storeys, plus the
 * garage's own perimeter × wall height when present, rounded. This is gross
 * wall area — openings (doors/windows) aren't deducted, and gable-end wall
 * area (which this formula also omits) roughly offsets that. It's an
 * estimate, not a real takeoff.
 *
 * Wall height per Supreme Homes' 2026 spec sheets (revised 2026-02-13, see
 * SUPREME_SPEC_SOURCES): mini homes (single-section) are built to 7'6" wall
 * height, modular homes (multi-section) to 8'0".
 */
function estimateWallSqft(
  lengthFt: number,
  widthFt: number,
  storeys: number,
  wallHeightFt: number,
  garage?: { lengthFt: number; widthFt: number }
): number {
  const homeWalls = 2 * (lengthFt + widthFt) * wallHeightFt * storeys;
  const garageWalls = garage ? 2 * (garage.lengthFt + garage.widthFt) * wallHeightFt : 0;
  return Math.round(homeWalls + garageWalls);
}

export interface HomeCategoryDef {
  id: HomeCategory;
  label: string;
  description: string;
}

export const homeCategories: HomeCategoryDef[] = [
  {
    id: "mini",
    label: "Mini Home",
    description: "Single-section homes, 16 feet wide, built in one piece.",
  },
  {
    id: "modular",
    label: "Contemporary Home",
    description: "Single-storey, multi-section homes with a contemporary exterior.",
  },
  {
    id: "traditional",
    label: "Craftsman",
    description: "Single-storey, multi-section homes with a craftsman exterior.",
  },
  {
    id: "multistory",
    label: "Family Homes",
    description: "Two-storey homes, or single-storey with an attached garage.",
  },
];

export const homeModels: HomeModel[] = [
  {
    // Specs from the Supreme Homes BALI web sheet (Casita Series, 74'-0" × 16'-0").
    id: "bali",
    name: "Bali",
    price: 219000,
    beds: 3,
    baths: 2,
    sqft: 1440,
    roofSqft: estimateRoofSqft(74, 16),
    wallSqft: estimateWallSqft(74, 16, 1, 7.5),
    hasFireplace: false,
    type: "Mini",
    category: "mini",
    lengthFt: 74,
    widthFt: 16,
    storeys: 1,
    sections: "single",
    specSource: "https://www.supremehomes.ca/wp-content/uploads/2025/10/BALI-NEW-TEMPLATE-WEB-SHEET-EN.pdf",
    description: "Casita Series flagship — three bedrooms and two full baths in a single 74-foot section, with a striking board & batten entry gable.",
    whyItMatters: "Three bedrooms and two bathrooms on one floor in a single 16-foot-wide section, with a bump-out living room.",
  },
  {
    id: "zen-ct-2",
    name: "Zen CT-2",
    price: 165000,
    beds: 2,
    baths: 1,
    sqft: 864,
    roofSqft: estimateRoofSqft(54, 16),
    wallSqft: estimateWallSqft(54, 16, 1, 7.5),
    hasFireplace: false,
    type: "Mini",
    category: "mini",
    lengthFt: 54,
    widthFt: 16,
    storeys: 1,
    sections: "single",
    specSource: "https://www.supremehomes.ca/wp-content/uploads/2021/06/EN-Zen-CT-2-WS.pdf",
    description: "Minimalist 2-bedroom cottage — high ceilings, generous windows, open-concept living in a compact footprint.",
    whyItMatters: "The smallest home here: two bedrooms and one bathroom in 864 square feet, suited to a couple or someone downsizing.",
  },
  {
    id: "zenith-ct",
    name: "Zenith CT",
    price: 195000,
    beds: 3,
    baths: 2,
    sqft: 1184,
    roofSqft: estimateRoofSqft(74, 16),
    wallSqft: estimateWallSqft(74, 16, 1, 7.5),
    hasFireplace: true,
    type: "Mini",
    category: "mini",
    lengthFt: 74,
    widthFt: 16,
    storeys: 1,
    sections: "single",
    specSource: "https://www.supremehomes.ca/wp-content/uploads/2021/06/EN-Zenith-CT-WS.pdf",
    description: "Three bedrooms, two full baths, fireplace in the living room, and a master suite with walk-in closet.",
    whyItMatters: "Three bedrooms and two bathrooms in a single 16 by 74 foot section, sized for a small family.",
  },
  {
    id: "fb10",
    name: "FB-10",
    price: 210000,
    beds: 3,
    baths: 2,
    sqft: 1184,
    roofSqft: estimateRoofSqft(74, 16),
    wallSqft: estimateWallSqft(74, 16, 1, 7.5),
    hasFireplace: false,
    type: "Mini",
    category: "mini",
    lengthFt: 74,
    widthFt: 16,
    storeys: 1,
    sections: "single",
    specSource: "https://www.supremehomes.ca/wp-content/uploads/2023/09/FB10-WEB-SHEET-EN-1.pdf",
    description: "Traditional mini home with three bedrooms in a compact footprint — ideal for small families.",
    whyItMatters: "Three bedrooms and two bathrooms in a single 16 by 74 foot section, with a traditional exterior.",
  },
  {
    id: "fancy-tr-2",
    name: "Fancy TR-2",
    price: 185000,
    beds: 3,
    baths: 2,
    sqft: 1184,
    roofSqft: estimateRoofSqft(74, 16),
    wallSqft: estimateWallSqft(74, 16, 1, 7.5),
    hasFireplace: false,
    type: "Mini",
    category: "mini",
    lengthFt: 74,
    widthFt: 16,
    storeys: 1,
    sections: "single",
    specSource: "https://www.supremehomes.ca/wp-content/uploads/2022/04/FANCY-TR-2-WEB-SHEET-EN-1.pdf",
    description: "Well-appointed traditional mini home with two full baths and a stylish interior package.",
    whyItMatters: "The same 16 by 74 foot, three-bedroom footprint as the FB-10, with its own traditional exterior styling.",
  },
  {
    id: "acadie-ct",
    name: "Acadie CT",
    price: 235000,
    beds: 3,
    baths: 2,
    sqft: 1366,
    roofSqft: estimateRoofSqft(46, 32),
    wallSqft: estimateWallSqft(46, 32, 1, 8),
    hasFireplace: false,
    type: "Contemporary",
    category: "modular",
    lengthFt: 46,
    widthFt: 32,
    storeys: 1,
    sections: "multi",
    specSource: "https://www.supremehomes.ca/wp-content/uploads/2021/05/EN-Acadie-CT-WS.pdf",
    description: "Closed entry vestibule, open-concept kitchen and living, master suite with walk-in closet. A proven layout.",
    whyItMatters: "At 32 by 46 feet, it's shaped more like a traditional house than a long single section, with three bedrooms and two bathrooms.",
  },
  {
    id: "sauvignon-ct-2",
    name: "Sauvignon CT-2",
    price: 280000,
    beds: 3,
    baths: 2,
    sqft: 1672,
    roofSqft: estimateRoofSqft(74, 34),
    wallSqft: estimateWallSqft(74, 34, 1, 8),
    hasFireplace: true,
    type: "Contemporary",
    category: "modular",
    lengthFt: 74,
    widthFt: 34,
    storeys: 1,
    sections: "multi",
    specSource: "https://www.supremehomes.ca/wp-content/uploads/2021/06/EN-Sauvignon-CT-2-WS.pdf",
    description: "The house that has it all — covered porch, walk-in pantry, kitchen island, fireplace, and a luxury master ensuite.",
    whyItMatters: "One of the largest single-storey plans here, 34 by 74 feet, with three bedrooms and two bathrooms.",
  },
  {
    id: "acadie-cr",
    name: "Acadie CR",
    price: 260000,
    beds: 3,
    baths: 2,
    sqft: 1366,
    roofSqft: estimateRoofSqft(46, 32),
    wallSqft: estimateWallSqft(46, 32, 1, 8),
    hasFireplace: false,
    type: "Craftsman",
    category: "traditional",
    lengthFt: 46,
    widthFt: 32,
    storeys: 1,
    sections: "multi",
    specSource: "https://www.supremehomes.ca/wp-content/uploads/2021/05/EN-Acadie-CR-WS.pdf",
    description: "A winning plan — craftsman exterior with efficient open-concept interior and a generous entry walk-in closet.",
    whyItMatters: "The same 32 by 46 foot plan as the Acadie CT, dressed in a craftsman-style exterior.",
  },
  {
    id: "porto",
    name: "Porto",
    price: 310000,
    beds: 3,
    baths: 2,
    sqft: 1530,
    roofSqft: estimateRoofSqft(54, 34),
    wallSqft: estimateWallSqft(54, 34, 1, 8),
    hasFireplace: true,
    type: "Craftsman",
    category: "traditional",
    lengthFt: 54,
    widthFt: 34,
    storeys: 1,
    sections: "multi",
    specSource: "https://www.supremehomes.ca/wp-content/uploads/2021/05/porto-english-websheet-1.pdf",
    description: "Standout craftsman curb appeal with a wide covered porch, vaulted ceilings, and a well-appointed open kitchen.",
    whyItMatters: "A 34 by 54 foot craftsman-style plan with three bedrooms and two bathrooms on one level.",
  },
  {
    id: "windsor-ct",
    name: "Windsor CT",
    price: 355000,
    beds: 3,
    baths: 2.5,
    sqft: 1936,
    roofSqft: estimateRoofSqft(34, 30),
    wallSqft: estimateWallSqft(34, 30, 2, 8),
    hasFireplace: false,
    type: "Multi-Story",
    category: "multistory",
    lengthFt: 34,
    widthFt: 30,
    storeys: 2,
    sections: "multi",
    specSource: "https://www.supremehomes.ca/wp-content/uploads/2021/06/EN-Windsor-CT-WS.pdf",
    description: "Two-storey contemporary with 2½ baths. Grand master bedroom with walk-in closet and ensuite. Laundry on the main floor.",
    whyItMatters: "Two storeys on a compact 30 by 34 foot footprint give three bedrooms and two and a half bathrooms.",
  },
  {
    id: "bordeaux-tr",
    name: "Bordeaux TR",
    price: 420000,
    beds: 3,
    baths: 2,
    sqft: 1724,
    roofSqft: estimateRoofSqft(76.5, 44, { lengthFt: 29, widthFt: 27 }),
    wallSqft: estimateWallSqft(76.5, 44, 1, 8, { lengthFt: 29, widthFt: 27 }),
    hasFireplace: true,
    type: "Traditional",
    category: "multistory",
    lengthFt: 76.5,
    widthFt: 44,
    storeys: 1,
    sections: "multi",
    specSource: "https://www.supremehomes.ca/wp-content/uploads/2021/04/Bordeaux_SupremeHomes_EN_091115.pdf",
    garage: { lengthFt: 29, widthFt: 27, sqft: 824 },
    description: "Traditional single-storey design with three bedrooms and two full baths — a large kitchen with a walk-in pantry, a master ensuite, and an attached two-car garage.",
    whyItMatters: "The only model here with an attached two-car garage, plus three bedrooms and two bathrooms on one level.",
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
  isDefault?: boolean;
  /** When set, this option is only offered on the listed model IDs.
   *  Populate from Supreme's factory options matrix (Phase 7 reliability layer). */
  availableForModels?: string[];
  /** Owner-approved sentence explaining why this choice matters. Shown next to the option. */
  whyItMatters?: string;
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
  { id: "white", label: "White", priceDelta: 0, swatchHex: "#F2EDE3", isDefault: true, whyItMatters: "White stays cool in summer sun and won't show fading as visibly as darker siding over time." },
  { id: "cream", label: "Cream", priceDelta: 0, swatchHex: "#DED0A8", whyItMatters: "A soft, warm neutral that stays cool in the sun like white, with a little more warmth in the tone." },
  { id: "warm-gray", label: "Warm Gray", priceDelta: 0, swatchHex: "#A09890", whyItMatters: "A versatile mid-tone gray that works with most trim colours and reads as neither too light nor too dark." },
  { id: "slate", label: "Slate", priceDelta: 0, swatchHex: "#7A8898", whyItMatters: "A cool blue-gray that reads as contemporary without the upkeep concerns of a very dark colour." },
  { id: "charcoal", label: "Charcoal", priceDelta: 0, swatchHex: "#3C434A", whyItMatters: "A dark charcoal will absorb more summer heat and may show fading sooner than lighter colours." },
  { id: "navy", label: "Navy", priceDelta: 0, swatchHex: "#1D3050", whyItMatters: "A deep navy will absorb more heat in summer sun and may show fading sooner than lighter tones." },
  { id: "sage", label: "Sage Green", priceDelta: 0, swatchHex: "#6A8468", whyItMatters: "A muted sage green that blends naturally with trees and rural surroundings year-round." },
  { id: "brick-red", label: "Brick Red", priceDelta: 0, swatchHex: "#8C3A2A", whyItMatters: "A warm, earthy red that adds a traditional, classic look to your home's exterior." },
  { id: "forest", label: "Forest Green", priceDelta: 0, swatchHex: "#2D4A30", whyItMatters: "A deep forest green will absorb more heat in summer and may fade sooner than lighter siding colours." },
  { id: "black", label: "Black", priceDelta: 0, swatchHex: "#1A1D20", whyItMatters: "Black absorbs the most heat of any colour here and will show fading sooner than lighter siding." },
];

export const metalRoofColors: OptionItem[] = [
  { id: "charcoal", label: "Charcoal", priceDelta: 0, swatchHex: "#3C434A", isDefault: true, whyItMatters: "A dark charcoal metal roof will run warmer in summer sun and may show fading sooner than lighter finishes." },
  { id: "slate-pewter", label: "Slate Pewter", priceDelta: 0, swatchHex: "#6B7280", whyItMatters: "A mid-tone gray that pairs with most siding colours without drawing much attention to itself." },
  { id: "forest-green", label: "Forest Green", priceDelta: 0, swatchHex: "#2D4A30", whyItMatters: "A dark forest green roof will run warmer in the sun and may fade sooner than lighter roof colours." },
  { id: "barn-red", label: "Barn Red", priceDelta: 0, swatchHex: "#7A2020", whyItMatters: "A dark barn red will run warmer in the sun and may show fading sooner than lighter roof finishes." },
  { id: "arctic-white", label: "Arctic White", priceDelta: 0, swatchHex: "#E8EAF0", whyItMatters: "A light roof stays cooler in summer sun and shows fading less than a dark metal finish." },
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
        description: "Horizontal vinyl lap siding with house wrap. Supreme's standard.",
        priceDelta: 0,
        isDefault: true,
        whyItMatters: "The most common siding profile on Nova Scotia homes, so it suits almost any street or rural setting.",
      },
      {
        id: "vertical",
        label: "Vertical Board",
        description: "Clean board and batten vertical profile. Modern look that photographs beautifully.",
        priceDelta: 1500,
        whyItMatters: "Vertical board and batten gives a clean, modern look if you want your home to stand out from the classic clapboard nearby.",
      },
      {
        id: "board-batten",
        label: "Premium Board & Batten",
        description: "Wide-profile board & batten with an upgraded trim package. A standout exterior.",
        priceDelta: 3000,
        whyItMatters: "The wide-profile boards and upgraded trim create a more custom, standout exterior than the standard profiles.",
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
        label: "Fibreglass Shingles",
        description: "Fibreglass asphalt shingles with extra tar adhesive and a limited lifetime warranty. Supreme's standard.",
        priceDelta: 0,
        isDefault: true,
        perSqftId: "shingles",
        whyItMatters: "Asphalt shingles are the standard, reliable option and hold up well through our freeze-thaw winters when properly installed.",
      },
      {
        id: "metal",
        label: "Metal Roof",
        description: "Standing-seam metal roofing in your choice of colour.",
        priceDelta: 0,
        perSqftId: "metal",
        whyItMatters: "Snow slides off metal more readily than shingles, so less sits on the roof; plan for where it lands near doors and walkways.",
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
        whyItMatters: "A clean, flat casing gives your windows and doors a simple, contemporary look.",
      },
      {
        id: "craftsman",
        label: "Craftsman",
        description: "Wide flat casing with corner block accents. Arts & Crafts heritage.",
        priceDelta: 800,
        whyItMatters: "Wider casing with corner block accents gives your home's exterior a traditional Arts and Crafts character.",
      },
      {
        id: "colonial",
        label: "Colonial",
        description: "Stepped profile casing with traditional moulded detail.",
        priceDelta: 1200,
        whyItMatters: "Stepped, moulded casing adds a traditional detail to your windows and doors.",
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
        id: "standard",
        label: "Vinyl Tile & Laminate",
        description: "Waterproof 6.5 mm vinyl tile in the kitchen, dining room and bathrooms, with 12 mm laminate in living areas, bedrooms and halls. Supreme's standard.",
        priceDelta: 0,
        isDefault: true,
        perSqftId: "flooring-standard",
        whyItMatters: "Waterproof vinyl tile where water and wet boots land, and laminate floors in living areas and bedrooms.",
      },
      {
        id: "hardwood",
        label: "Engineered Hardwood",
        description: "Real wood veneer over a plywood core in living areas, bedrooms and halls, in place of the standard laminate.",
        priceDelta: 6000,
        perSqftId: "flooring-hardwood",
        whyItMatters: "A real wood veneer gives a warmer, more premium look than the standard laminate in living areas.",
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
        description: "Post-formed laminate kitchen and vanity counters. Supreme's standard.",
        priceDelta: 0,
        isDefault: true,
        whyItMatters: "Laminate counters come in a range of colours and are easy to keep clean day to day.",
      },
      {
        id: "quartz",
        label: "Quartz",
        description: "Engineered stone with a high-end look, excellent durability, and zero maintenance.",
        priceDelta: 3500,
        whyItMatters: "Engineered quartz resists scratches and stains and holds up with very little day-to-day upkeep.",
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
        id: "shaker",
        label: "Shaker",
        description: "MDF shaker-style doors with soft-close hinges and drawers and white melamine interiors. Supreme's standard.",
        priceDelta: 0,
        isDefault: true,
        whyItMatters: "Shaker-style doors with soft-close hinges and drawers come standard, a clean look that suits most kitchens.",
      },
      {
        id: "premium-shaker",
        label: "Solid Wood Shaker",
        description: "Solid wood shaker doors and boxes with dovetail drawers and crown moulding.",
        priceDelta: 4500,
        whyItMatters: "Solid wood boxes and dovetail drawers hold up to years of daily use.",
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
        description: "Off-white walls throughout. Supreme paints mini home walls at the factory; modular home walls arrive primed and are painted on site.",
        priceDelta: 0,
        paletteHexes: ["#F5F2ED", "#F0EDE8", "#EAE6E0"],
        isDefault: true,
        whyItMatters: "A neutral off-white throughout makes it simple to add your own colour later without repainting everything first.",
      },
      {
        id: "warm-neutral",
        label: "Warm Neutral Package",
        description: "A coordinated palette of warm greiges, soft taupes, and creamy whites — ready to live in.",
        priceDelta: 800,
        paletteHexes: ["#D9C9B0", "#C4B090", "#A89070"],
        whyItMatters: "A coordinated palette of warm greiges and taupes is chosen for you, so it looks finished from day one.",
      },
      {
        id: "premium-custom",
        label: "Premium Custom Palette",
        description: "Work with our design consultant to select a fully personalized palette for every room.",
        priceDelta: 1800,
        paletteHexes: ["#8B9E8C", "#C4A882", "#6B7D8E"],
        whyItMatters: "You work with a design consultant to choose colours room by room, tailored to your taste.",
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
        label: "Flat Trim",
        description: "5¼-inch flat baseboards, 3¾-inch flat casings and 5½-inch flat headers over doors and windows. Supreme's standard.",
        priceDelta: 0,
        isDefault: true,
        whyItMatters: "Wide flat baseboards and flat headers over doors and windows come standard, a clean traditional look.",
      },
      {
        id: "colonial",
        label: "Colonial",
        description: "Stepped, moulded casings and baseboards in place of the standard flat trim.",
        priceDelta: 1500,
        whyItMatters: "Stepped, moulded casings add a more traditional detail to doors and windows.",
      },
      {
        id: "craftsman",
        label: "Craftsman",
        description: "Corner blocks and picture-frame door surrounds added to wide flat trim.",
        priceDelta: 2500,
        whyItMatters: "Corner blocks and picture-frame door surrounds give a more substantial, custom-built look.",
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
        description: "Quality fixtures throughout, pendant lights over the kitchen sink and island, exterior pot lights over doors and LED bulbs. Supreme's standard.",
        priceDelta: 0,
        isDefault: true,
        whyItMatters: "Standard fixtures include pendant lights over the kitchen sink and island, with LED bulbs throughout.",
      },
      {
        id: "premium",
        label: "Premium",
        description: "Adds under-cabinet LED lighting, smart dimmers and a statement entry fixture.",
        priceDelta: 4500,
        whyItMatters: "Under-cabinet lighting, smart dimmers and a statement entry fixture add function and style through long winter evenings.",
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
        description: "Brushed nickel door handles and hinges. Supreme's standard.",
        priceDelta: 0,
        swatchHex: "#C0C0B8",
        isDefault: true,
        whyItMatters: "A warm silver tone that's easy to match with almost any fixture or cabinet colour.",
      },
      {
        id: "matte-black",
        label: "Matte Black",
        description: "Bold, modern, and sophisticated.",
        priceDelta: 300,
        swatchHex: "#2A2A2A",
        whyItMatters: "A bold, dark finish that gives a modern, more dramatic look than brushed nickel.",
      },
      {
        id: "aged-bronze",
        label: "Aged Bronze",
        description: "Warm antique tone with rich depth.",
        priceDelta: 300,
        swatchHex: "#6B4A28",
        whyItMatters: "A warm, antique-looking bronze tone that suits a more traditional or rustic style.",
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
        description: "R-28 walls on modular homes and R-24 on mini homes, with R-52 in the roof. Supreme's standard.",
        priceDelta: 0,
        isDefault: true,
        whyItMatters: "Standard walls are insulated to R-24 to R-28 depending on the model, with R-52 in the roof.",
      },
      {
        id: "enhanced",
        label: "Enhanced",
        description: "Upgraded insulation in the walls and attic beyond Supreme's standard.",
        priceDelta: 3000,
        whyItMatters: "More insulation in the walls and attic means less heat escaping over Nova Scotia's long heating season.",
      },
      {
        id: "premium",
        label: "Premium",
        description: "Spray foam with high-R batts and full air sealing.",
        priceDelta: 6000,
        whyItMatters: "Spray foam also seals air gaps, which batts alone don't, so it cuts drafts as well as heat loss.",
      },
    ],
  },
];

// --- Site costs ---

export const waterCosts: Record<Exclude<WaterType, null>, CostEstimate> = {
  drilled: {
    low: 8000,
    mid: 12000,
    high: 18000,
    label: "Drilled Well",
    description: "Most common in rural NS. Drilled 100–250 ft, includes pump, pressure tank, and water testing.",
    whyItMatters: "Most rural properties in our service area rely on a drilled well, since municipal water often isn't available.",
  },
  dug: {
    low: 3000,
    mid: 5500,
    high: 9000,
    label: "Dug Well",
    description: "Shallower hand-dug well, typically 15–30 ft. Lower cost but lower yield and more susceptible to contamination.",
    whyItMatters: "Only suits lots with a high water table, and a dug well is more likely to run low in a dry summer.",
  },
  municipal: {
    low: 3000,
    mid: 6000,
    high: 10000,
    label: "Municipal Water",
    description: "Connection fee and trenching from the property line to your home. Available in towns like Chester Basin, Bridgewater, and Liverpool.",
    whyItMatters: "Municipal water means you won't maintain a well yourself, though it's only available in certain towns and comes with an ongoing bill.",
  },
};

export const sewerCosts: Record<Exclude<SewerType, null>, CostEstimate> = {
  septic: {
    low: 12000,
    mid: 18000,
    high: 30000,
    label: "Septic System",
    description: "Includes percolation test, septic tank, distribution box, and drain field installation. Required for most rural properties.",
    whyItMatters: "Most rural properties need a septic system, and your soil conditions determine what type and size it has to be.",
  },
  municipal: {
    low: 3000,
    mid: 6000,
    high: 10000,
    label: "Municipal Sewer",
    description: "Connection fee and trenching to the municipal sewer line. Only available within town boundaries.",
    whyItMatters: "Municipal sewer means no septic tank to maintain, though it's only available within town boundaries and comes with its own charge.",
  },
};

export const foundationCosts: Record<FoundationType, CostEstimate> = {
  slab: {
    low: 8000,
    mid: 14000,
    high: 22000,
    label: "Concrete Slab",
    description: "A flat concrete pad poured directly on prepared ground. The most affordable foundation option.",
    whyItMatters: "A flat concrete pad works well on level ground but gives you no crawlspace or basement storage underneath.",
  },
  crawlspace: {
    low: 12000,
    mid: 20000,
    high: 30000,
    label: "Crawlspace",
    description: "Elevated foundation with access underneath for plumbing and utilities. Good balance of cost and practicality.",
    whyItMatters: "Raising the home off the ground gives easier access to plumbing and helps keep ground moisture away from the floor.",
  },
  basement: {
    low: 25000,
    mid: 40000,
    high: 60000,
    label: "Full Basement",
    description: "A full below-grade basement adds livable/storage space. Significant additional cost but adds value to the home.",
    whyItMatters: "Adds storage or future living space under the whole home; on wet sites it needs good drainage to stay dry.",
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

/** Models whose plan has been drawn with an optional enclosed entry vestibule (the 3D demo model). */
export const VESTIBULE_MODELS: readonly string[] = ["bali"];

export function vestibuleAvailable(modelId: string | null): boolean {
  return !!modelId && VESTIBULE_MODELS.includes(modelId);
}

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
    id: "entry-vestibule",
    label: "Enclosed Entry Vestibule",
    description: "An enclosed 8' by 6' entry built onto the front door, with its own door, side windows and a steep gable roof.",
    low: 9000,
    mid: 14000,
    high: 20000,
    addedRoofSqft: 70,
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
