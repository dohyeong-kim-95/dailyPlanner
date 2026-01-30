# TRD - Daily Planner v2.0

## Technical Overview

Vanilla JavaScript single-page application with no external dependencies. All data stored in browser localStorage. Timezone: KST (Korea Standard Time).

---

## Architecture

```
daily-planner/
├── index.html      # Structure & modals
├── style.css       # Styling & layout
├── script.js       # Application logic
├── PRD.md          # Product requirements
├── TRD.md          # Technical requirements
├── TODO.md         # Development tasks
└── backup/         # Original v1 code backup
```

**No build process. No frameworks. Direct file serving.**

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Structure | HTML5 |
| Styling | CSS3 (Flexbox, Grid, CSS Variables) |
| Logic | Vanilla JavaScript (ES6+) |
| Storage | localStorage API |
| Export | Blob API + download attribute |
| Timezone | KST (UTC+9) via custom function |

---

## Data Models

### localStorage Key
```
Key: 'dailyPlanner'
```

### Data Structure
```javascript
{
  "_globalNotes": "SEMINAR DUE: Feb 10\nMeeting notes...",
  "2025-01-30": {
    "plan": [
      {
        "id": "m5abc123def",
        "startTime": "09:00",
        "endTime": "10:30",
        "title": "Meeting",
        "color": "#BAE1FF"
      }
    ],
    "real": [...],
    "todo": [
      {
        "id": "m5xyz789ghi",
        "title": "Review PR",
        "color": "#F8B4B4",
        "done": false
      }
    ]
  }
}
```

### Time Block Schema
```typescript
interface TimeBlock {
  id: string;           // Unique ID: timestamp_random
  startTime: string;    // "HH:MM" format (07:00 - 20:00)
  endTime: string;      // "HH:MM" format
  title: string;        // User input
  color: string;        // Hex color code
}
```

### TODO Item Schema
```typescript
interface TodoItem {
  id: string;           // Unique ID: timestamp_random
  title: string;        // User input
  color: string;        // Priority color (hex)
  done: boolean;        // Completion status
}
```

---

## Constants

### Time Configuration
```javascript
const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const MINUTES = [0, 10, 20, 30, 40, 50];
```

### Block Colors (Time Categories)
```javascript
const BLOCK_COLORS = {
  useless: '#FFB3BA',    // Red
  work: '#BAE1FF',       // Blue
  rest: '#BAFFC9',       // Green
  nonwork: '#E0E0E0'     // Gray
};
```

### TODO Priority Colors (Soft Pastels)
```javascript
const TODO_COLORS = {
  urgentImportant: '#F8B4B4',      // Soft Red
  urgentNotImportant: '#FDE68A',   // Soft Yellow
  notUrgentImportant: '#A7F3D0',   // Soft Mint
  notUrgentNotImportant: '#E5E7EB' // Soft Gray
};
```

### Limits
```javascript
const MAX_TODO_ITEMS = 7;
```

---

## Core Functions

### Initialization
```javascript
init()                    // Main initialization
cleanOldData()            // Remove data from previous months
startClock()              // Start live clock display
```

### Timezone
```javascript
getKSTDateString(date)    // Get date string in KST (UTC+9)
```

### Data Management
```javascript
getData()                 // Get all data from localStorage
saveData()                // Save data to localStorage
getDayData(date)          // Get data for specific date
generateId()              // Generate unique ID
```

### Time Block Operations
```javascript
createTimeGrid()          // Build time grid UI
renderBlocks()            // Render all blocks
saveBlock()               // Save new block
deleteBlock()             // Delete block
copyBlock()               // Copy PLAN block to REAL
copyAllBlocks()           // Copy all PLAN to REAL
checkOverlap()            // Validate no overlap
splitBlockByHour()        // Split multi-hour blocks
calculateBlockPosition()  // Calculate pixel coordinates
```

### Daily Summary
```javascript
calculateSummaryForType(type)   // Sum hours by category
calculateSummaryForDate(date)   // Summary for specific date
formatDuration(minutes)         // Format as "Xh Ym"
formatDiff(diff)                // Format difference with sign
renderDailySummary()            // Display in header
```

### Notes (Global)
```javascript
setupNotesEventListeners()  // Auto-save on input
saveNotes(text)             // Save to _globalNotes
renderNotes()               // Load notes to textarea
```

### TODO Operations
```javascript
renderTodoList()            // Render TODO and DONE lists
saveTodo()                  // Add new TODO (if < 7)
editTodoTitle()             // Inline editing
toggleTodoPriority(id)      // Right-click color cycle
toggleTodoComplete(id)      // Move between TODO/DONE
deleteTodo(id)              // Remove (no confirmation)
carryOverTodos()            // Copy from yesterday
```

