/**
 * Copyright (c) 2025 Mike McCracken
 * MIT License - see LICENSE file in root directory
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openOptionsPage') {
    chrome.runtime.openOptionsPage();
  }
});
