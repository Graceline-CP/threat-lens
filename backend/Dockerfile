FROM python:3.11-slim

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libsm6 libxext6 libxrender-dev libgl1 gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install CPU-only torch first (smaller, faster build)
RUN pip install --no-cache-dir torch==2.11.0 torchvision==0.12.0 --index-url https://download.pytorch.org/whl/cpu

# Install rest of dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Hugging Face Spaces uses port 7860
EXPOSE 7860

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
