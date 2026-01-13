// Constants
const HOURS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1];
const MINUTES = [0, 10, 20, 30, 40, 50];
const COLORS = ['#FFB3BA', '#BAE1FF', '#BAFFC9', '#E0E0E0'];
const COLOR_CATEGORIES = {
    '#E0E0E0': '수면',
    '#BAE1FF': '업무',
    '#BAFFC9': '휴식',
    '#FFB3BA': '기타'
};
const DAYS_OF_WEEK = ['일', '월', '화', '수', '목', '금', '토'];

// State
let currentDate = new Date().toISOString().split('T')[0];
let selectedColor = COLORS[0];
let selecting = false;
let startSlot = null;
let endSlot = null;
let currentType = null; // 'plan' or 'real'
let resizing = false;
let resizeBlock = null;
let resizeHandle = null;
let longPressTimer = null;
let journalNoteSaveTimer = null;

// DOM Elements
const planContent = document.getElementById('planContent');
const realContent = document.getElementById('realContent');
const blockModal = document.getElementById('blockModal');
const confirmModal = document.getElementById('confirmModal');
const settingsModal = document.getElementById('settingsModal');
const currentDateEl = document.getElementById('currentDate');
const blockTitleInput = document.getElementById('blockTitle');
const btnSave = document.getElementById('btnSave');
const btnCancel = document.getElementById('btnCancel');
const btnConfirmYes = document.getElementById('btnConfirmYes');
const btnConfirmNo = document.getElementById('btnConfirmNo');
const btnExport = document.getElementById('btnExport');
const btnSettings = document.getElementById('btnSettings');
const btnSettingsClose = document.getElementById('btnSettingsClose');
const journalNoteTextarea = document.getElementById('journalNote');
const toast = document.getElementById('toast');

// Initialize
function init() {
    cleanOldData();
    updateDateDisplay();
    createTimeGrid(planContent, 'plan');
    createTimeGrid(realContent, 'real');
    setupColorPicker();
    setupEventListeners();
    setupTodoListeners();
    setupJournalNoteListener();
    setupDateNavigation();
    setupKeyboardShortcuts();
    loadSettings();
    loadData();
}

// Create time grid
function createTimeGrid(container, type) {
    container.innerHTML = '';

    HOURS.forEach(hour => {
        const row = document.createElement('div');
        row.className = 'time-row';

        const hourLabel = document.createElement('div');
        hourLabel.className = 'hour-label';
        hourLabel.textContent = String(hour).padStart(2, '0');
        row.appendChild(hourLabel);

        const slotsContainer = document.createElement('div');
        slotsContainer.className = 'time-slots';

        MINUTES.forEach(minute => {
            const slot = document.createElement('div');
            slot.className = 'time-slot';
            slot.dataset.hour = hour;
            slot.dataset.minute = minute;
            slot.dataset.type = type;
            slotsContainer.appendChild(slot);
        });

        row.appendChild(slotsContainer);
        container.appendChild(row);
    });
}

// Setup color picker
function setupColorPicker() {
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', () => {
            colorOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            selectedColor = option.dataset.color;
        });
    });
    colorOptions[0].classList.add('selected');
}

// Setup event listeners
function setupEventListeners() {
    // Mouse events for desktop
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Touch events for mobile
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    // Modal events
    btnSave.addEventListener('click', saveBlock);
    btnCancel.addEventListener('click', closeBlockModal);
    btnConfirmNo.addEventListener('click', closeConfirmModal);

    // Export and Settings buttons
    if (btnExport) {
        btnExport.addEventListener('click', exportDay);
    }
    if (btnSettings) {
        btnSettings.addEventListener('click', openSettingsModal);
    }
    if (btnSettingsClose) {
        btnSettingsClose.addEventListener('click', closeSettingsModal);
    }

    // Copy all button
    const copyAllBtn = document.getElementById('copyAllBtn');
    if (copyAllBtn) {
        copyAllBtn.addEventListener('click', copyAllBlocks);
    }

    // Delete all buttons
    const deletePlanBtn = document.getElementById('deletePlanBtn');
    const deleteRealBtn = document.getElementById('deleteRealBtn');
    if (deletePlanBtn) {
        deletePlanBtn.addEventListener('click', () => deleteAllBlocks('plan'));
    }
    if (deleteRealBtn) {
        deleteRealBtn.addEventListener('click', () => deleteAllBlocks('real'));
    }

    // Close modal on background click
    blockModal.addEventListener('click', (e) => {
        if (e.target === blockModal) closeBlockModal();
    });
    confirmModal.addEventListener('click', (e) => {
        if (e.target === confirmModal) closeConfirmModal();
    });
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) closeSettingsModal();
    });
}

