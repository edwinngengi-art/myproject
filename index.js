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

// --- 2. NAVIGATION & TABS ---
// Function to clear results and go back to the featured home page
function goHome() {
    searchView.classList.add('hidden');
    homeView.classList.remove('hidden');
    userInput.value = "";
    scrollContainer.scrollTo(0, 0); // Scroll center back to top
}

document.getElementById('logo').addEventListener('click', goHome);
document.getElementById('nav-home').addEventListener('click', goHome);
document.getElementById('close-search').addEventListener('click', goHome);

// --- 3. SEARCH & FETCH LOGIC ---
searchForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevents page reload (SPA requirement)
    const query = userInput.value.trim();
    if (!query) return;

    homeView.classList.add('hidden');
    searchView.classList.remove('hidden');
    scrollContainer.scrollTo(0, 0);

    try {
        // Fetching 25 items so the user can scroll down
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=25`);
        const data = await res.json();

        resultsGrid.innerHTML = ""; // Clear existing cards

        if (data.results.length > 0) {
            renderAlbums(data.results);
        } else {
            document.getElementById('search-title').textContent = "No results found.";
        }
    } catch (err) {
        console.error("Fetch error:", err);
    }
});

// --- 4. DYNAMIC CARD CREATION ---
function renderAlbums(songs) {
    songs.forEach(song => {
        const card = document.createElement('div');
        card.className = "bg-zinc-900/60 p-4 rounded-xl hover:bg-zinc-800 transition cursor-pointer group shadow-lg border border-transparent hover:border-zinc-700";

        // Higher resolution images (400x400)
        const albumArt = song.artworkUrl100.replace('100x100', '400x400');

        card.innerHTML = `
            <div class="relative mb-4 aspect-square">
                <img src="${albumArt}" class="w-full h-full object-cover rounded-lg">
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <span class="bg-green-500 text-black p-3 rounded-full shadow-2xl">▶</span>
                </div>
            </div>
            <h4 class="font-bold truncate text-sm text-white">${song.trackName}</h4>
            <p class="text-xs text-zinc-500 truncate">${song.artistName}</p>
        `;

        // Click event to play this specific track
        card.addEventListener('click', () => playTrack(song));
        resultsGrid.appendChild(card);
    });
}

// --- 5. CORE AUDIO ENGINE & PROGRESS BAR ---

function playTrack(song) {
    musicPlayer.src = song.previewUrl;
    musicPlayer.play();
    
    // Update the Player Bar UI
    document.getElementById('p-title').textContent = song.trackName;
    document.getElementById('p-artist').textContent = song.artistName;
    document.getElementById('p-img').src = song.artworkUrl100;
    playIcon.textContent = "||"; // Change to pause bars
}

// Track Time Updates (fires every second while music plays)
musicPlayer.addEventListener('timeupdate', () => {
    if (musicPlayer.duration) {
        // 1. Update Progress Bar Thumb
        const progress = (musicPlayer.currentTime / musicPlayer.duration) * 100;
        seekSlider.value = progress;

        // 2. Update Current Time Text (e.g., 0:12)
        let curMins = Math.floor(musicPlayer.currentTime / 60);
        let curSecs = Math.floor(musicPlayer.currentTime % 60);
        timeCurrent.textContent = `${curMins}:${curSecs < 10 ? '0' : ''}${curSecs}`;

        // 3. Update Total Duration Text
        let totMins = Math.floor(musicPlayer.duration / 60);
        let totSecs = Math.floor(musicPlayer.duration % 60);
        timeTotal.textContent = `${totMins}:${totSecs < 10 ? '0' : ''}${totSecs}`;
    }
});

// Scrubbing: Jump to a specific part of the song
seekSlider.addEventListener('input', () => {
    const seekTo = (seekSlider.value / 100) * musicPlayer.duration;
    musicPlayer.currentTime = seekTo;
});

// --- 6. VOLUME CONTROL ---
volumeSlider.addEventListener('input', () => {
    // Volume expects a value between 0.0 and 1.0
    musicPlayer.volume = volumeSlider.value;
});

// Play/Pause Toggle
mainPlayBtn.addEventListener('click', () => {
    if (musicPlayer.paused) {
        musicPlayer.play();
        playIcon.textContent = "||";
    } else {
        musicPlayer.pause();
        playIcon.textContent = "▶";
    }
});

// Reset UI when song ends
musicPlayer.addEventListener('ended', () => {
    playIcon.textContent = "▶";
    seekSlider.value = 0;
}); 