/**
 * MODAL.JS
 * Master Engine for all custom popup modals.
 */

// =========================================
// 1. THE CONTROL PANEL (Change Colors & Text Here)
// =========================================
const MODAL_SETTINGS = {
    // --- CALCULATOR & DAILY TAB MODALS ---
    calcForge: {
        title: "EXPECTED ITEM YIELD",
        headerColor: "#ccced8", titleColor: "#ffffff",
        disclaimer: "Effective hammer is your hammer value after taking Free Forge Chance tech into account"
    },
    dailyGold: {
        title: "TOTAL DAILY GOLD VALUE",
        headerColor: "#ccced8", titleColor: "#ffffff",
        disclaimer: ""
    },

    // --- WAR CALC MODALS ---
    warYield: {
        title: "EXPECTED YIELD", 
        headerColor: "#ccced8", titleColor: "#ffffff",
        disclaimer: "Values are statistical averages. Actual in-game results may vary."
    },
    
    // --- EQUIPMENT MODALS ---
    eqAvgBreakdown: {
        title: "OVERALL AVERAGE HEALTH/DAMAGE BREAKDOWN",
        headerColor: "#ccced8", titleColor: "#ffffff",
        disclaimer: "" // Disclaimer removed as requested
    }
};

// =========================================
// 2. THE MASTER ENGINE (Builds the Modal Shell)
// =========================================
function renderMasterModal(configKey, bodyContentHTML) {
    const modal = document.getElementById('tableModal');
    const content = modal.querySelector('.modal-content');
    
    // Fallback if setting doesn't exist yet
    if (!MODAL_SETTINGS[configKey]) {
        MODAL_SETTINGS[configKey] = { title: "DETAILS", headerColor: "#ccced8", titleColor: "#ffffff", disclaimer: "" };
    }
    const settings = MODAL_SETTINGS[configKey];

    content.style.padding = "0";
    content.style.backgroundColor = "#FFFFFF";

    content.innerHTML = `
        <div class="modal-header-fixed" style="background-color: ${settings.headerColor}; border-bottom: 2px solid #000; border-radius: 16px 16px 0 0; padding: 15px 10px 10px 10px;">
            <h2 class="modal-title-text" style="color: ${settings.titleColor};">
                ${settings.title}
            </h2>
        </div>
        
        <div id="modal-scroll-area" class="modal-body-scroll" style="padding: 10px 15px; background: #ffffff;">
            ${bodyContentHTML}
        </div>
        
        <div class="modal-footer" style="background-color: ${settings.headerColor}; border-top: 2px solid #000; border-radius: 0 0 16px 16px; padding: 10px 15px 25px 15px;">
            <div class="modal-disclaimer">
                ${settings.disclaimer}
            </div>
            <button class="btn-close-floating" onclick="document.getElementById('tableModal').style.display='none'"><span>×</span></button>
        </div>
    `;

    modal.style.display = 'block';
}

// =========================================
// 3. TABLE GENERATOR (For STATS Tab)
// =========================================
let currentModalTableData = { headers: [], rows: [], itemsPerTab: 0 };

