# PRD - Daily Planner v2.0

## Overview

A personal work time management tool for tracking planned vs actual time usage with integrated TODO list and notes functionality.

---

## Goals

1. Track daily work time with PLAN vs REAL comparison
2. Manage daily priorities using TODO list (Eisenhower Matrix)
3. Keep global notes for deadlines and reminders
4. Export time usage data for workplace reporting and LLM analysis
5. Simple, fast, single-user desktop experience

---

## Target User

- Single user (personal use)
- PC/Desktop only
- Workplace internal use
- English language
- Timezone: KST (Korea Standard Time)

---

## Features

### 1. Header

**Layout**
```
┌──────────────────────────────────────────────────────────────────┐
│ Daily Planner  14:35:22    Work:4h(-1h) Rest:2h(+30m)   [Export] │
│                      ◀  2025-01-30  ▶                            │
└──────────────────────────────────────────────────────────────────┘
```

**Components**
- Title: "Daily Planner"
- Live Clock: KST time (HH:MM:SS)
- Daily Summary: REAL time with PLAN comparison
- Export Button: Opens export modal
- Date Navigation: Previous/Next day buttons

---

### 2. Time Block Management

**Time Grid**
- Hours: 7:00 AM - 8:00 PM (14 hours)
- Interval: 10 minutes
- Two sections: PLAN (left) and REAL (right)

**Block Colors (Time Categories)**
| Color | Hex | Meaning |
|-------|-----|---------|
| Red | #FFB3BA | Useless time usage |
| Blue | #BAE1FF | Work |
| Green | #BAFFC9 | Rest |
| Gray | #E0E0E0 | Non-work (commute, etc.) |

**Block Operations**
- Create: Drag to select time range
- Resize: Drag top/bottom edges
- Delete: Double-click
- Copy: PLAN to REAL (individual or all)

---

### 3. Global Notes

**Location**: Above PLAN/REAL sections

**Behavior**
- Single textarea for quick notes
- Persists across all days (global, not per-date)
- Auto-saves on input (500ms debounce)
- Use case: Deadlines, reminders (e.g., "SEMINAR DUE: Feb 10")

---

### 4. Daily Summary

**Location**: Header (right side of clock)

**Display Format**
```
Work: 4h30m(-1h) Rest: 2h(+30m) Useless: 0m
```

**Comparison**
- Shows REAL time with difference from PLAN
- Green diff = REAL less than PLAN (good for Useless)
- Red diff = REAL more than PLAN

---

### 5. TODO List

**Location**: Below PLAN/REAL sections (2-column grid layout)

**TODO Item**
- Field: Title only
- Maximum: 7 items (enforces prioritization)
- Priority: Color-coded via right-click toggle

**Priority Colors (Eisenhower Matrix - Soft Pastels)**
| Color | Hex | Meaning |
|-------|-----|---------|
| Soft Red | #F8B4B4 | Urgent + Important |
| Soft Yellow | #FDE68A | Urgent + Not Important |
| Soft Mint | #A7F3D0 | Not Urgent + Important |
| Soft Gray | #E5E7EB | Not Urgent + Not Important |

**Interactions**
- Add: Click button or `Ctrl + T`
- Edit: Click on title (inline editing)
- Toggle Priority: Right-click to cycle colors
- Complete: Click checkbox → moves to DONE list with strikethrough
- Uncomplete: Click checkbox on DONE item → moves back to TODO
- Delete: Click × button (no confirmation)

**Carry Over**
- Manual "Carry" button
- Copies incomplete TODOs from previous day to today

---

### 6. Export

**Daily Export**
- CSV: Blocks + TODOs in table format
- JSON: Full day data with summary

**Weekly Export**
- CSV: 7-day summary table (Mon-Sun)
- JSON: 7-day full data

**LLM Export**
- Markdown report with summaries, tables, completed/pending tasks
- Optimized for feeding to AI for time usage analysis

**File Naming**
- Daily: `daily-planner-YYYY-MM-DD.csv/json`
- Weekly: `daily-planner-week-YYYY-MM-DD.csv/json`
- LLM: `time-report-YYYY-MM-DD.md`

---

### 7. Backup & Restore

**Backup (`Ctrl + B`)**
- Exports all stored data as JSON
- File: `daily-planner-backup-YYYY-MM-DD.json`

**Import**
- Load backup JSON file
- Restores all data (with confirmation)

---

### 8. Data Retention

**Policy**
- Automatically deletes data older than current month on app load
- Global notes preserved
- User should backup before month ends if needed

---

### 9. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + ←` | Go to previous day |
| `Ctrl + →` | Go to next day |
| `Ctrl + S` | Quick daily CSV export |
| `Ctrl + T` | Add new TODO |
| `Ctrl + B` | Backup all data |
| `Esc` | Close modal / Cancel |
| `Enter` | Confirm (in modal) |

---

## Out of Scope (MVP)

- Cloud sync
- Mobile support
- Multi-user / Authentication
- Recurring tasks
- Task templates
- Charts / Graphs
- Undo / Redo
- Task linking (TODO to time block)
- Push notifications (while browser closed)

---

## Success Metrics

1. User can plan and track daily work time
2. User can manage up to 7 daily priorities
3. User can export data for workplace reporting
4. User can feed data to LLM for time usage advice
5. Data is safely backed up before month rollover
