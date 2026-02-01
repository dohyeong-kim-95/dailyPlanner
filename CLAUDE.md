# CLAUDE.md - AI Development Guide

## Project Overview

**Name:** Daily Planner v2.0
**Purpose:** Personal work time management tool
**User:** Single user, PC only, workplace internal use
**Language:** English
**Timezone:** KST (UTC+9)

---

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Structure | HTML5 | Single page |
| Styling | CSS3 | Flexbox, Grid, Variables |
| Logic | Vanilla JS | ES6+, no frameworks |
| Storage | localStorage | Single key: 'dailyPlanner' |
| Export | Blob API | CSV, JSON, Markdown |

**Philosophy:** MVP, no over-engineering, no dependencies

---

## File Structure

```
daily-planner/
├── index.html      # UI structure & modals
├── style.css       # All styling
├── script.js       # All logic (~1800 lines)
├── CLAUDE.md       # This file (AI context)
├── PRD.md          # Product requirements
├── TRD.md          # Technical requirements
├── TODO.md         # Development log
└── backup/         # Original v1 code (don't modify)
```

---

## Code Conventions

### JavaScript
- camelCase for variables/functions
- UPPER_CASE for constants
- Functions should be < 40 lines
- Comments only for non-obvious logic
- Use template literals for HTML generation

### CSS
- Use CSS variables (defined in :root)
- BEM-like naming (.block-element)
- Mobile styles in @media block at end

### HTML
- Semantic elements where possible
- IDs for JS hooks, classes for styling
- Data attributes for state (data-type, data-id)

---

## Key Constants

```javascript
// Time
HOURS = [7..20]  // 7AM - 8PM
MINUTES = [0, 10, 20, 30, 40, 50]

// Block colors (time categories)
BLOCK_COLORS = { useless, work, rest, nonwork }

// TODO colors (Eisenhower matrix)
TODO_COLORS = { urgentImportant, urgentNotImportant, notUrgentImportant, notUrgentNotImportant }

// Limits
MAX_TODO_ITEMS = 7
MAX_DDAYS = 3
```

---

## Data Structure

```javascript
{
  "_globalNotes": "string",  // Persists across days
  "_ddays": [{ id, title, emoji, date }],  // Up to 3 D-DAYs
  "YYYY-MM-DD": {
    "plan": [{ id, startTime, endTime, title, color }],
    "real": [{ id, startTime, endTime, title, color }],
    "todo": [{ id, title, color, done }]
  }
}
```

---

## Current Features

- [x] Time blocks (PLAN vs REAL)
- [x] TODO list (max 7, Eisenhower priority)
- [x] Global notes
- [x] Daily summary (header)
- [x] Live KST clock
- [x] Export (CSV/JSON/Markdown)
- [x] Backup/Import
- [x] Data retention (current month)
- [x] Keyboard shortcuts
- [x] **NEW** D-DAY Dashboard (up to 3)
- [x] **NEW** Calendar picker (double-click date)
- [x] **NEW** Day of week display

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Ctrl+S | Export daily CSV |
| Ctrl+B | Backup all |
| Ctrl+T | Add TODO |
| Ctrl+D | Add D-DAY |
| Ctrl+← | Previous day |
| Ctrl+→ | Next day |

---

## Development Guidelines

### Do
- Keep it simple (MVP)
- Test in Chrome/Edge
- Use KST for all dates
- Update docs after changes
- Backup before major changes

### Don't
- Add external dependencies
- Support mobile (PC only)
- Over-engineer
- Leave console.logs
- Modify backup/ folder

---

## Common Tasks

### Add new feature
1. Update PRD.md with requirements
2. Update TRD.md with technical details
3. Implement in script.js
4. Add styles to style.css
5. Update TODO.md
6. Test and commit

### Fix bug
1. Reproduce the issue
2. Find root cause in script.js
3. Fix and test
4. Commit with "fix:" prefix

---

## Future Enhancements (Post-MVP)

- Weekly/Monthly view
- Charts/Graphs
- Dark mode
- Print view
- Browser notifications

---

## Contact

**Developer:** dohyeong-kim
**Email:** boson95@gmail.com
