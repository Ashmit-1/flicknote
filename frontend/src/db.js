import localforage from 'localforage'

const store = localforage.createInstance({
  name: 'flicknote',
  storeName: 'flicknote_data',
})

const authKey = 'auth'
const tasksKey = (u) => `tasks:${u}`
const lastSyncAtKey = (u) => `lastSyncAt:${u}`

export async function getAuth() {
  return store.getItem(authKey)
}

export async function setAuth(auth) {
  return store.setItem(authKey, auth)
}

export async function clearAuth() {
  return store.removeItem(authKey)
}

export async function getTasks(username) {
  const tasks = await store.getItem(tasksKey(username))
  return Array.isArray(tasks) ? tasks : []
}

export async function setTasks(username, tasks) {
  return store.setItem(tasksKey(username), tasks)
}

export async function getLastSyncAt(username) {
  return store.getItem(lastSyncAtKey(username))
}

export async function setLastSyncAt(username, iso) {
  return store.setItem(lastSyncAtKey(username), iso)
}
