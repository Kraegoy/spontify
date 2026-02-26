from django.urls import path
from . import views

urlpatterns = [
    path('auth/spotify/login/', views.spotify_login, name='spotify_login'),
    path('auth/spotify/callback/', views.spotify_callback, name='spotify_callback'),
    path('auth/spotify/me/', views.me, name='me'),
    path('top_tracks/', views.top_tracks, name="top_tracks"),
    path('top_artists/', views.top_artists, name="top_artists"),
    path('play_track/', views.play_track, name="play_track"),
    path('logout/', views.logout_view, name="logout"),
    path('logout/', views.logout_view, name="logout"),
    path('get_artist/', views.get_artist, name="get_artist"),
    path('get_my_playlists/', views.get_my_playlists, name="get_my_playlists"),
    path('get_artist_albums/', views.get_artist_albums, name="get_artist_albums"),
    path('get_artist_info_via_last_fm/', views.get_artist_info_via_last_fm, name="get_artist_info_via_last_fm"),
    path('get_artist_top_tracks_via_last_fm/', views.get_artist_top_tracks_via_last_fm, name="get_artist_top_tracks_via_last_fm"),
    path('get_similar_artist_links/', views.get_similar_artist_links, name="get_similar_artist_links"),
    path('get_track_spotify_url/', views.get_track_spotify_url, name="get_track_spotify_url"),
    path('get_recently_played_tracks/', views.get_recently_played_tracks, name="get_recently_played_tracks"),
    path('call_next_api_url/', views.call_next_api_url, name="call_next_api_url"),
    path('search_item/', views.search_item, name="search_item"),


]