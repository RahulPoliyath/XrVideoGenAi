# vidgen_backend.py

import asyncio
import os
import uuid
from datetime import datetime
from typing import List, Dict, Optional
import json

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

# Ensure MoviePy finds ffmpeg on Linux containers (Render/Debian path)
os.environ.setdefault("FFMPEG_BINARY", "/usr/bin/ffmpeg")  # Required for server encoding [3][4]

# TTS and Video Generation Imports
try:
    from gtts import gTTS  # online TTS, reliable on headless servers [5][6]
    import pyttsx3          # offline fallback; can be flaky headless but supports save_to_file [5][6]
except ImportError:
    print("TTS libraries not installed. Install with: pip install gtts pyttsx3")  # [5]

try:
    from moviepy.editor import ImageClip, concatenate_videoclips, AudioFileClip, concatenate_audioclips
    from PIL import Image, ImageDraw, ImageFont
    import numpy as np
except ImportError:
    print("Video libraries not installed. Install with: pip install moviepy opencv-python pillow")  # [7]

# ---------- Models ----------

class VideoRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000, description="Text to convert to video")
    duration: int = Field(30, ge=15, le=180, description="Video duration in seconds")
    voice: str = Field("female_1", description="Voice selection")
    style: str = Field("modern", description="Video style template")
    background_music: bool = Field(False, description="Include background music")  # placeholder toggle [8]

class VideoResponse(BaseModel):
    video_id: str
    status: str
    progress: int
    message: str
    video_url: Optional[str] = None
    download_url: Optional[str] = None

# ---------- WebSocket Manager ----------

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.video_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, video_id: Optional[str] = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        if video_id:
            self.video_connections.setdefault(video_id, []).append(websocket)

    def disconnect(self, websocket: WebSocket, video_id: Optional[str] = None):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if video_id and video_id in self.video_connections:
            if websocket in self.video_connections[video_id]:
                self.video_connections[video_id].remove(websocket)

    async def send_progress(self, video_id: str, progress_ dict):
        if video_id not in self.video_connections:
            return
        message = json.dumps(progress_data)
        stale = []
        for ws in self.video_connections[video_id]:
            try:
                await ws.send_text(message)
            except Exception:
                stale.append(ws)
        for ws in stale:
            if ws in self.video_connections[video_id]:
                self.video_connections[video_id].remove(ws)

# ---------- Video Service ----------

