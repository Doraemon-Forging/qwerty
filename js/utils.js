/**
 * UTILS.JS
 * Formatting, UI Helpers, Date Sync, and Modal Table Builder.
 */

// --- FORMATTING HELPERS ---

function toRoman(num) {
    const roman = {M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1};
    let str = '';
    for (let i of Object.keys(roman)) {
        let q = Math.floor(num / roman[i]);
        num -= q * roman[i];
        str += i.repeat(q);
    }
    return str;
}

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
    if (val < 1000) return val.toLocaleString('en-US', {maximumFractionDigits: 1});
    if (val < 1000000) return (val / 1000).toFixed(1) + 'k';
    return (val / 1000000).toFixed(2) + 'm';
}

function formatForgeCost(val) {
    if(val < 1000) return val.toLocaleString('en-US');
    if(val < 10000) return (val/1000).toFixed(2) + 'k';
    if(val < 1000000) return (val/1000).toFixed(1) + 'k';
    return (val/1000000).toFixed(2) + 'm';
}

// --- INPUT HELPERS ---

function cleanInput(el) {
    el.value = el.value.replace(/[^0-9.]/g, '');
    if ((el.value.match(/\./g) || []).length > 1) el.value = el.value.replace(/\.+$/, "");
}

function formatInput(el) {
    if(!el.value) return;
    const raw = el.value.replace(/,/g, '');
    const val = parseFloat(raw);
    if(!isNaN(val)) el.value = val.toLocaleString('en-US');
}

function unformatInput(el) {
    if(!el.value) return;
    el.value = el.value.replace(/,/g, '');
}

// --- UI HELPERS ---

function toggleDropdown(id) {
    const all = document.querySelectorAll('.dropdown-content');
    all.forEach(d => { if(d.id !== id) d.classList.remove('show'); });
    const el = document.getElementById(id);
    if(el) el.classList.toggle('show');
}

function populateDateDropdowns() {
    const prefixes = ['dm', 'cm', 'em'];
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    prefixes.forEach(prefix => {
        const m = document.getElementById(`${prefix}-month`);
        const d = document.getElementById(`${prefix}-day`);
        const h = document.getElementById(`${prefix}-hour`);
        const min = document.getElementById(`${prefix}-min`);
        if (!m || !d || !h || !min) return;
        m.innerHTML = ''; d.innerHTML = ''; h.innerHTML = ''; min.innerHTML = '';
        months.forEach((n,i)=> m.add(new Option(n, i+1)));
        for(let i=1;i<=31;i++) d.add(new Option(i,i));
        for(let i=0;i<24;i++) h.add(new Option(i.toString().padStart(2,'0'), i));
        for(let i=0;i<60;i++) min.add(new Option(i.toString().padStart(2,'0'), i));
    });
}

// --- DATE SYNCHRONIZATION HELPERS ---

function updateFromDropdowns(source) {
    let prefix = 'dm'; 
    if (source === 'calc') prefix = 'cm';
    if (source === 'egg') prefix = 'em';

    const now = new Date();
    const y = now.getFullYear(); 
    
    const mEl = document.getElementById(`${prefix}-month`);
    const dEl = document.getElementById(`${prefix}-day`);
    const hEl = document.getElementById(`${prefix}-hour`);
    const minEl = document.getElementById(`${prefix}-min`);

    if(!mEl || !dEl || !hEl || !minEl) return;

    const m = parseInt(mEl.value) - 1;
    const d = parseInt(dEl.value);
    const h = parseInt(hEl.value);
    const min = parseInt(minEl.value);

    const newDate = new Date(y, m, d, h, min);
    if (newDate < now && (now - newDate) > 2592000000) newDate.setFullYear(y+1);
    
    newDate.setMinutes(newDate.getMinutes() - newDate.getTimezoneOffset());
    const iso = newDate.toISOString().slice(0,16);

    if(source === 'calc') syncCalcDate(iso); 
    else if(source === 'egg') syncEggDate(iso);
    else syncMainDate(iso);
}

function syncMainDate(val, shouldSave = true) {
    if (!val) return;
    const date = new Date(val);
    if (isNaN(date.getTime())) return;
    const el = document.getElementById('start-date');
    if (el) el.value = val;
    const setVal = (id, v) => { const e = document.getElementById(id); if(e) e.value = v; };
    setVal('dm-month', date.getMonth() + 1);
    setVal('dm-day', date.getDate());
    setVal('dm-hour', date.getHours());
    setVal('dm-min', date.getMinutes());
    
    if (typeof updateCalculations === 'function') updateCalculations();
    if (shouldSave && typeof saveToLocalStorage === 'function') saveToLocalStorage();
}

