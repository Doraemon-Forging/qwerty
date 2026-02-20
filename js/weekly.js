/**
 * WEEKLY.JS - FULL FILE
 */

// --- CONSTANTS (League, War, Individual Rewards) ---
const LEAGUE_REWARDS = {
    "Diamond": {
        "1st": [2620, 131000, 3150, 11, 2620, 1050], "2nd": [2100, 105000, 2520, 8, 2100, 840],
        "3rd": [1680, 84000, 2010, 7, 1680, 672], "4-5": [1340, 67200, 1610, 5, 1340, 538],
        "6-10": [1070, 53700, 1290, 4, 1070, 430], "11-20": [860, 43000, 1030, 3, 860, 344],
        "21-50": [688, 34400, 826, 3, 688, 275], "51-100": [551, 27500, 661, 2, 551, 220]
    },
    "Platinum": {
        "1st": [1750, 87500, 2100, 7, 1750, 700], "2nd": [1400, 70000, 1680, 6, 1400, 560],
        "3rd": [1120, 56000, 1340, 4, 1120, 448], "4-5": [896, 44800, 1070, 4, 896, 358],
        "6-10": [717, 35800, 860, 3, 717, 287], "11-20": [573, 28600, 688, 2, 573, 229],
        "21-50": [459, 22900, 551, 2, 459, 184], "51-100": [367, 18300, 440, 1, 367, 147]
    },
    "Gold": {
        "1st": [1220, 61200, 1470, 5, 1220, 490], "2nd": [980, 49000, 1170, 4, 980, 392],
        "3rd": [784, 39200, 941, 3, 784, 314], "4-5": [627, 31300, 753, 2, 627, 251],
        "6-10": [502, 25000, 502, 2, 502, 201], "11-20": [401, 20000, 482, 2, 401, 161],
        "21-50": [321, 16000, 385, 1, 321, 128], "51-100": [257, 12800, 308, 1, 257, 0]
    },
    "Silver": {
        "1st": [700, 35000, 840, 3, 700, 280], "2nd": [550, 28000, 672, 2, 560, 230],
        "3rd": [450, 22400, 538, 2, 448, 180], "4-5": [350, 17900, 430, 1, 358, 150],
        "6-10": [290, 14300, 344, 1, 287, 0], "11-20": [230, 11400, 275, 1, 229, 0],
        "21-50": [190, 9170, 220, 1, 184, 0], "51-100": [150, 7340, 176, 1, 147, 0]
    },
    "Bronze": {
        "1st": [350, 17500, 420, 2, 350, 70], "2nd": [280, 14000, 330, 1, 280, 20],
        "3rd": [220, 11200, 270, 1, 220, 0], "4-5": [180, 9000, 210, 1, 180, 0],
        "6-10": [140, 7100, 170, 1, 140, 0], "11-20": [110, 5700, 130, 0, 110, 0],
        "21-50": [90, 4500, 110, 0, 90, 0], "51-100": [70, 3600, 90, 0, 70, 0]
    },
    "Unranked": {
        "1st": [175, 9000, 210, 1, 180, 0], "2nd": [140, 7000, 170, 0, 140, 0],
        "3rd": [110, 5600, 140, 0, 0, 0], "4-5": [90, 4500, 100, 0, 0, 0],
        "6-10": [70, 3500, 0, 0, 0, 0], "11-20": [50, 2800, 0, 0, 0, 0],
        "21-50": [40, 2290, 0, 0, 0, 0], "51-100": [30, 1800, 0, 0, 0, 0]
    }
};

const CLAN_WAR_REWARDS = {
    "S-Tier": { "Win": [8400, 280000, 5600, 22, 4200, 2290], "Lose": [4200, 140000, 2800, 11, 2100, 1120] },
    "A-Tier": { "Win": [5900, 196000, 4000, 16, 3000, 1550], "Lose": [3000, 98000, 2000, 8, 1500, 780] },
    "B-Tier": { "Win": [4000, 140000, 2800, 11, 2000, 1000], "Lose": [2000, 70000, 1400, 5, 1000, 550] },
    "C-Tier": { "Win": [2900, 96000, 1900, 8, 1500, 750], "Lose": [1400, 48000, 960, 4, 720, 400] },
    "D-Tier": { "Win": [2000, 67000, 1350, 5, 1000, 540], "Lose": [1000, 33000, 670, 3, 500, 270] },
    "E-Tier": { "Win": [1400, 47000, 950, 4, 700, 380], "Lose": [700, 24000, 470, 2, 350, 190] }
};

