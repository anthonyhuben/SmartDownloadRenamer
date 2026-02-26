/**
 * Popup UI Logic for Smart Download Renamer
 */

let recentDownloads = [];
let renameRulesEnabled = false;
let renameRules = [];

// DOM Elements
const statusEl = document.getElementById('status');
const loadingEl = document.getElementById('loading');
const downloadsSectionEl = document.getElementById('downloads-section');
const downloadsListEl = document.getElementById('downloads-list');
const emptyStateEl = document.getElementById('empty-state');
const downloadCountEl = document.getElementById('download-count');
const refreshBtn = document.getElementById('refresh-btn');
const renameRulesBtn = document.getElementById('rename-rules-btn');
const modalEl = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const closeBtn = document.querySelector('.close');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadDownloads();

  // Load Rename settings from storage
  chrome.storage.local.get(['renameRulesEnabled', 'renameRules'], (result) => {
    renameRulesEnabled = result.renameRulesEnabled || false;
    renameRules = result.renameRules || [];
    updateRulesIndicator();
  });
});

// Event Listeners
refreshBtn.addEventListener('click', loadDownloads);
closeBtn.addEventListener('click', closeModal);
renameRulesBtn.addEventListener('click', showRenameRulesSettings);

// Close modal when clicking outside of it
window.addEventListener('click', (e) => {
  if (e.target === modalEl) closeModal();
});

/**
 * Load recent downloads from the downloads API
 */
function loadDownloads() {
  showStatus('Loading downloads...', 'info');
  showLoading(true);
  hideAllSections();

  chrome.downloads.search({}, (downloads) => {
    if (chrome.runtime.lastError) {
      showStatus('Error loading downloads', 'error');
      showLoading(false);
      showEmptyState();
      return;
    }

    // Sort by most recent first and limit to 20
    recentDownloads = downloads
      .sort((a, b) => (b.startTime || 0) - (a.startTime || 0))
      .slice(0, 20);

    showLoading(false);

    if (recentDownloads.length === 0) {
      showEmptyState();
      showStatus('No downloads yet', 'info');
      return;
    }

    displayDownloads();
    showStatus(`Found ${recentDownloads.length} download(s)`, 'success');
  });
}

/**
 * Display recent downloads
 */
function displayDownloads() {
  downloadCountEl.textContent = recentDownloads.length;
  downloadsListEl.innerHTML = '';

  recentDownloads.forEach((download, index) => {
    const downloadEl = document.createElement('div');
    downloadEl.className = 'download-item';

    const filename = download.filename ? download.filename.split('/').pop() : 'unknown';
    const filesize = download.fileSize ? formatFileSize(download.fileSize) : 'Unknown size';
    const state = download.state || 'unknown';
    const stateBadge = `<span class="download-badge">${state.charAt(0).toUpperCase() + state.slice(1)}</span>`;

    downloadEl.innerHTML = `
      <div class="download-item-header">
        <span class="download-filename">${escapeHtml(filename)}</span>
        ${stateBadge}
      </div>
      <div class="download-meta">Size: ${filesize}</div>
      <div class="download-actions">
        <button class="btn-small btn-rename" data-index="${index}">
          <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor">
            <path d="M3 17h5v-5H3v5zm9-13h3l-8 8v3h3l8-8v-3z" stroke-width="1.2" fill="currentColor"/>
          </svg>
          Rename
        </button>
      </div>
    `;

    const renameBtn = downloadEl.querySelector('.btn-rename');
    renameBtn.addEventListener('click', () => {
      showRenameModal(download, index);
    });

    downloadsListEl.appendChild(downloadEl);
  });

  downloadsSectionEl.style.display = 'block';
}

/**
 * Show rename modal for a download
 */
