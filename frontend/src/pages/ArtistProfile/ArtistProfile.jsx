import { useEffect, useState } from 'react'
import { getArtist, getArtistAlbums } from '../../api'
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


function ArtistProfile() {
  const { artistID } = useParams()
  const [artist, setArtist] = useState(null)
  const [loading, setLoading] = useState(true)
  const [albums, setAlbums] = useState([])

  useEffect(() => {
    setLoading(true)
    Promise.all([getArtist(artistID), getArtistAlbums(artistID)])
      .then(([ArtRes, AlbRes]) => {
        setArtist(ArtRes.data)
        setAlbums(AlbRes.data.items || [])
    })
      .catch(err => console.log('error', err))
      .finally(() => setLoading(false))
  }, [artistID])

  if (loading) return <div>Loading...</div>
  if (!artist) return <div>Artist not found</div>

  console.log(artist)

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
  </div>
)


}

export default ArtistProfile