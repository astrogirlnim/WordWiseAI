"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { User, Settings, CreditCard, HelpCircle, LogOut, Crown, ChevronDown } from "lucide-react"
import type { User as UserType } from "@/types/navigation"

interface UserMenuProps {
  user: UserType
  onProfileClick?: () => void
  onSettingsClick?: () => void
  onBillingClick?: () => void
  onHelpClick?: () => void
  onSignOut?: () => void
}

export function UserMenu({
  user,
  onProfileClick,
  onSettingsClick,
  onBillingClick,
  onHelpClick,
  onSignOut,
}: UserMenuProps) {
  const getPlanBadge = (plan: UserType["plan"]) => {
    switch (plan) {
      case "pro":
        return (
          <Badge variant="default" className="text-xs">
            <Crown className="h-3 w-3 mr-1" />
            Pro
          </Badge>
        )
      case "team":
        return (
          <Badge variant="secondary" className="text-xs">
            Team
          </Badge>
        )
      case "free":
        return (
          <Badge variant="outline" className="text-xs">
            Free
          </Badge>
        )
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-3 h-9">
          <Avatar className="h-6 w-6">
            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
            <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline-block max-w-[120px] truncate">{user.name}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-medium">{user.name}</span>
              {getPlanBadge(user.plan)}
            </div>
            <span className="text-xs text-muted-foreground font-normal">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onProfileClick} className="cursor-pointer">
          <User className="h-4 w-4 mr-2" />
          Profile
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onSettingsClick} className="cursor-pointer">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onBillingClick} className="cursor-pointer">
          <CreditCard className="h-4 w-4 mr-2" />
          Billing
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onHelpClick} className="cursor-pointer">
          <HelpCircle className="h-4 w-4 mr-2" />
          Help & Support
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onSignOut} className="cursor-pointer text-red-600">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
