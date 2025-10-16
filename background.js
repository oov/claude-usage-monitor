async function fetchUsageData(organizationId) {
  try {
    const url = `https://claude.ai/api/organizations/${organizationId}/usage`;
    const response = await fetch(url, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    await chrome.storage.local.set({
      usageData: data,
      lastUpdated: new Date().toISOString()
    });

    return data;
  } catch (error) {
    console.error('Failed to fetch usage data:', error);
    throw error;
  }
}

let monitorWindowId = null;

chrome.action.onClicked.addListener(async () => {
  if (monitorWindowId !== null) {
    try {
      await chrome.windows.get(monitorWindowId);
      await chrome.windows.update(monitorWindowId, { focused: true });
      return;
    } catch (error) {
      monitorWindowId = null;
    }
  }

  const window = await chrome.windows.create({
    url: 'monitor.html',
    type: 'popup',
    width: 360,
    height: 420,
    left: 100,
    top: 100
  });

  monitorWindowId = window.id;
});

chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === monitorWindowId) {
    monitorWindowId = null;
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchUsage') {
    fetchUsageData(request.organizationId)
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});