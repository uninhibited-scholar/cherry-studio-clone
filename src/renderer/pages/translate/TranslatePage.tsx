import React, { useState, useEffect, useCallback, useRef } from 'react'
import { IpcChannel } from '@shared/IpcChannel'
import { SUPPORTED_LANGUAGES } from '@shared/data/types/translate'
import type { TranslateHistory, LangCode } from '@shared/data/types/translate'
import type { Provider } from '@shared/data/types/provider'
import type { Model } from '@shared/data/types/model'

const LANG_OPTIONS = Object.entries(SUPPORTED_LANGUAGES) as [LangCode, string][]

export function TranslatePage(): React.ReactElement {
  const [sourceText, setSourceText] = useState('')
  const [targetText, setTargetText] = useState('')
  const [sourceLang, setSourceLang] = useState<LangCode>('auto')
  const [targetLang, setTargetLang] = useState<LangCode>('en')
  const [translating, setTranslating] = useState(false)
  const [history, setHistory] = useState<TranslateHistory[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [selectedProvider, setSelectedProvider] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const requestIdRef = useRef<string>('')

  useEffect(() => {
    window.api.invoke(IpcChannel.PROVIDERS_LIST).then((ps) => {
      const list = (ps as Provider[]).filter((p) => p.isEnabled)
      setProviders(list)
      if (list.length > 0) setSelectedProvider(list[0].id)
    })
    window.api.invoke(IpcChannel.TRANSLATE_HISTORY_LIST).then((h) => setHistory(h as TranslateHistory[]))
  }, [])

  useEffect(() => {
    if (!selectedProvider) return
    window.api.invoke(IpcChannel.MODELS_LIST, selectedProvider).then((ms) => {
      const list = (ms as Model[]).filter((m) => m.isEnabled)
      setModels(list)
      if (list.length > 0) setSelectedModel(list[0].id)
    })
  }, [selectedProvider])

  useEffect(() => {
    const unsub = window.api.on(IpcChannel.TRANSLATE_CHUNK, (payload: unknown) => {
      const { requestId, text } = payload as { requestId: string; text: string }
      if (requestId !== requestIdRef.current) return
      setTargetText((prev) => prev + text)
    })
    return unsub
  }, [])

  const translate = useCallback(async () => {
    if (!sourceText.trim() || !selectedProvider || !selectedModel) return
    const requestId = `tr-${Date.now()}`
    requestIdRef.current = requestId
    setTargetText('')
    setTranslating(true)
    try {
      await window.api.invoke(IpcChannel.TRANSLATE_RUN, {
        requestId, sourceText, sourceLang, targetLang, providerId: selectedProvider, modelId: selectedModel
      })
      const h = await window.api.invoke(IpcChannel.TRANSLATE_HISTORY_LIST)
      setHistory(h as TranslateHistory[])
    } finally {
      setTranslating(false)
    }
  }, [sourceText, sourceLang, targetLang, selectedProvider, selectedModel])

  const swap = () => {
    if (sourceLang === 'auto') return
    setSourceLang(targetLang)
    setTargetLang(sourceLang)
    setSourceText(targetText)
    setTargetText(sourceText)
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: '#09090b', color: '#fafafa' }}>
      {/* Main panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24, gap: 12 }}>
        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value as LangCode)} style={selSty}>
            {LANG_OPTIONS.map(([c, l]) => <option key={c} value={c}>{l}</option>)}
          </select>
          <button onClick={swap} disabled={sourceLang === 'auto'} title="Swap" style={{ ...btnSty, background: 'transparent', border: '1px solid #3f3f46', fontSize: 18, padding: '4px 12px', opacity: sourceLang === 'auto' ? 0.4 : 1 }}>⇄</button>
          <select value={targetLang} onChange={(e) => setTargetLang(e.target.value as LangCode)} style={selSty}>
            {LANG_OPTIONS.filter(([c]) => c !== 'auto').map(([c, l]) => <option key={c} value={c}>{l}</option>)}
          </select>
          <div style={{ flex: 1 }} />
          <select value={selectedProvider} onChange={(e) => setSelectedProvider(e.target.value)} style={{ ...selSty, maxWidth: 150 }}>
            {providers.length === 0 && <option value="">No providers</option>}
            {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} style={{ ...selSty, maxWidth: 200 }}>
            {models.length === 0 && <option value="">No models</option>}
            {models.map((m) => <option key={m.id} value={m.id}>{m.displayName ?? m.name}</option>)}
          </select>
        </div>

        {/* Text areas */}
        <div style={{ display: 'flex', gap: 12, flex: 1 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Enter text to translate…"
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) translate() }}
              style={{ flex: 1, ...textareaSty }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={translate} disabled={!sourceText.trim() || translating || !selectedProvider} style={{ ...btnSty, opacity: !sourceText.trim() || translating ? 0.5 : 1 }}>
                {translating ? 'Translating…' : 'Translate (⌘↵)'}
              </button>
              <button onClick={() => { setSourceText(''); setTargetText('') }} style={{ ...btnSty, background: 'transparent', border: '1px solid #3f3f46' }}>Clear</button>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ flex: 1, ...textareaSty, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: targetText ? '#fafafa' : '#52525b' }}>
              {targetText || (translating ? <span style={{ color: '#71717a' }}>Translating…</span> : 'Translation will appear here')}
            </div>
            <button onClick={() => navigator.clipboard.writeText(targetText)} disabled={!targetText} style={{ ...btnSty, background: 'transparent', border: '1px solid #3f3f46', alignSelf: 'flex-start', opacity: targetText ? 1 : 0.4 }}>
              Copy
            </button>
          </div>
        </div>
      </div>

      {/* History */}
      <div style={{ width: 280, borderLeft: '1px solid #27272a', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #27272a' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#71717a', letterSpacing: 1 }}>HISTORY</span>
          {history.length > 0 && (
            <button onClick={async () => { await window.api.invoke(IpcChannel.TRANSLATE_HISTORY_CLEAR); setHistory([]) }} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: 11 }}>Clear</button>
          )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {history.length === 0 ? (
            <p style={{ color: '#52525b', fontSize: 12, padding: 16 }}>No history yet</p>
          ) : history.map((h) => (
            <div
              key={h.id}
              onClick={() => { setSourceText(h.sourceText); setTargetText(h.targetText); setSourceLang(h.sourceLang as LangCode); setTargetLang(h.targetLang as LangCode) }}
              style={{ padding: '10px 16px', borderBottom: '1px solid #18181b', cursor: 'pointer', transition: 'background 0.1s' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#18181b')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <p style={{ fontSize: 12, color: '#a1a1aa', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.sourceText}</p>
              <p style={{ fontSize: 12, color: '#52525b', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>→ {h.targetText}</p>
              <p style={{ fontSize: 10, color: '#3f3f46', margin: '2px 0 0' }}>{h.sourceLang} → {h.targetLang}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const selSty: React.CSSProperties = { background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, padding: '6px 10px', color: '#fafafa', fontSize: 13, outline: 'none' }
const textareaSty: React.CSSProperties = { background: '#18181b', border: '1px solid #27272a', borderRadius: 10, padding: 16, color: '#fafafa', fontSize: 14, outline: 'none', fontFamily: 'inherit', lineHeight: 1.7, resize: 'none' }
const btnSty: React.CSSProperties = { padding: '8px 18px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fafafa', fontSize: 13, cursor: 'pointer' }
