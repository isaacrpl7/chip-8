class Speaker {
    constructor() {
        // create web audio api context
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        // Create a gain
        this.gain = this.audioCtx.createGain();
        this.volume = 0.5;
        this.gain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);

        this.finish = this.audioCtx.destination;

        // Connect the gain to the audio context
        this.gain.connect(this.finish);
    }
    volDown() {
        this.volume -= 0.1;
        this.gain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    }
    volUp() {
        this.volume += 0.1;
        this.gain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    }

    playBuzz(frequency) {
        if(this.audioCtx && !this.oscillator) {// create Oscillator node
            this.oscillator = this.audioCtx.createOscillator();

            this.oscillator.type = "square";
            this.oscillator.frequency.setValueAtTime(frequency, this.audioCtx.currentTime); // value in hertz
            this.oscillator.connect(this.gain);
            this.oscillator.start();
        }
    }

    stopBuzz() {
        if(this.oscillator) {
            this.oscillator.stop();
            this.oscillator.disconnect();
            this.oscillator = null;
        }
    }
}

export default Speaker;