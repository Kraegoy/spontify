import API_BASE_URL from '../../config'
import '../../index.css'

function Login(){
    const handleLogin = () => {
        window.location.href = `${API_BASE_URL}/auth/spotify/login/`
    }

     return (
    <div >
      <h1 >🎵 Spotify Insights Studio</h1>
      <p >Connect your Spotify account to get started</p>
      <button onClick={handleLogin}>
        Login with Spotify
      </button>
    </div>
  )
}

export default Login

