'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Upload } from 'lucide-react'
import { getStorage, ref, uploadBytes } from 'firebase/storage'
import { useAuth } from '@/lib/auth-context'

export function GlossaryUploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const { user } = useAuth()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file || !user) return

    setIsUploading(true)
    const storage = getStorage()
    const storageRef = ref(storage, `glossaries/${user.uid}/${file.name}`)

    try {
      await uploadBytes(storageRef, file)
      alert('Glossary uploaded successfully!')
      setFile(null)
    } catch (error) {
      console.error('Error uploading glossary:', error)
      alert('Failed to upload glossary.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brand Voice Glossary</CardTitle>
        <CardDescription>
          Upload a CSV or JSON file with your brand's approved terms.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="glossary-file">Glossary File</Label>
          <Input id="glossary-file" type="file" onChange={handleFileChange} accept=".csv,.json" />
        </div>
        <Button onClick={handleUpload} disabled={!file || isUploading}>
          <Upload className="mr-2 h-4 w-4" />
          {isUploading ? 'Uploading...' : 'Upload Glossary'}
        </Button>
      </CardContent>
    </Card>
  )
} 