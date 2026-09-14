import { useEffect, useMemo, useState } from 'react'
import MediaPlayer from './MediaPlayer'

const FIVE_HOURS = 5 * 60 * 60

function scheduleAt(playlist, elapsed) {
  if (!playlist.length) return { item: null, offset: 0, index: -1 }

  const total = playlist.reduce((sum, p) => sum + Math.max(1, p.duration || p.media?.duration || 1), 0)
  if (total <= 0) return { item: playlist[0], offset: 0, index: 0 }

  // The complete window cycle is exactly five hours. The playlist is repeated
  // as many times as necessary and starts again at the five-hour boundary.
  const cycleElapsed = elapsed % FIVE_HOURS
  const position = cycleElapsed % total

  let cursor = 0
  for (let i = 0; i < playlist.length; i++) {
    const duration = Math.max(1, playlist[i].duration || playlist[i].media?.duration || 1)
    if (position < cursor + duration) {
      return { item: playlist[i], offset: position - cursor, index: i }
    }
    cursor += duration
  }

  return { item: playlist[0], offset: 0, index: 0 }
}

export default function MediaWindow({ windowData, playlist, elapsedSeconds, sync }) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const normal = useMemo(() => scheduleAt(playlist, elapsedSeconds + tick), [playlist, elapsedSeconds, tick])

  const syncInfo = useMemo(() => {
    if (!sync?.active || !sync.media) return null
    const started = new Date(sync.startedAt).getTime()
    const elapsed = Math.max(0, Date.now() - started) / 1000
    if (elapsed >= sync.duration) return null
    return { media: sync.media, offset: elapsed, remaining: sync.duration - elapsed }
  }, [sync, tick])

  const active = syncInfo
    ? { media: syncInfo.media, offset: syncInfo.offset, syncing: true }
    : { media: normal.item?.media, offset: normal.offset, syncing: false }

  return (
    <section className="window-card">
      <div className="window-top">
        <div>
          <span className="eyebrow">DISPLAY</span>
          <h2>{windowData.name}</h2>
        </div>
        <span className={active.syncing ? 'status sync' : 'status'}>
          {active.syncing ? 'SYNC' : 'PLAYING'}
        </span>
      </div>

      <div className="screen">
        <MediaPlayer
          key={`${active.syncing ? 'sync' : 'normal'}-${active.media?.id}`}
          media={active.media}
          videoOffset={active.offset}
        />
        {active.syncing && (
          <div className="sync-badge">
            SYNCED • {Math.ceil(syncInfo.remaining)}s
          </div>
        )}
      </div>

      <div className="now-playing">
        <div>
          <strong>{active.media?.name || 'No media'}</strong>
          <span>{active.syncing ? 'Global synchronization' : `Playlist item ${Math.max(1, normal.index + 1)} of ${playlist.length}`}</span>
        </div>
        <span>{active.media ? `${active.media.duration}s` : '—'}</span>
      </div>
    </section>
  )
}
