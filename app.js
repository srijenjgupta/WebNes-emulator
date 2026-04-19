// 1. Grab the Canvas and setup the pixel buffer
const canvas = document.getElementById('nes-canvas');
const ctx = canvas.getContext('2d');
const imageData = ctx.getImageData(0, 0, 256, 240);
const buf = new ArrayBuffer(imageData.data.length);
const buf8 = new Uint8ClampedArray(buf);
const buf32 = new Uint32Array(buf);


// --- AUDIO SYSTEM SETUP ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let scriptProcessor;
let audioSamplesL = [];
let audioSamplesR = [];

// Function to initialize the Audio engine
function initAudio() {
    if (audioCtx) return; 
    
    audioCtx = new AudioContext();
    scriptProcessor = audioCtx.createScriptProcessor(4096, 0, 2);
    
    // Create the Volume Node
    gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.5; // Default to 50% volume

    scriptProcessor.onaudioprocess = function(e) {
        const leftOut = e.outputBuffer.getChannelData(0);
        const rightOut = e.outputBuffer.getChannelData(1);
        for (let i = 0; i < leftOut.length; i++) {
            leftOut[i] = audioSamplesL.length > 0 ? audioSamplesL.shift() : 0;
            rightOut[i] = audioSamplesR.length > 0 ? audioSamplesR.shift() : 0;
        }
    };
    
    // Connect processor -> gain node -> speakers
    scriptProcessor.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    console.log("Web Audio API Initialized with Gain Control");
}

// Volume Slider Event Listener
document.getElementById('volume-slider').addEventListener('input', (e) => {
    if (gainNode) {
        gainNode.gain.value = e.target.value;
    }
});


// --- 2. FULLSCREEN LOGIC ---
document.getElementById('btn-fullscreen').addEventListener('click', () => {
    const tvBezel = document.getElementById('tv-container');
    if (!document.fullscreenElement) {
        tvBezel.requestFullscreen().catch(err => {
            alert(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
});


// --- 3. SAVE AND LOAD STATE LOGIC ---
document.getElementById('btn-save').addEventListener('click', () => {
    if (!nes) return;
    
    // Grab the exact memory state of the emulator
    const stateData = nes.toJSON();
    
    // Create a downloadable JSON file
    const blob = new Blob([JSON.stringify(stateData)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    // Trick the browser into clicking a hidden download link
    const a = document.createElement('a');
    a.href = url;
    a.download = `webnes_save_${new Date().getTime()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    console.log("State Saved!");
});

document.getElementById('state-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const stateData = JSON.parse(event.target.result);
            nes.fromJSON(stateData); // Inject memory state back into JSNES
            console.log("State Loaded Successfully!");
        } catch (err) {
            alert("Invalid save state file.");
        }
    };
    reader.readAsText(file);
});


// --- 4. GOOGLE SEARCH REDIRECT ---
document.getElementById('search-btn').addEventListener('click', () => {
    const query = document.getElementById('rom-search-input').value;
    if (query.trim() !== "") {
        // Construct the Google search URL and open in a new tab
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query + ' nes rom free')}`;
        window.open(searchUrl, '_blank');
    }
});

// Allow hitting "Enter" in the search box
document.getElementById('rom-search-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('search-btn').click();
    }
});

// --- 5. UPDATED GAME CARD CLICK LISTENER ---
// Because we changed the HTML structure, the click listener needs a slight tweak
document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
        const romFile = card.getAttribute('data-rom');
        loadHomebrew(romFile);
    });
});


// --- UPDATED JSNES INITIALIZATION ---
const nes = new jsnes.NES({
    onFrame: function(framebuffer_24) {
        for (let i = 0; i < 256 * 240; i++) {
            buf32[i] = 0xFF000000 | framebuffer_24[i]; 
        }
        imageData.data.set(buf8);
        ctx.putImageData(imageData, 0, 0);
    },
    onAudioSample: function(left, right) {
        // As JSNES generates the "sheet music" into raw audio, push it to our queues
        audioSamplesL.push(left);
        audioSamplesR.push(right);
    }
});

