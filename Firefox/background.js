/**
 * Background Script
 * Intercepts downloads before filename is determined and applies rename rules.
 */

/**
 * Tracking set to avoid infinite loops when we restart a download with a new name.
 */
const renamingProcessIds = new Set();

/**
 * Firefox does not support browser.downloads.onDeterminingFilename.
 * Instead, we use onCreated to intercept the download, cancel it, 
 * and restart it with the requested name.
 */
browser.downloads.onCreated.addListener(async (downloadItem) => {
  // If we started this download ourselves as part of a rename, don't intercept it again.
  if (renamingProcessIds.has(downloadItem.id)) {
    renamingProcessIds.delete(downloadItem.id);
    return;
  }

  // Only handle downloads that are actually in progress
  if (downloadItem.state !== 'in_progress') {
    return;
  }

  const result = await browser.storage.local.get(['renameRulesEnabled', 'renameRules']);
  const renameRulesEnabled = result.renameRulesEnabled || false;
  const renameRules = result.renameRules || [];

  if (!renameRulesEnabled || renameRules.length === 0) {
    return;
  }

  // Get the original filename (basename only)
  // Firefox's downloadItem.filename is the full path or recommended name.
  let originalFilename = downloadItem.filename || '';
  if (!originalFilename && downloadItem.url) {
    try {
      const url = new URL(downloadItem.url);
      originalFilename = url.pathname.split('/').pop();
    } catch (e) { }
  }

  // Extract just the filename part if it's a path
  const filenamePart = originalFilename.split(/[\\/]/).pop();
  if (!filenamePart) return;

  const newFilename = SmartRenameUtils.applyRules(filenamePart, renameRules);

  if (newFilename !== filenamePart) {
    try {
      // 1. Cancel the original download
      await browser.downloads.cancel(downloadItem.id);

      // 2. Clear the canceled download from history to keep it clean
      await browser.downloads.erase({ id: downloadItem.id });

      // 3. Restart the download with the new name
      // Note: This won't work for certain POST downloads or those requiring 
      // specific request-state that cannot be captured in a simple URL redirect.
      const newId = await browser.downloads.download({
        url: downloadItem.url,
        filename: newFilename,
        conflictAction: 'uniquify',
        saveAs: false
      });

      // 4. Mark the new download ID so we don't process it again
      renamingProcessIds.add(newId);

      console.log(`Smart Renamer: Intercepted ${filenamePart} -> ${newFilename}`);
    } catch (error) {
      console.error('Smart Renamer Error:', error);
    }
  }
});

// Fallback for Chromium-based browsers if the same code is used there
if (browser.downloads.onDeterminingFilename) {
  browser.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
    browser.storage.local.get(['renameRulesEnabled', 'renameRules'], (result) => {
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

    return true;
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
