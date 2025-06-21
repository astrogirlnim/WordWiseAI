/**
 * Editor Content Coordinator
 * Centralized system to eliminate content update race conditions
 * 
 * This coordinator ensures that user input always takes priority and prevents
 * multiple simultaneous setContent() calls from causing text flashing and
 * content conflicts.
 */

import type { Editor } from '@tiptap/react';

interface ContentUpdate {
  type: 'user' | 'page' | 'version' | 'ai' | 'grammar';
  content: string;
  priority: number;
  timestamp: number;
  source: string;
  metadata?: Record<string, unknown>;
}

interface CoordinatorOptions {
  debounceDelay?: number;
  maxQueueSize?: number;
  enableLogging?: boolean;
}

export class EditorContentCoordinator {
  private editor: Editor | null = null;
  private isUserTyping = false;
  private isProcessingUpdate = false;
  private pendingUpdates: ContentUpdate[] = [];
  private lastUserInputTime = 0;
  private updateQueue: ContentUpdate[] = [];
  private readonly options: Required<CoordinatorOptions>;

  // Priority levels (higher number = higher priority)
  private readonly PRIORITY_LEVELS = {
    user: 100,      // User input always wins
    version: 80,    // Version restore important
    ai: 60,         // AI suggestions moderate
    page: 40,       // Page changes lower
    grammar: 20     // Grammar updates lowest
  };

  constructor(options: CoordinatorOptions = {}) {
    this.options = {
      debounceDelay: 300,
      maxQueueSize: 50,
      enableLogging: true,
      ...options
    };

    console.log('[EditorContentCoordinator] Initialized with options:', this.options);
  }

  /**
   * Bind to a TipTap editor instance
   */
  bindToEditor(editor: Editor): void {
    console.log('[EditorContentCoordinator] Binding to editor instance');
    this.editor = editor;
  }

  /**
   * Unbind from editor (cleanup)
   */
  unbind(): void {
    console.log('[EditorContentCoordinator] Unbinding from editor');
    this.editor = null;
    this.pendingUpdates = [];
    this.updateQueue = [];
    this.isUserTyping = false;
    this.isProcessingUpdate = false;
  }

  /**
   * Central method for all content updates
   */
  async updateContent(
    type: ContentUpdate['type'],
    content: string,
    source: string,
    metadata?: Record<string, unknown>
  ): Promise<boolean> {
    if (!this.editor) {
      console.warn('[EditorContentCoordinator] No editor bound, ignoring update');
      return false;
    }

    const update: ContentUpdate = {
      type,
      content,
      priority: this.PRIORITY_LEVELS[type],
      timestamp: Date.now(),
      source,
      metadata
    };

    if (this.options.enableLogging) {
      console.log(`[EditorContentCoordinator] Update request: ${type} from ${source}`, {
        contentLength: content.length,
        priority: update.priority,
        isUserTyping: this.isUserTyping,
        isProcessingUpdate: this.isProcessingUpdate
      });
    }

    // Handle user input with highest priority
    if (type === 'user') {
      return await this.handleUserInput(update);
    }

    // Handle non-user updates
    return await this.handleSystemUpdate(update);
  }

  /**
   * Handle user input updates (highest priority)
   */
  private async handleUserInput(update: ContentUpdate): Promise<boolean> {
    this.lastUserInputTime = Date.now();
    this.isUserTyping = true;

    try {
      // Clear any pending system updates
      this.clearLowerPriorityUpdates(update.priority);

      // Apply user input immediately
      const success = await this.applyContentUpdate(update);

      if (this.options.enableLogging) {
        console.log('[EditorContentCoordinator] User input applied:', {
          success,
          contentLength: update.content.length
        });
      }

      // Set typing timeout
      setTimeout(() => {
        this.isUserTyping = false;
        this.processQueuedUpdates();
      }, this.options.debounceDelay);

      return success;
    } catch (error) {
      console.error('[EditorContentCoordinator] Error applying user input:', error);
      this.isUserTyping = false;
      return false;
    }
  }

  /**
   * Handle system updates (lower priority)
   */
  private async handleSystemUpdate(update: ContentUpdate): Promise<boolean> {
    // If user is actively typing, queue the update
    if (this.isUserTyping || this.isRecentUserActivity()) {
      return this.queueUpdate(update);
    }

    // If another update is processing, queue this one
    if (this.isProcessingUpdate) {
      return this.queueUpdate(update);
    }

    // Apply immediately if no conflicts
    return await this.applyContentUpdate(update);
  }

  /**
   * Queue a system update for later processing
   */
  private queueUpdate(update: ContentUpdate): boolean {
    // Check queue size limit
    if (this.updateQueue.length >= this.options.maxQueueSize) {
      console.warn('[EditorContentCoordinator] Queue full, dropping oldest update');
      this.updateQueue.shift();
    }

    // Insert update in priority order
    const insertIndex = this.updateQueue.findIndex(u => u.priority < update.priority);
    if (insertIndex === -1) {
      this.updateQueue.push(update);
    } else {
      this.updateQueue.splice(insertIndex, 0, update);
    }

    if (this.options.enableLogging) {
      console.log(`[EditorContentCoordinator] Queued ${update.type} update from ${update.source}`, {
        queueLength: this.updateQueue.length,
        position: insertIndex === -1 ? this.updateQueue.length - 1 : insertIndex
      });
    }

    return true;
  }

