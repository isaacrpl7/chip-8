class Keyboard {
    constructor() {
        this.KEYMAP = {
            "1": 0x1,
            "2": 0x2,
            "3": 0x3,
            "4": 0xc,
            "q": 0x4,
            "w": 0x5,
            "e": 0x6,
            "r": 0xD,
            "a": 0x7,
            "s": 0x8,
            "d": 0x9,
            "f": 0xE,
            "z": 0xA,
            "x": 0x0,
            "c": 0xB,
            "v": 0xF 
        }
        this.keysPressed = {};
        this.waitingForKey = null

        document.addEventListener('keypress', (e) => {
            this.keysPressed[this.KEYMAP[e.key]] = true;

            if(this.waitingForKey !== null && e.key) {
                this.waitingForKey(this.KEYMAP[e.key]);
                this.waitingForKey = null;
            }
        });
        document.addEventListener('keyup', (e) => {
            this.keysPressed[this.KEYMAP[e.key]] = false;
        });
    }
    isKeyPressed(key) {
        return this.keysPressed[key];
    }
}

export default Keyboard;