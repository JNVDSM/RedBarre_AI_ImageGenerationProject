// LocalStorage utilities for saving product selections

export interface SavedProduct {
  styleCode: string
  styleName: string
  productType: string
  selectedColors: string[]
  timestamp: string
}

export interface PublishedProduct extends SavedProduct {
  published: boolean
  publishedAt: string
}

const STORAGE_KEY = "as_colour_selected_products"
const PUBLISHED_KEY = "as_colour_published_products"
const MODE_KEY = "as_colour_user_mode" // "admin" or "creator"
const CREATOR_WORKFLOW_KEY = "as_colour_creator_workflow"
const GENERATED_IMAGES_KEY = "as_colour_generated_images"

export function getSavedProducts(): SavedProduct[] {
  if (typeof window === "undefined") return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error("Error reading saved products:", error)
    return []
  }
}

export function saveProduct(product: SavedProduct): void {
  if (typeof window === "undefined") return
  
  try {
    const saved = getSavedProducts()
    const existingIndex = saved.findIndex((p) => p.styleCode === product.styleCode)
    
    if (existingIndex >= 0) {
      // Update existing product
      saved[existingIndex] = product
    } else {
      // Add new product
      saved.push(product)
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
    
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event("productsSaved"))
  } catch (error) {
    console.error("Error saving product:", error)
  }
}

export function removeProduct(styleCode: string): void {
  if (typeof window === "undefined") return
  
  try {
    const saved = getSavedProducts()
    const filtered = saved.filter((p) => p.styleCode !== styleCode)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event("productsSaved"))
  } catch (error) {
    console.error("Error removing product:", error)
  }
}

export function clearAllProducts(): void {
  if (typeof window === "undefined") return
  
  try {
    localStorage.removeItem(STORAGE_KEY)
    
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event("productsSaved"))
  } catch (error) {
    console.error("Error clearing products:", error)
  }
}

// Published products functions
export function publishProducts(products: SavedProduct[]): void {
  if (typeof window === "undefined") return
  
  try {
    const existing = getPublishedProducts()
    const publishedProducts: PublishedProduct[] = products.map((product) => ({
      ...product,
      published: true,
      publishedAt: new Date().toISOString(),
    }))
    const mergedProducts = [...existing]

    publishedProducts.forEach((product) => {
      const index = mergedProducts.findIndex((item) => item.styleCode === product.styleCode)
      if (index >= 0) {
        mergedProducts[index] = product
      } else {
        mergedProducts.push(product)
      }
    })
    
    localStorage.setItem(PUBLISHED_KEY, JSON.stringify(mergedProducts))
    
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event("productsPublished"))
  } catch (error) {
    console.error("Error publishing products:", error)
  }
}

export function getPublishedProducts(): PublishedProduct[] {
  if (typeof window === "undefined") return []
  
  try {
    const stored = localStorage.getItem(PUBLISHED_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error("Error reading published products:", error)
    return []
  }
}

export function clearPublishedProducts(): void {
  if (typeof window === "undefined") return
  
  try {
    localStorage.removeItem(PUBLISHED_KEY)
    window.dispatchEvent(new Event("productsPublished"))
  } catch (error) {
    console.error("Error clearing published products:", error)
  }
}

// User mode functions (Admin/Creator)
export function setUserMode(mode: "admin" | "creator"): void {
  if (typeof window === "undefined") return
  
  try {
    localStorage.setItem(MODE_KEY, mode)
    window.dispatchEvent(new Event("modeChanged"))
  } catch (error) {
    console.error("Error setting user mode:", error)
  }
}

export function getUserMode(): "admin" | "creator" {
  if (typeof window === "undefined") return "admin"
  
  try {
    const mode = localStorage.getItem(MODE_KEY)
    return (mode === "admin" || mode === "creator") ? mode : "admin"
  } catch (error) {
    console.error("Error reading user mode:", error)
    return "admin"
  }
}

// Creator workflow functions
export interface CreatorWorkflowData {
  selectedProduct: {
    styleCode: string
    styleName: string
    productType: string
    gender?: string
  }
  selectedColors: string[]
  modelImage?: string // base64 or URL
  logoImage?: string // base64 or URL
  prompt?: string
}

export function saveCreatorWorkflow(data: CreatorWorkflowData): void {
  if (typeof window === "undefined") return
  
  try {
    localStorage.setItem(CREATOR_WORKFLOW_KEY, JSON.stringify(data))
  } catch (error) {
    console.error("Error saving creator workflow:", error)
  }
}

export function getCreatorWorkflow(): CreatorWorkflowData | null {
  if (typeof window === "undefined") return null
  
  try {
    const stored = localStorage.getItem(CREATOR_WORKFLOW_KEY)
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    console.error("Error reading creator workflow:", error)
    return null
  }
}

export function clearCreatorWorkflow(): void {
  if (typeof window === "undefined") return
  
  try {
    localStorage.removeItem(CREATOR_WORKFLOW_KEY)
  } catch (error) {
    console.error("Error clearing creator workflow:", error)
  }
}

export interface GeneratedImageEntry {
  id: string
  image: string
  prompt: string
  createdAt: string
  product: {
    styleCode: string
    styleName: string
    productType?: string
  }
  selectedColors: string[]
}

export function getGeneratedImages(): GeneratedImageEntry[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(GENERATED_IMAGES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error("Error reading generated images:", error)
    return []
  }
}

export function saveGeneratedImage(entry: Omit<GeneratedImageEntry, "id" | "createdAt">): GeneratedImageEntry | null {
  if (typeof window === "undefined") return null

  try {
    const images = getGeneratedImages()
    const record: GeneratedImageEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      ...entry,
    }
    images.unshift(record)
    localStorage.setItem(GENERATED_IMAGES_KEY, JSON.stringify(images))
    window.dispatchEvent(new Event("generatedImagesUpdated"))
    return record
  } catch (error) {
    console.error("Error saving generated image:", error)
    return null
  }
}

export function clearGeneratedImages(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(GENERATED_IMAGES_KEY)
    window.dispatchEvent(new Event("generatedImagesUpdated"))
  } catch (error) {
    console.error("Error clearing generated images:", error)
  }
}

