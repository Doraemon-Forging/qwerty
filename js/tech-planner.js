/**
 * TECH-PLANNER.JS
 * Updated for Light Mode, Exact Centered Connections, and Clan War Logic
 */

// --- GLOBAL STATE ---
let activeTreeKey = 'forge';
let currentMode = 'setup'; 
let setupLevels = {};
let planQueue = [];
let expandedLogIndex = -1;
let insertModeIndex = -1;
let historyStack = [];
let redoStack = [];
let lineUpdateRequested = false;
let scrollPositions = { forge: 0, spt: 0, power: 0, stats: 0 };

// Default War Config: Tuesday (2) at 12 AM
let warConfig = { day: 2, hour: 12, ampm: 'AM' };

// --- TREE NAVIGATION & RENDERING ---

function switchTree(key) {
    if (key === 'stats') return; 
    
    // 1. Update Global Key
    activeTreeKey = key;
    
    // 2. Update New Segmented Buttons (Both Desktop and Mobile)
    const updateTreeBtn = (btnId, isSelected) => {
        const btn = document.getElementById(btnId);
        if (btn) {
            // Add/Remove 'active' class
            if (isSelected) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    };

    // Update Desktop Buttons
    updateTreeBtn('tab-forge', key === 'forge');
    updateTreeBtn('tab-spt', key === 'spt');
    updateTreeBtn('tab-power', key === 'power');

    // Update Mobile Buttons
    updateTreeBtn('mtab-forge', key === 'forge');
    updateTreeBtn('mtab-spt', key === 'spt');
    updateTreeBtn('mtab-power', key === 'power');

    // 3. Scroll & Display Logic (Existing code)
    const treeCont = document.getElementById('tree-container');
    if (treeCont) scrollPositions[key] = treeCont.scrollTop;

    treeCont.style.display = 'flex';
    document.getElementById('stats-container').style.display = 'block'; 
    treeCont.scrollTop = scrollPositions[key] || 0;
    
    // 4. Update Canvas Class for Backgrounds
    document.getElementById('canvas').className = `tree-canvas tree-${key}`;
    
    // 5. Render
    renderTree(key);
    setTimeout(drawLines, 0);
}

function renderTree(key) {
    const canvas = document.getElementById('canvas');
    Array.from(canvas.children).forEach(c => {
        if (!c.classList.contains('connections-layer') && !c.classList.contains('tree-reset-btn')) c.remove();
    });

    const data = TREES[key];
    for (let t = 1; t <= 5; t++) {
        const block = document.createElement('div'); block.className = 'tier-block';
        
        // --- NEW HEADER LOGIC START ---
        const header = document.createElement('div');
        header.className = 'tier-header';

        // Left: The Title
        const title = document.createElement('div'); 
        title.className = 'tier-title'; 
        title.innerText = `TIER ${toRoman(t)}`;
        header.appendChild(title);

        // Right: The Max Button
        const maxBtn = document.createElement('button');
        maxBtn.className = 'tier-max-btn';
        maxBtn.innerText = "MAX";
        maxBtn.onclick = (e) => { e.stopPropagation(); maxTier(key, t); };
        header.appendChild(maxBtn);

        block.appendChild(header);
        // --- NEW HEADER LOGIC END ---

        const rows = {};
        data.structure.forEach(nDef => {
            // ... (Keep existing node generation logic exactly as is) ...
            const fullId = `${key}_T${t}_${nDef.id}`;
            const meta = data.meta[nDef.id];
            if (!meta) return;

            if (!rows[nDef.r]) {
                const rDiv = document.createElement('div');
                rDiv.style = "display:flex;justify-content:center;margin-bottom:60px;width:100%";
                block.appendChild(rDiv);
                rows[nDef.r] = rDiv;
            }

            const node = document.createElement('div');
            node.className = 'node';
            node.id = fullId;
            node.dataset.name = meta.n;
            node.title = `${meta.n} ${toRoman(t)}`;
            if (nDef.c === 1) node.style.marginLeft = "120px"; 

            const iconPath = `icons/${key}_${nDef.id}.png`;
            const fallbackEmoji = key === 'forge' ? '🔨' : (key === 'spt' ? '🐾' : '⚔️');

            node.innerHTML = `
                <div class="node-tier-badge">${toRoman(t)}</div>
                <img src="${iconPath}" class="node-img" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
                <div class="node-fallback" style="display:none">${fallbackEmoji}</div>
                <div class="node-level">0/${meta.m}</div>
            `;
            node.onclick = (e) => {
                if (e.shiftKey && currentMode === 'setup') handleShiftClick(fullId);
                else handleClick(fullId, false);
            };
            node.oncontextmenu = (e) => {
                e.preventDefault();
                handleClick(fullId, true);
            };
            rows[nDef.r].appendChild(node);
        });
        canvas.appendChild(block);
    }
    updateCalculations();
}

function maxTier(tree, tier) {
    // Safety check
    if (!confirm(`Max all nodes in ${tree.toUpperCase()} Tier ${tier}?`)) return;
    
    pushHistory();
    
    // Find all nodes in this specific Tree + Tier
    TREES[tree].structure.forEach(nDef => {
        const fullId = `${tree}_T${tier}_${nDef.id}`;
        const meta = getMeta(fullId);
        
        if (meta) {
            // Set to Max Level
            setupLevels[fullId] = meta.m;

            // Ensure parents are unlocked (Recursive Unlock)
            const ensure = (cid) => getParents(cid).forEach(pid => {
                if ((setupLevels[pid] || 0) === 0) {
                    setupLevels[pid] = 1;
                    ensure(pid);
                }
            });
            ensure(fullId);
        }
    });

    updateCalculations();
}

// --- CALCULATION ENGINE ---

function calcState(customQueue) {
    const levels = { ...setupLevels };
    let totalMin = 0, history = [], speed = 0, totalPotions = 0, totalSellBonusCur = 0, currentDiscount = 0;

    Object.keys(setupLevels).forEach(id => {
        const m = getMeta(id);
        if (m && m.n === "Eq. Sell Price") totalSellBonusCur += (setupLevels[id] * 2);
    });
    Object.keys(levels).forEach(id => {
        const m = getMeta(id);
        if (m && m.speed) speed += m.speed * levels[id];
        if (m && m.isDiscount) currentDiscount += levels[id] * 2;
    });
    if (speed > 1) speed = 1; 

    const q = customQueue || planQueue;
    const brokenSteps = [];

    q.forEach((item, i) => {
        if (item.type === 'delay') {
            totalMin += item.mins;
            history.push({ type: 'delay', mins: item.mins, idx: i });
        } else {
            if (!isUnlocked(item.id, levels)) {
                brokenSteps.push(i);
                return;
            }
            const cur = levels[item.id] || 0;
            const m = getMeta(item.id);
            if (cur >= m.m) return;

            const tier = getTier(item.id);
            const timeBase = tierTimes[tier][cur];
            const finalTime = timeBase / (1 + speed);
            const potionBase = potionCosts[tier][cur];
            const finalPotion = Math.round(potionBase * (1 - (currentDiscount / 100)));

            totalMin += finalTime;
            totalPotions += finalPotion;
            levels[item.id] = cur + 1;

            const spStr = Math.round(speed * 100);
            if (m.speed) { speed += m.speed; if (speed > 1) speed = 1; }
            if (m.isDiscount) currentDiscount += 2;

            history.push({
                type: 'node', id: item.id, name: m.n, lvl: levels[item.id],
                added: finalTime, cost: finalPotion, speedStr: `+${spStr}% Speed`,
                idx: i, tree: item.id.split('_')[0]
            });
        }
    });

    let totalSellBonusProj = 0;
    Object.keys(levels).forEach(id => {
        const m = getMeta(id);
        if (m && m.n === "Eq. Sell Price") totalSellBonusProj += (levels[id] * 2);
    });

    return { levels, totalMin, history, finalSpeed: speed, brokenSteps, totalPotions, totalSellBonusCur, totalSellBonusProj };
}

// --- CLAN WAR LOGIC ---

function updateWarConfig() {
    const d = document.getElementById('war-day');
    const h = document.getElementById('war-hour');
    const ap = document.getElementById('war-ampm');
    
    if(d && h && ap) {
        warConfig.day = parseInt(d.value);
        warConfig.hour = parseInt(h.value);
        warConfig.ampm = ap.value;
        
        // SAVE CHANGES
        if (typeof saveToLocalStorage === 'function') saveToLocalStorage();
        
        updateCalculations();
    }
}

function isWarTime(date) {
    const d = date.getDay(); // 0=Sun, 1=Mon... 6=Sat
    const h = date.getHours();
    const m = date.getMinutes();
    
    // Normalize Config Start Time to 24h format (0-23)
    let startH = warConfig.hour;
    if (startH === 12) {
        startH = (warConfig.ampm === 'PM') ? 12 : 0;
    } else {
        if (warConfig.ampm === 'PM') startH += 12;
    }
    
    // Convert everything to "Hours since Sunday 00:00" (Max 168 hours in a week)
    const currentWeeklyHour = (d * 24) + h + (m / 60);
    const warStartWeeklyHour = (warConfig.day * 24) + startH;
    
    // Helper to check if current time is inside a [start, start+24h] window
    const checkWindow = (startOffset) => {
        const duration = 24; 
        let s = startOffset % 168;
        let e = (startOffset + duration) % 168;
        
        if (e > s) {
            return currentWeeklyHour >= s && currentWeeklyHour < e;
        } else {
            return currentWeeklyHour >= s || currentWeeklyHour < e;
        }
    };
    
    // Check Day 1 Window
    if (checkWindow(warStartWeeklyHour)) return true;
    
    // Check Day 4 Window (Exactly 72 hours after Day 1 Start)
    if (checkWindow(warStartWeeklyHour + 72)) return true;
    
    return false;
}

// --- MAIN RENDER LOOP ---

function updateCalculations() {
    const state = calcState();
    const sVal = document.getElementById('start-date').value;
    const start = sVal ? new Date(sVal) : new Date();
    const startTime = start.getTime();

    const potStr = state.totalPotions.toLocaleString('en-US');
    const timeStr = formatSmartTime(state.totalMin);

    const resVal = document.getElementById('res-val');
    const timeVal = document.getElementById('time-val');
    if (resVal) resVal.innerText = potStr;
    if (timeVal) timeVal.innerText = timeStr;

    const resValDesk = document.getElementById('res-val-desktop');
    const timeValDesk = document.getElementById('time-val-desktop');
    if (resValDesk) resValDesk.innerText = potStr;
    if (timeValDesk) timeValDesk.innerText = timeStr;

    const vLvls = currentMode === 'setup' ? setupLevels : state.levels;
    document.querySelectorAll('.node').forEach(el => {
        const lvl = vLvls[el.id] || 0;
        const m = getMeta(el.id);
        if (!m) return;

        const lvlLabel = el.querySelector('.node-level');
        if (lvlLabel) lvlLabel.innerText = `${lvl}/${m.m}`;

        el.className = 'node';
        if (isUnlocked(el.id, vLvls)) el.classList.add('unlocked');
        if (setupLevels[el.id]) el.classList.add('active-setup');
        if (lvl > (setupLevels[el.id] || 0)) el.classList.add('active-plan');
        if (lvl >= m.m) el.classList.add('maxed');
        el.style.opacity = (!isUnlocked(el.id, vLvls) && lvl === 0) ? "1" : "1";
    });

    const list = document.getElementById('log-list');
    if (list) {
        list.innerHTML = '';
        let curTime = startTime;
        state.history.forEach(h => {
            const row = document.createElement('div');
            let durMs = (h.type === 'delay' ? h.mins : h.added) * 60000;
            curTime += durMs;

            const finishDate = new Date(curTime);
            const finishTs = finishDate.getTime();
            const durStr = formatSmartTime(h.type === 'delay' ? h.mins : h.added);
            const finishDateStr = finishDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) + ', ' + finishDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
            
            // Check War Status
            const isWar = isWarTime(finishDate);
            const warClass = isWar ? 'war-active' : '';

            // Apply classes
            row.className = `log-row ${expandedLogIndex === h.idx ? 'expanded' : ''} ${warClass}`;

            let content = '';
            
if (h.type === 'delay') {
                // 1. Icon Wrapper (Centered Sleep Emoji)
                const iconHtml = `
                    <div class="log-icon-wrapper desktop-only">
                        <div class="log-node-preview" style="background-color: #bdc3c7;">
                            <span style="font-size:1.4em; line-height:1; margin-top:2px;">💤</span>
                        </div>
                    </div>`;
                // 2. The Delay Name
                const nameHtml = `<div class="log-name">Delay (+${h.mins}m)</div>`;
                const rightHtml = `
                    <div class="log-right-group">
                        <div class="log-time">${finishDateStr}</div>
                    </div>`;
                content = `
                    <div class="log-entry delay" onclick="toggleExp(${h.idx})">
                        <div class="log-left-group">
                            ${iconHtml}
                            ${nameHtml}
                        </div>
                        ${rightHtml}
                    </div>`;
} else {
                const tierNum = getTier(h.id);
                
                const parts = h.id.split('_');
                const iconLocalId = parts.slice(2).join('_'); 
                const iconPath = `icons/${parts[0]}_${iconLocalId}.png`;

                const tierLevelCode = `${toRoman(tierNum)}-${h.lvl}`;
                // CHANGED: Added -${h.lvl} to the end
                const nameWithTier = `${h.name} ${toRoman(tierNum)}-${h.lvl}`; 
                const costVal = h.cost.toLocaleString('en-US');

                // Left: Icon + Name
                const iconHtml = `
    <div class="log-icon-wrapper">
                        <div class="log-node-preview">
                            <img src="${iconPath}" class="lnp-img" onerror="this.style.display='none'">
                        </div>
                        <div class="log-tier-text">${tierLevelCode}</div>
                    </div>`;

                // Right: Details (Pot/Time)
                const detailsHtml = `
                    <div class="log-details">
                        <div class="ld-part pot">
                            <img src="icons/red_potion.png" class="ld-icon">
                            <span>${costVal}</span>
                        </div>
                        <div class="ld-part time">
                            <img src="icons/icon_time.png" class="ld-icon">
                            <span>${durStr}</span>
                        </div>
                    </div>
                `;

                content = `
                    <div class="log-entry ${h.tree}" onclick="toggleExp(${h.idx})">
                        <div class="log-left-group">
                            ${iconHtml}
                            <div class="log-name">${nameWithTier}</div>
                        </div>
                        <div class="log-right-group">
                            <div class="log-time">${finishDateStr}</div>
                            ${detailsHtml}
                        </div>
                    </div>`;
            }

            row.innerHTML = content + `<div class="log-controls"><button class="btn-ctrl" style="background:#c0392b" onclick="delStep(${h.idx})">🗑️ Delete</button><button class="btn-ctrl" style="background:#2980b9" onclick="markDone(${h.idx}, ${finishTs})">✅ Done</button><button class="btn-ctrl" style="background:#27ae60" onclick="addDelay(${h.idx})">➕ Delay</button><button class="btn-ctrl" style="background:#f39c12" onclick="activateInsert(${h.idx})">⤵️ Insert</button></div>`;
            list.appendChild(row);
        });
    }

    drawLines();
    const statsPanel = document.getElementById('panel-stats');
    if (statsPanel && statsPanel.style.display !== 'none') {
        renderStats();
    }

    const pBtn = document.getElementById('btn-plan');
    if (pBtn) {
        if (insertModeIndex > -1) {
            pBtn.innerHTML = "⤵️ INSERTING...";
            pBtn.classList.add('insert');
        } else {
            pBtn.innerHTML = "Plan";
            pBtn.classList.remove('insert');
        }
    }
}

