console.log('IntelliApply Background Service Worker Running');

// 1. Allow clicking the extension icon to open the Side Panel
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

// 2. Listen for 'OPEN_SIDE_PANEL' messages from content script (Floating Button)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'OPEN_SIDE_PANEL') {
        // This allows the floating button to open the panel
        if (sender.tab?.id) {
            chrome.sidePanel.open({ tabId: sender.tab.id })
                .catch(error => console.error('Failed to open side panel:', error));
        }
    }
});
