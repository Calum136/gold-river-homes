"use client";

import CrossfadeImage from "./ui/CrossfadeImage";
import { creditLine } from "@/lib/visual-assets";
import type { StageExample } from "@/lib/stage";

// A captioned real photo of the choice being decided, shown beside the
// question and never drawn on. When the selected choice has no approved photo,
// the frame holds just the choice (its name, and its swatch if it has one), so
// the options below it don't jump as the buyer clicks.
export default function OptionExample({ example, className = "" }: { example: StageExample; className?: string }) {
  const { asset, choice } = example;
  const credit = asset ? creditLine(asset) : null;

  return (
    <figure className={className}>
      <div className="relative aspect-[16/10] overflow-hidden bg-bg-elevated">
        {asset ? (
          <CrossfadeImage asset={asset} />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
            {choice.swatchHex && (
              <span
                aria-hidden
                className="h-16 w-16 rounded-full border border-white/15"
                style={{ backgroundColor: choice.swatchHex }}
              />
            )}
            <span className="font-display text-title text-text-primary">{choice.label}</span>
          </div>
        )}
      </div>
      <figcaption className="mt-2 min-h-[2.5rem] text-caption text-text-muted">
        {asset && (
          <>
            {asset.caption}
            {credit && <> · {credit}</>}
          </>
        )}
      </figcaption>
    </figure>
  );
}
