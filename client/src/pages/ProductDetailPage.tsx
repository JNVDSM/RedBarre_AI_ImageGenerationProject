import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import ColorSelector from "@/components/color-selector"
import {
  fetchProductDetails,
  fetchProductVariants,
  fetchProductImages,
  fetchColours,
} from "@/lib/api"
import {
  saveProduct,
  getSavedProducts,
  getUserMode,
  saveCreatorWorkflow,
  getPublishedProducts,
  getCreatorWorkflow,
} from "@/lib/storage"
import type { Product, ProductImage } from "@/types/product"

export default function ProductDetailPage() {
  const params = useParams<{ styleCode: string }>()
  const navigate = useNavigate()
  const styleCode = params.styleCode ?? ""

  const [product, setProduct] = useState<Product | null>(null)
  const [variants, setVariants] = useState<any[]>([])
  const [images, setImages] = useState<ProductImage[]>([])
  const [colours, setColours] = useState<Record<string, { hex: string; hex2?: string }>>({})
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [userMode, setUserMode] = useState<"admin" | "creator">("admin")
  const [creatorAllowedColors, setCreatorAllowedColors] = useState<string[] | null>(null)

  useEffect(() => {
    setUserMode(getUserMode())
  }, [])

  useEffect(() => {
    async function loadProductData() {
      if (!styleCode) return

      try {
        setLoading(true)
        const [productData, variantsData, imagesData, coloursData] = await Promise.all([
          fetchProductDetails(styleCode),
          fetchProductVariants(styleCode),
          fetchProductImages(styleCode),
          fetchColours(),
        ])

        if (productData) {
          setProduct(productData as Product)
        }
        const nextVariants = variantsData || []
        setVariants(nextVariants)
        setImages(imagesData || [])

        const colourMap: Record<string, { hex: string; hex2?: string }> = {}
        if (coloursData && Array.isArray(coloursData)) {
          coloursData.forEach((colour: any) => {
            if (colour.colour && colour.hex) {
              colourMap[colour.colour.toUpperCase()] = {
                hex: colour.hex,
                hex2: colour.hex2 || undefined,
              }
            }
          })
        }
        setColours(colourMap)

        const publishedProducts = getPublishedProducts()
        const publishedEntry = publishedProducts.find((entry) => entry.styleCode === styleCode)
        if (publishedEntry) {
          setCreatorAllowedColors(publishedEntry.selectedColors || [])
        } else {
          setCreatorAllowedColors([])
        }

        if (userMode === "admin") {
          const savedProducts = getSavedProducts()
          const savedProduct = savedProducts.find((p) => p.styleCode === styleCode)
          if (savedProduct && savedProduct.selectedColors) {
            setSelectedColors(new Set(savedProduct.selectedColors))
          }
        } else {
          const workflow = getCreatorWorkflow()
          if (workflow && workflow.selectedProduct?.styleCode === styleCode) {
            setSelectedColors(new Set(workflow.selectedColors))
          } else {
            setSelectedColors(new Set())
          }
        }
      } catch (error) {
        console.error("Error loading product data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadProductData()
  }, [styleCode, userMode])

  const variantColors = useMemo(
    () =>
      Array.from(
        new Set(variants.map((v) => v.colour).filter((colour): colour is string => Boolean(colour))),
      ).sort(),
    [variants],
  )

  const availableColors = useMemo(() => {
    if (userMode === "creator") {
      if (!creatorAllowedColors) {
        return [] as string[]
      }
      const allowedSet = new Set(creatorAllowedColors)
      return variantColors.filter((colour) => allowedSet.has(colour))
    }

    return variantColors
  }, [userMode, creatorAllowedColors, variantColors])

  useEffect(() => {
    if (userMode === "creator" && creatorAllowedColors) {
      setSelectedColors((prev) => {
        const next = new Set<string>()
        creatorAllowedColors.forEach((colour) => {
          if (prev.has(colour)) {
            next.add(colour)
          }
        })
        return next
      })
    }
  }, [userMode, creatorAllowedColors])

  const primaryImage =
    images.find((img) => img.imageType === "MAIN") ||
    images.find((img) => img.imageType === "FRONT") ||
    images.find((img) => img.imageType && img.imageType !== "" && !img.imageType.includes("BACK")) ||
    images[0]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white">Loading product...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white">Product not found</div>
        <Button onClick={() => navigate("/products")} className="ml-4">
          Back to Products
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="container mx-auto px-8 py-8">
        <Button
          onClick={() => navigate("/products")}
          variant="ghost"
          className="mb-6 text-gray-300 hover:text-white hover:bg-[#1a1a1a]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="aspect-square bg-[#1a1a1a] rounded-lg overflow-hidden relative">
              {primaryImage?.urlStandard ? (
                <img
                  src={primaryImage.urlStandard}
                  alt={product.styleName}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📦</div>
                    <div className="text-sm">No image available</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.styleName}</h1>
              <p className="text-gray-400 text-sm font-mono">{product.styleCode}</p>
            </div>

            {product.description && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Description</h2>
                <div
                  className="text-gray-300 prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {product.productType && (
                <div>
                  <div className="text-sm text-gray-400 mb-1">Type</div>
                  <div className="text-white">{product.productType}</div>
                </div>
              )}
              {product.productWeight && (
                <div>
                  <div className="text-sm text-gray-400 mb-1">Weight</div>
                  <div className="text-white">{product.productWeight}</div>
                </div>
              )}
              {product.fit && (
                <div>
                  <div className="text-sm text-gray-400 mb-1">Fit</div>
                  <div className="text-white">{product.fit}</div>
                </div>
              )}
              {product.gender && (
                <div>
                  <div className="text-sm text-gray-400 mb-1">Gender</div>
                  <div className="text-white">{product.gender}</div>
                </div>
              )}
              {product.composition && (
                <div className="col-span-2">
                  <div className="text-sm text-gray-400 mb-1">Composition</div>
                  <div className="text-white">{product.composition}</div>
                </div>
              )}
            </div>

            {availableColors.length > 0 ? (
              <div>
                <ColorSelector
                  colors={availableColors}
                  selectedColors={selectedColors}
                  colourMap={colours}
                  onColorToggle={(color) => {
                    const newSet = new Set(selectedColors)
                    if (newSet.has(color)) {
                      newSet.delete(color)
                    } else {
                      newSet.add(color)
                    }
                    setSelectedColors(newSet)
                  }}
                />
              </div>
            ) : (
              userMode === "creator" && (
                <div className="mt-4 text-sm text-gray-500">
                  No colours available for this product. Please contact your admin.
                </div>
              )
            )}

            <div className="flex gap-4 pt-4">
              {userMode === "creator" ? (
                <Button
                  className="bg-[#99C542] text-black hover:bg-lime-300"
                  disabled={selectedColors.size === 0}
                  onClick={() => {
                    if (selectedColors.size === 0) {
                      alert("Please select at least one color")
                      return
                    }

                    saveCreatorWorkflow({
                      selectedProduct: {
                        styleCode: product.styleCode,
                        styleName: product.styleName,
                        productType: product.productType || "",
                        gender: product.gender || undefined,
                      },
                      selectedColors: Array.from(selectedColors),
                    })

                    navigate("/creator/art-work")
                  }}
                >
                  Continue to Art Work
                </Button>
              ) : (
                <Button
                  className="bg-white text-black hover:bg-gray-200"
                  disabled={selectedColors.size === 0}
                  onClick={() => {
                    if (selectedColors.size === 0) {
                      alert("Please select at least one color")
                      return
                    }

                    saveProduct({
                      styleCode: product.styleCode,
                      styleName: product.styleName,
                      productType: product.productType || "",
                      selectedColors: Array.from(selectedColors),
                      timestamp: new Date().toISOString(),
                    })

                    navigate("/products")
                  }}
                >
                  Save Selection
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


