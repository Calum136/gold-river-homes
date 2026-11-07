import { chapterCopy } from "./copy";

// ============================================
// The guided flow: twenty decision screens in six named chapters.
//
// state.step is a 1-based index into SCREENS and is saved in localStorage, so
// reordering or removing screens needs the storage key in
// app/configure/page.tsx bumped. Titles are the approved questions, verbatim.
// Progress is only ever shown as chapter names, never as a count of screens.
// ============================================

export type ChapterId = keyof typeof chapterCopy;

export interface ScreenDef {
  id: string;
  chapter: ChapterId;
  /** The question this screen asks, shown at display size. */
  title: string;
}

export const SCREENS: readonly ScreenDef[] = [
  { id: "land", chapter: "land", title: "Where will your home go?" },
  { id: "model", chapter: "home", title: "Which home fits how you live?" },
  { id: "sidingStyle", chapter: "outside", title: "Which siding style?" },
  { id: "sidingColor", chapter: "outside", title: "What colour should the siding be?" },
  { id: "roofType", chapter: "outside", title: "Shingles or metal?" },
  { id: "porch", chapter: "outside", title: "Add a covered front porch?" },
  { id: "exteriorTrim", chapter: "outside", title: "How should windows and doors be trimmed?" },
  { id: "flooring", chapter: "inside", title: "Which floors?" },
  { id: "countertops", chapter: "inside", title: "Which countertops?" },
  { id: "cabinetStyle", chapter: "inside", title: "Which cabinets?" },
  { id: "paintPackage", chapter: "inside", title: "What colour should the walls be?" },
  { id: "interiorTrim", chapter: "inside", title: "Which interior trim?" },
  { id: "lightingPackage", chapter: "inside", title: "Which lighting?" },
  { id: "hardwareFinish", chapter: "inside", title: "Which hardware finish?" },
  { id: "fireplace", chapter: "inside", title: "Add an electric fireplace?" },
  { id: "insulation", chapter: "inside", title: "How much insulation?" },
  { id: "foundation", chapter: "ready", title: "What will your home sit on?" },
  { id: "water", chapter: "ready", title: "Where will your water come from?" },
  { id: "sewer", chapter: "ready", title: "Where will wastewater go?" },
  { id: "summary", chapter: "cost", title: "Your home, and what it costs" },
];

export interface ChapterDef {
  id: ChapterId;
  /** Approved chapter name. */
  title: string;
  /** Approved one-sentence opener, shown on the chapter's first screen. */
  opener: string;
  /** 1-based index of the chapter's first screen, where the chapter opens. */
  firstScreen: number;
  /** 1-based index of the chapter's last screen. */
  lastScreen: number;
}

/** The chapters in the order their screens appear. */
export const CHAPTERS: readonly ChapterDef[] = SCREENS.reduce<ChapterDef[]>((chapters, screen, i) => {
  const last = chapters[chapters.length - 1];
  if (last?.id === screen.chapter) {
    last.lastScreen = i + 1;
  } else {
    chapters.push({ id: screen.chapter, ...chapterCopy[screen.chapter], firstScreen: i + 1, lastScreen: i + 1 });
  }
  return chapters;
}, []);

/** The chapter a screen (1-based index) belongs to. */
export function chapterForScreen(screenIndex: number): ChapterDef {
  return CHAPTERS.find((c) => screenIndex >= c.firstScreen && screenIndex <= c.lastScreen) ?? CHAPTERS[0];
}
