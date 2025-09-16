
# main.py - FastAPI Backend for Text-to-Video Generation

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import asyncio
import uuid
import json
import os
import tempfile
from datetime import datetime
import logging

# Import video generation libraries
try:
    from moviepy.editor import *
    import moviepy.config as conf
    from gtts import gTTS
    import pyttsx3
    from PIL import Image, ImageDraw, ImageFont
    import numpy as np
except ImportError as e:
    print(f"Missing dependency: {e}")
    print("Install with: pip install moviepy gtts pyttsx3 pillow numpy")

app = FastAPI(
    title="VideoGen AI API",
    description="Professional Text-to-Video Generation API",
    version="1.0.0"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Data models
class VideoRequest(BaseModel):
    text: str
    duration: int = 30  # seconds
    voice_type: str = "female-natural"
    template: str = "modern"
    color_scheme: str = "blue-gradient"
    font_family: str = "roboto"
    speech_speed: str = "normal"

class VideoResponse(BaseModel):
    video_id: str
    status: str
    progress: int
    current_step: str
    video_url: Optional[str] = None
    duration: Optional[int] = None
    file_size: Optional[int] = None
    created_at: str

# In-memory storage (use database in production)
video_jobs = {}
active_websockets = []

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()

# Video generation functions
class VideoGenerator:
    def __init__(self):
        self.temp_dir = tempfile.gettempdir()

    def generate_audio(self, text: str, voice_type: str, speech_speed: str) -> str:
        """Generate TTS audio from text"""
        try:
            # Use gTTS for online generation (fallback to pyttsx3 for offline)
            audio_file = os.path.join(self.temp_dir, f"audio_{uuid.uuid4()}.mp3")

            # Determine speech rate
            slow = speech_speed == "slow"

            tts = gTTS(text=text, lang='en', slow=slow)
            tts.save(audio_file)

            return audio_file

        except Exception as e:
            logger.error(f"Audio generation failed: {e}")
            # Fallback to pyttsx3
            return self.generate_audio_offline(text, voice_type, speech_speed)

    def generate_audio_offline(self, text: str, voice_type: str, speech_speed: str) -> str:
        """Offline TTS fallback using pyttsx3"""
        try:
            engine = pyttsx3.init()

            # Configure voice
            voices = engine.getProperty('voices')
            if voices:
                if 'female' in voice_type and len(voices) > 1:
                    engine.setProperty('voice', voices[1].id)
                else:
                    engine.setProperty('voice', voices[0].id)

            # Configure speech rate
            rate = engine.getProperty('rate')
            if speech_speed == "slow":
                engine.setProperty('rate', rate - 50)
            elif speech_speed == "fast":
                engine.setProperty('rate', rate + 50)

            audio_file = os.path.join(self.temp_dir, f"audio_{uuid.uuid4()}.wav")
            engine.save_to_file(text, audio_file)
            engine.runAndWait()

            return audio_file

        except Exception as e:
            logger.error(f"Offline audio generation failed: {e}")
            raise HTTPException(status_code=500, detail="Audio generation failed")

    def create_slide_image(self, text: str, template: str, color_scheme: str, 
                          font_family: str, slide_number: int) -> str:
        """Create a slide image with text"""
        try:
            # Create image (1280x720 for HD)
            width, height = 1280, 720

            # Color schemes
            color_schemes = {
                "blue-gradient": {"bg": (79, 70, 229), "text": (255, 255, 255)},
                "sunset": {"bg": (245, 158, 11), "text": (255, 255, 255)},
                "forest": {"bg": (5, 150, 105), "text": (255, 255, 255)},
                "monochrome": {"bg": (55, 65, 81), "text": (255, 255, 255)}
            }

            colors = color_schemes.get(color_scheme, color_schemes["blue-gradient"])

            # Create image with gradient background
            image = Image.new('RGB', (width, height), colors["bg"])
            draw = ImageDraw.Draw(image)

            # Add gradient effect (simplified)
            for i in range(height):
                alpha = i / height
                color = tuple(int(c * (1 - alpha * 0.3)) for c in colors["bg"])
                draw.line([(0, i), (width, i)], fill=color)

            # Load font (fallback to default if not available)
            try:
                font_size = 48
                font = ImageFont.truetype("arial.ttf", font_size)
            except:
                font = ImageFont.load_default()

            # Split text into lines for better display
            words = text.split()
            lines = []
            current_line = ""

            for word in words:
                test_line = f"{current_line} {word}".strip()
                bbox = draw.textbbox((0, 0), test_line, font=font)
                if bbox[2] - bbox[0] < width - 100:  # 50px margin on each side
                    current_line = test_line
                else:
                    if current_line:
                        lines.append(current_line)
                        current_line = word
                    else:
                        lines.append(word)

            if current_line:
                lines.append(current_line)

            # Draw text centered
            total_height = len(lines) * 60  # Line height
            start_y = (height - total_height) // 2

            for i, line in enumerate(lines):
                bbox = draw.textbbox((0, 0), line, font=font)
                text_width = bbox[2] - bbox[0]
                x = (width - text_width) // 2
                y = start_y + i * 60

                # Add shadow
                draw.text((x + 2, y + 2), line, font=font, fill=(0, 0, 0, 128))
                # Add main text
                draw.text((x, y), line, font=font, fill=colors["text"])

            # Save image
            image_file = os.path.join(self.temp_dir, f"slide_{uuid.uuid4()}.png")
            image.save(image_file, "PNG")

            return image_file

        except Exception as e:
            logger.error(f"Slide generation failed: {e}")
            raise HTTPException(status_code=500, detail="Slide generation failed")

    def create_video(self, text: str, duration: int, template: str, 
                    color_scheme: str, font_family: str, voice_type: str, 
                    speech_speed: str) -> str:
        """Create final video from components"""
        try:
            # Generate audio
            audio_file = self.generate_audio(text, voice_type, speech_speed)

            # Split text into segments for multiple slides
            sentences = text.split('.')
            sentences = [s.strip() for s in sentences if s.strip()]

            if not sentences:
                sentences = [text]

            # Create slides
            slide_files = []
            for i, sentence in enumerate(sentences):
                if sentence:
                    slide_file = self.create_slide_image(
                        sentence, template, color_scheme, font_family, i
                    )
                    slide_files.append(slide_file)

            # Create video clips
            clips = []
            slide_duration = duration / len(slide_files) if slide_files else duration

            for slide_file in slide_files:
                clip = ImageClip(slide_file, duration=slide_duration)
                clips.append(clip)

            # Concatenate slides
            video = concatenate_videoclips(clips, method="compose")

            # Add audio
            if os.path.exists(audio_file):
                audio = AudioFileClip(audio_file)
                if audio.duration > video.duration:
                    audio = audio.subclip(0, video.duration)
                elif audio.duration < video.duration:
                    video = video.subclip(0, audio.duration)

                video = video.set_audio(audio)

            # Export video
            output_file = os.path.join(self.temp_dir, f"video_{uuid.uuid4()}.mp4")
            video.write_videofile(
                output_file,
                fps=24,
                codec='libx264',
                audio_codec='aac',
                temp_audiofile='temp-audio.m4a',
                remove_temp=True,
                verbose=False,
                logger=None
            )

            # Cleanup
            video.close()
            if os.path.exists(audio_file):
                os.remove(audio_file)
            for slide_file in slide_files:
                if os.path.exists(slide_file):
                    os.remove(slide_file)

            return output_file

        except Exception as e:
            logger.error(f"Video creation failed: {e}")
            raise HTTPException(status_code=500, detail="Video creation failed")

video_generator = VideoGenerator()

# Background task for video generation
async def generate_video_task(video_id: str, request: VideoRequest):
    """Background task to generate video with progress updates"""
    try:
        steps = [
            {"name": "Analyzing Text", "duration": 3},
            {"name": "Generating Audio", "duration": 8},
            {"name": "Creating Slides", "duration": 5},
            {"name": "Adding Effects", "duration": 4},
            {"name": "Rendering Video", "duration": 10},
            {"name": "Finalizing", "duration": 2}
        ]

        total_duration = sum(step["duration"] for step in steps)
        current_progress = 0

        # Update job status
        video_jobs[video_id]["status"] = "processing"

        for i, step in enumerate(steps):
            # Update current step
            video_jobs[video_id]["current_step"] = step["name"]
            video_jobs[video_id]["progress"] = current_progress

            # Broadcast progress
            await manager.broadcast(json.dumps({
                "video_id": video_id,
                "progress": current_progress,
                "current_step": step["name"],
                "status": "processing"
            }))

            # Simulate processing time
            for j in range(step["duration"]):
                await asyncio.sleep(1)
                progress = current_progress + (j + 1) * (100 / total_duration)
                video_jobs[video_id]["progress"] = min(int(progress), 100)

                # Broadcast intermediate progress
                if j % 2 == 0:  # Every 2 seconds
                    await manager.broadcast(json.dumps({
                        "video_id": video_id,
                        "progress": min(int(progress), 100),
                        "current_step": step["name"],
                        "status": "processing"
                    }))

            current_progress += (step["duration"] / total_duration) * 100

        # Generate actual video
        video_file = video_generator.create_video(
            request.text, request.duration, request.template,
            request.color_scheme, request.font_family, 
            request.voice_type, request.speech_speed
        )

        # Update job completion
        file_size = os.path.getsize(video_file) if os.path.exists(video_file) else 0

        video_jobs[video_id].update({
            "status": "completed",
            "progress": 100,
            "current_step": "Ready for download",
            "video_file": video_file,
            "file_size": file_size,
            "duration": request.duration
        })

        # Broadcast completion
        await manager.broadcast(json.dumps({
            "video_id": video_id,
            "progress": 100,
            "current_step": "Ready for download",
            "status": "completed",
            "video_url": f"/download/{video_id}",
            "file_size": file_size,
            "duration": request.duration
        }))

    except Exception as e:
        logger.error(f"Video generation failed for {video_id}: {e}")
        video_jobs[video_id].update({
            "status": "failed",
            "error": str(e),
            "current_step": "Generation failed"
        })

        await manager.broadcast(json.dumps({
            "video_id": video_id,
            "status": "failed",
            "error": str(e)
        }))

# API Routes
@app.post("/api/generate", response_model=VideoResponse)
async def create_video(request: VideoRequest, background_tasks: BackgroundTasks):
    """Start video generation process"""

    # Validation
    if not request.text or len(request.text) > 1000:
        raise HTTPException(status_code=400, detail="Text must be 1-1000 characters")

    if request.duration < 10 or request.duration > 300:
        raise HTTPException(status_code=400, detail="Duration must be 10-300 seconds")

    # Create job
    video_id = str(uuid.uuid4())
    video_jobs[video_id] = {
        "id": video_id,
        "status": "queued",
        "progress": 0,
        "current_step": "Starting...",
        "created_at": datetime.now().isoformat(),
        "request": request.dict()
    }

    # Start background task
    background_tasks.add_task(generate_video_task, video_id, request)

    return VideoResponse(
        video_id=video_id,
        status="queued",
        progress=0,
        current_step="Starting...",
        created_at=video_jobs[video_id]["created_at"]
    )

@app.get("/api/status/{video_id}", response_model=VideoResponse)
async def get_video_status(video_id: str):
    """Get video generation status"""
    if video_id not in video_jobs:
        raise HTTPException(status_code=404, detail="Video not found")

    job = video_jobs[video_id]

    return VideoResponse(
        video_id=video_id,
        status=job["status"],
        progress=job["progress"],
        current_step=job["current_step"],
        video_url=f"/download/{video_id}" if job["status"] == "completed" else None,
        duration=job.get("duration"),
        file_size=job.get("file_size"),
        created_at=job["created_at"]
    )

@app.get("/download/{video_id}")
async def download_video(video_id: str):
    """Download completed video"""
    if video_id not in video_jobs:
        raise HTTPException(status_code=404, detail="Video not found")

    job = video_jobs[video_id]
    if job["status"] != "completed":
        raise HTTPException(status_code=400, detail="Video not ready")

    video_file = job.get("video_file")
    if not video_file or not os.path.exists(video_file):
        raise HTTPException(status_code=404, detail="Video file not found")

    return FileResponse(
        video_file,
        media_type="video/mp4",
        filename=f"videogen_ai_{video_id}.mp4"
    )

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket for real-time progress updates"""
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle any incoming messages if needed

    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