// --- VISUALIZATION (PIPES & LINES) - UPDATED FOR LOCKED STATE ---
function drawLines() {
    if (lineUpdateRequested) return;
    lineUpdateRequested = true;
    requestAnimationFrame(() => {
        const svg = document.getElementById('svg-layer');
        const canvas = document.getElementById('canvas');
        if (!canvas || !svg) { lineUpdateRequested = false; return; }

        svg.innerHTML = ''; 
        const lastBlock = canvas.lastElementChild;
        let contentHeight = 0;
        if (lastBlock) contentHeight = lastBlock.offsetTop + lastBlock.offsetHeight;
        svg.style.height = (contentHeight + 20) + "px";

        // Get Coordinates relative to Canvas
        const c = canvas.getBoundingClientRect();

        document.querySelectorAll('.node').forEach(child => {
            if (child.closest('.tree-container').style.display === 'none') return;

            // CHECK: Is this child node locked? (Does NOT have 'unlocked' class)
            const isLocked = !child.classList.contains('unlocked');

            getParents(child.id).forEach(pId => {
                const parent = document.getElementById(pId);
                if (!parent) return;
                
                const r1 = parent.getBoundingClientRect();
                const r2 = child.getBoundingClientRect();

                // Direct Center-to-Center coordinates
                const x1 = r1.left + (r1.width / 2) - c.left;
                const y1 = r1.top + (r1.height / 2) - c.top;
                
                const x2 = r2.left + (r2.width / 2) - c.left;
                const y2 = r2.top + (r2.height / 2) - c.top;

                // Simple Straight Line (Diagonal)
                const d = `M ${x1} ${y1} L ${x2} ${y2}`;

                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', d);
                
                // IF LOCKED: Add 'locked' class to the connector
                path.setAttribute('class', isLocked ? 'connector locked' : 'connector');
                
                svg.appendChild(path);
            });
        });
        lineUpdateRequested = false;
    });
}