class VideoGenerationService:
    def __init__(self):
        self.output_dir = "generated_videos"
        self.temp_dir = "temp"
        os.makedirs(self.output_dir, exist_ok=True)
        os.makedirs(self.temp_dir, exist_ok=True)

    async def generate_tts_audio(self, text: str, voice: str, out_mp3: str) -> str:
        """
        Prefer gTTS (MP3) on servers; fallback to pyttsx3 (WAV) for offline. Returns path to audio file. [5][6]
        """
        # Try gTTS first (network required)
        try:
            lang = "en"
            if "british" in voice.lower():
                lang = "en"  # gTTS doesn’t use en-uk, accents vary; keep en for stability [5]
            tts = gTTS(text=text, lang=lang, slow=False)
            tts.save(out_mp3)
            return out_mp3
        except Exception as e:
            print(f"gTTS failed, falling back to pyttsx3: {e}")  # [5][6]

        # Fallback: pyttsx3 to WAV (more reliable headless than MP3) [6]
        try:
            wav_path = out_mp3.rsplit(".", 1) + ".wav"
            engine = pyttsx3.init()
            # Attempt basic voice selection by name hints
            try:
                voices = engine.getProperty("voices")
                if voices:
                    pick = None
                    if "female" in voice.lower():
                        pick = next((v for v in voices if "female" in v.name.lower() or "zira" in v.name.lower()), None)
                    else:
                        pick = next((v for v in voices if "male" in v.name.lower() or "david" in v.name.lower()), None)
                    if pick:
                        engine.setProperty("voice", pick.id)
            except Exception:
                pass
            engine.setProperty("rate", 180)
            engine.setProperty("volume", 0.9)
            engine.save_to_file(text, wav_path)
            engine.runAndWait()
            return wav_path
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"TTS generation failed: {str(e)}")  # fixed detail= [9]

    def create_text_slide(self, text: str, size: tuple = (1280, 720), style: str = "modern"):
        img = Image.new('RGB', size, color='black' if style in ('dark', 'creative') else 'white')  # simple theming [7]
        draw = ImageDraw.Draw(img)
        try:
            font = ImageFont.truetype("arial.ttf", 60)
        except Exception:
            font = ImageFont.load_default()
        color = 'white' if style in ('dark', 'creative') else 'black'
        # word wrap
        words, lines, line = text.split(), [], []
        for w in words:
            test = ' '.join(line + [w])
            bbox = draw.textbbox((0, 0), test, font=font)
            if bbox[10] - bbox <= size - 100:
                line.append(w)
            else:
                if line:
                    lines.append(' '.join(line))
                    line = [w]
                else:
                    lines.append(w)
        if line:
            lines.append(' '.join(line))
        total_h = len(lines) * 80
        y0 = max(40, (size[11] - total_h) // 2)
        for i, ln in enumerate(lines):
            bbox = draw.textbbox((0, 0), ln, font=font)
            w = bbox[10] - bbox
            x = (size - w) // 2
            y = y0 + i * 80
            draw.text((x, y), ln, fill=color, font=font)
        return np.array(img)

    async def create_slideshow_video(self, text: str, audio_path: Optional[str], style: str, duration: int):
        import re
        parts = [s.strip() for s in re.split(r'[.!?]+\s*', text) if s.strip()] or [text.strip()]  # robust split [9]
        slides = []
        for seg in parts:
            slides.append(self.create_text_slide(seg, style=style))
        # save temp pngs
        slide_paths = []
        for i, arr in enumerate(slides):
            p = os.path.join(self.temp_dir, f"slide_{i}.png")
            Image.fromarray(arr).save(p)
            slide_paths.append(p)
        per = max(0.1, duration / max(1, len(slide_paths)))
        clips = [ImageClip(p).set_duration(per) for p in slide_paths]
        video = concatenate_videoclips(clips, method="compose")
        # attach audio
        if audio_path and os.path.exists(audio_path):
            aud = AudioFileClip(audio_path)
            if aud.duration > duration:
                aud = aud.subclip(0, duration)
            elif aud.duration < duration:
                loops = int(duration / max(0.1, aud.duration)) + 1
                aud = concatenate_audioclips([aud] * loops).subclip(0, duration)
            video = video.set_audio(aud)
        return video

    async def generate_video(self, req: "VideoRequest", video_id: str, progress_cb=None):
        try:
            if progress_cb:
                await progress_cb(video_id, {"progress": 10, "stage": "Analyzing Text", "message": "Processing script"})  # [8]
            await asyncio.sleep(0.5)
            if progress_cb:
                await progress_cb(video_id, {"progress": 25, "stage": "Generating Audio", "message": "Text to speech"})  # [8]
            audio_mp3 = os.path.join(self.temp_dir, f"{video_id}.mp3")
            audio_path = await self.generate_tts_audio(req.text, req.voice, audio_mp3)
            if progress_cb:
                await progress_cb(video_id, {"progress": 50, "stage": "Creating Slideshow", "message": "Building slides"})  # [8]
            await asyncio.sleep(0.5)
            clip = await self.create_slideshow_video(req.text, audio_path, req.style, req.duration)
            if progress_cb:
                await progress_cb(video_id, {"progress": 85, "stage": "Finalizing Video", "message": "Rendering H.264"})  # [3]
            out_path = os.path.join(self.output_dir, f"{video_id}.mp4")
            clip.write_videofile(
                out_path,
                fps=24,
                codec="libx264",
                audio_codec="aac",
                temp_audiofile=os.path.join(self.temp_dir, f"{video_id}_temp_audio.m4a"),
                remove_temp=True,
                threads=2
            )
            # cleanup loose slide_*.png
            for f in list(os.listdir(self.temp_dir)):
                if f.startswith("slide_"):
                    try:
                        os.remove(os.path.join(self.temp_dir, f))
                    except Exception:
                        pass
            if progress_cb:
                await progress_cb(video_id, {"progress": 100, "stage": "Complete", "message": "Done", "video_url": f"/video/{video_id}"})
            return out_path
        except Exception as e:
            if progress_cb:
                await progress_cb(video_id, {"progress": 0, "stage": "Error", "message": f"Generation failed: {e}"})
            raise

# ---------- FastAPI App ----------

app = FastAPI(title="VidGen AI API", description="Text-to-Video Generation API", version="1.0.0")  # [1]

# CORS (tighten allow_origins in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # set to your frontend domain in prod [12]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

manager = ConnectionManager()
service = VideoGenerationService()
active_generations: Dict[str, dict] = {}

# Optional static (if placing assets under ./static)
if os.path.isdir("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")  # safe mount [1]

class VideoRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000)
    duration: int = Field(30, ge=15, le=180)
    voice: str = Field("female_1")
    style: str = Field("modern")
    background_music: bool = Field(False)

