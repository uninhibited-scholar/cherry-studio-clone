import React, { useState, useEffect, useRef } from 'react'
import { parseVariables, fillTemplate } from '@shared/utils/promptTemplate'

type Props = {
  template: string
  onFill: (result: string) => void
  onClose: () => void
}

export function TemplateVariableDialog({ template, onFill, onClose }: Props): React.ReactElement {
  const variables = parseVariables(template)
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const v of variables) {
      init[v.name] = v.defaultValue ?? ''
    }
    return init
  })
  const firstRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    firstRef.current?.focus()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onFill(fillTemplate(template, values))
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.15)] rounded-xl p-6 w-[420px] max-w-[90vw] shadow-2xl">
        <h3 className="m-0 mb-4 text-[15px] font-semibold text-[#fafafa]">Fill Template Variables</h3>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-3">
            {variables.map((v, i) => (
              <div key={v.name}>
                <label className="block text-[11px] text-[#71717a] mb-1 font-semibold uppercase tracking-wider">
                  {v.name}
                  {v.defaultValue !== undefined && (
                    <span className="text-[#52525b] normal-case font-normal ml-1">(default: {v.defaultValue || '—'})</span>
                  )}
                </label>
                <input
                  ref={i === 0 ? firstRef : undefined}
                  value={values[v.name] ?? ''}
                  onChange={(e) => setValues((prev) => ({ ...prev, [v.name]: e.target.value }))}
                  placeholder={v.defaultValue ?? `Enter ${v.name}…`}
                  className="w-full bg-[rgba(10,0,20,0.60)] border border-[rgba(240,171,252,0.15)] rounded-md text-[#fafafa] text-[13px] outline-none px-3 py-[7px] box-border focus:border-[#2563eb]"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-5">
            <button
              type="submit"
              className="bg-[#2563eb] border-none rounded-md text-white cursor-pointer text-[12px] font-semibold px-4 py-2"
            >
              Insert
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-transparent border border-[rgba(240,171,252,0.15)] rounded-md text-[#a1a1aa] cursor-pointer text-[12px] px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
