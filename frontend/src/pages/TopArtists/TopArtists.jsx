import { useEffect, useState } from 'react'
import { getTopArtists, getMe, getArtist } from '../../api'
import './TopArtists.css'
import Navbar from '../../components/Navbar/Navbar'
import { useParams, useNavigate } from "react-router-dom"
import '../../index.css'
import '../../index.css'


function ArtistCard({ artist, rank }) {
  const image = artist.images?.[0]?.url
  const navigate = useNavigate()

  return (
    <div className="artist-card" onClick={() => navigate(`/artist/${artist.id}`)} style={{ cursor: 'pointer' }}>
      <div className="artist-card__rank">#{rank}</div>

      <div className="artist-card__img-wrap">
        {image ? (
          <img
            className="artist-card__img"
            src={image}
            alt={artist.name}
            style={{ objectPosition: 'top' }}
          />
        ) : (
          <div className="artist-card__img-placeholder">🎤</div>
        )}
      </div>

      <div className="artist-card__info">
        <div className="artist-card__name">{artist.name}</div>
        <div className="artist-card__genre">
          {artist.genres?.[0] || 'Artist'}
        </div>
        <div className="artist-card__meta">
          <div className="artist-card__meta-item">
            <span className="artist-card__meta-label">Followers</span>
            <span className="artist-card__meta-value">
              {artist.followers?.total?.toLocaleString() ?? '—'}
            </span>
          </div>
          <div className="artist-card__meta-item">
            <span className="artist-card__meta-label">Popularity</span>
            <div className="artist-card__pop-bar">
              <div
                className="artist-card__pop-fill"
                style={{ width: `${artist.popularity}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TopArtists() {
  const { timeRange } = useParams()
  const navigate = useNavigate()

  const range = timeRange || "medium_term" // default if /top_artists (no param)

  const [artists, setArtists] = useState([])
  const [loading, setLoading] = useState(true)


  useEffect(() => {
    setLoading(true)
    Promise.all([getTopArtists(range)])
      .then(([artRes]) => setArtists(artRes.data.items || []))
      .catch((err) => console.log("error", err))
      .finally(() => setLoading(false))
  }, [range])

  return (
    <>      
      <Navbar />
      <div className="ta-bg">

      
        <div className="ta-section">
          <div className="ta-header">
            <span className="ta-title">Your Top Artists</span>

            {/* optional tabs */}
            <div className="ta-tabs">
              <button
                className={range === "short_term" ? "active" : ""}
                onClick={() => navigate("/top_artists/short_term")}
              >
                4 weeks
              </button>
              <button
                className={range === "medium_term" ? "active" : ""}
                onClick={() => navigate("/top_artists/medium_term")}
              >
                6 months
              </button>
              <button
                className={range === "long_term" ? "active" : ""}
                onClick={() => navigate("/top_artists/long_term")}
              >
                all time
              </button>
            </div>
            <span className="ta-count">{artists.length} artists</span>

          </div>



          {loading ? (
            <div className="ta-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="artist-card artist-card--skeleton" />
              ))}
            </div>
          ) : (
            <div className="ta-grid">
              {artists.map((artist, i) => (
                <ArtistCard key={artist.id} artist={artist} rank={i + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>

  )
}

export default TopArtists