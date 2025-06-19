import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, limit } from 'firebase/firestore'
import { firestore } from '@/lib/firebase'
import type { UserProfile } from '@/types/user'
import { defaultWritingGoals } from '@/utils/writing-goals-data'
import type { FirestoreTimestamp } from '@/types/document'

export const userService = {
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userDocRef = doc(firestore, 'users', userId)
      const userDocSnap = await getDoc(userDocRef)

      if (userDocSnap.exists()) {
        const data = userDocSnap.data()
        // Ensure timestamps are numbers
        return {
          ...data,
          createdAt: (data.createdAt?.seconds || 0) * 1000,
          updatedAt: (data.updatedAt?.seconds || 0) * 1000,
        } as UserProfile
      } else {
        // If no profile exists, create a default one
        const defaultProfile: Omit<UserProfile, 'createdAt' | 'updatedAt' | 'orgId' | 'acceptedSuggestions' | 'rejectedSuggestions' | 'email'> = {
          id: userId,
          name: 'New User',
          role: 'content-writer',
          preferences: {
            defaultWritingGoals: defaultWritingGoals,
            autoSaveInterval: 10,
            preferredTone: 'professional',
            showAdvancedSuggestions: true,
          },
        }
        await setDoc(userDocRef, {
          ...defaultProfile,
          email: '', // This should be populated from auth user
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          orgId: '',
          acceptedSuggestions: [],
          rejectedSuggestions: [],
        })
        const newUserProfile = await getDoc(userDocRef)
        const data = newUserProfile.data()
        if (data) {
          return {
            ...data,
            createdAt: (data.createdAt?.seconds || 0) * 1000,
            updatedAt: (data.updatedAt?.seconds || 0) * 1000,
          } as UserProfile
        }
        return null
      }
    } catch (error) {
      console.error('Error getting user profile:', error)
      return null
    }
  },

  async updateUserProfile(
    userId: string,
    profileData: Partial<UserProfile>,
  ): Promise<void> {
    try {
      const userDocRef = doc(firestore, 'users', userId)
      await setDoc(
        userDocRef,
        { ...profileData, updatedAt: serverTimestamp() },
        { merge: true },
      )
    } catch (error) {
      console.error('Error updating user profile:', error)
      throw error
    }
  },

  async findUserByEmail(email: string): Promise<UserProfile | null> {
    try {
      const usersRef = collection(firestore, 'users')
      const q = query(usersRef, where('email', '==', email), limit(1))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0]
        return { id: userDoc.id, ...userDoc.data() } as UserProfile
      }
      return null
    } catch (error) {
      console.error('Error finding user by email:', error)
      return null
    }
  },
} 