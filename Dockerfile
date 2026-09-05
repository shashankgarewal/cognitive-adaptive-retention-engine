# Multi-stage Dockerfile for SynapseDS (React + FastAPI on Cloud Run)

# Stage 1: Build React Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Python FastAPI Production Runtime
FROM python:3.10-slim AS runtime
WORKDIR /app

ENV PORT=3000
ENV ENVIRONMENT=production
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Backend Application
COPY backend ./backend

# Copy Built Frontend Assets
COPY --from=frontend-builder /app/dist ./dist

# Expose Port 3000 for Cloud Run
EXPOSE 3000

# Launch Uvicorn
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "3000"]