const INDIV_REWARDS = {
    "10k":  { val: 10000,  rewards: [100, 0, 60, 1, 0, 0] },
    "20k":  { val: 20000,  rewards: [0, 5000, 0, 0, 70, 35] },
    "50k":  { val: 50000,  rewards: [140, 0, 84, 1, 0, 0] },
    "75k":  { val: 75000,  rewards: [0, 7000, 0, 0, 98, 50] },
    "100k": { val: 100000, rewards: [200, 0, 118, 1, 0, 0] },
    "150k": { val: 150000, rewards: [0, 9800, 0, 0, 137, 70] },
    "200k": { val: 200000, rewards: [280, 0, 165, 1, 0, 0] },
    "250k": { val: 250000, rewards: [0, 13700, 0, 0, 192, 100] },
    "300k": { val: 300000, rewards: [380, 0, 230, 1, 0, 0] },
    "350k": { val: 350000, rewards: [0, 19000, 0, 0, 269, 140] },
    "400k": { val: 400000, rewards: [550, 0, 323, 1, 0, 0] },
    "450k": { val: 450000, rewards: [0, 27000, 0, 0, 376, 190] },
    "500k": { val: 500000, rewards: [750, 0, 452, 1, 0, 0] }
};

// --- LOGIC ---

function updateMountExpCap() {
    const lvlInput = document.getElementById('weekly-mount-summon-lvl');
    const expInput = document.getElementById('weekly-mount-summon-exp');
    const maxLabel = document.getElementById('weekly-mount-max');
    
    if (!lvlInput || !maxLabel || !expInput) return;
    
    let lvl = parseInt(lvlInput.value) || 1;
    if (lvl > 50) lvl = 50; 
    if (lvl < 1) lvl = 1;
    
    const data = (typeof MOUNT_LEVEL_DATA !== 'undefined') ? MOUNT_LEVEL_DATA[lvl] : [100];
    const maxExp = data[0] === "MAX" ? 0 : data[0];

    maxLabel.innerText = maxExp === 0 ? "MAX" : maxExp; 
    
    if (maxExp > 0) {
        expInput.max = maxExp - 1;
        if (parseInt(expInput.value) >= maxExp) {
            expInput.value = maxExp - 1;
        }
    }
}