### Date Navigation
```javascript
goToPreviousDay()           // Navigate to previous day
goToNextDay()               // Navigate to next day
getYesterday(dateStr)       // Get previous day string
```

### Export Functions
```javascript
downloadFile(content, filename, type)  // Trigger download
exportDailyCSV()            // Export single day as CSV
exportDailyJSON()           // Export single day as JSON
exportWeeklyCSV()           // Export week summary as CSV
exportWeeklyJSON()          // Export week data as JSON
exportForLLM()              // Export Markdown report
getCurrentWeekDates()       // Get Mon-Sun dates
```

### Backup Functions
```javascript
backupAllData()             // Export all data as JSON
importBackup(file)          // Import and restore backup
```

### Keyboard Shortcuts
```javascript
setupKeyboardShortcuts()    // Register all shortcuts
// Ctrl+S → exportDailyCSV()
// Ctrl+B → backupAllData()
// Ctrl+T → openTodoModal()
// Ctrl+← → goToPreviousDay()
// Ctrl+→ → goToNextDay()
```

---

## UI Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ Daily Planner  14:35:22    Work:4h(-1h) Rest:2h(+30m)   [Export] │
│                      ◀  2025-01-30  ▶                            │
├──────────────────────────────────────────────────────────────────┤
│ Notes (Global)                                                   │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ SEMINAR DUE: Feb 10                                          │ │
│ └──────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────┤
│         PLAN             │ → │          REAL                     │
│  ┌───┬───┬───┬───┬───┐   │   │  ┌───┬───┬───┬───┬───┐           │
│07│   │   │   │   │   │   │   │07│   │   │   │   │   │           │
│08│███████████│   │   │   │   │08│███████│   │   │   │           │
│  └───┴───┴───┴───┴───┘   │   │  └───┴───┴───┴───┴───┘           │
├──────────────────────────────────────────────────────────────────┤
│  TODO (3/7)       [+Add] [Carry]  │        DONE                  │
│ ┌─────────┐ ┌─────────┐          │ ┌─────────┐ ┌─────────┐      │
│ │ Task 1  │ │ Task 2  │          │ │ ~~Done~~ │ │ ~~Done~~ │      │
│ └─────────┘ └─────────┘          │ └─────────┘ └─────────┘      │
│  Legend: 🔴Urgent+Imp 🟡Urgent 🟢Important ⚪Neither              │
└──────────────────────────────────────────────────────────────────┘
```

---

## Export Formats

### Daily CSV
```csv
Type,Start,End,Title,Category
PLAN,09:00,10:30,Meeting,Work
REAL,09:00,10:00,Meeting,Work

TODO Status,Title,Priority
DONE,Review PR,Urgent+Important
TODO,Write docs,Important
```

### Daily JSON
```json
{
  "date": "2025-01-30",
  "plan": [...],
  "real": [...],
  "todo": [...],
  "summary": {
    "plan": { "work": 360, "rest": 60 },
    "real": { "work": 300, "rest": 90 }
  }
}
```

### Weekly CSV
```csv
Date,Plan_Work,Plan_Rest,Real_Work,Real_Rest,Real_Useless
2025-01-27,360,60,300,90,30
TOTAL,2520,420,2100,630,210
```

### LLM Markdown
```markdown
# Weekly Time Report
**Week:** 2025-01-27 to 2025-02-02

## Notes & Reminders
SEMINAR DUE: Feb 10

## Weekly Summary (in minutes)
| Date | Plan Work | Real Work | Real Useless |
|------|-----------|-----------|--------------|
| 2025-01-27 | 360 | 300 | 30 |

## Weekly Totals (hours)
- **Planned Work:** 42h
- **Actual Work:** 35h (-7h)
- **Useless Time:** 3h30m

## Daily Details
### 2025-01-27
**Completed:**
- Review PR
- Meeting prep
```

---

## Event Handling

### Mouse Events (Time Grid)
```javascript
mousedown  → Start selection
mousemove  → Extend selection / Resize block
mouseup    → End selection / End resize
dblclick   → Delete block
```

### Mouse Events (TODO)
```javascript
click (checkbox)  → Toggle complete
click (title)     → Edit inline
click (×)         → Delete
contextmenu       → Cycle priority color
```

### Keyboard Events
```javascript
Ctrl+S     → Export daily CSV
Ctrl+B     → Backup all data
Ctrl+T     → Add TODO
Ctrl+←     → Previous day
Ctrl+→     → Next day
Enter      → Confirm modal
Escape     → Close modal
```

---

## Browser Compatibility

- Target: Modern Chrome/Edge (latest 2 versions)
- Required APIs: localStorage, Blob, ES6+
- No polyfills needed for PC-only use

---

## Performance Considerations

- Single localStorage document
- Direct DOM manipulation
- Monthly data cleanup on init
- No external resources (instant load)
- Debounced auto-save for notes (500ms)
- Clock updates every second via setInterval
