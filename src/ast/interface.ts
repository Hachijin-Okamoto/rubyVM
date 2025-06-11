// astに関する型定義をまとめたファイル

export type Node = | ProgramNode | StatementsNode | CallNode | ArgumentsNode | IntegerNode;

interface ProgramNode {
    type: "program_node";
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
    arguments: ArgumentsNode[];
}

interface ArgumentsNode {
    type: "arguments_node";
    arguments: Node[];
}

interface IntegerNode {
    type: "integer_node";
    value: number;
}