import React, { useState, useEffect } from 'react'
import { IpcChannel } from '@shared/IpcChannel'

type MiniApp = {
  id: string
  name: string
  url: string
  icon: string
  description: string
  category: string
  isCustom?: boolean
}

const BUILTIN_APPS: MiniApp[] = [
  { id: 'chatgpt',      name: 'ChatGPT',      url: 'https://chat.openai.com',            icon: '🤖', description: 'OpenAI ChatGPT',          category: 'AI' },
  { id: 'claude',       name: 'Claude',       url: 'https://claude.ai',                  icon: '✨', description: 'Anthropic Claude',         category: 'AI' },
  { id: 'gemini',       name: 'Gemini',       url: 'https://gemini.google.com',           icon: '💎', description: 'Google Gemini',            category: 'AI' },
  { id: 'perplexity',   name: 'Perplexity',   url: 'https://www.perplexity.ai',          icon: '🔍', description: 'AI-powered search',        category: 'AI' },
  { id: 'poe',          name: 'Poe',          url: 'https://poe.com',                    icon: '🦋', description: 'Quora Poe',                category: 'AI' },
  { id: 'copilot',      name: 'Copilot',      url: 'https://copilot.microsoft.com',      icon: '🪟', description: 'Microsoft Copilot',        category: 'AI' },
  { id: 'mistral',      name: 'Le Chat',      url: 'https://chat.mistral.ai',            icon: '🌊', description: 'Mistral AI chat',          category: 'AI' },
  { id: 'cohere',       name: 'Cohere',       url: 'https://coral.cohere.com',           icon: '🐚', description: 'Cohere Coral',             category: 'AI' },
  { id: 'huggingchat',  name: 'HuggingChat',  url: 'https://huggingface.co/chat',        icon: '🤗', description: 'Hugging Face chat',        category: 'AI' },
  { id: 'you',          name: 'You.com',      url: 'https://you.com',                    icon: '🎯', description: 'AI search engine',         category: 'AI' },
  { id: 'groq',         name: 'Groq',         url: 'https://groq.com',                   icon: '⚡', description: 'Fast LLM inference',       category: 'AI' },
  { id: 'together',     name: 'Together AI',  url: 'https://api.together.ai/playground', icon: '🤝', description: 'Together AI playground',   category: 'AI' },
  { id: 'excalidraw',   name: 'Excalidraw',   url: 'https://excalidraw.com',             icon: '✏️', description: 'Virtual whiteboard',       category: 'Productivity' },
  { id: 'carbon',       name: 'Carbon',       url: 'https://carbon.now.sh',              icon: '💻', description: 'Beautiful code images',    category: 'Dev Tools' },
  { id: 'regex101',     name: 'Regex101',     url: 'https://regex101.com',               icon: '🔍', description: 'Regex tester & debugger',  category: 'Dev Tools' },
  { id: 'jsonhero',     name: 'JSON Hero',    url: 'https://jsonhero.io',                icon: '📊', description: 'JSON explorer',            category: 'Dev Tools' },
  { id: 'tldr',         name: 'TLDR Pages',   url: 'https://tldr.ostera.io',             icon: '📖', description: 'Simplified man pages',     category: 'Dev Tools' },
  { id: 'squoosh',      name: 'Squoosh',      url: 'https://squoosh.app',                icon: '🖼️', description: 'Image compression',        category: 'Media' },
  { id: 'caniuse',      name: 'Can I Use',    url: 'https://caniuse.com',                icon: '🌐', description: 'Browser support tables',   category: 'Dev Tools' },
  { id: 'bundlephobia', name: 'Bundlephobia', url: 'https://bundlephobia.com',           icon: '📦', description: 'npm package size',         category: 'Dev Tools' },
  { id: 'coolors',      name: 'Coolors',      url: 'https://coolors.co',                 icon: '🎨', description: 'Color palette generator', category: 'Design' },
  { id: 'type-scale',   name: 'Type Scale',   url: 'https://typescale.com',              icon: '📝', description: 'Typography scale tool',   category: 'Design' },
  { id: 'haikei',       name: 'Haikei',       url: 'https://haikei.app',                 icon: '🌊', description: 'SVG background generator',category: 'Design' },
  { id: 'mathway',      name: 'Mathway',      url: 'https://www.mathway.com',            icon: '🧮', description: 'Math problem solver',     category: 'Education' },
  { id: 'wolframalpha', name: 'WolframAlpha', url: 'https://www.wolframalpha.com',       icon: '🔬', description: 'Computational knowledge', category: 'Education' },
]

const ALL_CATEGORIES = ['All', 'AI', 'Productivity', 'Dev Tools', 'Design', 'Media', 'Education']

const STORAGE_KEY = 'cherry-clone:mini-apps:custom'

function loadCustomApps(): MiniApp[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveCustomApps(apps: MiniApp[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps))
}

