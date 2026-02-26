import API_BASE_URL from '../../config'
import '../../index.css'
import './Login.css'

function Login() {
  const handleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/spotify/login/`
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

        <p className="login-disclaimer">
          We only read your Spotify data. We never post on your behalf.
        </p>

      </div>
    </div>
  )
}

export default Login