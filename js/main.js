/**
 * MAIN.JS
 * Entry point for the application.
 * Handles initialization, global navigation, data persistence, and event listeners.
 */

// --- GLOBAL UI NAVIGATION ---

// 1. Dropdown Toggle
function toggleDropdown(id) {
    const all = document.querySelectorAll('.dropdown-content');
    all.forEach(d => {
        if (d.id !== id) d.classList.remove('show');
    });
    const el = document.getElementById(id);
    if (el) el.classList.toggle('show');
}

// 2. Tree Selection from Dropdown (Wrapper around tech-planner logic)
function selectTree(treeKey) {
    // switchTree is defined in tech-planner.js
    if (typeof switchTree === 'function') {
        switchTree(treeKey);
    }

    // Update the button label to match selection (Desktop)
    const names = { forge: 'Forge', spt: 'SPT', power: 'Power' };
    const btn = document.getElementById('tree-select-label');
    if (btn && names[treeKey]) btn.innerHTML = `${names[treeKey]} ▼`;

    // Ensure we are in tree view
    setMainView('tree');
}

// 3. Main View Switcher (Tree vs Logs vs Stats vs More)
function setMainView(viewName) {
    const isMobile = window.innerWidth <= 768;

    // A. Reset Bottom Nav Active States (Mobile)
    ['tree', 'logs', 'stats', 'more'].forEach(v => {
        const btn = document.getElementById(`b-nav-${v}`);
        if (btn) btn.classList.remove('active');
    });

    // B. Activate the correct Bottom Nav Button
    const activeBtn = document.getElementById(`b-nav-${viewName}`);
    if (activeBtn) activeBtn.classList.add('active');

    // C. Reset Visibilities
    const treeCont = document.getElementById('tree-container');
    const statsCont = document.getElementById('stats-container');
    const sidebar = document.querySelector('.sidebar');
    const mobileNav = document.getElementById('mobile-tree-nav');
    const moreView = document.getElementById('view-more');
    const oldMoreMenu = document.getElementById('more-menu-overlay');

    const hide = (el) => { if (el) el.style.display = 'none'; };
    hide(treeCont);
    hide(statsCont);
    hide(mobileNav); // Hide by default, show later if needed
    hide(moreView);
    if (oldMoreMenu) oldMoreMenu.classList.remove('show');

    // D. View Switching Logic
    if (viewName === 'tree') {
        if (treeCont) treeCont.style.display = 'flex';
        
        // SHOW NEW NAV ONLY ON MOBILE
        if (isMobile && mobileNav) mobileNav.style.display = 'flex';

        // Desktop: Sidebar visible / Mobile: Sidebar hidden
        if (sidebar) sidebar.style.display = isMobile ? 'none' : 'flex';

        document.body.classList.remove('view-log', 'view-calc', 'view-egg', 'view-stats');
        document.body.classList.add('view-planner');

    } else if (viewName === 'logs' || viewName === 'calc' || viewName === 'egg' || viewName === 'stats') {
        setSidebarPanel(viewName);

        if (isMobile) {
            // On mobile, the sidebar BECOMES the main view
            if (sidebar) sidebar.style.display = 'block';
            document.body.classList.remove('view-planner');
        } else {
            // On desktop, ensure sidebar is visible
            if (sidebar) sidebar.style.display = 'flex';
            if (treeCont) treeCont.style.display = 'flex';
        }

    } else if (viewName === 'more') {
        // Show the new Utility Hub
        if (moreView) {
            moreView.style.display = 'flex';
            if (sidebar) sidebar.style.display = 'none';
        }
    }
}

// 4. Mobile View Helper
function setMobileView(view) {
    document.body.classList.remove('view-planner', 'view-log');
    document.body.classList.add(view === 'log' ? 'view-log' : 'view-planner');
}

// 5. Sidebar Panel Switcher
function setSidebarPanel(panelName) {
    // A. Hide all panels
    const panels = ['logs', 'calc', 'egg', 'stats', 'daily'];
    panels.forEach(p => {
        const el = document.getElementById('panel-' + p);
        if (el) el.style.display = 'none';
        
        const btn = document.getElementById('btn-' + p);
        if (btn) btn.classList.remove('active-tool');
    });

    // B. Show the selected one
    const target = document.getElementById('panel-' + panelName);
    if (target) target.style.display = 'block';

    const activeBtn = document.getElementById('btn-' + panelName);
    if (activeBtn) activeBtn.classList.add('active-tool');

    // C. Handle Header Visibility (Logs only shows header resources)
    const sidebarHeader = document.querySelector('.sidebar-header');
    if (sidebarHeader) {
        if (panelName === 'logs') {
            sidebarHeader.style.removeProperty('display');
        } else {
            sidebarHeader.style.setProperty('display', 'none', 'important');
        }
    }

    // D. Mobile View Logic
    if (window.innerWidth <= 768) {
        document.body.classList.remove('view-planner', 'view-log', 'view-calc', 'view-egg', 'view-stats');
        const viewClass = panelName === 'logs' ? 'view-log' : 'view-' + panelName;
        document.body.classList.add(viewClass);
        
        const sidebar = document.querySelector('.sidebar');
        if(sidebar) sidebar.style.display = 'block';
    } else {
        const sidebar = document.querySelector('.sidebar');
        if(sidebar) sidebar.style.display = 'flex';
    }

    // E. TRIGGER LOGIC & FORCE DATE SYNC
    if (panelName === 'logs') {
        const val = document.getElementById('start-date').value;
        if (val) safeSyncDropdowns(val, 'dm');
    }
    
    if (panelName === 'stats' && typeof renderStats === 'function') renderStats();
    
    if (panelName === 'calc') {
        if (typeof updateCalculator === 'function') updateCalculator();
        const val = document.getElementById('calc-start-date').value;
        if (val) safeSyncDropdowns(val, 'cm');
    }
    
    if (panelName === 'egg') {
        if (typeof populateEggDropdowns === 'function') populateEggDropdowns();
        let val = document.getElementById('egg-date-desktop').value;
        const mainVal = document.getElementById('start-date').value;
        if (!val && mainVal && typeof syncEggDate === 'function') {
            syncEggDate(mainVal);
            val = mainVal;
        }
        if (val) safeSyncDropdowns(val, 'em');
        if (typeof renderEggLog === 'function') renderEggLog();
    }
    if (panelName === 'daily') {
        if (typeof updateDaily === 'function') updateDaily();
    }
}

