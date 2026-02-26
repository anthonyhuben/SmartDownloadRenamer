# Installation Guide

## Prerequisites

- Firefox 121 or later
- Basic understanding of browser extensions (optional)

## Step-by-Step Installation

### Method 1: Temporary Loading (Development)

This method is perfect for testing. The extension will be available until you close Firefox.

1. **Open Firefox Debug Page**
   - In Firefox address bar, type: `about:debugging`
   - Press Enter

2. **Access This Firefox Settings**
   - In the left sidebar, click "This Firefox"
   - You'll see a list of installed extensions

3. **Load the Extension**
   - Click the button labeled "Load Temporary Add-on"
   - A file browser will open
   - Navigate to: `/Users/anthonyh/apps/SmartDownloadRenamer/`
   - Select the `manifest.json` file
   - Click "Open"

4. **Verify Installation**
   - You should see "Smart Download Renamer" listed under extensions
   - A new icon should appear in your Firefox toolbar (download + pencil icon)
   - You can click the icon to open the popup

### Method 2: Persistent Installation (Optional)

To make the extension permanent:

1. **Package the Extension**
   ```bash
   cd /Users/anthonyh/apps/SmartDownloadRenamer
   zip -r SmartDownloadRenamer.zip . -x "*.git*" "*.DS_Store" "Inspiration/*"
   ```

2. **Sign with Firefox (requires AMO account)**
   - This requires registering at addons.mozilla.org
   - Submit for review and signing

3. **Install Signed Extension**
   - Once signed, install via Firefox Add-ons page

## Troubleshooting Installation

### Icon Not Showing
**Problem**: The extension icon doesn't appear in Firefox toolbar

**Solution**:
1. Go to `about:debugging`
2. Click "This Firefox"
3. Look for "Smart Download Renamer" in the list
4. Check if it's enabled
5. Try restarting Firefox

### Extension Won't Load
**Problem**: "Load Temporary Add-on" button doesn't work or error appears

**Solution**:
1. Verify manifest.json exists: `ls -la manifest.json`
2. Check manifest is valid JSON: `cat manifest.json | jq .`
3. Ensure all files exist:
   ```bash
   ls -la popup.html popup.js popup.css background.js smart-rename-utils.js
   ```
4. Try restarting Firefox
5. Clear Firefox cache: Preferences → Privacy → Clear Data

### Downloaded Files Not Showing
**Problem**: No downloads appear in the extension

**Solution**:
1. Download a file to trigger the extension
2. Click the extension icon
3. Click the "Refresh" button
4. Wait a moment for downloads to load

## Verifying Installation

### Check Extension is Loaded
```bash
# Navigate to extension directory
cd /Users/anthonyh/apps/SmartDownloadRenamer

# Verify all required files exist
ls -la manifest.json popup.html popup.js popup.css background.js smart-rename-utils.js icons/

# Check manifest is valid
cat manifest.json | jq '.' >/dev/null && echo "✓ Manifest is valid" || echo "✗ Manifest has errors"
```

### Test Basic Functionality

1. **Download a test file**
   - Go to any website and download a file
   - Or use: `curl -o ~/Downloads/test-file.pdf https://example.com/file.pdf`

2. **Open the extension**
   - Click the Smart Download Renamer icon in Firefox toolbar

3. **Verify download appears**
   - The extension should show your recent download
   - Click "Refresh" if needed

4. **Create a test rule**
   - Click the settings (⚙️) button
   - Toggle "Enable Rename Rules" ON
   - Click "+ Add Rule"
   - Select "Remove" and add text: `test-`
   - Click "Save"

5. **Apply rule to download**
   - Click "Rename" on your test file
   - Verify the preview shows: `file.pdf` (without "test-")
   - This confirms rules are working!

## File Permissions

The extension requires these Firefox permissions:

| Permission | Purpose |
|-----------|---------|
| `downloads` | Access download history and manage downloads |
| `storage` | Save your rename rules across sessions |

## Security Notes

- The extension operates locally on your computer
- No data is sent to external servers
- Your rename rules are stored in Firefox's local storage
- Downloaded files are not modified by the extension directly (Firefox API limitation)

## System Requirements

- **OS**: Any system with Firefox 121+
- **Disk Space**: ~500 KB for extension files
- **RAM**: Minimal impact (< 5 MB)

## Getting Help

If installation fails:

1. Check Firefox version: Menu → Help → About Firefox (should be 121+)
2. Verify manifest.json is valid JSON (use `jq` or online JSON validator)
3. Try in Safe Mode: Firefox → Help → More Troubleshooting → Launch Firefox in Safe Mode
4. Check Firefox console for errors: Ctrl+Shift+K (or Cmd+Shift+K on Mac)

## Next Steps

After successful installation:

1. Read the [Quick Start Guide](QUICKSTART.md)
2. Check out example workflows in [README.md](README.md)
3. Create your first rename rule
4. Customize rules for your workflow

---

**Need more help?** See [QUICKSTART.md](QUICKSTART.md) for usage examples.
