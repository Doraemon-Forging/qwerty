/**
 * TECH-PLANNER.JS
 * Core logic for the Tree Planner, Stats, and Simulation engine.
 */

// --- GLOBAL STATE ---
let activeTreeKey = 'forge';
let currentMode = 'setup'; // 'setup', 'plan', 'log'
let setupLevels = {};
let planQueue = [];
let expandedLogIndex = -1;
let insertModeIndex = -1;
let historyStack = [];
let redoStack = [];
let lineUpdateRequested = false;
let scrollPositions = { forge: 0, spt: 0, power: 0, stats: 0 };

// --- TREE NAVIGATION & RENDERING ---

function switchTree(key) {
    if (key === 'stats') return; // Prevent switching if called by mistake

    // 1. Update Dropdown Label
    const names = { forge: 'Forge', spt: 'SPT', power: 'Power' };
    const btn = document.getElementById('tree-select-label');
    if (btn) btn.innerHTML = `${names[key]} ▼`;

    // 2. Save Scroll Position
    const treeCont = document.getElementById('tree-container');
    if (treeCont) scrollPositions[activeTreeKey] = treeCont.scrollTop;

    // 3. Switch Context
    activeTreeKey = key;
    
    // 4. Update UI Tabs (Desktop)
    document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active-forge', 'active-spt', 'active-power'));
    const tab = document.querySelector(`#tab-${key}`);
    if (tab) tab.classList.add(TREES[key].colorClass);

    // 4b. Update UI Tabs (Mobile Sticky Nav)
    ['forge', 'spt', 'power'].forEach(k => {
        const mBtn = document.getElementById(`mtab-${k}`);
        if(mBtn) {
            if(k === key) mBtn.classList.add('active');
            else mBtn.classList.remove('active');
        }
    });

    // 5. Restore Scroll & Render
    // Ensure Tree Container is always visible now
    treeCont.style.display = 'flex';
    document.getElementById('stats-container').style.display = 'block'; // Ensure inner container is visible (outer panel handles hide/show)
    
    treeCont.scrollTop = scrollPositions[key] || 0;

    document.getElementById('canvas').className = `tree-canvas tree-${key}`;
    renderTree(key);
    setTimeout(drawLines, 0);
}

