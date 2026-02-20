/**
 * PETMOUNT.JS
 * Pet and Mount Calculator Logic
 */

// ==========================================
// 1. CONSTANTS & DATA
// ==========================================

const PET_DATA = {
    "Common": { "HP": ["Snail", "Turtle"], "Hybrid": ["Mouse", "Chicken"], "Damage": ["Dog"] },
    "Rare": { "HP": ["Hedgehog", "Bear"], "Hybrid": ["Ostrich"], "Damage": ["Scorpion", "Spider"] },
    "Epic": { "HP": ["Panda", "Griffin"], "Hybrid": ["Unicorn"], "Damage": ["Saber Tooth", "Tiger"] },
    "Legendary": { "Hybrid": ["Cerberus"], "Damage": ["Kitsune", "Serpent"] },
    "Ultimate": { "HP": ["Treant"], "Hybrid": ["Enchanted Elk"], "Damage": ["Electry"] },
    "Mythic": { "HP": ["Genie"], "Hybrid": ["Baby Dragon"], "Damage": ["Spectral Tiger"] }
};

const PET_TYPE_MAP = {
    "Snail": "HP", "Turtle": "HP", "Mouse": "Hybrid", "Chicken": "Hybrid", "Dog": "Damage",
    "Hedgehog": "HP", "Bear": "HP", "Ostrich": "Hybrid", "Scorpion": "Damage", "Spider": "Damage",
    "Panda": "HP", "Griffin": "HP", "Unicorn": "Hybrid", "Saber Tooth": "Damage", "Tiger": "Damage",
    "Cerberus": "Hybrid", "Kitsune": "Damage", "Serpent": "Damage",
    "Treant": "HP", "Enchanted Elk": "Hybrid", "Electry": "Damage",
    "Genie": "HP", "Baby Dragon": "Hybrid", "Spectral Tiger": "Damage"
};

const RARITY_MULT = { "Common": 1, "Rare": 5, "Epic": 25, "Legendary": 125, "Ultimate": 625, "Mythic": 3125 };

const FODDER_XP = { "Common": 10, "Rare": 30, "Epic": 90, "Legendary": 270, "Ultimate": 810, "Mythic": 2430 };
const MOUNT_FODDER_XP = { "Common": 10, "Rare": 40, "Epic": 160, "Legendary": 640, "Ultimate": 2560, "Mythic": 10240 };

const BASE_STATS = {
    "HP": { hp: 1200, dmg: 50 },
    "Hybrid": { hp: 800, dmg: 100 },
    "Damage": { hp: 400, dmg: 150 }
};

const MOUNT_BASE_STATS = { "Common": 10, "Rare": 40, "Epic": 80, "Legendary": 150, "Ultimate": 250, "Mythic": 400 };
const MOUNT_INC_STATS = { "Common": 1, "Rare": 2, "Epic": 3, "Legendary": 4, "Ultimate": 5, "Mythic": 6 };

const PET_EXP_TABLE = {
    "Common": [0, 10, 11, 11, 11, 12, 12, 12, 13, 13, 13, 14, 14, 15, 15, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 22, 22, 23, 24, 24, 25, 26, 27, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 47, 48, 49, 51, 52, 54, 56, 57, 59, 61, 63, 64, 66, 68, 70, 72, 75, 77, 79, 82, 84, 87, 89, 92, 95, 97, 100, 103, 106, 110, 113, 116, 120, 123, 127, 131, 135, 139, 143, 147, 152, 156, 161, 166, 171, 176, 181, 187],
    "Rare": [0, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 42, 43, 44, 45, 47, 48, 50, 51, 53, 54, 56, 57, 59, 61, 63, 65, 67, 69, 71, 73, 75, 77, 80, 82, 84, 87, 90, 92, 95, 98, 101, 104, 107, 110, 113, 117, 120, 124, 128, 132, 135, 140, 144, 148, 152, 157, 162, 167, 172, 177, 182, 188, 193, 199, 205, 211, 217, 224, 231, 238, 245, 252, 260, 267, 275, 284, 292, 301, 310, 319, 329, 339, 349, 359, 370, 381, 393, 404, 417, 429, 442, 455, 469, 483, 497, 512, 528, 543, 560],
    "Epic": [0, 93, 95, 98, 101, 104, 107, 111, 114, 117, 121, 125, 128, 132, 136, 140, 144, 149, 153, 158, 163, 167, 172, 178, 183, 188, 194, 200, 206, 212, 218, 225, 232, 239, 246, 253, 261, 269, 277, 285, 294, 302, 311, 321, 330, 340, 351, 361, 372, 383, 395, 406, 419, 431, 444, 457, 471, 485, 500, 515, 530, 546, 563, 579, 597, 615, 633, 652, 672, 692, 713, 734, 756, 779, 802, 826, 851, 876, 903, 930, 958, 986, 1016, 1046, 1078, 1110, 1144, 1178, 1213, 1250, 1287, 1326, 1365, 1406, 1449, 1492, 1537, 1583, 1630, 1679],
    "Legendary": [0, 278, 286, 295, 304, 313, 322, 332, 342, 352, 363, 374, 385, 397, 408, 421, 433, 446, 460, 473, 488, 502, 517, 533, 549, 565, 582, 600, 618, 636, 655, 675, 695, 716, 738, 760, 783, 806, 830, 855, 881, 907, 934, 962, 991, 1021, 1052, 1083, 1116, 1149, 1184, 1219, 1256, 1293, 1332, 1372, 1413, 1456, 1499, 1544, 1591, 1638, 1688, 1738, 1790, 1844, 1899, 1956, 2015, 2076, 2138, 2202, 2268, 2336, 2406, 2478, 2553, 2629, 2708, 2789, 2873, 2959, 3048, 3139, 3234, 3331, 3431, 3533, 3639, 3749, 3861, 3977, 4096, 4219, 4346, 4476, 4610, 4749, 4891, 5038],
    "Ultimate": [0, 834, 859, 885, 912, 939, 967, 996, 1026, 1057, 1089, 1121, 1155, 1190, 1225, 1262, 1300, 1339, 1379, 1420, 1463, 1507, 1552, 1599, 1647, 1696, 1747, 1799, 1853, 1909, 1966, 2025, 2086, 2148, 2213, 2279, 2348, 2418, 2491, 2565, 2642, 2722, 2803, 2887, 2974, 3063, 3155, 3250, 3347, 3448, 3551, 3657, 3767, 3880, 3997, 4117, 4240, 4367, 4498, 4633, 4772, 4915, 5063, 5215, 5371, 5532, 5698, 5869, 6045, 6227, 6413, 6606, 6804, 7008, 7218, 7435, 7658, 7888, 8124, 8368, 8619, 8878, 9144, 9418, 9701, 9992, 10292, 10600, 10918, 11246, 11583, 11931, 12289, 12657, 13037, 13428, 13831, 14246, 14673, 15114],
    "Mythic": [0, 2503, 2578, 2655, 2735, 2817, 2902, 2989, 3078, 3171, 3266, 3364, 3465, 3569, 3676, 3786, 3899, 4016, 4137, 4261, 4389, 4521, 4656, 4796, 4940, 5088, 5241, 5398, 5560, 5726, 5898, 6075, 6257, 6445, 6639, 6838, 7043, 7254, 7472, 7696, 7927, 8165, 8409, 8662, 8922, 9189, 9465, 9749, 10041, 10343, 10653, 10972, 11302, 11641, 11990, 12350, 12720, 13102, 13495, 13900, 14317, 14746, 15188, 15644, 16113, 16597, 17095, 17608, 18136, 18680, 19240, 19818, 20412, 21024, 21655, 22305, 22974, 23663, 24373, 25104, 25857, 26633, 27432, 28255, 29103, 29976, 30875, 31801, 32755, 33738, 34750, 35793, 36866, 37972, 39112, 40285, 41493, 42738, 44020, 45341]
};

