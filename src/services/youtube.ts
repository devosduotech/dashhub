export interface YouTubeVideo {
  id: string
  title: string
  url: string
  thumbnail: string
  publishedAt: string | null
}

export interface ChannelVideos {
  channelId: string
  videos: YouTubeVideo[]
}

const FEED_ENDPOINT = '/api/youtube/feed'

export async function fetchChannelVideos(
  channelId: string,
  options: { max?: number; cacheMinutes?: number } = {}
): Promise<ChannelVideos> {
  const params = new URLSearchParams({ channelId: channelId.trim() })
  if (options.max) params.set('max', String(options.max))
  if (options.cacheMinutes) params.set('cacheMinutes', String(options.cacheMinutes))

  const res = await fetch(`${FEED_ENDPOINT}?${params.toString()}`)
  if (!res.ok) {
    let message = `Failed to load channel feed (HTTP ${res.status})`
    try {
      const body = await res.json()
      if (body?.message) message = body.message
    } catch {
      /* ignore malformed error bodies */
    }
    throw new Error(message)
  }
  return res.json()
}

const THUMB_QUALITY: Record<string, string> = {
  small: 'mqdefault',
  medium: 'hqdefault',
  large: 'sddefault'
}

export function thumbnailFor(video: YouTubeVideo, size: 'small' | 'medium' | 'large' = 'medium'): string {
  if (video.id) {
    const quality = THUMB_QUALITY[size] || 'hqdefault'
    return `https://i.ytimg.com/vi/${video.id}/${quality}.jpg`
  }
  return video.thumbnail || ''
}

export function relativeTime(iso: string | null): string {
  if (!iso) return ''
  const diffMs = Date.now() - new Date(iso).getTime()
  if (diffMs < 0 || !Number.isFinite(diffMs)) return ''
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(days / 365)}y ago`
}