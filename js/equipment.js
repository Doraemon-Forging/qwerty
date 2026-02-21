/**
 * EQUIPMENT.JS
 * Logic for calculating Health, Damage, Range, and Sell Price based on Tech Tiers, levels, and Tech Tree mastery.
 */

const TIER_MULTIPLIERS = {
    "Primitive": 1, "Medieval": Math.pow(4, 1), "Early-Modern": Math.pow(4, 2), "Modern": Math.pow(4, 3),
    "Space": Math.pow(4, 4), "Interstellar": Math.pow(4, 5), "Multiverse": Math.pow(4, 6),
    "Quantum": Math.pow(4, 7), "Underworld": Math.pow(4, 7) * 6, "Divine": Math.pow(4, 7) * 6 * 8 
};

function formatEqValue(val) {
    if (val === 0) return "0";
    if (val < 1000) return val.toLocaleString('en-US', {maximumFractionDigits: 1});
    if (val < 1000000) return (val / 1000).toLocaleString('en-US', {maximumFractionDigits: 1}) + 'k';
    if (val < 1000000000) return (val / 1000000).toLocaleString('en-US', {maximumFractionDigits: 1}) + 'm';
    if (val < 1000000000000) return (val / 1000000000).toLocaleString('en-US', {maximumFractionDigits: 1}) + 'b';
    return (val / 1000000000000).toLocaleString('en-US', {maximumFractionDigits: 1}) + 't';
}

function formatCombatStat(val) {
    if (val === 0) return "0";
    if (val < 10000) return Math.round(val).toLocaleString('en-US'); 
    if (val < 1000000) return parseFloat((val / 1000).toFixed(1)) + 'k';         
    if (val < 1000000000) return parseFloat((val / 1000000).toFixed(2)) + 'm';   
    if (val < 1000000000000) return parseFloat((val / 1000000000).toFixed(2)) + 'b'; 
    return parseFloat((val / 1000000000000).toFixed(2)) + 't';                   
}

function getTechLevels(tree, nodeId) {
    let beforeLvl = 0, afterLvl = 0;
    if (typeof setupLevels !== 'undefined') {
        for (let t = 1; t <= 5; t++) beforeLvl += (setupLevels[`${tree}_T${t}_${nodeId}`] || 0);
    }
    let planState = typeof calcState === 'function' ? calcState().levels : setupLevels;
    if (planState) {
        for (let t = 1; t <= 5; t++) afterLvl += (planState[`${tree}_T${t}_${nodeId}`] || 0);
    }
    return { before: beforeLvl, after: afterLvl };
}

function calcEqStat(baseValue, tierName, itemLvl, masteryPct) {
    const tierMult = TIER_MULTIPLIERS[tierName] || 1;
    const lvlMult = Math.pow(1.01, itemLvl - 1);
    const masteryMult = 1 + (masteryPct / 100);
    return baseValue * tierMult * lvlMult * masteryMult;
}

function calcAvgSellPrice(minLv, maxLv, sellBonusPct) {
    let total = 0;
    let count = 0;
    for (let i = minLv; i <= maxLv; i++) {
        // Rounds each level's price individually exactly like the game does
        total += Math.round(20 * Math.pow(1.01, i - 1) * ((100 + sellBonusPct) / 100));
        count++;
    }
    return count > 0 ? total / count : 0;
}
// Determines the lowest possible drop level based on Bracket Floors
function getEqMinLevel(maxLv) {
    if (maxLv === 99) return 96;
    let floor = 1;
    const bracketFloors = [1, 6, 11, 16, 21, 26, 31, 36, 41, 46, 51, 56, 61, 66, 71, 76, 81, 86, 91, 96, 101, 106, 111, 116, 121, 126, 131, 136, 141, 146];
    for (let f of bracketFloors) {
        if (f <= maxLv - 5) floor = f;
        else break;
    }
    return floor;
}

