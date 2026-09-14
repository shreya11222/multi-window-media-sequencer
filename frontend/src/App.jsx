import { useCallback, useEffect, useMemo, useState } from 'react'
import MediaWindow from './components/MediaWindow'
import Playlist from './components/Playlist'
import {
  addMedia,
  deleteMedia,
  getMedia,
  getPlaylist,
  getSync,
  getWindows,
  syncMedia
} from './services/api'
import './styles.css'

const FIVE_HOURS = 5 * 60 * 60

export default function App() {
  const [windows, setWindows] = useState([])
  const [playlists, setPlaylists] = useState({})
  const [media, setMedia] = useState([])
  const [selectedMedia, setSelectedMedia] = useState(null)
  const [sync, setSync] = useState(null)
  const [cycleStart] = useState(Date.now())
  const [error, setError] = useState('')
  const [lastRefresh, setLastRefresh] = useState(Date.now())

  const load = useCallback(async () => {
    try {
      const [ws, ms] = await Promise.all([
        getWindows(),
        getMedia()
      ])

      setWindows(ws)
      setMedia(ms)

      const entries = await Promise.all(
        ws.map(async w => [
          w.id,
          await getPlaylist(w.id)
        ])
      )

      setPlaylists(Object.fromEntries(entries))

      const currentSync = await getSync()

      setSync(currentSync?.active ? currentSync : null)
      setError('')
      setLastRefresh(Date.now())

    } catch (e) {
      setError(
        e?.response?.data?.error ||
        e.message ||
        'Unable to connect to backend'
      )
    }
  }, [])

  useEffect(() => {
    load()

    const id = setInterval(load, 4000)

    return () => clearInterval(id)
  }, [load])

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const currentSync = await getSync()

        setSync(
          currentSync?.active ? currentSync : null
        )
      } catch {}
    }, 500)

    return () => clearInterval(id)
  }, [])

  const elapsed =
    ((Date.now() - cycleStart) / 1000) % FIVE_HOURS

  async function handleAdd(windowId, mediaId) {
    await addMedia(windowId, mediaId)
    await load()
  }

  async function handleDelete(windowId, mediaId) {
    await deleteMedia(windowId, mediaId)
    await load()
  }

  async function handleSync() {
    if (!selectedMedia) return

    try {
      const state = await syncMedia(selectedMedia)
      setSync(state)
    } catch (e) {
      setError(
        e?.response?.data?.error || e.message
      )
    }
  }

  const selectedName = useMemo(
    () =>
      media.find(
        m => m.id === selectedMedia
      )?.name,
    [media, selectedMedia]
  )

  return (
    <main>

      {/* Header */}
      <header className="header">

        <div className="brand">

          <div className="logo">
            M
          </div>

          <div>
            <div className="eyebrow">
              FULL-STACK ASSIGNMENT
            </div>

            <h1>
              Multi-Window Media Sequencer
            </h1>
          </div>

        </div>

        <div className="header-right">
          <span className="live-dot"></span>
          <span>
            5-HOUR CONTINUOUS CYCLE
          </span>
        </div>

      </header>

      {/* Error */}
      {error && (
        <div className="error">
          Backend connection error: {error}
        </div>
      )}

      {/* Global Control */}
      <section className="control-bar">

        <div>

          <span className="eyebrow">
            GLOBAL CONTROL
          </span>

          <h2>
            {selectedName
              ? `Selected: ${selectedName}`
              : 'Select a playlist item to sync'}
          </h2>

        </div>

        <div className="control-actions">

          <button
            className="sync-button"
            disabled={!selectedMedia}
            onClick={handleSync}
          >
            ⇄ Sync Selected Media
          </button>

          <button
            className="refresh-button"
            onClick={load}
          >
            Refresh
          </button>

        </div>

      </section>

      {/* Display Windows */}
      <section className="window-grid">

        {windows.map(w => (
          <MediaWindow
            key={w.id}
            windowData={w}
            playlist={playlists[w.id] || []}
            elapsedSeconds={elapsed}
            sync={sync}
          />
        ))}

      </section>

      {/* Playlists */}
      <section className="playlist-grid">

        {windows.map(w => (
          <Playlist
            key={w.id}
            windowData={w}
            playlist={playlists[w.id] || []}
            media={media}
            onAdd={handleAdd}
            onDelete={handleDelete}
            selectedMedia={selectedMedia}
            setSelectedMedia={setSelectedMedia}
          />
        ))}

      </section>

      {/* Footer */}
      <footer>

        <span>
          Backend: Golang • Storage: SQLite • Frontend: React
        </span>

        <span>
          Last refresh: {new Date(lastRefresh).toLocaleTimeString()}
        </span>

      </footer>

    </main>
  )
}