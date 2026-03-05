import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getTopTracks, getMe, logoutUser, playTrack, getRecentlyPlayedTracks, callNextApiUrl, getTopArtists, getCurrentlyPLaying } from '../../api'
import './Dashboard.css'
import Navbar from '../../components/Navbar/Navbar'
import Loading from '../../components/Loading/Loading'
import Footer from '../../components/Footer/Footer'

import '../../index.css'

function msToTime(ms) {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function RecentlyPlayedTrackCard({ item, currentlyPlaying, onPlay, isActiveCard }) {
  const track = item?.track
  const image = track?.album?.images?.[0]?.url
  const artist = track?.artists?.map(a => a.name).join(", ")
  const url = track?.external_urls?.spotify
  const isPlaying = currentlyPlaying?.item?.name === track?.name && isActiveCard
  const playedAt = item?.played_at
    ? new Date(item.played_at).toLocaleString(undefined, {
        month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit'
      })
    : null

  if (!track) return null

  return (
    <a href={url} target="_blank" rel="noreferrer" className="rp-card-link">
      <div className={`rp-card ${isPlaying ? 'rp-card--active' : ''}`}>
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
          <button
            className={`rp-card__play ${isPlaying ? 'rp-card__play--active' : ''}`}
            onClick={e => { e.preventDefault(); e.stopPropagation(); onPlay(track); }}
          >
            {isPlaying ? (
              <div className="rp-card__bars">
                {[...Array(4)].map((_, i) => (
                  <span key={i} className="rp-card__bar" style={{ '--i': i }} />
                ))}
              </div>
            ) : '▶'}
          </button>
        </div>
      </div>
    </a>
  )
}

function TopTracksThisMonth({ items }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!items?.length) return
    const delay = setTimeout(() => {
      const timer = setInterval(() => {
        setCurrent(i => (i + 1) % items.length)
      }, 4000)
      return () => clearInterval(timer)
    }, 2000)
    return () => clearTimeout(delay)
  }, [items.length])

  if (!items?.length) return null

  const prev = () => setCurrent(i => (i - 1 + items.length) % items.length)
  const next = () => setCurrent(i => (i + 1) % items.length)

  const item = items[current]
  const image = item?.album?.images?.[0]?.url
  const artist = item?.artists?.map(a => a.name).join(", ")
  const url = item?.external_urls?.spotify

  return (
    <div className="ttm-carousel">
      <div className="ttm-header">Your Latest Vibes</div>

      <a href={url} target="_blank" rel="noreferrer" className="ttm-sticker">
        <div className="ttm-sticker__img-wrap">
          {image
            ? <img className="ttm-sticker__img" src={image} alt={item.name} />
            : <div className="ttm-img-placeholder">🎵</div>
          }
          <div className="ttm-sticker__overlay">
            <div className="ttm-sticker__name">{item.name}</div>
            <div className="ttm-sticker__artist">{artist}</div>
          </div>
        </div>
      </a>

      <div className="ttm-controls">
        <button className="ttm-arrow" onClick={prev}>‹</button>
        <div className="ttm-dots">
          {items.map((_, i) => (
            <span
              key={i}
              className={`ttm-dot ${i === current ? 'ttm-dot--active' : ''}`}
              onClick={() => setCurrent(i)}
            />
          ))}
        </div>
        <button className="ttm-arrow" onClick={next}>›</button>
      </div>
    </div>
  )
}


