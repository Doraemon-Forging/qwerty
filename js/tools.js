/**
 * TOOLS.JS
 * Forge Calculator, Stats Rendering, and Egg Planner
 */

// Define Rates locally to ensure Calculator works standalone
const CALC_FORGE_RATES = {
    1: [100, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    2: [99, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    3: [98, 2, 0, 0, 0, 0, 0, 0, 0, 0],
    4: [96, 4, 0, 0, 0, 0, 0, 0, 0, 0],
    5: [91.5, 8, 0.5, 0, 0, 0, 0, 0, 0, 0],
    6: [82, 16, 2, 0, 0, 0, 0, 0, 0, 0],
    7: [64, 32, 4, 0, 0, 0, 0, 0, 0, 0],
    8: [27.8, 64, 8, 0.2, 0, 0, 0, 0, 0, 0],
    9: [13, 70, 16, 1, 0, 0, 0, 0, 0, 0],
    10: [6, 60, 32, 2, 0, 0, 0, 0, 0, 0],
    11: [0, 31.9, 64, 4, 0.1, 0, 0, 0, 0, 0],
    12: [0, 27.5, 64, 8, 0.5, 0, 0, 0, 0, 0],
    13: [0, 8, 75, 16, 1, 0, 0, 0, 0, 0],
    14: [0, 0, 66, 32, 2, 0.05, 0, 0, 0, 0],
    15: [0, 0, 31.7, 64, 4, 0.25, 0, 0, 0, 0],
    16: [0, 0, 21.5, 70, 8, 0.5, 0, 0, 0, 0],
    17: [0, 0, 0, 82.9, 16, 1, 0.05, 0, 0, 0],
    18: [0, 0, 0, 65.7, 32, 2, 0.25, 0, 0, 0],
    19: [0, 0, 0, 31.5, 64, 4, 0.5, 0, 0, 0],
    20: [0, 0, 0, 0, 91, 8, 1, 0.05, 0, 0],
    21: [0, 0, 0, 0, 81.7, 16, 2, 0.25, 0, 0],
    22: [0, 0, 0, 0, 63.5, 32, 4, 0.5, 0, 0],
    23: [0, 0, 0, 0, 27, 64, 8, 1, 0, 0],
    24: [0, 0, 0, 0, 0, 82, 16, 2, 0.01, 0],
    25: [0, 0, 0, 0, 0, 64, 32, 4, 0.05, 0],
    26: [0, 0, 0, 0, 0, 43.8, 50, 6, 0.25, 0],
    27: [0, 0, 0, 0, 0, 31.5, 60, 8, 0.5, 0],
    28: [0, 0, 0, 0, 0, 21, 65, 13, 1, 0],
    29: [0, 0, 0, 0, 0, 7, 68, 23, 2, 0],
    30: [0, 0, 0, 0, 0, 0, 60, 36, 4, 0.01],
    31: [0, 0, 0, 0, 0, 0, 50.9, 43, 6, 0.05],
    32: [0, 0, 0, 0, 0, 0, 41.7, 50, 8, 0.25],
    33: [0, 0, 0, 0, 0, 0, 28.5, 58, 13, 0.5],
    34: [0, 0, 0, 0, 0, 0, 12, 64, 23, 1],
    35: [0, 0, 0, 0, 0, 0, 0, 62, 36, 2]
};

// ==========================================
// 1. STATS RENDERING
// ==========================================

function getMinLevel(maxLv) {
    if (maxLv === 99) return 96;
    let floor = 1; const bracketFloors = [1, 6, 11, 16, 21, 26, 31, 36, 41, 46, 51, 56, 61, 66, 71, 76, 81, 86, 91, 96, 101, 106, 111, 116, 121, 126, 131, 136, 141, 146];
    for (let f of bracketFloors) if (f <= maxLv - 5) floor = f; else break;
    return floor;
}
function getSlotStats(maxLv, bonus) {
    let total = 0, count = 0, minLv = getMinLevel(maxLv);
    for (let i = minLv; i <= maxLv; i++) { total += Math.round(20 * Math.pow(1.01, i - 1) * (100 + bonus) / 100); count++; }
    return { range: `${minLv}-${maxLv}`, avg: (count > 0 ? total / count : 0) };
}

function renderStats() {
    const container = document.getElementById('stats-content');
    if(!container) return;
    container.innerHTML = '';
    const state = calcState();
    let totalAvgCur = 0, totalAvgSellIso = 0;
    const slots = [];
    if (TREES.power && TREES.power.structure) { TREES.power.structure.forEach(s => { if (TREES.power.meta[s.id].isSlot) slots.push(s.id); }); }
    
    slots.forEach(sid => {
        let l = 0; for (let t = 1; t <= 5; t++) l += (setupLevels[`power_T${t}_${sid}`] || 0);
        totalAvgCur += getSlotStats(99 + l * 2, state.totalSellBonusCur).avg;
        totalAvgSellIso += getSlotStats(99 + l * 2, state.totalSellBonusProj).avg;
    });
    const globCur = slots.length > 0 ? totalAvgCur / slots.length : 0;
    const globProj_SellIso = slots.length > 0 ? totalAvgSellIso / slots.length : 0;

    ['forge', 'spt', 'power'].forEach(key => {
        const treeData = TREES[key];
        let currentCount = 0;
        Object.keys(setupLevels).forEach(id => { if (id.startsWith(key + '_')) currentCount += setupLevels[id]; });
        const max = treeData.maxLevels;
        const pct = ((currentCount / max) * 100).toFixed(1);
        const group = document.createElement('div'); group.className = 'stats-group';
        const header = document.createElement('div'); header.className = `stats-header ${key}`;
        header.innerHTML = `<div class="header-left"><div class="header-icon-circle"><img src="icons/tree_${key === 'spt' ? 'SPT' : key}.png" class="nav-icon"></div><span class="header-title-text">${treeData.name.toUpperCase()}</span></div><div class="header-right"><span class="stat-count-text">${currentCount}/${max}</span><span class="stat-pct-text">${pct}%</span></div>`;
        group.appendChild(header);

        let hasStats = false;
        treeData.structure.forEach(ns => {
            const meta = treeData.meta[ns.id];
            if (!meta || !meta.stat) return;
            let curT = 0, projT = 0;
            for (let t = 1; t <= 5; t++) { const id = `${key}_T${t}_${ns.id}`; curT += (setupLevels[id] || 0); projT += (state.levels[id] || 0); }
            hasStats = true;
            let txtCur = meta.stat(curT); let txtProj = meta.stat(projT);
            if (txtProj.includes('%') && txtCur.includes('%')) { const match = txtProj.match(/([+\-]?\d+%?)$/); if (match) txtProj = match[0]; }
            const iconRegex = /([\d\.\,kmb]+)\s*(<img[^>]+>)/g;
            if (txtCur && typeof txtCur === 'string') txtCur = txtCur.replace(iconRegex, '$2 $1');
            if (txtProj && typeof txtProj === 'string') txtProj = txtProj.replace(iconRegex, '$2 $1');
            let infoBtnHTML = '';
            if (key === 'forge' && ns.id === 'sell') { txtCur += ` (Avg: <img src="icons/fm_gold.png" class="stat-key-icon"> ${formatResourceValue(globCur, 'gold')})</span>`; txtProj += ` (Avg: <img src="icons/fm_gold.png" class="stat-key-icon"> ${formatResourceValue(globProj_SellIso, 'gold')})</span>`; infoBtnHTML = `<button class="btn-info" onclick="showEqSellTable(${curT * 2},${projT * 2},1)">i</button>`; }
            else if (meta.isSlot) { const sCur = getSlotStats(99 + curT * 2, state.totalSellBonusCur); const sProj = getSlotStats(99 + projT * 2, state.totalSellBonusCur); txtCur = `Max ${99 + curT * 2} (Range: ${sCur.range} | Avg: <img src="icons/fm_gold.png" class="stat-key-icon"> ${formatResourceValue(sCur.avg, 'gold')})</span>`; txtProj = `Max ${99 + projT * 2} (Range: ${sProj.range} | Avg: <img src="icons/fm_gold.png" class="stat-key-icon"> ${formatResourceValue(sProj.avg, 'gold')})</span>`; }
            else if (meta.isDiscount) { infoBtnHTML = `<button class="btn-info" onclick="showPotionTable(${curT * 2}, ${projT * 2})">i</button>`; }
            else if (key === 'spt' && ns.id === 'timer') { infoBtnHTML = `<button class="btn-info" onclick="showTechTimerTable(${curT * 4}, ${projT * 4})">i</button>`; }
            else if (key === 'forge' && ns.id === 'disc') { infoBtnHTML = `<button class="btn-info" onclick="showForgeTable('cost',${curT * 2},${projT * 2},1)">i</button>`; }
            else if (key === 'forge' && ns.id === 'timer') { infoBtnHTML = `<button class="btn-info" onclick="showForgeTable('timer',${curT * 4},${projT * 4},1)">i</button>`; }
            let finalHTML = txtCur; if (projT > curT) finalHTML += `<span class="stat-arrow">➜</span> <span class="stat-new">${txtProj}</span>`;
            const row = document.createElement('div'); row.className = 'stats-row ' + key; 
            row.innerHTML = `<div class="stat-icon-box"><img src="icons/${key}_${ns.id}.png" class="stat-icon-img" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><div class="stat-icon-fallback" style="display:none">?</div></div><div class="stat-info"><div class="stat-name">${meta.n} ${infoBtnHTML}</div><div class="stat-value">${finalHTML}</div></div>`;
            group.appendChild(row);
        });
        if (hasStats) container.appendChild(group);
    });
}

function showPotionTable(cur, proj) {
    const isUpgrade = proj > cur; const headers = ['Level', 'Upgrade Cost']; const allRows = [];
    for (let t = 1; t <= 5; t++) {
        let tierSumBefore = 0; let tierSumAfter = 0;
        for (let i = 0; i < 5; i++) { const base = potionCosts[t][i]; const v1 = Math.round(base * (1 - cur / 100)); const v2 = Math.round(base * (1 - proj / 100)); tierSumBefore += v1; tierSumAfter += v2; let valStr = v1.toLocaleString(); if (isUpgrade) valStr += ` ➜ ${v2.toLocaleString()}`; allRows.push([`${i + 1}`, valStr]); }
        let sumStr = `${tierSumBefore.toLocaleString()}`; if (isUpgrade) sumStr += ` ➜ ${tierSumAfter.toLocaleString()}`; allRows.push([`Total`, sumStr]);
    }
    showTable("TECH UPGRADE COST", "icons/spt_disc.png", { label: "Discount", before: `-${cur}%`, after: `-${proj}%` }, headers, allRows, 6, ['I', 'II', 'III', 'IV', 'V']);
}
function showTechTimerTable(cur, proj) {
    const isUpgrade = proj > cur; const headers = ['Level', 'Duration']; const allRows = [];
    for (let t = 1; t <= 5; t++) {
        let tierSumBefore = 0; let tierSumAfter = 0;
        for (let i = 0; i < 5; i++) { const base = tierTimes[t][i]; const v1 = base / (1 + cur / 100); const v2 = base / (1 + proj / 100); tierSumBefore += v1; tierSumAfter += v2; let valStr = formatSmartTime(v1); if (isUpgrade) valStr += ` ➜ ${formatSmartTime(v2)}`; allRows.push([`${i + 1}`, valStr]); }
        let sumStr = `${formatSmartTime(tierSumBefore)}`; if (isUpgrade) sumStr += ` ➜ ${formatSmartTime(tierSumAfter)}`; allRows.push([`Total`, sumStr]);
    }
    showTable("TECH RESEARCH TIMER", "icons/spt_timer.png", { label: "Speed Bonus", before: `+${cur}%`, after: `+${proj}%` }, headers, allRows, 6, ['I', 'II', 'III', 'IV', 'V']);
}
function showEqSellTable(cur, proj) {
    const isUpgrade = proj > cur; const headers = ["Level", "Sell Price"]; const allRows = [];
    for (let i = 1; i <= 149; i++) { const base = 20 * Math.pow(1.01, i - 1); const v1 = Math.round(base * (100 + cur) / 100); const v2 = Math.round(base * (100 + proj) / 100); let valStr = formatResourceValue(v1, 'gold'); if (isUpgrade) valStr += ` ➜ ${formatResourceValue(v2, 'gold')}`; allRows.push([`${i}`, valStr]); }
    showTable("EQUIPMENT SELL PRICE", "icons/forge_sell.png", { label: "Bonus", before: `+${cur}%`, after: `+${proj}%` }, headers, allRows);
}
function showForgeTable(type, cur, proj) {
    const isUpgrade = proj > cur; const isT = type === 'timer'; const title = isT ? "FORGE UPGRADE TIME" : "FORGE UPGRADE COST"; const iconSrc = isT ? "icons/forge_timer.png" : "icons/forge_disc.png"; const headers = ["Level", isT ? "Upgrade Duration" : "Upgrade Cost"]; const rows = [];
    for (let i = 1; i <= 34; i++) {
        if (!forgeLevelData[i]) continue;
        const [cost, hours] = forgeLevelData[i];
        let v1, v2; if (isT) { const mins = hours * 60; v1 = formatSmartTime(mins / (1 + cur / 100)); v2 = formatSmartTime(mins / (1 + proj / 100)); } else { v1 = formatForgeCost(Math.round(cost * (1 - cur / 100))); v2 = formatForgeCost(Math.round(cost * (1 - proj / 100))); }
        let cellContent = v1; if (isUpgrade) cellContent += ` ➜ ${v2}`; rows.push([`${i} ➜ ${i + 1}`, cellContent]);
    }
    showTable(title, iconSrc, isT ? { label: "Speed", before: `+${cur}%`, after: `+${proj}%` } : { label: "Discount", before: `-${cur}%`, after: `-${proj}%` }, headers, rows, 50);
}

// ==========================================
// 2. FORGE CALCULATOR
// ==========================================

function populateForgeDropdown() {
    const s = document.getElementById('calc-forge-lv'); if (!s) return;
    s.innerHTML = ""; for (let i = 1; i <= 34; i++) s.add(new Option(i, i)); s.value = 20;
}

function getTechBonuses(lvls) {
    let speed = 0, sell = 0, hBonus = 0, cBonus = 0, free = 0, offH = 0, offC = 0, forgeDisc = 0;
    const sumLvl = (id) => { let s = 0; for (let t = 1; t <= 5; t++) s += (lvls[`forge_T${t}_${id}`] || 0); return s; };
    speed = sumLvl('timer') * 4; sell = sumLvl('sell') * 2; hBonus = sumLvl('h_bonus') * 2; cBonus = sumLvl('c_bonus') * 2; free = sumLvl('free'); forgeDisc = sumLvl('disc') * 2; offH = sumLvl('off_h') * 2; offC = sumLvl('off_c') * 2;
    let totalAvg = 0, count = 0; if (TREES.power && TREES.power.structure) { TREES.power.structure.forEach(s => { if (TREES.power.meta[s.id].isSlot) { let l = 0; for (let t = 1; t <= 5; t++) l += (lvls[`power_T${t}_${s.id}`] || 0); totalAvg += getSlotStats(99 + l * 2, sell).avg; count++; } }); }
    return { speed, sell, hBonus, cBonus, free, offH, offC, avgGold: count > 0 ? totalAvg / count : 0, forgeDisc };
}

// Helper for Yield Decimals (Renamed to prevent conflict with modal.js!)
const formatCalcYield = (val) => {
    if (val === 0) return "0";
    if (val < 1000) {
        return val.toLocaleString('en-US', {minimumFractionDigits: 1, maximumFractionDigits: 1});
    }
    return val.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0});
};

