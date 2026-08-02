import { useState } from 'react'

import { X } from 'lucide-react'

export default function TaskForm({ allTags, initial, onSubmit, onClose }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [tag, setTag] = useState(initial?.tag ?? '')
  const [error, setError] = useState('')

  const isEdit = Boolean(initial)

  const submit = (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Task name is required')
      return
    }
    onSubmit({ name: name.trim(), tag: tag.trim() })
    onClose()
  }

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-header">
          <h3>{isEdit ? 'Edit task' : 'Add task'}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={22} />
          </button>
        </div>
        <form className="task-form" onSubmit={submit}>
          <label>
            Task name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
            />
          </label>
          <label>
            Tag
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="Add or pick a tag"
              list="tag-options"
              autoComplete="off"
            />
            <datalist id="tag-options">
              {allTags.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn-primary">
            {isEdit ? 'Save changes' : 'Add task'}
          </button>
        </form>
      </div>
    </>
  )
}
