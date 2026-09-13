interface StepNavProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
  onStepClick: (step: number) => void;
}

// The six phases, compact enough for the slim header: numbered marks on phones
// and tablets, marks with labels on desktop. Completed phases are links back.
export default function StepNav({ currentStep, totalSteps, labels, onStepClick }: StepNavProps) {
  return (
    <nav aria-label="Configurator sections" className="flex items-center gap-1 overflow-x-auto lg:gap-2">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
        const done = step < currentStep;
        const active = step === currentStep;
        const label = labels[step - 1];
        return (
          <button
            key={step}
            type="button"
            onClick={() => done && onStepClick(step)}
            disabled={!done}
            aria-current={active ? "step" : undefined}
            aria-label={label}
            className={`focus-ring flex shrink-0 items-center gap-2 px-0.5 py-2 text-caption font-medium transition-colors duration-150 lg:px-2 ${
              done ? "cursor-pointer hover:text-gold" : "cursor-default"
            } ${active ? "text-gold" : done ? "text-text-secondary" : "text-text-muted"}`}
          >
            <span
              aria-hidden
              className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                active
                  ? "border-gold bg-gold text-white"
                  : done
                  ? "border-gold/50 bg-gold/20 text-gold"
                  : "border-border text-text-muted"
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
            <span aria-hidden className="hidden lg:inline">
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
