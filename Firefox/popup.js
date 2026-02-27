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
  downloadsListEl.textContent = '';

  recentDownloads.forEach((download, index) => {
    const downloadEl = document.createElement('div');
    downloadEl.className = 'download-item';

    const filename = download.filename ? download.filename.split('/').pop() : 'unknown';
    const filesize = download.fileSize ? formatFileSize(download.fileSize) : 'Unknown size';
    const state = download.state || 'unknown';
    // Build the download item DOM manually to avoid innerHTML warnings
    const header = document.createElement('div');
    header.className = 'download-item-header';

    const filenameSpan = document.createElement('span');
    filenameSpan.className = 'download-filename';
    filenameSpan.textContent = filename;
    header.appendChild(filenameSpan);

    const badge = document.createElement('span');
    badge.className = 'download-badge';
    badge.textContent = state.charAt(0).toUpperCase() + state.slice(1);
    header.appendChild(badge);

    const meta = document.createElement('div');
    meta.className = 'download-meta';
    meta.textContent = `Size: ${filesize}`;

    const actions = document.createElement('div');
    actions.className = 'download-actions';

    const renameBtn = document.createElement('button');
    renameBtn.className = 'btn-small btn-rename';
    renameBtn.dataset.index = index;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '14');
    svg.setAttribute('height', '14');
    svg.setAttribute('viewBox', '0 0 18 18');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M3 17h5v-5H3v5zm9-13h3l-8 8v3h3l8-8v-3z');
    path.setAttribute('stroke-width', '1.2');
    path.setAttribute('fill', 'currentColor');

    svg.appendChild(path);
    renameBtn.appendChild(svg);
    renameBtn.appendChild(document.createTextNode(' Rename'));

    downloadEl.appendChild(header);
    downloadEl.appendChild(meta);
    downloadEl.appendChild(actions);

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

  modalBody.textContent = '';

  const container = document.createElement('div');

  const actions = document.createElement('div');
  actions.className = 'modal-actions';

  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'btn btn-primary';
  confirmBtn.id = 'confirm-rename';
  confirmBtn.textContent = '✓ Apply';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-secondary';
  cancelBtn.id = 'cancel-modal';
  cancelBtn.textContent = 'Cancel';

  actions.appendChild(confirmBtn);
  actions.appendChild(cancelBtn);
  container.appendChild(actions);

  const curLabel = document.createElement('label');
  curLabel.style.display = 'block';
  curLabel.style.marginBottom = '8px';
  curLabel.style.fontWeight = '500';
  curLabel.textContent = 'Current Filename:';
  container.appendChild(curLabel);

  const curBox = document.createElement('div');
  curBox.style.background = 'rgba(161, 239, 228, 0.05)';
  curBox.style.padding = '8px 10px';
  curBox.style.borderRadius = '4px';
  curBox.style.marginBottom = '16px';
  curBox.style.fontFamily = "'SF Mono', monospace";
  curBox.style.fontSize = '12px';
  curBox.style.wordBreak = 'break-all';
  curBox.style.color = '#f3e8af';
  curBox.textContent = currentFilename;
  container.appendChild(curBox);

  if (renameRulesEnabled && renameRules.length > 0) {
    const prevLabel = document.createElement('label');
    prevLabel.style.display = 'block';
    prevLabel.style.marginBottom = '8px';
    prevLabel.style.fontWeight = '500';
    prevLabel.textContent = 'Preview:';
    container.appendChild(prevLabel);

    const prevBox = document.createElement('div');
    prevBox.style.background = 'rgba(161, 239, 228, 0.15)';
    prevBox.style.padding = '8px 10px';
    prevBox.style.borderRadius = '4px';
    prevBox.style.marginBottom = '16px';
    prevBox.style.borderLeft = '3px solid #a1efe4';
    prevBox.style.fontFamily = "'SF Mono', monospace";
    prevBox.style.fontSize = '12px';
    prevBox.style.wordBreak = 'break-all';
    prevBox.style.color = '#a1efe4';
    prevBox.textContent = previewFilename;
    container.appendChild(prevBox);
  } else {
    const infoBox = document.createElement('div');
    infoBox.style.background = 'rgba(255, 193, 7, 0.1)';
    infoBox.style.borderLeft = '3px solid #ffc107';
    infoBox.style.padding = '8px 12px';
    infoBox.style.marginBottom = '16px';
    infoBox.style.borderRadius = '4px';
    infoBox.style.fontSize = '13px';
    infoBox.style.color = '#ffc107';
    infoBox.textContent = 'ⓘ No rename rules configured';
    container.appendChild(infoBox);
  }

  const newLabel = document.createElement('label');
  newLabel.style.display = 'block';
  newLabel.style.marginBottom = '8px';
  newLabel.style.fontWeight = '500';
  newLabel.textContent = 'New Filename:';
  container.appendChild(newLabel);

  const newInp = document.createElement('input');
  newInp.type = 'text';
  newInp.className = 'filename-input';
  newInp.id = 'new-filename';
  newInp.value = previewFilename;
  container.appendChild(newInp);

  modalBody.appendChild(container);

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


  function buildRuleDOM(rule, index) {
    const row = document.createElement('div');
    row.className = 'sr-rule';
    row.dataset.index = index;

    const reorder = document.createElement('div');
    reorder.className = 'sr-reorder';

    const moveUp = document.createElement('button');
    moveUp.className = 'sr-move-up';
    moveUp.dataset.index = index;
    moveUp.title = 'Move Up';
    moveUp.textContent = '▲';
    if (index === 0) moveUp.disabled = true;

    const moveDown = document.createElement('button');
    moveDown.className = 'sr-move-down';
    moveDown.dataset.index = index;
    moveDown.title = 'Move Down';
    moveDown.textContent = '▼';
    if (index === editingRules.length - 1) moveDown.disabled = true;

    reorder.appendChild(moveUp);
    reorder.appendChild(moveDown);
    row.appendChild(reorder);

    const typeSelect = document.createElement('select');
    typeSelect.className = 'sr-type';
    RULE_TYPES.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.value;
      opt.textContent = t.label;
      if (t.value === rule.type) opt.selected = true;
      typeSelect.appendChild(opt);
    });
    row.appendChild(typeSelect);

    if (rule.type === 'replace') {
      const findInp = document.createElement('input');
      findInp.className = 'sr-input';
      findInp.dataset.field = 'find';
      findInp.placeholder = 'find text…';
      findInp.value = rule.find || '';
      row.appendChild(findInp);

      const arrow = document.createElement('span');
      arrow.className = 'sr-arrow';
      arrow.textContent = '→';
      row.appendChild(arrow);

      const replaceInp = document.createElement('input');
      replaceInp.className = 'sr-input';
      replaceInp.dataset.field = 'replaceWith';
      replaceInp.placeholder = 'replace with…';
      replaceInp.value = rule.replaceWith || '';
      row.appendChild(replaceInp);
    } else if (['prependDate', 'underscoreSpaces', 'removeSpecial', 'titleCase', 'camelCase'].includes(rule.type)) {
      const noInp = document.createElement('div');
      noInp.className = 'sr-no-input';
      noInp.textContent = 'No configuration needed';
      row.appendChild(noInp);
    } else {
      const ph = {
        remove: 'text to remove…',
        addEnd: 'text to add…',
        addBeginning: 'text to add…',
        moveAfterDate: 'text to move…'
      }[rule.type] || 'text…';

      const textInp = document.createElement('input');
      textInp.className = 'sr-input';
      textInp.dataset.field = 'text';
      textInp.placeholder = ph;
      textInp.value = rule.text || '';
      row.appendChild(textInp);
    }

    const delBtn = document.createElement('button');
    delBtn.className = 'sr-delete';
    delBtn.dataset.index = index;
    delBtn.title = 'Remove rule';
    delBtn.textContent = '×';
    row.appendChild(delBtn);

    return row;
  }

  function renderRules() {
    const rulesContainer = document.getElementById('sr-rules-container');
    if (!rulesContainer) return;
    rulesContainer.textContent = '';
    if (editingRules.length === 0) {
      const p = document.createElement('p');
      p.style.color = '#666';
      p.style.fontSize = '12px';
      p.style.textAlign = 'center';
      p.style.padding = '12px 0';
      p.textContent = 'No rules yet. Click "+ Add Rule" to get started.';
      rulesContainer.appendChild(p);
    } else {
      editingRules.forEach((r, i) => {
        rulesContainer.appendChild(buildRuleDOM(r, i));
      });
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

  modalBody.textContent = '';
  const srContainer = document.createElement('div');

  const srActions = document.createElement('div');
  srActions.className = 'modal-actions';
  const srSaveBtn = document.createElement('button');
  srSaveBtn.className = 'btn btn-primary';
  srSaveBtn.id = 'sr-save';
  srSaveBtn.textContent = '✓ Save';

  const srCancelBtn = document.createElement('button');
  srCancelBtn.className = 'btn btn-secondary';
  srCancelBtn.id = 'sr-cancel';
  srCancelBtn.textContent = 'Cancel';

  srActions.appendChild(srSaveBtn);
  srActions.appendChild(srCancelBtn);
  srContainer.appendChild(srActions);

  const srToggleRow = document.createElement('div');
  srToggleRow.style.display = 'flex';
  srToggleRow.style.alignItems = 'center';
  srToggleRow.style.justifyContent = 'space-between';
  srToggleRow.style.marginBottom = '16px';
  srToggleRow.style.padding = '10px 12px';
  srToggleRow.style.background = 'rgba(161,239,228,0.07)';
  srToggleRow.style.border = '1px solid rgba(161,239,228,0.2)';
  srToggleRow.style.borderRadius = '6px';

  const srToggleText = document.createElement('div');
  const srToggleTitle = document.createElement('div');
  srToggleTitle.style.fontWeight = '600';
  srToggleTitle.style.fontSize = '13px';
  srToggleTitle.style.color = '#f8f8f2';
  srToggleTitle.textContent = 'Enable Rename Rules';
  srToggleText.appendChild(srToggleTitle);

  const srToggleSub = document.createElement('div');
  srToggleSub.style.fontSize = '11px';
  srToggleSub.style.color = '#666';
  srToggleSub.style.marginTop = '2px';
  srToggleSub.textContent = 'Apply rules when renaming downloads';
  srToggleText.appendChild(srToggleSub);
  srToggleRow.appendChild(srToggleText);

  const srLabel = document.createElement('label');
  srLabel.className = 'sr-toggle';
  const srCheck = document.createElement('input');
  srCheck.type = 'checkbox';
  srCheck.id = 'sr-enabled';
  srCheck.checked = renameRulesEnabled;
  const srSlider = document.createElement('span');
  srSlider.className = 'sr-slider';
  srLabel.appendChild(srCheck);
  srLabel.appendChild(srSlider);
  srToggleRow.appendChild(srLabel);
  srContainer.appendChild(srToggleRow);

  const srHeaderRow = document.createElement('div');
  srHeaderRow.style.display = 'flex';
  srHeaderRow.style.justifyContent = 'space-between';
  srHeaderRow.style.alignItems = 'center';
  srHeaderRow.style.marginBottom = '8px';

  const srHeaderTitle = document.createElement('span');
  srHeaderTitle.style.fontSize = '13px';
  srHeaderTitle.style.fontWeight = '500';
  srHeaderTitle.style.color = '#a1efe4';
  srHeaderTitle.textContent = 'Rules';
  srHeaderRow.appendChild(srHeaderTitle);

  const srAddBtn = document.createElement('button');
  srAddBtn.id = 'sr-add-rule';
  srAddBtn.className = 'sr-add-rule-btn';
  srAddBtn.style.width = 'auto';
  srAddBtn.style.margin = '0';
  srAddBtn.style.padding = '4px 12px';
  srAddBtn.style.fontSize = '12px';
  srAddBtn.textContent = '+ Add Rule';
  srHeaderRow.appendChild(srAddBtn);
  srContainer.appendChild(srHeaderRow);

  const srRuleCont = document.createElement('div');
  srRuleCont.id = 'sr-rules-container';
  srContainer.appendChild(srRuleCont);

  const srFooter = document.createElement('div');
  srFooter.style.fontSize = '11px';
  srFooter.style.color = '#555';
  srFooter.style.marginTop = '4px';
  srFooter.style.lineHeight = '1.5';
  srFooter.textContent = 'Rules apply in order to filenames. "Move After Date" inserts text immediately after the ';
  const em = document.createElement('em');
  em.textContent = 'YYYY MM DD';
  srFooter.appendChild(em);
  srFooter.appendChild(document.createTextNode(' prefix.'));
  srContainer.appendChild(srFooter);

  modalBody.appendChild(srContainer);

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


function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
