import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Upload, X, ChevronRight, AlertCircle, CheckCircle, Lightbulb, FileText } from 'lucide-react'
import { createSession, validateSession, startResearch } from '../lib/api'

const EXAMPLE_PROMPTS = [
  "I feel that Bandra Mumbai needs more gifting stores. The area has high foot traffic, affluent residents, and is popular with tourists — but I've only seen 3-4 gift shops in the whole neighbourhood.",
  "Chennai needs more co-working spaces. The IT sector is booming with 200k+ professionals but most are concentrated in OMR — I want to open one in Anna Nagar.",
  "There is a gap in the market for premium pet grooming studios in Koramangala, Bangalore. Young tech professionals in the area have high disposable income and own pets."
]

export default function InputPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [prompt, setPrompt] = useState('')
  const [extraFiles, setExtraFiles] = useState([])
  const [extraText, setExtraText] = useState('')
  const [showExtraData, setShowExtraData] = useState(false)

  const [phase, setPhase] = useState('idle') // idle | creating | validating | insufficient | ready
  const [sessionId, setSessionId] = useState(null)
  const [validation, setValidation] = useState(null)
  const [error, setError] = useState('')

  const wordCount = prompt.trim().split(/\s+/).filter(Boolean).length

  function handleFileAdd(e) {
    const files = Array.from(e.target.files)
    setExtraFiles(prev => [...prev, ...files])
    e.target.value = ''
  }

  function removeFile(idx) {
    setExtraFiles(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit() {
    if (!prompt.trim()) return
    setError('')
    setPhase('creating')

    try {
      const extraData = {}
      if (extraText.trim()) {
        extraData.additional_context = extraText.trim()
      }
      if (extraFiles.length > 0) {
        extraData.uploaded_files = extraFiles.map(f => f.name)
      }

      const session = await createSession(prompt, extraData)
      setSessionId(session.id)

      setPhase('validating')
      const result = await validateSession(session.id)
      setValidation(result.validation)

      if (result.validation?.status === 'ok') {
        setPhase('ready')
        await startResearch(session.id)
        navigate(`/research/${session.id}`)
      } else {
        setPhase('insufficient')
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Something went wrong. Please try again.')
      setPhase('idle')
    }
  }

  async function handleProceedAnyway() {
    if (!sessionId) return
    setPhase('ready')
    try {
      await startResearch(sessionId)
      navigate(`/research/${sessionId}`)
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to start research.')
      setPhase('insufficient')
    }
  }

  async function handleRefineAndSubmit() {
    if (!prompt.trim() || !sessionId) return
    setError('')
    setPhase('validating')
    try {
      const result = await validateSession(sessionId)
      setValidation(result.validation)
      if (result.validation?.status === 'ok') {
        setPhase('ready')
        await startResearch(sessionId, prompt)
        navigate(`/research/${sessionId}`)
      } else {
        setPhase('insufficient')
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Validation failed.')
      setPhase('insufficient')
    }
  }

  const isLoading = phase === 'creating' || phase === 'validating' || phase === 'ready'

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#1E3A5F] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg text-white">StartBiz Validator</span>
        </div>
        <span className="text-sm text-slate-500">AI-powered business idea validation</span>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
            <span className="gradient-text">Validate your business idea</span>
            <br />
            <span className="text-white">before you build it</span>
          </h1>
          <p className="text-slate-400 text-lg">
            Describe your prediction. Our AI does deep market research, pulls live data,
            and delivers a thesis + pitch deck in minutes.
          </p>
        </div>

        {/* Main input card */}
        <div className="w-full max-w-3xl space-y-4">
          <div className="glass rounded-2xl p-6 glow">
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              Describe your business idea or prediction
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={`E.g. "${EXAMPLE_PROMPTS[0]}"`}
              disabled={isLoading}
              rows={8}
              className="w-full bg-[#0F172A] border border-[#334155] rounded-xl p-4 text-white placeholder-slate-600 resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-base leading-relaxed transition-colors disabled:opacity-50"
            />
            <div className="flex items-center justify-between mt-2">
              <span className={`text-xs ${wordCount < 20 ? 'text-slate-500' : 'text-emerald-400'}`}>
                {wordCount} words {wordCount < 20 && '— more detail helps'}
              </span>
              <button
                onClick={() => setPrompt(EXAMPLE_PROMPTS[Math.floor(Math.random() * EXAMPLE_PROMPTS.length)])}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                disabled={isLoading}
              >
                Load example
              </button>
            </div>
          </div>

          {/* Additional data toggle */}
          <div className="glass rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowExtraData(p => !p)}
              className="w-full flex items-center justify-between px-6 py-4 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              disabled={isLoading}
            >
              <span className="flex items-center gap-2">
                <FileText size={16} />
                Add additional data or context (optional)
              </span>
              <ChevronRight
                size={16}
                className={`transition-transform ${showExtraData ? 'rotate-90' : ''}`}
              />
            </button>

            {showExtraData && (
              <div className="px-6 pb-6 border-t border-[#334155] pt-4 space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-2">
                    Paste any research, data, or context you already have
                  </label>
                  <textarea
                    value={extraText}
                    onChange={e => setExtraText(e.target.value)}
                    placeholder="Paste CSV data, survey results, competitor notes, market reports..."
                    rows={4}
                    disabled={isLoading}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl p-3 text-white placeholder-slate-600 resize-none focus:outline-none focus:border-blue-500 text-sm transition-colors disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-2">Upload files</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#334155] rounded-xl p-4 text-center cursor-pointer hover:border-blue-500 transition-colors"
                  >
                    <Upload size={20} className="mx-auto text-slate-500 mb-1" />
                    <p className="text-xs text-slate-500">Click to upload PDFs, CSVs, or images</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.csv,.txt,.xlsx,.png,.jpg"
                    onChange={handleFileAdd}
                    className="hidden"
                  />
                  {extraFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {extraFiles.map((f, i) => (
                        <span key={i} className="flex items-center gap-1 bg-[#1E3A5F] text-xs text-blue-200 px-3 py-1 rounded-full">
                          {f.name}
                          <button onClick={() => removeFile(i)} className="hover:text-red-400 transition-colors">
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Validation feedback — insufficient */}
          {phase === 'insufficient' && validation && (
            <div className="glass rounded-2xl p-6 border border-amber-500/30">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-300 mb-1">Your prompt needs a bit more detail</h3>
                  <p className="text-sm text-slate-400">
                    The AI can research this, but adding the following will greatly improve results:
                  </p>
                </div>
              </div>

              {validation.questions?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Questions to consider</p>
                  <ul className="space-y-2">
                    {validation.questions.map((q, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <Lightbulb size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {validation.missing?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Missing information</p>
                  <div className="flex flex-wrap gap-2">
                    {validation.missing.map((m, i) => (
                      <span key={i} className="bg-amber-900/40 text-amber-300 text-xs px-3 py-1 rounded-full border border-amber-700/50">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {validation.suggestion && (
                <div className="bg-[#1E293B] rounded-xl p-3 text-sm text-slate-400 mb-4">
                  {validation.suggestion}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleRefineAndSubmit}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                >
                  Re-validate with updated prompt
                </button>
                <button
                  onClick={handleProceedAnyway}
                  className="px-4 py-2.5 bg-[#1E293B] hover:bg-[#334155] text-slate-300 font-medium rounded-xl transition-colors text-sm border border-[#334155]"
                >
                  Proceed anyway
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-700/30 rounded-xl px-4 py-3">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* CTA */}
          {phase !== 'insufficient' && (
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim() || isLoading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-lg rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-blue-900/40"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {phase === 'creating' && 'Creating session...'}
                  {phase === 'validating' && 'AI is reviewing your prompt...'}
                  {phase === 'ready' && 'Launching research...'}
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Validate this idea
                </>
              )}
            </button>
          )}

          {/* Data sources badge */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="text-xs text-slate-600">Powered by:</span>
            {['Gemini 3.1 Pro', 'Google Places', 'Demographics API', 'Earnings Data', 'ElevenLabs'].map(s => (
              <span key={s} className="text-xs bg-[#1E293B] text-slate-500 px-2.5 py-1 rounded-full border border-[#334155]">
                {s}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