function showRenameModal(download, index) {
  modalTitle.textContent = 'Rename Download';

  const currentFilename = download.filename ? download.filename.split('/').pop() : 'file';
  const previewFilename = renameRulesEnabled && renameRules.length > 0
    ? SmartRenameUtils.applyRules(currentFilename, renameRules)
    : currentFilename;

  modalBody.innerHTML = `
    <div>
      <div class="modal-actions">
        <button class="btn btn-primary" id="confirm-rename">✓ Apply</button>
        <button class="btn btn-secondary" id="cancel-modal">Cancel</button>
      </div>

      <label style="display: block; margin-bottom: 8px; font-weight: 500;">Current Filename:</label>
      <div style="background: rgba(161, 239, 228, 0.05); padding: 8px 10px; border-radius: 4px; margin-bottom: 16px; font-family: 'SF Mono', monospace; font-size: 12px; word-break: break-all; color: #f3e8af;">
        ${escapeHtml(currentFilename)}
      </div>

      ${renameRulesEnabled && renameRules.length > 0 ? `
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Preview:</label>
        <div style="background: rgba(161, 239, 228, 0.15); padding: 8px 10px; border-radius: 4px; margin-bottom: 16px; border-left: 3px solid #a1efe4; font-family: 'SF Mono', monospace; font-size: 12px; word-break: break-all; color: #a1efe4;">
          ${escapeHtml(previewFilename)}
        </div>
      ` : `
        <div style="background: rgba(255, 193, 7, 0.1); border-left: 3px solid #ffc107; padding: 8px 12px; margin-bottom: 16px; border-radius: 4px; font-size: 13px; color: #ffc107;">
          ⓘ No rename rules configured
        </div>
      `}

      <label style="display: block; margin-bottom: 8px; font-weight: 500;">New Filename:</label>
      <input type="text" class="filename-input" id="new-filename" value="${escapeHtml(previewFilename)}" />
    </div>
  `;

  const confirmBtn = document.getElementById('confirm-rename');
  const cancelBtn = document.getElementById('cancel-modal');
  const filenameInput = document.getElementById('new-filename');

  if (confirmBtn) {
    confirmBtn.onclick = () => {
      const newFilename = filenameInput.value.trim();
      if (!newFilename) {
        showStatus('Please enter a filename', 'error');
        return;
      }

      // Rename the file
      renameDownloadFile(download, newFilename);
      closeModal();
    };
  }

  if (cancelBtn) {
    cancelBtn.onclick = closeModal;
  }

  modalEl.style.display = 'block';
}

/**
 * Rename a downloaded file by downloading it again with new name
 */
function renameDownloadFile(download, newFilename) {
  // Firefox doesn't allow direct file renaming through extension API,
  // so we show instructions to the user
  showStatus(`Rename file using your file manager: ${newFilename}`, 'info');
}

/**
 * UI Helper Functions
 */
function showStatus(message, type = 'info') {
  statusEl.textContent = message;
  statusEl.className = 'status-message ' + type;
  statusEl.style.display = 'block';

  if (type !== 'error') {
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 3000);
  }
}

function showLoading(show) {
  loadingEl.style.display = show ? 'flex' : 'none';
}

function hideAllSections() {
  downloadsSectionEl.style.display = 'none';
  emptyStateEl.style.display = 'none';
  modalEl.style.display = 'none';
}

function showEmptyState() {
  emptyStateEl.style.display = 'flex';
}

function closeModal() {
  modalEl.style.display = 'none';
}

/**
 * Show/hide the active indicator dot on the Rename Rules button
 */
function updateRulesIndicator() {
  let dot = renameRulesBtn.querySelector('.sr-active-dot');
  if (renameRulesEnabled && renameRules.length > 0) {
    if (!dot) {
      dot = document.createElement('span');
      dot.className = 'sr-active-dot';
      renameRulesBtn.appendChild(dot);
    }
  } else {
    if (dot) dot.remove();
  }
}

/**
 * Show the Rename Rules settings panel
 */
