# Grammar Check Decorator Positioning Fixes

## Problem Summary
The real-time grammar check feature was placing decorators/underlines/highlights in the wrong positions in the text editor. Text underlines were appearing in vastly incorrect locations, making the feature unusable.

## Root Causes Identified

### 1. Double Position Adjustment Bug
- Errors were being adjusted twice in the position mapping pipeline
- First adjustment: `useGrammarChecker` added `visibleRange.start` to error positions  
- Second adjustment: `DocumentEditor` subtracted `pageOffset` from error positions
- This resulted in incorrect final positions for decorations

### 2. Complex Multi-byte Character Handling  
- `TextChunker.mapErrorToOriginalPosition()` used complex multi-byte character calculations
- The `calculateBytePosition()` method was causing position drift
- Unicode character handling was overcomplicated and unreliable

### 3. Insufficient Position Validation
- No text matching validation between expected error text and actual text at positions
- Decorations could be created even when positions were completely wrong
- Limited debugging made it hard to diagnose position mismatches

## Fixes Implemented

### 1. Fixed Double Position Adjustment
**File: `hooks/use-grammar-checker.ts`**
- Simplified position adjustment logic in both single request and chunked processing paths
- Ensured errors are adjusted to full document positions only once
- Added clear logging to track position transformations

### 2. Simplified Position Mapping  
**File: `utils/text-chunker.ts`**
- Replaced complex `calculateBytePosition()` with simple arithmetic: `chunkStart + relativePosition`
- Added position bounds validation to prevent out-of-range errors
- Removed overly complex multi-byte character handling that was causing drift

### 3. Enhanced Position Validation
**File: `components/document-editor.tsx`**
- Added text matching validation: check if `editor.textBetween(start, end) === error.error`
- Enhanced logging to show expected vs actual text at error positions
- Improved validation logic to catch position mismatches early

**File: `components/tiptap-grammar-extension.ts`**
- Added text matching validation before creating decorations
- Only create decorations when text at positions matches expected error text
- Skip invalid errors instead of failing entirely
- Enhanced debugging output for position validation

## Testing Instructions

### 1. Start the Application
```bash
# Terminal 1: Start Firebase emulators
npm run emulators:start

# Terminal 2: Start Next.js dev server  
npm run dev
```

### 2. Test with Sample Content
1. Navigate to http://localhost:3000
2. Create a new document or open existing one
3. Paste content from `test-files/position-test.md` 
4. Observe that grammar errors appear with correct underlines

### 3. Validation Checklist
- [ ] Grammar errors appear with red/blue underlines in correct positions
- [ ] Right-clicking on underlined text shows context menu with suggestions
- [ ] Text matches exactly between error detection and decoration placement
- [ ] No console errors about invalid positions or text mismatches
- [ ] Decorations update correctly when text is edited
- [ ] Page navigation preserves error positioning accuracy

### 4. Debug Output Verification
Check browser console for logs showing:
```
[useGrammarChecker] BUGFIX: Error positions after adjustment: [...]
[DocumentEditor] BUGFIX: ✓ Text alignment perfect for error [...]  
[GrammarExtension] BUGFIX: ✓ Text match confirmed for error [...]
```

## Performance Impact
- **Positive**: Simplified position calculations are faster than complex multi-byte handling
- **Positive**: Early validation prevents creation of invalid decorations  
- **Neutral**: Additional text matching validation has minimal performance cost
- **Positive**: Clearer debugging reduces troubleshooting time

## Files Modified
1. `hooks/use-grammar-checker.ts` - Fixed double position adjustment
2. `utils/text-chunker.ts` - Simplified position mapping logic
3. `components/document-editor.tsx` - Enhanced position validation
4. `components/tiptap-grammar-extension.ts` - Added text matching validation
5. `test-files/position-test.md` - Created test content for validation

## Next Steps
1. Test with various document sizes and content types
2. Verify positioning works correctly across page boundaries  
3. Test with documents containing special characters and formatting
4. Monitor for any remaining edge cases in position calculation

## Rollback Plan
If issues arise, revert commit `c241e59` to restore previous behavior:
```bash
git revert c241e59
```

The original complex position mapping logic will be restored, though it had the positioning issues.