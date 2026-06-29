import React from 'react'
import { IpcChannel } from '@shared/IpcChannel'
import type { Assistant } from '@shared/data/types/assistant'

type Props = {
  assistant: Assistant
  onUpdate: (updated: Assistant) => void
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display
}: {
  label: string
  value: number | undefined
  min: number
  max: number
  step: number
  onChange: (v: number | undefined) => void
  display?: (v: number) => string
}) {
  const val = value ?? undefined
  return (
    <div className="flex items-center gap-3">
      <span className="text-[#71717a] text-xs w-[140px] shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={val ?? min}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-[#2563eb]"
      />
      <span className="text-[#a1a1aa] text-xs w-10 text-right tabular-nums">
        {val !== undefined ? (display ? display(val) : val.toString()) : 'auto'}
      </span>
      {val !== undefined && (
        <button
          onClick={() => onChange(undefined)}
          title="Reset to default"
          className="bg-transparent border-0 text-[#52525b] cursor-pointer text-xs p-0"
        >
          ✕
        </button>
      )}
    </div>
  )
}

async function saveAssistant(assistant: Assistant) {
  await window.api.invoke(IpcChannel.ASSISTANTS_UPSERT, assistant)
}

export function ModelParamsPanel({ assistant, onUpdate }: Props): React.ReactElement {
  async function update(patch: Partial<Assistant>) {
    const updated = { ...assistant, ...patch, updatedAt: Date.now() }
    onUpdate(updated)
    await saveAssistant(updated)
  }

  return (
    <div className="bg-[#18181b] border-b border-b-[#27272a] px-4 py-3">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-[#fafafa]">Model Parameters</span>
        <button
          onClick={() => update({ temperature: 1, topP: undefined, frequencyPenalty: undefined, presencePenalty: undefined, maxTokens: undefined })}
          className="ml-auto text-xs bg-transparent border border-[#3f3f46] text-[#71717a] cursor-pointer px-2 py-0.5 rounded"
        >
          Reset all
        </button>
      </div>
      <div className="flex flex-col gap-2.5">
        <SliderRow
          label="Temperature"
          value={assistant.temperature}
          min={0}
          max={2}
          step={0.1}
          onChange={(v) => update({ temperature: v ?? 1 })}
          display={(v) => v.toFixed(1)}
        />
        <SliderRow
          label="Top P"
          value={assistant.topP}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => update({ topP: v })}
          display={(v) => v.toFixed(2)}
        />
        <SliderRow
          label="Frequency Penalty"
          value={assistant.frequencyPenalty}
          min={-2}
          max={2}
          step={0.1}
          onChange={(v) => update({ frequencyPenalty: v })}
          display={(v) => v.toFixed(1)}
        />
        <SliderRow
          label="Presence Penalty"
          value={assistant.presencePenalty}
          min={-2}
          max={2}
          step={0.1}
          onChange={(v) => update({ presencePenalty: v })}
          display={(v) => v.toFixed(1)}
        />
        <div className="flex items-center gap-3">
          <span className="text-[#71717a] text-xs w-[140px] shrink-0">Max Tokens</span>
          <input
            type="number"
            min={0}
            step={256}
            placeholder="auto"
            value={assistant.maxTokens ?? ''}
            onChange={(e) => {
              const n = parseInt(e.target.value)
              update({ maxTokens: isNaN(n) || n <= 0 ? undefined : n })
            }}
            className="w-24 bg-[#27272a] border border-[#3f3f46] rounded text-[#fafafa] text-xs px-2 py-1 outline-none"
          />
        </div>
      </div>
    </div>
  )
}
