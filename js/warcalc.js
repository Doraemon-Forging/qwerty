/**
 * WARCALC.JS
 * Logic for War Point Calculator.
 * Integrates directly with tech-planner.js and tools.js
 */

const WARCALC_SKILL_RATES = {
    "1-1": [100,0,0,0,0,0], "1-2": [100,0,0,0,0,0], "1-3": [100,0,0,0,0,0], "1-4": [89.95,10,0.05,0,0,0], "1-5": [88.54,11.4,0.06,0,0,0], "1-6": [86.93,13,0.07,0,0,0], "1-7": [85.1,14.82,0.08,0,0,0], "1-8": [83,16.89,0.11,0,0,0], "1-9": [80.61,19.25,0.14,0,0,0], "1-10": [77.88,21.95,0.17,0,0,0],
    "2-1": [74.76,25.03,0.21,0,0,0], "2-2": [71.21,28.53,0.26,0,0,0], "2-3": [67.14,32.52,0.34,0,0,0], "2-4": [62.51,37.07,0.42,0,0,0], "2-5": [57.21,42.27,0.52,0,0,0], "2-6": [51.17,48.18,0.65,0,0,0], "2-7": [44.26,54.92,0.82,0,0,0], "2-8": [36.36,62.62,1.02,0,0,0], "2-9": [27.34,71.38,1.28,0,0,0], "2-10": [17.5,80.9,1.6,0,0,0],
    "3-1": [17.5,80.49,2,0.01,0,0], "3-2": [17.5,80.09,2.4,0.01,0,0], "3-3": [17.5,79.61,2.87,0.02,0,0], "3-4": [17.5,79.03,3.45,0.02,0,0], "3-5": [17.5,78.34,4.13,0.03,0,0], "3-6": [17.5,77.51,4.95,0.04,0,0], "3-7": [17.5,76.51,5.95,0.04,0,0], "3-8": [17.5,75.32,7.13,0.05,0,0], "3-9": [17.5,73.89,8.54,0.07,0,0], "3-10": [17.5,72.17,10.24,0.09,0,0],
    "4-1": [17.5,70.11,12.28,0.11,0,0], "4-2": [17.5,67.64,14.73,0.13,0,0], "4-3": [17.5,64.68,17.65,0.17,0,0], "4-4": [17.5,61.12,21.17,0.21,0,0], "4-5": [17.5,56.86,25.38,0.26,0,0], "4-6": [17.5,51.74,30.43,0.33,0,0], "4-7": [17.5,45.6,36.49,0.41,0,0], "4-8": [17.5,38.24,43.75,0.51,0,0], "4-9": [17.5,29.41,52.45,0.64,0,0], "4-10": [17.5,18.81,62.89,0.8,0,0],
    "5-1": [17.5,16.5,65,1,0,0], "5-2": [17.5,16.5,64.78,1.22,0,0], "5-3": [17.5,16.5,64.51,1.49,0,0], "5-4": [17.5,16.5,64.17,1.82,0.01,0], "5-5": [17.5,16.5,63.76,2.22,0.02,0], "5-6": [17.5,16.5,63.27,2.7,0.03,0], "5-7": [17.5,16.5,62.66,3.3,0.04,0], "5-8": [17.5,16.5,61.92,4.03,0.05,0], "5-9": [17.5,16.5,61.02,4.91,0.07,0], "5-10": [17.5,16.5,59.93,5.99,0.08,0],
    "6-1": [17.5,16.5,58.59,7.3,0.11,0], "6-2": [17.5,16.5,56.95,8.92,0.13,0], "6-3": [17.5,16.5,54.96,10.87,0.17,0], "6-4": [17.5,16.5,52.53,13.26,0.21,0], "6-5": [17.5,16.5,49.56,16.18,0.26,0], "6-6": [17.5,16.5,45.93,19.74,0.33,0], "6-7": [17.5,16.5,41.5,24.09,0.41,0], "6-8": [17.5,16.5,36.1,29.39,0.51,0], "6-9": [17.5,16.5,29.51,35.85,0.64,0], "6-10": [17.5,16.5,21.46,43.74,0.8,0],
    "7-1": [17.5,16.5,16.5,48.5,1,0], "7-2": [17.5,16.5,16.5,48.31,1.19,0], "7-3": [17.5,16.5,16.5,48.08,1.42,0], "7-4": [17.5,16.5,16.5,47.8,1.69,0.01], "7-5": [17.5,16.5,16.5,47.47,2.01,0.02], "7-6": [17.5,16.5,16.5,47.08,2.39,0.03], "7-7": [17.5,16.5,16.5,46.62,2.84,0.04], "7-8": [17.5,16.5,16.5,46.07,3.38,0.05], "7-9": [17.5,16.5,16.5,45.41,4.02,0.07], "7-10": [17.5,16.5,16.5,44.63,4.79,0.08],
    "8-1": [17.5,16.5,16.5,43.7,5.69,0.11], "8-2": [17.5,16.5,16.5,42.59,6.78,0.13], "8-3": [17.5,16.5,16.5,41.27,8.06,0.17], "8-4": [17.5,16.5,16.5,39.69,9.6,0.21], "8-5": [17.5,16.5,16.5,37.82,11.42,0.26], "8-6": [17.5,16.5,16.5,35.58,13.59,0.33], "8-7": [17.5,16.5,16.5,32.92,16.17,0.41], "8-8": [17.5,16.5,16.5,29.74,19.25,0.51], "8-9": [17.5,16.5,16.5,25.96,22.9,0.64], "8-10": [17.5,16.5,16.5,19.44,28.46,1.6],
    "9-1": [17.5,16.5,16.5,16.5,31,2], "9-2": [17.5,16.5,16.5,16.5,30.76,2.24], "9-3": [17.5,16.5,16.5,16.5,30.49,2.51], "9-4": [17.5,16.5,16.5,16.5,30.19,2.81], "9-5": [17.5,16.5,16.5,16.5,29.85,3.15], "9-6": [17.5,16.5,16.5,16.5,29.48,3.52], "9-7": [17.5,16.5,16.5,16.5,29.05,3.95], "9-8": [17.5,16.5,16.5,16.5,28.58,4.42], "9-9": [17.5,16.5,16.5,16.5,28.05,4.95], "9-10": [17.5,16.5,16.5,16.5,27.45,5.55],
    "10-1": [17.5,16.5,16.5,16.5,26.79,6.21], "10-2": [17.5,16.5,16.5,16.5,26.04,6.96], "10-3": [17.5,16.5,16.5,16.5,25.21,7.79], "10-4": [17.5,16.5,16.5,16.5,24.27,8.73], "10-5": [17.5,16.5,16.5,16.5,23.23,9.77], "10-6": [17.5,16.5,16.5,16.5,22.05,10.95], "10-7": [17.5,16.5,16.5,16.5,20.74,12.26], "10-8": [17.5,16.5,16.5,16.5,19.27,13.73], "10-9": [17.5,16.5,16.5,16.5,17.62,15.38], "10-10": [17.5,16.5,16.5,16.5,16.5,16.5]
};

