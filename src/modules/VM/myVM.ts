import { ASSEMBLY } from "../../constants";
import { OPCODES } from "./constants";
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
        case OPCODES[ASSEMBLY.NUMBER]:
          const val = this.readInt16();
          this.stack.push(val);
          break;

        case OPCODES[ASSEMBLY.ADDITION]: // ADD
          const b = this.stack.pop()!;
          const a = this.stack.pop()!;
          this.stack.push(a + b);
          break;

        case OPCODES[ASSEMBLY.OUTPUT]: // PRINT
          console.log(this.stack.pop());
          break;

        case OPCODES[ASSEMBLY.END]: // HALT
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