function updateCalculator() {
    const hammerEl = document.getElementById('calc-hammers'); const targetEl = document.getElementById('calc-target');
    if (!hammerEl || !targetEl) return;
    const hIn = parseFloat(hammerEl.value.replace(/,/g, '')) || 0;
    const gTarget = parseFloat(targetEl.value.replace(/,/g, '')) || 0;
    const fLv = parseInt(document.getElementById('calc-forge-lv').value) || 1; // Current Forge Level

    if (document.activeElement !== hammerEl) hammerEl.value = hIn > 0 ? hIn.toLocaleString('en-US') : (hammerEl.value ? '0' : '');
    if (document.activeElement !== targetEl) targetEl.value = gTarget > 0 ? gTarget.toLocaleString('en-US') : (targetEl.value ? '0' : '');
    
    const curStats = getTechBonuses(setupLevels); const projStats = getTechBonuses(calcState().levels);
    
    const genLine = (label, v1, v2, iconKey, tooltip = "") => {
        const tt = tooltip ? `<span class="info-tooltip" title="${tooltip}" onclick="alert('${tooltip}')">(?)</span>` : '';
        const iconHtml = iconKey ? `<img src="icons/${iconKey}.png" class="calc-icon-left">` : '';
        return `<div class="calc-line"><div class="calc-label">${label} ${tt}</div><div class="calc-val-group">${v1 === v2 ? `<span>${iconHtml}${v1}</span>` : `<span class="calc-val-before">${iconHtml}${v1}</span><span class="calc-arrow">➜</span><span class="calc-val-after">${iconHtml}${v2}</span>`}</div></div>`;
    };

    let effH1 = hIn / (1 - curStats.free / 100); 
    let effH2 = hIn / (1 - projStats.free / 100);
    
    const effHammerHtml = `<div class="calc-line"><div class="calc-label">Effective Hammer</div><div class="calc-val-group">${effH1 === effH2 ? `<span><img src="icons/fm_hammer.png" class="calc-icon-left">${formatResourceValue(effH1, 'hammer')}</span>` : `<span class="calc-val-before"><img src="icons/fm_hammer.png" class="calc-icon-left">${formatResourceValue(effH1, 'hammer')}</span><span class="calc-arrow">➜</span><span class="calc-val-after"><img src="icons/fm_hammer.png" class="calc-icon-left">${formatResourceValue(effH2, 'hammer')}</span>`}</div></div>`;

    let h1 = effHammerHtml;
    h1 += genLine('Gold', formatResourceValue(effH1 * curStats.avgGold, 'gold'), formatResourceValue(effH2 * projStats.avgGold, 'gold'), 'fm_gold');
    
    let yieldHtml = `<div style="margin-top: 15px; padding-top: 5px;">
                        <div style="font-family: 'Fredoka', sans-serif; font-weight: 600 !important; letter-spacing: 0.5px; font-size: 1rem; text-align: center; margin-bottom: 10px; color: #000000; -webkit-text-stroke: 0px #7f8c8d; paint-order: stroke fill;">Expected Item Yield</div>`;    
    const rates = typeof CALC_FORGE_RATES !== 'undefined' ? CALC_FORGE_RATES[fLv] || CALC_FORGE_RATES[1] : [];
    const TIER_NAMES = ["Primitive", "Medieval", "Early-Modern", "Modern", "Space", "Interstellar", "Multiverse", "Quantum", "Underworld", "Divine"];
    
    for (let i = 0; i < 10; i++) {
        if (rates[i] > 0) {
            const amountB = effH1 * (rates[i] / 100);
            const amountA = effH2 * (rates[i] / 100);
            
            const fmtB = formatCalcYield(amountB);
            const fmtA = formatCalcYield(amountA);
            
            let valHtml = fmtB === fmtA 
                ? `<span>${fmtB}</span>` 
                : `<span class="calc-val-before">${fmtB}</span><span class="calc-arrow">➜</span><span class="calc-val-after">${fmtA}</span>`;
            
            yieldHtml += `<div class="calc-line"><div class="calc-label">${TIER_NAMES[i]}</div><div class="calc-val-group">${valHtml}</div></div>`;
        }
    }
    yieldHtml += `</div>`;
    h1 += yieldHtml;

    const res1 = document.getElementById('calc-res-1'); if (res1) res1.innerHTML = h1;
    
    const res2 = document.getElementById('calc-res-2');
    if (res2) res2.innerHTML = genLine('Hammer Needed', formatResourceValue(gTarget / curStats.avgGold * (1 - curStats.free / 100), 'hammer'), formatResourceValue(gTarget / projStats.avgGold * (1 - projStats.free / 100), 'hammer'), 'fm_hammer');
    
    if (typeof forgeLevelData !== 'undefined' && forgeLevelData[fLv]) {
        // --- MOVED COST CALCULATION HERE ---
        const cRaw = forgeLevelData[fLv][0];
        let h5 = genLine('Cost', formatResourceValue(Math.round(cRaw * (1 - curStats.forgeDisc / 100)), 'gold'), formatResourceValue(Math.round(cRaw * (1 - projStats.forgeDisc / 100)), 'gold'), 'fm_gold');

        const baseMins = forgeLevelData[fLv][1] * 60;
        const sDateVal = document.getElementById('calc-start-date').value;
        const mainStartTime = sDateVal ? new Date(sDateVal).getTime() : Date.now();
        let speedBonusAtStart = curStats.speed; let runningTimeOffset = 0;
        const planStartMs = document.getElementById('start-date').value ? new Date(document.getElementById('start-date').value).getTime() : Date.now();
        const state = calcState();
        state.history.forEach(h => { const stepDuration = (h.type === 'delay' ? h.mins : h.added); runningTimeOffset += stepDuration; if (h.tree === 'forge' && h.id && h.id.includes('timer')) { const techFinishTime = planStartMs + (runningTimeOffset * 60000); if (techFinishTime <= mainStartTime) { speedBonusAtStart += 4; } } });
        const f1 = baseMins / (1 + curStats.speed / 100); const f2 = baseMins / (1 + speedBonusAtStart / 100);
        const dFinish = new Date(mainStartTime + f1 * 60000); const dFinishProj = new Date(mainStartTime + f2 * 60000);
        const formatDT = (d) => `<span class="calc-multiline-date">${d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}<span class="calc-date-comma">, </span><span class="calc-time-block">${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}</span></span>`;
        let finishHtml = (dFinish.getTime() === dFinishProj.getTime()) ? `<div class="calc-val-group calc-date-single"><span>${formatDT(dFinish)}</span></div>` : `<div class="calc-val-group"><span class="calc-val-before">${formatDT(dFinish)}</span><span class="calc-arrow">➜</span><span class="calc-val-after">${formatDT(dFinishProj)}</span></div>`;
        h5 += `<div class="calc-line"><div class="calc-label">Finish</div>${finishHtml}</div>`;
        h5 += genLine('Duration', formatSmartTime(f1), formatSmartTime(f2));

        const res5 = document.getElementById('calc-res-5'); if (res5) res5.innerHTML = h5;
    }

    if (typeof saveToLocalStorage === 'function') saveToLocalStorage();
}

