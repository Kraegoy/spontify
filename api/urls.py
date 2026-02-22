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




]