"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Package } from "lucide-react"
import type { Product, ProductImage } from "@/types/product"

interface ProductCardProps {
  product: Product
  images: ProductImage[]
  isImageFetching?: boolean
}

export default function ProductCard({ product, images, isImageFetching = false }: ProductCardProps) {
  const navigate = useNavigate()
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isImageLoading, setIsImageLoading] = useState(true)

  const handleClick = () => {
    // Navigate to product detail page
    navigate(`/products/${product.styleCode}`)
  }

  // Get the best available image (prefer MAIN, then FRONT, then any color, then any non-back/thumb)
  const primaryImage =
    images.find((img) => img.imageType === "MAIN") ||
    images.find((img) => img.imageType === "FRONT") ||
    images.find((img) => img.imageType && img.imageType !== "" && !img.imageType.includes("BACK") && !img.imageType.includes("THUMB")) ||
    images.find((img) => img.urlStandard) ||
    images[0]

  useEffect(() => {
    setImageError(false)
  }, [product.styleCode, primaryImage?.urlStandard])

  useEffect(() => {
    if (isImageFetching) {
      setIsImageLoading(true)
      return
    }

    setIsImageLoading(!!primaryImage?.urlStandard)
  }, [isImageFetching, primaryImage?.urlStandard])

  const weight = product.productWeight || "N/A"
  const fit = product.fit || "Regular"
  const material = product.composition
    ? product.composition
        .split(",")[0]
        .replace(/^\d+\s*oz,?\s*/i, "")
        .trim()
    : "N/A"
  const gender = product.gender || "Unisex"
  const coreRange = product.coreRange || "N/A"

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group rounded-lg overflow-hidden border border-[#2a2a2a] hover:border-[#99C542] transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-lime-400/20 cursor-pointer text-left"
    >
      {/* Product Image */}
      <div className="aspect-square bg-[#1a1a1a] relative overflow-hidden">
        {primaryImage?.urlStandard && !imageError ? (
          <img
            src={primaryImage.urlStandard}
            alt={product.styleName}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => {
              setImageError(true)
              setIsImageLoading(false)
            }}
            onLoad={() => setIsImageLoading(false)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <Package className="w-12 h-12" />
          </div>
        )}

        {(isImageLoading || isImageFetching) && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="h-10 w-10 border-2 border-lime-400/70 border-t-transparent rounded-full animate-spin" />
          </div>
        )}


        {/* Hover Overlay with Details - Appears over the product image */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/95 via-black/90 to-black/80 transition-all duration-300 flex flex-col justify-end p-4 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="space-y-3 text-left">
            <div>
              <div className="text-base font-bold text-white mb-1 line-clamp-1">{product.styleName}</div>
              <div className="text-xs text-gray-300 font-mono">{product.styleCode}</div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Type:</span>
                <span className="font-medium text-white">{product.productType || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Weight:</span>
                <span className="font-medium text-white">{weight}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Fit:</span>
                <span className="font-medium text-white">{fit}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Gender:</span>
                <span className="font-medium text-white">{gender}</span>
              </div>
              {product.composition && (
                <div className="flex justify-between items-start">
                  <span className="text-gray-400">Material:</span>
                  <span className="font-medium text-white text-right max-w-[60%] line-clamp-2">{material}</span>
                </div>
              )}
              {coreRange !== "N/A" && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Collection:</span>
                  <span className="font-medium text-white text-right max-w-[60%] truncate">{coreRange}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Info Below Image */}
      <div className="bg-[#0f0f0f] p-3">
        <div className="text-sm font-medium text-white line-clamp-1 mb-1">{product.styleName}</div>
        <div className="text-xs text-gray-500">{product.styleCode}</div>
      </div>
    </button>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="relative rounded-lg overflow-hidden border border-[#2a2a2a] bg-[#0f0f0f] animate-pulse">
      <div className="aspect-square bg-[#1a1a1a]" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-[#2a2a2a] rounded" />
        <div className="h-3 bg-[#2a2a2a] rounded w-1/2" />
      </div>
    </div>
  )
}

