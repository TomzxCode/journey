class DailyJournal {
    constructor() {
        this.directoryEntries = {};
        this.files = [];
        this.activeFileIndex = 0;
        this.currentFilter = 'yesterday';
        this.currentCalendarYear = new Date().getFullYear();
        this.similarEntriesTimeout = null;
        this.selectedDate = new Date();
        this.selectedDirectory = null;
        this.foundFiles = [];

        // Configurable past entry periods
        this.pastPeriods = this.loadPastPeriods();
        this.editingPeriodId = null;

        // Theme management
        this.currentTheme = this.loadTheme();
        this.init();
    }

    // Default past periods configuration
    getDefaultPastPeriods() {
        return [
            { id: 'yesterday', label: 'Yesterday', unit: 'days', value: 1 },
            { id: '2days', label: '2 Days Ago', unit: 'days', value: 2 },
            { id: '5days', label: '5 Days Ago', unit: 'days', value: 5 },
            { id: 'lastWeek', label: 'Last Week', unit: 'weeks', value: 1 },
            { id: '2weeks', label: '2 Weeks Ago', unit: 'weeks', value: 2 },
            { id: '10weeks', label: '10 Weeks Ago', unit: 'weeks', value: 10 },
            { id: 'lastMonth', label: 'Last Month', unit: 'months', value: 1 },
            { id: '3months', label: '3 Months Ago', unit: 'months', value: 3 },
            { id: '6months', label: '6 Months Ago', unit: 'months', value: 6 },
            { id: '9months', label: '9 Months Ago', unit: 'months', value: 9 },
            { id: '12months', label: '12 Months Ago', unit: 'months', value: 12 },
            { id: 'lastYear', label: 'Last Year', unit: 'years', value: 1 },
            { id: '3years', label: '3 Years Ago', unit: 'years', value: 3 },
            { id: '5years', label: '5 Years Ago', unit: 'years', value: 5 },
        ];
    }

    loadPastPeriods() {
        const stored = localStorage.getItem('journey.pastPeriods');
        return stored ? JSON.parse(stored) : this.getDefaultPastPeriods();
    }

    // Theme management methods
    loadTheme() {
        const stored = localStorage.getItem('journey.theme');
        return stored || 'light';
    }

    saveTheme(theme) {
        localStorage.setItem('journey.theme', theme);
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;

        // Update theme toggle button icon
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        this.saveTheme(newTheme);
    }

    initializeTheme() {
        this.applyTheme(this.currentTheme);

        // Check for system preference if no saved theme
        if (!localStorage.getItem('journey.theme')) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const systemTheme = prefersDark ? 'dark' : 'light';
            this.applyTheme(systemTheme);
        }
    }

    savePastPeriods() {
        localStorage.setItem('journey.pastPeriods', JSON.stringify(this.pastPeriods));
    }

    renderFilterButtons() {
        const container = document.querySelector('.time-filters');
        container.innerHTML = '';

        this.pastPeriods.forEach(period => {
            const button = document.createElement('button');
            button.className = `filter-btn ${period.id === this.currentFilter ? 'active' : ''}`;
            button.dataset.filter = period.id;
            button.textContent = period.label;

            // Disable button if no entry exists for this period
            if (!this.hasEntryForPeriod(period)) {
                button.disabled = true;
            }

            button.addEventListener('click', () => this.filterPastEntries(period.id));
            container.appendChild(button);
        });
    }

    async init() {
        this.initializeTheme();
        this.registerServiceWorker();
        this.initializeDatePicker();
        this.bindEvents();
        this.initializeFiles();
        this.renderFilterButtons();
        this.renderFileTabs();
        this.refreshView();
        this.loadDirectorySettings();

        // PWA: Auto-restore directory and files if running as PWA
        if (this.isRunningAsPWA()) {
            await this.restorePWAState();
        }
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js').then((registration) => {
                console.log('ServiceWorker registered with scope:', registration.scope);

                // Determine if we're in development mode
                const isDevelopment = !this.isRunningAsPWA() || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

                // Send the mode to the service worker
                if (registration.active) {
                    registration.active.postMessage({
                        type: 'SET_MODE',
                        isDevelopment: isDevelopment
                    });
                } else if (registration.installing) {
                    registration.installing.addEventListener('statechange', () => {
                        if (registration.active) {
                            registration.active.postMessage({
                                type: 'SET_MODE',
                                isDevelopment: isDevelopment
                            });
                        }
                    });
                }

                // Listen for update notifications in production
                if (!isDevelopment) {
                    this.setupUpdateNotifications(registration);
                }

                // Handle updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker is available, waiting to activate
                            if (!isDevelopment) {
                                this.showUpdateNotification();
                            }
                        }
                    });
                });
            }).catch((error) => {
                console.log('ServiceWorker registration failed:', error);
            });

            // Listen for messages from service worker
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
                    this.showUpdateNotification();
                }
            });
        }
    }

    setupUpdateNotifications(registration) {
        // Listen for controller changes (service worker was updated)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            // Reload the page when the new service worker activates
            window.location.reload();
        });
    }

    showUpdateNotification() {
        // Check if notification already exists
        if (document.getElementById('updateNotification')) {
            return;
        }

        const notification = document.createElement('div');
        notification.id = 'updateNotification';
        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="update-notification-content">
                <span>A new version is available!</span>
                <div class="update-notification-actions">
                    <button id="updateNowBtn">Update Now</button>
                    <button id="updateLaterBtn">Later</button>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        document.getElementById('updateNowBtn').addEventListener('click', () => {
            // Tell the service worker to skip waiting
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'SKIP_WAITING'
                });
            }
        });

        document.getElementById('updateLaterBtn').addEventListener('click', () => {
            notification.remove();
        });
    }

    isRunningAsPWA() {
        // Check if running in standalone mode (PWA)
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone === true;
    }

    // IndexedDB helpers for persisting directory handles (PWA-only)
    async getDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('journey-pwa-storage', 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('handles')) {
                    db.createObjectStore('handles');
                }
            };
        });
    }

    async saveDirectoryHandle(handle) {
        if (!handle) return;
        try {
            const db = await this.getDB();
            const tx = db.transaction('handles', 'readwrite');
            tx.objectStore('handles').put(handle, 'directoryHandle');
            await new Promise((resolve, reject) => {
                tx.oncomplete = resolve;
                tx.onerror = () => reject(tx.error);
            });
        } catch (error) {
            console.warn('Failed to save directory handle:', error);
        }
    }

    async getDirectoryHandle() {
        try {
            const db = await this.getDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction('handles', 'readonly');
                const request = tx.objectStore('handles').get('directoryHandle');
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.warn('Failed to get directory handle:', error);
            return null;
        }
    }

    async clearDirectoryHandle() {
        try {
            const db = await this.getDB();
            const tx = db.transaction('handles', 'readwrite');
            tx.objectStore('handles').delete('directoryHandle');
            await new Promise((resolve, reject) => {
                tx.oncomplete = resolve;
                tx.onerror = () => reject(tx.error);
            });
        } catch (error) {
            console.warn('Failed to clear directory handle:', error);
        }
    }

    // PWA: Restore directory and auto-load files on startup
    async restorePWAState() {
        try {
            const directoryHandle = await this.getDirectoryHandle();
            if (!directoryHandle) {
                console.log('No persisted directory handle found');
                return;
            }

            // Request permission to access the directory
            // For PWAs, the permission should already be granted from previous session
            const permission = await directoryHandle.queryPermission({ mode: 'read' });
            if (permission !== 'granted') {
                // Try requesting permission
                const requestPermission = await directoryHandle.requestPermission({ mode: 'read' });
                if (requestPermission !== 'granted') {
                    console.log('Directory permission not granted');
                    return;
                }
            }

            // Restore the directory
            this.selectedDirectory = directoryHandle;

            const directoryInfo = document.getElementById('directoryInfo');
            const directoryPath = document.getElementById('selectedDirectoryPath');
            const clearBtn = document.getElementById('clearDirectoryBtn');

            directoryPath.textContent = directoryHandle.name;
            directoryInfo.style.display = 'block';
            clearBtn.disabled = false;

            // Scan for files
            await this.scanDirectoryFiles();

            // Auto-load previously selected files
            const savedFilePaths = this.getSavedSelectedFilePaths();
            if (savedFilePaths && savedFilePaths.length > 0) {
                await this.autoLoadPreviouslySelectedFiles(savedFilePaths);
                this.showMessage(`Restored ${savedFilePaths.length} files from previous session`, 'success');
            }

        } catch (error) {
            console.warn('Failed to restore PWA state:', error);
        }
    }

    initializeFiles() {
        // 1. Default Journal (Tab 0)
        const defaultEntries = this.loadEntriesFromLocalStorage();
        this.files.push({
            name: 'My Journal',
            type: 'local',
            path: 'local',
            entries: defaultEntries,
            content: '' // Not used for local type
        });

        // 2. Load cached directory files as tabs
        Object.keys(this.directoryEntries).forEach(path => {
            const content = this.directoryEntries[path];
            // Extract filename from path
            const name = path.split('/').pop() || path;
            const entries = this.parseContentToEntries(content);

            this.files.push({
                name: name,
                type: 'file',
                path: path,
                content: content,
                entries: entries
            });
        });
    }

    get entries() {
        return this.files[this.activeFileIndex].entries;
    }

    refreshView() {
        this.loadSelectedEntry();
        this.displayPastEntries();
        this.generateYearTabs();
        this.generateActivityCalendar();

        // Re-calculate similar entries with current text and new entries
        const currentText = document.getElementById('entryText').value;
        this.findSimilarEntries(currentText);
    }

    initializeDatePicker() {
        const datePicker = document.getElementById('datePicker');
        datePicker.value = this.getDateString(this.selectedDate);
    }

    bindEvents() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        document.getElementById('datePicker').addEventListener('change', (e) => this.onDateChange(e));
        document.getElementById('saveEntry').addEventListener('click', () => this.saveEntry());
        document.getElementById('clearEntry').addEventListener('click', () => this.clearEntry());
        document.getElementById('entryText').addEventListener('input', (e) => this.onEntryInput(e));
        document.getElementById('entryText').addEventListener('blur', () => this.checkAndSaveEntry());

        document.getElementById('importBtn').addEventListener('click', () => this.importJournal());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportJournal());
        document.getElementById('importFile').addEventListener('change', (e) => this.handleFileImport(e));

        document.getElementById('selectDirectoryBtn').addEventListener('click', () => this.selectDirectory());
        document.getElementById('updateFilesBtn').addEventListener('click', () => this.updateSelectedFiles());
        document.getElementById('clearDirectoryBtn').addEventListener('click', () => this.clearDirectory());
        document.getElementById('selectAllFilesBtn').addEventListener('click', () => this.selectAllFiles());
        document.getElementById('selectNoneFilesBtn').addEventListener('click', () => this.selectNoneFiles());
        document.getElementById('fileFilterInput').addEventListener('input', (e) => this.filterFileList(e.target.value));

        // Configuration Modal Events
        document.getElementById('configurePastEntriesBtn').addEventListener('click', () => this.openConfigModal());
        document.getElementById('closeConfigModal').addEventListener('click', () => this.closeConfigModal());
        document.getElementById('configModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('configModal')) this.closeConfigModal();
        });
        document.getElementById('addPeriodBtn').addEventListener('click', () => this.addPeriod());
        document.getElementById('cancelEditBtn').addEventListener('click', () => this.cancelEdit());

        // Mobile tab toggle
        const mobileToggle = document.getElementById('mobileTabToggle');
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                document.getElementById('fileTabsContainer').classList.toggle('open');
            });
        }

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            const container = document.getElementById('fileTabsContainer');
            const toggle = document.getElementById('mobileTabToggle');
            if (container.classList.contains('open') &&
                !container.contains(e.target) &&
                e.target !== toggle) {
                container.classList.remove('open');
            }
        });
    }

    renderFileTabs() {
        const tabsContainer = document.getElementById('fileTabs');
        const containerWrapper = document.getElementById('fileTabsContainer');
        const mobileToggle = document.getElementById('mobileTabToggle');

        if (this.files.length <= 1) {
            containerWrapper.style.display = 'none';
            if (mobileToggle) mobileToggle.style.display = 'none';
            return;
        }

        containerWrapper.style.display = 'block';
        if (mobileToggle && window.innerWidth <= 600) {
            mobileToggle.style.display = 'block';
        }

        tabsContainer.innerHTML = '';

        this.files.forEach((file, index) => {
            const tab = document.createElement('div');
            tab.className = `file-tab ${index === this.activeFileIndex ? 'active' : ''}`;

            const nameSpan = document.createElement('span');
            nameSpan.textContent = file.name;
            tab.appendChild(nameSpan);

            // Add close button for non-default tabs
            if (index > 0) {
                const closeBtn = document.createElement('span');
                closeBtn.className = 'close-tab';
                closeBtn.innerHTML = '&times;';
                closeBtn.title = 'Close file';
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.closeFileTab(index);
                });
                tab.appendChild(closeBtn);
            }

            tab.addEventListener('click', () => this.switchFileTab(index));
            tabsContainer.appendChild(tab);
        });
    }

    switchFileTab(index) {
        if (index === this.activeFileIndex) return;

        this.activeFileIndex = index;
        this.renderFileTabs();
        this.refreshView();

        // Close mobile menu if open
        document.getElementById('fileTabsContainer').classList.remove('open');
    }

    closeFileTab(index) {
        if (index === 0) return; // Cannot close default journal

        const fileToRemove = this.files[index];

        // Remove from directoryEntries
        if (fileToRemove.type === 'file') {
            delete this.directoryEntries[fileToRemove.path];
        }

        // Remove from files array
        this.files.splice(index, 1);

        // Adjust active index
        if (this.activeFileIndex === index) {
            this.activeFileIndex = Math.max(0, index - 1);
        } else if (this.activeFileIndex > index) {
            this.activeFileIndex--;
        }

        this.renderFileTabs();
        this.refreshView();
        this.updateLoadButtonState();
        this.showMessage(`Closed ${fileToRemove.name}`, 'info');
    }

    onDateChange(e) {
        // Parse the date string (YYYY-MM-DD) and create a date in local time
        const [year, month, day] = e.target.value.split('-').map(Number);
        this.selectedDate = new Date(year, month - 1, day);
        this.loadSelectedEntry();
        this.displayPastEntries();
    }

    getDateString(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    loadEntriesFromLocalStorage() {
        const stored = localStorage.getItem('journey.journalEntries');
        return stored ? JSON.parse(stored) : {};
    }

    async saveCurrentEntries() {
        const currentFile = this.files[this.activeFileIndex];

        if (currentFile.type === 'local') {
            localStorage.setItem('journey.journalEntries', JSON.stringify(currentFile.entries));
        } else if (currentFile.type === 'file') {
            // Regenerate content string from entries
            // This assumes a simple Markdown format for saving back
            const newContent = this.entriesToMarkdown(currentFile.entries);
            currentFile.content = newContent;

            // Update directoryEntries
            this.directoryEntries[currentFile.path] = newContent;

            // Write to disk if handle is available
            if (currentFile.handle) {
                try {
                    const writable = await currentFile.handle.createWritable();
                    await writable.write(newContent);
                    await writable.close();
                } catch (error) {
                    console.error('Failed to write to disk:', error);
                    this.showMessage('Failed to save to disk', 'error');
                }
            }
        }
    }

    entriesToMarkdown(entries) {
        // Sort dates
        const sortedDates = Object.keys(entries).sort();
        return sortedDates.map(date => `# ${date}\n\n${entries[date]}`).join('\n\n');
    }

    loadSelectedEntry() {
        const selectedDateStr = this.getDateString(this.selectedDate);
        const entry = this.entries[selectedDateStr] || '';
        document.getElementById('entryText').value = entry;
    }

    checkAndSaveEntry() {
        const selectedDateStr = this.getDateString(this.selectedDate);
        const savedText = this.entries[selectedDateStr] || '';
        const currentText = document.getElementById('entryText').value.trim();

        if (savedText !== currentText) {
            this.saveEntry();
        }
    }

    async saveEntry() {
        const selectedDateStr = this.getDateString(this.selectedDate);
        const entryText = document.getElementById('entryText').value.trim();
        const currentEntries = this.entries; // Get current file's entries

        if (entryText) {
            currentEntries[selectedDateStr] = entryText;
            await this.saveCurrentEntries();
            this.refreshView();
            this.showMessage('Entry saved successfully!', 'success');
        } else {
            if (currentEntries[selectedDateStr]) {
                delete currentEntries[selectedDateStr];
                await this.saveCurrentEntries();
                this.refreshView();
                this.showMessage('Entry cleared.', 'info');
            }
        }
    }

    clearEntry() {
        document.getElementById('entryText').value = '';
        document.getElementById('similarEntriesContainer').innerHTML = '';
    }

    onEntryInput(e) {
        const text = e.target.value;

        if (this.similarEntriesTimeout) {
            clearTimeout(this.similarEntriesTimeout);
        }

        this.similarEntriesTimeout = setTimeout(() => {
            this.findSimilarEntries(text);
        }, 150);
    }

    findSimilarEntries(currentText) {
        if (currentText.length < 3) {
            document.getElementById('similarEntriesContainer').innerHTML = '';
            return;
        }

        const words = this.extractKeywords(currentText);
        const similarEntries = [];
        const selectedDateStr = this.getDateString(this.selectedDate);
        const searchText = currentText.toLowerCase().trim();
        const currentEntries = this.entries;

        // Only use containsMatch if we have meaningful keywords (not just stop words)
        const hasMeaningfulKeywords = words.length > 0;

        Object.keys(currentEntries).forEach(date => {
            if (date === selectedDateStr) return;

            const entryText = currentEntries[date];
            const entryWords = this.extractKeywords(entryText);

            // Check for exact substring matches (for names, specific phrases)
            const containsMatch = hasMeaningfulKeywords && entryText.toLowerCase().includes(searchText);

            // Calculate keyword-based similarity
            const keywordSimilarity = this.calculateSimilarity(words, entryWords);

            // Combine both approaches: exact matches get higher priority
            let finalScore = keywordSimilarity;
            if (containsMatch) {
                finalScore = Math.max(0.8, keywordSimilarity); // Boost exact matches
            }

            if (finalScore > 0.1) {
                similarEntries.push({
                    date,
                    content: entryText,
                    similarity: finalScore
                });
            }
        });

        similarEntries.sort((a, b) => b.similarity - a.similarity);
        this.displaySimilarEntries(similarEntries.slice(0, 5));
    }

    extractKeywords(text) {
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their']);

        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 1 && !stopWords.has(word));
    }

    calculateSimilarity(searchWords, entryWords) {
        const searchSet = new Set(searchWords);
        const entrySet = new Set(entryWords);

        // Count matching words
        let matchCount = 0;
        for (const word of searchSet) {
            if (entrySet.has(word)) {
                matchCount++;
            }
        }

        // Score based on what proportion of search keywords appear in the entry
        // This means if you type "LLMs and other stuff", entries with just "LLMs" still match well
        return searchSet.size > 0 ? matchCount / searchSet.size : 0;
    }

    displaySimilarEntries(entries) {
        const container = document.getElementById('similarEntriesContainer');

        if (entries.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = entries.map(entry => `
            <div class="similar-entry">
                <div class="entry-date">${this.formatDate(entry.date)}</div>
                <div class="entry-content">${this.truncateText(entry.content, 150)}</div>
            </div>
        `).join('');
    }

    filterPastEntries(filter) {
        this.currentFilter = filter;

        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        this.displayPastEntries();
    }

    displayPastEntries() {
        const container = document.getElementById('pastEntriesContainer');
        const filteredEntries = this.getFilteredEntries();

        if (filteredEntries.length === 0) {
            container.innerHTML = '<div class="no-entries">No entries found for this time period.</div>';
        } else {
            container.innerHTML = filteredEntries.map(entry => `
                <div class="entry-item">
                    <div class="entry-date">${this.formatDate(entry.date)}</div>
                    <div class="entry-content">${entry.content}</div>
                </div>
            `).join('');
        }

        // Update button disabled states based on entry availability
        this.updateFilterButtonStates();
    }

    updateFilterButtonStates() {
        document.querySelectorAll('.filter-btn').forEach(button => {
            const periodId = button.dataset.filter;
            const period = this.pastPeriods.find(p => p.id === periodId);
            if (period) {
                button.disabled = !this.hasEntryForPeriod(period);
            }
        });
    }

    getFilteredEntries() {
        const selectedDateStr = this.getDateString(this.selectedDate);
        const currentEntries = this.entries;

        // Find the current period configuration
        const period = this.pastPeriods.find(p => p.id === this.currentFilter);
        if (!period) return [];

        // Calculate the target date based on the period configuration
        const targetDate = new Date(this.selectedDate);

        switch (period.unit) {
            case 'days':
                targetDate.setDate(targetDate.getDate() - period.value);
                break;
            case 'weeks':
                targetDate.setDate(targetDate.getDate() - (period.value * 7));
                break;
            case 'months':
                targetDate.setMonth(targetDate.getMonth() - period.value);
                break;
            case 'years':
                targetDate.setFullYear(targetDate.getFullYear() - period.value);
                break;
        }

        const targetDateStr = this.getDateString(targetDate);

        return Object.keys(currentEntries)
            .filter(date => {
                if (date === selectedDateStr) return false;
                return date === targetDateStr;
            })
            .sort((a, b) => new Date(b) - new Date(a))
            .map(date => ({
                date,
                content: currentEntries[date]
            }));
    }

    hasEntryForPeriod(period) {
        const selectedDateStr = this.getDateString(this.selectedDate);
        const currentEntries = this.entries;

        // Calculate the target date based on the period configuration
        const targetDate = new Date(this.selectedDate);

        switch (period.unit) {
            case 'days':
                targetDate.setDate(targetDate.getDate() - period.value);
                break;
            case 'weeks':
                targetDate.setDate(targetDate.getDate() - (period.value * 7));
                break;
            case 'months':
                targetDate.setMonth(targetDate.getMonth() - period.value);
                break;
            case 'years':
                targetDate.setFullYear(targetDate.getFullYear() - period.value);
                break;
        }

        const targetDateStr = this.getDateString(targetDate);

        return currentEntries.hasOwnProperty(targetDateStr);
    }

    formatDate(dateString) {
        // Parse date string properly to avoid timezone issues
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        const options = {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        return date.toLocaleDateString('en-US', options);
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    generateYearTabs() {
        const yearTabsContainer = document.getElementById('yearTabs');
        yearTabsContainer.innerHTML = '';
        const currentEntries = this.entries;

        // Get all years that have entries
        const entryYears = new Set();
        Object.keys(currentEntries).forEach(dateString => {
            const year = parseInt(dateString.split('-')[0]);
            entryYears.add(year);
        });

        // Add current year even if no entries
        const currentYear = new Date().getFullYear();
        entryYears.add(currentYear);

        // Sort years in descending order
        const sortedYears = Array.from(entryYears).sort((a, b) => b - a);

        sortedYears.forEach(year => {
            const tabElement = document.createElement('button');
            tabElement.className = 'year-tab';
            tabElement.textContent = year;
            tabElement.dataset.year = year;

            if (year === this.currentCalendarYear) {
                tabElement.classList.add('active');
            }

            if (year === currentYear) {
                tabElement.classList.add('current-year');
            }

            tabElement.addEventListener('click', () => this.switchCalendarYear(year));
            yearTabsContainer.appendChild(tabElement);
        });
    }

    switchCalendarYear(year) {
        this.currentCalendarYear = year;

        // Update tab active states
        document.querySelectorAll('.year-tab').forEach(tab => {
            tab.classList.toggle('active', parseInt(tab.dataset.year) === year);
        });

        this.generateActivityCalendar();
    }

    generateActivityCalendar() {
        const calendarGrid = document.getElementById('activityCalendar');
        const monthsContainer = document.querySelector('.calendar-months');

        calendarGrid.innerHTML = '';
        monthsContainer.innerHTML = '';

        // Generate calendar for the selected year
        const startDate = new Date(this.currentCalendarYear, 0, 1); // January 1st of selected year
        const endDate = new Date(this.currentCalendarYear, 11, 31); // December 31st of selected year

        // Start from Sunday of the week containing January 1st
        startDate.setDate(startDate.getDate() - startDate.getDay());

        const days = [];
        const currentDate = new Date(startDate);

        // Generate enough weeks to cover the entire year
        while (currentDate.getFullYear() <= this.currentCalendarYear) {
            for (let day = 0; day < 7; day++) {
                days.push(new Date(currentDate));
                currentDate.setDate(currentDate.getDate() + 1);

                if (currentDate.getFullYear() > this.currentCalendarYear && currentDate.getDate() > 7) {
                    break;
                }
            }
            if (currentDate.getFullYear() > this.currentCalendarYear && currentDate.getDate() > 7) {
                break;
            }
        }

        // Generate month labels
        this.generateMonthLabels(days, monthsContainer);

        const currentEntries = this.entries;

        // Generate calendar days
        days.forEach((date, index) => {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';

            const dateString = this.getDateString(date);
            const hasEntry = currentEntries.hasOwnProperty(dateString);
            const level = hasEntry ? this.getActivityLevel(dateString) : 0;

            dayElement.classList.add(`level-${level}`);
            dayElement.dataset.date = dateString;

            if (hasEntry) {
                dayElement.addEventListener('mouseenter', (e) => this.showTooltip(e, dateString));
                dayElement.addEventListener('mouseleave', () => this.hideTooltip());
            }

            dayElement.addEventListener('click', () => {
                const datePicker = document.getElementById('datePicker');
                datePicker.value = dateString;
                datePicker.dispatchEvent(new Event('change'));
            });

            calendarGrid.appendChild(dayElement);
        });
    }

    generateMonthLabels(days, container) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        let currentMonth = -1;
        let monthElements = [];

        for (let week = 0; week < 53; week++) {
            const weekStartDate = days[week * 7];
            const month = weekStartDate.getMonth();

            const monthElement = document.createElement('div');
            monthElement.className = 'calendar-month';

            if (month !== currentMonth && week > 0) {
                monthElement.textContent = monthNames[month];
                currentMonth = month;
            }

            container.appendChild(monthElement);
        }
    }

    getActivityLevel(dateString) {
        const entry = this.entries[dateString];
        if (!entry) return 0;

        const wordCount = entry.split(/\s+/).length;

        if (wordCount >= 100) return 4;
        if (wordCount >= 50) return 3;
        if (wordCount >= 20) return 2;
        return 1;
    }

    showTooltip(event, dateString) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';

        const entry = this.entries[dateString];
        const formattedDate = this.formatDate(dateString);

        tooltip.innerHTML = `
            <div class="tooltip-date">${formattedDate}</div>
            <div class="tooltip-content">${this.truncateText(entry, 100)}</div>
        `;

        document.body.appendChild(tooltip);

        const rect = event.target.getBoundingClientRect();
        tooltip.style.left = `${rect.left + window.scrollX - tooltip.offsetWidth / 2 + rect.width / 2}px`;
        tooltip.style.top = `${rect.top + window.scrollY - tooltip.offsetHeight - 10}px`;

        this.currentTooltip = tooltip;
    }

    hideTooltip() {
        if (this.currentTooltip) {
            this.currentTooltip.remove();
            this.currentTooltip = null;
        }
    }

    importJournal() {
        document.getElementById('importFile').click();
    }

    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                // Determine which file to update.
                // Currently, importJournal updates the current tab.
                const entries = this.parseContentToEntries(e.target.result);

                // Merge into current tab entries
                const currentEntries = this.entries;
                Object.assign(currentEntries, entries);

                await this.saveCurrentEntries();
                this.refreshView();
                this.showMessage('Journal imported successfully into current tab!', 'success');
            } catch (error) {
                this.showMessage('Error importing journal. Please check the file format.', 'error');
            }
        };
        reader.readAsText(file);
    }

    parseContentToEntries(content) {
        const entries = {};
        // Try multiple date formats
        const markdownDateRegex = /^#\s*(\d{4}-\d{2}-\d{2})$/gm;

        // First try markdown format (# YYYY-MM-DD)
        let sections = content.split(markdownDateRegex).slice(1);

        if (sections.length === 0) {
            // Try raw date format (YYYYMMDD, YYYY-MM-DD, YYYY/MM/DD)
            const lines = content.split(/\r?\n/);
            let currentDate = null;
            let currentEntry = [];

            for (const line of lines) {
                const trimmedLine = line.trim();

                // Check if line is a date
                const dateMatch = trimmedLine.match(/^(\d{8}|\d{4}-\d{2}-\d{2}|\d{4}\/\d{2}\/\d{2})$/);

                if (dateMatch) {
                    // Save previous entry if exists
                    if (currentDate && currentEntry.length > 0) {
                        const normalizedDate = this.normalizeDateString(currentDate);
                        if (this.isValidDate(normalizedDate)) {
                            entries[normalizedDate] = currentEntry.join('\n').trim();
                        }
                    }

                    // Start new entry
                    currentDate = dateMatch[1];
                    currentEntry = [];
                } else if (trimmedLine && currentDate) {
                    // Add content line to current entry
                    currentEntry.push(trimmedLine);
                }
            }

            // Save last entry
            if (currentDate && currentEntry.length > 0) {
                const normalizedDate = this.normalizeDateString(currentDate);
                if (this.isValidDate(normalizedDate)) {
                    entries[normalizedDate] = currentEntry.join('\n').trim();
                }
            }
        } else {
            // Process markdown format
            for (let i = 0; i < sections.length; i += 2) {
                const date = sections[i].trim();
                const entryContent = sections[i + 1] ? sections[i + 1].trim() : '';

                if (entryContent && this.isValidDate(date)) {
                    entries[date] = entryContent;
                }
            }
        }
        return entries;
    }

    normalizeDateString(dateString) {
        // Convert YYYYMMDD to YYYY-MM-DD
        if (dateString.match(/^\d{8}$/)) {
            return `${dateString.slice(0, 4)}-${dateString.slice(4, 6)}-${dateString.slice(6, 8)}`;
        }

        // Convert YYYY/MM/DD to YYYY-MM-DD
        if (dateString.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
            return dateString.replace(/\//g, '-');
        }

        // Already in YYYY-MM-DD format
        return dateString;
    }

    isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
    }

    exportJournal() {
        // Export current tab
        const currentEntries = this.entries;
        const markdown = this.entriesToMarkdown(currentEntries);

        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const tabName = this.files[this.activeFileIndex].name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        a.download = `journal-${tabName}-${this.getDateString()}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showMessage('Journal exported successfully!', 'success');
    }

    showMessage(text, type) {
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const message = document.createElement('div');
        message.className = `message message-${type}`;
        message.textContent = text;
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 6px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            transition: opacity 0.3s ease;
            background-color: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        `;

        document.body.appendChild(message);

        setTimeout(() => {
            message.style.opacity = '0';
            setTimeout(() => message.remove(), 300);
        }, 3000);
    }

    async selectDirectory() {
        try {
            if (!('showDirectoryPicker' in window)) {
                this.showMessage('Directory picker not supported in this browser. Use Chrome/Edge 86+', 'error');
                return;
            }

            const directoryHandle = await window.showDirectoryPicker();
            this.selectedDirectory = directoryHandle;

            // Persist directory handle for PWA
            if (this.isRunningAsPWA()) {
                await this.saveDirectoryHandle(directoryHandle);
            }

            const directoryInfo = document.getElementById('directoryInfo');
            const directoryPath = document.getElementById('selectedDirectoryPath');
            const clearBtn = document.getElementById('clearDirectoryBtn');

            directoryPath.textContent = directoryHandle.name;
            directoryInfo.style.display = 'block';
            clearBtn.disabled = false;

            this.saveDirectorySettings();

            // Always scan for files after directory selection
            await this.scanDirectoryFiles();

            // Check if we should auto-load previously selected files
            const savedFilePaths = this.getSavedSelectedFilePaths();
            if (savedFilePaths && savedFilePaths.length > 0) {
                await this.autoLoadPreviouslySelectedFiles(savedFilePaths);
            }

            this.showMessage('Directory selected successfully!', 'success');
        } catch (error) {
            if (error.name !== 'AbortError') {
                this.showMessage('Failed to select directory', 'error');
            }
        }
    }

    async scanDirectoryFiles() {
        if (!this.selectedDirectory) {
            this.showMessage('Please select a directory first', 'error');
            return;
        }

        try {
            const fileExtensions = this.getSelectedFileExtensions();
            const fileData = await this.getFilesFromDirectory(this.selectedDirectory, fileExtensions);

            this.foundFiles = fileData;
            this.displayFileList(fileData);

            const fileListContainer = document.getElementById('fileListContainer');

            fileListContainer.style.display = 'block';
            this.updateLoadButtonState();

            this.showMessage(`Found ${fileData.length} files. Select which files to load.`, 'success');

        } catch (error) {
            this.showMessage('Failed to scan directory for files', 'error');
        }
    }

    displayFileList(fileData, previouslySelectedPaths = null) {
        const fileList = document.getElementById('fileList');
        const fileCount = document.getElementById('fileCount');
        const filterInput = document.getElementById('fileFilterInput');

        fileCount.textContent = `${fileData.length} files found`;
        fileList.innerHTML = '';
        filterInput.value = '';

        fileData.forEach((fileInfo, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `file-${index}`;

            // Check if this file was previously selected, or default to true if no previous selection
            if (previouslySelectedPaths) {
                checkbox.checked = previouslySelectedPaths.includes(fileInfo.relativePath);
            } else {
                checkbox.checked = true;
            }

            checkbox.addEventListener('change', () => this.updateLoadButtonState());

            const fileInfoDiv = document.createElement('div');
            fileInfoDiv.className = 'file-info';

            const fileDetails = document.createElement('div');
            const fileName = document.createElement('div');
            fileName.className = 'file-name';
            fileName.textContent = fileInfo.file.name;

            const filePath = document.createElement('div');
            filePath.className = 'file-path';
            filePath.textContent = fileInfo.relativePath;

            fileDetails.appendChild(fileName);
            fileDetails.appendChild(filePath);

            const fileSize = document.createElement('div');
            fileSize.className = 'file-size';
            fileSize.textContent = this.formatFileSize(fileInfo.file.size);

            fileInfoDiv.appendChild(fileDetails);
            fileInfoDiv.appendChild(fileSize);

            fileItem.appendChild(checkbox);
            fileItem.appendChild(fileInfoDiv);

            fileList.appendChild(fileItem);
        });
    }

    async updateSelectedFiles() {
        const checkboxes = document.querySelectorAll('#fileList input[type="checkbox"]');
        const selectedIndexes = [];
        const unselectedIndexes = [];

        checkboxes.forEach(cb => {
            const index = parseInt(cb.id.replace('file-', ''));
            if (cb.checked) {
                selectedIndexes.push(index);
            } else {
                unselectedIndexes.push(index);
            }
        });

        try {
            let loadedCount = 0;
            let removedCount = 0;

            // 1. Remove files that are unchecked but currently open
            const unselectedPaths = unselectedIndexes.map(index => this.foundFiles[index].relativePath);

            // Iterate backwards through this.files to safely remove
            for (let i = this.files.length - 1; i >= 0; i--) {
                const file = this.files[i];
                if (file.type === 'file' && unselectedPaths.includes(file.path)) {
                    // Remove from directoryEntries
                    delete this.directoryEntries[file.path];

                    // Remove from files array
                    this.files.splice(i, 1);

                    removedCount++;
                }
            }

            // Adjust activeFileIndex if it's out of bounds
            if (this.activeFileIndex >= this.files.length) {
                this.activeFileIndex = Math.max(0, this.files.length - 1);
            }

            // 2. Load/Update selected files
            for (const index of selectedIndexes) {
                try {
                    const fileInfo = this.foundFiles[index];
                    const content = await fileInfo.file.text();
                    const fileName = fileInfo.file.name;
                    const fileKey = fileInfo.relativePath;

                    // Parse entries
                    const entries = this.parseContentToEntries(content);

                    // Add to directoryEntries for persistence
                    this.directoryEntries[fileKey] = content;

                    // Add or update file tab
                    const existingFileIndex = this.files.findIndex(f => f.path === fileKey);

                    const newFileObj = {
                        name: fileName,
                        type: 'file',
                        path: fileKey,
                        content: content,
                        entries: entries,
                        handle: fileInfo.handle
                    };

                    if (existingFileIndex >= 0) {
                        this.files[existingFileIndex] = newFileObj;
                    } else {
                        this.files.push(newFileObj);
                    }

                    loadedCount++;
                } catch (error) {
                    console.warn(`Failed to load file ${this.foundFiles[index].file.name}:`, error);
                }
            }

            // Save the selected file paths for future auto-loading
            const selectedFilePaths = selectedIndexes.map(index => this.foundFiles[index].relativePath);
            this.saveSelectedFilePaths(selectedFilePaths);

            // Refresh UI
            this.renderFileTabs();
            this.refreshView();
            this.updateLoadButtonState();

            this.showMessage(`List updated: ${loadedCount} loaded, ${removedCount} removed`, 'success');

        } catch (error) {
            console.error(error);
            this.showMessage('Failed to update file list', 'error');
        }
    }

    async getFilesFromDirectory(directoryHandle, extensions, relativePath = '') {
        const files = [];

        for await (const entry of directoryHandle.values()) {
            if (entry.kind === 'file') {
                const extension = entry.name.split('.').pop().toLowerCase();
                if (extensions.includes(extension)) {
                    const file = await entry.getFile();
                    const fileRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
                    files.push({
                        file: file,
                        relativePath: fileRelativePath,
                        handle: entry
                    });
                }
            } else if (entry.kind === 'directory') {
                const subdirRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
                const subdirFiles = await this.getFilesFromDirectory(entry, extensions, subdirRelativePath);
                files.push(...subdirFiles);
            }
        }

        return files;
    }

    getSelectedFileExtensions() {
        const extensions = [];
        if (document.getElementById('filterMarkdown').checked) extensions.push('md');
        if (document.getElementById('filterText').checked) extensions.push('txt');
        if (document.getElementById('filterJson').checked) extensions.push('json');
        return extensions;
    }

    async clearDirectory() {
        this.selectedDirectory = null;

        // Clear persisted directory handle for PWA
        if (this.isRunningAsPWA()) {
            await this.clearDirectoryHandle();
        }

        const directoryInfo = document.getElementById('directoryInfo');
        const fileListContainer = document.getElementById('fileListContainer');
        const updateBtn = document.getElementById('updateFilesBtn');
        const clearBtn = document.getElementById('clearDirectoryBtn');

        directoryInfo.style.display = 'none';
        fileListContainer.style.display = 'none';
        updateBtn.disabled = true;
        clearBtn.disabled = true;

        this.clearDirectorySettings();
        this.clearSelectedFilePaths();
        this.showMessage('Directory selection cleared', 'success');
    }

    saveDirectorySettings() {
        const settings = {
            directoryName: this.selectedDirectory?.name,
            fileFilters: {
                markdown: document.getElementById('filterMarkdown').checked,
                text: document.getElementById('filterText').checked,
                json: document.getElementById('filterJson').checked
            }
        };
        localStorage.setItem('journey.directorySettings', JSON.stringify(settings));
    }

    loadDirectorySettings() {
        const stored = localStorage.getItem('journey.directorySettings');
        if (stored) {
            const settings = JSON.parse(stored);
            document.getElementById('filterMarkdown').checked = settings.fileFilters?.markdown !== false;
            document.getElementById('filterText').checked = settings.fileFilters?.text !== false;
            document.getElementById('filterJson').checked = settings.fileFilters?.json || false;
        }
    }

    clearDirectorySettings() {
        localStorage.removeItem('journey.directorySettings');
    }

    selectAllFiles() {
        const fileItems = document.querySelectorAll('.file-item');
        fileItems.forEach(item => {
            if (item.style.display !== 'none') {
                const checkbox = item.querySelector('input[type="checkbox"]');
                if (checkbox) checkbox.checked = true;
            }
        });
        this.updateLoadButtonState();
    }

    selectNoneFiles() {
        const fileItems = document.querySelectorAll('.file-item');
        fileItems.forEach(item => {
            if (item.style.display !== 'none') {
                const checkbox = item.querySelector('input[type="checkbox"]');
                if (checkbox) checkbox.checked = false;
            }
        });
        this.updateLoadButtonState();
    }

    filterFileList(filterText) {
        const fileItems = document.querySelectorAll('.file-item');
        const searchTerm = filterText.toLowerCase().trim();
        let visibleCount = 0;

        fileItems.forEach(item => {
            const fileName = item.querySelector('.file-name').textContent.toLowerCase();
            const filePath = item.querySelector('.file-path').textContent.toLowerCase();

            if (searchTerm === '' || fileName.includes(searchTerm) || filePath.includes(searchTerm)) {
                item.style.display = 'flex';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });

        const fileCount = document.getElementById('fileCount');
        const totalCount = fileItems.length;

        if (searchTerm === '') {
            fileCount.textContent = `${totalCount} files found`;
        } else {
            fileCount.textContent = `${visibleCount} of ${totalCount} files`;
        }
    }

    updateLoadButtonState() {
        const updateBtn = document.getElementById('updateFilesBtn');
        const checkboxes = document.querySelectorAll('#fileList input[type="checkbox"]');

        // Create a Set of open file paths for fast lookup
        const openPaths = new Set(this.files.filter(f => f.type === 'file').map(f => f.path));

        let hasChanges = false;

        for (const cb of checkboxes) {
            const index = parseInt(cb.id.replace('file-', ''));
            const fileInfo = this.foundFiles[index];
            if (!fileInfo) continue;

            const path = fileInfo.relativePath;
            const isChecked = cb.checked;
            const isOpen = openPaths.has(path);

            if (isChecked !== isOpen) {
                hasChanges = true;
                break;
            }
        }

        updateBtn.disabled = !hasChanges;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    saveSelectedFilePaths(filePaths) {
        if (this.selectedDirectory) {
            const key = `journey.selectedFiles_${this.selectedDirectory.name}`;
            localStorage.setItem(key, JSON.stringify(filePaths));
        }
    }

    getSavedSelectedFilePaths() {
        if (this.selectedDirectory) {
            const key = `journey.selectedFiles_${this.selectedDirectory.name}`;
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : null;
        }
        return null;
    }

    async autoLoadPreviouslySelectedFiles(savedFilePaths) {
        try {
            // Find which files from the saved paths still exist
            const existingFiles = this.foundFiles.filter(fileInfo =>
                savedFilePaths.includes(fileInfo.relativePath)
            );

            if (existingFiles.length === 0) {
                this.showMessage('None of the previously selected files were found', 'error');
                return;
            }

            // Update the file list display to show previous selections
            this.displayFileList(this.foundFiles, savedFilePaths);

            // Auto-load the existing files
            let loadedCount = 0;
            for (const fileInfo of existingFiles) {
                try {
                    const content = await fileInfo.file.text();
                    const fileKey = fileInfo.relativePath;

                    // Parse entries
                    const entries = this.parseContentToEntries(content);

                    // Add to directoryEntries
                    this.directoryEntries[fileKey] = content;

                    // Add or update file tab
                    const existingFileIndex = this.files.findIndex(f => f.path === fileKey);

                    const newFileObj = {
                        name: fileInfo.file.name,
                        type: 'file',
                        path: fileKey,
                        content: content,
                        entries: entries,
                        handle: fileInfo.handle
                    };

                    if (existingFileIndex >= 0) {
                        this.files[existingFileIndex] = newFileObj;
                    } else {
                        this.files.push(newFileObj);
                    }

                    loadedCount++;
                } catch (error) {
                    console.warn(`Failed to load file ${fileInfo.file.name}:`, error);
                }
            }

            if (loadedCount > 0) {
                // Refresh UI
                this.renderFileTabs();
                this.refreshView();
                this.updateLoadButtonState();

                // Switch to last loaded? Or just stay.
                // staying is probably safer unless user interaction triggered it.

                const missingCount = savedFilePaths.length - existingFiles.length;
                let message = `Auto-loaded ${loadedCount} previously selected files`;
                if (missingCount > 0) {
                    message += ` (${missingCount} files no longer found)`;
                }
                this.showMessage(message, 'success');
            }

        } catch (error) {
            console.error(error);
            this.showMessage('Failed to auto-load previously selected files', 'error');
        }
    }

    clearSelectedFilePaths() {
        if (this.selectedDirectory) {
            const key = `journey.selectedFiles_${this.selectedDirectory.name}`;
            localStorage.removeItem(key);
        }
    }

    // Configuration Modal Methods
    openConfigModal() {
        const modal = document.getElementById('configModal');
        modal.classList.add('open');
        this.renderPeriodList();
    }

    closeConfigModal() {
        const modal = document.getElementById('configModal');
        modal.classList.remove('open');
        this.cancelEdit();
    }

    renderPeriodList() {
        const list = document.getElementById('periodList');
        list.innerHTML = '';

        this.pastPeriods.forEach((period, index) => {
            const item = document.createElement('div');
            item.className = 'period-item';
            item.draggable = true;
            item.dataset.index = index;

            // Drag Handle
            const dragHandle = document.createElement('span');
            dragHandle.className = 'drag-handle';
            dragHandle.innerHTML = '⋮⋮';
            item.appendChild(dragHandle);

            // Drag Events
            item.addEventListener('dragstart', (e) => {
                item.classList.add('dragging');
                e.dataTransfer.setData('text/plain', index);
                e.dataTransfer.effectAllowed = 'move';
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                const draggingItems = list.querySelectorAll('.dragging');
                draggingItems.forEach(i => i.classList.remove('dragging'));
                this.updatePeriodsFromDOM();
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';

                const draggingItem = list.querySelector('.dragging');
                if (!draggingItem || draggingItem === item) return;

                const box = item.getBoundingClientRect();
                const offset = e.clientY - box.top - box.height / 2;

                if (offset < 0) {
                    list.insertBefore(draggingItem, item);
                } else {
                    list.insertBefore(draggingItem, item.nextSibling);
                }
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                this.updatePeriodsFromDOM();
            });

            const info = document.createElement('div');
            info.className = 'period-info';

            const label = document.createElement('div');
            label.className = 'period-label';
            label.textContent = period.label;

            const details = document.createElement('div');
            details.className = 'period-details';
            details.textContent = `${period.value} ${period.unit} ago`;

            info.appendChild(label);
            info.appendChild(details);
            item.appendChild(info);

            const actions = document.createElement('div');
            actions.className = 'period-actions';

            const editBtn = document.createElement('button');
            editBtn.className = 'period-edit';
            editBtn.innerHTML = '✏️';
            editBtn.title = 'Edit period';
            editBtn.addEventListener('click', () => this.editPeriod(period.id));

            const removeBtn = document.createElement('button');
            removeBtn.className = 'period-remove';
            removeBtn.innerHTML = '🗑️';
            removeBtn.title = 'Remove period';
            removeBtn.addEventListener('click', () => this.removePeriod(period.id));

            actions.appendChild(editBtn);
            actions.appendChild(removeBtn);
            item.appendChild(actions);
            list.appendChild(item);
        });
    }

    updatePeriodsFromDOM() {
        const list = document.getElementById('periodList');
        const items = list.querySelectorAll('.period-item');
        const newPeriods = [];

        items.forEach(item => {
            const index = parseInt(item.dataset.index);
            newPeriods.push(this.pastPeriods[index]);
        });

        this.pastPeriods = newPeriods;
        this.savePastPeriods();
        this.renderFilterButtons();
        // Re-render list to reset dataset indexes and event listeners
        this.renderPeriodList();
    }

    addPeriod() {
        const labelInput = document.getElementById('newPeriodLabel');
        const valueInput = document.getElementById('newPeriodValue');
        const unitInput = document.getElementById('newPeriodUnit');

        const label = labelInput.value.trim();
        const value = parseInt(valueInput.value);
        const unit = unitInput.value;

        if (!label) {
            this.showMessage('Please enter a label', 'error');
            return;
        }

        if (value < 1) {
            this.showMessage('Value must be at least 1', 'error');
            return;
        }

        if (this.editingPeriodId) {
            const index = this.pastPeriods.findIndex(p => p.id === this.editingPeriodId);
            if (index !== -1) {
                this.pastPeriods[index].label = label;
                this.pastPeriods[index].value = value;
                this.pastPeriods[index].unit = unit;
                this.showMessage('Period updated', 'success');
            }
            this.cancelEdit();
        } else {
            const newPeriod = {
                id: `p_${Date.now()}`,
                label,
                value,
                unit
            };

            this.pastPeriods.push(newPeriod);
            this.showMessage('Period added', 'success');
        }

        this.savePastPeriods();
        this.renderPeriodList();
        this.renderFilterButtons();

        // Reset inputs (already handled in cancelEdit for update case)
        if (!this.editingPeriodId) {
            labelInput.value = '';
            valueInput.value = '1';
            unitInput.value = 'days';
        }
    }

    editPeriod(id) {
        const period = this.pastPeriods.find(p => p.id === id);
        if (!period) return;

        this.editingPeriodId = id;

        document.getElementById('newPeriodLabel').value = period.label;
        document.getElementById('newPeriodValue').value = period.value;
        document.getElementById('newPeriodUnit').value = period.unit;

        document.getElementById('addPeriodBtn').textContent = 'Update Period';
        document.getElementById('cancelEditBtn').style.display = 'block';

        // Scroll to form
        document.querySelector('.add-period-form').scrollIntoView({ behavior: 'smooth' });
    }

    cancelEdit() {
        this.editingPeriodId = null;

        document.getElementById('newPeriodLabel').value = '';
        document.getElementById('newPeriodValue').value = '1';
        document.getElementById('newPeriodUnit').value = 'days';

        document.getElementById('addPeriodBtn').textContent = 'Add Period';
        document.getElementById('cancelEditBtn').style.display = 'none';
    }

    removePeriod(id) {
        if (this.pastPeriods.length <= 1) {
            this.showMessage('You must have at least one period', 'error');
            return;
        }

        if (this.editingPeriodId === id) {
            this.cancelEdit();
        }

        this.pastPeriods = this.pastPeriods.filter(p => p.id !== id);

        // If we removed the active filter, switch to the first available one
        if (this.currentFilter === id) {
            this.currentFilter = this.pastPeriods[0].id;
            this.filterPastEntries(this.currentFilter);
        }

        this.savePastPeriods();
        this.renderPeriodList();
        this.renderFilterButtons();
        this.showMessage('Period removed', 'info');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DailyJournal();
});
