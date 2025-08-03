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

    // Get currently playing
    const nowPlayingResponse = await fetch(NOW_PLAYING_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    let song, isPlaying = false;

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
    }

    if (!song) {
      return res.status(200).json({ 
        error: 'No track found',
        trackUrl: null,
        albumUrl: null,
        artistUrl: null
      });
    }

    // Extract URLs and additional info
    const trackData = {
      name: song.name,
      artist: song.artists?.map(a => a.name).join(', '),
      album: song.album?.name,
      albumType: song.album?.album_type,
      releaseDate: song.album?.release_date,
      duration: song.duration_ms,
      popularity: song.popularity,
      trackNumber: song.track_number,
      totalTracks: song.album?.total_tracks,
      isPlaying: isPlaying,
      trackUrl: song.external_urls?.spotify,
      albumUrl: song.album?.external_urls?.spotify,
      artistUrl: song.artists?.[0]?.external_urls?.spotify,
      albumImage: song.album?.images?.[0]?.url,
      previewUrl: song.preview_url
    };

    res.setHeader('Cache-Control', 'public, max-age=30');
    return res.status(200).json(trackData);

  } catch (error) {
    console.error('Spotify API error:', error);
    return res.status(500).json({ 
      error: 'Spotify API Error',
      trackUrl: null,
      albumUrl: null,
      artistUrl: null
    });
  }
}
