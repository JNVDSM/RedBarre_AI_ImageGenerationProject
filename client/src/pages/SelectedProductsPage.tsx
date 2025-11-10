import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Package } from "lucide-react"
import { getSavedProducts, getPublishedProducts, type SavedProduct } from "@/lib/storage"
import { fetchColours, fetchProductImages } from "@/lib/api"

interface ProductImageItem {
  urlThumbnail?: string
  urlStandard?: string
  imageType?: string
}

export default function SelectedProductsPage() {
  const [selectedProducts, setSelectedProducts] = useState<SavedProduct[]>([])
  const [publishedProducts, setPublishedProducts] = useState<SavedProduct[]>([])
  const [productImages, setProductImages] = useState<Record<string, ProductImageItem[]>>({})
  const [colourMap, setColourMap] = useState<Record<string, { hex: string; hex2?: string }>>({})

  useEffect(() => {
    const saved = getSavedProducts()
    setSelectedProducts(saved)
    const published = getPublishedProducts()
    setPublishedProducts(published)
  }, [])

  useEffect(() => {
    async function loadColours() {
      try {
        const colours = await fetchColours()
        if (Array.isArray(colours)) {
          const map: Record<string, { hex: string; hex2?: string }> = {}
          colours.forEach((colour: any) => {
            if (colour.colour && colour.hex) {
              map[colour.colour.toUpperCase()] = {
                hex: colour.hex,
                hex2: colour.hex2 || undefined,
              }
            }
          })
          setColourMap(map)
        }
      } catch (error) {
        console.error("Error loading colour data", error)
      }
    }

    loadColours()
  }, [])

  const combinedProducts = useMemo(() => {
    const map = new Map<string, SavedProduct>()

    publishedProducts.forEach((product) => {
      map.set(product.styleCode, product)
    })

    selectedProducts.forEach((product) => {
      map.set(product.styleCode, product)
    })

    return Array.from(map.values())
  }, [publishedProducts, selectedProducts])

  useEffect(() => {
    async function loadImages() {
      const codesToFetch = combinedProducts
        .filter((product) => !productImages[product.styleCode])
        .map((product) => product.styleCode)

      if (codesToFetch.length === 0) return

      const results: Record<string, ProductImageItem[]> = {}

      await Promise.all(
        codesToFetch.map(async (code) => {
          try {
            const images = await fetchProductImages(code)
            results[code] = images || []
          } catch (error) {
            console.error("Error loading images for", code, error)
            results[code] = []
          }
        }),
      )

      setProductImages((prev) => ({
        ...prev,
        ...results,
      }))
    }

    if (combinedProducts.length > 0) {
      loadImages()
    }
  }, [combinedProducts, productImages])

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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="container mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-2">Selected Products</h1>
            <p className="text-gray-400">Review products currently selected in admin mode.</p>
          </div>
          <Link
            to="/products"
            className="px-4 py-2 rounded-md bg-[#99C542] text-black text-sm font-medium hover:bg-lime-300 transition-colors"
          >
            Back to Product Selection
          </Link>
        </div>

        {combinedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-[#101010] border border-[#1a1a1a] rounded-lg">
            <p className="text-lg text-gray-300 mb-2">No products have been selected yet.</p>
            <p className="text-sm text-gray-500">Go to the Image Selection page to pick products and colors.</p>
            <Link
              to="/products"
              className="mt-6 inline-flex items-center justify-center px-4 py-2 rounded-md bg-[#99C542] text-black text-sm font-medium hover:bg-lime-300 transition-colors"
            >
              Back to Product Selection
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-4">
              {combinedProducts.map((product) => {
                const images = productImages[product.styleCode] || []
                const primaryImage =
                  images.find((img) => img.imageType === "MAIN") ||
                  images.find((img) => img.imageType === "FRONT") ||
                  images.find(
                    (img) => img.imageType && img.imageType !== "" && !img.imageType.includes("BACK"),
                  ) ||
                  images.find((img) => img.urlThumbnail) ||
                  images[0]

                return (
                  <div
                    key={product.styleCode}
                    className="bg-gradient-to-b from-[#1d1d1d] via-[#171717]/95 to-[#0f0f0f]/75 border border-[#1a1a1a] rounded-xl overflow-hidden shadow-lg transition-transform duration-300 hover:-translate-y-2 hover:shadow-lime-500/20 max-w-[300px] w-full flex flex-col min-h-[340px]"
                  >
                    <div className="relative h-50 bg-[#303030]">
                      {primaryImage?.urlThumbnail || primaryImage?.urlStandard ? (
                        <img
                          src={primaryImage.urlThumbnail || primaryImage.urlStandard || "/placeholder.png"}
                          alt={product.styleName}
                          className="absolute inset-0 h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="relative flex flex-col items-center gap-3">
                            <div className="flex items-center justify-center text-[#384152]">
                              <Package className="w-10 h-10" />
                            </div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-12 border-2 border-lime-400/40 border-t-[#99C542] rounded-full animate-spin" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="relative flex flex-col flex-1 p-3 gap-2 bg-gradient-to-b from-transparent via-[#121212]/80 to-[#0c0c0c]/60">
                      <div>
                        <h2 className="text-lg font-semibold leading-tight mb-1">{product.styleName}</h2>
                        <p className="text-sm text-gray-500 font-mono">{product.styleCode}</p>
                        <p className="text-xs text-gray-500 uppercase mt-1">{product.productType}</p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Colors Selected</p>
                        {product.selectedColors.length === 0 ? (
                          <p className="text-sm text-gray-500">No colors selected.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {product.selectedColors.map((color) => (
                              <span
                                key={color}
                                className="flex items-center gap-2 text-xs bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-1 rounded-full"
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

                      <div className="mt-auto flex justify-end items-end">
                        <Link
                          to={`/products/${product.styleCode}`}
                          className="text-xs font-semibold text-[#99C542] hover:text-lime-300"
                        >
                          Edit selection
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}


