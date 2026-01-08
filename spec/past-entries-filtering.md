# Past Entries Filtering Specification

## Overview

This specification defines the requirements for the time-based filtering feature, which allows users to view journal entries from specific past time periods relative to the currently selected date.

## Requirements

### Filter Options

The system MUST provide the following filter options:
- **Yesterday**: Display the entry from exactly one day before the selected date
- **Last Week**: Display the entry from exactly seven days before the selected date
- **Last Month**: Display the entry from the same day one month before the selected date
- **Last Year**: Display the entry from the same day one year before the selected date

### Filter Behavior

- The system MUST display only the entry matching the selected filter criteria
- The system MUST NOT display multiple entries for a filter (single entry only)
- The system MUST calculate the target date relative to the currently selected date
- The system MUST handle month/year boundaries correctly (e.g., Jan 1 - 1 month = Dec 1 of previous year)
- The system MUST handle leap years correctly
- The system MUST display a "No entries found" message when no entry exists for the target date
- The system MUST default to the "Yesterday" filter on application load

### Filter Selection

- The system MUST provide a button for each filter option
- The system MUST visually indicate the active filter
- The system MUST allow switching between filters
- The system MUST update the displayed entry when the filter changes
- The system MUST update the displayed entry when the selected date changes
- The system MUST maintain the selected filter when changing dates

### Date Calculation

The system MUST calculate target dates as follows:

**Yesterday:**
```javascript
targetDate = selectedDate - 1 day
```

**Last Week:**
```javascript
targetDate = selectedDate - 7 days
```

**Last Month:**
```javascript
targetDate = selectedDate - 1 month
// Preserves day of month: Jan 15 → Dec 15
```

**Last Year:**
```javascript
targetDate = selectedDate - 1 year
// Preserves month and day: 2024-02-29 → 2023-02-28 (handles leap years)
```

### Edge Cases

- The system MUST handle month boundaries (e.g., March 1 - 1 month = February 1)
- The system MUST handle year boundaries (e.g., January 1, 2024 - 1 month = December 1, 2023)
- The system MUST handle leap days (e.g., February 29, 2024 - 1 year = February 28, 2023)
- The system MUST handle varying month lengths (e.g., March 31 - 1 month = February 28/29)
- The system MUST use local time for all calculations (no timezone shifts)

### Entry Display

- The system MUST display the formatted date for the filtered entry
- The system MUST display the full entry content
- The system MUST format dates in a user-friendly format (e.g., "Fri, Sep 20, 2024")
- The system MUST use the user's locale for date formatting
- The system MUST truncate or format long content if needed

### Empty State

- The system MUST display a message when no entry exists for the filtered date
- The system MUST provide a clear message: "No entries found for this time period."
- The system MUST NOT display the empty state for entries with empty content (treat as no entry)

## User Interface Requirements

### Filter Buttons

- Filter buttons MUST be clearly labeled
- Filter buttons MUST be grouped together visually
- Filter buttons MUST have a hover state
- Filter buttons MUST have an active state (visually distinct)
- Filter buttons MUST be keyboard accessible
- Filter buttons MUST support screen reader announcements

### Layout

- Filter controls MUST be positioned near the past entries display
- Filter controls MUST be visually distinct from entry controls
- Filter controls MAY be positioned above the past entries container
- The active filter MUST be clearly visible

### Past Entries Container

- The system MUST provide a dedicated container for filtered entries
- The container MUST display at most one entry
- The container MUST display the entry date prominently
- The container MUST display the entry content below the date
- The container MUST be scrollable if content is long

### Responsive Design

- Filter buttons MUST wrap appropriately on small screens
- Filter buttons MUST remain touch-friendly on mobile (minimum 44x44 pixels)
- The container MUST be readable on mobile devices

## Accessibility Requirements

- Filter buttons MUST have appropriate ARIA attributes (aria-pressed)
- The active filter MUST be announced to screen readers
- The empty state message MUST be readable by screen readers
- Filter buttons MUST be keyboard navigable
- The system MUST support keyboard shortcuts for filters (optional)

## Performance Requirements

- The system MUST update the filtered entry within 50ms of filter selection
- The system MUST cache date calculations to avoid redundant computation
- The system MUST not re-render the entire view when only the filter changes

## Localization Requirements

- Filter button labels MUST be translatable
- Date formats MUST respect the user's locale
- The empty state message MUST be translatable

## Data Requirements

- The system MUST read from the currently active tab's entries
- The system MUST filter entries based on date keys
- The system MUST NOT modify entries when filtering
- The system MUST handle missing date keys gracefully

## Integration with Other Features

- Changing the selected date MUST update the filtered entry
- Switching tabs MUST update the filtered entry
- Creating a new entry for the filtered date MUST update the display
- The calendar click MUST update the selected date and filtered entry
