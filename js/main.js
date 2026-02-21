/**
 * MAIN.JS
 * Entry point. Handles initialization, global navigation, and data persistence.
 */

// --- SCROLL MEMORY ---
const scrollMemory = { panels: {}, trees: {}, mobile: {} };
let currentPanel = 'logs';
let currentTree = 'forge';
let currentMobile = 'more';

// --- GLOBAL UI NAVIGATION ---
function selectTree(treeKey) {
    const treeCont = document.getElementById('tree-container');
    
    // 1. Instantly save current tree's scroll
    if (treeCont) scrollMemory.trees[currentTree] = { top: treeCont.scrollTop, left: treeCont.scrollLeft };

    if (typeof switchTree === 'function') switchTree(treeKey);
    const names = { forge: 'Forge', spt: 'SPT', power: 'Power' };
    const btn = document.getElementById('tree-select-label');
    if (btn && names[treeKey]) btn.innerHTML = `${names[treeKey]} ▼`;
    
    setMainView('tree');

    // 2. Instantly load new tree's scroll (No Timeout!)
    currentTree = treeKey;
    if (treeCont) {
        const pos = scrollMemory.trees[treeKey] || { top: 0, left: 0 };
        treeCont.scrollTop = pos.top;
        treeCont.scrollLeft = pos.left;
    }
}

function setMainView(viewName) {
    const isMobile = window.innerWidth <= 768;
    ['tree', 'logs', 'stats', 'more'].forEach(v => { const btn = document.getElementById(`b-nav-${v}`); if (btn) btn.classList.remove('active'); });
    const activeBtn = document.getElementById(`b-nav-${viewName}`); if (activeBtn) activeBtn.classList.add('active');
    
    const treeCont = document.getElementById('tree-container'); const statsCont = document.getElementById('stats-container');
    const sidebar = document.querySelector('.sidebar'); const mobileNav = document.getElementById('mobile-tree-nav');
    const moreView = document.getElementById('mobile-more-view');
    
    const hide = (el) => { if (el) el.style.display = 'none'; };
    hide(treeCont); hide(statsCont); hide(mobileNav); if(moreView) moreView.classList.remove('active');

    if (viewName === 'tree') {
        if (treeCont) treeCont.style.display = 'flex';
        if (isMobile && mobileNav) mobileNav.style.display = 'flex';
        if (sidebar) sidebar.style.display = isMobile ? 'none' : 'flex';
        document.body.classList.remove('view-log', 'view-calc', 'view-egg', 'view-stats', 'view-war', 'view-pet', 'view-equipment');
        document.body.classList.add('view-planner');
        
        // FIX: Force a redraw of the lines immediately after the container becomes visible on mobile
        setTimeout(() => {
            if (typeof drawLines === 'function') drawLines();
        }, 50);

    } else if (['logs', 'calc', 'egg', 'stats', 'war', 'pet', 'equipment'].includes(viewName)) {
        setSidebarPanel(viewName);
        if (sidebar) sidebar.style.display = isMobile ? 'block' : 'flex';
        if (!isMobile && treeCont) treeCont.style.display = 'flex';
    } else if (viewName === 'more') {
        if (moreView) moreView.classList.add('active');
        if (sidebar && isMobile) sidebar.style.display = 'none';
        document.body.classList.add('view-more');
    }
}

