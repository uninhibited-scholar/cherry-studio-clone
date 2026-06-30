import React, { useState, useEffect, useCallback } from 'react'
import { IpcChannel } from '@shared/IpcChannel'
// IpcChannel.PAINTINGS_SAVE used in PaintingCard
import type { Painting } from '@shared/data/types/painting'
import type { Provider } from '@shared/data/types/provider'
import type { Model } from '@shared/data/types/model'

const SIZES = ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'] as const
type Size = typeof SIZES[number]

export function PaintingsPage(): React.ReactElement {
  const [paintings, setPaintings] = useState<Painting[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [models, setModels] = useState<Model[]>([])

  const [selectedProviderId, setSelectedProviderId] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [size, setSize] = useState<Size>('1024x1024')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  const [showSketchPad, setShowSketchPad] = useState(false)
  const [sketches, setSketches] = useState<Array<{ id: string; dataUrl: string; savedAt: number }>>(() => {
    const saved = localStorage.getItem('cherry-clone:sketches')
    return saved ? JSON.parse(saved) : []
  })

  const loadPaintings = useCallback(async () => {
    const list = await window.api.invoke(IpcChannel.PAINTINGS_LIST) as Painting[]
    setPaintings(list)
  }, [])

  const loadProviders = useCallback(async () => {
    const list = await window.api.invoke(IpcChannel.PROVIDERS_LIST) as Provider[]
    setProviders(list)
    if (list.length > 0 && !selectedProviderId) setSelectedProviderId(list[0].id)
  }, [selectedProviderId])

  useEffect(() => { loadPaintings(); loadProviders() }, [loadPaintings, loadProviders])

  useEffect(() => {
    if (!selectedProviderId) return
    window.api.invoke(IpcChannel.MODELS_LIST, selectedProviderId).then((list) => {
      const ms = list as Model[]
      setModels(ms)
      // Default to dall-e-3 if present, else first model
      const dall = ms.find((m) => m.name.includes('dall-e') || m.name.includes('image'))
      setSelectedModel(dall?.name ?? ms[0]?.name ?? '')
    })
  }, [selectedProviderId])

  const handleGenerate = async () => {
    if (!prompt.trim() || !selectedProviderId || !selectedModel) return
    setGenerating(true)
    setError(null)
    try {
      const p = await window.api.invoke(IpcChannel.PAINTINGS_GENERATE, {
        providerId: selectedProviderId,
        modelName: selectedModel,
        prompt: prompt.trim(),
        negativePrompt: negativePrompt.trim(),
        size
      }) as Painting
      setPaintings((prev) => [p, ...prev])
    } catch (err: unknown) {
      setError(String(err))
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = async (id: string) => {
    await window.api.invoke(IpcChannel.PAINTINGS_DELETE, id)
    setPaintings((prev) => prev.filter((p) => p.id !== id))
    if (lightboxSrc) setLightboxSrc(null)
  }

  const formatDate = (ts: number) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  return (
    <div className="flex h-full bg-[rgba(10,0,20,0.60)] text-[#fafafa] overflow-hidden">
      {/* ── Left: generation panel ── */}
      <aside className="w-[280px] border-r border-[#27272a] flex flex-col shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-[#27272a]">
          <h2 className="m-0 mb-3 text-[14px] font-bold">🎨 Paintings</h2>
          <div className="flex gap-[6px] mb-3">
            <button onClick={() => setShowSketchPad(false)} className={`flex-1 py-[6px] text-[11px] border border-[rgba(240,171,252,0.15)] rounded cursor-pointer ${!showSketchPad ? 'bg-[#2563eb] text-white' : 'bg-transparent text-[#a1a1aa]'}`}>Generate</button>
            <button onClick={() => setShowSketchPad(true)} className={`flex-1 py-[6px] text-[11px] border border-[rgba(240,171,252,0.15)] rounded cursor-pointer ${showSketchPad ? 'bg-[#2563eb] text-white' : 'bg-transparent text-[#a1a1aa]'}`}>Sketch</button>
          </div>

          {/* Provider */}
          <label className="block text-[11px] text-[#71717a] mb-1 mt-[10px]">Provider</label>
          <select
            value={selectedProviderId}
            onChange={(e) => setSelectedProviderId(e.target.value)}
            className="bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.15)] rounded-md text-[#fafafa] text-[12px] outline-none px-2 py-[6px] w-full box-border cursor-pointer"
          >
            {providers.length === 0 && <option value="">No providers configured</option>}
            {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          {/* Model */}
          <label className="block text-[11px] text-[#71717a] mb-1 mt-[10px]">Model</label>
          <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.15)] rounded-md text-[#fafafa] text-[12px] outline-none px-2 py-[6px] w-full box-border cursor-pointer">
            {models.length === 0 && <option value="">—</option>}
            {models.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
            {/* allow typing custom model */}
          </select>
          <input
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            placeholder="or type model name…"
            className="bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.15)] rounded-md text-[#fafafa] text-[12px] outline-none px-2 py-[6px] w-full box-border mt-1"
          />

          {/* Size */}
          <label className="block text-[11px] text-[#71717a] mb-1 mt-[10px]">Size</label>
          <select value={size} onChange={(e) => setSize(e.target.value as Size)} className="bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.15)] rounded-md text-[#fafafa] text-[12px] outline-none px-2 py-[6px] w-full box-border cursor-pointer">
            {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Prompt */}
          <label className="block text-[11px] text-[#71717a] mb-1 mt-[10px]">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate…"
            rows={5}
            className="bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.15)] rounded-md text-[#fafafa] text-[12px] outline-none px-2 py-[6px] w-full box-border resize-y"
          />

          {/* Negative prompt */}
          <label className="block text-[11px] text-[#71717a] mb-1 mt-[10px]">Negative Prompt</label>
          <textarea
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            placeholder="What to avoid (optional)…"
            rows={2}
            className="bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.15)] rounded-md text-[#fafafa] text-[12px] outline-none px-2 py-[6px] w-full box-border resize-y"
          />

          {!showSketchPad && (
            <>
              {error && (
                <div className="mt-2 px-[10px] py-2 bg-[#450a0a] rounded-md text-[11px] text-[#fca5a5] break-all">
                  {error}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim() || !selectedProviderId || !selectedModel}
                className={`mt-3 w-full py-[10px] rounded-lg border-none text-white text-[13px] font-bold cursor-pointer ${generating ? 'bg-[#1d4ed8] cursor-default' : 'bg-[#2563eb]'} ${(!prompt.trim() || !selectedProviderId || !selectedModel) ? 'opacity-50' : ''}`}
              >
                {generating ? '⏳ Generating…' : '✨ Generate'}
              </button>
            </>
          )}

          {showSketchPad && (
            <SketchPadUI
              sketches={sketches}
              onSaveSketch={(dataUrl) => {
                const newSketches = [...sketches, { id: `sketch-${Date.now()}`, dataUrl, savedAt: Date.now() }]
                setSketches(newSketches)
                localStorage.setItem('cherry-clone:sketches', JSON.stringify(newSketches))
              }}
              onDeleteSketch={(id) => {
                const newSketches = sketches.filter(s => s.id !== id)
                setSketches(newSketches)
                localStorage.setItem('cherry-clone:sketches', JSON.stringify(newSketches))
              }}
            />
          )}
        </div>

        <div className="px-4 py-[10px]">
          <p className="text-[11px] text-[#52525b] m-0">{paintings.length} painting{paintings.length !== 1 ? 's' : ''} saved</p>
        </div>
      </aside>

      {/* ── Right: gallery ── */}
      <main className="flex-1 overflow-y-auto p-4">
        {paintings.length === 0 ? (
          <div className="h-full flex items-center justify-center flex-col gap-3 text-[#52525b]">
            <span className="text-[56px]">🖼️</span>
            <p className="text-[14px] text-[#71717a]">Your generated images will appear here</p>
          </div>
        ) : (
          <div style={{ columns: 3, columnGap: 12 }}>
            {paintings.map((p) => (
              <PaintingCard
                key={p.id}
                painting={p}
                onView={() => setLightboxSrc(`data:image/png;base64,${p.imageData}`)}
                onDelete={() => handleDelete(p.id)}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Lightbox ── */}
      {lightboxSrc && (
        <div
          onClick={() => setLightboxSrc(null)}
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[999] cursor-zoom-out"
        >
          <img src={lightboxSrc} alt="painting" className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-[0_0_40px_rgba(0,0,0,0.8)]" />
        </div>
      )}
    </div>
  )
}

function SketchPadUI({
  sketches,
  onSaveSketch,
  onDeleteSketch
}: {
  sketches: Array<{ id: string; dataUrl: string; savedAt: number }>
  onSaveSketch: (dataUrl: string) => void
  onDeleteSketch: (id: string) => void
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [brushColor, setBrushColor] = useState('#fafafa')
  const [brushSize, setBrushSize] = useState(3)

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    setIsDrawing(true)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    ctx.lineWidth = brushSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = brushColor
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.stroke()
  }

  const stopDrawing = () => setIsDrawing(false)

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const saveSketch = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const dataUrl = canvas.toDataURL()
      onSaveSketch(dataUrl)
      clearCanvas()
    }
  }

  return (
    <div>
      <p className="text-[12px] text-[#a1a1aa] mb-2">Brush Settings</p>
      <div className="flex gap-2 mb-3">
        <div className="flex-1">
          <label className="text-[11px] text-[#71717a] block mb-1">Color</label>
          <input
            type="color"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
            className="w-full h-8 border-none rounded-md cursor-pointer"
          />
        </div>
        <div className="flex-1">
          <label className="text-[11px] text-[#71717a] block mb-1">Size: {brushSize}</label>
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={240}
        height={240}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="w-full border border-[rgba(240,171,252,0.15)] rounded-lg bg-[rgba(255,255,255,0.04)] cursor-crosshair mb-3 block"
        style={{ height: 240 }}
      />

      <div className="flex gap-[6px] mb-3">
        <button onClick={clearCanvas} className="flex-1 py-[6px] text-[11px] border border-[rgba(240,171,252,0.15)] rounded bg-transparent text-[#a1a1aa] cursor-pointer">🗑 Clear</button>
        <button onClick={saveSketch} className="flex-1 py-[6px] text-[11px] border-none rounded bg-[#2563eb] text-white cursor-pointer">💾 Save</button>
      </div>

      {sketches.length > 0 && (
        <>
          <p className="text-[11px] text-[#a1a1aa] mb-[6px]">Saved Sketches ({sketches.length})</p>
          <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
            {sketches.map((sketch) => (
              <div key={sketch.id} className="flex gap-[6px] items-center">
                <img src={sketch.dataUrl} alt="sketch" className="w-10 h-10 rounded border border-[rgba(240,171,252,0.10)]" />
                <div className="flex-1 text-[10px] text-[#71717a]">{new Date(sketch.savedAt).toLocaleTimeString()}</div>
                <button onClick={() => onDeleteSketch(sketch.id)} className="bg-transparent border-none text-[#f87171] cursor-pointer text-[12px]">✕</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function PaintingCard({
  painting, onView, onDelete, formatDate
}: {
  painting: Painting
  onView: () => void
  onDelete: () => void
  formatDate: (ts: number) => string
}) {
  const [hovered, setHovered] = useState(false)
  const src = `data:image/png;base64,${painting.imageData}`

  const saveToDisk = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.api.invoke(IpcChannel.PAINTINGS_SAVE, { imageData: painting.imageData, prompt: painting.prompt })
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="mb-3 rounded-lg overflow-hidden relative border border-[rgba(240,171,252,0.10)]"
      style={{ breakInside: 'avoid' }}
    >
      <img
        src={src}
        alt={painting.prompt}
        onClick={onView}
        className="w-full block cursor-zoom-in"
      />
      {hovered && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent flex flex-col justify-end p-[10px] gap-1">
          <p className="m-0 text-[11px] text-[#e4e4e7] overflow-hidden line-clamp-2">
            {painting.prompt}
          </p>
          <div className="flex items-center gap-[6px] flex-wrap">
            <span className="text-[10px] text-[#71717a] flex-1">{painting.modelName} · {painting.width}×{painting.height} · {formatDate(painting.createdAt)}</span>
            <button
              onClick={saveToDisk}
              className="bg-white/10 border-none rounded text-[#93c5fd] cursor-pointer text-[11px] px-[6px] py-[2px]"
            >
              Save
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="bg-white/10 border-none rounded text-[#fca5a5] cursor-pointer text-[11px] px-[6px] py-[2px]"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
