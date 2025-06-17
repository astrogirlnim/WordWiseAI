"use client"

import { useState, useEffect, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { User, Settings, Save, UploadCloud, File as FileIcon, X, AlertTriangle } from "lucide-react"
import type { UserProfile } from "@/types/user"
import { userService } from "@/services/user-service"
import { getStorage, ref, uploadBytes } from "firebase/storage"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog"

interface UserPreferencesFormProps {
  onSave?: (profile: UserProfile) => void
}

export function UserPreferencesForm({ onSave }: UserPreferencesFormProps) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [glossaryFile, setGlossaryFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    setUploadError(null)
    if (fileRejections.length > 0) {
      setUploadError(fileRejections[0].errors[0].message)
      setGlossaryFile(null)
      return
    }
    if (acceptedFiles.length > 0) {
      setGlossaryFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  })

  const handleGlossaryUpload = async () => {
    if (!glossaryFile || !user?.uid) return

    setUploading(true)
    setUploadError(null)
    try {
      const storage = getStorage()
      const storageRef = ref(storage, `glossaries/${user.uid}/${glossaryFile.name}`)
      await uploadBytes(storageRef, glossaryFile)
      // The backend function will process this file.
      // We can optionally update the user profile to link to the new glossary
      setGlossaryFile(null)
    } catch (error) {
      console.error("Error uploading glossary:", error)
      setUploadError("Failed to upload file.")
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user?.uid) return;
    // This should trigger a cloud function to delete all user data
    // For now, we'll just log it.
    console.log("Deleting account for user:", user.uid)
    // Here you would typically call a cloud function:
    // const deleteUser = httpsCallable(functions, 'deleteUserAccount');
    // await deleteUser();
    // Then sign out the user
  }

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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UploadCloud className="h-5 w-5" />
            Glossary & Brand Voice
          </CardTitle>
          <CardDescription>Upload a CSV or JSON file with your brand's terminology.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            ${isDragActive ? 'border-primary bg-primary/10' : 'border-border'}`}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p>Drop the file here ...</p>
            ) : (
              <p>Drag 'n' drop a file here, or click to select a file</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">CSV or JSON, up to 5MB</p>
          </div>
          {glossaryFile && (
            <div className="mt-4 flex items-center justify-between p-2 border rounded-lg">
              <div className="flex items-center gap-2">
                <FileIcon className="h-5 w-5" />
                <span>{glossaryFile.name}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setGlossaryFile(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          {uploadError && <p className="text-sm text-red-600 mt-2">{uploadError}</p>}
          {glossaryFile && (
            <div className="flex justify-end">
              <Button onClick={handleGlossaryUpload} disabled={uploading}>
                {uploading ? "Uploading..." : "Upload Glossary"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg">
            <div>
              <Label>Delete Account</Label>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data. This action cannot be undone.</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete Account</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">
                    Yes, delete my account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