function renderModalTable(configKey, subData, headers, allRows, itemsPerTab = 0, tabNames = []) {
    currentModalTableData = { headers, rows: allRows, itemsPerTab };
    
    let subRowHtml = '';
    // Supports either a single object or an array of objects to stack multiple headers
    if (subData) {
        const dataArray = Array.isArray(subData) ? subData : [subData];
        dataArray.forEach(sd => {
            let valHtml = `<span style="color: #000; -webkit-text-stroke: 0px #000000; font-family: 'Fredoka', sans-serif; font-weight: 650;">${sd.before}</span>`; 
            
            if (sd.before !== sd.after) {
                valHtml += `<span style="margin: 0 8px; color: #000; font-family: 'Fredoka', sans-serif; font-weight: 650; -webkit-text-stroke: 0px;">➜</span>`;
                valHtml += `<span style="color: #198754; font-family: 'Fredoka', sans-serif; font-weight: 650; -webkit-text-stroke: 0px;">${sd.after}</span>`;
            }

            subRowHtml += `
                <div style="background-color: #f2f2f2; border-radius: 8px; padding: 8px 20px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center; border: none;">
                    <span style="color: #000000; font-family: 'Fredoka', sans-serif; font-weight: 650; -webkit-text-stroke: 0px;">${sd.label}</span>
                    <div style="font-family: 'Fredoka', sans-serif; font-size: 0.95rem;">${valHtml}</div>
                </div>`;
        });
    }

    let tabsHtml = '';
    if (itemsPerTab > 0 && tabNames.length > 0) {
        tabsHtml = `<div id="modal-tabs-container">`;
        tabNames.forEach((name, idx) => {
            const activeCls = idx === 0 ? 'active' : '';
            tabsHtml += `<button class="seg-btn ${activeCls}" onclick="switchModalTab(${idx}, this)">${name}</button>`;
        });
        tabsHtml += `</div>`;
    }

    let isLeftAligned = (headers[0] === "Item Tier" || headers[0] === "Category" || headers[0] === "Rarity");
    let leftHeaderStyle = isLeftAligned ? 'text-align: left; padding-left: 20px; width: 45%;' : '';
    let rightHeaderStyle = 'text-align: right; padding-right: 20px; box-sizing: border-box;';

    let tableHtml = `
        ${subRowHtml}
        ${tabsHtml}
        <table class="clean-table" style="margin-top: 10px; width: 100%;">
            <thead><tr>
                <th style="${leftHeaderStyle}">${headers[0]}</th>
                <th style="${rightHeaderStyle}">${headers[1]}</th>
            </tr></thead>
            <tbody id="modal-table-body"></tbody>
        </table>
    `;

    renderMasterModal(configKey, tableHtml);
    switchModalTab(0); 
}

function switchModalTab(tabIndex, btnElement = null) {
    if (btnElement) {
        const container = document.getElementById('modal-tabs-container');
        if(container) {
            Array.from(container.children).forEach(btn => btn.classList.remove('active'));
            btnElement.classList.add('active');
        }
    }

    const tbody = document.getElementById('modal-table-body');
    if (!tbody) return;

    const data = currentModalTableData;
    let startIdx = 0;
    let endIdx = data.rows.length;

    if (data.itemsPerTab > 0) {
        startIdx = tabIndex * data.itemsPerTab;
        endIdx = startIdx + data.itemsPerTab;
    }

    let isLeftAligned = (data.headers[0] === "Item Tier" || data.headers[0] === "Category" || data.headers[0] === "Rarity");
    let leftColStyle = isLeftAligned ? 'text-align: left; padding-left: 20px; display: block; width: 100%; box-sizing: border-box;' : '';

    let rowsHtml = '';
    for (let i = startIdx; i < endIdx && i < data.rows.length; i++) {
        const row = data.rows[i];
        
        let leftCol = row[0];
        let rightCol = row[1];
        
        let bgColorStyle = row[2] ? `background-color: ${row[2]} !important; border-top-color: transparent !important; border-bottom-color: transparent !important;` : '';
        let textStyle = row[2] ? `color: #000 !important; font-family: 'Fredoka', sans-serif; font-weight: 700;` : ''; 

        if (rightCol.includes('➜')) {
            let parts = rightCol.split('➜');
            rightCol = `
                <div style="display: flex; justify-content: flex-end; align-items: center; gap: 6px; width: 100%; padding-right: 20px; box-sizing: border-box;"> 
                    <div style="${textStyle}">${parts[0].trim()}</div>
                    <div style="color: #000 !important; font-weight: 900; -webkit-text-stroke: 0px !important; margin: 0 2px;">➜</div>
                    <div style="color: #198754 !important; font-weight: 800; -webkit-text-stroke: 0px !important;">${parts[1].trim()}</div>
                </div>`;
        } else {
            rightCol = `<div style="${textStyle} text-align: right; width: 100%; display: block; padding-right: 20px; box-sizing: border-box;">${rightCol}</div>`;
        }
        
        rowsHtml += `<tr><td style="${bgColorStyle}"><div style="${leftColStyle} ${textStyle}">${leftCol}</div></td><td style="${bgColorStyle}">${rightCol}</td></tr>`;
    }
    tbody.innerHTML = rowsHtml;
}

// =========================================
// 4. THE SPECIFIC MODALS
// =========================================

