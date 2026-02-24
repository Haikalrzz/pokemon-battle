// ============================================================
// CONFIG
// ============================================================
const CONFIG = {
    BLE_ENABLED: true,
    DEBUG_MODE: true,
    // Your Arduino BLE details - fill these in from your friend
    BLE_SERVICE_UUID: "YOUR_SERVICE_UUID_HERE",         // e.g. "12345678-1234-1234-1234-123456789abc"
    BLE_CHARACTERISTIC_UUID: "YOUR_CHARACTERISTIC_UUID_HERE", // e.g. "87654321-4321-4321-4321-cba987654321"
    BLE_DEVICE_NAME: "Nano 33 BLE"                     // Change if your Arduino has a different name
};

// ============================================================
// BLE MANAGER (Capacitor BLE Plugin)
// ============================================================
const BLEManager = {
    connected: false,
    deviceId: null,
    scanning: false,

    // Check if Capacitor BLE plugin is available
    isAvailable: function () {
        return window.BleClient !== undefined;
    },

    // Request permissions (required on Android)
    requestPermissions: async function () {
        try {
            if (this.isAvailable()) {
                await window.BleClient.initialize();
                if (CONFIG.DEBUG_MODE) console.log("[BLE] Permissions granted");
                return true;
            }
            return false;
        } catch (e) {
            console.error("[BLE] Permission error:", e);
            return false;
        }
    },

    // Scan and connect to Arduino
    connect: async function () {
        if (!this.isAvailable()) {
            UI.showBLEStatus("BLE not available on this device", "error");
            return false;
        }

        try {
            UI.showBLEStatus("Scanning for Arduino...", "scanning");
            this.scanning = true;

            // Initialize BLE
            await window.BleClient.initialize();

            // Request device - shows native OS picker popup
            const device = await window.BleClient.requestDevice({
                services: [CONFIG.BLE_SERVICE_UUID],
                optionalServices: []
            });

            if (!device) {
                UI.showBLEStatus("No device selected", "error");
                return false;
            }

            this.deviceId = device.deviceId;
            UI.showBLEStatus("Connecting...", "scanning");

            // Connect to device
            await window.BleClient.connect(this.deviceId, (deviceId) => {
                // This callback fires if device disconnects unexpectedly
                this.onDisconnect(deviceId);
            });

            // Start receiving gesture notifications
            await window.BleClient.startNotifications(
                this.deviceId,
                CONFIG.BLE_SERVICE_UUID,
                CONFIG.BLE_CHARACTERISTIC_UUID,
                (value) => {
                    this.onGestureReceived(value);
                }
            );

            this.connected = true;
            this.scanning = false;
            UI.showBLEStatus("Arduino Connected ✓", "connected");
            UI.updateConnectButton(true);

            if (CONFIG.DEBUG_MODE) console.log("[BLE] Connected to:", device.deviceId);
            return true;

        } catch (e) {
            this.connected = false;
            this.scanning = false;
            UI.showBLEStatus("Connection failed. Try again.", "error");
            UI.updateConnectButton(false);
            console.error("[BLE] Connect error:", e);
            return false;
        }
    },

    // Disconnect from Arduino
    disconnect: async function () {
        try {
            if (this.deviceId) {
                await window.BleClient.stopNotifications(
                    this.deviceId,
                    CONFIG.BLE_SERVICE_UUID,
                    CONFIG.BLE_CHARACTERISTIC_UUID
                );
                await window.BleClient.disconnect(this.deviceId);
            }
        } catch (e) {
            console.error("[BLE] Disconnect error:", e);
        }
        this.connected = false;
        this.deviceId = null;
        UI.showBLEStatus("Disconnected", "error");
        UI.updateConnectButton(false);
    },

    // Called when Arduino disconnects unexpectedly
    onDisconnect: function (deviceId) {
        if (CONFIG.DEBUG_MODE) console.log("[BLE] Device disconnected:", deviceId);
        this.connected = false;
        this.deviceId = null;
        UI.showBLEStatus("Arduino disconnected!", "error");
        UI.updateConnectButton(false);
    },

    // Called when Arduino sends a gesture
    onGestureReceived: function (value) {
        try {
            // Decode the BLE data value to a string
            const decoder = new TextDecoder();
            const gesture = decoder.decode(value).trim().toUpperCase();

            if (CONFIG.DEBUG_MODE) console.log("[BLE] Gesture received:", gesture);

            // Map O, Z, N, L to attack indices
            // Z = Attack 1 (index 0) - highest damage
            // O = Attack 2 (index 1) - medium-high damage
            // N = Attack 3 (index 2) - medium damage
            // L = Attack 4 (index 3) - quick attack
            const gestureMap = {
                "Z": 0,
                "O": 1,
                "N": 2,
                "L": 3
            };

            const attackIndex = gestureMap[gesture];

            if (attackIndex !== undefined) {
                if (GameState.currentScreen === "battle" && !GameState.battleEnded && GameState.playerTurn) {
                    Battle.playerAttack(attackIndex);
                }
            } else {
                if (CONFIG.DEBUG_MODE) console.log("[BLE] Unknown gesture:", gesture);
            }
        } catch (e) {
            console.error("[BLE] Error processing gesture:", e);
        }
    }
};

