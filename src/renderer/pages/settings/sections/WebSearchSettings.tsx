import React, { useEffect, useState } from 'react'
import { IpcChannel } from '@shared/IpcChannel'

type Provider = 'duckduckgo' | 'tavily' | 'searxng'

interface WebSearchConfig {
  provider: Provider
  tavilyApiKey?: string
  searxngUrl?: string
}

export function WebSearchSettings(): React.ReactElement {
  const [config, setConfig] = useState<WebSearchConfig>({ provider: 'duckduckgo' })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.api.invoke(IpcChannel.WEB_SEARCH_CONFIG_GET).then((c: WebSearchConfig) => {
      if (c) setConfig(c)
    })
  }, [])

  async function save() {
    await window.api.invoke(IpcChannel.WEB_SEARCH_CONFIG_SET, config)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const inputCls = 'bg-[#18181b] border border-[#3f3f46] rounded-[6px] text-[#fafafa] px-[10px] py-[6px] text-[13px] w-full box-border'
  const labelCls = 'text-[12px] text-[#a1a1aa] mb-1 block'

  return (
    <div>
      <h2 className="text-[#fafafa] text-[18px] mb-1">Web Search</h2>
      <p className="text-[#71717a] text-[13px] mb-6">
        Configure the search provider used when AI queries the web.
      </p>

      <div className="mb-5">
        <label className={labelCls}>Provider</label>
        <select
          value={config.provider}
          onChange={(e) => setConfig({ ...config, provider: e.target.value as Provider })}
          className={`${inputCls} cursor-pointer`}
        >
          <option value="duckduckgo">DuckDuckGo (no key required)</option>
          <option value="tavily">Tavily (API key required)</option>
          <option value="searxng">SearXNG (self-hosted)</option>
        </select>
      </div>

      {config.provider === 'tavily' && (
        <div className="mb-5">
          <label className={labelCls}>Tavily API Key</label>
          <input
            type="password"
            value={config.tavilyApiKey ?? ''}
            onChange={(e) => setConfig({ ...config, tavilyApiKey: e.target.value })}
            placeholder="tvly-..."
            className={inputCls}
          />
          <p className="text-[11px] text-[#52525b] mt-1">
            Get a key at tavily.com/dashboard
          </p>
        </div>
      )}

      {config.provider === 'searxng' && (
        <div className="mb-5">
          <label className={labelCls}>SearXNG Base URL</label>
          <input
            type="text"
            value={config.searxngUrl ?? ''}
            onChange={(e) => setConfig({ ...config, searxngUrl: e.target.value })}
            placeholder="http://localhost:8080"
            className={inputCls}
          />
          <p className="text-[11px] text-[#52525b] mt-1">
            Your self-hosted SearXNG instance with JSON format enabled.
          </p>
        </div>
      )}

      <button
        onClick={save}
        className={`px-5 py-2 rounded-[6px] border-none text-white cursor-pointer text-[13px] transition-colors duration-200 ${saved ? 'bg-[#16a34a]' : 'bg-[#2563eb]'}`}
      >
        {saved ? '✓ Saved' : 'Save'}
      </button>
    </div>
  )
}
