/**
 * DATA.JS
 * Contains all static configuration, game constants, and tree definitions.
 * Loaded first so other scripts can access these variables.
 */

// --- HELPER FUNCTIONS FOR DATA ---
// (These must be defined before TREES because TREES uses them in 'stat' functions)

const formatEggTime = (totalMins) => {
    const h = Math.floor(totalMins / 60);
    const m = Math.floor(totalMins % 60);
    const s = Math.round((totalMins * 60) % 60);

    let parts = [];
    if (h > 0) parts.push(h + "h");
    if (m > 0) parts.push(m + "m");
    if (s > 0) parts.push(s + "s");

    return parts.join(" ") || "0s";
};

const eggStat = (l, b, n) => `Speed +${l * 10}% (${formatEggTime(b / (1 + l * 0.1))})`;


// --- GAME CONSTANTS ---

const tierTimes = {
    1: [5, 10, 20, 40, 80],
    2: [160, 320, 640, 1280, 1433.6],
    3: [1605.6, 1798.3, 2014.1, 2255.8, 2526.5],
    4: [2829.67, 3169.23, 3549.54, 3975.49, 4452.54],
    5: [4986.85, 5585.27, 6255.50, 7006.16, 7846.90]
};

const potionCosts = {
    1: [40, 56, 78, 110, 154],
    2: [215, 301, 422, 590, 826],
    3: [1157, 1319, 1504, 1714, 1954],
    4: [2228, 2540, 2895, 3300, 3763],
    5: [4289, 4890, 5574, 6355, 7244]
};

const forgeLevelData = {
    1: [400, 0.08333], 2: [700, 0.25], 3: [1500, 0.5], 4: [3500, 1], 5: [10000, 2],
    6: [25000, 7.55], 7: [50000, 13.1], 8: [100000, 18.666], 9: [150000, 24.216], 10: [250000, 35],
    11: [337500, 49], 12: [455625, 65], 13: [615094, 85], 14: [830377, 107], 15: [1121008, 129],
    16: [1513361, 151], 17: [2043038, 174], 18: [2758101, 196], 19: [3723436, 218], 20: [5026639, 240.88],
    21: [6785963, 263.1], 22: [9161050, 285.32], 23: [12367417, 307.54], 24: [16696013, 329.76], 25: [20035215, 351.98],
    26: [24042258, 374.2], 27: [28850710, 396.42], 28: [34620852, 418.64], 29: [41545022, 440.86], 30: [49854027, 463.08],
    31: [59824832, 485.3], 32: [71789799, 507.52], 33: [86147759, 529.74], 34: [103377310, 551.96]
};

const bracketFloors = [1, 6, 11, 16, 21, 26, 31, 36, 41, 46, 51, 56, 61, 66, 71, 76, 81, 86, 91, 96, 101, 106, 111, 116, 121, 126, 131, 136, 141, 146];

const EGG_POINTS = {
    'common': 250,
    'rare': 1000,
    'epic': 2000,
    'legendary': 4000,
    'ultimate': 8000,
    'mythic': 16000
};

const EGG_DATA = {
    common: { n: "Common", t: 30, id: "egg1", img: "icons/EggCommon.png", c: "common" },
    rare: { n: "Rare", t: 120, id: "egg2", img: "icons/EggRare.png", c: "rare" },
    epic: { n: "Epic", t: 240, id: "egg3", img: "icons/EggEpic.png", c: "epic" },
    legendary: { n: "Legendary", t: 480, id: "egg4", img: "icons/EggLegendary.png", c: "legendary" },
    ultimate: { n: "Ultimate", t: 960, id: "egg5", img: "icons/EggUltimate.png", c: "ultimate" },
    mythic: { n: "Mythic", t: 1920, id: "egg6", img: "icons/EggMythic.png", c: "mythic" }
};


// --- MAIN TECH TREE STRUCTURE ---

