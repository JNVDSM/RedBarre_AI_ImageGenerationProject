"use client"

import { Shirt, Hourglass, Package, Footprints, Briefcase, HardHat, Dock } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import type { Product } from "@/types/product"

interface ProductCategoriesProps {
  products: Product[]
  selectedCategories: Set<string>
  onCategoryToggle: (category: string) => void
  showCounts?: boolean
  includeEmpty?: boolean
  compact?: boolean
  showAllOption?: boolean
  onSelectAll?: () => void
}

export default function ProductCategories({
  products,
  selectedCategories,
  onCategoryToggle,
  showCounts = true,
  includeEmpty = false,
  compact = false,
  showAllOption = false,
  onSelectAll,
}: ProductCategoriesProps) {
  const [viewAll, setViewAll] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const carouselRef = useRef<HTMLDivElement | null>(null)

  // Count products by category
  const categoryCounts = useMemo(
    () =>
      products.reduce((acc, product) => {
        if (product.productType) {
          acc[product.productType] = (acc[product.productType] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>),
    [products],
  )

  const categories = useMemo(
    () => [
      { name: "T-Shirts", icon: Shirt },
      { name: "Longsleeve T-Shirts", icon: Shirt },
      { name: "Crew Sweatshirts", icon: Hourglass },
      { name: "Zip Sweatshirts", icon: Package },
      { name: "Singlets / Tanks", icon: Shirt },
      { name: "Hooded Sweatshirts", icon: Package },
      { name: "Trackpants", icon: Footprints },
      { name: "Shorts", icon: Footprints },
      { name: "Shirts", icon: Shirt },
      { name: "Dresses", icon: Shirt },
      { name: "Bags", icon: Briefcase },
      { name: "Headwear", icon: HardHat },
      { name: "Underwear", icon: Shirt },
      { name: "Socks", icon: Dock },
      { name: "Aprons", icon: Package },
      { name: "Belts", icon: Package },
    ],
    [],
  )

  const renderedCategories = useMemo(
    () => (includeEmpty ? categories : categories.filter(({ name }) => (categoryCounts[name] || 0) > 0)),
    [categories, categoryCounts, includeEmpty],
  )

  useEffect(() => {
    const element = carouselRef.current
    if (!element) return

    const updateScrollButtons = () => {
      const { scrollLeft, scrollWidth, clientWidth } = element
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1)
    }

    updateScrollButtons()
    element.addEventListener("scroll", updateScrollButtons)
    window.addEventListener("resize", updateScrollButtons)

    return () => {
      element.removeEventListener("scroll", updateScrollButtons)
      window.removeEventListener("resize", updateScrollButtons)
    }
  }, [renderedCategories.length])

  const handleScroll = (direction: "left" | "right") => {
    const element = carouselRef.current
    if (!element) return

    const scrollAmount = element.clientWidth * 0.8
    const delta = direction === "left" ? -scrollAmount : scrollAmount
    element.scrollBy({ left: delta, behavior: "smooth" })
  }

  const renderCategoryButton = (name: string, Icon: typeof Shirt) => {
    const count = categoryCounts[name] || 0
    if (!includeEmpty && count === 0) return null

    const isSelected = selectedCategories.has(name)
    const isUnavailable = includeEmpty && count === 0

    return (
      <button
        key={name}
        onClick={() => onCategoryToggle(name)}
        className={`min-w-[140px] md:min-w-[170px] ${compact ? "p-3" : "p-3.5 md:p-4"} rounded-lg border transition-all duration-300 hover:cursor-pointer ${
          isSelected
            ? "bg-white  text-black border-[#c0e33d]"
            : "bg-[#1a1a1a] text-gray-300 border-[#2a2a2a] hover:border-[#99C542] hover:scale-90 hover:shadow-lg hover:shadow-lime-400/20"
        } ${
          isUnavailable && !isSelected
            ? "opacity-50 hover:scale-100 hover:shadow-none hover:border-[#2a2a2a]"
            : ""
        }`}
      >
        <Icon className={`${compact ? "w-6 h-6" : "w-8 h-8"} mx-auto mb-2`} />
        <div className={`${compact ? "text-xs" : "text-sm"} font-medium mb-1 text-center`}>{name}</div>
        {showCounts && <div className="text-xs text-gray-500" />}
      </button>
    )
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Product Categories</h2>
        {renderedCategories.length > 0 && (
          <div className="flex items-center gap-2">
            {showAllOption && (
              <button
                onClick={() => {
                  onSelectAll && onSelectAll()
                  setViewAll((prev) => !prev)
                }}
                className="text-xs font-semibold text-[#99C542] hover:text-lime-300"
              >
                {viewAll ? "Show Carousel" : "View All"}
              </button>
            )}
            {!includeEmpty && !showAllOption && (
              <button
                onClick={() => setViewAll((prev) => !prev)}
                className="text-xs font-semibold text-[#99C542] hover:text-lime-300"
              >
                {viewAll ? "Show Carousel" : "View All"}
              </button>
            )}
          </div>
        )}
      </div>

      {renderedCategories.length === 0 ? (
        <div className="text-sm text-gray-500 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 text-center">
          No categories available.
        </div>
      ) : (
        <div
          className={
            viewAll
              ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3"
              : "relative"
          }
        >
          {viewAll ? (
            renderedCategories.map(({ name, icon }) => renderCategoryButton(name, icon))
          ) : (
            <div className="overflow-hidden border border-[#1f1f1f] bg-[#0f0f0f] rounded-xl px-2 py-3 md:px-3 md:py-3 w-full">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleScroll("left")}
                  disabled={!canScrollLeft}
                  className="hidden md:inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#2a2a2a] bg-[#101010]/90 text-gray-300 hover:text-white hover:border-[#99C542] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ‹
                </button>

                <div className="flex-1 overflow-hidden">
                  <div
                    ref={carouselRef}
                    className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none]"
                    style={{ scrollbarWidth: "none" }}
                  >
                    <div className="flex gap-3 md:gap-4 pr-4 w-[700px]">
                      {renderedCategories.map(({ name, icon }) => renderCategoryButton(name, icon))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleScroll("right")}
                  disabled={!canScrollRight}
                  className="hidden md:inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#2a2a2a] bg-[#101010]/90 text-gray-300 hover:text-white hover:border-[#99C542] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
