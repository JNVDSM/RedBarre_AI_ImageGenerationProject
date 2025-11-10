import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  getCreatorWorkflow,
  saveCreatorWorkflow,
  saveGeneratedImage,
  type GeneratedImageAsset,
} from "@/lib/storage"
import { fetchProductImages } from "@/lib/api"
import type { ProductImage } from "@/types/product"

export default function CreatorImageGenerationPage() {
  const navigate = useNavigate()
  const [workflowData, setWorkflowData] = useState<any>(null)
  const [prompt, setPrompt] = useState("")
  const [generating, setGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [productImage, setProductImage] = useState<string | null>(null)

  useEffect(() => {
    const data = getCreatorWorkflow()
    if (!data || !data.selectedProduct || (!data.modelImage && !data.logoImage)) {
      navigate("/products")
      return
    }
    setWorkflowData(data)
    setPrompt(data.prompt || "")
  }, [navigate])

  useEffect(() => {
    const styleCode = workflowData?.selectedProduct?.styleCode
    if (!styleCode) {
      setProductImage(null)
      return
    }

    let isMounted = true

    const load = async () => {
      try {
        const images = (await fetchProductImages(styleCode)) as ProductImage[]
        const primary =
          images?.find((img) => img.imageType === "MAIN") ||
          images?.find((img) => img.imageType === "FRONT") ||
          images?.find(
            (img) => img.imageType && img.imageType !== "" && !img.imageType.includes("BACK"),
          ) ||
          images?.find((img) => img.urlThumbnail) ||
          images?.[0]

        if (isMounted) {
          setProductImage(primary?.urlStandard ?? primary?.urlThumbnail ?? null)
        }
      } catch (error) {
        console.error("Error loading product image for generation page:", error)
        if (isMounted) {
          setProductImage(null)
        }
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [workflowData?.selectedProduct?.styleCode])
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert("Please enter a prompt")
      return
    }
  
    setGenerating(true)
  
    const userPrompt = prompt.trim()
    const detailedPrompt = `Transform the costume reference into a full professional photo by placing the person's head from the source image onto a complete human body wearing ONLY the costume items actually shown in the reference image - do not add or imagine any clothing not present. If the costume shows only a top/shirt, generate body with just that top; if it shows top and pants, include both; if accessories like watch or belt are visible, include them, but NEVER add items not shown in the original costume reference. If the costume is on a hanger, mannequin, or showcase display, generate a realistic human body with natural arms, hands, shoulders, and appropriate torso/legs based on what clothing is actually displayed. Extract and preserve the exact facial features, skin tone, and head shape from the source image. Match the head size proportionally to the body with natural human proportions and align the neck correctly with the collar/neckline. Position arms naturally at sides or in professional pose with both hands visible. Blend the skin tone of the face, neck, and hands perfectly with realistic human skin. Replace any hanger, mannequin, or display background with a clean plain white or light neutral professional background. Place the provided logo image on the specified position of the costume (or top-left chest area if not specified), ensuring the logo appears professionally printed/embroidered on the fabric with appropriate size that maintains logo clarity and visibility, following fabric contours naturally with proper lighting and shadows matching the garment. Match the lighting across entire body and all present garments. Ensure the displayed clothing fits naturally with realistic shadows and fabric draping. Do not invent or add any clothing items, accessories, or garments not explicitly shown in the costume reference. Generate a high-resolution result showing the person wearing EXACTLY what the costume reference displays with professional photo quality and integrated logo.
  
  Original user prompt: ${userPrompt}`.trim()
  
    const updatedData: any = {
      ...workflowData,
      prompt: userPrompt,
    }
    saveCreatorWorkflow(updatedData)
  
    try {
      const generateImageUrl = `${import.meta.env.VITE_API_BASE_URL}api/generate-image`

      // Create FormData
      const formData = new FormData()
      formData.append("prompt", detailedPrompt)
      formData.append("user_prompt", userPrompt)
      
      // Ensure costume image is always included
      if (productImage) {
        const costumeImageBlob = await fetch(productImage).then((r) => r.blob())
        formData.append("costume_image", costumeImageBlob, "costume_image.jpg")
      } else {
        // If no product image, use a placeholder or throw an error
        throw new Error("Costume image is required but not provided")
      }
      
      // Append other files
      if (workflowData?.modelImage) {
        const headImageBlob = await fetch(workflowData.modelImage).then((r) => r.blob())
        formData.append("head_image", headImageBlob, "head_image.jpg")
      }
      
      if (workflowData?.logoImage) {
        const logoImageBlob = await fetch(workflowData.logoImage).then((r) => r.blob())
        formData.append("logo_image", logoImageBlob, "logo_image.jpg")
      }

      if (updatedData.selectedColors?.length) {
        updatedData.selectedColors.forEach((color: string) => formData.append("selectedColors", color))
      }

      const response = await fetch(generateImageUrl, {
        method: "POST",
        body: formData,
      })

      const result = await response.json().catch((err) => {
        console.error("Error parsing image generation response:", err)
        return null
      })

      const requestFailed = !response.ok || !result?.success
      if (requestFailed) {
        const errorDetail =
          typeof result?.data === "object" && result?.data !== null
            ? result?.data?.detail || result?.data?.message
            : null
        throw new Error(errorDetail || `Request failed with status ${result?.status ?? response.status}`)
      }

      const upstreamPayload = result?.data

      if (
        upstreamPayload &&
        typeof upstreamPayload === "object" &&
        "success" in upstreamPayload &&
        upstreamPayload?.success === false
      ) {
        const detail =
          Array.isArray(upstreamPayload.detail) && upstreamPayload.detail.length > 0
            ? upstreamPayload.detail.map((item: any) => item?.msg || item).join(", ")
            : upstreamPayload.detail || upstreamPayload.message
        throw new Error(detail || "Upstream service failed to generate image")
      }

      let resolvedImage: string | null = null
      let resolvedMessage = "Image generated and saved to My Images."
      let metadata: Record<string, any> | null = null
      let assets: GeneratedImageAsset[] | undefined

      if (typeof upstreamPayload === "string") {
        resolvedImage = `data:image/jpeg;base64,${upstreamPayload}`
      } else if (upstreamPayload && typeof upstreamPayload === "object") {
        if (Array.isArray((upstreamPayload as any).images)) {
          const rawImages = (upstreamPayload as any).images
          assets = rawImages
            .map((img: any) => {
              if (!img?.s3_url) return undefined
              return {
                color: img?.color || undefined,
                url: img.s3_url as string,
                key: img?.s3_key || undefined,
              }
            })
            .filter(Boolean) as GeneratedImageAsset[]
          resolvedImage = assets[0]?.url ?? null
        }

        if (
          !resolvedImage &&
          typeof (upstreamPayload as any).data === "string" &&
          (upstreamPayload as any).data.trim() !== ""
        ) {
          resolvedImage = `data:image/jpeg;base64,${(upstreamPayload as any).data}`
        }

        metadata =
          typeof (upstreamPayload as any).metadata === "object" ? (upstreamPayload as any).metadata : null
        if (typeof (upstreamPayload as any).message === "string" && (upstreamPayload as any).message.trim() !== "") {
          resolvedMessage = (upstreamPayload as any).message
        }
      }

      if (!resolvedImage) {
        throw new Error("No image returned from generator")
      }

      setGeneratedImage(resolvedImage)
      saveGeneratedImage({
        image: resolvedImage,
        prompt: updatedData.prompt,
        product: {
          styleCode: updatedData.selectedProduct.styleCode,
          styleName: updatedData.selectedProduct.styleName,
          productType: updatedData.selectedProduct.productType || "",
        },
        selectedColors: updatedData.selectedColors ?? [],
        source: resolvedImage.startsWith("data:") ? "base64" : "url",
        metadata,
        assets,
      })
      setSuccessMessage(resolvedMessage || "Image generated and saved to My Images.")
    } catch (error:any) {
      console.error("Image generation error:", error)
      alert(error.message || "There was an issue generating the image. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

  if (!workflowData) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="container mx-auto px-8 py-8 max-w-4xl">
        <Button
          onClick={() => navigate("/creator/art-work")}
          variant="ghost"
          className="mb-6 text-gray-300 hover:text-white hover:bg-[#1a1a1a]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Art Work
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Image Generation</h1>
          <p className="text-gray-400">Enter a prompt to generate a new image combining all inputs</p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-[repeat(3,minmax(0,1fr))]">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-400">Product Image</p>
            <div className="relative w-full aspect-square rounded-lg bg-[#111] border border-[#222] overflow-hidden">
              {productImage ? (
                <img
                  src={productImage}
                  alt={workflowData.selectedProduct.styleName}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                  Not available
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-400">Model Image</p>
            <div className="relative aspect-square rounded-lg bg-[#111] border border-[#222] overflow-hidden">
              {workflowData.modelImage ? (
                <img
                  src={workflowData.modelImage}
                  alt="Model"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                  Not provided
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-400">Logo Image</p>
            <div className="relative aspect-square rounded-lg bg-[#111] border border-[#222] overflow-hidden">
              {workflowData.logoImage ? (
                <img
                  src={workflowData.logoImage}
                  alt="Logo"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                  Not provided
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-8">
          <p className="text-sm font-semibold text-gray-400 mb-2">Prompt</p>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            className="w-full min-h-[160px] bg-[#121212] border border-[#2a2a2a] text-white placeholder:text-gray-500 resize-none"
            disabled={generating}
          />
        </div>

        <div className="mb-8 flex justify-end">
          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || generating}
            className="bg-[#99C542] text-black hover:bg-lime-300 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 text-sm font-semibold"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Image
              </>
            )}
          </Button>
        </div>

        {successMessage && (
          <div className="mb-6 rounded border border-[#2a2a2a] bg-[#121212] px-4 py-3 text-sm text-gray-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{successMessage}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="border-[#2a2a2a] text-white hover:bg-[#1a1a1a]"
                onClick={() => navigate("/creator/images")}
              >
                View My Images
              </Button>
              <Button
                variant="secondary"
                className="bg-[#99C542] text-black hover:bg-lime-300"
                onClick={() => navigate("/products")}
              >
                Go to Merchandise
              </Button>
            </div>
          </div>
        )}

        {generatedImage && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Generated Image</h2>
            <div className="relative w-full aspect-square bg-[#1a1a1a] rounded-lg overflow-hidden">
              <img
                src={generatedImage}
                alt="Generated"
                className="absolute inset-0 h-full w-full object-contain"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
