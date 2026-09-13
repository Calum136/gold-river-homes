"use client";

import type { StageResolution } from "@/lib/stage";
import CrossfadeImage from "./ui/CrossfadeImage";
import PhotoStack from "./PhotoStack";

// The stage: one real photo filling its positioned parent, with nothing drawn
// on top. resolveStage() in lib/stage.ts picks the photo; its caption and the
// other controls live in StageChrome, outside the photo.
export default function HomeVisualizer({ stage }: { stage: StageResolution }) {
  const { primary } = stage;

  return (
    <div className="absolute inset-0 overflow-hidden bg-bg-tertiary">
      {primary?.stack ? (
        <PhotoStack stack={primary.stack} alt={primary.alt} />
      ) : primary?.asset ? (
        <CrossfadeImage
          asset={primary.asset}
          eager
          // Exteriors keep the house and ground and give up sky; rooms stay centred.
          objectPosition={stage.view === "exterior" ? "50% 60%" : "50% 50%"}
        />
      ) : null}
    </div>
  );
}
