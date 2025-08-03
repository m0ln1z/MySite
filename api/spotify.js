export default async function handler(req, res) {
  const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
  const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    const errorSvg = `
      <svg width="500" height="130" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#dc2626"/>
            <stop offset="50%" style="stop-color:#991b1b"/>
            <stop offset="100%" style="stop-color:#7c1d1d"/>
          </linearGradient>
        </defs>
        <rect width="500" height="130" fill="url(#bg-gradient)" rx="15"/>
        <rect x="3" y="3" width="494" height="124" fill="#1f1f1f" rx="12"/>
        
        <rect x="15" y="15" width="100" height="100" fill="#dc2626" rx="10"/>
        <text x="65" y="75" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="32" font-weight="bold">⚙</text>
        
        <text x="135" y="50" text-anchor="start" fill="#ff6b6b" font-family="Arial, sans-serif" font-size="18" font-weight="bold">
          Configuration Error
        </text>
        <text x="135" y="75" text-anchor="start" fill="#ff9999" font-family="Arial, sans-serif" font-size="14">
          Missing Spotify credentials
        </text>
        
        <rect x="0" y="0" width="500" height="130" fill="none" stroke="#dc2626" stroke-width="2" rx="15"/>
      </svg>
    `;
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.status(200).send(errorSvg);
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
    console.log('Token response:', tokenData);

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

    console.log('Now playing status:', nowPlayingResponse.status);

    let song, isPlaying = false, recentResponse = null, progressMs = 0;

    if (nowPlayingResponse.status === 204 || nowPlayingResponse.status >= 400) {
      console.log('No current music, checking recently played...');
      // Get recently played if nothing is currently playing
      recentResponse = await fetch(RECENTLY_PLAYED_ENDPOINT, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      
      console.log('Recent played status:', recentResponse.status);
      
      if (recentResponse.ok) {
        const recentData = await recentResponse.json();
        console.log('Recent data:', JSON.stringify(recentData, null, 2));
        song = recentData.items?.[0]?.track;
        isPlaying = false;
        progressMs = 0;
      }
    } else {
      const nowPlayingData = await nowPlayingResponse.json();
      console.log('Now playing data:', JSON.stringify(nowPlayingData, null, 2));
      song = nowPlayingData.item;
      isPlaying = nowPlayingData.is_playing;
      progressMs = nowPlayingData.progress_ms || 0;
    }

    console.log('Final song:', song ? song.name : 'No song found');

    if (!song) {
      const debugInfo = `Now: ${nowPlayingResponse.status} | Recent: ${recentResponse ? recentResponse.status : 'N/A'}`;
        const noMusicSvg = `
        <svg width="500" height="130" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#374151"/>
              <stop offset="50%" style="stop-color:#4b5563"/>
              <stop offset="100%" style="stop-color:#6b7280"/>
            </linearGradient>
          </defs>
          <rect width="500" height="130" fill="url(#bg-gradient)" rx="15"/>
          <rect x="3" y="3" width="494" height="124" fill="#1f2937" rx="12"/>
          
          <!-- Default music icon -->
          <rect x="15" y="15" width="100" height="100" fill="#4b5563" rx="10"/>
          <text x="65" y="75" text-anchor="middle" fill="#9ca3af" font-family="Arial, sans-serif" font-size="32" font-weight="bold">♪</text>
          
          <text x="135" y="50" text-anchor="start" fill="#9ca3af" font-family="Arial" font-size="18" font-weight="bold">
            No music playing
          </text>
          <text x="135" y="75" text-anchor="start" fill="#6b7280" font-family="Arial" font-size="14">
            Play something on Spotify
          </text>
          
          <!-- Animated dots -->
          <g transform="translate(135, 90)">
            <circle cx="0" cy="0" r="2" fill="#6b7280">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite"/>
            </circle>
            <circle cx="8" cy="0" r="2" fill="#6b7280">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" begin="0.2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="16" cy="0" r="2" fill="#6b7280">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" begin="0.4s" repeatCount="indefinite"/>
            </circle>
          </g>
          
          <rect x="0" y="0" width="500" height="130" fill="none" stroke="#4b5563" stroke-width="2" rx="15"/>
        </svg>
      `;
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.status(200).send(noMusicSvg);
    }

    const title = song.name || 'Unknown';
    const artist = song.artists?.map(a => a.name).join(', ') || 'Unknown';
    const albumName = song.album?.name || 'Unknown Album';
    const albumType = song.album?.album_type || '';
    const releaseDate = song.album?.release_date || '';
    const year = releaseDate ? releaseDate.split('-')[0] : '';
    const duration = song.duration_ms ? Math.floor(song.duration_ms / 1000 / 60) + ':' + String(Math.floor((song.duration_ms / 1000) % 60)).padStart(2, '0') : '';
    const popularity = song.popularity || 0;
    const trackNumber = song.track_number || '';
    const totalTracks = song.album?.total_tracks || '';
    
    // External URLs for linking to Spotify
    const trackUrl = song.external_urls?.spotify || '';
    const albumUrl = song.album?.external_urls?.spotify || '';
    const artistUrl = song.artists?.[0]?.external_urls?.spotify || '';

    const albumImage = song.album?.images?.[0]?.url || '';
    
    const svg = `
      <svg width="500" height="130" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="rainbow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#ff0000"/>
            <stop offset="16.66%" style="stop-color:#ff8000"/>
            <stop offset="33.33%" style="stop-color:#ffff00"/>
            <stop offset="50%" style="stop-color:#00ff00"/>
            <stop offset="66.66%" style="stop-color:#0080ff"/>
            <stop offset="83.33%" style="stop-color:#8000ff"/>
            <stop offset="100%" style="stop-color:#ff0080"/>
          </linearGradient>
          <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1e3a8a"/>
            <stop offset="50%" style="stop-color:#7c3aed"/>
            <stop offset="100%" style="stop-color:#ec4899"/>
          </linearGradient>
          <linearGradient id="spotify-green" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#1db954"/>
            <stop offset="100%" style="stop-color:#1ed760"/>
          </linearGradient>
        </defs>
        
        <!-- Background with gradient -->
        <rect width="500" height="130" fill="url(#bg-gradient)" rx="15"/>
        <rect x="3" y="3" width="494" height="124" fill="#0d1117" rx="12"/>
        
        <!-- Album cover -->
        ${albumImage ? 
          `<image x="15" y="15" width="100" height="100" href="${albumImage}" rx="10" preserveAspectRatio="xMidYMid slice"/>` : 
          `<rect x="15" y="15" width="100" height="100" fill="url(#spotify-green)" rx="10"/>
           <text x="65" y="75" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="32" font-weight="bold">♪</text>`
        }
        
        <!-- Song info container -->
        <rect x="125" y="15" width="355" height="100" fill="none" rx="8"/>
        
        <!-- Status and song title -->
        <text x="135" y="40" fill="url(#rainbow)" font-family="Arial, sans-serif" font-size="13" font-weight="bold">
          ${isPlaying ? '🎵 Now Playing' : '⏸️ Recently Played'}
        </text>
        
        <!-- Song title with animation if too long -->
        <g>
          <clipPath id="titleClip">
            <rect x="135" y="50" width="340" height="25"/>
          </clipPath>
          <text clip-path="url(#titleClip)" x="135" y="70" fill="white" font-family="Arial, sans-serif" font-size="20" font-weight="bold">
            ${title}
            ${title.length > 25 ? `
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0,0; -${(title.length - 25) * 12},0; -${(title.length - 25) * 12},0; 0,0"
                dur="8s"
                repeatCount="indefinite"/>
            ` : ''}
          </text>
        </g>
        
        <!-- Artist -->
        <text x="135" y="90" fill="#b3b3b3" font-family="Arial, sans-serif" font-size="14">
          by ${artist.length > 35 ? artist.substring(0, 35) + '...' : artist}
        </text>
        
        <!-- Progress bar if playing -->
        ${isPlaying && song.duration_ms ? `
          <rect x="135" y="100" width="300" height="4" fill="#333" rx="2"/>
          <rect x="135" y="100" width="${Math.min(300, (progressMs / song.duration_ms) * 300)}" height="4" fill="url(#spotify-green)" rx="2"/>
          
          <!-- Time display -->
          <text x="445" y="108" fill="#888" font-family="Arial, sans-serif" font-size="10">
            ${Math.floor(progressMs / 1000 / 60)}:${String(Math.floor((progressMs / 1000) % 60)).padStart(2, '0')} / ${duration}
          </text>
        ` : ''}
        
        <!-- Music visualization when playing -->
        ${isPlaying ? `
          <g transform="translate(450, 25)">
            <rect x="0" y="10" width="3" height="10" fill="#1db954" rx="1.5">
              <animate attributeName="height" values="10;25;10" dur="1.2s" repeatCount="indefinite"/>
              <animate attributeName="y" values="10;2.5;10" dur="1.2s" repeatCount="indefinite"/>
            </rect>
            <rect x="5" y="8" width="3" height="14" fill="#1db954" rx="1.5">
              <animate attributeName="height" values="14;30;14" dur="1.1s" repeatCount="indefinite" begin="0.2s"/>
              <animate attributeName="y" values="8;0;8" dur="1.1s" repeatCount="indefinite" begin="0.2s"/>
            </rect>
            <rect x="10" y="12" width="3" height="6" fill="#1db954" rx="1.5">
              <animate attributeName="height" values="6;20;6" dur="1.3s" repeatCount="indefinite" begin="0.4s"/>
              <animate attributeName="y" values="12;5;12" dur="1.3s" repeatCount="indefinite" begin="0.4s"/>
            </rect>
            <rect x="15" y="5" width="3" height="20" fill="#1db954" rx="1.5">
              <animate attributeName="height" values="20;35;20" dur="1s" repeatCount="indefinite" begin="0.6s"/>
              <animate attributeName="y" values="5;-2.5;5" dur="1s" repeatCount="indefinite" begin="0.6s"/>
            </rect>
            <rect x="20" y="9" width="3" height="12" fill="#1db954" rx="1.5">
              <animate attributeName="height" values="12;28;12" dur="1.4s" repeatCount="indefinite" begin="0.8s"/>
              <animate attributeName="y" values="9;1;9" dur="1.4s" repeatCount="indefinite" begin="0.8s"/>
            </rect>
          </g>
        ` : `
          <!-- Static pause indicator -->
          <g transform="translate(460, 30)">
            <rect x="0" y="0" width="4" height="15" fill="#666" rx="2"/>
            <rect x="8" y="0" width="4" height="15" fill="#666" rx="2"/>
          </g>
        `}
        
        <!-- Border -->
        <rect x="0" y="0" width="500" height="130" fill="none" stroke="url(#rainbow)" stroke-width="3" rx="15"/>
      </svg>
    `;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.status(200).send(svg);

  } catch (error) {
    console.error('Spotify API error:', error);
    const errorSvg = `
      <svg width="500" height="130" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#dc2626"/>
            <stop offset="50%" style="stop-color:#991b1b"/>
            <stop offset="100%" style="stop-color:#7c1d1d"/>
          </linearGradient>
        </defs>
        <rect width="500" height="130" fill="url(#bg-gradient)" rx="15"/>
        <rect x="3" y="3" width="494" height="124" fill="#1f1f1f" rx="12"/>
        
        <rect x="15" y="15" width="100" height="100" fill="#dc2626" rx="10"/>
        <text x="65" y="75" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="32" font-weight="bold">⚠</text>
        
        <text x="135" y="50" text-anchor="start" fill="#ff6b6b" font-family="Arial, sans-serif" font-size="18" font-weight="bold">
          Connection Error
        </text>
        <text x="135" y="75" text-anchor="start" fill="#ff9999" font-family="Arial, sans-serif" font-size="14">
          Unable to connect to Spotify
        </text>
        
        <rect x="0" y="0" width="500" height="130" fill="none" stroke="#dc2626" stroke-width="2" rx="15"/>
      </svg>
    `;
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.status(200).send(errorSvg);
  }
}