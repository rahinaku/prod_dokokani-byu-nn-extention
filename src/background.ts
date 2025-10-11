// Background script for Chrome extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener(
  (
    request: { action: string; data?: unknown },
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ) => {
    console.log('Message received:', request);

    if (request.action === 'ping') {
      sendResponse({ status: 'pong' });
    }

    return true; // Keep the message channel open for async responses
  }
);

// Export empty object to make this a module
export {};
