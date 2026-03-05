// CPU Simulation Engine
// Simulates ALU, Control Unit, Registers, and Memory

export const PHASES = ['FETCH', 'DECODE', 'EXECUTE'];

/**
 * Create initial CPU state
 */
export function createCPUState() {
    return {
        registers: new Array(8).fill(0),      // R0-R7
        memory: new Array(256).fill(0),        // 256 memory cells
        pc: 0,                                  // Program Counter
        ir: null,                               // Instruction Register
        zeroFlag: false,                        // Zero flag
        halted: false,                          // Halt status
        phase: 'FETCH',                         // Current pipeline phase
        cycleCount: 0,                          // Total cycles
        activeComponent: null,                  // Which component is active
        dataPath: null,                         // Current data movement info
        aluOperation: null,                     // Current ALU operation string
        aluResult: null,                        // Last ALU result
        log: [],                                // Execution log
    };
}

/**
 * Deep clone the CPU state
 */
export function cloneState(state) {
    return {
        ...state,
        registers: [...state.registers],
        memory: [...state.memory],
        ir: state.ir ? { ...state.ir } : null,
        dataPath: state.dataPath ? { ...state.dataPath } : null,
        log: [...state.log],
    };
}

/**
 * Execute one full instruction cycle (Fetch → Decode → Execute)
 * Returns an array of sub-step states for animation
 */
