import CPU from "./cpu.js";
import Display from "./display.js";
import Keyboard from "./keyboard.js";
import Speaker from "./speaker.js";
let display = new Display(10);
let keyboard = new Keyboard();
let speaker = new Speaker(440);

let cpu = new CPU(keyboard, speaker, display);

window.display = display;
window.speaker = speaker;
window.cpu = cpu;

let fps = 60, fpsInterval, now, startTime, elapsed;

function init() {
    fpsInterval = 900/fps;
	startTime = Date.now();

    cpu.loadSpritesIntoMemory();
    cpu.getROM();
    window.requestAnimationFrame(loop);
}

function loop(timestamp) {
    now = Date.now();
	elapsed = now - startTime;
    
    if(elapsed > fpsInterval) {
        cpu.cycle();
        startTime = now;
    }

    window.requestAnimationFrame(loop);
}

init();