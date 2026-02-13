/**
 * TOOLS.JS
 * Logic for the Forge Calculator, State Management, and Egg Planner.
 */

// ==========================================
// 1. FORGE CALCULATOR
// ==========================================

function populateForgeDropdown() {
    const s = document.getElementById('calc-forge-lv');
    if (!s) return;
    s.innerHTML = ""; // Clear existing options to prevent duplication
    for (let i = 1; i <= 34; i++) s.add(new Option(i, i));
    s.value = 20; // Default
}

function showCalculator() {
    if (typeof setSidebarPanel === 'function') setSidebarPanel('calc');
}

function getTechBonuses(lvls) {
    let speed = 0, sell = 0, hBonus = 0, cBonus = 0, free = 0, offH = 0, offC = 0, forgeDisc = 0;
    
    const sumLvl = (id) => { 
        let s = 0; 
        for (let t = 1; t <= 5; t++) s += (lvls[`forge_T${t}_${id}`] || 0); 
        return s; 
    };

    speed = sumLvl('timer') * 4;
    sell = sumLvl('sell') * 2;
    hBonus = sumLvl('h_bonus') * 2;
    cBonus = sumLvl('c_bonus') * 2;
    free = sumLvl('free');
    forgeDisc = sumLvl('disc') * 2;
    offH = sumLvl('off_h') * 2;
    offC = sumLvl('off_c') * 2;

    let totalAvg = 0, count = 0;
    if (TREES.power && TREES.power.structure) {
        TREES.power.structure.forEach(s => {
            if (TREES.power.meta[s.id].isSlot) {
                let l = 0;
                for (let t = 1; t <= 5; t++) l += (lvls[`power_T${t}_${s.id}`] || 0);
                totalAvg += getSlotStats(99 + l * 2, sell).avg;
                count++;
            }
        });
    }

    return { speed, sell, hBonus, cBonus, free, offH, offC, avgGold: count > 0 ? totalAvg / count : 0, forgeDisc };
}