// --- INTERACTION HANDLERS ---

function handleClick(id, isRight) {
    showFloatingLabel(id);
    pushHistory(); 
    const meta = getMeta(id);

    if (currentMode === 'setup') {
        if (isRight) {
            if ((setupLevels[id] || 0) > 1) { setupLevels[id]--; } else { delete setupLevels[id]; }
        } else {
            setupLevels[id] = Math.min(meta.m, (setupLevels[id] || 0) + 1);
            if ((setupLevels[id] || 0) === 1) autoUnlock(id);
        }
        if (!setupLevels[id]) {
            let changed = true;
            while (changed) {
                changed = false;
                Object.keys(setupLevels).forEach(k => {
                    if (setupLevels[k] > 0 && !isUnlocked(k, setupLevels)) {
                        delete setupLevels[k];
                        changed = true;
                    }
                });
            }
            const sim = calcState();
            if (sim.brokenSteps.length > 0) {
                for (let i = sim.brokenSteps.length - 1; i >= 0; i--) {
                    planQueue.splice(sim.brokenSteps[i], 1);
                }
            }
        }
    } else {
        if (isRight) {
            let idx = -1;
            for (let i = planQueue.length - 1; i >= 0; i--) {
                if (planQueue[i].id === id) { idx = i; break; }
            }
            if (idx > -1) {
                planQueue.splice(idx, 1);
                let clean = false;
                while (!clean) {
                    const sim = calcState(planQueue);
                    if (sim.brokenSteps.length > 0) {
                        for (let j = sim.brokenSteps.length - 1; j >= 0; j--) {
                            planQueue.splice(sim.brokenSteps[j], 1);
                        }
                    } else clean = true;
                }
            }
        } else {
            let checkState;
            if (insertModeIndex > -1) {
                checkState = calcState(planQueue.slice(0, insertModeIndex));
            } else {
                checkState = calcState();
            }
            if ((checkState.levels[id] || 0) < meta.m && isUnlocked(id, checkState.levels)) {
                if (insertModeIndex > -1) {
                    planQueue.splice(insertModeIndex, 0, { type: 'node', id });
                    insertModeIndex = -1;
                    setMode('plan');
                } else {
                    planQueue.push({ type: 'node', id });
                }
            }
        }
    }
    updateCalculations();
}

