# Project Structure

## Directory Layout

```
SmartDownloadRenamer/
│
├── manifest.json              ← Extension configuration (MV3)
├── popup.html                 ← Popup UI structure
├── popup.css                  ← Popup styling (dark theme)
├── popup.js                   ← Popup logic & UI handlers
├── background.js              ← Service worker (download events)
├── smart-rename-utils.js      ← Core rename engine utility
│
├── icons/                     ← Extension icons
│   ├── icon-16.svg           ← 16x16 SVG icon
│   ├── icon-16.png           ← 16x16 PNG icon
│   ├── icon-48.svg           ← 48x48 SVG icon
│   ├── icon-48.png           ← 48x48 PNG icon
│   ├── icon-128.svg          ← 128x128 SVG icon
│   └── icon-128.png          ← 128x128 PNG icon
│
├── README.md                  ← Full documentation
├── QUICKSTART.md              ← Quick start guide
├── INSTALLATION.md            ← Installation instructions
├── PROJECT_STRUCTURE.md       ← This file
│
└── Inspiration/               ← Reference files (not part of extension)
    └── SubtitlesArchiver/     ← Original Smart Rename source
```

## File Descriptions

### Core Extension Files

#### `manifest.json`
- **Purpose**: Extension configuration
- **Contains**: Name, version, permissions, icon references
- **Key Details**:
  - Manifest V3
  - Permissions: `downloads`, `storage`
  - Popup: 450x600px
  - Background: Service worker
  - Icons: 16, 48, 128px versions

#### `popup.html`
- **Purpose**: Extension popup user interface
- **Contains**: HTML structure for UI
- **Sections**:
  - Toolbar (Refresh, Settings buttons)
  - Status messages
  - Loading spinner
  - Downloads list
  - Empty state
  - Modal for dialogs

#### `popup.css`
- **Purpose**: Styling for the popup
- **Features**:
  - Dark theme (#272822, #1e1f1c)
  - Accent color: #a1efe4 (cyan)
  - Error color: #f92672 (pink)
  - Responsive layout
  - Glass-morphism effects
  - Smart rename UI components

#### `popup.js` (~450 lines)
- **Purpose**: Popup interaction logic
- **Functions**:
  - `loadDownloads()` - Fetch recent downloads
  - `displayDownloads()` - Render download list
  - `showRenameModal()` - Display rename dialog
  - `showRenameRulesSettings()` - Display rules editor
  - `updateRulesIndicator()` - Show/hide active indicator
  - UI helpers: `showStatus()`, `closeModal()`, etc.

#### `background.js` (~60 lines)
- **Purpose**: Download event handler (Service Worker)
- **Handles**:
  - Download creation events
  - Download state changes
  - Message passing with popup
  - Rule application

#### `smart-rename-utils.js` (~80 lines)
- **Purpose**: Core filename renaming engine
- **Exports**: `SmartRenameUtils` object
- **Methods**:
  - `applyRules(filename, rules)` - Main entry point
  - Handles 5 rule types with sequential application
  - Normalizes whitespace after each rule

### Documentation Files

#### `README.md`
- Complete feature overview
- Installation instructions (source + Firefox Add-ons)
- Detailed usage guide
- Rule type explanations
- Example workflows
- Architecture details
- Troubleshooting

#### `QUICKSTART.md`
- 5-minute setup guide
- Loading extension in Firefox
- First rule creation
- Common rule templates
- Tips and tricks

#### `INSTALLATION.md`
- Step-by-step installation
- Method 1: Temporary (development)
- Method 2: Persistent (requires signing)
- Troubleshooting guide
- Verification steps
- Security notes

#### `PROJECT_STRUCTURE.md`
- This file
- Complete file organization
- File descriptions

### Icon Files

#### `icons/` Directory
- **icon-16.svg/png**: Toolbar icon (16x16)
- **icon-48.svg/png**: Settings/context menu (48x48)
- **icon-128.svg/png**: Extension store/large (128x128)
- **Format**: Both SVG (scalable) and PNG (raster)
- **Design**: Download icon + pencil overlay

## Data Flow

### Download Processing Flow
```
User downloads file
        ↓
background.js detects (chrome.downloads.onCreated)
        ↓
Check if rules enabled in storage
        ↓
Apply SmartRenameUtils.applyRules()
        ↓
Store suggestion in storage (pendingRenames)
        ↓
popup.js displays in download list
        ↓
User clicks Rename button
        ↓
showRenameModal() displays preview
        ↓
User confirms → File renamed
```

### Rule Application Flow
```
Filename: "video (1).mp4"
        ↓
Rule 1 (Remove "(1)") → "video  .mp4"
        ↓
Normalize whitespace → "video .mp4"
        ↓
Rule 2 (Replace space with underscore) → "video_.mp4"
        ↓
Normalize whitespace → "video_.mp4"
        ↓
Final result: "video_.mp4"
```

## Storage Schema

### Chrome Storage (Local)
```javascript
{
  "renameRulesEnabled": boolean,
  "renameRules": [
    {
      "type": "replace" | "remove" | "addEnd" | "addBeginning" | "moveAfterDate",
      "find": string,           // For "replace" type
      "replaceWith": string,    // For "replace" type
      "text": string            // For other types
    }
  ],
  "pendingRenames": {
    "downloadId": {
      "originalFilename": string,
      "suggestedFilename": string,
      "downloadId": string
    }
  }
}
```

## Key Classes & Objects

### SmartRenameUtils
- `applyRules(filename, rules)` → string

### Rule Object Schema
```javascript
{
  type: 'replace' | 'remove' | 'addEnd' | 'addBeginning' | 'moveAfterDate',
  find?: string,        // For 'replace' type
  replaceWith?: string, // For 'replace' type
  text?: string         // For all other types
}
```

## Browser API Usage

### APIs Used
- **downloads**: Query, pause, resume downloads
- **storage.local**: Persist settings across sessions
- **runtime**: Inter-component messaging

### Permissions Required
```json
"permissions": ["downloads", "storage"]
```

## Development Notes

### File Size References
- manifest.json: ~300 bytes
- popup.html: ~3 KB
- popup.css: ~18 KB
- popup.js: ~15 KB
- background.js: ~2 KB
- smart-rename-utils.js: ~2 KB
- Icons (6 files): ~10 KB total
- **Total**: ~50 KB

### Dependencies
- None! The extension has zero external dependencies
- Uses vanilla JavaScript (ES6+)
- Fully self-contained

### Browser Support
- Firefox 121+ (Manifest V3)
- Not compatible with Chromium/Edge (downloads API differences)

## Extending the Extension

### To Add a New Rule Type

1. Add case to `SmartRenameUtils.applyRules()` in `smart-rename-utils.js`
2. Add UI handling in `popup.js` `buildRuleHTML()` function
3. Add CSS styling for inputs in `popup.css`

### To Modify UI

- Edit `popup.html` for structure
- Edit `popup.css` for styling
- Edit `popup.js` for interaction logic

### To Add New Storage Keys

- Update `chrome.storage.local.get()` calls in `popup.js`
- Update `chrome.storage.local.set()` calls accordingly

## Testing Checklist

- [ ] Manifest.json is valid
- [ ] All files present and readable
- [ ] Extension loads in Firefox (about:debugging)
- [ ] Icon appears in toolbar
- [ ] Popup opens when icon clicked
- [ ] Refresh button loads downloads
- [ ] Settings button opens rules editor
- [ ] Can create/edit/delete rules
- [ ] Rules preview works
- [ ] Settings persist after restart

---

**Last Updated**: February 25, 2026
**Version**: 1.0.0