export function MiniAppsPage(): React.ReactElement {
  const [customApps, setCustomApps] = useState<MiniApp[]>(loadCustomApps)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newIcon, setNewIcon] = useState('🔗')
  const [newCategory, setNewCategory] = useState('Custom')
  const [filter, setFilter] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => { saveCustomApps(customApps) }, [customApps])

  const allApps = [...BUILTIN_APPS, ...customApps.map((a) => ({ ...a, category: a.category ?? 'Custom' }))]
  const filtered = allApps
    .filter((a) => activeCategory === 'All' || a.category === activeCategory)
    .filter((a) => !filter.trim() || a.name.toLowerCase().includes(filter.toLowerCase()) || a.description.toLowerCase().includes(filter.toLowerCase()))

  const openApp = (app: MiniApp) => {
    window.api.invoke(IpcChannel.MINI_APPS_OPEN, { url: app.url, title: app.name })
  }

  const handleAddCustom = () => {
    if (!newName.trim() || !newUrl.trim()) return
    const url = newUrl.startsWith('http') ? newUrl : `https://${newUrl}`
    const app: MiniApp = {
      id: `custom-${Date.now()}`,
      name: newName.trim(),
      url,
      icon: newIcon,
      description: url,
      category: newCategory.trim() || 'Custom',
      isCustom: true
    }
    setCustomApps((prev) => [...prev, app])
    setNewName('')
    setNewUrl('')
    setNewIcon('🔗')
    setNewCategory('Custom')
    setShowAdd(false)
  }

  const handleDeleteCustom = (id: string) => {
    setCustomApps((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <div className="flex flex-col h-full bg-[rgba(10,0,20,0.60)] text-[#fafafa]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#27272a] flex items-center gap-3 shrink-0">
        <h2 className="m-0 text-[15px] font-bold flex-none">🧩 Mini Apps</h2>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter apps…"
          className="bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.15)] rounded-md text-[#fafafa] text-[13px] outline-none px-[10px] py-[6px] w-full box-border"
        />
        <button onClick={() => setShowAdd(true)} className="bg-[#2563eb] border-none rounded-md text-white cursor-pointer text-[12px] font-semibold px-[14px] py-[6px] whitespace-nowrap shrink-0">+ Add</button>
      </div>

      {/* Category tabs */}
      <div className="px-5 pt-2 pb-0 border-b border-[#27272a] flex gap-1 flex-wrap shrink-0">
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-[10px] py-[4px] mb-2 rounded-[20px] border-none cursor-pointer text-[11px] font-medium ${activeCategory === cat ? 'bg-[#2563eb] text-white' : 'bg-[#27272a] text-[#a1a1aa]'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Add custom app form */}
      {showAdd && (
        <div className="px-6 py-[14px] border-b border-[#27272a] bg-[rgba(255,255,255,0.04)] flex gap-[10px] items-end shrink-0">
          <div>
            <label className="block text-[11px] text-[#71717a] mb-1">Icon</label>
            <input
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)}
              className="bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.15)] rounded-md text-[#fafafa] text-[20px] outline-none px-[6px] py-1 w-[52px] text-center box-border"
              maxLength={2}
            />
          </div>
          <div className="flex-[0_0_140px]">
            <label className="block text-[11px] text-[#71717a] mb-1">Name</label>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="My App"
              className="bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.15)] rounded-md text-[#fafafa] text-[13px] outline-none px-[10px] py-[6px] w-full box-border"
            />
          </div>
          <div className="flex-[0_0_110px]">
            <label className="block text-[11px] text-[#71717a] mb-1">Category</label>
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Custom"
              className="bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.15)] rounded-md text-[#fafafa] text-[13px] outline-none px-[10px] py-[6px] w-full box-border"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[11px] text-[#71717a] mb-1">URL</label>
            <input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://example.com"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustom(); if (e.key === 'Escape') setShowAdd(false) }}
              className="bg-[rgba(255,255,255,0.04)] border border-[rgba(240,171,252,0.15)] rounded-md text-[#fafafa] text-[13px] outline-none px-[10px] py-[6px] w-full box-border"
            />
          </div>
          <button onClick={handleAddCustom} className="bg-[#2563eb] border-none rounded-md text-white cursor-pointer text-[12px] font-semibold px-[14px] py-[6px] whitespace-nowrap shrink-0">Add</button>
          <button onClick={() => setShowAdd(false)} className="bg-[#27272a] border-none rounded-md text-[#a1a1aa] cursor-pointer text-[12px] px-[14px] py-[6px] whitespace-nowrap shrink-0">Cancel</button>
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-5">
        {filtered.length === 0 ? (
          <div className="text-center mt-[60px] text-[#52525b]">
            <p className="text-[14px]">No apps found for "{filter}"</p>
          </div>
        ) : (
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
            {filtered.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                onOpen={() => openApp(app)}
                onDelete={app.isCustom ? () => handleDeleteCustom(app.id) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-[#18181b] px-6 py-[6px] shrink-0">
        <span className="text-[11px] text-[#52525b]">{allApps.length} apps · {customApps.length} custom</span>
      </div>
    </div>
  )
}

function AppCard({
  app, onOpen, onDelete
}: {
  app: MiniApp
  onOpen: () => void
  onDelete?: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`rounded-xl border cursor-pointer flex flex-col items-center gap-2 p-4 transition-all duration-[120ms] relative select-none ${hovered ? 'border-[#3f3f46] bg-[rgba(255,255,255,0.04)]' : 'border-[#27272a] bg-[#111113]'}`}
    >
      <span className="text-[36px] leading-none">{app.icon}</span>
      <p className="m-0 text-[13px] font-semibold text-[#fafafa] text-center">{app.name}</p>
      <p className="m-0 text-[10px] text-[#52525b] text-center leading-[1.4] overflow-hidden line-clamp-2">
        {app.description}
      </p>
      {app.isCustom && hovered && onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="absolute top-[6px] right-[6px] bg-white/[0.08] border-none rounded text-[#71717a] cursor-pointer text-[10px] px-[5px] py-[2px]"
          title="Remove"
        >
          ✕
        </button>
      )}
    </div>
  )
}