const MOUNT_EXP_TABLE = {
    "Common": [0, 12, 13, 15, 17, 20, 23, 27, 31, 35, 40, 47, 54, 62, 71, 81, 94, 108, 124, 142, 144, 145, 147, 148, 150, 151, 153, 154, 156, 157, 159, 160, 162, 164, 165, 167, 169, 170, 172, 174, 175, 177, 179, 181, 183, 184, 186, 188, 190, 192, 194, 196, 198, 200, 202, 204, 206, 208, 210, 212, 214, 216, 218, 220, 223, 225, 227, 229, 232, 234, 236, 239, 241, 244, 246, 248, 251, 253, 256, 259, 261, 264, 266, 269, 272, 274, 277, 280, 283, 286, 288, 291, 294, 297, 300, 303, 306, 309, 312, 315],
    "Rare": [0, 46, 53, 61, 70, 80, 93, 106, 122, 141, 162, 186, 214, 246, 283, 325, 374, 430, 495, 569, 575, 581, 587, 592, 598, 604, 610, 616, 623, 629, 635, 641, 648, 654, 661, 668, 674, 681, 688, 695, 702, 709, 716, 723, 730, 737, 745, 752, 760, 767, 775, 783, 791, 798, 806, 814, 823, 831, 839, 848, 856, 865, 873, 882, 891, 900, 909, 918, 927, 936, 946, 955, 965, 974, 984, 994, 1004, 1014, 1024, 1034, 1045, 1055, 1066, 1076, 1087, 1098, 1109, 1120, 1131, 1142, 1154, 1165, 1177, 1189, 1201, 1213, 1225, 1237, 1249, 1262],
    "Epic": [0, 184, 212, 243, 280, 322, 370, 426, 489, 563, 647, 744, 856, 984, 1132, 1302, 1497, 1722, 1980, 2277, 2300, 2323, 2346, 2370, 2393, 2417, 2441, 2466, 2490, 2515, 2540, 2566, 2592, 2617, 2644, 2670, 2697, 2724, 2751, 2778, 2806, 2834, 2863, 2891, 2920, 2949, 2979, 3009, 3039, 3069, 3100, 3131, 3162, 3194, 3226, 3258, 3291, 3323, 3357, 3390, 3424, 3458, 3493, 3528, 3563, 3599, 3635, 3671, 3708, 3745, 3782, 3820, 3858, 3897, 3936, 3975, 4015, 4055, 4096, 4137, 4178, 4220, 4262, 4305, 4348, 4391, 4435, 4480, 4524, 4570, 4615, 4661, 4708, 4755, 4803, 4851, 4899, 4948, 4998, 5048],
    "Legendary": [0, 736, 846, 973, 1119, 1287, 1480, 1702, 1958, 2251, 2589, 2978, 3424, 3938, 4528, 5208, 5989, 6887, 7920, 9108, 9199, 9291, 9384, 9478, 9573, 9669, 9765, 9863, 9962, 10061, 10162, 10263, 10366, 10470, 10574, 10680, 10787, 10895, 11004, 11114, 11225, 11337, 11451, 11565, 11681, 11798, 11916, 12035, 12155, 12277, 12399, 12523, 12649, 12775, 12903, 13032, 13162, 13294, 13427, 13561, 13697, 13834, 13972, 14112, 14253, 14395, 14539, 14685, 14832, 14980, 15130, 15281, 15434, 15588, 15744, 15901, 16060, 16221, 16383, 16547, 16713, 16880, 17048, 17219, 17391, 17565, 17741, 17918, 18097, 18278, 18461, 18646, 18832, 19020, 19211, 19403, 19597, 19793, 19991, 20191],
    "Ultimate": [0, 2944, 3386, 3893, 4477, 5149, 5921, 6810, 7831, 9006, 10357, 11910, 13697, 15751, 18114, 20831, 23956, 27549, 31681, 36433, 36798, 37166, 37537, 37913, 38292, 38675, 39061, 39452, 39847, 40245, 40648, 41054, 41465, 41879, 42298, 42721, 43148, 43580, 44015, 44456, 44900, 45349, 45803, 46261, 46723, 47191, 47662, 48139, 48620, 49107, 49598, 50094, 50595, 51101, 51612, 52128, 52649, 53175, 53707, 54244, 54787, 55335, 55888, 56447, 57011, 57581, 58157, 58739, 59326, 59919, 60519, 61124, 61735, 62352, 62976, 63606, 64242, 64884, 65533, 66188, 66850, 67519, 68194, 68876, 69565, 70260, 70963, 71672, 72389, 73113, 73844, 74583, 75328, 76082, 76843, 77611, 78387, 79171, 79963, 80762],
    "Mythic": [0, 11776, 13542, 15574, 17910, 20596, 23686, 27239, 31324, 36023, 41427, 47640, 54787, 63005, 72455, 83324, 95822, 110195, 126725, 145733, 147191, 148663, 150149, 151651, 153167, 154699, 156246, 157808, 159386, 160980, 162590, 164216, 165858, 167517, 169192, 170884, 172593, 174319, 176062, 177822, 179601, 181397, 183211, 185043, 186893, 188762, 190650, 192556, 194482, 196427, 198391, 200375, 202378, 204402, 206446, 208511, 210596, 212702, 214829, 216977, 219147, 221338, 223552, 225787, 228045, 230326, 232629, 234955, 237305, 239678, 242074, 244495, 246940, 249410, 251904, 254423, 256967, 259537, 262132, 264753, 267401, 270075, 272776, 275503, 278258, 281041, 283851, 286690, 289557, 292452, 295377, 298331, 301314, 304327, 307370, 310444, 313548, 316684, 319851, 323049]
};


// ==========================================
// 2. INITIALIZATION & DROPDOWNS
// ==========================================

function initPetMount() {
    const rarities = ["Common", "Rare", "Epic", "Legendary", "Ultimate", "Mythic"];
    
    // Init Main Pet Tool (Pet 1-3)
    for (let i = 1; i <= 3; i++) {
        const raritySel = document.getElementById(`pet-${i}-rarity`);
        if (raritySel) {
            raritySel.innerHTML = "";
            rarities.forEach(r => raritySel.add(new Option(r, r)));
            raritySel.value = "Common";
        }
        const lvlInput = document.getElementById(`pet-${i}-lvl`);
        const expInput = document.getElementById(`pet-${i}-exp`);
        if (lvlInput) lvlInput.value = 1;
        if (expInput) expInput.value = 0;
        updatePetNameOptions(i);
    }

    // Init Pet Merge Tool (Target & Fodder)
    const mergeTypes = ['target', 'fodder'];
    mergeTypes.forEach(type => {
        const raritySel = document.getElementById(`merge-${type}-rarity`);
        if (raritySel) {
            raritySel.innerHTML = "";
            if (type === 'fodder') raritySel.add(new Option("None", "None"));
            rarities.forEach(r => raritySel.add(new Option(r, r)));
            raritySel.value = "Common";
        }
        const lvlInput = document.getElementById(`merge-${type}-lvl`);
        const expInput = document.getElementById(`merge-${type}-exp`);
        if (lvlInput) lvlInput.value = 1;
        if (expInput) expInput.value = 0;

        updateMergeNameOptions(type);
    });
}

