# Activity Calendar Specification

## Overview

This specification defines the requirements for the activity calendar feature, which provides a GitHub-style contribution graph showing journaling activity over time. The calendar displays entry density and allows users to navigate to specific dates.

## Requirements

### Calendar Display

- The system MUST display a calendar grid for the selected year
- The system MUST organize the grid with Sunday as the first day of the week
- The system MUST display all days from the first Sunday of the year to cover the entire year
- The system MUST indicate days with entries using color intensity
- The system MUST display month labels at appropriate intervals
- The system MUST support year navigation via year tabs
- The system MUST default to displaying the current year

### Activity Levels

- The system MUST calculate activity levels based on word count
- The system MUST support 5 activity levels (0-4):
  - Level 0: No entry (no color)
  - Level 1: 1-19 words
  - Level 2: 20-49 words
  - Level 3: 50-99 words
  - Level 4: 100+ words
- The system MUST map activity levels to visual intensity (light to dark)
- The system MUST distinguish between "no entry" and "low activity" visually

### Year Navigation

- The system MUST display tabs for all years that have entries
- The system MUST include the current year in the year tabs even if empty
- The system MUST sort year tabs in descending order (most recent first)
- The system MUST visually indicate the currently selected year
- The system MUST visually indicate the current year
- The system MUST switch the calendar display when a year tab is clicked
- The system MUST regenerate the calendar when switching years

### Month Labels

- The system MUST display month abbreviations (Jan, Feb, Mar, etc.)
- The system MUST position month labels above the appropriate weeks
- The system MUST display a new month label when the week crosses month boundaries
- The system MUST align month labels with the first week of each month

### Tooltips

- The system MUST display a tooltip on hover for days with entries
- The tooltip MUST show the formatted date
- The tooltip MUST show a preview of the entry content (maximum 100 characters)
- The tooltip MUST be positioned above the calendar cell
- The tooltip MUST be centered horizontally on the calendar cell
- The system MUST remove the tooltip when the mouse leaves the cell
- The tooltip MAY include word count or other metadata

### Date Navigation

- The system MUST allow clicking on any calendar day to navigate to that date
- The system MUST update the date picker to the clicked date
- The system MUST load the entry for the clicked date
- The system MUST highlight the currently selected date in the calendar
- The system MAY provide a visual indicator for the current date

## Data Model

### Activity Level Calculation

```typescript
function getActivityLevel(wordCount: number): number {
  if (wordCount >= 100) return 4;
  if (wordCount >= 50) return 3;
  if (wordCount >= 20) return 2;
  if (wordCount >= 1) return 1;
  return 0;
}
```

### Date Handling

- The system MUST parse dates in local time to avoid timezone shifts
- The system MUST generate calendar days using local time arithmetic
- The system MUST handle leap years correctly
- The system MUST handle varying month lengths correctly

## User Interface Requirements

### Calendar Grid

- The grid MUST use CSS Grid or equivalent for layout
- The grid MUST have 7 columns (one for each day of the week)
- The grid MUST expand to fit all weeks of the year (approximately 53 rows)
- Each cell MUST be a fixed size (approximately 12x12 pixels)
- Cells MUST have spacing between them (approximately 2-4 pixels)

### Activity Colors

The system MUST use a color scheme that indicates activity intensity:
- Level 0: Transparent or no background color
- Level 1: Light color (e.g., #c6e48b for green theme)
- Level 2: Medium-light color (e.g., #7bc96f for green theme)
- Level 3: Medium-dark color (e.g., #239a3b for green theme)
- Level 4: Dark color (e.g., #196127 for green theme)

The system MAY support different color themes.

### Year Tabs

- Year tabs MUST be clearly visible above the calendar
- Year tabs MUST have a hover state
- The active year tab MUST be visually distinct
- The current year MUST have additional visual emphasis
- Year tabs MUST be clickable and keyboard accessible

### Tooltip Styling

- Tooltips MUST have a solid background
- Tooltips MUST have sufficient contrast for readability
- Tooltips MUST have a pointer or arrow indicating the associated cell
- Tooltips MUST appear with a smooth transition (respecting `prefers-reduced-motion`)

## Responsive Design

- The system MUST display the calendar horizontally on desktop
- The system MAY adjust cell size on smaller screens
- The system MAY scroll horizontally on very small screens
- The system MUST maintain calendar functionality on mobile devices

## Accessibility Requirements

- Calendar cells MUST be keyboard navigable
- Calendar cells MUST have appropriate ARIA labels
- Tooltip content MUST be accessible to screen readers
- The system MUST announce the selected date when navigating with keyboard
- Activity levels MUST be distinguishable by color AND pattern (for colorblind users)
- The system MUST respect the user's `prefers-reduced-motion` setting
- The system MUST support keyboard shortcuts for date navigation

## Performance Requirements

- The system MUST render the calendar within 100ms
- The system MUST cache activity levels to avoid recalculation
- The system MUST use efficient DOM manipulation (document fragments, batch updates)
- The system MUST not re-render the entire calendar when only the selected date changes

## Localization Requirements

- The system MUST use localized month names based on user locale
- The system MUST use localized date formats in tooltips
- The system MUST respect the user's first day of week preference if available
- The system MAY support different calendar systems (Gregorian, etc.)

## Error Handling

- The system MUST handle missing or corrupted entry data gracefully
- The system MUST display an empty calendar for years with no data
- The system MUST handle invalid date strings without crashing
