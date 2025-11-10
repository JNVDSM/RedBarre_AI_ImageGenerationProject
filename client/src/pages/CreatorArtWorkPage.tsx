import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Camera, Palette, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCreatorWorkflow, saveCreatorWorkflow } from "@/lib/storage"

export default function CreatorArtWorkPage() {
  const navigate = useNavigate()
  const [workflowData, setWorkflowData] = useState<any>(null)
  const [modelImage, setModelImage] = useState<string | null>(null)
  const [logoImage, setLogoImage] = useState<string | null>(null)
  const [modelPreview, setModelPreview] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  useEffect(() => {
    const data = getCreatorWorkflow()
    if (!data || !data.selectedProduct) {
      navigate("/products")
      return
    }
    setWorkflowData(data)
    setModelImage(data.modelImage || null)
    setLogoImage(data.logoImage || null)
    setModelPreview(data.modelImage || null)
    setLogoPreview(data.logoImage || null)
  }, [navigate])

  const handleImageUpload = (type: "model" | "logo", file: File) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      if (type === "model") {
        setModelImage(base64String)
        setModelPreview(base64String)
      } else {
        setLogoImage(base64String)
        setLogoPreview(base64String)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleContinue = () => {
    if (!modelImage && !logoImage) {
      alert("Please upload at least a model image or a logo image before continuing.")
      return
    }

    const updatedData = {
      ...workflowData,
      modelImage,
      logoImage,
    }
    saveCreatorWorkflow(updatedData)
    navigate("/creator/image-generation")
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
      <div className="container mx-auto px-8 py-8">
        <Button
          onClick={() => navigate("/products")}
          variant="ghost"
          className="mb-6 text-gray-300 hover:text-white hover:bg-[#1a1a1a]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>

        <div className="mb-10">
          <h1 className="text-2xl font-bold mb-3">Upload Brand Assets </h1>
          <p className="text-gray-400 ">
          Upload your model photo and brand logo to customize the selected product and generate professional, branded visuals
          </p>
        </div>

        <div className="flex gap-6 items-center justify-center">
        <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
          <div className="rounded-xl border-2 border-[#2a2a2a] bg-[#111] p-6 transition flex flex-col gap-4">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#2f2f2f] bg-[#1a1a1a]">
                <Camera className="h-5 w-5 text-[#99C542]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Model Image</h2>
                <p className="text-sm text-gray-400">
                  Choose a clean, well-lit photo of the model to showcase the garment.
                </p>
              </div>
            </div>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    if (file.size > 10 * 1024 * 1024) {
                      alert("File size must be less than 10MB")
                      return
                    }
                    handleImageUpload("model", file)
                  }
                }}
                className="hidden"
                id="model-upload"
              />
              <label
                htmlFor="model-upload"
                className="group relative block w-full overflow-hidden rounded-lg border border-[#2a2a2a] bg-gradient-to-br from-[#151515] via-[#121212] to-[#0d0d0d] transition-all hover:border-[#99C542] hover:shadow-[0_0_0_1px_rgba(153,197,66,0.25),0_15px_40px_-20px_rgba(153,197,66,0.45)]"
                style={{ aspectRatio: "16 / 10" }}
              >
                {modelPreview ? (
                  <img
                    src={modelPreview}
                    alt="Model preview"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#161616]/80 border border-[#2f2f2f] backdrop-blur-sm group-hover:border-[#99C542]/70 group-hover:bg-[#1d1d1d]">
                <Upload className="h-7 w-7 text-[#99C542]" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">Drag & drop to upload</p>
                <p className="text-xs text-gray-500">
                  PNG or JPG up to 10MB · A square image works best.
                </p>
              </div>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="rounded-xl border-2 border-[#2a2a2a] bg-[#111] p-6 transition flex flex-col gap-4">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#2f2f2f] bg-[#1a1a1a]">
                <Palette className="h-5 w-5 text-[#99C542]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Logo Image</h2>
                <p className="text-sm text-gray-400">
                  Transparent PNGs look great, but high-resolution JPGs are also supported.
                </p>
              </div>
            </div>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    if (file.size > 10 * 1024 * 1024) {
                      alert("File size must be less than 10MB")
                      return
                    }
                    handleImageUpload("logo", file)
                  }
                }}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className="group relative block w-full overflow-hidden rounded-lg border border-[#2a2a2a] bg-gradient-to-br from-[#151515] via-[#121212] to-[#0d0d0d] transition-all hover:border-[#99C542] hover:shadow-[0_0_0_1px_rgba(153,197,66,0.25),0_15px_40px_-20px_rgba(153,197,66,0.45)]"
                style={{ aspectRatio: "16 / 10" }}
              >
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="absolute inset-0 h-full w-full object-contain bg-white object-center"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#161616]/80 border border-[#2f2f2f] backdrop-blur-sm group-hover:border-[#99C542]/70 group-hover:bg-[#1d1d1d]">
                      <Upload className="h-7 w-7 text-[#99C542]" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-white">Drag & drop to upload</p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG or SVG up to 10MB · Transparent background recommended.
                      </p>
                    </div>
                  </div>
                )}
              </label>
            </div>
          </div>
        </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleContinue}
            className="bg-[#99C542] text-black hover:bg-lime-300 disabled:opacity-50 disabled:cursor-not-allowed px-8"
            disabled={!modelImage && !logoImage}
          >
            Continue to Image Generation
          </Button>
        </div>
      </div>
    </div>
  )
}


