// BM25+ similar-document matching with light stemming and phrase boost.
// Framework-agnostic: no dependencies on the rest of the app.

const STOP_WORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'is', 'was', 'are', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'can', 'shall',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us',
    'them', 'my', 'your', 'his', 'its', 'our', 'their',
    'this', 'that', 'these', 'those', 'as', 'from', 'so', 'than', 'then',
    'if', 'because', 'while', 'where', 'when', 'what', 'which', 'who', 'how',
    'about', 'into', 'over', 'under', 'out', 'up', 'down', 'off',
]);

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

// Light suffix-stripping stemmer. Not a lemmatizer; aims for consistency
// (running/runs/run -> runn) rather than correctness (happiness != happy).
function stem(word) {
    if (word.length <= 3) return word;

    // -ies / -ied -> -y  (studies -> study, carried -> carry)
    if (word.endsWith('ies') && word.length >= 5) {
        return word.slice(0, -3) + 'y';
    }
    if (word.endsWith('ied') && word.length >= 5) {
        return word.slice(0, -3) + 'y';
    }

    // Try suffixes in priority order (longer/more-specific first).
    for (const suffix of ['ing', 'est', 'ed', 'es', 'er', 'ly', 's']) {
        if (!word.endsWith(suffix)) continue;
        const candidate = word.slice(0, -suffix.length);
        if (candidate.length < 3) continue;

        // Undo doubled consonant: runn -> run, sitt -> sit
        if (
            candidate.length >= 4 &&
            candidate[candidate.length - 1] === candidate[candidate.length - 2] &&
            !VOWELS.has(candidate[candidate.length - 1])
        ) {
            return candidate.slice(0, -1);
        }
        return candidate;
    }
    return word;
}

function tokenize(text) {
    if (!text) return [];
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 1)
        .filter(w => !STOP_WORDS.has(w))
        .map(stem);
}

function nGrams(tokens, n) {
    const out = new Set();
    for (let i = 0; i + n <= tokens.length; i++) {
        out.add(tokens.slice(i, i + n).join(' '));
    }
    return out;
}

class BM25Index {
    constructor(options = {}) {
        this.k1 = options.k1 ?? 1.2;
        this.b = options.b ?? 0.5;
        this.delta = options.delta ?? 0.5;
        this.bigramBoost = options.bigramBoost ?? 1.5;
        this.trigramBoost = options.trigramBoost ?? 2.0;

        // term -> Map<docId, termFreq>
        this.invertedIndex = new Map();
        // docId -> Set<term>  (for fast removal)
        this.docTerms = new Map();
        // docId -> token count
        this.docLengths = new Map();
        // docId -> Set<bigram>
        this.docBigrams = new Map();
        // docId -> Set<trigram>
        this.docTrigrams = new Map();
        this.totalLength = 0;
    }

    get docCount() {
        return this.docLengths.size;
    }

    get avgdl() {
        return this.docCount > 0 ? this.totalLength / this.docCount : 0;
    }

    hasDoc(docId) {
        return this.docLengths.has(docId);
    }

    addDocument(docId, text) {
        if (this.docLengths.has(docId)) {
            this.removeDocument(docId);
        }
        const tokens = tokenize(text);
        if (tokens.length === 0) return;

        const tf = new Map();
        for (const term of tokens) {
            tf.set(term, (tf.get(term) || 0) + 1);
        }

        for (const [term, freq] of tf) {
            let postings = this.invertedIndex.get(term);
            if (!postings) {
                postings = new Map();
                this.invertedIndex.set(term, postings);
            }
            postings.set(docId, freq);
        }

        this.docTerms.set(docId, new Set(tf.keys()));
        this.docLengths.set(docId, tokens.length);
        this.totalLength += tokens.length;
        this.docBigrams.set(docId, nGrams(tokens, 2));
        this.docTrigrams.set(docId, nGrams(tokens, 3));
    }

    removeDocument(docId) {
        const terms = this.docTerms.get(docId);
        if (!terms) return;

        for (const term of terms) {
            const postings = this.invertedIndex.get(term);
            if (postings) {
                postings.delete(docId);
                if (postings.size === 0) {
                    this.invertedIndex.delete(term);
                }
            }
        }

        this.totalLength -= this.docLengths.get(docId) || 0;
        this.docTerms.delete(docId);
        this.docLengths.delete(docId);
        this.docBigrams.delete(docId);
        this.docTrigrams.delete(docId);
    }

    clear() {
        this.invertedIndex.clear();
        this.docTerms.clear();
        this.docLengths.clear();
        this.docBigrams.clear();
        this.docTrigrams.clear();
        this.totalLength = 0;
    }

    rebuild(documents) {
        this.clear();
        for (const [docId, text] of Object.entries(documents)) {
            this.addDocument(docId, text);
        }
    }

