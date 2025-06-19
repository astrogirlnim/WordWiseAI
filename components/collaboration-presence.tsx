import React, { useState, useEffect, useCallback } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Users, Circle } from 'lucide-react'
import { CollaborationService } from '@/services/collaboration-service'
import { useAuth } from '@/lib/auth-context'

interface CollaboratorPresence {
  id: string
  name: string
  email?: string
  color: string
  state: 'online' | 'offline'
  last_changed: number
}

interface CollaborationPresenceProps {
  documentId: string | null
  className?: string
}

const userColors = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#8B5CF6', // purple
  '#F59E0B', // amber
  '#EC4899', // pink
  '#6B7280', // gray
  '#14B8A6', // teal
]

export function CollaborationPresence({ documentId, className = '' }: CollaborationPresenceProps) {
  const { user } = useAuth()
  const [collaborators, setCollaborators] = useState<Record<string, CollaboratorPresence>>({})
  const [isJoined, setIsJoined] = useState(false)
  
  console.log('[CollaborationPresence] Component rendered:', {
    documentId,
    userId: user?.uid,
    collaboratorCount: Object.keys(collaborators).length,
    isJoined
  })

  // Get user color (deterministic based on user ID)
  const getUserColor = useCallback((userId: string) => {
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return userColors[hash % userColors.length]
  }, [])

  // Join document session
  useEffect(() => {
    if (!documentId || !user?.uid || isJoined) return

    const joinSession = async () => {
      try {
        console.log('[CollaborationPresence] Joining document session:', documentId)
        const userInfo = {
          id: user.uid,
          name: user.displayName || user.email || 'Anonymous User',
          email: user.email || '',
          color: getUserColor(user.uid),
        }
        
        await CollaborationService.joinDocumentSession(documentId, userInfo)
        setIsJoined(true)
        console.log('[CollaborationPresence] Successfully joined document session')
      } catch (error) {
        console.error('[CollaborationPresence] Failed to join document session:', error)
      }
    }

    joinSession()

    // Cleanup on unmount or document change
    return () => {
      if (isJoined && documentId && user?.uid) {
        console.log('[CollaborationPresence] Leaving document session:', documentId)
        CollaborationService.leaveDocumentSession(documentId, user.uid)
          .catch(error => console.error('[CollaborationPresence] Error leaving session:', error))
      }
    }
  }, [documentId, user?.uid, getUserColor, isJoined])

  // Subscribe to presence updates
  useEffect(() => {
    if (!documentId || !isJoined) return

    console.log('[CollaborationPresence] Subscribing to presence updates for document:', documentId)
    
    const unsubscribe = CollaborationService.subscribeToPresence(documentId, (presenceData) => {
      console.log('[CollaborationPresence] Presence update received:', presenceData)
      setCollaborators(presenceData || {})
    })

    return unsubscribe
  }, [documentId, isJoined])

  // Filter active collaborators (online only)
  const activeCollaborators = Object.entries(collaborators)
    .filter(([_, presence]) => presence.state === 'online')
    .map(([userId, presence]) => ({ userId, ...presence }))

  console.log('[CollaborationPresence] Active collaborators:', activeCollaborators.length)

  if (!documentId || activeCollaborators.length === 0) {
    return null
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {activeCollaborators.length} online
        </span>
      </div>
      
      <div className="flex -space-x-2">
        <TooltipProvider>
          {activeCollaborators.slice(0, 4).map((collaborator) => (
            <Tooltip key={collaborator.userId}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar className="h-6 w-6 border-2 border-background">
                    <AvatarImage src={`https://avatar.vercel.sh/${collaborator.email}`} />
                    <AvatarFallback 
                      className="text-xs font-medium"
                      style={{ backgroundColor: collaborator.color, color: 'white' }}
                    >
                      {collaborator.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Circle 
                    className="absolute -bottom-0.5 -right-0.5 h-2 w-2 fill-green-500 text-green-500" 
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm font-medium">{collaborator.name}</p>
                <p className="text-xs text-muted-foreground">{collaborator.email}</p>
                <p className="text-xs text-green-600">Online</p>
              </TooltipContent>
            </Tooltip>
          ))}
          
          {activeCollaborators.length > 4 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted">
                  <span className="text-xs font-medium">
                    +{activeCollaborators.length - 4}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">
                  {activeCollaborators.length - 4} more collaborators online
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </div>
    </div>
  )
}

// Detailed presence panel component
export function CollaborationPresencePanel({ documentId }: CollaborationPresenceProps) {
  const { user } = useAuth()
  const [collaborators, setCollaborators] = useState<Record<string, CollaboratorPresence>>({})

  useEffect(() => {
    if (!documentId) return

    const unsubscribe = CollaborationService.subscribeToPresence(documentId, (presenceData) => {
      setCollaborators(presenceData || {})
    })

    return unsubscribe
  }, [documentId])

  const allCollaborators = Object.entries(collaborators)
    .map(([userId, presence]) => ({ userId, ...presence }))
    .sort((a, b) => {
      // Sort by online status first, then by name
      if (a.state !== b.state) {
        return a.state === 'online' ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })

  if (!documentId || allCollaborators.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            Collaborators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No collaborators yet. Share this document to collaborate with others.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4" />
          Collaborators
          <Badge variant="secondary" className="text-xs">
            {allCollaborators.filter(c => c.state === 'online').length} online
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {allCollaborators.map((collaborator) => (
            <div key={collaborator.userId} className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://avatar.vercel.sh/${collaborator.email}`} />
                  <AvatarFallback 
                    className="text-xs font-medium"
                    style={{ backgroundColor: collaborator.color, color: 'white' }}
                  >
                    {collaborator.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Circle 
                  className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 border border-background ${
                    collaborator.state === 'online' 
                      ? 'fill-green-500 text-green-500' 
                      : 'fill-gray-400 text-gray-400'
                  }`}
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">
                    {collaborator.name}
                    {collaborator.userId === user?.uid && (
                      <span className="text-muted-foreground"> (You)</span>
                    )}
                  </p>
                  <Badge 
                    variant={collaborator.state === 'online' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {collaborator.state}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {collaborator.email}
                </p>
                {collaborator.state === 'offline' && (
                  <p className="text-xs text-muted-foreground">
                    Last seen {new Date(collaborator.last_changed).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}