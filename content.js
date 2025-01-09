/**
 * Copyright (c) 2025 Mike McCracken
 * MIT License - see LICENSE file in root directory
 */
// Get debug mode from storage
async function getDebugMode() {
  return (await chrome.storage.sync.get(STORAGE_KEYS.DEBUG_MODE))[STORAGE_KEYS.DEBUG_MODE] || false;
}

// Get the user's selected browser from storage
async function getSelectedBrowser() {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.SELECTED_BROWSER);
  if (await getDebugMode()) {
    console.log('Click Interceptor - Retrieved browser from storage:', result);
  }
  return result[STORAGE_KEYS.SELECTED_BROWSER];
}

// Save the user's browser selection
async function saveSelectedBrowser(browser) {
  if (await getDebugMode()) {
    console.log('Click Interceptor - Saving browser selection:', browser);
  }
  await chrome.storage.sync.set({ [STORAGE_KEYS.SELECTED_BROWSER]: browser });
}

// Get the Finicky config from storage
async function getFinickyConfig() {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.CONFIG);
  if (await getDebugMode()) {
    console.log('Click Interceptor - Retrieved config from storage:', result);
  }
  return result[STORAGE_KEYS.CONFIG] || { handlers: [] };
}

// Get redirect to default setting from storage
async function getRedirectToDefault() {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.REDIRECT_TO_DEFAULT);
  return result[STORAGE_KEYS.REDIRECT_TO_DEFAULT] || false;
}

// Convert http(s) URL to finicky(s) URL
function toFinickyUrl(url) {
  return url.replace(/^https?:\/\//, match =>
    match === 'https://' ? 'finickys://' : 'finicky://');
}

// Initialize and set up click handling
async function initialize() {
  document.addEventListener('click', async (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const url = link.href;
    if (!url) return;

    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') return;

    // Prevent default immediately to ensure the link doesn't navigate
    e.preventDefault();

    const currentBrowser = await getSelectedBrowser();
    if (!currentBrowser) {
      // Create modal container
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2147483647;
      `;

      // Create dialog box
      const dialog = document.createElement('div');
      dialog.style.cssText = `
        background: #ffffff;
        color: #000000;
        border-radius: 8px;
        padding: 20px;
        max-width: 400px;
        width: calc(100% - 40px);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        position: relative;
        margin: 20px;
      `;

      dialog.innerHTML = `
        <h2 style="margin: 0 0 16px 0; color: #000000; font-size: 18px;">Finicky Link Router</h2>
        <p style="margin: 0 0 16px 0; color: #000000; font-size: 14px;">
          This extension is not configured. Please configure it to start routing links to the correct browser.
        </p>
        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <button id="configureBtn" style="
            background: #0366d6;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          ">Configure Now</button>
          <button id="closeBtn" style="
            background: #f1f2f3;
            color: #000000;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          ">Close</button>
        </div>
      `;

      modal.appendChild(dialog);
      document.body.appendChild(modal);

      // Handle button clicks
      return new Promise((resolve) => {
        document.getElementById('configureBtn').addEventListener('click', () => {
          chrome.runtime.sendMessage({ action: 'openOptionsPage' });
          modal.remove();
          resolve(true); // Proceed with original navigation
        });

        document.getElementById('closeBtn').addEventListener('click', () => {
          modal.remove();
          resolve(true); // Proceed with original navigation
        });

        // Close on background click
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.remove();
            resolve(true); // Proceed with original navigation
          }
        });
      }).then(() => {
        window.location.href = url;
      });
    }

    const config = await getFinickyConfig();
    const targetBrowser = await getTargetBrowser(config, url);
    const intercept = !!targetBrowser && targetBrowser !== currentBrowser;

    const destination = intercept ? toFinickyUrl(url) : url;

    if (await getDebugMode()) {
      console.log('Link routing:', {
        url,
        destination,
        currentBrowser,
        targetBrowser,
        willIntercept: intercept
      });
      alert(`Link routing:

  URL: ${url}
  Destination: ${destination}
  Will intercept: ${intercept ? 'Yes' : 'No'}
  Target browser: ${targetBrowser}
  Current browser: ${currentBrowser}`);
    }

    // If we should use the default browser behavior, trigger the link
    window.location.href = destination;
  });
}

// Determine target browser based on Finicky rules
async function getTargetBrowser(config, url) {
  if (!config || !config.handlers) return config.defaultBrowser;

  for (const handler of config.handlers) {
    if (handler.match && handler.browser) {
      const pattern = handler.match;
      if (typeof pattern === 'string' && url.includes(pattern)) {
        return handler.browser;
      } else if (pattern.type === 'regex') {
        const regex = new RegExp(pattern.pattern, pattern.flags);
        if (regex.test(url)) {
          return handler.browser;
        }
      }
    }
  }

  // Check redirect to default setting before returning default browser
  const redirectToDefault = await getRedirectToDefault();
  return redirectToDefault ? config.defaultBrowser : null;
}

// Start the extension
initialize();