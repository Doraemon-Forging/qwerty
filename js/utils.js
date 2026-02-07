/**
 * UTILS.JS
 * Generic helper functions for Formatting, UI, and Date handling.
 * Logic-agnostic helpers used across the application.
 */

// --- FORMATTING HELPERS ---

// Convert number to Roman Numeral (1 -> I, 4 -> IV, etc.)
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

// Smart Time Formatting (e.g., "5m 30s", "2h 15m", "3d 4h")
function formatSmartTime(totalMins) {
    // Precision logic for less than 60 minutes
    if (totalMins < 60) {
        const mFloor = Math.floor(totalMins);
        const s = Math.round((totalMins - mFloor) * 60);
        
        if (s === 60) return `${mFloor + 1}m`; // Roll over if 59s -> 60s
        if (mFloor === 0 && s > 0) return `${s}s`;
        if (mFloor === 0 && s === 0) return `0m`;
        return s > 0 ? `${mFloor}m ${s}s` : `${mFloor}m`;
    }
    
    const m = Math.round(totalMins);
    if (m < 60) return `${m}m`; // Safety catch
    let h = Math.floor(m / 60), minLeft = m % 60;
    if (h < 24) return minLeft > 0 ? `${h}h ${minLeft}m` : `${h}h`;
    const d = Math.floor(h / 24), hLeft = h % 24;
    let res = `${d}d`; if (hLeft > 0) res += ` ${hLeft}h`; if (minLeft > 0) res += ` ${minLeft}m`;
    return res;
}

// Format Numbers with K/M suffixes (e.g., 1.5k, 2.30m)
function formatResourceValue(val, type) {
    // Hammer: Always full number with US commas (e.g. 1,728)
    if (type === 'hammer') {
        return Math.round(val).toLocaleString('en-US'); 
    }
    
    // Gold/Generic: 
    // < 1000: Use decimals with dot (e.g. 950.5)
    if (val < 1000) return val.toLocaleString('en-US', {maximumFractionDigits: 1});
    
    // 1k - 1m: Use 'k' with dot decimal (e.g. 150.5k)
    if (val < 1000000) return (val / 1000).toFixed(1) + 'k';
    
    // > 1m: Use 'm' with dot decimal (e.g. 1.50m)
    return (val / 1000000).toFixed(2) + 'm';
}

// Special formatting for Thief Gold (Calc tool)
function formatThiefGold(val) {
    if (val < 1000) return Math.floor(val).toLocaleString('en-US');
    if (val < 1000000) return (Math.floor(val / 100) / 10).toFixed(1) + 'k';
    return (Math.floor(val / 10000) / 100).toFixed(2) + 'm';
}

// Special formatting for Forge Costs
function formatForgeCost(val) {
    if(val < 1000) return val.toLocaleString('en-US');
    if(val < 10000) return (val/1000).toFixed(2) + 'k';
    if(val < 1000000) return (val/1000).toFixed(1) + 'k';
    return (val/1000000).toFixed(2) + 'm';
}

// --- INPUT HELPERS ---

// Restrict input to numbers and one decimal point
function cleanInput(el) {
    el.value = el.value.replace(/[^0-9.]/g, '');
    if ((el.value.match(/\./g) || []).length > 1) el.value = el.value.replace(/\.+$/, "");
}

// Format input on blur (1000 -> 1,000)
function formatInput(el) {
    if(!el.value) return;
    const raw = el.value.replace(/,/g, '');
    const val = parseFloat(raw);
    if(!isNaN(val)) el.value = val.toLocaleString('en-US');
}

// Unformat input on focus (1,000 -> 1000)
function unformatInput(el) {
    if(!el.value) return;
    el.value = el.value.replace(/,/g, '');
}

// --- UI HELPERS ---

// Toggle Dropdown Menu Visibility
function toggleDropdown(id) {
    const all = document.querySelectorAll('.dropdown-content');
    all.forEach(d => {
        if(d.id !== id) d.classList.remove('show');
    });
    const el = document.getElementById(id);
    if(el) el.classList.toggle('show');
}

// Populate Date/Time Dropdowns (Month, Day, Hour, Min)
function populateDateDropdowns() {
    // Array of prefixes for different date pickers (dm=Desktop Main, cm=Calc, em=Egg)
    const prefixes = ['dm', 'cm', 'em'];
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    prefixes.forEach(prefix => {
        const m = document.getElementById(`${prefix}-month`);
        const d = document.getElementById(`${prefix}-day`);
        const h = document.getElementById(`${prefix}-hour`);
        const min = document.getElementById(`${prefix}-min`);

        // Skip if elements don't exist (e.g. if partial HTML)
        if (!m || !d || !h || !min) return;

        // Clear existing to prevent duplicates if called twice
        m.innerHTML = ''; d.innerHTML = ''; h.innerHTML = ''; min.innerHTML = '';

        months.forEach((n,i)=> m.add(new Option(n, i+1)));
        for(let i=1;i<=31;i++) d.add(new Option(i,i));
        for(let i=0;i<24;i++) h.add(new Option(i.toString().padStart(2,'0'), i));
        for(let i=0;i<60;i++) min.add(new Option(i.toString().padStart(2,'0'), i));
    });
}

// --- DATE SYNCHRONIZATION HELPERS ---

// Triggered when a Dropdown (Day/Month/etc) changes
// 'source' indicates which picker triggered it ('main', 'calc', 'egg')
function updateFromDropdowns(source) {
    let prefix = 'dm'; // default main
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

    // If date is in the past by more than 30 days, assume user means next year
    if (newDate < now && (now - newDate) > 2592000000) newDate.setFullYear(y+1);
    
    // Adjust for timezone to keep local time string correct
    newDate.setMinutes(newDate.getMinutes() - newDate.getTimezoneOffset());
    const iso = newDate.toISOString().slice(0,16);

    // Sync to specific inputs based on source
    if(source === 'calc') syncCalcDate(iso); 
    else if(source === 'egg') syncEggDate(iso);
    else syncMainDate(iso);
}

// Sync Main Plan Date
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
    
    // Check if dependent functions exist (Safe inter-module calls)
    if (typeof updateCalculations === 'function') updateCalculations();
    if (shouldSave && typeof saveToLocalStorage === 'function') saveToLocalStorage();
}

// Sync Calculator Date
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

// Sync Egg Planner Date
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