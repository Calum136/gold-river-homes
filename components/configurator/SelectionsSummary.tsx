"use client";

export interface SelectionItem {
  label: string;
  value: string;
  swatchHex?: string;
  /** 1-based screen index this decision lives on — clicking the chip jumps there. */
  screenIndex: number;
}

interface SelectionsSummaryProps {
  items: SelectionItem[];
  onJump: (screenIndex: number) => void;
}

// Fills the space under the visualizer with the buyer's decisions so far.
// Every chip is a shortcut back to its decision screen — review and edit
// anything without stepping back through the whole flow.
export default function SelectionsSummary({ items, onJump }: SelectionsSummaryProps) {
  if (items.length === 0) return null;
  return (
    <div className="mt-3">
      <p className="text-text-muted/60 text-[10px] uppercase tracking-widest font-medium mb-2">
        Your selections — click any to change
      </p>
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-1.5">
        {items.map((item) => (
          <button
            key={`${item.label}-${item.screenIndex}`}
            onClick={() => onJump(item.screenIndex)}
            className="text-left bg-bg-elevated border border-border hover:border-gold/50 transition-colors px-2.5 py-1.5 group"
          >
            <p className="text-text-muted/50 text-[9px] uppercase tracking-wider">{item.label}</p>
            <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
              {item.swatchHex && (
                <span
                  className="w-2.5 h-2.5 rounded-full border border-white/15 shrink-0"
                  style={{ backgroundColor: item.swatchHex }}
                />
              )}
              <p className="text-white/90 group-hover:text-gold text-[11px] font-medium leading-tight truncate transition-colors">
                {item.value}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
