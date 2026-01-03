# New Features Added - Manyfold-Inspired Enhancements

## Database Schema Updates

### New Tables
- **`tags`** - Stores all unique tags
- **`model_tags`** - Junction table linking models to tags (many-to-many)
- **`problems`** - Tracks detected issues with models
- **`library.fileHash`** - SHA256 hash column added for duplicate detection

## API Endpoints Added

### Tagging System
- `GET /api/tags` - List all tags with model counts
- `POST /api/models/:id/tags` - Add tag to a model
- `DELETE /api/models/:id/tags/:tagId` - Remove tag from model
- `GET /api/models/:id/tags` - Get all tags for a model

### Search & Filtering
- `GET /api/library/search` - Advanced search with filters:
  - `q` - Search text (filename, description)
  - `tags` - Filter by comma-separated tags
  - `fileType` - Filter by file extension
  - `hasHash` - Filter by hash existence (true/false)
  - `hasPrint` - Filter by print history (true/false)
  - `hasProblem` - Filter by problem status (true/false)
  - `limit` & `offset` - Pagination

### Duplicate Detection
- `POST /api/models/:id/calculate-hash` - Calculate SHA256 hash for one model
- `POST /api/library/calculate-all-hashes` - Calculate hashes for all models
- `GET /api/library/duplicates` - Find all duplicate files grouped by hash

### Problem Detection
- `POST /api/library/detect-problems` - Scan all models for issues
- `GET /api/models/:id/problems` - Get problems for specific model
- `POST /api/problems/:id/resolve` - Mark a problem as resolved

### Bulk Operations
- `POST /api/models/bulk/tags` - Add tags to multiple models
- `DELETE /api/models/bulk/tags` - Remove tags from multiple models
- `POST /api/models/bulk/delete` - Delete multiple models

### Metadata & Analysis
- `POST /api/library/parse-folder-tags` - Auto-tag models based on folder structure
- `GET /api/library/stats` - Get library statistics

### Enhanced Library Endpoint
- `GET /api/library` - Now returns tags and problem counts for each model

## Problem Types Detected

The system automatically detects these issues:

1. **missing_file** (Error) - File doesn't exist on disk
2. **never_printed** (Info) - Model has never been printed
3. **no_thumbnail** (Warning) - Model has no thumbnail
4. **no_description** (Info) - Model has no description
5. **no_tags** (Info) - Model has no tags
6. **no_hash** (Info) - File hash not calculated
7. **duplicate** (Warning) - Duplicate file detected by hash

## How to Use

### 1. Calculate File Hashes (for duplicate detection)
```bash
POST /api/library/calculate-all-hashes
```

### 2. Auto-Tag from Folder Structure
```bash
POST /api/library/parse-folder-tags
```
This creates tags from folder names in the file path.

### 3. Detect Problems
```bash
POST /api/library/detect-problems
```
Scans all models and creates problem records.

### 4. Search Library
```bash
GET /api/library/search?q=dragon&tags=miniature,fantasy&hasPrint=false&limit=50
```

### 5. Find Duplicates
```bash
GET /api/library/duplicates
```

### 6. Get Statistics
```bash
GET /api/library/stats
```

Returns:
- Total models & size
- Tag statistics
- Problem counts
- Duplicate groups
- Never-printed models

## Frontend Integration Needed

To make these features accessible in the UI, you'll want to add:

1. **Tag Manager**
   - Tag input/autocomplete on model cards
   - Tag cloud/filter sidebar
   - Bulk tag operations

2. **Search Bar**
   - Text search with filters
   - Tag filter chips
   - Quick filters (has problems, never printed, duplicates)

3. **Problem Indicators**
   - Badge/icon showing problem count
   - Problem detail modal
   - "Resolve" button for problems

4. **Duplicate Manager**
   - View grouped duplicates
   - Compare files side-by-side
   - Bulk delete duplicates

5. **Library Stats Dashboard**
   - Overview cards (total models, size, etc.)
   - Charts for tag usage
   - Problem breakdown

6. **Bulk Actions**
   - Checkbox selection on model cards
   - Bulk action toolbar (tag, delete)
   - Select all/none buttons

## Database Migration

The database schema updates automatically on server restart. All existing data is preserved. New columns and tables are created with proper indexes for performance.