// Mouse handlers
function handleMouseDown(e) {
    // Don't start selecting if clicking on a block or resize handle
    if (e.target.closest('.block') || e.target.closest('.resize-handle')) return;

    const slot = e.target.closest('.time-slot');
    if (!slot) return;

    selecting = true;
    startSlot = slot;
    currentType = slot.dataset.type;
    slot.classList.add('selecting');
}

function handleMouseMove(e) {
    if (!selecting || !startSlot) return;

    const slot = e.target.closest('.time-slot');
    if (!slot || slot.dataset.type !== currentType) return;

    clearSelection();
    endSlot = slot;
    highlightSelection();
}

function handleMouseUp(e) {
    if (!selecting || !startSlot) return;

    selecting = false;
    const slot = e.target.closest('.time-slot');
    if (slot && slot.dataset.type === currentType) {
        endSlot = slot;
    }

    if (startSlot && endSlot) {
        const { startTime, endTime } = getTimeRange();
        if (checkOverlap(currentType, startTime, endTime)) {
            alert('이미 블록이 존재하는 시간대입니다.');
            clearSelection();
            resetSelection();
            return;
        }
        openBlockModal();
    } else {
        clearSelection();
        resetSelection();
    }
}

// Touch handlers
let touchStartSlot = null;

function handleTouchStart(e) {
    const slot = e.target.closest('.time-slot');
    if (!slot) return;

    if (!touchStartSlot) {
        touchStartSlot = slot;
        startSlot = slot;
        currentType = slot.dataset.type;
        slot.classList.add('selecting');
    } else {
        endSlot = slot;
        if (slot.dataset.type === currentType) {
            const { startTime, endTime } = getTimeRange();
            if (checkOverlap(currentType, startTime, endTime)) {
                alert('이미 블록이 존재하는 시간대입니다.');
                clearSelection();
                resetTouchSelection();
                return;
            }
            openBlockModal();
        }
        touchStartSlot = null;
    }
}

function handleTouchEnd(e) {
    // Touch end is handled in touchStart for simplicity
}

// Highlight selection
function highlightSelection() {
    const slots = document.querySelectorAll(`.time-slot[data-type="${currentType}"]`);
    const start = getSlotIndex(startSlot);
    const end = getSlotIndex(endSlot);
    const [minIndex, maxIndex] = [Math.min(start, end), Math.max(start, end)];

    slots.forEach((slot, index) => {
        if (index >= minIndex && index <= maxIndex) {
            slot.classList.add('selecting');
        }
    });
}

// Clear selection
function clearSelection() {
    document.querySelectorAll('.time-slot.selecting').forEach(slot => {
        slot.classList.remove('selecting');
    });
}

// Reset selection
function resetSelection() {
    startSlot = null;
    endSlot = null;
    currentType = null;
}

function resetTouchSelection() {
    touchStartSlot = null;
    startSlot = null;
    endSlot = null;
    currentType = null;
}

// Get slot index
function getSlotIndex(slot) {
    const slots = document.querySelectorAll(`.time-slot[data-type="${currentType}"]`);
    return Array.from(slots).indexOf(slot);
}

