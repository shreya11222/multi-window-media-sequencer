export default function Playlist({ windowData, playlist, media, onAdd, onDelete, selectedMedia, setSelectedMedia }) {
  return (
    <section className="playlist-card">
      <div className="playlist-heading">
        <div>
          <span className="eyebrow">PLAYLIST</span>
          <h3>{windowData.name}</h3>
        </div>
        <span className="count">{playlist.length} items</span>
      </div>

      <div className="items">
        {playlist.length === 0 && <div className="empty-list">No media assigned.</div>}
        {playlist.map((item, index) => (
          <button
            key={item.id}
            className={`playlist-item ${selectedMedia === item.mediaId ? 'selected' : ''}`}
            onClick={() => setSelectedMedia(item.mediaId)}
          >
            <span className="number">{index + 1}</span>
            <span className="item-info">
              <strong>{item.media?.name}</strong>
              <small>
  {item.media?.type === "video" ? "🎬 Video" : "🖼 Image"} • {item.duration}s
</small>
            </span>
            <span className="select-dot">{selectedMedia === item.mediaId ? '✓' : ''}</span>
            <span
              className="delete"
              title="Remove from playlist"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(windowData.id, item.mediaId)
              }}
            >×</span>
          </button>
        ))}
      </div>

      <div className="add-row">
        <select id={`select-${windowData.id}`} defaultValue="">
          <option value="" disabled>Add media...</option>
          {media.map(m => (
            <option key={m.id} value={m.id}>{m.name} ({m.type})</option>
          ))}
        </select>
        <button
          className="small-btn"
          onClick={() => {
            const value = document.getElementById(`select-${windowData.id}`).value
            if (value) onAdd(windowData.id, Number(value))
          }}
        >
          Add
        </button>
      </div>
    </section>
  )
}
