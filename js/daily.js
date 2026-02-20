/**
 * DAILY.JS
 * Logic for Daily Totals, Dungeon calculations, War Points, and Local Auto-Save.
 * Relies on CALC_FORGE_RATES from tools.js
 */

const SKILL_RATES = {
    "1-1": [100,0,0,0,0,0], "1-2": [100,0,0,0,0,0], "1-3": [100,0,0,0,0,0], "1-4": [89.95,10,0.05,0,0,0], "1-5": [88.54,11.4,0.06,0,0,0], "1-6": [86.93,13,0.07,0,0,0], "1-7": [85.1,14.82,0.08,0,0,0], "1-8": [83,16.89,0.11,0,0,0], "1-9": [80.61,19.25,0.14,0,0,0], "1-10": [77.88,21.95,0.17,0,0,0],
    "2-1": [74.76,25.03,0.21,0,0,0], "2-2": [71.21,28.53,0.26,0,0,0], "2-3": [67.14,32.52,0.34,0,0,0], "2-4": [62.51,37.07,0.42,0,0,0], "2-5": [57.21,42.27,0.52,0,0,0], "2-6": [51.17,48.18,0.65,0,0,0], "2-7": [44.26,54.92,0.82,0,0,0], "2-8": [36.36,62.62,1.02,0,0,0], "2-9": [27.34,71.38,1.28,0,0,0], "2-10": [17.5,80.9,1.6,0,0,0],
    "3-1": [17.5,80.49,2,0.01,0,0], "3-2": [17.5,80.09,2.4,0.01,0,0], "3-3": [17.5,79.61,2.87,0.02,0,0], "3-4": [17.5,79.03,3.45,0.02,0,0], "3-5": [17.5,78.34,4.13,0.03,0,0], "3-6": [17.5,77.51,4.95,0.04,0,0], "3-7": [17.5,76.51,5.95,0.04,0,0], "3-8": [17.5,75.32,7.13,0.05,0,0], "3-9": [17.5,73.89,8.54,0.07,0,0], "3-10": [17.5,72.17,10.24,0.09,0,0],
    "4-1": [17.5,70.11,12.28,0.11,0,0], "4-2": [17.5,67.64,14.73,0.13,0,0], "4-3": [17.5,64.68,17.65,0.17,0,0], "4-4": [17.5,61.12,21.17,0.21,0,0], "4-5": [17.5,56.86,25.38,0.26,0,0], "4-6": [17.5,51.74,30.43,0.33,0,0], "4-7": [17.5,45.6,36.49,0.41,0,0], "4-8": [17.5,38.24,43.75,0.51,0,0], "4-9": [17.5,29.41,52.45,0.64,0,0], "4-10": [17.5,18.81,62.89,0.8,0,0],
    "5-1": [17.5,16.5,65,1,0,0], "5-2": [17.5,16.5,64.78,1.22,0,0], "5-3": [17.5,16.5,64.51,1.49,0,0], "5-4": [17.5,16.5,64.17,1.82,0.01,0], "5-5": [17.5,16.5,63.76,2.22,0.02,0], "5-6": [17.5,16.5,63.27,2.7,0.03,0], "5-7": [17.5,16.5,62.66,3.3,0.04,0], "5-8": [17.5,16.5,61.92,4.03,0.05,0], "5-9": [17.5,16.5,61.02,4.91,0.07,0], "5-10": [17.5,16.5,59.93,5.99,0.08,0],
    "6-1": [17.5,16.5,58.59,7.3,0.11,0], "6-2": [17.5,16.5,56.95,8.92,0.13,0], "6-3": [17.5,16.5,54.96,10.87,0.17,0], "6-4": [17.5,16.5,52.53,13.26,0.21,0], "6-5": [17.5,16.5,49.56,16.18,0.26,0], "6-6": [17.5,16.5,45.93,19.74,0.33,0], "6-7": [17.5,16.5,41.5,24.09,0.41,0], "6-8": [17.5,16.5,36.1,29.39,0.51,0], "6-9": [17.5,16.5,29.51,35.85,0.64,0], "6-10": [17.5,16.5,21.46,43.74,0.8,0],
    "7-1": [17.5,16.5,16.5,48.5,1,0], "7-2": [17.5,16.5,16.5,48.31,1.19,0], "7-3": [17.5,16.5,16.5,48.08,1.42,0], "7-4": [17.5,16.5,16.5,47.8,1.69,0.01], "7-5": [17.5,16.5,16.5,47.47,2.01,0.02], "7-6": [17.5,16.5,16.5,47.08,2.39,0.03], "7-7": [17.5,16.5,16.5,46.62,2.84,0.04], "7-8": [17.5,16.5,16.5,46.07,3.38,0.05], "7-9": [17.5,16.5,16.5,45.41,4.02,0.07], "7-10": [17.5,16.5,16.5,44.63,4.79,0.08],
    "8-1": [17.5,16.5,16.5,43.7,5.69,0.11], "8-2": [17.5,16.5,16.5,42.59,6.78,0.13], "8-3": [17.5,16.5,16.5,41.27,8.06,0.17], "8-4": [17.5,16.5,16.5,39.69,9.6,0.21], "8-5": [17.5,16.5,16.5,37.82,11.42,0.26], "8-6": [17.5,16.5,16.5,35.58,13.59,0.33], "8-7": [17.5,16.5,16.5,32.92,16.17,0.41], "8-8": [17.5,16.5,16.5,29.74,19.25,0.51], "8-9": [17.5,16.5,16.5,25.96,22.9,0.64], "8-10": [17.5,16.5,16.5,21.45,27.25,0.8],
    "9-1": [17.5,16.5,16.5,16.5,32,1], "9-2": [17.5,16.5,16.5,16.5,31.84,1.16], "9-3": [17.5,16.5,16.5,16.5,31.65,1.35], "9-4": [17.5,16.5,16.5,16.5,31.44,1.56], "9-5": [17.5,16.5,16.5,16.5,31.19,1.81], "9-6": [17.5,16.5,16.5,16.5,30.9,2.1], "9-7": [17.5,16.5,16.5,16.5,30.56,2.44], "9-8": [17.5,16.5,16.5,16.5,30.17,2.83], "9-9": [17.5,16.5,16.5,16.5,29.72,3.28], "9-10": [17.5,16.5,16.5,16.5,29.2,3.8],
    "10-1": [17.5,16.5,16.5,16.5,28.59,4.41], "10-2": [17.5,16.5,16.5,16.5,27.88,5.12], "10-3": [17.5,16.5,16.5,16.5,27.06,5.94], "10-4": [17.5,16.5,16.5,16.5,26.11,6.89], "10-5": [17.5,16.5,16.5,16.5,25.01,7.99], "10-6": [17.5,16.5,16.5,16.5,23.73,9.27], "10-7": [17.5,16.5,16.5,16.5,22.25,10.75], "10-8": [17.5,16.5,16.5,16.5,20.53,12.47], "10-9": [17.5,16.5,16.5,16.5,18.54,14.46], "10-10": [17.5,16.5,16.5,16.5,16.5,16.5]
};

