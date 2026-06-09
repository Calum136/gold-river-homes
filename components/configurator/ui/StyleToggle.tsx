interface StyleToggleOption {
  id: string;
  label: string;
}

interface StyleToggleProps {
  options: StyleToggleOption[];
  selectedId: string;
  onChange: (id: string) => void;
}

export default function StyleToggle({ options, selectedId, onChange }: StyleToggleProps) {
  return (
    <div className="flex border border-border rounded overflow-hidden">
      {options.map((opt, i) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`flex-1 text-xs font-medium px-3 py-2 transition-colors duration-150 ${
            i > 0 ? "border-l border-border" : ""
          } ${
            selectedId === opt.id
              ? "bg-gold/20 text-gold"
              : "text-text-muted hover:text-text-secondary hover:bg-white/5"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