// Get time range
function getTimeRange() {
    const start = getSlotIndex(startSlot);
    const end = getSlotIndex(endSlot);
    const [minIndex, maxIndex] = [Math.min(start, end), Math.max(start, end)];

    const slots = document.querySelectorAll(`.time-slot[data-type="${currentType}"]`);
    const startSlotEl = slots[minIndex];
    const endSlotEl = slots[maxIndex];

    const startHour = parseInt(startSlotEl.dataset.hour);
    const startMinute = parseInt(startSlotEl.dataset.minute);
    const endHour = parseInt(endSlotEl.dataset.hour);
    const endMinute = parseInt(endSlotEl.dataset.minute);

    // Calculate end time (add 10 minutes to end slot)
    let finalEndMinute = endMinute + 10;
    let finalEndHour = endHour;
    if (finalEndMinute >= 60) {
        finalEndMinute = 0;
        finalEndHour = (endHour + 1) % 24;
    }

    const startTime = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`;
    const endTime = `${String(finalEndHour).padStart(2, '0')}:${String(finalEndMinute).padStart(2, '0')}`;

    return { startTime, endTime };
}

// Modal functions
function openBlockModal() {
    blockTitleInput.value = '';
    blockModal.classList.add('active');
    blockTitleInput.focus();
}

function closeBlockModal() {
    blockModal.classList.remove('active');
    clearSelection();
    resetSelection();
    resetTouchSelection();
}

function openConfirmModal(message, onConfirm) {
    document.getElementById('confirmMessage').textContent = message;
    confirmModal.classList.add('active');

    btnConfirmYes.onclick = () => {
        onConfirm();
        closeConfirmModal();
    };
}

function closeConfirmModal() {
    confirmModal.classList.remove('active');
}

// Save block
function saveBlock() {
    const title = blockTitleInput.value.trim();
    if (!title) {
        alert('업무명을 입력해주세요.');
        return;
    }

    const { startTime, endTime } = getTimeRange();
    const block = {
        id: generateId(),
        startTime,
        endTime,
        title,
        color: selectedColor
    };

    addBlockToData(currentType, block);
    saveData();
    renderBlocks();
    closeBlockModal();
}

// Check overlap
function checkOverlap(type, startTime, endTime) {
    const data = getData();
    const blocks = data[currentDate]?.[type] || [];

    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);

    return blocks.some(block => {
        const blockStart = timeToMinutes(block.startTime);
        const blockEnd = timeToMinutes(block.endTime);
        return (start < blockEnd && end > blockStart);
    });
}

// Time conversion
function timeToMinutes(time) {
    const [hour, minute] = time.split(':').map(Number);
    // Handle next day (00:00 - 01:50)
    const adjustedHour = hour < 5 ? hour + 24 : hour;
    return adjustedHour * 60 + minute;
}

// Split block into multiple segments by hour boundaries
function splitBlockByHour(block) {
    const [startHour, startMinute] = block.startTime.split(':').map(Number);
    const [endHour, endMinute] = block.endTime.split(':').map(Number);

    // Adjust hours for next day (00:00 - 01:50)
    const adjustedStartHour = startHour < 5 ? startHour + 24 : startHour;
    const adjustedEndHour = endHour < 5 ? endHour + 24 : endHour;

    // If same hour, no split needed
    if (adjustedStartHour === adjustedEndHour) {
        return [{
            ...block,
            segmentStart: block.startTime,
            segmentEnd: block.endTime
        }];
    }

    // Multiple hours - split into segments
    const segments = [];
    let currentHour = adjustedStartHour;
    let currentMinute = startMinute;

    while (currentHour < adjustedEndHour || (currentHour === adjustedEndHour && currentMinute < endMinute)) {
        const segmentStart = `${String(currentHour % 24).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

        // Move to next hour boundary or end time
        let nextHour = currentHour;
        let nextMinute = 0;

        if (currentHour < adjustedEndHour) {
            nextHour = currentHour + 1;
            nextMinute = 0;
        } else {
            nextHour = adjustedEndHour;
            nextMinute = endMinute;
        }

        const segmentEnd = `${String(nextHour % 24).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}`;

        segments.push({
            ...block,
            segmentStart,
            segmentEnd
        });

        currentHour = nextHour;
        currentMinute = nextMinute;
    }

    return segments;
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// LocalStorage functions
function getData() {
    try {
        const data = localStorage.getItem('dailyPlanner');
        const parsed = data ? JSON.parse(data) : {};

        // Validate data structure for current date
        if (parsed[currentDate]) {
            if (!parsed[currentDate].plan || !Array.isArray(parsed[currentDate].plan) ||
                !parsed[currentDate].real || !Array.isArray(parsed[currentDate].real)) {
                console.warn(`Invalid data structure for ${currentDate}, clearing date data`);
                delete parsed[currentDate];
                localStorage.setItem('dailyPlanner', JSON.stringify(parsed));
            }
        }

        return parsed;
    } catch (e) {
        console.error('Error loading data:', e);
        // Try to recover by clearing only current date's data
        try {
            const data = localStorage.getItem('dailyPlanner');
            if (data) {
                const parsed = JSON.parse(data);
                delete parsed[currentDate];
                localStorage.setItem('dailyPlanner', JSON.stringify(parsed));
                console.log(`Cleared corrupted data for ${currentDate}`);
                return parsed;
            }
        } catch (recoveryError) {
            console.error('Failed to recover data, clearing all:', recoveryError);
            localStorage.removeItem('dailyPlanner');
        }
        return {};
    }
}

function saveData() {
    try {
        const data = getData();
        localStorage.setItem('dailyPlanner', JSON.stringify(data));
    } catch (e) {
        console.error('Error saving data:', e);

        // Try to save without current date's data
        try {
            const data = getData();
            delete data[currentDate];
            localStorage.setItem('dailyPlanner', JSON.stringify(data));
            alert(`데이터 저장 오류가 발생하여 ${currentDate}의 데이터를 삭제했습니다.`);
        } catch (recoveryError) {
            console.error('Failed to save data:', recoveryError);
            alert('데이터 저장에 실패했습니다. 브라우저 저장소가 가득 찼을 수 있습니다.');
        }
    }
}

function addBlockToData(type, block) {
    const data = getData();
    if (!data[currentDate]) {
        data[currentDate] = { plan: [], real: [], todos: [], journalNote: '' };
    }
    data[currentDate][type].push(block);
    localStorage.setItem('dailyPlanner', JSON.stringify(data));
}

function loadData() {
    renderBlocks();
    loadTodos();
    loadJournalNote();
}

// Render blocks
function renderBlocks() {
    const data = getData();
    const dateData = data[currentDate] || { plan: [], real: [], todos: [], journalNote: '' };

    renderBlocksForType('plan', dateData.plan || []);
    renderBlocksForType('real', dateData.real || []);
}

function renderBlocksForType(type, blocks) {
    const container = type === 'plan' ? planContent : realContent;

    // Remove existing blocks
    container.querySelectorAll('.block').forEach(block => block.remove());

    blocks.forEach(block => {
        // Split block into hour segments
        const segments = splitBlockByHour(block);
        segments.forEach(segment => {
            createBlockElement(container, type, segment);
        });
    });
}

function createBlockElement(container, type, block) {
    const blockEl = document.createElement('div');
    blockEl.className = 'block';
    blockEl.style.backgroundColor = block.color;
    blockEl.dataset.id = block.id;
    blockEl.dataset.type = type;

    // Create time display
    const timeDisplay = document.createElement('div');
    timeDisplay.className = 'block-time';
    const displayStart = block.segmentStart || block.startTime;
    const displayEnd = block.segmentEnd || block.endTime;
    timeDisplay.textContent = `${displayStart}-${displayEnd}`;
    blockEl.appendChild(timeDisplay);

    // Create title display
    const title = document.createElement('div');
    title.className = 'block-title';
    title.textContent = block.title;
    blockEl.appendChild(title);

    // Add copy arrow button (only for PLAN blocks)
    if (type === 'plan') {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = '→';
        copyBtn.title = 'REAL로 복사';
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            copyBlock(block, type);
        });
        blockEl.appendChild(copyBtn);
    }

    // Add resize handles
    const topHandle = document.createElement('div');
    topHandle.className = 'resize-handle top';
    topHandle.dataset.handle = 'top';
    blockEl.appendChild(topHandle);

    const bottomHandle = document.createElement('div');
    bottomHandle.className = 'resize-handle bottom';
    bottomHandle.dataset.handle = 'bottom';
    blockEl.appendChild(bottomHandle);

    // Position block using segment times if available
    const startTime = block.segmentStart || block.startTime;
    const endTime = block.segmentEnd || block.endTime;
    const position = calculateBlockPosition(startTime, endTime);
    blockEl.style.top = position.top + 'px';
    blockEl.style.left = position.left + 'px';
    blockEl.style.width = position.width + 'px';
    blockEl.style.height = position.height + 'px';

    // Add event listeners
    setupBlockEventListeners(blockEl, block);

    container.appendChild(blockEl);
}

