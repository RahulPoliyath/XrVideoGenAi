
import asyncio
import os
import uuid
from datetime import datetime
from typing import List, Dict, Optional
import json
import shutil

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, File, UploadFile, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

# TTS and Video Generation Imports
try:
    from gtts import gTTS
    import pyttsx3
except ImportError:
    print("TTS libraries not installed. Install with: pip install gtts pyttsx3")

try:
    from moviepy.editor import *
    import cv2
    from PIL import Image, ImageDraw, ImageFont
    import numpy as np
except ImportError:
    print("Video libraries not installed. Install with: pip install moviepy opencv-python pillow")

# Models
class VideoRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000, description="Text to convert to video")
    duration: int = Field(30, ge=15, le=180, description="Video duration in seconds")
    voice: str = Field("female_1", description="Voice selection")
    style: str = Field("modern", description="Video style template")
    background_music: bool = Field(False, description="Include background music")

class VideoResponse(BaseModel):
    video_id: str
    status: str
    progress: int
    message: str
    video_url: Optional[str] = None
    download_url: Optional[str] = None

class ProgressUpdate(BaseModel):
    video_id: str
    progress: int
    stage: str
    message: str
    estimated_time: Optional[int] = None

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.video_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, video_id: str = None):
        await websocket.accept()
        self.active_connections.append(websocket)

        if video_id:
            if video_id not in self.video_connections:
                self.video_connections[video_id] = []
            self.video_connections[video_id].append(websocket)

    def disconnect(self, websocket: WebSocket, video_id: str = None):
        self.active_connections.remove(websocket)
        if video_id and video_id in self.video_connections:
            if websocket in self.video_connections[video_id]:
                self.video_connections[video_id].remove(websocket)

    async def send_progress(self, video_id: str, progress_data: dict):
        """Send progress update to all connections watching this video"""
        if video_id in self.video_connections:
            message = json.dumps(progress_data)
            disconnected = []

            for connection in self.video_connections[video_id]:
                try:
                    await connection.send_text(message)
                except:
                    disconnected.append(connection)

            # Clean up disconnected connections
            for conn in disconnected:
                self.video_connections[video_id].remove(conn)