// --- UPDATED KEYBOARD MAPPINGS (2 PLAYERS) ---
// We map each key to an array: [PlayerNumber, JSNES_Button]
const keyMap = {
    // Player 1 (Right side of keyboard)
    'ArrowUp':    [1, jsnes.Controller.BUTTON_UP],
    'ArrowDown':  [1, jsnes.Controller.BUTTON_DOWN],
    'ArrowLeft':  [1, jsnes.Controller.BUTTON_LEFT],
    'ArrowRight': [1, jsnes.Controller.BUTTON_RIGHT],
    'KeyZ':       [1, jsnes.Controller.BUTTON_B],
    'KeyX':       [1, jsnes.Controller.BUTTON_A],
    'Enter':      [1, jsnes.Controller.BUTTON_START],
    'ShiftRight': [1, jsnes.Controller.BUTTON_SELECT],

    // Player 2 (Left side of keyboard)
    'KeyW':       [2, jsnes.Controller.BUTTON_UP],
    'KeyS':       [2, jsnes.Controller.BUTTON_DOWN],
    'KeyA':       [2, jsnes.Controller.BUTTON_LEFT],
    'KeyD':       [2, jsnes.Controller.BUTTON_RIGHT],
    'KeyC':       [2, jsnes.Controller.BUTTON_B],     // 'C' is P2's Shoot
    'KeyV':       [2, jsnes.Controller.BUTTON_A],     // 'V' is P2's Jump
    'Digit1':     [2, jsnes.Controller.BUTTON_START], // '1' is P2's Start
    'Digit2':     [2, jsnes.Controller.BUTTON_SELECT] // '2' is P2's Select
};

document.addEventListener('keydown', (e) => {
    // --- NEW LINE: THE FIX ---
    // If the user is typing inside an input field, do not trigger the emulator
    if (e.target.tagName.toLowerCase() === 'input') return; 

    const mapping = keyMap[e.code];
    if (mapping) {
        nes.buttonDown(mapping[0], mapping[1]);
        e.preventDefault(); 
    }
});

document.addEventListener('keyup', (e) => {
    // --- NEW LINE: THE FIX ---
    if (e.target.tagName.toLowerCase() === 'input') return;

    const mapping = keyMap[e.code];
    if (mapping) {
        nes.buttonUp(mapping[0], mapping[1]);
        e.preventDefault();
    }
});

console.log("Canvas rendering loop and controller mappings initialized.");
// --- NEW CODE: SPRINT 1, STEP 3 ---

let gameLoop;

// Handle the local file upload
document.getElementById('rom-upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    initAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    console.log("Reading file locally:", file.name);

    const reader = new FileReader();
    
    reader.onload = function(event) {
        const binaryString = event.target.result;
        
        try {
            // Load the ROM data into the emulator
            nes.loadROM(binaryString);
            console.log("ROM loaded successfully!");
            
            // Start the game loop (cancel any existing loop first)
            if (gameLoop) cancelAnimationFrame(gameLoop);
            gameLoop = window.requestAnimationFrame(frame);
            
        } catch (error) {
            console.error("Error loading ROM:", error);
            alert("Failed to load ROM. Is it a valid .nes file?");
        }
    };
    
    // JSNES requires the file to be read as a Binary String
    reader.readAsBinaryString(file); 
});

// The core loop that advances the emulator by one frame and requests the next
function frame() {
    pollGamepad();
    nes.frame(); 
    gameLoop = window.requestAnimationFrame(frame);
}

// --- NEW CODE: SPRINT 2, INSTANT LOAD LOGIC ---

