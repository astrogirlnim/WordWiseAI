"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { User, Settings, Save } from "lucide-react"
import type { UserProfile } from "@/types/user"
import { userService } from "@/services/user-service"

interface UserPreferencesFormProps {
  onSave?: (profile: UserProfile) => void
}

export function UserPreferencesForm({ onSave }: UserPreferencesFormProps) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user?.uid) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const userProfile = await userService.getUserProfile(user.uid)
        if (userProfile) {
          setProfile({ ...userProfile, email: user.email || '' })
        }
      } catch (error) {
        console.error("Error loading user profile:", error)
      } finally {
        setLoading(false)
      }
    }

    loadUserProfile()
  }, [user?.uid, user?.email])

  const handleSave = async () => {
    if (!profile || !user?.uid) return

    try {
      setSaving(true)
      await userService.updateUserProfile(user.uid, profile)
      onSave?.(profile)
    } catch (error) {
      console.error("Error saving user profile:", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Unable to load user preferences</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>Manage your account details and role</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                value={profile.role}
                onValueChange={(value) => setProfile({ ...profile, role: value as UserProfile["role"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="content-writer">Content Writer</SelectItem>
                  <SelectItem value="marketing-manager">Marketing Manager</SelectItem>
                  <SelectItem value="brand-strategist">Brand Strategist</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Writing Preferences
          </CardTitle>
          <CardDescription>Customize your writing assistant experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="autoSaveInterval">Auto-save Interval (seconds)</Label>
            <Input
              id="autoSaveInterval"
              type="number"
              min="5"
              max="60"
              value={profile.preferences.autoSaveInterval}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  preferences: {
                    ...profile.preferences,
                    autoSaveInterval: Number.parseInt(e.target.value),
                  },
                })
              }
            />
          </div>

          <div>
            <Label htmlFor="preferredTone">Preferred Tone</Label>
            <Select
              value={profile.preferences.preferredTone}
              onValueChange={(value) =>
                setProfile({
                  ...profile,
                  preferences: { ...profile.preferences, preferredTone: value },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="advancedSuggestions">Show Advanced Suggestions</Label>
              <p className="text-sm text-muted-foreground">Include detailed grammar and style suggestions</p>
            </div>
            <Switch
              id="advancedSuggestions"
              checked={profile.preferences.showAdvancedSuggestions}
              onCheckedChange={(checked) =>
                setProfile({
                  ...profile,
                  preferences: { ...profile.preferences, showAdvancedSuggestions: checked },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </div>
  )
}
