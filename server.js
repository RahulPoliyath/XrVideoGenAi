require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // optional: serve frontend

// ---- POST /generate-video ----
app.post('/generate-video', async (req, res) => {
    const data = req.body;
    if (!data.script) return res.status(400).json({ error: 'Script is required' });

    try {
        // Prepare payload for RunwayML
        const payload = {
            prompt: data.script,
            duration: parseInt(data.duration) || 60,
            voice: data.voice || 'default',
            style: data.style || 'default',
            template: data.template || 'default',
            background_music: data.backgroundMusic || false,
            resolution: data.resolution || '720p',
            frame_rate: parseInt(data.frameRate) || 30,
            transition: data.transition || 'fade',
            voice_speed: parseFloat(data.voiceSpeed) || 1,
            music_volume: parseFloat(data.musicVolume) || 0.5
        };

        // Call RunwayML API
        const response = await axios.post(
            'https://api.runwayml.com/v1/videos/generate', // Example endpoint
            payload,
            { headers: { Authorization: `Bearer ${process.env.RUNWAY_API_KEY}` } }
        );

        // RunwayML may return a URL or an ID to poll
        const videoUrl = response.data.video_url || response.data.output_url || null;

        if (!videoUrl) {
            return res.status(500).json({ error: 'Video generation failed' });
        }

        res.json({ videoUrl });

    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).json({ error: 'Server error while generating video' });
    }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
