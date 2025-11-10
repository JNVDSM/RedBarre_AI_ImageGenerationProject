import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import fs from "node:fs";
import multer from "multer";
// import FormData from "form-data";

dotenv.config();

const upload = multer(); // memory storage by default
const app = express();

function getEnv(name, { fallback, required = false, transform } = {}) {
  let value = process.env[name];
  if (!value || value.trim() === "") {
    if (fallback !== undefined) {
      value = fallback;
    } else if (required) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
  }

  if (typeof value === "string") {
    value = value.trim();
  }

  return transform ? transform(value) : value;
}

const PORT = getEnv("PORT", { fallback: 4000, transform: (val) => Number(val) || 4000 });
const ASCOLOUR_API_BASE_URL = getEnv("ASCOLOUR_API_BASE_URL", {
  required: true,
  transform: (val) => val.replace(/\/$/, ""),
});
const ASCOLOUR_SUBSCRIPTION_KEY = getEnv("ASCOLOUR_SUBSCRIPTION_KEY", { required: true });
const GENERATE_IMAGE_URL = getEnv("GENERATE_IMAGE_URL", { required: true });

const corsOriginEnv = getEnv("CORS_ORIGIN", { fallback: "http://localhost:5173" });
const corsOrigins = corsOriginEnv
  ? corsOriginEnv.split(",").map((origin) => origin.trim()).filter(Boolean)
  : undefined;

app.use(
  cors({
    origin: corsOrigins || "*",
  })
);
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
app.use(morgan("dev"));

const defaultHeaders = {
  "subscription-key": ASCOLOUR_SUBSCRIPTION_KEY,
  "Content-Type": "application/json",
  Accept: "application/json",
};

// Utility to call AsColour API
async function fetchFromAsColour(path, init = {}) {
  const url = `${ASCOLOUR_API_BASE_URL}${path}`;
  const headers = {
    ...defaultHeaders,
    ...(init.headers ?? {}),
  };

  const response = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    const error = new Error(
      `AS Colour API error: ${response.status} ${response.statusText}`
    );
    error.status = response.status;
    error.details = details;
    throw error;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

// -----------------------------------------------------
// API Routes
// -----------------------------------------------------


app.get("/",(_req,res)=>{
  res.send("Hello World from AsColour API Server Backend");
})

app.get("/api/products", async (_req, res) => {
  try {
    const data = await fetchFromAsColour("/catalog/products/");
    res.json(data);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(error.status || 500).json({
      error: error.message || "Failed to fetch products",
      details: error.details,
    });
  }
});

app.get("/api/products/:styleCode", async (req, res) => {
  const { styleCode } = req.params;
  try {
    const data = await fetchFromAsColour(`/catalog/products/${styleCode}`);
    res.json(data);
  } catch (error) {
    console.error(`Error fetching product ${styleCode}:`, error);
    res.status(error.status || 500).json({
      error: error.message || "Failed to fetch product details",
      details: error.details,
    });
  }
});

app.get("/api/products/:styleCode/variants", async (req, res) => {
  const { styleCode } = req.params;
  try {
    const data = await fetchFromAsColour(
      `/catalog/products/${styleCode}/variants`
    );
    res.json(data);
  } catch (error) {
    console.error(`Error fetching variants for ${styleCode}:`, error);
    res.status(error.status || 500).json({
      error: error.message || "Failed to fetch product variants",
      details: error.details,
    });
  }
});

app.get("/api/products/:styleCode/images", async (req, res) => {
  const { styleCode } = req.params;
  try {
    const data = await fetchFromAsColour(`/catalog/products/${styleCode}/images`);
    res.json(data);
  } catch (error) {
    console.error(`Error fetching images for ${styleCode}:`, error);
    res.status(error.status || 500).json({
      error: error.message || "Failed to fetch product images",
      details: error.details,
    });
  }
});

app.get("/api/colours", async (_req, res) => {
  try {
    const data = await fetchFromAsColour("/catalog/colours");
    res.json(data);
  } catch (error) {
    console.error("Error fetching colours:", error);
    res.status(error.status || 500).json({
      error: error.message || "Failed to fetch colours",
      details: error.details,
    });
  }
});

app.get("/api/inventory/items", async (req, res) => {
  const { skuFilter } = req.query;
  if (!skuFilter) {
    res.status(400).json({ error: "skuFilter parameter is required" });
    return;
  }

  try {
    const data = await fetchFromAsColour(
      `/inventory/items/?skuFilter=${encodeURIComponent(String(skuFilter))}`
    );
    res.json({ data, success: true });
  } catch (error) {
    console.error(`Error fetching inventory items for ${skuFilter}:`, error);
    res.status(error.status || 500).json({
      error: error.message || "Failed to fetch inventory items",
      details: error.details,
    });
  }
});

// -----------------------------------------------------
// IMAGE GENERATION ROUTE
// -----------------------------------------------------

app.options("/api/generate-image", (_req, res) => {
  res.sendStatus(204);
});

app.post(
  "/api/generate-image",
  upload.fields([
    { name: "head_image", maxCount: 1 },
    { name: "costume_image", maxCount: 1 },
    { name: "logo_image", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      console.log("Received files:", Object.keys(req.files || {}));
      console.log("Received body:", req.body);

      const formData = new FormData();

      // Text fields
      if (req.body.prompt) formData.append("prompt", req.body.prompt);
      if (req.body.user_prompt) formData.append("user_prompt", req.body.user_prompt);
      if (req.body.image_type) formData.append("image_type", req.body.image_type);

      const selectedColors = req.body.selectedColors;
      if (Array.isArray(selectedColors)) {
        selectedColors.forEach((color) => formData.append("colors", color));
      } else if (typeof selectedColors === "string" && selectedColors.trim()) {
        formData.append("colors", selectedColors.trim());
      }

      const appendFileIfExists = (incomingField, targetField) => {
        const fileEntry = req.files?.[incomingField]?.[0];
        if (!fileEntry) return;

        const blob = new Blob([fileEntry.buffer], { type: fileEntry.mimetype });
        formData.append(targetField, blob, fileEntry.originalname || `${targetField}.jpg`);
      };

      appendFileIfExists("head_image", "first_image");
      appendFileIfExists("costume_image", "second_image");
      appendFileIfExists("logo_image", "logo_image");

      if (!formData.has("second_image")) {
        res.status(400).json({
          success: false,
          error: "Costume image is required.", 
        });
        return;
      }

      // Forward to upstream API
      const upstreamResponse = await fetch(GENERATE_IMAGE_URL, {
        method: "POST",
        body: formData,
      });

      const contentType = upstreamResponse.headers.get("content-type") || ""; 
      let data;

      if (contentType.includes("application/json")) {
        data = await upstreamResponse.json();
      } else if (contentType.includes("text/")) {
        data = await upstreamResponse.text();
      } else {
        const buffer = Buffer.from(await upstreamResponse.arrayBuffer());
        data = buffer.toString("base64");
      }

      res
        .status(upstreamResponse.ok ? 200 : upstreamResponse.status)
        .json({ success: upstreamResponse.ok, data });
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to generate image",
      });
    }
  }
);

// -----------------------------------------------------
// STATIC FILE HANDLING
// -----------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const distPath = join(__dirname, "../client/dist");

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(join(distPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`✅ API server listening on http://localhost:${PORT}`);
});