function handleShiftClick(id) {
    pushHistory();
    setupLevels[id] = getMeta(id).m;
    const ensure = (cid) => getParents(cid).forEach(pid => {
        if ((setupLevels[pid] || 0) === 0) {
            setupLevels[pid] = 1;
            ensure(pid);
        }
    });
    ensure(id);
    updateCalculations();
}

function autoUnlock(id) {
    getParents(id).forEach(p => {
        if ((setupLevels[p] || 0) === 0) {
            setupLevels[p] = 1;
            autoUnlock(p);
        }
    });
}

function showFloatingLabel(nodeId) {
    if (window.innerWidth > 768) return;
    const node = document.getElementById(nodeId), meta = getMeta(nodeId), tier = getTier(nodeId);
    document.querySelectorAll('.floating-label').forEach(e => e.remove());
    const lbl = document.createElement('div');
    lbl.className = 'floating-label';
    const tree = nodeId.split('_')[0];
    const color = tree === 'forge' ? '#2980b9' : (tree === 'spt' ? '#8e44ad' : '#c0392b');
    lbl.innerHTML = `<span style="color:${color}">${meta.n} ${toRoman(tier)}</span>`;
    document.body.appendChild(lbl);
    const rect = node.getBoundingClientRect();
    lbl.style.left = (rect.left + rect.width / 2) + 'px';
    lbl.style.top = (rect.top - 15) + 'px';
    setTimeout(() => { lbl.style.opacity = '0'; setTimeout(() => lbl.remove(), 500); }, 2000);
}

