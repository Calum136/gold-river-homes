interface ColorSwatchProps {
  hex: string;
  label: string;
  selected: boolean;
  onClick: () => void;
  size?: "sm" | "md";
}

export default function ColorSwatch({ hex, label, selected, onClick, size = "md" }: ColorSwatchProps) {
  const dim = size === "sm" ? "w-7 h-7" : "w-9 h-9";
  return (
    <button
      onClick={onClick}
      title={label}
      className={`${dim} rounded-full border-2 transition-all duration-150 shrink-0 ${
        selected
          ? "border-gold shadow-[0_0_0_2px_rgba(151,118,78,0.4)]"
          : "border-white/10 hover:border-white/30"
      }`}
      style={{ backgroundColor: hex }}
    />
  );
}