function updatePetNameOptions(index) {
    const raritySel = document.getElementById(`pet-${index}-rarity`);
    const nameSel = document.getElementById(`pet-${index}-id`);
    if (!raritySel || !nameSel) return;

    const selectedRarity = raritySel.value;
    const data = PET_DATA[selectedRarity];
    const currentName = nameSel.value;
    nameSel.innerHTML = ""; 

    if (data) {
        Object.keys(data).forEach(type => {
            if (data[type].length > 0) {
                const group = document.createElement('optgroup');
                group.label = type;
                data[type].forEach(petName => {
                    group.appendChild(new Option(petName, petName));
                });
                nameSel.add(group);
            }
        });
    }

    let options = Array.from(nameSel.options);
    if (options.some(o => o.value === currentName)) {
        nameSel.value = currentName;
    } else if (options.length > 0) {
        nameSel.selectedIndex = 0; 
    }
    updatePetMount();
}

function updateMergeNameOptions(type) {
    const raritySel = document.getElementById(`merge-${type}-rarity`);
    const nameSel = document.getElementById(`merge-${type}-id`);
    if (!raritySel || !nameSel) return;

    const selectedRarity = raritySel.value;
    const currentName = nameSel.value;
    nameSel.innerHTML = ""; 

    if (selectedRarity === "None") {
        nameSel.disabled = true;
        updateMergeResult();
        return;
    } else {
        nameSel.disabled = false;
    }

    const data = PET_DATA[selectedRarity];

    if (data) {
        Object.keys(data).forEach(cat => {
            if (data[cat].length > 0) {
                const group = document.createElement('optgroup');
                group.label = cat;
                data[cat].forEach(petName => {
                    group.appendChild(new Option(petName, petName));
                });
                nameSel.add(group);
            }
        });
    }

    let options = Array.from(nameSel.options);
    if (options.some(o => o.value === currentName)) {
        nameSel.value = currentName;
    } else if (options.length > 0) {
        nameSel.selectedIndex = 0; 
    }
    updateMergeResult();
}


// ==========================================
// 3. HELPERS: MATH & FORMATTING
// ==========================================

function formatPetStats(val) {
    if (val < 10000) return val.toLocaleString('en-US'); 
    if (val < 1000000) return (val / 1000).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 'k'; 
    return (val / 1000000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + 'm'; 
}

function generateStatString(v1, v2) {
    const s1 = formatPetStats(v1);
    const s2 = formatPetStats(v2);
    if (s1 === s2) return `<span>${s1}</span>`;
    
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        return `
            <div style="display: flex; flex-direction: column; align-items: flex-end;">
                <span style="margin-bottom: 2px;">${s1}</span>
                <div style="display:flex; align-items:center;">
                    <span class="calc-arrow" style="margin-right: 4px; font-size: 0.9em;">➜</span>
                    <span style="color: #198754; font-weight: 600;">${s2}</span>
                </div>
            </div>`;
    }
    
    return `<span>${s1}</span> <span class="calc-arrow">➜</span> <span style="color: #198754; font-weight: 600;">${s2}</span>`;
}

function generateStatStringWithIcons(v1, v2, iconPath) {
    const s1 = formatPetStats(v1);
    const s2 = formatPetStats(v2);
    const iconHtml = `<img src="${iconPath}" style="width: 20px; height: 20px; object-fit: contain; vertical-align: middle;">`;
    
    if (s1 === s2) return `<div style="display:flex; align-items:center; gap:4px; justify-content: flex-end;">${iconHtml}<span>${s1}</span></div>`;
    
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        return `
            <div style="display: flex; flex-direction: column; align-items: flex-end;">
                <div style="display:flex; align-items:center; gap:4px; margin-bottom: 2px;">${iconHtml}<span>${s1}</span></div>
                <div style="display:flex; align-items:center; gap:4px; color: #198754;">
                    <span class="calc-arrow">➜</span>${iconHtml}<span style="font-weight: 600;">${s2}</span>
                </div>
            </div>`;
    }
    
    return `<div style="display:flex; align-items:center; gap:4px; justify-content: flex-end;">
                ${iconHtml}<span>${s1}</span> 
                <span class="calc-arrow" style="margin: 0 4px;">➜</span> 
                <div style="display:flex; align-items:center; gap:4px; color: #198754;">${iconHtml}<span style="font-weight: 600;">${s2}</span></div>
            </div>`;
}

function getPetMasteryMult(levels, type) {
    let total = 0;
    for(let t = 1; t <= 5; t++) {
        total += (levels[`spt_T${t}_pet_${type}`] || 0);
    }
    return 1 + (total * 0.02); 
}

function getMountMasteryMult(levels, type) {
    let total = 0;
    for(let t = 1; t <= 5; t++) {
        total += (levels[`power_T${t}_mount_${type}`] || 0);
    }
    return 1 + (total * 0.02); 
}

function getRecursiveExp(rarity, level) {
    if (!PET_EXP_TABLE[rarity]) return 0;
    let total = 0;
    for (let l = 1; l < level; l++) {
        total += PET_EXP_TABLE[rarity][l];
    }
    return total;
}

function getMaxPossibleExp(rarity) {
    if (!PET_EXP_TABLE[rarity]) return 0;
    return PET_EXP_TABLE[rarity].reduce((a, b) => a + b, 0);
}

function getRecursiveMountExp(rarity, level) {
    if (!MOUNT_EXP_TABLE[rarity]) return 0;
    let total = 0;
    for (let l = 1; l < level; l++) {
        total += MOUNT_EXP_TABLE[rarity][l];
    }
    return total;
}

function getMaxPossibleMountExp(rarity) {
    if (!MOUNT_EXP_TABLE[rarity]) return 0;
    return MOUNT_EXP_TABLE[rarity].reduce((a, b) => a + b, 0);
}

// SAFE DOM RETRIEVAL HELPERS
const getIntValSafe = (id, defaultVal = 0) => {
    const el = document.getElementById(id);
    if (!el || !el.value) return defaultVal;
    const parsed = parseInt(el.value);
    return isNaN(parsed) ? defaultVal : parsed;
};

const getStrValSafe = (id, defaultVal = "Common") => {
    const el = document.getElementById(id);
    return el && el.value ? el.value : defaultVal;
};


// ==========================================
// 4. VALIDATION
// ==========================================

function validatePetInputs() {
    for (let i = 1; i <= 3; i++) {
        const raritySel = document.getElementById(`pet-${i}-rarity`);
        const lvlInput = document.getElementById(`pet-${i}-lvl`);
        const expInput = document.getElementById(`pet-${i}-exp`);
        
        if (!raritySel || !lvlInput || !expInput) continue;
        const rarity = raritySel.value;
        
        let lvl = parseInt(lvlInput.value);
        if (isNaN(lvl) || lvl < 1) lvl = 1;
        if (lvl > 100) lvl = 100;
        lvlInput.value = lvl;

        let maxExp = 0;
        if (PET_EXP_TABLE[rarity]) {
            if (lvl >= 1 && lvl <= 99) maxExp = PET_EXP_TABLE[rarity][lvl];
            else if (lvl >= 100) maxExp = "Max";
        }

        let exp = parseInt(expInput.value);
        if (isNaN(exp) || exp < 0) exp = 0;
        
        if (maxExp === "Max") {
            exp = 0; 
        } else {
            const limit = maxExp - 1;
            if (exp > limit) exp = limit;
        }
        expInput.value = exp; 
    }
    updatePetMount();
}

