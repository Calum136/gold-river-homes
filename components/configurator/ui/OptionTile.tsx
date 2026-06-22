import type { CSSProperties } from "react";
import { formatCurrency } from "@/lib/calculator";

interface OptionTileProps {
  label: string;
  description?: string;
  priceDelta: number;
  selected: boolean;
  onClick: () => void;
  paletteHexes?: string[];
  compact?: boolean;
  unavailable?: boolean;
  /** CSS background/border for the material thumbnail shown at left. */
  thumbStyle?: CSSProperties;
  /** Small label under the thumb (e.g. "Horizontal"). */
  thumbLabel?: string;
}

export default function OptionTile({
  label,
  description,
  priceDelta,
  selected,
  onClick,
  paletteHexes,
  compact = false,
  unavailable = false,
  thumbStyle,
  thumbLabel,
}: OptionTileProps) {
  const hasThumb = !!thumbStyle;
  return (
    <button
      onClick={unavailable ? undefined : onClick}
      disabled={unavailable}
      className={`w-full text-left border transition-all duration-150 ${
        compact ? "p-3" : "p-4"
      } ${
        unavailable
          ? "bg-bg-elevated/50 border-border/50 opacity-45 cursor-not-allowed"
          : selected
          ? "bg-gold/10 border-gold"
          : "bg-bg-elevated border-border hover:border-white/20"
      }`}
    >
      <div className={`flex items-start gap-3 ${hasThumb ? "" : ""}`}>
        {/* Material thumbnail */}
        {hasThumb && (
          <div className="shrink-0 flex flex-col items-center gap-1">
            <div
              className="w-14 h-12 rounded overflow-hidden border border-white/10 shadow-inner"
              style={thumbStyle}
            />
            {thumbLabel && (
              <span className="text-[9px] text-text-muted/50 leading-none text-center w-14 truncate">
                {thumbLabel}
              </span>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <span className={`font-medium text-sm leading-snug ${selected ? "text-gold" : "text-white"}`}>
              {label}
            </span>
            <span className={`text-xs font-semibold tabular-nums shrink-0 ${selected ? "text-gold" : "text-text-muted"}`}>
              {priceDelta === 0 ? (
                <span className="text-text-muted/50 font-normal">Included</span>
              ) : (
                `+${formatCurrency(priceDelta)}`
              )}
            </span>
          </div>
          {description && !compact && (
            <p className="text-text-muted/60 text-xs leading-snug">{description}</p>
          )}
          {unavailable && (
            <p className="text-text-muted/50 text-[11px] mt-1">Not available on this model</p>
          )}
          {paletteHexes && paletteHexes.length > 0 && (
            <div className="flex gap-1 mt-2">
              {paletteHexes.map((hex, i) => (
                <div key={i} className="w-5 h-5 rounded-sm border border-white/10" style={{ backgroundColor: hex }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
