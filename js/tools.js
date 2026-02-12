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

    // Input Formatting
    if (document.activeElement !== hammerEl || !hammerEl.value.endsWith('.')) {
         if(hIn > 0) hammerEl.value = hIn.toLocaleString('en-US');
    }
    if (document.activeElement !== targetEl || !targetEl.value.endsWith('.')) {
         if(gTarget > 0) targetEl.value = gTarget.toLocaleString('en-US');
    }

    const curStats = getTechBonuses(setupLevels);
    const projStats = getTechBonuses(calcState().levels);

    const genLine = (label, v1, v2, iconKey, tooltip = "") => {
        const tt = tooltip ? `<span class="info-tooltip" title="${tooltip}" onclick="alert('${tooltip}')">(?)</span>` : '';
        const iconImg = iconKey ? `<img src="icons/${iconKey}.png" class="calc-icon">` : '';
        return `
            <div class="calc-line">
                <div class="calc-label">${label} ${tt}</div>
                <div class="calc-val-group">
                    ${v1 === v2 ? `<span>${v1}</span>` : `<span class="calc-val-before">${v1}</span><span class="calc-arrow">➜</span><span class="calc-val-after">${v2}</span>`}
                    ${iconImg}
                </div>
            </div>`;
    };

    // 2. Render RES-1 (Effective Hammer & Gold Value)
    let effH1 = hIn / (1 - curStats.free / 100);
    let effH2 = hIn / (1 - projStats.free / 100);
    let h1 = genLine('Effective Hammer', formatResourceValue(effH1, 'hammer'), formatResourceValue(effH2, 'hammer'), 'fm_hammer');
    h1 += genLine('Gold', formatResourceValue(effH1 * curStats.avgGold, 'gold'), formatResourceValue(effH2 * projStats.avgGold, 'gold'), 'fm_gold');
    const res1 = document.getElementById('calc-res-1'); if (res1) res1.innerHTML = h1;

    // 3. Render RES-2 (Hammer Needed)
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

        let finishHtml = (dFinish.getTime() === dFinishProj.getTime())
            ? `<div class="calc-val-group calc-date-single"><span>${formatDT(dFinish)}</span></div>`
            : `<div class="calc-val-group"><span>${formatDT(dFinish)}</span><span class="calc-arrow">➜</span><span class="calc-val-after">${formatDT(dFinishProj)}</span></div>`;

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
    
    const uBtn = document.getElementById('btn-undo-egg');
    const rBtn = document.getElementById('btn-redo-egg');
    
    if (uBtn) { uBtn.disabled = !hasHistory; uBtn.style.opacity = !hasHistory ? "0.3" : "1"; }
    if (rBtn) { rBtn.disabled = !hasRedo; rBtn.style.opacity = !hasRedo ? "0.3" : "1"; }
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
            div.className = `egg-row ${expandedEggIdx === idx ? 'expanded' : ''}`;
            div.style.borderLeftColor = '#7f8c8d';
            div.innerHTML = `
                <div class="egg-row-header" onclick="toggleEggExp(${idx})">
                    <div class="egg-info"><span style="font-size:1.5em">💤</span><span class="egg-name">DELAY</span></div>
                    <div class="egg-details-right">
                        <div class="egg-time-finish" style="color:#ccc">${timeStr}</div>
                        <div class="egg-meta">Duration: ${item.mins}m</div>
                    </div>
                </div>
                <div class="egg-ctrls">
                    <button class="btn-ctrl" style="background:#c0392b" onclick="deleteEggStep(${idx})">🗑️</button>
                </div>`;
        } else {
            const data = EGG_DATA[item.key];
            if (EGG_POINTS[item.key]) totalPoints += EGG_POINTS[item.key];
            const techLvl = getEggSpeedAtTime(data.id, curTime);
            const speedMult = 1 + (techLvl * 0.1);
            const finalMins = data.t / speedMult;
            totalQueueMins += finalMins;
            curTime += finalMins * 60000;
            const finishDate = new Date(curTime);
            const finishTs = finishDate.getTime();
            const timeStr = finishDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) + ', ' + finishDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
            
            div.className = `egg-row ${data.c} ${expandedEggIdx === idx ? 'expanded' : ''}`;
            div.innerHTML = `
                <div class="egg-row-header" onclick="toggleEggExp(${idx})">
                    <div class="egg-info"><img src="${data.img}"><span class="egg-name">${data.n}</span></div>
                    <div class="egg-details-right">
                        <div class="egg-time-finish">${timeStr}</div>
                        <div class="egg-meta">⏱️ ${formatEggTime(finalMins)} | Speed +${Math.round(techLvl * 10)}%</div>
                    </div>
                </div>
                <div class="egg-ctrls">
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