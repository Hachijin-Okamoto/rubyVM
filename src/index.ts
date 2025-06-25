/* index.ts */

/**
 * エントリポイント
 */
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

/**
 * 関数周りに使用するラベルの作成用
 * @param name 関数名
 * @returns ラベル（関数名を平文で含む）
 */
function getNewFuncLabel(name: string): string {
  return `LABEL_${name}`;
}

const functionTable: Map<string, string[]> = new Map<string, string[]>();

function generateAssembly(node: Node): string[] {
  switch (node.type) {
    case "program_node":
      return generateAssembly(node.statements);

    case "statements_node":
      return node.body.flatMap(generateAssembly);

    case "integer_node":
      // 高速化
      if (node.value === 1) {
        return [ASSEMBLY.NUMBER1];
      } else if (node.value === 2) {
        return [ASSEMBLY.NUMBER2];
      }
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

      if (functionTable.has(node.name)) {
        const funcInfo: string[] = functionTable.get(node.name)!;
        const argsCount: number = funcInfo.length;
        return [
          ...receiverCode,
          ...argsCode,
          `${ASSEMBLY.FUNCTION_CALL} ${node.name} ${argsCount}`,
        ];
      }
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
        case "[]=":
          return [...receiverCode, ...argsCode, ASSEMBLY.ARRAY_ASSIGNMENT];
        case "[]":
          return [...receiverCode, ...argsCode, ASSEMBLY.ARRAY_REFERRENCE];
        case "shuffle":
          return [...argsCode, ASSEMBLY.SHUFFLE];
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

    case "def_node":
      functionTable.set(
        node.name,
        node.parameters.requireds.map((param) => param.name),
      );
      const functionDefnitionLabel: string = getNewFuncLabel(node.name);
      const ___bodyCode: string[] = generateAssembly(node.body);
      return [`${functionDefnitionLabel}:`, ...___bodyCode]; // 常にreturn文が書かれているという想定

    case "return_node": {
      const returnValueCode: string[] = generateAssembly(node.arguments);
      return [...returnValueCode, ASSEMBLY.RETURN];
    }

    case "array_node": {
      const elementsCode: string[] = node.elements.flatMap((element: Node) => generateAssembly(element));
      return [...elementsCode, ASSEMBLY.ARRAY_DEFINITION + ` ${node.elements.length}`];

    }
    default:
      throw new Error(`Unknown node type:${node.type}`);
  }
}

/**
 * generateAssemblyによって生成されたアセンブリ列から、関数内のLOAD命令を削除
 * @param assembly generateAssemblyによって生成されたアセンブリ列
 * @returns 関数内のLOAD命令を削除したアセンブリ列
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function postProcessAssembly(assembly: string[]): string[] {
  const result: string[] = [];
  let inFunction: boolean = false;

  for (const line of assembly) {
    if (line.match(/^LABEL_[a-zA-Z]/)) {
      inFunction = true;
      result.push(line);
      continue;
    }

    if (inFunction && line.startsWith("LOAD ")) {
      continue;
    }

    if (inFunction && (line === "RET" || line === "RETURN")) {
      result.push(line);
      inFunction = false;
      continue;
    }

    result.push(line);
  }

  return result;
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

/**
 *
 * @param assemblyLines 関数"generateAssembly"によって生成されたアセンブリ風コード
 * @returns バイトコード列（10進表記）
 */
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

    const [instr, ...args] = line.split(" ");
    exceptLabelLines.push(line);

    if (instr === ASSEMBLY.STRING) {
      const _encoded: Uint8Array = new TextEncoder().encode(args.join(" "));
      labelAddress += 1 + 2 + _encoded.length;
    } else {
      labelAddress += 1 + args.length * 2;
    }
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
      let num: number;
      if (instr === ASSEMBLY.STRING) {
        const encoded: Uint8Array = new TextEncoder().encode(arg);
        bytes.push(encoded.length & 0xff);
        bytes.push((encoded.length >> 8) & 0xff);
        bytes.push(...encoded);
        continue;
      }

      if (instr === ASSEMBLY.FUNCTION_CALL) {
        if (!Number.isNaN(Number(arg))) {
          num = Number(arg);
        } else {
          num = labelTable.get(`LABEL_${arg}`)!;
        }
      } else if (!Number.isNaN(Number(arg))) {
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

const startTime: number = Date.now();
VM.run();
const endTime: number = Date.now();

console.log(`${endTime - startTime}ms`);
