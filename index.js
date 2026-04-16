// --- 1. ELEMENT SELECTION ---
const searchForm = document.getElementById('search-form');
const userInput = document.getElementById('user-input');
const resultsGrid = document.getElementById('results-grid');
const searchView = document.getElementById('search-view');
const homeView = document.getElementById('home-view');
const scrollContainer = document.getElementById('scroll-container');

// Audio and Controls
const musicPlayer = new Audio();
const mainPlayBtn = document.getElementById('main-play-btn');
const playIcon = document.getElementById('play-icon');
const seekSlider = document.getElementById('seek-slider');
const volumeSlider = document.getElementById('volume-slider');
const timeCurrent = document.getElementById('time-current');
const timeTotal = document.getElementById('time-total');

// --- 2. NAVIGATION ---
function goHome() {
    searchView.classList.add('hidden');
    homeView.classList.remove('hidden');
    userInput.value = "";
    scrollContainer.scrollTo(0, 0);
}

document.getElementById('logo').addEventListener('click', goHome);
document.getElementById('nav-home').addEventListener('click', goHome);
document.getElementById('close-search').addEventListener('click', goHome);

// --- 3. SEARCH LOGIC (FIXED FOR PRODUCTION) ---
searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = userInput.value.trim();
    if (!query) return;

    // UI State Transition
    homeView.classList.add('hidden');
    searchView.classList.remove('hidden');
    scrollContainer.scrollTo(0, 0);
    document.getElementById('search-title').textContent = "Searching...";

    try {
        // FIXED: Explicitly use https:// and verify search endpoint
        // This prevents the net::ERR_CONNECTION_CLOSED and 404 errors
        const apiUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=25`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status}`);
        }
        
        const data = await response.json();
        resultsGrid.innerHTML = ""; 

        if (data.results && data.results.length > 0) {
            renderAlbums(data.results);
            document.getElementById('search-title').textContent = `Results for "${query}"`;
        } else {
            document.getElementById('search-title').textContent = "No results found.";
        }
    } catch (err) {
        console.error("Detailed Fetch error:", err);
        document.getElementById('search-title').textContent = "Connection Error. Please check your internet.";
    }
});

// --- 4. DYNAMIC CARD CREATION ---
function renderAlbums(songs) {
    songs.forEach(song => {
        const card = document.createElement('div');
        card.className = "bg-zinc-900/60 p-4 rounded-xl hover:bg-zinc-800 transition cursor-pointer group shadow-lg border border-transparent hover:border-zinc-700";

        // Upgrade artwork resolution from 100x100 to 400x400
        const albumArt = song.artworkUrl100.replace('100x100', '400x400');

        card.innerHTML = `
            <div class="relative mb-4 aspect-square">
                <img src="${albumArt}" class="w-full h-full object-cover rounded-lg" alt="${song.trackName}">
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <span class="bg-green-500 text-black p-3 rounded-full shadow-2xl">▶</span>
                </div>
            </div>
            <h4 class="font-bold truncate text-sm text-white">${song.trackName}</h4>
            <p class="text-xs text-zinc-500 truncate">${song.artistName}</p>
        `;

        card.addEventListener('click', () => playTrack(song));
        resultsGrid.appendChild(card);
    });
}

// --- 5. AUDIO ENGINE ---

function playTrack(song) {
    // Ensure the preview URL is also HTTPS to avoid "Mixed Content" blocks
    const secureUrl = song.previewUrl.replace('http://', 'https://');
    musicPlayer.src = secureUrl;
    
    musicPlayer.play().catch(error => {
        console.error("Playback failed (likely browser auto-play block):", error);
    });

    // Update Player Bar UI
    document.getElementById('p-title').textContent = song.trackName;
    document.getElementById('p-artist').textContent = song.artistName;
    document.getElementById('p-img').src = song.artworkUrl100.replace('100x100', '400x400');
    playIcon.textContent = "||"; 
}

// Update total time labels once metadata is available
musicPlayer.addEventListener('loadedmetadata', () => {
    timeTotal.textContent = formatTime(musicPlayer.duration);
});

// Sync Progress Slider and Timer
musicPlayer.addEventListener('timeupdate', () => {
    if (musicPlayer.duration) {
        const progress = (musicPlayer.currentTime / musicPlayer.duration) * 100;
        seekSlider.value = progress;
        timeCurrent.textContent = formatTime(musicPlayer.currentTime);
    }
});

// Scrubbing functionality
seekSlider.addEventListener('input', () => {
    if (!isNaN(musicPlayer.duration)) {
        const seekTo = (seekSlider.value / 100) * musicPlayer.duration;
        musicPlayer.currentTime = seekTo;
    }
});

// Volume Slider logic
volumeSlider.addEventListener('input', () => {
    musicPlayer.volume = volumeSlider.value;
});

// Utility: Format seconds into M:SS
function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Toggle Play/Pause Button
mainPlayBtn.addEventListener('click', () => {
    if (!musicPlayer.src) return;

    if (musicPlayer.paused) {
        musicPlayer.play();
        playIcon.textContent = "||";
    } else {
        musicPlayer.pause();
        playIcon.textContent = "▶";
    }
});

// Reset UI when track reaches the end
musicPlayer.addEventListener('ended', () => {
    playIcon.textContent = "▶";
    seekSlider.value = 0;
    timeCurrent.textContent = "0:00";
});