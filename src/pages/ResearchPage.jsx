import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  CheckCircle, Circle, Loader, AlertCircle, Sparkles,
  Search, Database, FileText, Layers, Volume2
} from 'lucide-react'
import { createSSEStream, getSession } from '../lib/api'

const STEPS = [
  { id: 0, label: 'Prompt validated', icon: CheckCircle, status: 'validating' },
  { id: 1, label: 'Planning research strategy', icon: Search, status: 'researching' },
  { id: 2, label: 'Gathering market data', icon: Database, status: 'researching' },
  { id: 3, label: 'Writing business thesis', icon: FileText, status: 'generating_thesis' },
  { id: 4, label: 'Building pitch deck', icon: Layers, status: 'generating_pitch' },
  { id: 5, label: 'Generating audio narration', icon: Volume2, status: 'generating_pitch' },
]

const STATUS_STEP_MAP = {
  pending: -1,
  validating: 0,
  insufficient: 0,
  researching: 2,
  generating_thesis: 3,
  generating_pitch: 4,
  completed: 6,
  failed: -2,
}

const RESEARCH_FACTS = [
  "Analysing competitor density and market saturation...",
  "Fetching population demographics for the area...",
  "Looking up average household income data...",
  "Cross-referencing Google Places data...",
  "Evaluating consumer spending patterns...",
  "Synthesising market opportunity signals...",
  "Assessing risk factors and entry barriers...",
  "Calculating opportunity score...",
]

export default function ResearchPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const sseRef = useRef(null)

  const [currentStatus, setCurrentStatus] = useState('researching')
  const [stepIndex, setStepIndex] = useState(1)
  const [toolPlan, setToolPlan] = useState([])
  const [stepLabel, setStepLabel] = useState('Starting research...')
  const [factIndex, setFactIndex] = useState(0)
  const [error, setError] = useState('')
  const [elapsed, setElapsed] = useState(0)

  // Cycle through research facts
  useEffect(() => {
    const interval = setInterval(() => {
      setFactIndex(i => (i + 1) % RESEARCH_FACTS.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  // Elapsed timer
  useEffect(() => {
    const interval = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  // SSE connection
  useEffect(() => {
    if (!sessionId) return

    const sse = createSSEStream(sessionId)
    sseRef.current = sse

    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.error) {
          setError(data.error)
          sse.close()
          return
        }

        setCurrentStatus(data.status)
        setStepLabel(data.step_label || '')
        setStepIndex(STATUS_STEP_MAP[data.status] ?? 1)

        if (data.tool_plan?.length > 0) {
          setToolPlan(data.tool_plan)
        }

        if (data.status === 'completed') {
          sse.close()
          setTimeout(() => navigate(`/results/${sessionId}`), 800)
        }

        if (data.status === 'failed') {
          setError('Research failed. Please try again.')
          sse.close()
        }
      } catch {}
    }

    sse.onerror = () => {
      setError('Connection lost. The research may still be running in the background.')
      sse.close()
    }

    return () => sse.close()
  }, [sessionId, navigate])

  function formatElapsed(s) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center px-4 py-12">
      {/* Header badge */}
      <div className="flex items-center gap-2 mb-12">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center">
          <Sparkles size={16} className="text-white" />
        </div>
        <span className="font-bold text-white">StartBiz Validator</span>
      </div>

      <div className="w-full max-w-xl">
        {error ? (
          <div className="glass rounded-2xl p-8 text-center">
            <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {/* Main status card */}
            <div className="glass rounded-2xl p-8 mb-6 glow">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-white">Deep Research in Progress</h2>
                <span className="text-sm text-slate-500 bg-[#1E293B] px-3 py-1 rounded-full">
                  {formatElapsed(elapsed)}
                </span>
              </div>

              {/* Steps */}
              <div className="space-y-4">
                {STEPS.map((step, i) => {
                  const isDone = i < stepIndex
                  const isActive = i === stepIndex
                  const isPending = i > stepIndex
                  const Icon = step.icon

                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-500 ${
                        isActive ? 'bg-blue-900/20 border border-blue-700/30' : ''
                      }`}
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                        isDone ? 'bg-emerald-500/20' :
                        isActive ? 'bg-blue-500/20' :
                        'bg-slate-800'
                      }`}>
                        {isDone ? (
                          <CheckCircle size={18} className="text-emerald-400" />
                        ) : isActive ? (
                          <Loader size={18} className="text-blue-400 animate-spin" />
                        ) : (
                          <Circle size={18} className="text-slate-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium transition-colors ${
                          isDone ? 'text-emerald-400' :
                          isActive ? 'text-white' :
                          'text-slate-600'
                        }`}>
                          {step.label}
                        </p>
                        {isActive && (
                          <p className="text-xs text-blue-400 mt-0.5 animate-pulse">
                            {stepLabel || RESEARCH_FACTS[factIndex]}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Progress bar */}
              <div className="mt-8 bg-[#1E293B] rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.max(5, (stepIndex / STEPS.length) * 100)}%` }}
                />
              </div>
            </div>

            {/* Tool plan card */}
            {toolPlan.length > 0 && (
              <div className="glass rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                  Data sources being queried
                </h3>
                <div className="space-y-2">
                  {toolPlan.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        i < stepIndex ? 'bg-emerald-400' : 'bg-blue-400 animate-pulse'
                      }`} />
                      <span className="text-sm text-slate-400">
                        <span className="text-slate-300 font-medium">{item.tool}</span>
                        {item.args?.query && <span> — "{item.args.query}"</span>}
                        {item.args?.location && <span> in {item.args.location}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cycling facts */}
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-600 transition-all duration-500">
                {RESEARCH_FACTS[factIndex]}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
