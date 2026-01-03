# Bambu Lab Integration - Unraid Deployment Guide

## Quick Start

### Using GitHub Container Registry (Recommended)

```bash
docker pull ghcr.io/YOUR_GITHUB_USERNAME/bambu:latest
```

### Docker Compose

```yaml
version: '3.8'

services:
  bambu-web:
    image: ghcr.io/YOUR_GITHUB_USERNAME/bambu:latest
    container_name: bambu-lab-integration
    ports:
      - "3000:3000"
    environment:
      - SESSION_SECRET=CHANGE_THIS_TO_RANDOM_STRING
      - NODE_ENV=production
    volumes:
      - /mnt/user/appdata/bambu-lab/data:/app/data
      - /mnt/user/appdata/bambu-lab/sessions:/app/sessions
      - /mnt/user/3d-models:/app/library
      - /mnt/user/3d-videos:/app/data/videos
    restart: unless-stopped
```

## Unraid Installation

### Method 1: Community Applications (Coming Soon)

Once submitted to Community Applications, you can install directly from the Apps tab.

### Method 2: Manual Docker Container

1. Navigate to the **Docker** tab in Unraid
2. Click **Add Container**
3. Configure the following settings:

#### Basic Settings
- **Name**: `bambu-lab-integration`
- **Repository**: `ghcr.io/YOUR_GITHUB_USERNAME/bambu:latest`
- **Network Type**: `Bridge`
- **Console shell command**: `Shell`

#### Port Mappings
| Container Port | Host Port | Protocol |
|---------------|-----------|----------|
| 3000 | 3000 | TCP |

#### Volume Mappings
| Container Path | Host Path | Access Mode |
|---------------|-----------|-------------|
| /app/data | /mnt/user/appdata/bambu-lab/data | Read/Write |
| /app/sessions | /mnt/user/appdata/bambu-lab/sessions | Read/Write |
| /app/library | /mnt/user/3d-models | Read/Write |
| /app/data/videos | /mnt/user/3d-videos | Read/Write |

**Note**: Adjust the host paths to match your Unraid array structure.

#### Environment Variables
| Variable | Value | Description |
|----------|-------|-------------|
| SESSION_SECRET | *Generate random string* | Used for session encryption |
| NODE_ENV | production | Run in production mode |

#### Advanced Settings
- **Restart Policy**: `unless-stopped`
- **Privileged**: `Off` (not needed)

### Method 3: Unraid Template XML

Save this as a template file:

```xml
<?xml version="1.0"?>
<Container version="2">
  <Name>bambu-lab-integration</Name>
  <Repository>ghcr.io/YOUR_GITHUB_USERNAME/bambu:latest</Repository>
  <Registry>ghcr.io</Registry>
  <Network>bridge</Network>
  <MyIP/>
  <Shell>sh</Shell>
  <Privileged>false</Privileged>
  <Support>https://github.com/YOUR_GITHUB_USERNAME/bambu</Support>
  <Project>https://github.com/YOUR_GITHUB_USERNAME/bambu</Project>
  <Overview>Web-based management dashboard for Bambu Lab 3D printers. Features real-time monitoring, print history, model library management, and statistics.</Overview>
  <Category>Tools:</Category>
  <WebUI>http://[IP]:[PORT:3000]</WebUI>
  <TemplateURL/>
  <Icon>https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/bambu/main/data/logo.png</Icon>
  <ExtraParams/>
  <PostArgs/>
  <CPUset/>
  <DateInstalled/>
  <DonateText>Buy Me a Coffee</DonateText>
  <DonateLink>https://buymeacoffee.com/tr1ck</DonateLink>
  <Requires/>
  <Config Name="WebUI Port" Target="3000" Default="3000" Mode="tcp" Description="Web interface port" Type="Port" Display="always" Required="true" Mask="false">3000</Config>
  <Config Name="Application Data" Target="/app/data" Default="/mnt/user/appdata/bambu-lab/data" Mode="rw" Description="Database and cached files" Type="Path" Display="always" Required="true" Mask="false">/mnt/user/appdata/bambu-lab/data</Config>
  <Config Name="Session Data" Target="/app/sessions" Default="/mnt/user/appdata/bambu-lab/sessions" Mode="rw" Description="User session data" Type="Path" Display="always" Required="true" Mask="false">/mnt/user/appdata/bambu-lab/sessions</Config>
  <Config Name="3D Model Library" Target="/app/library" Default="/mnt/user/3d-models" Mode="rw" Description="Your 3D model files (.3mf, .stl, etc)" Type="Path" Display="always" Required="false" Mask="false">/mnt/user/3d-models</Config>
  <Config Name="Video Timelapses" Target="/app/data/videos" Default="/mnt/user/3d-videos" Mode="rw" Description="Timelapse videos from printer" Type="Path" Display="always" Required="false" Mask="false">/mnt/user/3d-videos</Config>
  <Config Name="Session Secret" Target="SESSION_SECRET" Default="" Mode="" Description="Random string for session encryption (generate with: openssl rand -base64 32)" Type="Variable" Display="always" Required="true" Mask="true"/>
  <Config Name="Node Environment" Target="NODE_ENV" Default="production" Mode="" Description="Production mode" Type="Variable" Display="advanced" Required="false" Mask="false">production</Config>
</Container>
```

## First Time Setup

1. **Access the Web Interface**
   - Navigate to `http://YOUR_UNRAID_IP:3000`

2. **Configure OAuth (Recommended)**
   - Set up authentication through your identity provider
   - Or use local authentication

3. **Connect Bambu Lab Cloud**
   - Go to Settings
   - Enter your Bambu Lab account credentials
   - Sync your printer data

4. **Configure Printer Connection**
   - Add your printer's IP address and access code
   - Enable MQTT for real-time monitoring
   - Set up FTP for file downloads (optional)

## Updating

### GitHub Container Registry
```bash
docker pull ghcr.io/YOUR_GITHUB_USERNAME/bambu:latest
docker restart bambu-lab-integration
```

### Unraid Docker Manager
1. Click the container icon
2. Select **Force Update**
3. Container will pull latest image and restart

## Troubleshooting

### Container Won't Start
- Check logs: `docker logs bambu-lab-integration`
- Verify volume paths exist on Unraid
- Ensure SESSION_SECRET is set

### Can't Access Web Interface
- Verify port 3000 isn't used by another container
- Check Unraid firewall settings
- Try accessing via `http://localhost:3000` from Unraid terminal

### Missing Cover Images
- Sync with Bambu Cloud to download images
- Check `/mnt/user/appdata/bambu-lab/data/cover-cache` permissions

### Database Issues
- Backup: `cp /mnt/user/appdata/bambu-lab/data/bambu.db bambu.db.backup`
- Reset: Remove `bambu.db` and restart container (will re-sync from cloud)

## GitHub Actions Setup

To enable automatic builds:

1. **Fork/Push to GitHub**
2. **Enable GitHub Actions** (automatic)
3. **Optional: Docker Hub**
   - Go to Repository Settings → Secrets
   - Add `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`
   - Images will push to both GitHub and Docker Hub

4. **Create a Release**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
   - GitHub Actions will build and push tagged images
   - Supports semantic versioning (v1.0.0, v1.0, v1, latest)

## Multi-Architecture Support

The GitHub Actions workflow builds for:
- **linux/amd64** - Intel/AMD processors (most common)
- **linux/arm64** - ARM processors (some Unraid servers, Raspberry Pi)

## Support

- **Issues**: https://github.com/YOUR_GITHUB_USERNAME/bambu/issues
- **Buy Me a Coffee**: https://buymeacoffee.com/tr1ck
