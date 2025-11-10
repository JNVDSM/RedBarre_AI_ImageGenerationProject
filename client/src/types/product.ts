export interface Product {
  styleCode: string
  styleName: string
  description: string
  shortDescription: string
  printingTechniques: string
  fabricWeight: string
  composition: string
  webId: number
  productType: string
  productWeight: string
  coreRange: string
  fit: string
  gender: string
  productSpecURL: string
  sizeGuideURL: string
  websiteURL: string
  updatedAt: string
}

export interface ProductImage {
  styleCode: string
  imageType: string
  urlStandard: string
  urlThumbnail: string
  urlTiny: string
  urlZoom: string
}

export interface InventoryItem {
  sku: string
  size?: string
  color?: string
  quantity?: number
  available?: boolean
  [key: string]: any
}