// Setup block event listeners
function setupBlockEventListeners(blockEl, block) {
    // Double click to delete (desktop)
    blockEl.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        deleteBlock(blockEl, block);
    });

    // Long press to delete (mobile)
    let longPressTimeout;
    blockEl.addEventListener('touchstart', (e) => {
        if (e.target.closest('.resize-handle')) return;

        longPressTimeout = setTimeout(() => {
            deleteBlock(blockEl, block);
        }, 500);
    });

    blockEl.addEventListener('touchend', () => {
        clearTimeout(longPressTimeout);
    });

    blockEl.addEventListener('touchmove', () => {
        clearTimeout(longPressTimeout);
    });

    // Resize handles
    const handles = blockEl.querySelectorAll('.resize-handle');
    handles.forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            startResize(e, blockEl, block, handle.dataset.handle);
        });

        handle.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            startResize(e, blockEl, block, handle.dataset.handle);
        });
    });
}

// Delete block
function deleteBlock(blockEl, block) {
    openConfirmModal('삭제하시겠습니까?', () => {
        const type = blockEl.dataset.type;
        removeBlockFromData(type, block.id);
        saveData();
        renderBlocks();
    });
}

// Remove block from data
function removeBlockFromData(type, blockId) {
    const data = getData();
    if (!data[currentDate] || !data[currentDate][type]) return;

    data[currentDate][type] = data[currentDate][type].filter(block => block.id !== blockId);
    localStorage.setItem('dailyPlanner', JSON.stringify(data));
}

// Start resize
function startResize(e, blockEl, block, handleType) {
    e.preventDefault();
    resizing = true;
    resizeBlock = { el: blockEl, data: block, handle: handleType };

    const onMove = (e) => handleResize(e);
    const onEnd = () => endResize(onMove, onEnd);

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove);
    document.addEventListener('touchend', onEnd);
}

