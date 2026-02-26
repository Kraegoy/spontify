import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { searchItem, callNextApiUrl } from '../../api'
import './SearchResults.css'
import Navbar from '../../components/Navbar/Navbar'
import Loading from '../../components/Loading/Loading'
import '../../index.css'

const DEFAULT_IMG = '/spontify logo.png'

function msToTime(ms) {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function TrackRow({ track, index }) {
  const image = track.album?.images?.[0]?.url
  const artists = track.artists?.map(a => a.name).join(', ')
  const url = track.external_urls?.spotify

  return (
    <a href={url} target="_blank" rel="noreferrer" className="sr-track-row">
      <span className="sr-track-num">{index + 1}</span>
      <div className="sr-track-img-wrap">
        <img
          className={`sr-track-img ${!image ? 'sr-img--default' : ''}`}
          src={image || DEFAULT_IMG}
          alt={track.name}
        />
      </div>
      <div className="sr-track-info">
        <div className="sr-track-name">{track.name}</div>
        <div className="sr-track-artist">{artists}</div>
      </div>
      <span className="sr-track-duration">{msToTime(track.duration_ms)}</span>
    </a>
  )
}

function ArtistCard({ artist, navigate }) {
  const image = artist.images?.[0]?.url

  return (
    <div className="sr-artist-card" onClick={() => navigate(`/artist/${artist.id}`)}>
      <div className="sr-artist-img-wrap">
        <img
          className={`sr-artist-img ${!image ? 'sr-img--default' : ''}`}
          src={image || DEFAULT_IMG}
          alt={artist.name}
        />
      </div>
      <div className="sr-artist-name">{artist.name}</div>
      <div className="sr-artist-followers">{artist.followers?.total?.toLocaleString()} followers</div>
    </div>
  )
}

function AlbumCard({ album }) {
  const image = album.images?.[0]?.url
  const url = album.external_urls?.spotify

  return (
    <a href={url} target="_blank" rel="noreferrer" className="sr-album-card">
      <div className="sr-album-img-wrap">
        <img
          className={`sr-album-img ${!image ? 'sr-img--default' : ''}`}
          src={image || DEFAULT_IMG}
          alt={album.name}
        />
      </div>
      <div className="sr-album-info">
        <div className="sr-album-name">{album.name}</div>
        <div className="sr-album-meta">
          <span className="sr-album-type">{album.album_type}</span>
          <span className="sr-dot">·</span>
          <span>{album.release_date?.slice(0, 4)}</span>
        </div>
      </div>
    </a>
  )
}

function PlaylistCard({ playlist }) {
  const image = playlist.images?.[0]?.url
  const url = playlist.external_urls?.spotify

  return (
    <a href={url} target="_blank" rel="noreferrer" className="sr-album-card">
      <div className="sr-album-img-wrap">
        <img
          className={`sr-album-img ${!image ? 'sr-img--default' : ''}`}
          src={image || DEFAULT_IMG}
          alt={playlist.name}
        />
      </div>
      <div className="sr-album-info">
        <div className="sr-album-name">{playlist.name}</div>
        <div className="sr-album-meta">
          <span>{playlist.tracks?.total} tracks</span>
          <span className="sr-dot">·</span>
          <span>{playlist.owner?.display_name}</span>
        </div>
      </div>
    </a>
  )
}

function Section({ title, count, next, onLoadMore, loadingMore, children }) {
  if (!count) return null
  return (
    <div className="sr-section">
      <div className="sr-section-header">
        <span className="sr-section-title">{title}</span>
        <span className="sr-section-count">{count} loaded</span>
      </div>
      {children}
      {next && (
        <div
          className={`load-more ${loadingMore ? 'load-more--loading' : ''}`}
          onClick={onLoadMore}
        >
          {loadingMore ? 'Loading...' : 'Load More'}
        </div>
      )}
    </div>
  )
}

function SearchResults() {
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q')
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  const [tracks, setTracks] = useState([])
  const [artists, setArtists] = useState([])
  const [albums, setAlbums] = useState([])
  const [playlists, setPlaylists] = useState([])

  const [nextTracks, setNextTracks] = useState(null)
  const [nextArtists, setNextArtists] = useState(null)
  const [nextAlbums, setNextAlbums] = useState(null)
  const [nextPlaylists, setNextPlaylists] = useState(null)

  const [loadingMore, setLoadingMore] = useState({
    tracks: false, artists: false, albums: false, playlists: false
  })

  useEffect(() => {
    if (!q) return
    setLoading(true)
    setTracks([])
    setArtists([])
    setAlbums([])
    setPlaylists([])
    searchItem(q)
      .then(res => {
        const data = res?.data
        setTracks(data?.tracks?.items?.filter(Boolean) || [])
        setArtists(data?.artists?.items?.filter(Boolean) || [])
        setAlbums(data?.albums?.items?.filter(Boolean) || [])
        setPlaylists(data?.playlists?.items?.filter(Boolean) || [])
        setNextTracks(data?.tracks?.next || null)
        setNextArtists(data?.artists?.next || null)
        setNextAlbums(data?.albums?.next || null)
        setNextPlaylists(data?.playlists?.next || null)
      })
      .catch(err => console.log("error", err))
      .finally(() => setLoading(false))
  }, [q])

  const loadMore = async (type, nextUrl, setter, nextSetter) => {
    if (!nextUrl) return
    setLoadingMore(prev => ({ ...prev, [type]: true }))
    try {
      const more = await callNextApiUrl(nextUrl)
      const data = more.data
      const items = data?.[type]?.items?.filter(Boolean) || []
      const next = data?.[type]?.next || null
      setter(prev => [...prev, ...items])
      nextSetter(next)
    } catch (err) {
      console.log(`error loading more ${type}`, err)
    } finally {
      setLoadingMore(prev => ({ ...prev, [type]: false }))
    }
  }

  if (loading) return <Loading />

    return (
    <>
        <Navbar />
        <div className="sr-root">
        <div className="sr-hero">
            <div className="sr-hero-label">Search results for</div>
            <h1 className="sr-hero-query">"{q}"</h1>
        </div>

        <div className="sr-content">

            {/* Tracks + Albums side by side */}
            <div className="sr-two-col">
            <Section
                title="Tracks" count={tracks.length}
                next={nextTracks} loadingMore={loadingMore.tracks}
                onLoadMore={() => loadMore('tracks', nextTracks, setTracks, setNextTracks)}
            >
                <div className="sr-track-list">
                {tracks.map((track, i) => (
                    <TrackRow key={`${track.id}-${i}`} track={track} index={i} />
                ))}
                </div>
            </Section>

            <Section
                title="Albums" count={albums.length}
                next={nextAlbums} loadingMore={loadingMore.albums}
                onLoadMore={() => loadMore('albums', nextAlbums, setAlbums, setNextAlbums)}
            >
                <div className="sr-grid sr-grid--2col">
                {albums.map((album, i) => (
                    <AlbumCard key={`${album.id}-${i}`} album={album} />
                ))}
                </div>
            </Section>
            </div>

            {/* Artists - full width */}
            <Section
            title="Artists" count={artists.length}
            next={nextArtists} loadingMore={loadingMore.artists}
            onLoadMore={() => loadMore('artists', nextArtists, setArtists, setNextArtists)}
            >
            <div className="sr-grid">
                {artists.map((artist, i) => (
                <ArtistCard key={`${artist.id}-${i}`} artist={artist} navigate={navigate} />
                ))}
            </div>
            </Section>

            {/* Playlists - full width */}
            <Section
            title="Playlists" count={playlists.length}
            next={nextPlaylists} loadingMore={loadingMore.playlists}
            onLoadMore={() => loadMore('playlists', nextPlaylists, setPlaylists, setNextPlaylists)}
            >
            <div className="sr-grid">
                {playlists.map((playlist, i) => (
                <PlaylistCard key={`${playlist.id}-${i}`} playlist={playlist} />
                ))}
            </div>
            </Section>

        </div>
        </div>
    </>
    )
}

export default SearchResults