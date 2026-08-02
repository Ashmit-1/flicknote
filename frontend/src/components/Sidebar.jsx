import { Inbox, LogOut, Monitor, Moon, Sun, Tag as TagIcon, X } from 'lucide-react'

export default function Sidebar({
  open,
  onClose,
  tags,
  activeTag,
  onSelectTag,
  onShowAll,
  logout,
  theme,
  onThemeChange,
}) {
  return (
    <>
      {open && <div className="overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand">
            <img src="/icon.png" alt="FlickNote logo" className="brand-logo" />
            <h2>FlickNote</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close menu">
            <X size={22} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <button
            type="button"
            className={`sidebar-item ${activeTag === null ? 'active' : ''}`}
            onClick={onShowAll}
          >
            <Inbox size={18} />
            <span>All tasks</span>
          </button>

          <p className="sidebar-section-title">Tags</p>
          {tags.length === 0 && <p className="sidebar-empty">No tags yet</p>}
          {tags.map(({ tag, count }) => (
            <button
              key={tag}
              type="button"
              className={`sidebar-item ${activeTag === tag ? 'active' : ''}`}
              onClick={() => onSelectTag(tag)}
            >
              <TagIcon size={18} />
              <span className="sidebar-item-label">{tag}</span>
              <span className="sidebar-count">{count}</span>
            </button>
          ))}

          <p className="sidebar-section-title">Theme</p>
          <div className="theme-toggle" role="group" aria-label="Color theme">
            <button
              type="button"
              className={`theme-option ${theme === 'light' ? 'active' : ''}`}
              onClick={() => onThemeChange('light')}
              aria-label="Light theme"
            >
              <Sun size={18} />
            </button>
            <button
              type="button"
              className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => onThemeChange('dark')}
              aria-label="Dark theme"
            >
              <Moon size={18} />
            </button>
            <button
              type="button"
              className={`theme-option ${theme === 'system' ? 'active' : ''}`}
              onClick={() => onThemeChange('system')}
              aria-label="Follow system theme"
            >
              <Monitor size={18} />
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="sidebar-item" onClick={logout}>
            <LogOut size={18} />
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
