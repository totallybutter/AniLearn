# AniLearn Landing v2

- Player hidden until a video is loaded.
- Video title shown above the player (file name or URL path).
- Replace the current video by dragging & dropping a new one anywhere.
- Subtitle panel under the player; supports two .vtt files: Japanese + English.
- Accept subtitles via file or URL; cues are synced to the video.

**Note on translation**: This build does *not* auto-translate on the client. For now, provide an English .vtt. We can later wire a translation API (e.g., DeepL/LibreTranslate) or add a tokenizer + dictionary for per-word glosses.
