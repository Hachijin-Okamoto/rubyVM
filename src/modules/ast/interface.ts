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
  | RangeNode;

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
  collection: Node;
  statements: StatementsNode;
}

interface RangeNode {
  type: "range_node";
  flags?: number;
  left: Node;
  right: Node;
}
