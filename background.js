chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openOptionsPage') {
    chrome.runtime.openOptionsPage();
  }
});
