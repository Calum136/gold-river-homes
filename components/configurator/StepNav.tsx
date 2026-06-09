interface StepNavProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
  onStepClick: (step: number) => void;
}

export default function StepNav({ currentStep, totalSteps, labels, onStepClick }: StepNavProps) {
  return (
    <nav className="flex items-center gap-0 overflow-x-auto">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
        const done = step < currentStep;
        const active = step === currentStep;
        return (
          <button
            key={step}
            onClick={() => done && onStepClick(step)}
            disabled={!done}
            className={`flex items-center gap-2 shrink-0 px-3 py-2 text-xs font-medium transition-colors duration-150 ${
              done ? "cursor-pointer hover:text-gold" : "cursor-default"
            } ${active ? "text-gold" : done ? "text-text-secondary" : "text-text-muted/40"}`}
          >
            <span
              className={`w-6 h-6 rounded-full border flex items-center justify-center text-[11px] font-bold transition-colors ${
                active
                  ? "bg-gold border-gold text-white"
                  : done
                  ? "bg-gold/20 border-gold/50 text-gold"
                  : "border-border text-text-muted/40"
              }`}
            >
              {done ? (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="2 6 5 9 10 3" />
                </svg>
              ) : (
                step
              )}
            </span>
            <span className="hidden sm:inline">{labels[step - 1]}</span>
          </button>
        );
      })}
    </nav>
  );
}