function initWarCalc() {
    const container = document.getElementById('war-calc-inputs');
    if (!container) return;

    const cardHeader = container.closest('.daily-card')?.querySelector('.daily-card-header');
    if (cardHeader) cardHeader.style.display = 'none';

    const customStyles = `
    <style>
        .wc-scope { padding-top: 10px; }
        
        .wc-scope .wc-label, 
        .wc-scope .wc-header-label,
        .wc-scope span, 
        .wc-scope div {
            font-family: 'Fredoka', sans-serif !important;
            font-weight: 600 !important;
            color: #000000 !important;
            -webkit-text-stroke: 0px !important;
            text-shadow: none !important;
            letter-spacing: 0.5px;
        }

        .wc-label { font-size: 1rem !important; }
        .wc-header-label { font-size: 1rem !important; text-align: center; }

        .wc-scope input, 
        .wc-scope select {
            background: #fff !important;
            border: 2px solid #000 !important;
            border-radius: 8px !important;
            font-family: 'Fredoka', sans-serif !important;
            font-weight: 600 !important;
            font-size: 1rem !important;
            color: #000 !important;
            text-align: center;
            height: 32px !important;
            outline: none !important;
            box-shadow: none !important;
            padding: 0 !important;
        }
        .wc-scope input:focus { background: #f9f9f9 !important; }

        .wc-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .wc-line { border-bottom: 2px solid #ccc; margin: 15px 0; opacity: 0.5; }
    </style>
    `;

    const row = (label, inputHtml) => `
        <div class="wc-row">
            <div class="wc-label">${label}</div>
            ${inputHtml}
        </div>`;

    let html = customStyles + '<div class="wc-scope">';

    // 1. FORGE & DUNGEON
    let forgeOpts = '';
    // Updated: Select triggers both general update and specific nodes cap update
    for(let i=1; i<=34; i++) forgeOpts += `<option value="${i}" ${i===20 ? 'selected' : ''}>${i}</option>`;
    html += row("Current Forge Lv:", `<select id="wc-forge-lv" style="width:80px;" onchange="updateWarForgeNodesCap(); updateWarCalc()">${forgeOpts}</select>`);
    
    // NEW INPUT 1: Forge Upgrade Nodes
    html += `
        <div class="wc-row">
            <div class="wc-label">Forge Upgrade Nodes:</div>
            <div style="display:flex; align-items:center; gap:8px; flex-shrink: 0; white-space: nowrap;">
                <input type="number" id="wc-forge-nodes" value="0" min="0" oninput="updateWarForgeNodesCap(); updateWarCalc()" style="width: 70px;">
                <span style="font-size:1.1rem; font-weight:700; white-space: nowrap;">/ <span id="wc-forge-nodes-max">10</span></span>
            </div>
        </div>
    `;

    // UPDATED INPUT 2: Start / Finish Forge Upgrade (Dropdown)
    html += row("Start / Finish Forge Upgrade:", `
        <select id="wc-forge-bonus" style="width:140px;" onchange="updateWarCalc()">
            <option value="0" selected>0</option>
            <option value="10000">10,000</option>
            <option value="20000">20,000</option>
        </select>
    `);

    html += row("Hammer:", `<input type="text" id="wc-hammer" style="width:140px;" onfocus="unformatInput(this)" onblur="formatInput(this); updateWarCalc()" oninput="cleanInput(this); updateWarCalc()">`);
    
    // NEW: Grey Separator Line added above Dungeon Key
    html += `<div class="wc-line"></div>`;
    
    html += row("Dungeon Key:", `<input type="text" id="wc-dungeon-key" style="width:140px;" onfocus="unformatInput(this)" onblur="formatInput(this); updateWarCalc()" oninput="cleanInput(this); updateWarCalc()">`);

    html += `<div class="wc-line"></div>`;

    // 2. GHOST TOWN
    let ghostLvlOpts = '';
    for(let i=1; i<=10; i++) ghostLvlOpts += `<option value="${i}" ${i===10 ? 'selected' : ''}>${i}</option>`;
    let ghostSubOpts = '';
    for(let i=1; i<=10; i++) ghostSubOpts += `<option value="${i}">${i}</option>`;

    html += `
        <div class="wc-row">
            <div class="wc-label">Ghost Town Lv:</div>
            <div style="display:flex; align-items:center; gap:5px;">
                <select id="wc-ghost-lvl" style="width:60px;" onchange="updateWarCalc()">${ghostLvlOpts}</select>
                <span style="font-weight:bold; font-size:1.2rem;">-</span>
                <select id="wc-ghost-sub" style="width:60px;" onchange="updateWarCalc()">${ghostSubOpts}</select>
            </div>
        </div>`;

    // 3. GREEN TICKET
    html += row("Green Ticket:", `<input type="text" id="wc-ticket" style="width:140px;" onfocus="unformatInput(this)" onblur="formatInput(this); updateWarCalc()" oninput="cleanInput(this); updateWarCalc()">`);
    html += `<div class="wc-line"></div>`;

    // 4. TECH
    const techTiers = ['I', 'II', 'III', 'IV', 'V'];
    techTiers.forEach(t => {
        html += row(`Tech Tier ${t}:`, `<input type="text" id="wc-tech-${t}" style="width:140px;" oninput="cleanInput(this); updateWarCalc()">`);
    });
    html += `<div class="wc-line"></div>`;

    // 5. MOUNT
    html += row("Mount Key:", `<input type="text" id="wc-mount-key" style="width:140px;" onfocus="unformatInput(this)" onblur="formatInput(this); updateWarCalc()" oninput="cleanInput(this); updateWarCalc()">`);

    html += `
        <div class="wc-row">
            <div class="wc-label">Mount Summon Lv:</div>
            <input type="number" id="wc-mount-lv" value="1" min="1" max="50" oninput="updateWarMountExpCap(); updateWarCalc()" style="width: 80px;">
        </div>
        <div class="wc-row">
            <div class="wc-label">Mount Summon Exp:</div>
            <div style="display:flex; align-items:center; gap:8px; flex-shrink: 0; white-space: nowrap;">
                <input type="number" id="wc-mount-exp" value="0" min="0" oninput="updateWarMountExpCap(); updateWarCalc()" style="width: 70px;">
                <span style="font-size:1.1rem; font-weight:700; white-space: nowrap;">/ <span id="wc-mount-max">2</span></span>
            </div>
        </div>
    `;
    html += `<div class="wc-line"></div>`;

    // 6. COLOR TABLE
    html += `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 0 2px;">
            <div style="width: 32%; display: flex; justify-content: center; align-items: center;" class="wc-header-label">Hatch Egg</div>
            <div style="width: 32%; display: flex; justify-content: center; align-items: center;" class="wc-header-label">Merge Egg/Pet</div>
            <div style="width: 32%; display: flex; justify-content: center; align-items: center;" class="wc-header-label">Merge Mount</div>
        </div>`;

    const colors = [
        { bg: '#ecf0f1', id: 'common' }, { bg: '#5cd8fe', id: 'rare' }, { bg: '#5dfe8a', id: 'epic' },      
        { bg: '#fcfe5d', id: 'legendary' }, { bg: '#ff5c5d', id: 'ultimate' }, { bg: '#d55cff', id: 'mythic' }     
    ];

    colors.forEach(c => {
        html += `
        <div style="background-color: ${c.bg}; padding: 4px; margin-bottom: 4px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(0,0,0,0.1);">
            <div style="width: 32%; display: flex; justify-content: center;">
                <input type="text" id="wc-hatch-${c.id}" style="width: 60px; height: 26px !important; font-size: 0.9rem !important; border: 2px solid #777 !important; background: rgba(255,255,255,0.5) !important;" oninput="cleanInput(this); updateWarCalc()">
            </div>
            <div style="width: 32%; display: flex; justify-content: center;">
                <input type="text" id="wc-merge-pet-${c.id}" style="width: 60px; height: 26px !important; font-size: 0.9rem !important; border: 2px solid #777 !important; background: rgba(255,255,255,0.5) !important;" oninput="cleanInput(this); updateWarCalc()">
            </div>
            <div style="width: 32%; display: flex; justify-content: center;">
                <input type="text" id="wc-merge-mount-${c.id}" style="width: 60px; height: 26px !important; font-size: 0.9rem !important; border: 2px solid #777 !important; background: rgba(255,255,255,0.5) !important;" oninput="cleanInput(this); updateWarCalc()">
            </div>
        </div>`;
    });

    html += '</div>';
    container.innerHTML = html;
    
    // Initial update for the new nodes input
    updateWarForgeNodesCap();
    
    // FIX: Update Mount Exp Cap on Init
    updateWarMountExpCap();
}

