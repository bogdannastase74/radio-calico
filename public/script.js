const streamUrl = 'https://d3d4yli4hf5bmh.cloudfront.net/hls/live.m3u8';
const metadataUrl = 'https://d3d4yli4hf5bmh.cloudfront.net/metadatav2.json';
const audioPlayer = document.getElementById('audioPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const timeDisplay = document.getElementById('timeDisplay');
const status = document.getElementById('status');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');

// Metadata elements
const trackTitle = document.getElementById('trackTitle');
const trackArtist = document.getElementById('trackArtist');
const trackAlbum = document.getElementById('trackAlbum');
const audioQualityText = document.getElementById('audioQualityText');
const sourceQuality = document.getElementById('sourceQuality');
const sampleRate = document.getElementById('sampleRate');
const yearBadge = document.getElementById('yearBadge');
const recentlyPlayed = document.getElementById('recentlyPlayed');
const albumArt = document.getElementById('albumArt');

// Rating elements
const thumbsUpBtn = document.getElementById('thumbsUpBtn');
const thumbsDownBtn = document.getElementById('thumbsDownBtn');
const thumbsUpCount = document.getElementById('thumbsUpCount');
const thumbsDownCount = document.getElementById('thumbsDownCount');

let hls = null;
let isPlaying = false;
let streamStartTime = 0;
let currentSongId = '';
let currentStreamQuality = 'Loading...';
let sourceMetadataQuality = '';

// Create browser fingerprint including IP address
async function generateFingerprint() {
  // Fetch user's IP address from server
  let userIp = '';
  try {
    const ipResponse = await fetch('/api/client-ip');
    const ipData = await ipResponse.json();
    userIp = ipData.ip || '';
  } catch (error) {
    console.error('Failed to fetch IP:', error);
  }

  // Collect browser characteristics
  const components = [
    userIp,
    navigator.userAgent,
    navigator.language,
    navigator.platform,
    navigator.hardwareConcurrency || 0,
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    !!window.sessionStorage,
    !!window.localStorage,
    navigator.plugins.length,
    navigator.cookieEnabled
  ];

  // Create a string from all components
  const fingerprintString = components.join('|');

  // Hash the fingerprint using a simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprintString.length; i++) {
    const char = fingerprintString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert to positive hex string
  return 'fp_' + Math.abs(hash).toString(16);
}

// Get or create unique user ID based on browser fingerprint + IP
async function getUserId() {
  let userId = localStorage.getItem('radioCalico_userId');
  if (!userId) {
    userId = await generateFingerprint();
    localStorage.setItem('radioCalico_userId', userId);
  }
  return userId;
}

// Generate song ID from artist and title
function getSongId(artist, title) {
  return `${artist}_${title}`.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
}

// Fetch ratings for current song
async function fetchRatings(songId) {
  try {
    const response = await fetch(`/api/ratings/${encodeURIComponent(songId)}`);
    const data = await response.json();
    thumbsUpCount.textContent = data.thumbsUp;
    thumbsDownCount.textContent = data.thumbsDown;
  } catch (error) {
    console.error('Failed to fetch ratings:', error);
  }
}

// Check if user has rated this song
async function checkUserRating(songId) {
  try {
    const userId = await getUserId();
    const response = await fetch(`/api/ratings/${encodeURIComponent(songId)}/user/${encodeURIComponent(userId)}`);
    const data = await response.json();

    // Reset button states
    thumbsUpBtn.classList.remove('active');
    thumbsDownBtn.classList.remove('active');
    thumbsUpBtn.disabled = false;
    thumbsDownBtn.disabled = false;

    if (data.hasRated) {
      // Mark which button was clicked and disable both
      if (data.rating === 1) {
        thumbsUpBtn.classList.add('active');
      } else {
        thumbsDownBtn.classList.add('active');
      }
      thumbsUpBtn.disabled = true;
      thumbsDownBtn.disabled = true;
    }
  } catch (error) {
    console.error('Failed to check user rating:', error);
  }
}

// Submit rating
async function submitRating(rating) {
  try {
    const userId = await getUserId();
    const response = await fetch('/api/ratings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        songId: currentSongId,
        userId: userId,
        rating: rating
      })
    });

    const data = await response.json();

    if (response.ok) {
      // Update counts
      thumbsUpCount.textContent = data.thumbsUp;
      thumbsDownCount.textContent = data.thumbsDown;

      // Mark active button and disable both
      if (rating === 1) {
        thumbsUpBtn.classList.add('active');
      } else {
        thumbsDownBtn.classList.add('active');
      }
      thumbsUpBtn.disabled = true;
      thumbsDownBtn.disabled = true;
    } else if (response.status === 409) {
      // Already rated
      alert('You have already rated this song!');
      await checkUserRating(currentSongId);
    } else {
      console.error('Failed to submit rating:', data.error);
    }
  } catch (error) {
    console.error('Failed to submit rating:', error);
  }
}

