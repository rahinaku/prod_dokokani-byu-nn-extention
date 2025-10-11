"use strict";
document.addEventListener('DOMContentLoaded', function () {
    const actionBtn = document.getElementById('actionBtn');
    const result = document.getElementById('result');
    actionBtn.addEventListener('click', function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const currentTab = tabs[0];
            if (currentTab && currentTab.title) {
                result.innerHTML = `<p>現在のタブ: ${currentTab.title}</p>`;
            }
        });
    });
    result.innerHTML = '<p>拡張機能が読み込まれました</p>';
});
//# sourceMappingURL=popup.js.map