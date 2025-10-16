function formatResetTime(isoString) {
  if (!isoString) return '-';

  const resetDate = new Date(isoString);
  const now = new Date();
  const diff = resetDate - now;

  if (diff < 0) return 'Reset';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

function calculatePercentage(utilization, type) {
  const limits = {
    'five_hour': 100,
    'seven_day': 100,
    'seven_day_opus': 100,
    'seven_day_oauth_apps': 100
  };

  const limit = limits[type] || 100;
  return Math.min((utilization / limit) * 100, 100);
}

// Calculate expected usage percentage based on time elapsed
function calculateExpectedPercentage(resetAt, type) {
  if (!resetAt) return 0;

  const resetDate = new Date(resetAt);
  const now = new Date();

  // Calculate total period in milliseconds
  const periodDurations = {
    'five_hour': 5 * 60 * 60 * 1000,
    'seven_day': 7 * 24 * 60 * 60 * 1000,
    'seven_day_opus': 7 * 24 * 60 * 60 * 1000,
    'seven_day_oauth_apps': 7 * 24 * 60 * 60 * 1000
  };

  const totalPeriod = periodDurations[type] || (7 * 24 * 60 * 60 * 1000);

  // Calculate elapsed time
  const timeRemaining = resetDate - now;
  const timeElapsed = totalPeriod - timeRemaining;

  // If time remaining is negative or elapsed is negative, return 0
  if (timeRemaining < 0 || timeElapsed < 0) return 0;

  // Calculate expected percentage
  const expectedPercentage = (timeElapsed / totalPeriod) * 100;
  return Math.min(Math.max(expectedPercentage, 0), 100);
}

// Get card title
function getCardTitle(type) {
  const titles = {
    'five_hour': '5 Hour',
    'seven_day': '7 Day',
    'seven_day_opus': '7D Opus',
    'seven_day_oauth_apps': '7D OAuth'
  };
  return titles[type] || type;
}

function createDonutChart(percentage, expectedPercentage, showPace) {
  const outerRadius = 27;
  const innerRadius = 20;
  const outerCircumference = 2 * Math.PI * outerRadius;
  const innerCircumference = 2 * Math.PI * innerRadius;
  const outerOffset = outerCircumference - (percentage / 100) * outerCircumference;
  const innerOffset = innerCircumference - (expectedPercentage / 100) * innerCircumference;

  const expectedCircle = showPace ? `
    <circle class="donut-expected" cx="30" cy="30" r="${innerRadius}"
      stroke-dasharray="${innerCircumference}"
      stroke-dashoffset="${innerOffset}">
    </circle>
  ` : '';

  return `
    <div class="donut-container">
      <svg class="donut-chart" width="60" height="60" viewBox="0 0 60 60">
        <circle class="donut-bg" cx="30" cy="30" r="${outerRadius}"></circle>
        ${showPace ? `<circle class="donut-expected-bg" cx="30" cy="30" r="${innerRadius}"></circle>` : ''}
        ${expectedCircle}
        <circle class="donut-fill" cx="30" cy="30" r="${outerRadius}"
          stroke-dasharray="${outerCircumference}"
          stroke-dashoffset="${outerOffset}">
        </circle>
      </svg>
      <div class="donut-text">${Math.round(percentage)}%</div>
    </div>
  `;
}

function createProgressBar(percentage, expectedPercentage, showPace) {
  if (showPace) {
    return `
      <div class="progress-view">
        <div class="progress-bar-dual-wrapper">
          <div class="progress-bar-container">
            <div class="progress-bar-row progress-bar-row-main">
              <div class="progress-bar-wrapper">
                <div class="progress-bar-fill" style="width: ${percentage}%"></div>
              </div>
            </div>
            <div class="progress-bar-row progress-bar-row-expected">
              <div class="progress-bar-wrapper progress-bar-wrapper-thin">
                <div class="progress-bar-expected" style="width: ${expectedPercentage}%"></div>
              </div>
            </div>
          </div>
          <div class="progress-bar-percentage">${Math.round(percentage)}%</div>
        </div>
      </div>
    `;
  } else {
    return `
      <div class="progress-view">
        <div class="progress-bar-container">
          <div class="progress-bar-fill" style="width: ${percentage}%"></div>
          <div class="progress-percentage">${Math.round(percentage)}%</div>
        </div>
      </div>
    `;
  }
}

let currentViewMode = 'donut';
let cachedUsageData = null;
let currentColumnCount = 2;
let showPaceIndicator = false;

async function renderUsageData(data) {
  const contentDiv = document.getElementById('content');
  cachedUsageData = data;

  const storage = await chrome.storage.local.get(['viewMode', 'columnCount', 'showPace']);
  currentViewMode = storage.viewMode || 'donut';
  currentColumnCount = storage.columnCount || 2;
  showPaceIndicator = storage.showPace || false;

  let html = `<div class="usage-grid" style="grid-template-columns: repeat(${currentColumnCount}, 1fr)">`;

  for (const [type, info] of Object.entries(data)) {
    const percentage = calculatePercentage(info.utilization, type);
    const expectedPercentage = calculateExpectedPercentage(info.resets_at, type);
    const resetTime = formatResetTime(info.resets_at);

    const visualElement = currentViewMode === 'donut'
      ? createDonutChart(percentage, expectedPercentage, showPaceIndicator)
      : createProgressBar(percentage, expectedPercentage, showPaceIndicator);

    html += `
      <div class="usage-item">
        <div class="usage-info-row">
          <div class="usage-label">${getCardTitle(type)}</div>
          <div class="reset-time">${resetTime}</div>
        </div>
        ${visualElement}
      </div>
    `;
  }

  html += '</div>';

  contentDiv.innerHTML = html;
  updateViewSelectUI();
  updateColumnsUI();
  updatePaceToggleUI();

  const viewSelect = document.getElementById('viewSelect');
  if (viewSelect) {
    viewSelect.style.display = 'block';
  }

  const paceToggle = document.getElementById('paceToggle');
  if (paceToggle) {
    paceToggle.style.display = 'flex';
  }

  const columnsSelect = document.getElementById('columnsSelect');
  if (columnsSelect) {
    columnsSelect.style.display = 'block';
  }

  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.style.display = 'block';
  }

  const lastUpdated = document.getElementById('lastUpdated');
  if (lastUpdated) {
    lastUpdated.style.display = 'block';
  }
}

