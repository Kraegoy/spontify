import { useEffect, useState } from 'react'
import { getArtist, getArtistAlbums, getArtistLASTFM, getArtistTopTracksLASTFM, getSimilarArtists} from '../../api'
import { useParams } from "react-router-dom"
import './ArtistProfile.css'
import Navbar from '../../components/Navbar/Navbar'
import '../../index.css'


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

function ArtistInfo({ artistInfo }) {
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
        setWikiImage(json.thumbnail?.source || json.originalimage?.source || null)
      } catch (e) {
        console.log('wiki image error', e)
      }
    }
    fetchWikiImage()
  }, [data?.name])

  useEffect(() => {
    if (!data?.name) return
    async function fetchSimilarImages() {
      const similarArtists = data.similar?.artist || []
      const results = {}
      await Promise.all(
        similarArtists.map(async (a) => {
          try {
            const res = await fetch(
              `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(a.name)}`
            )
            const json = await res.json()
            results[a.name] = json.thumbnail?.source || json.originalimage?.source || null
          } catch {
            results[a.name] = null
          }
        })
      )
      setSimilarWikiImages(results)
    }
    fetchSimilarImages()
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

  useEffect(() => {
    if (!artist.name) return
    getArtistLASTFM(artist.name)
      .then(res => {
        const mbid = res.data?.artist?.mbid
        if (!mbid) return
        return getSimilarArtists(mbid)
      })
      .then(res => {
        if (res?.data?.spotify_url) setSpotifyUrl(res.data.spotify_url)
      })
      .catch(err => console.log("error fetching similar artist", err))
  }, [artist.name])

  if (!spotifyUrl) return null

  return (
    <a href={spotifyUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
      <div className="ai-similar-chip">
        {image
          ? <img className="ai-similar-img" src={image} alt={artist.name} />
          : <div className="ai-similar-placeholder">🎵</div>
        }
        {artist.name}
      </div>
    </a>
  )
}
function ArtistProfile() {
  const { artistID } = useParams()
  const [artist, setArtist] = useState(null)
  const [loading, setLoading] = useState(true)
  const [albums, setAlbums] = useState([])
  const [artistInfo, setArtistInfo] = useState(null)
  const [artistTopTracks, setArtistTopTracks] = useState(null)


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

  if (loading) return <div>Loading...</div>
  if (!artist) return <div>Artist not found</div>

  console.log("artist info", artistInfo)
  console.log("artist top tracks", artistTopTracks)

  return (
    <div className="artist-profile">
      <Navbar />
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

      <div className="artist-info-container">
      <ArtistInfo artistInfo={artistInfo} />
      </div>
    </div>
  )
}

export default ArtistProfile