function syncCalcDate(val, shouldSave = true) {
    if (!val) return;
    const date = new Date(val);
    if (isNaN(date.getTime())) return;
    const el = document.getElementById('calc-start-date');
    if (el) el.value = val;
    const setVal = (id, v) => { const e = document.getElementById(id); if(e) e.value = v; };
    setVal('cm-month', date.getMonth() + 1);
    setVal('cm-day', date.getDate());
    setVal('cm-hour', date.getHours());
    setVal('cm-min', date.getMinutes());
    
    if (typeof updateCalculator === 'function') updateCalculator();
    if (shouldSave && typeof saveToLocalStorage === 'function') saveToLocalStorage();
}

function syncEggDate(val, shouldSave = true) {
    if (!val) return; 
    const date = new Date(val);
    if (isNaN(date.getTime())) return; 
    const el = document.getElementById('egg-date-desktop');
    if (el) el.value = val;
    const setVal = (id, v) => { const e = document.getElementById(id); if(e) e.value = v; };
    setVal('em-month', date.getMonth() + 1);
    setVal('em-day', date.getDate());
    setVal('em-hour', date.getHours());
    setVal('em-min', date.getMinutes());
    
    if (typeof renderEggLog === 'function') renderEggLog();
    if (shouldSave && typeof saveToLocalStorage === 'function') saveToLocalStorage();
}

