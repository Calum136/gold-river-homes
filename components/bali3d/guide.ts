import type { ConfiguratorState } from "@/lib/pricing";
import type { Slot } from "./materials";

// ============================================
// What each screen changes in the 3D home, and where to look. The stage pins
// a gold marker on the spot, the decision panel says the same thing in words,
// and the changed surfaces glow briefly when a choice is made, so the panel
// and the picture read as one.
//
// Wording here is new (Nov 2026) and not yet in the approved copy doc.
// ============================================

export interface ScreenGuide {
  /** Short name on the marker in the scene. */
  label: string;
  /** One line in the panel telling the buyer where to look. */
  look: string;
  /** Where the marker sits, in plan feet (x, depth, height above the floor). */
  anchor?: (state: ConfiguratorState) => [number, number, number] | null;
}

export const GUIDE: Record<string, ScreenGuide> = {
  land: { label: "Your lot", look: "The land around the house changes with the lot you pick.", anchor: () => [8, -24, -2.2] },
  model: { label: "Floor plan", look: "This is the Bali's floor plan. Press Next, or the arrow at the right of the picture, to raise the walls." },
  sidingStyle: { label: "Siding", look: "Watch the siding on the front of the house: the boards change direction and width.", anchor: () => [22, 0, 5] },
  sidingColor: { label: "Siding colour", look: "The whole house changes colour as you pick.", anchor: () => [22, 0, 5] },
  roofType: { label: "Roof", look: "Look at the roof: shingles, or standing-seam metal in your colour.", anchor: () => [24, 5, 11.4] },
  porch: { label: "Front entry", look: "Watch the front door: an open landing, a covered porch, or an enclosed vestibule.", anchor: () => [43.6, -3, 2] },
  exteriorTrim: { label: "Trim", look: "Look at the trim around this window.", anchor: () => [54.3, -0.1, 7.2] },
  flooring: { label: "Floors", look: "The floors through the kitchen, living room, bedrooms and halls change. Bathrooms and the entry keep tile.", anchor: () => [36.5, 23, 0] },
  countertops: { label: "Countertops", look: "Your choice shows on the kitchen island and the counters behind it.", anchor: () => [33.0, 7.4, 3.0] },
  cabinetStyle: { label: "Cabinets", look: "Look at the kitchen cabinets: the door style and the colour.", anchor: () => [26.9, 1.6, 5.8] },
  paintPackage: { label: "Walls", look: "The wall colour changes through the house.", anchor: () => [37.7, 31.5, 5] },
  interiorTrim: { label: "Trim", look: "Look at the baseboards and the trim around the doors down the hall.", anchor: () => [57.1, 12.0, 6.95] },
  lightingPackage: { label: "Lighting", look: "It's evening so the lights show. Premium adds under-cabinet lights, pot lights and statement fixtures.", anchor: () => [33.6, 7.65, 5.5] },
  hardwareFinish: { label: "Hardware", look: "Look at the cabinet pulls, the faucet and the door handles.", anchor: () => [27.3, 2.42, 2.3] },
  insulation: { label: "Inside the wall", look: "This cutaway shows what's inside the walls: studs, insulation and the layers outside them.", anchor: () => [70.4, -0.3, 4.5] },
  fireplace: { label: "Feature wall", look: "Look at the living room wall facing the sofa.", anchor: () => [31.7, 23.8, 3.4] },
  foundation: { label: "Foundation", look: "The lawn turns see-through so you can see what the house sits on.", anchor: () => [6, 0, -4] },
  water: {
    label: "Water",
    look: "The lawn turns see-through so you can see where your water comes from.",
    anchor: (s) => (s.waterType === "municipal" ? [8, -60, -6] : [-16, -30, -2]),
  },
  sewer: {
    label: "Wastewater",
    look: "The lawn turns see-through so you can see where wastewater goes.",
    anchor: (s) => (s.sewerType === "municipal" ? [60, -40, -7] : [60, -26, -4]),
  },
};

/** Surfaces that glow briefly when a selection changes, so the eye finds the change. */
export const PULSE_FOR: Partial<Record<keyof ConfiguratorState, Slot[]>> = {
  sidingStyleId: ["siding", "sidingThin"],
  sidingColorId: ["siding", "sidingThin"],
  roofTypeId: ["roof"],
  metalRoofColorId: ["roof"],
  hasFrontPorch: ["deck"],
  hasVestibule: ["deck", "shake"],
  exteriorTrimId: ["trimExt"],
  flooringId: ["floorMain"],
  countertopsId: ["counter"],
  cabinetStyleId: ["cabinet"],
  cabinetColorId: ["cabinet"],
  paintPackageId: ["wall", "wallThin"],
  interiorTrimId: ["trimInt"],
  hardwareFinishId: ["hardware"],
  insulationId: ["insBatt", "insFoam", "insBoard"],
  hasFireplace: ["stone", "wood"],
  foundationType: ["concrete", "skirting"],
  waterType: ["pipeWater", "steelPipe"],
  sewerType: ["pipeSewer", "lid", "drainRock"],
};
