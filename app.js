// --- 1. CORE SETUP ---
const canvas = document.getElementById('nes-canvas');
const ctx = canvas.getContext('2d');
const imageData = ctx.getImageData(0, 0, 256, 240);
const buf = new ArrayBuffer(imageData.data.length);
const buf8 = new Uint8ClampedArray(buf);
const buf32 = new Uint32Array(buf);
let gameLoop;

// --- 2. AUDIO SYSTEM ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let scriptProcessor;
let gainNode; 
let audioSamplesL = [];
let audioSamplesR = [];

function initAudio() {
    if (audioCtx) return; 
    
    audioCtx = new AudioContext();
    scriptProcessor = audioCtx.createScriptProcessor(4096, 0, 2);
    
    gainNode = audioCtx.createGain();
    gainNode.gain.value = document.getElementById('volume-slider').value;

    scriptProcessor.onaudioprocess = function(e) {
        const leftOut = e.outputBuffer.getChannelData(0);
        const rightOut = e.outputBuffer.getChannelData(1);
        for (let i = 0; i < leftOut.length; i++) {
            leftOut[i] = audioSamplesL.length > 0 ? audioSamplesL.shift() : 0;
            rightOut[i] = audioSamplesR.length > 0 ? audioSamplesR.shift() : 0;
        }
    };
    
    scriptProcessor.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    console.log("Web Audio API Initialized");
}

document.getElementById('volume-slider').addEventListener('input', (e) => {
    if (gainNode) gainNode.gain.value = e.target.value;
});

// --- 3. UI CONTROLS (Fullscreen, Save/Load, Search) ---
document.getElementById('btn-fullscreen').addEventListener('click', () => {
    const tvBezel = document.getElementById('tv-container');
    if (!document.fullscreenElement) {
        tvBezel.requestFullscreen().catch(err => alert(`Error: ${err.message}`));
    } else {
        document.exitFullscreen();
    }
});

document.getElementById('btn-save').addEventListener('click', () => {
    if (!nes) return;
    const stateData = nes.toJSON();
    const blob = new Blob([JSON.stringify(stateData)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `webnes_save_${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
});

document.getElementById('state-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            nes.fromJSON(JSON.parse(event.target.result));
        } catch (err) {
            alert("Invalid save state file.");
        }
    };
    reader.readAsText(file);
});

document.getElementById('search-btn').addEventListener('click', () => {
    const query = document.getElementById('rom-search-input').value;
    if (query.trim() !== "") {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(query + ' nes rom free')}`, '_blank');
    }
});

document.getElementById('rom-search-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('search-btn').click();
});

// --- 4. EMULATOR ENGINE (JSNES) ---
const nes = new jsnes.NES({
    onFrame: function(framebuffer_24) {
        for (let i = 0; i < 256 * 240; i++) {
            buf32[i] = 0xFF000000 | framebuffer_24[i]; 
        }
        imageData.data.set(buf8);
        ctx.putImageData(imageData, 0, 0);
    },
    onAudioSample: function(left, right) {
        audioSamplesL.push(left);
        audioSamplesR.push(right);
    }
});

function frame() {
    pollGamepad();
    nes.frame(); 
    gameLoop = window.requestAnimationFrame(frame);
}

// --- 5. GAME LOADING LOGIC (BYOR & Homebrew) ---
document.getElementById('rom-upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    initAudio();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            nes.loadROM(event.target.result);
            if (gameLoop) cancelAnimationFrame(gameLoop);
            gameLoop = window.requestAnimationFrame(frame);
        } catch (error) {
            alert("Failed to load ROM. Is it a valid .nes file?");
        }
    };
    reader.readAsBinaryString(file); 
});

async function loadHomebrew(filename, cardElement) {
    // Safely update just the text span, not the whole card (which would delete the image)
    const textSpan = cardElement.querySelector('span');
    const originalText = textSpan ? textSpan.innerText : "Loading...";
    if (textSpan) textSpan.innerText = "BOOTING...";
    cardElement.style.opacity = "0.5";
    
    initAudio(); 
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    
    try {
        const response = await fetch(`./roms/${filename}`);
        if (!response.ok) throw new Error("ROM not found.");
        
        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        let binaryString = '';
        for (let i = 0; i < uint8Array.byteLength; i++) {
            binaryString += String.fromCharCode(uint8Array[i]);
        }

        nes.loadROM(binaryString);
        if (gameLoop) cancelAnimationFrame(gameLoop);
        gameLoop = window.requestAnimationFrame(frame);
        
    } catch (error) {
        alert(`Could not load ${filename}. Are you using Live Server?`);
    } finally {
        if (textSpan) textSpan.innerText = originalText;
        cardElement.style.opacity = "1";
    }
}