class VideoResponse(BaseModel):
    video_id: str
    status: str
    progress: int
    message: str
    video_url: Optional[str] = None
    download_url: Optional[str] = None

@app.get("/")
async def root():
    return {"message": "VidGen AI API is running", "version": "1.0.0"}  # [1]

@app.post("/api/generate-video", response_model=VideoResponse)
async def generate_video(request: VideoRequest, background_tasks: BackgroundTasks):
    vid = str(uuid.uuid4())
    active_generations[vid] = {"status": "processing", "progress": 0, "created_at": datetime.utcnow()}
    background_tasks.add_task(process_video_generation, vid, request)
    return VideoResponse(video_id=vid, status="processing", progress=0, message="Video generation started")  # [8]

async def process_video_generation(video_id: str, request: VideoRequest):
    async def progress_cb(vid: str,  dict):
        if vid in active_generations:
            active_generations[vid]["status"] = data.get("stage", active_generations[vid]["status"])
            active_generations[vid]["progress"] = data.get("progress", active_generations[vid]["progress"])
        await manager.send_progress(vid, data)
    try:
        out_path = await service.generate_video(request, video_id, progress_cb)
        if video_id in active_generations:
            active_generations[video_id]["status"] = "completed"
            active_generations[video_id]["output_path"] = out_path
    except Exception as e:
        if video_id in active_generations:
            active_generations[video_id]["status"] = "failed"
            active_generations[video_id]["error"] = str(e)

@app.get("/api/video/{video_id}/status")
async def get_status(video_id: str):
    if video_id not in active_generations:
        raise HTTPException(status_code=404, detail="Video not found")
    g = active_generations[video_id]
    return {"video_id": video_id, "status": g["status"], "progress": g["progress"], "created_at": g["created_at"]}  # [1]

@app.get("/api/video/{video_id}/download")
async def download(video_id: str):
    if video_id not in active_generations:
        raise HTTPException(status_code=404, detail="Video not found")
    g = active_generations[video_id]
    if g["status"] != "completed":
        raise HTTPException(status_code=400, detail="Video not ready")
    path = g.get("output_path")
    if not path or not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Video file not found")
    return FileResponse(path=path, filename=f"video_{video_id}.mp4", media_type="video/mp4")  # [1]

@app.websocket("/ws/{video_id}")
async def ws(websocket: WebSocket, video_id: str):
    await manager.connect(websocket, video_id)
    try:
        while True:
            _ = await websocket.receive_text()
            await websocket.send_text("ok")
    except WebSocketDisconnect:
        manager.disconnect(websocket, video_id)

@app.get("/api/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow()}  # [1]

# Local dev runner (Render will use Start Command with $PORT)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)  # For local only; Render will pass $PORT via start command [2]
