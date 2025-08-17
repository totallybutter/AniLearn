# AniLearn v3 — Autodetect Subtitles

**What’s new**
- Auto-detects language (JP vs EN) for any `.vtt` you drop or load by URL and assigns lines automatically.
- Optional **Extract embedded subtitles** (MP4/MKV) via ffmpeg.wasm — loads on demand (~25–30 MB). Experimental.
- Player stays hidden until a video is loaded; title shown; drag & drop anywhere to replace.

**Accuracy**
- For `.vtt` files: JP vs EN detection uses a script heuristic (Hiragana/Katakana/Kanji vs Latin). In practice this is ~99% accurate for Japanese vs English when there’s more than a handful of characters.
- For embedded subs: if the container has correct language tags, we can trust them; if missing, the same heuristic applies after extraction.
- For **no-subtitle videos**: true auto-generation & translation would require an ASR/MT pipeline (e.g., Whisper for speech → text, then translation). That’s out of scope for this static build, but can be added via an API or a service worker with on-device models (heavy).

**Deploy**
Upload these files to your repo root and enable GitHub Pages (branch `main`, folder `/`).

**Usage**
1. Load a video (file or URL).
2. Drop `.vtt` files into the subtitle dropzone **or** paste up to two `.vtt` URLs and click **Auto-detect & load**.
3. (Optional) Click **Extract embedded subs** if you loaded a local file and want to try pulling tracks from it.