function updateCalculator() {
    const hammerEl = document.getElementById('calc-hammers');
    const targetEl = document.getElementById('calc-target');
    if (!hammerEl || !targetEl) return;

// 1. Parse Inputs
    const hIn = parseFloat(hammerEl.value.replace(/,/g, '')) || 0;
    const gTarget = parseFloat(targetEl.value.replace(/,/g, '')) || 0;
    const fLv = parseInt(document.getElementById('calc-forge-lv').value) || 1;

    // Input Formatting - FIXED: Only format when the user clicks AWAY (not focused)
    if (document.activeElement !== hammerEl) {
         hammerEl.value = hIn > 0 ? hIn.toLocaleString('en-US') : (hammerEl.value ? '0' : '');
    }
    if (document.activeElement !== targetEl) {
         targetEl.value = gTarget > 0 ? gTarget.toLocaleString('en-US') : (targetEl.value ? '0' : '');
    }

    const curStats = getTechBonuses(setupLevels);
    const projStats = getTechBonuses(calcState().levels);

    // Helper: Generate Line with Icons
    const genLine = (label, v1, v2, iconKey, tooltip = "") => {
        const tt = tooltip ? `<span class="info-tooltip" title="${tooltip}" onclick="alert('${tooltip}')">(?)</span>` : '';
        const iconHtml = iconKey ? `<img src="icons/${iconKey}.png" class="calc-icon-left">` : '';

        return `
            <div class="calc-line">
                <div class="calc-label">${label} ${tt}</div>
                <div class="calc-val-group">
                    ${v1 === v2 
                        ? `<span>${iconHtml}${v1}</span>` 
                        : `<span class="calc-val-before">${iconHtml}${v1}</span><span class="calc-arrow">➜</span><span class="calc-val-after">${iconHtml}${v2}</span>`
                    }
                </div>
            </div>`;
    };

    // 2. Render RES-1
    let effH1 = hIn / (1 - curStats.free / 100);
    let effH2 = hIn / (1 - projStats.free / 100);
    let h1 = genLine('Effective Hammer', formatResourceValue(effH1, 'hammer'), formatResourceValue(effH2, 'hammer'), 'fm_hammer');
    h1 += genLine('Gold', formatResourceValue(effH1 * curStats.avgGold, 'gold'), formatResourceValue(effH2 * projStats.avgGold, 'gold'), 'fm_gold');
    const res1 = document.getElementById('calc-res-1'); if (res1) res1.innerHTML = h1;

    // 3. Render RES-2
    const res2 = document.getElementById('calc-res-2');
    if (res2) res2.innerHTML = genLine('Hammer Needed', 
        formatResourceValue(gTarget / curStats.avgGold * (1 - curStats.free / 100), 'hammer'), 
        formatResourceValue(gTarget / projStats.avgGold * (1 - projStats.free / 100), 'hammer'), 
        'fm_hammer'
    );

    // 4. Render RES-5 (Forge Upgrade)
    if (forgeLevelData[fLv]) {
        const baseMins = forgeLevelData[fLv][1] * 60;
        const f1 = baseMins / (1 + curStats.speed / 100);
        
        const sDateVal = document.getElementById('calc-start-date').value;
        const mainStartTime = sDateVal ? new Date(sDateVal).getTime() : Date.now();
        let speedBonusAtStart = curStats.speed;
        let runningTimeOffset = 0;
        const state = calcState();
        const planStartVal = document.getElementById('start-date').value;
        const planStartMs = planStartVal ? new Date(planStartVal).getTime() : Date.now();

        state.history.forEach(h => {
            const stepDuration = (h.type === 'delay' ? h.mins : h.added);
            runningTimeOffset += stepDuration;
            if (h.tree === 'forge' && h.id && h.id.includes('timer')) {
                const techFinishTime = planStartMs + (runningTimeOffset * 60000);
                if (techFinishTime <= mainStartTime) { speedBonusAtStart += 4; }
            }
        });

        const f2 = baseMins / (1 + speedBonusAtStart / 100);
        const dFinish = new Date(mainStartTime + f1 * 60000);
        const dFinishProj = new Date(mainStartTime + f2 * 60000);
        
        const timeStr = (d) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
        const dateStr = (d) => d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
        const formatDT = (d) => `<span class="calc-multiline-date">${dateStr(d)}<span class="calc-date-comma">, </span><span class="calc-time-block">${timeStr(d)}</span></span>`;

        // UPDATED: Added 'calc-val-before' class to the first span here vvv
        let finishHtml = (dFinish.getTime() === dFinishProj.getTime())
            ? `<div class="calc-val-group calc-date-single"><span>${formatDT(dFinish)}</span></div>`
            : `<div class="calc-val-group"><span class="calc-val-before">${formatDT(dFinish)}</span><span class="calc-arrow">➜</span><span class="calc-val-after">${formatDT(dFinishProj)}</span></div>`;

        let h5 = `<div class="calc-line"><div class="calc-label">Finish</div>${finishHtml}</div>`;
        h5 += genLine('Duration', formatSmartTime(f1), formatSmartTime(f2));
        const cRaw = forgeLevelData[fLv][0];
        h5 += genLine('Cost', formatResourceValue(Math.round(cRaw * (1 - curStats.forgeDisc / 100)), 'gold'), formatResourceValue(Math.round(cRaw * (1 - projStats.forgeDisc / 100)), 'gold'), 'fm_gold');
        const res5 = document.getElementById('calc-res-5'); if (res5) res5.innerHTML = h5;
    }

    if (typeof saveToLocalStorage === 'function') saveToLocalStorage();
}

// ==========================================
// 2. STATE MANAGEMENT (SAVE/LOAD)
// ==========================================

function captureFullState() {
    // 1. Capture Egg Data (if exists)
    let eggData = null;
    if (typeof eggPlanQueue !== 'undefined') {
        const start = document.getElementById('egg-date-desktop') ? document.getElementById('egg-date-desktop').value : "";
        eggData = { queue: eggPlanQueue, start: start };
    }

    // 2. Return Full Object
    return {
        setupLevels: setupLevels,
        planQueue: planQueue,
        // SAVE WAR CONFIG (Uses global warConfig from tech-planner.js)
        warConfig: typeof warConfig !== 'undefined' ? warConfig : { day: 2, hour: 12, ampm: 'AM' }, 
        eggData: eggData,
        startDate: document.getElementById('start-date') ? document.getElementById('start-date').value : ""
    };
}