    search(queryText, options = {}) {
        const excludeId = options.excludeId ?? null;
        const limit = options.limit ?? 5;
        const minScore = options.minScore ?? 0.01;

        const tokens = tokenize(queryText);
        if (tokens.length === 0 || this.docCount === 0) return [];

        const queryTerms = [...new Set(tokens)];
        const queryBigrams = nGrams(tokens, 2);
        const queryTrigrams = nGrams(tokens, 3);

        const N = this.docCount;
        const avgdl = this.avgdl;
        const candidates = new Map();

        for (const term of queryTerms) {
            const postings = this.invertedIndex.get(term);
            if (!postings) continue;

            const df = postings.size;
            const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));

            for (const [docId, tf] of postings) {
                if (docId === excludeId) continue;
                const docLen = this.docLengths.get(docId);
                const denom = tf + this.k1 * (1 - this.b + this.b * (docLen / avgdl));
                const tfNorm = (tf * (this.k1 + 1)) / denom;
                const contribution = idf * (tfNorm + this.delta);

                let entry = candidates.get(docId);
                if (!entry) {
                    entry = { score: 0, bigramHits: 0, trigramHits: 0 };
                    candidates.set(docId, entry);
                }
                entry.score += contribution;
            }
        }

        for (const [docId, entry] of candidates) {
            const bigrams = this.docBigrams.get(docId);
            const trigrams = this.docTrigrams.get(docId);
            if (bigrams) {
                for (const bg of queryBigrams) {
                    if (bigrams.has(bg)) entry.bigramHits++;
                }
            }
            if (trigrams) {
                for (const tg of queryTrigrams) {
                    if (trigrams.has(tg)) entry.trigramHits++;
                }
            }
            const boost =
                Math.pow(this.bigramBoost, entry.bigramHits) *
                Math.pow(this.trigramBoost, entry.trigramHits);
            entry.score *= boost;
        }

        const results = [];
        for (const [docId, entry] of candidates) {
            if (entry.score >= minScore) {
                results.push({ docId, score: entry.score });
            }
        }
        results.sort((a, b) => b.score - a.score);
        return results.slice(0, limit);
    }

    toJSON() {
        return {
            version: 1,
            params: {
                k1: this.k1,
                b: this.b,
                delta: this.delta,
                bigramBoost: this.bigramBoost,
                trigramBoost: this.trigramBoost,
            },
            invertedIndex: [...this.invertedIndex].map(([t, m]) => [t, [...m]]),
            docTerms: [...this.docTerms].map(([d, s]) => [d, [...s]]),
            docLengths: [...this.docLengths],
            docBigrams: [...this.docBigrams].map(([d, s]) => [d, [...s]]),
            docTrigrams: [...this.docTrigrams].map(([d, s]) => [d, [...s]]),
            totalLength: this.totalLength,
        };
    }

    static fromJSON(data) {
        const index = new BM25Index(data.params || {});
        index.invertedIndex = new Map(
            (data.invertedIndex || []).map(([t, m]) => [t, new Map(m)])
        );
        index.docTerms = new Map(
            (data.docTerms || []).map(([d, s]) => [d, new Set(s)])
        );
        index.docLengths = new Map(data.docLengths || []);
        index.docBigrams = new Map(
            (data.docBigrams || []).map(([d, s]) => [d, new Set(s)])
        );
        index.docTrigrams = new Map(
            (data.docTrigrams || []).map(([d, s]) => [d, new Set(s)])
        );
        index.totalLength = data.totalLength || 0;
        return index;
    }
}

// Minimal IndexedDB key-value wrapper for index persistence.
// All calls swallow errors so the in-memory index keeps working even when
// storage is unavailable (private browsing, quota exceeded, etc.).
const IDB_NAME = 'journey-bm25';
const IDB_STORE = 'indices';
const IDB_VERSION = 1;

let _dbPromise = null;

function openDB() {
    if (_dbPromise) return _dbPromise;
    _dbPromise = new Promise((resolve) => {
        if (typeof indexedDB === 'undefined') {
            resolve(null);
            return;
        }
        const req = indexedDB.open(IDB_NAME, IDB_VERSION);
        req.onupgradeneeded = () => {
            if (!req.result.objectStoreNames.contains(IDB_STORE)) {
                req.result.createObjectStore(IDB_STORE);
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
        req.onblocked = () => resolve(null);
    });
    return _dbPromise;
}

async function idbGet(key) {
    const db = await openDB();
    if (!db) return undefined;
    return new Promise((resolve) => {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const req = tx.objectStore(IDB_STORE).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(undefined);
    });
}

async function idbSet(key, value) {
    const db = await openDB();
    if (!db) return;
    return new Promise((resolve) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
        tx.onabort = () => resolve();
    });
}

async function idbDelete(key) {
    const db = await openDB();
    if (!db) return;
    return new Promise((resolve) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
        tx.onabort = () => resolve();
    });
}

window.BM25 = {
    Index: BM25Index,
    tokenize,
    stem,
    idbGet,
    idbSet,
    idbDelete,
};
