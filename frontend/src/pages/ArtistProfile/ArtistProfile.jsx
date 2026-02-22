import { useEffect, useState } from 'react'
import { getArtist } from '../../api'
import { useParams } from "react-router-dom"
import './ArtistProfile.css'
import Navbar from '../../components/Navbar/Navbar'
import '../../index.css'

function ArtistProfile() {
  const { artistID } = useParams()
  const [artist, setArtist] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getArtist(artistID)
      .then((res) => setArtist(res.data))
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
            <div className="artist-profile__stats">
            
           
            </div>
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
    </div>
    )
}

export default ArtistProfile