// ============================================================
// POKÉMON DATA
// ============================================================
const POKEMON_DATA = {
    // DAY POKÉMON (7AM - 5PM)
    pikachu: {
        name: "PIKACHU",
        type: ["Electric"],
        hp: 100,
        spriteFront: "Pictures/pikachu-front.png",
        spriteBack: "Pictures/pikachu-back.png",
        timeOfDay: "day",
        attacks: [
            { name: "THUNDER", type: "Electric", damage: 25, key: "Z" },
            { name: "T-SHOCK", type: "Electric", damage: 20, key: "O" },
            { name: "IRON-T", type: "Steel", damage: 18, key: "N" },
            { name: "QUICK-A", type: "Normal", damage: 15, key: "L" }
        ]
    },
    charizard: {
        name: "CHARIZARD",
        type: ["Fire", "Flying"],
        hp: 120,
        spriteFront: "Pictures/charizard-front.png",
        spriteBack: "Pictures/charizard-back.png",
        timeOfDay: "day",
        attacks: [
            { name: "FLAME-T", type: "Fire", damage: 30, key: "Z" },
            { name: "FIRE-SP", type: "Fire", damage: 22, key: "O" },
            { name: "DRAG-CL", type: "Dragon", damage: 20, key: "N" },
            { name: "AIR-SLA", type: "Flying", damage: 24, key: "L" }
        ]
    },
    jolteon: {
        name: "JOLTEON",
        type: ["Electric"],
        hp: 110,
        spriteFront: "Pictures/jolteon-front.png",
        spriteBack: "Pictures/jolteon-back.png",
        timeOfDay: "day",
        attacks: [
            { name: "T-BOLT", type: "Electric", damage: 28, key: "Z" },
            { name: "DISCHARGE", type: "Electric", damage: 24, key: "O" },
            { name: "PIN-MIS", type: "Bug", damage: 20, key: "N" },
            { name: "QUICK-A", type: "Normal", damage: 16, key: "L" }
        ]
    },
    dragonite: {
        name: "DRAGONITE",
        type: ["Dragon", "Flying"],
        hp: 130,
        spriteFront: "Pictures/dragonite-front.png",
        spriteBack: "Pictures/dragonite-back.png",
        timeOfDay: "day",
        attacks: [
            { name: "OUTRAGE", type: "Dragon", damage: 32, key: "Z" },
            { name: "DRAG-CL", type: "Dragon", damage: 26, key: "O" },
            { name: "WING-AT", type: "Flying", damage: 22, key: "N" },
            { name: "SLAM", type: "Normal", damage: 20, key: "L" }
        ]
    },

    // NIGHT POKÉMON (5PM - 7AM)
    gengar: {
        name: "GENGAR",
        type: ["Ghost", "Poison"],
        hp: 110,
        spriteFront: "Pictures/gengar-front.png",
        spriteBack: "Pictures/gengar-back.png",
        timeOfDay: "night",
        attacks: [
            { name: "SHAD-BA", type: "Ghost", damage: 28, key: "Z" },
            { name: "DARK-PU", type: "Dark", damage: 22, key: "O" },
            { name: "SLUDGE", type: "Poison", damage: 24, key: "N" },
            { name: "SHAD-PU", type: "Ghost", damage: 20, key: "L" }
        ]
    },
    mewtwo: {
        name: "MEWTWO",
        type: ["Psychic"],
        hp: 130,
        spriteFront: "Pictures/mewtwo-front.png",
        spriteBack: "Pictures/mewtwo-back.png",
        timeOfDay: "night",
        attacks: [
            { name: "PSYSTRI", type: "Psychic", damage: 32, key: "Z" },
            { name: "PSYCHIC", type: "Psychic", damage: 26, key: "O" },
            { name: "AURA-SP", type: "Fighting", damage: 24, key: "N" },
            { name: "SHAD-BA", type: "Ghost", damage: 22, key: "L" }
        ]
    },
    hypno: {
        name: "HYPNO",
        type: ["Psychic"],
        hp: 120,
        spriteFront: "Pictures/hypno-front.png",
        spriteBack: "Pictures/hypno-back.png",
        timeOfDay: "night",
        attacks: [
            { name: "PSYCHIC", type: "Psychic", damage: 28, key: "Z" },
            { name: "PSYBEAM", type: "Psychic", damage: 22, key: "O" },
            { name: "CONFUSE", type: "Psychic", damage: 18, key: "N" },
            { name: "HEADBUT", type: "Normal", damage: 20, key: "L" }
        ]
    },
    alakazam: {
        name: "ALAKAZAM",
        type: ["Psychic"],
        hp: 100,
        spriteFront: "Pictures/alakazam-front.png",
        spriteBack: "Pictures/alakazam-back.png",
        timeOfDay: "night",
        attacks: [
            { name: "PSYSTRI", type: "Psychic", damage: 30, key: "Z" },
            { name: "PSYCHIC", type: "Psychic", damage: 24, key: "O" },
            { name: "PSYBEAM", type: "Psychic", damage: 20, key: "N" },
            { name: "CONFUSE", type: "Psychic", damage: 16, key: "L" }
        ]
    },

    // ENEMY POKÉMON
    gastly: {
        name: "GASTLY",
        type: ["Ghost", "Poison"],
        hp: 80,
        spriteFront: "Pictures/gastly-front.png",
        attacks: [
            { name: "LICK", type: "Ghost", damage: 16 },
            { name: "NIGHT-S", type: "Ghost", damage: 20 },
            { name: "SHAD-BA", type: "Ghost", damage: 24 },
            { name: "DARK-PU", type: "Dark", damage: 22 }
        ]
    },
    haunter: {
        name: "HAUNTER",
        type: ["Ghost", "Poison"],
        hp: 100,
        spriteFront: "Pictures/haunter-front.png",
        attacks: [
            { name: "SHAD-PU", type: "Ghost", damage: 20 },
            { name: "NIGHT-S", type: "Ghost", damage: 22 },
            { name: "SHAD-BA", type: "Ghost", damage: 26 },
            { name: "HEX", type: "Ghost", damage: 24 }
        ]
    },
    gengar_enemy: {
        name: "GENGAR",
        type: ["Ghost", "Poison"],
        hp: 110,
        spriteFront: "Pictures/gengar-front.png",
        attacks: [
            { name: "SHAD-BA", type: "Ghost", damage: 26 },
            { name: "HEX", type: "Ghost", damage: 22 },
            { name: "SHAD-PU", type: "Ghost", damage: 20 },
            { name: "DARK-PU", type: "Dark", damage: 24 }
        ]
    },
    arcanine: {
        name: "ARCANINE",
        type: ["Fire"],
        hp: 120,
        spriteFront: "Pictures/arcanine-front.png",
        attacks: [
            { name: "FLAME-W", type: "Fire", damage: 28 },
            { name: "FIRE-FN", type: "Fire", damage: 24 },
            { name: "BITE", type: "Dark", damage: 20 },
            { name: "TAKE-DN", type: "Normal", damage: 22 }
        ]
    },
    gyarados: {
        name: "GYARADOS",
        type: ["Water", "Flying"],
        hp: 130,
        spriteFront: "Pictures/gyarados-front.png",
        attacks: [
            { name: "HYDRO-P", type: "Water", damage: 30 },
            { name: "AQUA-TA", type: "Water", damage: 26 },
            { name: "BITE", type: "Dark", damage: 22 },
            { name: "THRASH", type: "Normal", damage: 24 }
        ]
    }
};