// Handle resize
function handleResize(e) {
    if (!resizing || !resizeBlock) return;

    const { el, data, handle } = resizeBlock;
    const type = el.dataset.type;
    const container = type === 'plan' ? planContent : realContent;

    // Get mouse/touch position
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    if (!clientY) return;

    // Get container position
    const containerRect = container.getBoundingClientRect();
    const relativeY = clientY - containerRect.top + container.scrollTop;

    // Calculate which slot is being pointed at
    const firstRow = container.querySelector('.time-row');
    const rowHeight = firstRow.offsetHeight;
    const slotIndex = Math.floor(relativeY / rowHeight);

    if (slotIndex < 0 || slotIndex >= HOURS.length) return;

    const hour = HOURS[slotIndex];
    const minuteIndexApprox = Math.floor(((relativeY % rowHeight) / rowHeight) * 6);
    const minuteIndex = Math.max(0, Math.min(5, minuteIndexApprox));
    const minute = MINUTES[minuteIndex];

    const newTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

    // Update block data based on handle
    if (handle === 'top') {
        if (timeToMinutes(newTime) < timeToMinutes(data.endTime)) {
            data.startTime = newTime;
        }
    } else {
        // For bottom handle, add 10 minutes
        let endHour = hour;
        let endMinute = minute + 10;
        if (endMinute >= 60) {
            endMinute = 0;
            endHour = (hour + 1) % 24;
        }
        const endTime = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
        if (timeToMinutes(endTime) > timeToMinutes(data.startTime)) {
            data.endTime = endTime;
        }
    }

    // Reposition block
    const position = calculateBlockPosition(data.startTime, data.endTime);
    el.style.top = position.top + 'px';
    el.style.width = position.width + 'px';
    el.style.height = position.height + 'px';
}

// End resize
function endResize(onMove, onEnd) {
    if (!resizing || !resizeBlock) return;

    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onEnd);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onEnd);

    // Update data in localStorage
    const { data, el } = resizeBlock;
    const type = el.dataset.type;
    updateBlockInData(type, data);
    saveData();

    resizing = false;
    resizeBlock = null;
}

// Update block in data
function updateBlockInData(type, updatedBlock) {
    const data = getData();
    if (!data[currentDate] || !data[currentDate][type]) return;

    const index = data[currentDate][type].findIndex(block => block.id === updatedBlock.id);
    if (index !== -1) {
        data[currentDate][type][index] = updatedBlock;
        localStorage.setItem('dailyPlanner', JSON.stringify(data));
    }
}

// Copy block from one type to another
function copyBlock(block, fromType) {
    const toType = fromType === 'plan' ? 'real' : 'plan';
    const direction = fromType === 'plan' ? 'REAL로' : 'PLAN으로';

    openConfirmModal(`정말로 ${direction} 복사하시겠습니까?`, () => {
        const data = getData();
        if (!data[currentDate]) {
            data[currentDate] = { plan: [], real: [], todos: [], journalNote: '' };
        }

        // Remove overlapping blocks in target type
        const startMinutes = timeToMinutes(block.startTime);
        const endMinutes = timeToMinutes(block.endTime);

        data[currentDate][toType] = data[currentDate][toType].filter(targetBlock => {
            const targetStart = timeToMinutes(targetBlock.startTime);
            const targetEnd = timeToMinutes(targetBlock.endTime);
            // Keep blocks that don't overlap
            return !(startMinutes < targetEnd && endMinutes > targetStart);
        });

        // Create new block with new ID
        const newBlock = {
            id: generateId(),
            startTime: block.startTime,
            endTime: block.endTime,
            title: block.title,
            color: block.color
        };

        data[currentDate][toType].push(newBlock);
        localStorage.setItem('dailyPlanner', JSON.stringify(data));
        renderBlocks();
    });
}

// Copy all blocks from PLAN to REAL
function copyAllBlocks() {
    const data = getData();
    const planBlocks = data[currentDate]?.plan || [];

    if (planBlocks.length === 0) {
        alert('복사할 PLAN 블록이 없습니다.');
        return;
    }

    openConfirmModal('PLAN의 모든 블록을 REAL로 복사하시겠습니까?\n(기존 REAL 블록은 모두 삭제됩니다)', () => {
        if (!data[currentDate]) {
            data[currentDate] = { plan: [], real: [], todos: [], journalNote: '' };
        }

        // Clear all REAL blocks
        data[currentDate].real = [];

        // Copy all PLAN blocks to REAL with new IDs
        planBlocks.forEach(block => {
            const newBlock = {
                id: generateId(),
                startTime: block.startTime,
                endTime: block.endTime,
                title: block.title,
                color: block.color
            };
            data[currentDate].real.push(newBlock);
        });

        localStorage.setItem('dailyPlanner', JSON.stringify(data));
        renderBlocks();
    });
}

// Delete all blocks of a specific type
function deleteAllBlocks(type) {
    const data = getData();
    const blocks = data[currentDate]?.[type] || [];

    if (blocks.length === 0) {
        alert('삭제할 블록이 없습니다.');
        return;
    }

    const typeName = type === 'plan' ? 'PLAN' : 'REAL';
    openConfirmModal(`${typeName}의 모든 블록을 삭제하시겠습니까?`, () => {
        if (!data[currentDate]) {
            data[currentDate] = { plan: [], real: [], todos: [], journalNote: '' };
        }

        // Clear all blocks of the specified type
        data[currentDate][type] = [];

        localStorage.setItem('dailyPlanner', JSON.stringify(data));
        renderBlocks();
    });
}

