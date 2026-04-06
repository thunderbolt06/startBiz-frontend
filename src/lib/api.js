import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

export async function createSession(prompt, extraData = {}) {
  const { data } = await api.post('/sessions/', { prompt, extra_data: extraData })
  return data
}

export async function validateSession(sessionId) {
  const { data } = await api.post(`/sessions/${sessionId}/validate/`)
  return data
}

export async function startResearch(sessionId, prompt = null) {
  const body = prompt ? { prompt } : {}
  const { data } = await api.post(`/sessions/${sessionId}/research/`, body)
  return data
}

export async function getSession(sessionId) {
  const { data } = await api.get(`/sessions/${sessionId}/`)
  return data
}

export async function getResults(sessionId) {
  const { data } = await api.get(`/sessions/${sessionId}/results/`)
  return data
}

export function createSSEStream(sessionId) {
  return new EventSource(`/api/sessions/${sessionId}/stream/`)
}
