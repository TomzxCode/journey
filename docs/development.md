# Development

This guide is for developers who want to contribute to Journey or customize it for their own use.

## Getting Started

### Prerequisites

- Git
- A modern web browser
- A text editor or IDE
- Basic knowledge of HTML, CSS, and JavaScript

### Setup Development Environment

1. **Clone the repository**:
   ```bash
   git clone https://github.com/tomzxcode/journey.git
   cd journey
   ```

2. **Open the project** in your editor:
   ```bash
   # VSCode
   code .

   # Or any other editor
   ```

3. **Open in browser**:
   - Simply open `index.html` in your browser
   - No build step required!

### Project Structure

```
journey/
├── index.html          # Main HTML structure
├── styles.css          # All styling
├── script.js           # All JavaScript
├── README.md           # Project README
├── docs/               # Documentation (MkDocs)
│   ├── index.md
│   ├── getting-started.md
│   ├── formats.md
│   ├── architecture.md
│   └── development.md
├── mkdocs.yml          # Documentation config
└── test-files/         # Sample files for testing
    ├── 2024-09-20.md
    ├── 2024-09-21.txt
    └── subdirectory/
        └── 2024-09-22.md
```

## Development Workflow

### Making Changes

1. **Edit files** directly:
   - HTML: [index.html](../index.html)
   - CSS: [styles.css](../styles.css)
   - JavaScript: [script.js](../script.js)

2. **Refresh browser** to see changes:
   - Press F5 or Cmd+R
   - No build step needed!

3. **Test locally**:
   - Try all features
   - Check browser console for errors
   - Test on different browsers if possible

### Browser DevTools

Essential tools for development:

#### Console (F12)

- View errors and warnings
- Test code snippets
- Debug JavaScript

```javascript
// Inspect localStorage
console.log(localStorage.getItem('journey.journalEntries'));

// Test functions
console.log(formatDate(new Date()));
```

#### Application Tab (Chrome/Edge)

- View localStorage data
- Clear storage for testing
- Inspect file system access

#### Elements Tab

- Inspect HTML structure
- Test CSS changes live
- Debug layout issues

#### Network Tab

- Monitor file loads
- Check for errors
- Verify no external requests (privacy)

## Code Style

### JavaScript

Follow these conventions:

```javascript
// Use camelCase for variables and functions
let journalEntries = {};
function saveEntry() { }

// Use UPPER_CASE for constants
const DEBOUNCE_DELAY = 500;
const STORAGE_KEY_ENTRIES = 'journey.journalEntries';

// Use descriptive names
function calculateActivityLevel(entry) {
  // Implementation
}

// Add comments for complex logic
// Extract keywords for similarity matching
// Filters out common words and short words
function extractKeywords(text) {
  // Implementation
}

// Use ES6+ features
const entries = { ...journalEntries, ...directoryEntries };
const sortedDates = Object.keys(entries).sort();
const matches = entries.filter(e => e.score > threshold);
```

### CSS

Follow these conventions:

```css
/* Use kebab-case for class names */
.calendar-cell { }
.activity-level-2 { }

/* Group related properties */
.button {
  /* Layout */
  display: inline-block;
  padding: 10px 20px;

  /* Visual */
  background: var(--primary-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;

  /* Typography */
  font-size: 14px;
  font-weight: 500;

  /* Interaction */
  cursor: pointer;
  transition: background 0.2s;
}

/* Use CSS custom properties */
:root {
  --primary-color: #007bff;
  --success-color: #28a745;
}
```

### HTML

Follow these conventions:

```html
<!-- Use semantic elements -->
<header>
  <h1>Journey</h1>
</header>

<main>
  <section class="entry-form">
    <!-- Content -->
  </section>
</main>

<footer>
  <!-- Footer content -->
</footer>

<!-- Use descriptive IDs and classes -->
<div id="activity-calendar" class="calendar-container">
  <div class="calendar-grid">
    <!-- Calendar cells -->
  </div>
</div>

<!-- Keep attributes organized -->
<button
  id="save-button"
  class="button button-primary"
  aria-label="Save journal entry">
  Save Entry
</button>
```