function calculateBlockPosition(startTime, endTime) {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const duration = endMinutes - startMinutes;

    // Calculate slot position
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startHourIndex = HOURS.indexOf(startHour);
    const startMinuteIndex = MINUTES.indexOf(startMinute);
    const endMinuteIndex = MINUTES.indexOf(endMinute);

    // Get first row to calculate dimensions
    const firstRow = planContent.querySelector('.time-row');
    const hourLabel = firstRow.querySelector('.hour-label');
    const timeSlots = firstRow.querySelector('.time-slots');
    const firstSlot = timeSlots.querySelector('.time-slot');

    const rowHeight = firstRow.offsetHeight;
    const slotWidth = firstSlot.offsetWidth;
    const labelWidth = hourLabel.offsetWidth;

    const top = startHourIndex * rowHeight + 2;
    const left = labelWidth + startMinuteIndex * slotWidth + startMinuteIndex + 2;

    // Calculate width based on duration
    // Since blocks are now split by hour, they should always be in the same row
    const width = (duration / 10) * slotWidth + (duration / 10) - 2;
    const height = rowHeight - 4;

    return { top, left, width, height };
}

// Date utility functions
function updateDateDisplay() {
    const date = new Date(currentDate + 'T00:00:00');
    const dayOfWeek = DAYS_OF_WEEK[date.getDay()];
    currentDateEl.textContent = `${currentDate} (${dayOfWeek})`;
}

function getMonday(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date);
    monday.setDate(diff);
    return monday.toISOString().split('T')[0];
}

function cleanOldData() {
    try {
        const monday = getMonday(currentDate);
        const data = getData();
        const allDates = Object.keys(data).filter(key => /^\d{4}-\d{2}-\d{2}$/.test(key));

        let cleaned = false;
        allDates.forEach(date => {
            if (new Date(date + 'T00:00:00') < new Date(monday + 'T00:00:00')) {
                delete data[date];
                cleaned = true;
            }
        });

        if (cleaned) {
            localStorage.setItem('dailyPlanner', JSON.stringify(data));
            console.log(`Cleaned data before ${monday}`);
        }
    } catch (e) {
        console.error('Error cleaning old data:', e);
    }
}

// Setup date navigation
function setupDateNavigation() {
    const btnPrev = document.querySelector('.btn-prev');
    const btnNext = document.querySelector('.btn-next');

    if (btnPrev) {
        btnPrev.addEventListener('click', () => {
            const date = new Date(currentDate + 'T00:00:00');
            date.setDate(date.getDate() - 1);
            currentDate = date.toISOString().split('T')[0];
            updateDateDisplay();
            loadData();
        });
    }

    if (btnNext) {
        btnNext.addEventListener('click', () => {
            const date = new Date(currentDate + 'T00:00:00');
            date.setDate(date.getDate() + 1);
            currentDate = date.toISOString().split('T')[0];
            updateDateDisplay();
            loadData();
        });
    }
}

// Todo functionality
function setupTodoListeners() {
    const todoItems = document.querySelectorAll('.todo-item');

    todoItems.forEach((item, index) => {
        const checkbox = item.querySelector('.todo-checkbox');
        const textInput = item.querySelector('.todo-text');

        // Checkbox change
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                item.classList.add('completed');
            } else {
                item.classList.remove('completed');
            }
            saveTodos();
        });

        // Text input change
        textInput.addEventListener('input', () => {
            saveTodos();
        });

        // Drag and drop
        item.addEventListener('dragstart', handleTodoDragStart);
        item.addEventListener('dragover', handleTodoDragOver);
        item.addEventListener('drop', handleTodoDrop);
        item.addEventListener('dragend', handleTodoDragEnd);
    });
}

let draggedTodoItem = null;

function handleTodoDragStart(e) {
    draggedTodoItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleTodoDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleTodoDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    if (draggedTodoItem !== this) {
        const todoList = document.getElementById('todoList');
        const allItems = Array.from(todoList.querySelectorAll('.todo-item'));
        const draggedIndex = allItems.indexOf(draggedTodoItem);
        const targetIndex = allItems.indexOf(this);

        if (draggedIndex < targetIndex) {
            this.parentNode.insertBefore(draggedTodoItem, this.nextSibling);
        } else {
            this.parentNode.insertBefore(draggedTodoItem, this);
        }

        saveTodos();
    }

    return false;
}

function handleTodoDragEnd(e) {
    this.classList.remove('dragging');
    draggedTodoItem = null;
}

