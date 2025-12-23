# Supported Formats

Journey supports importing and exporting journal entries in multiple formats. This guide explains the supported formats and how to work with them.

## Import Formats

### Markdown (.md)

Markdown is the recommended format for journal files.

#### With Date Headers

```markdown
# 2024-01-15

Today I learned about web components. They're really powerful...

Some more thoughts on the topic.

# 2024-01-16

Another day, another entry. I built a simple application using...
```

**Format Details:**

- Date headers use `# YYYY-MM-DD` format
- Content below the header belongs to that date
- Multiple paragraphs are preserved
- Everything until the next date header is part of the entry

#### Alternative Header Levels

```markdown
## 2024-01-15

You can also use level 2 headers...

### 2024-01-16

Or level 3 headers...
```

Journey detects date headers at any level (h1-h6).

### Plain Text (.txt)

Plain text files are fully supported with flexible date formats.

#### Standard Date Format

```
2024-01-15

Today's entry content...

2024-01-16

Next day's content...
```

#### Compact Format (No Separators)

```
20240115
Today's entry...

20240116
Next entry...
```

#### Slash Format

```
2024/01/15
Entry content...

2024/01/16
More content...
```

**Format Rules:**

- Date line must be on its own line
- Content follows the date
- Blank lines are preserved
- Content continues until next date line

### JSON (.json)

For programmatic import/export, JSON format is supported.

```json
{
  "entries": [
    {
      "date": "2024-01-15",
      "content": "Today I learned about web components..."
    },
    {
      "date": "2024-01-16",
      "content": "Another productive day..."
    }
  ]
}
```

**JSON Structure:**

- Top-level `entries` array
- Each entry has `date` and `content` fields
- Date must be in `YYYY-MM-DD` format
- Content is a string (can include `\n` for line breaks)

### Mixed Format Files

Journey can handle files with mixed formatting:

```markdown
# 2024-01-15

This entry uses a markdown header.

2024/01/16

This one uses a plain date line.

## 2024-01-17

Back to markdown headers.
```

All entries will be correctly parsed regardless of format mixing.

## Export Format

### Markdown Export

When you export your journal, Journey generates a Markdown file with:

```markdown
# 2024-01-15

First entry content goes here...

---

# 2024-01-16

Second entry content...

---

# 2024-01-17

Third entry...
```

**Export Details:**

- Level 1 headers (`#`) for dates
- Horizontal rules (`---`) separate entries
- Chronological order (oldest to newest)
- Filename: `journal-export-YYYY-MM-DD.md`
- UTF-8 encoding
- Unix-style line endings (`\n`)

### Re-importing Exports

Exported files can be directly re-imported:

1. Export your journal
2. Import the exported file
3. All entries are preserved

This makes exports perfect for:
- Backups
- Migration between devices
- Sharing with other markdown tools

## Date Parsing

### Supported Date Formats

Journey's date parser recognizes:

| Format | Example | Description |
|--------|---------|-------------|
| `YYYY-MM-DD` | `2024-01-15` | ISO 8601 standard |
| `YYYYMMDD` | `20240115` | Compact format |
| `YYYY/MM/DD` | `2024/01/15` | Slash separator |
| `YYYY.MM.DD` | `2024.01.15` | Dot separator |
| `YYYY-M-D` | `2024-1-15` | No leading zeros |

### Date Detection Rules

Journey uses smart date detection:

1. **Line-based**: Date must be on its own line
2. **Position**: Usually at start of line (whitespace ignored)
3. **Context**: Must be followed by content
4. **Validation**: Checks for valid month (1-12) and day (1-31)

### Invalid Dates

If a date can't be parsed:
- The line is treated as content
- A warning may appear in the console
- The entry is skipped

## File Encoding

### Supported Encodings

- **UTF-8** (recommended)
- **ASCII**
- **ISO-8859-1** (Latin-1)

### Special Characters

Journey fully supports:
- Unicode characters (emojis, symbols)
- Accented characters (é, ñ, ü, etc.)
- Non-Latin scripts (Chinese, Arabic, Cyrillic, etc.)

Example:

```markdown
# 2024-01-15

今天很好 🎉
Aujourd'hui était génial!
```

## File Structure Guidelines

### Single Entry Files

One file per entry:

```
my-journals/
├── 2024-01-15.md
├── 2024-01-16.md
└── 2024-01-17.md
```

**Advantages:**
- Easy to organize
- Simple to add new entries
- Clear file structure

### Multiple Entries Files

Multiple entries in one file:

```markdown
# 2024-01-15
Entry 1...

# 2024-01-16
Entry 2...

# 2024-01-17
Entry 3...
```

**Advantages:**
- Fewer files
- Easier to share
- Better for migration

### Nested Directories

Organize by year/month:

```
my-journals/
├── 2024/
│   ├── 01-january/
│   │   ├── 2024-01-15.md
│   │   └── 2024-01-16.md
│   └── 02-february/
│       └── 2024-02-01.md
└── 2023/
    └── 12-december/
        └── 2023-12-31.md
```

Journey's directory auto-load handles any structure.

## Best Practices

### For Import

1. **Use consistent date formats** - Pick one format and stick with it
2. **One entry per date** - Avoid duplicate dates
3. **UTF-8 encoding** - Ensures special characters work
4. **Clear separation** - Use blank lines between entries

### For Export

1. **Regular exports** - Weekly or monthly backups
2. **Version control** - Consider using Git for history
3. **Multiple locations** - Store exports in different places
4. **Test imports** - Verify exports can be re-imported

### File Naming

Recommended naming conventions:

```
journal-2024-01-15.md          # Daily files
journal-2024-01.md             # Monthly compilations
journal-2024.md                # Yearly compilations
journal-export-2024-01-15.md   # Export snapshots
```

## Format Examples

### Day One Export

If migrating from Day One:

```markdown
# 2024-01-15 09:30 AM

Today was great...

Weather: Sunny
Location: Home
```

Journey will import the entry using the date from the header.

### Bear Notes

From Bear notes app:

```markdown
# Daily Note - 2024-01-15

Content here...
#journal #personal
```

Extract the date from the header. Tags can be left as-is or removed.

### Obsidian Daily Notes

From Obsidian:

```markdown
---
date: 2024-01-15
tags: [journal, daily]
---

# Daily Note

Content here...
```

Remove frontmatter or convert date to header:

```markdown
# 2024-01-15

Content here...
```

### Standard Notes

From Standard Notes:

```
2024-01-15

Content here...

---

2024-01-16

More content...
```

This format works directly with Journey.

## Troubleshooting

### Import Issues

**Problem**: Entries not importing

**Solutions**:
- Check date format matches supported formats
- Verify file encoding is UTF-8
- Ensure dates are on separate lines
- Look for console errors

**Problem**: Wrong dates detected

**Solutions**:
- Make sure dates follow YYYY-MM-DD pattern
- Check for numbers that look like dates but aren't
- Use markdown headers to be explicit

**Problem**: Special characters broken

**Solutions**:
- Re-save file as UTF-8
- Avoid using non-UTF-8 editors
- Check for BOM (byte order mark) issues

### Export Issues

**Problem**: Export file won't download

**Solutions**:
- Check browser download settings
- Disable download blocking extensions
- Try a different browser
- Check console for errors

**Problem**: Exported file won't re-import

**Solutions**:
- This shouldn't happen - file a bug report
- Check if file was modified after export
- Verify file encoding

## Future Format Support

Planned support for:
- YAML frontmatter
- Custom date format configuration
- CSV import/export
- HTML export with styling

Suggest formats by opening an issue on GitHub.
