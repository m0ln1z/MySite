function getRandomPosition(rectangle, size) {
  const edge = Math.floor(Math.random() * 4);
  const max_x = rectangle.clientWidth - size;
  const max_y = rectangle.clientHeight - size;
  const offset = size * 2;

  switch (edge) {
    case 0:
      return {
        x: Math.floor(Math.random() * max_x),
        y: -offset,
      };
    case 1:
      return {
        x: rectangle.clientWidth + offset,
        y: Math.floor(Math.random() * max_y),
      };
    case 2:
      return {
        x: Math.floor(Math.random() * max_x),
        y: rectangle.clientHeight + offset,
      };
    case 3:
    default:
      return {
        x: -offset,
        y: Math.floor(Math.random() * max_y),
      };
  }
}

function createRandomCircle(rectangleElement) {
  const rectangle = rectangleElement;
  const circle = document.createElement("div");
  const size = Math.floor(Math.random() * 100) + 10;
  const position = getRandomPosition(rectangle, size);
  const duration = 5 + Math.random() * 5;
  const finalPosition = getRandomPosition(rectangle, size);

  circle.style.width = `${size}px`;
  circle.style.height = `${size}px`;
  circle.style.left = `${position.x}px`;
  circle.style.top = `${position.y}px`;
  circle.style.backgroundColor = "rgba(255, 0, 255, 1)";
  circle.style.position = "absolute";
  circle.style.borderRadius = "50%";
  circle.style.filter = "blur(50px)";
  circle.style.zIndex = "-1";

  const animation = circle.animate(
    [
      { left: `${position.x}px`, top: `${position.y}px` },
      { left: `${finalPosition.x}px`, top: `${finalPosition.y}px` },
    ],
    {
      duration: duration * 1000,
      iterations: 1,
      easing: "linear",
    }
  );

  animation.onfinish = () => {
    circle.remove();
    createRandomCircle(rectangleElement);
  };

  rectangle.appendChild(circle);
}

function createRandomCircles(rectangleElement) {
  const numberOfCircles = Math.floor(Math.random() * 10) + 1;

  for (let i = 0; i < numberOfCircles; i++) {
    createRandomCircle(rectangleElement);
  }
}

const rectangleElement = document.querySelector(".rectangle");
const rectangle2Element = document.querySelector(".rectangle-right");

// Only create animated circles on desktop for better mobile performance
if (!isMobile()) {
  createRandomCircles(rectangleElement);
  createRandomCircles(rectangle2Element);
}

document.addEventListener("DOMContentLoaded", function () {
  const videoFiles = [
    "media/video1.mp4",
    "media/video2.mp4",
    "media/video3.mp4",
    "media/video4.mp4",
    "media/video5.mp4",
    "media/video6.mp4",
  ];

  const randomIndex = Math.floor(Math.random() * videoFiles.length);
  const randomVideoFile = videoFiles[randomIndex];

  const videoElement = document.querySelector(".background-video video");
  const sourceElement = document.createElement("source");

  sourceElement.setAttribute("src", randomVideoFile);
  sourceElement.setAttribute("type", "video/mp4");

  videoElement.appendChild(sourceElement);
  videoElement.load();

  // Prevent video interactions on mobile
  if (isMobile()) {
    videoElement.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });

    videoElement.addEventListener('touchstart', function(e) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });

    videoElement.addEventListener('touchend', function(e) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });

    videoElement.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      return false;
    });

    // Disable video controls completely
    videoElement.removeAttribute('controls');
    videoElement.setAttribute('disablepictureinpicture', 'true');
    videoElement.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback');
  }
});

const expandButton = document.getElementById('expand-button');
const arrow = expandButton.querySelector('.arrow');
const container = document.querySelector('.container');
const rectangleRight = document.querySelector('.rectangle-right');
const rectangleButton = document.querySelector('.rectangle-button');

let expanded = false;

function isMobile() {
  return window.innerWidth <= 768;
}

expandButton.addEventListener('click', () => {
  // Disable expansion on mobile devices
  if (isMobile()) {
    return;
  }
  
  expanded = !expanded;
  arrow.classList.toggle('rotate');
  container.classList.toggle('move-left');
  rectangleRight.classList.toggle('show');
  rectangleButton.classList.toggle('move-right');
});

// Handle window resize for mobile/desktop transitions
window.addEventListener('resize', () => {
  if (isMobile()) {
    // Reset all desktop animations on mobile
    arrow.classList.remove('rotate');
    container.classList.remove('move-left');
    rectangleRight.classList.remove('show');
    rectangleButton.classList.remove('move-right');
    expanded = false;
  }
});