function showError(message) {
  const contentDiv = document.getElementById('content');
  contentDiv.innerHTML = `
    <div class="error">${message}</div>
  `;
}

function showSetup() {
  const contentDiv = document.getElementById('content');
  contentDiv.innerHTML = `
    <div class="loading">
      <div style="font-size: 14px; color: #6b7280; text-align: center;">
        Please configure Organization ID<br>
        <span style="font-size: 11px; opacity: 0.8;">Click the settings icon ⚙️</span>
      </div>
    </div>
  `;

  const viewSelect = document.getElementById('viewSelect');
  if (viewSelect) {
    viewSelect.style.display = 'none';
  }

  const paceToggle = document.getElementById('paceToggle');
  if (paceToggle) {
    paceToggle.style.display = 'none';
  }

  const columnsSelect = document.getElementById('columnsSelect');
  if (columnsSelect) {
    columnsSelect.style.display = 'none';
  }

  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.style.display = 'none';
  }

  const lastUpdated = document.getElementById('lastUpdated');
  if (lastUpdated) {
    lastUpdated.style.display = 'none';
  }
}

async function openSettingsModal() {
  const modal = document.getElementById('settingsModal');
  const input = document.getElementById('modalOrgIdInput');

  const storage = await chrome.storage.local.get(['organizationId']);
  if (storage.organizationId) {
    input.value = storage.organizationId;
  } else {
    input.value = '';
  }

  modal.classList.add('active');
  input.focus();
}

function closeSettingsModal() {
  const modal = document.getElementById('settingsModal');
  modal.classList.remove('active');
}

