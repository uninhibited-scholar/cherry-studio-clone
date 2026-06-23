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
    <div style={{ display: 'flex', height: '100%', background: '#09090b', color: '#fafafa', overflow: 'hidden' }}>
      {/* ── Left: generation panel ── */}
      <aside style={{ width: 280, borderRight: '1px solid #27272a', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #27272a' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>🎨 Paintings</h2>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            <button onClick={() => setShowSketchPad(false)} style={{ flex: 1, padding: '6px 0', fontSize: 11, border: '1px solid #3f3f46', borderRadius: 4, background: !showSketchPad ? '#2563eb' : 'transparent', color: !showSketchPad ? '#fff' : '#a1a1aa', cursor: 'pointer' }}>Generate</button>
            <button onClick={() => setShowSketchPad(true)} style={{ flex: 1, padding: '6px 0', fontSize: 11, border: '1px solid #3f3f46', borderRadius: 4, background: showSketchPad ? '#2563eb' : 'transparent', color: showSketchPad ? '#fff' : '#a1a1aa', cursor: 'pointer' }}>Sketch</button>
          </div>

          {/* Provider */}
          <label style={labelStyle}>Provider</label>
          <select
            value={selectedProviderId}
            onChange={(e) => setSelectedProviderId(e.target.value)}
            style={selectStyle}
          >
            {providers.length === 0 && <option value="">No providers configured</option>}
            {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          {/* Model */}
          <label style={labelStyle}>Model</label>
          <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} style={selectStyle}>
            {models.length === 0 && <option value="">—</option>}
            {models.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
            {/* allow typing custom model */}
          </select>
          <input
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            placeholder="or type model name…"
            style={{ ...inputStyle, marginTop: 4 }}
          />

          {/* Size */}
          <label style={labelStyle}>Size</label>
          <select value={size} onChange={(e) => setSize(e.target.value as Size)} style={selectStyle}>
            {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Prompt */}
          <label style={labelStyle}>Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate…"
            rows={5}
            style={{ ...inputStyle, resize: 'vertical' }}
          />

          {/* Negative prompt */}
          <label style={labelStyle}>Negative Prompt</label>
          <textarea
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            placeholder="What to avoid (optional)…"
            rows={2}
            style={{ ...inputStyle, resize: 'vertical' }}
          />

          {!showSketchPad && (
            <>
              {error && (
                <div style={{ marginTop: 8, padding: '8px 10px', background: '#450a0a', borderRadius: 6, fontSize: 11, color: '#fca5a5', wordBreak: 'break-all' }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim() || !selectedProviderId || !selectedModel}
                style={{
                  marginTop: 12,
                  width: '100%',
                  padding: '10px',
                  borderRadius: 8,
                  border: 'none',
                  background: generating ? '#1d4ed8' : '#2563eb',
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: generating ? 'default' : 'pointer',
                  opacity: (!prompt.trim() || !selectedProviderId || !selectedModel) ? 0.5 : 1
                }}
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

        <div style={{ padding: '10px 16px' }}>
          <p style={{ fontSize: 11, color: '#52525b', margin: 0 }}>{paintings.length} painting{paintings.length !== 1 ? 's' : ''} saved</p>
        </div>
      </aside>

      {/* ── Right: gallery ── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {paintings.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#52525b' }}>
            <span style={{ fontSize: 56 }}>🖼️</span>
            <p style={{ fontSize: 14, color: '#71717a' }}>Your generated images will appear here</p>
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
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, cursor: 'zoom-out'
          }}
        >
          <img src={lightboxSrc} alt="painting" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8, boxShadow: '0 0 40px rgba(0,0,0,0.8)' }} />
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
      <p style={{ fontSize: 12, color: '#a1a1aa', marginBottom: 8 }}>Brush Settings</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 11, color: '#71717a', display: 'block', marginBottom: 4 }}>Color</label>
          <input
            type="color"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
            style={{ width: '100%', height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 11, color: '#71717a', display: 'block', marginBottom: 4 }}>Size: {brushSize}</label>
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            style={{ width: '100%' }}
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
        style={{ width: '100%', height: 240, border: '1px solid #3f3f46', borderRadius: 8, background: '#18181b', cursor: 'crosshair', marginBottom: 12, display: 'block' }}
      />

      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <button onClick={clearCanvas} style={{ flex: 1, padding: '6px 0', fontSize: 11, border: '1px solid #3f3f46', borderRadius: 4, background: 'transparent', color: '#a1a1aa', cursor: 'pointer' }}>🗑 Clear</button>
        <button onClick={saveSketch} style={{ flex: 1, padding: '6px 0', fontSize: 11, border: 'none', borderRadius: 4, background: '#2563eb', color: '#fff', cursor: 'pointer' }}>💾 Save</button>
      </div>

      {sketches.length > 0 && (
        <>
          <p style={{ fontSize: 11, color: '#a1a1aa', marginBottom: 6 }}>Saved Sketches ({sketches.length})</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
            {sketches.map((sketch) => (
              <div key={sketch.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <img src={sketch.dataUrl} alt="sketch" style={{ width: 40, height: 40, borderRadius: 4, border: '1px solid #27272a' }} />
                <div style={{ flex: 1, fontSize: 10, color: '#71717a' }}>{new Date(sketch.savedAt).toLocaleTimeString()}</div>
                <button onClick={() => onDeleteSketch(sketch.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 12 }}>✕</button>
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
      style={{ breakInside: 'avoid', marginBottom: 12, borderRadius: 8, overflow: 'hidden', position: 'relative', border: '1px solid #27272a' }}
    >
      <img
        src={src}
        alt={painting.prompt}
        onClick={onView}
        style={{ width: '100%', display: 'block', cursor: 'zoom-in' }}
      />
      {hovered && (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 10, gap: 4 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#e4e4e7', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {painting.prompt}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, color: '#71717a', flex: 1 }}>{painting.modelName} · {painting.width}×{painting.height} · {formatDate(painting.createdAt)}</span>
            <button
              onClick={saveToDisk}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 4, color: '#93c5fd', cursor: 'pointer', fontSize: 11, padding: '2px 6px' }}
            >
              Save
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 4, color: '#fca5a5', cursor: 'pointer', fontSize: 11, padding: '2px 6px' }}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, color: '#71717a', marginBottom: 4, marginTop: 10
}

const inputStyle: React.CSSProperties = {
  background: '#18181b', border: '1px solid #3f3f46', borderRadius: 6, color: '#fafafa',
  fontSize: 12, outline: 'none', padding: '6px 8px', width: '100%', boxSizing: 'border-box'
}

const selectStyle: React.CSSProperties = {
  ...inputStyle, cursor: 'pointer'
}