function renderEqLine(id, valBefore, valAfter, iconType, isHero = false) {
    const el = document.getElementById(id);
    if (!el) return;
    
    // Now pulling from the strictly formatted Combat Stat math
    const fmtBefore = formatCombatStat(valBefore);
    const fmtAfter = formatCombatStat(valAfter);
    
    // STRIPPED out the hardcoded 1.15rem font-size so it matches perfectly
    const textStyle = isHero ? 'font-weight: 800;' : 'font-weight: 700;';
    const iconSize = isHero ? '20px' : '16px';
    
    const valBlockB = `<div style="display:flex; align-items:center; gap:5px; justify-content:center;"><img src="icons/icon_${iconType}.png" style="width:${iconSize}; height:${iconSize}; object-fit:contain;"><span class="text-clean-black" style="${textStyle}">${fmtBefore}</span></div>`;
    const valBlockA = `<div style="display:flex; align-items:center; gap:5px; justify-content:center;"><img src="icons/icon_${iconType}.png" style="width:${iconSize}; height:${iconSize}; object-fit:contain;"><span class="text-clean-green" style="${textStyle}">${fmtAfter}</span></div>`;
    
    if (Math.abs(valBefore - valAfter) < 0.1 || fmtBefore === fmtAfter) {
        el.innerHTML = `<span class="calc-val-before" style="width:100%; display:flex; justify-content:${isHero ? 'center' : 'flex-end'};">${valBlockB}</span>`;
        el.classList.add('single-val'); 
    } else {
        const isMobile = window.innerWidth <= 768;

        // FIXED: Only split the normal rows on mobile. Keep the Hero (Totals) perfectly horizontal.
        if (isMobile && !isHero) {
             el.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:flex-end; width:100%;">
                    <span class="calc-val-before" style="display:flex; justify-content:flex-end; margin-bottom:2px;">${valBlockB}</span>
                    <div style="display:flex; align-items:center; justify-content:flex-end;">
                         <span class="calc-arrow" style="-webkit-text-stroke: 1.5px #000; color: #fff; margin: 0 6px;">➜</span>
                         <span class="calc-val-after" style="display:flex; justify-content:flex-start;">${valBlockA}</span>
                    </div>
                </div>
            `;
        } else {
            el.innerHTML = `
                <span class="calc-val-before" style="display:flex; flex:1; justify-content:flex-end;">${valBlockB}</span>
                <span class="calc-arrow" style="-webkit-text-stroke: 1.5px #000; color: #fff; margin: 0 6px;">➜</span>
                <span class="calc-val-after" style="display:flex; flex:1; justify-content:flex-start;">${valBlockA}</span>
            `;
        }
        el.classList.remove('single-val');
    }
}

// Main execution block
function updateEquipment() {
    if (typeof saveToLocalStorage === 'function') saveToLocalStorage();

    const weaponTypeEl = document.getElementById('eq-weapon-type');
    const weaponType = weaponTypeEl ? weaponTypeEl.value : 'Ranged';
    
    // NEW CARD 4 INPUTS
    const avgTierEl = document.getElementById('eq-avg-tier');
    const avgWeaponEl = document.getElementById('eq-avg-weapon-type');
    const avgTier = avgTierEl ? avgTierEl.value : 'Quantum';
    const avgWeapon = avgWeaponEl ? avgWeaponEl.value : 'Ranged';

    const items = [
        { id: 'helmet', icon: 'eqhelmet', type: 'hp',  base: 40, masteryNode: 'helmet_1', maxNode: 'helmet_2' },
        { id: 'armor',  icon: 'eqarmor',  type: 'hp',  base: 40, masteryNode: 'armor_1',  maxNode: 'armor_2' },
        { id: 'boots',  icon: 'eqboots',  type: 'hp',  base: 40, masteryNode: 'boots_1',  maxNode: 'boots_2' }, 
        { id: 'belt',   icon: 'eqbelt',   type: 'hp',  base: 40, masteryNode: 'belt_1',   maxNode: 'belt_2' },  
        { id: 'weapon', icon: 'eqweapon', type: 'dmg', base: 5,  masteryNode: 'weapon_1', maxNode: 'weapon_2' },
        { id: 'gloves', icon: 'eqgloves', type: 'dmg', base: 5,  masteryNode: 'gloves_1', maxNode: 'gloves_2' },
        { id: 'neck',   icon: 'eqneck',   type: 'dmg', base: 5,  masteryNode: 'necklace_1', maxNode: 'necklace_2' },
        { id: 'ring',   icon: 'eqring',   type: 'dmg', base: 5,  masteryNode: 'ring_1',   maxNode: 'ring_2' }
    ];

    let totals = { hpB: 0, hpA: 0, dmgB: 0, dmgA: 0 };
    let sellTableData = [];
    let rangeTableData = [];
    
    // Card 4 specific trackers
    let avgTableData = [];
    let avgTotals = { hpB: 0, hpM: 0, hpA: 0, dmgB: 0, dmgM: 0, dmgA: 0 };
    let shieldData = null; // Stored separately so we can inject it beneath the Belt

    const sellTech = getTechLevels('forge', 'sell');
    const sellPctBefore = sellTech.before * 2;
    const sellPctAfter = sellTech.after * 2;

    let sumCurrent = 0; let sumWithNewLevel = 0; let sumFinal = 0;

    items.forEach(item => {
        // --- EXISTING CARD 1, 2, 3 LOGIC ---
        const tierEl = document.getElementById(`eq-${item.id}-tier`);
        const lvlEl = document.getElementById(`eq-${item.id}-lvl`);
        
        const tier = tierEl ? tierEl.value : 'Primitive';
        const lvlRaw = lvlEl ? lvlEl.value.replace(/\D/g, '') : '1';
        const lvl = parseInt(lvlRaw) || 1;

        const masteryTech = getTechLevels('power', item.masteryNode);
        const masteryB = masteryTech.before * 2;
        const masteryA = masteryTech.after * 2;
        
        let valBefore = calcEqStat(item.base, tier, lvl, masteryB);
        let valAfter = calcEqStat(item.base, tier, lvl, masteryA);

        if (item.id === 'weapon') {
            if (weaponType === 'Melee') {
                valBefore *= 1.6; valAfter *= 1.6;
            } else if (weaponType === 'Melee+Shield') {
                valBefore *= 0.8; valAfter *= 0.8;
                const shieldHpBefore = calcEqStat(40, tier, lvl, masteryB) * 0.5;
                const shieldHpAfter = calcEqStat(40, tier, lvl, masteryA) * 0.5;
                totals.hpB += shieldHpBefore; totals.hpA += shieldHpAfter;
                renderEqLine('eq-res-shield', shieldHpBefore, shieldHpAfter, 'hp');
            }
        }

        if (item.type === 'hp') { totals.hpB += valBefore; totals.hpA += valAfter; } 
        else { totals.dmgB += valBefore; totals.dmgA += valAfter; }
        renderEqLine(`eq-res-${item.id}`, valBefore, valAfter, item.type);

        const maxLvTech = getTechLevels('power', item.maxNode);
        const maxLvBefore = 99 + (maxLvTech.before * 2);
        const maxLvAfter = 99 + (maxLvTech.after * 2);

        const minLvBefore = getEqMinLevel(maxLvBefore);
        const minLvAfter = getEqMinLevel(maxLvAfter);
        rangeTableData.push({ icon: item.icon, minB: minLvBefore, maxB: maxLvBefore, minA: minLvAfter, maxA: maxLvAfter });

        const sellPriceBefore = calcAvgSellPrice(minLvBefore, maxLvBefore, sellPctBefore);
        const sellPriceMiddle = calcAvgSellPrice(minLvAfter, maxLvAfter, sellPctBefore); 
        const sellPriceAfter = calcAvgSellPrice(minLvAfter, maxLvAfter, sellPctAfter);   

        sumCurrent += sellPriceBefore;
        sumWithNewLevel += sellPriceMiddle;
        sumFinal += sellPriceAfter;

        sellTableData.push({ icon: item.icon, before: sellPriceBefore, after: sellPriceAfter });

        // --- NEW CARD 4 LOGIC (TRUE LEVEL AVERAGING) ---
        const getTrueAverage = (base, tierName, min, max, pct) => {
            let sum = 0;
            for(let i=min; i<=max; i++) sum += calcEqStat(base, tierName, i, pct);
            return sum / (max - min + 1);
        };

        let avgB = getTrueAverage(item.base, avgTier, minLvBefore, maxLvBefore, masteryB);
        let avgM = getTrueAverage(item.base, avgTier, minLvAfter, maxLvAfter, masteryB); 
        let avgA = getTrueAverage(item.base, avgTier, minLvAfter, maxLvAfter, masteryA);

        let shieldAvgB = 0, shieldAvgM = 0, shieldAvgA = 0;

        if (item.id === 'weapon') {
            if (avgWeapon === 'Melee') {
                avgB *= 1.6; avgM *= 1.6; avgA *= 1.6;
            } else if (avgWeapon === 'Melee+Shield') {
                avgB *= 0.8; avgM *= 0.8; avgA *= 0.8;
                shieldAvgB = getTrueAverage(40, avgTier, minLvBefore, maxLvBefore, masteryB) * 0.5;
                shieldAvgM = getTrueAverage(40, avgTier, minLvAfter, maxLvAfter, masteryB) * 0.5;
                shieldAvgA = getTrueAverage(40, avgTier, minLvAfter, maxLvAfter, masteryA) * 0.5;
                avgTotals.hpB += shieldAvgB; avgTotals.hpM += shieldAvgM; avgTotals.hpA += shieldAvgA;
                
                // Save shield for later so we can inject it beneath the Belt
                shieldData = { id: 'shield', icon: 'eqshield', before: shieldAvgB, after: shieldAvgA, type: 'hp' };
            }
        }

        if (item.type === 'hp') {
            avgTotals.hpB += avgB; avgTotals.hpM += avgM; avgTotals.hpA += avgA;
        } else {
            avgTotals.dmgB += avgB; avgTotals.dmgM += avgM; avgTotals.dmgA += avgA;
        }

        avgTableData.push({ id: item.id, icon: item.icon, before: avgB, after: avgA, type: item.type });
    });

    // Splice the Shield into the Card 4 array strictly below the Belt
    if (shieldData) {
        const beltIndex = avgTableData.findIndex(d => d.id === 'belt');
        if (beltIndex !== -1) {
            avgTableData.splice(beltIndex + 1, 0, shieldData);
        }
    }

    const shieldLine = document.getElementById('eq-line-shield');
    if (shieldLine) shieldLine.style.display = (weaponType === 'Melee+Shield') ? 'flex' : 'none';

    renderEqLine('eq-res-total-hp', totals.hpB, totals.hpA, 'hp', true);
    renderEqLine('eq-res-total-dmg', totals.dmgB, totals.dmgA, 'dmg', true);

    // --- RENDER DYNAMIC RANGE TABLE (CARD 3) ---
    const rangeContainer = document.getElementById('eq-range-container');
    if (rangeContainer) {
        let html = '';
        rangeTableData.forEach(data => {
            const strB = `Lv ${data.minB}-${data.maxB}`;
            const strA = `Lv ${data.minA}-${data.maxA}`;
            let isSingle = (strB === strA);
            
            // FIX: Check for Necklace
            const labelName = data.icon === 'eqneck' ? 'Necklace' : data.icon.replace('eq', '').charAt(0).toUpperCase() + data.icon.replace('eq', '').slice(1);
            
            let rowVals = isSingle ? 
                `<span class="calc-val-before" style="width:100%; text-align:right; display:flex; justify-content:flex-end; align-items:center;"><span class="text-clean-black">${strB}</span></span>` : 
                `<span class="calc-val-before" style="display:flex; justify-content:flex-end; align-items:center;"><span class="text-clean-black">${strB}</span></span><span class="text-clean-arrow">➜</span><span class="calc-val-after" style="display:flex; justify-content:flex-start; align-items:center;"><span class="text-clean-green">${strA}</span></span>`;

            html += `<div class="calc-line" style="background-color: #ecf0f1; display: flex; align-items: center; padding-left: 10px;">
                        <div class="calc-label-flex" style="width: 110px; flex-shrink: 0; display: flex; align-items: center; gap: 8px;">
                            <div style="width: 30px; height: 30px; background: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <img src="icons/${data.icon}.png" style="width: 22px; height: 22px; object-fit: contain;">
                            </div>
                            <span class="eq-label">${labelName}</span>
                        </div>
                        <div class="calc-val-group ${isSingle ? 'single-val' : ''}" style="display: flex; flex: 1; justify-content: flex-end; align-items: center;">
                            ${rowVals}
                        </div>
                     </div>`;
        });
        rangeContainer.innerHTML = html;
    }

    // --- RENDER DYNAMIC AVERAGE STATS TABLE (CARD 4) ---
    const avgStatsContainer = document.getElementById('eq-avg-stats-container');
    if (avgStatsContainer) {
        let html = '';
        
        const totHpB = formatCombatStat(avgTotals.hpB); const totHpA = formatCombatStat(avgTotals.hpA);
        const totDmgB = formatCombatStat(avgTotals.dmgB); const totDmgA = formatCombatStat(avgTotals.dmgA);
        const isTotalSingle = (totHpB === totHpA && totDmgB === totDmgA);

        const hpBlockB = `<div style="display:flex; align-items:center; gap:5px; justify-content:center;"><img src="icons/icon_hp.png" style="width:20px; height:20px; object-fit:contain;"><span class="text-clean-black" style="font-size: 1.15rem;">${totHpB}</span></div>`;
        const hpBlockA = `<div style="display:flex; align-items:center; gap:5px; justify-content:center;"><img src="icons/icon_hp.png" style="width:20px; height:20px; object-fit:contain;"><span class="text-clean-green" style="font-size: 1.15rem;">${totHpA}</span></div>`;
        
        const dmgBlockB = `<div style="display:flex; align-items:center; gap:5px; justify-content:center;"><img src="icons/icon_dmg.png" style="width:20px; height:20px; object-fit:contain;"><span class="text-clean-black" style="font-size: 1.15rem;">${totDmgB}</span></div>`;
        const dmgBlockA = `<div style="display:flex; align-items:center; gap:5px; justify-content:center;"><img src="icons/icon_dmg.png" style="width:20px; height:20px; object-fit:contain;"><span class="text-clean-green" style="font-size: 1.15rem;">${totDmgA}</span></div>`;

        // UPDATE BUTTON IN HEADER (NEW LOGIC)
        const headerInfoBtn = document.getElementById('btn-eq-avg-info');
        if (headerInfoBtn) {
            headerInfoBtn.style.display = 'flex'; // Make visible
            headerInfoBtn.onclick = function() {
                openEqAvgBreakdownModal(avgTotals.hpB, avgTotals.hpM, avgTotals.hpA, avgTotals.dmgB, avgTotals.dmgM, avgTotals.dmgA);
            };
        }

        let hpCol = isTotalSingle ? `<span style="width:100%; display:flex; justify-content:center;">${hpBlockB}</span>` : `<span style="display:flex; flex:1; justify-content:flex-end;">${hpBlockB}</span><span class="text-clean-arrow">➜</span><span style="display:flex; flex:1; justify-content:flex-start;">${hpBlockA}</span>`;
        let dmgCol = isTotalSingle ? `<span style="width:100%; display:flex; justify-content:center;">${dmgBlockB}</span>` : `<span style="display:flex; flex:1; justify-content:flex-end;">${dmgBlockB}</span><span class="text-clean-arrow">➜</span><span style="display:flex; flex:1; justify-content:flex-start;">${dmgBlockA}</span>`;

        html += `<div class="calc-line" style="background-color: #ecf0f1; border: 2px solid #000; margin-bottom: 10px; padding: 10px 5px; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                    <div class="calc-val-group eq-inline-group">${hpCol}</div>
                    <div class="calc-val-group eq-inline-group">${dmgCol}</div>
                 </div>`;

        let currentGroup = 'hp';
        avgTableData.forEach(data => {
            if (data.type === 'dmg' && currentGroup === 'hp') {
                html += `<hr class="pet-hr">`;
                currentGroup = 'dmg';
            }

            const fmtB = formatCombatStat(data.before);
            const fmtA = formatCombatStat(data.after);
            let isSingle = (fmtB === fmtA);
            
            // FIX: Check for Necklace
            const labelName = data.icon === 'eqneck' ? 'Necklace' : data.icon.replace('eq', '').charAt(0).toUpperCase() + data.icon.replace('eq', '').slice(1);

            let rowVals = isSingle ? 
                `<span class="calc-val-before" style="width:100%; text-align:right; display:flex; justify-content:flex-end; align-items:center; gap:5px;"><img src="icons/icon_${data.type}.png" style="width:16px; height:16px; object-fit:contain;"><span class="text-clean-black">${fmtB}</span></span>` : 
                `<span class="calc-val-before" style="display:flex; justify-content:flex-end; align-items:center; gap:5px;"><img src="icons/icon_${data.type}.png" style="width:16px; height:16px; object-fit:contain;"><span class="text-clean-black">${fmtB}</span></span><span class="text-clean-arrow">➜</span><span class="calc-val-after" style="display:flex; justify-content:flex-start; align-items:center; gap:5px;"><img src="icons/icon_${data.type}.png" style="width:16px; height:16px; object-fit:contain;"><span class="text-clean-green">${fmtA}</span></span>`;

            html += `<div class="calc-line" style="background-color: #ecf0f1; display: flex; align-items: center; padding-left: 10px;">
                        <div class="calc-label-flex" style="width: 110px; flex-shrink: 0; display: flex; align-items: center; gap: 8px;">
                            <div style="width: 30px; height: 30px; background: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <img src="icons/${data.icon}.png" style="width: 22px; height: 22px; object-fit: contain;">
                            </div>
                            <span class="eq-label">${labelName}</span>
                        </div>
                        <div class="calc-val-group ${isSingle ? 'single-val' : ''}" style="display: flex; flex: 1; justify-content: flex-end; align-items: center;">
                            ${rowVals}
                        </div>
                     </div>`;
        });
        avgStatsContainer.innerHTML = html;
    }

    // --- RENDER DYNAMIC SELL PRICE TABLE (CARD 5) ---
    const sellContainer = document.getElementById('eq-sell-container');
    if (sellContainer) {
        let html = '';
        
        const avgCurrent = parseFloat((sumCurrent / items.length).toFixed(1));
        const avgWithNewLevel = parseFloat((sumWithNewLevel / items.length).toFixed(1));
        const avgFinal = parseFloat((sumFinal / items.length).toFixed(1));

        const valFromLevels = parseFloat((avgWithNewLevel - avgCurrent).toFixed(1));
        const valFromBonus = parseFloat((avgFinal - avgWithNewLevel).toFixed(1));

        const totalValB = formatEqValue(avgCurrent);
        const totalValA = formatEqValue(avgFinal);
        const isTotalSingle = (Math.abs(avgCurrent - avgFinal) < 0.1 || totalValB === totalValA);

        let totalRowVals = isTotalSingle ? 
            `<div style="display:flex; align-items:center; gap:6px; justify-content:flex-end;"><img src="icons/fm_gold.png" style="width:18px; height:18px; object-fit:contain;"><span class="text-clean-black" style="font-size: 1.05rem;">${totalValB}</span></div>` : 
            `<span class="calc-val-before" style="display:flex; justify-content:flex-end; align-items:center; gap:5px;"><img src="icons/fm_gold.png" style="width:16px; height:16px; object-fit:contain;"><span class="text-clean-black">${totalValB}</span></span><span class="text-clean-arrow">➜</span><span class="calc-val-after" style="display:flex; justify-content:flex-start; align-items:center; gap:5px;"><img src="icons/fm_gold.png" style="width:16px; height:16px; object-fit:contain;"><span class="text-clean-green">${totalValA}</span></span>`;

        // UPDATE SELL PRICE HEADER BUTTON
        const headerSellBtn = document.getElementById('btn-eq-sell-info');
        if (headerSellBtn) {
            headerSellBtn.style.display = 'flex';
            headerSellBtn.onclick = function() {
                openEqSellBreakdownModal(avgCurrent, valFromLevels, valFromBonus, avgFinal);
            };
        }

        html += `<div class="calc-line" style="background-color: #ecf0f1; border: 2px solid #000; margin-bottom: 8px; display: flex; align-items: center; padding-left: 10px; padding-top: 6px; padding-bottom: 6px;">
                    <div style="display: flex; align-items: center; gap: 0px; flex-shrink: 0;">
                        <span class="text-clean-black" style="font-size: 1rem;">Overall Average</span>
                    </div>
                    <div class="calc-val-group ${isTotalSingle ? 'single-val' : ''}" style="display: flex; flex: 1; justify-content: flex-end; align-items: center;">
                        ${totalRowVals}
                    </div>
                 </div>`;

        sellTableData.forEach(data => {
            const cleanB = parseFloat(data.before.toFixed(1));
            const cleanA = parseFloat(data.after.toFixed(1));
            
            const fmtB = formatEqValue(cleanB);
            const fmtA = formatEqValue(cleanA);
            let isSingle = (fmtB === fmtA);
            
            // FIX: Check for Necklace
            const labelName = data.icon === 'eqneck' ? 'Necklace' : data.icon.replace('eq', '').charAt(0).toUpperCase() + data.icon.replace('eq', '').slice(1);
            
            let rowVals = isSingle ? 
                `<span class="calc-val-before" style="width:100%; text-align:right; display:flex; justify-content:flex-end; align-items:center; gap:5px;"><img src="icons/fm_gold.png" style="width:16px; height:16px; object-fit:contain;"><span class="text-clean-black">${fmtB}</span></span>` : 
                `<span class="calc-val-before" style="display:flex; justify-content:flex-end; align-items:center; gap:5px;"><img src="icons/fm_gold.png" style="width:16px; height:16px; object-fit:contain;"><span class="text-clean-black">${fmtB}</span></span><span class="text-clean-arrow">➜</span><span class="calc-val-after" style="display:flex; justify-content:flex-start; align-items:center; gap:5px;"><img src="icons/fm_gold.png" style="width:16px; height:16px; object-fit:contain;"><span class="text-clean-green">${fmtA}</span></span>`;

            html += `<div class="calc-line" style="background-color: #ecf0f1; display: flex; align-items: center; padding-left: 10px;">
                        <div class="calc-label-flex" style="width: 110px; flex-shrink: 0; display: flex; align-items: center; gap: 8px;">
                            <div style="width: 30px; height: 30px; background: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <img src="icons/${data.icon}.png" style="width: 22px; height: 22px; object-fit: contain;">
                            </div>
                            <span class="eq-label">${labelName}</span>
                        </div>
                        <div class="calc-val-group ${isSingle ? 'single-val' : ''}" style="display: flex; flex: 1; justify-content: flex-end; align-items: center;">
                            ${rowVals}
                        </div>
                     </div>`;
        });
        sellContainer.innerHTML = html;
    }
}

document.addEventListener('DOMContentLoaded', () => { updateEquipment(); });