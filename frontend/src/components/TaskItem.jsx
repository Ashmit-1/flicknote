import { Check, Pencil, Trash2 } from 'lucide-react'

import { formatDate } from '../utils'

export default function TaskItem({ task, onToggle, onEdit, onDelete }) {
  const created = formatDate(task.created_at)
  const completed = formatDate(task.completed_at)

  return (
    <li className={`task-item ${task.completed ? 'completed' : ''}`}>
      <button
        type="button"
        className={`checkbox ${task.completed ? 'checked' : ''}`}
        onClick={() => onToggle(task.id)}
        aria-label={task.completed ? 'Mark as pending' : 'Mark as completed'}
      >
        <span className="checkbox-circle">{task.completed && <Check size={14} strokeWidth={3} />}</span>
      </button>

      <div className="task-body">
        <span className="task-name">{task.name}</span>
        <div className="task-meta">
          {task.tag && <span className="tag-chip">{task.tag}</span>}
          <span className="task-dates">
            {task.completed && completed
              ? `Created ${created} · Completed ${completed}`
              : `Created ${created}`}
          </span>
        </div>
      </div>

      <div className="task-actions">
        <button type="button" className="icon-btn" onClick={() => onEdit(task)} aria-label="Edit task">
          <Pencil size={18} />
        </button>
        <button
          type="button"
          className="icon-btn danger"
          onClick={() => onDelete(task)}
          aria-label="Delete task"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </li>
  )
}
