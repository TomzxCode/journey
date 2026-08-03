# Similar Entries Specification

## Overview

This specification defines the requirements for the similar entries feature, which helps users discover related past journal entries while writing. The feature analyzes the current entry being written and finds historically similar entries using a BM25+ ranking algorithm over a cached inverted index, with light stemming and contiguous-phrase boosting.

## Requirements

### Similarity Detection

- The system MUST analyze entry content as the user types
- The system MUST use keyword extraction (tokenization) to identify meaningful terms
- The system MUST exclude common stop words from similarity calculations (e.g., "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", etc.)
- The system MUST calculate similarity using the BM25+ ranking function over tokenized document sets
- The system MUST apply light stemming so that inflected forms of a word match (e.g., "running" matches "runs" and "run")
- The system MUST boost scores for contiguous n-gram (phrase) matches between query and document
- The system MUST NOT compare an entry against itself (same date)
- The system MUST require a minimum of 3 characters before searching for similar entries
- The system SHOULD normalize text to lowercase before comparison
- The system SHOULD scope the search to the active file/tab only

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

### Tokenization

1. Convert text to lowercase
2. Remove all punctuation and special characters (replace with spaces)
3. Split text into words on whitespace
4. Filter out words with length <= 1
5. Filter out stop words (see list below)
6. Apply light stemming (see below) to each remaining word
7. Return the resulting token list (order preserved for n-gram extraction)

### Light Stemming

The stemmer normalizes common English inflections to maximize recall. It is intentionally simple and consistent rather than linguistically complete (it is not a lemmatizer).

Rules, applied in priority order:

1. Words of length <= 3 are returned unchanged.
2. `-ies` / `-ied` (length >= 5) -> `-y`  (e.g., `studies` -> `study`, `carried` -> `carry`).
3. Otherwise, try suffixes in this order: `ing`, `est`, `ed`, `es`, `er`, `ly`, `s`.
   - Strip the first matching suffix whose remaining stem has length >= 3.
   - If the resulting stem ends in a doubled non-vowel consonant (e.g., `runn`), drop one copy (e.g., `run`).
4. If no suffix produces a stem of sufficient length, the original word is returned unchanged.

Examples:
- `running` -> `run`
- `runs` -> `run`
- `studies` -> `study`
- `biggest` -> `big`
- `boxes` -> `box`
- `quickly` -> `quick`
- `happy` -> `happy` (unchanged)

### BM25+ Scoring

The system uses the BM25+ variant, which adds a lower-bound `delta` term to address the long-document over-penalization in standard BM25.

For a query Q and document D:

```
score(D, Q) = Σ_{t in Q} IDF(t) * [ tfNorm(t, D) + δ ]
IDF(t)      = log( 1 + (N - df(t) + 0.5) / (df(t) + 0.5) )
tfNorm(t,D) = ( tf(t, D) * (k1 + 1) ) / ( tf(t, D) + k1 * (1 - b + b * |D| / avgdl) )
```

Where:
- `tf(t, D)` is the term frequency of `t` in `D`
- `df(t)` is the number of documents containing `t`
- `N` is the total document count
- `|D|` is the document length (token count)
- `avgdl` is the mean document length across the corpus
- `k1`, `b`, `δ` are tunable parameters (defaults below)

**Default parameters:**

| Parameter | Default | Reason |
|-----------|---------|--------|
| `k1` | `1.2` | Standard term-frequency saturation. |
| `b` | `0.5` | Lower than textbook `0.75` because journal entries have wide length variance and full normalization over-penalizes long thoughtful entries. |
| `δ` | `0.5` | BM25+ lower bound; prevents long documents from scoring near zero. |

### Phrase Boost

After computing the BM25+ base score, the system multiplies it by a phrase-match boost based on contiguous token n-grams shared between query and document:

```
boost(D, Q) = bigramBoost ^ bigramHits(D, Q) * trigramBoost ^ trigramHits(D, Q)
finalScore  = baseBM25Score * boost
```

Where:
- `bigramHits` is the number of distinct 2-grams from the query that appear as contiguous 2-grams in the document
- `trigramHits` is the number of distinct 3-grams from the query that appear as contiguous 3-grams in the document
- Defaults: `bigramBoost = 1.5`, `trigramBoost = 2.0`

This makes the query "machine learning" strongly match entries that contain the phrase "machine learning", without requiring the entire query to be a literal substring of the document.

### Minimum Threshold

Entries with `finalScore <= 0.01` are excluded from results.

### Stop Words List

The system MUST exclude at minimum the following stop words (the implementation MAY extend this list):

- Pronouns: i, you, he, she, it, we, they, me, him, her, us, them
- Possessives: my, your, his, her, its, our, their
- Articles: the, a, an
- Conjunctions: and, or, but
- Prepositions: in, on, at, to, for, of, with, by, about, into, over, under, out, up, down, off
- Demonstratives: this, that, these, those
- Common verbs / auxiliaries: is, was, are, were, be, been, being, have, has, had, do, does, did
- Modals: will, would, could, should, may, might, must, can, shall
- Conjunctions / connectives: as, from, so, than, then, if, because, while, where, when, what, which, who, how

## Index Management

### Inverted Index

- The system MUST maintain an inverted index mapping term -> { docId -> termFreq } for fast retrieval
- The system MUST maintain per-document length and term sets to support incremental updates
- The system MUST maintain per-document n-gram sets (bigrams and trigrams) for phrase boosting

### Caching and Persistence

- The system MUST cache the inverted index in memory for the active file/tab
- The system MUST persist the index to IndexedDB so that subsequent page loads skip the cost of rebuilding it
- The system MUST key the persisted index by the file's stable path (e.g., `local` for the default journal, the relative path for directory-loaded files)
- The system MUST invalidate and rebuild the cached index when the document set no longer matches (added or removed entries)
- The system MUST update the index incrementally when a single entry is added, modified, or removed (rather than rebuilding the whole index)
- The system MAY debounce writes to IndexedDB to avoid excessive I/O on rapid edits

### Fallback Behavior

- If IndexedDB is unavailable (private browsing, quota exceeded, etc.), the system MUST continue to function using the in-memory index only, with a console warning
- The system MUST NOT throw errors that disrupt the UI if index persistence fails

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
- The system MUST cache keyword extraction and n-gram extraction results when possible (via the persisted index)
- The system MAY limit the search to the most recent N entries for performance

## Privacy and Data Handling

- The system MUST perform all similarity calculations locally in the browser
- The system MUST NOT send entry content to external servers for analysis
- The system MUST respect user privacy for sensitive journal content
- The system MUST persist the index locally (IndexedDB) and never transmit it

## Accessibility Requirements

- Similar entries MUST be readable by screen readers
- The date MUST be announced before the content preview
- The container MUST be properly labeled for assistive technology
- The system MUST respect user's motion preferences (avoid animations if `prefers-reduced-motion` is set)

