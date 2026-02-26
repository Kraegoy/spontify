import { useEffect, useState } from 'react'
import { getArtist, getArtistAlbums, getArtistLASTFM, getArtistTopTracksLASTFM, getSimilarArtists, getTrackSpotifyUrl } from '../../api'
import { useParams, useNavigate } from "react-router-dom"
import './ArtistProfile.css'
import Navbar from '../../components/Navbar/Navbar'
import '../../index.css'
import Loading from '../../components/Loading/Loading'



function ArtistAlbums({ album }) {
  const image = album.images?.[0]?.url

  return (
    <a
      href={album.external_urls?.spotify}
      target="_blank"
      rel="noreferrer"
      className="album-card"
    >
      <div className="album-card__img-wrap">
        {image ? (
          <img className="album-card__img" src={image} alt={album.name} />
        ) : (
          <div className="album-card__img-placeholder">🎵</div>
        )}
      </div>
      <div className="album-card__info">
        <div className="album-card__name">{album.name}</div>
        <div className="album-card__meta">
          <span className="album-card__date">{album.release_date?.slice(0, 4)}</span>
          <span className="album-card__dot">·</span>
          <span className="album-card__tracks">{album.total_tracks} tracks</span>
          <span className="album-card__dot">·</span>
          <span className="album-card__type">{album.album_type}</span>
        </div>
      </div>
    </a>
  )
}

function TopTrackCard({ track, delay = 0, token }) {
  const [spotifyUrl, setSpotifyUrl] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [spotifyImg, setSpotifyImg] = useState(null)

  useEffect(() => {
    if (!track.name || !track.artist?.name || !token) return

    const timer = setTimeout(() => {
      getTrackSpotifyUrl(track.artist.name, track.name)
        .then(res => {
          const url = res.data?.spotify_url
          const img = res.data?.image
          setSpotifyUrl(url || null)
          setSpotifyImg(img || null)
        })
        .catch(err => console.log("error fetching track spotify url", track.name, err))
        .finally(() => setLoaded(true))
    }, delay)

    return () => clearTimeout(timer)
  }, [track.name, track.artist?.name, delay, token])

  if (loaded && !spotifyUrl) return null

  const card = (
    <div className={`popular-track-card ${!loaded ? "popular-track-card--loading" : ""}`}>
      <div className="popular-track-card__img-wrap">
        {spotifyImg ? (
          <img className="popular-track-card__img" src={spotifyImg} alt={track.name} />
        ) : (
          <div className="popular-track-card__img-placeholder">🎵</div>
        )}
      </div>

      <div className="popular-track-card__body">
        <div className="popular-track-card__name" title={track.name}>
          {track.name}
        </div>

        <div className="popular-track-card__meta">
          <span className="popular-track-card__rank">#{track["@attr"]?.rank}</span>
          <span className="popular-track-card__dot">·</span>
          <span>{track.name}</span>
        </div>
      </div>
    </div>
  )

  return loaded && spotifyUrl ? (
    <a href={spotifyUrl} target="_blank" rel="noreferrer" className="popular-track-card-link">
      {card}
    </a>
  ) : (
    card
  )
}

