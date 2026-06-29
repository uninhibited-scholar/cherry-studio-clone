import React, { useState, useEffect } from 'react'
import { IpcChannel } from '@shared/IpcChannel'
import type { Provider } from '@shared/data/types/provider'
import type { Model } from '@shared/data/types/model'

type Props = {
  open: boolean
  onClose: () => void
  onCreated: (data: { name: string; emoji: string; prompt: string; providerId: string; modelId: string }) => void
}

export function CreateAssistantModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🤖')
  const [prompt, setPrompt] = useState('')
  const [providers, setProviders] = useState<Provider[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [selectedProviderId, setSelectedProviderId] = useState('')
  const [selectedModelId, setSelectedModelId] = useState('')

  useEffect(() => {
    if (!open) return
    window.api.invoke(IpcChannel.PROVIDERS_LIST).then((list) => {
      const ps = list as Provider[]
      const enabled = ps.filter((p) => p.isEnabled)
      setProviders(enabled)
      if (enabled.length > 0) setSelectedProviderId(enabled[0].id)
    })
  }, [open])

  useEffect(() => {
    if (!selectedProviderId) return
    window.api.invoke(IpcChannel.MODELS_LIST, selectedProviderId).then((list) => {
      const ms = list as Model[]
      const enabled = ms.filter((m) => m.isEnabled)
      setModels(enabled)
      if (enabled.length > 0) setSelectedModelId(enabled[0].id)
      else setSelectedModelId('')
    })
  }, [selectedProviderId])

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onCreated({ name: name.trim(), emoji, prompt, providerId: selectedProviderId, modelId: selectedModelId })
    setName('')
    setEmoji('🤖')
    setPrompt('')
    onClose()
  }

  const canCreate = providers.length > 0 && !!selectedModelId

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#18181b] border border-[#3f3f46] rounded-xl p-6 w-[440px] flex flex-col gap-[14px]"
      >
        <h2 className="text-[#fafafa] m-0 text-[16px]">New Assistant</h2>

        <div className="flex gap-2">
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className={`${inputCls} w-12 shrink-0 text-center px-1`}
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="助手名称"
            required
            className={`${inputCls} flex-1 w-auto`}
          />
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="System prompt (optional)"
          rows={3}
          className={`${inputCls} resize-y`}
        />

        {providers.length === 0 ? (
          <div className="bg-[rgba(234,179,8,0.1)] border border-[rgba(234,179,8,0.4)] rounded-lg px-[14px] py-[10px] text-[13px] text-[#fbbf24]">
            ⚠️ 还没有可用的 Provider。请先到{' '}
            <button
              type="button"
              onClick={() => { onClose(); window.location.hash = '#/settings' }}
              className="bg-none border-none text-[#60a5fa] cursor-pointer p-0 text-[13px] underline"
            >
              设置 → Providers
            </button>
            {' '}添加 API Key 并启用至少一个模型。
          </div>
        ) : (
          <>
            <select
              value={selectedProviderId}
              onChange={(e) => setSelectedProviderId(e.target.value)}
              className={inputCls}
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {models.length === 0 ? (
              <div className="bg-[rgba(234,179,8,0.1)] border border-[rgba(234,179,8,0.4)] rounded-lg px-[14px] py-[10px] text-[13px] text-[#fbbf24]">
                ⚠️ 该 Provider 下没有启用的模型。请到{' '}
                <button
                  type="button"
                  onClick={() => { onClose(); window.location.hash = '#/settings' }}
                  className="bg-none border-none text-[#60a5fa] cursor-pointer p-0 text-[13px] underline"
                >
                  设置 → Providers
                </button>
                {' '}启用至少一个模型。
              </div>
            ) : (
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className={inputCls}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>{m.displayName ?? m.name}</option>
                ))}
              </select>
            )}
          </>
        )}

        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-[18px] py-2 rounded-lg border-none bg-[#27272a] text-[#fafafa] text-[13px] cursor-pointer">取消</button>
          <button type="submit" disabled={!canCreate} className={`px-[18px] py-2 rounded-lg border-none text-[#fafafa] text-[13px] cursor-pointer ${canCreate ? 'bg-[#2563eb]' : 'bg-[#374151]'}`}>创建</button>
        </div>
      </form>
    </div>
  )
}

const inputCls = 'bg-[#27272a] border border-[#3f3f46] rounded-lg px-3 py-2 text-[#fafafa] text-[13px] outline-none w-full box-border'
