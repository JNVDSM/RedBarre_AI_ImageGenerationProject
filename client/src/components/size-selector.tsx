"use client"

interface SizeSelectorProps {
  sizes: string[]
  selectedSizes: Set<string>
  onSizeToggle: (size: string) => void
}

export default function SizeSelector({ sizes, selectedSizes, onSizeToggle }: SizeSelectorProps) {
  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Available Sizes</h2>
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => (
          <button
            key={size}
            onClick={() => onSizeToggle(size)}
            className={`px-6 py-3 rounded-md text-sm font-medium transition-all ${
              selectedSizes.has(size)
                ? "bg-white text-black"
                : "bg-[#1a1a1a] text-gray-300 border border-[#2a2a2a] hover:border-[#3a3a3a]"
            }`}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  )
}