// --- LOG & PLAN MANAGEMENT ---

function setMode(m) {
    currentMode = m;
    document.body.dataset.mode = m; // <--- NEW: Allows CSS to hide/show buttons based on mode

    if (m !== 'plan') insertModeIndex = -1;

    // --- UPDATED BUTTON LOGIC START ---
    // Update classes to use 'seg-btn' and 'active' (Dark Grey/Blue style)
const updateBtn = (id, isActive) => {
        const el = document.getElementById(id);
        if (el) {
            el.className = `seg-btn ${isActive ? 'active' : ''}`;
            if (id.includes('plan')) {
                 if (insertModeIndex > -1) { el.innerText = "Insert"; el.classList.add('insert'); } 
                 else { el.innerText = "PLAN"; el.classList.remove('insert'); }
            }
        }
    };

   updateBtn('btn-setup', m === 'setup');
    updateBtn('btn-plan', m === 'plan');
    updateBtn('btn-setup-mobile-new', m === 'setup');
    updateBtn('btn-plan-mobile-new', m === 'plan');
    // --- UPDATED BUTTON LOGIC END ---

    // ... (Keep existing sidebar logic) ...
    if (m === 'log') { if (typeof setSidebarPanel === 'function') setSidebarPanel('logs'); } 
    else { if (window.innerWidth <= 768) { document.body.classList.remove('view-log', 'view-calc', 'view-egg'); document.body.classList.add('view-planner'); } }
    
    updateCalculations();
}

function toggleExp(i) {
    expandedLogIndex = expandedLogIndex === i ? -1 : i;
    updateCalculations();
}

function delStep(i) {
    if (!confirm(`Delete this step?`)) return;
    const q = [...planQueue];
    q.splice(i, 1);
    let clean = false;
    while (!clean) {
        const sim = calcState(q);
        if (sim.brokenSteps.length > 0) {
            for (let j = sim.brokenSteps.length - 1; j >= 0; j--) q.splice(sim.brokenSteps[j], 1);
        } else clean = true;
    }
    pushHistory();
    planQueue = q;
    expandedLogIndex = -1;
    updateCalculations();
}

function markDone(targetIdx, timestamp) {
    try {
        pushHistory();
        for (let i = 0; i <= targetIdx; i++) {
            const item = planQueue[i];
            if (item.type === 'node') {
                const cur = setupLevels[item.id] || 0;
                const meta = getMeta(item.id);
                if (meta) setupLevels[item.id] = Math.min(meta.m, cur + 1);
            }
        }
        planQueue.splice(0, targetIdx + 1);
        let clean = false;
        while (!clean) {
            const sim = calcState(planQueue);
            if (sim.brokenSteps.length > 0) {
                for (let j = sim.brokenSteps.length - 1; j >= 0; j--) planQueue.splice(sim.brokenSteps[j], 1);
            } else clean = true;
        }
        const d = new Date(timestamp);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        const localIso = d.toISOString().slice(0, 16);
        expandedLogIndex = -1; 
        if (typeof syncMainDate === 'function') syncMainDate(localIso);
    } catch (e) {
        console.error("MarkDone Failed:", e);
        alert("Error marking done. See console.");
    }
}

function addDelay(i) {
    const m = prompt("Enter delay in MINUTES:");
    if (m) {
        pushHistory();
        planQueue.splice(i + 1, 0, { type: 'delay', mins: parseFloat(m) });
        expandedLogIndex = -1;
        updateCalculations();
    }
}

function activateInsert(idx) {
    insertModeIndex = idx + 1;
    expandedLogIndex = -1;
    setMode('plan');
    updateCalculations();
}

function clearPlan() {
    if (confirm("Clear Plan?")) {
        pushHistory();
        planQueue = [];
        updateCalculations();
    }
}

function resetCurrentTree() {
    if (!confirm(`Reset the ${activeTreeKey.toUpperCase()} tree?`)) return;
    pushHistory();
    Object.keys(setupLevels).forEach(id => {
        if (id.startsWith(activeTreeKey + "_")) delete setupLevels[id];
    });
    planQueue = planQueue.filter(item => (item.type === 'node') ? !item.id.startsWith(activeTreeKey + "_") : true);
    let clean = false;
    while (!clean) {
        const sim = calcState(planQueue);
        if (sim.brokenSteps.length > 0) {
            for (let j = sim.brokenSteps.length - 1; j >= 0; j--) planQueue.splice(sim.brokenSteps[j], 1);
        } else clean = true;
    }
    updateCalculations();
}

// --- STATS VIEW ---