  /**
   * Apply content update to editor
   */
  private async applyContentUpdate(update: ContentUpdate): Promise<boolean> {
    if (!this.editor || this.editor.isDestroyed) {
      console.warn('[EditorContentCoordinator] Editor not available for update');
      return false;
    }

    this.isProcessingUpdate = true;

    try {
      const startTime = performance.now();

      // Get current content for comparison
      const currentContent = this.editor.getHTML();
      
      // Skip if content is identical
      if (currentContent === update.content) {
        if (this.options.enableLogging) {
          console.log(`[EditorContentCoordinator] Skipping identical content update from ${update.source}`);
        }
        return true;
      }

      // Apply the update with appropriate parameters
      const shouldEmitUpdate = update.type === 'user';
      this.editor.commands.setContent(update.content, shouldEmitUpdate);

      const duration = performance.now() - startTime;

      if (this.options.enableLogging) {
        console.log(`[EditorContentCoordinator] Applied ${update.type} update from ${update.source}`, {
          duration: `${duration.toFixed(2)}ms`,
          contentLength: update.content.length,
          emitUpdate: shouldEmitUpdate
        });
      }

      // Track performance
      if (duration > 50) {
        console.warn(`[EditorContentCoordinator] Slow content update: ${duration.toFixed(2)}ms`, update);
      }

      return true;
    } catch (error) {
      console.error(`[EditorContentCoordinator] Failed to apply ${update.type} update:`, error);
      return false;
    } finally {
      this.isProcessingUpdate = false;
    }
  }

  /**
   * Process queued updates when safe to do so
   */
  private async processQueuedUpdates(): Promise<void> {
    if (this.isUserTyping || this.isProcessingUpdate || this.updateQueue.length === 0) {
      return;
    }

    if (this.options.enableLogging) {
      console.log(`[EditorContentCoordinator] Processing ${this.updateQueue.length} queued updates`);
    }

    while (this.updateQueue.length > 0 && !this.isUserTyping) {
      const update = this.updateQueue.shift();
      if (update) {
        await this.applyContentUpdate(update);
        
        // Small delay between updates to prevent overwhelming the editor
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
  }

  /**
   * Clear updates with lower priority than specified
   */
  private clearLowerPriorityUpdates(priorityThreshold: number): void {
    const beforeLength = this.updateQueue.length;
    this.updateQueue = this.updateQueue.filter(update => update.priority >= priorityThreshold);
    
    if (this.options.enableLogging && beforeLength !== this.updateQueue.length) {
      console.log(`[EditorContentCoordinator] Cleared ${beforeLength - this.updateQueue.length} lower priority updates`);
    }
  }

  /**
   * Check if user has been active recently
   */
  private isRecentUserActivity(): boolean {
    const timeSinceLastInput = Date.now() - this.lastUserInputTime;
    return timeSinceLastInput < this.options.debounceDelay * 2;
  }

  /**
   * Get current coordinator state for debugging
   */
  getState(): {
    isUserTyping: boolean;
    isProcessingUpdate: boolean;
    queueLength: number;
    lastUserInputTime: number;
    timeSinceLastInput: number;
  } {
    return {
      isUserTyping: this.isUserTyping,
      isProcessingUpdate: this.isProcessingUpdate,
      queueLength: this.updateQueue.length,
      lastUserInputTime: this.lastUserInputTime,
      timeSinceLastInput: Date.now() - this.lastUserInputTime
    };
  }

  /**
   * Force process all queued updates (emergency use only)
   */
  async forceProcessQueue(): Promise<void> {
    console.warn('[EditorContentCoordinator] Force processing queue - this may cause conflicts');
    this.isUserTyping = false;
    await this.processQueuedUpdates();
  }

  /**
   * Clear all queued updates
   */
  clearQueue(): void {
    const clearedCount = this.updateQueue.length;
    this.updateQueue = [];
    
    if (this.options.enableLogging) {
      console.log(`[EditorContentCoordinator] Cleared ${clearedCount} queued updates`);
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    totalUpdates: number;
    userUpdates: number;
    systemUpdates: number;
    queuedUpdates: number;
  } {
    // This would be implemented with proper tracking
    // For now, return current state info
    return {
      totalUpdates: 0, // Would track this
      userUpdates: 0,  // Would track this
      systemUpdates: 0, // Would track this
      queuedUpdates: this.updateQueue.length
    };
  }
}

// Singleton instance for global use
export const editorContentCoordinator = new EditorContentCoordinator({
  debounceDelay: 300,
  maxQueueSize: 50,
  enableLogging: true
});

// Convenience functions for common update types
export const updateContentSafely = {
  user: (content: string, source: string, metadata?: Record<string, unknown>) => 
    editorContentCoordinator.updateContent('user', content, source, metadata),
    
  page: (content: string, source: string, metadata?: Record<string, unknown>) => 
    editorContentCoordinator.updateContent('page', content, source, metadata),
    
  version: (content: string, source: string, metadata?: Record<string, unknown>) => 
    editorContentCoordinator.updateContent('version', content, source, metadata),
    
  ai: (content: string, source: string, metadata?: Record<string, unknown>) => 
    editorContentCoordinator.updateContent('ai', content, source, metadata),
    
  grammar: (content: string, source: string, metadata?: Record<string, unknown>) => 
    editorContentCoordinator.updateContent('grammar', content, source, metadata),
}; 