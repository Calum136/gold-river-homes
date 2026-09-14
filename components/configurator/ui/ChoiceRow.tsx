import Image from "next/image";
import type { ReactNode } from "react";
import { formatCurrency } from "@/lib/calculator";
import type { VisualAsset } from "@/lib/visual-assets";

/**
 * "Included" for no added cost (the choice already selected shows this, since
 * its own delta is 0). Otherwise the exact change in the total this choice
 * would cause — "+$1,200" or "−$1,200" — with a quiet "est." marker, since
 * every figure here is an estimate, not a quote.
 */
export function PriceDelta({ amount }: { amount: number }) {
  if (amount === 0) {
    return <span className="text-caption text-text-muted">Included</span>;
  }
  return (
    <span className="whitespace-nowrap font-accent text-figure-sm tabular-nums text-text-primary">
      {amount > 0 ? "+" : "−"}
      {formatCurrency(Math.abs(amount))}{" "}
      <span className="font-body text-caption font-normal normal-case tracking-normal text-text-muted">est.</span>
    </span>
  );
}

/**
 * How a choice would move the estimated monthly payment, relative to the
 * buyer's current selections: "+$38/mo" or "−$12/mo". Renders nothing when
 * there's no change, which includes the choice already selected. Amounts come
 * from monthlyDeltaFor() in lib/pricing.ts.
 */
export function MonthlyDelta({ amount }: { amount: number | null | undefined }) {
  if (!amount) return null;
  return (
    <span className="whitespace-nowrap font-accent text-figure-sm tabular-nums text-text-secondary">
      {amount > 0 ? "+" : "−"}
      {formatCurrency(Math.abs(amount))}
      <span aria-hidden>/mo</span>
      <span className="sr-only"> a month</span>
    </span>
  );
}

/** A quiet caption-size label beside a choice or card, e.g. "Supreme standard" or "Example lot". */
export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="shrink-0 self-start border border-border px-1.5 py-0.5 text-caption uppercase tracking-eyebrow text-text-muted">
      {children}
    </span>
  );
}

export function ChoiceGroup({
  legend,
  showLegend = false,
  children,
}: {
  legend: string;
  /** The screen's question usually names the group, so the legend is for screen readers unless asked. */
  showLegend?: boolean;
  children: ReactNode;
}) {
  return (
    <fieldset className="min-w-0">
      <legend
        className={
          showLegend ? "mb-3 text-eyebrow font-medium uppercase tracking-eyebrow text-text-muted" : "sr-only"
        }
      >
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

/**
 * Row classes shared by every radio row and card: border states plus a visible
 * keyboard focus ring. `relative` contains the visually hidden (absolutely
 * positioned) radio, so it can't widen the page or escape a scrolling panel.
 */
export function choiceRowClass(checked: boolean, disabled = false): string {
  const state = disabled
    ? "cursor-not-allowed border-border/50 opacity-50"
    : checked
    ? "cursor-pointer border-gold bg-gold/[0.06]"
    : "cursor-pointer border-border hover:border-white/25";
  return `focus-ring-within relative border transition-colors duration-150 ${state}`;
}

interface ChoiceRowProps {
  /** Radio group name, shared by every row in the group. */
  name: string;
  value: string;
  label: string;
  /** The approved one-sentence reason this choice matters, shown in full under the label. */
  reason?: string;
  /** Quiet caption-size label next to the name, e.g. "Supreme standard". */
  tag?: string;
  /** Right-aligned price, e.g. <PriceDelta amount={1200} />. */
  price?: ReactNode;
  /** Change in the estimated monthly payment if this row were chosen; see MonthlyDelta. */
  monthlyDelta?: number | null;
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
}

// One choice as a native radio: Tab reaches the group, arrow keys move the
// selection, and the focus ring shows on the whole row. The row states what
// the choice costs, how it moves the monthly payment, and why it matters.
export default function ChoiceRow({
  name,
  value,
  label,
  reason,
  tag,
  price,
  monthlyDelta,
  checked,
  onSelect,
  disabled = false,
  disabledNote = "Not available on this model",
  thumb,
  swatchHex,
  reserveThumb = false,
  paletteHexes,
}: ChoiceRowProps) {
  const showThumbSlot = reserveThumb || !!thumb || !!swatchHex;

  return (
    <label className={`flex items-start gap-3 px-4 py-4 sm:gap-4 ${choiceRowClass(checked, disabled)}`}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        className="sr-only"
      />
      {/* Centred on the label's first line. */}
      <span className="flex h-[1.6rem] shrink-0 items-center">
        <RadioMark checked={checked} />
      </span>

      {showThumbSlot && (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden sm:h-14 sm:w-14">
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
          <span className="flex min-w-0 items-center gap-2 text-body font-medium text-text-primary">
            {thumb && swatchHex && (
              <span
                aria-hidden
                className="h-3 w-3 shrink-0 rounded-full border border-white/20"
                style={{ backgroundColor: swatchHex }}
              />
            )}
            {label}
            {tag && <Tag>{tag}</Tag>}
          </span>
          {(price || !!monthlyDelta) && (
            <span className="flex shrink-0 flex-col items-end tabular-nums">
              {price}
              <MonthlyDelta amount={monthlyDelta} />
            </span>
          )}
        </span>
        {reason && <span className="mt-1 block text-body-sm text-text-muted">{reason}</span>}
        {paletteHexes && paletteHexes.length > 0 && (
          <span aria-hidden className="mt-2 flex gap-1">
            {paletteHexes.map((hex) => (
              <span key={hex} className="h-4 w-4 border border-white/10" style={{ backgroundColor: hex }} />
            ))}
          </span>
        )}
        {disabled && <span className="mt-1 block text-caption text-text-muted">{disabledNote}</span>}
      </span>
    </label>
  );
}
