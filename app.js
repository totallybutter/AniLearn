const clockEl = document.getElementById('clock');
const greetEl = document.getElementById('greet');
const yearEl = document.getElementById('year');
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

const fileInput = document.getElementById('fileInput');
const dropzone = document.getElementById('dropzone');
const urlInput = document.getElementById('urlInput');
const playBtn = document.getElementById('playBtn');
const playerSection = document.getElementById('playerSection');
const video = document.getElementById('player');
const playerWrap = document.getElementById('playerWrap');
const videoTitle = document.getElementById('videoTitle');
const jpFile = document.getElementById('jpFile');
const enFile = document.getElementById('enFile');
const jpUrl = document.getElementById('jpUrl');
const enUrl = document.getElementById('enUrl');
const loadSubsBtn = document.getElementById('loadSubs');
const jpLine = document.getElementById('jpLine');
const enLine = document.getElementById('enLine');

let jpCues = null, enCues = null;

dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.background = 'rgba(255,255,255,0.08)'; });
dropzone.addEventListener('dragleave', () => { dropzone.style.background = 'rgba(255,255,255,0.04)'; });
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.style.background = 'rgba(255,255,255,0.04)';
  if (e.dataTransfer.files?.length) {
    fileInput.files = e.dataTransfer.files;
    handleFile(e.dataTransfer.files[0]);
  }
});
fileInput.addEventListener('change', (e) => {
  const f = e.target.files[0];
  if (f) handleFile(f);
});

document.addEventListener('dragover', (e) => {
  if (!playerSection.classList.contains('hidden')) {
    e.preventDefault();
    playerWrap.classList.add('dragover');
  }
});
document.addEventListener('dragleave', () => playerWrap.classList.remove('dragover'));
document.addEventListener('drop', (e) => {
  if (!playerSection.classList.contains('hidden')) {
    e.preventDefault();
    playerWrap.classList.remove('dragover');
    if (e.dataTransfer.files?.length) handleFile(e.dataTransfer.files[0]);
  }
});

playBtn.addEventListener('click', () => {
  const url = urlInput.value.trim();
  if (!url) return;
  localStorage.setItem('anilearn_last_url', url);
  loadVideo(url);
  setTitleFromUrl(url);
});
const last = localStorage.getItem('anilearn_last_url');
if (last) urlInput.value = last;

function handleFile(file) {
  const url = URL.createObjectURL(file);
  loadVideo(url, { objectURL:true });
  setTitle(file.name || 'Local video');
}
function isHls(u) { return /\.m3u8(\?.*)?$/.test(u); }
function setTitle(name) { videoTitle.textContent = name; }
function setTitleFromUrl(u) {
  try { const x = new URL(u); setTitle((x.pathname.split('/').pop() || x.host) + ''); }
  catch { setTitle(u); }
}
function showPlayerSection() { playerSection.classList.remove('hidden'); }

function loadVideo(src, opts={}) {
  showPlayerSection();
  jpLine.textContent = '—'; enLine.textContent = '—';
  video.pause(); video.removeAttribute('src'); video.load();
  if (window.Hls && Hls.isSupported() && isHls(src)) {
    const hls = new Hls({maxLiveSyncPlaybackRate: 1.5});
    hls.loadSource(src); hls.attachMedia(video);
    hls.on(Hls.Events.ERROR, (e, data) => {
      console.error('HLS error', data);
      alert('Could not play this HLS stream. Make sure the URL is direct and CORS-enabled.');
    });
  } else { video.src = src; }
  video.play().catch(()=>{});
}

async function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result); r.onerror = reject; r.readAsText(file, 'utf-8');
  });
}
async function fetchTextMaybe(url) {
  const res = await fetch(url); if(!res.ok) throw new Error('Failed to fetch: '+res.status); return await res.text();
}
async function loadSubs() {
  if (jpFile.files[0]) { jpCues = TinyVTT.parse(await readFileAsText(jpFile.files[0])); }
  else if (jpUrl.value.trim()) { jpCues = TinyVTT.parse(await fetchTextMaybe(jpUrl.value.trim())); }
  else { jpCues = null; }
  if (enFile.files[0]) { enCues = TinyVTT.parse(await readFileAsText(enFile.files[0])); }
  else if (enUrl.value.trim()) { enCues = TinyVTT.parse(await fetchTextMaybe(enUrl.value.trim())); }
  else { enCues = null; }
  if (!jpCues && !enCues) alert('No subtitles loaded. Provide at least one .vtt file or URL.');
}
loadSubsBtn.addEventListener('click', loadSubs);

function updateSubs() {
  const t = video.currentTime || 0;
  function getActive(cues){ if(!cues) return null; return cues.find(c => t >= c.start && t <= c.end) || null; }
  const jp = getActive(jpCues); const en = getActive(enCues);
  jpLine.textContent = jp ? jp.text : '—';
  enLine.textContent = en ? en.text : '—';
  requestAnimationFrame(updateSubs);
}
requestAnimationFrame(updateSubs);
