const FILTERS = [
  { name: "normal", label: "Normal", css: "none" },
  { name: "warm", label: "Warm", css: "saturate(1.2) sepia(0.2)" },
  { name: "cool", label: "Cool", css: "saturate(1.05) hue-rotate(20deg)" },
  { name: "vintage", label: "Vintage", css: "sepia(0.45) contrast(0.95)" },
  { name: "bw", label: "B&W", css: "grayscale(1)" },
  { name: "fade", label: "Fade", css: "brightness(1.05) contrast(0.85)" },
  { name: "vivid", label: "Vivid", css: "saturate(1.4) contrast(1.15)" },
  { name: "drama", label: "Drama", css: "contrast(1.3) saturate(0.9)" }
];

export default function FilterPicker({ value, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {FILTERS.map((filter) => (
        <button
          key={filter.name}
          type="button"
          onClick={() => onChange?.(filter)}
          className={`min-h-11 rounded-full px-4 text-xs font-semibold ${
            value?.name === filter.name
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