// NEW FUNCTION: Handles the logic for Forge Nodes dynamic cap
function updateWarForgeNodesCap() {
    const lvEl = document.getElementById('wc-forge-lv');
    const nodesEl = document.getElementById('wc-forge-nodes');
    const maxEl = document.getElementById('wc-forge-nodes-max');

    if (lvEl && nodesEl && maxEl) {
        let lv = parseInt(lvEl.value) || 1;
        // Default to 10 if data is missing, otherwise check index 2 (the 3rd value)
        let maxNodes = 10;
        if (typeof forgeLevelData !== 'undefined' && forgeLevelData[lv]) {
            // Your data format is [Cost, Timer, MaxNodes]
            maxNodes = forgeLevelData[lv][2] || 1;
        }

        maxEl.innerText = maxNodes;
        
        let currentNodes = parseInt(nodesEl.value) || 0;
        if (currentNodes > maxNodes) {
            nodesEl.value = maxNodes;
        }
    }
}

function updateWarMountExpCap() {
    const lvEl = document.getElementById('wc-mount-lv');
    const expEl = document.getElementById('wc-mount-exp');
    const maxEl = document.getElementById('wc-mount-max');
    
    if (lvEl && maxEl && expEl) {
        let lv = parseInt(lvEl.value) || 1;
        if (lv < 1) lv = 1;
        if (lv > 50) lv = 50;
        let maxExp = 2;
        if (typeof MOUNT_LEVEL_DATA !== 'undefined' && MOUNT_LEVEL_DATA[lv]) {
            maxExp = MOUNT_LEVEL_DATA[lv][0];
        }
        if (maxExp === "MAX" || maxExp === 0) {
            maxEl.innerText = "MAX";
            expEl.value = 0;
            expEl.disabled = true;
        } else {
            maxEl.innerText = maxExp;
            expEl.disabled = false;
            let currentExp = parseInt(expEl.value) || 0;
            if (currentExp >= maxExp) expEl.value = maxExp - 1;
        }
    }
}

