'use client'

import type { UserPresence } from '@/services/collaboration-service'

interface RemoteCursorProps {
  user: UserPresence
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
}

export function RemoteCursor({ user, textareaRef }: RemoteCursorProps) {
  if (!textareaRef.current) {
    return null
  }
  // This is a simplified implementation. A real-world scenario would need
  // to calculate the x/y coordinates from the cursor's character position.
  // This often requires a hidden div that mirrors the textarea's content and styles.
  const style = {
    position: 'absolute' as const,
    left: `calc(${user.cursorPosition}ch)`, // This is an approximation
    top: '0px', // This would need to be calculated based on line number
    backgroundColor: user.color,
    width: '2px',
    height: '1.2em',
  }

  return (
    <div style={style}>
      <div
        className="absolute -top-6 whitespace-nowrap rounded-md px-2 py-1 text-sm text-white"
        style={{ backgroundColor: user.color }}
      >
        {user.name}
      </div>
    </div>
  )
} 