function toggleHelp() { 
    const el = document.getElementById('helpModal'); 
    if(el) el.style.display = el.style.display === 'block' ? 'none' : 'block'; 
}

// --- DATA PERSISTENCE ---

function captureFullState() {
    // Helper to safely get value or return empty string
    const getVal = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };

    return {
        setupLevels: (typeof setupLevels !== 'undefined') ? JSON.parse(JSON.stringify(setupLevels)) : {},
        planQueue: (typeof planQueue !== 'undefined') ? JSON.parse(JSON.stringify(planQueue)) : [],
        startDate: getVal('start-date'),
        calcData: {
            world: getVal('calc-world'),
            stage: getVal('calc-stage'),
            forgeLv: getVal('calc-forge-lv'),
            hammers: getVal('calc-hammers'),
            target: getVal('calc-target'),
            calcStart: getVal('calc-start-date')
        },
        eggData: {
            queue: (typeof eggPlanQueue !== 'undefined') ? JSON.parse(JSON.stringify(eggPlanQueue)) : [],
            start: getVal('egg-date-desktop')
        },
        // FIX: Save the currently active tree so Undo remembers where we were
        activeTree: (typeof activeTreeKey !== 'undefined') ? activeTreeKey : 'forge'
    };
}

function safeSetVal(id, val) {
    const el = document.getElementById(id);
    if (el && val !== undefined && val !== null) el.value = val;
}

function safeSyncDropdowns(isoDate, prefix) {
    if (!isoDate) return;
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return;
    safeSetVal(prefix + '-month', d.getMonth() + 1);
    safeSetVal(prefix + '-day', d.getDate());
    safeSetVal(prefix + '-hour', d.getHours());
    safeSetVal(prefix + '-min', d.getMinutes());
}

function loadState(d) {
    console.log("Starting Load...");

    if (d.setupLevels && typeof setupLevels !== 'undefined') {
        Object.keys(setupLevels).forEach(k => delete setupLevels[k]);
        Object.assign(setupLevels, d.setupLevels);
    }
    if (d.planQueue && typeof planQueue !== 'undefined') {
        planQueue.length = 0;
        planQueue.push(...d.planQueue);
    }

    const sDate = d.startDate || d.start;
    if (sDate) {
        safeSetVal('start-date', sDate);
        safeSyncDropdowns(sDate, 'dm');
    }

    try {
        if (d.calcData) {
            safeSetVal('calc-world', d.calcData.world);
            safeSetVal('calc-stage', d.calcData.stage);
            safeSetVal('calc-forge-lv', d.calcData.forgeLv);
            safeSetVal('calc-hammers', d.calcData.hammers);
            safeSetVal('calc-target', d.calcData.target);
            if (d.calcData.calcStart) {
                safeSetVal('calc-start-date', d.calcData.calcStart);
                safeSyncDropdowns(d.calcData.calcStart, 'cm');
            }
        }
    } catch (e) { console.warn("Calc Load Warning:", e); }

    try {
        if (typeof eggPlanQueue !== 'undefined' && d.eggData) {
            eggPlanQueue.length = 0;
            eggPlanQueue.push(...(d.eggData.queue || []));
            if (d.eggData.start) {
                safeSetVal('egg-date-desktop', d.eggData.start);
                safeSyncDropdowns(d.eggData.start, 'em');
            }
        }
    } catch (e) { console.warn("Egg Load Warning:", e); }

    const nowIso = new Date().toISOString().slice(0, 16);
    if (!document.getElementById('start-date').value) safeSetVal('start-date', nowIso);
    if (document.getElementById('calc-start-date') && !document.getElementById('calc-start-date').value) safeSetVal('calc-start-date', nowIso);
    if (document.getElementById('egg-date-desktop') && !document.getElementById('egg-date-desktop').value) safeSetVal('egg-date-desktop', nowIso);

// Wrap external tool updates in try-catch to prevent crash if tools.js is lagging
    // FIX: Restore the correct tree View (Canvas + Tabs) instead of defaulting to Forge
    try { 
        // Use saved tree from history OR current active tree
        const treeToLoad = d.activeTree || (typeof activeTreeKey !== 'undefined' ? activeTreeKey : 'forge');
        
        // Use selectTree (which updates Tabs AND Canvas) instead of just renderTree
        if (typeof selectTree === 'function') selectTree(treeToLoad); 
        else if (typeof renderTree === 'function') renderTree(treeToLoad);
    } catch(e) { console.warn(e); }

    try { if (typeof updateCalculations === 'function') updateCalculations(); } catch(e) { console.warn(e); }
    try { if (typeof updateCalculator === 'function') updateCalculator(); } catch(e) { console.warn(e); }
    try { if (typeof renderEggLog === 'function') renderEggLog(); } catch(e) { console.warn(e); }

    console.log("Load Complete.");
}

