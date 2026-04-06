import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316']

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
  const { type, title, content, chart_data, needs_image, image_prompt } = slide

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

export default function PitchDeck({ slides }) {
  const [current, setCurrent] = useState(0)
  const total = slides.length

  function prev() { setCurrent(c => Math.max(0, c - 1)) }
  function next() { setCurrent(c => Math.min(total - 1, c + 1)) }

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next()
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!slides?.length) return null

  return (
    <div className="w-full">
      {/* Slide viewport */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-[#334155]"
        style={{ paddingBottom: '56.25%' }}>
        <div className="absolute inset-0">
          <Slide slide={slides[current]} />
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

        {/* Dot indicators */}
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all ${
                i === current ? 'w-6 h-2 bg-blue-400' : 'w-2 h-2 bg-slate-600 hover:bg-slate-400'
              }`}
            />
          ))}
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