function renderTree(key) {
    const canvas = document.getElementById('canvas');
    // Remove existing nodes but keep the SVG layer and Reset button
    Array.from(canvas.children).forEach(c => {
        if (!c.classList.contains('connections-layer') && !c.classList.contains('tree-reset-btn')) c.remove();
    });

    const data = TREES[key];

    // Build Tiers
    for (let t = 1; t <= 5; t++) {
        const block = document.createElement('div'); block.className = 'tier-block';
        const label = document.createElement('div'); label.className = 'tier-label'; label.innerText = `TIER ${toRoman(t)}`;
        block.appendChild(label);

        const rows = {};
        data.structure.forEach(nDef => {
            const fullId = `${key}_T${t}_${nDef.id}`;
            const meta = data.meta[nDef.id];
            if (!meta) return;

            // Create Row if needed
            if (!rows[nDef.r]) {
                const rDiv = document.createElement('div');
                rDiv.style = "display:flex;justify-content:center;margin-bottom:30px;width:100%";
                block.appendChild(rDiv);
                rows[nDef.r] = rDiv;
            }

            // Create Node
            const node = document.createElement('div');
            node.className = 'node';
            node.id = fullId;
            node.dataset.name = meta.n;
            node.title = `${meta.n} ${toRoman(t)}`;
            if (nDef.c === 1) node.style.marginLeft = "120px"; // Offset logic

            // Icon & Badges
            const iconPath = `icons/${key}_${nDef.id}.png`;
            const fallbackEmoji = key === 'forge' ? '🔨' : (key === 'spt' ? '🐾' : '⚔️');
            const speedBadge = meta.speed ? `<div class="node-speed-badge">⚡</div>` : '';

            node.innerHTML = `
                <div class="node-tier-badge">${toRoman(t)}</div>
                <img src="${iconPath}" class="node-img" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
                <div class="node-fallback" style="display:none">${fallbackEmoji}</div>
                ${speedBadge}
                <div class="node-level">0/${meta.m}</div>
            `;

            // Listeners
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

// --- CALCULATION ENGINE ---

function calcState(customQueue) {
    const levels = { ...setupLevels };
    let totalMin = 0, history = [], speed = 0, totalPotions = 0, totalSellBonusCur = 0, currentDiscount = 0;

    // 1. Calculate Initial State (Base levels)
    Object.keys(setupLevels).forEach(id => {
        const m = getMeta(id);
        if (m && m.n === "Eq. Sell Price") totalSellBonusCur += (setupLevels[id] * 2);
    });
    Object.keys(levels).forEach(id => {
        const m = getMeta(id);
        if (m && m.speed) speed += m.speed * levels[id];
        if (m && m.isDiscount) currentDiscount += levels[id] * 2;
    });
    if (speed > 1) speed = 1; // Cap initial speed at 100%

    // 2. Process Queue
    const q = customQueue || planQueue;
    const brokenSteps = [];

    q.forEach((item, i) => {
        if (item.type === 'delay') {
            totalMin += item.mins;
            history.push({ type: 'delay', mins: item.mins, idx: i });
        } else {
            // Check dependencies
            if (!isUnlocked(item.id, levels)) {
                brokenSteps.push(i);
                return;
            }

            const cur = levels[item.id] || 0;
            const m = getMeta(item.id);

            // Cap level
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

            // Apply benefits for next steps
            if (m.speed) { speed += m.speed; if (speed > 1) speed = 1; }
            if (m.isDiscount) currentDiscount += 2;

            history.push({
                type: 'node', id: item.id, name: m.n, lvl: levels[item.id],
                added: finalTime, cost: finalPotion, speedStr: `+${spStr}% Speed`,
                idx: i, tree: item.id.split('_')[0]
            });
        }
    });

    // 3. Calculate Final Sell Bonus
    let totalSellBonusProj = 0;
    Object.keys(levels).forEach(id => {
        const m = getMeta(id);
        if (m && m.n === "Eq. Sell Price") totalSellBonusProj += (levels[id] * 2);
    });

    return { levels, totalMin, history, finalSpeed: speed, brokenSteps, totalPotions, totalSellBonusCur, totalSellBonusProj };
}

function updateCalculations() {
    const state = calcState();

    // 1. Update Top Bar (Resources & Time)
    const sVal = document.getElementById('start-date').value;
    const start = sVal ? new Date(sVal) : new Date();
    const startTime = start.getTime();

    // Prepare text values
    const potStr = state.totalPotions.toLocaleString('en-US');
    const timeStr = formatSmartTime(state.totalMin);

    // Update Mobile IDs
    const resVal = document.getElementById('res-val');
    const timeVal = document.getElementById('time-val');
    if (resVal) resVal.innerText = potStr;
    if (timeVal) timeVal.innerText = timeStr;

    // Update Desktop IDs (New)
    const resValDesk = document.getElementById('res-val-desktop');
    const timeValDesk = document.getElementById('time-val-desktop');
    if (resValDesk) resValDesk.innerText = potStr;
    if (timeValDesk) timeValDesk.innerText = timeStr;

    // 3. Update Visual Node States (CSS Classes)
    const vLvls = currentMode === 'setup' ? setupLevels : state.levels;
    document.querySelectorAll('.node').forEach(el => {
        const lvl = vLvls[el.id] || 0;
        const m = getMeta(el.id);
        if (!m) return;

        // Update Level Text
        const lvlLabel = el.querySelector('.node-level');
        if (lvlLabel) lvlLabel.innerText = `${lvl}/${m.m}`;

        // Update Classes
        el.className = 'node';
        if (isUnlocked(el.id, vLvls)) el.classList.add('unlocked');
        if (setupLevels[el.id]) el.classList.add('active-setup');
        if (lvl > (setupLevels[el.id] || 0)) el.classList.add('active-plan');
        if (lvl >= m.m) el.classList.add('maxed');

        // Opacity for locked nodes
        el.style.opacity = (!isUnlocked(el.id, vLvls) && lvl === 0) ? "0.3" : "1";
    });

    // 4. Render Log List
    const list = document.getElementById('log-list');
    if (list) {
        list.innerHTML = '';
        let curTime = startTime;

        state.history.forEach(h => {
            const row = document.createElement('div');
            row.className = `log-row ${expandedLogIndex === h.idx ? 'expanded' : ''}`;

            let durMs = (h.type === 'delay' ? h.mins : h.added) * 60000;
            curTime += durMs;

            const finishDate = new Date(curTime);
            const finishTs = finishDate.getTime();
            const durStr = formatSmartTime(h.type === 'delay' ? h.mins : h.added);
            // Force 'en-GB' locale to ensure 24-hour format with a colon (:)
            const finishDateStr = finishDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) + ', ' + finishDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
            let content = '';
            if (h.type === 'delay') {
                content = `<div class="log-entry delay" onclick="toggleExp(${h.idx})"><span>💤 DELAY (+${h.mins}m)</span><span class="log-time">${finishDateStr}</span></div>`;
            } else {
                const tierNum = getTier(h.id);
                const costHtml = `${h.cost.toLocaleString('en-US')} <img src="icons/red_potion.png" style="height:1em; vertical-align:middle">`;
                content = `
                    <div class="log-entry ${h.tree}" onclick="toggleExp(${h.idx})">
                        <div style="color:#fff"><b>${h.name} ${toRoman(tierNum)}</b> <small>Lv ${h.lvl}</small></div>
                        <div style="text-align:right">
                            <div class="log-time">${finishDateStr}</div>
                            <div class="log-details">${costHtml} | ⏱️ ${durStr} | ${h.speedStr}</div>
                        </div>
                    </div>`;
            }

            row.innerHTML = content + `
                <div class="log-controls">
                    <button class="btn-ctrl" style="background:#c0392b" onclick="delStep(${h.idx})">🗑️ Delete</button>
                    <button class="btn-ctrl" style="background:#2980b9" onclick="markDone(${h.idx}, ${finishTs})">✅ Done</button>
                    <button class="btn-ctrl" style="background:#27ae60" onclick="addDelay(${h.idx})">➕ Delay</button>
                    <button class="btn-ctrl" style="background:#f39c12" onclick="activateInsert(${h.idx})">⤵️ Insert</button>
                </div>`;
            list.appendChild(row);
        });
    }

    drawLines();

    const statsPanel = document.getElementById('panel-stats');
    if (statsPanel && statsPanel.style.display !== 'none') {
        renderStats();
    }

    // Update Plan Button State (Desktop)
    const pBtn = document.getElementById('btn-plan');
    if (pBtn) {
        if (insertModeIndex > -1) {
            pBtn.innerHTML = "⤵️ INSERTING...";
            pBtn.classList.add('insert');
        } else {
            pBtn.innerHTML = "📅 Plan";
            pBtn.classList.remove('insert');
        }
    }
}

// --- VISUALIZATION (LINES) ---

function drawLines() {
    if (lineUpdateRequested) return;
    lineUpdateRequested = true;

    requestAnimationFrame(() => {
        const svg = document.getElementById('svg-layer');
        const canvas = document.getElementById('canvas');
        if (!canvas || !svg) {
            lineUpdateRequested = false;
            return;
        }

        svg.innerHTML = ''; // Clear lines

        // Calculate height
        const lastBlock = canvas.lastElementChild;
        let contentHeight = 0;
        if (lastBlock) {
            contentHeight = lastBlock.offsetTop + lastBlock.offsetHeight;
        }
        svg.style.height = (contentHeight + 20) + "px";

        // Determine which levels to use for coloring lines
        const vLvls = currentMode === 'setup' ? setupLevels : calcState().levels;
        const offset = document.querySelector('.node') ? document.querySelector('.node').offsetWidth / 2 : 32;

        document.querySelectorAll('.node').forEach(child => {
            if (child.closest('.tree-container').style.display === 'none') return;

            getParents(child.id).forEach(pId => {
                const parent = document.getElementById(pId);
                if (!parent) return;

                const r1 = parent.getBoundingClientRect();
                const r2 = child.getBoundingClientRect();
                const c = canvas.getBoundingClientRect();

                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', r1.left + offset - c.left);
                line.setAttribute('y1', r1.top + offset - c.top);
                line.setAttribute('x2', r2.left + offset - c.left);
                line.setAttribute('y2', r2.top + offset - c.top);

                // Color line if parent is unlocked/leveled
                line.setAttribute('class', `connector ${(vLvls[pId] > 0) ? 'active-' + pId.split('_')[0] : ''}`);
                svg.appendChild(line);
            });
        });
        lineUpdateRequested = false;
    });
}

// --- INTERACTION HANDLERS ---

function handleClick(id, isRight) {
    showFloatingLabel(id);
    pushHistory(); // Undo point
    const meta = getMeta(id);

    if (currentMode === 'setup') {
        if (isRight) {
            // Decrease level
            if ((setupLevels[id] || 0) > 1) {
                setupLevels[id]--;
            } else {
                delete setupLevels[id];
            }
        } else {
            // Increase level
            setupLevels[id] = Math.min(meta.m, (setupLevels[id] || 0) + 1);
            if ((setupLevels[id] || 0) === 1) autoUnlock(id);
        }

        // Integrity Check: Remove nodes that lost their parents
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
            // Remove planned steps dependent on removed setup nodes
            const sim = calcState();
            if (sim.brokenSteps.length > 0) {
                for (let i = sim.brokenSteps.length - 1; i >= 0; i--) {
                    planQueue.splice(sim.brokenSteps[i], 1);
                }
            }
        }
    } else {
        // Plan Mode
        if (isRight) {
            // Remove from queue (find last instance)
            let idx = -1;
            for (let i = planQueue.length - 1; i >= 0; i--) {
                if (planQueue[i].id === id) { idx = i; break; }
            }
            if (idx > -1) {
                planQueue.splice(idx, 1);
                // Clean dependencies
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
            // Add to queue
            const s = calcState();
            if ((s.levels[id] || 0) < meta.m && isUnlocked(id, s.levels)) {
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
    // Maximize this node in Setup
    setupLevels[id] = getMeta(id).m;

    // Recursively unlock parents
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
    const color = tree === 'forge' ? '#4facfe' : (tree === 'spt' ? '#9b59b6' : '#e74c3c');
    lbl.innerHTML = `<span style="color:${color}">${meta.n} ${toRoman(tier)}</span>`;

    document.body.appendChild(lbl);
    const rect = node.getBoundingClientRect();
    lbl.style.left = (rect.left + rect.width / 2) + 'px';
    lbl.style.top = (rect.top - 15) + 'px';

    setTimeout(() => {
        lbl.style.opacity = '0';
        setTimeout(() => lbl.remove(), 500);
    }, 2000);
}

// --- LOG & PLAN MANAGEMENT ---

function setMode(m) {
    currentMode = m;
    if (m !== 'plan') insertModeIndex = -1;

    // Toggle Buttons (Desktop, Mobile Old, Mobile New)
    ['setup', 'plan'].forEach(mode => {
        const dBtn = document.getElementById(`btn-${mode}`);
        const mBtn = document.getElementById(`btn-${mode}-mobile`);
        const mBtnNew = document.getElementById(`btn-${mode}-mobile-new`);

        if (dBtn) dBtn.className = `mode-btn ${mode} ${m === mode ? 'active' : ''}`;
        if (mBtn) mBtn.className = `mode-btn ${mode} ${m === mode ? 'active' : ''}`;
        if (mBtnNew) mBtnNew.className = `tn-mode-btn ${mode} ${m === mode ? 'active' : ''}`;
    });

    // Update Mobile Plan Button Text (Plan vs Insert)
    const planBtnNew = document.getElementById('btn-plan-mobile-new');
    if (planBtnNew) {
        if (insertModeIndex > -1) {
            // Keep the emoji when changing text
            planBtnNew.innerText = "⤵️ Insert";
            planBtnNew.classList.add('insert');
        } else {
            planBtnNew.innerText = "📅 Plan";
            planBtnNew.classList.remove('insert');
        }
    }

    // View switching logic (same as before)
    if (m === 'log') {
        if (typeof setSidebarPanel === 'function') setSidebarPanel('logs');
    } else {
        if (window.innerWidth <= 768) {
            document.body.classList.remove('view-log', 'view-calc', 'view-egg');
            document.body.classList.add('view-planner');
        }
    }
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
        // 1. Commit levels to setup
        for (let i = 0; i <= targetIdx; i++) {
            const item = planQueue[i];
            if (item.type === 'node') {
                const cur = setupLevels[item.id] || 0;
                const meta = getMeta(item.id);
                if (meta) setupLevels[item.id] = Math.min(meta.m, cur + 1);
            }
        }

        // 2. Remove from queue
        planQueue.splice(0, targetIdx + 1);

        // 3. Clean dependencies
        let clean = false;
        while (!clean) {
            const sim = calcState(planQueue);
            if (sim.brokenSteps.length > 0) {
                for (let j = sim.brokenSteps.length - 1; j >= 0; j--) {
                    planQueue.splice(sim.brokenSteps[j], 1);
                }
            } else clean = true;
        }

        // 4. Sync Time
        const d = new Date(timestamp);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        const localIso = d.toISOString().slice(0, 16);

        if (typeof syncMainDate === 'function') syncMainDate(localIso);
        expandedLogIndex = -1;
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
    // Remove setup levels
    Object.keys(setupLevels).forEach(id => {
        if (id.startsWith(activeTreeKey + "_")) delete setupLevels[id];
    });
    // Remove plan steps
    planQueue = planQueue.filter(item => (item.type === 'node') ? !item.id.startsWith(activeTreeKey + "_") : true);
    // Cleanup
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

    // Calculate Isolated Stats (for Power Tree avg)
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

    // Render Each Tree Section
    ['forge', 'spt', 'power'].forEach(key => {
        const treeData = TREES[key];
        let currentCount = 0;
        Object.keys(setupLevels).forEach(id => { if (id.startsWith(key + '_')) currentCount += setupLevels[id]; });
        const max = treeData.maxLevels;
        const pct = ((currentCount / max) * 100).toFixed(1);

        const group = document.createElement('div'); group.className = 'stats-group';
        const header = document.createElement('div'); header.className = `stats-header ${key}`;
        
header.innerHTML = `<img src="icons/tree_${key === 'spt' ? 'SPT' : key}.png" class="nav-icon"> ${treeData.name.toUpperCase()} <span class="progress-badge">${currentCount}/${max} (${pct}%)</span>`;
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

            // Special Buttons (Tables)
            if (key === 'forge' && ns.id === 'sell') {
                txtCur += ` <span style="color:#aaa;font-size:0.9em">(Avg: ${formatResourceValue(globCur, 'gold')} <img src="icons/fm_gold.png" class="stat-key-icon">)</span> <button class="btn-table" onclick="showEqSellTable(${curT * 2},${projT * 2},4)">🔍</button>`;
                txtProj += ` <span style="font-size:0.9em">(Avg: ${formatResourceValue(globProj_SellIso, 'gold')} <img src="icons/fm_gold.png" class="stat-key-icon">)</span>`;
            } else if (meta.isSlot) {
                const sCur = getSlotStats(99 + curT * 2, state.totalSellBonusCur);
                const sProj = getSlotStats(99 + projT * 2, state.totalSellBonusCur);
                txtCur = `Max ${99 + curT * 2} <span style="color:#aaa;font-size:0.9em">(Range: ${sCur.range} | Avg: ${formatResourceValue(sCur.avg, 'gold')} <img src="icons/fm_gold.png" class="stat-key-icon">)</span>`;
                txtProj = `Max ${99 + projT * 2} <span style="font-size:0.9em">(Range: ${sProj.range} | Avg: ${formatResourceValue(sProj.avg, 'gold')} <img src="icons/fm_gold.png" class="stat-key-icon">)</span>`;
            } else if (meta.isDiscount) {
                txtCur += ` <button class="btn-table" onclick="showPotionTable(${curT * 2})">🔍</button>`;
                if (projT > curT) txtProj += ` <button class="btn-table" onclick="showPotionTable(${projT * 2})">🔍</button>`;
            } else if (key === 'spt' && ns.id === 'timer') {
                txtCur += ` <button class="btn-table" onclick="showTechTimerTable(${curT * 4})">🔍</button>`;
                if (projT > curT) txtProj += ` <button class="btn-table" onclick="showTechTimerTable(${projT * 4})">🔍</button>`;
            } else if (key === 'forge' && ns.id === 'disc') {
                txtCur += ` <button class="btn-table" onclick="showForgeTable('disc',${curT * 2},${projT * 2},2)">🔍</button>`;
            } else if (key === 'forge' && ns.id === 'timer') {
                txtCur += ` <button class="btn-table" onclick="showForgeTable('timer',${curT * 4},${projT * 4},2)">🔍</button>`;
            }

            let finalHTML = txtCur;
            if (projT > curT) finalHTML += `<span class="stat-arrow">➜</span> <span class="stat-new">${txtProj}</span>`;

            const row = document.createElement('div'); row.className = 'stats-row';
            row.innerHTML = `<div class="stat-icon-box"><img src="icons/${key}_${ns.id}.png" class="stat-icon-img" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><div class="stat-icon-fallback" style="display:none">?</div></div><div class="stat-info"><div class="stat-name">${meta.n}</div><div class="stat-value">${finalHTML}</div></div>`;
            group.appendChild(row);
        });
        if (hasStats) container.appendChild(group);
    });

}

// --- TABLE MODALS ---

function showPotionTable(discount) {
    const c = document.getElementById('table-body');
    document.getElementById('table-disclaimer-text').style.display = 'block';
    document.getElementById('table-title').innerHTML = '<img src="icons/red_potion.png" style="height:1.2em;vertical-align:bottom"> Tech Upgrade Cost';
    document.getElementById('table-subtitle').innerText = `Discount: -${discount}%`;

    let h = '<table class="cost-table"><thead><tr><th>Level</th>';
    for (let t = 1; t <= 5; t++) h += `<th>Tier ${toRoman(t)}</th>`;
    h += '</tr></thead><tbody>';

    for (let i = 0; i < 5; i++) {
        h += `<tr><td><b>Lv ${i + 1}</b></td>`;
        for (let t = 1; t <= 5; t++) {
            const cost = Math.round(potionCosts[t][i] * (1 - discount / 100));
            h += `<td>${cost.toLocaleString()}</td>`;
        }
        h += '</tr>';
    }
    h += '<tr class="cost-total-col"><td><b>Total</b></td>';
    for (let t = 1; t <= 5; t++) {
        let tierTotal = 0;
        potionCosts[t].forEach(b => tierTotal += Math.round(b * (1 - discount / 100)));
        h += `<td>${tierTotal.toLocaleString()}</td>`;
    }
    h += '</tr></tbody></table>';
    c.innerHTML = h;
    document.getElementById('tableModal').style.display = 'block';
}

function showTechTimerTable(speedBonus) {
    const c = document.getElementById('table-body');
    document.getElementById('table-disclaimer-text').style.display = 'block';
    document.getElementById('table-title').innerText = '⏱️ Tech Research Timer';
    document.getElementById('table-subtitle').innerText = `Speed Bonus: +${speedBonus}%`;

    let h = '<table class="cost-table"><thead><tr><th>Level</th>';
    for (let t = 1; t <= 5; t++) h += `<th>Tier ${toRoman(t)}</th>`;
    h += '</tr></thead><tbody>';

    for (let i = 0; i < 5; i++) {
        h += `<tr><td><b>Lv ${i + 1}</b></td>`;
        for (let t = 1; t <= 5; t++) {
            const time = tierTimes[t][i] / (1 + speedBonus / 100);
            h += `<td>${formatSmartTime(time)}</td>`;
        }
        h += '</tr>';
    }
    h += '<tr class="cost-total-col"><td><b>Total</b></td>';
    for (let t = 1; t <= 5; t++) {
        let tierTotal = 0;
        tierTimes[t].forEach(b => tierTotal += b / (1 + speedBonus / 100));
        h += `<td>${formatSmartTime(tierTotal)}</td>`;
    }
    h += '</tr></tbody></table>';
    c.innerHTML = h;
    document.getElementById('tableModal').style.display = 'block';
}

function showEqSellTable(cur, proj, page = 1) {
    const c = document.getElementById('table-body');
    document.getElementById('table-title').innerHTML = '<img src="icons/fm_gold.png" style="height:1.2em;vertical-align:bottom"> Eq. Sell Price';
    document.getElementById('table-disclaimer-text').style.display = 'none';
    document.getElementById('table-subtitle').innerText = `Bonus: +${cur}% ${cur !== proj ? ' ➜ +' + proj + '%' : ''}`;

    const ranges = [
        { label: "Lv 1-30", start: 1, end: 30 },
        { label: "Lv 31-60", start: 31, end: 60 },
        { label: "Lv 61-90", start: 61, end: 90 },
        { label: "Lv 91-120", start: 91, end: 120 },
        { label: "Lv 121-149", start: 121, end: 149 }
    ];

    let h = `<div class="pagination-bar">`;
    ranges.forEach((r, i) => h += `<button class="page-btn ${i + 1 === page ? 'active' : ''}" onclick="showEqSellTable(${cur},${proj},${i + 1})">${r.label}</button>`);
    h += `</div><div class="modal-grid-3">`;

    const { start, end } = ranges[page - 1];
    const icon = `<img src="icons/fm_gold.png" style="height:1.2em;vertical-align:middle">`;
    const totalItems = (end - start) + 1;
    const colCount = window.innerWidth <= 768 ? 2 : 3;
    const perCol = Math.ceil(totalItems / colCount);

    for (let col = 0; col < colCount; col++) {
        h += `<div><table class="mini-table">`;
        const cs = start + (col * perCol);
        const ce = Math.min(end, cs + perCol - 1);
        if (cs <= end) {
            for (let i = cs; i <= ce; i++) {
                const base = 20 * Math.pow(1.01, i - 1);
                const v1 = Math.round(base * (100 + cur) / 100);
                const v2 = Math.round(base * (100 + proj) / 100);
                h += `<tr class="mini-row"><td>Lv ${i}</td><td>${(cur === proj) ? v1 : v1 + ' ➜ <span style="color:#2ecc71">' + v2 + '</span>'} ${icon}</td></tr>`;
            }
        }
        h += `</table></div>`;
    }
    h += `</div>`;
    c.innerHTML = h;
    document.getElementById('tableModal').style.display = 'block';
}

function showForgeTable(type, cur, proj, page) {
    const c = document.getElementById('table-body'), isT = type === 'timer';
    document.getElementById('table-disclaimer-text').style.display = 'block';
    document.getElementById('table-title').innerText = isT ? 'Forge Upgrade Duration' : 'Forge Upgrade Cost';
    document.getElementById('table-subtitle').innerText = isT ? `Speed: +${cur}% ➜ +${proj}%` : `Discount: -${cur}% ➜ -${proj}%`;
    let h = `<div class="pagination-bar"><button class="page-btn ${page === 1 ? 'active' : ''}" onclick="showForgeTable('${type}',${cur},${proj},1)">Lv 1-19</button><button class="page-btn ${page === 2 ? 'active' : ''}" onclick="showForgeTable('${type}',${cur},${proj},2)">Lv 20-34</button></div>`;
    h += `<div class="modal-grid-2"><div class="grid-header">Level</div><div class="grid-header">${isT ? 'Duration' : 'Cost'}</div>`;
    const start = (page === 1) ? 1 : 20, end = (page === 1) ? 19 : 34, icon = `<img src="icons/fm_gold.png" style="height:1.2em;vertical-align:middle">`;
    for (let i = start; i <= end; i++) {
        if (!forgeLevelData[i]) continue;
        const [cost, hours] = forgeLevelData[i], mins = hours * 60;
        let v1 = isT ? formatSmartTime(mins / (1 + cur / 100)) : formatForgeCost(Math.round(cost * (1 - cur / 100)));
        let v2 = isT ? formatSmartTime(mins / (1 + proj / 100)) : formatForgeCost(Math.round(cost * (1 - proj / 100)));
        h += `<div class="grid-cell">${i} ➜ ${i + 1}</div><div class="grid-cell">${(v1 === v2) ? v1 + (isT ? '' : ' ' + icon) : v1 + ' ➜ <span style="color:#2ecc71">' + v2 + '</span>' + (isT ? '' : ' ' + icon)}</div>`;
    }
    c.innerHTML = h + '</div>'; document.getElementById('tableModal').style.display = 'block';
}

// --- UNDO / REDO ---

function pushHistory() {
    if (historyStack.length > 50) historyStack.shift();
    // Depends on captureFullState which is likely in main.js, 
    // but if strict separation is needed, ensure it is available.
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

    // --- SEPARATION LOGIC ---
    // If egg data exists currently, inject it into the state we are loading.
    // This prevents the Global/Tech Undo from overwriting the Egg Planner.
    if (typeof eggPlanQueue !== 'undefined') {
        const currentEggStart = document.getElementById('egg-date-desktop') ? document.getElementById('egg-date-desktop').value : null;
        stateToLoad.eggData = {
            queue: eggPlanQueue, // Keep current queue
            start: currentEggStart // Keep current start time
        };
    }
    // ------------------------

    loadState(stateToLoad);
    updateUndoRedoBtns();
    if (typeof saveToLocalStorage === 'function') saveToLocalStorage();
}

function redo() {
    if (redoStack.length === 0) return;
    if (typeof captureFullState !== 'function' || typeof loadState !== 'function') return;

    historyStack.push(JSON.stringify(captureFullState()));
    const stateToLoad = JSON.parse(redoStack.pop());

    // --- SEPARATION LOGIC ---
    if (typeof eggPlanQueue !== 'undefined') {
        const currentEggStart = document.getElementById('egg-date-desktop') ? document.getElementById('egg-date-desktop').value : null;
        stateToLoad.eggData = {
            queue: eggPlanQueue,
            start: currentEggStart
        };
    }
    // ------------------------

    loadState(stateToLoad);
    updateUndoRedoBtns();
    if (typeof saveToLocalStorage === 'function') saveToLocalStorage();
}

function updateUndoRedoBtns() {
    // 1. Determine State
    // Check if stacks exist and have items
    const hasHistory = (typeof historyStack !== 'undefined' && historyStack.length > 0);
    const hasRedo = (typeof redoStack !== 'undefined' && redoStack.length > 0);

    // 2. Define All Target IDs (Desktop, Logs, Old Mobile, NEW Mobile)
    // We added 'btn-undo-mobile-new' and 'btn-redo-mobile-new' to this list
    const undoIds = ['btn-undo-desktop', 'btn-undo-log', 'btn-undo', 'btn-undo-mobile-new'];
    const redoIds = ['btn-redo-desktop', 'btn-redo-log', 'btn-redo', 'btn-redo-mobile-new'];

    // 3. Helper to update a button
    const updateBtn = (id, isActive) => {
        const el = document.getElementById(id);
        if (el) {
            el.disabled = !isActive;
            // Force styles just in case CSS rules are missing
            el.style.opacity = !isActive ? "0.3" : "1"; 
            el.style.pointerEvents = !isActive ? "none" : "auto";
        }
    };

    // 4. Execute updates
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