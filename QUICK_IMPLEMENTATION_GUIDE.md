# Quick Implementation Guide

This guide provides step-by-step instructions to complete the remaining tasks from the code audit.

## 1. Complete API URL Integration (Est: 30-45 min)

### Step 1: Import API config in each component
Add to the top of each component file:
```typescript
import { API_ENDPOINTS } from '../config/api';
```

### Step 2: Replace hardcoded URLs
Use find-and-replace with these patterns:

**Library Component:**
- `'/api/library'` → `API_ENDPOINTS.LIBRARY.LIST`
- `'/api/library/upload'` → `API_ENDPOINTS.LIBRARY.UPLOAD`
- `'/api/library/scan'` → `API_ENDPOINTS.LIBRARY.SCAN`
- `'/api/library/scan-status'` → `API_ENDPOINTS.LIBRARY.SCAN_STATUS`
- `` `/api/library/${id}` `` → `` `${API_ENDPOINTS.LIBRARY.DELETE}/${id}` ``
- `` `/api/library/download/${id}` `` → `` `${API_ENDPOINTS.LIBRARY.DOWNLOAD}/${id}` ``
- `` `/api/library/${id}/tags` `` → `` `${API_ENDPOINTS.LIBRARY.TAGS}/${id}` ``

**PrintHistory Component:**
- `'/api/prints'` → `API_ENDPOINTS.PRINTS.LIST`
- `'/api/sync-cloud'` → `API_ENDPOINTS.SYNC.CLOUD`
- `'/api/match-videos'` → `API_ENDPOINTS.SYNC.VIDEO_MATCH`

**DashboardHome Component:**
- `'/api/printers/status'` → `API_ENDPOINTS.PRINTERS.STATUS`
- `'/api/statistics'` → `API_ENDPOINTS.STATISTICS.GET`
- `'/api/prints?limit=5'` → `` `${API_ENDPOINTS.PRINTS.LIST}?limit=5` ``

**Dashboard Component:**
- `'/api/user/me'` → `API_ENDPOINTS.AUTH.USER_ME`
- `'/api/settings/ui'` → `API_ENDPOINTS.SETTINGS.UI`

**App.tsx:**
- `'/api/check-auth'` → `API_ENDPOINTS.AUTH.CHECK_AUTH`
- `'/api/settings/ui'` → `API_ENDPOINTS.SETTINGS.UI`

## 2. Complete CSS Variable Migration (Est: 30-45 min)

### Files to update:

**Toast.css:**
```css
/* Before */
background: rgba(255,255,255,0.9);
color: rgba(30,30,30,0.95);

/* After */
background: var(--text-primary);
color: var(--bg-dark);
```

**TagsInput.css:**
```css
/* Before */
background: rgba(127,0,255,0.1);
border: 1px solid #7f00ff;

/* After */
background: var(--bg-hover);
border: 1px solid var(--border-focus);
```

**Statistics.css:**
```css
/* Before */
background: #10b981; /* success green */
background: #ef4444; /* error red */

/* After */
background: var(--status-success);
background: var(--status-error);
```

**UserManagement.css:**
```css
/* Before */
background: rgba(30,30,30,0.95);
color: #dc2626;

/* After */
background: var(--bg-dark);
color: var(--status-error-dark);
```

**LoadingSplash.css:**
```css
/* Before */
background: rgba(20,20,30,0.98);
color: #6ee7b7;

/* After */
background: var(--bg-overlay);
color: var(--status-success-light);
```

## 3. Add Error Boundaries (Est: 20-30 min)

### Create ErrorBoundary component:

**src/components/ErrorBoundary.tsx:**
```typescript
import React, { Component, ReactNode } from 'react';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <div className="error-content">
            <h2>⚠️ Something went wrong</h2>
            <p>The application encountered an error.</p>
            <details>
              <summary>Error Details</summary>
              <pre>{this.state.error?.message}</pre>
            </details>
            <button onClick={() => window.location.reload()}>
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

**src/components/ErrorBoundary.css:**
```css
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--bg-dark);
  padding: 2rem;
}

.error-content {
  background: var(--bg-card);
  border: 1px solid var(--border-primary);
  border-radius: 16px;
  padding: 3rem;
  max-width: 600px;
  text-align: center;
}

.error-content h2 {
  color: var(--status-error);
  margin-bottom: 1rem;
}

