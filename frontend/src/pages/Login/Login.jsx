import { useState } from 'react'
import API_BASE_URL from '../../config'
import '../../index.css'
import './Login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null) // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('')

  const handleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/spotify/login/`
  }

  const handleRequestAccess = async () => {
    if (!email || !email.includes('@')) {
      setStatus('error')
      setMessage('Please enter a valid email address.')
      return
    }

    setStatus('loading')
    setMessage('')

    try {
      const res = await fetch(`${API_BASE_URL}/request_access/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (res.ok) {
        setStatus('success')
        setMessage("You're on the list! I'll add you as a test user soon.")
        setEmail('')
      } else {
        setStatus('error')
        setMessage(data.error || 'Something went wrong. Try again.')
      }
    } catch {
      setStatus('error')
      setMessage('Network error. Please try again.')
    }
  }

  return (
    <div className="login-root">
      <div className="login-card">

        <div className="login-brand">
          <h1 className="login-title">
            sponti<span className="brand-accent">fy</span>
          </h1>
          <p className="login-sub">
            your music. your stats. your story.
          </p>
        </div>

        <button className="login-btn" onClick={handleLogin}>
          <img
            src="/spotify logo.png"
            alt="Spotify"
            className="login-btn-icon"
          />
          Continue with Spotify
        </button>

        <div className="login-divider">
          <span>or</span>
        </div>

        <div className="login-access-section">
          <p className="login-access-label">
          Spotify requires individual developers to manually add test users (there’s a limit) 🥲 Send your email and I’ll add you!          </p>
          <div className="login-input-row">
            <input
              type="email"
              className="login-email-input"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRequestAccess()}
              disabled={status === 'loading' || status === 'success'}
            />
            <button
              className="login-access-btn"
              onClick={handleRequestAccess}
              disabled={status === 'loading' || status === 'success'}
            >
              {status === 'loading' ? '...' : 'Request'}
            </button>
          </div>
          {message && (
            <p className={`login-access-msg ${status === 'success' ? 'success' : 'error'}`}>
              {message}
            </p>
          )}
        </div>

        <p className="login-disclaimer">
          We only read your Spotify data. We never post on your behalf.
        </p>

      </div>
    </div>
  )
}

export default Login