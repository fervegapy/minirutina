interface StepIndicatorProps {
  steps: string[];
  current: number;
}

export default function StepIndicator({ steps, current }: StepIndicatorProps) {
  const pct = Math.round(((current) / (steps.length - 1)) * 100);

  return (
    <div className="mb-8">
      {/* Progress bar */}
      <div className="h-1.5 bg-[#e5e7eb] rounded-full mb-3 overflow-hidden">
        <div
          className="h-full bg-[#ecbc5d] rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      {/* Step label */}
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-[#233933]/50 uppercase tracking-wide">
          Paso {current + 1} de {steps.length}
        </span>
        <span className="text-xs font-bold text-[#233933]">
          {steps[current]}
        </span>
      </div>
    </div>
  );
}