function showRenameRulesSettings() {
  // Work with a shallow copy so Cancel discards changes
  let editingRules = renameRules.map(r => ({ ...r }));

  const RULE_TYPES = [
    { value: 'replace', label: 'Replace' },
    { value: 'remove', label: 'Remove' },
    { value: 'prependDate', label: 'Prepend Date' },
    { value: 'underscoreSpaces', label: 'Spaces to Underscores' },
    { value: 'removeSpecial', label: 'Remove Special Characters' },
    { value: 'titleCase', label: 'Title Case' },
    { value: 'camelCase', label: 'CamelCase' },
    { value: 'addEnd', label: 'Add to End' },
    { value: 'addBeginning', label: 'Add to Beginning' },
    { value: 'moveAfterDate', label: 'Move After Date' }
  ];

  function typeOptions(selected) {
    return RULE_TYPES.map(t =>
      `<option value="${t.value}"${t.value === selected ? ' selected' : ''}>${t.label}</option>`
    ).join('');
  }

  function buildRuleHTML(rule, index) {
    let inputs = '';
    if (rule.type === 'replace') {
      inputs = `
        <input class="sr-input" data-field="find" placeholder="find text…" value="${escapeHtml(rule.find || '')}">
        <span class="sr-arrow">→</span>
        <input class="sr-input" data-field="replaceWith" placeholder="replace with…" value="${escapeHtml(rule.replaceWith || '')}">`;
    } else if (['prependDate', 'underscoreSpaces', 'removeSpecial', 'titleCase', 'camelCase'].includes(rule.type)) {
      inputs = `<div class="sr-no-input">No configuration needed</div>`;
    } else {
      const ph = {
        remove: 'text to remove…',
        addEnd: 'text to add…',
        addBeginning: 'text to add…',
        moveAfterDate: 'text to move…'
      }[rule.type] || 'text…';
      inputs = `<input class="sr-input" data-field="text" placeholder="${ph}" value="${escapeHtml(rule.text || '')}">`;
    }

    return `
      <div class="sr-rule" data-index="${index}">
        <div class="sr-reorder">
          <button class="sr-move-up" data-index="${index}" title="Move Up" ${index === 0 ? 'disabled' : ''}>▲</button>
          <button class="sr-move-down" data-index="${index}" title="Move Down" ${index === editingRules.length - 1 ? 'disabled' : ''}>▼</button>
        </div>
        <select class="sr-type">${typeOptions(rule.type)}</select>
        ${inputs}
        <button class="sr-delete" data-index="${index}" title="Remove rule">×</button>
      </div>`;
  }

  function renderRules() {
    const container = document.getElementById('sr-rules-container');
    if (!container) return;
    if (editingRules.length === 0) {
      container.innerHTML = '<p style="color:#666;font-size:12px;text-align:center;padding:12px 0;">No rules yet. Click "+ Add Rule" to get started.</p>';
    } else {
      container.innerHTML = editingRules.map((r, i) => buildRuleHTML(r, i)).join('');
    }
    attachRuleListeners();
  }

  function attachRuleListeners() {
    // Type selector — re-render the row when type changes, preserving any text already typed
    document.querySelectorAll('.sr-type').forEach(select => {
      select.addEventListener('change', (e) => {
        const idx = parseInt(e.target.closest('.sr-rule').dataset.index);
        const newType = e.target.value;
        const oldText = editingRules[idx].text || editingRules[idx].find || '';
        if (newType === 'replace') {
          editingRules[idx] = { type: newType, find: oldText, replaceWith: '' };
        } else {
          editingRules[idx] = { type: newType, text: oldText };
        }
        renderRules();
        // Re-focus the first input of the updated row
        const row = document.querySelectorAll('.sr-rule')[idx];
        row?.querySelector('.sr-input')?.focus();
      });
    });

    // Text inputs — update in-place, no re-render needed
    document.querySelectorAll('.sr-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.closest('.sr-rule').dataset.index);
        editingRules[idx][e.target.dataset.field] = e.target.value;
      });
    });

    // Delete buttons
    document.querySelectorAll('.sr-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index);
        editingRules.splice(idx, 1);
        renderRules();
      });
    });

    // Move Up buttons
    document.querySelectorAll('.sr-move-up').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index);
        if (idx > 0) {
          [editingRules[idx - 1], editingRules[idx]] = [editingRules[idx], editingRules[idx - 1]];
          renderRules();
        }
      });
    });

    // Move Down buttons
    document.querySelectorAll('.sr-move-down').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index);
        if (idx < editingRules.length - 1) {
          [editingRules[idx], editingRules[idx + 1]] = [editingRules[idx + 1], editingRules[idx]];
          renderRules();
        }
      });
    });
  }

  const enabledAttr = renameRulesEnabled ? 'checked' : '';

  modalBody.innerHTML = `
    <div>
      <div class="modal-actions">
        <button class="btn btn-primary" id="sr-save">✓ Save</button>
        <button class="btn btn-secondary" id="sr-cancel">Cancel</button>
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding:10px 12px;background:rgba(161,239,228,0.07);border:1px solid rgba(161,239,228,0.2);border-radius:6px;">
        <div>
          <div style="font-weight:600;font-size:13px;color:#f8f8f2;">Enable Rename Rules</div>
          <div style="font-size:11px;color:#666;margin-top:2px;">Apply rules when renaming downloads</div>
        </div>
        <label class="sr-toggle">
          <input type="checkbox" id="sr-enabled" ${enabledAttr}>
          <span class="sr-slider"></span>
        </label>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-size:13px;font-weight:500;color:#a1efe4;">Rules</span>
        <button id="sr-add-rule" class="sr-add-rule-btn" style="width:auto;margin:0;padding:4px 12px;font-size:12px;">+ Add Rule</button>
      </div>

      <div id="sr-rules-container"></div>

      <div style="font-size:11px;color:#555;margin-top:4px;line-height:1.5;">
        Rules apply in order to filenames. "Move After Date" inserts text immediately after the <em>YYYY MM DD</em> prefix.
      </div>
    </div>
  `;

  renderRules();

  document.getElementById('sr-add-rule').addEventListener('click', () => {
    editingRules.push({ type: 'replace', find: '', replaceWith: '' });
    renderRules();
    modalBody.scrollTop = modalBody.scrollHeight;
    // Focus the first input of the new (last) row
    const rows = document.querySelectorAll('.sr-rule');
    rows[rows.length - 1]?.querySelector('.sr-input')?.focus();
  });

  document.getElementById('sr-save').addEventListener('click', () => {
    renameRulesEnabled = document.getElementById('sr-enabled').checked;
    renameRules = editingRules;
    chrome.storage.local.set({ renameRulesEnabled, renameRules });
    updateRulesIndicator();
    closeModal();
    showStatus('Rename rules saved', 'success');
  });

  document.getElementById('sr-cancel').addEventListener('click', closeModal);

  modalEl.style.display = 'block';
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