function saveTodos() {
    const data = getData();
    if (!data[currentDate]) {
        data[currentDate] = { plan: [], real: [], todos: [], journalNote: '' };
    }

    const todoItems = document.querySelectorAll('.todo-item');
    const todos = Array.from(todoItems).map((item, index) => {
        const checkbox = item.querySelector('.todo-checkbox');
        const textInput = item.querySelector('.todo-text');
        return {
            id: index,
            text: textInput.value,
            completed: checkbox.checked
        };
    });

    data[currentDate].todos = todos;
    localStorage.setItem('dailyPlanner', JSON.stringify(data));
}

function loadTodos() {
    const data = getData();
    const dateData = data[currentDate] || { plan: [], real: [], todos: [], journalNote: '' };
    const todos = dateData.todos || [];

    const todoItems = document.querySelectorAll('.todo-item');
    todoItems.forEach((item, index) => {
        const checkbox = item.querySelector('.todo-checkbox');
        const textInput = item.querySelector('.todo-text');

        if (todos[index]) {
            textInput.value = todos[index].text || '';
            checkbox.checked = todos[index].completed || false;
            if (checkbox.checked) {
                item.classList.add('completed');
            } else {
                item.classList.remove('completed');
            }
        } else {
            textInput.value = '';
            checkbox.checked = false;
            item.classList.remove('completed');
        }
    });
}

// Journal Note functionality
function setupJournalNoteListener() {
    journalNoteTextarea.addEventListener('input', () => {
        clearTimeout(journalNoteSaveTimer);
        journalNoteSaveTimer = setTimeout(() => {
            saveJournalNote();
        }, 500);
    });
}

function saveJournalNote() {
    const data = getData();
    if (!data[currentDate]) {
        data[currentDate] = { plan: [], real: [], todos: [], journalNote: '' };
    }

    data[currentDate].journalNote = journalNoteTextarea.value;
    localStorage.setItem('dailyPlanner', JSON.stringify(data));
}

function loadJournalNote() {
    const data = getData();
    const dateData = data[currentDate] || { plan: [], real: [], todos: [], journalNote: '' };
    journalNoteTextarea.value = dateData.journalNote || '';
}

// Settings functionality
function loadSettings() {
    try {
        const settings = JSON.parse(localStorage.getItem('app-settings') || '{}');
        const exportFormat = settings.exportFormat || 'json';

        const radioButtons = document.querySelectorAll('input[name="exportFormat"]');
        radioButtons.forEach(radio => {
            if (radio.value === exportFormat) {
                radio.checked = true;
            }
        });
    } catch (e) {
        console.error('Error loading settings:', e);
    }
}

function saveSettings() {
    try {
        const exportFormat = document.querySelector('input[name="exportFormat"]:checked').value;
        const settings = { exportFormat };
        localStorage.setItem('app-settings', JSON.stringify(settings));
    } catch (e) {
        console.error('Error saving settings:', e);
    }
}

// Export functionality
async function exportDay() {
    try {
        const settings = JSON.parse(localStorage.getItem('app-settings') || '{}');
        const exportFormat = settings.exportFormat || 'json';

        const data = getData();
        const dateData = data[currentDate] || { plan: [], real: [], todos: [], journalNote: '' };

        // Generate JSON
        const jsonData = generateJSONExport(dateData);
        downloadFile(`${currentDate}.json`, JSON.stringify(jsonData, null, 2), 'application/json');

        // Generate Markdown if needed
        if (exportFormat === 'both') {
            const mdData = generateMarkdownExport(dateData);
            downloadFile(`${currentDate}.md`, mdData, 'text/markdown');
        }

        showToast('Export 성공!', 'success');
    } catch (e) {
        console.error('Export error:', e);
        showToast('Export 실패: ' + e.message, 'error');
    }
}

function generateJSONExport(dateData) {
    const date = new Date(currentDate + 'T00:00:00');
    const dayOfWeek = DAYS_OF_WEEK[date.getDay()];

    // Calculate statistics
    const planTotalMinutes = calculateTotalMinutes(dateData.plan || []);
    const realTotalMinutes = calculateTotalMinutes(dateData.real || []);
    const todos = dateData.todos || [];
    const completedTodos = todos.filter(t => t.completed).length;
    const todoCompletionRate = todos.length > 0 ? completedTodos / todos.length : 0;

    const planCategoryBreakdown = calculateCategoryBreakdown(dateData.plan || []);
    const realCategoryBreakdown = calculateCategoryBreakdown(dateData.real || []);

    return {
        date: currentDate,
        dayOfWeek: dayOfWeek,
        plan: (dateData.plan || []).map(block => ({
            start: block.startTime,
            end: block.endTime,
            title: block.title,
            color: block.color,
            category: COLOR_CATEGORIES[block.color] || '기타',
            minutes: timeToMinutes(block.endTime) - timeToMinutes(block.startTime)
        })),
        real: (dateData.real || []).map(block => ({
            start: block.startTime,
            end: block.endTime,
            title: block.title,
            color: block.color,
            category: COLOR_CATEGORIES[block.color] || '기타',
            minutes: timeToMinutes(block.endTime) - timeToMinutes(block.startTime)
        })),
        todos: todos.map(t => ({
            text: t.text,
            completed: t.completed
        })),
        journalNote: dateData.journalNote || '',
        stats: {
            planTotalMinutes,
            realTotalMinutes,
            todoCompletionRate: Math.round(todoCompletionRate * 100) / 100,
            categoryBreakdown: {
                plan: planCategoryBreakdown,
                real: realCategoryBreakdown
            }
        }
    };
}

