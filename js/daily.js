/**
 * DAILY.JS
 * Logic for Daily Totals and Thief Dungeon calculations.
 */

function updateDaily() {
    // 1. Get Inputs
    const world = parseInt(document.getElementById('calc-world').value) || 1;
    const stage = parseInt(document.getElementById('calc-stage').value) || 1;
    
    // 2. Calculate Thief Dungeon Reward
    // Formula approximation (Adjust numbers to match your game data)
    const baseThief = 500; 
    const worldMult = 1000;
    const stageMult = 100;
    
    const thiefGold = baseThief + (world * worldMult) + (stage * stageMult);
    const dailyThiefTotal = thiefGold * 4;

    // 3. Render Thief Result (Using new CSS classes)
    const res3 = document.getElementById('calc-res-3');
    if (res3) {
        res3.innerHTML = `
            <div class="daily-res-line">
                <span class="daily-res-label">Gold per Run:</span>
                <span class="daily-res-value">
                    ${thiefGold.toLocaleString()} <img src="icons/fm_gold.png" class="daily-icon">
                </span>
            </div>
            <div class="daily-res-line">
                <span class="daily-res-label">Daily (4 Tickets):</span>
                <span class="daily-res-value">
                    ${dailyThiefTotal.toLocaleString()} <img src="icons/fm_gold.png" class="daily-icon">
                </span>
            </div>
        `;
    }

    // 4. Calculate Daily Totals (Regen, etc)
    // Placeholder logic: Just using Thief + dummy regen value
    const regenGold = 50000; // Example passive income
    const totalDaily = dailyThiefTotal + regenGold;
    
    const res4 = document.getElementById('calc-res-4');
    if (res4) {
        res4.innerHTML = `
            <div class="daily-res-line">
                <span class="daily-res-label">Thief Dungeon (x4):</span>
                <span class="daily-res-value">
                    ${dailyThiefTotal.toLocaleString()} <img src="icons/fm_gold.png" class="daily-icon">
                </span>
            </div>
            <div class="daily-res-line">
                <span class="daily-res-label">Natural Regen:</span>
                <span class="daily-res-value">
                    ${regenGold.toLocaleString()} <img src="icons/fm_gold.png" class="daily-icon">
                </span>
            </div>
            <hr style="border: 0; border-top: 2px solid #ccc; width: 100%; margin: 5px 0;">
            <div class="daily-res-line">
                <span class="daily-res-label" style="color:#000; font-weight:bold;">GRAND TOTAL:</span>
                <span class="daily-res-value" style="font-size:1.3rem; color:#27ae60;">
                    ${totalDaily.toLocaleString()} <img src="icons/fm_gold.png" class="daily-icon">
                </span>
            </div>
        `;
    }
}

// Attach listener
document.addEventListener('DOMContentLoaded', () => {
    ['calc-world', 'calc-stage'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateDaily);
    });
    // Initial run
    updateDaily();
});