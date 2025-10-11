// Content script for Chrome extension

console.log('Content script loaded');

// Store station names extracted on page load
let cachedStationNames: string[] = [];

// Function to extract station names from the page
function getStationNames(): string[] {
  const stationElements = document.querySelectorAll(
    '.destination_outline h3.ttl a'
  );
  const stationNames: string[] = [];

  stationElements.forEach((element) => {
    const stationName = element.textContent?.trim();
    if (stationName) {
      stationNames.push(stationName);
    }
  });

  return stationNames;
}

// Auto-extract station names when page is fully loaded
function autoExtractStationNames() {
  console.log('Attempting to auto-extract station names...');
  cachedStationNames = getStationNames();

  if (cachedStationNames.length > 0) {
    console.log(
      `Found ${cachedStationNames.length} station names:`,
      cachedStationNames
    );

    // Send message to background script to store the data
    chrome.runtime
      .sendMessage({
        action: 'stationsExtracted',
        stations: cachedStationNames,
        url: window.location.href,
        timestamp: Date.now(),
      })
      .then(() => {
        // After extracting, get manual stations and highlight matches
        return chrome.runtime.sendMessage({ action: 'getStoredStations' });
      })
      .then(
        (response: {
          success: boolean;
          stations: string[];
          manualStations: string[];
        }) => {
          if (response && response.success && response.manualStations) {
            console.log(
              'Auto-highlighting with manual stations:',
              response.manualStations
            );
            highlightMatchingStations(response.manualStations);
          }
        }
      )
      .catch((error) => {
        console.log('Could not send message to background:', error);
      });
  } else {
    console.log('No station names found on this page');
  }
}

// Wait for page to be fully loaded before extracting
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit more for dynamic content to load
    setTimeout(autoExtractStationNames, 1000);
  });
} else {
  // DOM is already loaded
  setTimeout(autoExtractStationNames, 1000);
}

// Function to highlight matching stations
function highlightMatchingStations(manualStations: string[]) {
  console.log('Highlighting matching stations:', manualStations);

  // Get all destination items
  const destinationItems = document.querySelectorAll('.destination_item');

  destinationItems.forEach((item) => {
    // Find the station name link within this item
    const stationLink = item.querySelector('.destination_outline h3.ttl a');
    if (stationLink) {
      const stationName = stationLink.textContent?.trim();

      // Check if this station matches any manual station
      if (stationName && manualStations.includes(stationName)) {
        console.log(`Highlighting station: ${stationName}`);
        // Add green border to the destination_item
        (item as HTMLElement).style.border = '3px solid #00ff00';
        (item as HTMLElement).style.borderRadius = '8px';
        (item as HTMLElement).style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.3)';
      } else {
        // Remove highlight if it doesn't match
        (item as HTMLElement).style.border = '';
        (item as HTMLElement).style.borderRadius = '';
        (item as HTMLElement).style.boxShadow = '';
      }
    }
  });
}

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener(
  (
    request: { action: string; data?: unknown; manualStations?: string[] },
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ) => {
    console.log('Content script received message:', request);

    if (request.action === 'ping') {
      sendResponse({ success: true });
    }

    if (request.action === 'getPageInfo') {
      sendResponse({
        title: document.title,
        url: window.location.href,
      });
    }

    if (request.action === 'getStationNames') {
      const stations = getStationNames();
      sendResponse({
        success: true,
        stations: stations,
        count: stations.length,
      });
    }

    if (request.action === 'highlightStations') {
      if (request.manualStations) {
        highlightMatchingStations(request.manualStations);
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'No manual stations provided' });
      }
    }

    return true; // Keep the message channel open for async responses
  }
);