function loadState(data) {
    if (!data) return;

    // 1. Load Main Data
    if (data.setupLevels) setupLevels = data.setupLevels;
    if (data.planQueue) planQueue = data.planQueue;

    // 2. Load War Config
    if (data.warConfig) {
        warConfig = data.warConfig; // Update global variable
        
        // Update the Dropdowns visually
        const d = document.getElementById('war-day');
        const h = document.getElementById('war-hour');
        const ap = document.getElementById('war-ampm');
        if (d) d.value = warConfig.day;
        if (h) h.value = warConfig.hour;
        if (ap) ap.value = warConfig.ampm;
    }

    // 3. Load Start Date
    if (data.startDate) {
        const dateInput = document.getElementById('start-date');
        if (dateInput) dateInput.value = data.startDate;
    }

    // 4. Load Egg Data
    if (data.eggData && typeof loadEggState === 'function') {
        loadEggState(data.eggData);
    } else if (data.eggData && typeof eggPlanQueue !== 'undefined') {
        eggPlanQueue = data.eggData.queue || [];
        if (data.eggData.start) {
            const ed = document.getElementById('egg-date-desktop');
            if (ed) ed.value = data.eggData.start;
        }
        if (typeof updateEggLog === 'function') updateEggLog();
    }

    // 5. Refresh UI
    updateCalculations();
}

// ==========================================
// 3. EGG PLANNER (WITH INDEPENDENT HISTORY)
// ==========================================

let eggPlanQueue = [];
let eggInsertIdx = -1;
let expandedEggIdx = -1;

// --- EGG HISTORY SYSTEM ---
let eggHistoryStack = [];
let eggRedoStack = [];

function captureEggState() {
    return {
        queue: JSON.parse(JSON.stringify(eggPlanQueue)),
        start: document.getElementById('egg-date-desktop').value
    };
}

function pushEggHistory() {
    if (eggHistoryStack.length > 50) eggHistoryStack.shift();
    eggHistoryStack.push(captureEggState());
    eggRedoStack = [];
    updateEggUndoButtons();
}

function undoEgg() {
    if (eggHistoryStack.length === 0) return;
    eggRedoStack.push(captureEggState());
    const state = eggHistoryStack.pop();
    eggPlanQueue = state.queue;
    if (state.start) syncEggDate(state.start, false); // false = no generic save trigger
    renderEggLog();
    updateEggUndoButtons();
    if (typeof saveToLocalStorage === 'function') saveToLocalStorage();
}

function redoEgg() {
    if (eggRedoStack.length === 0) return;
    eggHistoryStack.push(captureEggState());
    const state = eggRedoStack.pop();
    eggPlanQueue = state.queue;
    if (state.start) syncEggDate(state.start, false);
    renderEggLog();
    updateEggUndoButtons();
    if (typeof saveToLocalStorage === 'function') saveToLocalStorage();
}

function updateEggUndoButtons() {
    const hasHistory = eggHistoryStack.length > 0;
    const hasRedo = eggRedoStack.length > 0;

    // UPDATED: Target both Desktop and Mobile buttons
    const undoIds = ['btn-undo-egg', 'btn-undo-mobile-egg'];
    const redoIds = ['btn-redo-egg', 'btn-redo-mobile-egg'];

    const updateBtn = (id, isActive) => {
        const el = document.getElementById(id);
        if (el) {
            el.disabled = !isActive;
            el.style.opacity = !isActive ? "0.3" : "1";
            el.style.pointerEvents = !isActive ? "none" : "auto";
        }
    };

    undoIds.forEach(id => updateBtn(id, hasHistory));
    redoIds.forEach(id => updateBtn(id, hasRedo));
}

