'use client'

import { diff_match_patch, DIFF_DELETE, DIFF_INSERT, DIFF_EQUAL } from 'diff-match-patch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface VersionDiffViewerProps {
  isOpen: boolean
  onClose: () => void
  oldContent: string
  newContent: string
}

export function VersionDiffViewer({
  isOpen,
  onClose,
  oldContent,
  newContent,
}: VersionDiffViewerProps) {
  const stripHtmlTags = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  };

  const cleanOldContent = stripHtmlTags(oldContent);
  const cleanNewContent = stripHtmlTags(newContent);

  const dmp = new diff_match_patch()
  const diffs = dmp.diff_main(cleanOldContent, cleanNewContent)
  dmp.diff_cleanupSemantic(diffs)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Version Comparison</DialogTitle>
          <DialogDescription>
            Showing differences between the selected version and the current document. Deletions are in red, insertions are in green.
          </DialogDescription>
        </DialogHeader>
        <div className="prose dark:prose-invert overflow-auto h-full rounded-md border p-4 whitespace-pre-wrap">
          {diffs.map(([op, text], index) => {
            switch (op) {
              case DIFF_INSERT:
                return <ins key={index} className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 no-underline">{text}</ins>
              case DIFF_DELETE:
                return <del key={index} className="bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200">{text}</del>
              case DIFF_EQUAL:
                return <span key={index}>{text}</span>
              default:
                return null
            }
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
} 