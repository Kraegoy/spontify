import { useNavigate } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    window.location.href = '/'
  }

  const goToTopArtists = (timeRange) => {
  navigate(`/top_artists/${timeRange}`)
}

  const goToMyPlaylists = () => {
  navigate(`/my_playlists`)
}

  return (
    <nav className="navbar">

      <div className="navbar-logo" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
        <img className="logo-icon" src="/spontify logo.png" alt="Spontify" />
        <div className="logo-text">sponti<span>fy</span></div>
      </div>

      <div className="navbar-links">
        <button className="nav-btn" onClick={() => navigate('/dashboard')}>Dashboard</button>
        <button className="nav-btn" onClick={() => goToTopArtists('medium_term')}>Top Artists</button>
        <button className="nav-btn" onClick={() => goToMyPlaylists()}>Playlist</button>

      </div>
      <button className="logout-btn" onClick={handleLogout}>Log out</button>
    </nav>
  )
}

export default Navbar