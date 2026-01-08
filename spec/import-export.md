# Import/Export Specification

## Overview

This specification defines the requirements for importing and exporting journal entries. Users can export their journal to a Markdown file and import entries from Markdown or text files.

## Requirements

### Export Functionality

- The system MUST export the currently active tab's entries
- The system MUST export entries in Markdown format
- The system MUST use the format `# YYYY-MM-DD` for date headers
- The system MUST separate entries with two newlines
- The system MUST sort entries in chronological order
- The system MUST generate a filename in the format `journal-{tabname}-{date}.md`
- The system MUST sanitize tab names for use in filenames (replace special characters with underscores)
- The system MUST include the current date in the export filename
- The system MUST trigger a file download in the browser
- The system MUST use the MIME type `text/markdown` for the exported file
- The system MUST display a success message after export

### Export Format

The exported file MUST follow this format:

```markdown
# 2024-09-20

Entry content goes here.

# 2024-09-21

Another entry content.
```

### Import Functionality

- The system MUST allow importing single files via file picker
- The system MUST support Markdown (.md) files
- The system MUST support plain text (.txt) files
- The system MUST support JSON (.json) files
- The system MUST merge imported entries with the currently active tab
- The system MUST preserve existing entries when importing
- The system MUST replace entries with the same date during merge
- The system MUST display a success message after successful import
- The system MUST display an error message if import fails
- The system MUST validate file format before parsing

### Import Format Support

#### Markdown Format (Primary)

The system MUST parse Markdown files with the following format:
- Date headers: `# YYYY-MM-DD`
- Entry content follows the date header
- Multiple entries separated by date headers

Example:
```markdown
# 2024-09-20

Today was a great day.

# 2024-09-21

Another entry here.
```

#### Plain Text Format (Secondary)

The system MUST parse plain text files with date markers:
- Supported formats: `YYYYMMDD`, `YYYY-MM-DD`, `YYYY/MM/DD`
- Date markers on their own line
- Entry content follows the date marker
- Entries separated by new date markers

Example:
```
2024-09-20
Today was a great day.

2024-09-21
Another entry here.
```

#### JSON Format (Optional)

The system MAY support JSON format:
```json
{
  "2024-09-20": "Today was a great day.",
  "2024-09-21": "Another entry here."
}
```

### Date Parsing

- The system MUST normalize all date formats to `YYYY-MM-DD`
- The system MUST validate dates before adding to entries
- The system MUST reject invalid dates (e.g., `2024-13-45`)
- The system MUST handle leap year dates correctly
- The system MUST preserve the original timezone (no timezone conversion)

### Date Normalization

The system MUST convert date formats as follows:
- `YYYYMMDD` → `YYYY-MM-DD` (e.g., `20240920` → `2024-09-20`)
- `YYYY/MM/DD` → `YYYY-MM-DD` (e.g., `2024/09/20` → `2024-09-20`)
- `YYYY-MM-DD` → `YYYY-MM-DD` (already normalized)

## User Interface Requirements

### Export Button

- The system MUST provide an "Export as Markdown" button
- The button MUST be visible in the main interface
- The button MUST have a clear label
- The button MAY include an icon

### Import Button

- The system MUST provide an "Import Journal" button
- The button MUST be visible in the main interface
- The button MUST have a clear label
- The button MAY include an icon
- Clicking the button MUST trigger a hidden file input

### File Input

- The system MUST use a hidden `<input type="file">` element
- The input MUST accept `.md`, `.txt`, and `.json` files
- The input MUST allow selecting only one file at a time

### Feedback Messages

- Success messages MUST be displayed for 3 seconds
- Error messages MUST be displayed for 3 seconds
- Messages MUST be clearly visible (fixed position, top or right)
- Messages MUST have appropriate styling (green for success, red for error)
- Messages MUST fade out smoothly (respecting `prefers-reduced-motion`)

## Error Handling

### Import Errors

The system MUST handle and report:
- Invalid file format (not matching any supported format)
- Corrupted file content
- Files with no valid entries
- Invalid dates in the file
- JSON parse errors (for JSON files)

The system SHOULD:
- Continue processing after encountering invalid entries
- Report the number of successfully imported entries
- Provide guidance on fixing common format issues

### Export Errors

The system MUST handle:
- Large file sizes (may cause browser hangs)
- Special characters in entry content
- Empty journal (no entries to export)

## Performance Requirements

- The system MUST export up to 10,000 entries within 1 second
- The system MUST import up to 10,000 entries within 2 seconds
- The system MUST not block the UI during import/export
- The system MAY show a progress indicator for large operations

## Security Requirements

- The system MUST sanitize entry content before export to prevent XSS
- The system MUST validate file content before parsing
- The system MUST not execute any code from imported files
- The system MUST escape HTML special characters in entries

## Accessibility Requirements

- Export and import buttons MUST be keyboard accessible
- File input MUST be keyboard accessible
- Success/error messages MUST be announced to screen readers
- The system MUST provide clear feedback for non-visual users

## Privacy Requirements

- All import/export operations MUST be performed locally in the browser
- No data MUST be sent to external servers
- The system MUST not track what users export or import
