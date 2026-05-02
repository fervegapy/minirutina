export const COLORES = [
  { label: "Verde salvia", value: "#a8c5a0", bg: "#a8c5a0" },
  { label: "Rosa polvoso", value: "#e8b4b8", bg: "#e8b4b8" },
  { label: "Azul cielo", value: "#a8c8e8", bg: "#a8c8e8" },
  { label: "Amarillo cálido", value: "#f5d78e", bg: "#f5d78e" },
] as const;

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-4 justify-center">
      {COLORES.map((c) => (
        <button
          key={c.value}
          type="button"
          onClick={() => onChange(c.value)}
          className={`w-14 h-14 rounded-xl border-4 transition-all focus:outline-none ${
            value === c.value
              ? "border-[#233933] scale-110 shadow-sm"
              : "border-transparent hover:border-[#e5e7eb]"
          }`}
          style={{ backgroundColor: c.bg }}
          aria-label={c.label}
          title={c.label}
        />
      ))}
    </div>
  );
}