function setSidebarPanel(panelName) {
    const scrollWrapper = document.querySelector('.sidebar-scroll-wrapper');
    const rightPaneWrapper = document.querySelector('.right-pane-wrapper'); // <--- NEW: Target mobile scroller

    if (scrollWrapper) scrollMemory.panels[currentPanel] = scrollWrapper.scrollTop;
    if (rightPaneWrapper) Reflect.set(scrollMemory.panels, currentPanel + "_rp", rightPaneWrapper.scrollTop);
    Reflect.set(scrollMemory.panels, currentPanel + "_win", window.scrollY || document.documentElement.scrollTop || 0);

    if (scrollWrapper) scrollWrapper.scrollTop = 0;
    if (rightPaneWrapper) rightPaneWrapper.scrollTop = 0;
    window.scrollTo(0, 0);

    const panels = ['logs', 'calc', 'egg', 'stats', 'daily', 'weekly', 'war', 'pet', 'equipment', 'help'];
    
    panels.forEach(p => {
        const el = document.getElementById('panel-' + p); if (el) el.style.display = 'none';
        const btn = document.getElementById('btn-' + p); if (btn) btn.classList.remove('active-tool');
    });
    
    const target = document.getElementById('panel-' + panelName); if (target) target.style.display = 'block';
    const activeBtn = document.getElementById('btn-' + panelName); if (activeBtn) activeBtn.classList.add('active-tool');

    const sidebarHeader = document.querySelector('.sidebar-header');
    if (sidebarHeader) sidebarHeader.style.setProperty('display', panelName === 'logs' ? '' : 'none', panelName !== 'logs' ? 'important' : '');

    // Update Floating Header Title & Icon
    const fhTitle = document.getElementById('fh-title');
    const fhIcon = document.getElementById('fh-icon');
    if (fhTitle && fhIcon) {
        const titles = {
            logs: { t: 'SCHEDULE', i: '📜' },
            stats: { t: 'STATS', i: '📊' },
            daily: { t: 'DAILY GAIN', i: '📅' },
            weekly: { t: 'WEEKLY GAIN', i: '📆' },
            calc: { t: 'FORGE CALC', i: '🔨' },
            war: { t: 'WAR CALC', i: '⚔️' },
            egg: { t: 'EGG PLANNER', i: '🥚' },
            pet: { t: 'PET & MOUNT', i: '🐾' },
            equipment: { t: 'EQUIPMENT', i: '🛡️' },
            help: { t: 'HELP', i: '❓' }
        };
        if (titles[panelName]) {
            fhTitle.innerText = titles[panelName].t;
            fhIcon.innerHTML = titles[panelName].i;
        }
    }

    // --- MOBILE FIX START ---
    if (window.innerWidth <= 768) {
        document.body.classList.remove('view-planner', 'view-log', 'view-calc', 'view-egg', 'view-stats', 'view-war', 'view-daily', 'view-weekly', 'view-more', 'view-pet', 'view-equipment', 'view-help');
        const moreMenu = document.getElementById('mobile-more-view'); 
        if (moreMenu) moreMenu.classList.remove('active');
        document.body.classList.add(panelName === 'logs' ? 'view-log' : 'view-' + panelName);
    }
    // --- MOBILE FIX END ---

    if (typeof updateRightPaneVisuals === 'function') updateRightPaneVisuals(panelName);
    
    // Trigger Renders
    if (panelName === 'logs') { const val = document.getElementById('start-date').value; if (val) safeSyncDropdowns(val, 'dm'); }
    if (panelName === 'stats' && typeof renderStats === 'function') renderStats();
    if (panelName === 'calc') { if (typeof updateCalculator === 'function') updateCalculator(); const val = document.getElementById('calc-start-date').value; if (val) safeSyncDropdowns(val, 'cm'); }
    if (panelName === 'egg') {
        if (typeof populateEggDropdowns === 'function') populateEggDropdowns();
        let val = document.getElementById('egg-date-desktop').value;
        const mainVal = document.getElementById('start-date').value;
        if (!val && mainVal && typeof syncEggDate === 'function') { syncEggDate(mainVal); val = mainVal; }
        if (val) safeSyncDropdowns(val, 'em');
        if (typeof renderEggLog === 'function') renderEggLog();
    }
    if (panelName === 'daily' && typeof updateDaily === 'function') updateDaily();
    if (panelName === 'weekly' && typeof updateWeekly === 'function') updateWeekly();
    if (panelName === 'war' && typeof updateWarCalc === 'function') updateWarCalc();
    if (panelName === 'pet') {
        if (typeof updatePetMount === 'function') updatePetMount();
        if (typeof updateMergeResult === 'function') updateMergeResult();
        if (typeof updateMountMergeResult === 'function') updateMountMergeResult();
    }
    if (panelName === 'equipment') {
        if (typeof updateEquipment === 'function') updateEquipment();
    }

   
    currentPanel = panelName;
    let savedWrapper = scrollMemory.panels[panelName] || 0;
    let savedRp = Reflect.get(scrollMemory.panels, panelName + "_rp") || 0; 
    let savedWin = Reflect.get(scrollMemory.panels, panelName + "_win") || 0;
    
    if (scrollWrapper) scrollWrapper.scrollTop = savedWrapper;
    if (rightPaneWrapper) rightPaneWrapper.scrollTop = savedRp; 
    window.scrollTo(0, savedWin);
    document.documentElement.scrollTop = savedWin;
    document.body.scrollTop = savedWin;
}

