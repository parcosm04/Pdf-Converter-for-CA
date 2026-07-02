FROM python:3.12-slim

WORKDIR /workspace

# Install system dependencies needed for compiling psycopg2 and extracting PDFs
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend files
COPY . .

# Ensure storage directories exist
RUN mkdir -p storage/uploads storage/outputs logs

EXPOSE 8000

# Start FastAPI server using uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