function validateMergeInputs() {
    const types = ['target', 'fodder'];
    types.forEach(type => {
        const raritySel = document.getElementById(`merge-${type}-rarity`);
        const lvlInput = document.getElementById(`merge-${type}-lvl`);
        const expInput = document.getElementById(`merge-${type}-exp`);
        
        if (!raritySel || !lvlInput || !expInput) return;
        const rarity = raritySel.value;
        
        // Disable inputs if "None" is selected
        if (rarity === "None") {
            lvlInput.disabled = true;
            expInput.disabled = true;
            lvlInput.value = "";
            expInput.value = "";
            return; 
        } else {
            lvlInput.disabled = false;
            expInput.disabled = false;
        }

        let lvl = parseInt(lvlInput.value);
        if (isNaN(lvl) || lvl < 1) lvl = 1;
        if (lvl > 100) lvl = 100;
        lvlInput.value = lvl;

        let maxExp = 0;
        if (PET_EXP_TABLE[rarity]) {
            if (lvl >= 1 && lvl <= 99) maxExp = PET_EXP_TABLE[rarity][lvl];
            else if (lvl >= 100) maxExp = "Max";
        }

        let exp = parseInt(expInput.value);
        if (isNaN(exp) || exp < 0) exp = 0;
        
        if (maxExp === "Max") {
            exp = 0; 
        } else {
            const limit = maxExp - 1;
            if (exp > limit) exp = limit;
        }
        expInput.value = exp; 
    });
    updateMergeResult();
}

function validateMountInputs() {
    const types = ['target', 'fodder'];
    types.forEach(type => {
        const raritySel = document.getElementById(`mount-${type}-rarity`);
        const lvlInput = document.getElementById(`mount-${type}-lvl`);
        const expInput = document.getElementById(`mount-${type}-exp`);
        
        if (!raritySel || !lvlInput || !expInput) return;
        const rarity = raritySel.value;
        
        // Disable inputs if "None" is selected
        if (rarity === "None") {
            lvlInput.disabled = true;
            expInput.disabled = true;
            lvlInput.value = "";
            expInput.value = "";
            return; 
        } else {
            lvlInput.disabled = false;
            expInput.disabled = false;
        }
        
        let lvl = parseInt(lvlInput.value);
        if (isNaN(lvl) || lvl < 1) lvl = 1;
        if (lvl > 100) lvl = 100;
        lvlInput.value = lvl;

        let maxExp = 0;
        if (MOUNT_EXP_TABLE[rarity]) {
            if (lvl >= 1 && lvl <= 99) maxExp = MOUNT_EXP_TABLE[rarity][lvl];
            else if (lvl >= 100) maxExp = "Max";
        }

        let exp = parseInt(expInput.value);
        if (isNaN(exp) || exp < 0) exp = 0;
        
        if (maxExp === "Max") {
            exp = 0; 
        } else {
            const limit = maxExp - 1;
            if (exp > limit) exp = limit;
        }
        expInput.value = exp; 
    });
    updateMountMergeResult();
}

function updatePetMountExpCap() {
    const lvEl = document.getElementById('pet-mount-summon-lvl');
    const expEl = document.getElementById('pet-mount-summon-exp');
    const maxEl = document.getElementById('pet-mount-summon-max');
    
    if (lvEl && maxEl && expEl) {
        let lv = parseInt(lvEl.value) || 1;
        if (lv < 1) lv = 1;
        if (lv > 50) lv = 50;
        
        let maxExp = 2; // Default starting value
        if (typeof MOUNT_LEVEL_DATA !== 'undefined' && MOUNT_LEVEL_DATA[lv]) {
            maxExp = MOUNT_LEVEL_DATA[lv][0];
        }
        
        if (maxExp === "MAX" || maxExp === 0) {
            maxEl.innerText = "MAX";
            expEl.value = 0;
            expEl.disabled = true;
        } else {
            maxEl.innerText = maxExp;
            expEl.disabled = false;
            let currentExp = parseInt(expEl.value) || 0;
            if (currentExp >= maxExp) expEl.value = maxExp - 1;
        }
    }
}


// ==========================================
// 5. CORE CALCULATORS
// ==========================================

function updatePetMount() {
    let curMultHP = 1, projMultHP = 1;
    let curMultDmg = 1, projMultDmg = 1;

    if (typeof setupLevels !== 'undefined') {
        curMultHP = getPetMasteryMult(setupLevels, 'hp');
        curMultDmg = getPetMasteryMult(setupLevels, 'dmg');
    }
    
    if (typeof calcState === 'function') {
        const state = calcState();
        if (state && state.levels) {
            projMultHP = getPetMasteryMult(state.levels, 'hp');
            projMultDmg = getPetMasteryMult(state.levels, 'dmg');
        } else { 
            projMultHP = curMultHP; projMultDmg = curMultDmg; 
        }
    } else { 
        projMultHP = curMultHP; projMultDmg = curMultDmg; 
    }

    let totalHpCur = 0, totalHpProj = 0;
    let totalDmgCur = 0, totalDmgProj = 0;

    for (let i = 1; i <= 3; i++) {
        const raritySel = document.getElementById(`pet-${i}-rarity`);
        const nameSel = document.getElementById(`pet-${i}-id`);
        const lvlInput = document.getElementById(`pet-${i}-lvl`);
        const expInput = document.getElementById(`pet-${i}-exp`);
        const maxSpan = document.getElementById(`pet-${i}-max`);
        
        const hpRes = document.getElementById(`pet-${i}-stat-hp`);
        const dmgRes = document.getElementById(`pet-${i}-stat-dmg`);
        
        const cellExpNext = document.getElementById(`pet-${i}-exp-next`);
        const cellExpTotal = document.getElementById(`pet-${i}-exp-total`);
        const cellExpMax = document.getElementById(`pet-${i}-exp-max`);

        if (!raritySel || !lvlInput || !maxSpan || !expInput) continue;

        const rarity = raritySel.value;
        const name = nameSel.value;

        let lvl = parseInt(lvlInput.value);
        if (isNaN(lvl) || lvl < 1) lvl = 1; 
        if (lvl > 100) lvl = 100;

        let exp = parseInt(expInput.value);
        if (isNaN(exp) || exp < 0) exp = 0;

        // Exp Display
        let maxExpForLvl = 0;
        if (PET_EXP_TABLE[rarity]) {
            if (lvl >= 1 && lvl <= 99) maxExpForLvl = PET_EXP_TABLE[rarity][lvl];
            else if (lvl >= 100) maxExpForLvl = "Max";
        }
        maxSpan.innerText = maxExpForLvl === "Max" ? "Max" : maxExpForLvl.toLocaleString();

        // Exp Table Calculations
        if (cellExpNext && cellExpTotal && cellExpMax) {
            if (maxExpForLvl === "Max") {
                cellExpNext.innerText = "-";
                cellExpMax.innerText = "Max";
                const total = getMaxPossibleExp(rarity);
                cellExpTotal.innerText = total.toLocaleString();
            } else {
                const toNext = maxExpForLvl - exp;
                cellExpNext.innerText = toNext.toLocaleString();

                const baseTotal = getRecursiveExp(rarity, lvl);
                const absoluteTotal = baseTotal + exp;
                cellExpTotal.innerText = absoluteTotal.toLocaleString();

                const maxPossible = getMaxPossibleExp(rarity);
                const toMax = maxPossible - absoluteTotal;
                
                let pct = 0;
                if (maxPossible > 0) pct = (absoluteTotal / maxPossible) * 100;
                
                cellExpMax.innerHTML = `${toMax.toLocaleString()} <span style="font-size: 0.8em; color: #7f8c8d;">(${pct.toFixed(1)}%)</span>`;
            }
        }

        // Stats Calculation
        if (hpRes && dmgRes) {
            const type = PET_TYPE_MAP[name];
            const base = BASE_STATS[type];
            const rMult = RARITY_MULT[rarity] || 1;
            
            if (base && lvl > 0) {
                const levelMult = Math.pow(1.02, lvl - 1);
                const rawHp = (base.hp * rMult) * levelMult;
                const rawDmg = (base.dmg * rMult) * levelMult;

                const finalHpCur = Math.round(rawHp * curMultHP);
                const finalHpProj = Math.round(rawHp * projMultHP);
                const finalDmgCur = Math.round(rawDmg * curMultDmg);
                const finalDmgProj = Math.round(rawDmg * projMultDmg);

                totalHpCur += finalHpCur;
                totalHpProj += finalHpProj;
                totalDmgCur += finalDmgCur;
                totalDmgProj += finalDmgProj;

                hpRes.innerHTML = generateStatString(finalHpCur, finalHpProj);
                dmgRes.innerHTML = generateStatString(finalDmgCur, finalDmgProj);
            } else {
                hpRes.innerText = "-";
                dmgRes.innerText = "-";
            }
        }
    }

    const totalHpEl = document.getElementById('pet-total-hp');
    const totalDmgEl = document.getElementById('pet-total-dmg');
    if (totalHpEl && totalDmgEl) {
        if (totalHpCur > 0 || totalDmgCur > 0) {
            totalHpEl.innerHTML = generateStatString(totalHpCur, totalHpProj);
            totalDmgEl.innerHTML = generateStatString(totalDmgCur, totalDmgProj);
        } else {
            totalHpEl.innerText = "-";
            totalDmgEl.innerText = "-";
        }
    }
}

