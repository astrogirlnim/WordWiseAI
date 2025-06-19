# Real-Time Grammar Checking Performance Optimization

**Target**: Achieve <2s grammar check response time for all document sizes  
**Current Issues**: Slow OpenAI API calls, failures with large documents, lack of chunking strategy

## **✅ COMPLETED: Phase 1.1 - Smart Text Chunking Algorithm**
*Completed: All Phase 1.1 requirements implemented*
- ✅ **TextChunker utility class** with comprehensive sentence detection (`utils/text-chunker.ts`)
- ✅ **Edge case handling** for abbreviations, decimals, quotes with 35+ common abbreviations
- ✅ **Chunk size optimization** (2000 characters max, 100 character overlap)
- ✅ **Complete metadata tracking** with position mapping and multi-byte character support
- ✅ **Testing validation** with technical, creative, and legal document types
- ✅ **CORS issue resolution** by converting `checkGrammar` from `onRequest` to `onCall` pattern
- ✅ **Error deduplication** logic for overlapping chunk regions
- ✅ **TypeScript interfaces** for `TextChunk`, `ChunkedGrammarError`, and configuration options

**Current Status**: Large document errors are expected behavior - Phase 1.2 implementation needed to utilize the TextChunker.

---

---

## 🔍 **Diagnosed Performance Bottlenecks**

### **Critical Issues Found**:
1. **Full Document Processing**: Entire document content sent to OpenAI on every check
2. **No Text Chunking**: Large documents (>10k characters) cause API timeouts/failures
3. **Sequential Processing**: Single API call blocks entire grammar check process
4. **Rate Limiting Conflicts**: 2-second throttle + 30 req/min rate limit creates UX delays
5. **Cache Inefficiency**: Only caches identical full-text requests (low hit rate)
6. **Decoration Overflow**: All errors applied at once, causing UI lag on large error sets

### **Key Files Identified**:
- `hooks/use-grammar-checker.ts` - Core hook with performance bottlenecks
- `functions/index.js` - Cloud function processing full documents
- `services/ai-service.ts` - API service layer
- `components/tiptap-grammar-extension.ts` - Decoration rendering
- `components/document-editor.tsx` - Editor integration points

---

## 📋 **Phase-Based Optimization Checklist**

### **Phase 1: Text Chunking & Streaming Implementation**
*Target: Enable processing of large documents through intelligent chunking*

#### **Phase 1.1: Smart Text Chunking Algorithm**
- [x] **Implement sentence-boundary chunking logic** **(Critical)**
  - [x] Create `TextChunker` utility class with sentence detection
  - [x] Handle edge cases: abbreviations, decimals, quotes
  - [x] Maximum chunk size: 2000 characters (stay under OpenAI token limits)
  - [x] Overlap chunks by 100 characters to maintain context
  - [x] Test with various document types (technical, creative, legal)

- [x] **Add chunk metadata tracking** **(High)**
  - [x] Track original document positions for each chunk
  - [x] Store chunk boundaries and overlap regions
  - [x] Create mapping between chunk errors and document positions
  - [x] Handle multi-byte characters correctly in position calculations

#### **Phase 1.2: Streaming Grammar Check Architecture**
- [ ] **Modify `useGrammarChecker` hook for chunked processing** **(Critical)**
  - [ ] Replace full-text processing with chunk-based approach
  - [ ] Implement parallel chunk processing (max 3 concurrent requests)
  - [ ] Add streaming error state management
  - [ ] Create progress indicator for multi-chunk processing

- [ ] **Update Cloud Function for chunk processing** **(Critical)**
  - [ ] Modify `checkGrammar` function to accept chunk parameters
  - [ ] Add chunk metadata to request/response format
  - [ ] Implement chunk-aware caching strategy
  - [ ] Add OpenTelemetry tracing for performance monitoring

- [ ] **Error aggregation and deduplication** **(High)**
  - [ ] Merge errors from overlapping chunk regions
  - [ ] Remove duplicate errors across chunk boundaries
  - [ ] Preserve error context and suggestions across merges
  - [ ] Handle edge cases where errors span chunk boundaries

### **Phase 2: Performance & Caching Optimizations**
*Target: Reduce API calls and improve response times*

