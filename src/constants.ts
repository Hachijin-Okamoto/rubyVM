// eslint-disable-next-line @typescript-eslint/typedef
export const ASSEMBLY = {
  // 四則演算
  ADDITION: "ADD",
  SUBTRACTION: "SUB",
  MULTIPLICATION: "MUL",
  DIVISION: "DIV",
  REMAINDER: "REM",
  POWER: "POW",

  // 比較演算
  GREATER: "GT",
  LESS: "LT",
  GREATER_EQUAL: "GTE",
  LESS_EQUAL: "LTE",
  EQUAL: "EQ",
  NOT_EQUAL: "NEQ",

  // 変数
  ASSIGNMENT: "STORE",
  REFERENCE: "LOAD",
  ARRAY_DEFINITION: "ARRAY_NEW",
  ARRAY_ASSIGNMENT: "ARRAY_SET",
  ARRAY_REFERRENCE: "ARRAY_GET",

  // ジャンプ命令
  JUMP: "JUMP",
  JUMP_IF_FALSE: "JIF",

  // 関数呼び出し
  FUNCTION_DEFINITION: "DEF",
  RETURN: "RET",
  FUNCTION_CALL: "CALL",

  // その他
  OUTPUT: "PUTS",
  SHUFFLE: "SHUFFLE",
  NUMBER: "PUSH_NUM",
  STRING: "PUSH_STR",
  END: "HALT",

  // 高速化用
  NUMBER1: "PUSH_NUM1",
  NUMBER2: "PUSH_NUM2",
} as const;
