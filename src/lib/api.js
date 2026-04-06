import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
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
  return new EventSource(`${BASE_URL}/api/sessions/${sessionId}/stream/`)
}
