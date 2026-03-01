import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { searchItem, callNextApiUrl } from '../../api'
import './SearchResults.css'
import Navbar from '../../components/Navbar/Navbar'
import Loading from '../../components/Loading/Loading'
import Footer from '../../components/Footer/Footer'

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

function AudiobookCard({ audiobook }) {
  const image = audiobook.images?.[0]?.url
  const url = audiobook.external_urls?.spotify
  const authors = audiobook.authors?.map(a => a.name).join(', ')

  return (
    <a href={url} target="_blank" rel="noreferrer" className="sr-audiobook-card">
      <div className="sr-audiobook-img-wrap">
        <img
          className={`sr-audiobook-img ${!image ? 'sr-img--default' : ''}`}
          src={image || DEFAULT_IMG}
          alt={audiobook.name}
        />
        <div className="sr-audiobook-badge">Audiobook</div>
      </div>
      <div className="sr-audiobook-info">
        <div className="sr-audiobook-name">{audiobook.name}</div>
        <div className="sr-audiobook-meta">
          {authors && <span className="sr-audiobook-author">{authors}</span>}
          {audiobook.total_chapters && (
            <>
              <span className="sr-dot">·</span>
              <span>{audiobook.total_chapters} ch</span>
            </>
          )}
        </div>
      </div>
    </a>
  )
}

function EpisodeCard({ episode }) {
  const image = episode.images?.[0]?.url
  const url = episode.external_urls?.spotify
  const duration = episode.duration_ms ? msToTime(episode.duration_ms) : null
  const releaseDate = episode.release_date
    ? new Date(episode.release_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  return (
    <a href={url} target="_blank" rel="noreferrer" className="sr-episode-card">
      <div className="sr-episode-img-wrap">
        <img
          className={`sr-episode-img ${!image ? 'sr-img--default' : ''}`}
          src={image || DEFAULT_IMG}
          alt={episode.name}
        />
      </div>
      <div className="sr-episode-info">
        <div className="sr-episode-name">{episode.name}</div>
        <div className="sr-episode-desc">{episode.description}</div>
        <div className="sr-episode-meta">
          {releaseDate && <span>{releaseDate}</span>}
          {duration && (
            <>
              <span className="sr-dot">·</span>
              <span>{duration}</span>
            </>
          )}
        </div>
      </div>
    </a>
  )
}

function ShowCard({ show }) {
  const image = show.images?.[0]?.url
  const url = show.external_urls?.spotify

  return (
    <a href={url} target="_blank" rel="noreferrer" className="sr-album-card">
      <div className="sr-album-img-wrap">
        <img
          className={`sr-album-img ${!image ? 'sr-img--default' : ''}`}
          src={image || DEFAULT_IMG}
          alt={show.name}
        />
      </div>
      <div className="sr-album-info">
        <div className="sr-album-name">{show.name}</div>
        <div className="sr-album-meta">
          <span className="sr-album-type">Podcast</span>
          {show.total_episodes && (
            <>
              <span className="sr-dot">·</span>
              <span>{show.total_episodes} eps</span>
            </>
          )}
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
  const [audioBooks, setAudioBooks] = useState([])
  const [episodes, setEpisodes] = useState([])
  const [shows, setShows] = useState([])

  const [nextTracks, setNextTracks] = useState(null)
  const [nextArtists, setNextArtists] = useState(null)
  const [nextAlbums, setNextAlbums] = useState(null)
  const [nextPlaylists, setNextPlaylists] = useState(null)
  const [nextAudioBooks, setNextAudioBooks] = useState(null)
  const [nextEpisodes, setNextEpisodes] = useState(null)
  const [nextShows, setNextShows] = useState(null)
  const [loadingMore, setLoadingMore] = useState({
    tracks: false, artists: false, albums: false, playlists: false, audioBooks: false, episodes: false, shows: false
  })

  useEffect(() => {
    if (!q) return
    setLoading(true)
    setTracks([])
    setArtists([])
    setAlbums([])
    setPlaylists([])
    setAudioBooks([])
    setEpisodes([])
    setShows([])

    searchItem(q)
      .then(res => {
        const data = res?.data
        setTracks(data?.tracks?.items?.filter(Boolean) || [])
        setArtists(data?.artists?.items?.filter(Boolean) || [])
        setAlbums(data?.albums?.items?.filter(Boolean) || [])
        setPlaylists(data?.playlists?.items?.filter(Boolean) || [])
        setEpisodes(data?.episodes?.items?.filter(Boolean) || [])
        setShows(data?.shows?.items?.filter(Boolean) || [])
        setAudioBooks(data?.audiobooks?.items?.filter(Boolean) || [])

        setNextTracks(data?.tracks?.next || null)
        setNextArtists(data?.artists?.next || null)
        setNextAlbums(data?.albums?.next || null)
        setNextPlaylists(data?.playlists?.next || null)
        setNextAudioBooks(data?.audiobooks?.next || null)
        setNextEpisodes(data?.episodes?.next || null)
        setNextShows(data?.shows?.next || null)
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


  return (
    <>
      <Navbar />
      { loading ? (
        <Loading />
      ) : (

        <>
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

            {/* Shows (Podcasts) - full width */}
            <Section
              title="Podcasts & Shows" count={shows.length}
              next={nextShows} loadingMore={loadingMore.shows}
              onLoadMore={() => loadMore('shows', nextShows, setShows, setNextShows)}
            >
              <div className="sr-grid">
                {shows.map((show, i) => (
                  <ShowCard key={`${show.id}-${i}`} show={show} />
                ))}
              </div>
            </Section>

            {/* Audiobooks - full width */}
            <Section
              title="Audiobooks" count={audioBooks.length}
              next={nextAudioBooks} loadingMore={loadingMore.audioBooks}
              onLoadMore={() => loadMore('audiobooks', nextAudioBooks, setAudioBooks, setNextAudioBooks)}
            >
              <div className="sr-grid">
                {audioBooks.map((book, i) => (
                  <AudiobookCard key={`${book.id}-${i}`} audiobook={book} />
                ))}
              </div>
            </Section>

            {/* Episodes - full width list */}
            <Section
              title="Episodes" count={episodes.length}
              next={nextEpisodes} loadingMore={loadingMore.episodes}
              onLoadMore={() => loadMore('episodes', nextEpisodes, setEpisodes, setNextEpisodes)}
            >
              <div className="sr-episode-list">
                {episodes.map((episode, i) => (
                  <EpisodeCard key={`${episode.id}-${i}`} episode={episode} />
                ))}
              </div>
            </Section>

          </div>
        </div>

        <Footer/>
        </>
      )}
    </>
  )
}

export default SearchResults