// ============================================================
// TYPE EFFECTIVENESS
// ============================================================
const TYPE_CHART = {
    Fire: { strong: ["Grass", "Steel", "Bug", "Ice"], weak: ["Water", "Rock", "Ground"], immune: [] },
    Water: { strong: ["Fire", "Ground", "Rock"], weak: ["Grass", "Electric"], immune: [] },
    Electric: { strong: ["Water", "Flying"], weak: ["Grass", "Electric", "Dragon"], immune: ["Ground"] },
    Grass: { strong: ["Water", "Ground", "Rock"], weak: ["Fire", "Flying", "Poison", "Bug", "Ice"], immune: [] },
    Psychic: { strong: ["Fighting", "Poison"], weak: ["Psychic", "Steel"], immune: ["Dark"] },
    Dark: { strong: ["Psychic", "Ghost"], weak: ["Fighting", "Dark", "Bug"], immune: [] },
    Ghost: { strong: ["Ghost", "Psychic"], weak: ["Dark", "Ghost"], immune: ["Normal"] },
    Steel: { strong: ["Rock", "Ice", "Fairy"], weak: ["Fire", "Fighting", "Ground"], immune: [] },
    Fighting: { strong: ["Normal", "Steel", "Dark", "Ice", "Rock"], weak: ["Flying", "Psychic", "Fairy"], immune: ["Ghost"] },
    Normal: { strong: [], weak: ["Fighting"], immune: ["Ghost"] },
    Flying: { strong: ["Grass", "Fighting", "Bug"], weak: ["Electric", "Rock", "Ice"], immune: ["Ground"] },
    Poison: { strong: ["Grass", "Fairy"], weak: ["Ground", "Psychic"], immune: [] },
    Dragon: { strong: ["Dragon"], weak: ["Ice", "Dragon", "Fairy"], immune: [] },
    Bug: { strong: ["Grass", "Psychic", "Dark"], weak: ["Fire", "Flying", "Rock"], immune: [] },
    Ice: { strong: ["Grass", "Ground", "Flying", "Dragon"], weak: ["Fire", "Fighting", "Rock", "Steel"], immune: [] }
};