const formatCompactGold = (val) => {
    if (val < 10000) return Math.round(val).toLocaleString('en-US');
    if (val < 1000000) return parseFloat((val / 1000).toFixed(1)) + 'k';
    return parseFloat((val / 1000000).toFixed(2)) + 'm';
};

const formatYield = (val) => {
    if (val === 0) return "0";
    if (val > 0 && val < 10) {
        return val.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    }
    return val.toLocaleString('en-US', {minimumFractionDigits: 1, maximumFractionDigits: 1});
};

// --- UPDATED WAR CALC YIELD MODAL ---
function openWarYieldModal(type) {
    if (!window.currentWarYields) return;
    
    const dataB = type === 'skill' ? window.currentWarYields.skillB : window.currentWarYields.mountB;
    const dataA = type === 'skill' ? window.currentWarYields.skillA : window.currentWarYields.mountA;
    
    // War Point Multipliers
    const POINTS_MAP = type === 'skill' ? [50, 75, 100, 125, 150, 175] : [400, 600, 900, 1350, 2000, 3000];
    const ROW_COLORS = ['#ecf0f1', '#5cd8fe', '#5dfe8a', '#fcfe5d', '#ff5c5d', '#d55cff'];
    
    let totalB = 0;
    let totalA = 0;
    let rowsHtml = '';

    // --- FONT SETTINGS ---
    const fontStyle = "font-family: 'Fredoka' !important, sans-serif; font-weight: 500; -webkit-text-stroke: 0px #000000 !important; font-size: 0.9rem;";
    const arrowStyle = "font-family: 'Fredoka' !important, sans-serif; font-weight: 650; font-size: 1rem; color: #198754; -webkit-text-stroke: 0px #000000 !important;margin: 0 4px;";
    const afterStyle = "font-family: 'Fredoka' !important, sans-serif; font-weight: 500; font-size: 0.9rem; -webkit-text-stroke: 0px #000000 !important; color: #198754;";

    // 1. Build Rarity Rows
    for (let i = 0; i < 6; i++) {
        const vB = dataB[i] || 0;
        const vA = dataA[i] || 0;
        
        totalB += vB;
        totalA += vA;
        
        const fmtB = formatYield(vB);
        const fmtA = formatYield(vA);
        const isSingleVal = (fmtB === fmtA);
        
        // --- LEFT COLUMN: AMOUNT ---
        let amountHtml = '';
        if (isSingleVal) {
            amountHtml = `<span style="${fontStyle} color: #000;">${fmtB}</span>`;
        } else {
            amountHtml = `
                <div class="war-val-group-left" style="display: flex; justify-content: flex-start; align-items: center; gap: 4px; flex-wrap: wrap;">
                    <span style="${fontStyle} color: #000;">${fmtB}</span>
                    <div style="display: flex; align-items: center;">
                        <span style="${arrowStyle}">➜</span>
                        <span style="${afterStyle}">${fmtA}</span>
                    </div>
                </div>
            `;
        }

        // --- RIGHT COLUMN: WAR POINTS ---
        const ptsB = vB * POINTS_MAP[i];
        const ptsA = vA * POINTS_MAP[i];
        const fmtPtsB = Math.round(ptsB).toLocaleString('en-US');
        const fmtPtsA = Math.round(ptsA).toLocaleString('en-US');
        const isSinglePts = (fmtPtsB === fmtPtsA);

        let ptsHtml = '';
        if (isSinglePts) {
            ptsHtml = `<span style="${fontStyle} color: #000;">${fmtPtsB}</span>`;
        } else {
            ptsHtml = `
                <div class="war-val-group" style="display: flex; justify-content: flex-end; align-items: center; gap: 4px; flex-wrap: wrap;">
                    <span style="${fontStyle} color: #000;">${fmtPtsB}</span>
                    <div style="display: flex; align-items: center;">
                        <span style="${arrowStyle}">➜</span>
                        <span style="${afterStyle}">${fmtPtsA}</span>
                    </div>
                </div>
            `;
        }

        rowsHtml += `
            <div style="background-color: ${ROW_COLORS[i]}; border-radius: 8px; padding: 10px 15px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
                <div style="text-align: left;">${amountHtml}</div>
                <div style="text-align: right;">${ptsHtml}</div>
            </div>
        `;
    }

    // 2. Build Header Summary (Skill or Mount)
    let summaryHtml = '';
    const renderSummaryRow = (label, b, a) => {
        const isSingle = (b === a);
        let valHtml = '';
        if (isSingle) {
            valHtml = `<span style="${fontStyle} color: #000;">${b}</span>`;
        } else {
            valHtml = `
                <div class="war-val-group" style="display: flex; justify-content: flex-end; align-items: center; gap: 4px; flex-wrap: wrap;">
                    <span style="${fontStyle} color: #000;">${b}</span>
                    <div style="display: flex; align-items: center;">
                        <span style="${arrowStyle}">➜</span>
                        <span style="${afterStyle}">${a}</span>
                    </div>
                </div>
            `;
        }
        return `
            <div style="background-color: #f2f2f2; border-radius: 8px; padding: 10px 15px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
                <span style="${fontStyle} color: #000;">${label}</span>
                <div style="text-align: right;">${valHtml}</div>
            </div>
        `;
    };

    if (type === 'skill') {
        summaryHtml += renderSummaryRow("Skill Summoned", Math.round(totalB).toLocaleString('en-US'), Math.round(totalA).toLocaleString('en-US'));
    } else if (type === 'mount') {
        const pullsB = window.currentWarYields.mountPullsB || 0;
        const pullsA = window.currentWarYields.mountPullsA || 0;
        summaryHtml += renderSummaryRow("Mount Pull", Math.round(pullsB).toLocaleString('en-US'), Math.round(pullsA).toLocaleString('en-US'));
        summaryHtml += renderSummaryRow("Mount Summoned", formatYield(totalB), formatYield(totalA));
    }

    // 3. Inject Mobile-Specific CSS
    const mobileStyle = `
        <style>
            @media (max-width: 768px) {
                .war-val-group {
                    flex-direction: column;
                    align-items: flex-end !important;
                    gap: 0 !important;
                }
                .war-val-group-left {
                    flex-direction: column;
                    align-items: flex-start !important;
                    gap: 0 !important;
                }
            }
        </style>
    `;

    // 4. Assemble Final HTML
    const finalHtml = `
        ${mobileStyle}
        <div style="display: flex; flex-direction: column; gap: 4px;">
            ${summaryHtml}
            <div style="height: 10px;"></div> <div style="display: flex; justify-content: space-between; padding: 0 15px; margin-bottom: 5px;">
                <span style="${fontStyle} color: #000;">Amount</span>
                <span style="${fontStyle} color: #000;">War Points</span>
            </div>
            ${rowsHtml}
        </div>
    `;

    // 5. Render
    const backupTitle = MODAL_SETTINGS.warYield.title;
    MODAL_SETTINGS.warYield.title = type === 'skill' ? "EXPECTED SKILL YIELD" : "EXPECTED MOUNT YIELD";
    renderMasterModal('warYield', finalHtml);
    MODAL_SETTINGS.warYield.title = backupTitle;
}

