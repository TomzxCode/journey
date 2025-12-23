# Getting Started

This guide will help you get up and running with Journey.

## Installation

### Prerequisites

- A modern web browser (Chrome 86+, Edge 86+, Firefox, or Safari)
- For directory auto-load feature: Chrome 86+ or Edge 86+ (File System Access API support)

### Setup

1. **Clone or download the repository**:
   ```bash
   git clone https://github.com/tomzxcode/journey.git
   cd journey
   ```

2. **Open in browser**:

   === "macOS"
       ```bash
       open index.html
       ```

   === "Linux"
       ```bash
       xdg-open index.html
       ```

   === "Windows"
       ```bash
       start index.html
       ```

   Or simply drag and drop `index.html` into your browser.

3. **That's it!** Journey runs entirely in your browser - no server or build step required.

## First Steps

### Writing Your First Entry

1. When you open Journey, you'll see today's date at the top
2. Click in the text area and start writing
3. Click **Save Entry** to store your entry
4. Your entry is now saved in browser localStorage

![Writing an entry](https://via.placeholder.com/800x400?text=Writing+Interface)

!!! tip "Keyboard Shortcuts"
    Save time by using keyboard shortcuts (if available in your browser).

### Viewing Past Entries

#### Using Time Filters

Click the time filter buttons to view entries from specific periods:

- **Yesterday**: Entries from exactly 1 day ago
- **Last Week**: Entries from 1-7 days ago
- **Last Month**: Entries from 1-30 days ago
- **Last Year**: Entries from 1-365 days ago

#### Using the Activity Calendar

The GitHub-style calendar shows your journaling activity:

1. **Color intensity** indicates word count:
   - Light: 1-25 words
   - Medium: 26-100 words
   - Dark: 100+ words

2. **Navigate years**: Click year tabs to switch between years

3. **View entries**: Click any colored square to view that day's entry

4. **Hover for preview**: Hover over a square to see a preview

### Similar Entry Discovery

As you write, Journey automatically finds related past entries:

1. Start typing in the text area
2. After a brief pause, similar entries appear below
3. Keywords are matched across all your entries
4. Click on similar entries to view them

!!! info "How it works"
    Journey uses keyword extraction and debounced search to find entries with similar content without slowing down your writing.

## Importing Existing Journals

### Single File Import

If you have journal entries in text or Markdown files:

1. Click **Import Journal**
2. Select a `.md`, `.txt`, or `.json` file
3. Journey will parse and import your entries

#### Supported Date Formats

Journey recognizes these date formats:

=== "Markdown Headers"
    ```markdown
    # 2024-01-15
    Today was a great day...

    # 2024-01-16
    Another entry...
    ```

=== "Plain Text"
    ```
    2024-01-15
    Today was a great day...

    2024-01-16
    Another entry...
    ```

=== "Compact Format"
    ```
    20240115
    Today was a great day...

    20240116
    Another entry...
    ```

=== "Slash Format"
    ```
    2024/01/15
    Today was a great day...

    2024/01/16
    Another entry...
    ```

### Directory Auto-Load

For bulk importing multiple journal files:

1. Click **Select Directory**
2. Choose a folder containing your journal files
3. Click **Scan for Files** to discover all compatible files
4. Review the file list:
   - Check files you want to load
   - Or use **Select All**
5. Click **Load Selected Files**
6. Enable **Auto-scan on directory selection** for automatic loading on future visits

!!! warning "Browser Compatibility"
    Directory selection requires Chrome 86+ or Edge 86+ due to File System Access API requirements.

#### Directory Structure Support

Journey handles nested directories:

```
my-journals/
├── 2024/
│   ├── 2024-01-15.md
│   ├── 2024-01-16.txt
│   └── january/
│       └── 2024-01-17.md
└── 2023/
    └── 2023-12-31.md
```

All files in subdirectories will be discovered and can be loaded.

#### File Type Filtering

When scanning directories, you can filter by:

- **Markdown** (`.md`)
- **Text** (`.txt`)
- **JSON** (`.json`)
- **All supported types**

## Exporting Your Journal

### Export as Markdown

To back up or share your journal:

1. Click **Export as Markdown**
2. A file named `journal-export-YYYY-MM-DD.md` will download
3. The file contains all entries in chronological order

#### Export Format

```markdown
# 2024-01-15

Today was a great day. I learned about...

---

# 2024-01-16

Another productive day...

---
```

!!! tip "Regular Backups"
    Export your journal regularly to create backups. Store exports in cloud storage or external drives.

## Managing Your Data

### Understanding Storage

Journey uses browser localStorage with separate storage keys:

- `journey.journalEntries` - Manually written entries
- `journey.directorySettings` - Directory selection preferences
- `journey.selectedFiles_{directoryName}` - File selection preferences

### Clearing Data

To clear your journal data:

1. Open browser DevTools (F12)
2. Go to **Application** (Chrome/Edge) or **Storage** (Firefox)
3. Find **Local Storage** for your domain
4. Delete the `journey.*` keys

!!! warning "Data Loss"
    Clearing localStorage will permanently delete your entries unless you've exported them first.

### Data Privacy

Journey is completely private:

- All data stays in your browser
- No external API calls
- No analytics or tracking
- No account or login required

Your journal data never leaves your device unless you explicitly export it.

## Tips for Effective Journaling

### Consistency

- Set a specific time each day for journaling
- Use the activity calendar to track your streak
- Start small - even a few sentences counts

### Organization

- Use the similar entries feature to link related thoughts
- Tag entries with keywords for easier discovery
- Review past entries regularly using time filters

### Privacy

- Export backups regularly
- Consider encrypting exports if storing in cloud
- Use private/incognito browsing for extra privacy

## Troubleshooting

### Entries Not Saving

- Check if localStorage is enabled in your browser
- Ensure you're not in private/incognito mode (unless intended)
- Check browser console for errors

### Directory Selection Not Working

- Verify you're using Chrome 86+ or Edge 86+
- Check browser permissions for file access
- Try refreshing the page

### Similar Entries Not Appearing

- Write at least a few words before they appear
- Wait briefly after typing (search is debounced)
- Ensure you have other entries saved

## Next Steps

- Learn about [supported formats](formats.md) in detail
- Explore the [architecture](architecture.md) if you want to customize or extend Journey
- Start journaling!
