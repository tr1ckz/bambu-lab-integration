# Code Cleanup - Personal Information Removed

This document summarizes the changes made to remove personal information and make the code repository-ready.

## Files Modified

### Environment Configuration

#### `.env.example`
- Added placeholders for all configuration
- Includes PUBLIC_URL, OAuth settings, BMC username
- Safe to commit to repository

#### `.env`
- Updated with placeholder values
- **Already in .gitignore** - will not be committed

#### `.gitignore`
- Added `sessions/` to prevent committing session files
- Added `dist/` to prevent committing build artifacts
- `.env` already excluded

### Source Code Changes

#### `src/components/BuyMeACoffee.tsx`
- Removed hardcoded username `'tr1ck'`
- Now uses `import.meta.env.VITE_BMC_USERNAME` from environment
- Button won't render if no username is configured

#### `src/components/Dashboard.tsx`
- Removed `username="tr1ck"` prop from BuyMeACoffee component
- Component now gets username from environment

#### `simple-server.js`
- Changed `'https://3d.tr1ck.dev'` to `process.env.PUBLIC_URL || 'http://localhost:3000'` (2 locations)
- Now uses environment variable with localhost fallback

#### `vite.config.ts`
- Added `define` section to pass VITE_BMC_USERNAME to frontend
- Enables environment variable support in React components

### Docker Configuration

#### `Dockerfile`
- Added `ARG VITE_BMC_USERNAME` build argument
- Passes BMC username during build if provided
- Username optional - button won't show if not set

#### `docker-compose.yml`
- Added `PUBLIC_URL` environment variable
- Added `VITE_BMC_USERNAME` environment variable (optional)
- Updated comments to be generic

#### `.github/workflows/docker-build.yml`
- Added `VITE_BMC_USERNAME=${{ secrets.BMC_USERNAME }}` to build args
- Enables optional BMC button in GitHub Actions builds

### Documentation

#### `UNRAID-INSTALL.md`
- Changed donate link text to "Support the Developer"
- Uses placeholder `YOUR_BMC_USERNAME`
- Removed specific personal references

#### `README-ENV.md` (NEW)
- Comprehensive environment variable documentation
- Examples for different OIDC providers
- Instructions for generating SESSION_SECRET

## Session Data Cleanup

### Deleted Files
- All `sessions/*.json` files removed (contained authentication tokens)
- These files will be regenerated on first login

## Personal Information Removed

### Domains
- ✅ `3d.tr1ck.dev` → `localhost:3000` or `$PUBLIC_URL`
- ✅ `auth.tr1ck.dev` → Configurable via OAuth settings

### Usernames
- ✅ `tr1ck` (BMC) → `$VITE_BMC_USERNAME` (optional)
- ✅ Admin usernames → Stored only in local database

### OAuth Configuration
- ✅ Now fully configurable via environment variables or web UI
- ✅ No hardcoded issuer URLs

## What Users Need to Configure

### Required
1. **SESSION_SECRET**: Random string for session encryption
   ```bash
   openssl rand -base64 32
   ```

2. **PUBLIC_URL**: Where the application is hosted
   ```bash
   https://bambu.yourdomain.com
   ```

### Optional
3. **OAuth Configuration**: Can be set via environment or web interface
   - OAUTH_ISSUER
   - OAUTH_CLIENT_ID
   - OAUTH_CLIENT_SECRET
   - OAUTH_REDIRECT_URI

4. **Buy Me a Coffee**: Only if showing donate button
   - VITE_BMC_USERNAME

## Safe to Commit

All modified files are now safe to commit to a public repository:
- ✅ No hardcoded domains
- ✅ No usernames or passwords
- ✅ No authentication tokens
- ✅ No personal configuration
- ✅ Session files excluded by .gitignore
- ✅ .env excluded by .gitignore
- ✅ data/ directory excluded by .gitignore

## Next Steps

1. **Review .env file**: Ensure it contains no personal data
2. **Test configuration**: Verify environment variables work
3. **Commit changes**: All files ready for repository
4. **Update README**: Add your specific deployment instructions
5. **Push to GitHub**: Ready for public or private repository

## GitHub Secrets for Actions

To enable Buy Me a Coffee button in Docker builds, add secret to your GitHub repository:

1. Go to Settings → Secrets and variables → Actions
2. Add secret: `BMC_USERNAME` with your Buy Me a Coffee username
3. This is optional - builds work without it

## Docker Hub (Optional)

To publish to Docker Hub in addition to GitHub Container Registry:

1. Go to Settings → Secrets and variables → Actions
2. Add secrets:
   - `DOCKERHUB_USERNAME`: Your Docker Hub username
   - `DOCKERHUB_TOKEN`: Docker Hub access token

## Testing Locally

Before pushing, test with clean environment:

```bash
# Remove any personal data
rm -rf sessions/*.json
rm -rf data/bambu.db

# Set environment variables
export SESSION_SECRET=$(openssl rand -base64 32)
export PUBLIC_URL=http://localhost:3000

# Start application
npm run dev
```

## Summary

The codebase has been successfully cleaned of all personal information. All configuration is now handled through environment variables with safe defaults. The application is ready to be shared publicly or deployed by other users.
