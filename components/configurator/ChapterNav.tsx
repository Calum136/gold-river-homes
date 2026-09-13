import { CHAPTERS, chapterForScreen } from "@/lib/screens";
import type { ChapterDef } from "@/lib/screens";

interface ChapterNavProps {
  /** 1-based index of the screen on show. */
  screenIndex: number;
  /** Furthest screen the buyer can jump to; chapters up to it are clickable. */
  reachedScreen: number;
  onJump: (screenIndex: number) => void;
}

// Progress as named chapters, never as a count of screens. Desktop: all six
// names, the current one marked, the ones already reached clickable. Phones:
// the current chapter's name only. A hairline under the current name fills as
// the buyer moves through that chapter.
export default function ChapterNav({ screenIndex, reachedScreen, onJump }: ChapterNavProps) {
  const current = chapterForScreen(screenIndex);

  return (
    <nav aria-label="Chapters" className="min-w-0">
      <ol className="hidden items-center gap-5 lg:flex xl:gap-7">
        {CHAPTERS.map((chapter) => (
          <li key={chapter.id}>
            {chapter.id === current.id ? (
              <span aria-current="step" className="relative block py-2 text-caption font-medium text-text-primary">
                {chapter.title}
                <ChapterProgress chapter={chapter} screenIndex={screenIndex} />
              </span>
            ) : chapter.firstScreen <= reachedScreen ? (
              <button
                type="button"
                onClick={() => onJump(chapter.firstScreen)}
                className="focus-ring block py-2 text-caption text-text-secondary transition-colors duration-150 hover:text-gold"
              >
                {chapter.title}
              </button>
            ) : (
              <span className="block py-2 text-caption text-text-muted">{chapter.title}</span>
            )}
          </li>
        ))}
      </ol>

      <p className="relative truncate py-2 text-caption font-medium text-text-primary lg:hidden">
        {current.title}
        <ChapterProgress chapter={current} screenIndex={screenIndex} />
      </p>
    </nav>
  );
}

function ChapterProgress({ chapter, screenIndex }: { chapter: ChapterDef; screenIndex: number }) {
  const screens = chapter.lastScreen - chapter.firstScreen + 1;
  const through = (screenIndex - chapter.firstScreen + 1) / screens;
  return (
    <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-white/10">
      <span
        className="block h-full bg-gold transition-[width] duration-200 ease-out"
        style={{ width: `${Math.round(through * 100)}%` }}
      />
    </span>
  );
}
