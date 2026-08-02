import { useState } from 'react'

import { CheckSquare } from 'lucide-react'

export default function AuthScreen({ login, register, error }) {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (busy) return
    if (!username.trim() || !password) {
      setLocalError('Please fill in both fields')
      return
    }
    setBusy(true)
    setLocalError('')
    try {
      if (mode === 'login') await login(username, password)
      else await register(username, password)
    } catch (err) {
      setLocalError(err.message || 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">
          <CheckSquare size={40} strokeWidth={1.5} />
        </div>
        <h1>QuickNotes</h1>
        <p className="auth-subtitle">
          {mode === 'login'
            ? 'Sign in to your task list'
            : 'Create an account to get started'}
        </p>

        <form className="auth-form" onSubmit={submit}>
          <label>
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoCapitalize="none"
              autoComplete="username"
              placeholder="your name"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="at least 6 characters"
            />
          </label>

          {(localError || error) && <p className="form-error">{localError || error}</p>}

          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            setMode((m) => (m === 'login' ? 'register' : 'login'))
            setLocalError('')
          }}
        >
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}
