import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react'

export default function AudioPlayer({ src }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onLoadedMetadata = () => setDuration(audio.duration)
    const onEnded = () => setPlaying(false)

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('ended', onEnded)
    }
  }, [src])

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play()
      setPlaying(true)
    }
  }

  function handleSeek(e) {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audio.currentTime = ratio * duration
  }

  function handleVolumeChange(e) {
    const val = parseFloat(e.target.value)
    setVolume(val)
    if (audioRef.current) audioRef.current.volume = val
    setMuted(val === 0)
  }

  function toggleMute() {
    const audio = audioRef.current
    if (!audio) return
    const newMuted = !muted
    setMuted(newMuted)
    audio.muted = newMuted
  }

  function restart() {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = 0
    audio.play()
    setPlaying(true)
  }

  function formatTime(s) {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const progress = duration ? (currentTime / duration) * 100 : 0

  return (
    <div className="glass rounded-2xl p-5">
      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="flex items-center gap-3 mb-4">
        <Volume2 size={16} className="text-blue-400 flex-shrink-0" />
        <span className="text-sm font-semibold text-white">Audio Narration</span>
        <span className="text-xs text-slate-500 ml-auto">{formatTime(duration)}</span>
      </div>

      {/* Waveform-style progress bar */}
      <div
        className="w-full h-2 bg-[#1E293B] rounded-full cursor-pointer mb-4 relative overflow-hidden"
        onClick={handleSeek}
      >
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center gap-3">
        {/* Time */}
        <span className="text-xs text-slate-500 w-10 text-right tabular-nums">
          {formatTime(currentTime)}
        </span>

        {/* Restart */}
        <button
          onClick={restart}
          className="w-8 h-8 rounded-full bg-[#1E293B] hover:bg-[#334155] flex items-center justify-center transition-colors"
        >
          <RotateCcw size={14} className="text-slate-400" />
        </button>

        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center transition-colors shadow-lg shadow-blue-900/40 mx-auto"
        >
          {playing
            ? <Pause size={20} className="text-white" />
            : <Play size={20} className="text-white ml-0.5" />
          }
        </button>

        {/* Mute */}
        <button
          onClick={toggleMute}
          className="w-8 h-8 rounded-full bg-[#1E293B] hover:bg-[#334155] flex items-center justify-center transition-colors"
        >
          {muted ? <VolumeX size={14} className="text-slate-400" /> : <Volume2 size={14} className="text-slate-400" />}
        </button>

        {/* Volume */}
        <input
          type="range"
          min={0} max={1} step={0.05}
          value={muted ? 0 : volume}
          onChange={handleVolumeChange}
          className="w-20 accent-blue-500"
        />
      </div>
    </div>
  )
}
