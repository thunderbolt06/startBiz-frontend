import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import {
  Sparkles, Download, FileText, Layers, Volume2,
  ArrowLeft, AlertCircle, Loader, ExternalLink,
  TrendingUp, Users, MapPin, CheckCircle
} from 'lucide-react'
import { getResults } from '../lib/api'
import PitchDeck from '../components/PitchDeck'
import AudioPlayer from '../components/AudioPlayer'

const TABS = [
  { id: 'thesis', label: 'Business Thesis', icon: FileText },
  { id: 'pitch', label: 'Pitch Deck', icon: Layers },
  { id: 'audio', label: 'Audio Narration', icon: Volume2 },
]

function ScoreBadge({ thesis }) {
  const match = thesis?.match(/\*\*Opportunity Score:\s*(\d+)\/10\*\*/)
  if (!match) return null
  const score = parseInt(match[1])
  const color = score >= 7 ? 'text-emerald-400' : score >= 4 ? 'text-amber-400' : 'text-red-400'
  const bg = score >= 7 ? 'bg-emerald-900/30 border-emerald-700/30' : score >= 4 ? 'bg-amber-900/30 border-amber-700/30' : 'bg-red-900/30 border-red-700/30'

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${bg}`}>
      <TrendingUp size={16} className={color} />
      <span className={`font-bold text-lg ${color}`}>{score}/10</span>
      <span className="text-slate-400 text-sm">Opportunity Score</span>
    </div>
  )
}

function RecommendationBadge({ thesis }) {
  if (!thesis) return null
  const goMatch = thesis.match(/\*\*(GO|GO WITH CAUTION|DO NOT GO)\*\*/)
  if (!goMatch) return null

  const rec = goMatch[1]
  const config = {
    'GO': { color: 'text-emerald-400', bg: 'bg-emerald-900/30 border-emerald-700/30', icon: CheckCircle },
    'GO WITH CAUTION': { color: 'text-amber-400', bg: 'bg-amber-900/30 border-amber-700/30', icon: AlertCircle },
    'DO NOT GO': { color: 'text-red-400', bg: 'bg-red-900/30 border-red-700/30', icon: AlertCircle },
  }[rec] || { color: 'text-blue-400', bg: 'bg-blue-900/30 border-blue-700/30', icon: CheckCircle }
  const Icon = config.icon

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${config.bg}`}>
      <Icon size={16} className={config.color} />
      <span className={`font-bold text-sm ${config.color}`}>{rec}</span>
    </div>
  )
}

async function triggerDownload(url, filename) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(objectUrl)
  } catch {
    window.open(url, '_blank')
  }
}

export default function ResultsPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()

  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('thesis')

  useEffect(() => {
    if (!sessionId) return
    getResults(sessionId)
      .then(data => {
        setSession(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err?.response?.data?.error || 'Failed to load results.')
        setLoading(false)
      })
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-center">
          <Loader size={32} className="text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading results...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4">
        <div className="glass rounded-2xl p-8 text-center max-w-md">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Failed to load results</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors">
            Start over
          </button>
        </div>
      </div>
    )
  }

  const { thesis_md, slides_json, pdf_url, audio_url, prompt } = session || {}

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Header */}
      <header className="border-b border-[#1E3A5F] px-6 py-4 sticky top-0 z-50 bg-[#0F172A]/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors flex-shrink-0"
            >
              <ArrowLeft size={16} />
              New idea
            </button>
            <div className="h-4 w-px bg-[#334155]" />
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center">
                <Sparkles size={12} className="text-white" />
              </div>
              <span className="font-bold text-white text-sm">StartBiz</span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {thesis_md && <ScoreBadge thesis={thesis_md} />}
            {thesis_md && <RecommendationBadge thesis={thesis_md} />}
            {pdf_url && (
              <button
                onClick={() => triggerDownload(pdf_url, 'pitch-deck.pdf')}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                <Download size={14} />
                Download PDF
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Prompt recap */}
        {prompt && (
          <div className="glass rounded-2xl p-5 mb-8 flex items-start gap-3">
            <MapPin size={16} className="text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-semibold">Validated idea</p>
              <p className="text-slate-300 text-sm leading-relaxed line-clamp-3">{prompt}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-[#1E293B] rounded-xl p-1 mb-8 w-fit">
          {TABS.map(tab => {
            const Icon = tab.icon
            const disabled = tab.id === 'audio' && !audio_url
            return (
              <button
                key={tab.id}
                onClick={() => !disabled && setActiveTab(tab.id)}
                disabled={disabled}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : disabled
                    ? 'text-slate-600 cursor-not-allowed'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon size={14} />
                {tab.label}
                {tab.id === 'audio' && !audio_url && (
                  <span className="text-xs bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded">
                    N/A
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Thesis tab */}
        {activeTab === 'thesis' && (
          <div className="grid grid-cols-1 gap-6">
            <div className="glass rounded-2xl p-8">
              <article className="prose prose-invert prose-blue max-w-none
                prose-headings:text-blue-400 prose-headings:font-bold
                prose-h1:text-3xl prose-h2:text-xl prose-h2:mt-8
                prose-p:text-slate-300 prose-p:leading-relaxed
                prose-li:text-slate-300
                prose-strong:text-white
                prose-a:text-blue-400">
                <ReactMarkdown>{thesis_md || '_No thesis available._'}</ReactMarkdown>
              </article>
            </div>
          </div>
        )}

        {/* Pitch deck tab */}
        {activeTab === 'pitch' && (
          <div>
            {slides_json?.length > 0 ? (
              <div className="space-y-6">
                <PitchDeck slides={slides_json} audioUrl={audio_url} />
                {pdf_url && (
                  <div className="flex justify-center">
                    <button
                      onClick={() => triggerDownload(pdf_url, 'pitch-deck.pdf')}
                      className="flex items-center gap-2 bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-slate-300 hover:text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all"
                    >
                      <Download size={15} />
                      Download as PDF
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass rounded-2xl p-12 text-center">
                <Layers size={48} className="text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Pitch deck not available</p>
              </div>
            )}
          </div>
        )}

        {/* Audio tab */}
        {activeTab === 'audio' && audio_url && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="glass rounded-2xl p-6 text-center mb-2">
              <Volume2 size={32} className="text-blue-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-1">Pitch Narration</h3>
              <p className="text-slate-400 text-sm">
                AI-generated audio narration of the pitch deck slides
              </p>
            </div>
            <AudioPlayer src={audio_url} />
            <div className="text-center">
              <button
                onClick={() => triggerDownload(audio_url, 'pitch-narration.mp3')}
                className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Download size={14} />
                Download MP3
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
