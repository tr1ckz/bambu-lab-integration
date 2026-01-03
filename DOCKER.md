# Docker Deployment Guide

## Quick Start

### Using Docker Hub (Recommended)
```bash
docker pull ghcr.io/tr1ckz/bambu-lab-integration:latest

docker run -d \
  --name bambu-lab \
  -p 3000:3000 \
  -v bambu_data:/app/data \
  -v bambu_library:/app/library \
  -v bambu_sessions:/app/sessions \
  ghcr.io/tr1ckz/bambu-lab-integration:latest
```

### Building Locally
```bash
docker build -t bambu-lab-integration:latest .
docker run -d --name bambu-lab -p 3000:3000 bambu-lab-integration:latest
```

## Configuration

Create a `.env` file or set environment variables:
```bash
BAMBU_HOST=192.168.1.100
BAMBU_ACCESS_CODE=your_access_code
BAMBU_SERIAL=your_serial_number
PORT=3000
```

## Unraid Installation

1. **Add Container Template:**
   - Container Registry: `ghcr.io/tr1ckz/bambu-lab-integration:latest`
   - Network Type: `Bridge`
   - Port: `3000` → `3000`

2. **Add Volumes:**
   - `/mnt/user/appdata/bambu-lab/data` → `/app/data`
   - `/mnt/user/appdata/bambu-lab/library` → `/app/library`
   - `/mnt/user/appdata/bambu-lab/sessions` → `/app/sessions`

3. **Environment Variables:**
   - `BAMBU_HOST`: Your printer IP
   - `BAMBU_ACCESS_CODE`: From printer settings
   - `BAMBU_SERIAL`: Printer serial number

## Troubleshooting

### Build Errors Fixed
- ✅ **Git dependency error**: Fixed by installing git in container
- ✅ **Canvas compilation error**: Switched to @napi-rs/canvas with prebuilt binaries
- ✅ **Rollup missing error**: Install dependencies normally to get rollup binaries
- ✅ **GL package error**: Removed unused gl package

### Common Issues

**Container won't start:**
```bash
docker logs bambu-lab
```

**Can't connect to printer:**
- Verify printer IP is correct
- Check access code from printer LCD > Settings > LAN Only Mode
- Ensure printer and container on same network

**No thumbnails generating:**
- @napi-rs/canvas is installed with prebuilt binaries
- Check logs for rendering errors

## GitHub Actions

Automatic builds trigger on push to `main` branch. Images published to:
- `ghcr.io/tr1ckz/bambu-lab-integration:latest`
- `ghcr.io/tr1ckz/bambu-lab-integration:main`

Multi-platform support: `linux/amd64`, `linux/arm64`
