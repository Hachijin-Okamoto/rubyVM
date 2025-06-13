// astに関する型定義をまとめたファイル

export type Node =
  | ProgramNode
  | StatementsNode
  | CallNode
  | ArgumentsNode
  | IntegerNode
  | LocalVariableWriteNode
  | LocalVariableReadNode
  | LocalVariableTargetNode
  | IfNode
  | ForNode
  | RangeNode
  | WhileNode
  | StringNode
  | BreakNode
  | NextNode;

interface ProgramNode {
  type: "program_node";
  locals?: string[];
  statements: StatementsNode;
}

interface StatementsNode {
  type: "statements_node";
  body: Node[];
}

interface CallNode {
  type: "call_node";
  receiver: IntegerNode;
  name: string;
  arguments: ArgumentsNode;
}

interface ArgumentsNode {
  type: "arguments_node";
  arguments: Node[];
}

interface IntegerNode {
  type: "integer_node";
  value: number;
}

interface LocalVariableWriteNode {
  type: "local_variable_write_node";
  name: string;
  depth?: number;
  value: Node;
}

interface LocalVariableReadNode {
  type: "local_variable_read_node";
  name: string;
  depth?: number;
}

interface LocalVariableTargetNode {
  type: "local_variable_target_node";
  name: string;
  depth?: number;
}

interface IfNode {
  type: "if_node";
  predicate: Node;
  statements: StatementsNode;
}

interface ForNode {
  type: "for_node";
  index: LocalVariableTargetNode;
  collection: RangeNode;
  statements: StatementsNode;
}

interface RangeNode {
  type: "range_node";
  flags?: number;
  left: Node;
  right: Node;
}

interface WhileNode {
  type: "while_node";
  flags?: number;
  predicate: Node;
  statements: StatementsNode;
}

interface StringNode {
  type: "string_node";
  flags?: number;
  unescaped: string;
}

interface BreakNode {
  type: "break_node";
}

interface NextNode {
  type: "next_node";
}
