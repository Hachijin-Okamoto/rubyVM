import { ASSEMBLY } from "../../constants";
import { OPCODES } from "./constants";

export class MyVM {
  pc: number;
  stack: number[] = [];
  code: Uint8Array;
  envStack: Array<number[]> = [];
  callStack: number[] = [];

  constructor(code: Uint8Array) {
    this.code = code;
    this.pc = this.findStart();
    this.envStack.push([]);
  }

  findStart(): number {
    for (let i: number = this.code.length - 1; i >= 0; i--) {
      if (this.code[i] === OPCODES[ASSEMBLY.RETURN]) {
        return i + 1;
      }
    }
    return 0;
  }

  // 実行時間計測
  instructionTimes: Map<number, bigint> = new Map();

  run() {
    while (this.pc < this.code.length) {
      const opcode: number = this.code[this.pc++];

      // * デバッグ用

      // console.log(this.stack);
      // console.log(this.envStack);
      // console.log("pc:", this.pc - 1, " opcode:", opcode.toString(16));

      // * ここまで

      // 実行時間計測
      const instStart: bigint = process.hrtime.bigint();

      switch (opcode) {
        case OPCODES[ASSEMBLY.NUMBER]:
          const val: number = this.readInt16();
          this.stack.push(val);
          break;

        // 高速化用
        case OPCODES[ASSEMBLY.NUMBER1]:
          this.stack.push(1);
          break;

        case OPCODES[ASSEMBLY.NUMBER2]:
          this.stack.push(2);
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
          const __b: number = this.stack.pop()!;
          const __a: number = this.stack.pop()!;
          this.stack.push(this.calc(__a, __b, opcode));
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

          /*
          const newEnv: { [key: number]: number } = {};

          for (let i: number = 0; i < argsCount; i++) {
            newEnv[i] = this.stack.pop()!;
          }

          this.envStack.push(newEnv);
          /*/
          const newEnv: number[] = [];

          for (let i: number = argsCount - 1; i >= 0; i--) {
            newEnv[i] = this.stack.pop()!;
          }

          this.envStack.push(newEnv);
          //*/

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

      // 実行時間計測
      const instEnd: bigint = process.hrtime.bigint();
      const prev: bigint = this.instructionTimes.get(opcode) ?? 0n;
      this.instructionTimes.set(opcode, prev + (instEnd - instStart));
    }

    console.log("命令別実行時間:");
    let numTime: number = 0;
    for (const [opcode, time] of this.instructionTimes.entries()) {
      const μs: number = Number(time) / 1_000; // ns → μs
      if (opcode === 20 || opcode === 161 || opcode === 162) {
        numTime += μs;
        continue;
      }
      console.log(`0x${opcode.toString(16)}: ${μs.toFixed(3)} μs`);
    }
    console.log(`PUSH_NUM: ${numTime.toFixed(3)} μs`);
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
