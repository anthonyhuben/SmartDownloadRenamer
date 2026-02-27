# Distribution Quick Reference

## One-Command Workflow

```bash
# 1. Build all packages
make package

# 2. Verify packages are correct
make verify

# 3. View packages
make list
```

## Common Tasks

### Build for a Single Browser
```bash
make package-firefox    # Firefox only
make package-chrome     # Chrome only
make package-safari     # Safari only
```

Or with the script directly:
```bash
./package.sh firefox
./package.sh chrome
./package.sh safari
```

### Verify Package Contents
```bash
make verify
# or
./verify-packages.sh
```

### Clean Up Old Packages
```bash
make clean
# Removes all built packages from dist/
```

### List Built Packages
```bash
make list
```

### Install Firefox Packaging Tools
```bash
make install-tools
# Installs web-ext globally for Firefox builds
```

## Distribution URLs

### Firefox Add-ons
- **Store:** https://addons.mozilla.org/
- **Developer Hub:** https://addons.mozilla.org/en-US/developers/
- **Submission:** https://addons.mozilla.org/en-US/developers/addons/submit/
- **Review Time:** 1-5 business days
- **Requirements:** Mozilla Developer Account

### Chrome Web Store
- **Store:** https://chrome.google.com/webstore
- **Developer Console:** https://chrome.google.com/webstore/devconsole/
- **Submission:** Create extension in console, upload ZIP
- **Review Time:** 1-3 hours
- **Requirements:** Google Play Developer Account

### Safari
- **Store:** Mac App Store (via Xcode)
- **Developer:** https://developer.apple.com/safari/
- **Process:** Xcode → App Extension → Submit to App Store Connect
- **Review Time:** 1-3 business days
- **Requirements:** Apple Developer Program

## Package Files

Built packages are located in `dist/`:

```
SmartDownloadRenamer-Firefox-1.0.0.zip  → Firefox Add-ons store
SmartDownloadRenamer-Chrome-1.0.0.zip   → Chrome Web Store
SmartDownloadRenamer-Safari-1.0.0.zip   → Safari/Xcode
```

Each package contains:
- `manifest.json` - Extension configuration
- `popup.{html,css,js}` - User interface
- `background.js` - Service worker/event handler
- `smart-rename-utils.js` - Core rename engine
- `icons/` - PNG + SVG icons

Excluded files (not in packages):
- `.DS_Store`
- Documentation (README, QUICKSTART, etc.)
- Hidden files

## Version Management

All three browsers use the same `manifest.json` with version:

```json
{
  "version": "1.0.0",
  ...
}
```

To release a new version:

1. **Update manifest.json** in Firefox/, Chrome/, and Safari/ directories
2. **Run packaging:** `make package`
3. **Verify:** `make verify`
4. **Submit** to each store

Example version bump:
```bash
# Edit Firefox/manifest.json, Chrome/manifest.json, Safari/manifest.json
# Change "version": "1.0.0" to "version": "1.0.1"
make package
make verify
```

## Troubleshooting

### "web-ext not found"
Web-ext is only needed for Firefox builds. Chrome and Safari will build fine without it.

Install it with:
```bash
make install-tools
# or
npm install -g web-ext
```

### Package missing required files
Run verification:
```bash
make verify
```

This checks for:
- Required code files (manifest.json, popup.js, etc.)
- Icons (SVG and PNG)
- Valid manifest structure
- Excluded files that shouldn't be packaged

### Store won't accept package
1. Verify package: `make verify`
2. Check manifest.json for store-specific requirements
3. Test locally before submitting
4. See store documentation for specific requirements

## Testing Before Distribution

### Test Extension Locally

**Firefox:**
```bash
# Load unsigned extension (dev mode)
1. Go to about:debugging
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select dist/SmartDownloadRenamer-Firefox-*.zip
```

**Chrome:**
```bash
# Load unpacked extension
1. Go to chrome://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select dist/SmartDownloadRenamer-Chrome-*.zip (extracted)
```

**Safari:**
```bash
# Requires Xcode conversion
1. Run: xcrun safari-web-extension-converter dist/SmartDownloadRenamer-Safari-*.zip
2. Open in Xcode and run on simulator/device
```

### Verify Package Contents
```bash
# List files in package
unzip -l dist/SmartDownloadRenamer-Chrome-1.0.0.zip
```

## CI/CD Integration

For automated builds, add to your CI pipeline:

```bash
#!/bin/bash
set -e

# Install dependencies
npm install -g web-ext

# Build packages
./package.sh all

# Verify
./verify-packages.sh

# Optionally, upload to stores
# (requires store API credentials)
```

## Storage & Version History

Keep distribution history:

```bash
# Archive old versions
mkdir -p dist/releases/v1.0.0
cp dist/SmartDownloadRenamer-*.zip dist/releases/v1.0.0/

# Clean for new release
rm dist/SmartDownloadRenamer-*.zip
make package
```

## Help & Support

For detailed information:
- **Packaging:** See `PACKAGING.md`
- **Firefox:** Run `./package.sh firefox` with web-ext installed
- **Chrome:** See `Chrome/README.md`
- **Safari:** See `Safari/README.md`

For issues, check:
1. `./package.sh` comments for script details
2. `./verify-packages.sh` for package validation
3. Store documentation for submission requirements

---

**Last Updated:** 2026-02-26
**Extension Version:** 1.0.0
**Manifest Version:** 3