// ============================================================
// GAME STATE
// ============================================================
const GameState = {
    currentScreen: "menu",
    selectedOpponent: null,
    selectedPlayer: null,
    playerPokemon: null,
    enemyPokemon: null,
    battleLog: [],
    playerTurn: true,
    battleEnded: false,
    currentTimeOfDay: null
};

// ============================================================
// TIME MANAGEMENT
// ============================================================
function getCurrentTimeOfDay() {
    const hour = new Date().getHours();
    return (hour >= 7 && hour < 17) ? "day" : "night";
}

function getTimeSlotName() {
    return getCurrentTimeOfDay() === "day" ? "Day Time" : "Night Time";
}

function getAvailablePlayerPokemon() {
    const timeOfDay = getCurrentTimeOfDay();
    return Object.keys(POKEMON_DATA).filter(key => POKEMON_DATA[key].timeOfDay === timeOfDay);
}

function selectRandomOpponent() {
    const enemies = ["gastly", "haunter", "gengar_enemy", "arcanine", "gyarados"];
    return enemies[Math.floor(Math.random() * enemies.length)];
}

// ============================================================
// BATTLE ENGINE
// ============================================================
const Battle = {
    calculateDamage: function (attacker, defender, attack) {
        let damage = attack.damage;
        const attackType = attack.type;

        defender.type.forEach(defenderType => {
            const typeData = TYPE_CHART[attackType];
            if (typeData) {
                if (typeData.strong.includes(defenderType)) {
                    damage *= 2;
                    if (CONFIG.DEBUG_MODE) console.log("[BATTLE] Super effective! (2x)");
                }
                if (typeData.weak.includes(defenderType)) {
                    damage *= 0.5;
                    if (CONFIG.DEBUG_MODE) console.log("[BATTLE] Not very effective... (0.5x)");
                }
                if (typeData.immune.includes(defenderType)) {
                    damage = 0;
                    if (CONFIG.DEBUG_MODE) console.log("[BATTLE] No effect!");
                }
            }
        });

        const variance = 0.85 + Math.random() * 0.15;
        return Math.max(1, Math.floor(damage * variance));
    },

    playerAttack: function (attackIndex) {
        if (GameState.battleEnded || !GameState.playerTurn) return;

        const attack = GameState.playerPokemon.attacks[attackIndex];
        const damage = this.calculateDamage(GameState.playerPokemon, GameState.enemyPokemon, attack);

        UI.animateAttack("player");
        setTimeout(() => {
            GameState.enemyPokemon.currentHp = Math.max(0, GameState.enemyPokemon.currentHp - damage);
            UI.animateDamage("enemy");
            UI.updateHP("enemy");
            UI.updateBattleLog(`${GameState.playerPokemon.name}<br>used ${attack.name}!`);

            if (GameState.enemyPokemon.currentHp === 0) {
                setTimeout(() => this.endBattle(true), 1500);
            } else {
                GameState.playerTurn = false;
                setTimeout(() => this.enemyAttack(), 1500);
            }
        }, 500);
    },

    enemyAttack: function () {
        if (GameState.battleEnded) return;

        const randomAttack = GameState.enemyPokemon.attacks[
            Math.floor(Math.random() * GameState.enemyPokemon.attacks.length)
        ];
        const damage = this.calculateDamage(GameState.enemyPokemon, GameState.playerPokemon, randomAttack);

        UI.animateAttack("enemy");
        setTimeout(() => {
            GameState.playerPokemon.currentHp = Math.max(0, GameState.playerPokemon.currentHp - damage);
            UI.animateDamage("player");
            UI.updateHP("player");
            UI.updateBattleLog(`Enemy ${GameState.enemyPokemon.name}<br>used ${randomAttack.name}!`);

            if (GameState.playerPokemon.currentHp === 0) {
                setTimeout(() => this.endBattle(false), 1500);
            } else {
                GameState.playerTurn = true;
                setTimeout(() => {
                    UI.updateBattleLog(`What will<br>${GameState.playerPokemon.name} do?`);
                }, 1500);
            }
        }, 500);
    },

    endBattle: function (playerWon) {
        GameState.battleEnded = true;
        setTimeout(() => {
            UI.showEndScreen(playerWon);
            this.saveBattleResult(playerWon);
        }, 1000);
    },

    saveBattleResult: function (playerWon) {
        try {
            const battleHistory = JSON.parse(localStorage.getItem("battleHistory") || "[]");
            battleHistory.push({
                timestamp: new Date().toISOString(),
                player: GameState.playerPokemon.name,
                opponent: GameState.enemyPokemon.name,
                result: playerWon ? "win" : "loss",
                timeOfDay: GameState.currentTimeOfDay
            });
            localStorage.setItem("battleHistory", JSON.stringify(battleHistory));
            if (CONFIG.DEBUG_MODE) console.log("[BATTLE LOG] Saved to localStorage");
        } catch (e) {
            console.error("[ERROR] Failed to save battle:", e);
        }
    }
};