function initCalcDateSelectors() {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const mSel = document.getElementById('cm-month'); const dSel = document.getElementById('cm-day'); const hSel = document.getElementById('cm-hour'); const minSel = document.getElementById('cm-min');
    if(!mSel) return; 
    mSel.innerHTML = ""; months.forEach((m, i) => mSel.add(new Option(m, i + 1)));
    dSel.innerHTML = ""; for(let i=1; i<=31; i++) dSel.add(new Option(i, i));
    hSel.innerHTML = ""; for(let i=0; i<=23; i++) hSel.add(new Option(i, i));
    minSel.innerHTML = ""; for(let i=0; i<=59; i++) minSel.add(new Option(i < 10 ? '0'+i : i, i));
    const now = new Date(); mSel.value = now.getMonth(); dSel.value = now.getDate(); hSel.value = now.getHours(); minSel.value = now.getMinutes();
    updateCalcFromDropdowns();
}

function updateCalcFromDropdowns() { updateFromDropdowns('calc'); }
function syncCalcMobileDate(isoStr) { if(!isoStr) return; const d = new Date(isoStr); const mSel = document.getElementById('cm-month'); if(mSel) { mSel.value = d.getMonth() + 1; document.getElementById('cm-day').value = d.getDate(); document.getElementById('cm-hour').value = d.getHours(); document.getElementById('cm-min').value = d.getMinutes(); } }