## Testing

### Manual Testing Checklist

Test these features before submitting changes:

#### Core Features
- [ ] Write and save an entry
- [ ] Edit existing entry
- [ ] Clear text area
- [ ] View past entries

#### Activity Calendar
- [ ] Calendar renders correctly
- [ ] Correct colors for activity levels
- [ ] Click on date shows entry
- [ ] Hover shows preview
- [ ] Year navigation works

#### Similar Entries
- [ ] Similar entries appear while typing
- [ ] Debouncing works (no lag)
- [ ] Relevant entries shown
- [ ] Click on entry shows it

#### Time Filters
- [ ] Yesterday filter works
- [ ] Last Week filter works
- [ ] Last Month filter works
- [ ] Last Year filter works

#### Import/Export
- [ ] Export downloads file
- [ ] Export contains all entries
- [ ] Import from markdown works
- [ ] Import from text works
- [ ] Import from JSON works

#### Directory Features (Chrome/Edge only)
- [ ] Directory selection works
- [ ] File scanning works
- [ ] File list displays correctly
- [ ] Loading selected files works
- [ ] Auto-scan setting persists

### Browser Testing

Test on multiple browsers:

- [ ] Chrome/Chromium (latest)
- [ ] Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest, if available)

### Mobile Testing

Test responsive design:

- [ ] Open in mobile browser or DevTools mobile view
- [ ] All features accessible
- [ ] Layout adapts correctly
- [ ] Touch interactions work

### Test Data

Use the provided test files:

```bash
# Load test-files/ directory in Journey
# Contains sample entries for testing
test-files/
├── 2024-09-20.md       # Markdown format
├── 2024-09-21.txt      # Plain text format
└── subdirectory/
    └── 2024-09-22.md   # Nested directory
```

Or create test data:

```javascript
// Run in browser console to add test entries
const testDates = ['2024-01-01', '2024-01-02', '2024-01-03'];
testDates.forEach((date, i) => {
  journalEntries[date] = `Test entry ${i + 1}`;
});
localStorage.setItem(
  'journey.journalEntries',
  JSON.stringify(journalEntries)
);
location.reload();
```

## Common Tasks

### Adding a New Feature

1. **Plan the feature**:
   - What does it do?
   - How does it fit into the UI?
   - What data does it need?

2. **Update HTML** (if needed):
   - Add new elements
   - Add IDs/classes for JavaScript hooks

3. **Update CSS** (if needed):
   - Style new elements
   - Ensure responsive design

4. **Update JavaScript**:
   - Add new functions
   - Hook into existing functions
   - Update event listeners

5. **Test thoroughly**:
   - Use manual testing checklist
   - Test edge cases
   - Test on multiple browsers

6. **Update documentation**:
   - Update README if user-facing
   - Update docs/ if significant

### Fixing a Bug

1. **Reproduce the bug**:
   - Try to consistently trigger it
   - Note browser/OS if relevant
   - Check console for errors

2. **Identify the cause**:
   - Use browser DevTools
   - Add console.log() statements
   - Use debugger breakpoints

3. **Fix the issue**:
   - Make minimal changes
   - Don't refactor while fixing
   - Keep changes focused

4. **Verify the fix**:
   - Confirm bug is resolved
   - Test related features
   - Ensure no regressions

5. **Test edge cases**:
   - Empty data
   - Large data sets
   - Invalid input

### Refactoring Code

1. **Ensure tests pass** (or features work)
2. **Make one change at a time**
3. **Test after each change**
4. **Keep functionality identical**
5. **Improve code quality**:
   - Better names
   - Clearer logic
   - Less duplication

## Documentation

### Building Documentation

This documentation is built with MkDocs Material:

1. **Install dependencies**:
   ```bash
   uv sync --group dev
   ```

2. **Run local server**:
   ```bash
   uv run mkdocs serve
   ```

