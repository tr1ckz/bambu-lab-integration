// API Configuration
// Central configuration for all API endpoints

const API_BASE_URL = process.env.VITE_API_BASE_URL || '';

export const API_ENDPOINTS = {
  // Bambu Cloud API
  BAMBU_API: {
    GLOBAL: 'https://api.bambulab.com',
    CHINA: 'https://api.bambulab.cn',
    US: 'https://api.bambulab.com',
    EU: 'https://api.bambulab.com',
  },
  
  // Local API endpoints
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    CHECK: `${API_BASE_URL}/api/check-auth`,
    OIDC: `${API_BASE_URL}/auth/oidc`,
    OIDC_CALLBACK: `${API_BASE_URL}/auth/oidc/callback`,
  },
  
  PRINTERS: {
    LIST: `${API_BASE_URL}/api/printers`,
    CAMERA_SNAPSHOT: `${API_BASE_URL}/api/camera-snapshot`,
  },
  
  MODELS: {
    LIST: `${API_BASE_URL}/api/models`,
    DOWNLOAD: (modelId: string) => `${API_BASE_URL}/api/download/${modelId}`,
    LOCAL_DOWNLOAD: (modelId: string) => `${API_BASE_URL}/api/local/download/${modelId}`,
  },
  
  LIBRARY: {
    LIST: `${API_BASE_URL}/api/library`,
    UPLOAD: `${API_BASE_URL}/api/library/upload`,
    DOWNLOAD: (id: number) => `${API_BASE_URL}/api/library/download/${id}`,
    DELETE: (id: number) => `${API_BASE_URL}/api/library/${id}`,
    THUMBNAIL: (id: number) => `${API_BASE_URL}/api/library/thumbnail/${id}`,
    SCAN: `${API_BASE_URL}/api/library/scan`,
    SCAN_STATUS: `${API_BASE_URL}/api/library/scan-status`,
    SCAN_CANCEL: `${API_BASE_URL}/api/library/scan-cancel`,
    AUTO_TAG: (id: number) => `${API_BASE_URL}/api/library/${id}/auto-tag`,
    AUTO_TAG_ALL: `${API_BASE_URL}/api/library/auto-tag-all`,
    AUTO_TAG_STATUS: `${API_BASE_URL}/api/library/auto-tag-status`,
    AUTO_TAG_CANCEL: `${API_BASE_URL}/api/library/auto-tag-cancel`,
    UPDATE_DESCRIPTION: (id: number) => `${API_BASE_URL}/api/library/${id}/description`,
    UPDATE_TAGS: (id: number) => `${API_BASE_URL}/api/library/${id}/tags`,
  },
  
  SYNC: {
    CLOUD: `${API_BASE_URL}/api/sync`,
    PRINTER_TIMELAPSES: `${API_BASE_URL}/api/sync-printer-timelapses`,
    DOWNLOAD_COVERS: `${API_BASE_URL}/api/download-missing-covers`,
  },
  
  VIDEO: {
    MATCH: `${API_BASE_URL}/api/match-videos`,
    MATCH_STATUS: `${API_BASE_URL}/api/match-videos-status`,
    MATCH_CANCEL: `${API_BASE_URL}/api/match-videos-cancel`,
    TIMELAPSE: (modelId: string) => `${API_BASE_URL}/api/timelapse/${modelId}`,
    DEBUG: `${API_BASE_URL}/api/debug/videos`,
  },
  
  SETTINGS: {
    BAMBU_STATUS: `${API_BASE_URL}/api/settings/bambu-status`,
    REQUEST_CODE: `${API_BASE_URL}/api/settings/request-code`,
    CONNECT_BAMBU: `${API_BASE_URL}/api/settings/connect-bambu`,
    DISCONNECT_BAMBU: `${API_BASE_URL}/api/settings/disconnect-bambu`,
    CHANGE_PASSWORD: `${API_BASE_URL}/api/settings/change-password`,
    TEST_PRINTER_FTP: `${API_BASE_URL}/api/settings/test-printer-ftp`,
    SAVE_PRINTER: `${API_BASE_URL}/api/settings/save-printer`,
    SAVE_UI: `${API_BASE_URL}/api/settings/save-ui`,
    GET: `${API_BASE_URL}/api/settings`,
    COSTS: `${API_BASE_URL}/api/settings/costs`,
  },
  
  MAINTENANCE: {
    TASKS: `${API_BASE_URL}/api/maintenance/tasks`,
    TASK: (id: number) => `${API_BASE_URL}/api/maintenance/tasks/${id}`,
    COMPLETE: (id: number) => `${API_BASE_URL}/api/maintenance/tasks/${id}/complete`,
    HISTORY: (taskId: number) => `${API_BASE_URL}/api/maintenance/tasks/${taskId}/history`,
  },
  
  STATISTICS: {
    DASHBOARD: `${API_BASE_URL}/api/statistics/dashboard`,
    HISTORY: `${API_BASE_URL}/api/statistics`,
  },
  
  SYSTEM: {
    HEALTH: `${API_BASE_URL}/api/health`,
    LOG_LEVEL: `${API_BASE_URL}/api/log-level`,
    RESTART: `${API_BASE_URL}/api/system/restart`,
    VERSION: `${API_BASE_URL}/api/version`,
  },
  
  USERS: {
    LIST: `${API_BASE_URL}/api/users`,
    UPDATE_ROLE: (userId: number) => `${API_BASE_URL}/api/users/${userId}/role`,
    DELETE: (userId: number) => `${API_BASE_URL}/api/users/${userId}`,
  },
  
  DUPLICATES: {
    CHECK: `${API_BASE_URL}/api/library/check-duplicates`,
  },
};

// Helper function to get Bambu API URL based on region
export function getBambuApiUrl(region: 'global' | 'china' | 'us' | 'eu' = 'global'): string {
  return API_ENDPOINTS.BAMBU_API[region.toUpperCase() as keyof typeof API_ENDPOINTS.BAMBU_API] || API_ENDPOINTS.BAMBU_API.GLOBAL;
}

// Helper function for building query strings
export function buildQueryString(params: Record<string, string | number | boolean>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    searchParams.append(key, String(value));
  });
  return searchParams.toString();
}
