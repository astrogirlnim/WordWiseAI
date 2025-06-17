'use client'

import { useEffect, useState } from 'react'
import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'

interface UseYjsProps {
  roomId: string
}

export function useYjs({ roomId }: UseYjsProps) {
  const [yDoc] = useState(() => new Y.Doc())
  const [provider, setProvider] = useState<WebrtcProvider | null>(null)

  useEffect(() => {
    // The WebrtcProvider requires a password for signaling server authentication,
    // but for this MVP, we'll use a hardcoded, non-sensitive password.
    // In a production environment, this should be a securely managed secret.
    const webrtcProvider = new WebrtcProvider(roomId, yDoc, {
      password: 'not-so-secret-password',
    })

    setProvider(webrtcProvider)

    return () => {
      webrtcProvider.destroy()
    }
  }, [roomId, yDoc])

  return { yDoc, provider }
} 