function renderStats() {
    const container = document.getElementById('stats-content');
    container.innerHTML = '';
    const state = calcState();

    let totalAvgCur = 0, totalAvgSellIso = 0;
    const slots = [];
    TREES.power.structure.forEach(s => { if (TREES.power.meta[s.id].isSlot) slots.push(s.id); });

    slots.forEach(sid => {
        let l = 0; for (let t = 1; t <= 5; t++) l += (setupLevels[`power_T${t}_${sid}`] || 0);
        totalAvgCur += getSlotStats(99 + l * 2, state.totalSellBonusCur).avg;
        totalAvgSellIso += getSlotStats(99 + l * 2, state.totalSellBonusProj).avg;
    });

    const globCur = totalAvgCur / slots.length;
    const globProj_SellIso = totalAvgSellIso / slots.length;

    ['forge', 'spt', 'power'].forEach(key => {
        const treeData = TREES[key];
        let currentCount = 0;
        Object.keys(setupLevels).forEach(id => { if (id.startsWith(key + '_')) currentCount += setupLevels[id]; });
        const max = treeData.maxLevels;
        const pct = ((currentCount / max) * 100).toFixed(1);

        const group = document.createElement('div'); group.className = 'stats-group';
        const header = document.createElement('div'); header.className = `stats-header ${key}`;
        
        header.innerHTML = `<img src="icons/tree_${key === 'spt' ? 'SPT' : key}.png" class="nav-icon"> <span>${treeData.name.toUpperCase()}</span> <span class="progress-badge">${currentCount}/${max} (${pct}%)</span>`;
        group.appendChild(header);

        let hasStats = false;
        treeData.structure.forEach(ns => {
            const meta = treeData.meta[ns.id];
            if (!meta || !meta.stat) return;

            let curT = 0, projT = 0;
            for (let t = 1; t <= 5; t++) {
                const id = `${key}_T${t}_${ns.id}`;
                curT += (setupLevels[id] || 0);
                projT += (state.levels[id] || 0);
            }
            hasStats = true;

            let txtCur = meta.stat(curT);
            let txtProj = meta.stat(projT);

            // NEW LOGIC: Remove the label from the projected value if it matches
            if (txtProj.includes('%') && txtCur.includes('%')) {
                const match = txtProj.match(/([+\-]?\d+%?)$/); 
                if (match) {
                    txtProj = match[0];
                }
            }
            
            let infoBtnHTML = '';

            if (key === 'forge' && ns.id === 'sell') {
                txtCur += ` <span style="color:#aaa;font-size:0.9em">(Avg: ${formatResourceValue(globCur, 'gold')} <img src="icons/fm_gold.png" class="stat-key-icon">)</span>`;
                txtProj += ` <span style="font-size:0.9em">(Avg: ${formatResourceValue(globProj_SellIso, 'gold')} <img src="icons/fm_gold.png" class="stat-key-icon">)</span>`;
                infoBtnHTML = `<button class="btn-info" onclick="showEqSellTable(${curT * 2},${projT * 2},1)">i</button>`;

            } else if (meta.isSlot) {
                const sCur = getSlotStats(99 + curT * 2, state.totalSellBonusCur);
                const sProj = getSlotStats(99 + projT * 2, state.totalSellBonusCur);
                txtCur = `Max ${99 + curT * 2} <span style="color:#aaa;font-size:0.9em">(Range: ${sCur.range} | Avg: ${formatResourceValue(sCur.avg, 'gold')} <img src="icons/fm_gold.png" class="stat-key-icon">)</span>`;
                txtProj = `Max ${99 + projT * 2} <span style="font-size:0.9em">(Range: ${sProj.range} | Avg: ${formatResourceValue(sProj.avg, 'gold')} <img src="icons/fm_gold.png" class="stat-key-icon">)</span>`;
            
            } else if (meta.isDiscount) {
                infoBtnHTML = `<button class="btn-info" onclick="showPotionTable(${curT * 2}, ${projT * 2})">i</button>`;

            } else if (key === 'spt' && ns.id === 'timer') {
                infoBtnHTML = `<button class="btn-info" onclick="showTechTimerTable(${curT * 4}, ${projT * 4})">i</button>`;

            } else if (key === 'forge' && ns.id === 'disc') {
                infoBtnHTML = `<button class="btn-info" onclick="showForgeTable('cost',${curT * 2},${projT * 2},1)">i</button>`;

            } else if (key === 'forge' && ns.id === 'timer') {
                infoBtnHTML = `<button class="btn-info" onclick="showForgeTable('timer',${curT * 4},${projT * 4},1)">i</button>`;
            }

            let finalHTML = txtCur;
            if (projT > curT) finalHTML += `<span class="stat-arrow">➜</span> <span class="stat-new">${txtProj}</span>`;

            const row = document.createElement('div'); row.className = 'stats-row';
            
            row.innerHTML = `
                <div class="stat-icon-box">
                    <img src="icons/${key}_${ns.id}.png" class="stat-icon-img" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
                    <div class="stat-icon-fallback" style="display:none">?</div>
                </div>
                <div class="stat-info">
                    <div class="stat-name">
                        ${meta.n} ${infoBtnHTML}
                    </div>
                    <div class="stat-value">${finalHTML}</div>
                </div>`;
            
            group.appendChild(row);
        });
        if (hasStats) container.appendChild(group);
    });
}

// --- TABLE MODALS ---

