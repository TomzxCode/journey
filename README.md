# Journey

A beautiful, minimal single-page journaling application that helps you document your life and rediscover what you wrote in the past.

## Features

### Daily Journaling
- Clean, distraction-free interface for writing daily entries
- Automatic date tracking
- Write and save entries that persist in browser storage

### Smart Entry Discovery
- **Similar Entry Suggestions**: As you write, Journey automatically finds and displays past entries with similar content
- Real-time keyword matching with debounced search
- Helps you recall related memories and track recurring themes

### Visual Activity Calendar
- GitHub-style contribution calendar showing your journaling activity
- Multi-year navigation with year tabs
- Activity levels based on word count (1-100+ words)
- Click any day to view the full entry
- Hover tooltips with entry previews

### Time-Based Filtering
View past entries from:
- Yesterday
- Last Week (1-7 days)
- Last Month (1-30 days)
- Last Year (1-365 days)

### Import/Export
- **Export**: Download your entire journal as a Markdown file
- **Import**: Load journal entries from Markdown or text files
- **Directory Auto-Load**: Select a directory to automatically scan and load journal files
  - Supports nested folder structures
  - File type filtering (Markdown, Text, JSON)
  - Selective file loading with remember preferences
  - Auto-scan on directory selection

### Data Persistence
- All entries stored in browser localStorage
- Separate storage for manually entered and directory-loaded entries
- Automatic merging of entries from multiple sources

## Technical Stack

- **Pure Vanilla JavaScript** - No frameworks or dependencies
- **HTML5** - Semantic markup with modern APIs
- **CSS3** - Custom styling with CSS Grid and Flexbox
- **File System Access API** - For directory selection and file loading
- **localStorage API** - For data persistence

## Getting Started

### Prerequisites
- A modern web browser (Chrome 86+, Edge 86+, or equivalent)
- For directory auto-load feature: Browser with File System Access API support

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/journey.git
cd journey
```

2. Open [index.html](index.html) in your web browser:
```bash
# On macOS
open index.html

# On Linux
xdg-open index.html

# On Windows
start index.html
```

Or simply drag and drop [index.html](index.html) into your browser.

### Usage

#### Writing Entries
1. The current date is displayed at the top
2. Type your thoughts in the text area
3. Click "Save Entry" to store your entry
4. Click "Clear" to reset the text area

#### Viewing Past Entries
- Use the time filter buttons (Yesterday, Last Week, Last Month, Last Year) to view past entries
- Click on any day in the activity calendar to view that specific entry
- As you type, similar past entries appear automatically below the text area

#### Importing Existing Journals
**Single File Import:**
1. Click "Import Journal"
2. Select a Markdown (.md) or text (.txt) file
3. Supported formats:
   - Markdown with date headers: `# YYYY-MM-DD`
   - Plain text with date lines: `YYYY-MM-DD`, `YYYYMMDD`, or `YYYY/MM/DD`

**Directory Auto-Load:**
1. Click "Select Directory"
2. Choose a folder containing your journal files
3. Click "Scan for Files" to discover all journal files
4. Select which files to load (or use Select All)
5. Click "Load Selected Files"
6. Enable "Auto-scan on directory selection" for automatic loading on future visits

#### Exporting Your Journal
1. Click "Export as Markdown"
2. A file named `journal-export-YYYY-MM-DD.md` will be downloaded
3. Format includes date headers and all entries in chronological order

## File Structure

```
journey/
├── index.html          # Main HTML structure
├── styles.css          # Styling and layout
├── script.js           # Application logic
├── README.md           # This file
└── test-files/         # Sample journal files for testing
    ├── 2024-09-20.md
    ├── 2024-09-21.txt
    └── subdirectory/
        └── 2024-09-22.md
```

## Data Storage

Journey uses browser localStorage with the following keys:
- `journey.journalEntries` - Manually entered journal entries
- `journey.directorySettings` - Directory selection preferences
- `journey.selectedFiles_{directoryName}` - Remember which files were loaded

## Browser Compatibility

| Feature | Chrome | Edge | Firefox | Safari |
|---------|--------|------|---------|--------|
| Core journaling | ✅ All | ✅ All | ✅ All | ✅ All |
| Directory picker | ✅ 86+ | ✅ 86+ | ❌ | ❌ |
| localStorage | ✅ All | ✅ All | ✅ All | ✅ All |

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## License

This project is open source and available under the MIT License.

## Privacy

All data is stored locally in your browser.
No data is transmitted to external servers.
Your journal entries remain completely private on your device.
