FROM python:3.11-slim

# Install system dependencies for video processing
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsm6 \
    libxext6 \
    libfontconfig1 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directories for file storage
RUN mkdir -p generated_videos temp static

# Expose port
EXPOSE 8000

# Run the application
CMD [“uvicorn”, “vidgen_backend:app”, “–host”, “0.0.0.0”, “–port”, “$PORT”]
