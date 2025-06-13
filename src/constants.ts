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

  // 変数
  ASSIGNMENT: "STORE",
  REFERENCE: "LOAD",

  // ジャンプ命令
  JUMP: "JUMP",
  JUMP_IF_FALSE: "JIF",

  // その他
  OUTPUT: "PUTS",
  FUNCTION_CALL: "CALL",
  NUMBER: "PUSH_NUM",
  STRING: "PUSH_STR",
  END: "HALT",
} as const;
