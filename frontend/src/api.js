import axios from 'axios'
import API_BASE_URL from './config'

const api = axios.create({
    baseURL: API_BASE_URL,
})

export let apiBlocked = false;
export const setApiBlocked = (val) => { apiBlocked = val; };

// Attach JWT + block requests when rate limited
api.interceptors.request.use((config) => {
    if (apiBlocked) {
        return Promise.reject({ isBlocked: true });
    }
    const token = localStorage.getItem('access_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

api.interceptors.response.use(
  response => response,
  error => {
    if (error.isBlocked) return Promise.reject(error);

    const status = error.response?.status;

    if (status === 429) {
      setApiBlocked(true);
      window.dispatchEvent(new CustomEvent('api:ratelimit'));
    }

    if (status === 401) {
      window.dispatchEvent(new CustomEvent('api:unauthorized'));
    }

    return Promise.reject(error);
  }
)


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


export const getTrackSpotifyUrl = (artistName, trackName) => {
  return api.get('/get_track_spotify_url/', {
    params: {
      artist: artistName,
      track: trackName
    }
  });
};

export const getMe = () => api.get('/auth/spotify/me/')
export const getMyPlaylists = () => api.get('/get_my_playlists/')
export const getRecentlyPlayedTracks = () => api.get('/get_recently_played_tracks/')
export const getCurrentlyPLaying = () => api.get('/get_currently_playing/')

export const logoutUser = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
}

export const playTrack = async (trackUri) => {
  const res = await api.post('/play_track/', { track_uri: trackUri });
  return res;
};




export const callNextApiUrl = (nextUrl) => {
  return api.get('/call_next_api_url/', {
    params: { next_url: nextUrl } 
  });
};



export const getArtistAlbums = (artistID) => {
  return api.get('/get_artist_albums/', {
    params: {
      artist_id: artistID
    }
  });
};

export const searchItem = (q) => {
  return api.get('/search_item/', {
    params: {
      q: q
    }
  });
};

export default api

