/**
 * GlossaryService - Handles glossary and brand voice upload, processing, and management
 * 
 * Features:
 * - Upload JSON files to Firebase Storage
 * - Parse and process multiple JSON formats (array, object, nested)
 * - Store processed terms in Firestore with search capabilities
 * - Retrieve and search glossary terms
 * - Comprehensive error handling and logging
 */

import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  StorageError 
} from 'firebase/storage';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  writeBatch,
  serverTimestamp,
  FirestoreError
} from 'firebase/firestore';

// Types for the glossary service
export interface GlossaryTerm {
  term: string;
  definition: string;
  category?: string;
  examples?: string[];
  synonyms?: string[];
}

export interface GlossaryUploadResult {
  glossaryId: string;
  termsCount: number;
  fileName: string;
  uploadedAt: Date;
  storageUrl: string;
}

export interface ProcessedGlossary {
  id: string;
  userId: string;
  fileName: string;
  termsCount: number;
  uploadedAt: Date;
  storageUrl: string;
  metadata: {
    originalFormat: string;
    processedAt: Date;
  };
}

/**
 * Service class for managing glossaries and brand voice files
 */
class GlossaryServiceImpl {
  private storage = getStorage();
  private firestore = getFirestore();

  /**
   * Upload and process a glossary file
   * @param userId - The user's unique ID
   * @param file - The JSON file to upload
   * @param glossaryName - Custom name for the glossary
   * @returns Promise with upload results
   */
  async uploadAndProcessGlossary(
    userId: string, 
    file: File, 
    glossaryName?: string
  ): Promise<GlossaryUploadResult> {
    console.log(`[GlossaryService] Starting upload for user: ${userId}, file: ${file.name}`);
    
    try {
      // Validate inputs
      this.validateUploadInputs(userId, file);
      
      // Generate unique glossary ID and file path
      const timestamp = Date.now();
      const glossaryId = `glossary_${userId}_${timestamp}`;
      const fileName = glossaryName || file.name.replace(/\.[^/.]+$/, '');
      const storagePath = `glossaries/${userId}/${timestamp}_${file.name}`;
      
      console.log(`[GlossaryService] Generated glossary ID: ${glossaryId}`);
      console.log(`[GlossaryService] Storage path: ${storagePath}`);
      
      // Upload file to Firebase Storage
      const storageUrl = await this.uploadFileToStorage(file, storagePath);
      console.log(`[GlossaryService] File uploaded to storage: ${storageUrl}`);
      
      // Read and parse the JSON content
      const fileContent = await this.readFileContent(file);
      const terms = await this.parseJsonContent(fileContent, file.name);
      console.log(`[GlossaryService] Parsed ${terms.length} terms from file`);
      
      // Store glossary metadata and terms in Firestore
      await this.storeGlossaryInFirestore(
        glossaryId,
        userId,
        fileName,
        terms,
        storageUrl,
        file.name
      );
      
      console.log(`[GlossaryService] ✅ Upload completed successfully`);
      
      return {
        glossaryId,
        termsCount: terms.length,
        fileName,
        uploadedAt: new Date(),
        storageUrl
      };
      
    } catch (error) {
      console.error(`[GlossaryService] ❌ Upload failed:`, error);
      if (error instanceof Error) {
        throw new Error(`Glossary upload failed: ${error.message}`);
      }
      throw new Error('Glossary upload failed: Unknown error occurred');
    }
  }

  /**
   * Retrieve a user's glossaries
   * @param userId - The user's unique ID
   * @returns Promise with array of glossaries
   */
  async getUserGlossaries(userId: string): Promise<ProcessedGlossary[]> {
    console.log(`[GlossaryService] Fetching glossaries for user: ${userId}`);
    
    try {
      const glossariesRef = collection(this.firestore, 'glossaries');
      const q = query(
        glossariesRef, 
        where('userId', '==', userId),
        orderBy('uploadedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const glossaries: ProcessedGlossary[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        glossaries.push({
          id: doc.id,
          userId: data.userId,
          fileName: data.fileName,
          termsCount: data.termsCount,
          uploadedAt: data.uploadedAt.toDate(),
          storageUrl: data.storageUrl,
          metadata: {
            originalFormat: data.metadata?.originalFormat || 'unknown',
            processedAt: data.metadata?.processedAt?.toDate() || new Date()
          }
        });
      });
      
