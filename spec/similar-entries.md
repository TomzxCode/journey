# Similar Entries Specification

## Overview

This specification defines the requirements for the similar entries feature, which helps users discover related past journal entries while writing. The feature analyzes the current entry being written and finds historically similar entries based on keyword matching and content similarity.

## Requirements

### Similarity Detection

- The system MUST analyze entry content as the user types
- The system MUST use keyword extraction to identify meaningful terms
- The system MUST exclude common stop words from similarity calculations (e.g., "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", etc.)
- The system MUST calculate similarity using the Jaccard index (intersection over union of keyword sets)
- The system MUST boost scores for exact substring matches
- The system MUST NOT compare an entry against itself (same date)
- The system MUST require a minimum of 3 characters before searching for similar entries
- The system SHOULD normalize text to lowercase before comparison

### Debouncing

- The system MUST debounce the search to avoid excessive calculations
- The system MUST wait at least 150ms after the last keystroke before searching
- The system MUST cancel any pending search when the user continues typing
- The system MAY adjust the debounce timeout based on performance

### Result Display

- The system MUST display up to 5 similar entries
- The system MUST sort results by similarity score in descending order
- The system MUST display the date of each similar entry
- The system MUST display a preview of the entry content (maximum 150 characters)
- The system MUST truncate long content with an ellipsis (...)
- The system MUST clear similar entries when the user clears the text area
- The system MAY display similarity scores to the user
- The system MAY highlight matching keywords in the preview

### Date Formatting

- The system MUST format dates in a user-friendly format (e.g., "Fri, Sep 20, 2024")
- The system MUST use the user's locale for date formatting
- The system MUST avoid timezone shifts when formatting dates

### Interaction

- The system MAY allow clicking on similar entries to navigate to that date
- The system MUST NOT interrupt the user's typing flow
- The system MUST update results dynamically as content changes

## Algorithm Specification

### Keyword Extraction

1. Convert text to lowercase
2. Remove all punctuation and special characters (replace with spaces)
3. Split text into words on whitespace
4. Filter out stop words
5. Filter out words with length <= 1
6. Return the remaining keywords

### Similarity Calculation

**Jaccard Index:**
```
similarity = |keywords1 ∩ keywords2| / |keywords1 ∪ keywords2|
```

Where:
- `keywords1` = keywords from current entry
- `keywords2` = keywords from past entry
- `∩` = set intersection (common keywords)
- `∪` = set union (all unique keywords)

**Exact Match Boost:**
If the current text is a substring of the past entry (case-insensitive), the similarity score is boosted to at least 0.8.

**Minimum Threshold:**
Entries with similarity <= 0.1 AND no exact match are excluded from results.

### Stop Words List

The system MUST exclude the following stop words:
- Pronouns: i, you, he, she, it, we, they, me, him, her, us, them
- Possessives: my, your, his, her, its, our, their
- Articles: the, a, an
- Conjunctions: and, or, but
- Prepositions: in, on, at, to, for, of, with, by
- Verbs: is, was, are, were, be, been, being, have, has, had, do, does, did
- Modals: will, would, could, should, may, might, must, can, shall

## User Interface Requirements

### Display Container

- The system MUST provide a dedicated container for similar entries
- The container MUST be positioned near the entry text area
- The container MUST be visually distinct from the entry input
- The container SHOULD be below the text area

### Entry Card Design

Each similar entry MUST display:
- Entry date (prominently displayed)
- Content preview (truncated to 150 characters)
- Visual indication of similarity (optional)

### Empty State

- The container MUST be hidden or empty when no similar entries are found
- The container MAY display a message when typing is in progress (< 3 characters)

### Styling

- Similar entries MUST be visually distinct from each other
- The date MUST be visually emphasized (bold, different color, etc.)
- The content preview MAY be in a lighter font weight
- The container MUST not interfere with the main writing interface

## Performance Requirements

- The system MUST complete similarity calculations within 50ms for 1000 entries
- The system MUST not block the UI during similarity search
- The system MUST cache keyword extraction results when possible
- The system MAY limit the search to the most recent N entries for performance

## Privacy and Data Handling

- The system MUST perform all similarity calculations locally in the browser
- The system MUST NOT send entry content to external servers for analysis
- The system MUST respect user privacy for sensitive journal content

## Accessibility Requirements

- Similar entries MUST be readable by screen readers
- The date MUST be announced before the content preview
- The container MUST be properly labeled for assistive technology
- The system MUST respect user's motion preferences (avoid animations if `prefers-reduced-motion` is set)
