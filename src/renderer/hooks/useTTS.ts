import { useState, useCallback, useRef } from 'react'

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const currentTextRef = useRef<string | null>(null)

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  const speak = useCallback((text: string) => {
    if (!isSupported) return
    // If same message is speaking, stop it
    if (isSpeaking && currentTextRef.current === text) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      currentTextRef.current = null
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => { setIsSpeaking(false); currentTextRef.current = null }
    utterance.onerror = () => { setIsSpeaking(false); currentTextRef.current = null }
    currentTextRef.current = text
    window.speechSynthesis.speak(utterance)
  }, [isSupported, isSpeaking])

  const stop = useCallback(() => {
    if (!isSupported) return
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
    currentTextRef.current = null
  }, [isSupported])

  return { speak, stop, isSpeaking, isSupported, currentText: currentTextRef.current }
}
