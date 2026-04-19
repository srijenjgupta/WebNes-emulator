// 1. Grab the Canvas and setup the pixel buffer
const canvas = document.getElementById('nes-canvas');
const ctx = canvas.getContext('2d');
const imageData = ctx.getImageData(0, 0, 256, 240);
const buf = new ArrayBuffer(imageData.data.length);
const buf8 = new Uint8ClampedArray(buf);
const buf32 = new Uint32Array(buf);

// 2. Initialize the Emulator Instance
const nes = new jsnes.NES({
    onFrame: function(framebuffer_24) {
        // This function runs 60 times a second. It takes the raw frame data
        // from JSNES and paints it onto our HTML canvas.
        for (let i = 0; i < 256 * 240; i++) {
            buf32[i] = 0xFF000000 | framebuffer_24[i]; 
        }
        imageData.data.set(buf8);
        ctx.putImageData(imageData, 0, 0);
    },
    onAudioSample: function(left, right) {
        // Placeholder for Sprint 3
    }
});

// 3. Map Keyboard Inputs to the Virtual Controller
// We are mapping Player 1 (index 1)
const keyMap = {
    'ArrowUp': jsnes.Controller.BUTTON_UP,
    'ArrowDown': jsnes.Controller.BUTTON_DOWN,
    'ArrowLeft': jsnes.Controller.BUTTON_LEFT,
    'ArrowRight': jsnes.Controller.BUTTON_RIGHT,
    'KeyZ': jsnes.Controller.BUTTON_A,     // 'Z' key acts as 'A' button
    'KeyX': jsnes.Controller.BUTTON_B,     // 'X' key acts as 'B' button
    'Enter': jsnes.Controller.BUTTON_START,
    'ShiftRight': jsnes.Controller.BUTTON_SELECT,
    'ShiftLeft': jsnes.Controller.BUTTON_SELECT
};

document.addEventListener('keydown', (e) => {
    if (keyMap[e.code] !== undefined) {
        nes.buttonDown(1, keyMap[e.code]); // Press button down
        e.preventDefault(); // Stop arrow keys from scrolling the browser window
    }
});

document.addEventListener('keyup', (e) => {
    if (keyMap[e.code] !== undefined) {
        nes.buttonUp(1, keyMap[e.code]); // Release button
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
    nes.frame(); 
    gameLoop = window.requestAnimationFrame(frame);
}