  import { useEffect, useState } from 'react'
  import { useNavigate, useParams } from 'react-router-dom'
  import { getTopTracks, getMe, logoutUser, playTrack, getRecentlyPlayedTracks, callNextApiUrl } from '../../api'
  import './Dashboard.css'
  import Navbar from '../../components/Navbar/Navbar'
  import Loading from '../../components/Loading/Loading'
  import '../../index.css'

  function msToTime(ms) {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

function RecentlyPlayedTrackCard({ item }) {
  const track = item?.track
  const image = track?.album?.images?.[0]?.url
  const artist = track?.artists?.map(a => a.name).join(", ")
  const url = track?.external_urls?.spotify
  const playedAt = item?.played_at
    ? new Date(item.played_at).toLocaleString(undefined, {
        month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit'
      })
    : null

  if (!track) return null

  return (
    <a href={url} target="_blank" rel="noreferrer" className="rp-card-link">
      <div className="rp-card">
        <div className="rp-card__img-wrap">
          {image
            ? <img className="rp-card__img" src={image} alt={track.name} />
            : <div className="rp-card__placeholder">🎵</div>
          }
        </div>
        <div className="rp-card__body">
          <div className="rp-card__name" title={track.name}>{track.name}</div>
          <div className="rp-card__artist" title={artist}>{artist}</div>
          {playedAt && <div className="rp-card__played-at">{playedAt}</div>}
        </div>
      </div>
    </a>
  )
}

function Dashboard() {
  const navigate = useNavigate()
  const { timeRange } = useParams()
  const range = timeRange || "medium_term"

  const [tracks, setTracks] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recentlyPlayed, setRecentlyPlayed] = useState([])
  const [nextUrl, setNextUrl] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)

  const loadMoreRecentlyPlayed = async (next_url) => {
    if (!next_url || loadingMore || recentlyPlayed.length >= 50) return
    setLoadingMore(true)
    try {
      const more = await callNextApiUrl(next_url)
      setRecentlyPlayed(prev => [...prev, ...(more.data?.items || [])])
      setNextUrl(more.data?.next || null)
    } catch (err) {
      console.log("error loading more", err)
    } finally {
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([getTopTracks(range), getMe(), getRecentlyPlayedTracks()])
      .then(([tracksRes, meRes, recentlyRes]) => {
        setTracks(tracksRes.data?.items || [])
        setProfile(meRes.data)
        setRecentlyPlayed(recentlyRes.data?.items || [])
        setNextUrl(recentlyRes.data?.next || null)
      })
      .catch(err => console.log("error", err))
      .finally(() => setLoading(false))
  }, [range])

  const profileImg = profile?.images?.[0]?.url

  return (

    <>
      <Navbar />

      <div className="dashboard">

        <div
          className="dashboard__bg"
          style={{ backgroundImage: profileImg ? `url(${profileImg})` : 'none' }}
        />
        <div className="dashboard__overlay" />

        <div className="hero">
          {profileImg && (
            <img className="hero__avatar" src={profileImg} alt={profile?.display_name} />
          )}
          <div className="hero__info">
            <div className="hero__greeting">Good to see you</div>
            <div className="hero__name">
              {profile
                ? <>Hi, <span>{profile.display_name?.split(" ")[0]}</span></>
                : "Your Dashboard"
              }
            </div>
            <div className="hero__meta">
              <div className="hero__badge">
                <div className="dot" />
                {profile?.product === "premium" ? "Spotify Premium" : "Spotify Free"}
              </div>
              {profile?.country && (
                <div className="hero__badge">{profile.country}</div>
              )}
              {profile && (
                <div className="hero__badge">{profile.followers?.total ?? 0} followers</div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ position: 'relative', zIndex: 2, padding: '0 40px' }}>
            <Loading />
          </div>
        ) : (
          <div className="main">

            {/* ── Left: Top Tracks ── */}
            <div className="main__left">
              <div className="panel-header">
                <span className="panel-title">Top Tracks</span>
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
              </div>

              <div className="track-list">
                {tracks.map((track, i) => (
                  <div
                    className="track-item"
                    key={track.id}
                    onClick={() => playTrack(track.uri)}
                  >
                    <div className="track-num">{i + 1}</div>
                    <div className="track-play">▶</div>
                    {track.album?.images?.[0]?.url
                      ? <img className="track-img" src={track.album.images[0].url} alt={track.album.name} />
                      : <div className="track-img-placeholder">♪</div>
                    }
                    <div className="track-info">
                      <div className="track-name">{track.name}</div>
                      <div className="track-artist">{track.artists?.map(a => a.name).join(", ")}</div>
                    </div>
                    <a
                      className="track-duration"
                      href={track.external_urls?.spotify}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                    >
                      {msToTime(track.duration_ms)}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: Recently Played ── */}
            <div className="main__right">
              <div className="panel-header">
                <span className="panel-title">Recently Played</span>
                <span className="panel-count">{recentlyPlayed.length} tracks</span>
              </div>
              <div className="rp-grid">
                {recentlyPlayed.map((item) => (
                  <RecentlyPlayedTrackCard key={item?.played_at} item={item} />
                ))}
              </div>
              {nextUrl && recentlyPlayed.length < 50 && (
                <div
                  className={`load-more ${loadingMore ? 'load-more--loading' : ''}`}
                  onClick={() => loadMoreRecentlyPlayed(nextUrl)}
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </>
  )
}
  export default Dashboard