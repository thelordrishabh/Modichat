const COLORS = [
  { key: "blue", className: "bg-blue-500" },
  { key: "emerald", className: "bg-emerald-500" },
  { key: "violet", className: "bg-violet-500" },
  { key: "rose", className: "bg-rose-500" },
  { key: "amber", className: "bg-amber-500" },
  { key: "cyan", className: "bg-cyan-500" },
  { key: "lime", className: "bg-lime-500" },
  { key: "fuchsia", className: "bg-fuchsia-500" }
];

export default function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLORS.map((color) => (
        <button
          key={color.key}
          type="button"
          onClick={() => onChange?.(color.key)}
          className={`min-h-11 min-w-11 rounded-full border-2 ${
            value === color.key ? "border-black dark:border-white" : "border-transparent"
          } ${color.className}`}
        />
      ))}
    </div>
  );
}
