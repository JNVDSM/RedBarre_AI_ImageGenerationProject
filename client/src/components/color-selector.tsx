"use client"

interface ColorSelectorProps {
  colors: string[]
  selectedColors: Set<string>
  onColorToggle: (color: string) => void
  colourMap?: Record<string, { hex: string; hex2?: string }>
}

export default function ColorSelector({ colors, selectedColors, onColorToggle, colourMap }: ColorSelectorProps) {
  const getColorHex = (colorName: string): string => {
    if (!colourMap) return "#666666"
    
    const colourData = colourMap[colorName.toUpperCase()]
    if (colourData?.hex) {
      return colourData.hex
    }
    
    // Fallback to common colors if not in API
    const fallbackMap: Record<string, string> = {
      BLACK: "#000000",
      WHITE: "#FFFFFF",
      NAVY: "#1E3A8A",
      GREY: "#808080",
      GRAY: "#808080",
    }
    
    return fallbackMap[colorName.toUpperCase()] || "#666666"
  }

  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">
        Available Colors {colors.length > 0 && `(${colors.length})`}
      </h2>
      <div className="flex flex-wrap gap-3">
        {colors.map((color) => {
          const bgColor = getColorHex(color)
          const isSelected = selectedColors.has(color)

          return (
            <button key={color} onClick={() => onColorToggle(color)} className="flex flex-col items-center gap-2 group">
              <div
                className={`w-12 h-12 rounded-full border-2 transition-all ${
                  isSelected
                    ? "border-[#99C542] ring-2 ring-lime-400/20 scale-110"
                    : "border-[#2a2a2a] group-hover:border-lime-400"
                }`}
                style={{ backgroundColor: bgColor }}
              />
              <span className="text-xs text-gray-400">{color}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
