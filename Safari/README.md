# Smart Download Renamer

A powerful Firefox extension that renames downloaded files based on custom rules you define. Never settle for ugly download filenames again!

## Features

- 📥 **Download History**: View and manage your recent downloads
- 🎯 **Custom Rename Rules**: Create rules to automatically rename files
- ✨ **Multiple Rule Types**:
  - **Replace**: Find and replace text in filenames
  - **Remove**: Remove specific text from filenames
  - **Add to End**: Append text to the end of filenames
  - **Add to Beginning**: Prepend text to filenames
  - **Move After Date**: Reposition text after date prefixes
- 🎨 **Dark Theme UI**: Beautiful, modern interface
- ⚡ **Live Preview**: See how your files will be renamed before applying rules

## Installation

### From Source (Firefox)

1. **Clone or download this repository**
   ```bash
   cd SmartDownloadRenamer
   ```

2. **Open Firefox and navigate to `about:debugging`**
   - Click on "This Firefox" in the left sidebar
   - Click "Load Temporary Add-on"

3. **Select the extension**
   - Navigate to the `manifest.json` file in this directory
   - Click "Open" to load the extension

### Permanent Installation

To install the extension permanently:

1. Package the extension:
   ```bash
   zip -r SmartDownloadRenamer.zip . -x "*.git*" "*.DS_Store" "Inspiration/*"
   ```

2. Submit to Firefox Add-ons (coming soon)

## Usage

### Opening the Extension

Click the Smart Download Renamer icon in your Firefox toolbar to open the popup.

### Viewing Downloads

- **Refresh**: Click the refresh button to reload your recent downloads
- **Download List**: Displays your most recent downloads (up to 20)
- Each download shows:
  - Filename with monospace font for easy reading
  - Current download status (completed, paused, etc.)
  - File size
  - Rename button

### Creating Rename Rules

1. Click the **⚙️ Settings** button (gear icon) to open the Rename Rules panel
2. Toggle "Enable Rename Rules" to activate the feature
3. Click "+ Add Rule" to create a new rule
4. Select a rule type and configure it:

#### Rule Types Explained

**Replace**
- Finds specific text and replaces it with new text
- Example: Find "video.mp4" → Replace with "movie.mp4"

**Remove**
- Removes specified text from the filename
- Example: Remove "(1)" from "file (1).pdf"

**Add to End**
- Appends text to the end of the filename (before extension)
- Example: Add " [HD]" to "movie.mp4" → "movie [HD].mp4"

**Add to Beginning**
- Prepends text to the start of the filename
- Example: Add "2024-02-25 " to "report.pdf" → "2024-02-25 report.pdf"

**Move After Date**
- Repositions text immediately after a date prefix (YYYY MM DD format)
- Useful for organizing files by date with additional metadata
- Example: With date "2024 02 25" in filename, "Move After Date" with "[ARCHIVE]" → "2024 02 25 [ARCHIVE] ..."

### Applying Rules

1. Select a download and click the **Rename** button
2. View the preview of how your file will be renamed
3. Edit the filename manually if needed
4. Click **Apply** to confirm the rename

**Note**: Firefox downloads API allows viewing rename previews, but renaming is handled through your file manager.

## Rule Ordering

Rules are applied in the order you create them. Each rule sees the output of the previous rule, so:

1. Rules are cumulative - each one modifies what the previous one produced
2. Whitespace is normalized after each rule (multiple spaces become single spaces)
3. You can reorder rules by deleting and recreating them

## Example Workflows

### Clean YouTube Downloads

Rule 1: `Remove` - Remove "YouTube" text
Rule 2: `Remove` - Remove resolution tags like "[720p]"
Result: Clean, readable filenames

### Organize by Date

Rule 1: `Add to Beginning` - Add current date "2024-02-25 "
Rule 2: `Replace` - Replace underscores with spaces
Result: "2024-02-25 my document.pdf"

### Archive Organization

Rule 1: `Move After Date` - Move "[ARCHIVE]" after date prefix
Result: "2024 02 25 [ARCHIVE] filename.pdf"

## Architecture

- **manifest.json** - Extension configuration and permissions
- **popup.html/css/js** - User interface and logic
- **background.js** - Service worker for download event handling
- **smart-rename-utils.js** - Core rename rule engine (reusable utility)
- **icons/** - Extension icons in multiple sizes

## Technical Details

### Permissions

The extension requests:
- `downloads` - To access and manage download history
- `storage` - To persist your custom rename rules

### Browser Support

- Firefox (Manifest V3)
- Tested on Firefox 121+

## Troubleshooting

### Rules not applying

- Make sure "Enable Rename Rules" is toggled ON
- Verify you have at least one rule configured
- Check the preview to confirm rules are working as expected

### Downloads not appearing

- Click the Refresh button to reload download history
- Clear your Firefox download history and try again
- Check that the extension has download permissions

### Icon not showing

- Try disabling and re-enabling the extension
- Restart Firefox
- Check that all icon files are present in the `icons/` directory

## Development

### Project Structure

```
SmartDownloadRenamer/
├── manifest.json          # Extension configuration
├── popup.html            # Popup UI
├── popup.css             # Styling
├── popup.js              # Popup logic
├── background.js         # Service worker
├── smart-rename-utils.js # Rename engine
├── icons/                # Extension icons
│   ├── icon-16.svg
│   ├── icon-16.png
│   ├── icon-48.svg
│   ├── icon-48.png
│   ├── icon-128.svg
│   └── icon-128.png
└── README.md            # This file
```

### Based On

This extension is inspired by the SubtitlesArchiver extension and reuses its smart rename utility system for maximum reliability and consistency.

## Future Enhancements

- [ ] Pattern matching with regular expressions
- [ ] Save and load rule presets
- [ ] Statistics on renamed files
- [ ] Keyboard shortcuts
- [ ] Export/import configurations
- [ ] Dark/Light theme toggle

## License

MIT License - Feel free to use and modify!

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

## Support

For bug reports or feature requests, please open an issue in the repository.

---

**Enjoy cleaner, better-organized downloads! 📥**
