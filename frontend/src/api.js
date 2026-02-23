import axios from 'axios'
import API_BASE_URL from './config'

const api = axios.create({
    baseURL: API_BASE_URL,
})

// Attach JWT to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export const getTopTracks = (timeRange) => {
  return api.get('/top_tracks/', {
    params: {
      time_range: timeRange
    }
  });

};

export const getArtist = (artistID) => {
  return api.get('/get_artist/', {
    params: {
      artist_id: artistID
    }
  });
};

export const getArtistLASTFM = (artistName) => {
  return api.get('/get_artist_info_via_last_fm/', {
    params: {
      artist_name: artistName
    }
  });
};

export const getArtistTopTracksLASTFM = (artistName) => {
  return api.get('/get_artist_top_tracks_via_last_fm/', {
    params: {
      artist_name: artistName
    }
  });
};

export const getTopArtists = (timeRange) => {
  return api.get('/top_artists/', {
    params: {
      time_range: timeRange
    }
  });
};

export const getSimilarArtists = (artistMBID) => {
  return api.get('/get_similar_artist_links/', {
    params: {
      artist_mbid: artistMBID
    }
  });
};


export const getMe = () => api.get('/auth/spotify/me/')
export const getMyPlaylists = () => api.get('/get_my_playlists/')
export const logoutUser = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
}

export const playTrack = (trackUri) => {
  return api.post('/play_track/', {
    track_uri: trackUri
  });
};

export const getArtistAlbums = (artistID) => {
  return api.get('/get_artist_albums/', {
    params: {
      artist_id: artistID
    }
  });
};

export default api