// A. Calculator / Daily Modals (Untouched)
function openDailyGoldModal(md) {
    const getHammerData = (valB, valA) => {
        const fmtB = Math.round(valB).toLocaleString('en-US');
        const fmtA = Math.round(valA).toLocaleString('en-US');
        const icon = `<img src="icons/fm_hammer.png" style="height: 1.2em; vertical-align: -3px; margin-right: 2px;">`;
        return { b: `${icon}${fmtB}`, a: `${icon}${fmtA}`, isUpgrade: fmtB !== fmtA };
    };

    const getGoldData = (valB, valA) => {
        const fmtB = formatCompactGold(valB);
        const fmtA = formatCompactGold(valA);
        const icon = `<img src="icons/fm_gold.png" style="height: 1.2em; vertical-align: -3px; margin-right: 2px;">`;
        return { b: `${icon}${fmtB}`, a: `${icon}${fmtA}`, isUpgrade: fmtB !== fmtA };
    };

    const hammerRows = [
        ["Offline Hammer", getHammerData(md.offHB, md.offHA)],
        ["Thief Hammer (x2)", getHammerData(md.thiefHB, md.thiefHA)],
        ["Effective Hammer", getHammerData(md.effHB, md.effHA)]
    ];

    const goldRows = [
        ["Offline Coin", getGoldData(md.offGB, md.offGA)],
        ["Thief Coin (x2)", getGoldData(md.thiefGB, md.thiefGA)],
        ["Gold from Hammering", getGoldData(md.forgeGB, md.forgeGA)]
    ];

    const customStyles = `
        <style>
            .dg-box { border: 3px solid #000; border-radius: 14px; padding: 8px; margin-bottom: 15px; background: #fff; }
            .dg-table { width: 100%; border-collapse: separate; border-spacing: 0 6px; }
            .dg-table td { background: #EBEBEB; padding: 10px 15px; font-family: 'Fredoka', sans-serif !important; -webkit-text-stroke: 0px !important; }
            .dg-table td:first-child { border-radius: 10px 0 0 10px; width: 45%; font-weight: 650; font-size: 0.9rem; color: #000; }
            .dg-table td:last-child { border-radius: 0 10px 10px 0; width: 55%; text-align: right; }
            .dg-val-wrapper { display: flex; align-items: center; justify-content: flex-end; }
            .dg-val-before { font-weight: 650; color: #000; display: flex; align-items: center; font-size: 0.9rem; }
            .dg-val-after-group { display: flex; align-items: center; font-size: 0.9rem; font-weight: 650; }
            .dg-val-arrow { margin: 0 8px; font-size: 1.2rem; color: #fff; -webkit-text-stroke: 2.5px #000 !important; font-family: 'Fredoka One', sans-serif !important; font-weight: normal; }
            .dg-val-after { color: #198754; font-weight: 800; display: flex; align-items: center; }

            @media (max-width: 768px) {
                .dg-box { padding: 4px; border-width: 2px; }
                .dg-table td { padding: 8px 10px; }
                .dg-val-wrapper { flex-direction: column; align-items: flex-end; justify-content: center; }
                .dg-val-after-group { margin-top: 4px; }
            }
        </style>
    `;

    function buildBox(rows) {
        let trs = '';
        for (let row of rows) {
            let leftLabel = row[0];
            let data = row[1];
            
            let rightHtml = `<div class="dg-val-wrapper"><div class="dg-val-before">${data.b}</div>`;
            if (data.isUpgrade) {
                rightHtml += `
                    <div class="dg-val-after-group">
                        <div class="dg-val-arrow">➜</div>
                        <div class="dg-val-after">${data.a}</div>
                    </div>
                `;
            }
            rightHtml += `</div>`;
            trs += `<tr><td>${leftLabel}</td><td>${rightHtml}</td></tr>`;
        }
        return `<div class="dg-box"><table class="dg-table"><tbody>${trs}</tbody></table></div>`;
    }

    renderMasterModal('dailyGold', customStyles + buildBox(hammerRows) + buildBox(goldRows));
}