#### **Phase 2.1: Intelligent Caching Strategy**
- [ ] **Implement chunk-based caching** **(Critical)**
  - [ ] Replace full-document cache with chunk-level caching
  - [ ] Use content hash for cache keys (not full text)
  - [ ] Implement cache warming for commonly edited text patterns
  - [ ] Add cache hit/miss metrics and monitoring

- [ ] **Client-side cache optimization** **(High)**
  - [ ] Add in-memory cache for recently checked chunks
  - [ ] Implement cache invalidation on text changes
  - [ ] Store cache in IndexedDB for persistence across sessions
  - [ ] Add cache size limits and LRU eviction

#### **Phase 2.2: Request Optimization**
- [ ] **Dynamic throttling based on document size** **(High)**
  - [ ] Shorter debounce (200ms) for small documents (<1000 chars)
  - [ ] Longer debounce (800ms) for large documents (>5000 chars)
  - [ ] Implement adaptive throttling based on API response times
  - [ ] Add circuit breaker pattern for API failures

- [ ] **Batch processing for multiple chunks** **(Medium)**
  - [ ] Group multiple small chunks into single API call
  - [ ] Optimize payload structure for batch requests
  - [ ] Handle partial failures in batch operations
  - [ ] Add retry logic with exponential backoff

### **Phase 3: UI/UX Performance Enhancements**
*Target: Ensure smooth user experience during grammar checking*

#### **Phase 3.1: Progressive Error Rendering**
- [ ] **Streaming decoration updates** **(Critical)**
  - [ ] Render errors as chunks complete (not all at once)
  - [ ] Implement virtual scrolling for large error sets
  - [ ] Add loading indicators for pending chunks
  - [ ] Prevent decoration flashing during updates

- [ ] **Optimize TipTap decorations** **(High)**
  - [ ] Batch decoration updates to prevent multiple re-renders
  - [ ] Implement decoration pooling for memory efficiency
  - [ ] Add decoration throttling for rapid text changes
  - [ ] Optimize CSS for grammar error highlighting

#### **Phase 3.2: User Feedback & Progress**
- [ ] **Real-time progress indicators** **(Medium)**
  - [ ] Show progress bar for multi-chunk processing
  - [ ] Display "Checking grammar..." status in document bar
  - [ ] Add chunk processing status (1 of 5 chunks complete)
  - [ ] Implement cancellation for long-running checks

- [ ] **Error prioritization and display** **(Medium)**
  - [ ] Show critical errors (spelling, grammar) first
  - [ ] Deprioritize style suggestions during initial load
  - [ ] Implement error severity-based rendering order
  - [ ] Add option to disable real-time checking for large docs

### **Phase 4: Advanced Optimizations**
*Target: Achieve sub-1s response times and handle very large documents*

#### **Phase 4.1: Edge Computing & CDN**
- [ ] **Implement edge caching for grammar results** **(High)**
  - [ ] Deploy grammar cache to CloudFlare/AWS edge locations
  - [ ] Cache common grammar patterns and corrections
  - [ ] Implement geographic request routing for reduced latency
  - [ ] Add edge-based rate limiting

#### **Phase 4.2: AI Model Optimizations**
- [ ] **Experiment with smaller/faster models** **(Medium)**
  - [ ] Test GPT-3.5-turbo for basic grammar checks
  - [ ] Reserve GPT-4o for complex style suggestions
  - [ ] Implement model selection based on error types
  - [ ] A/B test response quality vs. speed trade-offs

- [ ] **Local grammar checking integration** **(Low)**
  - [ ] Integrate browser-native spellcheck as first pass
  - [ ] Use local rules for common grammar patterns
  - [ ] Send only uncertain cases to OpenAI API
  - [ ] Implement hybrid local/cloud checking strategy

### **Phase 5: Monitoring & Observability**
*Target: Ensure performance SLA compliance and early issue detection*

#### **Phase 5.1: Performance Monitoring**
- [ ] **Comprehensive metrics collection** **(Critical)**
  - [ ] Track chunk processing times (p50, p95, p99)
  - [ ] Monitor API response times per chunk size
  - [ ] Track cache hit rates and effectiveness
  - [ ] Measure decoration rendering performance

