# Directory Loading Specification

## Overview

This specification defines the requirements for the directory loading feature, which allows users to select a local directory, scan it for journal files, and load multiple files as tabs in the application. This feature enables users to work with existing journal collections stored as files.

## Requirements

### Directory Selection

- The system MUST use the File System Access API (`showDirectoryPicker`)
- The system MUST check for browser compatibility before attempting directory selection
- The system MUST display an error message if the API is not supported
- The system MUST allow the user to cancel directory selection
- The system MUST store the directory handle for subsequent operations
- The system MUST display the selected directory name
- The system MAY remember the directory selection across browser sessions

### File Scanning

- The system MUST automatically scan the directory after selection
- The system MUST recursively scan subdirectories
- The system MUST filter files by extension
- The system MUST support filtering by `.md` (Markdown) files
- The system MUST support filtering by `.txt` (text) files
- The system MUST support filtering by `.json` files
- The system MUST allow users to toggle file type filters
- The system MUST default to including `.md` and `.txt` files
- The system MUST display the count of found files
- The system MUST preserve relative paths from the selected directory

### File List Display

- The system MUST display a list of found files
- The system MUST show the filename for each file
- The system MUST show the relative path for each file
- The system MUST show the file size for each file in human-readable format
- The system MUST provide a checkbox for each file
- The system MUST default all checkboxes to checked
- The system MUST allow users to select/deselect individual files
- The system MUST provide "Select All" and "Select None" buttons
- The system MUST support filtering the file list by text search
- The system MUST update the visible count when filtering

### File Loading

- The system MUST load selected files when the user clicks the update button
- The system MUST parse each file's content into entries
- The system MUST create a new tab for each loaded file
- The system MUST use the filename as the tab name
- The system MUST store file handles for future write operations
- The system MUST track which files are currently loaded
- The system MUST support unloading files by deselecting them
- The system MUST update tabs when files are loaded or unloaded
- The system MUST adjust the active tab if the current tab is closed
- The system MAY preserve tab order when loading new files

### File Persistence

- The system MUST remember which files were selected for each directory
- The system MUST store selected file paths in localStorage
- The system MUST use a unique key per directory: `journey.selectedFiles_{directoryName}`
- The system MUST automatically load previously selected files when re-opening a directory
- The system MUST handle missing files gracefully
- The system MUST report how many previously selected files were missing
- The system MUST allow clearing the directory selection

### Directory Persistence

- The system MUST remember directory settings across sessions
- The system MUST store settings in localStorage with key `journey.directorySettings`
- The system MUST remember file type filter preferences
- The system MUST restore filter preferences on application load
- The system MUST allow clearing directory settings

### Tab Management

- The system MUST display tabs for all loaded files
- The system MUST display the default "My Journal" tab as the first tab
- The system MUST allow switching between tabs
- The system MUST highlight the active tab
- The system MUST allow closing file tabs (but not the default tab)
- The system MUST provide a close button (×) on file tabs
- The system MUST remove the file from memory when closing a tab
- The system MUST adjust the active tab when closing the current tab
- The system MUST support mobile-friendly tab display with toggle

### File Writing

- The system MUST write changes back to the original file when possible
- The system MUST use the stored file handle for writing
- The system MUST regenerate the file content from entries when saving
- The system MUST format the content in Markdown format
- The system MUST use the format `# YYYY-MM-DD` for date headers
- The system MUST handle write errors gracefully
- The system MUST display an error message if writing fails
- The system MAY cache changes locally if writing fails

## User Interface Requirements

### Directory Selection UI

- The system MUST provide a "Select Directory" button
- The system MUST display the selected directory path when selected
- The system MUST provide a "Clear Directory" button
- The clear button MUST be disabled when no directory is selected

### File Filter UI

- The system MUST provide checkboxes for file type filters:
  - Markdown (.md)
  - Text (.txt)
  - JSON (.json)
- The system MUST remember filter preferences
- The filters MUST be visible before directory selection

### File List UI

- The system MUST display the file list in a scrollable container
- The system MUST show the file count at the top
- The system MUST provide a text input for filtering files
- The system MUST provide "Select All" and "Select None" buttons
- The system MUST provide an "Update Files" button
- The update button MUST be disabled when no changes are pending

### Tab UI

- Tabs MUST be displayed at the top of the interface
- Tabs MUST show the filename or "My Journal"
- The active tab MUST be visually distinct
- File tabs MUST have a close button (×)
- The default tab MUST NOT have a close button
- Tabs MUST be keyboard accessible
- Tabs MUST support horizontal scrolling on mobile
- A mobile toggle button MUST be displayed on small screens

## Browser Compatibility

- The system MUST work in Chrome 86+
- The system MUST work in Edge 86+
- The system MUST gracefully degrade in unsupported browsers
- The system MUST display a clear error message in unsupported browsers
- The system MUST NOT crash if the File System Access API is unavailable

## Performance Requirements

- The system MUST scan directories within 2 seconds for up to 1000 files
- The system MUST load files within 1 second for up to 100 files
- The system MUST not block the UI during directory scanning
- The system MUST debounce file list filtering (150ms)
- The system MAY limit the number of files displayed

## Error Handling

### Directory Selection Errors

- User cancelled: Silent (no error message)
- API not supported: Clear error message
- Permission denied: Clear error message
- Invalid directory: Clear error message

### File Scanning Errors

- Directory not found: Error message
- Permission denied for subdirectory: Warning, continue with accessible files
- Individual file read error: Warning, skip file

### File Loading Errors

- Invalid file format: Warning, skip file
- Corrupted content: Warning, skip file
- Out of memory: Error message

### File Writing Errors

- Handle lost: Error message, keep changes in memory
- Permission denied: Error message
- Disk full: Error message
- File locked: Error message

## Security Requirements

- The system MUST only access files in the selected directory
- The system MUST not access files outside the directory tree
- The system MUST respect browser permission prompts
- The system MUST not access files without user consent
- The system MUST not cache file contents beyond the session (except in localStorage)

## Accessibility Requirements

- All buttons MUST be keyboard accessible
- File checkboxes MUST be keyboard accessible
- Tabs MUST be keyboard navigable
- Error messages MUST be announced to screen readers
- The file list MUST be properly labeled for assistive technology
- The mobile tab toggle MUST be keyboard accessible

## Localization Requirements

- File sizes MUST be displayed in the user's locale format
- Dates MUST be formatted according to the user's locale
- Error messages MUST be translatable
