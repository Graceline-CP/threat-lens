FROM python:3.11-slim

# System deps for OpenCV and EasyOCR
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libsm6 libxext6 libxrender-dev libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

# Pre-download HuggingFace model at build time so cold starts are fast
RUN python -c "from transformers import pipeline; pipeline('zero-shot-classification', model='cross-encoder/nli-distilroberta-base')"

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]