/**
 * MAIN.JS
 * Entry point. Handles initialization, global navigation, and data persistence.
 */

// --- GLOBAL UI NAVIGATION ---
function selectTree(treeKey) {
    if (typeof switchTree === 'function') switchTree(treeKey);
    const names = { forge: 'Forge', spt: 'SPT', power: 'Power' };
    const btn = document.getElementById('tree-select-label');
    if (btn && names[treeKey]) btn.innerHTML = `${names[treeKey]} ▼`;
    setMainView('tree');
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
        document.body.classList.remove('view-log', 'view-calc', 'view-egg', 'view-stats');
        document.body.classList.add('view-planner');
        
        // FIX: Force a redraw of the lines immediately after the container becomes visible on mobile
        setTimeout(() => {
            if (typeof drawLines === 'function') drawLines();
        }, 50);

    } else if (viewName === 'logs' || viewName === 'calc' || viewName === 'egg' || viewName === 'stats') {
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
    const panels = ['logs', 'calc', 'egg', 'stats', 'daily'];
    panels.forEach(p => {
        const el = document.getElementById('panel-' + p); if (el) el.style.display = 'none';
        const btn = document.getElementById('btn-' + p); if (btn) btn.classList.remove('active-tool');
    });
    const target = document.getElementById('panel-' + panelName); if (target) target.style.display = 'block';
    const activeBtn = document.getElementById('btn-' + panelName); if (activeBtn) activeBtn.classList.add('active-tool');

    const sidebarHeader = document.querySelector('.sidebar-header');
    if (sidebarHeader) sidebarHeader.style.setProperty('display', panelName === 'logs' ? '' : 'none', panelName !== 'logs' ? 'important' : '');

    if (window.innerWidth <= 768) {
        document.body.classList.remove('view-planner', 'view-log', 'view-calc', 'view-egg', 'view-stats');
        document.body.classList.add(panelName === 'logs' ? 'view-log' : 'view-' + panelName);
    }

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
}

