export const API_BASE_URL =
  (import.meta.env?.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://localhost:4000"

export const resolveApiUrl = (path: string) => {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path
  }
  return `${API_BASE_URL}${path}`
}

export interface ApiResponse<T> {
  data: T
  success?: boolean
  message?: string
}

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(resolveApiUrl(url), options)
      
      if (response.status === 429) {
        // Rate limited - wait and retry
        const retryAfter = response.headers.get("Retry-After")
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000
        console.log(`Rate limited. Waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`)
        await new Promise((resolve) => setTimeout(resolve, waitTime))
        continue
      }
      
      return response
    } catch (error) {
      lastError = error as Error
      if (attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000
        await new Promise((resolve) => setTimeout(resolve, waitTime))
      }
    }
  }
  
  throw lastError || new Error("Failed to fetch after retries")
}

export async function fetchProducts(): Promise<any[]> {
  try {
    const response = await fetchWithRetry("/api/products", {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "default",
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const result: ApiResponse<any[]> = await response.json()
    return result.data || []
  } catch (error) {
    console.error("Error fetching products:", error)
    throw error
  }
}

export async function fetchProductImages(styleCode: string): Promise<any[]> {
  try {
    const response = await fetchWithRetry(`/api/products/${styleCode}/images`, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "default",
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const result: ApiResponse<any[]> = await response.json()
    return result.data || []
  } catch (error) {
    console.error(`Error fetching images for ${styleCode}:`, error)
    return []
  }
}

export async function fetchProductDetails(styleCode: string): Promise<any | null> {
  try {
    const response = await fetchWithRetry(`/api/products/${styleCode}`, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "default",
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    // API returns product directly, not wrapped in data field
    if (result.error) {
      throw new Error(result.error)
    }
    return result.styleCode ? result : null
  } catch (error) {
    console.error(`Error fetching product details for ${styleCode}:`, error)
    return null
  }
}

export async function fetchProductVariants(styleCode: string): Promise<any[]> {
  try {
    const response = await fetchWithRetry(`/api/products/${styleCode}/variants`, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "default",
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const result: ApiResponse<any[]> = await response.json()
    return result.data || []
  } catch (error) {
    console.error(`Error fetching variants for ${styleCode}:`, error)
    return []
  }
}

export async function fetchColours(): Promise<any[]> {
  try {
    const response = await fetchWithRetry("/api/colours", {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "default",
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const result: ApiResponse<any[]> = await response.json()
    return result.data || []
  } catch (error) {
    console.error("Error fetching colours:", error)
    return []
  }
}

export interface InventoryItem {
  sku: string
  size?: string
  color?: string
  quantity?: number
  available?: boolean
  [key: string]: any
}

export async function fetchInventoryItems(skuFilter: string): Promise<InventoryItem[]> {
  try {
    const response = await fetchWithRetry(
      `/api/inventory/items?skuFilter=${encodeURIComponent(skuFilter)}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        cache: "default",
      }
    )

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const result: ApiResponse<InventoryItem[]> = await response.json()
    return result.data || []
  } catch (error) {
    console.error(`Error fetching inventory items for ${skuFilter}:`, error)
    return []
  }
}

/**
 * Get available sizes for a product by style code and color
 * @param styleCode - The product style code (e.g., "5001")
 * @param color - The color name (e.g., "WHITE") - optional, uses wildcard if not provided
 * @returns Array of unique sizes available for the product
 */
export async function getProductSizes(
  styleCode: string,
  color?: string
): Promise<string[]> {
  try {
    // Build SKU filter: if color provided, use "5001-WHITE", otherwise use "5001-*"
    const skuFilter = color ? `${styleCode}-${color}` : `${styleCode}-*`
    
    const inventoryItems = await fetchInventoryItems(skuFilter)
    
    // Extract unique sizes from inventory items
    const sizes = new Set<string>()
    inventoryItems.forEach((item) => {
      if (item.size) {
        sizes.add(item.size)
      }
    })
    
    return Array.from(sizes).sort()
  } catch (error) {
    console.error(`Error getting sizes for ${styleCode}:`, error)
    return []
  }
}

