/**
 * UTILS.JS
 * Generic helper functions for Formatting, UI, and Date handling.
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

function formatThiefGold(val) {
    if (val < 1000) return Math.floor(val).toLocaleString('en-US');
    if (val < 1000000) return (Math.floor(val / 100) / 10).toFixed(1) + 'k';
    return (Math.floor(val / 10000) / 100).toFixed(2) + 'm';
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
    all.forEach(d => {
        if(d.id !== id) d.classList.remove('show');
    });
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

// --- TABLE MODAL BUILDER (NEW) ---
function showTable(title, iconSrc, statData, headers, rows) {
    const modal = document.getElementById('tableModal');
    const content = modal.querySelector('.modal-content');
    
    // 1. Build Layout (Matches css/modal.css)
    content.innerHTML = `
        <button class="close-btn-corner" onclick="document.getElementById('tableModal').style.display='none'">&times;</button>
        <div class="modal-header-fixed">
            <div class="modal-title-row">
                <img src="${iconSrc || 'icons/app-icon.png'}" class="modal-node-icon" onerror="this.style.display='none'">
                <h2 class="modal-title-text">${title}</h2>
            </div>
            <div class="modal-sub-row" id="modal-stat-display"></div>
            <div class="modal-tabs-row" id="modal-tabs" style="display:none"></div>
        </div>
        <div class="modal-body-scroll">
            <table class="clean-table">
                <thead><tr id="modal-thead"></tr></thead>
                <tbody id="modal-tbody"></tbody>
            </table>
        </div>
        <div class="modal-footer-fixed">
            Values may differ slightly from the game but should be nearly identical.
        </div>
    `;

    // 2. Inject Stat Data (WITH CONDITIONAL LOGIC)
    const statBox = document.getElementById('modal-stat-display');
    if (statData && typeof statData === 'object') {
        if (statData.before === statData.after) {
            // NO CHANGE: Show single value, no arrow
            statBox.innerHTML = `
                ${statData.label}: 
                <span class="stat-val-white">${statData.before}</span>
            `;
        } else {
            // CHANGE: Show Arrow and Green Value
            statBox.innerHTML = `
                ${statData.label}: 
                <span class="stat-val-white">${statData.before}</span> 
                <span class="stat-arrow">➜</span> 
                <span class="stat-val-green">${statData.after}</span>
            `;
        }
    } else if (statData) {
        statBox.innerHTML = statData;
    }

    // 3. Headers
    const thead = document.getElementById('modal-thead');
    headers.forEach(h => {
        const th = document.createElement('th');
        th.innerHTML = h;
        thead.appendChild(th);
    });

    // 4. Render Rows (Pagination logic)
    const tbody = document.getElementById('modal-tbody');
    const tabBox = document.getElementById('modal-tabs');
    const CHUNK = 30;

    const renderRows = (start, end) => {
        tbody.innerHTML = '';
        for (let i = start; i < end; i++) {
            if (!rows[i]) break;
            const tr = document.createElement('tr');
            const cells = Array.isArray(rows[i]) ? rows[i] : Object.values(rows[i]);
            cells.forEach(c => {
                const td = document.createElement('td');
                td.innerHTML = c;
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        }
    };

    if (rows.length > 50) {
        tabBox.style.display = 'flex';
        const pages = Math.ceil(rows.length / CHUNK);
        for (let i = 0; i < pages; i++) {
            const btn = document.createElement('button');
            const start = i * CHUNK;
            const end = Math.min((i + 1) * CHUNK, rows.length);
            btn.textContent = `${start + 1}-${end}`;
            btn.className = 'tab-pill';
            btn.onclick = function() {
                document.querySelectorAll('.tab-pill').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                renderRows(start, end);
            };
            tabBox.appendChild(btn);
            if (i === 0) btn.click();
        }
    } else {
        renderRows(0, rows.length);
    }

    modal.style.display = 'block';
}