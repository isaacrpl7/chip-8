class Display {
    constructor(scale) {
        // Initializing canvas
        this.canvas = document.getElementById('display');
        this.ctx = this.canvas.getContext("2d");

        this.scale = scale;
        this.cols = 64;
        this.rows = 32;
        this.display = new Array(this.cols * this.rows);

        this.canvas.width = this.cols * scale;
        this.canvas.height = this.rows * scale;
    }

    setPixel(x, y) {
        x %= this.cols;
        y %= this.rows;
        
        let loc = (this.cols * y) + x;
        this.display[loc] ^= 1;
        return !this.display[loc];
    }

    clear() {
        this.display = new Array(this.cols * this.rows);
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.display.forEach((value, index) => {
            let x = index % this.cols;
            let y = Math.floor(index / this.cols);
            if(x >= 1) {
                x *= this.scale;
            }
            if(y >= 1) {
                y *= this.scale;
            }
            if(value) {
                this.ctx.fillStyle = "black";
                this.ctx.fillRect(x, y, this.scale, this.scale);
            }
        })
    }
}
export default Display;