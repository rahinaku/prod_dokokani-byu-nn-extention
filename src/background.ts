// Background script for Chrome extension

// Store station data per tab
interface StationData {
  stations: string[];
  manualStations: string[];
  url: string;
  timestamp: number;
}

const stationDataByTab = new Map<number, StationData>();

// Storage key for persistent manual stations
const STORAGE_KEY = 'manualStations';

// Load manual stations from storage on startup
async function loadManualStations(): Promise<string[]> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY] || [];
  } catch (error) {
    console.error('Error loading manual stations:', error);
    return [];
  }
}

// Save manual stations to storage
async function saveManualStations(stations: string[]): Promise<void> {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: stations });
    console.log('Manual stations saved to storage:', stations);
  } catch (error) {
    console.error('Error saving manual stations:', error);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener(
  (
    request: {
      action: string;
      data?: unknown;
      stations?: string[];
      manualStations?: string[];
      url?: string;
      timestamp?: number;
    },
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ) => {
    console.log('Message received:', request);

    if (request.action === 'ping') {
      sendResponse({ status: 'pong' });
    }

    // Store station data when extracted from content script
    if (request.action === 'stationsExtracted') {
      if (sender.tab?.id && request.stations) {
        const tabId = sender.tab.id;
        const stations = request.stations;
        // Load manual stations from persistent storage
        loadManualStations().then((manualStations) => {
          stationDataByTab.set(tabId, {
            stations: stations,
            manualStations: manualStations,
            url: request.url || '',
            timestamp: request.timestamp || Date.now(),
          });
          console.log(`Stored ${stations.length} stations for tab ${tabId}`);
          sendResponse({ success: true });
        });
      }
      return true; // Keep message channel open for async response
    }

    // Store manual station data from popup
    if (request.action === 'addManualStation') {
      chrome.tabs.query(
        { active: true, currentWindow: true },
        async (tabs: chrome.tabs.Tab[]) => {
          const currentTab = tabs[0];
          if (currentTab?.id && request.manualStations) {
            const existingData = stationDataByTab.get(currentTab.id);
            stationDataByTab.set(currentTab.id, {
              stations: existingData?.stations || [],
              manualStations: request.manualStations,
              url: request.url || currentTab.url || '',
              timestamp: request.timestamp || Date.now(),
            });
            // Save to persistent storage
            await saveManualStations(request.manualStations);
            console.log(
              `Stored ${request.manualStations.length} manual stations for tab ${currentTab.id}`
            );
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false });
          }
        }
      );
      return true; // Keep message channel open for async response
    }

    // Retrieve stored station data for a tab
    if (request.action === 'getStoredStations') {
      chrome.tabs.query(
        { active: true, currentWindow: true },
        async (tabs: chrome.tabs.Tab[]) => {
          const currentTab = tabs[0];
          if (currentTab?.id) {
            const data = stationDataByTab.get(currentTab.id);
            // Always load manual stations from persistent storage
            const manualStations = await loadManualStations();
            if (data) {
              sendResponse({
                success: true,
                stations: data.stations,
                manualStations: manualStations,
                url: data.url,
                timestamp: data.timestamp,
              });
            } else {
              sendResponse({
                success: true,
                stations: [],
                manualStations: manualStations,
              });
            }
          } else {
            const manualStations = await loadManualStations();
            sendResponse({
              success: true,
              stations: [],
              manualStations: manualStations,
            });
          }
        }
      );
      return true; // Keep message channel open for async response
    }

    return true; // Keep the message channel open for async responses
  }
);

// Clean up data when tab is closed
chrome.tabs.onRemoved.addListener((tabId: number) => {
  if (stationDataByTab.has(tabId)) {
    stationDataByTab.delete(tabId);
    console.log(`Cleaned up data for closed tab ${tabId}`);
  }
});
