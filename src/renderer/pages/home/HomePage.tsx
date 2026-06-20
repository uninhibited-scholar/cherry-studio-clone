import React, { useState, useCallback, useEffect } from 'react'
import { useAssistants } from '../../hooks/useAssistants'
import { useTopics } from '../../hooks/useTopics'
import { useChat } from '../../hooks/useChat'
import { AssistantSidebar } from './components/AssistantSidebar'
import { MessageThread } from './components/MessageThread'
import { InputBar } from './components/InputBar'
import { CreateAssistantModal } from './components/CreateAssistantModal'
import { IpcChannel } from '@shared/IpcChannel'
import { loadGeneralPrefs } from '../settings/sections/GeneralSettings'
import type { Assistant } from '@shared/data/types/assistant'
import type { Topic } from '@shared/data/types/message'

export function HomePage(): React.ReactElement {
  const { assistants, createAssistant } = useAssistants()
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { topics, createTopic, deleteTopic, renameTopic } = useTopics(selectedAssistant?.id ?? null)
  const { messages, streaming, streamingText, searching, sendMessage, abort, deleteMessage, regenerate, editResend, selectedKnowledgeBaseId, setSelectedKnowledgeBaseId } = useChat(
    selectedTopic?.id ?? null,
    selectedAssistant
  )

  const handleSelectAssistant = useCallback(
    (a: Assistant) => {
      setSelectedAssistant(a)
      setSelectedTopic(null)
    },
    []
  )

  const handleSelectTopic = useCallback((t: Topic) => {
    setSelectedTopic(t)
  }, [])

  const handleNewTopic = useCallback(async () => {
    const t = await createTopic()
    if (t) setSelectedTopic(t)
  }, [createTopic])

  const handleDeleteTopic = useCallback(
    async (id: string) => {
      await deleteTopic(id)
      if (selectedTopic?.id === id) setSelectedTopic(null)
    },
    [deleteTopic, selectedTopic]
  )

  const handleCreateAssistant = useCallback(
    async (data: { name: string; emoji: string; prompt: string; providerId: string; modelId: string }) => {
      const a = await createAssistant({ ...data, temperature: 1 })
      setSelectedAssistant(a)
    },
    [createAssistant]
  )

  const canChat = Boolean(selectedTopic && selectedAssistant?.providerId && selectedAssistant?.modelId)
  const prefs = loadGeneralPrefs()

  // Handle menu events from main process
  useEffect(() => {
    const offNew = window.api.on(IpcChannel.MENU_NEW_TOPIC, () => {
      if (selectedAssistant) handleNewTopic()
    })
    const offExport = window.api.on(IpcChannel.MENU_EXPORT_TOPIC, () => {
      if (selectedTopic) window.api.invoke(IpcChannel.EXPORT_TOPIC, selectedTopic.id)
    })
    return () => { offNew(); offExport() }
  }, [selectedAssistant, selectedTopic, handleNewTopic])

  return (
    <div style={{ display: 'flex', height: '100%', background: '#09090b' }}>
      <AssistantSidebar
        assistants={assistants}
        selectedAssistantId={selectedAssistant?.id ?? null}
        topics={topics}
        selectedTopicId={selectedTopic?.id ?? null}
        onSelectAssistant={handleSelectAssistant}
        onSelectTopic={handleSelectTopic}
        onNewTopic={handleNewTopic}
        onDeleteTopic={handleDeleteTopic}
        onRenameTopicLocal={renameTopic}
        onCreateAssistant={() => setShowCreateModal(true)}
      />

      {/* Chat panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div
          style={{
            height: 48,
            borderBottom: '1px solid #27272a',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: 10,
            flexShrink: 0
          }}
        >
          {selectedAssistant ? (
            <>
              <span style={{ fontSize: 18 }}>{selectedAssistant.emoji ?? '🤖'}</span>
              <span style={{ color: '#fafafa', fontSize: 14, fontWeight: 500 }}>{selectedAssistant.name}</span>
              {selectedTopic && (
                <>
                  <span style={{ color: '#52525b' }}>›</span>
                  <span style={{ color: '#71717a', fontSize: 13 }}>{selectedTopic.title}</span>
                </>
              )}
            </>
          ) : (
            <span style={{ color: '#52525b', fontSize: 13 }}>Select an assistant to start</span>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {searching && (
              <span style={{ color: '#60a5fa', fontSize: 12 }}>🔍 Searching…</span>
            )}
            {selectedTopic && (
              <button
                title="Export conversation"
                onClick={() => window.api.invoke(IpcChannel.EXPORT_TOPIC, selectedTopic.id)}
                style={{
                  background: 'transparent', border: '1px solid #3f3f46', borderRadius: 6,
                  color: '#a1a1aa', cursor: 'pointer', fontSize: 13, padding: '3px 10px'
                }}
              >
                ↓ Export
              </button>
            )}
          </div>
        </div>

        {selectedTopic ? (
          <>
            <MessageThread
              messages={messages}
              streamingText={streamingText}
              streaming={streaming}
              onDelete={deleteMessage}
              onRegenerate={regenerate}
              onEditResend={editResend}
              showTimestamps={prefs.showTimestamps}
            />
            <InputBar
              onSend={sendMessage}
              onAbort={abort}
              streaming={streaming}
              disabled={!canChat}
              selectedKnowledgeBaseId={selectedKnowledgeBaseId}
              onSelectKnowledgeBase={setSelectedKnowledgeBaseId}
              mcpTools={mcpTools}
              setMcpTools={setMcpTools}
            />
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#52525b'
            }}
          >
            <div style={{ fontSize: 56, marginBottom: 16 }}>🍒</div>
            <p style={{ fontSize: 16, color: '#71717a' }}>
              {selectedAssistant ? 'Create a new topic →' : 'Choose an assistant from the sidebar'}
            </p>
            {!selectedAssistant && (
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  marginTop: 16,
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#2563eb',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 13
                }}
              >
                + New Assistant
              </button>
            )}
            {selectedAssistant && (
              <button
                onClick={handleNewTopic}
                style={{
                  marginTop: 16,
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#2563eb',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 13
                }}
              >
                + New Topic
              </button>
            )}
          </div>
        )}
      </div>

      <CreateAssistantModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleCreateAssistant}
      />
    </div>
  )
}
