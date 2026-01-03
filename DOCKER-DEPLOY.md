# Bambu Lab Integration - Docker Deployment Guide

## Quick Start

### 1. Prepare Your 3D Model Library Folder

Create a folder on your host machine with your 3D model files (.3mf, .stl, .gcode):

```bash
mkdir my-3d-models
```

### 2. Build Docker Image

```bash
docker build -t yourusername/bambu-lab-integration:latest .
```

### 3. Push to Docker Hub

```bash
# Login to Docker Hub
docker login

# Push the image
docker push yourusername/bambu-lab-integration:latest
```

### 4. Deploy with Docker Compose

Edit `docker-compose.yml` and:
- Replace `yourusername` with your Docker Hub username
- Change `./my-3d-models:/app/library` to your actual folder path

Then:

```bash
docker-compose up -d
```

## Manual Docker Run

```bash
docker run -d \
  --name bambu-lab-integration \
  -p 3000:3000 \
  -v bambu_data:/app/data \
  -v bambu_sessions:/app/sessions \
  -v /path/to/your/3d-models:/app/library \
  -e SESSION_SECRET=your-random-secret \
  --restart unless-stopped \
  yourusername/bambu-lab-integration:latest
```

**Important:** Replace `/path/to/your/3d-models` with your actual folder path!

## Library Folder

The library folder is where you can drop your 3D model files:

- **Windows:** `-v C:\Users\YourName\3D Models:/app/library`
- **Linux/Mac:** `-v /home/yourname/3d-models:/app/library`

Just drop `.3mf`, `.stl`, or `.gcode` files into this folder, then click "🔄 Refresh Library" in the web UI.

## Configuration

- **Port**: Default 3000 (change with `-p` flag)
- **Session Secret**: Set via `SESSION_SECRET` environment variable
- **Data Persistence**: Two volumes for data and sessions, one bind mount for library

## Access

Open http://localhost:3000 in your browser

## Volumes

- `bambu_data` - Database, models, videos, thumbnails
- `bambu_sessions` - User session data
- `./my-3d-models` - Your 3D model library (bind mount)

## Health Check

The container includes a health check that runs every 30 seconds. Check status:

```bash
docker ps
```

Look for "(healthy)" status.

## Updating

```bash
docker pull yourusername/bambu-lab-integration:latest
docker-compose down
docker-compose up -d
```

## Using the Library

1. Put your `.3mf`, `.stl`, or `.gcode` files in your library folder
2. Open the web UI and go to the Library tab
3. Click "🔄 Refresh Library" to scan for new files
4. Or use drag-and-drop to upload files directly through the UI
