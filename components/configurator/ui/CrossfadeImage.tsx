"use client";

import Image from "next/image";
import { useState } from "react";
import type { VisualAsset } from "@/lib/visual-assets";

interface CrossfadeImageProps {
  asset: VisualAsset;
  /** CSS object-position for the cover crop. */
  objectPosition?: string;
  /** For the stage photo, the page's largest paint: load immediately. */
  eager?: boolean;
}

// Fills its positioned parent with an object-fit: cover photo. When `asset`
// changes, the last photo that finished loading stays underneath while the new
// one fades in over 200 ms, so the frame never flashes empty. The
// reduced-motion rule in globals.css removes the fade.
export default function CrossfadeImage({ asset, objectPosition = "50% 50%", eager = false }: CrossfadeImageProps) {
  const [current, setCurrent] = useState(asset);
  const [previous, setPrevious] = useState<VisualAsset | null>(null);
  const [loadedSrc, setLoadedSrc] = useState(asset.src);

  // Adjust state while rendering when the prop changes (React's documented
  // alternative to an effect here).
  if (asset.src !== current.src) {
    setPrevious(loadedSrc === current.src ? current : previous);
    setCurrent(asset);
  }

  const cover = "absolute inset-0 h-full w-full object-cover";

  return (
    <>
      {previous && previous.src !== current.src && (
        <Image
          key={previous.src}
          src={previous.src}
          width={previous.width}
          height={previous.height}
          alt=""
          aria-hidden
          loading="eager"
          className={cover}
          style={{ objectPosition }}
        />
      )}
      <Image
        key={current.src}
        src={current.src}
        width={current.width}
        height={current.height}
        alt={current.alt}
        loading={eager ? "eager" : undefined}
        fetchPriority={eager ? "high" : undefined}
        onLoad={() => setLoadedSrc(current.src)}
        className={`${cover} transition-opacity duration-200 ease-out ${
          loadedSrc === current.src ? "opacity-100" : "opacity-0"
        }`}
        style={{ objectPosition }}
      />
    </>
  );
}