function updateMergeResult() {
    // 0. Handle Fodder "None" Input States Immediately
    const fRaritySel = document.getElementById('merge-fodder-rarity');
    const fLvlInput = document.getElementById('merge-fodder-lvl');
    const fExpInput = document.getElementById('merge-fodder-exp');
    
    if (fRaritySel && fRaritySel.value === "None") {
        if(fLvlInput) { fLvlInput.disabled = true; fLvlInput.value = ""; }
        if(fExpInput) { fExpInput.disabled = true; fExpInput.value = ""; }
    } else if (fRaritySel && fLvlInput && fExpInput) {
        fLvlInput.disabled = false;
        fExpInput.disabled = false;
        // REMOVED: The aggressive "force to 1 or 0" logic that interrupted typing.
    }

    // 1. Update Exp Max Labels for inputs
    const types = ['target', 'fodder'];
    types.forEach(type => {
        const raritySel = document.getElementById(`merge-${type}-rarity`);
        const lvlInput = document.getElementById(`merge-${type}-lvl`);
        const maxSpan = document.getElementById(`merge-${type}-max`);
        
        if (!raritySel || !lvlInput || !maxSpan) return;

        const rarity = raritySel.value;
        if (rarity === "None") {
            maxSpan.innerText = "0";
            return;
        }

        let lvl = parseInt(lvlInput.value);
        if (isNaN(lvl) || lvl < 1) lvl = 1;
        if (lvl > 100) lvl = 100;

        let maxExp = 0;
        if (PET_EXP_TABLE[rarity]) {
            if (lvl >= 1 && lvl <= 99) maxExp = PET_EXP_TABLE[rarity][lvl];
            else if (lvl >= 100) maxExp = "Max";
        }
        maxSpan.innerText = maxExp === "Max" ? "Max" : maxExp.toLocaleString();
    });

    // 2. CALCULATE MERGE TOTAL (USING SAFE HELPERS)
    const tRarity = getStrValSafe('merge-target-rarity', "Common");
    const tName = getStrValSafe('merge-target-id', "");
    const tLvl = getIntValSafe('merge-target-lvl', 1);
    const tExp = getIntValSafe('merge-target-exp', 0);
    
    const fRarity = getStrValSafe('merge-fodder-rarity', "None");
    const fLvl = getIntValSafe('merge-fodder-lvl', 1);
    const fExp = getIntValSafe('merge-fodder-exp', 0);

    const bulk = {
        "Common": getIntValSafe('bulk-common', 0),
        "Rare": getIntValSafe('bulk-rare', 0),
        "Epic": getIntValSafe('bulk-epic', 0),
        "Legendary": getIntValSafe('bulk-legendary', 0),
        "Ultimate": getIntValSafe('bulk-ultimate', 0),
        "Mythic": getIntValSafe('bulk-mythic', 0)
    };

    // Math
    const tRecursive = getRecursiveExp(tRarity, tLvl);
    const tTotal = tRecursive + tExp;

    let fTotal = 0;
    let fBaseBonus = 0;
    if (fRarity !== "None") {
        fTotal = getRecursiveExp(fRarity, fLvl) + fExp;
        fBaseBonus = FODDER_XP[fRarity] || 0;
    }

    let bulkBonus = 0;
    Object.keys(bulk).forEach(r => {
        bulkBonus += bulk[r] * (FODDER_XP[r] || 0);
    });

    const grandTotal = tTotal + fTotal + fBaseBonus + bulkBonus;

    // Level Lookup
    const expTable = PET_EXP_TABLE[tRarity];
    const maxPossible = getMaxPossibleExp(tRarity);
    
    let newLvl = 1;
    let newExp = 0;

    if (grandTotal >= maxPossible) {
        newLvl = 100;
        newExp = 0; 
    } else if (expTable) {
        let cum = 0;
        for (let l = 1; l < 100; l++) {
            let needed = expTable[l]; 
            if (grandTotal < (cum + needed)) {
                newLvl = l;
                newExp = grandTotal - cum;
                break;
            }
            cum += needed;
            if (l === 99) { 
                newLvl = 100;
                newExp = 0; 
            }
        }
    }

    // Stat Calculation
    const type = PET_TYPE_MAP[tName];
    const base = BASE_STATS[type];
    const rMult = RARITY_MULT[tRarity] || 1;
    
    let curMultHP = 1, projMultHP = 1;
    let curMultDmg = 1, projMultDmg = 1;

    if (typeof setupLevels !== 'undefined') {
        curMultHP = getPetMasteryMult(setupLevels, 'hp');
        curMultDmg = getPetMasteryMult(setupLevels, 'dmg');
    }
    
    if (typeof calcState === 'function') {
        const state = calcState();
        if (state && state.levels) {
            projMultHP = getPetMasteryMult(state.levels, 'hp');
            projMultDmg = getPetMasteryMult(state.levels, 'dmg');
        } else {
            projMultHP = curMultHP; projMultDmg = curMultDmg;
        }
    } else {
        projMultHP = curMultHP; projMultDmg = curMultDmg;
    }

    let finalHp = 0, finalDmg = 0;
    let finalHpProj = 0, finalDmgProj = 0;

    if (base && newLvl > 0) {
        const levelMult = Math.pow(1.02, newLvl - 1);
        const rawHp = (base.hp * rMult) * levelMult;
        const rawDmg = (base.dmg * rMult) * levelMult;
        
        finalHp = Math.round(rawHp * curMultHP);
        finalDmg = Math.round(rawDmg * curMultDmg);

        finalHpProj = Math.round(rawHp * projMultHP);
        finalDmgProj = Math.round(rawDmg * projMultDmg);
    }

    // UI Update
    const resName = document.getElementById('merge-res-name');
    const resHp = document.getElementById('merge-res-hp');
    const resDmg = document.getElementById('merge-res-dmg');
    const resNext = document.getElementById('merge-res-next');
    const resTotal = document.getElementById('merge-res-total');
    const resMax = document.getElementById('merge-res-max');

    if(resName && tName !== "") {
        const RARITY_COLORS = {"Common": "#ecf0f1", "Rare": "#5cd8fe", "Epic": "#5dfe8a", "Legendary": "#fcfe5d", "Ultimate": "#ff5c5d", "Mythic": "#d55cff"};
        const petBgNode = resName.closest('div[style*="border-radius"]') || resName.parentElement.parentElement;
        if (petBgNode) {
            petBgNode.style.backgroundColor = RARITY_COLORS[tRarity] || "#ecf0f1";
            petBgNode.style.border = "none";
        }
        resName.innerText = `${tName} Lv ${newLvl}`;
        resHp.innerHTML = generateStatStringWithIcons(finalHp, finalHpProj, 'icons/icon_hp.png');
        resDmg.innerHTML = generateStatStringWithIcons(finalDmg, finalDmgProj, 'icons/icon_dmg.png');
        
        if (newLvl >= 100) {
            resNext.innerText = "-";
            resTotal.innerText = formatPetStats(grandTotal);
            resMax.innerHTML = "MAX <span style='font-size: 1rem; color: #7f8c8d;'>(100%)</span>";
        } else if (expTable) {
            const nextLvlReq = expTable[newLvl];
            const remainingToNext = nextLvlReq - newExp;
            resNext.innerText = remainingToNext.toLocaleString();
            
            resTotal.innerText = grandTotal.toLocaleString();
            
            const toMax = maxPossible - grandTotal;
            let pct = 0;
            if (maxPossible > 0) pct = (grandTotal / maxPossible) * 100;
            resMax.innerHTML = `${toMax.toLocaleString()} <span style="font-size: 1rem; color: #7f8c8d;">(${pct.toFixed(1)}%)</span>`;
        }
    }
}