function updateWeekly() {
    updateMountExpCap(); 

    const formatWeeklyGold = (val) => {
        if (val < 10000) return Math.round(val).toLocaleString('en-US');
        if (val < 1000000) return parseFloat((val / 1000).toFixed(1)) + 'k';
        return parseFloat((val / 1000000).toFixed(2)) + 'm';
    };

    // --- PART 1: LEAGUE & WAR REWARDS (Base Math) ---
    let finalRewards = { hammer: 0, gold: 0, ticket: 0, invKey: 0, potion: 0, mountKey: 0 };

    try {
        const league = document.getElementById('weekly-league').value;
        const rank = document.getElementById('weekly-rank').value;
        const clanTier = document.getElementById('weekly-war-tier').value;
        const clanWin = document.getElementById('weekly-war-win').value;
        const indivTier = document.getElementById('weekly-indiv').value;

        const lRewards = (LEAGUE_REWARDS[league] && LEAGUE_REWARDS[league][rank]) ? LEAGUE_REWARDS[league][rank] : [0,0,0,0,0,0];
        const cRewards = (CLAN_WAR_REWARDS[clanTier] && CLAN_WAR_REWARDS[clanTier][clanWin]) ? CLAN_WAR_REWARDS[clanTier][clanWin] : [0,0,0,0,0,0];

        let iRewards = [0, 0, 0, 0, 0, 0];
        const targetVal = INDIV_REWARDS[indivTier] ? INDIV_REWARDS[indivTier].val : 0;
        for (const key in INDIV_REWARDS) {
            if (INDIV_REWARDS[key].val <= targetVal) {
                const tierRew = INDIV_REWARDS[key].rewards;
                for (let i = 0; i < 6; i++) iRewards[i] += tierRew[i];
            }
        }

        finalRewards = {
            hammer: lRewards[0] + cRewards[0] + iRewards[0],
            gold: lRewards[1] + cRewards[1] + iRewards[1],
            ticket: lRewards[2] + cRewards[2] + iRewards[2],
            invKey: lRewards[3] + cRewards[3] + iRewards[3],
            potion: lRewards[4] + cRewards[4] + iRewards[4],
            mountKey: lRewards[5] + cRewards[5] + iRewards[5]
        };
    } catch (e) {
        console.error("Error in Weekly Base Calc:", e);
    }

    // --- PART 2: REWARDS BREAKDOWN & WAR POINTS ---
    try {
        const getVal = (id) => parseInt(document.getElementById(id) ? document.getElementById(id).value : 1) || 1;
        
        const getWeeklyTechVal = (tree, nodeId) => {
            let beforeLvl = 0, afterLvl = 0;
            if (typeof setupLevels !== 'undefined') {
                for (let t = 1; t <= 5; t++) beforeLvl += (setupLevels[`${tree}_T${t}_${nodeId}`] || 0);
            }
            let planState = (typeof calcState === 'function') ? calcState().levels : (typeof setupLevels !== 'undefined' ? setupLevels : {});
            if (planState) {
                for (let t = 1; t <= 5; t++) afterLvl += (planState[`${tree}_T${t}_${nodeId}`] || 0);
            }
            return { before: beforeLvl, after: afterLvl };
        };

        // --- GLOBAL TECH & RATES ---
        const curStats = (typeof getTechBonuses === 'function' && typeof setupLevels !== 'undefined') ? getTechBonuses(setupLevels) : { free: 0, avgGold: 0, offH: 0, offC: 0 };
        const projStats = (typeof getTechBonuses === 'function' && typeof calcState === 'function') ? getTechBonuses(calcState().levels) : curStats;

        const techTicket = getWeeklyTechVal('spt', 'ticket');
        const costB = 200 * (1 - (techTicket.before * 1) / 100);
        const costA = 200 * (1 - (techTicket.after * 1) / 100);

        const techLucky = getWeeklyTechVal('spt', 'lucky');
        const eggsPerKeyB = 2 + (techLucky.before * 4 / 100);
        const eggsPerKeyA = 2 + (techLucky.after * 4 / 100);

        const techMountCost = getWeeklyTechVal('power', 'mount_cost');
        const techMountChance = getWeeklyTechVal('power', 'mount_chance');
        const mCostB = Math.ceil(50 * (1 - (techMountCost.before * 1) / 100));
        const mCostA = Math.ceil(50 * (1 - (techMountCost.after * 1) / 100));
        const safeCostB = mCostB < 1 ? 1 : mCostB;
        const safeCostA = mCostA < 1 ? 1 : mCostA;

        // --- A. LEAGUE PURE MATH ---
        let leagueHammer = finalRewards.hammer;
        let leagueEffHB = finalRewards.hammer / (1 - (curStats.free || 0) / 100);
        let leagueEffHA = finalRewards.hammer / (1 - (projStats.free || 0) / 100);

        let leagueGrandGoldB = finalRewards.gold + (leagueEffHB * (curStats.avgGold || 0));
        let leagueGrandGoldA = finalRewards.gold + (leagueEffHA * (projStats.avgGold || 0));

        let leagueCardsB = (finalRewards.ticket / (costB || 200)) * 5;
        let leagueCardsA = (finalRewards.ticket / (costA || 200)) * 5;

        let leagueEggsB = finalRewards.invKey * eggsPerKeyB;
        let leagueEggsA = finalRewards.invKey * eggsPerKeyA;

        let leagueMYieldB = (finalRewards.mountKey / safeCostB) * (1 + (techMountChance.before * 2) / 100);
        let leagueMYieldA = (finalRewards.mountKey / safeCostA) * (1 + (techMountChance.after * 2) / 100);

        // --- B. DAILY GAIN MATH REPLICATION ---
        const dLvl = {
            thief:  { lvl: getVal('thief-lvl'),  sub: getVal('thief-sub') },
            ghost:  { lvl: getVal('ghost-lvl'),  sub: getVal('ghost-sub') },
            inv:    { lvl: getVal('inv-lvl'),    sub: getVal('inv-sub') },
            zombie: { lvl: getVal('zombie-lvl'), sub: getVal('zombie-sub') }
        };

        const steps = {
            thief:  (dLvl.thief.lvl - 1) * 10 + (dLvl.thief.sub - 1),
            ghost:  (dLvl.ghost.lvl - 1) * 10 + (dLvl.ghost.sub - 1),
            zombie: (dLvl.zombie.lvl - 1) * 10 + (dLvl.zombie.sub - 1)
        };

        const baseDaily = {
            hammer: 60 + (steps.thief * 4),
            gold:   4000 + (steps.thief * 180),
            ticket: 200 + (steps.ghost * 5),
            egg:    2
        };

        const techHBonus = getWeeklyTechVal('forge', 'h_bonus');
        const techCBonus = getWeeklyTechVal('forge', 'c_bonus');
        const techKeyG = getWeeklyTechVal('spt', 'key_g');
        const techKeyR = getWeeklyTechVal('spt', 'key_r');

        const dailyRew = {
            hammer: { 
                before: Math.round(baseDaily.hammer * (1 + (techHBonus.before*2 / 100))), 
                after: Math.round(baseDaily.hammer * (1 + (techHBonus.after*2 / 100))) 
            },
            gold: { 
                before: Math.round(baseDaily.gold * (1 + (techCBonus.before*2 / 100))),  
                after: Math.round(baseDaily.gold * (1 + (techCBonus.after*2 / 100))) 
            },
            ticket: { 
                before: Math.round(baseDaily.ticket * (1 + (techKeyG.before*1 / 100))),  
                after: Math.round(baseDaily.ticket * (1 + (techKeyG.after*1 / 100))) 
            },
            egg: { 
                before: baseDaily.egg + (techLucky.before*4 / 100),                      
                after: baseDaily.egg + (techLucky.after*4 / 100) 
            },
            potion: {
                before: Math.round((140 + steps.zombie * 3) * (1 + (techKeyR.before*2 / 100))),
                after: Math.round((140 + steps.zombie * 3) * (1 + (techKeyR.after*2 / 100)))
            }
        };

        // Daily Math (1 Day)
        const dailyTotHammerB = (1440 * (1 + (curStats.offH || 0) / 100)) + (dailyRew.hammer.before * 2);
        const dailyTotHammerA = (1440 * (1 + (projStats.offH || 0) / 100)) + (dailyRew.hammer.after * 2);
        const dailyEffHB = dailyTotHammerB / (1 - (curStats.free || 0) / 100);
        const dailyEffHA = dailyTotHammerA / (1 - (projStats.free || 0) / 100);

        const dailyTotGoldB = (86400 * (1 + (curStats.offC || 0) / 100)) + (dailyRew.gold.before * 2);
        const dailyTotGoldA = (86400 * (1 + (projStats.offC || 0) / 100)) + (dailyRew.gold.after * 2);

        const dailyCardsB = ((dailyRew.ticket.before * 2) / (costB || 200)) * 5;
        const dailyCardsA = ((dailyRew.ticket.after * 2) / (costA || 200)) * 5;

        // --- C. TOTAL MATH ---
        const totalHammerB = leagueHammer + (dailyTotHammerB * 7);
        const totalHammerA = leagueHammer + (dailyTotHammerA * 7);

        const totalBaseGoldB = finalRewards.gold + (dailyTotGoldB * 7);
        const totalBaseGoldA = finalRewards.gold + (dailyTotGoldA * 7);

        const totalBaseTicketB = finalRewards.ticket + (dailyRew.ticket.before * 2 * 7);
        const totalBaseTicketA = finalRewards.ticket + (dailyRew.ticket.after * 2 * 7);

        const totalEffHB = leagueEffHB + (dailyEffHB * 7);
        const totalEffHA = leagueEffHA + (dailyEffHA * 7);

        const totalGrandGoldB = leagueGrandGoldB + ((dailyTotGoldB + (dailyEffHB * (curStats.avgGold || 0))) * 7);
        const totalGrandGoldA = leagueGrandGoldA + ((dailyTotGoldA + (dailyEffHA * (projStats.avgGold || 0))) * 7);

        const totalCardsB = leagueCardsB + (dailyCardsB * 7);
        const totalCardsA = leagueCardsA + (dailyCardsA * 7);

        const totalEggsB = leagueEggsB + (dailyRew.egg.before * 2 * 7);
        const totalEggsA = leagueEggsA + (dailyRew.egg.after * 2 * 7);

        const totalPotionB = finalRewards.potion + (dailyRew.potion.before * 2 * 7);
        const totalPotionA = finalRewards.potion + (dailyRew.potion.after * 2 * 7);
// --- D. SHARED RENDER LOGIC ---
        const renderCalcGroup = (valBefore, valAfter, iconName, formatType = 'smart') => {
            const iconHtml = iconName ? `<img src="icons/${iconName}" class="calc-icon-left" style="margin-right: 4px;" onerror="this.style.display='none'">` : '';
            const fmt = (v) => {
                if (formatType === 'gold') return formatWeeklyGold(v);
                if (formatType === 'whole') return Math.round(v).toLocaleString('en-US');
                if (formatType === 'egg') {
                    if (v === 0) return "0";
                    if (v <= 10) return v.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                    return v.toLocaleString('en-US', {minimumFractionDigits: 1, maximumFractionDigits: 1});
                }
                if (v === 0) return "0";
                if (v < 10) return v.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                return v.toLocaleString('en-US', {minimumFractionDigits: 1, maximumFractionDigits: 1});
            };
            const strB = fmt(valBefore || 0);
            const strA = fmt(valAfter || 0);

            if (Math.abs((valBefore || 0) - (valAfter || 0)) < 0.001 || strB === strA) {
                return `<span class="calc-val-before">${iconHtml}${strB}</span>`;
            } else {
                return `
                    <span class="calc-val-before">${iconHtml}${strB}</span>
                    <span class="calc-arrow">➜</span>
                    <span class="calc-val-after">${iconHtml}${strA}</span>
                `;
            }
        };

        const setBreakdown = (id, b, a, icon, formatType = 'smart') => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = renderCalcGroup(b, a, icon, formatType);
        };

        const ghostKey = `${dLvl.ghost.lvl}-${dLvl.ghost.sub}`; 
        const skillRarityRates = typeof SKILL_RATES !== 'undefined' ? (SKILL_RATES[ghostKey] || [100,0,0,0,0,0]) : [100,0,0,0,0,0];
        const invKey = `${dLvl.inv.lvl}-${dLvl.inv.sub}`; 
        const eggRarityRates = typeof EGG_RATES !== 'undefined' ? (EGG_RATES[invKey] || [100,0,0,0,0,0]) : [100,0,0,0,0,0];
        const calcRarityAmt = (pct, tot) => (tot * (pct / 100));

        const calcMountPulls = (startLv, startExp, totalPulls) => {
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
        };

        let startMountLv = parseInt(document.getElementById('weekly-mount-summon-lvl') ? document.getElementById('weekly-mount-summon-lvl').value : 1) || 1;
        let startMountExp = parseFloat(document.getElementById('weekly-mount-summon-exp') ? document.getElementById('weekly-mount-summon-exp').value : 0) || 0;

        const skillPointsMap = [50, 75, 100, 125, 150, 175];
        const eggPointsMap = [50, 200, 400, 800, 1600, 3200];
        const mountPointsMap = [400, 600, 900, 1350, 2000, 3000];

        const warForgeLvl = getVal('war-forge-lvl'); 
        const ratesSource = (typeof CALC_FORGE_RATES !== 'undefined') ? CALC_FORGE_RATES : {};
        const fRates = ratesSource[warForgeLvl] || ratesSource[1] || [100,0,0,0,0,0,0,0,0,0];

        // --- PROCESSING FUNCTION FOR TABS ---
        const processTab = (prefix, stats) => {
            let mountResultsB = calcMountPulls(startMountLv, startMountExp, stats.mountsB);
            let mountResultsA = calcMountPulls(startMountLv, startMountExp, stats.mountsA);

            // 1. BASE / TOTAL REWARDS CARD
            setBreakdown(`${prefix}-base-hammer`, stats.baseHammerB, stats.baseHammerA, 'fm_hammer.png', 'whole');
            setBreakdown(`${prefix}-base-gold`, stats.baseGoldB, stats.baseGoldA, 'fm_gold.png', 'gold');
            setBreakdown(`${prefix}-base-ticket`, stats.baseTicketB, stats.baseTicketA, 'green_ticket.png', 'whole');
            
            if (prefix === 'league') {
                setBreakdown(`${prefix}-base-invkey`, stats.baseInvKeyB, stats.baseInvKeyA, 'invasionkey.png', 'whole');
            } else {
                setBreakdown(`${prefix}-base-egg`, stats.baseEggB, stats.baseEggA, 'EggCommon.png', 'egg'); // <-- EGG FORMAT ADDED
            }
            
            setBreakdown(`${prefix}-base-potion`, stats.basePotionB, stats.basePotionA, 'red_potion.png', 'gold');
            setBreakdown(`${prefix}-base-mountkey`, stats.baseMountKeyB, stats.baseMountKeyA, 'mount_key.png', 'whole');

            // 2. BREAKDOWN CARD (Cleaned up)
            setBreakdown(`res-${prefix}-eff-hammer`, stats.effHB, stats.effHA, 'fm_hammer.png', 'whole');
            setBreakdown(`res-${prefix}-grand`, stats.grandB, stats.grandA, 'fm_gold.png', 'gold');
            setBreakdown(`res-${prefix}-cards`, stats.cardsB, stats.cardsA, null, 'smart');
            setBreakdown(`res-${prefix}-eggs`, stats.eggsB, stats.eggsA, 'EggCommon.png', 'egg'); // <-- EGG BREAKDOWN LINE RE-ADDED WITH EGG FORMAT
            setBreakdown(`res-${prefix}-mounts`, stats.mountsB, stats.mountsA, null, 'smart');

            // 3. RARITIES
            let warSkillSummonB = 0, warSkillSummonA = 0;
            let warEggMergeB = 0, warEggMergeA = 0;
            let warMountSummonB = 0, warMountSummonA = 0;

            const rarities = ['c', 'r', 'e', 'l', 'u', 'm'];
            rarities.forEach((r, i) => {
                const amtSkillB = calcRarityAmt(skillRarityRates[i], stats.cardsB);
                const amtSkillA = calcRarityAmt(skillRarityRates[i], stats.cardsA);
                const amtEggB = calcRarityAmt(eggRarityRates[i], stats.eggsB);
                const amtEggA = calcRarityAmt(eggRarityRates[i], stats.eggsA);
                const amtMountB = mountResultsB[i];
                const amtMountA = mountResultsA[i];

                const skillEl = document.getElementById(`${prefix}-skill-${r}`);
                if (skillEl) skillEl.innerHTML = renderCalcGroup(amtSkillB, amtSkillA, null, 'smart');
                const eggEl = document.getElementById(`${prefix}-egg-${r}`);
                if (eggEl) eggEl.innerHTML = renderCalcGroup(amtEggB, amtEggA, null, 'smart');
                const mountEl = document.getElementById(`${prefix}-mount-${r}`);
                if (mountEl) mountEl.innerHTML = renderCalcGroup(amtMountB, amtMountA, null, 'smart');

                warSkillSummonB += amtSkillB * skillPointsMap[i];
                warSkillSummonA += amtSkillA * skillPointsMap[i];
                warEggMergeB += amtEggB * eggPointsMap[i];
                warEggMergeA += amtEggA * eggPointsMap[i];
                warMountSummonB += amtMountB * mountPointsMap[i];
                warMountSummonA += amtMountA * mountPointsMap[i];
            });

            // 4. WAR POINTS
            const warSkillUpgradeB = warSkillSummonB / 12;
            const warSkillUpgradeA = warSkillSummonA / 12;
            const warMountMergeB = warMountSummonB; 
            const warMountMergeA = warMountSummonA;

            let warForgeB = 0, warForgeA = 0;
            for (let i = 0; i < 10; i++) {
                if (fRates[i] > 0) {
                    const pointMultiplier = (i < 3) ? 1 : ((i < 6) ? 2 : 3);
                    warForgeB += (stats.effHB * (fRates[i] / 100)) * pointMultiplier;
                    warForgeA += (stats.effHA * (fRates[i] / 100)) * pointMultiplier;
                }
            }

            const warTotalB = warForgeB + warSkillSummonB + warSkillUpgradeB + warEggMergeB + warMountSummonB + warMountMergeB;
            const warTotalA = warForgeA + warSkillSummonA + warSkillUpgradeA + warEggMergeA + warMountSummonA + warMountMergeA;

            setBreakdown(`res-${prefix}-war-forge`, warForgeB, warForgeA, 'warpoint.png', 'gold');
            setBreakdown(`res-${prefix}-war-skill-sum`, warSkillSummonB, warSkillSummonA, 'warpoint.png', 'gold');
            setBreakdown(`res-${prefix}-war-skill-up`, warSkillUpgradeB, warSkillUpgradeA, 'warpoint.png', 'gold');
            setBreakdown(`res-${prefix}-war-egg-merge`, warEggMergeB, warEggMergeA, 'warpoint.png', 'gold');
            setBreakdown(`res-${prefix}-war-mount-sum`, warMountSummonB, warMountSummonA, 'warpoint.png', 'gold');
            setBreakdown(`res-${prefix}-war-mount-merge`, warMountMergeB, warMountMergeA, 'warpoint.png', 'gold');
            setBreakdown(`res-${prefix}-war-tot`, warTotalB, warTotalA, 'warpoint.png', 'gold');
        };

        // Fire both maps via Data Objects
        processTab('weekly', {
            baseHammerB: totalHammerB,         baseHammerA: totalHammerA,
            baseGoldB: totalBaseGoldB,         baseGoldA: totalBaseGoldA,
            baseTicketB: totalBaseTicketB,     baseTicketA: totalBaseTicketA,
            baseEggB: totalEggsB,              baseEggA: totalEggsA,
            basePotionB: totalPotionB,         basePotionA: totalPotionA,
            baseMountKeyB: finalRewards.mountKey, baseMountKeyA: finalRewards.mountKey,

            effHB: totalEffHB,                 effHA: totalEffHA,
            grandB: totalGrandGoldB,           grandA: totalGrandGoldA,
            cardsB: totalCardsB,               cardsA: totalCardsA,
            eggsB: totalEggsB,                 eggsA: totalEggsA,
            mountsB: leagueMYieldB,            mountsA: leagueMYieldA
        });

        processTab('league', {
            baseHammerB: leagueHammer,         baseHammerA: leagueHammer,
            baseGoldB: finalRewards.gold,      baseGoldA: finalRewards.gold,
            baseTicketB: finalRewards.ticket,  baseTicketA: finalRewards.ticket,
            baseInvKeyB: finalRewards.invKey,  baseInvKeyA: finalRewards.invKey,
            basePotionB: finalRewards.potion,  basePotionA: finalRewards.potion,
            baseMountKeyB: finalRewards.mountKey, baseMountKeyA: finalRewards.mountKey,

            effHB: leagueEffHB,                effHA: leagueEffHA,
            grandB: leagueGrandGoldB,          grandA: leagueGrandGoldA,
            cardsB: leagueCardsB,              cardsA: leagueCardsA,
            eggsB: leagueEggsB,                eggsA: leagueEggsA,
            mountsB: leagueMYieldB,            mountsA: leagueMYieldA
        });

    } catch (e) {
        console.error("Error in Weekly Breakdown:", e);
    }
}

// --- WEEKLY TAB TOGGLE LOGIC ---
function toggleWeeklyTab(tab) {
    const btnTotal = document.getElementById('btn-weekly-total');
    const btnLeague = document.getElementById('btn-weekly-league');
    const viewTotal = document.getElementById('weekly-tab-total');
    const viewLeague = document.getElementById('weekly-tab-league');

    if (tab === 'total') {
        btnTotal.classList.add('active');
        btnLeague.classList.remove('active');
        viewTotal.style.display = 'block';
        viewLeague.style.display = 'none';
    } else {
        btnLeague.classList.add('active');
        btnTotal.classList.remove('active');
        viewTotal.style.display = 'none';
        viewLeague.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateMountExpCap(); 
    updateWeekly();
});