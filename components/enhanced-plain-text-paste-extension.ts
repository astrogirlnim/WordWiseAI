/**
 * Enhanced Plain Text Paste Extension
 * Comprehensive clipboard handling that converts ALL pasted content to plain text
 * 
 * This extension handles multiple clipboard formats:
 * - text/plain
 * - text/html (with tag stripping)
 * - text/rtf (with RTF parsing)
 * - application/x-vnd.onenote.onebinary (OneNote)
 * - Files and images (converted to text descriptions)
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

interface PasteHandlerOptions {
  enableLogging?: boolean;
  maxTextLength?: number;
  preserveLineBreaks?: boolean;
  allowBasicFormatting?: boolean;
}

/**
 * Extract plain text from HTML content by stripping all tags
 */
function extractTextFromHTML(html: string): string {
  console.log('[EnhancedPasteExtension] Extracting text from HTML, length:', html.length);
  
  try {
    // Create temporary DOM element
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Remove script and style elements completely
    const scriptsAndStyles = tempDiv.querySelectorAll('script, style');
    scriptsAndStyles.forEach(element => element.remove());
    
    // Extract text content
    const text = tempDiv.textContent || tempDiv.innerText || '';
    
    // Clean up whitespace but preserve line breaks
    const cleanedText = text
      .replace(/\s+/g, ' ')           // Collapse multiple spaces
      .replace(/\n\s*/g, '\n')        // Clean up line breaks
      .replace(/\n{3,}/g, '\n\n')     // Limit consecutive line breaks
      .trim();
    
    console.log('[EnhancedPasteExtension] Extracted text from HTML:', cleanedText.substring(0, 100));
    return cleanedText;
  } catch (error) {
    console.error('[EnhancedPasteExtension] Error extracting text from HTML:', error);
    return '';
  }
}

/**
 * Basic RTF to plain text conversion
 */
function extractTextFromRTF(rtf: string): string {
  console.log('[EnhancedPasteExtension] Extracting text from RTF, length:', rtf.length);
  
  try {
    // Remove RTF control words and groups
    const text = rtf
      .replace(/\\[a-z]+\d*\s?/gi, '')  // Remove control words
      .replace(/[{}]/g, '')             // Remove braces
      .replace(/\\\\/g, '\\')           // Unescape backslashes
      .replace(/\\'/g, "'")             // Unescape quotes
      .replace(/\s+/g, ' ')             // Collapse whitespace
      .trim();
    
    console.log('[EnhancedPasteExtension] Extracted text from RTF:', text.substring(0, 100));
    return text;
  } catch (error) {
    console.error('[EnhancedPasteExtension] Error extracting text from RTF:', error);
    return '';
  }
}

/**
 * Handle file drops and convert to text descriptions
 */
function handleFileContent(files: FileList): string {
  console.log('[EnhancedPasteExtension] Handling file content, count:', files.length);
  
  const descriptions: string[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const description = `[File: ${file.name} (${file.type || 'unknown type'}, ${(file.size / 1024).toFixed(1)} KB)]`;
    descriptions.push(description);
  }
  
  const result = descriptions.join('\n');
  console.log('[EnhancedPasteExtension] File descriptions:', result);
  return result;
}

/**
 * Comprehensive clipboard text extraction
 */
function extractPlainTextFromClipboard(
  clipboardData: DataTransfer
): string {
  console.log('[EnhancedPasteExtension] Extracting plain text from clipboard');
  console.log('[EnhancedPasteExtension] Available clipboard types:', Array.from(clipboardData.types));
  
  let extractedText = '';
  
  // Strategy 1: Try text/plain first (most reliable)
  if (clipboardData.types.includes('text/plain')) {
    extractedText = clipboardData.getData('text/plain');
    if (extractedText.trim()) {
      console.log('[EnhancedPasteExtension] Using text/plain content');
      return extractedText;
    }
  }
  
  // Strategy 2: Try text/html and strip tags
  if (clipboardData.types.includes('text/html')) {
    const html = clipboardData.getData('text/html');
    if (html.trim()) {
      console.log('[EnhancedPasteExtension] Converting HTML to plain text');
      extractedText = extractTextFromHTML(html);
      if (extractedText.trim()) {
        return extractedText;
      }
    }
  }
  
  // Strategy 3: Try text/rtf
  if (clipboardData.types.includes('text/rtf')) {
    const rtf = clipboardData.getData('text/rtf');
    if (rtf.trim()) {
      console.log('[EnhancedPasteExtension] Converting RTF to plain text');
      extractedText = extractTextFromRTF(rtf);
      if (extractedText.trim()) {
        return extractedText;
      }
    }
  }
  
  // Strategy 4: Handle files
  if (clipboardData.files && clipboardData.files.length > 0) {
    console.log('[EnhancedPasteExtension] Converting files to text descriptions');
    extractedText = handleFileContent(clipboardData.files);
    if (extractedText.trim()) {
      return extractedText;
    }
  }
  
  // Strategy 5: Try other text formats
  for (const type of clipboardData.types) {
    if (type.startsWith('text/') && !['text/plain', 'text/html', 'text/rtf'].includes(type)) {
      const data = clipboardData.getData(type);
      if (data.trim()) {
        console.log(`[EnhancedPasteExtension] Using fallback text type: ${type}`);
        // Basic sanitization for unknown text formats
        extractedText = data.replace(/<[^>]*>/g, '').trim();
        if (extractedText) {
          return extractedText;
        }
      }
    }
  }
  
  console.warn('[EnhancedPasteExtension] No usable text content found in clipboard');
  return '';
}

/**
 * Sanitize and process extracted text
 */
function sanitizeExtractedText(
  text: string,
  options: PasteHandlerOptions
): string {
  if (!text) return '';
  
  console.log('[EnhancedPasteExtension] Sanitizing extracted text, length:', text.length);
  
  let processedText = text;
  
  // Apply length limit
  if (options.maxTextLength && processedText.length > options.maxTextLength) {
    console.log(`[EnhancedPasteExtension] Truncating text to ${options.maxTextLength} characters`);
    processedText = processedText.substring(0, options.maxTextLength) + '...';
  }
  
  // Clean up whitespace
  if (options.preserveLineBreaks) {
    // Preserve line breaks but clean up excessive whitespace
    processedText = processedText
      .replace(/[ \t]+/g, ' ')        // Collapse spaces and tabs
      .replace(/\n\s*/g, '\n')        // Clean up line breaks
      .replace(/\n{3,}/g, '\n\n');    // Limit consecutive line breaks
  } else {
    // Convert everything to single-line text
    processedText = processedText
      .replace(/\s+/g, ' ')           // Collapse all whitespace
      .trim();
  }
  
  // Remove any remaining HTML entities
  processedText = processedText
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, '');
  
  // Remove control characters but preserve printable characters
  processedText = processedText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  console.log('[EnhancedPasteExtension] Sanitized text sample:', processedText.substring(0, 100));
  return processedText;
}