function updateMountMergeResult() {
    // 0. Sync the Summoning Exp Cap first!
    updatePetMountExpCap();

    // 1. Handle Fodder "None" Input States Immediately
    const fRaritySel = document.getElementById('mount-fodder-rarity');
    const fLvlInput = document.getElementById('mount-fodder-lvl');
    const fExpInput = document.getElementById('mount-fodder-exp');
    
    if (fRaritySel && fRaritySel.value === "None") {
        if(fLvlInput) { fLvlInput.disabled = true; fLvlInput.value = ""; }
        if(fExpInput) { fExpInput.disabled = true; fExpInput.value = ""; }
    } else if (fRaritySel && fLvlInput && fExpInput) {
        fLvlInput.disabled = false;
        fExpInput.disabled = false;
        if (!fLvlInput.value) fLvlInput.value = 1;
        if (!fExpInput.value) fExpInput.value = 0;
    }

    // 1. Update Exp Max Labels for inputs
    const types = ['target', 'fodder'];
    types.forEach(type => {
        const raritySel = document.getElementById(`mount-${type}-rarity`);
        const lvlInput = document.getElementById(`mount-${type}-lvl`);
        const maxSpan = document.getElementById(`mount-${type}-max`);
        
        if (!raritySel || !lvlInput || !maxSpan) return;

        const rarity = raritySel.value;
        if (rarity === "None") {
            maxSpan.innerText = "0";
            return;
        }

        let lvl = parseInt(lvlInput.value);
        if (isNaN(lvl) || lvl < 1) lvl = 1;
        if (lvl > 100) lvl = 100;

        let maxExp = 0;
        if (MOUNT_EXP_TABLE[rarity]) {
            if (lvl >= 1 && lvl <= 99) maxExp = MOUNT_EXP_TABLE[rarity][lvl];
            else if (lvl >= 100) maxExp = "Max";
        }
        maxSpan.innerText = maxExp === "Max" ? "Max" : maxExp.toLocaleString();
    });

    // 2. CALCULATE MERGE TOTAL (USING SAFE HELPERS)
    const tRarity = getStrValSafe('mount-target-rarity', "Common");
    const tLvl = getIntValSafe('mount-target-lvl', 1);
    const tExp = getIntValSafe('mount-target-exp', 0);
    
    const fRarity = getStrValSafe('mount-fodder-rarity', "None");
    const fLvl = getIntValSafe('mount-fodder-lvl', 1);
    const fExp = getIntValSafe('mount-fodder-exp', 0);

    const bulk = {
        "Common": getIntValSafe('bulk-mount-common', 0),
        "Rare": getIntValSafe('bulk-mount-rare', 0),
        "Epic": getIntValSafe('bulk-mount-epic', 0),
        "Legendary": getIntValSafe('bulk-mount-legendary', 0),
        "Ultimate": getIntValSafe('bulk-mount-ultimate', 0),
        "Mythic": getIntValSafe('bulk-mount-mythic', 0)
    };

    const summonKeyEl = document.getElementById('pet-mount-key');
    const summonKey = summonKeyEl && summonKeyEl.value ? parseFloat(summonKeyEl.value.replace(/,/g, '')) || 0 : 0;
    const summonLv = getIntValSafe('pet-mount-summon-lvl', 1);
    const summonExp = getIntValSafe('pet-mount-summon-exp', 0);

    // Math
    const tRecursive = getRecursiveMountExp(tRarity, tLvl);
    const tTotal = tRecursive + tExp;

    let fTotal = 0;
    let fBaseBonus = 0;
    if (fRarity !== "None") {
        fTotal = getRecursiveMountExp(fRarity, fLvl) + fExp;
        fBaseBonus = MOUNT_FODDER_XP[fRarity] || 0;
    }

    let bulkBonus = 0;
    Object.keys(bulk).forEach(r => {
        bulkBonus += bulk[r] * (MOUNT_FODDER_XP[r] || 0);
    });

    // Track pulls globally for the colorful table
    let mountsPulled = [0, 0, 0, 0, 0, 0];
    let mountsPulledBefore = [0, 0, 0, 0, 0, 0];
    let totalMountsYielded = 0;
    let summonBonus = 0;

    let totalMountsYieldedBefore = 0;
    let summonBonusBefore = 0;
    
    if (summonKey > 0 && typeof calcWarMountPulls === 'function') {
        let costBefore = 0, chanceBefore = 0;
        let costAfter = 0, chanceAfter = 0;

        if (typeof setupLevels !== 'undefined') {
            for(let t=1; t<=5; t++) {
                costBefore += (setupLevels[`power_T${t}_mount_cost`] || 0);
                chanceBefore += (setupLevels[`power_T${t}_mount_chance`] || 0);
            }
        }

        costAfter = costBefore;
        chanceAfter = chanceBefore;

        if (typeof calcState === 'function') {
            const state = calcState();
            if (state && state.levels) {
                costAfter = 0;
                chanceAfter = 0;
                for(let t=1; t<=5; t++) {
                    costAfter += (state.levels[`power_T${t}_mount_cost`] || 0);
                    chanceAfter += (state.levels[`power_T${t}_mount_chance`] || 0);
                }
            }
        }

        const rarities = ["Common", "Rare", "Epic", "Legendary", "Ultimate", "Mythic"];

        const mCostBefore = Math.max(1, Math.ceil(50 * (1 - (costBefore / 100))));
        const mPullsBefore = Math.floor(summonKey / mCostBefore);
        totalMountsYieldedBefore = mPullsBefore * (1 + ((chanceBefore * 2) / 100));
        mountsPulledBefore = calcWarMountPulls(summonLv, summonExp, totalMountsYieldedBefore);
        for(let i=0; i<6; i++) {
            summonBonusBefore += mountsPulledBefore[i] * (MOUNT_FODDER_XP[rarities[i]] || 0);
        }

        const mCostAfter = Math.max(1, Math.ceil(50 * (1 - (costAfter / 100))));
        const mPullsAfter = Math.floor(summonKey / mCostAfter);
        totalMountsYielded = mPullsAfter * (1 + ((chanceAfter * 2) / 100));
        
        mountsPulled = calcWarMountPulls(summonLv, summonExp, totalMountsYielded);
        for(let i=0; i<6; i++) {
            summonBonus += mountsPulled[i] * (MOUNT_FODDER_XP[rarities[i]] || 0);
        }
    }

    const grandTotal = tTotal + fTotal + fBaseBonus + bulkBonus + summonBonus;
    const grandTotalBefore = tTotal + fTotal + fBaseBonus + bulkBonus + summonBonusBefore;

    const expTable = MOUNT_EXP_TABLE[tRarity];
    const maxPossible = getMaxPossibleMountExp(tRarity);
    
    let newLvl = 1; let newExp = 0;
    if (grandTotal >= maxPossible) {
        newLvl = 100; newExp = 0; 
    } else if (expTable) {
        let cum = 0;
        for (let l = 1; l < 100; l++) {
            let needed = expTable[l]; 
            if (grandTotal < (cum + needed)) {
                newLvl = l; newExp = grandTotal - cum; break;
            }
            cum += needed;
            if (l === 99) { newLvl = 100; newExp = 0; }
        }
    }

    let newLvlBefore = 1; let newExpBefore = 0;
    if (grandTotalBefore >= maxPossible) {
        newLvlBefore = 100; newExpBefore = 0; 
    } else if (expTable) {
        let cum = 0;
        for (let l = 1; l < 100; l++) {
            let needed = expTable[l]; 
            if (grandTotalBefore < (cum + needed)) {
                newLvlBefore = l; newExpBefore = grandTotalBefore - cum; break;
            }
            cum += needed;
            if (l === 99) { newLvlBefore = 100; newExpBefore = 0; }
        }
    }

// Stat Calculation
    const baseStat = MOUNT_BASE_STATS[tRarity] || 10;
    const incStat = MOUNT_INC_STATS[tRarity] || 1;
    
    // FORMULA UPDATE: After Lv 42, stat increases by exactly 1% per level.
    // Applies to Rare, Epic, Legendary, Ultimate (and Common/Mythic if they follow suit).
    const getMountRawStat = (rarity, lvl) => {
        const b = MOUNT_BASE_STATS[rarity] || 10;
        const inc = MOUNT_INC_STATS[rarity] || 1;
        const cappedTiers = ["Common", "Rare", "Epic", "Legendary", "Ultimate", "Mythic"]; 
        
        if (cappedTiers.includes(rarity) && lvl > 42) {
             const statAt42 = b + (41 * inc); // Lv 42 is (42-1)*inc = 41*inc
             return statAt42 + (lvl - 42); // +1 per level after 42
        }
        return b + (lvl - 1) * inc;
    };

    let curMultHP = 1, projMultHP = 1;
    let curMultDmg = 1, projMultDmg = 1;

    if (typeof setupLevels !== 'undefined') {
        curMultHP = getMountMasteryMult(setupLevels, 'hp');
        curMultDmg = getMountMasteryMult(setupLevels, 'dmg');
    }
    
    if (typeof calcState === 'function') {
        const state = calcState();
        if (state && state.levels) {
            projMultHP = getMountMasteryMult(state.levels, 'hp');
            projMultDmg = getMountMasteryMult(state.levels, 'dmg');
        } else {
            projMultHP = curMultHP; projMultDmg = curMultDmg;
        }
    } else {
        projMultHP = curMultHP; projMultDmg = curMultDmg;
    }

    let finalHp = 0, finalDmg = 0;
    let finalHpProj = 0, finalDmgProj = 0;

    if (newLvlBefore > 0) {
        const rawStatBefore = getMountRawStat(tRarity, newLvlBefore);
        finalHp = Math.round(rawStatBefore * curMultHP);
        finalDmg = Math.round(rawStatBefore * curMultDmg);
    }

    if (newLvl > 0) {
        const rawStatAfter = getMountRawStat(tRarity, newLvl);
        finalHpProj = Math.round(rawStatAfter * projMultHP);
        finalDmgProj = Math.round(rawStatAfter * projMultDmg);
    }
    // UI Update - Card
    const resName = document.getElementById('mount-merge-res-name');
    const resHp = document.getElementById('mount-merge-res-hp');
    const resDmg = document.getElementById('mount-merge-res-dmg');
    const resNext = document.getElementById('mount-merge-res-next');
    const resTotal = document.getElementById('mount-merge-res-total');
    const resMax = document.getElementById('mount-merge-res-max');

    const formatStatWithPercent = (v1, v2, iconPath) => {
        const s1 = formatPetStats(v1) + "%";
        const s2 = formatPetStats(v2) + "%";
        const iconHtml = `<img src="${iconPath}" style="width: 20px; height: 20px; object-fit: contain; vertical-align: middle;">`;
        
        if (s1 === s2) return `<div style="display:flex; align-items:center; gap:4px; justify-content: flex-end;">${iconHtml}<span>${s1}</span></div>`;
        
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            return `
                <div style="display: flex; flex-direction: column; align-items: flex-end;">
                    <div style="display:flex; align-items:center; gap:4px; margin-bottom: 2px;">${iconHtml}<span>${s1}</span></div>
                    <div style="display:flex; align-items:center; gap:4px; color: #198754;">
                        <span class="calc-arrow">➜</span>${iconHtml}<span style="font-weight: 600;">${s2}</span>
                    </div>
                </div>`;
        }

        return `<div style="display:flex; align-items:center; gap:4px; justify-content: flex-end;">${iconHtml}<span>${s1}</span> <span class="calc-arrow" style="margin: 0 4px;">➜</span> <div style="display:flex; align-items:center; gap:4px; color: #198754;">${iconHtml}<span style="font-weight: 600;">${s2}</span></div></div>`;
    };

    const generateBeforeAfterStrInline = (val1, val2) => {
        if (val1 === val2) return `<div style="display:flex; justify-content: flex-end;"><span>${val1}</span></div>`;
        
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            return `
                <div style="display: flex; flex-direction: column; align-items: flex-end;">
                    <span style="margin-bottom: 2px;">${val1}</span>
                    <div style="display:flex; align-items:center;">
                        <span class="calc-arrow" style="margin-right: 4px; font-size: 0.9em;">➜</span>
                        <span style="color: #198754; font-weight: 650;">${val2}</span>
                    </div>
                </div>`;
        }

        return `<div style="display:flex; align-items:center; justify-content: flex-end;"><span>${val1}</span> <span class="calc-arrow" style="margin: 0 4px; font-size: 0.9em;">➜</span> <span style="color: #198754; font-weight: 650;">${val2}</span></div>`;
    };

    if(resName && tRarity !== "None") {
        const RARITY_COLORS = {"Common": "#ecf0f1", "Rare": "#5cd8fe", "Epic": "#5dfe8a", "Legendary": "#fcfe5d", "Ultimate": "#ff5c5d", "Mythic": "#d55cff"};
        const mountBgNode = resName.closest('div[style*="border-radius"]') || resName.parentElement.parentElement;
        if (mountBgNode) {
            mountBgNode.style.backgroundColor = RARITY_COLORS[tRarity] || "#ecf0f1";
            mountBgNode.style.border = "none"; // <--- This nukes the grey outline!
        }

        if (newLvlBefore === newLvl) {
            resName.innerText = `${tRarity} Lv ${newLvl}`; 
        } else {
            resName.innerHTML = `${tRarity} Lv ${newLvlBefore} <span class="calc-arrow" style="margin: 0 4px; font-size: 0.9em;">➜</span> <span style="color: #198754; font-weight: 800;">${newLvl}</span>`;
        }
        
        resHp.innerHTML = formatStatWithPercent(finalHp, finalHpProj, 'icons/icon_hp.png');
        resDmg.innerHTML = formatStatWithPercent(finalDmg, finalDmgProj, 'icons/icon_dmg.png');
        
        let nextBeforeStr = newLvlBefore >= 100 || !expTable ? "-" : Math.round(expTable[newLvlBefore] - newExpBefore).toLocaleString();
        let nextAfterStr = newLvl >= 100 || !expTable ? "-" : Math.round(expTable[newLvl] - newExp).toLocaleString();
        resNext.innerHTML = generateBeforeAfterStrInline(nextBeforeStr, nextAfterStr);
        
        let totBeforeStr = formatPetStats(Math.round(grandTotalBefore));
        let totAfterStr = formatPetStats(Math.round(grandTotal));
        resTotal.innerHTML = generateBeforeAfterStrInline(totBeforeStr, totAfterStr);
        
        let maxBeforePct = maxPossible > 0 ? ((grandTotalBefore / maxPossible) * 100).toFixed(1) : 0;
        let maxAfterPct = maxPossible > 0 ? ((grandTotal / maxPossible) * 100).toFixed(1) : 0;
        
        let maxBeforeStr = newLvlBefore >= 100 ? "MAX <span style='font-size: 0.9rem; color: #7f8c8d;'>(100%)</span>" : `${formatPetStats(Math.round(maxPossible - grandTotalBefore))} <span style="font-size: 0.9rem; color: #7f8c8d;">(${maxBeforePct}%)</span>`;
        let maxAfterStr = newLvl >= 100 ? "MAX <span style='font-size: 0.9rem; color: #7f8c8d;'>(100%)</span>" : `${formatPetStats(Math.round(maxPossible - grandTotal))} <span style="font-size: 0.9rem; color: #7f8c8d;">(${maxAfterPct}%)</span>`;
        
        resMax.innerHTML = generateBeforeAfterStrInline(maxBeforeStr, maxAfterStr);
    }

    // UI Update - Colorful Summon Table
    const tableContainer = document.getElementById('mount-summon-table-container');
    if (tableContainer) {
        if (summonKey > 0) {
            const RARITIES = ["Common", "Rare", "Epic", "Legendary", "Ultimate", "Mythic"];
            const ROW_COLORS = ['#ecf0f1', '#5cd8fe', '#5dfe8a', '#fcfe5d', '#ff5c5d', '#d55cff'];
            const fontStyle = "font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 1rem; color: #000; -webkit-text-stroke: 0px;";

            const formatSummonVal = (val) => {
                if (val === 0) return "0";
                if (val >= 1000000) return (val / 1000000).toFixed(1) + 'm';
                if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
                if (val >= 10) return val.toFixed(1);
                return val.toFixed(2);
            };

            const generateBeforeAfterStr = (before, after) => {
                const s1 = formatSummonVal(before);
                const s2 = formatSummonVal(after);
                if (s1 === s2) return `<span style="${fontStyle} font-weight: 650;">${s1}</span>`;
                
                const isMobile = window.innerWidth <= 768;
                if (isMobile) {
                    return `
                        <div style="display: flex; flex-direction: column; align-items: flex-end;">
                            <span style="${fontStyle}">${s1}</span>
                            <div style="display:flex; align-items:center;">
                                <span class="calc-arrow" style="margin-right: 4px; font-size: 0.9em;">➜</span>
                                <span style="${fontStyle} color: #198754; font-weight: 650;">${s2}</span>
                            </div>
                        </div>`;
                }

                return `<div style="display:flex; align-items:center;"><span style="${fontStyle}">${s1}</span> <span class="calc-arrow" style="margin: 0 4px; font-size: 0.9em;">➜</span> <span style="${fontStyle} color: #198754; font-weight: 650;">${s2}</span></div>`;
            };

            let tableHtml = `
                <div style="background-color: #f2f2f2; border-radius: 8px; padding: 10px 15px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="${fontStyle}">Mount Summoned</span>
                    ${generateBeforeAfterStr(totalMountsYieldedBefore, totalMountsYielded)}
                </div>
                <div style="background-color: #f2f2f2; border-radius: 8px; padding: 10px 15px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="${fontStyle}">Exp from Mount Summon</span>
                    ${generateBeforeAfterStr(summonBonusBefore, summonBonus)}
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0 15px; margin-bottom: 5px;">
                    <span style="${fontStyle}">Amount</span>
                    <span style="${fontStyle}">Exp</span>
                </div>
            `;

            for (let i = 0; i < 6; i++) {
                let amountBefore = mountsPulledBefore[i];
                let rarityExpBefore = amountBefore * (MOUNT_FODDER_XP[RARITIES[i]] || 0);
                
                let amountAfter = mountsPulled[i];
                let rarityExpAfter = amountAfter * (MOUNT_FODDER_XP[RARITIES[i]] || 0);

                tableHtml += `
                    <div style="background-color: ${ROW_COLORS[i]}; border-radius: 8px; padding: 8px 15px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
                        ${generateBeforeAfterStr(amountBefore, amountAfter)}
                        ${generateBeforeAfterStr(rarityExpBefore, rarityExpAfter)}
                    </div>
                `;
            }
            
            tableContainer.innerHTML = tableHtml;
            tableContainer.style.display = "block";
        } else {
            tableContainer.style.display = "none";
            tableContainer.innerHTML = "";
        }
    }
}