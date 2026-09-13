"use client";

import Image from "next/image";
import { useEffect, useId, useRef } from "react";
import { creditLine } from "@/lib/visual-assets";
import type { VisualAsset } from "@/lib/visual-assets";

interface PhotoGalleryProps {
  title: string;
  photos: VisualAsset[];
  onClose: () => void;
}

// A native modal <dialog>: the browser traps focus, closes on Escape and
// returns focus to the button that opened it. Photos are shown whole, never
// cropped, each with its caption.
export default function PhotoGallery({ title, photos, onClose }: PhotoGalleryProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    // Guarded so a Strict Mode double-run doesn't throw on an already-open dialog.
    if (!dialog.open) dialog.showModal();
    closeRef.current?.focus();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      // A click on the backdrop targets the dialog itself; content clicks don't.
      onClick={(e) => {
        if (e.target === e.currentTarget) dialogRef.current?.close();
      }}
      aria-labelledby={titleId}
      className="m-auto h-[92dvh] max-h-none w-[min(72rem,94vw)] max-w-none overflow-hidden border border-border bg-bg-primary p-0 text-text-primary backdrop:bg-black/85"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-8">
          <h2 id={titleId} className="font-display text-2xl text-text-primary">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="focus-ring shrink-0 border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-white/30"
          >
            Close
          </button>
        </div>

        <ul className="flex-1 space-y-12 overflow-y-auto px-5 py-8 sm:px-8">
          {photos.map((photo) => {
            const credit = creditLine(photo);
            return (
              <li key={photo.src}>
                <figure>
                  <Image
                    src={photo.src}
                    width={photo.width}
                    height={photo.height}
                    alt={photo.alt}
                    className="mx-auto h-auto max-h-[70dvh] w-auto max-w-full"
                  />
                  <figcaption className="mx-auto mt-3 max-w-3xl text-center text-caption text-text-secondary">
                    {photo.caption}
                    {credit && <span className="text-text-muted"> · {credit}</span>}
                  </figcaption>
                </figure>
              </li>
            );
          })}
        </ul>
      </div>
    </dialog>
  );
}
