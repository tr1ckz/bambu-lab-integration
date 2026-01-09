# PrintHive Code Audit - Improvements List

## 🔴 CRITICAL ISSUES (Fix Immediately)

### 1. Memory Leaks in Components
**Files:** `Printers.tsx`, `Settings.tsx`, `DashboardHome.tsx`, `Library.tsx`, `LoadingSplash.tsx`
**Issue:** `setInterval` not cleaned up in useEffect, causing memory leaks
**Fix:** Add cleanup returns

### 2. Hardcoded API URLs
**Files:** `simple-server.js` (15+ occurrences), `bambuCloud.js`, `vite.config.ts`
**Issue:** API URLs hardcoded throughout - hard to configure for different environments
**Fix:** Extract to config file with environment variables

### 3. Missing Input Validation
**Files:** `simple-server.js` (file upload endpoints), `Library.tsx`
**Issue:** No sanitization of file paths - potential directory traversal attacks
**Fix:** Add path validation and sanitization

### 4. Toast Duration Too Short
**Files:** `Toast.tsx`, all components using toasts
**Issue:** 3-second timeout too short for long error messages
**Fix:** Calculate duration based on message length (min 3s, max 10s)

## 🟡 HIGH PRIORITY

### 5. Missing Page Counter in Library
**File:** `Library.tsx`
**Issue:** Users can't see which page they're on or total pages
**Fix:** Add "Page X of Y" display like PrintHistory has

### 6. No Cursor Pointers on Clickable Elements
**Files:** Multiple CSS files
**Issue:** Cards, stat boxes, and links don't show pointer cursor
**Fix:** Add `cursor: pointer` to clickable elements

### 7. Search Not Debounced
**Files:** `PrintHistory.tsx`, `Library.tsx`, `Duplicates.tsx`
**Issue:** Search fires on every keystroke causing re-renders
**Fix:** Add 300ms debounce to search inputs

### 8. Missing Loading States
**Files:** `Settings.tsx`, `Maintenance.tsx`
**Issue:** Long operations (backup, sync) appear frozen
**Fix:** Add progress indicators/spinners

### 9. CSS Hardcoded Colors
**Files:** `Statistics.css`, `ModelViewer.css`, `Maintenance.css`
**Issue:** Colors hardcoded instead of using CSS variables
**Fix:** Replace with theme variables

### 10. Number Formatting Inconsistency
**Files:** Multiple components
**Issue:** Some use `.toLocaleString()`, others don't - inconsistent UX
**Fix:** Create utility function for consistent formatting

## 🟢 MEDIUM PRIORITY

### 11. Settings.tsx is 2,769 Lines
**File:** `Settings.tsx`
**Issue:** Monolithic component, hard to maintain
**Fix:** Split into 10+ smaller components (BambuSettings, PrinterSettings, etc.)

### 12. simple-server.js is 7,311 Lines  
**File:** `simple-server.js`
**Issue:** God object antipattern
**Fix:** Split into route modules (auth.js, printers.js, library.js, etc.)

### 13. No Confirmation for Destructive Actions
**Files:** `Library.tsx` (bulk delete), `UserManagement.tsx` (delete user)
**Issue:** Native `confirm()` is ugly, no cancel option for bulk operations
**Fix:** Use ConfirmModal component consistently

### 14. Mobile Responsiveness Issues
**Files:** `Printers.css`, `Statistics.css`
**Issue:** Cards overflow, text too small on mobile
**Fix:** Add better media queries, test on mobile viewport

### 15. Missing Error Boundaries
**Files:** All components
**Issue:** One component crash brings down entire app
**Fix:** Add error boundaries to major sections

### 16. No Retry Logic for Failed Requests
**Files:** All fetch calls
**Issue:** Network blips cause permanent failures
**Fix:** Add exponential backoff retry for critical operations

### 17. Video Modal Missing Close Button
**File:** `PrintHistory.tsx`
**Issue:** Only way to close video is clicking outside
**Fix:** Add X button in corner

### 18. AMS Data Not Cached
**File:** `Printers.tsx`
**Issue:** Re-fetches AMS data every 2 seconds even when not printing
**Fix:** Only refresh when printer state changes

### 19. No Keyboard Shortcuts
**Files:** All components
**Issue:** Power users can't navigate efficiently
**Fix:** Add shortcuts (Esc to close modals, Ctrl+K for search, etc.)

### 20. Duplicate Code in Background Loops
**File:** `simple-server.js`
**Issue:** Cloud sync, library scan, video match have similar structure
**Fix:** Extract common pattern into reusable scheduler function

## 🔵 LOW PRIORITY (Nice to Have)

### 21. No Dark/Light Mode Toggle
**Issue:** Users stuck with one theme
**Fix:** Add theme toggle in Settings

### 22. Statistics Charts Not Interactive
**File:** `Statistics.tsx`
**Issue:** Can't click on chart bars to drill down
**Fix:** Add click handlers to filter data

### 23. No Print Cost Trends Over Time
**File:** `Statistics.tsx`
**Issue:** Can see total cost but not how it changes
**Fix:** Add cost-over-time graph

### 24. No Bulk Tag Operations in Library
**File:** `Library.tsx`
**Issue:** Can't add same tag to multiple files
**Fix:** Add bulk tag editor

### 25. Printer Status Doesn't Auto-Refresh
**File:** `Printers.tsx`
**Issue:** Must manually refresh to see status changes
**Fix:** Add WebSocket connection or polling

### 26. No Export to CSV for Print History
**File:** `PrintHistory.tsx`
**Issue:** Can't export data for external analysis
**Fix:** Add CSV export button

### 27. No Filament Inventory Tracking
**Issue:** Users don't know how much filament left
**Fix:** Add filament spool tracker with low-stock alerts

### 28. Missing Print Queue Management
**Issue:** Can't see or manage queued prints
**Fix:** Add queue view with priority/reordering

### 29. No Email Notifications
**Issue:** Only Discord/Telegram/Slack supported
**Fix:** Add SMTP email notification option

### 30. Library Search Only Matches Filename
**File:** `Library.tsx`
**Issue:** Can't search by tags or description
**Fix:** Extend search to all fields

## Summary

- **Critical:** 4 issues (security, performance, UX blockers)
- **High:** 6 issues (UX polish, performance)
- **Medium:** 16 issues (code quality, features)
- **Low:** 10 issues (nice-to-haves)

**Total:** 36 actionable improvements identified

## Quick Wins (< 30 minutes each)
1. Add page counter to Library
2. Add cursor: pointer to clickable elements  
3. Fix toast duration
4. Add close button to video modal
5. Use ConfirmModal for bulk delete
6. Add keyboard shortcut for Esc to close modals
7. Debounce search inputs
8. Extract API URLs to config

## Recommended Fix Order
1. Memory leaks (critical, affects all users over time)
2. Toast duration (critical UX, easy fix)
3. Page counter (quick win, improves UX)
4. Cursor pointers (quick win, improves perceived usability)
5. Debounce search (performance, medium effort)
6. API URL config (maintenance, medium effort)
7. Input validation (security, high effort)
8. Component splitting (code quality, high effort)
