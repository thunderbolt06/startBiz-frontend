import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  buildNarrationIndex,
  computeSlideTimestamps,
  fuzzyMatchTitle,
} from '../lib/slideTimestamps'

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316']
const SLIDE_DURATION_MS = 8000

function SlideChart({ chartData }) {
  if (!chartData) return null

  const { type, labels, datasets, title } = chartData
  if (!datasets?.length) return null

  const rechartData = labels.map((label, i) => {
    const point = { name: label }
    datasets.forEach(ds => { point[ds.label] = ds.data[i] })
    return point
  })

  const seriesKeys = datasets.map(ds => ds.label)

  return (
    <div className="w-full">
      {title && <p className="text-sm text-slate-400 text-center mb-3">{title}</p>}
      <ResponsiveContainer width="100%" height={260}>
        {type === 'pie' || type === 'doughnut' ? (
          <PieChart>
            <Pie
              data={rechartData}
              dataKey={seriesKeys[0]}
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={type === 'doughnut' ? 100 : 110}
              innerRadius={type === 'doughnut' ? 55 : 0}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {rechartData.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8 }}
              labelStyle={{ color: '#E2E8F0' }}
            />
          </PieChart>
        ) : type === 'line' ? (
          <LineChart data={rechartData}>
            <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 12 }} />
            <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8 }}
              labelStyle={{ color: '#E2E8F0' }}
            />
            <Legend />
            {seriesKeys.map((key, i) => (
              <Line key={key} type="monotone" dataKey={key} stroke={CHART_COLORS[i]} strokeWidth={2} dot={{ r: 4 }} />
            ))}
          </LineChart>
        ) : (
          <BarChart data={rechartData}>
            <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 12 }} />
            <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8 }}
              labelStyle={{ color: '#E2E8F0' }}
            />
            <Legend />
            {seriesKeys.map((key, i) => (
              <Bar key={key} dataKey={key} fill={CHART_COLORS[i]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

function SlideContent({ content }) {
  if (!content) return null
  const lines = content.split('\n').filter(l => l.trim())
  if (lines.length <= 1) {
    return <p className="text-slate-300 text-lg leading-relaxed">{content}</p>
  }
  return (
    <ul className="space-y-3">
      {lines.map((line, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 mt-2.5" />
          <span className="text-slate-300 text-base leading-relaxed">{line.replace(/^[•\-*]\s*/, '')}</span>
        </li>
      ))}
    </ul>
  )
}

function Slide({ slide }) {
  const { type, title, content, chart_data } = slide

  if (type === 'title') {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8"
        style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 60%, #0F172A 100%)' }}>
        <h1 className="text-4xl md:text-5xl font-black text-blue-400 mb-6 leading-tight">{title}</h1>
        <div className="text-slate-400 text-xl max-w-lg">
          <SlideContent content={content} />
        </div>
        <div className="mt-8 w-24 h-1 bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full" />
      </div>
    )
  }

  if (type === 'chart') {
    return (
      <div className="h-full flex flex-col p-8 bg-[#111827]">
        <h2 className="text-2xl font-bold text-blue-400 mb-6">{title}</h2>
        <div className="flex-1">
          <SlideChart chartData={chart_data} />
        </div>
      </div>
    )
  }

  if (type === 'split') {
    return (
      <div className="h-full flex flex-col p-8 bg-[#111827]">
        <h2 className="text-2xl font-bold text-blue-400 mb-6">{title}</h2>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div><SlideContent content={content} /></div>
          <div><SlideChart chartData={chart_data} /></div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-8 bg-[#0F172A]">
      <h2 className="text-2xl font-bold text-blue-400 mb-6">{title}</h2>
      <div className="flex-1">
        <SlideContent content={content} />
      </div>
    </div>
  )
}

export default function PitchDeck({ slides, audioUrl }) {
  const [current, setCurrent] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [slideTimestamps, setSlideTimestamps] = useState(null)
  // Fallback ticker for when there's no audio
  const [fallbackElapsed, setFallbackElapsed] = useState(0)

  const audioRef = useRef(null)
  const narrationIndexRef = useRef(null)
  const fallbackIntervalRef = useRef(null)
  // Mirror slideTimestamps in a ref so navigation callbacks always have the latest
  // value without stale closure issues, independent of React's render cycle.
  const slideTimestampsRef = useRef(null)
  // Track whether the current-slide change came from audio sync (to avoid feedback loop)
  const audioSyncingRef = useRef(false)
  // Mirror current slide in a ref so the keyboard handler is always up-to-date
  const currentRef = useRef(0)

  const total = slides.length

  // Build narration index once
  useEffect(() => {
    narrationIndexRef.current = buildNarrationIndex(slides)
  }, [slides])

  // ── Audio event listeners ──────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return

    const onMetadata = () => {
      const dur = audio.duration
      setDuration(dur)
      if (narrationIndexRef.current) {
        const ts = computeSlideTimestamps(slides, dur)
        slideTimestampsRef.current = ts
        setSlideTimestamps(ts)
        // If user navigated before metadata loaded, seek to the correct position now
        const idx = currentRef.current
        if (idx > 0 && ts[idx]) {
          audio.currentTime = ts[idx].start
          setCurrentTime(ts[idx].start)
        }
      }
    }

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const onEnded = () => {
      setPlaying(false)
      setCurrentTime(audio.duration)
    }

    audio.addEventListener('loadedmetadata', onMetadata)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('ended', onEnded)

    // If metadata already available (e.g. cached)
    if (audio.readyState >= 1 && audio.duration) {
      onMetadata()
    }

    return () => {
      audio.removeEventListener('loadedmetadata', onMetadata)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('ended', onEnded)
    }
  }, [audioUrl, slides])

  // ── Audio-driven slide advance ─────────────────────────────────────────────
  useEffect(() => {
    if (!slideTimestamps || !audioUrl) return

    const ts = slideTimestamps[current]
    if (!ts) return

    // Determine next slide index to advance to
    let target = -1

    if (currentTime >= ts.end && current < total - 1) {
      // Time boundary crossed — use fuzzy match to double-check or just advance
      const nextIdx = current + 1
      const nextTitle = slides[nextIdx]?.title || ''
      const { fullScript } = narrationIndexRef.current || {}

      if (fullScript && nextTitle) {
        const windowStart = Math.max(0, Math.floor((ts.end / duration) * fullScript.length) - 80)
        const windowEnd = Math.min(fullScript.length, windowStart + 200)
        const textWindow = fullScript.slice(windowStart, windowEnd)
        if (fuzzyMatchTitle(nextTitle, textWindow) || currentTime >= ts.end + 0.5) {
          target = nextIdx
        }
      } else {
        target = nextIdx
      }
    }

    if (target !== -1 && target !== current) {
      audioSyncingRef.current = true
      currentRef.current = target
      setCurrent(target)
    }
  }, [currentTime, current, slideTimestamps, slides, total, duration, audioUrl])

  // ── Fallback ticker (no audio) ─────────────────────────────────────────────
  useEffect(() => {
    if (audioUrl || !playing) {
      clearInterval(fallbackIntervalRef.current)
      return
    }

    fallbackIntervalRef.current = setInterval(() => {
      setFallbackElapsed(e => {
        if (e + 100 >= SLIDE_DURATION_MS) {
          setCurrent(c => {
            const next = Math.min(total - 1, c + 1)
            currentRef.current = next
            if (next === total - 1) {
              setPlaying(false)
              clearInterval(fallbackIntervalRef.current)
            }
            return next
          })
          return 0
        }
        return e + 100
      })
    }, 100)

    return () => clearInterval(fallbackIntervalRef.current)
  }, [audioUrl, playing, total])

  // Reset fallback elapsed when slide changes (skip for audio-driven changes)
  useEffect(() => {
    if (!audioSyncingRef.current) {
      setFallbackElapsed(0)
    }
    audioSyncingRef.current = false
  }, [current])

  // ── Core navigation: seek audio then update slide ──────────────────────────
  // Uses refs so it is always fresh — safe to call from event handlers and
  // useEffect callbacks without stale-closure concerns.
  function goToSlide(idx) {
    const clamped = Math.max(0, Math.min(total - 1, idx))
    // Seek audio synchronously via ref (no stale closure)
    const audio = audioRef.current
    const ts = slideTimestampsRef.current
    if (audio && ts && ts[clamped]) {
      audio.currentTime = ts[clamped].start
      setCurrentTime(ts[clamped].start)
    }
    setFallbackElapsed(0)
    currentRef.current = clamped
    setCurrent(clamped)
  }

  function prev() { goToSlide(currentRef.current - 1) }
  function next() { goToSlide(currentRef.current + 1) }

  // ── Keyboard navigation ────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goToSlide(currentRef.current + 1)
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goToSlide(currentRef.current - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function togglePlay() {
    if (audioUrl) {
      const audio = audioRef.current
      if (!audio) return
      if (playing) {
        audio.pause()
        setPlaying(false)
      } else {
        audio.play()
        setPlaying(true)
      }
    } else {
      setPlaying(p => !p)
    }
  }

  // ── Loader bar progress ────────────────────────────────────────────────────
  let loaderPercent = 0
  if (audioUrl && slideTimestamps) {
    const ts = slideTimestamps[current]
    if (ts && ts.end > ts.start) {
      loaderPercent = Math.min(100, Math.max(0,
        ((currentTime - ts.start) / (ts.end - ts.start)) * 100
      ))
    }
  } else if (!audioUrl && playing) {
    loaderPercent = Math.min(100, (fallbackElapsed / SLIDE_DURATION_MS) * 100)
  }

  if (!slides?.length) return null

  return (
    <div className="w-full">
      {/* Hidden audio element */}
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
      )}

      {/* Slide viewport */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-[#334155]"
        style={{ paddingBottom: '56.25%' }}>
        <div className="absolute inset-0">
          <Slide slide={slides[current]} />
        </div>

        {/* Loader bar — bottom edge of slide */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1E293B]/60">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full"
            style={{
              width: `${loaderPercent}%`,
              transition: playing ? 'width 0.3s linear' : 'none',
            }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-4 px-1">
        <button
          onClick={prev}
          disabled={current === 0}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-[#1E293B] px-4 py-2 rounded-xl border border-[#334155]"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        {/* Centre: dots + play button */}
        <div className="flex items-center gap-3">
          {/* Dot indicators */}
          <div className="flex gap-1.5 items-center">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                className={`rounded-full transition-all ${
                  i === current ? 'w-6 h-2 bg-blue-400' : 'w-2 h-2 bg-slate-600 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>

          {/* Play / Pause button */}
          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center transition-colors shadow-lg shadow-blue-900/40 ml-1"
            title={playing ? 'Pause' : 'Play presentation'}
          >
            {playing
              ? <Pause size={15} className="text-white" />
              : <Play size={15} className="text-white ml-0.5" />
            }
          </button>
        </div>

        <button
          onClick={next}
          disabled={current === total - 1}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-[#1E293B] px-4 py-2 rounded-xl border border-[#334155]"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Slide counter */}
      <p className="text-center text-xs text-slate-600 mt-2">
        {current + 1} of {total} · Use ← → arrow keys to navigate
      </p>
    </div>
  )
}