function openForgeModal(md, forgeLvl) {
    const rates = typeof CALC_FORGE_RATES !== 'undefined' ? CALC_FORGE_RATES[forgeLvl] || CALC_FORGE_RATES[1] : [];
    const TIER_NAMES = ["Primitive", "Medieval", "Early-Modern", "Modern", "Space", "Interstellar", "Multiverse", "Quantum", "Underworld", "Divine"];
    const allRows = [];
    
    for (let i = 0; i < 10; i++) {
        if (rates[i] > 0) {
            const amtB = md.effHB * (rates[i] / 100);
            const amtA = md.effHA * (rates[i] / 100);
            
            const fmtB = formatYield(amtB);
            const fmtA = formatYield(amtA);
            
            let valStr = fmtB;
            if (fmtB !== fmtA) valStr += ` ➜ ${fmtA}`;
            
            allRows.push([TIER_NAMES[i], valStr]);
        }
    }
    renderModalTable('dailyForge', null, ["Item Tier", "Amount"], allRows, 0, []);
}

// B. STATS Tab Modals
function showPotionTable(cur, proj) {
    const isUpgrade = proj > cur;
    const allRows = [];
    for (let t = 1; t <= 5; t++) {
        let tierSumBefore = 0, tierSumAfter = 0;
        for (let i = 0; i < 5; i++) {
            const base = typeof potionCosts !== 'undefined' ? potionCosts[t][i] : 0;
            const v1 = Math.round(base * (1 - cur / 100));
            const v2 = Math.round(base * (1 - proj / 100));
            tierSumBefore += v1; tierSumAfter += v2;
            let valStr = v1.toLocaleString();
            if (isUpgrade) valStr += ` ➜ ${v2.toLocaleString()}`;
            allRows.push([`${i + 1}`, valStr]);
        }
        let sumStr = `${tierSumBefore.toLocaleString()}`;
        if (isUpgrade) sumStr += ` ➜ ${tierSumAfter.toLocaleString()}`;
        allRows.push([`Total`, sumStr]);
    }
    renderModalTable('techCost', { label: "Discount", before: `-${cur}%`, after: `-${proj}%` }, ['Level', 'Upgrade Cost'], allRows, 6, ['I', 'II', 'III', 'IV', 'V']);
}

