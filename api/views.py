import requests
from datetime import timedelta
from urllib.parse import urlencode

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

    print("TOKEN STATUS:", token_response.status_code)
    print("TOKEN BODY:", token_response.text)

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

    print("PROFILE STATUS:", profile_response.status_code)
    print("PROFILE BODY:", profile_response.text)

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
        params={"time_range": time_range, "limit": 20}
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
        params={"time_range": time_range, "limit": 20, "fields": "items(id,name,images,genres,followers,popularity,external_urls,uri)"}
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

    print("SPOTIFY STATUS:", response.status_code)
    print("SPOTIFY TEXT:", response.text)

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
    print("SPOTIFY DATA:", data)
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
        return Response({'error': 'Failed to fetch top artists', 'status': response.status_code}, status=response.status_code)

    data = response.json()
    print("SPOTIFY DATA:", data)
    cache.set(cache_key, data, timeout=60*60*24)

    return Response(data)


