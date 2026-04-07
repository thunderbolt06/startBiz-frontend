/**
 * Builds the narration script from slides in the same order the backend uses,
 * and records per-slide character offsets so we can map audio time → text position.
 *
 * Backend reference: _build_narration_script in pitch_generator.py
 *   parts.append(f"{title}. {notes}")
 *   "  ".join(parts)
 */
export function buildNarrationIndex(slides) {
  const segments = []
  const parts = []

  for (let i = 0; i < slides.length; i++) {
    const { title = '', speaker_notes: notes = '' } = slides[i]
    if (!notes) {
      segments.push({ slideIndex: i, start: -1, end: -1, text: '' })
      continue
    }
    const segment = `${title}. ${notes}`
    const start = parts.reduce((acc, p) => acc + p.length + 2, 0) // +2 for "  " separator
    parts.push(segment)
    segments.push({ slideIndex: i, start, end: start + segment.length, text: segment })
  }

  const fullScript = parts.join('  ')
  return { fullScript, segments }
}

/**
 * Computes per-slide {start, end} timestamps (in seconds) proportionally
 * from word counts in speaker_notes, given the total audio duration.
 *
 * Slides without speaker_notes get a minimum 2-second allocation.
 */
export function computeSlideTimestamps(slides, totalDuration) {
  const MIN_SECONDS = 2
  const wordCounts = slides.map(slide => {
    const notes = slide.speaker_notes || ''
    return notes.trim() ? notes.trim().split(/\s+/).length : 0
  })

  const totalWords = wordCounts.reduce((a, b) => a + b, 0)
  // Reserve minimum time for empty slides
  const emptyCount = wordCounts.filter(w => w === 0).length
  const reservedTime = emptyCount * MIN_SECONDS
  const speakingTime = Math.max(0, totalDuration - reservedTime)

  const durations = wordCounts.map(words => {
    if (words === 0) return MIN_SECONDS
    return totalWords > 0 ? (words / totalWords) * speakingTime : speakingTime / slides.length
  })

  const timestamps = []
  let cursor = 0
  for (const dur of durations) {
    timestamps.push({ start: cursor, end: cursor + dur })
    cursor += dur
  }
  return timestamps
}

/**
 * Fuzzy-matches a slide title against a window of narration text.
 * Returns true if ≥2 meaningful words from the title appear (case-insensitive)
 * within the given text window.
 */
export function fuzzyMatchTitle(title, narrationWindow) {
  if (!title || !narrationWindow) return false
  const STOP_WORDS = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'was', 'were'])
  const titleWords = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))

  if (titleWords.length === 0) return false

  const windowLower = narrationWindow.toLowerCase()
  const matchCount = titleWords.filter(w => windowLower.includes(w)).length
  return matchCount >= Math.min(2, titleWords.length)
}
