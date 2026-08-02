import { useEffect, useMemo, useRef, useState } from 'react'

import { ChevronDown, Cloud, CloudOff, Menu, Plus, RefreshCw, Search } from 'lucide-react'

import AuthScreen from './components/AuthScreen'
import Sidebar from './components/Sidebar'
import TaskForm from './components/TaskForm'
import TaskItem from './components/TaskItem'
import { useAuth } from './hooks/useAuth'
import { useTasks } from './hooks/useTasks'
import { useTheme } from './hooks/useTheme'
import { ts } from './utils'

export default function App() {
  const { auth, loading, error, login, register, logout } = useAuth()

  if (loading) {
    return (
      <div className="center-screen">
        <p>Loading...</p>
      </div>
    )
  }

  if (!auth) {
    return <AuthScreen login={login} register={register} error={error} />
  }

  return <Main auth={auth} logout={logout} />
}

function Main({ auth, logout }) {
  const {
    tasks,
    loaded,
    syncing,
    syncError,
    pendingChanges,
    addTask,
    updateTask,
    deleteTask,
    runSync,
  } = useTasks(auth)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTag, setActiveTag] = useState(null)
  const [sortBy, setSortBy] = useState('date')
  const [query, setQuery] = useState('')
  const [showCompleted, setShowCompleted] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [online, setOnline] = useState(navigator.onLine)
  const autoSyncedRef = useRef(false)
  const { theme, setTheme } = useTheme()

  const isMobile = () => window.matchMedia('(max-width: 899px)').matches

  const handleSelectTag = (tag) => {
    setActiveTag(tag)
    if (isMobile()) setSidebarOpen(false)
  }

  const handleShowAll = () => {
    setActiveTag(null)
    if (isMobile()) setSidebarOpen(false)
  }

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  useEffect(() => {
    if (loaded && online && !autoSyncedRef.current) {
      autoSyncedRef.current = true
      runSync(auth.token).catch(() => {})
    }
  }, [loaded, online, auth.token, runSync])

  const allTags = useMemo(
    () =>
      [...new Set(tasks.filter((t) => !t.deleted_at && t.tag).map((t) => t.tag))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [tasks],
  )

  const tagCounts = useMemo(() => {
    const counts = new Map()
    for (const t of tasks) {
      if (t.deleted_at || !t.tag) continue
      counts.set(t.tag, (counts.get(t.tag) || 0) + 1)
    }
    return [...counts.entries()].map(([tag, count]) => ({ tag, count })).sort((a, b) => a.tag.localeCompare(b.tag))
  }, [tasks])

  const visible = useMemo(() => {
    let list = tasks.filter((t) => !t.deleted_at)
    if (activeTag) list = list.filter((t) => t.tag === activeTag)
    if (query) {
      const q = query.toLowerCase()
      list = list.filter(
        (t) => t.name.toLowerCase().includes(q) || t.tag.toLowerCase().includes(q),
      )
    }
    return list
  }, [tasks, activeTag, query])

  const byDate = (list) => [...list].sort((a, b) => ts(a.created_at) - ts(b.created_at))

  const pending = useMemo(() => byDate(visible.filter((t) => !t.completed)), [visible])
  const completed = useMemo(() => byDate(visible.filter((t) => t.completed)), [visible])

  const groupedPending = useMemo(() => {
    if (sortBy !== 'tag') return null
    const map = new Map()
    for (const t of pending) {
      const key = t.tag || '(untagged)'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(t)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [pending, sortBy])

  const handleToggle = (id) => {
    const task = tasks.find((t) => t.id === id)
    if (task) updateTask(id, { completed: !task.completed })
  }

  const handleDelete = (task) => {
    if (window.confirm(`Delete "${task.name}"?`)) deleteTask(task.id)
  }

  const handleSubmit = ({ name, tag }) => {
    if (editingTask) updateTask(editingTask.id, { name, tag })
    else addTask(name, tag)
  }

  const openAdd = () => {
    setEditingTask(null)
    setFormOpen(true)
  }

  const openEdit = (task) => {
    setEditingTask(task)
    setFormOpen(true)
  }

  const handleSync = () => {
    if (online && !syncing) runSync(auth.token).catch(() => {})
  }

  const syncTitle = syncing
    ? 'Syncing...'
    : !online
      ? 'Offline - connect to sync'
      : pendingChanges
        ? 'Changes pending - tap to sync'
        : 'All synced'

  const tagLabel = activeTag ? `#${activeTag}` : 'All tasks'

  return (
    <div className={`app ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="app-main">
        <header className="topbar">
        <button
          type="button"
          className="icon-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
        <h1 className="topbar-title">{tagLabel}</h1>
        <button
          type="button"
          className={`icon-btn sync-btn ${!online ? 'offline' : ''} ${pendingChanges ? 'pending' : ''}`}
          onClick={handleSync}
          disabled={!online || syncing}
          title={syncTitle}
          aria-label={syncTitle}
        >
          {syncing ? <RefreshCw size={22} className="spin" /> : online ? <Cloud size={22} /> : <CloudOff size={22} />}
          {(pendingChanges || syncError) && <span className="sync-dot" />}
        </button>
      </header>

      <div className="searchbar">
        <Search size={18} className="search-icon" />
        <input
          type="search"
          placeholder="Search tasks or tags"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="toolbar">
        <div className="segmented">
          <button
            type="button"
            className={`seg ${sortBy === 'date' ? 'active' : ''}`}
            onClick={() => setSortBy('date')}
          >
            By date
          </button>
          <button
            type="button"
            className={`seg ${sortBy === 'tag' ? 'active' : ''}`}
            onClick={() => setSortBy('tag')}
          >
            By tag
          </button>
        </div>
        {syncError && <p className="toolbar-error">Sync failed: {syncError}</p>}
      </div>

      <main className="content">
        {visible.length === 0 && (
          <div className="empty-state">
            <p>{query ? 'No matching tasks' : 'No tasks here yet'}</p>
            {!query && (
              <button type="button" className="btn btn-primary" onClick={openAdd}>
                Add your first task
              </button>
            )}
          </div>
        )}

        {visible.length > 0 && (
          <>
            <section className="task-section">
              <h2 className="section-title">
                Pending <span className="count-badge">{pending.length}</span>
              </h2>
              {pending.length === 0 ? (
                <p className="section-empty">Nothing pending</p>
              ) : sortBy === 'tag' ? (
                groupedPending.map(([group, items]) => (
                  <div className="tag-group" key={group}>
                    <h3 className="group-title">{group}</h3>
                    <ul className="task-list">
                      {items.map((t) => (
                        <TaskItem
                          key={t.id}
                          task={t}
                          onToggle={handleToggle}
                          onEdit={openEdit}
                          onDelete={handleDelete}
                        />
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <ul className="task-list">
                  {pending.map((t) => (
                    <TaskItem
                      key={t.id}
                      task={t}
                      onToggle={handleToggle}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </ul>
              )}
            </section>

            <section className="task-section">
              <button
                type="button"
                className="completed-toggle"
                onClick={() => setShowCompleted((s) => !s)}
              >
                <ChevronDown size={20} className={showCompleted ? 'chevron open' : 'chevron'} />
                <span>
                  Completed <span className="count-badge">{completed.length}</span>
                </span>
              </button>
              {showCompleted && (
                <ul className="task-list">
                  {completed.map((t) => (
                    <TaskItem
                      key={t.id}
                      task={t}
                      onToggle={handleToggle}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>

      <button type="button" className="fab" onClick={openAdd} aria-label="Add task">
        <Plus size={28} />
      </button>
      </div>

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        tags={tagCounts}
        activeTag={activeTag}
        onSelectTag={handleSelectTag}
        onShowAll={handleShowAll}
        logout={logout}
        theme={theme}
        onThemeChange={setTheme}
      />

      {formOpen && (
        <TaskForm
          allTags={allTags}
          initial={editingTask}
          onSubmit={handleSubmit}
          onClose={() => setFormOpen(false)}
        />
      )}
    </div>
  )
}