// --- EGG LOGIC ---

function openEggPlanner() {
    populateEggDropdowns();
    const currentVal = document.getElementById('egg-date-desktop').value;
    if (!currentVal && document.getElementById('start-date')) {
        syncEggDate(document.getElementById('start-date').value);
    } else {
        syncEggDate(currentVal);
    }
    renderEggLog();
    updateEggUndoButtons();
    if (typeof setSidebarPanel === 'function') setSidebarPanel('egg');
}

function populateEggDropdowns() {
    if (typeof populateDateDropdowns === 'function') populateDateDropdowns();
}

function getEggSpeedAtTime(techIdSuffix, targetTimeMs) {
    let totalLvl = 0;
    for (let t = 1; t <= 5; t++) {
        totalLvl += (setupLevels[`spt_T${t}_${techIdSuffix}`] || 0);
    }
    let mainStartTime = new Date(document.getElementById('start-date').value).getTime();
    let techState = calcState();
    let runningTimeOffset = 0;
    techState.history.forEach(h => {
        let stepDuration = (h.type === 'delay' ? h.mins : h.added);
        runningTimeOffset += stepDuration;
        if (h.id && h.id.endsWith(techIdSuffix)) {
            let techFinishTime = mainStartTime + (runningTimeOffset * 60000);
            if (techFinishTime <= targetTimeMs) {
                totalLvl++;
            }
        }
    });
    return totalLvl;
}

function activateEggInsert(idx) {
    eggInsertIdx = idx + 1;
    expandedEggIdx = -1;
    document.getElementById('egg-selector-box').classList.add('egg-insert-active');
    renderEggLog();
}

function toggleEggExp(i) {
    expandedEggIdx = expandedEggIdx === i ? -1 : i;
    renderEggLog();
}

