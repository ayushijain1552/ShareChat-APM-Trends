'use client'

import { motion } from 'framer-motion'
import { Heart, MessageCircle, Share2, UserPlus, Check, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { exploreFeedPosts } from '@/lib/explore-feed-data'

export function ExploreScreen() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="px-4 py-3">
          <h1 className="text-lg font-bold text-foreground">For You</h1>
          <p className="text-sm text-muted-foreground">Posts picked for you</p>
        </div>
      </header>

      <main className="divide-y divide-border">
        {exploreFeedPosts.map((post, index) => (
          <motion.article
            key={post.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-card"
          >
            <motion.div layout className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xl shrink-0">
                  {post.avatar}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">
                    {post.author}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{post.handle}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                    post.isFollowing
                      ? 'bg-muted text-muted-foreground border-border'
                      : 'bg-primary text-primary-foreground border-primary',
                  )}
                >
                  {post.isFollowing ? (
                    <span className="flex items-center gap-1">
                      <Check className="w-3 h-3" /> Following
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <UserPlus className="w-3 h-3" /> Follow
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  className="p-2 rounded-full hover:bg-muted"
                  aria-label="More options"
                >
                  <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </motion.div>

            <div
              className={cn(
                'mx-4 mb-3 aspect-[4/5] max-h-[420px] rounded-2xl bg-gradient-to-br',
                post.imageGradient,
              )}
            />

            <div className="px-4 pb-2 flex items-center gap-5">
              <button type="button" className="flex items-center gap-1.5 text-sm">
                <Heart className="w-6 h-6 text-foreground" />
                <span className="font-medium">{post.likes}</span>
              </button>
              <button type="button" className="flex items-center gap-1.5 text-sm">
                <MessageCircle className="w-6 h-6 text-foreground" />
                <span className="font-medium">{post.comments}</span>
              </button>
              <button type="button" className="flex items-center gap-1.5 text-sm">
                <Share2 className="w-6 h-6 text-foreground" />
                <span className="font-medium">{post.shares}</span>
              </button>
              <span className="ml-auto text-xs text-muted-foreground">{post.timeAgo}</span>
            </div>

            <div className="px-4 pb-4">
              <p className="text-sm text-foreground leading-relaxed" lang="hi">
                {post.captionHi}
              </p>
              <p className="text-sm font-medium text-primary mt-1" lang="hi">
                {post.hashtagHi}
              </p>
            </div>
          </motion.article>
        ))}
      </main>
    </div>
  )
}
