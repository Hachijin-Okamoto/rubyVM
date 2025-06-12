import fs from "fs";
import { Node } from "./modules/ast/interface";
import path from "path";
import { MyVM } from "./modules/VM/myVM";

function generateAssembly(node: Node): string[] {
  switch (node.type) {
    case "program_node":
      return generateAssembly(node.statements);

    case "statements_node":
      return node.body.flatMap(generateAssembly);

    case "integer_node":
      return [`PUSH ${node.value}`];

    case "call_node": {
      const receiverCode = node.receiver ? generateAssembly(node.receiver) : [];
      const argsCode = node.arguments.arguments.flatMap(generateAssembly);

      if (node.name === "+") {
        return [...receiverCode, ...argsCode, "ADD"];
      } else if (node.name === "puts") {
        return [...argsCode, "PUTS"];
      } else {
        return [...receiverCode, ...argsCode, `CALL ${node.name}`];
      }
    }

    case "arguments_node":
      return node.arguments.flatMap(generateAssembly);

    default:
      throw new Error("Unknown node type");
  }
}

// TODO:ファイル分割
const OPCODES: Record<string, number> = {
  PUSH: 0x01,
  ADD: 0x02,
  PUTS: 0x03,
  HALT: 0xff,
};

function assemble(assemblyLines: string[]): Uint8Array {
  const bytes: number[] = [];

  for (const line of assemblyLines) {
    const [instr, ...args] = line.split(" ");

    const opcode = OPCODES[instr];
    if (opcode === undefined) {
      throw new Error(`Unknown instruction: ${instr}`);
    }

    bytes.push(opcode);

    for (const arg of args) {
      const num = Number(arg);
      if (Number.isNaN(num)) {
        throw new Error(`Invalid operand: ${arg}`);
      }

      // リトルエンディアン
      bytes.push(num & 0xff);
      bytes.push((num >> 8) & 0xff);
    }
  }

  return new Uint8Array(bytes);
}

const ast_data: string = fs.readFileSync(
  path.join(__dirname, "modules/ast/ast.json"),
  "utf-8",
);
const ast: Node = JSON.parse(ast_data);
const assembly: string[] = generateAssembly(ast);

// * アセンブリ風コードを見たいときは以下をコメントから戻す

// console.log(assembly);

// * ここまで

const bytecode: Uint8Array = assemble(assembly);

// * バイトコードを見たいときは以下をコメントから戻す

// console.log(bytecode);

// * ここまで

const VM: MyVM = new MyVM(bytecode);
VM.run();
