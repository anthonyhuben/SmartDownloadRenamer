# SmartDownloadRenamer - Packaging Guide

This guide explains how to build and distribute the SmartDownloadRenamer extension across Firefox, Chrome, and Safari.

## Quick Start

Package all browsers at once:

```bash
./package.sh all
```

This creates ZIP files in the `dist/` directory ready for submission to each store.

## Prerequisites

### Required Tools
- `zip` (usually pre-installed on macOS/Linux)
- `bash` 4.0+ (for array support)

### Optional (for Firefox builds)
- `web-ext` (Firefox's official packaging tool)
  ```bash
  npm install -g web-ext
  ```

If `web-ext` is not installed, the script will skip Firefox builds and continue with Chrome/Safari.

## Usage

### Build All Browsers
```bash
./package.sh all
```

### Build Specific Browser
```bash
./package.sh firefox    # Firefox only
./package.sh chrome     # Chrome only
./package.sh safari     # Safari only
```

### Skip Cleaning Previous Builds
```bash
./package.sh all --skip-clean
```

By default, the script removes previous builds before creating new ones. Use `--skip-clean` to keep existing packages.

## Output

Packages are created in the `dist/` directory:

```
dist/
├── SmartDownloadRenamer-Firefox-1.0.0.zip
├── SmartDownloadRenamer-Chrome-1.0.0.zip
└── SmartDownloadRenamer-Safari-1.0.0.zip
```

Each ZIP contains:
- `manifest.json` - Extension configuration
- `popup.html` / `popup.css` / `popup.js` - User interface
- `background.js` - Service worker
- `smart-rename-utils.js` - Rename engine
- `icons/` - Extension icons (PNG + SVG formats)

**Excluded files** (not included in ZIPs):
- `.DS_Store`
- `*.md` files (README, QUICKSTART, etc.)
- Hidden files (`.gitignore`, etc.)

## Distribution Instructions

### Firefox
1. Go to [Firefox Add-ons Developer Hub](https://addons.mozilla.org/en-US/developers/)
2. Sign in with your Mozilla account
3. Click "Upload New Version"
4. Select `SmartDownloadRenamer-Firefox-X.X.X.zip`
5. Fill in release notes and submit for review

**Review Time:** Usually 1-5 business days

### Chrome
1. Go to [Chrome Web Store Developer Console](https://chrome.google.com/webstore/devconsole/)
2. Sign in with your Google account
3. Click "Create an extension"
4. In the "Package" section, upload `SmartDownloadRenamer-Chrome-X.X.X.zip`
5. Fill in store details and submit

**Review Time:** Usually 1-3 hours

### Safari
Safari requires a different approach:

1. **Option A: App Extension (macOS 13+)**
   - Create an Xcode project with `xcrun safari-web-extension-converter`
   - Extract files from `SmartDownloadRenamer-Safari-X.X.X.zip`
   - Place in the Xcode project's Resources folder
   - Build and submit via App Store Connect

2. **Option B: Legacy Safari Extension (macOS 12 and earlier)**
   - Use Safari Extension Builder in Xcode
   - Reference: [Apple's Safari Web Extension Guide](https://developer.apple.com/documentation/safariservices/safari_web_extensions)

## Manifest Handling

The script uses `manifest.json` to determine version numbers. Currently, all three browsers use **identical manifests** (MV3 format).

If you need browser-specific changes:

1. Edit the respective `{browser}/manifest.json`
2. Use `web-ext` for Firefox (handles MV2/MV3 conversion if needed)
3. The script will automatically package the correct manifest

**Note:** Safari and Chrome both support Manifest V3. Firefox requires special handling if using MV3-specific APIs.

## Version Management

Versions are automatically extracted from each browser's `manifest.json`:

```json
{
  "version": "1.0.0"
}
```

To bump versions:
1. Edit `manifest.json` in each browser directory
2. Re-run the packaging script

## Troubleshooting

### "web-ext is not installed"
This is a warning only. Chrome and Safari packages will still be created.

To enable Firefox packaging:
```bash
npm install -g web-ext
```

### ZIP file too large
The script excludes documentation files automatically. If additional files should be excluded, edit the `build_chrome()` and `build_safari()` functions in `package.sh`:

```bash
zip -q -r "${output_file}" . \
    -x "path/to/exclude" \
    "pattern/*" \
    ...
```

### Signature/Verification Issues
Ensure you have permission to distribute extensions in each store. Store accounts require:
- **Firefox:** Mozilla Developer Account
- **Chrome:** Google Play Developer Account
- **Safari:** Apple Developer Program

## Updating Packages

When releasing a new version:

1. Update version in `manifest.json` for all browsers (or specific ones)
2. Run: `./package.sh all`
3. Submit the new packages to each store
4. Keep the `dist/` folder for records

### Keep Distribution History
```bash
# Archive old versions
mkdir -p dist/releases/v1.0.0
mv dist/*.zip dist/releases/v1.0.0/
```

## Script Features

- **Colored Output** - Easy to spot errors and successes
- **Parallel Validation** - Checks all dependencies before building
- **Clean Builds** - Removes old packages by default
- **File Size Display** - Shows final package sizes
- **Error Handling** - Stops on build failures
- **Detailed Logging** - Clear status messages for each step

## Advanced Usage

### Custom Build Directory
Edit line 23 in `package.sh`:
```bash
DIST_DIR="${PROJECT_DIR}/my-custom-dist"
```

### Additional Exclusions
Add files to the exclusion patterns in `build_chrome()` and `build_safari()`:
```bash
zip -q -r "${output_file}" . \
    -x ".*" \
    ".DS_Store" \
    "*.md" \
    "path/to/exclude/*" \  # Add here
    ...
```

## Testing Packages

Before submitting, verify package contents:

```bash
# List contents of a package
unzip -l dist/SmartDownloadRenamer-Chrome-1.0.0.zip

# Extract and test locally
unzip -d /tmp/test-chrome dist/SmartDownloadRenamer-Chrome-1.0.0.zip
```

## Support

For issues with:
- **Packaging script:** Check script output messages
- **Firefox submission:** See [AMO Documentation](https://extensiondocs.readthedocs.io/)
- **Chrome submission:** See [Chrome Web Store FAQ](https://support.google.com/chrome/a/answer/2663860)
- **Safari submission:** See [Safari Web Extensions Guide](https://developer.apple.com/documentation/safariservices/safari_web_extensions)
