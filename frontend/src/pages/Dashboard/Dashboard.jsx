import { useEffect, useState } from 'react'
import { useNavigate, useParams  } from 'react-router-dom'
import { getTopTracks, getMe, logoutUser, playTrack } from '../../api'
import './Dashboard.css'
import Navbar from '../../components/Navbar/Navbar'
import '../../index.css'

function msToTime(ms) {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function Dashboard() {
  const navigate = useNavigate()
  const { timeRange } = useParams()

  const range = timeRange || "medium_term" 

  const [tracks, setTracks]   = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([getTopTracks(range), getMe()])
      .then(([tracksRes, meRes, artRes]) => {
        setTracks(tracksRes.data.items || [])
        setProfile(meRes.data)
      })
      .catch(err => console.log('error', err))
      .finally(() => setLoading(false))
  }, [range])

  const handleLogout = () => {
    logoutUser()
    window.location.href = '/'
  }




  return (
    <div className="dashboard-bg">

      {/* ── Navbar ── */}
      <Navbar />

      {/* ── Hero ── */}
      <div className="hero">
        <div className="hero-greeting">Good to see you</div>
        <div className="hero-name">
          {profile ? (
            <>Hello, <span>{profile.display_name?.split(' ')[0]}</span></>
          ) : (
            'Your Dashboard'
          )}
        </div>
        <div className="hero-meta">
          <div className="hero-badge">
            <div className="dot" />
            {profile?.product === 'premium' ? 'Spotify Premium' : 'Spotify Free'}
          </div>
          {profile?.country && (
            <div className="hero-badge">📍 {profile.country}</div>
          )}
        </div>
      </div>

      {/* ── Profile Card ── */}
      {profile && (
        <div className="profile-section">
          <div className="profile-card">
            {profile.images?.[0]?.url ? (
              <img
                className="profile-avatar"
                src={profile.images[0].url}
                alt={profile.display_name}
              />
            ) : (
              <div className="profile-avatar-placeholder">👤</div>
            )}
            <div className="profile-info">
              <div className="profile-label">Profile</div>
              <div className="profile-name">{profile.display_name}</div>
              <div className="profile-email">{profile.email}</div>
              <div className="profile-stats">
                <div className="profile-stat">
                  <div className="profile-stat-value">{profile.followers?.total ?? '—'}</div>
                  <div className="profile-stat-label">Followers</div>
                </div>
                <div className="profile-stat">
                  <div className="profile-stat-value">{tracks.length}</div>
                  <div className="profile-stat-label">Top Tracks</div>
                </div>
                <div className="profile-stat">
                  <div className="profile-stat-value">{tracks.length}</div>
                  <div className="profile-stat-label">Top Artists</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Tracks ── */}

      
      
      <div className="section">
        <div className="section-header">
          <div className="section-title">Your Top Tracks</div>

          {/* optional tabs */}
          <div className="ta-tabs dashboard-tabs">
            <button
              className={range === "short_term" ? "active" : ""}
              onClick={() => navigate("/dashboard/short_term")}
            >
              4 weeks
            </button>
            <button
              className={range === "medium_term" ? "active" : ""}
              onClick={() => navigate("/dashboard/medium_term")}
            >
              6 months
            </button>
            <button
              className={range === "long_term" ? "active" : ""}
              onClick={() => navigate("/dashboard/long_term")}
            >
              all time
            </button>

          </div>
          <div className="section-count">{tracks.length} songs</div>
        </div>

        {loading ? (
          <div>
            {[...Array(10)].map((_, i) => (
              <div key={i} className="skeleton skeleton-track" />
            ))}
          </div>
        ) : (
          <div className="track-list">
            {tracks.map((track, i) => (
              <div className="track-item" key={track.id} onClick={() => playTrack(track.uri)}>
                <div className="track-num">{i + 1}</div>
                <div className="track-play">▶</div>

                {track.album?.images?.[0]?.url ? (
                  <img
                    className="track-img"
                    src={track.album.images[0].url}
                    alt={track.album.name}
                  />
                ) : (
                  <div className="track-img-placeholder">♪</div>
                )}

                <div className="track-info">
                  <div className="track-name">{track.name}</div>
                  <div className="track-artist">
                    {track.artists?.map(a => a.name).join(', ')}
                  </div>
                </div>

                <div className="track-duration">{msToTime(track.duration_ms)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

    

    </div>
  )
}

export default Dashboard