function ArtistInfo({ artistInfo, artistImg }) {
  const [bioExpanded, setBioExpanded] = useState(false)
  const [wikiImage, setWikiImage] = useState(null)
  const [similarWikiImages, setSimilarWikiImages] = useState({})

  const data = artistInfo?.artist

  useEffect(() => {
    if (!data?.name) return
    async function fetchWikiImage() {
     try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(data.name)}`
      )

      const json = await res.json()
      console.log("wikipedia", json)

      const extract = json.extract?.toLowerCase() || ""

      const isMusicRelated =
        extract.includes("artist") ||
        extract.includes("singer") ||
        extract.includes("musician") ||
        extract.includes("band") ||
        extract.includes("song") ||
        extract.includes("songwriter") ||
        extract.includes("rapper") ||
        extract.includes("music")

      if (isMusicRelated && json.thumbnail?.source) {
        setWikiImage(json.thumbnail.source)
      } else {
        setWikiImage(artistImg || null)
      }

    } catch (e) {
      console.log("wiki image error", e)
      setWikiImage(artistImg || null)
    }
    }
    fetchWikiImage()
  }, [data?.name])

  useEffect(() => {
    if (!data?.name) return

    async function fetchSimilarArtistImages() {
      const similarArtists = data.similar?.artist || []
      const results = {}

      await Promise.all(
        similarArtists.map(async (a) => {
          try {
            const res = await fetch(
              `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(a.name)}`
            )
            const json = await res.json()
            if (json.thumbnail?.source) {
              results[a.name] = json.thumbnail.source
              return
            }
          } catch { /* fall through */ }

          try {
            const lfm = await getArtistLASTFM(a.name)
            const mbid = lfm.data?.artist?.mbid
            if (!mbid) return

            const mbRes = await getSimilarArtists(mbid)
            const spotifyUrl = mbRes.data?.spotify_url
            if (!spotifyUrl) return

            const spotifyID = spotifyUrl.split('/').pop()?.split('?')[0]
            if (!spotifyID) return

            const spotifyRes = await getArtist(spotifyID)
            results[a.name] = spotifyRes.data?.images?.[0]?.url || null
          } catch (err) {
            console.log('error fetching similar artist image', a.name, err)
            results[a.name] = null
          }
        })
      )

      setSimilarWikiImages(results)
    }

    fetchSimilarArtistImages()
  }, [data?.name])

  if (!data) return null

  const lastFmImage = data.image?.find(img => img.size === "extralarge")?.["#text"] || data.image?.[0]?.["#text"]
  const displayImage = wikiImage || (lastFmImage && lastFmImage !== "" ? lastFmImage : null)
  const bioContent = data.bio?.content?.replace(/<a[^>]*>.*?<\/a>/g, "").trim()
  const bioSummary = data.bio?.summary?.replace(/<a[^>]*>.*?<\/a>/g, "").trim()
  const isOnTour = data?.ontour == 1
  const listeners = Number(data.stats?.listeners).toLocaleString()
  const playCount = Number(data.stats?.playcount).toLocaleString()
  const genres = data.tags?.tag?.map(tag => tag.name) || []
  const similarArtists = data.similar?.artist?.map(a => ({
    name: a.name,
    image: a.image?.find(i => i.size === "medium")?.["#text"]
  })) || []
  const lastFMUrl = data.url

  return (
    <div className="ai-root">

      <div className="ai-header">
        {displayImage
          ? <img className="ai-avatar" src={displayImage} alt={data.name} />
          : <div className="ai-avatar-placeholder">🎤</div>
        }
        <div className="ai-header-info">
          <div className="ai-label">Artist · Last.fm</div>
          <h2 className="ai-name">{data.name}</h2>
          <div className="ai-badges">
            {isOnTour
              ? <span className="ai-badge-tour"><span className="ai-badge-tour-dot" />On Tour</span>
              : <span className="ai-badge-nottour">Not on tour</span>
            }
          </div>
        </div>
      </div>

      <div className="ai-stats">
        <div className="ai-stat">
          <span className="ai-stat-label">Listeners</span>
          <span className="ai-stat-value">{listeners}</span>
        </div>
        <div className="ai-stat">
          <span className="ai-stat-label">Scrobbles</span>
          <span className="ai-stat-value">{playCount}</span>
        </div>
      </div>

      {genres.length > 0 && (
        <>
          <div className="ai-section-label">Tags</div>
          <div className="ai-genres">
            {genres.map(g => <span key={g} className="ai-genre">{g}</span>)}
          </div>
        </>
      )}

      {bioSummary && (
        <>
          <div className="ai-section-label">Biography</div>
          <div className="ai-bio">
            <p className={`ai-bio-text ${bioExpanded ? "expanded" : "collapsed"}`}>
              {bioExpanded ? bioContent || bioSummary : bioSummary}
            </p>
            {bioContent && bioContent !== bioSummary && (
              <button className="ai-bio-toggle" onClick={() => setBioExpanded(e => !e)}>
                {bioExpanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>
        </>
      )}

      {similarArtists.length > 0 && (
        <>
          <div className="ai-section-label">Similar Artists</div>
          <div className="ai-similar">
            {similarArtists.map(a => (
              <SimilarArtistChip
                key={a.name}
                artist={a}
                image={similarWikiImages[a.name] || a.image || null}
              />
            ))}
          </div>
        </>
      )}

      {lastFMUrl && (
        <>
          <div className="ai-divider" />
          <a className="ai-lastfm-link" href={lastFMUrl} target="_blank" rel="noreferrer">
            View on Last.fm
          </a>
        </>
      )}

    </div>
  )
}

function SimilarArtistChip({ artist, image }) {
  const [spotifyUrl, setSpotifyUrl] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const navigate = useNavigate()


  useEffect(() => {
    if (!artist.name) return
    getArtistLASTFM(artist.name)
      .then(res => {
        const mbid = res.data?.artist?.mbid
        if (!mbid) return
        return getSimilarArtists(mbid)
      })
      .then(res => {
        const url = res?.data?.spotify_url
        if (url) {
          // extract ID from https://open.spotify.com/artist/7gW0r5CkdEUMm42w9XpyZO
          const artistId = url.split('/artist/')[1]?.split('?')[0]
          if (artistId) setSpotifyUrl(`/artist/${artistId}`)
        }
      })
      .catch(err => console.log("error fetching similar artist spotify url", artist.name, err))
      .finally(() => setLoaded(true))
  }, [artist.name])

  if (!loaded || !spotifyUrl) return null

  return (
    <div onClick={() => navigate(spotifyUrl)} className="ai-similar-chip">
      {image
        ? <img className="ai-similar-img" src={image} alt={artist.name} />
        : <div className="ai-similar-placeholder">🎵</div>
      }
      {artist.name}
    </div>
  )
}

function ArtistProfile() {
  const { artistID } = useParams()
  const [artist, setArtist] = useState(null)
  const [loading, setLoading] = useState(true)
  const [albums, setAlbums] = useState([])
  const [artistInfo, setArtistInfo] = useState(null)
  const [artistTopTracks, setArtistTopTracks] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('access_token'))


  useEffect(() => {
    setLoading(true)
    Promise.all([getArtist(artistID), getArtistAlbums(artistID)])
      .then(([ArtRes, AlbRes]) => {
        const artistData = ArtRes.data
        setArtist(artistData)
        setAlbums(AlbRes.data.items || [])
        return Promise.all([getArtistLASTFM(artistData.name), getArtistTopTracksLASTFM(artistData.name)])
      })
      .then(([ArtistlastFmRes, ArtistTopTrackslastFmRes]) => {
        setArtistInfo(ArtistlastFmRes.data)
        setArtistTopTracks(ArtistTopTrackslastFmRes.data)
      })
      .catch(err => console.log('error', err))
      .finally(() => setLoading(false))
  }, [artistID])

  if (loading) return <Loading />
  if (!artist) return <div>Artist not found</div>

  const topTracks = artistTopTracks?.toptracks?.track || []

  return (
    <>      
      <Navbar />
      <div className="artist-profile">
        <div
          className="artist-profile__bg"
          style={{ '--artist-bg': `url(${artist.images?.[0]?.url})` }}
        />
        <div className="artist-profile__hero">
          <img
            className="artist-profile__img"
            src={artist.images?.[0]?.url}
            alt={artist.name}
          />
          <div className="artist-profile__overlay">
            <div className="artist-profile__type">Artist</div>
            <div className="artist-profile__name">{artist.name}</div>
            <div className="artist-profile__genres">
              {artist.genres?.map(genre => (
                <span key={genre} className="artist-profile__genre">{genre}</span>
              ))}
            </div>
            <a
              className="artist-profile__spotify-btn"
              href={artist.external_urls?.spotify}
              target="_blank"
              rel="noreferrer"
            >
              Open in Spotify
            </a>
          </div>
        </div>

        {albums.length > 0 && (
          <div className="albums-section">
            <div className="albums-header">
              <span className="albums-title">Discography</span>
              <span className="albums-count">{albums.length} releases</span>
            </div>
            <div className="albums-grid">
              {albums.map((album) => (
                <ArtistAlbums key={album.id} album={album} />
              ))}
            </div>
          </div>
        )}

        {topTracks.length > 0 && (
          <div className="popular-tracks-section">
            <div className="popular-tracks-header">
              <h2 className="popular-tracks-title">Popular Tracks</h2>
            </div>

            <div className="popular-tracks-row">
              {topTracks.map((t, i) => (
                <TopTrackCard
                  key={`${t.name}-${t.artist?.name}-${i}`}
                  track={t}
                  delay={i * 240}
                  token={token}
                />
              ))}
            </div>
          </div>
        )}

        <div className="artist-info-container">
          <ArtistInfo artistInfo={artistInfo} artistImg={artist.images?.[0]?.url} />
        </div>
      </div>
    </>

  )
}

export default ArtistProfile