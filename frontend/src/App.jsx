import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import TopArtists from './pages/TopArtists/TopArtists'
import ArtistProfile from './pages/ArtistProfile/ArtistProfile'
import MyPlaylists from './pages/MyPlaylists/MyPlaylists'
import SearchResults from './pages/SearchResults/SearchResults'
import Loading from './components/Loading/Loading'


import { useState, useEffect } from 'react'
import { getMe } from './api'

// ── Save token immediately, before any component mounts ──
const params = new URLSearchParams(window.location.search)
const access = params.get('access')
const refresh = params.get('refresh')
if (access) {
  localStorage.setItem('access_token', access)
  localStorage.setItem('refresh_token', refresh)
  window.history.replaceState({}, document.title, '/dashboard')
}

function PrivateRoute({ children }) {
  const [valid, setValid] = useState(null)
  const [minDelay, setMinDelay] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMinDelay(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    getMe()
      .then(() => setValid(true))
      .catch(() => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        setValid(false)
      })
  }, [])

  if (valid === null || !minDelay) return <Loading message="" />

  return valid ? children : <Navigate to="/" />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Login />} />

        <Route path="/dashboard/:timeRange?" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />

        <Route path="/top_artists/:timeRange" element={
          <PrivateRoute>
            <TopArtists />
          </PrivateRoute>
        } />

         <Route path="/search" element={
          <PrivateRoute>
            <SearchResults />
          </PrivateRoute>
        } />

        <Route path="/artist/:artistID" element={
          <PrivateRoute>
            <ArtistProfile />
          </PrivateRoute>
        } />

        <Route path="/my_playlists" element={
          <PrivateRoute>
            <MyPlaylists />
          </PrivateRoute>
        } />

      </Routes>
    </BrowserRouter>
  )
}

export default App