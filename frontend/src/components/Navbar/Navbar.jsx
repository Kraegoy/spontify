import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    window.location.href = '/'
  }

  const goTo = (path) => {
    navigate(path)
    setMenuOpen(false)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    goTo(`/search?q=${encodeURIComponent(query.trim())}`)
    setQuery('')
  }

  return (
    <nav className="navbar">
      <div className="navbar-logo" onClick={() => goTo('/dashboard')}>
        <img className="logo-icon" src="/spontify logo.png" alt="Spontify" />
        <div className="logo-text">sponti<span>fy</span></div>
      </div>

      <div className="navbar-links">
        <button className="nav-btn" onClick={() => goTo('/dashboard')}>Dashboard</button>
        <button className="nav-btn" onClick={() => goTo('/top_artists/medium_term')}>Top Artists</button>
        <button className="nav-btn" onClick={() => goTo('/my_playlists')}>Playlist</button>
      </div>

      <form className="search-form" onSubmit={handleSearch}>
        <input
          className="search-input"
          type="text"
          placeholder="Search..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </form>

      <button className="logout-btn desktop-only" onClick={handleLogout}>Log out</button>

      {/* Hamburger */}
      <button className="hamburger" onClick={() => setMenuOpen(p => !p)} aria-label="Menu">
        <span className={`bar ${menuOpen ? 'open' : ''}`} />
        <span className={`bar ${menuOpen ? 'open' : ''}`} />
        <span className={`bar ${menuOpen ? 'open' : ''}`} />
      </button>

      {/* Mobile dropdown */}
      <div className={`mobile-menu ${menuOpen ? 'mobile-menu--open' : ''}`}>
        <form className="search-form mobile-search" onSubmit={handleSearch}>
          <input
            className="search-input"
            type="text"
            placeholder="Search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </form>
        <button className="mobile-nav-btn" onClick={() => goTo('/dashboard')}>Dashboard</button>
        <button className="mobile-nav-btn" onClick={() => goTo('/top_artists/medium_term')}>Top Artists</button>
        <button className="mobile-nav-btn" onClick={() => goTo('/my_playlists')}>Playlist</button>
        <button className="mobile-nav-btn logout" onClick={handleLogout}>Log out</button>
      </div>
    </nav>
  )
}

export default Navbar