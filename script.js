class DailyJournal {
    constructor() {
        this.entries = this.loadEntries();
        this.directoryEntries = this.loadDirectoryEntries();
        this.currentFilter = 'yesterday';
        this.currentCalendarYear = new Date().getFullYear();
        this.similarEntriesTimeout = null;
        this.selectedDate = new Date();
        this.init();
    }

    init() {
        this.initializeDatePicker();
        this.bindEvents();

        // Parse directory entries on load
        if (Object.keys(this.directoryEntries).length > 0) {
            this.parseAllDirectoryEntries();
        }

        this.generateYearTabs();
        this.generateActivityCalendar();
        this.displayPastEntries();
        this.loadSelectedEntry();
        this.loadDirectorySettings();
    }

    initializeDatePicker() {
        const datePicker = document.getElementById('datePicker');
        datePicker.value = this.getDateString(this.selectedDate);
    }

    bindEvents() {
        document.getElementById('datePicker').addEventListener('change', (e) => this.onDateChange(e));
        document.getElementById('saveEntry').addEventListener('click', () => this.saveEntry());
        document.getElementById('clearEntry').addEventListener('click', () => this.clearEntry());
        document.getElementById('entryText').addEventListener('input', (e) => this.onEntryInput(e));

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.filterPastEntries(e.target.dataset.filter));
        });

        document.getElementById('importBtn').addEventListener('click', () => this.importJournal());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportJournal());
        document.getElementById('importFile').addEventListener('change', (e) => this.handleFileImport(e));

        document.getElementById('selectDirectoryBtn').addEventListener('click', () => this.selectDirectory());
        document.getElementById('loadSelectedBtn').addEventListener('click', () => this.loadSelectedFiles());
        document.getElementById('clearDirectoryBtn').addEventListener('click', () => this.clearDirectory());
        document.getElementById('selectAllFilesBtn').addEventListener('click', () => this.selectAllFiles());
        document.getElementById('selectNoneFilesBtn').addEventListener('click', () => this.selectNoneFiles());
        document.getElementById('fileFilterInput').addEventListener('input', (e) => this.filterFileList(e.target.value));
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

    loadEntries() {
        const stored = localStorage.getItem('journey.journalEntries');
        return stored ? JSON.parse(stored) : {};
    }

    saveEntries() {
        localStorage.setItem('journey.journalEntries', JSON.stringify(this.entries));
    }

    loadDirectoryEntries() {
        const stored = localStorage.getItem('journey.directoryEntries');
        return stored ? JSON.parse(stored) : {};
    }

    saveDirectoryEntries() {
        localStorage.setItem('journey.directoryEntries', JSON.stringify(this.directoryEntries));
    }

    loadSelectedEntry() {
        const selectedDateStr = this.getDateString(this.selectedDate);
        const entry = this.entries[selectedDateStr] || '';
        document.getElementById('entryText').value = entry;
    }

    saveEntry() {
        const selectedDateStr = this.getDateString(this.selectedDate);
        const entryText = document.getElementById('entryText').value.trim();

        if (entryText) {
            this.entries[selectedDateStr] = entryText;
            this.saveEntries();
            this.generateYearTabs();
            this.generateActivityCalendar();
            this.displayPastEntries();
            this.showMessage('Entry saved successfully!', 'success');
        } else {
            delete this.entries[selectedDateStr];
            this.saveEntries();
            this.generateYearTabs();
            this.generateActivityCalendar();
            this.displayPastEntries();
            this.showMessage('Entry cleared.', 'info');
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

        Object.keys(this.entries).forEach(date => {
            if (date === selectedDateStr) return;

            const entryText = this.entries[date];
            const entryWords = this.extractKeywords(entryText);

            // Check for exact substring matches (for names, specific phrases)
            const containsMatch = entryText.toLowerCase().includes(searchText);

            // Calculate keyword-based similarity
            const keywordSimilarity = this.calculateSimilarity(words, entryWords);

            // Combine both approaches: exact matches get higher priority
            let finalScore = keywordSimilarity;
            if (containsMatch) {
                finalScore = Math.max(0.8, keywordSimilarity); // Boost exact matches
            }

            if (finalScore > 0.1 || containsMatch) {
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

    calculateSimilarity(words1, words2) {
        const set1 = new Set(words1);
        const set2 = new Set(words2);
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);

        return union.size > 0 ? intersection.size / union.size : 0;
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
            return;
        }

        container.innerHTML = filteredEntries.map(entry => `
            <div class="entry-item">
                <div class="entry-date">${this.formatDate(entry.date)}</div>
                <div class="entry-content">${entry.content}</div>
            </div>
        `).join('');
    }

    getFilteredEntries() {
        const selectedDateStr = this.getDateString(this.selectedDate);

        return Object.keys(this.entries)
            .filter(date => {
                if (date === selectedDateStr) return false;

                // Parse date string properly to avoid timezone issues
                const [year, month, day] = date.split('-').map(Number);
                const entryDate = new Date(year, month - 1, day);

                switch (this.currentFilter) {
                    case 'yesterday': {
                        // Show only yesterday's entry
                        const yesterday = new Date(this.selectedDate);
                        yesterday.setDate(yesterday.getDate() - 1);
                        return date === this.getDateString(yesterday);
                    }
                    case 'lastWeek': {
                        // Show only the entry from 7 days ago
                        const lastWeek = new Date(this.selectedDate);
                        lastWeek.setDate(lastWeek.getDate() - 7);
                        return date === this.getDateString(lastWeek);
                    }
                    case 'lastMonth': {
                        // Show only the entry from the same day last month
                        const lastMonth = new Date(this.selectedDate);
                        lastMonth.setMonth(lastMonth.getMonth() - 1);
                        return date === this.getDateString(lastMonth);
                    }
                    case 'lastYear': {
                        // Show only the entry from the same day last year
                        const lastYear = new Date(this.selectedDate);
                        lastYear.setFullYear(lastYear.getFullYear() - 1);
                        return date === this.getDateString(lastYear);
                    }
                    default:
                        return false;
                }
            })
            .sort((a, b) => new Date(b) - new Date(a))
            .map(date => ({
                date,
                content: this.entries[date]
            }));
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

        // Get all years that have entries
        const entryYears = new Set();
        Object.keys(this.entries).forEach(dateString => {
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
        // Continue until we're past December 31st of the selected year
        while (currentDate.getFullYear() <= this.currentCalendarYear) {
            for (let day = 0; day < 7; day++) {
                days.push(new Date(currentDate));
                currentDate.setDate(currentDate.getDate() + 1);

                // Break if we've gone past the year
                if (currentDate.getFullYear() > this.currentCalendarYear && currentDate.getDate() > 7) {
                    break;
                }
            }

            // Break if we've covered enough weeks past the end of the year
            if (currentDate.getFullYear() > this.currentCalendarYear && currentDate.getDate() > 7) {
                break;
            }
        }

        // Generate month labels
        this.generateMonthLabels(days, monthsContainer);

        // Generate calendar days
        days.forEach((date, index) => {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';

            const dateString = this.getDateString(date);
            const hasEntry = this.entries.hasOwnProperty(dateString);
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

        // Create 53 month label slots (one for each week)
        for (let week = 0; week < 53; week++) {
            const weekStartDate = days[week * 7];
            const month = weekStartDate.getMonth();

            const monthElement = document.createElement('div');
            monthElement.className = 'calendar-month';

            // Only show month name if it's a new month and we're not at the very start
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

    showEntryModal(dateString) {
        const entry = this.entries[dateString];
        if (!entry) return;

        // Use format date to avoid timezone issues
        // We want the long format here, so we might need to adjust formatDate or just do it locally but safely
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        const formattedDate = date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });

        // Create modal elements
        const modal = document.createElement('div');
        modal.className = 'entry-modal';

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';

        modalContent.innerHTML = `
            <div class="modal-header">
                <h3>${formattedDate}</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="entry-content">${entry.replace(/\n/g, '<br>')}</div>
            </div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Add event listeners
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => this.closeEntryModal());

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeEntryModal();
            }
        });

        document.addEventListener('keydown', this.handleModalKeydown.bind(this));

        // Show modal with animation
        setTimeout(() => modal.classList.add('show'), 10);
    }

    closeEntryModal() {
        const modal = document.querySelector('.entry-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
        document.removeEventListener('keydown', this.handleModalKeydown);
    }

    handleModalKeydown(e) {
        if (e.key === 'Escape') {
            this.closeEntryModal();
        }
    }

    scrollToEntry(dateString) {
        // Switch to appropriate filter and scroll to entry
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        const today = new Date();
        // Reset today to midnight for accurate day difference comparison
        today.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.floor((today - date) / (1000 * 60 * 60 * 24));

        let filter = 'lastYear';
        if (daysDiff === 1) filter = 'yesterday';
        else if (daysDiff <= 7) filter = 'lastWeek';
        else if (daysDiff <= 30) filter = 'lastMonth';

        this.filterPastEntries(filter);

        // Scroll to past entries section
        document.querySelector('.past-entries').scrollIntoView({
            behavior: 'smooth'
        });
    }

    importJournal() {
        document.getElementById('importFile').click();
    }

    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.parseImportedContent(e.target.result);
                this.saveEntries();
                this.generateYearTabs();
                this.generateActivityCalendar();
                this.displayPastEntries();
                this.loadSelectedEntry();
                this.showMessage('Journal imported successfully!', 'success');
            } catch (error) {
                this.showMessage('Error importing journal. Please check the file format.', 'error');
            }
        };
        reader.readAsText(file);
    }

    parseImportedContent(content) {
        // Try multiple date formats
        const markdownDateRegex = /^#\s*(\d{4}-\d{2}-\d{2})$/gm;
        const rawDateRegex = /^(\d{8}|\d{4}-\d{2}-\d{2}|\d{4}\/\d{2}\/\d{2})$/gm;

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
                            this.entries[normalizedDate] = currentEntry.join('\n').trim();
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
                    this.entries[normalizedDate] = currentEntry.join('\n').trim();
                }
            }
        } else {
            // Process markdown format
            for (let i = 0; i < sections.length; i += 2) {
                const date = sections[i].trim();
                const entryContent = sections[i + 1] ? sections[i + 1].trim() : '';

                if (entryContent && this.isValidDate(date)) {
                    this.entries[date] = entryContent;
                }
            }
        }
    }

    parseAllDirectoryEntries() {
        // Parse all directory entries and merge them into this.entries
        Object.keys(this.directoryEntries).forEach(fileKey => {
            const content = this.directoryEntries[fileKey];
            this.parseImportedContent(content);
        });
        this.saveEntries();
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
        const sortedDates = Object.keys(this.entries).sort();
        const markdown = sortedDates.map(date =>
            `# ${date}\n\n${this.entries[date]}\n`
        ).join('\n');

        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `journal-export-${this.getDateString()}.md`;
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
            const loadBtn = document.getElementById('loadSelectedBtn');

            fileListContainer.style.display = 'block';
            loadBtn.disabled = false;

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

    async loadSelectedFiles() {
        const checkboxes = document.querySelectorAll('#fileList input[type="checkbox"]:checked');
        const selectedIndexes = Array.from(checkboxes).map(cb => parseInt(cb.id.replace('file-', '')));

        if (selectedIndexes.length === 0) {
            this.showMessage('Please select at least one file to load', 'error');
            return;
        }

        try {
            let loadedCount = 0;

            for (const index of selectedIndexes) {
                try {
                    const fileInfo = this.foundFiles[index];
                    const content = await fileInfo.file.text();
                    const fileName = fileInfo.file.name;
                    const fileKey = fileInfo.relativePath; // Use file path as unique key for directory files

                    // Store directory-loaded files separately with file path as key
                    if (!this.directoryEntries) {
                        this.directoryEntries = {};
                    }
                    this.directoryEntries[fileKey] = content;
                    loadedCount++;
                } catch (error) {
                    console.warn(`Failed to load file ${this.foundFiles[index].file.name}:`, error);
                }
            }

            if (loadedCount > 0) {
                // Save the selected file paths for future auto-loading
                const selectedFilePaths = selectedIndexes.map(index => this.foundFiles[index].relativePath);
                this.saveSelectedFilePaths(selectedFilePaths);

                this.saveDirectoryEntries();

                // Parse all directory entries and merge into main entries
                this.parseAllDirectoryEntries();

                this.generateYearTabs();
                this.generateActivityCalendar();
                this.displayPastEntries();
                this.loadSelectedEntry();
                this.showMessage(`Successfully loaded ${loadedCount} of ${selectedIndexes.length} selected files`, 'success');
            } else {
                this.showMessage('No valid content found in selected files', 'error');
            }

        } catch (error) {
            this.showMessage('Failed to load selected files', 'error');
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

    extractDateFromContent(content, fileName) {
        const dateRegex = /(\d{4}-\d{2}-\d{2})/;

        let match = content.match(dateRegex);
        if (match) return match[1];

        match = fileName.match(dateRegex);
        if (match) return match[1];

        const today = this.getDateString();
        return today;
    }

    clearDirectory() {
        this.selectedDirectory = null;

        const directoryInfo = document.getElementById('directoryInfo');
        const fileListContainer = document.getElementById('fileListContainer');
        const loadBtn = document.getElementById('loadSelectedBtn');
        const clearBtn = document.getElementById('clearDirectoryBtn');

        directoryInfo.style.display = 'none';
        fileListContainer.style.display = 'none';
        loadBtn.disabled = true;
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
        const checkboxes = document.querySelectorAll('#fileList input[type="checkbox"]:checked');
        const loadBtn = document.getElementById('loadSelectedBtn');
        loadBtn.disabled = checkboxes.length === 0;
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
                    const fileKey = fileInfo.relativePath; // Use file path as unique key

                    // Store directory-loaded files separately with file path as key
                    if (!this.directoryEntries) {
                        this.directoryEntries = {};
                    }
                    this.directoryEntries[fileKey] = content;
                    loadedCount++;
                } catch (error) {
                    console.warn(`Failed to load file ${fileInfo.file.name}:`, error);
                }
            }

            if (loadedCount > 0) {
                this.saveDirectoryEntries();

                // Parse all directory entries and merge into main entries
                this.parseAllDirectoryEntries();

                this.generateYearTabs();
                this.generateActivityCalendar();
                this.displayPastEntries();
                this.loadSelectedEntry();

                const missingCount = savedFilePaths.length - existingFiles.length;
                let message = `Auto-loaded ${loadedCount} previously selected files`;
                if (missingCount > 0) {
                    message += ` (${missingCount} files no longer found)`;
                }
                this.showMessage(message, 'success');
            }

        } catch (error) {
            this.showMessage('Failed to auto-load previously selected files', 'error');
        }
    }

    clearSelectedFilePaths() {
        if (this.selectedDirectory) {
            const key = `journey.selectedFiles_${this.selectedDirectory.name}`;
            localStorage.removeItem(key);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DailyJournal();
});