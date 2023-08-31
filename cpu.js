class CPU {
    constructor(keyboard, speaker, display) {
        this.keyboard = keyboard;
        this.speaker = speaker;
        this.display = display;

        this.memory = new Uint8Array(4096);
        this.registers = new Uint8Array(16);
        this.I = 0x0000;
        this.delayTimer = 0x00;
        this.soundTimer = 0x00;
        this.pc = 0x200;
        this.stack = new Array();

        this.paused = true;
        this.speed = 10;
    }

    loadSpritesIntoMemory() {
        const sprites = [
            0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
            0x20, 0x60, 0x20, 0x20, 0x70, // 1
            0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
            0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
            0x90, 0x90, 0xF0, 0x10, 0x10, // 4
            0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
            0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
            0xF0, 0x10, 0x20, 0x40, 0x40, // 7
            0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
            0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
            0xF0, 0x90, 0xF0, 0x90, 0x90, // A
            0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
            0xF0, 0x80, 0x80, 0x80, 0xF0, // C
            0xE0, 0x90, 0x90, 0x90, 0xE0, // D
            0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
            0xF0, 0x80, 0xF0, 0x80, 0x80  // F
        ];
        for (let i = 0; i < sprites.length; i++) {
            this.memory[i] = sprites[i];
        }
    }

    loadProgramToMemory(program) {
        for(let i = 0;i < program.length;i++) {
            this.memory[i + 0x200] = program[i];
        }
        this.paused = false;
        console.log(`Program loaded into memory from ${0x200} to ${program.length}`, this.memory);
    }

    getROM() {
        let rom = document.getElementById("rom");
        rom.addEventListener('change', (event) => {
            let reader = new FileReader();
            reader.onloadend = () => {
                let program = new Uint8Array(reader.result);
                this.loadProgramToMemory(program);
                console.log('Program loaded!');
            }
            reader.readAsArrayBuffer(event.target.files[0]);
        });
    }

    updateTimers() {
        if(this.delayTimer > 0) {
            this.delayTimer -= 1;
        }
        if(this.soundTimer > 0) {
            this.soundTimer -= 1;
        }
    }

    playSound() {
        if(this.soundTimer > 0) {
            this.speaker.playBuzz(440);
        } else {
            this.speaker.stopBuzz();
        }
    }

    cycle() {
        for(let i = 0; i < this.speed; i++) {
            if(!this.paused) {
                let opcode = this.memory[this.pc] << 8 | this.memory[this.pc+1];
                console.log(`Executing instruction ${opcode.toString(16)}`);
                this.executeInstruction(opcode);
            }
            if (!this.paused) {
                this.updateTimers();
            }
        
            this.playSound();
            this.display.render();
        }
    }

    executeInstruction(opcode) {
        this.pc+=2;
        // x - A 4-bit value, the lower 4 bits of the high byte of the instruction
        // y - A 4-bit value, the upper 4 bits of the low byte of the instruction
        let x = (opcode >> 8) & 0x0F;
        let y = (opcode & 0x00F0) >> 4;
    
        //code here
        switch (opcode & 0xF000) { //Getting the first 4-bits of the upper byte
            case 0x0000:
                switch (opcode) {
                    case 0x00E0: //Clear display
                        this.display.clear();
                        break;
                    case 0x00EE: //Get the top of the stack
                        this.pc = this.stack.pop();
                        break;
                }
                break;
            case 0x1000: //Set program counter to the 12-bit less significant value from opcode
                this.pc = (opcode & 0xFFF);
                break;
            case 0x2000: //(Calling a subroutine) Put the current program counter on top of stack and set the pc to a new value (12-bit less significant value from opcode)
                this.stack.push(this.pc);
                this.pc = (opcode & 0xFFF);
                break;
            case 0x3000: //Skip next instruction if Vx = the lowest 8 bits of the instruction.
                if(this.registers[x] === (opcode & 0x00FF)) {
                    this.pc += 2;
                }
                break;
            case 0x4000: //Skip next instruction if Vx != the lowest 8 bits of the instruction.
                if(this.registers[x] !== (opcode & 0x00FF)) {
                    this.pc += 2;
                }
                break;
            case 0x5000: //Skip next instruction if Vx = Vy.
                if(this.registers[x] === this.registers[y]) {
                    this.pc += 2;
                }
                break;
            case 0x6000: //Set Vx = the lowest 8 bits of the instruction.
                this.registers[x] = (opcode & 0x00FF);
                break;
            case 0x7000: //(ADD) Set Vx = Vx + kk.
                this.registers[x] += (opcode & 0x00FF);
                break;
            case 0x8000: 
                switch (opcode & 0xF) {
                    case 0x0: //(LOAD) Set Vx = Vy.
                        this.registers[x] = this.registers[y];
                        break;
                    case 0x1: //(OR)Set Vx = Vx OR Vy.
                        this.registers[x] |= this.registers[y];
                        break;
                    case 0x2: //(AND)Set Vx = Vx AND Vy.
                        this.registers[x] &= this.registers[y];
                        break;
                    case 0x3: //(XOR)Set Vx = Vx XOR Vy.
                        this.registers[x] ^= this.registers[y];
                        break;
                    case 0x4: //(ADD WITH CARRY) Set Vx = Vx + Vy, set VF = carry.
                        const add = (this.registers[x] += this.registers[y]);
                        this.registers[0xF] = 0;
                        if(add > 0xFF) {
                            this.registers[0xF] = 0x1;
                        }
                        this.registers[x] = add;
                        break;
                    case 0x5: //(SUB) Set Vx = Vx - Vy, set VF = NOT borrow.
                        //If Vx > Vy, then VF is set to 1, otherwise 0. Then Vy is subtracted from Vx, and the results stored in Vx.
                        if(this.registers[x] > this.registers[y]) {
                            this.registers[0xF] = 0x1;
                        } else {
                            this.registers[0xF] = 0;
                        }
                        this.registers[x] -= this.registers[y];
                        break;
                    case 0x6: //Set Vx = Vx SHR 1. (shift right instruction)
                        // If the least-significant bit of Vx is 1, then VF is set to 1, otherwise 0. Then Vx is divided by 2.
                        this.registers[0xF] = (this.registers[x] & 0x1);
                        this.registers[x] >>= 1;
                        break;
                    case 0x7: //Set Vx = Vy - Vx, set VF = NOT borrow.
                        // If Vy > Vx, then VF is set to 1, otherwise 0. Then Vx is subtracted from Vy, and the results stored in Vx.
                        this.registers[0xF] = 0;
                        if(this.registers[y] > this.registers[x]) {
                            this.registers[0xF] = 0x1;
                        }
                        this.registers[x] = this.registers[y] - this.registers[x];
                        break;
                    case 0xE: //Set Vx = Vx SHL 1. (shift left instruction)
                        this.registers[0xF] = (this.registers[x] & 0x80);
                        this.registers[x] <<= 1;
                        break;
                }
        
                break;
            case 0x9000: //Skip next instruction if Vx != Vy.
                if(this.registers[x] !== this.registers[y]) {
                    this.pc += 2;
                }
                break;
            case 0xA000: //(LOAD I) Set I = nnn (3 least significant bytes of opcode).
                this.I = opcode & 0x0FFF
                break;
            case 0xB000: //(JMP) Jump to location nnn + V0.
                this.pc = this.registers[0] + (opcode & 0x0FFF);
                break;
            case 0xC000: //(RND) Set Vx = random byte AND kk.
                //The interpreter generates a random number from 0 to 255, which is then ANDed with the value kk. The results are stored in Vx. 
                let rand = Math.floor(Math.random() * 0xFF);
                this.registers[x] = rand & (opcode & 0xFF);
                break;
            case 0xD000: //Display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision.
                //The interpreter reads n bytes from memory, 
                //starting at the address stored in I. 
                //These bytes are then displayed as sprites on screen at coordinates (Vx, Vy). 
                //Sprites are XORed onto the existing screen. If this causes any pixels to be erased, VF is set to 1, otherwise it is set to 0. 
                //If the sprite is positioned so part of it is outside the coordinates of the display, it wraps around to the opposite side of the screen. 
                let n = (opcode & 0xF)
                this.registers[0xF] = 0;
                for(let i = 0; i < n; i++) {
                    let sprite = this.memory[this.I + i]; //Get the first byte of sprite
                    for(let j = 0; j < 8; j++) {
                        // If the most significant bit of the sprite is not 0, draw/erase, if not, nothing has to be changed
                        if ((sprite & 0x80) > 0) {
                            // If setPixel returns 1, which means a pixel was erased, set VF to 1
                            if (this.display.setPixel(this.registers[x] + j, this.registers[y] + i)) {
                                this.registers[0xF] = 1;
                            }
                        }

                        // Shift the sprite left 1
                        sprite <<= 1;
                    }
                }

                break;
            case 0xE000:
                switch (opcode & 0xFF) {
                    case 0x9E: //Skip next instruction if key with the value of Vx is pressed.
                        if(this.keyboard.isKeyPressed(this.registers[x])) {
                            this.pc += 2;
                        }
                        break;
                    case 0xA1: //Skip next instruction if key with the value of Vx is not pressed.
                        if(!this.keyboard.isKeyPressed(this.registers[x])) {
                            this.pc += 2;
                        }
                        break;
                }
        
                break;
            case 0xF000:
                switch (opcode & 0xFF) {
                    case 0x07: //Set Vx = delay timer value.
                        this.registers[x] = this.delayTimer;
                        break;
                    case 0x0A: //Wait for a key press, store the value of the key in Vx.
                        // All execution stops until a key is pressed, then the value of that key is stored in Vx.
                        this.paused = true;

                        this.keyboard.waitingForKey = function(key) {
                            this.registers[x] = key;
                            this.paused = false;
                        }.bind(this);

                        break;
                    case 0x15: //Set delay timer = Vx.
                        this.delayTimer = this.registers[x];
                        break;
                    case 0x18: //Set sound timer = Vx.
                        this.soundTimer = this.registers[x];
                        break;
                    case 0x1E: //Set I = I + Vx.
                        this.I += this.registers[x];
                        break;
                    case 0x29: //Set I = location of sprite for digit Vx.
                        this.I = this.registers[x] * 5;
                        break;
                    case 0x33: //Store BCD representation of Vx in memory locations I, I+1, and I+2.
                        // The interpreter takes the decimal value of Vx, and places the hundreds digit in memory at location in I, 
                        // the tens digit at location I+1, and the ones digit at location I+2.
                        
                        // Get the hundreds digit and place it in I.
                        this.memory[this.I] = parseInt(this.registers[x] / 100);

                        // Get tens digit and place it in I+1. Gets a value between 0 and 99,
                        // then divides by 10 to give us a value between 0 and 9.
                        this.memory[this.I + 1] = parseInt((this.registers[x] % 100) / 10);

                        // Get the value of the ones (last) digit and place it in I+2.
                        this.memory[this.I + 2] = parseInt(this.registers[x] % 10);
                        break;
                    case 0x55: // Store registers V0 through Vx in memory starting at location I.
                        for(let i = 0; i <= x; i++) {
                            this.memory[this.I + i] = this.registers[i];
                        }
                        break;
                    case 0x65: //Read registers V0 through Vx from memory starting at location I.
                        for(let i = 0; i <= x; i++) {
                            this.registers[i] = this.memory[this.I + i];
                        }
                        break;
                }
        
                break;
        
            default:
                throw new Error('Unknown opcode ' + opcode);
        } 
    }
}

export default CPU;