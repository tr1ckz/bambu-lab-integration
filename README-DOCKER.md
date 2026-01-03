# Bambu Lab Integration - Docker Deployment for Unraid

This application can be deployed as a single Docker container on Unraid.

## Quick Start

### Option 1: Docker Compose (Recommended)

1. Copy your project to Unraid (e.g., `/mnt/user/appdata/bambu-lab/`)
2. Navigate to the directory
3. Run:
```bash
docker-compose up -d
```

### Option 2: Docker CLI (for Unraid Community Applications)

```bash
docker run -d \
  --name=bambu-lab-integration \
  -p 3000:3000 \
  -e SESSION_SECRET="your-random-secret-key-change-this" \
  -e NODE_ENV=production \
  -v /mnt/user/appdata/bambu-lab/data:/app/data \
  -v /mnt/user/appdata/bambu-lab/library:/app/library \
  -v /mnt/user/appdata/bambu-lab/sessions:/app/sessions \
  --restart unless-stopped \
  bambu-lab-integration
```

### Build the Image

First, build the Docker image:
```bash
docker build -t bambu-lab-integration .
```

## Unraid Setup

### Using Unraid Docker Template

Add a new container in Unraid Docker with these settings:

- **Name**: `bambu-lab-integration`
- **Repository**: `bambu-lab-integration` (after building)
- **Network Type**: `Bridge`
- **Port Mapping**: 
  - Container Port: `3000`
  - Host Port: `3000` (or your preferred port)
- **Volume Mappings**:
  - Container Path: `/app/data` → Host Path: `/mnt/user/appdata/bambu-lab/data`
  - Container Path: `/app/library` → Host Path: `/mnt/user/appdata/bambu-lab/library`
  - Container Path: `/app/sessions` → Host Path: `/mnt/user/appdata/bambu-lab/sessions`
- **Environment Variables**:
  - `SESSION_SECRET`: `your-random-secret-key-change-this`
  - `NODE_ENV`: `production`

## What Gets Persisted

The following directories are mounted as volumes to persist data:

- **`/app/data`**: Database, thumbnails, and cover images
- **`/app/library`**: Your uploaded 3D models (.3mf, .stl, .gcode files)
- **`/app/sessions`**: User session data

## First Time Setup

1. Access the app at `http://your-unraid-ip:3000`
2. Create your admin account
3. Connect your Bambu Lab account in Settings
4. Upload or sync your 3D models

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port the server listens on |
| `SESSION_SECRET` | (required) | Secret key for session encryption - CHANGE THIS! |
| `NODE_ENV` | `production` | Node environment |

## Updating

To update the container:

```bash
# Stop and remove old container
docker stop bambu-lab-integration
docker rm bambu-lab-integration

# Rebuild image
docker build -t bambu-lab-integration .

# Start new container
docker-compose up -d
# OR
docker run -d ... (use same command as above)
```

## Troubleshooting

### Check logs:
```bash
docker logs bambu-lab-integration
```

### Access container shell:
```bash
docker exec -it bambu-lab-integration sh
```

### Common Issues:

1. **Port already in use**: Change the host port mapping
2. **Permission issues**: Ensure Unraid has write access to the mounted volumes
3. **Build fails**: Make sure all dependencies install correctly (check build logs)

## Notes

- The container includes both the frontend (built with Vite) and backend (Express)
- All data persists across container restarts via volume mounts
- Default admin credentials must be set on first launch
- Session data is stored in files (not in-memory) for persistence
