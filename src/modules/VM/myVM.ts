export class MyVM {
  pc = 0;
  stack: number[] = [];
  code: Uint8Array;

  constructor(code: Uint8Array) {
    this.code = code;
  }

  run() {
    while (this.pc < this.code.length) {
      const opcode = this.code[this.pc++];

      switch (opcode) {
        case 0x01:
          const val = this.readInt16();
          this.stack.push(val);
          break;

        case 0x02: // ADD
          const b = this.stack.pop()!;
          const a = this.stack.pop()!;
          this.stack.push(a + b);
          break;

        case 0x03: // PRINT
          console.log(this.stack.pop());
          break;

        case 0xff: // HALT
          return;

        default:
          throw new Error(`Unknown opcode: ${opcode}`);
      }
    }
  }

  readInt16(): number {
    const bytes = this.code.slice(this.pc, this.pc + 2);
    this.pc += 2;
    return bytes[0] | (bytes[1] << 8);
  }
}
