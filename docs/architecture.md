# Architecture

This document describes the technical architecture and implementation details of Journey.

## Overview

Journey is a single-page application (SPA) built with pure vanilla JavaScript, HTML, and CSS. It runs entirely in the browser with no backend server, relying on modern web APIs for functionality.

## Technology Stack

### Core Technologies

- **Vanilla JavaScript (ES6+)** - No frameworks or build tools
- **HTML5** - Semantic markup and modern APIs
- **CSS3** - Grid, Flexbox, custom properties
- **localStorage API** - Data persistence
- **File System Access API** - Directory selection and file loading

### Why Vanilla JavaScript?

1. **Zero dependencies** - No npm packages, no build step
2. **Fast load times** - Minimal JavaScript to parse
3. **Simple deployment** - Just open the HTML file
4. **Easy maintenance** - No framework updates or breaking changes
5. **Learning resource** - Clean code examples

## Project Structure

```
journey/
├── index.html          # Main HTML structure and layout
├── styles.css          # All styles and responsive design
├── script.js           # Application logic and functionality
├── README.md           # Project documentation
├── docs/               # User documentation (MkDocs)
└── test-files/         # Sample journal files for testing
```

## Core Components

### 1. HTML Structure (index.html)

The HTML is organized into logical sections:

```html
<body>
  <header>
    <!-- App title and controls -->
  </header>

  <main>
    <!-- Current date display -->
    <!-- Text area for writing -->
    <!-- Save/Clear buttons -->
    <!-- Time filter buttons -->
    <!-- Similar entries section -->
  </main>

  <section class="activity-calendar">
    <!-- Year navigation -->
    <!-- Calendar grid -->
  </section>

  <footer>
    <!-- Import/Export controls -->
    <!-- Directory selection -->
  </footer>
</body>
```

Key HTML features:
- Semantic elements (`header`, `main`, `section`, `footer`)
- Accessible form controls
- Dynamic content containers
- File input elements for import

### 2. Styling (styles.css)

CSS organization:

```css
/* 1. CSS Custom Properties (Variables) */
:root {
  --primary-color: #...;
  --background-color: #...;
  /* ... */
}

/* 2. Reset and Base Styles */
* { /* ... */ }

/* 3. Layout Components */
.container { /* ... */ }

/* 4. UI Components */
.button { /* ... */ }
.text-area { /* ... */ }

/* 5. Activity Calendar */
.calendar-grid { /* ... */ }

/* 6. Responsive Design */
@media (max-width: 768px) { /* ... */ }
```

Design principles:
- **CSS Grid** for calendar layout
- **Flexbox** for component alignment
- **Custom properties** for theming
- **Mobile-first** responsive design

### 3. Application Logic (script.js)

The JavaScript is organized into functional modules:

```javascript
// Global State
let journalEntries = {};
let directoryEntries = {};
let currentDirectoryHandle = null;

// Initialization
document.addEventListener('DOMContentLoaded', init);

// Core Functions
function init() { /* ... */ }
function saveEntry() { /* ... */ }
function loadEntries() { /* ... */ }

// Feature Modules
function renderActivityCalendar() { /* ... */ }
function findSimilarEntries() { /* ... */ }
function exportToMarkdown() { /* ... */ }
function importFromFile() { /* ... */ }
function selectDirectory() { /* ... */ }

// Utility Functions
function formatDate() { /* ... */ }
function parseJournalFile() { /* ... */ }
function getActivityLevel() { /* ... */ }
```

## Data Architecture

### Storage Model

Journey uses browser localStorage with a multi-key strategy:

```javascript
{
  "journey.journalEntries": {
    "2024-01-15": "Entry content...",
    "2024-01-16": "More content..."
  },
  "journey.directoryEntries": {
    "2024-01-15": "Loaded from file...",
    "2024-01-17": "Another file..."
  },
  "journey.directorySettings": {
    "directoryName": "my-journals",
    "autoScan": true,
    "lastScanned": "2024-01-15T12:00:00Z"
  },
  "journey.selectedFiles_my-journals": [
    "/path/to/file1.md",
    "/path/to/file2.txt"
  ]
}
```

#### Storage Keys

| Key | Purpose | Format |
|-----|---------|--------|
| `journey.journalEntries` | Manually written entries | `{ date: content }` object |
| `journey.directoryEntries` | Directory-loaded entries | `{ date: content }` object |
| `journey.directorySettings` | Directory preferences | Configuration object |
| `journey.selectedFiles_{name}` | File selection memory | Array of file paths |

