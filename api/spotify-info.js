export default async function handler(req, res) {
  const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
  const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    return res.status(500).json({ error: 'Missing Spotify credentials' });
  }

  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
  const NOW_PLAYING_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing';
  const RECENTLY_PLAYED_ENDPOINT = 'https://api.spotify.com/v1/me/player/recently-played?limit=1';
  const PLAYBACK_STATE_ENDPOINT = 'https://api.spotify.com/v1/me/player';

  try {
    // Get access token
    const tokenResponse = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: REFRESH_TOKEN,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new Error('No access token received');
    }

    const { access_token } = tokenData;

    // Get current playback state
    const playbackResponse = await fetch(PLAYBACK_STATE_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    let playbackData = null;
    if (playbackResponse.ok) {
      playbackData = await playbackResponse.json();
    }

    // Get currently playing
    const nowPlayingResponse = await fetch(NOW_PLAYING_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    let song, isPlaying = false, progressMs = 0, shuffleState = false, repeatState = 'off';

    if (nowPlayingResponse.status === 204 || nowPlayingResponse.status >= 400) {
      // Get recently played if nothing is currently playing
      const recentResponse = await fetch(RECENTLY_PLAYED_ENDPOINT, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      
      if (recentResponse.ok) {
        const recentData = await recentResponse.json();
        song = recentData.items?.[0]?.track;
        isPlaying = false;
      }
    } else {
      const nowPlayingData = await nowPlayingResponse.json();
      song = nowPlayingData.item;
      isPlaying = nowPlayingData.is_playing;
      progressMs = nowPlayingData.progress_ms || 0;
      shuffleState = playbackData?.shuffle_state || false;
      repeatState = playbackData?.repeat_state || 'off';
    }

    if (!song) {
      return res.status(200).json({ 
        error: 'No track found',
        isPlaying: false,
        hasActiveDevice: !!playbackData?.device?.is_active
      });
    }

    // Extract additional track information
    const trackFeatures = {
      name: song.name,
      artist: song.artists?.map(a => ({ 
        name: a.name, 
        id: a.id, 
        url: a.external_urls?.spotify 
      })),
      album: {
        name: song.album?.name,
        id: song.album?.id,
        type: song.album?.album_type,
        releaseDate: song.album?.release_date,
        totalTracks: song.album?.total_tracks,
        url: song.album?.external_urls?.spotify,
        images: song.album?.images
      },
      duration: song.duration_ms,
      popularity: song.popularity,
      trackNumber: song.track_number,
      discNumber: song.disc_number,
      explicit: song.explicit,
      isLocal: song.is_local,
      previewUrl: song.preview_url,
      urls: {
        track: song.external_urls?.spotify,
        album: song.album?.external_urls?.spotify,
        artist: song.artists?.[0]?.external_urls?.spotify
      },
      playback: {
        isPlaying: isPlaying,
        progressMs: progressMs,
        shuffleState: shuffleState,
        repeatState: repeatState,
        device: playbackData?.device ? {
          name: playbackData.device.name,
          type: playbackData.device.type,
          volumePercent: playbackData.device.volume_percent,
          isActive: playbackData.device.is_active
        } : null
      },
      timestamps: {
        current: new Date().toISOString(),
        playedAt: isPlaying ? null : new Date().toISOString()
      }
    };

    res.setHeader('Cache-Control', 'public, max-age=10');
    return res.status(200).json(trackFeatures);

  } catch (error) {
    console.error('Spotify API error:', error);
    return res.status(500).json({ 
      error: 'Spotify API Error',
      message: error.message
    });
  }
}