// --- TABLE MODAL BUILDER ---
function showTable(title, iconSrc, statData, headers, rows, pageSize = 30, customTabLabels = null) {
    const modal = document.getElementById('tableModal');
    const content = modal.querySelector('.modal-content');

    const tLower = title.toLowerCase();
    let valueIconHTML = '';
    if (tLower.includes('tech') && tLower.includes('cost')) valueIconHTML = `<img src="icons/red_potion.png" class="icon-gold-inline">`;
    else if (tLower.includes('price') || tLower.includes('sell') || tLower.includes('cost')) valueIconHTML = `<img src="icons/fm_gold.png" class="icon-gold-inline">`;
    
    let statHTML = '';
    if (statData && typeof statData === 'object' && statData.label) {
        if (statData.before === statData.after) {
            statHTML = `<div class="modal-sub-row"><span class="stat-val-old">${statData.label}: ${statData.before}</span></div>`;
        } else {
            statHTML = `<div class="modal-sub-row"><span class="stat-val-old">${statData.label} ${statData.before}</span><span class="stat-arrow">➜</span><span class="stat-val-new">${statData.after}</span></div>`;
        }
    }

    const thHTML = headers.map(h => `<th>${h}</th>`).join('');
    content.innerHTML = `
        <div class="modal-header-fixed"><h2 class="modal-title-text">${title}</h2>${statHTML}<div id="modal-tabs-container" class="segmented-control" style="display:none;"></div></div>
        <div id="modal-scroll-area" class="modal-body-scroll"><table class="clean-table"><thead><tr>${thHTML}</tr></thead><tbody id="modal-tbody"></tbody></table></div>
        <div class="modal-footer"><div class="modal-disclaimer">Values may differ slightly from the game</div><button class="btn-close-floating" onclick="document.getElementById('tableModal').style.display='none'"><span>&times;</span></button></div>
    `;

    const tbody = document.getElementById('modal-tbody');
    const tabContainer = document.getElementById('modal-tabs-container');
    const scrollContainer = document.getElementById('modal-scroll-area'); 
    const scrollPositions = {}; 
    let activePageIndex = 0; 
    
    const renderChunk = (start, end) => {
        tbody.innerHTML = ''; 
        for (let i = start; i < end; i++) {
            if (!rows[i]) break;
            const rowData = rows[i];
            const tr = document.createElement('tr');
            const cells = Array.isArray(rowData) ? rowData : Object.values(rowData);
            cells.forEach((cellContent, index) => {
                const td = document.createElement('td');
                const isString = typeof cellContent === 'string';
                const hasArrow = isString && (cellContent.includes('➜') || cellContent.includes('→'));
                if (index > 0) {
                    if (hasArrow) {
                        const separator = cellContent.includes('➜') ? '➜' : '→';
                        const parts = cellContent.split(separator).map(s => s.trim());
                        const cleanBefore = parts[0].replace(/[^0-9.]/g, '');
                        const cleanAfter = (parts[1] || parts[0]).replace(/[^0-9.]/g, '');
                        const rightClass = cleanBefore !== cleanAfter ? 'val-green' : 'val-white';
                        td.innerHTML = `<div class="spine-grid"><div class="spine-left">${valueIconHTML}${parts[0]} </div><div class="spine-center"><span class="stat-arrow-table">➜</span></div><div class="spine-right">${valueIconHTML}<span class="${rightClass}">${parts[1]||parts[0]}</span> </div></div>`;
                    } else {
                        td.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; gap:4px; color:#fff;">${valueIconHTML}${cellContent} </div>`;
                    }
                } else {
                    td.innerHTML = cellContent;
                }
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        }
    };

    if (rows.length > pageSize) {
        tabContainer.style.display = 'flex';
        const pageCount = Math.ceil(rows.length / pageSize);
        for (let i = 0; i < pageCount; i++) {
            const btn = document.createElement('button');
            const start = i * pageSize;
            const end = Math.min((i + 1) * pageSize, rows.length);
            btn.innerText = (customTabLabels && customTabLabels[i]) ? customTabLabels[i] : `${start + 1}-${end}`;
            btn.className = 'seg-btn'; 
            btn.onclick = () => {
                scrollPositions[activePageIndex] = scrollContainer.scrollTop;
                Array.from(tabContainer.children).forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderChunk(start, end);
                activePageIndex = i;
                setTimeout(() => { scrollContainer.scrollTop = scrollPositions[i] || 0; }, 0);
            };
            tabContainer.appendChild(btn);
            if (i === 0) { btn.classList.add('active'); renderChunk(start, end); }
        }
    } else {
        tabContainer.style.display = 'none';
        renderChunk(0, rows.length);
    }
    modal.style.display = 'block';
}

// ==========================================
// LAYOUT & HEADER VISUALS
// ==========================================

function updateRightPaneVisuals(panelId) {
    const iconEl = document.getElementById('fh-icon');
    const titleEl = document.getElementById('fh-title');

    // Helper to generate image tag
    const img = (src) => `<img src="icons/${src}" style="width: 100%; height: 100%; object-fit: contain;">`;

    let iconHtml = "📜"; // Default Emoji
    let titleText = "SCHEDULE";

    // Define Icons and Titles for each tool
    if (panelId === 'logs') { 
        iconHtml = img("icon_timeline.png"); 
        titleText = "SCHEDULE"; 
    }
    else if (panelId === 'stats') { 
        iconHtml = img("icon_stats.png"); 
        titleText = "STATS"; 
    }
    else if (panelId === 'calc') { 
        iconHtml = img("anvil.png"); 
        titleText = "FORGE CALC"; 
    }
    else if (panelId === 'daily') { 
        iconHtml = img("icon_daily.png"); 
        titleText = "DAILY GAIN"; 
    }
    else if (panelId === 'weekly') { 
        iconHtml = img("icon_weekly.png"); 
        titleText = "WEEKLY GAIN"; 
    }
    else if (panelId === 'egg') { 
        iconHtml = img("icon_eggplan.png"); 
        titleText = "EGG PLANNER"; 
    }
    else if (panelId === 'war') { 
        iconHtml = img("warcalc.png"); 
        titleText = "WAR CALC"; 
    }
    else if (panelId === 'pet') { 
        iconHtml = img("petmount.png"); 
        titleText = "PET & MOUNT"; 
    }
    else if (panelId === 'equipment') { 
        iconHtml = img("equipment.png"); 
        titleText = "EQUIPMENT"; 
    }
    else if (panelId === 'help') { 
        iconHtml = img("icon_help.png"); 
        titleText = "HELP"; 
    }

    // Apply changes
    if(iconEl) iconEl.innerHTML = iconHtml;
    if(titleEl) titleEl.innerText = titleText;

    // Handle "Capsule" Visibility (Bottom Buttons)
    const logCap = document.getElementById('capsule-logs');
    const eggCap = document.getElementById('capsule-egg');

    if(logCap) {
        // Only show Log Controls (Undo/Redo/Reset) on the Logs tab
        logCap.style.setProperty('display', panelId === 'logs' ? 'flex' : 'none', 'important');
    }

    if(eggCap) {
        // Only show Egg Controls on the Egg tab
        eggCap.style.setProperty('display', panelId === 'egg' ? 'flex' : 'none', 'important');
    }
}

// --- PET / MOUNT TOGGLE BUTTON LOGIC ---
function togglePetMountTab(tab) {
    // 1. Remove active class from both buttons
    const btnPet = document.getElementById('btn-toggle-pet');
    const btnMount = document.getElementById('btn-toggle-mount');
    
    if (btnPet) btnPet.classList.remove('active');
    if (btnMount) btnMount.classList.remove('active');
    
    // 2. Add active class to the clicked button
    const activeBtn = document.getElementById(`btn-toggle-${tab}`);
    if (activeBtn) activeBtn.classList.add('active');

    // 3. Show/Hide the correct content container
    const petContent = document.getElementById('view-pet-content');
    const mountContent = document.getElementById('view-mount-content');
    
    if (tab === 'pet') {
        if (petContent) petContent.style.display = 'block';
        if (mountContent) mountContent.style.display = 'none';
    } else {
        if (petContent) petContent.style.display = 'none';
        if (mountContent) mountContent.style.display = 'block';
    }
}