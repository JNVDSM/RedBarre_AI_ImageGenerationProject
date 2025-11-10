import express from "express"
import cors from "cors"
import morgan from "morgan"
import dotenv from "dotenv"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import fs from "node:fs"
import multer from "multer"

dotenv.config()
const upload = multer();
const app = express()

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000
const ASCOLOUR_API_BASE_URL =
  process.env.ASCOLOUR_API_BASE_URL?.replace(/\/$/, "") || "https://api.ascolour.com/v1"
const ASCOLOUR_SUBSCRIPTION_KEY = process.env.ASCOLOUR_SUBSCRIPTION_KEY || "49f62d4316a64dbca016f9d9a7dc62fe"
const GENERATE_IMAGE_URL =
  process.env.GENERATE_IMAGE_URL || "https://l1xxkmdomk.execute-api.us-west-2.amazonaws.com/dev"

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : undefined

app.use(
  cors({
    origin: corsOrigins || "*",
  }),
)
app.use(express.json({ limit: "15mb" }))
app.use(express.urlencoded({ extended: true, limit: "15mb" }))
app.use(morgan("dev"))

const defaultHeaders = {
  "subscription-key": ASCOLOUR_SUBSCRIPTION_KEY,
  "Content-Type": "application/json",
  Accept: "application/json",
}

async function fetchFromAsColour(path, init = {}) {
  const url = `${ASCOLOUR_API_BASE_URL}${path}`
  const headers = {
    ...defaultHeaders,
    ...(init.headers ?? {}),
  }

  const response = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  })

  if (!response.ok) {
    const details = await response.text().catch(() => "")
    const error = new Error(`AS Colour API error: ${response.status} ${response.statusText}`)
    error.status = response.status
    error.details = details
    throw error
  }

  const contentType = response.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    return response.json()
  }

  return response.text()
}

app.get("/api/products", async (_req, res) => {
  try {
    const data = await fetchFromAsColour("/catalog/products/")
    res.json(data)
  } catch (error) {
    console.error("Error fetching products:", error)
    res.status(error.status || 500).json({
      error: error.message || "Failed to fetch products",
      details: error.details,
    })
  }
})

app.get("/api/products/:styleCode", async (req, res) => {
  const { styleCode } = req.params
  try {
    const data = await fetchFromAsColour(`/catalog/products/${styleCode}`)
    res.json(data)
  } catch (error) {
    console.error(`Error fetching product ${styleCode}:`, error)
    res.status(error.status || 500).json({
      error: error.message || "Failed to fetch product details",
      details: error.details,
    })
  }
})

app.get("/api/products/:styleCode/variants", async (req, res) => {
  const { styleCode } = req.params
  try {
    const data = await fetchFromAsColour(`/catalog/products/${styleCode}/variants`)
    res.json(data)
  } catch (error) {
    console.error(`Error fetching variants for ${styleCode}:`, error)
    res.status(error.status || 500).json({
      error: error.message || "Failed to fetch product variants",
      details: error.details,
    })
  }
})

app.get("/api/products/:styleCode/images", async (req, res) => {
  const { styleCode } = req.params
  try {
    const data = await fetchFromAsColour(`/catalog/products/${styleCode}/images`)
    res.json(data)
  } catch (error) {
    console.error(`Error fetching images for ${styleCode}:`, error)
    res.status(error.status || 500).json({
      error: error.message || "Failed to fetch product images",
      details: error.details,
    })
  }
})

app.get("/api/colours", async (_req, res) => {
  try {
    const data = await fetchFromAsColour("/catalog/colours")
    res.json(data)
  } catch (error) {
    console.error("Error fetching colours:", error)
    res.status(error.status || 500).json({
      error: error.message || "Failed to fetch colours",
      details: error.details,
    })
  }
})

app.get("/api/inventory/items", async (req, res) => {
  const { skuFilter } = req.query
  if (!skuFilter) {
    res.status(400).json({ error: "skuFilter parameter is required" })
    return
  }

  try {
    const data = await fetchFromAsColour(
      `/inventory/items/?skuFilter=${encodeURIComponent(String(skuFilter))}`,
    )
    res.json({ data, success: true })
  } catch (error) {
    console.error(`Error fetching inventory items for ${skuFilter}:`, error)
    res.status(error.status || 500).json({
      error: error.message || "Failed to fetch inventory items",
      details: error.details,
    })
  }
})

app.options("/api/generate-image", (_req, res) => {
  res.sendStatus(204)
})

app.post("/api/generate-image", upload.fields([
  { name: 'head_image', maxCount: 1 },
  { name: 'costume_image', maxCount: 1 },
  { name: 'logo_image', maxCount: 1 }
]), async (req, res) => {
  try {
    // Create a new FormData for the upstream request
    const formData = new FormData();
    
    // Append text fields
    formData.append('prompt', req.body.prompt);
    
    // Append files if they exist
    if (req.files['head_image']) {
      formData.append('head_image', 
        new Blob([req.files['head_image'][0].buffer], { type: req.files['head_image'][0].mimetype }), 
        'head_image.jpg'
      );
    }
    
    if (req.files['costume_image']) {
      formData.append('costume_image', 
        new Blob([req.files['costume_image'][0].buffer], { type: req.files['costume_image'][0].mimetype }), 
        'costume_image.jpg'
      );
    }
    
    if (req.files['logo_image']) {
      formData.append('logo_image', 
        new Blob([req.files['logo_image'][0].buffer], { type: req.files['logo_image'][0].mimetype }), 
        'logo_image.jpg'
      );
    }

    // Send to upstream API
    const upstreamResponse = await fetch("http://52.12.198.193:5000/combine-with-logo", {
      method: "POST",
      body: formData,
    })

    const contentType = upstreamResponse.headers.get("content-type") || ""
    let data

    if (contentType.includes("application/json")) {
      data = await upstreamResponse.json()
    } else if (contentType.includes("text/")) {
      data = await upstreamResponse.text()
    } else {
      const buffer = Buffer.from(await upstreamResponse.arrayBuffer())
      data = buffer.toString("base64")
    }

    res
      .status(upstreamResponse.ok ? 200 : upstreamResponse.status)
      .json({ success: upstreamResponse.ok, status: upstreamResponse.status, data })
  } catch (error) {
    console.error("Error generating image:", error)
    res.status(500).json({
      success: false,
      error: "Failed to generate image",
    })
  }
})
const __dirname = dirname(fileURLToPath(import.meta.url))
const distPath = join(__dirname, "../client/dist")

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get("*", (_req, res) => {
    res.sendFile(join(distPath, "index.html"))
  })
}

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`)
})


