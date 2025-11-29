// Constants
const HOURS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1];
const MINUTES = [0, 10, 20, 30, 40, 50];
const COLORS = ['#FFB3BA', '#BAE1FF', '#BAFFC9', '#E0E0E0'];

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

// DOM Elements
const planContent = document.getElementById('planContent');
const realContent = document.getElementById('realContent');
const blockModal = document.getElementById('blockModal');
const confirmModal = document.getElementById('confirmModal');
const currentDateEl = document.getElementById('currentDate');
const blockTitleInput = document.getElementById('blockTitle');
const btnSave = document.getElementById('btnSave');
const btnCancel = document.getElementById('btnCancel');
const btnConfirmYes = document.getElementById('btnConfirmYes');
const btnConfirmNo = document.getElementById('btnConfirmNo');

// Initialize
function init() {
    currentDateEl.textContent = currentDate;
    createTimeGrid(planContent, 'plan');
    createTimeGrid(realContent, 'real');
    setupColorPicker();
    setupEventListeners();
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
        data[currentDate] = { plan: [], real: [] };
    }
    data[currentDate][type].push(block);
    localStorage.setItem('dailyPlanner', JSON.stringify(data));
}

function loadData() {
    renderBlocks();
}

// Render blocks
function renderBlocks() {
    const data = getData();
    const dateData = data[currentDate] || { plan: [], real: [] };

    renderBlocksForType('plan', dateData.plan);
    renderBlocksForType('real', dateData.real);
}

function renderBlocksForType(type, blocks) {
    const container = type === 'plan' ? planContent : realContent;

    // Remove existing blocks
    container.querySelectorAll('.block').forEach(block => block.remove());

    blocks.forEach(block => {
        createBlockElement(container, type, block);
    });
}

function createBlockElement(container, type, block) {
    const blockEl = document.createElement('div');
    blockEl.className = 'block';
    blockEl.style.backgroundColor = block.color;
    blockEl.dataset.id = block.id;
    blockEl.dataset.type = type;

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

    // Position block
    const position = calculateBlockPosition(block.startTime, block.endTime);
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
            data[currentDate] = { plan: [], real: [] };
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
            data[currentDate] = { plan: [], real: [] };
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
            data[currentDate] = { plan: [], real: [] };
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
    const endHourIndex = HOURS.indexOf(endHour);
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

    // Check if block spans multiple rows
    if (startHourIndex === endHourIndex) {
        // Same row - calculate width normally
        const width = (duration / 10) * slotWidth + (duration / 10) - 2;
        const height = rowHeight - 4;
        return { top, left, width, height };
    } else {
        // Multiple rows - calculate height and limit width to row boundary
        const rowSpan = endHourIndex - startHourIndex;
        const height = (rowSpan + 1) * rowHeight - 4;

        // Width: from start slot to end of the row
        const remainingSlots = 6 - startMinuteIndex; // 6 slots per row
        const width = remainingSlots * slotWidth + (remainingSlots - 1) - 2;

        return { top, left, width, height };
    }
}

// Initialize app
init();
