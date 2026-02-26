# Quick Start Guide

Get Smart Download Renamer running in minutes!

## 1. Load the Extension

### Firefox

1. Open Firefox and go to `about:debugging`
2. Click "This Firefox" on the left
3. Click "Load Temporary Add-on"
4. Navigate to the `manifest.json` file in this folder
5. Select it and click "Open"

Done! You should see the Smart Download Renamer icon in your toolbar.

## 2. Open the Extension

Click the download + pencil icon in your Firefox toolbar to open the popup.

## 3. View Your Downloads

Click **Refresh** to see your recent downloads (up to 20 of them).

## 4. Create Your First Rule

1. Click the **⚙️** (settings) button
2. Toggle **Enable Rename Rules** ON
3. Click **+ Add Rule**
4. Select **Replace** from the dropdown
5. Enter:
   - Find: `(1)`
   - Replace with: `` (leave empty to remove)
6. Click **Save**

Now any filename with "(1)" will have it removed!

## 5. Test It Out

1. Download a file that would benefit from renaming
2. Click your extension icon
3. Click **Refresh** to see the new download
4. Click the **Rename** button
5. See the preview with your rules applied
6. Click **Apply** to confirm

## Common Rules

### Remove Numbers in Parentheses
- Type: `Remove`
- Text: `(1)`

### Add Date Prefix
- Type: `Add to Beginning`
- Text: `2024-02-25 `

### Clean YouTube Filenames
- Rule 1: Type `Remove`, Text: `[720p]`
- Rule 2: Type `Remove`, Text: `YouTube`

### Replace Underscores with Spaces
- Type: `Replace`
- Find: `_`
- Replace with: ` ` (a space)

## Tips

- 💡 Rules apply in order - think about the sequence
- 👁️ Check the preview before clicking Apply
- ⚙️ You can have as many rules as you want
- 🔄 Modify rules anytime - they'll apply to all future downloads
- 📋 Rules persist even after restarting Firefox

## Next Steps

- Check out the full [README.md](README.md) for advanced features
- Explore more rule types: Replace, Remove, Add to End, Add to Beginning, Move After Date
- Create custom rule combinations for your workflow

Happy renaming! 🎉
