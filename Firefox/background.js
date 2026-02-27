/**
 * Background Script for Firefox (Desktop & Android)
 * Intercepts downloads before filename is determined and applies rename rules.
 */

const renamingProcessIds = new Set();

/**
 * ANDROID FALLBACK: Use webRequest to rename files via Content-Disposition headers.
 * This is necessary because Firefox for Android (Fenix) does not yet support the downloads API.
 */
if (browser.webRequest && browser.webRequest.onHeadersReceived) {
  browser.webRequest.onHeadersReceived.addListener(
    async (details) => {
      // Don't intercept if rules are disabled
      const result = await browser.storage.local.get(['renameRulesEnabled', 'renameRules']);
      if (!result.renameRulesEnabled || !result.renameRules?.length) return;

      const responseHeaders = details.responseHeaders;
      let modified = false;

      for (let header of responseHeaders) {
        if (header.name.toLowerCase() === 'content-disposition') {
          // Look for filename="name.ext" or filename*=UTF-8''name.ext
          const cdValue = header.value;

          // Try to extract the filename part
          let filename = '';
          let match = cdValue.match(/filename\*?=["']?([^"';\n]+)["']?/i);

          if (match) {
            filename = match[1];
            // Basic handling for filename* (RFC 5987)
            if (cdValue.toLowerCase().includes('filename*=')) {
              try {
                const parts = filename.split("''");
                if (parts.length > 1) filename = decodeURIComponent(parts[1]);
              } catch (e) { /* ignore encoding errors */ }
            }

            const newFilename = SmartRenameUtils.applyRules(filename, result.renameRules);

            if (newFilename !== filename) {
              // Replace the filename in the header string
              header.value = cdValue.replace(filename, newFilename);
              modified = true;
              console.log(`Smart Renamer (Android/Headers): ${filename} -> ${newFilename}`);
            }
          }
        }
      }

      if (modified) {
        return { responseHeaders };
      }
    },
    { urls: ["<all_urls>"], types: ["main_frame", "sub_frame", "other"] },
    ["blocking", "responseHeaders"]
  );
}

/**
 * DESKTOP MODE: Use the downloads API for more robust renaming (restart-based).
 */
if (browser.downloads && browser.downloads.onCreated) {
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
    let originalFilename = downloadItem.filename || '';
    if (!originalFilename && downloadItem.url) {
      try {
        const url = new URL(downloadItem.url);
        originalFilename = url.pathname.split('/').pop();
      } catch (e) { }
    }

    const filenamePart = originalFilename.split(/[\\/]/).pop();
    if (!filenamePart) return;

    const newFilename = SmartRenameUtils.applyRules(filenamePart, renameRules);

    if (newFilename !== filenamePart) {
      try {
        // Cancel and restart with new name
        await browser.downloads.cancel(downloadItem.id);
        await browser.downloads.erase({ id: downloadItem.id });

        const newId = await browser.downloads.download({
          url: downloadItem.url,
          filename: newFilename,
          conflictAction: 'uniquify',
          saveAs: false
        });

        renamingProcessIds.add(newId);
        console.log(`Smart Renamer (Desktop): ${filenamePart} -> ${newFilename}`);
      } catch (error) {
        console.error('Smart Renamer Error:', error);
      }
    }
  });
}

// Message listener for popup communication
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'resumeDownload' && browser.downloads) {
    browser.downloads.resume(request.downloadId, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

console.log('Smart Download Renamer background script loaded');
