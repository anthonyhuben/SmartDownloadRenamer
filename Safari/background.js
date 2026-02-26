/**
 * Background Script
 * Intercepts downloads before filename is determined and applies rename rules.
 */

/**
 * For Safari, we use the 'browser' or 'chrome' namespace.
 */
const api = typeof browser !== 'undefined' ? browser : chrome;

// Tracks our own generated downloads to avoid loops
const renamingProcessIds = new Set();

/**
 * Intercept download on creation.
 */
api.downloads.onCreated.addListener(async (downloadItem) => {
  if (renamingProcessIds.has(downloadItem.id)) {
    renamingProcessIds.delete(downloadItem.id);
    return;
  }

  if (downloadItem.state !== 'in_progress') return;

  const result = await new Promise(resolve => api.storage.local.get(['renameRulesEnabled', 'renameRules'], resolve));
  if (!result.renameRulesEnabled || !result.renameRules?.length) return;

  let originalFilename = downloadItem.filename || '';
  const filenamePart = originalFilename.split(/[\\/]/).pop();
  if (!filenamePart) return;

  const newFilename = SmartRenameUtils.applyRules(filenamePart, result.renameRules);

  if (newFilename !== filenamePart) {
    try {
      await api.downloads.cancel(downloadItem.id);
      await api.downloads.erase({ id: downloadItem.id });

      const newId = await new Promise(resolve => {
        api.downloads.download({
          url: downloadItem.url,
          filename: newFilename,
          conflictAction: 'uniquify',
          saveAs: false
        }, resolve);
      });

      renamingProcessIds.add(newId);
    } catch (e) {
      console.error('Rename failed:', e);
    }
  }
});

// Message listener for popup communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'resumeDownload') {
    chrome.downloads.resume(request.downloadId, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

console.log('Smart Download Renamer background script loaded');