function showPotionTable(cur, proj) {
    const isUpgrade = proj > cur;
    const discount = Math.max(cur, proj); 
    const headers = ['Level', 'Upgrade Cost'];
    const allRows = [];
    
    for (let t = 1; t <= 5; t++) {
        let tierSumBefore = 0;
        let tierSumAfter = 0;

        for (let i = 0; i < 5; i++) {
            const base = potionCosts[t][i];
            const v1 = Math.round(base * (1 - cur / 100));
            const v2 = Math.round(base * (1 - proj / 100));
            tierSumBefore += v1;
            tierSumAfter += v2;
            let valStr = v1.toLocaleString();
            if (isUpgrade) valStr += ` ➜ ${v2.toLocaleString()}`;
            allRows.push([`<b>Lv ${i + 1}</b>`, valStr]);
        }
        let sumStr = `<b>${tierSumBefore.toLocaleString()}</b>`;
        if (isUpgrade) sumStr += ` ➜ <b>${tierSumAfter.toLocaleString()}</b>`;
        allRows.push([`<b>Total</b>`, sumStr]);
    }
    showTable("Tech Research Cost", "icons/spt_disc.png", { label: "Discount", before: `-${cur}%`, after: `-${proj}%` }, headers, allRows, 6, ['I', 'II', 'III', 'IV', 'V']);
}

function showTechTimerTable(cur, proj) {
    const isUpgrade = proj > cur;
    const speedBonus = Math.max(cur, proj);
    const headers = ['Level', 'Duration'];
    const allRows = [];
    
    for (let t = 1; t <= 5; t++) {
        let tierSumBefore = 0;
        let tierSumAfter = 0;

        for (let i = 0; i < 5; i++) {
            const base = tierTimes[t][i];
            const v1 = base / (1 + cur / 100);
            const v2 = base / (1 + proj / 100);
            tierSumBefore += v1;
            tierSumAfter += v2;
            let valStr = formatSmartTime(v1);
            if (isUpgrade) valStr += ` ➜ ${formatSmartTime(v2)}`;
            allRows.push([`<b>Lv ${i + 1}</b>`, valStr]);
        }
        let sumStr = `<b>${formatSmartTime(tierSumBefore)}</b>`;
        if (isUpgrade) sumStr += ` ➜ <b>${formatSmartTime(tierSumAfter)}</b>`;
        allRows.push([`<b>Total</b>`, sumStr]);
    }
    showTable("Tech Research Time", "icons/spt_timer.png", { label: "Speed Bonus", before: `+${cur}%`, after: `+${proj}%` }, headers, allRows, 6, ['I', 'II', 'III', 'IV', 'V']);
}

function showEqSellTable(cur, proj, page = 1) {
    const isUpgrade = proj > cur; 
    const headers = ["Level", "Sell Price"];
    const allRows = [];
    
    for (let i = 1; i <= 149; i++) {
        const base = 20 * Math.pow(1.01, i - 1);
        const v1 = Math.round(base * (100 + cur) / 100);
        const v2 = Math.round(base * (100 + proj) / 100);
        let valStr = formatResourceValue(v1, 'gold');
        if (isUpgrade) valStr += ` ➜ ${formatResourceValue(v2, 'gold')}`;
        allRows.push([`<b>${i}</b>`, valStr]);
    }
    showTable("Item Sell Price", "icons/forge_sell.png", { label: "Bonus", before: `+${cur}%`, after: `+${proj}%` }, headers, allRows);
}

function showForgeTable(type, cur, proj, page = 1) {
    const isUpgrade = proj > cur;
    const isT = type === 'timer';
    const title = isT ? "Forge Upgrade Time" : "Forge Upgrade Cost";
    const iconSrc = isT ? "icons/forge_timer.png" : "icons/forge_disc.png";
    const headers = ["Level", isT ? "Upgrade Duration" : "Upgrade Cost"]; 
    const rows = [];

    for (let i = 1; i <= 34; i++) {
        if (!forgeLevelData[i]) continue;
        const [cost, hours] = forgeLevelData[i];
        let v1, v2;
        if (isT) {
             const mins = hours * 60;
             v1 = formatSmartTime(mins / (1 + cur / 100));
             v2 = formatSmartTime(mins / (1 + proj / 100));
        } else {
             v1 = formatForgeCost(Math.round(cost * (1 - cur / 100)));
             v2 = formatForgeCost(Math.round(cost * (1 - proj / 100)));
        }
        let cellContent = v1;
        if (isUpgrade) cellContent += ` ➜ ${v2}`;
        const levelLabel = `<b>${i} ➜ ${i + 1}</b>`;
        rows.push([levelLabel, cellContent]);
    }
    showTable(title, iconSrc, isT ? { label: "Speed", before: `+${cur}%`, after: `+${proj}%` } : { label: "Discount", before: `-${cur}%`, after: `-${proj}%` }, headers, rows, 50);
}

// --- UNDO / REDO ---

function pushHistory() {
    if (historyStack.length > 50) historyStack.shift();
    if (typeof captureFullState === 'function') {
        historyStack.push(JSON.stringify(captureFullState()));
        redoStack = [];
        updateUndoRedoBtns();
        if (typeof saveToLocalStorage === 'function') saveToLocalStorage();
    }
}