- [ ] **Real-time alerting** **(High)**
  - [ ] Alert when p95 latency > 2s for any chunk size
  - [ ] Monitor API error rates and timeout rates
  - [ ] Track user cancellation rates (indicates poor UX)
  - [ ] Alert on cache performance degradation

#### **Phase 5.2: User Experience Analytics**
- [ ] **Usage pattern analysis** **(Medium)**
  - [ ] Track document size distribution
  - [ ] Monitor feature adoption rates
  - [ ] Analyze error acceptance/rejection patterns
  - [ ] Measure time-to-first-error for different document sizes

### **Phase 6: Document Pagination & Virtualization**
*Target: Enable scalable editing and grammar checking for very large documents by only rendering and checking the visible portion.*

- [x] **Editor Slicing**  
  - [x] Implement logic to split document into pages (by word/char/paragraph count)
  - [x] Only render the current page in the editor

- [x] **Page Navigation UI**  
  - [x] Add next/prev page controls
  - [x] Show current page/total pages
  - [ ] (Optional) Allow jump to page

- [x] **Page Size Configuration**  
  - [x] Set default page size (e.g., 1000 words or 5000 chars)
  - [ ] Allow user to configure page size

- [x] **Grammar Checking Per Page**  
  - [x] Only check grammar for the visible page
  - [x] Trigger grammar check on page change

- [x] **State Management**  
  - [x] Keep full document in memory, sync edits from page to full doc
  - [x] Handle merging/splitting content across pages

- [ ] **Cursor/Selection Handling**  
  - [ ] Preserve cursor position on page change
  - [ ] Warn user if edits may affect other pages

- [ ] **(Optional) Virtualization**  
  - [ ] Use virtualization for extremely large documents (render only visible blocks)

---

## 🎯 **Implementation Priority Matrix**

### **Week 1-2: Foundation (Phase 1.1 & 1.2)**
**Target**: Basic chunking working for documents >5000 characters
- ✅ Text chunking algorithm (COMPLETED)
- ✅ CORS fix (Firebase Functions onCall pattern) (COMPLETED)
- ❌ Chunk processing in cloud function (PENDING - Phase 1.2)
- ❌ Basic streaming error aggregation (PENDING - Phase 1.2)

### **Week 3-4: Performance (Phase 2.1 & 2.2)**  
**Target**: <2s response time for 95% of requests
- Chunk-based caching
- Dynamic throttling
- Request optimization

### **Week 5-6: UX Polish (Phase 3.1 & 3.2)**
**Target**: Smooth user experience for all document sizes
- Progressive error rendering
- Progress indicators
- Error prioritization

### **Week 7-8: Advanced & Monitoring (Phase 4 & 5)**
**Target**: Production-ready with full observability
- Edge optimizations
- Comprehensive monitoring
- Performance SLA enforcement

---

## 🚨 **Critical Implementation Notes**

### **Avoid These Pitfalls**:
1. **Don't chunk mid-sentence** - Always break on sentence boundaries
2. **Don't ignore overlap errors** - Properly deduplicate across chunk boundaries  
3. **Don't block UI** - Always render errors progressively
4. **Don't cache full documents** - Use content hashes for efficient caching
5. **Don't exceed rate limits** - Implement proper request queuing

### **Testing Requirements**:
- Test with documents 1K, 5K, 10K, 50K+ characters
- Verify error position accuracy across chunk boundaries
- Load test concurrent users checking grammar simultaneously
- Test network failure scenarios and recovery
- Validate cache behavior under memory pressure

---

## 📈 **Success Metrics**

### **Performance KPIs**:
- **p95 latency** < 2s for all document sizes
- **Cache hit rate** > 60% for repeat content
- **Error accuracy** > 95% position mapping
- **UI responsiveness** < 100ms decoration updates

### **User Experience KPIs**:
- **Feature adoption** > 80% of active users
- **Error acceptance rate** > 40% of suggestions
- **Session abandonment** < 5% during grammar checks
- **User satisfaction** > 4.5/5 in post-feature surveys

---

**Total Estimated Effort**: 6-8 weeks  
**Priority**: Critical (impacts core product value proposition)  
**Risk Level**: Medium (complex integration with existing editor) 