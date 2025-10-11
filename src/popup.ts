document.addEventListener('DOMContentLoaded', function () {
  console.log('Popup DOM loaded');
  const actionBtn = document.getElementById('actionBtn') as HTMLButtonElement;
  const result = document.getElementById('result') as HTMLDivElement;
  const stationList = document.getElementById(
    'stationList'
  ) as HTMLUListElement;
  const manualResult = document.getElementById(
    'manualResult'
  ) as HTMLDivElement;
  const manualStationList = document.getElementById(
    'manualStationList'
  ) as HTMLUListElement;
  const stationInput = document.getElementById(
    'stationInput'
  ) as HTMLInputElement;
  const addStationBtn = document.getElementById(
    'addStationBtn'
  ) as HTMLButtonElement;
  const showExtractedStationsCheckbox = document.getElementById(
    'showExtractedStations'
  ) as HTMLInputElement;
  const extractedStationsSection = document.getElementById(
    'extractedStationsSection'
  ) as HTMLDivElement;
  const errorBanner = document.getElementById('errorBanner') as HTMLDivElement;
  const errorMessage = document.getElementById(
    'errorMessage'
  ) as HTMLSpanElement;

  console.log('Elements found:', {
    actionBtn,
    result,
    stationList,
    manualResult,
    manualStationList,
    stationInput,
    addStationBtn,
    showExtractedStationsCheckbox,
    extractedStationsSection,
    errorBanner,
    errorMessage,
  });

  // Function to show error banner
  function showError(message: string) {
    errorMessage.textContent = message;
    errorBanner.classList.remove('hidden');
  }

  // Function to hide error banner
  function hideError() {
    errorBanner.classList.add('hidden');
  }

  // Storage key for the setting
  const SHOW_EXTRACTED_SETTING_KEY = 'showExtractedStations';

  // Load the setting from storage
  chrome.storage.local
    .get(SHOW_EXTRACTED_SETTING_KEY)
    .then((result) => {
      const showExtracted =
        result[SHOW_EXTRACTED_SETTING_KEY] !== undefined
          ? result[SHOW_EXTRACTED_SETTING_KEY]
          : true;
      showExtractedStationsCheckbox.checked = showExtracted;
      toggleExtractedStationsSection(showExtracted);
    })
    .catch((error) => {
      console.error('Error loading setting:', error);
    });

  // Toggle the extracted stations section
  function toggleExtractedStationsSection(show: boolean) {
    if (show) {
      extractedStationsSection.classList.remove('hidden');
    } else {
      extractedStationsSection.classList.add('hidden');
    }
  }

  // Handle checkbox change
  showExtractedStationsCheckbox.addEventListener('change', function () {
    const isChecked = showExtractedStationsCheckbox.checked;
    toggleExtractedStationsSection(isChecked);
    // Save the setting
    chrome.storage.local
      .set({ [SHOW_EXTRACTED_SETTING_KEY]: isChecked })
      .then(() => {
        console.log('Setting saved:', isChecked);
      })
      .catch((error) => {
        console.error('Error saving setting:', error);
      });
  });

  // Function to display extracted station names
  function displayStations(stations: string[], source: string) {
    if (stations.length > 0) {
      result.innerHTML = `<p>${stations.length}件の駅名が見つかりました ${source}</p>`;
      stationList.innerHTML = '';

      stations.forEach((station) => {
        const li = document.createElement('li');
        li.textContent = station;
        stationList.appendChild(li);
      });
    } else {
      result.innerHTML =
        '<p>駅名が見つかりませんでした。このページは対応していない可能性があります。</p>';
      stationList.innerHTML = '';
    }
  }

  // Function to display manual station names
  function displayManualStations(stations: string[]) {
    if (stations.length > 0) {
      manualResult.innerHTML = `<p>${stations.length}件の駅名</p>`;
      manualStationList.innerHTML = '';

      stations.forEach((station) => {
        const li = document.createElement('li');
        li.className = 'station-item-with-delete';

        const stationName = document.createElement('span');
        stationName.textContent = station;
        stationName.className = 'station-name';

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '×';
        deleteBtn.className = 'delete-btn';
        deleteBtn.title = '削除';
        deleteBtn.addEventListener('click', function () {
          deleteStation(station);
        });

        li.appendChild(stationName);
        li.appendChild(deleteBtn);
        manualStationList.appendChild(li);
      });
    } else {
      manualResult.innerHTML = '<p>駅名を入力して追加してください</p>';
      manualStationList.innerHTML = '';
    }
  }

  // Function to delete a station
  function deleteStation(stationToDelete: string) {
    chrome.runtime.sendMessage(
      { action: 'getStoredStations' },
      function (response: {
        success: boolean;
        stations: string[];
        manualStations: string[];
      }) {
        if (response && response.success && response.manualStations) {
          const updatedStations = response.manualStations.filter(
            (station) => station !== stationToDelete
          );

          // Save updated list
          chrome.runtime.sendMessage(
            {
              action: 'addManualStation',
              manualStations: updatedStations,
              timestamp: Date.now(),
            },
            function () {
              if (chrome.runtime.lastError) {
                console.error(
                  'Error deleting station:',
                  chrome.runtime.lastError
                );
                manualResult.innerHTML = `<p class="error">削除に失敗しました</p>`;
              } else {
                displayManualStations(updatedStations);
                manualResult.innerHTML = `<p>「${stationToDelete}」を削除しました</p>`;
                // Update highlighting
                highlightMatchingStations(updatedStations);
              }
            }
          );
        }
      }
    );
  }

  // Function to trigger highlighting in the content script
  function highlightMatchingStations(manualStations: string[]) {
    chrome.tabs.query(
      { active: true, currentWindow: true },
      function (tabs: chrome.tabs.Tab[]) {
        const currentTab = tabs[0];
        if (currentTab && currentTab.id) {
          chrome.tabs.sendMessage(
            currentTab.id,
            {
              action: 'highlightStations',
              manualStations: manualStations,
            },
            function (response) {
              if (chrome.runtime.lastError) {
                console.log(
                  'Error sending highlight message:',
                  chrome.runtime.lastError
                );
              } else {
                console.log('Highlight response:', response);
              }
            }
          );
        }
      }
    );
  }

  // Check if content script is available on current page (with timeout for speed)
  function checkContentScriptAvailability(
    callback: (isAvailable: boolean) => void
  ) {
    chrome.tabs.query(
      { active: true, currentWindow: true },
      function (tabs: chrome.tabs.Tab[]) {
        const currentTab = tabs[0];
        if (!currentTab || !currentTab.id) {
          callback(false);
          return;
        }

        let responded = false;

        // Set a timeout to respond quickly if no response
        const timeout = setTimeout(() => {
          if (!responded) {
            responded = true;
            callback(false);
          }
        }, 100); // 100ms timeout for fast response

        // Try to send a ping message to content script
        chrome.tabs.sendMessage(currentTab.id, { action: 'ping' }, function () {
          if (!responded) {
            responded = true;
            clearTimeout(timeout);
            if (chrome.runtime.lastError) {
              // Content script not available
              callback(false);
            } else {
              // Content script responded
              callback(true);
            }
          }
        });
      }
    );
  }

  // Auto-load stored station data when popup opens
  checkContentScriptAvailability(function (isAvailable: boolean) {
    // Show warning if page is not supported
    if (!isAvailable) {
      showError(
        'このページでは駅名の自動取得ができません。「どこかにビューン」の候補駅一覧ページでご利用ください。'
      );
      result.innerHTML = '<p>対応ページでボタンをクリックしてください</p>';
    } else {
      hideError();
    }

    chrome.runtime.sendMessage(
      { action: 'getStoredStations' },
      function (response: {
        success: boolean;
        stations: string[];
        manualStations: string[];
        url?: string;
        timestamp?: number;
      }) {
        if (chrome.runtime.lastError) {
          console.log(
            'Error getting stored stations:',
            chrome.runtime.lastError
          );
          if (isAvailable) {
            result.innerHTML =
              '<p>ボタンをクリックして駅名を取得してください</p>';
          }
          manualResult.innerHTML = '<p>駅名を入力して追加してください</p>';
          return;
        }

        if (response && response.success) {
          if (
            isAvailable &&
            response.stations &&
            response.stations.length > 0
          ) {
            displayStations(response.stations, '(自動取得済み)');
          } else if (isAvailable) {
            result.innerHTML =
              '<p>ボタンをクリックして駅名を取得してください</p>';
          }

          if (response.manualStations && response.manualStations.length > 0) {
            displayManualStations(response.manualStations);
            // Trigger highlighting when popup opens with existing manual stations
            if (isAvailable) {
              highlightMatchingStations(response.manualStations);
            }
          } else {
            manualResult.innerHTML = '<p>駅名を入力して追加してください</p>';
          }
        } else {
          if (isAvailable) {
            result.innerHTML =
              '<p>ボタンをクリックして駅名を取得してください</p>';
          }
          manualResult.innerHTML = '<p>駅名を入力して追加してください</p>';
        }
      }
    );
  });

  actionBtn.addEventListener('click', async function () {
    // Clear previous results
    hideError();
    result.innerHTML = '<p>駅名を取得中...</p>';
    stationList.innerHTML = '';

    chrome.tabs.query(
      { active: true, currentWindow: true },
      async function (tabs: chrome.tabs.Tab[]) {
        const currentTab = tabs[0];
        if (!currentTab || !currentTab.id) {
          result.innerHTML =
            '<p class="error">タブ情報を取得できませんでした</p>';
          return;
        }

        try {
          // First, try to inject the content script if it's not already loaded
          await chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            files: ['content.js'],
          });
        } catch (error) {
          // Content script might already be loaded, which is fine
          console.log(
            'Content script already loaded or injection failed:',
            error
          );
        }

        // Wait a bit for content script to initialize
        setTimeout(() => {
          // Send message to content script to get station names
          chrome.tabs.sendMessage(
            currentTab.id!,
            { action: 'getStationNames' },
            function (response: {
              success: boolean;
              stations: string[];
              count: number;
            }) {
              if (chrome.runtime.lastError) {
                showError(
                  'このページでは駅名の自動取得ができません。「どこかにビューン」の候補駅一覧ページでご利用ください。'
                );
                result.innerHTML =
                  '<p>対応ページでボタンをクリックしてください</p>';
                return;
              }

              if (
                response &&
                response.success &&
                response.stations.length > 0
              ) {
                displayStations(response.stations, '(手動取得)');
              } else {
                displayStations([], '');
              }
            }
          );
        }, 100);
      }
    );
  });

  // Handle station name input
  addStationBtn.addEventListener('click', function () {
    const stationName = stationInput.value.trim();
    console.log('Add station button clicked, station name:', stationName);

    if (!stationName) {
      manualResult.innerHTML = '<p class="error">駅名を入力してください</p>';
      return;
    }

    // Get current manual stations
    chrome.runtime.sendMessage(
      { action: 'getStoredStations' },
      function (response: {
        success: boolean;
        stations: string[];
        manualStations: string[];
        url?: string;
        timestamp?: number;
      }) {
        console.log('getStoredStations response:', response);
        let currentManualStations: string[] = [];

        if (response && response.success && response.manualStations) {
          currentManualStations = response.manualStations;
        }

        console.log(
          'Current manual stations before add:',
          currentManualStations
        );

        // Add new station if not already in list
        if (!currentManualStations.includes(stationName)) {
          currentManualStations.push(stationName);
          console.log(
            'Current manual stations after add:',
            currentManualStations
          );

          // Save to background storage
          chrome.runtime.sendMessage(
            {
              action: 'addManualStation',
              manualStations: currentManualStations,
              timestamp: Date.now(),
            },
            function (saveResponse) {
              console.log('Save response:', saveResponse);
              if (chrome.runtime.lastError) {
                console.error(
                  'Error saving stations:',
                  chrome.runtime.lastError
                );
              }

              displayManualStations(currentManualStations);
              stationInput.value = ''; // Clear input
              manualResult.innerHTML = `<p>「${stationName}」を追加しました</p>`;
              // Trigger highlighting after adding a station
              highlightMatchingStations(currentManualStations);
            }
          );
        } else {
          manualResult.innerHTML = `<p class="error">「${stationName}」は既に登録されています</p>`;
        }
      }
    );
  });

  // Allow Enter key to add station
  stationInput.addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
      addStationBtn.click();
    }
  });
});
