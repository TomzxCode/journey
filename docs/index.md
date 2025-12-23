# Journey

Welcome to **Journey** - a beautiful, minimal single-page journaling application that helps you document your life and rediscover what you wrote in the past.

## Overview

Journey is a pure vanilla JavaScript journaling app that runs entirely in your browser. All your data stays on your device, ensuring complete privacy. With features like activity visualization, smart entry discovery, and flexible import/export options, Journey makes it easy to maintain a consistent journaling practice.

## Key Features

### 📝 Daily Journaling
- Clean, distraction-free writing interface
- Automatic date tracking
- Browser-based persistence (localStorage)

### 🔍 Smart Entry Discovery
- Real-time similar entry suggestions as you write
- Keyword-based matching to help recall related memories
- Track recurring themes across your entries

### 📊 Visual Activity Calendar
- GitHub-style contribution calendar
- Multi-year navigation
- Activity levels based on word count
- Click any day to view entries
- Hover tooltips with previews

### ⏱️ Time-Based Filtering
View entries from:
- Yesterday
- Last Week (1-7 days ago)
- Last Month (1-30 days ago)
- Last Year (1-365 days ago)

### 💾 Import/Export
- Export entire journal as Markdown
- Import from Markdown or text files
- Directory auto-load for bulk importing
- Selective file loading with preferences

### 🔒 Privacy First
- All data stored locally in your browser
- No external servers or data transmission
- Complete privacy and control

## Quick Start

1. **Open the app**: Simply open `index.html` in a modern web browser
2. **Write**: Type your thoughts in the text area
3. **Save**: Click "Save Entry" to store your entry
4. **Explore**: Use the calendar and filters to rediscover past entries

## Use Cases

Journey is perfect for:
- **Personal journaling**: Daily reflections and life documentation
- **Gratitude practice**: Track what you're thankful for
- **Dream journaling**: Record and analyze dreams
- **Project logs**: Document work progress over time
- **Learning notes**: Track insights and learnings
- **Migrating from other apps**: Import existing journal files

## Technical Highlights

- **Pure vanilla JavaScript** - no frameworks or dependencies
- **Modern web APIs** - File System Access, localStorage
- **Responsive design** - works on desktop and mobile
- **Offline-ready** - no internet connection required

## Browser Compatibility

| Feature | Chrome | Edge | Firefox | Safari |
|---------|--------|------|---------|--------|
| Core journaling | ✅ All | ✅ All | ✅ All | ✅ All |
| Directory picker | ✅ 86+ | ✅ 86+ | ❌ | ❌ |

## Next Steps

- [Getting Started Guide](getting-started.md) - Detailed setup and usage instructions
- [Supported Formats](formats.md) - Learn about import/export formats
- [Architecture](architecture.md) - Technical implementation details

## Privacy & Data

Journey respects your privacy:
- All data stored in browser localStorage
- No analytics or tracking
- No external API calls
- Your journal stays on your device

## License

Journey is open source and available under the MIT License.