// ============================================================
// UI CONTROLLER
// ============================================================
const UI = {
    showScreen: function (screenId) {
        document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
        document.getElementById(`screen-${screenId}`).classList.add("active");
        GameState.currentScreen = screenId;
    },

    // Update the BLE status text on the main menu
    showBLEStatus: function (message, state) {
        const el = document.getElementById("ble-status");
        if (!el) return;
        el.textContent = message;
        el.className = "ble-status " + state; // 'scanning', 'connected', 'error'
    },

    // Update the Connect button text based on connection state
    updateConnectButton: function (connected) {
        const btn = document.getElementById("btn-connect");
        if (!btn) return;
        if (connected) {
            btn.textContent = "✓ CONNECTED";
            btn.classList.add("connected");
        } else {
            btn.textContent = "▶ CONNECT ARDUINO";
            btn.classList.remove("connected");
        }
    },

    renderPokemonSelection: function () {
        const grid = document.getElementById("pokemon-grid");
        grid.innerHTML = "";

        getAvailablePlayerPokemon().forEach(key => {
            const pokemon = POKEMON_DATA[key];
            const card = document.createElement("div");
            card.className = "pokemon-card";
            card.onclick = () => this.selectPlayerPokemon(key, card);

            const spriteDiv = document.createElement("div");
            spriteDiv.className = "card-sprite";
            spriteDiv.style.backgroundImage = `url('${pokemon.spriteFront}')`;

            card.innerHTML = `
                <div class="card-name">${pokemon.name}</div>
                <div class="card-hp">HP: ${pokemon.hp}</div>
            `;
            card.insertBefore(spriteDiv, card.firstChild);
            grid.appendChild(card);
        });
    },

    selectPlayerPokemon: function (pokemonKey, cardElement) {
        document.querySelectorAll(".pokemon-card").forEach(c => c.classList.remove("selected"));
        cardElement.classList.add("selected");
        GameState.selectedPlayer = pokemonKey;
        document.getElementById("btn-start-battle").disabled = false;
    },

    setupBattle: function () {
        const playerData = POKEMON_DATA[GameState.selectedPlayer];
        GameState.playerPokemon = { ...playerData, currentHp: playerData.hp, maxHp: playerData.hp };

        const enemyData = POKEMON_DATA[GameState.selectedOpponent];
        GameState.enemyPokemon = { ...enemyData, currentHp: enemyData.hp, maxHp: enemyData.hp };

        document.getElementById("player-name-battle").textContent = GameState.playerPokemon.name;
        document.getElementById("enemy-name-battle").textContent = GameState.enemyPokemon.name;
        document.getElementById("player-hp-current").textContent = GameState.playerPokemon.currentHp;
        document.getElementById("player-hp-max").textContent = GameState.playerPokemon.maxHp;

        const playerHpBar = document.getElementById("player-hp-bar");
        playerHpBar.style.width = "100%";
        playerHpBar.classList.remove("medium", "low");

        const enemyHpBar = document.getElementById("enemy-hp-bar");
        enemyHpBar.style.width = "100%";
        enemyHpBar.classList.remove("medium", "low");

        document.getElementById("player-sprite-battle").style.backgroundImage = `url('${GameState.playerPokemon.spriteBack}')`;
        document.getElementById("enemy-sprite-battle").style.backgroundImage = `url('${GameState.enemyPokemon.spriteFront}')`;

        this.renderAttackMenu();
        this.updateBattleLog(`What will<br>${GameState.playerPokemon.name} do?`);
    },

    renderAttackMenu: function () {
        const menu = document.getElementById("attack-menu");
        menu.innerHTML = "";

        GameState.playerPokemon.attacks.forEach((attack, index) => {
            const btn = document.createElement("button");
            btn.className = "action-btn";
            btn.setAttribute("data-attack-index", index);
            btn.setAttribute("data-key", attack.key);
            btn.textContent = `${attack.key} ${attack.name}`;
            menu.appendChild(btn);
        });
    },

    updateBattleLog: function (message) {
        document.getElementById("battle-message").innerHTML = message;
    },

    updateHP: function (target) {
        const pokemon = target === "player" ? GameState.playerPokemon : GameState.enemyPokemon;
        const hpBar = document.getElementById(`${target}-hp-bar`);

        if (target === "player") {
            document.getElementById("player-hp-current").textContent = pokemon.currentHp;
        }

        const percentage = (pokemon.currentHp / pokemon.maxHp) * 100;
        hpBar.style.width = percentage + "%";
        hpBar.classList.remove("medium", "low");
        if (percentage <= 20) hpBar.classList.add("low");
        else if (percentage <= 50) hpBar.classList.add("medium");
    },

    animateAttack: function (attacker) {
        const sprite = document.getElementById(`${attacker}-sprite-battle`);
        sprite.classList.add("attacking");
        setTimeout(() => sprite.classList.remove("attacking"), 450);
    },

    animateDamage: function (target) {
        const sprite = document.getElementById(`${target}-sprite-battle`);
        sprite.classList.add("damaged");
        setTimeout(() => sprite.classList.remove("damaged"), 300);
    },

    showEndScreen: function (playerWon) {
        this.showScreen("end");
        if (playerWon) {
            document.getElementById("end-title").textContent = "VICTORY!";
            document.getElementById("end-message").textContent = `Enemy ${GameState.enemyPokemon.name} fainted!`;
        } else {
            document.getElementById("end-title").textContent = "DEFEAT!";
            document.getElementById("end-message").textContent =
                `${GameState.playerPokemon.name} fainted! Enemy ${GameState.enemyPokemon.name} ran away!`;
        }
    }
};

