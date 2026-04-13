"use client";

interface OptionToggleProps {
  optionA: { label: string; value: string };
  optionB: { label: string; value: string };
  selected: string;
  onChange: (value: string) => void;
}

export default function OptionToggle({
  optionA,
  optionB,
  selected,
  onChange,
}: OptionToggleProps) {
  return (
    <div className="flex gap-2 mb-3">
      {[optionA, optionB].map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-2 px-4 text-sm font-medium uppercase tracking-wider transition-all duration-200 border ${
            selected === opt.value
              ? "bg-gold/15 border-gold text-gold"
              : "bg-input-bg border-border text-text-muted hover:border-border-gold hover:text-text-secondary"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