function switchMobileView(viewName) {
    document.body.classList.remove('view-planner', 'view-log', 'view-stats', 'view-more', 'view-calc', 'view-daily', 'view-egg');
    const moreMenu = document.getElementById('mobile-more-view'); if(moreMenu) moreMenu.classList.remove('active');
    document.querySelectorAll('.b-nav-item').forEach(btn => btn.classList.remove('active'));
    
    const activeBtn = document.querySelector(`.b-nav-item[data-target="${viewName}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    else if (['calc', 'daily', 'egg'].includes(viewName)) document.querySelector('.b-nav-item[data-target="more"]').classList.add('active');

    if (viewName === 'tree') {
        document.body.classList.add('view-planner');
        setMainView('tree');
    } else if (viewName === 'more') {
        if(moreMenu) moreMenu.classList.add('active'); document.body.classList.add('view-more');
    } else {
        setSidebarPanel(viewName);
    }
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
        warConfig: (typeof warConfig !== 'undefined') ? warConfig : { day: 2, hour: 12, ampm: 'AM' },
        activeTree: (typeof activeTreeKey !== 'undefined') ? activeTreeKey : 'forge'
    };
}
function safeSetVal(id, val) { const el = document.getElementById(id); if (el && val !== undefined && val !== null) el.value = val; }
function safeSyncDropdowns(isoDate, prefix) { if (!isoDate) return; const d = new Date(isoDate); if (isNaN(d.getTime())) return; safeSetVal(prefix + '-month', d.getMonth() + 1); safeSetVal(prefix + '-day', d.getDate()); safeSetVal(prefix + '-hour', d.getHours()); safeSetVal(prefix + '-min', d.getMinutes()); }
function loadState(d) {
    if (d.setupLevels && typeof setupLevels !== 'undefined') { Object.keys(setupLevels).forEach(k => delete setupLevels[k]); Object.assign(setupLevels, d.setupLevels); }
    if (d.planQueue && typeof planQueue !== 'undefined') { planQueue.length = 0; planQueue.push(...d.planQueue); }
    const sDate = d.startDate || d.start; if (sDate) { safeSetVal('start-date', sDate); safeSyncDropdowns(sDate, 'dm'); }
    if (d.warConfig && typeof warConfig !== 'undefined') { warConfig = d.warConfig; safeSetVal('war-day', warConfig.day); safeSetVal('war-hour', warConfig.hour); safeSetVal('war-ampm', warConfig.ampm); }
    try { if (d.calcData) { safeSetVal('calc-world', d.calcData.world); safeSetVal('calc-stage', d.calcData.stage); safeSetVal('calc-forge-lv', d.calcData.forgeLv); safeSetVal('calc-hammers', d.calcData.hammers); safeSetVal('calc-target', d.calcData.target); if (d.calcData.calcStart) { safeSetVal('calc-start-date', d.calcData.calcStart); safeSyncDropdowns(d.calcData.calcStart, 'cm'); } } } catch (e) {}
    try { if (typeof eggPlanQueue !== 'undefined' && d.eggData) { eggPlanQueue.length = 0; eggPlanQueue.push(...(d.eggData.queue || [])); if (d.eggData.start) { safeSetVal('egg-date-desktop', d.eggData.start); safeSyncDropdowns(d.eggData.start, 'em'); } } } catch (e) {}
    const nowIso = new Date().toISOString().slice(0, 16);
    if (!document.getElementById('start-date').value) safeSetVal('start-date', nowIso);
    if (document.getElementById('calc-start-date') && !document.getElementById('calc-start-date').value) safeSetVal('calc-start-date', nowIso);
    if (document.getElementById('egg-date-desktop') && !document.getElementById('egg-date-desktop').value) safeSetVal('egg-date-desktop', nowIso);
    
    // FIX: Use switchTree instead of selectTree so it builds the data silently 
    // without forcing the UI to jump to the Tree tab.
    try { const treeToLoad = d.activeTree || 'forge'; if (typeof switchTree === 'function') switchTree(treeToLoad); } catch(e) {}
    
    try { if (typeof updateCalculations === 'function') updateCalculations(); } catch(e) {}
    try { if (typeof updateCalculator === 'function') updateCalculator(); } catch(e) {}
    try { if (typeof renderEggLog === 'function') renderEggLog(); } catch(e) {}
}
function saveToLocalStorage() { try { const d = captureFullState(); localStorage.setItem('techPlannerData', JSON.stringify(d)); } catch (e) {} }
function uploadData(el) { const r = new FileReader(); r.onload = (e) => { try { const d = JSON.parse(e.target.result); loadState(d); saveToLocalStorage(); alert("Data loaded successfully!"); } catch (err) { alert("Error loading file."); } }; r.readAsText(el.files[0]); el.value = ''; }
function downloadData() { const d = captureFullState(); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(d)], { type: 'application/json' })); a.download = 'Tech_Planner.json'; a.click(); }

// --- INITIALIZATION ---
function init() {
    if (typeof populateDateDropdowns === 'function') populateDateDropdowns();
    if (typeof populateForgeDropdown === 'function') populateForgeDropdown();
    if (typeof initCalcDateSelectors === 'function') initCalcDateSelectors();
    if (typeof warConfig !== 'undefined') { safeSetVal('war-day', warConfig.day); safeSetVal('war-hour', warConfig.hour); safeSetVal('war-ampm', warConfig.ampm); }
    
    const saved = localStorage.getItem('techPlannerData');
    if (saved) try { loadState(JSON.parse(saved)); } catch (e) {}
    else { 
        const nowIso = new Date().toISOString().slice(0, 16); 
        safeSetVal('start-date', nowIso); 
        safeSetVal('calc-start-date', nowIso); 
        safeSetVal('egg-date-desktop', nowIso); 
        if (typeof updateCalculations === 'function') updateCalculations(); 
    }
    
    if (typeof eggPlanQueue !== 'undefined' && eggPlanQueue.length > 0) {
        if(typeof renderEggLog === 'function') renderEggLog();
    }

    setSidebarPanel('logs'); 

    // 1. Build the tree silently in the background
    if (typeof switchTree === 'function') {
        switchTree(typeof activeTreeKey !== 'undefined' ? activeTreeKey : 'forge');
    }

    // 2. THE WORKAROUND: Force mobile to stay on the "MORE" tab on initial load
    const isMobile = window.innerWidth <= 768;
    if (isMobile && typeof switchMobileView === 'function') {
        switchMobileView('more');
    }

    if (typeof historyStack !== 'undefined') historyStack = []; 
    if (typeof redoStack !== 'undefined') redoStack = []; 
    if (typeof updateUndoRedoBtns === 'function') updateUndoRedoBtns();
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
window.addEventListener('load', init);