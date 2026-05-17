'use client'

import { ExternalLink, TrendingUp } from 'lucide-react'

interface TrendSourceLinksProps {
  newsArticleUrl?: string
  googleTrendsUrl?: string
  className?: string
}

export function TrendSourceLinks({
  newsArticleUrl,
  googleTrendsUrl,
  className = '',
}: TrendSourceLinksProps) {
  if (!newsArticleUrl && !googleTrendsUrl) return null

  return (
    <div className={`flex flex-col gap-2 pt-3 border-t border-border ${className}`}>
      {newsArticleUrl && (
        <a
          href={newsArticleUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-muted/80 hover:bg-muted text-sm font-medium text-foreground transition-colors"
        >
          <span>Read news coverage</span>
          <ExternalLink className="w-4 h-4 shrink-0 text-primary" />
        </a>
      )}
      {googleTrendsUrl && (
        <a
          href={googleTrendsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-muted/80 hover:bg-muted text-sm font-medium text-foreground transition-colors"
        >
          <span>View on Google Trends India</span>
          <TrendingUp className="w-4 h-4 shrink-0 text-primary" />
        </a>
      )}
    </div>
  )
}
