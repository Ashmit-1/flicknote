import { useCallback, useEffect, useRef, useState } from 'react'

import { syncApi } from '../api'
import { getLastSyncAt, getTasks, setLastSyncAt, setTasks } from '../db'
import { mergeTasks, nowIso, ts } from '../utils'

export function useTasks(auth) {
  const [tasks, setTasksState] = useState([])
  const [lastSyncAt, setLastSyncAtState] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState(null)

  const username = auth?.username
  const persistTasks = useCallback(
    async (next) => {
      if (!username) return
      await setTasks(username, next)
      setTasksState(next)
    },
    [username],
  )

  const persistLastSync = useCallback(
    async (iso) => {
      if (!username) return
      await setLastSyncAt(username, iso)
      setLastSyncAtState(iso)
    },
    [username],
  )

  useEffect(() => {
    if (!username) {
      setTasksState([])
      setLastSyncAtState(null)
      setLoaded(false)
      return
    }
    let active = true
    Promise.all([getTasks(username), getLastSyncAt(username)]).then(([t, s]) => {
      if (active) {
        setTasksState(t)
        setLastSyncAtState(s)
        setLoaded(true)
      }
    })
    return () => {
      active = false
    }
  }, [username])

  const addTask = useCallback(
    async (name, tag) => {
      const now = nowIso()
      const task = {
        id: crypto.randomUUID(),
        name: name.trim(),
        tag: tag.trim(),
        completed: false,
        created_at: now,
        updated_at: now,
        completed_at: null,
        deleted_at: null,
      }
      await persistTasks([...tasksRef.current, task])
    },
    [persistTasks],
  )

  const updateTask = useCallback(
    async (id, patch) => {
      const now = nowIso()
      const next = tasksRef.current.map((t) => {
        if (t.id !== id) return t
        let completed_at = t.completed_at ?? null
        if ('completed' in patch) {
          completed_at = patch.completed ? (t.completed_at ?? now) : null
        }
        return { ...t, ...patch, completed_at, updated_at: now }
      })
      await persistTasks(next)
    },
    [persistTasks],
  )

  const deleteTask = useCallback(
    async (id) => {
      const now = nowIso()
      const next = tasksRef.current.map((t) =>
        t.id === id ? { ...t, deleted_at: now, updated_at: now } : t,
      )
      await persistTasks(next)
    },
    [persistTasks],
  )

  const applySyncResult = useCallback(
    async (remoteTasks, serverTime) => {
      const merged = mergeTasks(tasksRef.current, remoteTasks).filter(
        (t) => !(t.deleted_at && ts(t.deleted_at) <= ts(serverTime)),
      )
      await persistTasks(merged)
      await persistLastSync(serverTime)
    },
    [persistTasks, persistLastSync],
  )

  const runSync = useCallback(
    async (token) => {
      if (!username) return
      setSyncing(true)
      setSyncError(null)
      try {
        const local = tasksRef.current
        const upserts = local.filter(
          (t) => !lastSyncAtRef.current || ts(t.updated_at) > ts(lastSyncAtRef.current),
        )
        const payload = { last_sync_at: lastSyncAtRef.current, upserts, deletes: [] }
        const res = await syncApi.sync(token, payload)
        await applySyncResult(res.tasks, res.server_time)
        return res.server_time
      } catch (e) {
        setSyncError(e.message)
        throw e
      } finally {
        setSyncing(false)
      }
    },
    [applySyncResult, username],
  )

  const tasksRef = useRef(tasks)
  tasksRef.current = tasks
  const lastSyncAtRef = useRef(lastSyncAt)
  lastSyncAtRef.current = lastSyncAt

  const pendingChanges = loaded
    ? tasks.some((t) => (lastSyncAt ? ts(t.updated_at) > ts(lastSyncAt) : !t.deleted_at))
    : false

  return {
    tasks,
    lastSyncAt,
    loaded,
    syncing,
    syncError,
    pendingChanges,
    addTask,
    updateTask,
    deleteTask,
    applySyncResult,
    runSync,
  }
}
