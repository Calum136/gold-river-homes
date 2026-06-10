import type { RenderStack } from "@/lib/renders";

// Composites pre-rendered photoreal layers (Phase 7). All layers share one
// locked camera, so plain stacking produces the exact configured home.
export default function PhotoStack({ stack, alt }: { stack: RenderStack; alt: string }) {
  const layers = [stack.base, stack.siding, stack.roof, stack.trim, stack.porch].filter(
    (src): src is string => !!src
  );
  return (
    <div className="absolute inset-0">
      {layers.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={i === 0 ? alt : ""}
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain select-none"
        />
      ))}
    </div>
  );
}