function showTechTimerTable(cur, proj) {
    const isUpgrade = proj > cur;
    const allRows = [];
    for (let t = 1; t <= 5; t++) {
        let tierSumBefore = 0, tierSumAfter = 0;
        for (let i = 0; i < 5; i++) {
            const base = typeof tierTimes !== 'undefined' ? tierTimes[t][i] : 0;
            const v1 = base / (1 + cur / 100);
            const v2 = base / (1 + proj / 100);
            tierSumBefore += v1; tierSumAfter += v2;
            let valStr = formatSmartTime(v1);
            if (isUpgrade) valStr += ` ➜ ${formatSmartTime(v2)}`;
            allRows.push([`${i + 1}`, valStr]);
        }
        let sumStr = `${formatSmartTime(tierSumBefore)}`;
        if (isUpgrade) sumStr += ` ➜ ${formatSmartTime(tierSumAfter)}`;
        allRows.push([`Total`, sumStr]);
    }
    renderModalTable('techSpeed', { label: "Speed Bonus", before: `+${cur}%`, after: `+${proj}%` }, ['Level', 'Duration'], allRows, 6, ['I', 'II', 'III', 'IV', 'V']);
}

function showEqSellTable(cur, proj) {
    const isUpgrade = proj > cur;
    const allRows = [];
    for (let i = 1; i <= 149; i++) {
        const base = 20 * Math.pow(1.01, i - 1);
        const v1 = Math.round(base * (100 + cur) / 100);
        const v2 = Math.round(base * (100 + proj) / 100);
        let valStr = typeof formatResourceValue === 'function' ? formatResourceValue(v1, 'gold') : v1.toLocaleString();
        if (isUpgrade) valStr += ` ➜ ${typeof formatResourceValue === 'function' ? formatResourceValue(v2, 'gold') : v2.toLocaleString()}`;
        allRows.push([`${i}`, valStr]);
    }
    renderModalTable('eqSell', { label: "Bonus", before: `+${cur}%`, after: `+${proj}%` }, ["Level", "Sell Price"], allRows, 0, []);
}

function showForgeTable(type, cur, proj) {
    const isUpgrade = proj > cur;
    const isT = type === 'timer';
    const rows = [];
    for (let i = 1; i <= 34; i++) {
        if (typeof forgeLevelData === 'undefined' || !forgeLevelData[i]) continue;
        const [cost, hours] = forgeLevelData[i];
        let v1, v2;
        if (isT) {
            v1 = formatSmartTime((hours * 60) / (1 + cur / 100));
            v2 = formatSmartTime((hours * 60) / (1 + proj / 100));
        } else {
            v1 = formatForgeCost(Math.round(cost * (1 - cur / 100)));
            v2 = formatForgeCost(Math.round(cost * (1 - proj / 100)));
        }
        let cellContent = v1;
        if (isUpgrade) cellContent += ` ➜ ${v2}`;
        rows.push([`${i} ➜ ${i + 1}`, cellContent]);
    }
    renderModalTable(
        isT ? 'forgeTimer' : 'forgeUpgrade', 
        isT ? { label: "Speed", before: `+${cur}%`, after: `+${proj}%` } : { label: "Discount", before: `-${cur}%`, after: `-${proj}%` }, 
        ["Level", isT ? "Upgrade Duration" : "Upgrade Cost"], 
        rows, 50, []
    );
}