#### Why Separate Storage?

1. **Conflict prevention** - Manual vs. loaded entries don't overwrite
2. **Selective clearing** - Can clear loaded entries without losing manual ones
3. **Source tracking** - Know where each entry came from
4. **Merge flexibility** - Combine or keep separate as needed

### Data Flow

```
User Input
    ↓
Save to localStorage (journey.journalEntries)
    ↓
Update in-memory state (journalEntries)
    ↓
Re-render UI components
    ↓
Update activity calendar
    ↓
Refresh similar entries
```

## Key Features Implementation

### 1. Activity Calendar

The calendar uses a grid-based approach:

```javascript
function renderActivityCalendar() {
  // 1. Determine date range (past 365 days or full history)
  const startDate = /* ... */;
  const endDate = new Date();

  // 2. Create grid cells
  for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDate(d);
    const entry = getEntry(dateStr);

    // 3. Calculate activity level
    const level = getActivityLevel(entry);

    // 4. Create cell element
    const cell = createCalendarCell(dateStr, level, entry);
    calendar.appendChild(cell);
  }
}

function getActivityLevel(entry) {
  if (!entry) return 0;
  const wordCount = entry.split(/\s+/).length;

  if (wordCount === 0) return 0;
  if (wordCount <= 25) return 1;
  if (wordCount <= 100) return 2;
  return 3;
}
```

**CSS Grid Layout:**

```css
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(53, 12px); /* 53 weeks */
  grid-auto-rows: 12px;
  gap: 3px;
}

.calendar-cell {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

/* Activity levels */
.calendar-cell.level-0 { background: #ebedf0; }
.calendar-cell.level-1 { background: #9be9a8; }
.calendar-cell.level-2 { background: #40c463; }
.calendar-cell.level-3 { background: #30a14e; }
```

### 2. Similar Entry Discovery

Real-time similarity search with debouncing:

```javascript
let searchTimeout = null;
const DEBOUNCE_DELAY = 500; // ms

textarea.addEventListener('input', function() {
  // Clear previous timeout
  clearTimeout(searchTimeout);

  // Set new timeout
  searchTimeout = setTimeout(() => {
    findSimilarEntries(this.value);
  }, DEBOUNCE_DELAY);
});

function findSimilarEntries(currentText) {
  // 1. Extract keywords from current text
  const keywords = extractKeywords(currentText);

  // 2. Search all entries
  const matches = [];
  for (const [date, content] of Object.entries(allEntries)) {
    if (date === currentDate) continue; // Skip today

    // 3. Calculate similarity score
    const score = calculateSimilarity(keywords, content);
    if (score > THRESHOLD) {
      matches.push({ date, content, score });
    }
  }

  // 4. Sort by relevance and display
  matches.sort((a, b) => b.score - a.score);
  displaySimilarEntries(matches.slice(0, 5)); // Top 5
}

function extractKeywords(text) {
  // Simple keyword extraction
  const words = text.toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 3) // Min length
    .filter(w => !STOPWORDS.includes(w)); // Remove common words

  return new Set(words);
}

function calculateSimilarity(keywords, content) {
  const contentWords = new Set(
    content.toLowerCase().split(/\s+/)
  );

  // Count keyword matches
  let matches = 0;
  for (const keyword of keywords) {
    if (contentWords.has(keyword)) matches++;
  }

  return matches / keywords.size; // Percentage match
}
```

### 3. Import/Export

#### Export Implementation

```javascript
function exportToMarkdown() {
  // 1. Combine and sort entries
  const allEntries = { ...journalEntries, ...directoryEntries };
  const sortedDates = Object.keys(allEntries).sort();

  // 2. Build markdown content
  let markdown = '';
  for (const date of sortedDates) {
    markdown += `# ${date}\n\n`;
    markdown += allEntries[date] + '\n\n';
    markdown += '---\n\n';
  }

  // 3. Create and download file
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `journal-export-${formatDate(new Date())}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
```

#### Import Implementation

```javascript
async function importFromFile(file) {
  // 1. Read file content
  const content = await file.text();

  // 2. Parse based on format
  const entries = parseJournalFile(content, file.type);

  // 3. Merge with existing entries
  for (const [date, text] of Object.entries(entries)) {
    journalEntries[date] = text;
  }

  // 4. Save to localStorage
  localStorage.setItem(
    'journey.journalEntries',
    JSON.stringify(journalEntries)
  );

  // 5. Update UI
  renderActivityCalendar();
}

function parseJournalFile(content, fileType) {
  const entries = {};

  if (fileType.includes('markdown')) {
    // Parse markdown with # YYYY-MM-DD headers
    const headerRegex = /^#+\s*(\d{4}-\d{2}-\d{2})/gm;
    /* ... parsing logic ... */
  } else {
    // Parse plain text with YYYY-MM-DD lines
    const dateRegex = /^(\d{4}[-\/]\d{2}[-\/]\d{2})/gm;
    /* ... parsing logic ... */
  }

  return entries;
}
```