      console.log(`[GlossaryService] Found ${glossaries.length} glossaries`);
      return glossaries;
      
    } catch (error) {
      console.error(`[GlossaryService] Error fetching glossaries:`, error);
      throw new Error('Failed to retrieve glossaries');
    }
  }

  /**
   * Search terms within a specific glossary
   * @param glossaryId - The glossary ID to search in
   * @param searchTerm - The term to search for
   * @param maxResults - Maximum number of results to return
   * @returns Promise with matching terms
   */
  async searchGlossaryTerms(
    glossaryId: string, 
    searchTerm: string, 
    maxResults: number = 10
  ): Promise<GlossaryTerm[]> {
    console.log(`[GlossaryService] Searching glossary ${glossaryId} for: "${searchTerm}"`);
    
    try {
      const termsRef = collection(this.firestore, 'glossaries', glossaryId, 'terms');
      const q = query(
        termsRef,
        where('term', '>=', searchTerm.toLowerCase()),
        where('term', '<=', searchTerm.toLowerCase() + '\uf8ff'),
        orderBy('term'),
        limit(maxResults)
      );
      
      const snapshot = await getDocs(q);
      const terms: GlossaryTerm[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        terms.push({
          term: data.term,
          definition: data.definition,
          category: data.category,
          examples: data.examples,
          synonyms: data.synonyms
        });
      });
      
      console.log(`[GlossaryService] Found ${terms.length} matching terms`);
      return terms;
      
    } catch (error) {
      console.error(`[GlossaryService] Error searching terms:`, error);
      throw new Error('Failed to search glossary terms');
    }
  }

  /**
   * Validate upload inputs
   */
  private validateUploadInputs(userId: string, file: File): void {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required');
    }
    
    if (!file) {
      throw new Error('File is required');
    }
    
    if (file.type !== 'application/json') {
      throw new Error('Only JSON files are supported');
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      throw new Error('File size must be less than 5MB');
    }
    
    console.log(`[GlossaryService] ✅ Input validation passed`);
  }

  /**
   * Upload file to Firebase Storage
   */
  private async uploadFileToStorage(file: File, storagePath: string): Promise<string> {
    try {
      console.log(`[GlossaryService] Uploading to storage path: ${storagePath}`);
      
      const storageRef = ref(this.storage, storagePath);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(uploadResult.ref);
      
      console.log(`[GlossaryService] ✅ File uploaded successfully`);
      return downloadUrl;
      
    } catch (error) {
      console.error(`[GlossaryService] Storage upload error:`, error);
      if (error instanceof StorageError) {
        throw new Error(`Storage upload failed: ${error.message}`);
      }
      throw new Error('Failed to upload file to storage');
    }
  }

  /**
   * Read file content as text
   */
  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const content = event.target?.result as string;
        console.log(`[GlossaryService] ✅ File content read, length: ${content.length}`);
        resolve(content);
      };
      
      reader.onerror = () => {
        console.error(`[GlossaryService] Error reading file`);
        reject(new Error('Failed to read file content'));
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Parse JSON content and extract terms
   */
  private async parseJsonContent(content: string, fileName: string): Promise<GlossaryTerm[]> {
    try {
      console.log(`[GlossaryService] Parsing JSON content from ${fileName}`);
      
      const parsed = JSON.parse(content);
      let terms: GlossaryTerm[] = [];
      let detectedFormat = 'unknown';
      
      // Format 1: Array of objects with term/definition
      if (Array.isArray(parsed)) {
        console.log(`[GlossaryService] Detected array format`);
        detectedFormat = 'array';
        terms = parsed.map((item: any) => ({
          term: String(item.term || item.name || item.key || '').trim(),
          definition: String(item.definition || item.value || item.description || '').trim(),
          category: item.category,
          examples: Array.isArray(item.examples) ? item.examples : undefined,
          synonyms: Array.isArray(item.synonyms) ? item.synonyms : undefined
        }));
      }
      // Format 2: Simple object with key-value pairs
      else if (typeof parsed === 'object' && parsed !== null) {
        if (parsed.terms && Array.isArray(parsed.terms)) {
          // Format 3: Nested object with terms array
          console.log(`[GlossaryService] Detected nested object format`);
          detectedFormat = 'nested';
          terms = parsed.terms.map((item: any) => ({
            term: String(item.term || item.name || '').trim(),
            definition: String(item.definition || item.value || '').trim(),
            category: item.category,
            examples: Array.isArray(item.examples) ? item.examples : undefined,
            synonyms: Array.isArray(item.synonyms) ? item.synonyms : undefined
          }));
        } else {
          // Simple key-value object
          console.log(`[GlossaryService] Detected object format`);
          detectedFormat = 'object';
          terms = Object.entries(parsed).map(([key, value]) => ({
            term: String(key).trim(),
            definition: String(value).trim()
          }));
        }
      }
      
      // Filter out invalid terms
      const validTerms = terms.filter(term => 
        term.term && term.term.length > 0 && 
        term.definition && term.definition.length > 0
      );
      
      if (validTerms.length === 0) {
        throw new Error('No valid terms found in the file. Please check the format.');
      }
      
      console.log(`[GlossaryService] ✅ Successfully parsed ${validTerms.length} valid terms (format: ${detectedFormat})`);
      return validTerms;
      
    } catch (error) {
      console.error(`[GlossaryService] JSON parsing error:`, error);
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON format. Please check your file syntax.');
      }
      throw error;
    }
  }

  /**
   * Store glossary and terms in Firestore
   */
  private async storeGlossaryInFirestore(
    glossaryId: string,
    userId: string,
    fileName: string,
    terms: GlossaryTerm[],
    storageUrl: string,
    originalFileName: string
  ): Promise<void> {
    try {
      console.log(`[GlossaryService] Storing glossary in Firestore: ${glossaryId}`);
      
      const batch = writeBatch(this.firestore);
      
      // Store glossary metadata
      const glossaryRef = doc(this.firestore, 'glossaries', glossaryId);
      batch.set(glossaryRef, {
        userId,
        fileName,
        termsCount: terms.length,
        uploadedAt: serverTimestamp(),
        storageUrl,
        metadata: {
          originalFormat: 'json',
          originalFileName,
          processedAt: serverTimestamp()
        }
      });
      
      // Store individual terms
      terms.forEach((term, index) => {
        const termRef = doc(this.firestore, 'glossaries', glossaryId, 'terms', `term_${index}`);
        batch.set(termRef, {
          term: term.term.toLowerCase(), // Store lowercase for searching
          originalTerm: term.term, // Keep original case
          definition: term.definition,
          category: term.category || null,
          examples: term.examples || null,
          synonyms: term.synonyms || null,
          userId, // Add userId for Firestore rules compliance
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      
      await batch.commit();
      console.log(`[GlossaryService] ✅ Glossary and ${terms.length} terms stored successfully`);
      
    } catch (error) {
      console.error(`[GlossaryService] Firestore storage error:`, error);
      if (error instanceof FirestoreError) {
        if (error.code === 'permission-denied') {
          throw new Error('Permission denied: Please ensure you are properly authenticated and try again.');
        }
        throw new Error(`Database storage failed: ${error.message} (Code: ${error.code})`);
      }
      throw new Error('Failed to store glossary in database');
    }
  }
}

// Export singleton instance
export const GlossaryService = new GlossaryServiceImpl();

// Default export for compatibility
export default GlossaryService; 