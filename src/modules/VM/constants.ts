import { ASSEMBLY } from "../../constants";

export const OPCODES: Record<string, number> = {
  [ASSEMBLY.NUMBER]: 0x01,
  [ASSEMBLY.ADDITION]: 0x02,
  [ASSEMBLY.OUTPUT]: 0x03,
  [ASSEMBLY.END]: 0xff,
} as const;