// ==========================================
// 3. EGG PLANNER
// ==========================================

let eggPlanQueue = []; let eggInsertIdx = -1; let expandedEggIdx = -1;
let eggHistoryStack = []; let eggRedoStack = [];

function captureEggState() { return { queue: JSON.parse(JSON.stringify(eggPlanQueue)), start: document.getElementById('egg-date-desktop').value }; }
function pushEggHistory() { if (eggHistoryStack.length > 50) eggHistoryStack.shift(); eggHistoryStack.push(captureEggState()); eggRedoStack = []; updateEggUndoButtons(); }
function undoEgg() { if (eggHistoryStack.length === 0) return; eggRedoStack.push(captureEggState()); const state = eggHistoryStack.pop(); eggPlanQueue = state.queue; if (state.start) syncEggDate(state.start, false); renderEggLog(); updateEggUndoButtons(); if (typeof saveToLocalStorage === 'function') saveToLocalStorage(); }
function redoEgg() { if (eggRedoStack.length === 0) return; eggHistoryStack.push(captureEggState()); const state = eggRedoStack.pop(); eggPlanQueue = state.queue; if (state.start) syncEggDate(state.start, false); renderEggLog(); updateEggUndoButtons(); if (typeof saveToLocalStorage === 'function') saveToLocalStorage(); }
function updateEggUndoButtons() {
    const hasH = eggHistoryStack.length > 0; const hasR = eggRedoStack.length > 0;
    const upd = (id, on) => { const el = document.getElementById(id); if (el) { el.disabled = !on; el.style.opacity = !on ? "0.3" : "1"; el.style.pointerEvents = !on ? "none" : "auto"; } };
    ['btn-undo-egg', 'btn-undo-mobile-egg'].forEach(id => upd(id, hasH));
    ['btn-redo-egg', 'btn-redo-mobile-egg'].forEach(id => upd(id, hasR));
}

