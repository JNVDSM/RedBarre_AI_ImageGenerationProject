"use client"

import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import ProductCategories from "./product-categories"
import ProductCard, { ProductCardSkeleton } from "./product-card"
import SelectionSummary from "./selection-summary"
import { MultiSelectDropdown } from "./multi-select-dropdown"
import { fetchProducts, fetchProductImages, fetchColours } from "@/lib/api"
import {
  getSavedProducts,
  clearAllProducts,
  removeProduct,
  getPublishedProducts,
  setUserMode,
  getUserMode,
  type SavedProduct,
  type PublishedProduct,
} from "@/lib/storage"
import type { Product, ProductImage } from "@/types/product"

const GENDER_OPTIONS = ["Men", "Women", "Kids | Youth", "Unisex"] as const

const normalizeGender = (gender?: string | null) => (gender && gender.trim().length > 0 ? gender : "Unisex")

const matchesGenderSelection = (product: Product, gender: string | null) => {
  if (!gender || gender === "All") return true

  const productGender = normalizeGender(product.gender)

  if (gender === "Unisex") {
    return productGender === "Unisex"
  }

  if (productGender === "Unisex") {
    return true
  }

  return productGender === gender
}

export default function ProductSelector() {
  const [products, setProducts] = useState<Product[]>([])
  const [productImages, setProductImages] = useState<Record<string, ProductImage[]>>({})
  const [colours, setColours] = useState<Record<string, { hex: string; hex2?: string }>>({})
  const [loading, setLoading] = useState(true)
  const [imagesLoading, setImagesLoading] = useState<Set<string>>(new Set())
  const navigate = useNavigate()

  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set())
  const [selectedWeights, setSelectedWeights] = useState<Set<string>>(new Set())
  const [activeGenderFilter, setActiveGenderFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // User mode (Admin/Creator)
  const [userMode, setUserModeState] = useState<"admin" | "creator">("admin")
  
  // Creator view state - selected gender category
  const [selectedGenderCategory, setSelectedGenderCategory] = useState<string | null>(null)
  
  // Saved products from localStorage
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([])
  const [publishedProducts, setPublishedProducts] = useState<PublishedProduct[]>([])
  
  // Initialize user mode from localStorage
  useEffect(() => {
    const mode = getUserMode()
    setUserModeState(mode)
  }, [])
  
  // Listen for mode changes
  useEffect(() => {
    const handleModeChange = () => {
      const mode = getUserMode()
      setUserModeState(mode)
    }
    
    window.addEventListener("modeChanged", handleModeChange)
    return () => window.removeEventListener("modeChanged", handleModeChange)
  }, [])
  
  // Listen for published products changes
  useEffect(() => {
    const refreshPublishedProducts = () => {
      const published = getPublishedProducts()
      setPublishedProducts(published)
    }
    
    refreshPublishedProducts()
    
    window.addEventListener("productsPublished", refreshPublishedProducts)
    return () => window.removeEventListener("productsPublished", refreshPublishedProducts)
  }, [])
  
  // Listen for storage changes and refresh saved products
  useEffect(() => {
    const refreshSavedProducts = () => {
      const saved = getSavedProducts()
      setSavedProducts(saved)
    }
    
    // Refresh on mount
    refreshSavedProducts()
    
    // Listen for storage events (cross-tab)
    window.addEventListener("storage", refreshSavedProducts)
    
    // Listen for focus events (when returning to tab)
    window.addEventListener("focus", refreshSavedProducts)
    
    // Listen for visibility changes (when tab becomes visible)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshSavedProducts()
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    
    // Custom event listener for same-tab updates
    const handleCustomStorage = () => refreshSavedProducts()
    window.addEventListener("productsSaved", handleCustomStorage)
    
    return () => {
      window.removeEventListener("storage", refreshSavedProducts)
      window.removeEventListener("focus", refreshSavedProducts)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("productsSaved", handleCustomStorage)
    }
  }, [])

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 16
  
  // Toggle between Admin and Creator mode
  const toggleMode = () => {
    const newMode = userMode === "admin" ? "creator" : "admin"
    setUserMode(newMode)
    setUserModeState(newMode)
    setSelectedGenderCategory(null) // Reset gender category when switching modes
    setActiveGenderFilter(null)
    setSelectedCategories(new Set())
    setCurrentPage(1) // Reset pagination
  }

  // Fetch products and colours on mount
  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true)
        const [productsData, coloursData] = await Promise.all([
          fetchProducts(),
          fetchColours()
        ])
        setProducts(productsData || [])
        
        // Create a map of colour names to hex codes
        const colourMap: Record<string, { hex: string; hex2?: string }> = {}
        if (coloursData && Array.isArray(coloursData)) {
          coloursData.forEach((colour: any) => {
            if (colour.colour && colour.hex) {
              colourMap[colour.colour.toUpperCase()] = {
                hex: colour.hex,
                hex2: colour.hex2 || undefined
              }
            }
          })
        }
        setColours(colourMap)
      } catch (error) {
        console.error("Error fetching products or colours:", error)
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategories, selectedCollections, selectedWeights, activeGenderFilter, searchQuery, selectedGenderCategory, userMode])

  useEffect(() => {
    if (userMode === "creator") {
      setSelectedCategories(new Set())
    }
  }, [userMode, selectedGenderCategory])

  const adminFilteredProductsWithoutGender = useMemo(() => {
    if (userMode !== "admin") {
      return [] as Product[]
    }

    let filtered = products

    if (selectedCategories.size > 0) {
      filtered = filtered.filter((p) => p.productType && selectedCategories.has(p.productType))
    }

    if (selectedCollections.size > 0) {
      filtered = filtered.filter((p) => p.coreRange && selectedCollections.has(p.coreRange))
    }

    if (selectedWeights.size > 0) {
      filtered = filtered.filter((p) => p.productWeight && selectedWeights.has(p.productWeight))
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (p) => p.styleName.toLowerCase().includes(query) || p.styleCode.toLowerCase().includes(query),
      )
    }

    return filtered
  }, [products, userMode, selectedCategories, selectedCollections, selectedWeights, searchQuery])

  const creatorPublishedProducts = useMemo(() => {
    const publishedStyleCodes = new Set(publishedProducts.map((p) => p.styleCode))
    return products.filter((p) => publishedStyleCodes.has(p.styleCode))
  }, [products, publishedProducts])

  // Filter products based on mode
  const filteredProducts = useMemo(() => {
    if (userMode === "creator") {
      let filtered = creatorPublishedProducts

      if (selectedGenderCategory) {
        filtered = filtered.filter((p) => matchesGenderSelection(p, selectedGenderCategory))
      }

      if (selectedCategories.size > 0) {
        filtered = filtered.filter((p) => p.productType && selectedCategories.has(p.productType))
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filtered = filtered.filter(
          (p) => p.styleName.toLowerCase().includes(query) || p.styleCode.toLowerCase().includes(query),
        )
      }

      return filtered
    }

    if (userMode === "admin") {
      return adminFilteredProductsWithoutGender.filter((product) =>
        matchesGenderSelection(product, activeGenderFilter),
      )
    }

    return products
  }, [userMode, products, adminFilteredProductsWithoutGender, activeGenderFilter, creatorPublishedProducts, selectedGenderCategory, selectedCategories, searchQuery])
  
  const creatorGenderStats = useMemo(() => {
    const counts: Record<string, number> = {
      All: creatorPublishedProducts.length,
    }

    GENDER_OPTIONS.forEach((gender) => {
      counts[gender] = 0
    })

    creatorPublishedProducts.forEach((product) => {
      GENDER_OPTIONS.forEach((gender) => {
        if (matchesGenderSelection(product, gender)) {
          counts[gender] = (counts[gender] || 0) + 1
        }
      })
    })

    return ["All", ...GENDER_OPTIONS].map((gender) => ({ gender, count: counts[gender] || 0 }))
  }, [creatorPublishedProducts])

  const totalCreatorPublishedProducts = creatorPublishedProducts.length

  // Paginate filtered products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredProducts.slice(startIndex, endIndex)
  }, [filteredProducts, currentPage, itemsPerPage])

  // Calculate total pages
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)

  const categoryProducts = useMemo(() => {
    if (userMode === "admin") {
      return products.filter((product) => matchesGenderSelection(product, activeGenderFilter))
    }

    let source = creatorPublishedProducts

    if (selectedGenderCategory) {
      source = source.filter((product) => matchesGenderSelection(product, selectedGenderCategory))
    }

    return source
  }, [userMode, products, activeGenderFilter, creatorPublishedProducts, selectedGenderCategory])

  useEffect(() => {
    if (userMode !== "admin" || selectedCategories.size === 0) {
      return
    }

    const availableCategories = new Set(
      categoryProducts
        .map((product) => product.productType)
        .filter((category): category is string => Boolean(category)),
    )

    let shouldUpdate = false
    const updatedCategories = new Set(selectedCategories)

    selectedCategories.forEach((category) => {
      if (!availableCategories.has(category)) {
        updatedCategories.delete(category)
        shouldUpdate = true
      }
    })

    if (shouldUpdate) {
      setSelectedCategories(updatedCategories)
    }
  }, [userMode, categoryProducts, selectedCategories])

  // Fetch images for paginated products (current page only)
  useEffect(() => {
    async function loadProductImages() {
      // Only fetch images for products on the current page
      const paginatedStyleCodes = paginatedProducts.map((p) => p.styleCode)
      const missingImages = paginatedStyleCodes.filter(
        (code) => !productImages[code] && !imagesLoading.has(code)
      )

      if (missingImages.length === 0) return

      // Fetch images for products we don't have yet (limit to first 15 to avoid rate limits)
      const imagesToFetch = missingImages.slice(0, 15)

      // Mark as loading
      setImagesLoading((prev) => {
        const newSet = new Set(prev)
        imagesToFetch.forEach((code) => newSet.add(code))
        return newSet
      })

      // Fetch images in batches with delays to avoid rate limiting
      const batchSize = 3 // Reduced batch size to avoid rate limits
      const delayBetweenBatches = 1000 // 1 second delay between batches
      const results: Array<{ styleCode: string; images: any[] }> = []

      for (let i = 0; i < imagesToFetch.length; i += batchSize) {
        const batch = imagesToFetch.slice(i, i + batchSize)
        const batchPromises = batch.map(async (styleCode) => {
          try {
            const images = await fetchProductImages(styleCode)
            console.log(`Fetched ${images.length} images for ${styleCode}`)
            return { styleCode, images }
          } catch (error) {
            console.error(`Error fetching images for ${styleCode}:`, error)
            return { styleCode, images: [] }
          }
        })

        const batchResults = await Promise.all(batchPromises)
        results.push(...batchResults)

        // Add delay between batches (except for the last batch)
        if (i + batchSize < imagesToFetch.length) {
          await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches))
        }
      }
      setProductImages((prev) => {
        const newImages = { ...prev }
        results.forEach(({ styleCode, images }) => {
          if (images.length > 0) {
            newImages[styleCode] = images
          }
        })
        return newImages
      })

      // Remove from loading
      setImagesLoading((prev) => {
        const newSet = new Set(prev)
        imagesToFetch.forEach((code) => newSet.delete(code))
        return newSet
      })
    }

    if (paginatedProducts.length > 0) {
      loadProductImages()
    }
    // Depend on the paginated products to only fetch images for current page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginatedProducts.map((p) => p.styleCode).sort().join(",")])

  // Fetch images for one product per category (for category card logos)
  useEffect(() => {
    async function loadCategoryLogos() {
      if (userMode !== "admin" || products.length === 0) return

      // Get first product from each category that doesn't have images yet
      const categoryMap = new Map<string, string>() // category -> styleCode
      products.forEach((product) => {
        if (product.productType && !categoryMap.has(product.productType)) {
          // Only add if we don't have images for this product yet
          if (!productImages[product.styleCode] && !imagesLoading.has(product.styleCode)) {
            categoryMap.set(product.productType, product.styleCode)
          }
        }
      })

      const styleCodesToFetch = Array.from(categoryMap.values()).slice(0, 10) // Limit to 10 categories
      if (styleCodesToFetch.length === 0) return

      // Mark as loading
      setImagesLoading((prev) => {
        const newSet = new Set(prev)
        styleCodesToFetch.forEach((code) => newSet.add(code))
        return newSet
      })

      // Fetch in small batches
      const batchSize = 2
      const delayBetweenBatches = 1000
      const results: Array<{ styleCode: string; images: any[] }> = []

      for (let i = 0; i < styleCodesToFetch.length; i += batchSize) {
        const batch = styleCodesToFetch.slice(i, i + batchSize)
        const batchPromises = batch.map(async (styleCode) => {
          try {
            const images = await fetchProductImages(styleCode)
            return { styleCode, images }
          } catch (error) {
            console.error(`Error fetching category logo for ${styleCode}:`, error)
            return { styleCode, images: [] }
          }
        })

        const batchResults = await Promise.all(batchPromises)
        results.push(...batchResults)

        if (i + batchSize < styleCodesToFetch.length) {
          await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches))
        }
      }

      setProductImages((prev) => {
        const newImages = { ...prev }
        results.forEach(({ styleCode, images }) => {
          if (images.length > 0) {
            newImages[styleCode] = images
          }
        })
        return newImages
      })

      // Remove from loading
      setImagesLoading((prev) => {
        const newSet = new Set(prev)
        styleCodesToFetch.forEach((code) => newSet.delete(code))
        return newSet
      })
    }

    // Load category logos after products are loaded
    if (products.length > 0 && !loading) {
      loadCategoryLogos()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length, loading, userMode])

  // Get unique collections and weights
  const collections = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => p.coreRange && set.add(p.coreRange))
    return Array.from(set).sort()
  }, [products])

  const weights = ["Light Weight", "Mid Weight", "Heavy Weight"]

  const handleClearAll = () => {
    clearAllProducts()
    setSavedProducts([])
    setSelectedCategories(new Set())
    setSelectedCollections(new Set())
    setSelectedWeights(new Set())
    setActiveGenderFilter(null)
    setSearchQuery("")
  }

  const handleSave = () => {
    if (savedProducts.length === 0) {
      alert("No products selected. Please select products and colors from the product detail pages.")
      return
    }
    
    const data = {
      products: savedProducts,
      timestamp: new Date().toISOString(),
    }
    console.log("Saving selection:", data)
    alert("Selection saved successfully!")
    // Could redirect or show success message here
  }

  if (loading) {
    const skeletonItems = Array.from({ length: itemsPerPage }, (_, index) => (
      <ProductCardSkeleton key={index} />
    ))

    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <div className="flex">
          <div className="flex-1 p-8 overflow-auto">
            <div className="mb-8 space-y-4">
              <div className="h-8 w-72 bg-[#1a1a1a] rounded animate-pulse" />
              <div className="h-4 w-96 bg-[#1a1a1a] rounded animate-pulse" />
            </div>

            <div className="mb-8">
              <div className="h-10 w-full max-w-md bg-[#1a1a1a] rounded animate-pulse" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {skeletonItems}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className={userMode === "admin" ? "pr-80" : ""}>
        {/* Main Content */}
        <div className="min-w-0 p-8 pb-8">
          {/* Header with Mode Toggle */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                {userMode === "admin" ? "LOCO+ Product Selection Interface" : "Published Products"}
              </h2>
              <p className="text-gray-400">
                {userMode === "admin" 
                  ? "Select products, colors, and sizes from the AS Colour catalog"
                  : "Browse published products by category"}
              </p>
            </div>
            <button
              onClick={toggleMode}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                userMode === "admin"
                  ? "bg-[#99C542] text-black hover:bg-lime-300"
                  : "bg-[#99C542] text-black hover:bg-lime-300"
              }`}
            >
              Switch to {userMode === "admin" ? "Creator" : "Admin"} Mode
            </button>
          </div>

          {/* Gender Filter - Creator Mode */}
          {userMode === "creator" && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Gender</h2>
              </div>

              {totalCreatorPublishedProducts === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
                  <p className="text-lg mb-2">No published products available</p>
                  <p className="text-sm">Switch to Admin mode to publish products</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {["All", ...GENDER_OPTIONS].map((gender) => {
                    const isAll = gender === "All"
                    const value = isAll ? null : gender
                    const count = creatorGenderStats.find((item) => item.gender === gender)?.count ?? 0
                    const isSelected = value === null ? selectedGenderCategory === null : selectedGenderCategory === gender
                    const isDisabled = !isAll && count === 0

                    return (
                      <button
                        key={gender}
                        onClick={() => setSelectedGenderCategory(value)}
                        disabled={isDisabled}
                        className={`px-4 py-2 rounded-lg border transition-all text-sm font-medium ${
                          isSelected
                            ? "bg-white text-black border-white shadow-lg shadow-lime-400/20"
                            : "bg-[#1a1a1a] text-gray-300 border-[#2a2a2a] hover:border-[#99C542] hover:text-white"
                        } ${isDisabled ? "opacity-40 cursor-not-allowed hover:border-[#2a2a2a] hover:text-gray-300" : ""}`}
                      >
                        {gender}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Gender Filter - Admin Mode */}
          {userMode === "admin" && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Gender</h2>
                {activeGenderFilter && (
                  <button
                    onClick={() => setActiveGenderFilter(null)}
                    className="text-xs font-semibold text-[#99C542] hover:text-lime-300"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {[null, ...GENDER_OPTIONS].map((value) => {
                  const isActive = value === activeGenderFilter || (value === null && activeGenderFilter === null)
                  const label = value ?? "All"

                  return (
                    <button
                      key={label}
                      onClick={() => setActiveGenderFilter(value)}
                      className={`px-4 py-2 rounded-lg border transition-all duration-300 text-sm font-medium ${
                        isActive
                          ? "bg-white text-black border-white shadow-lg shadow-lime-400/20"
                          : "bg-[#1a1a1a] text-gray-300 border-[#2a2a2a] hover:border-[#99C542] hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Product Categories */}
              {(userMode === "admin" || userMode === "creator") && (
            <ProductCategories
              products={categoryProducts}
              selectedCategories={selectedCategories}
              onCategoryToggle={(category) => {
                const newSet = new Set(selectedCategories)
                if (newSet.has(category)) {
                  newSet.delete(category)
                } else {
                  newSet.add(category)
                }
                setSelectedCategories(newSet)
              }}
                  showCounts
                  includeEmpty={false}
                  showAllOption={userMode === "creator"}
                  onSelectAll={() => setSelectedCategories(new Set())}
            />
          )}

          {/* Filter Dropdowns - Admin Mode Only */}
          {userMode === "admin" && (
            <div className="mb-8 flex flex-col md:flex-row gap-4">
              <MultiSelectDropdown
                label="Product Collections"
                options={collections}
                selected={selectedCollections}
                onSelectionChange={setSelectedCollections}
              />

              <MultiSelectDropdown
                label="Material & Weight"
                options={weights}
                selected={selectedWeights}
                onSelectionChange={setSelectedWeights}
              />
            </div>
          )}

          {/* Search Products */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Search Products</h2>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                type="text"
                placeholder="Search by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Available Products */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Available Products ({filteredProducts.length})
              </h2>
              {filteredProducts.length > itemsPerPage && (
                <span className="text-sm text-gray-500">
                  (Page {currentPage} of {totalPages})
                </span>
              )}
            </div>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
                No products available for this selection.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {paginatedProducts.map((product) => {
                  const imageList = productImages[product.styleCode] || []
                  const isFetchingImages = imagesLoading.has(product.styleCode)

                  return (
                    <ProductCard
                      key={product.styleCode}
                      product={product}
                      images={imageList}
                      isImageFetching={isFetchingImages}
                    />
                  )
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-[#1a1a1a] text-gray-300 hover:bg-[#252525] disabled:hover:bg-[#1a1a1a] flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      // Show first page, last page, current page, and pages around current
                      if (totalPages <= 7) return true
                      return (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      )
                    })
                    .map((page, index, array) => {
                      // Add ellipsis
                      const prevPage = array[index - 1]
                      const showEllipsis = prevPage && page - prevPage > 1

                      return (
                        <div key={page} className="flex items-center gap-1">
                          {showEllipsis && (
                            <span className="px-2 text-gray-500">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`px-4 py-2 rounded-md text-sm transition-colors ${
                              currentPage === page
                                ? "bg-white text-black"
                                : "bg-[#1a1a1a] text-gray-300 hover:bg-[#252525]"
                            }`}
                          >
                            {page}
                          </button>
                        </div>
                      )
                    })}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-[#1a1a1a] text-gray-300 hover:bg-[#252525] disabled:hover:bg-[#1a1a1a] flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Selection Summary Sidebar - Admin Mode Only */}
        {userMode === "admin" && (
          <SelectionSummary
            savedProducts={savedProducts}
            products={products}
            productImages={productImages}
            colourMap={colours}
            onClearAll={handleClearAll}
            onSave={handleSave}
            onRemoveProduct={(styleCode) => {
              removeProduct(styleCode)
              setSavedProducts(getSavedProducts())
            }}
            onEditProduct={(styleCode) => {
              navigate(`/products/${styleCode}`)
            }}
          />
        )}
      </div>
    </div>
  )
}
