import React from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
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

export function App(): React.ReactElement {
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
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