// --- EQUIPMENT SELL PRICE BREAKDOWN MODAL ---
function openEqSellBreakdownModal(currentAvg, fromLevel, fromBonus, finalAvg) {
    // Add settings dynamically if not already in MODAL_SETTINGS
    if (typeof MODAL_SETTINGS !== 'undefined' && !MODAL_SETTINGS.eqSellBreakdown) {
        MODAL_SETTINGS.eqSellBreakdown = {
            title: "SELL PRICE BREAKDOWN",
            headerColor: "#ccced8", 
            titleColor: "#ffffff",
            disclaimer: "Breakdown isolates the extra sell price gained from Level Brackets vs Eq. Sell Price Tech."
        };
    }

    const fontStr = "font-family: 'Fredoka', sans-serif; -webkit-text-stroke: 0px;";
    
    // Safely fallback to formatCompactGold which is already defined in this file
    const safeFormat = (val) => typeof formatResourceValue === 'function' ? formatResourceValue(val, 'gold') : formatCompactGold(val);
    
    let html = `
    <div style="display: flex; flex-direction: column; gap: 6px; padding-top: 5px;">
        <div style="background-color: #f2f2f2; border-radius: 8px; padding: 12px 15px; display: flex; justify-content: space-between; align-items: center;">
            <span style="${fontStr} font-weight: 600; color: #000;">Current Total Average</span>
            <span style="${fontStr} font-weight: 650; color: #000; display: flex; align-items: center; gap: 5px;">
                <img src="icons/fm_gold.png" style="width:16px; height:16px; object-fit:contain;"> ${safeFormat(currentAvg)}
            </span>
        </div>
        
        <div style="background-color: #ecf0f1; border-radius: 8px; padding: 12px 15px; display: flex; justify-content: space-between; align-items: center;">
            <span style="${fontStr} font-weight: 600; color: #000;">From New Level Brackets</span>
            <span style="${fontStr} font-weight: 650; color: #198754; display: flex; align-items: center; gap: 5px;">
                 <img src="icons/fm_gold.png" style="width:16px; height:16px; object-fit:contain;"> +${safeFormat(fromLevel)}
            </span>
        </div>
        
        <div style="background-color: #ecf0f1; border-radius: 8px; padding: 12px 15px; display: flex; justify-content: space-between; align-items: center;">
            <span style="${fontStr} font-weight: 600; color: #000;">From Forge Eq. Sell Price Tech</span>
            <span style="${fontStr} font-weight: 650; color: #198754; display: flex; align-items: center; gap: 5px;">
                 <img src="icons/fm_gold.png" style="width:16px; height:16px; object-fit:contain;"> +${safeFormat(fromBonus)}
            </span>
        </div>
        
        <div style="background-color: #d1f2eb; border: 2px solid #198754; border-radius: 8px; padding: 12px 15px; margin-top: 6px; display: flex; justify-content: space-between; align-items: center;">
            <span style="${fontStr} font-weight: 700; color: #000; font-size: 1.05rem;">Planned Total Average</span>
            <span style="${fontStr} font-weight: 700; color: #198754; font-size: 1.05rem; display: flex; align-items: center; gap: 5px;">
                <img src="icons/fm_gold.png" style="width:18px; height:18px; object-fit:contain;"> ${safeFormat(finalAvg)}
            </span>
        </div>
    </div>
    `;

    if (typeof renderMasterModal === 'function') {
        renderMasterModal('eqSellBreakdown', html);
    }
}

