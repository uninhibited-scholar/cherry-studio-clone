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
    <div className="flex h-full bg-[rgba(10,0,20,0.60)] text-[#fafafa]">
      {/* Main panel */}
      <div className="flex-1 flex flex-col p-6 gap-3">
        {/* Controls */}
        <div className="flex items-center gap-[10px] flex-wrap">
          <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value as LangCode)} className="bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.15)] rounded-lg px-[10px] py-[6px] text-[#fafafa] text-[13px] outline-none">
            {LANG_OPTIONS.map(([c, l]) => <option key={c} value={c}>{l}</option>)}
          </select>
          <button onClick={swap} disabled={sourceLang === 'auto'} title="Swap" className={`px-3 py-1 rounded-lg border border-[rgba(240,171,252,0.15)] bg-transparent text-[#fafafa] text-[18px] cursor-pointer ${sourceLang === 'auto' ? 'opacity-40' : ''}`}>⇄</button>
          <select value={targetLang} onChange={(e) => setTargetLang(e.target.value as LangCode)} className="bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.15)] rounded-lg px-[10px] py-[6px] text-[#fafafa] text-[13px] outline-none">
            {LANG_OPTIONS.filter(([c]) => c !== 'auto').map(([c, l]) => <option key={c} value={c}>{l}</option>)}
          </select>
          <div className="flex-1" />
          <select value={selectedProvider} onChange={(e) => setSelectedProvider(e.target.value)} className="bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.15)] rounded-lg px-[10px] py-[6px] text-[#fafafa] text-[13px] outline-none max-w-[150px]">
            {providers.length === 0 && <option value="">No providers</option>}
            {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.15)] rounded-lg px-[10px] py-[6px] text-[#fafafa] text-[13px] outline-none max-w-[200px]">
            {models.length === 0 && <option value="">No models</option>}
            {models.map((m) => <option key={m.id} value={m.id}>{m.displayName ?? m.name}</option>)}
          </select>
        </div>

        {/* Text areas */}
        <div className="flex gap-3 flex-1">
          <div className="flex-1 flex flex-col gap-2">
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Enter text to translate…"
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) translate() }}
              className="flex-1 bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.10)] rounded-[10px] p-4 text-[#fafafa] text-[14px] outline-none font-[inherit] leading-[1.7] resize-none"
            />
            <div className="flex gap-2">
              <button onClick={translate} disabled={!sourceText.trim() || translating || !selectedProvider} className={`px-[18px] py-2 rounded-lg border-none bg-[#2563eb] text-[#fafafa] text-[13px] cursor-pointer ${!sourceText.trim() || translating ? 'opacity-50' : ''}`}>
                {translating ? 'Translating…' : 'Translate (⌘↵)'}
              </button>
              <button onClick={() => { setSourceText(''); setTargetText('') }} className="px-[18px] py-2 rounded-lg bg-transparent border border-[rgba(240,171,252,0.15)] text-[#fafafa] text-[13px] cursor-pointer">Clear</button>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-2">
            <div className={`flex-1 bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.10)] rounded-[10px] p-4 text-[14px] outline-none font-[inherit] leading-[1.7] overflow-y-auto whitespace-pre-wrap break-words ${targetText ? 'text-[#fafafa]' : 'text-[#52525b]'}`}>
              {targetText || (translating ? <span className="text-[#71717a]">Translating…</span> : 'Translation will appear here')}
            </div>
            <button onClick={() => navigator.clipboard.writeText(targetText)} disabled={!targetText} className={`px-[18px] py-2 rounded-lg bg-transparent border border-[rgba(240,171,252,0.15)] text-[#fafafa] text-[13px] cursor-pointer self-start ${targetText ? '' : 'opacity-40'}`}>
              Copy
            </button>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="w-[280px] border-l border-[#27272a] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272a]">
          <span className="text-[11px] font-semibold text-[#71717a] tracking-[1px]">HISTORY</span>
          {history.length > 0 && (
            <button onClick={async () => { await window.api.invoke(IpcChannel.TRANSLATE_HISTORY_CLEAR); setHistory([]) }} className="bg-transparent border-none text-[#71717a] cursor-pointer text-[11px]">Clear</button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {history.length === 0 ? (
            <p className="text-[#52525b] text-[12px] p-4">No history yet</p>
          ) : history.map((h) => (
            <div
              key={h.id}
              onClick={() => { setSourceText(h.sourceText); setTargetText(h.targetText); setSourceLang(h.sourceLang as LangCode); setTargetLang(h.targetLang as LangCode) }}
              className="px-4 py-[10px] border-b border-[#18181b] cursor-pointer transition-colors"
              onMouseEnter={(e) => (e.currentTarget.style.background = '#18181b')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <p className="text-[12px] text-[#a1a1aa] m-0 overflow-hidden text-ellipsis whitespace-nowrap">{h.sourceText}</p>
              <p className="text-[12px] text-[#52525b] mt-[2px] mb-0 overflow-hidden text-ellipsis whitespace-nowrap">→ {h.targetText}</p>
              <p className="text-[10px] text-[#3f3f46] mt-[2px] mb-0">{h.sourceLang} → {h.targetLang}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