// Update audio quality display based on detected stream quality
function updateAudioQualityDisplay() {
  if (currentStreamQuality !== 'Loading...') {
    audioQualityText.textContent = `Current stream: ${currentStreamQuality}`;
  } else if (sourceMetadataQuality) {
    audioQualityText.textContent = `Source quality: ${sourceMetadataQuality}`;
  } else {
    audioQualityText.textContent = 'Current audio quality';
  }
}

// Fetch and update metadata
let lastTrackTitle = '';
async function updateMetadata() {
  try {
    const response = await fetch(metadataUrl);
    const data = await response.json();

    // Update now playing
    trackArtist.textContent = data.artist || 'Unknown Artist';
    trackTitle.textContent = data.title ? `${data.title} (${data.date || ''})`.trim() : 'Unknown Track';
    trackAlbum.textContent = data.album || '';

    // Update year badge
    if (data.date) {
      yearBadge.textContent = data.date;
    }

    // Update album art and ratings if track changed
    if (data.title !== lastTrackTitle) {
      lastTrackTitle = data.title;
      // Add timestamp to force reload of album art
      albumArt.src = `https://d3d4yli4hf5bmh.cloudfront.net/cover.jpg?t=${Date.now()}`;

      // Update song ID and fetch ratings
      currentSongId = getSongId(data.artist || 'Unknown', data.title || 'Unknown');
      await fetchRatings(currentSongId);
      await checkUserRating(currentSongId);
    }

    // Update source audio quality metadata
    if (data.bit_depth && data.sample_rate) {
      const sampleRateKHz = (data.sample_rate / 1000).toFixed(1);
      sourceMetadataQuality = `${data.bit_depth}-bit FLAC / ${sampleRateKHz} kHz`;
      sourceQuality.textContent = `Lossless quality: ${data.bit_depth}-bit FLAC`;
      sampleRate.textContent = `Sample rate: ${sampleRateKHz} kHz`;
      // Update display with current stream quality
      updateAudioQualityDisplay();
    }

    // Update recently played
    const recentTracks = [];
    for (let i = 1; i <= 5; i++) {
      if (data[`prev_artist_${i}`] && data[`prev_title_${i}`]) {
        recentTracks.push({
          artist: data[`prev_artist_${i}`],
          title: data[`prev_title_${i}`]
        });
      }
    }

    if (recentTracks.length > 0) {
      recentlyPlayed.innerHTML = recentTracks.map(track => `
        <li class="track-item"><span class="track-item-artist">${track.artist}</span> - <span class="track-item-title">${track.title}</span></li>
      `).join('');
    }
  } catch (error) {
    console.error('Failed to fetch metadata:', error);
  }
}

