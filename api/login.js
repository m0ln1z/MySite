export default function handler(req, res) {
  const { code, error } = req.query;

  if (error) {
    return res.status(400).send(`
      <html>
        <body>
          <h1>Authorization Error</h1>
          <p>Error: ${error}</p>
          <a href="/">Go back to site</a>
        </body>
      </html>
    `);
  }

  if (code) {
    return res.status(200).send(`
      <html>
        <head>
          <title>Spotify Authorization</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .code { background: #f5f5f5; padding: 15px; border-radius: 5px; word-break: break-all; }
            .instructions { background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>✅ Authorization Successful!</h1>
          <p>Your authorization code:</p>
          <div class="code">${code}</div>
          
          <div class="instructions">
            <h3>Next steps:</h3>
            <p>1. Copy the code above</p>
            <p>2. Run this curl command in terminal:</p>
            <pre>curl -H "Authorization: Basic $(echo -n '197df50f5e5342088a935447f3412c52:2ba60498925b45e28d6108428c0d4118' | base64)" \\
-d grant_type=authorization_code \\
-d code=${code} \\
-d redirect_uri=https://m0ln1z.vercel.app/api/login \\
https://accounts.spotify.com/api/token</pre>
            <p>3. Copy the "refresh_token" from the response</p>
            <p>4. Add it to Vercel environment variables as SPOTIFY_REFRESH_TOKEN</p>
          </div>
          
          <a href="/">← Back to site</a>
        </body>
      </html>
    `);
  }

  return res.status(400).send(`
    <html>
      <head>
        <title>Spotify Authorization</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
          .auth-link { background: #1db954; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; margin: 20px 0; }
          .auth-link:hover { background: #1ed760; }
        </style>
      </head>
      <body>
        <h1>🎵 Spotify Authorization Required</h1>
        <p>Click the button below to authorize your Spotify account:</p>
        <a href="https://accounts.spotify.com/authorize?client_id=197df50f5e5342088a935447f3412c52&response_type=code&redirect_uri=https://m0ln1z.vercel.app/api/login&scope=user-read-currently-playing,user-read-recently-played,user-read-playback-state" class="auth-link">
          🔗 Authorize Spotify Access
        </a>
        <p><small>This will redirect you back here with an authorization code.</small></p>
        <a href="/">← Back to site</a>
      </body>
    </html>
  `);
}