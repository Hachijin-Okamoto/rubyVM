import fs from "fs";
import { Node } from "./modules/ast/interface";
import path from "path";
import { MyVM } from "./modules/VM/myVM";
import { ASSEMBLY } from "./constants";
import { OPCODES } from "./modules/VM/constants";

// * ジャンプ命令に使用するラベルの作成用

let labelId: number = 0;
function getNewLabel(): string {
  return `LABEL_${labelId++}`;
}

// * ここまで

function generateAssembly(node: Node): string[] {
  switch (node.type) {
    case "program_node":
      return generateAssembly(node.statements);

    case "statements_node":
      return node.body.flatMap(generateAssembly);

    case "integer_node":
      return [ASSEMBLY.NUMBER + ` ${node.value}`];

    case "call_node": {
      if (node.name === "exit") {
        return [ASSEMBLY.END];
      }
      const receiverCode: string[] = node.receiver
        ? generateAssembly(node.receiver)
        : [];
      const argsCode: string[] =
        node.arguments.arguments.flatMap(generateAssembly);

      switch (node.name) {
        case "+":
          return [...receiverCode, ...argsCode, ASSEMBLY.ADDITION];
        case "-":
          return [...receiverCode, ...argsCode, ASSEMBLY.SUBTRACTION];
        case "*":
          return [...receiverCode, ...argsCode, ASSEMBLY.MULTIPLICATION];
        case "/":
          return [...receiverCode, ...argsCode, ASSEMBLY.DIVISION];
        case "%":
          return [...receiverCode, ...argsCode, ASSEMBLY.REMAINDER];
        case "**":
          return [...receiverCode, ...argsCode, ASSEMBLY.POWER];
        case ">":
          return [...receiverCode, ...argsCode, ASSEMBLY.GREATER];
        case "<":
          return [...receiverCode, ...argsCode, ASSEMBLY.LESS];
        case ">=":
          return [...receiverCode, ...argsCode, ASSEMBLY.GREATER_EQUAL];
        case "<=":
          return [...receiverCode, ...argsCode, ASSEMBLY.LESS_EQUAL];
        case "==":
          return [...receiverCode, ...argsCode, ASSEMBLY.EQUAL];
        case "!=":
          return [...receiverCode, ...argsCode, ASSEMBLY.NOT_EQUAL];
        case "puts":
          return [...argsCode, ASSEMBLY.OUTPUT];
        case "print":
          return [...argsCode, ASSEMBLY.OUTPUT];
        default:
          return [
            ...receiverCode,
            ...argsCode,
            ASSEMBLY.FUNCTION_CALL + ` ${node.name}`,
          ];
      }
    }

    case "arguments_node":
      return node.arguments.flatMap(generateAssembly);

    case "local_variable_write_node":
      const valueCode: string[] = generateAssembly(node.value);
      return [...valueCode, ASSEMBLY.ASSIGNMENT + ` ${node.name}`];

    case "local_variable_read_node":
      return [ASSEMBLY.REFERENCE + ` ${node.name}`];

    case "if_node":
      const conditionCode: string[] = generateAssembly(node.predicate);
      const bodyCode: string[] = generateAssembly(node.statements);

      const endLabel: string = getNewLabel();

      return [
        ...conditionCode,
        ASSEMBLY.JUMP_IF_FALSE + ` ${endLabel}`,
        ...bodyCode,
        `${endLabel}:`,
      ];

    case "for_node":
      const indexName: string = node.index.name;
      const indexCode: string[] = generateAssembly({
        type: "local_variable_read_node",
        name: indexName,
      });
      const startCode: string[] = generateAssembly(node.collection.left);
      const endCode: string[] = generateAssembly(node.collection.right);
      const _bodyCode: string[] = generateAssembly(node.statements);

      const loopStartLabel: string = getNewLabel();
      const loopEndLabel: string = getNewLabel();

      return [
        ...startCode,
        ASSEMBLY.ASSIGNMENT + ` ${indexName}`,
        `${loopStartLabel}:`,
        ...indexCode,
        ...endCode,
        ASSEMBLY.LESS_EQUAL,
        ASSEMBLY.JUMP_IF_FALSE + ` ${loopEndLabel}`,
        ..._bodyCode,
        ...indexCode,
        ASSEMBLY.NUMBER + " 1",
        ASSEMBLY.ADDITION,
        ASSEMBLY.ASSIGNMENT + ` ${indexName}`,
        ASSEMBLY.JUMP + ` ${loopStartLabel}`,
        `${loopEndLabel}:`,
      ];

    case "range_node":
      return [];

    case "while_node":
      const _loopStartLabel: string = getNewLabel();
      const _loopEndLabel: string = getNewLabel();
      const predicateCode: string[] = generateAssembly(node.predicate);
      const __bodyCode: string[] = generateAssembly(node.statements);

      return [
        `${_loopStartLabel}:`,
        ...predicateCode,
        ASSEMBLY.JUMP_IF_FALSE + ` ${_loopEndLabel}`,
        ...__bodyCode,
        ASSEMBLY.JUMP + ` ${_loopStartLabel}`,
        `${_loopEndLabel}:`,
      ];

    case "string_node":
      const stringValue: string = node.unescaped;
      return [ASSEMBLY.STRING + ` ${stringValue}`];

    default:
      throw new Error(`Unknown node type:${node.type}`);
  }
}

// * 変数名をバイトコードに相互変換する用

const variableTable: Map<string, number> = new Map<string, number>();
let variableId: number = 0;
function getVariableId(name: string): number {
  if (!variableTable.has(name)) {
    variableTable.set(name, variableId++);
  }
  return variableTable.get(name)!;
}

// * ここまで

function assemble(assemblyLines: string[]): Uint8Array {
  const exceptLabelLines: string[] = [];
  const labelTable: Map<string, number> = new Map<string, number>();
  let labelAddress: number = 0;

  // ラベルの位置を保存
  for (const line of assemblyLines) {
    if (line.endsWith(":")) {
      const label: string = line.slice(0, -1);
      labelTable.set(label, labelAddress);
      continue;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [instr, ...args] = line.split(" ");
    exceptLabelLines.push(line);
    labelAddress += 1 + args.length * 2;
  }

  const bytes: number[] = [];

  for (const line of exceptLabelLines) {
    const [instr, ...args] = line.split(" ");

    const opcode: number = OPCODES[instr];
    if (opcode === undefined) {
      throw new Error(`Unknown instruction: ${instr}`);
    }

    bytes.push(opcode);

    // TODO:ここもうちょっときれいにする
    for (const arg of args) {
      if (instr === ASSEMBLY.STRING) {
        const encoded: Uint8Array = new TextEncoder().encode(arg);
        bytes.push(encoded.length & 0xff);
        bytes.push((encoded.length >> 8) & 0xff);
        bytes.push(...encoded);
        continue;
      }

      let num: number;
      if (!Number.isNaN(Number(arg))) {
        num = Number(arg);
      } else if (labelTable.has(arg)) {
        num = labelTable.get(arg)!;
      } else {
        num = getVariableId(arg);
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

console.log("<Assembly-like Code>");
for (const line of assembly) {
  console.log(line);
}

// * ここまで

const bytecode: Uint8Array = assemble(assembly);

// * バイトコードを見たいときは以下をコメントから戻す

console.log("<Byte Code>");
console.log(bytecode);

// * ここまで

const VM: MyVM = new MyVM(bytecode);
console.log("<Standard Output>");
VM.run();