function switchMobileView(viewName) {
    const scrollWrapper = document.querySelector('.sidebar-scroll-wrapper');
    const rightPaneWrapper = document.querySelector('.right-pane-wrapper'); // <--- NEW: Target mobile scroller
    const moreMenu = document.getElementById('mobile-more-view'); 
    
    scrollMemory.mobile[currentMobile] = {
        win: window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0,
        wrapper: scrollWrapper ? scrollWrapper.scrollTop : 0,
        rp: rightPaneWrapper ? rightPaneWrapper.scrollTop : 0, // <--- Target mobile memory
        more: moreMenu ? moreMenu.scrollTop : 0
    };

    if (scrollWrapper) scrollWrapper.scrollTop = 0;
    if (rightPaneWrapper) rightPaneWrapper.scrollTop = 0;
    if (moreMenu) moreMenu.scrollTop = 0;
    window.scrollTo(0, 0);

    const viewClasses = ['view-planner', 'view-log', 'view-stats', 'view-more', 'view-calc', 'view-daily', 'view-weekly', 'view-egg', 'view-war', 'view-pet', 'view-equipment', 'view-help'];
    document.body.classList.remove(...viewClasses);

    if (moreMenu) moreMenu.classList.remove('active');
    
    document.querySelectorAll('.b-nav-item').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.b-nav-item[data-target="${viewName}"]`);
    
    if (activeBtn) {
        activeBtn.classList.add('active');
    } else {
        const homeBtn = document.querySelector('.b-nav-item[data-target="more"]');
        if (homeBtn) homeBtn.classList.add('active');
    }
    
    const sidebar = document.querySelector('.right-pane-wrapper') || document.querySelector('.sidebar');

    if (viewName === 'tree') {
        document.body.classList.add('view-planner');
        if (sidebar) sidebar.style.display = 'none'; 
        setMainView('tree');
    } else if (viewName === 'more') {
        if (moreMenu) moreMenu.classList.add('active'); 
        if (sidebar) sidebar.style.display = 'none'; 
        document.body.classList.add('view-more');
    } else {
        const bodyClass = viewName === 'logs' ? 'view-log' : 'view-' + viewName;
        document.body.classList.add(bodyClass);
        setSidebarPanel(viewName);
        if (sidebar && window.innerWidth <= 768) {
            sidebar.style.display = 'block';
        }
    }

    currentMobile = viewName;
    const pos = scrollMemory.mobile[viewName] || { win: 0, wrapper: 0, rp: 0, more: 0 };
    
    window.scrollTo(0, pos.win);
    document.documentElement.scrollTop = pos.win;
    document.body.scrollTop = pos.win;
    if (scrollWrapper) scrollWrapper.scrollTop = pos.wrapper;
    if (rightPaneWrapper) rightPaneWrapper.scrollTop = pos.rp; 
    if (moreMenu) moreMenu.scrollTop = pos.more;
}

function toggleHelp() { const el = document.getElementById('helpModal'); if(el) el.style.display = el.style.display === 'block' ? 'none' : 'block'; }

// --- DATA PERSISTENCE ---
function captureFullState() {
    const getVal = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };
    return {
        setupLevels: (typeof setupLevels !== 'undefined') ? JSON.parse(JSON.stringify(setupLevels)) : {},
        planQueue: (typeof planQueue !== 'undefined') ? JSON.parse(JSON.stringify(planQueue)) : [],
        startDate: getVal('start-date'),
        calcData: { world: getVal('calc-world'), stage: getVal('calc-stage'), forgeLv: getVal('calc-forge-lv'), hammers: getVal('calc-hammers'), target: getVal('calc-target'), calcStart: getVal('calc-start-date') },
        eggData: { queue: (typeof eggPlanQueue !== 'undefined') ? JSON.parse(JSON.stringify(eggPlanQueue)) : [], start: getVal('egg-date-desktop') },
        dailyData: { 
            thiefLvl: getVal('thief-lvl'), thiefSub: getVal('thief-sub'),
            ghostLvl: getVal('ghost-lvl'), ghostSub: getVal('ghost-sub'),
            invLvl: getVal('inv-lvl'), invSub: getVal('inv-sub'),
            zombieLvl: getVal('zombie-lvl'), zombieSub: getVal('zombie-sub'),
            warForgeLvl: getVal('war-forge-lvl')
        },
        weeklyData: { 
            league: getVal('weekly-league'), rank: getVal('weekly-rank'),
            warTier: getVal('weekly-war-tier'), warWin: getVal('weekly-war-win'),
            indiv: getVal('weekly-indiv'),
            mountLvl: getVal('weekly-mount-summon-lvl'), mountExp: getVal('weekly-mount-summon-exp')
        },
        warCalcData: {
            forgeLv: getVal('wc-forge-lv'), 
            forgeNodes: getVal('wc-forge-nodes'), 
            forgeBonus: getVal('wc-forge-bonus'),
            hammer: getVal('wc-hammer'), 
            dungeonKey: getVal('wc-dungeon-key'),
            ghostLvl: getVal('wc-ghost-lvl'), ghostSub: getVal('wc-ghost-sub'), ticket: getVal('wc-ticket'),
            techI: getVal('wc-tech-I'), techII: getVal('wc-tech-II'), techIII: getVal('wc-tech-III'), techIV: getVal('wc-tech-IV'), techV: getVal('wc-tech-V'),
            mountKey: getVal('wc-mount-key'), mountLv: getVal('wc-mount-lv'), mountExp: getVal('wc-mount-exp'),
            hatch: ['common', 'rare', 'epic', 'legendary', 'ultimate', 'mythic'].map(c => getVal(`wc-hatch-${c}`)),
            mergePet: ['common', 'rare', 'epic', 'legendary', 'ultimate', 'mythic'].map(c => getVal(`wc-merge-pet-${c}`)),
            mergeMount: ['common', 'rare', 'epic', 'legendary', 'ultimate', 'mythic'].map(c => getVal(`wc-merge-mount-${c}`))
        },
        petData: {
            p1: { rarity: getVal('pet-1-rarity'), id: getVal('pet-1-id'), lvl: getVal('pet-1-lvl'), exp: getVal('pet-1-exp') },
            p2: { rarity: getVal('pet-2-rarity'), id: getVal('pet-2-id'), lvl: getVal('pet-2-lvl'), exp: getVal('pet-2-exp') },
            p3: { rarity: getVal('pet-3-rarity'), id: getVal('pet-3-id'), lvl: getVal('pet-3-lvl'), exp: getVal('pet-3-exp') },
            mergePet: {
                tRarity: getVal('merge-target-rarity'), tId: getVal('merge-target-id'), tLvl: getVal('merge-target-lvl'), tExp: getVal('merge-target-exp'),
                fRarity: getVal('merge-fodder-rarity'), fId: getVal('merge-fodder-id'), fLvl: getVal('merge-fodder-lvl'), fExp: getVal('merge-fodder-exp'),
                bulk: ['common', 'rare', 'epic', 'legendary', 'ultimate', 'mythic'].map(c => getVal(`bulk-${c}`))
            },
            mergeMount: {
                tRarity: getVal('mount-target-rarity'), tLvl: getVal('mount-target-lvl'), tExp: getVal('mount-target-exp'),
                fRarity: getVal('mount-fodder-rarity'), fLvl: getVal('mount-fodder-lvl'), fExp: getVal('mount-fodder-exp'),
                bulk: ['common', 'rare', 'epic', 'legendary', 'ultimate', 'mythic'].map(c => getVal(`bulk-mount-${c}`))
            },
            summon: {
                key: getVal('pet-mount-key'), lvl: getVal('pet-mount-summon-lvl'), exp: getVal('pet-mount-summon-exp')
            }
        },
        equipmentData: {
            helmet: { tier: getVal('eq-helmet-tier'), lvl: getVal('eq-helmet-lvl') },
            armor: { tier: getVal('eq-armor-tier'), lvl: getVal('eq-armor-lvl') },
            boots: { tier: getVal('eq-boots-tier'), lvl: getVal('eq-boots-lvl') },
            belt: { tier: getVal('eq-belt-tier'), lvl: getVal('eq-belt-lvl') },
            weapon: { type: getVal('eq-weapon-type'), tier: getVal('eq-weapon-tier'), lvl: getVal('eq-weapon-lvl') },
            gloves: { tier: getVal('eq-gloves-tier'), lvl: getVal('eq-gloves-lvl') },
            neck: { tier: getVal('eq-neck-tier'), lvl: getVal('eq-neck-lvl') },
            ring: { tier: getVal('eq-ring-tier'), lvl: getVal('eq-ring-lvl') },
            avgTier: getVal('eq-avg-tier'),
            avgWeapon: getVal('eq-avg-weapon-type')
        },
        warConfig: (typeof warConfig !== 'undefined') ? warConfig : { day: 2, hour: 12, min: 0, ampm: 'AM' },
        activeTree: (typeof activeTreeKey !== 'undefined') ? activeTreeKey : 'forge'
    };
}

function safeSetVal(id, val) { const el = document.getElementById(id); if (el && val !== undefined && val !== null) el.value = val; }
function safeSyncDropdowns(isoDate, prefix) { if (!isoDate) return; const d = new Date(isoDate); if (isNaN(d.getTime())) return; safeSetVal(prefix + '-month', d.getMonth() + 1); safeSetVal(prefix + '-day', d.getDate()); safeSetVal(prefix + '-hour', d.getHours()); safeSetVal(prefix + '-min', d.getMinutes()); }

function loadState(d) {
    if (d.setupLevels && typeof setupLevels !== 'undefined') { Object.keys(setupLevels).forEach(k => delete setupLevels[k]); Object.assign(setupLevels, d.setupLevels); }
    if (d.planQueue && typeof planQueue !== 'undefined') { planQueue.length = 0; planQueue.push(...d.planQueue); }
    const sDate = d.startDate || d.start; if (sDate) { safeSetVal('start-date', sDate); safeSyncDropdowns(sDate, 'dm'); }
    if (d.warConfig && typeof warConfig !== 'undefined') { 
        warConfig = d.warConfig; 
        if (warConfig.min === undefined) warConfig.min = 0; 
        safeSetVal('war-day', warConfig.day); 
        safeSetVal('war-hour', warConfig.hour); 
        safeSetVal('war-min', warConfig.min); 
        safeSetVal('war-ampm', warConfig.ampm); 
    }
    
    try { if (d.calcData) { safeSetVal('calc-world', d.calcData.world); safeSetVal('calc-stage', d.calcData.stage); safeSetVal('calc-forge-lv', d.calcData.forgeLv); safeSetVal('calc-hammers', d.calcData.hammers); safeSetVal('calc-target', d.calcData.target); if (d.calcData.calcStart) { safeSetVal('calc-start-date', d.calcData.calcStart); safeSyncDropdowns(d.calcData.calcStart, 'cm'); } } } catch (e) {}
    try { if (typeof eggPlanQueue !== 'undefined' && d.eggData) { eggPlanQueue.length = 0; eggPlanQueue.push(...(d.eggData.queue || [])); if (d.eggData.start) { safeSetVal('egg-date-desktop', d.eggData.start); safeSyncDropdowns(d.eggData.start, 'em'); } } } catch (e) {}
    
    try {
        if (d.dailyData) {
            safeSetVal('thief-lvl', d.dailyData.thiefLvl); safeSetVal('thief-sub', d.dailyData.thiefSub);
            safeSetVal('ghost-lvl', d.dailyData.ghostLvl); safeSetVal('ghost-sub', d.dailyData.ghostSub);
            safeSetVal('inv-lvl', d.dailyData.invLvl); safeSetVal('inv-sub', d.dailyData.invSub);
            safeSetVal('zombie-lvl', d.dailyData.zombieLvl); safeSetVal('zombie-sub', d.dailyData.zombieSub);
            safeSetVal('war-forge-lvl', d.dailyData.warForgeLvl);
        }
    } catch (e) {}

    try {
        if (d.weeklyData) {
            safeSetVal('weekly-league', d.weeklyData.league); safeSetVal('weekly-rank', d.weeklyData.rank);
            safeSetVal('weekly-war-tier', d.weeklyData.warTier); safeSetVal('weekly-war-win', d.weeklyData.warWin);
            safeSetVal('weekly-indiv', d.weeklyData.indiv);
            safeSetVal('weekly-mount-summon-lvl', d.weeklyData.mountLvl); safeSetVal('weekly-mount-summon-exp', d.weeklyData.mountExp);
        }
    } catch (e) {}

    try {
        if (d.warCalcData) {
            safeSetVal('wc-forge-lv', d.warCalcData.forgeLv);
            safeSetVal('wc-forge-nodes', d.warCalcData.forgeNodes);
            safeSetVal('wc-forge-bonus', d.warCalcData.forgeBonus);
            safeSetVal('wc-hammer', d.warCalcData.hammer);
            safeSetVal('wc-dungeon-key', d.warCalcData.dungeonKey);
            safeSetVal('wc-ghost-lvl', d.warCalcData.ghostLvl);
            safeSetVal('wc-ghost-sub', d.warCalcData.ghostSub);
            safeSetVal('wc-ticket', d.warCalcData.ticket);
            safeSetVal('wc-tech-I', d.warCalcData.techI);
            safeSetVal('wc-tech-II', d.warCalcData.techII);
            safeSetVal('wc-tech-III', d.warCalcData.techIII);
            safeSetVal('wc-tech-IV', d.warCalcData.techIV);
            safeSetVal('wc-tech-V', d.warCalcData.techV);
            safeSetVal('wc-mount-key', d.warCalcData.mountKey);
            safeSetVal('wc-mount-lv', d.warCalcData.mountLv);
            safeSetVal('wc-mount-exp', d.warCalcData.mountExp);

            const colors = ['common', 'rare', 'epic', 'legendary', 'ultimate', 'mythic'];
            if (d.warCalcData.hatch) colors.forEach((c, i) => safeSetVal(`wc-hatch-${c}`, d.warCalcData.hatch[i]));
            if (d.warCalcData.mergePet) colors.forEach((c, i) => safeSetVal(`wc-merge-pet-${c}`, d.warCalcData.mergePet[i]));
            if (d.warCalcData.mergeMount) colors.forEach((c, i) => safeSetVal(`wc-merge-mount-${c}`, d.warCalcData.mergeMount[i]));
        }
    } catch (e) {}

    try {
        if (d.petData) {
            const loadPet = (idx, pData) => {
                if (!pData) return;
                safeSetVal(`pet-${idx}-rarity`, pData.rarity);
                if (typeof updatePetNameOptions === 'function') updatePetNameOptions(idx);
                safeSetVal(`pet-${idx}-id`, pData.id);
                safeSetVal(`pet-${idx}-lvl`, pData.lvl);
                safeSetVal(`pet-${idx}-exp`, pData.exp);
            };

            loadPet(1, d.petData.p1);
            loadPet(2, d.petData.p2);
            loadPet(3, d.petData.p3);

            if (d.petData.mergePet) {
                safeSetVal('merge-target-rarity', d.petData.mergePet.tRarity);
                if (typeof updateMergeNameOptions === 'function') updateMergeNameOptions('target');
                safeSetVal('merge-target-id', d.petData.mergePet.tId);
                safeSetVal('merge-target-lvl', d.petData.mergePet.tLvl);
                safeSetVal('merge-target-exp', d.petData.mergePet.tExp);

                safeSetVal('merge-fodder-rarity', d.petData.mergePet.fRarity);
                if (typeof updateMergeNameOptions === 'function') updateMergeNameOptions('fodder');
                safeSetVal('merge-fodder-id', d.petData.mergePet.fId);
                safeSetVal('merge-fodder-lvl', d.petData.mergePet.fLvl);
                safeSetVal('merge-fodder-exp', d.petData.mergePet.fExp);

                const colors = ['common', 'rare', 'epic', 'legendary', 'ultimate', 'mythic'];
                if (d.petData.mergePet.bulk) colors.forEach((c, i) => safeSetVal(`bulk-${c}`, d.petData.mergePet.bulk[i]));
            }

            if (d.petData.mergeMount) {
                safeSetVal('mount-target-rarity', d.petData.mergeMount.tRarity);
                safeSetVal('mount-target-lvl', d.petData.mergeMount.tLvl);
                safeSetVal('mount-target-exp', d.petData.mergeMount.tExp);

                safeSetVal('mount-fodder-rarity', d.petData.mergeMount.fRarity);
                safeSetVal('mount-fodder-lvl', d.petData.mergeMount.fLvl);
                safeSetVal('mount-fodder-exp', d.petData.mergeMount.fExp);

                const colors = ['common', 'rare', 'epic', 'legendary', 'ultimate', 'mythic'];
                if (d.petData.mergeMount.bulk) colors.forEach((c, i) => safeSetVal(`bulk-mount-${c}`, d.petData.mergeMount.bulk[i]));
            }

            if (d.petData.summon) {
                safeSetVal('pet-mount-key', d.petData.summon.key);
                safeSetVal('pet-mount-summon-lvl', d.petData.summon.lvl);
                safeSetVal('pet-mount-summon-exp', d.petData.summon.exp);
            }
        }
    } catch (e) {}

    try {
        if (d.equipmentData) {
            safeSetVal('eq-helmet-tier', d.equipmentData.helmet?.tier); safeSetVal('eq-helmet-lvl', d.equipmentData.helmet?.lvl);
            safeSetVal('eq-armor-tier', d.equipmentData.armor?.tier); safeSetVal('eq-armor-lvl', d.equipmentData.armor?.lvl);
            safeSetVal('eq-boots-tier', d.equipmentData.boots?.tier); safeSetVal('eq-boots-lvl', d.equipmentData.boots?.lvl);
            safeSetVal('eq-belt-tier', d.equipmentData.belt?.tier); safeSetVal('eq-belt-lvl', d.equipmentData.belt?.lvl);
            safeSetVal('eq-weapon-type', d.equipmentData.weapon?.type); safeSetVal('eq-weapon-tier', d.equipmentData.weapon?.tier); safeSetVal('eq-weapon-lvl', d.equipmentData.weapon?.lvl);
            safeSetVal('eq-gloves-tier', d.equipmentData.gloves?.tier); safeSetVal('eq-gloves-lvl', d.equipmentData.gloves?.lvl);
            safeSetVal('eq-neck-tier', d.equipmentData.neck?.tier); safeSetVal('eq-neck-lvl', d.equipmentData.neck?.lvl);
            safeSetVal('eq-ring-tier', d.equipmentData.ring?.tier); safeSetVal('eq-ring-lvl', d.equipmentData.ring?.lvl);
            
            // New Inputs for Average Range Calculator
            safeSetVal('eq-avg-tier', d.equipmentData.avgTier || 'Quantum'); 
            safeSetVal('eq-avg-weapon-type', d.equipmentData.avgWeapon || 'Ranged');
        }
    } catch (e) {}

    const nowIso = new Date().toISOString().slice(0, 16);
    if (!document.getElementById('start-date').value) safeSetVal('start-date', nowIso);
    if (document.getElementById('calc-start-date') && !document.getElementById('calc-start-date').value) safeSetVal('calc-start-date', nowIso);
    if (document.getElementById('egg-date-desktop') && !document.getElementById('egg-date-desktop').value) safeSetVal('egg-date-desktop', nowIso);
    
    try { const treeToLoad = d.activeTree || 'forge'; if (typeof switchTree === 'function') switchTree(treeToLoad); } catch(e) {}
    
    // Trigger Updates
    try { if (typeof updateCalculations === 'function') updateCalculations(); } catch(e) {}
    try { if (typeof updateCalculator === 'function') updateCalculator(); } catch(e) {}
    try { if (typeof renderEggLog === 'function') renderEggLog(); } catch(e) {}
    try { if (typeof updateDaily === 'function') updateDaily(); } catch(e) {} 
    try { if (typeof updateWeekly === 'function') updateWeekly(); } catch(e) {}
    try { if (typeof updateWarCalc === 'function') updateWarCalc(); } catch(e) {}
    
    try { if (typeof updatePetMount === 'function') updatePetMount(); } catch(e) {}
    try { if (typeof updateMergeResult === 'function') updateMergeResult(); } catch(e) {}
    try { if (typeof updateMountMergeResult === 'function') updateMountMergeResult(); } catch(e) {}
    try { if (typeof updateEquipment === 'function') updateEquipment(); } catch(e) {}
}

let isAppLoaded = false;

function saveToLocalStorage() {
    if (!isAppLoaded) return; 
    try { 
        const d = captureFullState(); 
        localStorage.setItem('techPlannerData', JSON.stringify(d)); 
    } catch (e) {
        console.error("Save error:", e);
    } 
}

function uploadData(el) { 
    const r = new FileReader(); 
    r.onload = (e) => { 
        try { 
            const d = JSON.parse(e.target.result); 
            loadState(d); 
            saveToLocalStorage(); 
            // Success pop-up removed. It will now load silently.
        } catch (err) { 
            alert("Error loading file. Invalid or corrupted data."); 
        } 
    }; 
    r.readAsText(el.files[0]); 
    el.value = ''; 
}
function downloadData() { const d = captureFullState(); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(d)], { type: 'application/json' })); a.download = 'Tech_Planner.json'; a.click(); }

// --- INITIALIZATION ---
function init() {
    if (typeof populateDateDropdowns === 'function') populateDateDropdowns();
    if (typeof populateForgeDropdown === 'function') populateForgeDropdown();
    if (typeof initCalcDateSelectors === 'function') initCalcDateSelectors();
    if (typeof initDailyDropdowns === 'function') initDailyDropdowns();
    if (typeof initWarCalc === 'function') initWarCalc();
    if (typeof initPetMount === 'function') initPetMount();
    
    if (typeof warConfig !== 'undefined') { 
        safeSetVal('war-day', warConfig.day); 
        safeSetVal('war-hour', warConfig.hour); 
        safeSetVal('war-min', warConfig.min !== undefined ? warConfig.min : 0);
        safeSetVal('war-ampm', warConfig.ampm); 
    }
    
    const saved = localStorage.getItem('techPlannerData');
    if (saved) {
        try { 
            loadState(JSON.parse(saved)); 
        } catch (e) {
            console.error("Failed to load save:", e);
        }
    } else { 
        const nowIso = new Date().toISOString().slice(0, 16); 
        safeSetVal('start-date', nowIso); 
        safeSetVal('calc-start-date', nowIso); 
        safeSetVal('egg-date-desktop', nowIso); 
        if (typeof updateCalculations === 'function') updateCalculations(); 
        if (typeof updateDaily === 'function') updateDaily(); 
        if (typeof updateWeekly === 'function') updateWeekly();
        if (typeof updateWarCalc === 'function') updateWarCalc();
    }
    
    if (typeof eggPlanQueue !== 'undefined' && eggPlanQueue.length > 0) {
        if(typeof renderEggLog === 'function') renderEggLog();
    }

    setSidebarPanel('logs'); 

    if (typeof switchTree === 'function') {
        const startTree = typeof activeTreeKey !== 'undefined' ? activeTreeKey : 'forge';
        switchTree(startTree);
        currentTree = startTree; // <--- ADD THIS
    }

    const isMobile = window.innerWidth <= 768;
    if (isMobile && typeof switchMobileView === 'function') {
        switchMobileView('more');
        currentMobile = 'more';  // <--- ADD THIS
    }

    if (typeof historyStack !== 'undefined') historyStack = []; 
    if (typeof redoStack !== 'undefined') redoStack = []; 
    if (typeof updateUndoRedoBtns === 'function') updateUndoRedoBtns();

    isAppLoaded = true;
}

function toggleDashboard() {
    const dashPane = document.querySelector('.dashboard-pane');
    const icon = document.getElementById('dash-toggle-icon');
    
    if (dashPane) {
        dashPane.classList.toggle('minimized');
        if (dashPane.classList.contains('minimized')) {
            icon.innerText = '▶';
        } else {
            icon.innerText = '◀';
        }
        setTimeout(() => {
            if (typeof drawLines === 'function') drawLines();
        }, 320); 
    }
}

function switchHelpTab(tab) {
    // Reset all buttons and hide all content
    ['how', 'what', 'who'].forEach(t => {
        document.getElementById(`btn-help-${t}`).classList.remove('active');
        document.getElementById(`help-content-${t}`).style.display = 'none';
    });
    
    // Activate the clicked one
    document.getElementById(`btn-help-${tab}`).classList.add('active');
    document.getElementById(`help-content-${tab}`).style.display = 'block';
}

// --- EVENT LISTENERS ---
window.onclick = function (event) {
    if (!event.target.matches('.nav-btn') && !event.target.matches('.tree-select-btn')) { document.querySelectorAll(".dropdown-content").forEach(d => { if (d.classList.contains('show')) d.classList.remove('show'); }); }
    if (event.target == document.getElementById('helpModal')) toggleHelp();
    if (event.target == document.getElementById('tableModal')) document.getElementById('tableModal').style.display = 'none';
};
window.addEventListener('resize', () => {
    if (typeof drawLines === 'function') drawLines();
    const sidebar = document.querySelector('.sidebar'); const isMobile = window.innerWidth <= 768; const mobileNav = document.getElementById('mobile-tree-nav');
    if (!isMobile && sidebar && sidebar.style.display === 'none') sidebar.style.display = 'flex';
    if (document.body.classList.contains('view-planner')) { if (mobileNav) mobileNav.style.display = isMobile ? 'flex' : 'none'; if (sidebar) sidebar.style.display = isMobile ? 'none' : 'flex'; } 
    else { if (mobileNav) mobileNav.style.display = 'none'; }
});
window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? (typeof redo === 'function' && redo()) : (typeof undo === 'function' && undo()); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); if (typeof redo === 'function') redo(); }
    if (e.key === 'PageUp' || e.key === 'PageDown') { e.preventDefault(); const container = (typeof activeTreeKey !== 'undefined' && activeTreeKey === 'stats') ? document.getElementById('stats-container') : document.getElementById('tree-container'); if (container) { const direction = e.key === 'PageUp' ? -1 : 1; container.scrollBy({ top: direction * (container.clientHeight * 0.8), behavior: 'smooth' }); } }
});

// --- AUTO-SAVE TRIGGER ---
let saveTimeout;
['change', 'input'].forEach(evt => {
    document.addEventListener(evt, function(e) {
        if (e.target.matches('input, select, textarea')) {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(saveToLocalStorage, 300);
        }
    });
});

window.addEventListener('load', init);