// ============================================================
// GAME CONTROLLER
// ============================================================
const Game = {
    startGame: function () {
        // Block starting without Arduino connected
        if (!BLEManager.connected) {
            UI.showBLEStatus("Connect Arduino first!", "error");
            // Shake the connect button to draw attention
            const btn = document.getElementById("btn-connect");
            if (btn) {
                btn.classList.add("shake");
                setTimeout(() => btn.classList.remove("shake"), 500);
            }
            return;
        }

        GameState.currentTimeOfDay = getCurrentTimeOfDay();
        GameState.selectedOpponent = selectRandomOpponent();
        UI.showScreen("tutorial");
    },

    connectArduino: async function () {
        if (BLEManager.connected) {
            // Already connected - offer to disconnect
            await BLEManager.disconnect();
        } else {
            await BLEManager.connect();
        }
    },

    showGesture1: function () { UI.showScreen("gesture1"); },
    showGesture2: function () { UI.showScreen("gesture2"); },
    showGesture3: function () { UI.showScreen("gesture3"); },
    showGesture4: function () { UI.showScreen("gesture4"); },

    showOpponentReveal: function () {
        UI.showScreen("opponent");
        const opponent = POKEMON_DATA[GameState.selectedOpponent];
        document.getElementById("opponent-name-reveal").textContent = opponent.name;
        document.getElementById("opponent-time-info").textContent =
            `Time: ${getTimeSlotName()} • ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
        document.getElementById("opponent-sprite-reveal").style.backgroundImage = `url('${opponent.spriteFront}')`;
    },

    showPokemonSelection: function () {
        UI.showScreen("selection");
        UI.renderPokemonSelection();
    },

    startBattle: function () {
        if (!GameState.selectedPlayer) return;
        GameState.battleEnded = false;
        GameState.playerTurn = true;
        UI.showScreen("battle");
        UI.setupBattle();
    },

    restartGame: function () {
        GameState.currentTimeOfDay = getCurrentTimeOfDay();
        GameState.selectedOpponent = selectRandomOpponent();
        GameState.selectedPlayer = null;
        this.showOpponentReveal();
    },

    returnToMenu: function () {
        GameState.selectedOpponent = null;
        GameState.selectedPlayer = null;
        GameState.playerPokemon = null;
        GameState.enemyPokemon = null;
        UI.showScreen("menu");
    }
};

// ============================================================
// KEYBOARD INPUT (debug/testing without Arduino)
// ============================================================
document.addEventListener("keydown", function (event) {
    const key = event.key.toUpperCase();

    if (GameState.currentScreen === "battle" && !GameState.battleEnded && GameState.playerTurn) {
        const gestureMap = { "Z": 0, "O": 1, "N": 2, "L": 3 };
        const attackIndex = gestureMap[key];
        if (attackIndex !== undefined) {
            if (CONFIG.DEBUG_MODE) console.log(`[KEYBOARD] Key "${key}" pressed - Attack ${attackIndex + 1}`);
            Battle.playerAttack(attackIndex);
        }
    }
});

// ============================================================
// INITIALIZATION
// ============================================================
document.addEventListener("DOMContentLoaded", async function () {
    if (CONFIG.DEBUG_MODE) {
        console.log("[GAME] Pokémon Battle Game Initialized");
        console.log("[GAME] Current Time of Day:", getCurrentTimeOfDay());
        console.log("[GAME] Available Pokémon:", getAvailablePlayerPokemon());
    }

    // Request BLE permissions on load (Android requires this)
    if (BLEManager.isAvailable()) {
        await BLEManager.requestPermissions();
        UI.showBLEStatus("Arduino not connected", "error");
    } else {
        // Running in browser without Capacitor - show message but don't block
        UI.showBLEStatus("BLE: Browser mode (use keyboard Z/O/N/L)", "scanning");
        if (CONFIG.DEBUG_MODE) console.log("[BLE] Capacitor not detected - running in browser debug mode");
    }

    UI.showScreen("menu");
});