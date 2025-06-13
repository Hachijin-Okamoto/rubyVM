import { ASSEMBLY } from "../../constants";
import { OPCODES } from "./constants";

export class MyVM {
  pc: number = 0;
  stack: number[] = [];
  code: Uint8Array;
  register: number[] = [];

  constructor(code: Uint8Array) {
    this.code = code;
  }

  run() {
    while (this.pc < this.code.length) {
      const opcode: number = this.code[this.pc++];

      switch (opcode) {
        case OPCODES[ASSEMBLY.NUMBER]:
          const val: number = this.readInt16();
          this.stack.push(val);
          break;

        case OPCODES[ASSEMBLY.ADDITION]:
        case OPCODES[ASSEMBLY.SUBTRACTION]:
        case OPCODES[ASSEMBLY.MULTIPLICATION]:
        case OPCODES[ASSEMBLY.DIVISION]:
        case OPCODES[ASSEMBLY.REMAINDER]:
        case OPCODES[ASSEMBLY.POWER]:
        case OPCODES[ASSEMBLY.GREATER]:
        case OPCODES[ASSEMBLY.LESS]:
        case OPCODES[ASSEMBLY.GREATER_EQUAL]:
        case OPCODES[ASSEMBLY.LESS_EQUAL]:
          const b: number = this.stack.pop()!;
          const a: number = this.stack.pop()!;
          this.stack.push(this.calc(a, b, opcode));
          break;

        case OPCODES[ASSEMBLY.ASSIGNMENT]:
          const value: number = this.stack.pop()!;
          const variableId: number = this.readInt16();
          this.register[variableId] = value!;
          break;

        // TODO:ここの変数命名何とかする（上と被り）
        case OPCODES[ASSEMBLY.REFERENCE]:
          const _variableId: number = this.readInt16();
          this.stack.push(this.register[_variableId]);
          break;

        case OPCODES[ASSEMBLY.JUMP]:
          const address: number = this.readInt16();
          this.pc = address;
          break;

        case OPCODES[ASSEMBLY.JUMP_IF_FALSE]:
          const _address: number = this.readInt16();
          const condition: number = this.stack.pop()!;
          if (!condition) {
            this.pc = _address;
          }
          break;

        case OPCODES[ASSEMBLY.OUTPUT]:
          console.log(this.stack.pop());
          break;

        case OPCODES[ASSEMBLY.END]:
          return;

        default:
          throw new Error(`Unknown opcode: ${opcode}`);
      }
    }
  }

  readInt16(): number {
    const bytes: Uint8Array = this.code.slice(this.pc, this.pc + 2);
    this.pc += 2;
    return bytes[0] | (bytes[1] << 8);
  }

  calc(x: number, y: number, opcode: number): number {
    switch (opcode) {
      case OPCODES[ASSEMBLY.ADDITION]:
        return x + y;
      case OPCODES[ASSEMBLY.SUBTRACTION]:
        return x - y;
      case OPCODES[ASSEMBLY.MULTIPLICATION]:
        return x * y;
      case OPCODES[ASSEMBLY.DIVISION]:
        return x / y;
      case OPCODES[ASSEMBLY.REMAINDER]:
        return x % y;
      case OPCODES[ASSEMBLY.POWER]:
        return x ** y;
      case OPCODES[ASSEMBLY.GREATER]:
        return x > y ? 1 : 0;
      case OPCODES[ASSEMBLY.LESS]:
        return x < y ? 1 : 0;
      case OPCODES[ASSEMBLY.GREATER_EQUAL]:
        return x >= y ? 1 : 0;
      case OPCODES[ASSEMBLY.LESS_EQUAL]:
        return x <= y ? 1 : 0;
      default:
        throw new Error(`Unkown opcode:${opcode}`);
    }
  }
}
