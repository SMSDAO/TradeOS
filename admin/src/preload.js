const { contextBridge } = require('electron');

// Note: No APIs exposed to renderer for security.
// The admin webapp loads from NEXT_PUBLIC_BACKEND_URL and should
// handle its own authentication and data fetching via HTTP APIs.
contextBridge.exposeInMainWorld('electronAPI', {
  // Reserved for future secure APIs if needed
});
