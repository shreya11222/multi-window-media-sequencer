import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000
})

export async function getWindows() {
  return (await api.get('/windows')).data
}

export async function getPlaylist(windowId) {
  return (await api.get(`/windows/${windowId}/playlist`)).data
}

export async function getMedia() {
  return (await api.get('/media')).data
}

export async function addMedia(windowId, mediaId) {
  return (await api.post(`/windows/${windowId}/media`, { mediaId })).data
}

export async function deleteMedia(windowId, mediaId) {
  return (await api.delete(`/windows/${windowId}/media/${mediaId}`)).data
}

export async function syncMedia(mediaId) {
  return (await api.post('/sync', { mediaId })).data
}

export async function getSync() {
  return (await api.get('/sync')).data
}