# Video Generation Service
class VideoGenerationService:
    def __init__(self):
        self.output_dir = "generated_videos"
        self.temp_dir = "temp"
        os.makedirs(self.output_dir, exist_ok=True)
        os.makedirs(self.temp_dir, exist_ok=True)

        # Progress stages
        self.stages = [
            {"id": 1, "name": "Analyzing Text", "description": "Processing your script", "weight": 15},
            {"id": 2, "name": "Generating Audio", "description": "Converting text to speech", "weight": 25},
            {"id": 3, "name": "Creating Slideshow", "description": "Building visual elements", "weight": 35},
            {"id": 4, "name": "Finalizing Video", "description": "Rendering final video", "weight": 25}
        ]

    async def generate_tts_audio(self, text: str, voice: str, output_path: str):
        """Generate TTS audio from text"""
        try:
            if voice.startswith("google_"):
                # Use gTTS for Google voices
                lang = "en"
                if "british" in voice.lower():
                    lang = "en-uk"

                tts = gTTS(text=text, lang=lang, slow=False)
                tts.save(output_path)
            else:
                # Use pyttsx3 for offline voices
                engine = pyttsx3.init()

                # Configure voice settings
                voices = engine.getProperty('voices')
                if voices:
                    if "female" in voice:
                        # Try to find female voice
                        for v in voices:
                            if "female" in v.name.lower() or "zira" in v.name.lower():
                                engine.setProperty('voice', v.id)
                                break
                    else:
                        # Try to find male voice
                        for v in voices:
                            if "male" in v.name.lower() or "david" in v.name.lower():
                                engine.setProperty('voice', v.id)
                                break

                engine.setProperty('rate', 180)  # Speed
                engine.setProperty('volume', 0.9)  # Volume

                engine.save_to_file(text, output_path)
                engine.runAndWait()

        except Exception as e:
            print(f"TTS Error: {e}")
            # Fallback: create a simple beep sound or use system TTS
            raise HTTPException(status_code=500, f"TTS generation failed: {str(e)}")

    def create_text_slide(self, text: str, size: tuple = (1280, 720), style: str = "modern"):
        """Create a text slide image"""
        # Create image
        img = Image.new('RGB', size, color='black' if style == 'dark' else 'white')
        draw = ImageDraw.Draw(img)

        try:
            # Try to use a better font
            font_size = 60
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            # Fallback to default font
            font = ImageFont.load_default()

        # Text color based on style
        text_color = 'white' if style in ['dark', 'creative'] else 'black'

        # Word wrap text
        words = text.split()
        lines = []
        current_line = []

        for word in words:
            test_line = ' '.join(current_line + [word])
            bbox = draw.textbbox((0, 0), test_line, font=font)
            if bbox[2] - bbox[0] <= size[0] - 100:  # 50px margin on each side
                current_line.append(word)
            else:
                if current_line:
                    lines.append(' '.join(current_line))
                    current_line = [word]
                else:
                    lines.append(word)

        if current_line:
            lines.append(' '.join(current_line))

        # Calculate total text height
        total_height = len(lines) * 80  # Approximate line height
        start_y = (size[1] - total_height) // 2

        # Draw text lines
        for i, line in enumerate(lines):
            bbox = draw.textbbox((0, 0), line, font=font)
            text_width = bbox[2] - bbox[0]
            x = (size[0] - text_width) // 2
            y = start_y + i * 80

            draw.text((x, y), line, fill=text_color, font=font)

        return np.array(img)

    async def create_slideshow_video(self, text: str, audio_path: str, style: str, duration: int):
        """Create slideshow video with text and audio"""
        # Split text into segments for multiple slides
        sentences = text.split('. ')
        if len(sentences[-1].strip()) == 0:
            sentences = sentences[:-1]

        # Create slides
        slide_images = []
        for i, sentence in enumerate(sentences):
            if sentence.strip():
                slide_img = self.create_text_slide(sentence.strip() + '.', style=style)
                slide_images.append(slide_img)

        if not slide_images:
            # Fallback: create single slide with full text
            slide_img = self.create_text_slide(text, style=style)
            slide_images = [slide_img]

        # Save slides as temporary images
        slide_paths = []
        for i, slide_img in enumerate(slide_images):
            slide_path = f"{self.temp_dir}/slide_{i}.png"
            Image.fromarray(slide_img).save(slide_path)
            slide_paths.append(slide_path)

        # Calculate duration per slide
        slide_duration = duration / len(slide_paths)

        # Create video clips from slides
        video_clips = []
        for slide_path in slide_paths:
            clip = ImageClip(slide_path).set_duration(slide_duration)
            video_clips.append(clip)

        # Concatenate slides
        final_video = concatenate_videoclips(video_clips, method="compose")

        # Add audio
        if os.path.exists(audio_path):
            audio_clip = AudioFileClip(audio_path)
            # Trim or loop audio to match video duration
            if audio_clip.duration > duration:
                audio_clip = audio_clip.subclip(0, duration)
            elif audio_clip.duration < duration:
                # Loop the audio
                loops_needed = int(duration / audio_clip.duration) + 1
                audio_clip = concatenate_audioclips([audio_clip] * loops_needed).subclip(0, duration)

            final_video = final_video.set_audio(audio_clip)

        return final_video

    async def generate_video(self, request: VideoRequest, video_id: str, progress_callback=None):
        """Main video generation pipeline"""
        try:
            # Stage 1: Analyzing Text
            if progress_callback:
                await progress_callback(video_id, {
                    "progress": 10,
                    "stage": "Analyzing Text",
                    "message": "Processing your script and extracting key elements"
                })

            await asyncio.sleep(2)  # Simulate processing time

            # Stage 2: Generating Audio
            if progress_callback:
                await progress_callback(video_id, {
                    "progress": 25,
                    "stage": "Generating Audio", 
                    "message": "Converting text to speech with selected voice"
                })

            audio_path = f"{self.temp_dir}/{video_id}_audio.mp3"
            await self.generate_tts_audio(request.text, request.voice, audio_path)

            if progress_callback:
                await progress_callback(video_id, {
                    "progress": 50,
                    "stage": "Creating Slideshow",
                    "message": "Building visual elements and transitions"
                })

            await asyncio.sleep(3)  # Simulate slideshow creation

            # Stage 3: Create slideshow video
            video_clip = await self.create_slideshow_video(
                request.text, 
                audio_path, 
                request.style, 
                request.duration
            )

            if progress_callback:
                await progress_callback(video_id, {
                    "progress": 85,
                    "stage": "Finalizing Video",
                    "message": "Rendering final video and optimizing quality"
                })

            # Stage 4: Render final video
            output_path = f"{self.output_dir}/{video_id}.mp4"
            video_clip.write_videofile(
                output_path,
                fps=24,
                codec='libx264',
                audio_codec='aac',
                temp_audiofile=f"{self.temp_dir}/{video_id}_temp_audio.m4a",
                remove_temp=True
            )

            # Cleanup temporary files
            if os.path.exists(audio_path):
                os.remove(audio_path)

            # Clean up slide images
            for file in os.listdir(self.temp_dir):
                if file.startswith('slide_'):
                    os.remove(os.path.join(self.temp_dir, file))

            if progress_callback:
                await progress_callback(video_id, {
                    "progress": 100,
                    "stage": "Complete",
                    "message": "Video generated successfully!",
                    "video_url": f"/video/{video_id}"
                })

            return output_path

        except Exception as e:
            if progress_callback:
                await progress_callback(video_id, {
                    "progress": 0,
                    "stage": "Error",
                    "message": f"Generation failed: {str(e)}"
                })
            raise e