### 4. Directory Auto-Load

Uses the File System Access API (Chrome/Edge only):

```javascript
async function selectDirectory() {
  try {
    // 1. Request directory access
    currentDirectoryHandle = await window.showDirectoryPicker({
      mode: 'read'
    });

    // 2. Store handle reference
    // Note: Can't store handle in localStorage (not serializable)
    // User must re-select on page reload

    // 3. Scan directory
    await scanDirectory();

  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('Directory selection failed:', err);
    }
  }
}

async function scanDirectory() {
  const files = [];

  // 1. Recursively scan directory
  for await (const entry of currentDirectoryHandle.values()) {
    if (entry.kind === 'file') {
      const file = await entry.getFile();
      if (isValidJournalFile(file)) {
        files.push({ handle: entry, file });
      }
    } else if (entry.kind === 'directory') {
      // Recursively scan subdirectories
      await scanSubdirectory(entry, files);
    }
  }

  // 2. Display file list
  displayFileList(files);
}

async function loadSelectedFiles(selectedHandles) {
  for (const handle of selectedHandles) {
    const file = await handle.getFile();
    const content = await file.text();
    const entries = parseJournalFile(content, file.type);

    // Store in directoryEntries (separate from manual entries)
    Object.assign(directoryEntries, entries);
  }

  // Save to localStorage
  localStorage.setItem(
    'journey.directoryEntries',
    JSON.stringify(directoryEntries)
  );

  // Update UI
  renderActivityCalendar();
}
```

## Performance Considerations

### localStorage Limits

- Most browsers: **5-10 MB** per origin
- Journey stores plain text, so this allows:
  - ~5,000 entries at 1KB each
  - ~10,000 entries at 500 bytes each

### Optimization Strategies

1. **Debounced search** - Prevents excessive similarity searches
2. **Efficient rendering** - Only update changed calendar cells
3. **Lazy loading** - Load directory files on demand
4. **Minimal DOM manipulation** - Batch updates where possible

### Scaling Considerations

For users with large journals:

1. **Pagination** - Only render visible calendar sections
2. **Virtual scrolling** - For very long entry lists
3. **IndexedDB migration** - For larger storage needs
4. **Web Workers** - For background similarity search

## Browser Compatibility

### Feature Detection

```javascript
// Check for File System Access API
if ('showDirectoryPicker' in window) {
  enableDirectoryFeature();
} else {
  showDirectoryNotSupported();
}

// Check for localStorage
if (typeof Storage !== 'undefined') {
  enablePersistence();
} else {
  showStorageNotSupported();
}
```

### Polyfills

Journey doesn't use polyfills to maintain zero dependencies. Features gracefully degrade:

- **No File System API**: Directory selection hidden
- **No localStorage**: Session-only mode
- **Older browsers**: Basic functionality still works

## Security Considerations

### XSS Prevention

User content is displayed safely:

```javascript
// Use textContent instead of innerHTML
element.textContent = userContent;

// Or sanitize if HTML is needed
element.innerHTML = DOMPurify.sanitize(userContent);
```

### Data Privacy

- No external API calls
- No analytics or tracking
- All data stays in browser
- User controls data export/import

### localStorage Security

- Not encrypted (plaintext storage)
- Accessible to any script on same origin
- Users should use browser security features (profiles, sync encryption)

## Future Enhancements

### Planned Features

1. **Encryption** - Optional local encryption
2. **Cloud sync** - Optional backup to user's cloud storage
3. **Tags/Categories** - Organize entries
4. **Search** - Full-text search across entries
5. **Rich text** - Formatting toolbar
6. **Themes** - Dark mode and custom themes

### Technical Debt

None currently - codebase is simple and maintainable.

### Contributing

The vanilla JavaScript approach makes contributions easy:

1. **No build setup** - Just edit and reload
2. **Clear code structure** - Functions are self-contained
3. **Easy testing** - Open in browser and test
4. **No dependencies** - No version conflicts

See [Development Guide](development.md) for contribution guidelines.
