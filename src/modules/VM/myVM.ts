import { ASSEMBLY } from "../../constants";
import { OPCODES } from "./constants";

export class MyVM {
  pc: number;
  stack: number[] = [];
  code: Uint8Array;
  envStack: Array<{ [key: number]: number }> = [];
  callStack: number[] = [];

  constructor(code: Uint8Array) {
    this.code = code;
    this.pc = this.findStart();
    this.envStack.push({});
  }

  findStart(): number {
    for (let i: number = this.code.length - 1; i >= 0; i--) {
      if (this.code[i] === OPCODES[ASSEMBLY.RETURN]) {
        return i + 1;
      }
    }
    return 0;
  }

  run() {
    while (this.pc < this.code.length) {
      const opcode: number = this.code[this.pc++];

      // * デバッグ用

      // console.log(this.stack);
      // console.log(this.envStack);
      // console.log("pc:", this.pc - 1, " opcode:", opcode.toString(16));

      // * ここまで

      switch (opcode) {
        case OPCODES[ASSEMBLY.NUMBER]:
          const val: number = this.readInt16();
          this.stack.push(val);
          break;

        case OPCODES[ASSEMBLY.STRING]: {
          const len: number = this.readInt16();
          const strBytes: Uint8Array = this.code.slice(this.pc, this.pc + len);
          this.pc += len;
          const str: string = new TextDecoder().decode(strBytes);
          (this.stack as (number | string)[]).push(str);
          break;
        }

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
        case OPCODES[ASSEMBLY.EQUAL]:
        case OPCODES[ASSEMBLY.NOT_EQUAL]:
          const b: number = this.stack.pop()!;
          const a: number = this.stack.pop()!;
          this.stack.push(this.calc(a, b, opcode));
          break;

        case OPCODES[ASSEMBLY.ASSIGNMENT]:
          const value: number = this.stack.pop()!;
          const variableId: number = this.readInt16();
          this.envStack[this.envStack.length - 1][variableId] = value!;
          break;

        // TODO:ここの変数命名何とかする（上と被り）
        case OPCODES[ASSEMBLY.REFERENCE]:
          const _variableId: number = this.readInt16();
          this.stack.push(this.envStack[this.envStack.length - 1][_variableId]);
          break;

        case OPCODES[ASSEMBLY.JUMP]:
          const address: number = this.readInt16();
          this.pc = address;
          break;

        case OPCODES[ASSEMBLY.JUMP_IF_FALSE]:
          const _address: number = this.readInt16();
          const condition: number = this.stack.pop()!;
          if (condition === 0) {
            this.pc = _address;
          }
          break;

        case OPCODES[ASSEMBLY.RETURN]:
          if (this.callStack.length === 0) {
            throw new Error("Call stack underflow");
          }
          this.envStack.pop();
          this.pc = this.callStack.pop()!;
          break;

        case OPCODES[ASSEMBLY.FUNCTION_CALL]:
          const targetAddress: number = this.readInt16();
          const argsCount: number = this.readInt16();
          const newEnv: { [key: number]: number } = {};

          for (let i: number = 0; i < argsCount; i++) {
            newEnv[i] = this.stack.pop()!;
          }

          this.envStack.push(newEnv);
          this.callStack.push(this.pc);
          this.pc = targetAddress;
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
      case OPCODES[ASSEMBLY.EQUAL]:
        return x == y ? 1 : 0;
      case OPCODES[ASSEMBLY.NOT_EQUAL]:
        return x != y ? 1 : 0;
      default:
        throw new Error(`Unkown opcode:${opcode}`);
    }
  }
}
