"use client"

import { useState, useEffect } from "react"
import { getProductSizes, fetchInventoryItems } from "@/lib/api"

interface ProductSizesProps {
  styleCode: string
  color?: string
  showLabel?: boolean
}

/**
 * Component to display available sizes for a product
 * Uses the inventory API with SKU filter wildcard
 */
export default function ProductSizes({ 
  styleCode, 
  color, 
  showLabel = true 
}: ProductSizesProps) {
  const [sizes, setSizes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadSizes() {
      if (!styleCode) return

      setLoading(true)
      setError(null)

      try {
        const availableSizes = await getProductSizes(styleCode, color)
        setSizes(availableSizes)
      } catch (err) {
        console.error("Error loading sizes:", err)
        setError("Failed to load sizes")
      } finally {
        setLoading(false)
      }
    }

    loadSizes()
  }, [styleCode, color])

  if (loading) {
    return (
      <div className="text-xs text-gray-400">
        {showLabel && "Sizes: "}Loading...
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-xs text-red-400">
        {showLabel && "Sizes: "}{error}
      </div>
    )
  }

  if (sizes.length === 0) {
    return (
      <div className="text-xs text-gray-400">
        {showLabel && "Sizes: "}No sizes available
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {showLabel && (
        <span className="text-xs text-gray-400 mr-1">Sizes:</span>
      )}
      {sizes.map((size) => (
        <span
          key={size}
          className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-[#2a2a2a] text-white border border-[#3a3a3a]"
        >
          {size}
        </span>
      ))}
    </div>
  )
}

/**
 * Hook to fetch product sizes
 */
export function useProductSizes(styleCode: string, color?: string) {
  const [sizes, setSizes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadSizes() {
      if (!styleCode) return

      setLoading(true)
      setError(null)

      try {
        const availableSizes = await getProductSizes(styleCode, color)
        setSizes(availableSizes)
      } catch (err) {
        console.error("Error loading sizes:", err)
        setError("Failed to load sizes")
      } finally {
        setLoading(false)
      }
    }

    loadSizes()
  }, [styleCode, color])

  return { sizes, loading, error }
}

/**
 * Example: Fetch all inventory items for a specific SKU pattern
 */
export async function getInventoryItemsExample(styleCode: string, color?: string) {
  try {
    // Example 1: Get all sizes for a specific color
    // SKU filter: "5001-WHITE" - gets all sizes for style 5001 in WHITE
    const skuFilter = color ? `${styleCode}-${color}` : `${styleCode}-*`
    
    const items = await fetchInventoryItems(skuFilter)
    
    // Process the inventory items
    const sizesWithQuantity = items.map((item) => ({
      size: item.size,
      quantity: item.quantity,
      available: item.available,
      sku: item.sku,
    }))
    
    return sizesWithQuantity
  } catch (error) {
    console.error("Error fetching inventory items:", error)
    return []
  }
}