// Exactly copied from weekly.js calcMountPulls
function calcWarMountPulls(startLv, startExp, totalPulls) {
    let results = [0, 0, 0, 0, 0, 0];
    let currentLv = startLv;
    let currentExp = startExp;
    let remainingPulls = totalPulls;

    while (remainingPulls > 0) {
        let levelData = (typeof MOUNT_LEVEL_DATA !== 'undefined' && MOUNT_LEVEL_DATA[currentLv]) ? MOUNT_LEVEL_DATA[currentLv] : [0, 100, 0, 0, 0, 0, 0];
        let maxExpForLevel = levelData[0];

        if (maxExpForLevel === "MAX" || maxExpForLevel === 0) {
            for (let i = 0; i < 6; i++) results[i] += remainingPulls * (levelData[i + 1] / 100);
            remainingPulls = 0; 
        } else {
            let expNeededToLevelUp = maxExpForLevel - currentExp;
            if (remainingPulls >= expNeededToLevelUp) {
                for (let i = 0; i < 6; i++) results[i] += expNeededToLevelUp * (levelData[i + 1] / 100);
                remainingPulls -= expNeededToLevelUp;
                currentLv++;
                currentExp = 0;
            } else {
                for (let i = 0; i < 6; i++) results[i] += remainingPulls * (levelData[i + 1] / 100);
                currentExp += remainingPulls; 
                remainingPulls = 0;
            }
        }
    }
    return results;
}

