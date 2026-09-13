"use client";

import { useState } from "react";
import { stageNote } from "@/lib/copy";
import { creditLine, getModelGallery } from "@/lib/visual-assets";
import type { StageResolution } from "@/lib/stage";
import PhotoGallery from "./PhotoGallery";

interface StageChromeProps {
  stage: StageResolution;
  model: { id: string; name: string } | null;
  className?: string;
}

// The one quiet region for everything about the stage photo: what it shows,
// the model's other photos, and the single note on where photos come from.
// Nothing is ever drawn over the photo itself.
export default function StageChrome({ stage, model, className = "" }: StageChromeProps) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const gallery = getModelGallery(model?.id ?? null);
  const { primary } = stage;
  const credit = primary?.asset ? creditLine(primary.asset) : null;

  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0 space-y-0.5">
        {primary && (
          <p className="text-sm text-text-secondary">
            {primary.caption}
            {credit && <span className="text-text-muted"> · {credit}</span>}
          </p>
        )}
        <p className="text-sm text-text-muted">{stageNote}</p>
      </div>

      {model && gallery.length > 1 && (
        <button
          type="button"
          onClick={() => setGalleryOpen(true)}
          aria-haspopup="dialog"
          className="focus-ring shrink-0 border border-border px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-white/30"
        >
          More photos <span className="tabular-nums text-text-muted">({gallery.length})</span>
        </button>
      )}

      {galleryOpen && model && (
        <PhotoGallery title={`${model.name} photos`} photos={gallery} onClose={() => setGalleryOpen(false)} />
      )}
    </div>
  );
}
