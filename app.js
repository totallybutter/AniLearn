const clockEl = document.getElementById('clock');
const greetEl = document.getElementById('greet');
const yearEl = document.getElementById('year');
const fileInput = document.getElementById('fileInput');
const dropzone = document.getElementById('dropzone');
const urlInput = document.getElementById('urlInput');
const playBtn = document.getElementById('playBtn');
const video = document.getElementById('player');

function tick() {
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString([], {hour12:false});
  yearEl.textContent = now.getFullYear();
  const h = now.getHours();
  let g = 'Hello';
  if (h < 5) g = 'Good Night';
  else if (h < 12) g = 'Good Morning';
  else if (h < 18) g = 'Good Afternoon';
  else g = 'Good Evening';
  greetEl.textContent = g;
}
tick(); setInterval(tick, 1000);

dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.background = 'rgba(255,255,255,0.08)'; });
dropzone.addEventListener('dragleave', () => { dropzone.style.background = 'rgba(255,255,255,0.04)'; });
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.style.background = 'rgba(255,255,255,0.04)';
  if (e.dataTransfer.files?.length) {
    fileInput.files = e.dataTransfer.files;
    handleFile(fileInput.files[0]);
  }
});

fileInput.addEventListener('change', (e) => {
  const f = e.target.files[0];
  if (f) handleFile(f);
});

function handleFile(file) {
  const url = URL.createObjectURL(file);
  loadVideo(url, {objectURL:true});
}

playBtn.addEventListener('click', () => {
  const url = urlInput.value.trim();
  if (!url) return;
  localStorage.setItem('anilearn_last_url', url);
  loadVideo(url);
});

const last = localStorage.getItem('anilearn_last_url');
if (last) urlInput.value = last;

function isHls(u) { return /\.m3u8(\?.*)?$/.test(u); }

function loadVideo(src, opts={}) {
  video.pause();
  video.removeAttribute('src');
  video.load();

  if (window.Hls && Hls.isSupported() && isHls(src)) {
    const hls = new Hls({maxLiveSyncPlaybackRate: 1.5});
    hls.loadSource(src);
    hls.attachMedia(video);
    hls.on(Hls.Events.ERROR, (e, data) => {
      console.error('HLS error', data);
      alert('Could not play this HLS stream. Make sure the URL is direct and CORS-enabled.');
    });
  } else {
    video.src = src;
  }
  video.play().catch(()=>{});
}