const TREES = {
    forge: {
        name: "Forge", colorClass: "active-forge", maxLevels: 230,
        structure: [
            { id: "timer", r: 0, c: 0 }, { id: "disc", r: 0, c: 1 }, { id: "sell", r: 1, c: 0.5 },
            { id: "h_bonus", r: 2, c: 0 }, { id: "c_bonus", r: 2, c: 1 }, { id: "auto", r: 3, c: 0.5 },
            { id: "free", r: 4, c: 0.5 }, { id: "max", r: 5, c: 0.5 }, { id: "off_c", r: 6, c: 0 }, { id: "off_h", r: 6, c: 1 }
        ],
        meta: {
            timer: { n: "Forge Timer", p: [], m: 5, stat: l => `Speed +${l * 4}%` },
            disc: { n: "Forge Disc", p: [], m: 5, stat: l => `Cost -${l * 2}%` },
            sell: { n: "Eq. Sell Price", p: ["timer", "disc"], m: 5, stat: l => `Price +${l * 2}%` },
            h_bonus: { n: "Thief Hammer Bonus", p: ["sell"], m: 5, stat: l => `Bonus +${l * 2}%` },
            c_bonus: { n: "Thief Coin Bonus", p: ["sell"], m: 5, stat: l => `Bonus +${l * 2}%` },
            auto: { n: "Auto Forge", p: ["h_bonus", "c_bonus"], m: 1, stat: l => `Hammers +${l}` },
            free: { n: "Free Forge Chance", p: ["auto"], m: 5, stat: l => `Chance +${l}%` },
            max: {
                n: "Max Offline Timer", // UPDATED: Name
                p: ["free"], 
                m: 5, 
                stat: (l) => {
                    // 1. Calculate Time
                    const p = l * 16;
                    const m = 240 * (1 + p / 100);
                    const h = Math.floor(m / 60);
                    const min = Math.round(m % 60);

                    // 2. Calculate Rates (Look up global setupLevels for context)
                    let cLvl = 0, hLvl = 0;
                    if (typeof setupLevels !== 'undefined') {
                        for (let t = 1; t <= 5; t++) {
                            cLvl += (setupLevels[`forge_T${t}_off_c`] || 0);
                            hLvl += (setupLevels[`forge_T${t}_off_h`] || 0);
                        }
                    }
                    
                    // Gold Rate (1/s base + 2% per lvl)
                    const goldRate = 1 * (1 + (cLvl * 2) / 100);
                    const totalGold = (m * 60) * goldRate;
                    
                    // Hammer Rate (1/m base + 2% per lvl)
                    const hammerRate = 1 * (1 + (hLvl * 2) / 100);
                    const totalHammer = m * hammerRate;

                    // 3. Format
                    const fmt = (v, t) => (typeof formatResourceValue === 'function') ? formatResourceValue(v, t) : Math.round(v);

                    return `Time +${p}% (${h}h ${min}m | <img src="icons/fm_gold.png" class="stat-key-icon"> ${fmt(totalGold, 'gold')} | <img src="icons/fm_hammer.png" class="stat-key-icon"> ${fmt(totalHammer, 'hammer')})`;
                }
            },
            off_c: {
                n: "Offline Coin", p: ["max"], m: 5, stat: (l) => {
                    const p = l * 2;
                    const r = 1 * (1 + p / 100);
                    const d = r * 86400;
                    if (l === 0) return `Bonus +0% (1 <img src="icons/fm_gold.png" class="stat-key-icon">/s | 86.4k <img src="icons/fm_gold.png" class="stat-key-icon">/d)`;
                    const rStr = r.toFixed(2);
                    const dStr = (d / 1000).toFixed(1) + 'k';
                    return `Bonus +${p}% (${rStr} <img src="icons/fm_gold.png" class="stat-key-icon">/s | ${dStr} <img src="icons/fm_gold.png" class="stat-key-icon">/d)`;
                }
            },
            off_h: {
                n: "Offline Hammer", p: ["max"], m: 5, stat: (l) => {
                    const p = l * 2;
                    const r = 1 * (1 + p / 100);
                    const d = r * 1440;
                    if (l === 0) return `Bonus +0% (1 <img src="icons/fm_hammer.png" class="stat-key-icon">/m | 1440 <img src="icons/fm_hammer.png" class="stat-key-icon">/d)`;
                    const rStr = r.toFixed(2);
                    const dStr = d.toFixed(1);
                    return `Bonus +${p}% (${rStr} <img src="icons/fm_hammer.png" class="stat-key-icon">/m | ${dStr} <img src="icons/fm_hammer.png" class="stat-key-icon">/d)`;
                }
            }
        }
    },
    spt: {
        name: "Skills, Pets & Tech", colorClass: "active-spt", maxLevels: 425,
        structure: [
            { id: "timer", r: 0, c: 0.5 }, { id: "skill_dmg", r: 1, c: 0.5 },
            { id: "skill_pd", r: 2, c: 0 }, { id: "skill_ph", r: 2, c: 1 }, { id: "disc", r: 3, c: 0.5 },
            { id: "pet_dmg", r: 4, c: 0 }, { id: "pet_hp", r: 4, c: 1 }, { id: "ticket", r: 5, c: 0.5 },
            { id: "egg1", r: 6, c: 0 }, { id: "egg2", r: 6, c: 1 }, { id: "egg3", r: 7, c: 0 }, { id: "egg4", r: 7, c: 1 },
            { id: "egg5", r: 8, c: 0 }, { id: "egg6", r: 8, c: 1 }, { id: "lucky", r: 9, c: 0.5 },
            { id: "key_g", r: 10, c: 0 }, { id: "key_r", r: 10, c: 1 }
        ],
        meta: {
            timer: { n: "Tech Research Timer", p: [], m: 5, speed: 0.04, stat: l => `Speed +${l * 4}%` },
            skill_dmg: { n: "Skill Damage", p: ["timer"], m: 5, stat: l => `Dmg +${l * 2}%` },
            skill_pd: { n: "Skill Passive Dmg", p: ["skill_dmg"], m: 5, stat: l => `Base Dmg +${l * 2}%` },
            skill_ph: { n: "Skill Passive HP", p: ["skill_dmg"], m: 5, stat: l => `Base HP +${l * 2}%` },
            disc: { n: "Tech Upgrade Cost", p: ["skill_pd", "skill_ph"], m: 5, stat: l => `Cost -${l * 2}%`, isDiscount: true },
            pet_dmg: { n: "Pet Dmg Mastery", p: ["disc"], m: 5, stat: l => `Bonus Dmg +${l * 2}%` },
            pet_hp: { n: "Pet HP Mastery", p: ["disc"], m: 5, stat: l => `Bonus HP +${l * 2}%` },
            ticket: {
                n: "Skill Summon Cost", p: ["pet_dmg", "pet_hp"], m: 5, stat: (l) => {
                    const p = l * 1;
                    const v = 200 * (1 - p / 100);
                    return `Cost -${p}% (${Math.round(v)}<img src="icons/green_ticket.png" class="stat-key-icon">)`;
                }
            },
            egg1: { n: "Common Egg Timer", p: ["ticket"], m: 5, stat: l => eggStat(l, 30) },
            egg2: { n: "Rare Egg Timer", p: ["ticket"], m: 5, stat: l => eggStat(l, 120) },
            egg3: { n: "Epic Egg Timer", p: ["egg1"], m: 5, stat: l => eggStat(l, 240) },
            egg4: { n: "Legendary Egg Timer", p: ["egg2"], m: 5, stat: l => eggStat(l, 480) },
            egg5: { n: "Ultimate Egg Timer", p: ["egg3"], m: 5, stat: l => eggStat(l, 960) },
            egg6: { n: "Mythic Egg Timer", p: ["egg4"], m: 5, stat: l => eggStat(l, 1920) },
            lucky: { n: "Invasion Egg", p: ["egg5", "egg6"], m: 5, stat: l => `Chance +${l * 4}%` },
            key_g: { n: "Ghost Town Ticket", p: ["lucky"], m: 5, stat: l => `Drop +${l}%` },
            key_r: { n: "Zombie Rush Potion", p: ["lucky"], m: 5, stat: l => `Drop +${l * 2}%` }
        }
    },
    power: {
        name: "Power", colorClass: "active-power", maxLevels: 500,
        structure: [
            { id: "weapon_1", r: 0, c: 0 }, { id: "helmet_1", r: 0, c: 1 },
            { id: "gloves_1", r: 1, c: 0 }, { id: "armor_1", r: 1, c: 1 },
            { id: "necklace_1", r: 2, c: 0 }, { id: "boots_1", r: 2, c: 1 },
            { id: "ring_1", r: 3, c: 0 }, { id: "belt_1", r: 3, c: 1 },
            { id: "mount_dmg", r: 4, c: 0.5 }, { id: "mount_hp", r: 5, c: 0.5 },
            { id: "weapon_2", r: 6, c: 0 }, { id: "helmet_2", r: 6, c: 1 },
            { id: "gloves_2", r: 7, c: 0 }, { id: "armor_2", r: 7, c: 1 },
            { id: "necklace_2", r: 8, c: 0 }, { id: "boots_2", r: 8, c: 1 },
            { id: "ring_2", r: 9, c: 0 }, { id: "belt_2", r: 9, c: 1 },
            { id: "mount_cost", r: 10, c: 0.5 }, { id: "mount_chance", r: 11, c: 0.5 }
        ],
        meta: {
            weapon_1: { n: "Weapon Mastery", p: [], m: 5, stat: l => `Dmg +${l * 2}%` },
            helmet_1: { n: "Helmet Mastery", p: [], m: 5, stat: l => `HP +${l * 2}%` },
            gloves_1: { n: "Gloves Mastery", p: ["weapon_1"], m: 5, stat: l => `Dmg +${l * 2}%` },
            armor_1: { n: "Body Mastery", p: ["helmet_1"], m: 5, stat: l => `HP +${l * 2}%` },
            necklace_1: { n: "Necklace Mastery", p: ["gloves_1"], m: 5, stat: l => `Dmg +${l * 2}%` },
            boots_1: { n: "Shoe Mastery", p: ["armor_1"], m: 5, stat: l => `HP +${l * 2}%` },
            ring_1: { n: "Ring Mastery", p: ["necklace_1"], m: 5, stat: l => `Dmg +${l * 2}%` },
            belt_1: { n: "Belt Mastery", p: ["boots_1"], m: 5, stat: l => `HP +${l * 2}%` },
            mount_dmg: { n: "Mount Dmg", p: ["ring_1", "belt_1"], m: 5, stat: l => `Dmg +${l * 2}%` },
            mount_hp: { n: "Mount HP", p: ["mount_dmg"], m: 5, stat: l => `HP +${l * 2}%` },
            weapon_2: { n: "Weapon Lv Up", p: ["mount_hp"], m: 5, stat: l => `Max Level ${99 + l * 2}`, isSlot: true, base: 99 },
            helmet_2: { n: "Helmet Lv Up", p: ["mount_hp"], m: 5, stat: l => `Max Level ${99 + l * 2}`, isSlot: true, base: 99 },
            gloves_2: { n: "Gloves Lv Up", p: ["weapon_2"], m: 5, stat: l => `Max Level ${99 + l * 2}`, isSlot: true, base: 99 },
            armor_2: { n: "Body Lv Up", p: ["helmet_2"], m: 5, stat: l => `Max Level ${99 + l * 2}`, isSlot: true, base: 99 },
            necklace_2: { n: "Necklace Lv Up", p: ["gloves_2"], m: 5, stat: l => `Max Level ${99 + l * 2}`, isSlot: true, base: 99 },
            boots_2: { n: "Shoe Lv Up", p: ["armor_2"], m: 5, stat: l => `Max Level ${99 + l * 2}`, isSlot: true, base: 99 },
            ring_2: { n: "Ring Lv Up", p: ["necklace_2"], m: 5, stat: l => `Max Level ${99 + l * 2}`, isSlot: true, base: 99 },
            belt_2: { n: "Belt Lv Up", p: ["boots_2"], m: 5, stat: l => `Max Level ${99 + l * 2}`, isSlot: true, base: 99 },
            mount_cost: {
                n: "Mount Summon Cost", p: ["ring_2", "belt_2"], m: 5,
                stat: (l) => {
                    const p = l * 1; const v = Math.ceil(50 * (1 - p / 100));
                    return `Cost -${p}% (${v} <img src="icons/mount_key.png" class="stat-key-icon">)`;
                }
            },
            mount_chance: { n: "Mount Chance", p: ["mount_cost"], m: 5, stat: l => `Chance +${l * 2}%` }
        }
    }
};