function saveToLocalStorage() {
    try {
        const d = captureFullState();
        localStorage.setItem('techPlannerData', JSON.stringify(d));
    } catch (e) {
        console.warn("Auto-save failed:", e);
    }
}

function uploadData(el) {
    const r = new FileReader();
    r.onload = (e) => {
        try {
            const d = JSON.parse(e.target.result);
            loadState(d);
            saveToLocalStorage();
            alert("Data loaded successfully!");
        } catch (err) {
            console.error("Upload Error:", err);
            alert("Error loading file. Check console (F12) for details.");
        }
    };
    r.readAsText(el.files[0]);
    el.value = '';
}

function downloadData() {
    const d = captureFullState();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(d)], { type: 'application/json' }));
    a.download = 'Tech_Planner.json';
    a.click();
}

// --- INITIALIZATION ---

function init() {
    if (typeof populateDateDropdowns === 'function') populateDateDropdowns();
    if (typeof populateForgeDropdown === 'function') populateForgeDropdown();

    const saved = localStorage.getItem('techPlannerData');
    if (saved) {
        try { loadState(JSON.parse(saved)); } catch (e) { console.error("Auto-load fail", e); }
    } else {
        const nowIso = new Date().toISOString().slice(0, 16);
        safeSetVal('start-date', nowIso);
        safeSetVal('calc-start-date', nowIso);
        safeSetVal('egg-date-desktop', nowIso);
        if (typeof updateCalculations === 'function') updateCalculations();
    }

    // Default View
    setSidebarPanel('logs');
    if (typeof eggPlanQueue !== 'undefined' && eggPlanQueue.length > 0) {
        if(typeof renderEggLog === 'function') renderEggLog();
    }

    // Initial Render
    selectTree('forge');
    
    // Clear history generated by the initialization process
    // This ensures buttons start as Disabled
    if (typeof historyStack !== 'undefined') historyStack = [];
    if (typeof redoStack !== 'undefined') redoStack = [];
    if (typeof updateUndoRedoBtns === 'function') updateUndoRedoBtns();
}

// --- EVENT LISTENERS ---

window.onclick = function (event) {
    if (!event.target.matches('.nav-btn') && !event.target.matches('.tree-select-btn')) {
        const dropdowns = document.querySelectorAll(".dropdown-content");
        dropdowns.forEach(openDropdown => {
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        });
    }
    if (event.target == document.getElementById('helpModal')) toggleHelp();
    if (event.target == document.getElementById('tableModal')) document.getElementById('tableModal').style.display = 'none';
};

window.addEventListener('resize', () => {
    if (typeof drawLines === 'function') drawLines();
    
    // UI Update on Resize
    const sidebar = document.querySelector('.sidebar');
    const isMobile = window.innerWidth <= 768;
    const mobileNav = document.getElementById('mobile-tree-nav');

    // Toggle Sidebar based on width
    if (!isMobile && sidebar && sidebar.style.display === 'none') {
        sidebar.style.display = 'flex';
    }

    // Toggle Mobile Nav if we are currently in Planner mode
    if (document.body.classList.contains('view-planner')) {
        if (mobileNav) mobileNav.style.display = isMobile ? 'flex' : 'none';
        if (sidebar) sidebar.style.display = isMobile ? 'none' : 'flex';
    } else {
        // In other modes (logs/calc), mobile nav is always hidden
        if (mobileNav) mobileNav.style.display = 'none';
    }
});

window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        e.shiftKey ? (typeof redo === 'function' && redo()) : (typeof undo === 'function' && undo());
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        if (typeof redo === 'function') redo();
    }
    if (e.key === 'PageUp' || e.key === 'PageDown') {
        e.preventDefault();
        const container = (typeof activeTreeKey !== 'undefined' && activeTreeKey === 'stats') 
            ? document.getElementById('stats-container') 
            : document.getElementById('tree-container');
        if (container) {
            const direction = e.key === 'PageUp' ? -1 : 1;
            container.scrollBy({ top: direction * (container.clientHeight * 0.8), behavior: 'smooth' });
        }
    }
});

document.addEventListener('DOMContentLoaded', init);