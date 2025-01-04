// Get debug mode from storage
async function getDebugMode() {
  return (await chrome.storage.sync.get(STORAGE_KEYS.DEBUG_MODE))[STORAGE_KEYS.DEBUG_MODE] || false;
}

// Get selected browser from storage
async function getSelectedBrowser() {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.SELECTED_BROWSER);
  if (await getDebugMode()) {
    console.log('Options page - Retrieved browser from storage:', result);
  }
  return result[STORAGE_KEYS.SELECTED_BROWSER] || '';
}

// Save selected browser to storage
async function saveSelectedBrowser(browser) {
  if (await getDebugMode()) {
    console.log('Options page - Saving browser selection:', browser);
  }
  await chrome.storage.sync.set({ [STORAGE_KEYS.SELECTED_BROWSER]: browser });
}

// Update browser selection display
async function updateBrowserDisplay() {
  const selectedBrowser = await getSelectedBrowser();
  const browserSelect = document.getElementById('browserSelect');
  browserSelect.value = selectedBrowser || '';
}

// Update debug mode in storage
async function updateDebugMode(enabled) {
  if (await getDebugMode()) {
    console.log('Options page - Setting debug mode:', enabled);
  }
  await chrome.storage.sync.set({ [STORAGE_KEYS.DEBUG_MODE]: enabled });
}

// Load saved debug mode state
async function loadDebugMode() {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.DEBUG_MODE);
  const debugMode = result[STORAGE_KEYS.DEBUG_MODE] || false;
  if (debugMode) {
    console.log('Options page - Retrieved debug mode:', result);
  }
  document.getElementById('debugMode').checked = debugMode;
}

// Update redirect to default setting in storage
async function updateRedirectToDefault(enabled) {
  if (await getDebugMode()) {
    console.log('Options page - Setting redirect to default:', enabled);
  }
  await chrome.storage.sync.set({ [STORAGE_KEYS.REDIRECT_TO_DEFAULT]: enabled });
}

// Load saved redirect to default state
async function loadRedirectToDefault() {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.REDIRECT_TO_DEFAULT);
  if (await getDebugMode()) {
    console.log('Options page - Retrieved redirect to default:', result);
  }
  const redirectToDefault = result[STORAGE_KEYS.REDIRECT_TO_DEFAULT] || false;
  document.getElementById('redirectToDefault').checked = redirectToDefault;
}

// Default configuration
const defaultConfig = {};

// Load saved configuration
async function loadConfig() {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.CONFIG);
  if (await getDebugMode()) {
    console.log('Options page - Retrieved config:', result);
  }
  const config = result[STORAGE_KEYS.CONFIG] || defaultConfig;

  document.getElementById('configText').value = FinickyConfig.toFinickyFormat(config);
}

// Save configuration
async function saveConfig() {
  try {
    const configText = document.getElementById('configText').value;
    const config = FinickyConfig.parse(configText);

    if (await getDebugMode()) {
      console.log('Options page - Saving config:', config);
    }
    await chrome.storage.sync.set({ [STORAGE_KEYS.CONFIG]: config });
    if (await getDebugMode()) {
      console.log('Options page - Saved config:', config);
    }
    alert('Configuration saved successfully!');
  } catch (error) {
    console.error('Failed to save config:', error);
    alert('Error saving configuration. Please make sure your Finicky config is valid.');
  }
}

// Initialize the options page
async function initialize() {
  // Set up browser selection
  const browserSelect = document.getElementById('browserSelect');
  browserSelect.addEventListener('change', async () => {
    await saveSelectedBrowser(browserSelect.value);
    updateBrowserDisplay();
  });

  // Update initial displays
  updateBrowserDisplay();
  loadDebugMode();
  loadRedirectToDefault();
  loadConfig();

  document.getElementById('debugMode').addEventListener('change', (e) => updateDebugMode(e.target.checked));
  document.getElementById('redirectToDefault').addEventListener('change', (e) => updateRedirectToDefault(e.target.checked));
  document.getElementById('saveConfig').addEventListener('click', saveConfig);
}

document.addEventListener('DOMContentLoaded', initialize);