function generateMarkdownExport(dateData) {
    const date = new Date(currentDate + 'T00:00:00');
    const dayOfWeek = DAYS_OF_WEEK[date.getDay()];
    const todos = dateData.todos || [];
    const completedCount = todos.filter(t => t.completed && t.text.trim()).length;
    const totalCount = todos.filter(t => t.text.trim()).length;

    let md = `# ${currentDate} (${dayOfWeek})\n\n`;

    // Todos
    md += `## ✅ 오늘의 할 일\n`;
    todos.forEach(todo => {
        if (todo.text.trim()) {
            md += `- [${todo.completed ? 'x' : ' '}] ${todo.text}\n`;
        }
    });
    md += `\n(${completedCount}/${totalCount} 완료)\n\n`;

    // Time table
    md += `## 📅 PLAN vs REAL\n\n`;
    md += `| 시간 | PLAN | REAL |\n`;
    md += `|------|------|------|\n`;

    const planBlocks = dateData.plan || [];
    const realBlocks = dateData.real || [];
    const maxBlocks = Math.max(planBlocks.length, realBlocks.length);

    for (let i = 0; i < maxBlocks; i++) {
        const planBlock = planBlocks[i];
        const realBlock = realBlocks[i];
        const planText = planBlock ? `${planBlock.startTime}-${planBlock.endTime} ${planBlock.title} (${timeToMinutes(planBlock.endTime) - timeToMinutes(planBlock.startTime)}분)` : '';
        const realText = realBlock ? `${realBlock.startTime}-${realBlock.endTime} ${realBlock.title} (${timeToMinutes(realBlock.endTime) - timeToMinutes(realBlock.startTime)}분)` : '';
        md += `| ${i === 0 ? '시간' : ''} | ${planText} | ${realText} |\n`;
    }

    md += `\n**카테고리별 시간**\n`;
    const planBreakdown = calculateCategoryBreakdown(planBlocks);
    const realBreakdown = calculateCategoryBreakdown(realBlocks);

    Object.keys(COLOR_CATEGORIES).forEach(color => {
        const category = COLOR_CATEGORIES[color];
        const planMinutes = planBreakdown[category] || 0;
        const realMinutes = realBreakdown[category] || 0;
        const icon = color === '#E0E0E0' ? '🔘' : color === '#BAE1FF' ? '🔵' : color === '#BAFFC9' ? '🟢' : '🔴';
        md += `- ${icon} ${category}: PLAN ${planMinutes}분 → REAL ${realMinutes}분\n`;
    });

    // Journal note
    md += `\n## 📝 오늘의 메모\n`;
    md += dateData.journalNote || '(메모 없음)';
    md += `\n`;

    return md;
}

function calculateTotalMinutes(blocks) {
    return blocks.reduce((total, block) => {
        return total + (timeToMinutes(block.endTime) - timeToMinutes(block.startTime));
    }, 0);
}

function calculateCategoryBreakdown(blocks) {
    const breakdown = {};
    blocks.forEach(block => {
        const category = COLOR_CATEGORIES[block.color] || '기타';
        const minutes = timeToMinutes(block.endTime) - timeToMinutes(block.startTime);
        breakdown[category] = (breakdown[category] || 0) + minutes;
    });
    return breakdown;
}

function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = 'toast show ' + type;

    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + E: Export
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            exportDay();
        }

        // Ctrl/Cmd + ,: Settings
        if ((e.ctrlKey || e.metaKey) && e.key === ',') {
            e.preventDefault();
            openSettingsModal();
        }

        // Arrow keys: Navigate dates
        if (e.key === 'ArrowLeft' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            document.querySelector('.btn-prev').click();
        }

        if (e.key === 'ArrowRight' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            document.querySelector('.btn-next').click();
        }

        // Escape: Close modals
        if (e.key === 'Escape') {
            if (blockModal.classList.contains('active')) {
                closeBlockModal();
            }
            if (confirmModal.classList.contains('active')) {
                closeConfirmModal();
            }
            if (settingsModal.classList.contains('active')) {
                closeSettingsModal();
            }
        }

        // Delete: Delete selected block (would need implementation)
    });
}

// Settings modal
function openSettingsModal() {
    settingsModal.classList.add('active');
}

function closeSettingsModal() {
    saveSettings();
    settingsModal.classList.remove('active');
}

// Initialize app
init();