const EGG_RATES = {
    "1-1": [99,1,0,0,0,0], "1-2": [98,2,0,0,0,0], "1-3": [95,5,0,0,0,0], "1-4": [89.95,10,0.05,0,0,0], "1-5": [88.54,11.4,0.06,0,0,0], "1-6": [86.93,13,0.07,0,0,0], "1-7": [85.1,14.82,0.08,0,0,0], "1-8": [83,16.89,0.11,0,0,0], "1-9": [80.61,19.25,0.14,0,0,0], "1-10": [77.88,21.95,0.17,0,0,0],
    "2-1": [74.76,25.03,0.21,0,0,0], "2-2": [71.21,28.52,0.27,0,0,0], "2-3": [67.14,32.52,0.34,0,0,0], "2-4": [62.51,37.07,0.42,0,0,0], "2-5": [57.21,42.27,0.52,0,0,0], "2-6": [51.17,48.17,0.66,0,0,0], "2-7": [44.26,54.92,0.82,0,0,0], "2-8": [36.36,62.62,1.02,0,0,0], "2-9": [27.34,71.38,1.28,0,0,0], "2-10": [17.5,80.9,1.6,0,0,0],
    "3-1": [17.5,80.48,2,0.02,0,0], "3-2": [17.5,80.07,2.4,0.03,0,0], "3-3": [17.5,79.58,2.88,0.04,0,0], "3-4": [17.5,79,3.45,0.05,0,0], "3-5": [17.5,78.31,4.13,0.06,0,0], "3-6": [17.5,77.47,4.96,0.07,0,0], "3-7": [17.5,76.47,5.94,0.09,0,0], "3-8": [17.5,75.27,7.12,0.11,0,0], "3-9": [17.5,73.82,8.54,0.14,0,0], "3-10": [17.5,72.09,10.24,0.17,0,0],
    "4-1": [17.5,70,12.29,0.21,0,0], "4-2": [17.5,67.51,14.72,0.27,0,0], "4-3": [17.5,64.51,17.65,0.34,0,0], "4-4": [17.5,60.91,21.17,0.42,0,0], "4-5": [17.5,56.6,25.38,0.52,0,0], "4-6": [17.5,51.41,30.43,0.66,0,0], "4-7": [17.5,45.19,36.49,0.82,0,0], "4-8": [17.5,37.73,43.75,1.02,0,0], "4-9": [17.5,28.77,52.45,1.28,0,0], "4-10": [17.5,18.01,62.89,1.6,0,0],
    "5-1": [17.5,16.5,63.98,2,0.02,0], "5-2": [17.5,16.5,63.61,2.36,0.03,0], "5-3": [17.5,16.5,63.18,2.78,0.04,0], "5-4": [17.5,16.5,62.67,3.28,0.05,0], "5-5": [17.5,16.5,62.07,3.87,0.06,0], "5-6": [17.5,16.5,61.35,4.58,0.07,0], "5-7": [17.5,16.5,60.51,5.4,0.09,0], "5-8": [17.5,16.5,59.52,6.37,0.11,0], "5-9": [17.5,16.5,58.34,7.52,0.14,0], "5-10": [17.5,16.5,56.96,8.87,0.17,0],
    "6-1": [17.5,16.5,55.32,10.47,0.21,0], "6-2": [17.5,16.5,53.38,12.35,0.27,0], "6-3": [17.5,16.5,51.09,14.57,0.34,0], "6-4": [17.5,16.5,48.38,17.2,0.42,0], "6-5": [17.5,16.5,45.18,20.3,0.52,0], "6-6": [17.5,16.5,41.4,23.94,0.66,0], "6-7": [17.5,16.5,36.92,28.26,0.82,0], "6-8": [17.5,16.5,31.63,33.35,1.02,0], "6-9": [17.5,16.5,25.37,39.35,1.28,0], "6-10": [17.5,16.5,17.97,46.43,1.6,0],
    "7-1": [17.5,16.5,16.5,47.48,2,0.02], "7-2": [17.5,16.5,16.5,47.17,2.3,0.03], "7-3": [17.5,16.5,16.5,46.81,2.65,0.04], "7-4": [17.5,16.5,16.5,46.41,3.04,0.05], "7-5": [17.5,16.5,16.5,45.94,3.5,0.06], "7-6": [17.5,16.5,16.5,45.41,4.02,0.07], "7-7": [17.5,16.5,16.5,44.78,4.63,0.09], "7-8": [17.5,16.5,16.5,44.07,5.32,0.11], "7-9": [17.5,16.5,16.5,43.24,6.12,0.14], "7-10": [17.5,16.5,16.5,42.29,7.04,0.17],
    "8-1": [17.5,16.5,16.5,41.19,8.1,0.21], "8-2": [17.5,16.5,16.5,39.93,9.3,0.27], "8-3": [17.5,16.5,16.5,38.46,10.7,0.34], "8-4": [17.5,16.5,16.5,36.77,12.31,0.42], "8-5": [17.5,16.5,16.5,34.82,14.16,0.52], "8-6": [17.5,16.5,16.5,32.57,16.27,0.66], "8-7": [17.5,16.5,16.5,29.97,18.71,0.82], "8-8": [17.5,16.5,16.5,26.95,21.53,1.02], "8-9": [17.5,16.5,16.5,23.47,24.75,1.28], "8-10": [17.5,16.5,16.5,19.44,28.46,1.6],
    "9-1": [17.5,16.5,16.5,16.5,31,2], "9-2": [17.5,16.5,16.5,16.5,30.76,2.24], "9-3": [17.5,16.5,16.5,16.5,30.49,2.51], "9-4": [17.5,16.5,16.5,16.5,30.19,2.81], "9-5": [17.5,16.5,16.5,16.5,29.85,3.15], "9-6": [17.5,16.5,16.5,16.5,29.48,3.52], "9-7": [17.5,16.5,16.5,16.5,29.05,3.95], "9-8": [17.5,16.5,16.5,16.5,28.58,4.42], "9-9": [17.5,16.5,16.5,16.5,28.05,4.95], "9-10": [17.5,16.5,16.5,16.5,27.45,5.55],
    "10-1": [17.5,16.5,16.5,16.5,26.79,6.21], "10-2": [17.5,16.5,16.5,16.5,26.04,6.96], "10-3": [17.5,16.5,16.5,16.5,25.21,7.79], "10-4": [17.5,16.5,16.5,16.5,24.27,8.73], "10-5": [17.5,16.5,16.5,16.5,23.23,9.77], "10-6": [17.5,16.5,16.5,16.5,22.05,10.95], "10-7": [17.5,16.5,16.5,16.5,20.74,12.26], "10-8": [17.5,16.5,16.5,16.5,19.27,13.73], "10-9": [17.5,16.5,16.5,16.5,17.62,15.38], "10-10": [17.5,16.5,16.5,16.5,16.5,16.5]
};