function undo() {
    if (historyStack.length === 0) return;
    if (typeof captureFullState !== 'function' || typeof loadState !== 'function') return;
    redoStack.push(JSON.stringify(captureFullState()));
    const stateToLoad = JSON.parse(historyStack.pop());
    if (typeof eggPlanQueue !== 'undefined') {
        const currentEggStart = document.getElementById('egg-date-desktop') ? document.getElementById('egg-date-desktop').value : null;
        stateToLoad.eggData = { queue: eggPlanQueue, start: currentEggStart };
    }
    loadState(stateToLoad);
    updateUndoRedoBtns();
    if (typeof saveToLocalStorage === 'function') saveToLocalStorage();
}

function redo() {
    if (redoStack.length === 0) return;
    if (typeof captureFullState !== 'function' || typeof loadState !== 'function') return;
    historyStack.push(JSON.stringify(captureFullState()));
    const stateToLoad = JSON.parse(redoStack.pop());
    if (typeof eggPlanQueue !== 'undefined') {
        const currentEggStart = document.getElementById('egg-date-desktop') ? document.getElementById('egg-date-desktop').value : null;
        stateToLoad.eggData = { queue: eggPlanQueue, start: currentEggStart };
    }
    loadState(stateToLoad);
    updateUndoRedoBtns();
    if (typeof saveToLocalStorage === 'function') saveToLocalStorage();
}

function updateUndoRedoBtns() {
    const hasHistory = (typeof historyStack !== 'undefined' && historyStack.length > 0);
    const hasRedo = (typeof redoStack !== 'undefined' && redoStack.length > 0);
    const undoIds = ['btn-undo-desktop', 'btn-undo-log', 'btn-undo', 'btn-undo-mobile-new'];
    const redoIds = ['btn-redo-desktop', 'btn-redo-log', 'btn-redo', 'btn-redo-mobile-new'];
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

// --- HELPERS (Logic) ---

function getMeta(id) { const p = id.split('_'); return TREES[p[0]].meta[p.slice(2).join('_')]; }
function getTier(id) { return parseInt(id.split('_T')[1]); }
function getParents(id) {
    const p = id.split('_'), tree = p[0], tier = parseInt(p[1].substring(1)), local = p.slice(2).join('_'), meta = TREES[tree].meta[local], res = [];
    meta.p.forEach(par => res.push(`${tree}_T${tier}_${par}`));
    if (tier > 1) {
        if (tree === 'forge' && local === 'timer') res.push(`forge_T${tier - 1}_off_c`);
        if (tree === 'forge' && local === 'disc') res.push(`forge_T${tier - 1}_off_h`);
        if (tree === 'spt' && local === 'timer') res.push(`spt_T${tier - 1}_key_g`, `spt_T${tier - 1}_key_r`);
        if (tree === 'power' && (local === 'weapon_1' || local === 'helmet_1')) res.push(`power_T${tier - 1}_mount_chance`);
    }
    return res;
}
function isUnlocked(id, lvls) { const p = getParents(id); return p.length === 0 || p.every(pr => (lvls[pr] || 0) > 0); }
function toRoman(n) { return ["", "I", "II", "III", "IV", "V"][n]; }

function getMinLevel(maxLv) {
    if (maxLv === 99) return 96;
    let floor = 1;
    for (let f of bracketFloors) if (f <= maxLv - 5) floor = f; else break;
    return floor;
}

function getSlotStats(maxLv, bonus) {
    let total = 0, count = 0, minLv = getMinLevel(maxLv);
    for (let i = minLv; i <= maxLv; i++) { total += Math.round(20 * Math.pow(1.01, i - 1) * (100 + bonus) / 100); count++; }
    return { range: `${minLv}-${maxLv}`, avg: (count > 0 ? total / count : 0) };
}

// --- HELPERS (Formatting) ---

function formatSmartTime(totalMins) {
    if (totalMins < 60) {
        const mFloor = Math.floor(totalMins);
        const s = Math.round((totalMins - mFloor) * 60);
        if (s === 60) return `${mFloor + 1}m`;
        if (mFloor === 0 && s > 0) return `${s}s`;
        if (mFloor === 0 && s === 0) return `0m`;
        return s > 0 ? `${mFloor}m ${s}s` : `${mFloor}m`;
    }
    const m = Math.round(totalMins);
    if (m < 60) return `${m}m`;
    let h = Math.floor(m / 60), minLeft = m % 60;
    if (h < 24) return minLeft > 0 ? `${h}h ${minLeft}m` : `${h}h`;
    const d = Math.floor(h / 24), hLeft = h % 24;
    let res = `${d}d`; if (hLeft > 0) res += ` ${hLeft}h`; if (minLeft > 0) res += ` ${minLeft}m`;
    return res;
}

function formatResourceValue(val, type) {
    if (type === 'hammer') return Math.round(val).toLocaleString('en-US');
    if (val < 1000) return val.toLocaleString('en-US', { maximumFractionDigits: 1 });
    if (val < 1000000) return (val / 1000).toFixed(1) + 'k';
    return (val / 1000000).toFixed(2) + 'm';
}

function formatForgeCost(val) {
    if (val < 1000) return val.toLocaleString('en-US');
    if (val < 10000) return (val / 1000).toFixed(2) + 'k';
    if (val < 1000000) return (val / 1000).toFixed(1) + 'k';
    return (val / 1000000).toFixed(2) + 'm';
}