export function executeStep(state, instructions) {
    if (state.halted || state.pc >= instructions.length) {
        const s = cloneState(state);
        s.halted = true;
        s.log = [...s.log, `[Cycle ${s.cycleCount}] Program halted.`];
        return [s];
    }

    const steps = [];

    // FETCH PHASE
    const fetchState = cloneState(state);
    fetchState.phase = 'FETCH';
    fetchState.activeComponent = 'CU';
    fetchState.ir = instructions[fetchState.pc];
    fetchState.dataPath = { from: 'MEMORY', to: 'CU', label: `Fetch instruction ${fetchState.pc}` };
    fetchState.log = [...fetchState.log, `[Cycle ${fetchState.cycleCount}] FETCH: Loading instruction at PC=${fetchState.pc}: ${fetchState.ir?.raw || 'unknown'}`];
    steps.push(fetchState);

    // DECODE PHASE
    const decodeState = cloneState(fetchState);
    decodeState.phase = 'DECODE';
    decodeState.activeComponent = 'CU';
    decodeState.dataPath = { from: 'CU', to: 'CU', label: `Decode: ${decodeState.ir?.name || ''}` };
    decodeState.log = [...decodeState.log, `[Cycle ${decodeState.cycleCount}] DECODE: ${decodeState.ir?.name} - ${decodeState.ir?.description || ''}`];
    steps.push(decodeState);

    // EXECUTE PHASE
    const execState = cloneState(decodeState);
    execState.phase = 'EXECUTE';
    execState.cycleCount++;

    const instr = execState.ir;
    if (!instr || instr.error) {
        execState.halted = true;
        execState.log = [...execState.log, `[Cycle ${execState.cycleCount}] ERROR: Invalid instruction`];
        steps.push(execState);
        return steps;
    }

    switch (instr.name) {
        case 'LOADI': {
            const [rd, val] = instr.operands;
            execState.registers[rd] = val;
            execState.activeComponent = 'REGISTERS';
            execState.dataPath = { from: 'CU', to: 'REGISTERS', label: `R${rd} ← #${val}` };
            execState.aluOperation = null;
            execState.log = [...execState.log, `[Cycle ${execState.cycleCount}] EXECUTE: LOADI R${rd}, #${val} → R${rd} = ${val}`];
            break;
        }

        case 'LOAD': {
            const [rd, addr] = instr.operands;
            execState.registers[rd] = execState.memory[addr];
            execState.activeComponent = 'MEMORY';
            execState.dataPath = { from: 'MEMORY', to: 'REGISTERS', label: `R${rd} ← MEM[${addr}]` };
            execState.aluOperation = null;
            execState.log = [...execState.log, `[Cycle ${execState.cycleCount}] EXECUTE: LOAD R${rd}, [${addr}] → R${rd} = ${execState.memory[addr]}`];
            break;
        }

        case 'STORE': {
            const [rs, addr] = instr.operands;
            execState.memory[addr] = execState.registers[rs];
            execState.activeComponent = 'MEMORY';
            execState.dataPath = { from: 'REGISTERS', to: 'MEMORY', label: `MEM[${addr}] ← R${rs}` };
            execState.aluOperation = null;
            execState.log = [...execState.log, `[Cycle ${execState.cycleCount}] EXECUTE: STORE R${rs}, [${addr}] → MEM[${addr}] = ${execState.registers[rs]}`];
            break;
        }

        case 'ADD': {
            const [rd, rs] = instr.operands;
            const a = execState.registers[rd];
            const b = execState.registers[rs];
            execState.registers[rd] = a + b;
            execState.aluOperation = `${a} + ${b} = ${a + b}`;
            execState.aluResult = a + b;
            execState.activeComponent = 'ALU';
            execState.dataPath = { from: 'REGISTERS', to: 'ALU', label: `R${rd} = R${rd} + R${rs}` };
            execState.zeroFlag = (a + b) === 0;
            execState.log = [...execState.log, `[Cycle ${execState.cycleCount}] EXECUTE: ADD R${rd}, R${rs} → ${a} + ${b} = ${a + b}`];
            break;
        }

        case 'SUB': {
            const [rd, rs] = instr.operands;
            const a = execState.registers[rd];
            const b = execState.registers[rs];
            execState.registers[rd] = a - b;
            execState.aluOperation = `${a} - ${b} = ${a - b}`;
            execState.aluResult = a - b;
            execState.activeComponent = 'ALU';
            execState.dataPath = { from: 'REGISTERS', to: 'ALU', label: `R${rd} = R${rd} - R${rs}` };
            execState.zeroFlag = (a - b) === 0;
            execState.log = [...execState.log, `[Cycle ${execState.cycleCount}] EXECUTE: SUB R${rd}, R${rs} → ${a} - ${b} = ${a - b}`];
            break;
        }

        case 'MUL': {
            const [rd, rs] = instr.operands;
            const a = execState.registers[rd];
            const b = execState.registers[rs];
            execState.registers[rd] = a * b;
            execState.aluOperation = `${a} × ${b} = ${a * b}`;
            execState.aluResult = a * b;
            execState.activeComponent = 'ALU';
            execState.dataPath = { from: 'REGISTERS', to: 'ALU', label: `R${rd} = R${rd} × R${rs}` };
            execState.cycleCount++; // MUL takes 2 cycles
            execState.log = [...execState.log, `[Cycle ${execState.cycleCount}] EXECUTE: MUL R${rd}, R${rs} → ${a} × ${b} = ${a * b}`];
            break;
        }

        case 'AND': {
            const [rd, rs] = instr.operands;
            const a = execState.registers[rd];
            const b = execState.registers[rs];
            execState.registers[rd] = a & b;
            execState.aluOperation = `${a} & ${b} = ${a & b}`;
            execState.aluResult = a & b;
            execState.activeComponent = 'ALU';
            execState.dataPath = { from: 'REGISTERS', to: 'ALU', label: `R${rd} = R${rd} & R${rs}` };
            execState.log = [...execState.log, `[Cycle ${execState.cycleCount}] EXECUTE: AND R${rd}, R${rs} → ${a} & ${b} = ${a & b}`];
            break;
        }

        case 'OR': {
            const [rd, rs] = instr.operands;
            const a = execState.registers[rd];
            const b = execState.registers[rs];
            execState.registers[rd] = a | b;
            execState.aluOperation = `${a} | ${b} = ${a | b}`;
            execState.aluResult = a | b;
            execState.activeComponent = 'ALU';
            execState.dataPath = { from: 'REGISTERS', to: 'ALU', label: `R${rd} = R${rd} | R${rs}` };
            execState.log = [...execState.log, `[Cycle ${execState.cycleCount}] EXECUTE: OR R${rd}, R${rs} → ${a} | ${b} = ${a | b}`];
            break;
        }

        case 'JMP': {
            const [addr] = instr.operands;
            execState.pc = addr - 1; // Will be incremented after
            execState.activeComponent = 'CU';
            execState.dataPath = { from: 'CU', to: 'CU', label: `PC ← ${addr}` };
            execState.aluOperation = null;
            execState.log = [...execState.log, `[Cycle ${execState.cycleCount}] EXECUTE: JMP ${addr} → PC = ${addr}`];
            break;
        }

        case 'JZ': {
            const [addr] = instr.operands;
            if (execState.zeroFlag) {
                execState.pc = addr - 1;
                execState.log = [...execState.log, `[Cycle ${execState.cycleCount}] EXECUTE: JZ ${addr} → Zero flag SET, jumping to ${addr}`];
            } else {
                execState.log = [...execState.log, `[Cycle ${execState.cycleCount}] EXECUTE: JZ ${addr} → Zero flag NOT set, continuing`];
            }
            execState.activeComponent = 'CU';
            execState.dataPath = { from: 'CU', to: 'CU', label: execState.zeroFlag ? `PC ← ${addr}` : 'No jump' };
            execState.aluOperation = null;
            break;
        }

        case 'CMP': {
            const [rd, rs] = instr.operands;
            const a = execState.registers[rd];
            const b = execState.registers[rs];
            execState.zeroFlag = a === b;
            execState.aluOperation = `${a} == ${b} ? ${a === b}`;
            execState.aluResult = a === b ? 1 : 0;
            execState.activeComponent = 'ALU';
            execState.dataPath = { from: 'REGISTERS', to: 'ALU', label: `CMP R${rd}, R${rs}` };
            execState.log = [...execState.log, `[Cycle ${execState.cycleCount}] EXECUTE: CMP R${rd}, R${rs} → ${a} == ${b} ? ${a === b}`];
            break;
        }

        case 'HALT': {
            execState.halted = true;
            execState.activeComponent = 'CU';
            execState.dataPath = null;
            execState.aluOperation = null;
            execState.log = [...execState.log, `[Cycle ${execState.cycleCount}] EXECUTE: HALT → Program stopped`];
            break;
        }

        default:
            execState.log = [...execState.log, `[Cycle ${execState.cycleCount}] ERROR: Unknown instruction ${instr.name}`];
            execState.halted = true;
    }

    execState.pc++;
    steps.push(execState);

    return steps;
}