// Function to fetch a ROM from the local 'roms' folder
async function loadHomebrew(filename) {
    console.log(`Fetching game: ${filename}...`);
    initAudio(); // <--- ADD THIS HERE
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    try {
        // Fetch the file from the local server
        const response = await fetch(`./roms/${filename}`);
        if (!response.ok) throw new Error("ROM not found. Check the filename!");
        
        // Convert the response to an ArrayBuffer
        const arrayBuffer = await response.arrayBuffer();
        
        // JSNES expects a binary string, so we convert the buffer
        const uint8Array = new Uint8Array(arrayBuffer);
        let binaryString = '';
        for (let i = 0; i < uint8Array.byteLength; i++) {
            binaryString += String.fromCharCode(uint8Array[i]);
        }

        // Load it into the emulator and start the loop
        nes.loadROM(binaryString);
        console.log(`${filename} loaded successfully!`);
        
        if (gameLoop) cancelAnimationFrame(gameLoop);
        gameLoop = window.requestAnimationFrame(frame);
        
    } catch (error) {
        console.error("Error fetching ROM:", error);
        alert(`Could not load ${filename}. Are you using Live Server? Is the file in the roms folder?`);
    }
}

// Attach event listeners to all our featured game buttons
document.querySelectorAll('.game-btn').forEach(button => {
    button.addEventListener('click', (event) => {
        // Read the filename from the data-rom attribute in the HTML
        const romFile = event.target.getAttribute('data-rom');
        loadHomebrew(romFile);
    });
});

// --- GAMEPAD API INTEGRATION ---

function processGamepad(pad, playerNumber) {
    if (!pad) return;

    const mapButton = (padButtonIndex, nesButton) => {
        if (pad.buttons[padButtonIndex] && pad.buttons[padButtonIndex].pressed) {
            nes.buttonDown(playerNumber, nesButton);
        } else {
            nes.buttonUp(playerNumber, nesButton);
        }
    };

    // Face Buttons & Start/Select
    mapButton(0, jsnes.Controller.BUTTON_A);
    mapButton(2, jsnes.Controller.BUTTON_B);
    mapButton(1, jsnes.Controller.BUTTON_B);
    mapButton(8, jsnes.Controller.BUTTON_SELECT);
    mapButton(9, jsnes.Controller.BUTTON_START);
    
    // D-Pad
    mapButton(12, jsnes.Controller.BUTTON_UP);
    mapButton(13, jsnes.Controller.BUTTON_DOWN);
    mapButton(14, jsnes.Controller.BUTTON_LEFT);
    mapButton(15, jsnes.Controller.BUTTON_RIGHT);
    
    // Analog Stick
    const xAxis = pad.axes[0];
    const yAxis = pad.axes[1];
    
    if (xAxis < -0.5) nes.buttonDown(playerNumber, jsnes.Controller.BUTTON_LEFT);
    else if (!pad.buttons[14].pressed) nes.buttonUp(playerNumber, jsnes.Controller.BUTTON_LEFT);
    
    if (xAxis > 0.5) nes.buttonDown(playerNumber, jsnes.Controller.BUTTON_RIGHT);
    else if (!pad.buttons[15].pressed) nes.buttonUp(playerNumber, jsnes.Controller.BUTTON_RIGHT);
    
    if (yAxis < -0.5) nes.buttonDown(playerNumber, jsnes.Controller.BUTTON_UP);
    else if (!pad.buttons[12].pressed) nes.buttonUp(playerNumber, jsnes.Controller.BUTTON_UP);
    
    if (yAxis > 0.5) nes.buttonDown(playerNumber, jsnes.Controller.BUTTON_DOWN);
    else if (!pad.buttons[13].pressed) nes.buttonUp(playerNumber, jsnes.Controller.BUTTON_DOWN);
}

function pollGamepad() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    
    // Process Controller 1 (Maps to Player 1)
    if (gamepads[0]) processGamepad(gamepads[0], 1);
    
    // Process Controller 2 (Maps to Player 2)
    if (gamepads[1]) processGamepad(gamepads[1], 2);
}