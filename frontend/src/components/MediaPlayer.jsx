import { useEffect, useRef } from "react"

const localVideos = [
  "/videos/demo.mp4",
  "/videos/bunny.mp4",
  "/videos/sintel.mp4"
]

export default function MediaPlayer({ media, videoOffset = 0 }) {
  const videoRef = useRef(null)

  const localVideo =
    localVideos[(Number(media?.id || 1) - 1) % localVideos.length]

  useEffect(() => {
    if (media?.type === "video" && videoRef.current) {
      const video = videoRef.current

      const playVideo = async () => {
        try {
          video.currentTime = Math.max(0, videoOffset)
          await video.play()
        } catch {
          // Browser may block autoplay until user interacts.
        }
      }

      playVideo()
    }
  }, [media?.id, videoOffset])

  if (!media) {
    return (
      <div className="fallback">
        <span>NO MEDIA</span>
        <small>Waiting for playlist data...</small>
      </div>
    )
  }

  if (media.type === "video") {
    return (
      <video
        ref={videoRef}
        className="media"
        src={localVideo}
        muted
        autoPlay
        loop
        playsInline
        controls
      />
    )
  }

  return (
    <img
      className="media"
      src={media.url}
      alt={media.name}
    />
  )
}