// Initialize HLS
function initPlayer() {
  if (Hls.isSupported()) {
    hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 90
    });

    hls.loadSource(streamUrl);
    hls.attachMedia(audioPlayer);

    hls.on(Hls.Events.MANIFEST_PARSED, function() {
      console.log('Stream manifest loaded successfully');
      updateStatus('Ready to play', 'stopped');

      // Log available quality levels
      if (hls.levels && hls.levels.length > 0) {
        console.log('Available quality levels:', hls.levels);
      }
    });

    // Detect quality level changes
    hls.on(Hls.Events.LEVEL_SWITCHED, function(event, data) {
      const level = hls.levels[data.level];
      if (level) {
        console.log('Quality level switched:', level);

        // Determine quality based on bitrate
        // FLAC is typically much higher bitrate than MP3
        // Assuming FLAC will be > 500 kbps and MP3 will be around 192 kbps
        if (level.bitrate && level.bitrate > 500000) {
          currentStreamQuality = '48 kHz FLAC/lossless';
        } else if (level.bitrate) {
          const kbps = Math.round(level.bitrate / 1000);
          currentStreamQuality = `${kbps} kbps VBR MP3`;
        } else {
          // Fallback: try to detect from codec info
          if (level.videoCodec || level.audioCodec) {
            const codec = level.audioCodec || '';
            if (codec.includes('flac')) {
              currentStreamQuality = '48 kHz FLAC/lossless';
            } else if (codec.includes('mp3') || codec.includes('mp4a')) {
              currentStreamQuality = '192 kbps VBR MP3';
            }
          }
        }

        updateAudioQualityDisplay();
      }
    });

    hls.on(Hls.Events.ERROR, function(event, data) {
      console.error('HLS error:', data);
      if (data.fatal) {
        switch(data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            updateStatus('Network error - attempting to recover...', 'error');
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            updateStatus('Media error - attempting to recover...', 'error');
            hls.recoverMediaError();
            break;
          default:
            updateStatus('Fatal error - unable to play stream', 'error');
            destroyPlayer();
            break;
        }
      }
    });
  } else if (audioPlayer.canPlayType('application/vnd.apple.mpegurl')) {
    // For Safari which has native HLS support
    audioPlayer.src = streamUrl;
    updateStatus('Ready to play (native HLS)', 'stopped');
  } else {
    updateStatus('HLS is not supported in your browser', 'error');
    playPauseBtn.disabled = true;
  }
}

// Update status display
function updateStatus(message, statusType) {
  status.textContent = message;
  status.className = `status ${statusType}`;
}

// Format time display (minutes:seconds)
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Update time display
function updateTimeDisplay() {
  if (isPlaying) {
    const elapsed = Math.floor((Date.now() - streamStartTime) / 1000);
    timeDisplay.textContent = formatTime(elapsed);
  }
}

// Play/Pause toggle
playPauseBtn.addEventListener('click', async function() {
  if (!isPlaying) {
    try {
      updateStatus('Loading stream...', 'loading');
      streamStartTime = Date.now();
      await audioPlayer.play();
    } catch (error) {
      console.error('Play error:', error);
      updateStatus('Failed to play - ' + error.message, 'error');
    }
  } else {
    audioPlayer.pause();
  }
});

// Volume control
volumeSlider.addEventListener('input', function() {
  const volume = this.value / 100;
  audioPlayer.volume = volume;
  volumeValue.textContent = this.value + '%';
});

// Set initial volume
audioPlayer.volume = 0.7;

// Rating button event listeners
thumbsUpBtn.addEventListener('click', function() {
  if (!thumbsUpBtn.disabled) {
    submitRating(1);
  }
});

thumbsDownBtn.addEventListener('click', function() {
  if (!thumbsDownBtn.disabled) {
    submitRating(0);
  }
});

// Start time update interval
setInterval(updateTimeDisplay, 1000);

// Audio events
audioPlayer.addEventListener('playing', function() {
  isPlaying = true;
  playPauseBtn.textContent = '⏸';
  updateStatus('🎵 Playing live stream', 'playing');
});

audioPlayer.addEventListener('pause', function() {
  isPlaying = false;
  playPauseBtn.textContent = '▶';
  updateStatus('Paused', 'stopped');
});

audioPlayer.addEventListener('waiting', function() {
  updateStatus('Buffering...', 'loading');
});

audioPlayer.addEventListener('canplay', function() {
  if (!audioPlayer.paused) {
    updateStatus('🎵 Playing live stream', 'playing');
  }
});

// Cleanup function
function destroyPlayer() {
  if (hls) {
    hls.destroy();
    hls = null;
  }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', function() {
  initPlayer();
  updateMetadata();
  // Update metadata every 10 seconds
  setInterval(updateMetadata, 10000);
});

// Cleanup on unload
window.addEventListener('beforeunload', destroyPlayer);
