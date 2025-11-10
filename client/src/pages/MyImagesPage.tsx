import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { getGeneratedImages, type GeneratedImageEntry, clearGeneratedImages } from "@/lib/storage"
import { fetchColours } from "@/lib/api"

export default function MyImagesPage() {
  const navigate = useNavigate()
  const [images, setImages] = useState<GeneratedImageEntry[]>([])
  const [colourMap, setColourMap] = useState<Record<string, { hex: string; hex2?: string }>>({})

  useEffect(() => {
    setImages(getGeneratedImages())

    const handleUpdate = () => {
      setImages(getGeneratedImages())
    }

    window.addEventListener("generatedImagesUpdated", handleUpdate)
    return () => window.removeEventListener("generatedImagesUpdated", handleUpdate)
  }, [])

  useEffect(() => {
    const loadColours = async () => {
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
        console.error("Error loading colours for images page:", error)
      }
    }

    loadColours()
  }, [])

  const getColourStyle = (color: string) => {
    const entry = colourMap[color.toUpperCase()]
    if (!entry) return { backgroundColor: "#d4d4d4" }
    if (entry.hex2) {
      return { backgroundImage: `linear-gradient(135deg, ${entry.hex}, ${entry.hex2})` }
    }
    return { backgroundColor: entry.hex }
  }

  const groupedImages = useMemo(() => {
    return images.reduce<Record<string, GeneratedImageEntry[]>>((acc, img) => {
      const key = img.product.styleCode
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(img)
      return acc
    }, {})
  }, [images])

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="container mx-auto px-8 py-8 max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Images</h1>
            <p className="text-gray-400">
              Review generated mockups and send them to merchandise when you are ready.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {images.length > 0 && (
              <Button
                variant="outline"
                className="border-[#2a2a2a] text-white hover:bg-[#1a1a1a]"
                onClick={() => {
                  if (confirm("Clear all generated images?")) {
                    clearGeneratedImages()
                    setImages([])
                  }
                }}
              >
                Clear All
              </Button>
            )}
            <Button
              className="bg-[#99C542] text-black hover:bg-lime-300"
              onClick={() => navigate("/products")}
            >
              Go to Merchandise
            </Button>
          </div>
        </div>

        {images.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#2a2a2a] bg-[#121212] p-12 text-center text-gray-400">
            No images yet. Generate artwork to populate your image library.
          </div>
        ) : (
          Object.entries(groupedImages).map(([styleCode, entries]) => {
            const colourTags =
              entries[0].selectedColors && entries[0].selectedColors.length > 0
                ? entries[0].selectedColors
                : Array.from(
                    new Set(
                      entries.flatMap((entry) =>
                        entry.assets?.map((asset) => asset.color).filter((color): color is string => Boolean(color)) ??
                        [],
                      ),
                    ),
                  )

            return (
            <div key={styleCode} className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">
                  {entries[0].product.styleName} ({styleCode})
                </h2>
                {entries[0].product.productType && (
                  <p className="text-sm text-gray-500">{entries[0].product.productType}</p>
                )}
                {colourTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {colourTags.map((color) => (
                      <span
                        key={color}
                        className="inline-flex items-center gap-2 text-xs bg-[#252525] border border-[#2f2f2f] px-2 py-1 rounded-full"
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-[#111]"
                          style={getColourStyle(color)}
                        />
                        <span>{color}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border border-[#222] bg-[#111] overflow-hidden flex flex-col"
                  >
                    <div className="relative aspect-square bg-[#1a1a1a]">
                      <img
                        src={entry.image}
                         alt={`${entry.product.styleName} generated mockup`}
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="text-xs uppercase text-gray-500">
                        {new Date(entry.createdAt).toLocaleString()}
                      </div>
                      {entry.metadata && (
                        <div className="text-xs text-gray-400 space-y-1">
                          {entry.metadata?.orientation && (
                            <div>Orientation: {String(entry.metadata.orientation)}</div>
                          )}
                          {entry.metadata?.image_type && (
                            <div>Type: {String(entry.metadata.image_type)}</div>
                          )}
                          {typeof entry.metadata?.show_full_body === "boolean" && (
                            <div>Full Body: {entry.metadata.show_full_body ? "Yes" : "No"}</div>
                          )}
                          {typeof entry.metadata?.has_logo === "boolean" && (
                            <div>Logo Included: {entry.metadata.has_logo ? "Yes" : "No"}</div>
                          )}
                        </div>
                      )}
                      {entry.assets?.length ? (
                        <div className="text-xs text-gray-300 space-y-2">
                          <div className="font-semibold text-gray-400">Assets</div>
                          <div className="flex flex-wrap gap-2">
                            {entry.assets.map((asset, index) => (
                              <a
                                key={asset.key || `${entry.id}-asset-${index}`}
                                href={asset.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded border border-[#2a2a2a] bg-[#181818] px-2 py-1 hover:border-[#3a3a3a]"
                              >
                                {asset.color && (
                                  <span
                                    className="w-3 h-3 rounded-full border border-[#111]"
                                    style={getColourStyle(asset.color)}
                                    title={asset.color}
                                  />
                                )}
                                <span>{asset.color ?? "Download"}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
          })
        )}
      </div>
    </div>
  )
}

