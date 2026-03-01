import './Footer.css'

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">

        <div className="footer__brand">
          <img src="/spontify logo.png" alt="Spontify" className="footer__logo" />
          <span className="footer__tagline">Your music, your stats.</span>
        </div>

      
        <div className="footer__right">
          <span className="footer__disclaimer">
            Not affiliated with Spotify AB.
          </span>
        </div>

      </div>

      <div className="footer__bottom">
        <span className="footer__copy">© {new Date().getFullYear()} Spontify</span>
        <span className="footer__divider" />
        <span className="footer__copy">Built by Kraeg Avila</span>
        <span className="footer__divider" />
        <span className="footer__copy">Spotify · Last.fm · MusicBrainz · Wikipedia APIs</span>
      </div>
    </footer>
  )
}

export default Footer