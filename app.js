// Clock/greeting
const clockEl = document.getElementById('clock');
const greetEl = document.getElementById('greet');
const yearEl = document.getElementById('year');
function tick(){ const now=new Date(); clockEl.textContent=now.toLocaleTimeString([], {hour12:false}); yearEl.textContent=now.getFullYear(); const h=now.getHours(); greetEl.textContent = h<5?'Good Night':h<12?'Good Morning':h<18?'Good Afternoon':'Good Evening'; } tick(); setInterval(tick, 1000);

// Elements
const fileInput = document.getElementById('fileInput');
const dropzone = document.getElementById('dropzone');
const urlInput = document.getElementById('urlInput');
const playBtn = document.getElementById('playBtn');
const playerSection = document.getElementById('playerSection');
const video = document.getElementById('player');
const playerWrap = document.getElementById('playerWrap');
const videoTitle = document.getElementById('videoTitle');

const subsDrop = document.getElementById('subsDrop');
const subUrl1 = document.getElementById('subUrl1');
const subUrl2 = document.getElementById('subUrl2');
const loadSubsBtn = document.getElementById('loadSubs');
const extractBtn = document.getElementById('extractBtn');
const detectedInfo = document.getElementById('detectedInfo');

const jpLine = document.getElementById('jpLine');
const enLine = document.getElementById('enLine');

let jpCues = null, enCues = null;

// Helpers
function isHls(u){ return /\.m3u8(\?.*)?$/.test(u); }
function setTitle(name){ videoTitle.textContent = name; }
function setTitleFromUrl(u){ try{ const x = new URL(u); setTitle((x.pathname.split('/').pop()||x.host)+''); }catch{ setTitle(u); } }
function showPlayerSection(){ playerSection.classList.remove('hidden'); }

function loadVideo(src){
  showPlayerSection();
  jpLine.textContent='—'; enLine.textContent='—';
  video.pause(); video.removeAttribute('src'); video.load();
  if (window.Hls && Hls.isSupported() && isHls(src)) {
    const hls = new Hls({maxLiveSyncPlaybackRate: 1.5});
    hls.loadSource(src); hls.attachMedia(video);
    hls.on(Hls.Events.ERROR, (e,data)=>{ console.error('HLS error',data); alert('Could not play HLS. Ensure the URL is direct & CORS-enabled.'); });
  } else {
    video.src = src;
  }
  video.play().catch(()=>{});
}

// Video input
dropzone.addEventListener('click', ()=>fileInput.click());
dropzone.addEventListener('dragover', e=>{ e.preventDefault(); dropzone.style.background='rgba(255,255,255,0.08)'; });
dropzone.addEventListener('dragleave', ()=>dropzone.style.background='rgba(255,255,255,0.04)');
dropzone.addEventListener('drop', e=>{ e.preventDefault(); dropzone.style.background='rgba(255,255,255,0.04)'; if(e.dataTransfer.files?.length){ fileInput.files=e.dataTransfer.files; handleFile(e.dataTransfer.files[0]); } });
fileInput.addEventListener('change', e=>{ const f=e.target.files[0]; if(f) handleFile(f); });
function handleFile(file){ const url=URL.createObjectURL(file); loadVideo(url); setTitle(file.name||'Local video'); }
// Global drag to replace
document.addEventListener('dragover', e=>{ if(!playerSection.classList.contains('hidden')){ e.preventDefault(); playerWrap.classList.add('dragover'); }});
document.addEventListener('dragleave', ()=>playerWrap.classList.remove('dragover'));
document.addEventListener('drop', e=>{ if(!playerSection.classList.contains('hidden')){ e.preventDefault(); playerWrap.classList.remove('dragover'); if(e.dataTransfer.files?.length) handleFile(e.dataTransfer.files[0]); }});

playBtn.addEventListener('click', ()=>{ const url=urlInput.value.trim(); if(!url) return; localStorage.setItem('anilearn_last_url', url); loadVideo(url); setTitleFromUrl(url); });
const last = localStorage.getItem('anilearn_last_url'); if(last) urlInput.value=last;

