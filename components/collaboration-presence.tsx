'use client'

import { useState, useEffect, useMemo } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CollaborationService } from '@/services/collaboration-service'
import { Users, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PresenceUser {
  id: string
  name: string
  email?: string
  color: string
  state: 'online' | 'offline'
  last_changed: number
}

interface CollaborationPresenceProps {
  documentId: string | null
  currentUserId: string | null
  className?: string
  showUserList?: boolean
  maxVisibleUsers?: number
}

// Generate consistent user colors based on user ID
const generateUserColor = (userId: string): string => {
  console.log('[CollaborationPresence] Generating color for user:', userId)
  
  const colors = [
    '#3B82F6', // Blue
    '#EF4444', // Red  
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6366F1', // Indigo
  ]
  
  // Simple hash function to get consistent color for user
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) & 0xffffffff
  }
  
  const colorIndex = Math.abs(hash) % colors.length
  const selectedColor = colors[colorIndex]
  
  console.log('[CollaborationPresence] Generated color', selectedColor, 'for user', userId)
  return selectedColor
}

// Get user initials for avatar
const getUserInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function CollaborationPresence({
  documentId,
  currentUserId,
  className,
  showUserList = true,
  maxVisibleUsers = 5
}: CollaborationPresenceProps) {
  const [presenceData, setPresenceData] = useState<Record<string, PresenceUser>>({})
  const [isExpanded, setIsExpanded] = useState(false)

  console.log('[CollaborationPresence] Rendering with documentId:', documentId, 'currentUserId:', currentUserId)
  console.log('[CollaborationPresence] Rendering presence component')

  // Subscribe to presence updates when documentId changes
  useEffect(() => {
    if (!documentId) {
      console.log('[CollaborationPresence] No documentId provided, clearing presence data')
      setPresenceData({})
      return
    }

    console.log('[CollaborationPresence] Subscribing to presence updates for document:', documentId)

    const unsubscribe = CollaborationService.subscribeToPresence(
      documentId,
      (presence: Record<string, unknown>) => {
        console.log('[CollaborationPresence] Received presence update:', presence)
        const transformedPresence: Record<string, PresenceUser> = {}
        Object.entries(presence).forEach(([userId, userData]) => {
          if (userData && typeof userData === 'object') {
            const maybeUser = userData as Partial<PresenceUser>
            if (typeof maybeUser.name === 'string' && typeof maybeUser.state === 'string') {
              transformedPresence[userId] = {
                id: userId,
                name: maybeUser.name || 'Unknown User',
                email: typeof maybeUser.email === 'string' ? maybeUser.email : undefined,
                color: generateUserColor(userId),
                state: maybeUser.state === 'online' || maybeUser.state === 'offline' ? maybeUser.state : 'offline',
                last_changed: typeof maybeUser.last_changed === 'number' ? maybeUser.last_changed : Date.now(),
              }
            } else {
              console.warn('[CollaborationPresence] Skipping malformed user data:', userData)
            }
          } else {
            console.warn('[CollaborationPresence] Skipping non-object user data:', userData)
          }
        })
        console.log('[CollaborationPresence] Transformed presence data:', transformedPresence)
        setPresenceData(transformedPresence)
      }
    )

    return () => {
      console.log('[CollaborationPresence] Unsubscribing from presence updates for document:', documentId)
      unsubscribe()
    }
  }, [documentId])

  // Filter and sort active users
  const activeUsers = useMemo(() => {
    const now = Date.now()
    const fiveMinutesAgo = now - 5 * 60 * 1000 // 5 minutes threshold
    
    const active = Object.values(presenceData)
      .filter(user => {
        // User is online and activity is recent, excluding current user
        const isOnline = user.state === 'online'
        const isRecent = user.last_changed > fiveMinutesAgo
        const isNotCurrentUser = user.id !== currentUserId
        
        console.log('[CollaborationPresence] Filtering user', user.id, {
          isOnline,
          isRecent,
          isNotCurrentUser,
          lastChanged: new Date(user.last_changed).toISOString()
        })
        
        return isOnline && isRecent && isNotCurrentUser
      })
      .sort((a, b) => b.last_changed - a.last_changed) // Most recent first
    
    console.log('[CollaborationPresence] Active users:', active.length, active.map(u => u.name))
    return active
  }, [presenceData, currentUserId])

  // Split users for display logic
  const visibleUsers = activeUsers.slice(0, maxVisibleUsers)
  const hiddenUsersCount = Math.max(0, activeUsers.length - maxVisibleUsers)

  console.log('[CollaborationPresence] Display logic:', {
    totalActive: activeUsers.length,
    visible: visibleUsers.length,
    hidden: hiddenUsersCount,
    isExpanded
  })

  if (!documentId || activeUsers.length === 0) {
    console.log('[CollaborationPresence] No active users to display')
    return null
  }

  return (
    <TooltipProvider>
      <div className={cn('flex items-center gap-2', className)}>
        {/* Active user count indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Circle className="h-2 w-2 fill-green-500 text-green-500" />
            <span className="text-sm text-muted-foreground">
              {activeUsers.length} active
            </span>
          </div>
        </div>

        {/* User avatars */}
        <div className="flex items-center -space-x-2">
          {(isExpanded ? activeUsers : visibleUsers).map((user) => (
            <Tooltip key={user.id} delayDuration={300}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar 
                    className={cn(
                      'h-8 w-8 border-2 border-background ring-1 ring-border transition-transform hover:scale-110',
                      'hover:z-10 relative'
                    )}
                    style={{ borderColor: user.color }}
                  >
                    <AvatarFallback 
                      className="text-xs font-medium text-white"
                      style={{ backgroundColor: user.color }}
                    >
                      {getUserInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Online indicator */}
                  <div 
                    className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background"
                    style={{ backgroundColor: user.color }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-medium">{user.name}</p>
                  {user.email && (
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  )}
                  <div className="flex items-center gap-1">
                    <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                    <span className="text-xs">Online</span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}

          {/* Show more button */}
          {hiddenUsersCount > 0 && !isExpanded && (
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 rounded-full p-0 text-xs"
                  onClick={() => setIsExpanded(true)}
                >
                  +{hiddenUsersCount}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Show {hiddenUsersCount} more collaborator{hiddenUsersCount > 1 ? 's' : ''}</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Collapse button */}
          {isExpanded && hiddenUsersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => setIsExpanded(false)}
            >
              Show less
            </Button>
          )}
        </div>

        {/* User list toggle */}
        {showUserList && activeUsers.length > 0 && (
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Users className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <div className="space-y-2">
                <p className="font-medium">Active Collaborators</p>
                {activeUsers.map(user => (
                  <div key={user.id} className="flex items-center gap-2">
                    <div 
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: user.color }}
                    />
                    <span className="text-sm">{user.name}</span>
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}

// Helper hook for easier integration
export function useCollaborationPresence(documentId: string | null, currentUserId: string | null) {
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([])

  useEffect(() => {
    if (!documentId) {
      setActiveUsers([])
      return
    }

    console.log('[useCollaborationPresence] Setting up presence tracking for document:', documentId)

    const unsubscribe = CollaborationService.subscribeToPresence(
      documentId,
      (presence: Record<string, unknown>) => {
        const now = Date.now()
        const fiveMinutesAgo = now - 5 * 60 * 1000
        const active: PresenceUser[] = []
        Object.values(presence).forEach((userData) => {
          if (userData && typeof userData === 'object') {
            const maybeUser = userData as Partial<PresenceUser>
            if (typeof maybeUser.id === 'string' && typeof maybeUser.name === 'string' && typeof maybeUser.state === 'string') {
              const isOnline = maybeUser.state === 'online'
              const isRecent = typeof maybeUser.last_changed === 'number' && maybeUser.last_changed > fiveMinutesAgo
              const isNotCurrentUser = maybeUser.id !== currentUserId
              if (isOnline && isRecent && isNotCurrentUser) {
                active.push({
                  id: maybeUser.id,
                  name: maybeUser.name,
                  email: typeof maybeUser.email === 'string' ? maybeUser.email : undefined,
                  color: generateUserColor(maybeUser.id),
                  state: maybeUser.state === 'online' || maybeUser.state === 'offline' ? maybeUser.state : 'offline',
                  last_changed: typeof maybeUser.last_changed === 'number' ? maybeUser.last_changed : Date.now(),
                })
              }
            } else {
              console.warn('[useCollaborationPresence] Skipping malformed user data:', userData)
            }
          } else {
            console.warn('[useCollaborationPresence] Skipping non-object user data:', userData)
          }
        })
        active.sort((a, b) => b.last_changed - a.last_changed)
        console.log('[useCollaborationPresence] Active users updated:', active.length)
        setActiveUsers(active)
      }
    )

    return unsubscribe
  }, [documentId, currentUserId])

  return { activeUsers }
} 