function populateEggDropdowns() { populateDateDropdowns(); }
function getEggSpeedAtTime(techIdSuffix, targetTimeMs) {
    let totalLvl = 0; for (let t = 1; t <= 5; t++) { totalLvl += (setupLevels[`spt_T${t}_${techIdSuffix}`] || 0); }
    let mainStartTime = new Date(document.getElementById('start-date').value).getTime();
    let techState = calcState(); let runningTimeOffset = 0;
    techState.history.forEach(h => { let stepDuration = (h.type === 'delay' ? h.mins : h.added); runningTimeOffset += stepDuration; if (h.id && h.id.endsWith(techIdSuffix)) { let techFinishTime = mainStartTime + (runningTimeOffset * 60000); if (techFinishTime <= targetTimeMs) totalLvl++; } });
    return totalLvl;
}

function activateEggInsert(idx) { eggInsertIdx = idx + 1; expandedEggIdx = -1; document.getElementById('egg-selector-box').classList.add('egg-insert-active'); renderEggLog(); }
function toggleEggExp(i) { expandedEggIdx = expandedEggIdx === i ? -1 : i; renderEggLog(); }

function renderEggLog() {
    const list = document.getElementById('egg-log-list'); if (!list) return;
    list.innerHTML = '';
    const dateInput = document.getElementById('egg-date-desktop'); if (!dateInput || !dateInput.value) return;
    let curTime = new Date(dateInput.value).getTime(); let totalQueueMins = 0; let totalPoints = 0;
    eggPlanQueue.forEach((item, idx) => {
        const div = document.createElement('div');
        if (item.type === 'delay') {
            totalQueueMins += item.mins; curTime += item.mins * 60000;
            const finishDate = new Date(curTime); const timeStr = finishDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) + ', ' + finishDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
            div.className = `log-row ${expandedEggIdx === idx ? 'expanded' : ''}`;
            div.innerHTML = `<div class="log-entry delay" onclick="toggleEggExp(${idx})"><div class="log-left-group"><div class="log-icon-wrapper desktop-only" style="align-items: center; justify-content: center; height: 44px;"><span style="font-size:1.8em; line-height:1;">💤</span></div><div class="log-name">Delay (+${item.mins}m)</div></div><div class="log-right-group"><div class="log-time" style="color:#ccc">${timeStr}</div></div></div><div class="log-controls"><button class="btn-game-ctrl btn-del" onclick="event.stopPropagation(); deleteEggStep(${idx})">DEL</button></div>`;
        } else {
            const data = EGG_DATA[item.key]; const pts = EGG_POINTS[item.key] || 0; totalPoints += pts;
            const techLvl = getEggSpeedAtTime(data.id, curTime); const speedMult = 1 + (techLvl * 0.1); const finalMins = data.t / speedMult;
            totalQueueMins += finalMins; curTime += finalMins * 60000;
            const finishDate = new Date(curTime); const finishTs = finishDate.getTime(); const timeStr = finishDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) + ', ' + finishDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
            div.className = `log-row ${expandedEggIdx === idx ? 'expanded' : ''}`;
            const detailsHtml = `<div class="log-details"><div class="ld-part pot"><img src="icons/warpoint.png" class="ld-icon"><span>${pts.toLocaleString('en-US')}</span></div><div class="ld-part time" style="width: auto;"><img src="icons/icon_time.png" class="ld-icon"><span>${formatEggTime(finalMins)}</span></div></div>`;

            div.innerHTML = `<div class="log-entry ${data.c}" onclick="toggleEggExp(${idx})"><div class="log-left-group"><div class="log-icon-wrapper"><img src="${data.img}" style="width: 44px; height: 44px; object-fit: contain; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));" onerror="this.style.display='none'"></div><div class="log-name">${data.n}</div> </div><div class="log-right-group"><div class="log-time">${timeStr}</div>${detailsHtml}</div></div><div class="log-controls"><button class="btn-game-ctrl btn-done" onclick="event.stopPropagation(); markEggDone(${idx}, ${finishTs})">DONE</button><button class="btn-game-ctrl btn-delay" onclick="event.stopPropagation(); addEggDelay(${idx})">DELAY</button><button class="btn-game-ctrl btn-insert" onclick="event.stopPropagation(); activateEggInsert(${idx})">INSERT</button><button class="btn-game-ctrl btn-del" onclick="event.stopPropagation(); deleteEggStep(${idx})">DELETE</button></div>`;
        }
        list.appendChild(div);
    });
    const summaryBox = document.getElementById('egg-total-summary');
    if (summaryBox) {
        summaryBox.className = 'egg-stats-row'; 
        summaryBox.innerHTML = `<div class="es-item type-points"><span class="es-value points">${totalPoints.toLocaleString('en-US')}</span></div><div class="es-item type-time"><span class="es-value time">${formatEggTime(totalQueueMins)}</span></div>`;
    }
}

