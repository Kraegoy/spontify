import requests
from datetime import timedelta
from urllib.parse import urlencode
import hashlib

from django.conf import settings
from django.contrib.auth.models import User
from django.shortcuts import redirect
from django.utils import timezone

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import SpotifyToken
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse

from django.core.cache import cache

from functools import wraps

def spotify_auth_required(func):
    @wraps(func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response({'error': 'Not logged in'}, status=401)
        
        access_token = get_valid_token(request.user)
        if not access_token:
            return Response({'error': 'No Spotify token found'}, status=401)
        
        # Pass token to the view
        return func(request, *args, access_token=access_token, **kwargs)
    return wrapper

@api_view(['GET'])
def spotify_login(request):
    scopes = ' '.join([
        'user-read-private',
        'user-read-email',
        'user-top-read',
        'user-read-recently-played',
        'playlist-read-private',
        'playlist-modify-public',
        'playlist-modify-private',
        'user-modify-playback-state',
        'user-read-playback-state',
        'streaming',
        'user-read-currently-playing'
    ])

    params = urlencode({
        'client_id': settings.SPOTIFY_CLIENT_ID,
        'response_type': 'code',
        'redirect_uri': settings.SPOTIFY_REDIRECT_URI,
        'scope': scopes,
    })

    spotify_auth_url = f"https://accounts.spotify.com/authorize?{params}"
    return redirect(spotify_auth_url)


# ─── Step 2: Spotify sends user back here with a code ───────────────────────

@csrf_exempt
def spotify_callback(request):
    code = request.GET.get('code')
    error = request.GET.get('error')

    if error:
        return redirect(f"{settings.FRONTEND_URL}?error=access_denied")

    token_response = requests.post(
        'https://accounts.spotify.com/api/token',
        data={
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': settings.SPOTIFY_REDIRECT_URI,
            'client_id': settings.SPOTIFY_CLIENT_ID,
            'client_secret': settings.SPOTIFY_CLIENT_SECRET,
        },
        headers={'Content-Type': 'application/x-www-form-urlencoded'}
    )



    if not token_response.ok:
        return redirect(f"{settings.FRONTEND_URL}?error=token_request_failed")

    token_data = token_response.json()
    access_token = token_data.get('access_token')
    refresh_token = token_data.get('refresh_token')
    expires_in = token_data.get('expires_in', 3600)

    if not access_token:
        print("TOKEN ERROR:", token_data)
        return redirect(f"{settings.FRONTEND_URL}?error=no_access_token&detail={token_data.get('error', 'unknown')}")

    profile_response = requests.get(
        'https://api.spotify.com/v1/me',
        headers={'Authorization': f'Bearer {access_token}'}
    )


    if profile_response.status_code == 429:
        return redirect(f"{settings.FRONTEND_URL}?error=rate_limited")

    if not profile_response.ok:
        return redirect(f"{settings.FRONTEND_URL}?error=profile_failed&status={profile_response.status_code}")

    profile = profile_response.json()
    spotify_id = profile.get('id')
    email = profile.get('email', '')
    display_name = profile.get('display_name', spotify_id)

    if not spotify_id:
        return redirect(f"{settings.FRONTEND_URL}?error=no_spotify_id")

    user, created = User.objects.get_or_create(
        username=spotify_id,
        defaults={'email': email, 'first_name': display_name}
    )

    expires_at = timezone.now() + timedelta(seconds=expires_in)
    SpotifyToken.objects.update_or_create(
        user=user,
        defaults={
            'access_token': access_token,
            'refresh_token': refresh_token,
            'expires_at': expires_at,
        }
    )

    refresh = RefreshToken.for_user(user)
    jwt_access = str(refresh.access_token)
    jwt_refresh = str(refresh)

    return redirect(
        f"{settings.FRONTEND_URL}/dashboard"
        f"?access={jwt_access}&refresh={jwt_refresh}"
    )


# ─── Helper: Get a valid token, refreshing if needed ────────────────────────

def get_valid_token(user):
    try:
        token = SpotifyToken.objects.get(user=user)
    except SpotifyToken.DoesNotExist:
        return None

    if token.expires_at <= timezone.now():
        token = refresh_spotify_token(token)

    return token.access_token


def refresh_spotify_token(token):
    response = requests.post(
        'https://accounts.spotify.com/api/token',
        data={
            'grant_type': 'refresh_token',
            'refresh_token': token.refresh_token,
            'client_id': settings.SPOTIFY_CLIENT_ID,
            'client_secret': settings.SPOTIFY_CLIENT_SECRET,
        },
        headers={'Content-Type': 'application/x-www-form-urlencoded'}
    )

    new_data = response.json()
    token.access_token = new_data.get('access_token')
    token.expires_at = timezone.now() + timedelta(seconds=new_data.get('expires_in', 3600))
    token.save()

    return token


# ─── Get current user's Spotify profile ─────────────────────────────────────

@api_view(['GET'])
@spotify_auth_required
def me(request, access_token):
    cache_key = f'me-{request.user.id}'
    cached = cache.get(cache_key)
    if cached:
        print("ME cached")
        return Response(cached)
    
    response = requests.get(
        'https://api.spotify.com/v1/me',
        headers={'Authorization': f'Bearer {access_token}'}
    )

    if not response.ok:
        return Response({'error': 'Failed to fetch profile', 'status': response.status_code}, status=response.status_code)

    data = response.json()
    cache.set(cache_key, data, timeout=60*60*24)
    return Response(data)


# ─── Get user's top tracks ───────────────────────────────────────────────────

@api_view(['GET'])
@spotify_auth_required
def top_tracks(request, access_token):

    time_range = request.query_params.get("time_range", "medium_term")
    
    cache_key = f'top-tracks-{request.user.id}-{time_range}'
    cached = cache.get(cache_key)
    
    if cached:
        print(f"top-tracks {time_range} cached")
        return Response(cached)
    
    response = requests.get(
        'https://api.spotify.com/v1/me/top/tracks',
        headers={'Authorization': f'Bearer {access_token}'},
        params={"time_range": time_range, "limit": 50}
    )

    if not response.ok:
        return Response({'error': 'Failed to fetch top tracks', 'status': response.status_code}, status=response.status_code)

    data = response.json()
    cache.set(cache_key, data, timeout=60*30)
    return Response(data)


# ─── Get user's top artists ──────────────────────────────────────────────────

@api_view(['GET'])
@spotify_auth_required
def top_artists(request, access_token):
    
    time_range = request.query_params.get("time_range", "medium_term")
    
    cache_key = f'top-artist-{request.user.id}-{time_range}'
    cached = cache.get(cache_key)
    if cached:
        print(f"top-artist {time_range} cached!")
        return Response(cached)
    
    
    response = requests.get(
        'https://api.spotify.com/v1/me/top/artists',
        headers={'Authorization': f'Bearer {access_token}'},
        params={"time_range": time_range, "limit": 50, "fields": "items(id,name,images,genres,followers,popularity,external_urls,uri)"}
    )

    if not response.ok:
        return Response({'error': 'Failed to fetch top artists', 'status': response.status_code}, status=response.status_code)

    data = response.json()
    cache.set(cache_key, data, timeout=60*60*24)
    
    return Response(data)






# ─── Play a track ────────────────────────────────────────────────────────────

@api_view(['POST'])
@spotify_auth_required
def play_track(request, access_token):

    track_uri = request.data.get("track_uri")
    if not track_uri:
        return Response({'error': 'track_uri is required'}, status=400)

    response = requests.put(
        "https://api.spotify.com/v1/me/player/play",
        headers={'Authorization': f'Bearer {access_token}'},
        json={"uris": [track_uri]}
    )

    if response.status_code == 204:
        return Response({"ok": True}, status=200)

    if not response.ok:
        return Response({'error': 'Failed to play track', 'status': response.status_code}, status=response.status_code)

    return Response(response.json())


# ─── Logout ──────────────────────────────────────────────────────────────────

@csrf_exempt
def logout_view(request):
    return JsonResponse({'message': 'Logged out successfully'})


@api_view(["GET"])
@spotify_auth_required
def get_artist(request, access_token):
    artist_id = request.query_params.get('artist_id')
    if not artist_id:
        return Response({'error': 'artist_id is required'})
    
    cache_key = f'artist-{artist_id}'
    cached = cache.get(cache_key)
    if cached:
        print(f'cached {cache_key}!')
        return Response(cached)
        
    response = requests.get(
        f'https://api.spotify.com/v1/artists/{artist_id}',
        headers={'Authorization': f'Bearer {access_token}'},
    )
    
    if not response.ok:
        return Response({'error': 'Failed to fetch top artists', 'status': response.status_code}, status=response.status_code)

    data = response.json()
    cache.set(cache_key, data, timeout=60*60*24)

    return Response(data)



@api_view(["GET"])
@spotify_auth_required
def get_my_playlists(request, access_token):

    cache_key = f'myplaylists-{request.user.id}'
    cached = cache.get(cache_key)
    if cached:
        print(f'cached {cache_key}!')
        return Response(cached)
        
    response = requests.get(
        f'https://api.spotify.com/v1/me/playlists',
        headers={'Authorization': f'Bearer {access_token}'},
    )
    
    if not response.ok:
        return Response({'error': 'Failed to fetch playlists', 'status': response.status_code}, status=response.status_code)

    data = response.json()
    cache.set(cache_key, data, timeout=60*60*24)

    return Response(data)



@api_view(["GET"])
@spotify_auth_required
def get_artist_albums(request, access_token):
    artist_id = request.query_params.get('artist_id')
    
    cache_key = f'artist_albums-{artist_id}'
    cached = cache.get(cache_key)
    
    if cached:
        print(f"cached {cache_key}")
        return Response(cached)
    
    response = requests.get(
        f"https://api.spotify.com/v1/artists/{artist_id}/albums",
        headers={'Authorization': f'Bearer {access_token}'}
    )
    
    if not response.ok:
        return Response({'error': 'Failed to fetch playlists', 'status': response.status_code}, status=response.status_code)
    
    data = response.json()
    cache.set(cache_key, data, timeout=60*60*24)
    return Response(data)


@api_view(["GET"])
@spotify_auth_required
def get_artist_info_via_last_fm(request, access_token):
    artist_name = request.query_params.get('artist_name')
    
    cache_key = f"artist-info-last-fm-{artist_name}"
    cached = cache.get(cache_key)
    
    if cached:
        print(f"cached {cache_key}")
        return Response(cached)
    
    response = requests.get(
        f"https://ws.audioscrobbler.com/2.0/",
        params = {
            "method": "artist.getInfo",
            "artist": artist_name,
            "api_key": settings.LAST_FM_API_KEY,
            "format": "json"
        }
    )
    
    data = response.json()
    cache.set(cache_key, data, timeout=60*60*24*3)
    return Response(data)


@api_view(["GET"])
@spotify_auth_required
def get_artist_top_tracks_via_last_fm(request, access_token):
    artist_name = request.query_params.get('artist_name')
    
    cache_key = f"artist-top-tracks-last-fm-{artist_name}"
    cached = cache.get(cache_key)
    
    if cached:
        print(f"cached {cache_key}")
        return Response(cached)

    response = requests.get(
        "https://ws.audioscrobbler.com/2.0/",
        params={
            "method": "artist.getTopTracks",
            "artist": artist_name,
            "api_key": settings.LAST_FM_API_KEY,
            "format": "json"
        }
    )
    
    if not response.ok:
        return Response({'error': 'Failed to get artist top tracks via last fm', 'status': response.status_code}, status=response.status_code)
    
    data = response.json()
    cache.set(cache_key, data, timeout=60*60*24*3)
    return Response(data)


@api_view(["GET"])
@spotify_auth_required
def get_similar_artist_links(request, access_token):
    artist_mbid = request.query_params.get('artist_mbid')
    
    if not artist_mbid:
        return Response({"error": "artist_mbid is required"}, status=400)
    
    cache_key = f"artist-mbid-{artist_mbid}"
    cached = cache.get(cache_key)
    
    if cached:
        print(f"cached {cache_key}")
        return Response(cached)
    
    try:
        response = requests.get(
            f"https://musicbrainz.org/ws/2/artist/{artist_mbid}?inc=url-rels&fmt=json",
            headers={"User-Agent": "Spontify/1.0 (avilakraeg@gmail.com)"}
        )
        
        if response.status_code != 200:
            return Response({"error": "Failed to fetch from MusicBrainz"}, status=response.status_code)
        
        data = response.json()
        relations = data.get("relations", [])
        
        spotify_url = next(
            (r["url"]["resource"] for r in relations if "spotify.com/artist" in r["url"]["resource"]),
            None
        )
        
        result = {"spotify_url": spotify_url}
        cache.set(cache_key, result, timeout=60*60*24*3)
        return Response(result)
    
    except requests.exceptions.RequestException as e:
        return Response({"error": str(e)}, status=500)
    

@api_view(["GET"])
@spotify_auth_required
def get_track_spotify_url(request, access_token):
    artist_name = request.query_params.get('artist')
    track_name = request.query_params.get('track')

    if not artist_name or not track_name:
        return Response({"error": "artist and track are required"}, status=400)

    raw_key = f"track-spotify-{artist_name}-{track_name}"
    cache_key = "track-spotify-" + hashlib.md5(raw_key.encode()).hexdigest()    
    cached = cache.get(cache_key)
    if cached:
        return Response(cached)

    try:
        response = requests.get(
            "https://api.spotify.com/v1/search",
            headers={"Authorization": f"Bearer {access_token}"},
            params={
                "q": f"track:{track_name} artist:{artist_name}",
                "type": "track",
                "limit": 1
            }
        )

        if not response.ok:
            return Response({"error": "Failed to search Spotify"}, status=response.status_code)

        data = response.json()
        tracks = data.get("tracks", {}).get("items", [])

        if not tracks:
            result = {"spotify_url": None, "image": None, "reason": "not found on Spotify"}
            cache.set(cache_key, result, timeout=60*60*24)
            return Response(result)

        track = tracks[0]

        spotify_url = track.get("external_urls", {}).get("spotify")

        images = (track.get("album") or {}).get("images") or []
        image_url = images[0]["url"] if images else None  

        result = {"spotify_url": spotify_url, "image": image_url}

        cache.set(cache_key, result, timeout=60*60*24*120)
        return Response(result)

    except requests.exceptions.RequestException as e:
        return Response({"error": str(e)}, status=500)
    
    
    
@api_view(["GET"])
@spotify_auth_required
def get_recently_played_tracks(request, access_token):
    
    user = request.user.id
    cache_key = f"{user}-recently-played-tracks"
    cached = cache.get(cache_key)
    if cached:
        print(f"cached - {cache_key}")
        return Response(cached)
    
    response = requests.get(
        "https://api.spotify.com/v1/me/player/recently-played",
        headers={'Authorization': f'Bearer {access_token}'}
    )
    
    if not response.ok:
        return Response({'error': 'Failed to fetch recently played tracks', 'status': response.status_code}, status=response.status_code)
    
    data = response.json()
    cache.set(cache_key, data, timeout=60*10)
    
    return Response(data)


@api_view(["GET"])
@spotify_auth_required
def call_next_api_url(request, access_token):
    next_url = request.query_params.get("next_url")
    user = request.user.id

    if not next_url:
        return Response("error getting next url")

    cache_key = f"{user}-{next_url}"
    cached = cache.get(cache_key)
    if cached:
        print(f"cached {cache_key}") 
        return Response(cached)

    response = requests.get(
        next_url,
        headers={'Authorization': f'Bearer {access_token}'}
    )

    if not response.ok:
        return Response({'error': 'Failed to fetch next url', 'status': response.status_code}, status=response.status_code)

    data = response.json()
    cache.set(cache_key, data, 60 * 10) 
    return Response(data)  