function TopArtistThisMonth({ items }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!items?.length) return
    const timer = setInterval(() => {
      setCurrent(i => (i + 1) % items.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [items.length])

  if (!items?.length) return null

  const prev = () => setCurrent(i => (i - 1 + items.length) % items.length)
  const next = () => setCurrent(i => (i + 1) % items.length)

  const item = items[current]
  const image = item?.images?.[0]?.url
  const artist = item?.name
  const url = item?.external_urls?.spotify

  return (
    <div className="ttm-carousel">
      <div className="ttm-header">Artist Picks</div>

      <a href={url} target="_blank" rel="noreferrer" className="ttm-sticker">
        <div className="ttm-sticker__img-wrap">
          {image
            ? <img className="ttm-sticker__img" src={image} alt={item.name} />
            : <div className="ttm-img-placeholder">🎵</div>
          }
          <div className="ttm-sticker__overlay">
            <div className="ttm-sticker__name">{artist}</div>
          </div>
        </div>
      </a>

      <div className="ttm-controls">
        <button className="ttm-arrow" onClick={prev}>‹</button>
        <div className="ttm-dots">
          {items.map((_, i) => (
            <span
              key={i}
              className={`ttm-dot ${i === current ? 'ttm-dot--active' : ''}`}
              onClick={() => setCurrent(i)}
            />
          ))}
        </div>
        <button className="ttm-arrow" onClick={next}>›</button>
      </div>
    </div>
  )
}

// Expanded palette to support many artists
const CHART_COLORS = [
  '#1db954', '#1ed760', '#17a349', '#0f7a35',
  '#0d5c28', '#a8f5c2', '#5ee89a', '#3dd67a',
  '#2bc463', '#26b058', '#5b8dee', '#e25b5b',
  '#e8a838', '#b45be8', '#5be8d8', '#e85ba8',
  '#8be85b', '#e8785b', '#5b9ee8', '#c8e85b',
]

function ArtistBreakdownChart({ tracks }) {
  const [hovered, setHovered] = useState(null)

  // Build artist → { count, tracks[] } — ALL artists, no slice limit
  const artistData = useMemo(() => {
    if (!tracks?.length) return []
    const map = {}
    tracks.forEach(track => {
      track.artists?.forEach(a => {
        if (!map[a.name]) map[a.name] = { name: a.name, count: 0, tracks: [] }
        map[a.name].count += 1
        if (!map[a.name].tracks.find(t => t.id === track.id)) {
          map[a.name].tracks.push(track)
        }
      })
    })
    return Object.values(map)
      .sort((a, b) => b.count - a.count)
      .map((d, i) => ({ ...d, color: CHART_COLORS[i % CHART_COLORS.length] }))
  }, [tracks])

  if (!artistData.length) return null

  const total1 = artistData.reduce((s, d) => s + d.count, 0)
  const total = total1 - 2

  // SVG donut
  const cx = 80, cy = 80, R = 64, r = 42
  const toRad = deg => (deg * Math.PI) / 180

  let cumulativePercent = 0
  const slices = artistData.map((d) => {
    const percent = d.count / total
    const startAngle = cumulativePercent * 360 - 90
    const endAngle = (cumulativePercent + percent) * 360 - 90
    cumulativePercent += percent

    const x1 = cx + R * Math.cos(toRad(startAngle))
    const y1 = cy + R * Math.sin(toRad(startAngle))
    const x2 = cx + R * Math.cos(toRad(endAngle))
    const y2 = cy + R * Math.sin(toRad(endAngle))
    const xi1 = cx + r * Math.cos(toRad(endAngle))
    const yi1 = cy + r * Math.sin(toRad(endAngle))
    const xi2 = cx + r * Math.cos(toRad(startAngle))
    const yi2 = cy + r * Math.sin(toRad(startAngle))
    const largeArc = percent > 0.5 ? 1 : 0

    const path = [
      `M ${x1} ${y1}`,
      `A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${xi1} ${yi1}`,
      `A ${r} ${r} 0 ${largeArc} 0 ${xi2} ${yi2}`,
      'Z'
    ].join(' ')

    return { ...d, path, percent }
  })

  const hoveredSlice = hovered !== null ? slices[hovered] : null

  return (
    <div className="abc-wrap">
      <div className="abc-header">
        <span className="panel-title">Artist Breakdown</span>
        <span className="panel-count">{artistData.length} artists · {tracks.length} tracks</span>
      </div>

      <div className="abc-body">
        {/* Donut */}
        <div className="abc-donut-wrap">
          <svg viewBox="0 0 160 160" className="abc-svg">
            {slices.map((s, i) => (
              <path
                key={i}
                d={s.path}
                fill={s.color}
                opacity={hovered === null || hovered === i ? 1 : 0.2}
                stroke="rgba(0,0,0,0.5)"
                strokeWidth="1"
                style={{
                  cursor: 'pointer',
                  transition: 'opacity 0.2s ease, transform 0.2s ease',
                  transformOrigin: '80px 80px',
                  transform: hovered === i ? 'scale(1.04)' : 'scale(1)',
                }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
            <text x="80" y="74" textAnchor="middle" className="abc-center-count">
              {hoveredSlice ? hoveredSlice.count : total}
            </text>
            <text x="80" y="90" textAnchor="middle" className="abc-center-label">
              {hoveredSlice ? hoveredSlice.name.split(' ')[0] : 'tracks'}
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="abc-legend">
          {slices.map((s, i) => (
            <div
              key={i}
              className={`abc-legend-item ${hovered === i ? 'abc-legend-item--active' : ''}`}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Row: dot · name · count */}
              <div style={{ display: 'grid', gridTemplateColumns: '8px 1fr auto', alignItems: 'center', gap: '8px', width: '220px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, display: 'inline-block', justifySelf: 'center' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: hovered === i ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'Syne, sans-serif' }} title={s.name}>{s.name}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'DM Mono, monospace', whiteSpace: 'nowrap' }}>{s.count} track{s.count !== 1 ? 's' : ''}</span>
              </div>

              {/* Progress bar */}
              <div
                className="abc-legend-bar"
                style={{ '--bar-width': `${(s.percent * 100).toFixed(1)}%`, '--bar-color': s.color }}
              />

              {/* Song list — expands on hover */}
              {hovered === i && (
                <div className="abc-song-list">
                  {s.tracks.map(t => (
                    <a
                      key={t.id}
                      href={t.external_urls?.spotify}
                      target="_blank"
                      rel="noreferrer"
                      className="abc-song-item"
                      onClick={e => e.stopPropagation()}
                    >
                      {t.album?.images?.[2]?.url
                        ? <img className="abc-song-img" src={t.album.images[2].url} alt={t.name} />
                        : <div className="abc-song-img abc-song-img--placeholder">♪</div>
                      }
                      <span className="abc-song-name">{t.name}</span>
                      <span className="abc-song-duration">{msToTime(t.duration_ms)}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CurrentlyPlaying({ track, onPlayPause }) {
  const [localProgress, setLocalProgress] = useState(track?.progress_ms || 0);
  const [localIsPlaying, setLocalIsPlaying] = useState(track?.is_playing || false);

  // Sync when parent track updates (every 3s)
  useEffect(() => {
    if (track?.progress_ms != null) {
      setLocalProgress(track.progress_ms);
      setLocalIsPlaying(track.is_playing);
    }
  }, [track]);

  // Tick every second locally
  useEffect(() => {
    if (!localIsPlaying) return;
    const timer = setInterval(() => {
      setLocalProgress(prev => Math.min(prev + 1000, track?.item?.duration_ms || 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [localIsPlaying, track?.item?.duration_ms]);

  if (!track?.item) return null;

  const { name, artists, album, duration_ms } = track.item;
  const progressPercent = (localProgress / duration_ms) * 100;

  return (
    <div className="cp-wrap">
      <div className="cp-label">{localIsPlaying ? '▶ Now Playing' : '⏸ Paused'}</div>
      <div className="cp-body">
        <img className="cp-art" src={album?.images?.[0]?.url} alt={album?.name} />
        <div className="cp-info">
          <div className="cp-name">{name}</div>
          <div className="cp-artist">{artists?.map(a => a.name).join(', ')}</div>
        </div>
      </div>
      <div className="cp-progress-wrap">
        <div className="cp-times">
          <span className="cp-time">{msToTime(localProgress)}</span>
          <span className="cp-time">{msToTime(duration_ms)}</span>
        </div>
        <div className="cp-progress-bar">
          <div className="cp-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>
    </div>
  );
}


function Dashboard() {
  const navigate = useNavigate()
  const { timeRange } = useParams()
  const range = timeRange || "medium_term"

  const [tracks, setTracks] = useState([])
  const [profile, setProfile] = useState(null)
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null)

  const [tracksLoading, setTracksLoading] = useState(true)
  const [recentlyPlayed, setRecentlyPlayed] = useState([])
  const [topTracksThisMonth, setTopTracksThisMonth] = useState([])
  const [topArtistThisMonth, setTopArtistThisMonth] = useState([])

  const [nextUrl, setNextUrl] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [noDeviceTrack, setNoDeviceTrack] = useState(null);

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


  const handlePlay = async (track) => {
    try {
      await playTrack(track.uri);
      // Optimistically update so active state switches immediately
      setCurrentlyPlaying(prev => ({
        ...prev,
        is_playing: true,
        item: track,
      }));
    } catch (err) {
      if (err.response?.data?.error === 'no_device') {
        setNoDeviceTrack(track);
      }
    }
  };

  useEffect(() => {
    Promise.all([getMe(), getRecentlyPlayedTracks(), getTopTracks('short_term'), getTopArtists('short_term'), getCurrentlyPLaying() ])
      .then(([meRes, recentlyRes, topTracksRes, topArtRes, curPlayRes]) => {
        setProfile(meRes.data)
        setRecentlyPlayed(recentlyRes.data?.items || [])
        setNextUrl(recentlyRes.data?.next || null)
        setCurrentlyPlaying(curPlayRes.data)

        const TTM = topTracksRes.data?.items.slice(0, 10) ?? []
        const shuffled_tts = TTM.sort(() => Math.random() - 0.5).slice(0, 5)
        setTopTracksThisMonth(shuffled_tts)

        const ATM = topArtRes.data?.items.slice(0, 10) ?? []
        const shuffled_artist = ATM.sort(() => Math.random() - 0.5).slice(0, 5)
        setTopArtistThisMonth(shuffled_artist)
      })
      .catch(err => console.log("error", err))
  }, [])

  // Poll every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await getCurrentlyPLaying();
        setCurrentlyPlaying(res.data);
      } catch (err) {
        console.log('polling error', err);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    setTracksLoading(true)
    getTopTracks(range)
      .then(res => setTracks(res.data?.items || []))
      .catch(err => console.log("error", err))
      .finally(() => setTracksLoading(false))
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
          <div className="hero__top">
            {profileImg && (
              <img className="hero__avatar" src={profileImg} alt={profile?.display_name} />
            )}
            <div className="hero__info">
              <div className="hero__greeting">Good to see you</div>
              <div className="hero__name">
                {profile
                  ? <>Hi, <span>{profile.display_name?.split(" ")[0]}</span></>
                  : ""
                }
              </div>
              <div className="hero__meta">
                <div className="hero__badge">
                  <div className="dot" />
                  {profile?.product === "premium" ? "Premium" : "Spotify Free"}
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

          <div className="this_month_container">
            <CurrentlyPlaying track={currentlyPlaying}  />
              <div className="this_month_carousels">
                <TopArtistThisMonth items={topArtistThisMonth} />
                <TopTracksThisMonth items={topTracksThisMonth} />
              </div>

          </div>
        </div>

        {!profile ? (
          <div style={{ position: 'relative', zIndex: 2, padding: '0 40px' }}>
            <Loading />
          </div>
        ) : (
          <div className="main">

            {/* ── Left: Top Tracks + Chart ── */}
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

              {tracksLoading ? (
                <Loading />
              ) : (
                <>
                  <div className="track-list">
                    {tracks.map((track, i) => (
                      <div
                        className={`track-item ${currentlyPlaying?.item?.name === track.name ? 'track-item--active' : ''}`}
                        key={track.id}
                        onClick={() => handlePlay(track)}
                      >
                        <div className="track-num">
                          {currentlyPlaying?.item?.name === track.name ? (
                            <div className="rp-card__bars">
                              {[...Array(4)].map((_, j) => (
                                <span key={j} className="rp-card__bar" style={{ '--i': j }} />
                              ))}
                            </div>
                          ) : i + 1}
                        </div>
                        {currentlyPlaying?.item?.name !== track.name && (
                          <div className="track-play">▶</div>
                        )}
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

                  {/* Artist Breakdown Chart */}
                  <ArtistBreakdownChart tracks={tracks} />
                </>
              )}
            </div>

            {/* ── Right: Recently Played ── */}
            <div className="main__right">
              <>
                <div className="panel-header">
                  <span className="panel-title">Recently Played</span>
                  <span className="panel-count">{recentlyPlayed.length} tracks</span>
                </div>
                <div className="rp-grid">
                  {recentlyPlayed.map((item, index) => {
                    const firstIndex = recentlyPlayed.findIndex(
                      i => i.track?.name === currentlyPlaying?.item?.name
                    );
                    return (
                      <RecentlyPlayedTrackCard
                        key={item?.played_at}
                        item={item}
                        currentlyPlaying={currentlyPlaying}
                        onPlay={handlePlay}
                        isActiveCard={index === firstIndex}
                      />
                    );
                  })}
                </div>
                {nextUrl && recentlyPlayed.length < 50 && (
                  <div
                    className={`load-more ${loadingMore ? 'load-more--loading' : ''}`}
                    onClick={() => loadMoreRecentlyPlayed(nextUrl)}
                  >
                    {loadingMore ? "Loading..." : "Load More"}
                  </div>
                )}
              </>
            </div>

          </div>
        )}
      </div>

      {noDeviceTrack && (
        <div className="no-device-overlay" onClick={() => setNoDeviceTrack(null)}>
          <div className="no-device-modal" onClick={e => e.stopPropagation()}>
            <div className="no-device-title">No Active Device</div>
            <div className="no-device-msg">
              Open Spotify, play any song, then come back and click play on <br /><strong>{noDeviceTrack.name}</strong>
            </div>
            <div className="no-device-actions">
              <a
                href="https://open.spotify.com"
                target="_blank"
                rel="noreferrer"
                className="no-device-btn no-device-btn--primary"
                onClick={() => setNoDeviceTrack(null)}
              >
                Open Spotify
              </a>
              <button className="no-device-btn no-device-btn--secondary" onClick={() => setNoDeviceTrack(null)}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}

export default Dashboard