// Prevent zoom and scrolling on mobile devices
if (isMobile()) {
  // Prevent pinch zoom
  document.addEventListener('gesturestart', function (e) {
    e.preventDefault();
  });

  document.addEventListener('gesturechange', function (e) {
    e.preventDefault();
  });

  document.addEventListener('gestureend', function (e) {
    e.preventDefault();
  });

  // Prevent double-tap zoom
  let lastTouchEnd = 0;
  document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, false);

  // Prevent horizontal scrolling
  document.addEventListener('touchmove', function(e) {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  }, { passive: false });

  // Prevent context menu on long press
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
  });

  // Additional video protection for iOS Safari
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    document.addEventListener('touchstart', function(e) {
      if (e.target.tagName === 'VIDEO') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, { passive: false });

    document.addEventListener('touchmove', function(e) {
      if (e.target.tagName === 'VIDEO') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, { passive: false });
  }
}

// Spotify functionality
let currentTrackData = null;
let progressInterval = null;

function formatTime(milliseconds) {
  if (!milliseconds || isNaN(milliseconds)) return '0:00';
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function updateProgress(currentMs, totalMs, isPlaying) {
  const progressFill = document.getElementById('progress-fill');
  const currentTimeEl = document.getElementById('current-time');
  const totalTimeEl = document.getElementById('total-time');
  
  if (!progressFill || !currentTimeEl || !totalTimeEl) return;
  
  const progressPercent = totalMs > 0 ? (currentMs / totalMs) * 100 : 0;
  
  progressFill.style.width = `${Math.min(progressPercent, 100)}%`;
  currentTimeEl.textContent = formatTime(currentMs);
  totalTimeEl.textContent = formatTime(totalMs);
}

function startProgressUpdate(trackData) {
  if (progressInterval) {
    clearInterval(progressInterval);
  }
  
  if (!trackData?.playback?.isPlaying) return;
  
  let currentProgress = trackData.playback.progressMs || 0;
  const duration = trackData.duration || 0;
  const startTime = Date.now();
  
  progressInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const newProgress = currentProgress + elapsed;
    
    if (newProgress >= duration) {
      clearInterval(progressInterval);
      updateProgress(duration, duration, false);
      return;
    }
    
    updateProgress(newProgress, duration, true);
  }, 1000);
}

function updateSpotifyPlayer(data) {
  const albumImage = document.getElementById('spotify-album-image');
  const trackName = document.getElementById('spotify-track-name');
  const artistName = document.getElementById('spotify-artist-name');
  const albumName = document.getElementById('spotify-album-name');
  const playingAnimation = document.querySelector('.playing-animation');
  
  if (!albumImage || !trackName || !artistName || !albumName) return;
  
  if (data && !data.error) {
    // Update album cover
    const albumCover = data.album?.images?.[0]?.url || data.album?.images?.[1]?.url;
    if (albumCover) {
      albumImage.src = albumCover;
      albumImage.style.display = 'block';
    } else {
      albumImage.style.display = 'none';
    }
    
    // Update text info
    trackName.textContent = data.name || 'Unknown Track';
    artistName.textContent = data.artist?.map(a => a.name).join(', ') || 'Unknown Artist';
    albumName.textContent = data.album?.name || 'Unknown Album';
    
    // Update progress
    updateProgress(
      data.playback?.progressMs || 0,
      data.duration || 0,
      data.playback?.isPlaying || false
    );
    
    // Show/hide playing animation
    if (playingAnimation) {
      if (data.playback?.isPlaying) {
        playingAnimation.classList.add('active');
        startProgressUpdate(data);
      } else {
        playingAnimation.classList.remove('active');
        if (progressInterval) {
          clearInterval(progressInterval);
        }
      }
    }
  } else {
    // Error state
    trackName.textContent = 'No track playing';
    artistName.textContent = 'Connect to Spotify';
    albumName.textContent = '';
    albumImage.style.display = 'none';
    
    if (playingAnimation) {
      playingAnimation.classList.remove('active');
    }
    
    updateProgress(0, 0, false);
  }
}

async function fetchCurrentTrack() {
  try {
    const response = await fetch('/api/spotify-info');
    if (response.ok) {
      const data = await response.json();
      currentTrackData = data;
      updateSpotifyPlayer(data);
      return data;
    }
  } catch (error) {
    console.error('Error fetching Spotify data:', error);
    updateSpotifyPlayer({ error: 'Failed to load' });
  }
  return null;
}

async function openSpotifyTrack() {
  try {
    // Get current track data
    const data = currentTrackData || await fetchCurrentTrack();
    
    if (data && data.urls && data.urls.track) {
      window.open(data.urls.track, '_blank');
    } else {
      // Fallback to user's Spotify profile
      window.open('https://open.spotify.com/user/31u6tx77eczjuo4jw35v43k7cyvy', '_blank');
    }
  } catch (error) {
    console.error('Error opening Spotify:', error);
    // Fallback to user's Spotify profile
    window.open('https://open.spotify.com/user/31u6tx77eczjuo4jw35v43k7cyvy', '_blank');
  }
}

// Initialize Spotify data on page load
document.addEventListener('DOMContentLoaded', function() {
  fetchCurrentTrack();
});

// Refresh Spotify data every 15 seconds
setInterval(() => {
  fetchCurrentTrack();
}, 15000);