# FastAPI Application
app = FastAPI(
    title="VidGen AI API",
    description="Professional Text-to-Video Generation API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
connection_manager = ConnectionManager()
video_service = VideoGenerationService()
active_generations = {}

# Serve static files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root():
    return {"message": "VidGen AI API is running", "version": "1.0.0"}

@app.post("/api/generate-video", response_model=VideoResponse)
async def generate_video(request: VideoRequest, background_tasks: BackgroundTasks):
    """Start video generation process"""
    video_id = str(uuid.uuid4())

    # Store generation request
    active_generations[video_id] = {
        "status": "processing",
        "progress": 0,
        "created_at": datetime.now(),
        "request": request
    }

    # Start background video generation
    background_tasks.add_task(process_video_generation, video_id, request)

    return VideoResponse(
        video_id=video_id,
        status="processing",
        progress=0,
        message="Video generation started"
    )

async def process_video_generation(video_id: str, request: VideoRequest):
    """Background task for video generation"""
    try:
        async def progress_callback(vid_id: str, progress_data: dict):
            # Update active generation status
            if vid_id in active_generations:
                active_generations[vid_id]["progress"] = progress_data["progress"]
                active_generations[vid_id]["status"] = progress_data["stage"]

            # Send progress via WebSocket
            await connection_manager.send_progress(vid_id, progress_data)

        # Generate video
        output_path = await video_service.generate_video(request, video_id, progress_callback)

        # Update final status
        active_generations[video_id]["status"] = "completed"
        active_generations[video_id]["output_path"] = output_path

    except Exception as e:
        # Update error status
        active_generations[video_id]["status"] = "failed"
        active_generations[video_id]["error"] = str(e)

@app.get("/api/video/{video_id}/status")
async def get_video_status(video_id: str):
    """Get current status of video generation"""
    if video_id not in active_generations:
        raise HTTPException(status_code=404, detail="Video not found")

    generation = active_generations[video_id]
    return {
        "video_id": video_id,
        "status": generation["status"],
        "progress": generation["progress"],
        "created_at": generation["created_at"]
    }

@app.get("/api/video/{video_id}/download")
async def download_video(video_id: str):
    """Download generated video"""
    if video_id not in active_generations:
        raise HTTPException(status_code=404, detail="Video not found")

    generation = active_generations[video_id]
    if generation["status"] != "completed":
        raise HTTPException(status_code=400, detail="Video not ready")

    output_path = generation.get("output_path")
    if not output_path or not os.path.exists(output_path):
        raise HTTPException(status_code=404, detail="Video file not found")

    return FileResponse(
        path=output_path,
        filename=f"video_{video_id}.mp4",
        media_type="video/mp4"
    )

@app.websocket("/ws/{video_id}")
async def websocket_endpoint(websocket: WebSocket, video_id: str):
    """WebSocket endpoint for real-time progress updates"""
    await connection_manager.connect(websocket, video_id)
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            # Echo back or handle client messages if needed
            await websocket.send_text(f"Received: {data}")
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket, video_id)

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
