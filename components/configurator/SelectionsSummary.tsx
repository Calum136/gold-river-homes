"use client";

export interface SelectionItem {
  label: string;
  value: string;
  swatchHex?: string;
  /** 1-based screen index this decision lives on — selecting it jumps there. */
  screenIndex: number;
}

interface SelectionsSummaryProps {
  items: SelectionItem[];
  onJump: (screenIndex: number) => void;
  className?: string;
}

// The buyer's decisions so far, at the foot of the decision panel on every
// screen size. Each one is a shortcut back to its decision screen.
export default function SelectionsSummary({ items, onJump, className = "" }: SelectionsSummaryProps) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="selections-heading" className={className}>
      <h2 id="selections-heading" className="text-eyebrow font-medium uppercase tracking-eyebrow text-text-muted">
        Your selections — click any to change
      </h2>
      <ul className="mt-3 grid grid-cols-2 gap-2">
        {items.map((item) => (
          <li key={`${item.label}-${item.screenIndex}`}>
            <button
              type="button"
              onClick={() => onJump(item.screenIndex)}
              className="focus-ring group h-full w-full border border-border px-3 py-2 text-left transition-colors hover:border-white/25"
            >
              <span className="block text-eyebrow text-text-muted">{item.label}</span>
              <span className="mt-0.5 flex min-w-0 items-center gap-2">
                {item.swatchHex && (
                  <span
                    aria-hidden
                    className="h-3 w-3 shrink-0 rounded-full border border-white/15"
                    style={{ backgroundColor: item.swatchHex }}
                  />
                )}
                <span className="truncate text-body-sm text-text-primary transition-colors group-hover:text-gold">
                  {item.value}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
