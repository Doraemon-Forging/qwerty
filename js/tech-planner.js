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
    if (key === 'stats') return; 
    const names = { forge: 'Forge', spt: 'SPT', power: 'Power' };
    const btn = document.getElementById('tree-select-label');
    if (btn) btn.innerHTML = `${names[key]} ▼`;

    const treeCont = document.getElementById('tree-container');
    if (treeCont) scrollPositions[activeTreeKey] = treeCont.scrollTop;

    activeTreeKey = key;
    document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active-forge', 'active-spt', 'active-power'));
    const tab = document.querySelector(`#tab-${key}`);
    if (tab) tab.classList.add(TREES[key].colorClass);

    ['forge', 'spt', 'power'].forEach(k => {
        const mBtn = document.getElementById(`mtab-${k}`);
        if(mBtn) {
            if(k === key) mBtn.classList.add('active');
            else mBtn.classList.remove('active');
        }
    });

    treeCont.style.display = 'flex';
    document.getElementById('stats-container').style.display = 'block'; 
    treeCont.scrollTop = scrollPositions[key] || 0;
    document.getElementById('canvas').className = `tree-canvas tree-${key}`;
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
        const label = document.createElement('div'); label.className = 'tier-label'; label.innerText = `TIER ${toRoman(t)}`;
        block.appendChild(label);

        const rows = {};
        data.structure.forEach(nDef => {
            const fullId = `${key}_T${t}_${nDef.id}`;
            const meta = data.meta[nDef.id];
            if (!meta) return;

            if (!rows[nDef.r]) {
                const rDiv = document.createElement('div');
                rDiv.style = "display:flex;justify-content:center;margin-bottom:30px;width:100%";
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
            const speedBadge = meta.speed ? `<div class="node-speed-badge">⚡</div>` : '';

            node.innerHTML = `
                <div class="node-tier-badge">${toRoman(t)}</div>
                <img src="${iconPath}" class="node-img" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
                <div class="node-fallback" style="display:none">${fallbackEmoji}</div>
                ${speedBadge}
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
        el.style.opacity = (!isUnlocked(el.id, vLvls) && lvl === 0) ? "0.3" : "1";
    });

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
            const finishDateStr = finishDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) + ', ' + finishDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
            let content = '';
            if (h.type === 'delay') {
                content = `<div class="log-entry delay" onclick="toggleExp(${h.idx})"><span>💤 DELAY (+${h.mins}m)</span><span class="log-time">${finishDateStr}</span></div>`;
            } else {
                const tierNum = getTier(h.id);
                const costHtml = `${h.cost.toLocaleString('en-US')} <img src="icons/red_potion.png" style="height:1em; vertical-align:middle">`;
                
                const parts = h.id.split('_');
                const iconLocalId = parts.slice(2).join('_'); 
                const iconPath = `icons/${parts[0]}_${iconLocalId}.png`;
                const iconHtml = `<div class="log-node-preview desktop-only"><div class="lnp-tier">${toRoman(tierNum)}</div><img src="${iconPath}" class="lnp-img" onerror="this.style.display='none'"></div>`;

                content = `
                    <div class="log-entry ${h.tree}" onclick="toggleExp(${h.idx})">
                        <div class="log-left-group">
                            ${iconHtml}
                            <div style="color:#fff"><b>${h.name} ${toRoman(tierNum)}</b> <small>Lv ${h.lvl}</small></div>
                        </div>
                        <div style="text-align:right">
                            <div class="log-time">${finishDateStr}</div>
                            <div class="log-details">${costHtml} | ⏱️ ${durStr} | ${h.speedStr}</div>
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
        if (!canvas || !svg) { lineUpdateRequested = false; return; }

        svg.innerHTML = ''; 
        const lastBlock = canvas.lastElementChild;
        let contentHeight = 0;
        if (lastBlock) contentHeight = lastBlock.offsetTop + lastBlock.offsetHeight;
        svg.style.height = (contentHeight + 20) + "px";

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
    const color = tree === 'forge' ? '#4facfe' : (tree === 'spt' ? '#9b59b6' : '#e74c3c');
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
    if (m !== 'plan') insertModeIndex = -1;
    ['setup', 'plan'].forEach(mode => {
        const dBtn = document.getElementById(`btn-${mode}`);
        const mBtn = document.getElementById(`btn-${mode}-mobile`);
        const mBtnNew = document.getElementById(`btn-${mode}-mobile-new`);
        if (dBtn) dBtn.className = `mode-btn ${mode} ${m === mode ? 'active' : ''}`;
        if (mBtn) mBtn.className = `mode-btn ${mode} ${m === mode ? 'active' : ''}`;
        if (mBtnNew) mBtnNew.className = `tn-mode-btn ${mode} ${m === mode ? 'active' : ''}`;
    });
    const planBtnNew = document.getElementById('btn-plan-mobile-new');
    if (planBtnNew) {
        if (insertModeIndex > -1) {
            planBtnNew.innerText = "⤵️ Insert";
            planBtnNew.classList.add('insert');
        } else {
            planBtnNew.innerText = "📅 Plan";
            planBtnNew.classList.remove('insert');
        }
    }
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

            // --- REPLACED BUTTON LOGIC FOR NEW MODALS ---
            if (key === 'forge' && ns.id === 'sell') {
                txtCur += ` <span style="color:#aaa;font-size:0.9em">(Avg: ${formatResourceValue(globCur, 'gold')} <img src="icons/fm_gold.png" class="stat-key-icon">)</span> <button class="btn-table" onclick="showEqSellTable(${curT * 2},${projT * 2},1)">🔍</button>`;
                txtProj += ` <span style="font-size:0.9em">(Avg: ${formatResourceValue(globProj_SellIso, 'gold')} <img src="icons/fm_gold.png" class="stat-key-icon">)</span>`;
            } else if (meta.isSlot) {
                const sCur = getSlotStats(99 + curT * 2, state.totalSellBonusCur);
                const sProj = getSlotStats(99 + projT * 2, state.totalSellBonusCur);
                txtCur = `Max ${99 + curT * 2} <span style="color:#aaa;font-size:0.9em">(Range: ${sCur.range} | Avg: ${formatResourceValue(sCur.avg, 'gold')} <img src="icons/fm_gold.png" class="stat-key-icon">)</span>`;
                txtProj = `Max ${99 + projT * 2} <span style="font-size:0.9em">(Range: ${sProj.range} | Avg: ${formatResourceValue(sProj.avg, 'gold')} <img src="icons/fm_gold.png" class="stat-key-icon">)</span>`;
            } else if (meta.isDiscount) {
                txtCur += ` <button class="btn-table" onclick="showPotionTable(${curT * 2}, ${projT * 2})">🔍</button>`;
                if (projT > curT) txtProj += ` <button class="btn-table" onclick="showPotionTable(${projT * 2}, ${projT * 2})">🔍</button>`;
            } else if (key === 'spt' && ns.id === 'timer') {
                txtCur += ` <button class="btn-table" onclick="showTechTimerTable(${curT * 4}, ${projT * 4})">🔍</button>`;
                if (projT > curT) txtProj += ` <button class="btn-table" onclick="showTechTimerTable(${projT * 4}, ${projT * 4})">🔍</button>`;
            } else if (key === 'forge' && ns.id === 'disc') {
                txtCur += ` <button class="btn-table" onclick="showForgeTable('cost',${curT * 2},${projT * 2},1)">🔍</button>`;
            } else if (key === 'forge' && ns.id === 'timer') {
                txtCur += ` <button class="btn-table" onclick="showForgeTable('timer',${curT * 4},${projT * 4},1)">🔍</button>`;
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

// --- TABLE MODALS (NEW - uses showTable from utils.js) ---

/* js/tech-planner.js (Partial update - Replace the Modal Launchers section) */

// --- TABLE MODALS (NEW - uses showTable from utils.js) ---

function showPotionTable(cur, proj) {
    const discount = Math.max(cur, proj); 
    const headers = ['Level', 'Tier I', 'Tier II', 'Tier III', 'Tier IV', 'Tier V'];
    const rows = [];
    
    for (let i = 0; i < 5; i++) {
        const row = [`<b>Lv ${i + 1}</b>`];
        for (let t = 1; t <= 5; t++) {
            const cost = Math.round(potionCosts[t][i] * (1 - discount / 100));
            row.push(cost.toLocaleString());
        }
        rows.push(row);
    }
    
    const totalRow = ['<b>Total</b>'];
    for (let t = 1; t <= 5; t++) {
        let tierTotal = 0;
        potionCosts[t].forEach(b => tierTotal += Math.round(b * (1 - discount / 100)));
        totalRow.push(`<b>${tierTotal.toLocaleString()}</b>`);
    }
    rows.push(totalRow);

    showTable(
        "Tech Research Cost",  // UPDATED TITLE
        "icons/spt_disc.png",  
        { label: "Discount", before: `-${cur}%`, after: `-${proj}%` }, 
        headers,
        rows
    );
}

function showTechTimerTable(cur, proj) {
    const speedBonus = Math.max(cur, proj);
    const headers = ['Level', 'Tier I', 'Tier II', 'Tier III', 'Tier IV', 'Tier V'];
    const rows = [];
    
    for (let i = 0; i < 5; i++) {
        const row = [`<b>Lv ${i + 1}</b>`];
        for (let t = 1; t <= 5; t++) {
            const time = tierTimes[t][i] / (1 + speedBonus / 100);
            row.push(formatSmartTime(time));
        }
        rows.push(row);
    }
    
    const totalRow = ['<b>Total</b>'];
    for (let t = 1; t <= 5; t++) {
        let tierTotal = 0;
        tierTimes[t].forEach(b => tierTotal += b / (1 + speedBonus / 100));
        totalRow.push(`<b>${formatSmartTime(tierTotal)}</b>`);
    }
    rows.push(totalRow);

    showTable(
        "Tech Research Time",  
        "icons/spt_timer.png", 
        { label: "Speed Bonus", before: `+${cur}%`, after: `+${proj}%` },
        headers,
        rows
    );
}

/* REPLACE THESE TWO FUNCTIONS IN JS/TECH-PLANNER.JS */

function showEqSellTable(cur, proj, page = 1) {
    const c = document.getElementById('table-body');
    // Using SHORT labels for mobile fit
    const ranges = [
        { label: "1-30", start: 1, end: 30 },
        { label: "31-60", start: 31, end: 60 },
        { label: "61-90", start: 61, end: 90 },
        { label: "91-120", start: 91, end: 120 },
        { label: "121-149", start: 121, end: 149 }
    ];

    const headers = ["Level", "Sell Price"];
    const rows = [];
    const icon = `<img src="icons/fm_gold.png" style="height:1em;vertical-align:middle">`;
    
    // Determine range
    const r = ranges[page - 1];
    
    // Generate just this page of rows
    for (let i = r.start; i <= r.end; i++) {
        const base = 20 * Math.pow(1.01, i - 1);
        const v1 = Math.round(base * (100 + cur) / 100);
        const v2 = Math.round(base * (100 + proj) / 100);
        
        let valStr = `${formatResourceValue(v1, 'gold')} ${icon}`;
        if (v1 !== v2) {
            valStr += ` ➜ <span style="color:#2ecc71; font-weight:bold">${formatResourceValue(v2, 'gold')}</span>`;
        }
        rows.push([`<b>Lv ${i}</b>`, valStr]);
    }

    // Custom Builder Call because we need custom button behavior (Active Page)
    // We reuse showTable but we need to trick it into showing our specific buttons
    // Actually, showTable handles pagination automatically for big arrays.
    // Let's pass the FULL array and let showTable handle the "1-30", "31-60" splitting automatically?
    // YES. showTable does that. We just need to give it all 149 rows.
    
    const allRows = [];
    for (let i = 1; i <= 149; i++) {
        const base = 20 * Math.pow(1.01, i - 1);
        const v1 = Math.round(base * (100 + cur) / 100);
        const v2 = Math.round(base * (100 + proj) / 100);
        
        let valStr = `${formatResourceValue(v1, 'gold')} ${icon}`;
        if (v1 !== v2) {
            valStr += ` ➜ <span style="color:#2ecc71; font-weight:bold">${formatResourceValue(v2, 'gold')}</span>`;
        }
        allRows.push([`<b>Lv ${i}</b>`, valStr]);
    }

    showTable(
        "Item Sell Price",
        "icons/forge_sell.png",
        { label: "Bonus", before: `+${cur}%`, after: `+${proj}%` },
        headers,
        allRows 
    );
}

function showForgeTable(type, cur, proj, page = 1) {
    const isT = type === 'timer';
    const title = isT ? "Forge Upgrade Time" : "Forge Upgrade Cost"; // Correct Title
    const iconSrc = isT ? "icons/forge_timer.png" : "icons/forge_disc.png";
    
    const headers = ["Level", isT ? "Duration" : "Cost"];
    const rows = [];
    const icon = `<img src="icons/fm_gold.png" style="height:1em;vertical-align:middle">`;

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

        let cellContent = v1 + (isT ? '' : ` ${icon}`);
        if (v1 !== v2) {
            cellContent += ` ➜ <span style="color:#2ecc71; font-weight:bold">${v2}</span>`;
        }
        rows.push([`${i} ➜ ${i + 1}`, cellContent]);
    }

    showTable(
        title,
        iconSrc,
        isT ? { label: "Speed", before: `+${cur}%`, after: `+${proj}%` } 
            : { label: "Discount", before: `-${cur}%`, after: `-${proj}%` },
        headers,
        rows
    );
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