// --- Subtitles ---
function countScriptScores(text){
  // Heuristic: score JP if many Hiragana/Katakana/Kanji; score EN for Latin letters.
  const jpRegex = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/g; // hira/kata/kanji
  const latinRegex = /[A-Za-z]/g;
  const jp = (text.match(jpRegex)||[]).length;
  const en = (text.match(latinRegex)||[]).length;
  return {jp, en};
}
function detectVttLanguage(cues){
  // Use first ~20 cues
  const sample = cues.slice(0, Math.min(20, cues.length)).map(c=>c.text).join('\n');
  const {jp, en} = countScriptScores(sample);
  if (jp > en*1.5) return 'jp';
  if (en > jp*1.5) return 'en';
  // fallback: if contains any JP chars at all, prefer jp
  if (jp > 0 && jp >= en) return 'jp';
  return 'en';
}
function attachByLang(cues, srcLabel){
  const lang = detectVttLanguage(cues);
  if (lang==='jp') { jpCues=cues; } else { enCues=cues; }
  return {lang};
}
async function fetchText(url){ const r=await fetch(url); if(!r.ok) throw new Error('Fetch failed'); return await r.text(); }
async function readFileAsText(file){ return await file.text(); }

async function loadVttFromUrl(url){ const text=await fetchText(url); return TinyVTT.parse(text); }
async function loadVttFromFile(file){ const text=await readFileAsText(file); return TinyVTT.parse(text); }

// Drag/drop VTTs
subsDrop.addEventListener('dragover', e=>{ e.preventDefault(); subsDrop.classList.add('hover'); });
subsDrop.addEventListener('dragleave', ()=>subsDrop.classList.remove('hover'));
subsDrop.addEventListener('drop', async (e)=>{
  e.preventDefault(); subsDrop.classList.remove('hover');
  const files = [...e.dataTransfer.files].filter(f=>f.name.toLowerCase().endsWith('.vtt'));
  detectedInfo.textContent = 'Loading '+files.length+' subtitle file(s)…';
  jpCues=null; enCues=null;
  for (const f of files){
    const cues = await loadVttFromFile(f);
    const {lang} = attachByLang(cues, f.name);
  }
  detectedInfo.textContent = 'Detect: '+(jpCues?'JP✓ ':'')+(enCues?'EN✓':'')+( (!jpCues && !enCues)?'None':'' );
});

// URLs + autodetect
loadSubsBtn.addEventListener('click', async ()=>{
  jpCues=null; enCues=null;
  const urls = [subUrl1.value.trim(), subUrl2.value.trim()].filter(Boolean);
  if (!urls.length) { alert('Provide at least one subtitle URL'); return; }
  detectedInfo.textContent = 'Loading subtitles…';
  for (const u of urls){
    const cues = await loadVttFromUrl(u);
    attachByLang(cues, u);
  }
  detectedInfo.textContent = 'Detect: '+(jpCues?'JP✓ ':'')+(enCues?'EN✓':'')+( (!jpCues && !enCues)?'None':'' );
});

// Experimental: ffmpeg.wasm extract embedded subs
let ffmpeg = null;
async function ensureFFmpeg(){
  if (ffmpeg) return ffmpeg;
  const { createFFmpeg, fetchFile } = await import('https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.6/dist/ffmpeg.min.js');
  ffmpeg = createFFmpeg({ log: true });
  await ffmpeg.load();
  return ffmpeg;
}
extractBtn.addEventListener('click', async ()=>{
  if (!video.src || video.src.startsWith('blob:')===false) {
    alert('For extraction, load a local file (drag a video) so the browser can read it.');
    return;
  }
  detectedInfo.textContent = 'Loading ffmpeg.wasm… (big download)';
  const ff = await ensureFFmpeg();
  detectedInfo.textContent = 'Reading video & probing…';
  // Fetch the original file from objectURL
  const res = await fetch(video.src); const buf = new Uint8Array(await res.arrayBuffer());
  ff.FS('writeFile', 'in.bin', buf);

  // Try to extract first subtitle as WebVTT. Many containers store subs as ASS/SRT—convert to VTT.
  try {
    await ff.run('-y','-i','in.bin','-map','0:s:0','out.vtt');
    const data = ff.FS('readFile','out.vtt');
    const text = new TextDecoder().decode(data);
    const cues = TinyVTT.parse(text);
    const {lang} = attachByLang(cues, 'embedded#0');
    detectedInfo.textContent = 'Embedded subs extracted ('+lang.toUpperCase()+')';
  } catch (e) {
    console.error(e);
    detectedInfo.textContent = 'No extractable embedded subtitles found (or format unsupported).';
  }
});

// Sync loop
function getActive(cues, t){ if(!cues) return null; return cues.find(c=>t>=c.start && t<=c.end)||null; }
function updateSubs(){
  const t = video.currentTime || 0;
  const jp = getActive(jpCues, t);
  const en = getActive(enCues, t);
  jpLine.textContent = jp ? jp.text : '—';
  enLine.textContent = en ? en.text : '—';
  requestAnimationFrame(updateSubs);
}
requestAnimationFrame(updateSubs);
