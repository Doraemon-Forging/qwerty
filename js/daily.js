/**
 * DAILY.JS
 * Logic for Daily Totals and Thief Dungeon calculations.
 * Moved from Forge Calculator.
 */

function updateDaily() {
    // 1. Get Inputs
    const world = parseInt(document.getElementById('calc-world').value) || 1;
    const stage = parseInt(document.getElementById('calc-stage').value) || 1;
    
    // 2. Calculate Thief Dungeon Reward
    // Formula approximation: Base + (World * Scale) + (Stage * Scale)
    // You can adjust these multipliers to match your exact game values
    const baseThief = 500; 
    const worldMult = 1000;
    const stageMult = 100;
    
    // Example Logic: (Replace with your exact formula if different)
    const thiefGold = baseThief + (world * worldMult) + (stage * stageMult);
    
    // 3. Render Thief Result
    const res3 = document.getElementById('calc-res-3');
    if (res3) {
        res3.innerHTML = `
            <div class="calc-line">
                <span class="calc-label">Gold / Run:</span>
                <span class="calc-val-group">
                    <span class="calc-val-after">${thiefGold.toLocaleString()} <img src="icons/fm_gold.png" class="calc-icon"></span>
                </span>
            </div>
            <div class="calc-line">
                <span class="calc-label">Max Daily (4 runs):</span>
                <span class="calc-val-group">
                    <span class="calc-val-after">${(thiefGold * 4).toLocaleString()} <img src="icons/fm_gold.png" class="calc-icon"></span>
                </span>
            </div>
        `;
    }

    // 4. Calculate Daily Totals
    // Assuming standard regen (e.g., 20 keys/day? 480 stamina?)
    // This is a placeholder for your specific Daily Totals logic
    const res4 = document.getElementById('calc-res-4');
    if (res4) {
        // Example: Thief Gold * 4 + some base value
        const totalDailyGold = (thiefGold * 4); 
        
        res4.innerHTML = `
            <div class="calc-line">
                <span class="calc-label">Total Gold:</span>
                <span class="calc-val-group">
                    <span class="calc-val-after">${totalDailyGold.toLocaleString()} <img src="icons/fm_gold.png" class="calc-icon"></span>
                </span>
            </div>
            <div style="font-size:0.8em; color:#666; margin-top:5px; text-align:center;">
                (Includes Thief x4 + Natural Regen)
            </div>
        `;
    }
}

// Attach listener to inputs specifically for Daily
document.addEventListener('DOMContentLoaded', () => {
    ['calc-world', 'calc-stage'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateDaily);
    });
    // Initial run
    updateDaily();
});