document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
        loadHomebrew(card.getAttribute('data-rom'), card); 
    });
});

// --- 6. INPUT MAPPINGS (Keyboard & Mobile) ---
const keyMap = {
    'ArrowUp': [1, jsnes.Controller.BUTTON_UP], 'ArrowDown': [1, jsnes.Controller.BUTTON_DOWN],
    'ArrowLeft': [1, jsnes.Controller.BUTTON_LEFT], 'ArrowRight': [1, jsnes.Controller.BUTTON_RIGHT],
    'KeyZ': [1, jsnes.Controller.BUTTON_B], 'KeyX': [1, jsnes.Controller.BUTTON_A],
    'Enter': [1, jsnes.Controller.BUTTON_START], 'ShiftRight': [1, jsnes.Controller.BUTTON_SELECT],
    'KeyW': [2, jsnes.Controller.BUTTON_UP], 'KeyS': [2, jsnes.Controller.BUTTON_DOWN],
    'KeyA': [2, jsnes.Controller.BUTTON_LEFT], 'KeyD': [2, jsnes.Controller.BUTTON_RIGHT],
    'KeyC': [2, jsnes.Controller.BUTTON_B], 'KeyV': [2, jsnes.Controller.BUTTON_A],
    'Digit1': [2, jsnes.Controller.BUTTON_START], 'Digit2': [2, jsnes.Controller.BUTTON_SELECT]
};

document.addEventListener('keydown', (e) => {
    if (e.target.tagName.toLowerCase() === 'input') return; 
    const mapping = keyMap[e.code];
    if (mapping) { nes.buttonDown(mapping[0], mapping[1]); e.preventDefault(); }
});

document.addEventListener('keyup', (e) => {
    if (e.target.tagName.toLowerCase() === 'input') return;
    const mapping = keyMap[e.code];
    if (mapping) { nes.buttonUp(mapping[0], mapping[1]); e.preventDefault(); }
});

const touchMap = {
    'up': jsnes.Controller.BUTTON_UP, 'down': jsnes.Controller.BUTTON_DOWN,
    'left': jsnes.Controller.BUTTON_LEFT, 'right': jsnes.Controller.BUTTON_RIGHT,
    'a': jsnes.Controller.BUTTON_A, 'b': jsnes.Controller.BUTTON_B,
    'select': jsnes.Controller.BUTTON_SELECT, 'start': jsnes.Controller.BUTTON_START
};

document.querySelectorAll('.touch-btn').forEach(btn => {
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault(); 
        const btnId = btn.getAttribute('data-button');
        if (touchMap[btnId] !== undefined) nes.buttonDown(1, touchMap[btnId]); 
    }, { passive: false });

    btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        const btnId = btn.getAttribute('data-button');
        if (touchMap[btnId] !== undefined) nes.buttonUp(1, touchMap[btnId]);
    }, { passive: false });
});

// --- 7. GAMEPAD API (Optimized for Performance) ---
let hasGamepad = false;

window.addEventListener("gamepadconnected", () => hasGamepad = true);
window.addEventListener("gamepaddisconnected", () => {
    hasGamepad = (navigator.getGamepads ? navigator.getGamepads() : []).filter(Boolean).length > 0;
});

function processGamepad(pad, playerNumber) {
    if (!pad) return;
    const mapBtn = (idx, nesBtn) => pad.buttons[idx] && pad.buttons[idx].pressed ? nes.buttonDown(playerNumber, nesBtn) : nes.buttonUp(playerNumber, nesBtn);
    
    mapBtn(0, jsnes.Controller.BUTTON_A); mapBtn(2, jsnes.Controller.BUTTON_B); mapBtn(1, jsnes.Controller.BUTTON_B);
    mapBtn(8, jsnes.Controller.BUTTON_SELECT); mapBtn(9, jsnes.Controller.BUTTON_START);
    mapBtn(12, jsnes.Controller.BUTTON_UP); mapBtn(13, jsnes.Controller.BUTTON_DOWN);
    mapBtn(14, jsnes.Controller.BUTTON_LEFT); mapBtn(15, jsnes.Controller.BUTTON_RIGHT);
}

function pollGamepad() {
    if (!hasGamepad) return; 
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    if (gamepads[0]) processGamepad(gamepads[0], 1);
    if (gamepads[1]) processGamepad(gamepads[1], 2);
}

// --- MOBILE LAYOUT TOGGLE ---
const btnSwapHands = document.getElementById('btn-swap-hands');
if (btnSwapHands) {
    btnSwapHands.addEventListener('click', () => {
        document.getElementById('mobile-controls').classList.toggle('lefty-mode');
    });
}

