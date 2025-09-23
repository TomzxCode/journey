class DailyJournal {
    constructor() {
        this.entries = this.loadEntries();
        this.currentFilter = 'yesterday';
        this.currentCalendarYear = new Date().getFullYear();
        this.init();
    }

    init() {
        this.updateCurrentDate();
        this.bindEvents();
        this.generateYearTabs();
        this.generateActivityCalendar();
        this.displayPastEntries();
        this.loadTodaysEntry();
    }

    updateCurrentDate() {
        const today = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        document.getElementById('currentDate').textContent = today.toLocaleDateString('en-US', options);
    }

    bindEvents() {
        document.getElementById('saveEntry').addEventListener('click', () => this.saveEntry());
        document.getElementById('clearEntry').addEventListener('click', () => this.clearEntry());
        document.getElementById('entryText').addEventListener('input', (e) => this.onEntryInput(e));

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.filterPastEntries(e.target.dataset.filter));
        });

        document.getElementById('importBtn').addEventListener('click', () => this.importJournal());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportJournal());
        document.getElementById('importFile').addEventListener('change', (e) => this.handleFileImport(e));
    }

    getDateString(date = new Date()) {
        return date.toISOString().split('T')[0];
    }

    loadEntries() {
        const stored = localStorage.getItem('journalEntries');
        return stored ? JSON.parse(stored) : {};
    }

    saveEntries() {
        localStorage.setItem('journalEntries', JSON.stringify(this.entries));
    }

    loadTodaysEntry() {
        const today = this.getDateString();
        const todaysEntry = this.entries[today] || '';
        document.getElementById('entryText').value = todaysEntry;
    }

    saveEntry() {
        const today = this.getDateString();
        const entryText = document.getElementById('entryText').value.trim();

        if (entryText) {
            this.entries[today] = entryText;
            this.saveEntries();
            this.generateYearTabs();
            this.generateActivityCalendar();
            this.displayPastEntries();
            this.showMessage('Entry saved successfully!', 'success');
        } else {
            delete this.entries[today];
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
        this.findSimilarEntries(text);
    }

    findSimilarEntries(currentText) {
        if (currentText.length < 10) {
            document.getElementById('similarEntriesContainer').innerHTML = '';
            return;
        }

        const words = this.extractKeywords(currentText);
        const similarEntries = [];
        const today = this.getDateString();

        Object.keys(this.entries).forEach(date => {
            if (date === today) return;

            const entryText = this.entries[date];
            const entryWords = this.extractKeywords(entryText);
            const similarity = this.calculateSimilarity(words, entryWords);

            if (similarity > 0.2) {
                similarEntries.push({
                    date,
                    content: entryText,
                    similarity
                });
            }
        });

        similarEntries.sort((a, b) => b.similarity - a.similarity);
        this.displaySimilarEntries(similarEntries.slice(0, 3));
    }

    extractKeywords(text) {
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their']);

        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.has(word));
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
        const today = new Date();
        const todayStr = this.getDateString(today);

        return Object.keys(this.entries)
            .filter(date => {
                if (date === todayStr) return false;

                const entryDate = new Date(date);
                const daysDiff = Math.floor((today - entryDate) / (1000 * 60 * 60 * 24));

                switch (this.currentFilter) {
                    case 'yesterday':
                        return daysDiff === 1;
                    case 'lastWeek':
                        return daysDiff >= 1 && daysDiff <= 7;
                    case 'lastMonth':
                        return daysDiff >= 1 && daysDiff <= 30;
                    case 'lastYear':
                        return daysDiff >= 1 && daysDiff <= 365;
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
        const date = new Date(dateString);
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
            const year = new Date(dateString).getFullYear();
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
                dayElement.addEventListener('click', () => this.scrollToEntry(dateString));
            }

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
        const date = new Date(dateString);
        const formattedDate = date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

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

    scrollToEntry(dateString) {
        // Switch to appropriate filter and scroll to entry
        const date = new Date(dateString);
        const today = new Date();
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
                this.loadTodaysEntry();
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
}

document.addEventListener('DOMContentLoaded', () => {
    new DailyJournal();
});