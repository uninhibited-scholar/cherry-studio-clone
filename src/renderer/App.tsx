import React, { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { loadGeneralPrefs } from './pages/settings/sections/GeneralSettings'
import { HomePage } from './pages/home/HomePage'
import { AgentsPage } from './pages/agents/AgentsPage'
import { KnowledgePage } from './pages/knowledge/KnowledgePage'
import { PaintingsPage } from './pages/paintings/PaintingsPage'
import { TranslatePage } from './pages/translate/TranslatePage'
import { NotesPage } from './pages/notes/NotesPage'
import { MiniAppsPage } from './pages/mini-apps/MiniAppsPage'
import { SettingsPage } from './pages/settings/SettingsPage'
import { HistoryPage } from './pages/history/HistoryPage'
import { LibraryPage } from './pages/library/LibraryPage'
import { LaunchpadPage } from './pages/launchpad/LaunchpadPage'
import { FilesPage } from './pages/files/FilesPage'

export function App(): React.ReactElement {
  useEffect(() => {
    const prefs = loadGeneralPrefs()
    document.documentElement.style.setProperty('--chat-font-size', `${prefs.fontSize}px`)
    const isDark = prefs.theme === 'dark'
    document.documentElement.style.colorScheme = prefs.theme
    document.documentElement.style.background = isDark ? '#09090b' : '#fafafa'
    document.documentElement.style.color = isDark ? '#fafafa' : '#09090b'
  }, [])

  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={<HomePage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/knowledge" element={<KnowledgePage />} />
          <Route path="/paintings" element={<PaintingsPage />} />
          <Route path="/translate" element={<TranslatePage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/mini-apps" element={<MiniAppsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/launchpad" element={<LaunchpadPage />} />
          <Route path="/files" element={<FilesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
