"use client"

import { useState, useEffect, useCallback } from "react"
import { useDropzone, type FileRejection } from "react-dropzone"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { User, Save, UploadCloud, File as FileIcon, X, AlertTriangle, Plus, Edit, Trash2, BookOpen } from "lucide-react"
import type { UserProfile } from "@/types/user"
import { userService } from "@/services/user-service"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { GlossaryService } from "@/services/glossary-service"
import type { GlossaryTerm } from "@/services/glossary-service"

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
  
  // Glossary terms management state
  const [glossaryTerms, setGlossaryTerms] = useState<(GlossaryTerm & { id: string })[]>([])
  const [loadingTerms, setLoadingTerms] = useState(false)
  const [isAddTermDialogOpen, setIsAddTermDialogOpen] = useState(false)
  const [editingTerm, setEditingTerm] = useState<(GlossaryTerm & { id: string }) | null>(null)
  const [newTerm, setNewTerm] = useState({ term: '', definition: '', category: '' })
  const [activeGlossaryTab, setActiveGlossaryTab] = useState<'upload' | 'terms'>('upload')
  const [deletingTermId, setDeletingTermId] = useState<string | null>(null)

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
      // Switch to terms tab and reload terms
      setActiveGlossaryTab('terms');
      await loadGlossaryTerms();
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

  const loadGlossaryTerms = async () => {
    if (!profile?.brandVoiceGlossaryId || !user?.uid) {
      console.log("[UserPreferencesForm] No glossary ID found, skipping terms load");
      return;
    }

    console.log("[UserPreferencesForm] Loading glossary terms for:", profile.brandVoiceGlossaryId);
    setLoadingTerms(true);
    try {
      const terms = await GlossaryService.getAllGlossaryTerms(profile.brandVoiceGlossaryId);
      console.log("[UserPreferencesForm] Loaded", terms.length, "glossary terms");
      setGlossaryTerms(terms);
    } catch (error) {
      console.error("[UserPreferencesForm] Error loading glossary terms:", error);
      toast({
        title: "Error Loading Terms",
        description: "Failed to load your glossary terms. Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setLoadingTerms(false);
    }
  };

  const handleAddTerm = async () => {
    if (!newTerm.term.trim() || !newTerm.definition.trim() || !profile?.brandVoiceGlossaryId || !user?.uid) {
      toast({
        title: "Validation Error",
        description: "Please provide both term and definition.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("[UserPreferencesForm] Adding new term:", newTerm);
      await GlossaryService.addTermToGlossary(
        profile.brandVoiceGlossaryId,
        user.uid,
        {
          term: newTerm.term,
          definition: newTerm.definition,
          category: newTerm.category || undefined
        }
      );

      toast({
        title: "Term Added",
        description: `Successfully added "${newTerm.term}" to your glossary.`,
      });

      setNewTerm({ term: '', definition: '', category: '' });
      setIsAddTermDialogOpen(false);
      await loadGlossaryTerms();
    } catch (error) {
      console.error("[UserPreferencesForm] Error adding term:", error);
      toast({
        title: "Error Adding Term",
        description: error instanceof Error ? error.message : "Failed to add term.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTerm = async () => {
    if (!editingTerm || !profile?.brandVoiceGlossaryId || !user?.uid) return;

    try {
      console.log("[UserPreferencesForm] Updating term:", editingTerm);
      await GlossaryService.updateTerm(
        profile.brandVoiceGlossaryId,
        editingTerm.id,
        user.uid,
        {
          term: editingTerm.term,
          definition: editingTerm.definition,
          category: editingTerm.category || undefined
        }
      );

      toast({
        title: "Term Updated",
        description: `Successfully updated "${editingTerm.term}".`,
      });

      setEditingTerm(null);
      await loadGlossaryTerms();
    } catch (error) {
      console.error("[UserPreferencesForm] Error updating term:", error);
      toast({
        title: "Error Updating Term",
        description: error instanceof Error ? error.message : "Failed to update term.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTerm = async (termId: string, termName: string) => {
    if (!profile?.brandVoiceGlossaryId || !user?.uid) return;

    setDeletingTermId(termId);
    try {
      console.log("[UserPreferencesForm] Deleting term:", termId);
      await GlossaryService.deleteTerm(profile.brandVoiceGlossaryId, termId, user.uid);

      toast({
        title: "Term Deleted",
        description: `Successfully deleted "${termName}" from your glossary.`,
      });

      await loadGlossaryTerms();
    } catch (error) {
      console.error("[UserPreferencesForm] Error deleting term:", error);
      toast({
        title: "Error Deleting Term",
        description: error instanceof Error ? error.message : "Failed to delete term.",
        variant: "destructive",
      });
    } finally {
      setDeletingTermId(null);
    }
  };

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

  // Load glossary terms when profile is loaded and has a glossary ID
  useEffect(() => {
    if (profile?.brandVoiceGlossaryId && activeGlossaryTab === 'terms') {
      loadGlossaryTerms();
    }
  }, [profile?.brandVoiceGlossaryId, activeGlossaryTab]);

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
            <BookOpen className="h-5 w-5" />
            Glossary & Brand Voice
          </CardTitle>
          <CardDescription>Manage your brand terminology and voice guidelines</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeGlossaryTab} onValueChange={(value) => setActiveGlossaryTab(value as 'upload' | 'terms')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <UploadCloud className="h-4 w-4" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="terms" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Terms ({glossaryTerms.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-4 mt-6">
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
            </TabsContent>
            
            <TabsContent value="terms" className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Glossary Terms</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage your brand terminology and definitions
                  </p>
                </div>
                <Dialog open={isAddTermDialogOpen} onOpenChange={setIsAddTermDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Term
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Term</DialogTitle>
                      <DialogDescription>
                        Add a new term to your brand glossary
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="new-term">Term</Label>
                        <Input
                          id="new-term"
                          value={newTerm.term}
                          onChange={(e) => setNewTerm({ ...newTerm, term: e.target.value })}
                          placeholder="e.g., CTA, ROI, Lead Magnet"
                        />
                      </div>
                      <div>
                        <Label htmlFor="new-definition">Definition</Label>
                        <Textarea
                          id="new-definition"
                          value={newTerm.definition}
                          onChange={(e) => setNewTerm({ ...newTerm, definition: e.target.value })}
                          placeholder="Provide a clear definition for this term"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="new-category">Category (Optional)</Label>
                        <Input
                          id="new-category"
                          value={newTerm.category}
                          onChange={(e) => setNewTerm({ ...newTerm, category: e.target.value })}
                          placeholder="e.g., Marketing, Sales, Technical"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddTermDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddTerm}>Add Term</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              {loadingTerms ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="ml-2">Loading terms...</span>
                </div>
              ) : glossaryTerms.length === 0 ? (
                <div className="text-center p-8 border rounded-lg bg-muted/20">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Terms Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start building your brand glossary by uploading a JSON file or adding terms manually.
                  </p>
                  <Button onClick={() => setIsAddTermDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Term
                  </Button>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Term</TableHead>
                        <TableHead>Definition</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {glossaryTerms.map((term) => (
                        <TableRow key={term.id}>
                          <TableCell className="font-medium">{term.term}</TableCell>
                          <TableCell className="max-w-[300px] truncate">{term.definition}</TableCell>
                          <TableCell>{term.category || '-'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingTerm(term)}
                                className="h-8 w-8"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    disabled={deletingTermId === term.id}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Term</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete &quot;{term.term}&quot;? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteTerm(term.id, term.term)}
                                      className="bg-destructive hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Term Dialog */}
      <Dialog open={!!editingTerm} onOpenChange={(open) => !open && setEditingTerm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Term</DialogTitle>
            <DialogDescription>
              Update the term details
            </DialogDescription>
          </DialogHeader>
          {editingTerm && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-term">Term</Label>
                <Input
                  id="edit-term"
                  value={editingTerm.term}
                  onChange={(e) => setEditingTerm({ ...editingTerm, term: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-definition">Definition</Label>
                <Textarea
                  id="edit-definition"
                  value={editingTerm.definition}
                  onChange={(e) => setEditingTerm({ ...editingTerm, definition: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category (Optional)</Label>
                <Input
                  id="edit-category"
                  value={editingTerm.category || ''}
                  onChange={(e) => setEditingTerm({ ...editingTerm, category: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTerm(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTerm}>Update Term</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
