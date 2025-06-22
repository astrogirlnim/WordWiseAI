"use client"

import { useState, useEffect, useCallback } from "react"
import { useDropzone, type FileRejection } from "react-dropzone"
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
import { useToast } from "@/hooks/use-toast"
import { GlossaryService } from "@/services/glossary-service"

interface UserPreferencesFormProps {
  onSave?: (profile: UserProfile) => void
}

export function UserPreferencesForm({ onSave }: UserPreferencesFormProps) {
  const { user, updateUserProfile } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [glossaryFile, setGlossaryFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
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
      console.log("[UserPreferencesForm] Starting glossary upload process...");
      
      // Use the glossary service to upload and process the file
      const result = await GlossaryService.uploadAndProcessGlossary(
        user.uid,
        glossaryFile,
        glossaryFile.name.replace(/\.[^/.]+$/, '') // Remove file extension for name
      );
      
      console.log("[UserPreferencesForm] Glossary uploaded successfully", result);
      
      // Update the user profile with the glossary ID
      if (profile) {
        const updatedProfile = {
          ...profile,
          brandVoiceGlossaryId: result.glossaryId
        };
        setProfile(updatedProfile);
        
        // Save the updated profile
        await userService.updateUserProfile(user.uid, updatedProfile);
        console.log("[UserPreferencesForm] User profile updated with glossary ID");
      }
      
      toast({
        title: "Glossary Uploaded",
        description: `Successfully imported ${result.termsCount} terms from your glossary.`,
      });
      
      setGlossaryFile(null);
    } catch (error) {
      console.error("[UserPreferencesForm] Error uploading glossary:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload file.";
      setUploadError(errorMessage);
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
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
      if (profile.name !== user.displayName) {
        await updateUserProfile(profile.name)
      }
      toast({
        title: "Preferences Saved",
        description: "Your settings have been successfully updated.",
      })
      onSave?.(profile)
    } catch (error) {
      console.error("Error saving user profile:", error)
      toast({
        title: "Error",
        description: "Failed to save your preferences. Please try again.",
        variant: "destructive",
      })
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
          <CardDescription>Upload a JSON file with your brand&apos;s terminology.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
            ${isDragActive ? 'border-primary bg-primary/10 scale-105' : 'border-border hover:border-primary/50 hover:bg-primary/5'}`}
          >
            <input {...getInputProps()} />
            <UploadCloud className={`mx-auto h-12 w-12 mb-4 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
            {isDragActive ? (
              <p className="text-primary font-medium">Drop the file here ...</p>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">Drag &apos;n&apos; drop a JSON file here, or click to select</p>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Trigger the hidden file input
                    const input = e.currentTarget.parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
                    input?.click();
                  }}
                >
                  <FileIcon className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-3">JSON format only, up to 5MB</p>
            <p className="text-xs text-muted-foreground mt-1">
              Format: [{`{"term": "...", "definition": "..."}`}, ...] or {`{"term1": "definition1", ...}`}
            </p>
          </div>
          {glossaryFile && (
            <div className="mt-4 flex items-center justify-between p-3 border rounded-lg bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <FileIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <span className="font-medium">{glossaryFile.name}</span>
                  <p className="text-xs text-muted-foreground">
                    {(glossaryFile.size / 1024).toFixed(1)} KB • Ready to upload
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  console.log('[UserPreferencesForm] User cancelled file selection');
                  setGlossaryFile(null);
                  setUploadError(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {uploadError && (
            <div className="mt-4 p-3 border rounded-lg bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-900 dark:text-red-100">Upload Failed</p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">{uploadError}</p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                    Try refreshing the page and uploading again. If the issue persists, contact support.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {glossaryFile && (
            <div className="flex justify-end mt-4">
              <Button 
                onClick={handleGlossaryUpload} 
                disabled={uploading}
                className="min-w-[140px]"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4 mr-2" />
                    Upload Glossary
                  </>
                )}
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
                    This can&apos;t be undone and will permanently delete your
                    account and all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                  <Label htmlFor="delete-confirm">
                    If you&apos;re sure, please type &quot;DELETE&quot; below to
                    confirm.
                  </Label>
                  <Input id="delete-confirm" className="mt-2" />
                </div>
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
