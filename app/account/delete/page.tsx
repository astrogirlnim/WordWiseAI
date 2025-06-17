'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

export default function DeleteAccountPage() {
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const { deleteAccount } = useAuth()
  const router = useRouter()

  const handleDelete = async () => {
    if (confirmation !== 'DELETE') {
      setError('Please type DELETE to confirm.')
      return
    }

    setIsDeleting(true)
    setError('')
    try {
      await deleteAccount()
      router.push('/sign-in')
    } catch (err: any) {
      setError(err.message || 'Failed to delete account.')
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Delete Account</CardTitle>
          <CardDescription>
            This action cannot be undone. All your data will be permanently
            deleted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Are you absolutely sure you want to delete your account? This will
              remove all your documents, glossaries, and settings.
            </AlertDescription>
          </Alert>
          <div>
            <label htmlFor="confirmation" className="text-sm font-medium">
              To confirm, type "DELETE" in the box below.
            </label>
            <Input
              id="confirmation"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className="mt-1"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter>
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleDelete}
            disabled={isDeleting || confirmation !== 'DELETE'}
          >
            {isDeleting ? 'Deleting...' : 'Delete My Account'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 