function updateWarCalc() {
    // FIX: Ensure Cap is correct before calculating
    updateWarMountExpCap();

    const getVal = (id) => {
        const el = document.getElementById(id);
        return el && el.value ? parseFloat(el.value.replace(/,/g, '')) || 0 : 0;
    };

    const forgeLv = parseInt(document.getElementById('wc-forge-lv')?.value || 20);
    const forgeNodes = parseInt(document.getElementById('wc-forge-nodes')?.value || 0);
    const forgeBonus = parseInt(document.getElementById('wc-forge-bonus')?.value || 0);

    const hammer = getVal('wc-hammer');
    const dungeonKeys = getVal('wc-dungeon-key');
    const ghostLvl = parseInt(document.getElementById('wc-ghost-lvl')?.value || 1);
    const ghostSub = parseInt(document.getElementById('wc-ghost-sub')?.value || 1);
    const tickets = getVal('wc-ticket');
    
    const techI = getVal('wc-tech-I');
    const techII = getVal('wc-tech-II');
    const techIII = getVal('wc-tech-III');
    const techIV = getVal('wc-tech-IV');
    const techV = getVal('wc-tech-V');
    
    const mountKey = getVal('wc-mount-key');
    const mntLv = parseInt(document.getElementById('wc-mount-lv')?.value || 1);
    const mntExp = getVal('wc-mount-exp');

    const getTechVal = (tree, nodeId) => {
        let beforeLvl = 0, afterLvl = 0;
        if (typeof setupLevels !== 'undefined') {
            for (let t = 1; t <= 5; t++) beforeLvl += (setupLevels[`${tree}_T${t}_${nodeId}`] || 0);
        }
        let planState = typeof calcState === 'function' ? calcState().levels : (typeof setupLevels !== 'undefined' ? setupLevels : {});
        if (planState) {
            for (let t = 1; t <= 5; t++) afterLvl += (planState[`${tree}_T${t}_${nodeId}`] || 0);
        }
        return { before: beforeLvl, after: afterLvl };
    };

    const skillPointsMap = [50, 75, 100, 125, 150, 175];
    const eggHatchPointsMap = [250, 1000, 2000, 4000, 8000, 16000];
    const eggMergePointsMap = [50, 200, 400, 800, 1600, 3200];
    const mountPointsMap = [400, 600, 900, 1350, 2000, 3000];
    const colors = ['common', 'rare', 'epic', 'legendary', 'ultimate', 'mythic'];

    // 1. FORGE CALCULATION
    const techFreeForge = getTechVal('forge', 'free');
    const effHammerB = hammer / (1 - (techFreeForge.before / 100));
    const effHammerA = hammer / (1 - (techFreeForge.after / 100));

    const ratesSource = typeof CALC_FORGE_RATES !== 'undefined' ? CALC_FORGE_RATES : {};
    const fRates = ratesSource[forgeLv] || ratesSource[1] || [100,0,0,0,0,0,0,0,0,0];
    
    let warForgeB = 0;
    let warForgeA = 0;
    for (let i = 0; i < 10; i++) {
        if (fRates[i] > 0) {
            const pointMultiplier = (i < 3) ? 1 : ((i < 6) ? 2 : 3);
            warForgeB += (effHammerB * (fRates[i] / 100)) * pointMultiplier;
            warForgeA += (effHammerA * (fRates[i] / 100)) * pointMultiplier;
        }
    }

    // 1.5 FORGE UPGRADE GOLD SPENT
    const techForgeDisc = getTechVal('forge', 'disc');
    const fData = (typeof forgeLevelData !== 'undefined' && forgeLevelData[forgeLv]) ? forgeLevelData[forgeLv] : [0,0,1];
    
    const baseCost = fData[0];
    const maxNodes = fData[2] || 1;
    const discPercentB = techForgeDisc.before * 2;
    const discPercentA = techForgeDisc.after * 2;

    const fUpgradeCostB = baseCost * (1 - discPercentB / 100);
    const costPerNodeB = fUpgradeCostB / maxNodes;
    const ptsPerNodeB = Math.floor(costPerNodeB / 1000) * 10; 
    const warForgeUpgradeB = (ptsPerNodeB * forgeNodes);

    const fUpgradeCostA = baseCost * (1 - discPercentA / 100);
    const costPerNodeA = fUpgradeCostA / maxNodes;
    const ptsPerNodeA = Math.floor(costPerNodeA / 1000) * 10; 
    const warForgeUpgradeA = (ptsPerNodeA * forgeNodes);

    const warStartFinish = forgeBonus;
    const warDungeon = dungeonKeys * 1000;

    // Ticket calculation
    const techTicket = getTechVal('spt', 'ticket');
    const costB = 200 * (1 - (techTicket.before * 1) / 100);
    const costA = 200 * (1 - (techTicket.after * 1) / 100);

    const pullsB = Math.floor(tickets / (costB || 200)) * 5;
    const pullsA = Math.floor(tickets / (costA || 200)) * 5;

    const ghostKey = `${ghostLvl}-${ghostSub}`;
    const sRates = typeof WARCALC_SKILL_RATES !== 'undefined' ? (WARCALC_SKILL_RATES[ghostKey] || [100,0,0,0,0,0]) : [100,0,0,0,0,0];
    
    let warSkillYieldB = [0,0,0,0,0,0];
    let warSkillYieldA = [0,0,0,0,0,0];
    let warSkillB = 0, warSkillA = 0;
    for (let i=0; i<6; i++) {
        warSkillYieldB[i] = pullsB * (sRates[i]/100);
        warSkillYieldA[i] = pullsA * (sRates[i]/100);
        warSkillB += warSkillYieldB[i] * skillPointsMap[i];
        warSkillA += warSkillYieldA[i] * skillPointsMap[i];
    }
    const warSkillUpB = warSkillB / 12;
    const warSkillUpA = warSkillA / 12;

    const warTech = (techI*300) + (techII*7500) + (techIII*20000) + (techIV*35000) + (techV*62000);

    let warEggHatch = 0, warEggMergeInput = 0, warMountMergeInput = 0;
    for (let i=0; i<6; i++) {
        let c = colors[i];
        warEggHatch += getVal(`wc-hatch-${c}`) * eggHatchPointsMap[i];
        warEggMergeInput += getVal(`wc-merge-pet-${c}`) * eggMergePointsMap[i];
        warMountMergeInput += getVal(`wc-merge-mount-${c}`) * mountPointsMap[i];
    }

    const techMountCost = getTechVal('power', 'mount_cost');
    const techMountChance = getTechVal('power', 'mount_chance');
    
    const mCostB = Math.max(1, Math.ceil(50 * (1 - (techMountCost.before * 1) / 100)));
    const mCostA = Math.max(1, Math.ceil(50 * (1 - (techMountCost.after * 1) / 100)));

    const mPullsB = Math.floor(mountKey / mCostB);
    const mPullsA = Math.floor(mountKey / mCostA);

    const mYieldB = mPullsB * (1 + (techMountChance.before * 2) / 100);
    const mYieldA = mPullsA * (1 + (techMountChance.after * 2) / 100);

    const mountsB = typeof calcWarMountPulls === 'function' ? calcWarMountPulls(mntLv, mntExp, mYieldB) : [0,0,0,0,0,0];
    const mountsA = typeof calcWarMountPulls === 'function' ? calcWarMountPulls(mntLv, mntExp, mYieldA) : [0,0,0,0,0,0];

    window.currentWarYields = {
        skillB: warSkillYieldB, skillA: warSkillYieldA,
        mountB: mountsB, mountA: mountsA,
        mountPullsB: mPullsB, mountPullsA: mPullsA
    };

    let warMountB = 0, warMountA = 0;
    for (let i=0; i<6; i++) {
        warMountB += mountsB[i] * mountPointsMap[i];
        warMountA += mountsA[i] * mountPointsMap[i];
    }
    const warMountMergeSummonB = warMountB;
    const warMountMergeSummonA = warMountA;

    // --- DAILY BREAKDOWN ---
    const d1B = warForgeB + warSkillB + warSkillUpB + warTech;
    const d1A = warForgeA + warSkillA + warSkillUpA + warTech;

    const d2B = warForgeUpgradeB + warStartFinish + warDungeon + warEggHatch + warEggMergeInput;
    const d2A = warForgeUpgradeA + warStartFinish + warDungeon + warEggHatch + warEggMergeInput;

    const d3B = warForgeB + warSkillB + warSkillUpB + warMountB + warMountMergeSummonB + warMountMergeInput;
    const d3A = warForgeA + warSkillA + warSkillUpA + warMountA + warMountMergeSummonA + warMountMergeInput;

    const d4B = warForgeUpgradeB + warStartFinish + warDungeon + warEggHatch + warEggMergeInput + warTech;
    const d4A = warForgeUpgradeA + warStartFinish + warDungeon + warEggHatch + warEggMergeInput + warTech;

    const d5B = warForgeB + warSkillB + warSkillUpB + warMountB + warMountMergeSummonB + warMountMergeInput + warDungeon;
    const d5A = warForgeA + warSkillA + warSkillUpA + warMountA + warMountMergeSummonA + warMountMergeInput + warDungeon;

    const totB = warForgeB + warForgeUpgradeB + warStartFinish + warDungeon + warSkillB + warSkillUpB + warTech + warEggHatch + warEggMergeInput + warMountB + warMountMergeSummonB + warMountMergeInput;
    const totA = warForgeA + warForgeUpgradeA + warStartFinish + warDungeon + warSkillA + warSkillUpA + warTech + warEggHatch + warEggMergeInput + warMountA + warMountMergeSummonA + warMountMergeInput;


    // --- UI RENDER FUNCTIONS (STRICT STYLING + MOBILE CHECK) ---
    const renderWarRow = (label, valB, valA, isTotal = false, infoType = null) => {
        const isMobile = window.innerWidth <= 768; // CHECK FOR MOBILE WIDTH

        const formatCompactGold = (val) => {
            if (val === 0) return "0";
            if (val < 10000) return Math.round(val).toLocaleString('en-US');
            if (val < 1000000) return parseFloat((val / 1000).toFixed(1)) + 'k';
            return parseFloat((val / 1000000).toFixed(2)) + 'm';
        };

        const strB = formatCompactGold(valB);
        const strA = formatCompactGold(valA);
        const isSingleVal = (Math.abs(valB - valA) < 0.1 || strB === strA);

        const iconHtml = `<img src="icons/warpoint.png" style="width: 18px; height: 18px; object-fit: contain; margin-right: 6px;" onerror="this.style.display='none'">`;
        
        // STRICT FONTS: !important added to everything to override button styles or global leaks
        const commonFont = `font-family: 'Fredoka', sans-serif !important; -webkit-text-stroke: 0px !important; text-shadow: none !important; letter-spacing: 0 !important;`;
        
        const valStyle = `${commonFont} color: #000 !important; font-weight: 600 !important; font-size: 1rem !important; display: flex; align-items: center; white-space: nowrap;`;
        const valAfterStyle = `${commonFont} color: #198754 !important; font-weight: 600 !important; font-size: 1rem !important; display: flex; align-items: center; white-space: nowrap;`;
        const arrowStyle = `${commonFont} color: #27ae60 !important; font-size: 1.1rem !important; padding: 0 6px; font-weight: 900 !important;`;

        let valGroupHtml = '';
        
        // MOBILE LOGIC: Force split into two rows if on mobile and values differ
        if (isMobile && !isSingleVal) {
             valGroupHtml = `
                <div style="display: flex; flex-direction: column; align-items: flex-end; width: auto;">
                    <span style="${valStyle} margin-bottom: 2px;">${iconHtml}${strB}</span>
                    <div style="display: flex; align-items: center;">
                        <span style="${arrowStyle}">➜</span>
                        <span style="${valAfterStyle}">${iconHtml}${strA}</span>
                    </div>
                </div>
            `;
        } else {
            // DESKTOP LOGIC (Or Single Value)
            if (isSingleVal) {
                valGroupHtml = `<div style="display: flex; align-items: center; justify-content: flex-end; flex-shrink: 0;"><span style="${valStyle}">${iconHtml}${strB}</span></div>`;
            } else {
                valGroupHtml = `<div style="display: flex; align-items: center; justify-content: flex-end; flex-shrink: 0;"><span style="${valStyle}">${iconHtml}${strB}</span><span style="${arrowStyle}">➔</span><span style="${valAfterStyle}">${iconHtml}${strA}</span></div>`;
            }
        }

        let labelHtml = label;
        if (infoType) {
            labelHtml = `
                <div style="display: flex; align-items: center; gap: 6px;">
                    ${label}
                    <button class="btn-info" onclick="openWarYieldModal('${infoType}')">i</button>
                </div>`;
        }

        const baseStyle = `width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; border-radius: 12px; box-sizing: border-box; margin-bottom: 8px;`;

        return `
            <div style="${baseStyle} background-color: #e6e9ed; border: 2px solid transparent;">
                <div style="${commonFont} font-weight: 600 !important; font-size: 1rem !important; color: #000 !important; text-align: left;">
                    ${labelHtml}
                </div>
                ${valGroupHtml}
            </div>
        `;
    };

    // 1. RENDER SUMMARY
    let summaryHtml = `
    <div style="display: flex; flex-direction: column; width: 100%; box-sizing: border-box; padding: 0;">
        ${renderWarRow("Day 1", d1B, d1A)}
        ${renderWarRow("Day 2", d2B, d2A)}
        ${renderWarRow("Day 3", d3B, d3A)}
        ${renderWarRow("Day 4", d4B, d4A)}
        ${renderWarRow("Day 5", d5B, d5A)}
        ${renderWarRow("Total", totB, totA, true)}
    </div>`;

    const summaryContainer = document.getElementById('war-calc-summary');
    if (summaryContainer) {
        summaryContainer.style.cssText = 'display: block !important; width: 100% !important; margin-top: 15px;';
        summaryContainer.innerHTML = summaryHtml;
    }

    // 2. RENDER BREAKDOWN
    let resHtml = `
    <div style="display: flex; flex-direction: column; width: 100%; box-sizing: border-box; padding: 0;">
        ${renderWarRow("Forge", warForgeB, warForgeA)}
        ${renderWarRow("Forge Upgrade Gold Spent", warForgeUpgradeB, warForgeUpgradeA)}
        ${renderWarRow("Start / Finish Bonus", warStartFinish, warStartFinish)}
        ${renderWarRow("Dungeon Keys", warDungeon, warDungeon)}
        ${renderWarRow("Skill Summon", warSkillB, warSkillA, false, 'skill')}
        ${renderWarRow("Skill Upgrade", warSkillUpB, warSkillUpA)}
        ${renderWarRow("Tech Upgrade", warTech, warTech)}
        ${renderWarRow("Egg Hatched", warEggHatch, warEggHatch)}
        ${renderWarRow("Egg Merge", warEggMergeInput, warEggMergeInput)}
        ${renderWarRow("Mount Summon", warMountB, warMountA, false, 'mount')}
        ${renderWarRow("Mount Merge (Summon)", warMountMergeSummonB, warMountMergeSummonA)}
        ${renderWarRow("Mount Merge (Input)", warMountMergeInput, warMountMergeInput)}
    </div>`;

    const resContainer = document.getElementById('war-calc-results');
    if (resContainer) {
        resContainer.style.cssText = 'display: block !important; width: 100% !important; margin-top: 15px;';
        resContainer.innerHTML = resHtml;
    }
}

// Ensure update fires when global tech changes happen (if your app uses these events)
if (typeof window !== 'undefined') {
    window.addEventListener('techPlannerUpdated', updateWarCalc); 
}

document.addEventListener('DOMContentLoaded', () => {
    initWarCalc();
});