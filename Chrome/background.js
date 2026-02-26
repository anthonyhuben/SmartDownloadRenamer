/**
 * Background Script
 * Intercepts downloads before filename is determined and applies rename rules.
 */

/**
 * For Chrome, we prioritize the onDeterminingFilename API as it is more efficient.
 * Note: Chrome uses the 'chrome' namespace by default, though it supports 'browser' via polyfills.
 */
const api = typeof browser !== 'undefined' ? browser : chrome;

// Tracks our own generated downloads to avoid loops if needed
const renamingProcessIds = new Set();

if (api.downloads.onDeterminingFilename) {
  api.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
    api.storage.local.get(['renameRulesEnabled', 'renameRules'], (result) => {
      const renameRulesEnabled = result.renameRulesEnabled || false;
      const renameRules = result.renameRules || [];

      if (!renameRulesEnabled || renameRules.length === 0) {
        suggest();
        return;
      }

      const filename = downloadItem.filename || '';
      if (!filename) {
        suggest();
        return;
      }

      // Check if this is a path or just a filename
      const lastSlash = filename.lastIndexOf('/');
      const dir = lastSlash >= 0 ? filename.substring(0, lastSlash + 1) : '';
      const justFilename = lastSlash >= 0 ? filename.substring(lastSlash + 1) : filename;

      const newFilename = SmartRenameUtils.applyRules(justFilename, renameRules);

      if (newFilename !== justFilename) {
        suggest({ filename: dir + newFilename, conflictAction: 'uniquify' });
      } else {
        suggest();
      }
    });

    return true; // async suggest
  });
} else {
  /**
   * Fallback for environments without onDeterminingFilename
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
}

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
