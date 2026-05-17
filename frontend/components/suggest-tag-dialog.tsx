'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tag, X } from 'lucide-react'

interface SuggestTagDialogProps {
  currentTag: string
  isOpen: boolean
  onClose: () => void
}

export function SuggestTagDialog({ currentTag, isOpen, onClose }: SuggestTagDialogProps) {
  const [suggestion, setSuggestion] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = suggestion.trim()
    if (!trimmed) return
    setSent(true)
    setTimeout(() => {
      setSent(false)
      setSuggestion('')
      onClose()
    }, 1200)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/25 z-[60]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed inset-x-4 bottom-24 z-[60] max-w-md mx-auto rounded-2xl bg-card border border-border p-4 shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Suggest alternate tag</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-muted"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Current tag: <span className="font-medium text-foreground">{currentTag}</span>
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                placeholder="Your suggested tag…"
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30"
                maxLength={48}
                autoFocus
              />
              <button
                type="submit"
                disabled={!suggestion.trim() || sent}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50"
              >
                {sent ? 'Thanks — recorded!' : 'Submit suggestion'}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