function renderEggLog() {
    const list = document.getElementById('egg-log-list');
    if (!list) return;
    list.innerHTML = '';
    const dateInput = document.getElementById('egg-date-desktop');
    if (!dateInput || !dateInput.value) return;

    let curTime = new Date(dateInput.value).getTime();
    let totalQueueMins = 0;
    let totalPoints = 0;

    eggPlanQueue.forEach((item, idx) => {
        const div = document.createElement('div');
        
        if (item.type === 'delay') {
            totalQueueMins += item.mins;
            curTime += item.mins * 60000;
            const finishDate = new Date(curTime);
            const timeStr = finishDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) + ', ' + finishDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
            
            div.className = `log-row ${expandedEggIdx === idx ? 'expanded' : ''}`;
            
            const iconHtml = `
                <div class="log-icon-wrapper desktop-only" style="align-items: center; justify-content: center; height: 44px;">
                    <span style="font-size:1.8em; line-height:1;">💤</span>
                </div>`;
            const nameHtml = `<div class="log-name">Delay (+${item.mins}m)</div>`;
            const rightHtml = `
                <div class="log-right-group">
                    <div class="log-time" style="color:#ccc">${timeStr}</div>
                </div>`;
                
            div.innerHTML = `
                <div class="log-entry delay" onclick="toggleEggExp(${idx})">
                    <div class="log-left-group">${iconHtml}${nameHtml}</div>
                    ${rightHtml}
                </div>
                <div class="log-controls">
                    <button class="btn-ctrl" style="background:#c0392b" onclick="deleteEggStep(${idx})">🗑️ Delete</button>
                </div>`;
        } else {
            const data = EGG_DATA[item.key];
            const pts = EGG_POINTS[item.key] || 0; // Get the warpoints
            
            totalPoints += pts;
            
            const techLvl = getEggSpeedAtTime(data.id, curTime);
            const speedMult = 1 + (techLvl * 0.1);
            const finalMins = data.t / speedMult;
            
            totalQueueMins += finalMins;
            curTime += finalMins * 60000;
            const finishDate = new Date(curTime);
            const finishTs = finishDate.getTime();
            const timeStr = finishDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) + ', ' + finishDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
            
            div.className = `log-row ${expandedEggIdx === idx ? 'expanded' : ''}`;
            
            // Clean icon wrapper (No tier badge!)
            const iconHtml = `
                <div class="log-icon-wrapper">
                    <img src="${data.img}" style="width: 44px; height: 44px; object-fit: contain; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));" onerror="this.style.display='none'">
                </div>`;
            
            // Details HTML using the exact structure from the Schedule Log
            const detailsHtml = `
                <div class="log-details">
                    <div class="ld-part pot">
                        <img src="icons/warpoint.png" class="ld-icon">
                        <span>${pts.toLocaleString('en-US')}</span>
                    </div>
                    <div class="ld-part time" style="width: auto;">
                        <img src="icons/icon_time.png" class="ld-icon">
                        <span>${formatEggTime(finalMins)}</span>
                    </div>
                </div>`;
                
            div.innerHTML = `
                <div class="log-entry ${data.c}" onclick="toggleEggExp(${idx})">
                    <div class="log-left-group">
                        ${iconHtml}
                        <div class="log-name">${data.n}</div> </div>
                    <div class="log-right-group">
                        <div class="log-time">${timeStr}</div>
                        ${detailsHtml}
                    </div>
                </div>
                <div class="log-controls">
                    <button class="btn-ctrl" style="background:#c0392b" onclick="deleteEggStep(${idx})">🗑️ Delete</button>
                    <button class="btn-ctrl" style="background:#2980b9" onclick="markEggDone(${idx}, ${finishTs})">✅ Done</button>
                    <button class="btn-ctrl" style="background:#27ae60" onclick="addEggDelay(${idx})">➕ Delay</button>
                    <button class="btn-ctrl" style="background:#f39c12" onclick="activateEggInsert(${idx})">⤵️ Insert</button>
                </div>`;
        }
        list.appendChild(div);
    });

    const summaryBox = document.getElementById('egg-total-summary');
    if (summaryBox) {
        summaryBox.removeAttribute('style');
        summaryBox.className = 'egg-stats-row'; 
        
        summaryBox.innerHTML = `
            <div class="es-item type-points">
                <span class="es-value points">${totalPoints.toLocaleString('en-US')}</span>
            </div>
            <div class="es-item type-time">
                <span class="es-value time">${formatEggTime(totalQueueMins)}</span>
            </div>
        `;
    }
}

function addEggToQueue(type) {
    pushEggHistory(); // Use independent history
    const item = { type: 'egg', key: type };
    if (eggInsertIdx > -1) {
        eggPlanQueue.splice(eggInsertIdx, 0, item);
        eggInsertIdx = -1;
        document.getElementById('egg-selector-box').classList.remove('egg-insert-active');
    } else {
        eggPlanQueue.push(item);
    }
    renderEggLog();
    if (typeof saveToLocalStorage === 'function') saveToLocalStorage();
}

function markEggDone(idx, timestamp) {
    try {
        pushEggHistory(); // Use independent history
        eggPlanQueue.splice(0, idx + 1);
        const d = new Date(timestamp);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        const localIso = d.toISOString().slice(0, 16);
        syncEggDate(localIso);
        expandedEggIdx = -1;
    } catch (e) { console.error(e); }
}

function addEggDelay(idx) {
    const m = prompt("Enter delay in MINUTES:");
    if (m) {
        pushEggHistory(); // Use independent history
        eggPlanQueue.splice(idx + 1, 0, { type: 'delay', mins: parseFloat(m) });
        expandedEggIdx = -1;
        renderEggLog();
        if (typeof saveToLocalStorage === 'function') saveToLocalStorage();
    }
}

function deleteEggStep(idx) {
    pushEggHistory(); // Use independent history
    eggPlanQueue.splice(idx, 1);
    renderEggLog();
    if (typeof saveToLocalStorage === 'function') saveToLocalStorage();
}

function clearEggPlan() {
    if (confirm("Clear egg list?")) {
        pushEggHistory(); // Use independent history
        eggPlanQueue = [];
        renderEggLog();
        if (typeof saveToLocalStorage === 'function') saveToLocalStorage();
    }
}