// 1. Populate the 1-10 Dropdowns & War Forge
function initDailyDropdowns() {
    const dungeons = ['thief', 'ghost', 'inv', 'zombie'];
    dungeons.forEach(d => {
        const lvlSelect = document.getElementById(`${d}-lvl`);
        const subSelect = document.getElementById(`${d}-sub`);
        if (!lvlSelect || !subSelect) return;
        lvlSelect.innerHTML = ''; subSelect.innerHTML = '';
        for (let i = 1; i <= 10; i++) {
            lvlSelect.add(new Option(i, i)); subSelect.add(new Option(i, i));
        }
    });

    const warForgeSel = document.getElementById('war-forge-lvl');
    if (warForgeSel) {
        warForgeSel.innerHTML = '';
        for (let i = 1; i <= 35; i++) {
            warForgeSel.add(new Option(i, i));
        }
        warForgeSel.value = 20; // Default to 20
    }
}

// ==========================================
// LOCAL STORAGE AUTO-SAVE LOGIC
// ==========================================
function saveDailyLocal() {
    const getVal = (id) => document.getElementById(id) ? document.getElementById(id).value : "1";
    const dailyData = {
        thiefLvl: getVal('thief-lvl'), thiefSub: getVal('thief-sub'),
        ghostLvl: getVal('ghost-lvl'), ghostSub: getVal('ghost-sub'),
        invLvl: getVal('inv-lvl'), invSub: getVal('inv-sub'),
        zombieLvl: getVal('zombie-lvl'), zombieSub: getVal('zombie-sub'),
        warForgeLvl: getVal('war-forge-lvl')
    };
    localStorage.setItem('dailySaveData', JSON.stringify(dailyData));
}