/**
 * Enhanced Plain Text Paste Extension
 */
export function createEnhancedPlainTextPasteExtension(
  options: PasteHandlerOptions = {}
): Extension {
  const defaultOptions: Required<PasteHandlerOptions> = {
    enableLogging: true,
    maxTextLength: 50000,
    preserveLineBreaks: true,
    allowBasicFormatting: false,
    ...options
  };

  return Extension.create({
    name: 'enhancedPlainTextPaste',
    
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey('enhancedPlainTextPaste'),
          props: {
            handlePaste(view, event) {
              if (defaultOptions.enableLogging) {
                console.log('[EnhancedPasteExtension] Intercepting paste event');
              }
              
              // Get clipboard data
              const clipboardData = event.clipboardData;
              if (!clipboardData) {
                console.warn('[EnhancedPasteExtension] No clipboard data available');
                return false;
              }
              
              try {
                // Extract plain text from clipboard
                const rawText = extractPlainTextFromClipboard(clipboardData);
                
                if (!rawText.trim()) {
                  console.warn('[EnhancedPasteExtension] No text content found, allowing default paste');
                  return false;
                }
                
                // Sanitize the extracted text
                const sanitizedText = sanitizeExtractedText(rawText, defaultOptions);
                
                if (!sanitizedText.trim()) {
                  console.warn('[EnhancedPasteExtension] Text sanitization resulted in empty content');
                  return false;
                }
                
                // Insert the sanitized plain text
                const { tr } = view.state;
                const { from, to } = view.state.selection;
                
                tr.insertText(sanitizedText, from, to);
                view.dispatch(tr);
                
                if (defaultOptions.enableLogging) {
                  console.log('[EnhancedPasteExtension] Successfully inserted plain text:', {
                    originalLength: rawText.length,
                    sanitizedLength: sanitizedText.length,
                    previewText: sanitizedText.substring(0, 50)
                  });
                }
                
                return true; // Prevent default paste handling
                
              } catch (error) {
                console.error('[EnhancedPasteExtension] Error processing paste:', error);
                
                // Fallback: try to get basic text/plain
                const fallbackText = clipboardData.getData('text/plain');
                if (fallbackText) {
                  const { tr } = view.state;
                  const { from, to } = view.state.selection;
                  tr.insertText(fallbackText, from, to);
                  view.dispatch(tr);
                  
                  console.log('[EnhancedPasteExtension] Used fallback text/plain');
                  return true;
                }
                
                console.warn('[EnhancedPasteExtension] Fallback failed, allowing default paste');
                return false;
              }
            },
            
            handleDrop(view, event) {
              if (defaultOptions.enableLogging) {
                console.log('[EnhancedPasteExtension] Intercepting drop event');
              }
              
              // Handle file drops
              const files = event.dataTransfer?.files;
              if (files && files.length > 0) {
                console.log('[EnhancedPasteExtension] Handling file drop');
                
                const fileDescriptions = handleFileContent(files);
                if (fileDescriptions) {
                  const { tr } = view.state;
                  const { from } = view.state.selection;
                  tr.insertText(fileDescriptions, from);
                  view.dispatch(tr);
                  
                  return true; // Prevent default drop handling
                }
              }
              
              // For other drops, apply the same text extraction logic
              const clipboardData = event.dataTransfer;
              if (clipboardData) {
                const rawText = extractPlainTextFromClipboard(clipboardData);
                if (rawText.trim()) {
                  const sanitizedText = sanitizeExtractedText(rawText, defaultOptions);
                  if (sanitizedText.trim()) {
                    const { tr } = view.state;
                    const { from } = view.state.selection;
                    tr.insertText(sanitizedText, from);
                    view.dispatch(tr);
                    
                    console.log('[EnhancedPasteExtension] Successfully handled drop as plain text');
                    return true;
                  }
                }
              }
              
              return false; // Allow default drop handling
            }
          }
        })
      ];
    }
  });
}

// Export default configuration
export const EnhancedPlainTextPasteExtension = createEnhancedPlainTextPasteExtension({
  enableLogging: true,
  maxTextLength: 50000,
  preserveLineBreaks: true,
  allowBasicFormatting: false
});

// Export factory function for custom configurations
export { createEnhancedPlainTextPasteExtension as createEnhancedPasteExtension }; 