import { useEffect, useState } from 'react'
import { getMyPlaylists } from '../../api'
import Navbar from '../../components/Navbar/Navbar'
import './MyPlaylists.css'
import '../../index.css'


function PlaylistCard({ playlist }) {
  const image = playlist.images?.[0]?.url

  return (
    <div className="playlist-card">
      <div className="playlist-card__img-wrap">
        {image ? (
          <img className="playlist-card__img" src={image} alt={playlist.name} />
        ) : (
          <div className="playlist-card__img-placeholder">🎵</div>
        )}
        <div className="playlist-card__overlay">
          <a
            href={playlist.external_urls?.spotify}
            target="_blank"
            rel="noreferrer"
            className="playlist-card__play"
          >
            ▶
          </a>
        </div>
      </div>
      <div className="playlist-card__info">
        <div className="playlist-card__name">{playlist.name}</div>
        <div className="playlist-card__meta">
          <span className={`playlist-card__badge ${playlist.public ? 'public' : 'private'}`}>
            {playlist.public ? 'Public' : 'Private'}
          </span>
          <span className="playlist-card__tracks">
            {playlist.tracks?.total} tracks
          </span>
        </div>
      </div>
    </div>
  )
}

function MyPlaylists() {
  const [playlists, setPlaylists] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getMyPlaylists()
      .then((res) => setPlaylists(res.data))
      .catch(err => console.log("error", err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="playlists-bg">
      <Navbar />
      <div className="playlists-section">
        <div className="playlists-grid">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="playlist-card playlist-card--skeleton" />
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="playlists-bg">
      <Navbar />
      <div className="playlists-section">
        <div className="playlists-header">
          <span className="playlists-title">Your Playlists</span>
          <span className="playlists-count">{playlists?.total} playlists</span>
        </div>
        <div className="playlists-grid">
          {playlists?.items?.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default MyPlaylists