// Content script for Chrome extension

console.log('Content script loaded');

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener(
  (
    request: { action: string; data?: unknown },
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ) => {
    console.log('Content script received message:', request);

    if (request.action === 'getPageInfo') {
      sendResponse({
        title: document.title,
        url: window.location.href,
      });
    }

    return true; // Keep the message channel open for async responses
  }
);

// Export empty object to make this a module
export {};
