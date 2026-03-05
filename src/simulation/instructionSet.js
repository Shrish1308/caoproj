// Instruction Set Definitions for the CPU Simulator

export const INSTRUCTIONS = {
  LOAD: {
    opcode: 0x01,
    name: 'LOAD',
    description: 'Load value from memory into register',
    format: 'LOAD Rd, [addr]',
    cycles: 1,
    type: 'memory',
  },
  LOADI: {
    opcode: 0x02,
    name: 'LOADI',
    description: 'Load immediate value into register',
    format: 'LOADI Rd, #value',
    cycles: 1,
    type: 'memory',
  },
  STORE: {
    opcode: 0x03,
    name: 'STORE',
    description: 'Store register value to memory',
    format: 'STORE Rs, [addr]',
    cycles: 1,
    type: 'memory',
  },
  ADD: {
    opcode: 0x10,
    name: 'ADD',
    description: 'Add two registers, store in first',
    format: 'ADD Rd, Rs',
    cycles: 1,
    type: 'arithmetic',
  },
  SUB: {
    opcode: 0x11,
    name: 'SUB',
    description: 'Subtract second register from first',
    format: 'SUB Rd, Rs',
    cycles: 1,
    type: 'arithmetic',
  },
  MUL: {
    opcode: 0x12,
    name: 'MUL',
    description: 'Multiply two registers, store in first',
    format: 'MUL Rd, Rs',
    cycles: 2,
    type: 'arithmetic',
  },
  AND: {
    opcode: 0x20,
    name: 'AND',
    description: 'Bitwise AND of two registers',
    format: 'AND Rd, Rs',
    cycles: 1,
    type: 'logic',
  },
  OR: {
    opcode: 0x21,
    name: 'OR',
    description: 'Bitwise OR of two registers',
    format: 'OR Rd, Rs',
    cycles: 1,
    type: 'logic',
  },
  JMP: {
    opcode: 0x30,
    name: 'JMP',
    description: 'Unconditional jump to address',
    format: 'JMP addr',
    cycles: 1,
    type: 'control',
  },
  JZ: {
    opcode: 0x31,
    name: 'JZ',
    description: 'Jump if zero flag is set',
    format: 'JZ addr',
    cycles: 1,
    type: 'control',
  },
  CMP: {
    opcode: 0x32,
    name: 'CMP',
    description: 'Compare two registers (sets zero flag if equal)',
    format: 'CMP Rd, Rs',
    cycles: 1,
    type: 'control',
  },
  HALT: {
    opcode: 0xFF,
    name: 'HALT',
    description: 'Stop execution',
    format: 'HALT',
    cycles: 1,
    type: 'control',
  },
};

/**
 * Parse a register reference like "R0" to its index
 */
function parseRegister(token) {
  const match = token.match(/^R(\d)$/i);
  if (!match) return null;
  const idx = parseInt(match[1]);
  if (idx < 0 || idx > 7) return null;
  return idx;
}

/**
 * Parse an assembly text into an array of instruction objects
 */
export function parseProgram(text) {
  const lines = text.split('\n');
  const instructions = [];
  const labels = {};

  // First pass: collect labels
  let instrIndex = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('//')) continue;
    const labelMatch = trimmed.match(/^(\w+):$/);
    if (labelMatch) {
      labels[labelMatch[1]] = instrIndex;
      continue;
    }
    instrIndex++;
  }

  // Second pass: parse instructions
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('//') || trimmed.match(/^\w+:$/)) continue;

    // Remove inline comments
    const code = trimmed.split(';')[0].split('//')[0].trim();
    const parts = code.split(/[\s,]+/).filter(Boolean);
    const mnemonic = parts[0].toUpperCase();

    const instrDef = INSTRUCTIONS[mnemonic];
    if (!instrDef) {
      instructions.push({ error: true, raw: trimmed, message: `Unknown instruction: ${mnemonic}` });
      continue;
    }

    const instr = { ...instrDef, raw: trimmed, operands: [] };

    switch (mnemonic) {
      case 'HALT':
        break;

      case 'LOAD': {
        const rd = parseRegister(parts[1]);
        const addr = parts[2] ? parseInt(parts[2].replace(/[\[\]]/g, '')) : 0;
        instr.operands = [rd, addr];
        break;
      }

      case 'LOADI': {
        const rd = parseRegister(parts[1]);
        const val = parts[2] ? parseInt(parts[2].replace('#', '')) : 0;
        instr.operands = [rd, val];
        break;
      }

      case 'STORE': {
        const rs = parseRegister(parts[1]);
        const addr = parts[2] ? parseInt(parts[2].replace(/[\[\]]/g, '')) : 0;
        instr.operands = [rs, addr];
        break;
      }

      case 'ADD':
      case 'SUB':
      case 'MUL':
      case 'AND':
      case 'OR':
      case 'CMP': {
        const rd = parseRegister(parts[1]);
        const rs = parseRegister(parts[2]);
        instr.operands = [rd, rs];
        break;
      }

      case 'JMP': {
        let addr = labels[parts[1]] !== undefined ? labels[parts[1]] : parseInt(parts[1]);
        instr.operands = [addr];
        break;
      }

      case 'JZ': {
        let addr = labels[parts[1]] !== undefined ? labels[parts[1]] : parseInt(parts[1]);
        instr.operands = [addr];
        break;
      }

      default:
        break;
    }

    instructions.push(instr);
  }

  return instructions;
}

/**
 * Sample programs for the CPU simulator
 */
export const SAMPLE_PROGRAMS = {
  'Simple Addition': `; Add two numbers
LOADI R0, #10
LOADI R1, #25
ADD R0, R1
STORE R0, [100]
HALT`,

  'Counter Loop': `; Count from 5 down to 0
LOADI R0, #5
LOADI R1, #1
LOADI R2, #0
loop:
SUB R0, R1
CMP R0, R2
JZ 6
JMP 3
HALT`,

  'Memory Copy': `; Copy values between memory locations
LOADI R0, #42
STORE R0, [10]
LOADI R0, #99
STORE R0, [11]
LOAD R1, [10]
LOAD R2, [11]
ADD R1, R2
STORE R1, [20]
HALT`,

  'Multiply by Shifts': `; Multiply 6 * 3 using repeated addition
LOADI R0, #0
LOADI R1, #6
LOADI R2, #3
LOADI R3, #1
loop:
ADD R0, R1
SUB R2, R3
LOADI R4, #0
CMP R2, R4
JZ 9
JMP 4
STORE R0, [50]
HALT`,

  'Bitwise Operations': `; Demonstrate AND and OR
LOADI R0, #15
LOADI R1, #9
AND R0, R1
STORE R0, [30]
LOADI R2, #6
LOADI R3, #3
OR R2, R3
STORE R2, [31]
HALT`,
};
