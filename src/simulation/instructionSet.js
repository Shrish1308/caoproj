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
  if (typeof token !== 'string') return null;
  const match = token.match(/^R(\d)$/i);
  if (!match) return null;
  const idx = parseInt(match[1], 10);
  if (idx < 0 || idx > 7) return null;
  return idx;
}

function parseInteger(token) {
  if (typeof token !== 'string') return null;
  const trimmed = token.trim();
  if (!/^-?\d+$/.test(trimmed)) return null;
  return parseInt(trimmed, 10);
}

function parseMemoryAddress(token) {
  const match = token?.match(/^\[(.+)\]$/);
  if (!match) {
    return { error: `Invalid memory address "${token}". Expected format [addr].` };
  }
  const addr = parseInteger(match[1]);
  if (addr === null) {
    return { error: `Invalid memory address "${token}". Address must be an integer.` };
  }
  if (addr < 0 || addr > 255) {
    return { error: `Memory address "${addr}" out of range. Valid range is 0-255.` };
  }
  return { value: addr };
}

function parseImmediate(token) {
  if (!token || !token.startsWith('#')) {
    return { error: `Invalid immediate "${token}". Expected format #value.` };
  }
  const value = parseInteger(token.slice(1));
  if (value === null) {
    return { error: `Invalid immediate "${token}". Value must be an integer.` };
  }
  return { value };
}

function parseJumpTarget(token, labels, instructionCount) {
  if (labels[token] !== undefined) {
    return { value: labels[token] };
  }
  const addr = parseInteger(token);
  if (addr === null) {
    return { error: `Invalid jump target "${token}". Use a label or integer address.` };
  }
  if (addr < 0 || addr >= instructionCount) {
    return { error: `Jump target "${addr}" out of range. Valid range is 0-${Math.max(instructionCount - 1, 0)}.` };
  }
  return { value: addr };
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
    const code = line.split(';')[0].split('//')[0].trim();
    if (!code) continue;

    const labelOnlyMatch = code.match(/^(\w+):$/);
    if (labelOnlyMatch) {
      labels[labelOnlyMatch[1]] = instrIndex;
      continue;
    }

    const labelInlineMatch = code.match(/^(\w+):\s*(.+)$/);
    if (labelInlineMatch) {
      labels[labelInlineMatch[1]] = instrIndex;
      if (labelInlineMatch[2].trim()) instrIndex++;
      continue;
    }

    instrIndex += 1;
  }

  // Second pass: parse instructions
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const trimmed = line.trim();

    // Remove inline comments
    const code = trimmed.split(';')[0].split('//')[0].trim();
    if (!code) continue;

    let instructionCode = code;
    const labelOnlyMatch = code.match(/^(\w+):$/);
    if (labelOnlyMatch) continue;

    const labelInlineMatch = code.match(/^(\w+):\s*(.+)$/);
    if (labelInlineMatch) {
      instructionCode = labelInlineMatch[2].trim();
      if (!instructionCode) continue;
    }

    const raw = instructionCode;
    const pushError = (message) => {
      instructions.push({
        error: true,
        raw,
        message: `Line ${lineIndex + 1}: ${message}`,
      });
    };

    const parts = instructionCode.split(/[\s,]+/).filter(Boolean);
    if (parts.length === 0) continue;
    const mnemonic = parts[0].toUpperCase();

    const instrDef = INSTRUCTIONS[mnemonic];
    if (!instrDef) {
      pushError(`Unknown instruction "${mnemonic}".`);
      continue;
    }

    const instr = { ...instrDef, raw, operands: [] };

    switch (mnemonic) {
      case 'HALT': {
        if (parts.length !== 1) {
          pushError('HALT does not take operands.');
          continue;
        }
        break;
      }

      case 'LOAD': {
        if (parts.length !== 3) {
          pushError('LOAD expects 2 operands: LOAD Rd, [addr].');
          continue;
        }
        const rd = parseRegister(parts[1]);
        if (rd === null) {
          pushError(`Invalid destination register "${parts[1]}". Valid registers are R0-R7.`);
          continue;
        }
        const parsedAddr = parseMemoryAddress(parts[2]);
        if (parsedAddr.error) {
          pushError(parsedAddr.error);
          continue;
        }
        instr.operands = [rd, parsedAddr.value];
        break;
      }

      case 'LOADI': {
        if (parts.length !== 3) {
          pushError('LOADI expects 2 operands: LOADI Rd, #value.');
          continue;
        }
        const rd = parseRegister(parts[1]);
        if (rd === null) {
          pushError(`Invalid destination register "${parts[1]}". Valid registers are R0-R7.`);
          continue;
        }
        const parsedImmediate = parseImmediate(parts[2]);
        if (parsedImmediate.error) {
          pushError(parsedImmediate.error);
          continue;
        }
        instr.operands = [rd, parsedImmediate.value];
        break;
      }

      case 'STORE': {
        if (parts.length !== 3) {
          pushError('STORE expects 2 operands: STORE Rs, [addr].');
          continue;
        }
        const rs = parseRegister(parts[1]);
        if (rs === null) {
          pushError(`Invalid source register "${parts[1]}". Valid registers are R0-R7.`);
          continue;
        }
        const parsedAddr = parseMemoryAddress(parts[2]);
        if (parsedAddr.error) {
          pushError(parsedAddr.error);
          continue;
        }
        instr.operands = [rs, parsedAddr.value];
        break;
      }

      case 'ADD':
      case 'SUB':
      case 'MUL':
      case 'AND':
      case 'OR':
      case 'CMP': {
        if (parts.length !== 3) {
          pushError(`${mnemonic} expects 2 operands: ${mnemonic} Rd, Rs.`);
          continue;
        }
        const rd = parseRegister(parts[1]);
        const rs = parseRegister(parts[2]);
        if (rd === null || rs === null) {
          pushError(`Invalid register in "${instructionCode}". Valid registers are R0-R7.`);
          continue;
        }
        instr.operands = [rd, rs];
        break;
      }

      case 'JMP': {
        if (parts.length !== 2) {
          pushError('JMP expects 1 operand: JMP addr_or_label.');
          continue;
        }
        const parsedTarget = parseJumpTarget(parts[1], labels, instrIndex);
        if (parsedTarget.error) {
          pushError(parsedTarget.error);
          continue;
        }
        instr.operands = [parsedTarget.value];
        break;
      }

      case 'JZ': {
        if (parts.length !== 2) {
          pushError('JZ expects 1 operand: JZ addr_or_label.');
          continue;
        }
        const parsedTarget = parseJumpTarget(parts[1], labels, instrIndex);
        if (parsedTarget.error) {
          pushError(parsedTarget.error);
          continue;
        }
        instr.operands = [parsedTarget.value];
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