function loadDailyLocal() {
    try {
        const saved = localStorage.getItem('dailySaveData');
        if (saved) {
            const data = JSON.parse(saved);
            const setVal = (id, val) => { if (document.getElementById(id) && val) document.getElementById(id).value = val; };
            
            setVal('thief-lvl', data.thiefLvl); setVal('thief-sub', data.thiefSub);
            setVal('ghost-lvl', data.ghostLvl); setVal('ghost-sub', data.ghostSub);
            setVal('inv-lvl', data.invLvl); setVal('inv-sub', data.invSub);
            setVal('zombie-lvl', data.zombieLvl); setVal('zombie-sub', data.zombieSub);
            
            if (data.warForgeLvl) setVal('war-forge-lvl', data.warForgeLvl);
        }
    } catch (e) {
        console.warn("Could not load Daily local save:", e);
    }
}

// 2. Main Update Function
function updateDaily() {
    const getVal = (id) => parseInt(document.getElementById(id).value) || 1;
    
    // Trigger Auto-Save every time an input changes
    saveDailyLocal();
    
    const dLvl = {
        thief:  { lvl: getVal('thief-lvl'),  sub: getVal('thief-sub') },
        ghost:  { lvl: getVal('ghost-lvl'),  sub: getVal('ghost-sub') },
        inv:    { lvl: getVal('inv-lvl'),    sub: getVal('inv-sub') },
        zombie: { lvl: getVal('zombie-lvl'), sub: getVal('zombie-sub') }
    };

    // ==========================================
    // MATH 1: DUNGEON REWARDS
    // ==========================================
    const steps = {
        thief:  (dLvl.thief.lvl - 1) * 10 + (dLvl.thief.sub - 1),
        ghost:  (dLvl.ghost.lvl - 1) * 10 + (dLvl.ghost.sub - 1),
        zombie: (dLvl.zombie.lvl - 1) * 10 + (dLvl.zombie.sub - 1)
    };
    
    const base = {
        hammer: 60 + (steps.thief * 4),
        gold:   4000 + (steps.thief * 180),
        ticket: 200 + (steps.ghost * 5),
        egg:    2,
        potion: 140 + (steps.zombie * 3)
    };
    
    const getTechBonus = (tree, nodeId, percentPerLevel) => {
        let beforeLvl = 0, afterLvl = 0;
        if (typeof setupLevels !== 'undefined') {
            for (let t = 1; t <= 5; t++) beforeLvl += (setupLevels[`${tree}_T${t}_${nodeId}`] || 0);
        }
        let planState = typeof calcState === 'function' ? calcState().levels : setupLevels;
        if (planState) {
            for (let t = 1; t <= 5; t++) afterLvl += (planState[`${tree}_T${t}_${nodeId}`] || 0);
        }
        return { before: beforeLvl * percentPerLevel, after: afterLvl * percentPerLevel };
    };

    const hBonus = getTechBonus('forge', 'h_bonus', 2);
    const cBonus = getTechBonus('forge', 'c_bonus', 2);
    const keyG   = getTechBonus('spt', 'key_g', 1);
    const lucky  = getTechBonus('spt', 'lucky', 4);
    const keyR   = getTechBonus('spt', 'key_r', 2);
    const summonCost = getTechBonus('spt', 'ticket', 1);

    const rewards = {
        hammer: { before: Math.round(base.hammer * (1 + (hBonus.before / 100))), after: Math.round(base.hammer * (1 + (hBonus.after / 100))) },
        gold:   { before: Math.round(base.gold * (1 + (cBonus.before / 100))),   after: Math.round(base.gold * (1 + (cBonus.after / 100))) },
        ticket: { before: Math.round(base.ticket * (1 + (keyG.before / 100))),   after: Math.round(base.ticket * (1 + (keyG.after / 100))) },
        egg:    { before: base.egg + (lucky.before / 100),                       after: base.egg + (lucky.after / 100) },
        potion: { before: Math.round(base.potion * (1 + (keyR.before / 100))),   after: Math.round(base.potion * (1 + (keyR.after / 100))) }
    };

    // ==========================================
    // MATH 2: TOTAL DAILY VALUES & SKILL CARDS
    // ==========================================
    const curStats = typeof getTechBonuses === 'function' ? getTechBonuses(setupLevels) : { offH: 0, offC: 0, free: 0, avgGold: 0 };
    const projStats = (typeof getTechBonuses === 'function' && typeof calcState === 'function') ? getTechBonuses(calcState().levels) : curStats;

    const modalData = {};
    modalData.offHB = 1440 * (1 + curStats.offH / 100); modalData.offHA = 1440 * (1 + projStats.offH / 100);
    modalData.thiefHB = rewards.hammer.before * 2;      modalData.thiefHA = rewards.hammer.after * 2;
    const totHammerB = modalData.offHB + modalData.thiefHB; const totHammerA = modalData.offHA + modalData.thiefHA;
    modalData.effHB = totHammerB / (1 - curStats.free / 100); modalData.effHA = totHammerA / (1 - projStats.free / 100);

    modalData.offGB = 86400 * (1 + curStats.offC / 100); modalData.offGA = 86400 * (1 + projStats.offC / 100);
    modalData.thiefGB = rewards.gold.before * 2;         modalData.thiefGA = rewards.gold.after * 2;
    const totGoldB = modalData.offGB + modalData.thiefGB; const totGoldA = modalData.offGA + modalData.thiefGA;

    modalData.avgGB = curStats.avgGold; modalData.avgGA = projStats.avgGold;
    modalData.forgeGB = modalData.effHB * modalData.avgGB; modalData.forgeGA = modalData.effHA * modalData.avgGA;

    const grandTotalB = totGoldB + modalData.forgeGB; const grandTotalA = totGoldA + modalData.forgeGA;
    const totPotionB = rewards.potion.before * 2; const totPotionA = rewards.potion.after * 2;

    const pullsB = (rewards.ticket.before * 2) / (200 * (1 - summonCost.before / 100));
    const pullsA = (rewards.ticket.after * 2) / (200 * (1 - summonCost.after / 100));
    const totCardsB = pullsB * 5; const totCardsA = pullsA * 5;

    const ghostKey = `${dLvl.ghost.lvl}-${dLvl.ghost.sub}`; const skillRarityRates = SKILL_RATES[ghostKey] || [100,0,0,0,0,0];
    const totEggsB = rewards.egg.before * 2; const totEggsA = rewards.egg.after * 2;
    const invKey = `${dLvl.inv.lvl}-${dLvl.inv.sub}`; const eggRarityRates = EGG_RATES[invKey] || [100,0,0,0,0,0];

    const calcRarityAmt = (pct, tot) => (tot * (pct / 100));

    // ==========================================
    // MATH 3: DAILY WAR POINTS
    // ==========================================
    const skillPointsMap = [50, 75, 100, 125, 150, 175];
    const eggPointsMap = [50, 200, 400, 800, 1600, 3200];

    let warSkillSummonB = 0, warSkillSummonA = 0;
    let warEggMergeB = 0, warEggMergeA = 0;

    for (let i = 0; i < 6; i++) {
        warSkillSummonB += calcRarityAmt(skillRarityRates[i], totCardsB) * skillPointsMap[i];
        warSkillSummonA += calcRarityAmt(skillRarityRates[i], totCardsA) * skillPointsMap[i];
        
        warEggMergeB += calcRarityAmt(eggRarityRates[i], totEggsB) * eggPointsMap[i];
        warEggMergeA += calcRarityAmt(eggRarityRates[i], totEggsA) * eggPointsMap[i];
    }

    const warSkillUpgradeB = warSkillSummonB / 12;
    const warSkillUpgradeA = warSkillSummonA / 12;

    // FORGE MATH
    const warForgeLvl = getVal('war-forge-lvl');
    
    // Use CALC_FORGE_RATES from tools.js if available, otherwise fallback
    const ratesSource = (typeof CALC_FORGE_RATES !== 'undefined') ? CALC_FORGE_RATES : {};
    const fRates = ratesSource[warForgeLvl] || ratesSource[1] || [100,0,0,0,0,0,0,0,0,0];
    
    let warForgeB = 0, warForgeA = 0;
    
    for (let i = 0; i < 10; i++) {
        if (fRates[i] > 0) {
            const pointMultiplier = (i < 3) ? 1 : ((i < 6) ? 2 : 3);
            warForgeB += (modalData.effHB * (fRates[i] / 100)) * pointMultiplier;
            warForgeA += (modalData.effHA * (fRates[i] / 100)) * pointMultiplier;
        }
    }

    const warTotalB = warForgeB + warSkillSummonB + warSkillUpgradeB + warEggMergeB;
    const warTotalA = warForgeA + warSkillSummonA + warSkillUpgradeA + warEggMergeA;

    // ==========================================
    // UI RENDER HELPERS
    // ==========================================
    const formatCompactGold = (val) => {
        if (val < 10000) return Math.round(val).toLocaleString('en-US');
        // parseFloat safely removes .0 (so 10.0k becomes 10k, but 10.8k stays 10.8k)
        if (val < 1000000) return parseFloat((val / 1000).toFixed(1)) + 'k';
        return parseFloat((val / 1000000).toFixed(2)) + 'm';
    };

    // NEW: Smart Decimal Logic
    // 2 decimals if 0-10, 1 decimal if >10
    const formatSmartDecimal = (val) => {
        if (val === 0) return "0";
        if (val < 10) return val.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        return val.toLocaleString('en-US', {minimumFractionDigits: 1, maximumFractionDigits: 1});
    };

    const renderCalcGroup = (valBefore, valAfter, iconName, formatType = 'standard') => {
        const iconHtml = iconName ? `<img src="icons/${iconName}" class="calc-icon-left" style="margin-right: 1px;">` : '';
        
        let fmtBefore, fmtAfter;
        if (formatType === 'smart') {
            fmtBefore = formatSmartDecimal(valBefore);
            fmtAfter = formatSmartDecimal(valAfter);
        } else if (formatType === 'gold') {
            fmtBefore = formatCompactGold(valBefore);
            fmtAfter = formatCompactGold(valAfter);
        } else {
            // standard
            fmtBefore = Math.round(valBefore).toLocaleString('en-US');
            fmtAfter = Math.round(valAfter).toLocaleString('en-US');
        }
        
        // Prevent string comparison issues
        if (Math.abs(valBefore - valAfter) < 0.001 || fmtBefore === fmtAfter) {
            return `<span class="calc-val-before">${iconHtml}${fmtBefore}</span>`;
        } else {
            return `
                <span class="calc-val-before">${iconHtml}${fmtBefore}</span>
                <span class="calc-arrow">➜</span>
                <span class="calc-val-after">${iconHtml}${fmtAfter}</span>
            `;
        }
    };

    const safeRender = (id, vals, icon, formatType = 'standard') => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = renderCalcGroup(vals.before, vals.after, icon, formatType);
    };

    // Card 2
    safeRender('res-hammer-group', rewards.hammer, 'fm_hammer.png');
    safeRender('res-gold-group',   rewards.gold,   'fm_gold.png', 'gold'); // Uses K/M formatting
    safeRender('res-ticket-group', rewards.ticket, 'green_ticket.png');
    safeRender('res-egg-group',    rewards.egg,    'EggCommon.png', 'smart'); 
    safeRender('res-potion-group', rewards.potion, 'red_potion.png');
    
    // Card 3
    safeRender('res-tot-hammer', { before: totHammerB, after: totHammerA }, 'fm_hammer.png');
    safeRender('res-tot-gold',   { before: totGoldB,   after: totGoldA }, 'fm_gold.png', 'gold'); // Uses K/M
    safeRender('res-tot-grand',  { before: grandTotalB,after: grandTotalA }, 'fm_gold.png', 'gold'); // Uses K/M
    safeRender('res-tot-potion', { before: totPotionB, after: totPotionA }, 'red_potion.png');
    
    safeRender('res-skill-pulls', { before: pullsB, after: pullsA }, null, 'smart');
    safeRender('res-skill-cards', { before: totCardsB, after: totCardsA }, null, 'smart');

    const mapRarity = (skillId, eggId, rateIdx) => {
        const skillEl = document.getElementById(skillId);
        if(skillEl) skillEl.innerHTML = renderCalcGroup(calcRarityAmt(skillRarityRates[rateIdx], totCardsB), calcRarityAmt(skillRarityRates[rateIdx], totCardsA), null, 'smart');
        
        const eggEl = document.getElementById(eggId);
        if(eggEl) eggEl.innerHTML = renderCalcGroup(calcRarityAmt(eggRarityRates[rateIdx], totEggsB), calcRarityAmt(eggRarityRates[rateIdx], totEggsA), null, 'smart');
    };
    mapRarity('skill-c', 'egg-c', 0); mapRarity('skill-r', 'egg-r', 1); mapRarity('skill-e', 'egg-e', 2);
    mapRarity('skill-l', 'egg-l', 3); mapRarity('skill-u', 'egg-u', 4); mapRarity('skill-m', 'egg-m', 5);

    // Card 4: War Points (Added 'warpoint.png')
    safeRender('res-war-forge',       { before: warForgeB,        after: warForgeA },        'warpoint.png', false);
    safeRender('res-war-skill-sum',   { before: warSkillSummonB,  after: warSkillSummonA },  'warpoint.png', false);
    safeRender('res-war-skill-up',    { before: warSkillUpgradeB, after: warSkillUpgradeA }, 'warpoint.png', false);
    safeRender('res-war-egg-merge',   { before: warEggMergeB,     after: warEggMergeA },     'warpoint.png', false);
    safeRender('res-war-tot',         { before: warTotalB,        after: warTotalA },        'warpoint.png', false);

    // Bind Modals
    const infoGoldBtn = document.getElementById('btn-daily-info');
    if (infoGoldBtn) infoGoldBtn.onclick = () => openDailyGoldModal(modalData);

}

document.addEventListener('DOMContentLoaded', () => {
    initDailyDropdowns();
    loadDailyLocal(); // Load saved values before running the math
    updateDaily();
});