.error-content p {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.error-content details {
  text-align: left;
  margin: 1rem 0;
  background: var(--bg-modal);
  border-radius: 8px;
  padding: 1rem;
}

.error-content pre {
  color: var(--status-error-dark);
  font-size: 0.85rem;
  overflow-x: auto;
}

.error-content button {
  background: var(--color-primary);
  border: none;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: transform 0.2s;
}

.error-content button:hover {
  transform: scale(1.05);
}
```

### Wrap critical components in Dashboard.tsx:
```typescript
import ErrorBoundary from './ErrorBoundary';

// Wrap each tab content
<ErrorBoundary>
  {activeTab === 'home' && <DashboardHome />}
</ErrorBoundary>

<ErrorBoundary>
  {activeTab === 'library' && <Library userRole={userRole} />}
</ErrorBoundary>
```

## 4. Add Retry Logic (Est: 20-30 min)

### Create retry utility:

**src/utils/fetchWithRetry.ts:**
```typescript
interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  backoffMultiplier?: number;
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const {
    maxRetries = 3,
    delayMs = 1000,
    backoffMultiplier = 2
  } = retryOptions;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        return response;
      }

      // Retry on server errors (5xx)
      if (response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = delayMs * Math.pow(backoffMultiplier, attempt);
      console.warn(`Fetch failed, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error(`Failed after ${maxRetries} retries: ${lastError!.message}`);
}
```

### Usage example:
```typescript
import { fetchWithRetry } from '../utils/fetchWithRetry';

// Replace:
const response = await fetch('/api/prints');

// With:
const response = await fetchWithRetry('/api/prints', {}, { maxRetries: 3 });
```

## 5. Add Keyboard Shortcuts (Est: 15-20 min)

### Create keyboard hook:

**src/hooks/useKeyboardShortcut.ts:**
```typescript
import { useEffect } from 'react';

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: { ctrl?: boolean; shift?: boolean; alt?: boolean } = {}
) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const { ctrl, shift, alt } = options;
      
      const ctrlMatch = ctrl ? event.ctrlKey || event.metaKey : true;
      const shiftMatch = shift ? event.shiftKey : true;
      const altMatch = alt ? event.altKey : true;
      
      if (
        event.key === key &&
        ctrlMatch &&
        shiftMatch &&
        altMatch &&
        (!ctrl || event.ctrlKey || event.metaKey) &&
        (!shift || event.shiftKey) &&
        (!alt || event.altKey)
      ) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, callback, options]);
}
```

### Usage in components:

**Close modals with Esc:**
```typescript
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';

// In modal component:
useKeyboardShortcut('Escape', () => {
  if (viewingModel) setViewingModel(null);
  if (editingFile) setEditingFile(null);
  if (deleteConfirm) setDeleteConfirm(null);
});
```

**Search with Ctrl+K:**
```typescript
// In Library or PrintHistory:
import { useRef } from 'react';

const searchInputRef = useRef<HTMLInputElement>(null);

useKeyboardShortcut('k', () => {
  searchInputRef.current?.focus();
}, { ctrl: true });

// Add ref to input:
<input ref={searchInputRef} ... />
```

## 6. Settings.tsx Componentization (Est: 3-4 hours)

### Phase 1: Create component files

1. Create directory: `src/components/settings/`

2. Extract each section:
   - BambuSettings.tsx (lines ~100-200)
   - PrinterSettings.tsx (lines ~200-400)
   - UISettings.tsx (lines ~400-600)
   - NotificationSettings.tsx (lines ~600-900)
   - CostSettings.tsx (lines ~900-1200)
   - BackupSettings.tsx (lines ~1200-1500)
   - OAuthSettings.tsx (lines ~1500-1800)
   - AdminSettings.tsx (lines ~1800-2100)

3. Create layout components:
   - SettingsNav.tsx (sidebar navigation)
   - SettingsLayout.tsx (wrapper with nav + content)

### Phase 2: Update Settings.tsx to use new components

```typescript
import { useState } from 'react';
import SettingsLayout from './settings/SettingsLayout';
import BambuSettings from './settings/BambuSettings';
import PrinterSettings from './settings/PrinterSettings';
// ... import others

const Settings = () => {
  const [activeSection, setActiveSection] = useState('bambu');

  return (
    <SettingsLayout
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    >
      {activeSection === 'bambu' && <BambuSettings />}
      {activeSection === 'printers' && <PrinterSettings />}
      {/* ... render others */}
    </SettingsLayout>
  );
};
```

## 7. simple-server.js Route Splitting (Est: 4-6 hours)

### Phase 1: Create route files

1. Create directory: `routes/`

2. Create each route file:
```javascript
// routes/auth.js
const express = require('express');
const router = express.Router();

router.post('/login', async (req, res) => {
  // Move login logic here
});

router.post('/logout', async (req, res) => {
  // Move logout logic here
});

module.exports = router;
```

3. Repeat for: printers.js, library.js, models.js, prints.js, settings.js, maintenance.js, statistics.js, system.js, users.js, video.js, duplicates.js

### Phase 2: Create middleware

```javascript
// middleware/auth.js
function requireAuth(req, res, next) {
  if (!req.session.authenticated) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.authenticated || req.session.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
```

### Phase 3: Update simple-server.js

```javascript
// Import routes
const authRoutes = require('./routes/auth');
const printerRoutes = require('./routes/printers');
// ... import others

// Mount routes
app.use('/api', authRoutes);
app.use('/api/printers', printerRoutes);
// ... mount others
```

## Testing Checklist

After each change, verify:
- [ ] `npm run build` succeeds
- [ ] No TypeScript errors
- [ ] Application loads in browser
- [ ] Core functionality works (login, view library, view prints)
- [ ] No console errors

## Priority Order

1. **Quick wins first** (30-60 min total):
   - API URL integration
   - CSS variable migration
   - Error boundaries
   - Keyboard shortcuts

2. **Medium effort** (1-2 hours total):
   - Retry logic
   - Complete input validation

3. **Large refactors** (6-10 hours total):
   - Settings componentization
   - Server route splitting

Save refactors for a dedicated session when you have uninterrupted time.