async function saveSettings() {
  const input = document.getElementById('modalOrgIdInput');
  const orgId = input.value.trim();

  if (orgId) {
    await chrome.storage.local.set({ organizationId: orgId });
    closeSettingsModal();
    loadUsageData();
  }
}

function setRefreshSpinning(spinning) {
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    if (spinning) {
      refreshBtn.classList.add('spinning');
    } else {
      refreshBtn.classList.remove('spinning');
    }
  }
}

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
    return data;
  } catch (error) {
    console.error('Failed to fetch usage data:', error);
    throw error;
  }
}

async function loadUsageData() {
  try {
    const storage = await chrome.storage.local.get(['organizationId']);

    if (!storage.organizationId) {
      showSetup();
      return;
    }

    setRefreshSpinning(true);

    // Don't show loading screen if we have cached data
    // Just show the spinning icon in the header
    if (!cachedUsageData) {
      const contentDiv = document.getElementById('content');
      contentDiv.innerHTML = `
        <div class="loading">
          <div class="spinner"></div>
          <div>Loading...</div>
        </div>
      `;
    }

    const data = await fetchUsageData(storage.organizationId);
    setRefreshSpinning(false);
    renderUsageData(data);
    updateLastUpdatedTime();

  } catch (error) {
    setRefreshSpinning(false);
    showError(error.message);
  }
}

function updateLastUpdatedTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  document.getElementById('lastUpdated').textContent = timeString;
}

function updateViewSelectUI() {
  const viewSelect = document.getElementById('viewSelect');
  if (viewSelect) {
    viewSelect.value = currentViewMode;
  }
}

function updateColumnsUI() {
  const columnsSelect = document.getElementById('columnsSelect');
  if (columnsSelect) {
    columnsSelect.value = currentColumnCount.toString();
  }
}

function updatePaceToggleUI() {
  const paceToggleSwitch = document.getElementById('paceToggleSwitch');

  if (paceToggleSwitch) {
    if (showPaceIndicator) {
      paceToggleSwitch.classList.add('active');
    } else {
      paceToggleSwitch.classList.remove('active');
    }
  }
}

async function changeViewMode(viewMode) {
  currentViewMode = viewMode;
  await chrome.storage.local.set({ viewMode: currentViewMode });

  if (cachedUsageData) {
    renderUsageData(cachedUsageData);
  }
}

async function changeColumnCount(columnCount) {
  currentColumnCount = parseInt(columnCount);
  await chrome.storage.local.set({ columnCount: currentColumnCount });

  if (cachedUsageData) {
    renderUsageData(cachedUsageData);
  }
}

async function togglePaceIndicator() {
  showPaceIndicator = !showPaceIndicator;
  await chrome.storage.local.set({ showPace: showPaceIndicator });

  if (cachedUsageData) {
    renderUsageData(cachedUsageData);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', loadUsageData);
  }

  const viewSelect = document.getElementById('viewSelect');
  if (viewSelect) {
    viewSelect.addEventListener('change', (e) => {
      changeViewMode(e.target.value);
    });
  }

  const paceToggleSwitch = document.getElementById('paceToggleSwitch');
  if (paceToggleSwitch) {
    paceToggleSwitch.addEventListener('click', togglePaceIndicator);
  }

  const columnsSelect = document.getElementById('columnsSelect');
  if (columnsSelect) {
    columnsSelect.addEventListener('change', (e) => {
      changeColumnCount(e.target.value);
    });
  }

  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', openSettingsModal);
  }

  const modalCancelBtn = document.getElementById('modalCancelBtn');
  if (modalCancelBtn) {
    modalCancelBtn.addEventListener('click', closeSettingsModal);
  }

  const modalSaveBtn = document.getElementById('modalSaveBtn');
  if (modalSaveBtn) {
    modalSaveBtn.addEventListener('click', saveSettings);
  }

  const modalOverlay = document.getElementById('settingsModal');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeSettingsModal();
      }
    });
  }

  const modalInput = document.getElementById('modalOrgIdInput');
  if (modalInput) {
    modalInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        saveSettings();
      }
    });
  }
});

loadUsageData();
setInterval(loadUsageData, 5 * 60 * 1000);