3. **View docs**:
   - Open http://localhost:8000
   - Changes auto-reload

4. **Build static site**:
   ```bash
   uv run mkdocs build
   ```

### Updating Documentation

Documentation files are in [docs/](../docs/):

- [index.md](../docs/index.md) - Home page
- [getting-started.md](../docs/getting-started.md) - Setup and usage
- [formats.md](../docs/formats.md) - Import/export formats
- [architecture.md](../docs/architecture.md) - Technical details
- [development.md](../docs/development.md) - This file

Configuration in [mkdocs.yml](../mkdocs.yml).

## Contributing

### Contribution Guidelines

1. **Open an issue** first:
   - Describe the feature or bug
   - Get feedback before coding
   - Discuss approach

2. **Fork the repository**:
   ```bash
   # On GitHub, click Fork
   git clone https://github.com/YOUR-USERNAME/journey.git
   ```

3. **Create a branch**:
   ```bash
   git checkout -b feature/my-feature
   # or
   git checkout -b fix/bug-description
   ```

4. **Make changes**:
   - Follow code style
   - Test thoroughly
   - Update documentation

5. **Commit changes**:
   ```bash
   git add .
   git commit -m "Add feature: description"
   ```

6. **Push to GitHub**:
   ```bash
   git push origin feature/my-feature
   ```

7. **Open a Pull Request**:
   - Describe changes
   - Reference related issues
   - Add screenshots if UI changes

### Commit Message Format

Use clear, descriptive commit messages:

```
Add feature: similar entry suggestions

- Implement keyword extraction
- Add debounced search
- Display top 5 matches
- Update UI to show results

Fixes #123
```

Format:
- **First line**: Brief summary (50 chars or less)
- **Blank line**
- **Body**: Detailed description
- **Footer**: Issue references

### Pull Request Checklist

- [ ] Code follows project style
- [ ] All features tested manually
- [ ] No console errors
- [ ] Documentation updated
- [ ] Commit messages are clear
- [ ] Branch is up to date with main

## Release Process

For maintainers:

1. **Test thoroughly**:
   - All browsers
   - All features
   - Mobile devices

2. **Update version**:
   - Update [pyproject.toml](../pyproject.toml) version
   - Update README if needed

3. **Update CHANGELOG** (if exists):
   - List new features
   - List bug fixes
   - List breaking changes

4. **Create Git tag**:
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```

5. **Create GitHub Release**:
   - Go to GitHub Releases
   - Create new release from tag
   - Add release notes
   - Attach files if needed

6. **Deploy documentation**:
   ```bash
   uv run mkdocs gh-deploy
   ```

## Troubleshooting

### Development Issues

**Problem**: Changes not appearing in browser

**Solution**:
- Hard refresh (Ctrl+F5 or Cmd+Shift+R)
- Clear browser cache
- Check console for errors
- Verify file saved correctly

**Problem**: localStorage not working

**Solution**:
- Not supported in file:// protocol on some browsers
- Use local server instead:
  ```bash
  python -m http.server 8000
  ```
- Or use browser extensions to enable

**Problem**: Directory picker not available

**Solution**:
- Feature only works in Chrome/Edge
- Test fallback import behavior
- Show appropriate message to users

## Resources

### Documentation

- [MDN Web Docs](https://developer.mozilla.org/) - HTML, CSS, JavaScript reference
- [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)
- [localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

### Tools

- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Firefox DevTools](https://firefox-source-docs.mozilla.org/devtools-user/)
- [Can I Use](https://caniuse.com/) - Browser compatibility checker

### Inspiration

Journey draws inspiration from:
- Day One
- Bear Notes
- Obsidian Daily Notes
- GitHub contribution calendar

## Getting Help

- **GitHub Issues**: Report bugs or request features
- **GitHub Discussions**: Ask questions or share ideas
- **Code**: Read [architecture.md](architecture.md) for technical details

## License

Journey is open source under the MIT License. Contributions are welcome and appreciated!
