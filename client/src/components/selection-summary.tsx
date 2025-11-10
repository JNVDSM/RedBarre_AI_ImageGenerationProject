"use client"

import { useNavigate } from "react-router-dom"
import { Package, X, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Product, ProductImage } from "@/types/product"
import type { SavedProduct } from "@/lib/storage"
import { publishProducts, clearAllProducts } from "@/lib/storage"

interface SelectionSummaryProps {
  savedProducts: SavedProduct[]
  products: Product[]
  productImages: Record<string, ProductImage[]>
  colourMap: Record<string, { hex: string; hex2?: string }>
  onClearAll: () => void
  onSave: () => void
  onRemoveProduct: (styleCode: string) => void
  onEditProduct: (styleCode: string) => void
}

export default function SelectionSummary({
  savedProducts,
  products,
  productImages,
  colourMap,
  onClearAll,
  onSave,
  onRemoveProduct,
  onEditProduct,
}: SelectionSummaryProps) {
  const navigate = useNavigate()
  
  // Calculate totals
  const totalColors = savedProducts.reduce((sum, product) => sum + product.selectedColors.length, 0)
  const canSave = savedProducts.length > 0 && totalColors > 0
  
  const getColourStyle = (color: string) => {
    const entry = colourMap[color.toUpperCase()]
    if (!entry) {
      return { backgroundColor: "#d4d4d4" }
    }

    if (entry.hex2) {
      return {
        backgroundImage: `linear-gradient(135deg, ${entry.hex}, ${entry.hex2})`,
      }
    }

    return { backgroundColor: entry.hex }
  }

  const handleSave = () => {
    // Publish products to localStorage
    publishProducts(savedProducts)

    onSave()
    clearAllProducts()
    onClearAll()

    console.log(
      `Successfully published ${savedProducts.length} product(s)! They are now visible in Creator mode.`,
    )
    // Redirect to main page after save
    navigate("/products")
  }

  return (
    <div className="w-full lg:w-80 flex-shrink-0 bg-[#0f0f0f] border-l border-[#1a1a1a] pl-6 pr-6 pt-6 pb-4 flex flex-col h-screen fixed top-0 right-0">
      <div className="border-b border-[#1a1a1a] pb-4 mb-4">
        <h2 className="text-lg font-bold mb-4">Selection Summary</h2>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#1a1a1a] rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-lime-400">{savedProducts.length}</div>
            <div className="text-xs text-gray-500 uppercase">Products</div>
          </div>
          <div className="bg-[#1a1a1a] rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-lime-400">{totalColors}</div>
            <div className="text-xs text-gray-500 uppercase">Colors</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        {savedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Package className="w-16 h-16 text-gray-700 mb-4" />
            <p className="text-gray-500 mb-2">No products selected yet</p>
            <p className="text-sm text-gray-600">Click on a product to select colors and save</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedProducts.map((savedProduct) => {
              const product = products.find((p) => p.styleCode === savedProduct.styleCode)
              const productName = product?.styleName || savedProduct.styleName
              const productType = product?.productType || savedProduct.productType
              const images = productImages[savedProduct.styleCode] || []
              
              // Get primary image
              const primaryImage =
                images.find((img) => img.imageType === "MAIN") ||
                images.find((img) => img.imageType === "FRONT") ||
                images.find((img) => img.imageType && img.imageType !== "" && !img.imageType.includes("BACK")) ||
                images.find((img) => img.urlStandard) ||
                images[0]

              return (
                <div key={savedProduct.styleCode} className="bg-[#1a1a1a] rounded-lg p-3">
                  <div className="flex items-start gap-3 mb-2">
                    {/* Product Image */}
                    <div className="w-16 h-16 bg-[#0f0f0f] rounded overflow-hidden relative flex-shrink-0">
                      {primaryImage?.urlThumbnail || primaryImage?.urlStandard ? (
                        <img
                          src={primaryImage.urlThumbnail || primaryImage.urlStandard}
                          alt={productName}
                          className="absolute inset-0 h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-700" />
                        </div>
                      )}
                    </div>
                    
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm mb-1 truncate">{productName}</div>
                          <div className="text-xs text-gray-500">
                            {savedProduct.styleCode} | {productType}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <button
                            onClick={() => onEditProduct(savedProduct.styleCode)}
                            className="p-1.5 rounded-full bg-[#99C542] hover:bg-lime-300 text-black transition-colors"
                            title="Edit colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onRemoveProduct(savedProduct.styleCode)}
                            className="text-gray-500 hover:text-white transition-colors"
                            title="Remove product"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {savedProduct.selectedColors.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {savedProduct.selectedColors.map((color) => (
                            <span
                              key={color}
                              className="flex items-center gap-2 text-xs bg-[#252525] px-2 py-1 rounded"
                            >
                              <span
                                className="w-3 h-3 rounded-full border border-[#0f0f0f]"
                                    style={getColourStyle(color)}
                              />
                              <span>{color}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 left-0 right-0 -mx-6 px-6 pt-4 pb-4 bg-[#0f0f0f]/95 border-t border-[#1a1a1a] z-20">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={onClearAll}
            variant="outline"
            className="flex-1 bg-transparent border-[#2a2a2a] text-white hover:bg-[#1a1a1a] hover:text-white"
          >
            Clear All
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save & Publish
          </Button>
        </div>
      </div>
    </div>
  )
}
