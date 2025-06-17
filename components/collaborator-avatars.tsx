'use client'

import type { UserPresence } from '@/services/collaboration-service'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

interface CollaboratorAvatarsProps {
  users: UserPresence[]
}

export function CollaboratorAvatars({ users }: CollaboratorAvatarsProps) {
  return (
    <div className="flex items-center space-x-2">
      <TooltipProvider>
        {users.map((user) => (
          <Tooltip key={user.id}>
            <TooltipTrigger asChild>
              <Avatar className="h-8 w-8 border-2" style={{ borderColor: user.color }}>
                <AvatarImage src={`https://avatar.vercel.sh/${user.id}.png`} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>{user.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  )
} 