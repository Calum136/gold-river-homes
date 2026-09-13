import Image from "next/image";
import type { ReactNode } from "react";
import { formatCurrency } from "@/lib/calculator";
import type { VisualAsset } from "@/lib/visual-assets";

/** "Included" for no added cost, otherwise "+$1,200". */
export function PriceDelta({ amount }: { amount: number }) {
  return amount === 0 ? (
    <span className="text-text-muted">Included</span>
  ) : (
    <span className="text-text-primary">+{formatCurrency(amount)}</span>
  );
}

export function ChoiceGroup({
  legend,
  showLegend = false,
  children,
}: {
  legend: string;
  /** The screen heading usually names the group, so the legend is for screen readers unless asked. */
  showLegend?: boolean;
  children: ReactNode;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className={showLegend ? "mb-3 text-sm font-medium uppercase tracking-widest text-text-muted" : "sr-only"}>
        {legend}
      </legend>
      <div className="flex flex-col gap-2">{children}</div>
    </fieldset>
  );
}

/** The visible radio mark for a row whose native input is visually hidden. */
export function RadioMark({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-150 ${
        checked ? "border-gold" : "border-white/30"
      }`}
    >
      <span
        className={`h-2.5 w-2.5 rounded-full bg-gold transition-transform duration-150 ${checked ? "scale-100" : "scale-0"}`}
      />
    </span>
  );
}

/** Row classes shared by every radio row and card: border states plus a visible keyboard focus ring. */
export function choiceRowClass(checked: boolean, disabled = false): string {
  const state = disabled
    ? "cursor-not-allowed border-border/50 opacity-50"
    : checked
    ? "cursor-pointer border-gold bg-gold/[0.06]"
    : "cursor-pointer border-border hover:border-white/25";
  return `focus-ring-within border transition-colors duration-150 ${state}`;
}

interface ChoiceRowProps {
  /** Radio group name, shared by every row in the group. */
  name: string;
  value: string;
  label: string;
  description?: string;
  /** Right-aligned price, e.g. <PriceDelta amount={1200} />. */
  price?: ReactNode;
  checked: boolean;
  onSelect: () => void;
  disabled?: boolean;
  disabledNote?: string;
  /** Approved example photo of this choice, shown as a small thumbnail. */
  thumb?: VisualAsset | null;
  /** Colour swatch, shown in the thumbnail slot when there's no photo. */
  swatchHex?: string;
  /** Keep the thumbnail column when a sibling row has one, so labels align. */
  reserveThumb?: boolean;
  paletteHexes?: string[];
  /** Slot for the line that states what this choice changes (price and monthly payment). */
  consequence?: ReactNode;
}

// One choice as a native radio: Tab reaches the group, arrow keys move the
// selection, and the focus ring shows on the whole row.
export default function ChoiceRow({
  name,
  value,
  label,
  description,
  price,
  checked,
  onSelect,
  disabled = false,
  disabledNote = "Not available on this model",
  thumb,
  swatchHex,
  reserveThumb = false,
  paletteHexes,
  consequence,
}: ChoiceRowProps) {
  const showThumbSlot = reserveThumb || !!thumb || !!swatchHex;

  return (
    <label className={`flex items-center gap-4 px-4 py-3 ${choiceRowClass(checked, disabled)}`}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        className="sr-only"
      />
      <RadioMark checked={checked} />

      {showThumbSlot && (
        <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden">
          {thumb ? (
            <Image
              src={thumb.src}
              width={thumb.width}
              height={thumb.height}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : swatchHex ? (
            <span
              className="h-10 w-10 rounded-full border border-white/15"
              style={{ backgroundColor: swatchHex }}
            />
          ) : null}
        </span>
      )}

      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2 font-medium text-text-primary">
            {thumb && swatchHex && (
              <span
                aria-hidden
                className="h-3 w-3 shrink-0 rounded-full border border-white/20"
                style={{ backgroundColor: swatchHex }}
              />
            )}
            {label}
          </span>
          {price && <span className="shrink-0 text-sm tabular-nums">{price}</span>}
        </span>
        {description && <span className="mt-1 block text-sm leading-snug text-text-muted">{description}</span>}
        {paletteHexes && paletteHexes.length > 0 && (
          <span aria-hidden className="mt-2 flex gap-1">
            {paletteHexes.map((hex) => (
              <span key={hex} className="h-4 w-4 border border-white/10" style={{ backgroundColor: hex }} />
            ))}
          </span>
        )}
        {consequence && <span className="mt-1 block">{consequence}</span>}
        {disabled && <span className="mt-1 block text-sm text-text-muted">{disabledNote}</span>}
      </span>
    </label>
  );
}