// --- UPDATED EQUIPMENT AVERAGE STAT BREAKDOWN MODAL ---
function openEqAvgBreakdownModal(hpB, hpM, hpA, dmgB, dmgM, dmgA) {
    const hpFromLevel = hpM - hpB;
    const hpFromBonus = hpA - hpM;
    
    const dmgFromLevel = dmgM - dmgB;
    const dmgFromBonus = dmgA - dmgM;

    // Helper formatting function
    const fmt = (val) => typeof formatCombatStat === 'function' ? formatCombatStat(val) : val.toLocaleString();
    const fontStyle = "font-family: 'Fredoka', sans-serif; -webkit-text-stroke: 0px;";

    // Layout helper for rows
    const createRow = (label, val, icon, isGain, isTotal) => {
        const colorClass = (isGain && val > 0) || isTotal ? 'color: #198754;' : 'color: #000;';
        const bgClass = isTotal ? 'background-color: #d1f2eb; border: 2px solid #198754; margin-top: 6px;' : 'background-color: #ecf0f1; margin-bottom: 6px;';
        const prefix = (isGain && val > 0) ? '+' : '';
        
        return `
        <div style="${bgClass} border-radius: 8px; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center;">
            <span style="${fontStyle} font-weight: 600; color: #000;">${label}</span>
            <span style="${fontStyle} font-weight: 650; ${colorClass} display: flex; align-items: center; gap: 5px;">
                <img src="icons/${icon}" style="width:16px; height:16px; object-fit:contain;"> ${prefix}${fmt(val)}
            </span>
        </div>`;
    };

    let html = `<div style="padding-top: 5px; display: flex; flex-direction: column;">`;

    // 1. HEALTH TABLE
    html += createRow("Current Average", hpB, "icon_hp.png", false, false);
    html += createRow("From Item Lv", hpFromLevel, "icon_hp.png", true, false);
    html += createRow("From Mastery", hpFromBonus, "icon_hp.png", true, false);
    html += createRow("New Average", hpA, "icon_hp.png", false, true);

    // 2. SEPARATOR LINE
    html += `<hr style="border: 0; height: 1px; background: #bdc3c7; margin: 20px 0;">`;

    // 3. DAMAGE TABLE
    html += createRow("Current Average", dmgB, "icon_dmg.png", false, false);
    html += createRow("From Item Lv", dmgFromLevel, "icon_dmg.png", true, false);
    html += createRow("From Mastery", dmgFromBonus, "icon_dmg.png", true, false);
    html += createRow("New Average", dmgA, "icon_dmg.png", false, true);

    html += `</div>`;

    renderMasterModal('eqAvgBreakdown', html);
}

// --- CUSTOM CONFIRMATION MODAL (Clean Box) ---
function openConfirmModal(message, onConfirmCallback) {
    window.currentConfirmCallback = onConfirmCallback;
    const modal = document.getElementById('tableModal');
    const content = modal.querySelector('.modal-content');
    
    // 1. MODAL BOX OVERALL SIZE
    // We add 'width' and 'margin' here to override the default huge 480px width
    content.style.setProperty('width', '280px', 'important');
    content.style.padding = "20px 15px 15px 15px"; // <-- TWEAK THIS: Shrink padding if it feels too empty
    content.style.backgroundColor = "#FFFFFF";
    content.style.borderRadius = "16px";
    content.style.border = "3px solid #000000";
    
    content.innerHTML = `
        <div style="font-family: 'Fredoka', sans-serif; font-size: 1rem; font-weight: 600; text-align: center; color: #ffffff; margin-bottom: 20px; line-height: 1.3;">
            ${message}
        </div>

        <div style="display: flex; justify-content: center; gap: 12px;">
            <button class="btn-confirm-cancel" onclick="document.getElementById('tableModal').style.display='none'" style="flex: 1; max-width: 100px; height: 42px; border: 2px solid #000000; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; background-color: #ff4757; box-shadow: inset 0 -4px 0 0 #c0392b; transition: transform 0.1s;">
            <img src="icons/icon_cancel.png" style="width: 22px; height: 22px; filter: drop-shadow(0 2px 0 rgba(0,0,0,0.2)); transform: translateY(-2px);">
        </button>

        <button class="btn-confirm-ok" onclick="document.getElementById('tableModal').style.display='none'; if(window.currentConfirmCallback) window.currentConfirmCallback();" style="flex: 1; max-width: 100px; height: 42px; border: 2px solid #000000; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; background-color: #00b0ff; box-shadow: inset 0 -4px 0 0 #005680; transition: transform 0.1s;">
            <img src="icons/button_ok.png" style="width: 22px; height: 22px; filter: drop-shadow(0 2px 0 rgba(0,0,0,0.2)); transform: translateY(-2px);">
        </button>
    </div>
    <style>
        .btn-confirm-ok:active { transform: translateY(3px); box-shadow: inset 0 -1px 0 0 #005680 !important; }
        .btn-confirm-cancel:active { transform: translateY(3px); box-shadow: inset 0 -1px 0 0 #c0392b !important; }
    </style>
    `;
    modal.style.display = 'block';
}