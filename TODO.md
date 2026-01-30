# TODO - Daily Planner v2.0 Development

## Completed Phases ✅

### Phase 1: Core Updates ✅
- [x] Change hours from 5AM-1:50AM to 7AM-8PM
- [x] Update HOURS constant
- [x] Update time grid rendering
- [x] Update BLOCK_COLORS constant with labels
- [x] Update color picker UI (Useless/Work/Rest/Non-work)
- [x] Change all Korean text to English
- [x] Remove next-day time handling

### Phase 2: TODO List Feature ✅
- [x] Add TODO_COLORS constant (Eisenhower Matrix - soft pastels)
- [x] Add TODO_COLOR_CYCLE array
- [x] Add MAX_TODO_ITEMS constant (7)
- [x] Add todo-container section in HTML
- [x] Create two-column grid layout (TODO left, DONE right)
- [x] Add "Add TODO" button
- [x] Add "Carry" button
- [x] Implement addTodo() with max 7 limit
- [x] Implement editTodo() with inline editing
- [x] Implement toggleTodoPriority() - right-click color cycle
- [x] Implement toggleTodoComplete() - checkbox toggle
- [x] Implement deleteTodo() - no confirmation
- [x] Implement carryOverTodos() - copy from yesterday
- [x] Add priority color legend

### Phase 3: Daily Summary ✅
- [x] Implement calculateSummaryForType() for PLAN and REAL
- [x] Implement formatDuration() and formatDiff()
- [x] Move summary to header (right side of title)
- [x] Show REAL time with PLAN comparison
- [x] Color-code differences (green=less, red=more)

### Phase 3.5: Global Notes ✅
- [x] Add notes section above PLAN/REAL
- [x] Make notes global (not per-date)
- [x] Implement auto-save with debounce
- [x] Style with warm yellow background

### Phase 4: Export Feature ✅
- [x] Implement downloadFile() helper
- [x] Implement exportDailyCSV()
- [x] Implement exportDailyJSON()
- [x] Implement exportWeeklyCSV()
- [x] Implement exportWeeklyJSON()
- [x] Implement exportForLLM() - Markdown report
- [x] Add export modal with all options
- [x] Wire up Ctrl+S shortcut

### Phase 5: Backup & Import ✅
- [x] Implement backupAllData()
- [x] Add file input for import
- [x] Implement importBackup() with confirmation
- [x] Wire up Ctrl+B shortcut

### Phase 6: Data Retention ✅
- [x] Implement cleanOldData()
- [x] Call cleanOldData() on app init
- [x] Keep only current month data
- [x] Preserve global notes

### Phase 7: Keyboard Shortcuts ✅
- [x] Ctrl + S → exportDailyCSV()
- [x] Ctrl + B → backupAllData()
- [x] Ctrl + T → openTodoModal()
- [x] Ctrl + ← → goToPreviousDay()
- [x] Ctrl + → → goToNextDay()
- [x] Enter → confirm modal
- [x] Escape → close modal

### UI Enhancements ✅
- [x] Add live clock (KST) in header
- [x] Move Export button to header right
- [x] Fix timezone to KST (UTC+9)
- [x] Soften TODO priority colors (pastel)
- [x] Change TODO priority trigger to right-click
- [x] Remove TODO delete confirmation

---

## Definition of Done ✅

- [x] All phases implemented
- [x] Export/Import working
- [x] Keyboard shortcuts working
- [x] Data retention working
- [x] No console errors
- [x] Code is clean and readable
- [x] Documentation updated

---

## Future Enhancements (Post-MVP)

- [ ] Weekly/Monthly view
- [ ] Charts/Graphs for time analysis
- [ ] Recurring task templates
- [ ] Browser notifications (while page open)
- [ ] Dark mode
- [ ] Print-friendly view
- [ ] Drag-and-drop TODO reordering

---

## Notes

- MVP complete
- PC only, no mobile support
- Vanilla JS only, no frameworks
- Timezone: KST (UTC+9)
- Original v1 code backed up in /backup/