function addEggToQueue(type) { pushEggHistory(); const item = { type: 'egg', key: type }; if (eggInsertIdx > -1) { eggPlanQueue.splice(eggInsertIdx, 0, item); eggInsertIdx = -1; document.getElementById('egg-selector-box').classList.remove('egg-insert-active'); } else { eggPlanQueue.push(item); } renderEggLog(); if (typeof saveToLocalStorage === 'function') saveToLocalStorage(); }
function markEggDone(idx, timestamp) { try { pushEggHistory(); eggPlanQueue.splice(0, idx + 1); const d = new Date(timestamp); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); const localIso = d.toISOString().slice(0, 16); syncEggDate(localIso); expandedEggIdx = -1; } catch (e) { console.error(e); } }
function addEggDelay(idx) { const m = prompt("Enter delay in MINUTES:"); if (m) { pushEggHistory(); eggPlanQueue.splice(idx + 1, 0, { type: 'delay', mins: parseFloat(m) }); expandedEggIdx = -1; renderEggLog(); if (typeof saveToLocalStorage === 'function') saveToLocalStorage(); } }
function deleteEggStep(idx) { pushEggHistory(); eggPlanQueue.splice(idx, 1); renderEggLog(); if (typeof saveToLocalStorage === 'function') saveToLocalStorage(); }
function clearEggPlan() { if (confirm("Clear egg list?")) { pushEggHistory(); eggPlanQueue = []; renderEggLog(); if (typeof saveToLocalStorage === 'function') saveToLocalStorage(); } }