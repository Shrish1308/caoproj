// RISC Architecture Simulator

const RISC_CLOCK_RATE = 2.0; // GHz - higher clock rate for simpler instructions

/**
 * RISC characteristics:
 * - Fixed-length instructions (all 1 cycle except memory which is 2)
 * - Load-store architecture (only LOAD/STORE touch memory)
 * - Simple instructions, more of them needed
 * - Register-rich architecture
 */

const RISC_INSTRUCTIONS = {
    LOAD: { name: 'LOAD', cycles: 2, type: 'memory', description: 'Load from memory to register' },
    STORE: { name: 'STORE', cycles: 2, type: 'memory', description: 'Store register to memory' },
    ADD: { name: 'ADD', cycles: 1, type: 'arithmetic', description: 'Add two registers' },
    SUB: { name: 'SUB', cycles: 1, type: 'arithmetic', description: 'Subtract two registers' },
    MUL: { name: 'MUL', cycles: 1, type: 'arithmetic', description: 'Multiply two registers' },
    MOV: { name: 'MOV', cycles: 1, type: 'data', description: 'Move/load immediate' },
    CMP: { name: 'CMP', cycles: 1, type: 'control', description: 'Compare two registers' },
    BEQ: { name: 'BEQ', cycles: 1, type: 'control', description: 'Branch if equal' },
    BNE: { name: 'BNE', cycles: 1, type: 'control', description: 'Branch if not equal' },
    JMP: { name: 'JMP', cycles: 1, type: 'control', description: 'Unconditional jump' },
    NOP: { name: 'NOP', cycles: 1, type: 'control', description: 'No operation' },
    SHIFT: { name: 'SHIFT', cycles: 1, type: 'arithmetic', description: 'Shift register' },
};

/**
 * Programs represented as sequences of instruction names
 * Each program is designed to show RISC needing more instructions
 */
export const RISC_PROGRAMS = {
    'Array Sum': {
        description: 'Sum 10 elements of an array',
        instructions: [
            'MOV', 'MOV', 'MOV',           // Init: base addr, counter, sum=0
            'LOAD',                          // Load array element
            'ADD',                           // Add to sum
            'ADD',                           // Increment pointer (RISC: separate instruction)
            'SUB',                           // Decrement counter
            'CMP',                           // Compare counter to 0
            'BNE',                           // Branch back if not done
            'LOAD', 'ADD', 'ADD', 'SUB', 'CMP', 'BNE',   // iteration 2
            'LOAD', 'ADD', 'ADD', 'SUB', 'CMP', 'BNE',   // iteration 3
            'LOAD', 'ADD', 'ADD', 'SUB', 'CMP', 'BNE',   // iteration 4
            'LOAD', 'ADD', 'ADD', 'SUB', 'CMP', 'BNE',   // iteration 5
            'LOAD', 'ADD', 'ADD', 'SUB', 'CMP', 'BNE',   // iteration 6
            'LOAD', 'ADD', 'ADD', 'SUB', 'CMP', 'BNE',   // iteration 7
            'LOAD', 'ADD', 'ADD', 'SUB', 'CMP', 'BNE',   // iteration 8
            'LOAD', 'ADD', 'ADD', 'SUB', 'CMP', 'BNE',   // iteration 9
            'LOAD', 'ADD', 'ADD', 'SUB', 'CMP', 'BNE',   // iteration 10
            'STORE',                          // Store result
        ],
    },
    'Factorial': {
        description: 'Calculate factorial of 6',
        instructions: [
            'MOV', 'MOV', 'MOV',                // Init: n=6, result=1, one=1
            'MUL',                               // result *= n
            'SUB',                               // n -= 1
            'CMP',                               // compare n to 1
            'BNE',                               // branch if not done
            'MUL', 'SUB', 'CMP', 'BNE',        // iteration 2
            'MUL', 'SUB', 'CMP', 'BNE',        // iteration 3
            'MUL', 'SUB', 'CMP', 'BNE',        // iteration 4
            'MUL', 'SUB', 'CMP', 'BNE',        // iteration 5
            'STORE',                             // Store result
        ],
    },
    'Fibonacci': {
        description: 'Calculate 8th Fibonacci number',
        instructions: [
            'MOV', 'MOV', 'MOV', 'MOV',        // Init: a=0, b=1, counter=8, temp
            'MOV',                               // temp = a
            'ADD',                               // a = a + b
            'MOV',                               // b = temp
            'SUB',                               // counter--
            'CMP',                               // compare
            'BNE',                               // branch
            'MOV', 'ADD', 'MOV', 'SUB', 'CMP', 'BNE',  // iter 2
            'MOV', 'ADD', 'MOV', 'SUB', 'CMP', 'BNE',  // iter 3
            'MOV', 'ADD', 'MOV', 'SUB', 'CMP', 'BNE',  // iter 4
            'MOV', 'ADD', 'MOV', 'SUB', 'CMP', 'BNE',  // iter 5
            'MOV', 'ADD', 'MOV', 'SUB', 'CMP', 'BNE',  // iter 6
            'MOV', 'ADD', 'MOV', 'SUB', 'CMP', 'BNE',  // iter 7
            'STORE',
        ],
    },
    'Matrix Multiply (2x2)': {
        description: 'Multiply two 2x2 matrices',
        instructions: [
            // Load matrix A elements
            'LOAD', 'LOAD', 'LOAD', 'LOAD',
            // Load matrix B elements
            'LOAD', 'LOAD', 'LOAD', 'LOAD',
            // C[0][0] = A[0][0]*B[0][0] + A[0][1]*B[1][0]
            'MOV', 'MUL', 'MOV', 'MUL', 'ADD', 'STORE',
            // C[0][1] = A[0][0]*B[0][1] + A[0][1]*B[1][1]
            'MOV', 'MUL', 'MOV', 'MUL', 'ADD', 'STORE',
            // C[1][0] = A[1][0]*B[0][0] + A[1][1]*B[1][0]
            'MOV', 'MUL', 'MOV', 'MUL', 'ADD', 'STORE',
            // C[1][1] = A[1][0]*B[0][1] + A[1][1]*B[1][1]
            'MOV', 'MUL', 'MOV', 'MUL', 'ADD', 'STORE',
        ],
    },
};

/**
 * Run a RISC program and return performance metrics
 */
export function runRISCProgram(programName) {
    const program = RISC_PROGRAMS[programName];
    if (!program) return null;

    const instructions = program.instructions;
    let totalCycles = 0;
    const instructionBreakdown = {};

    for (const instrName of instructions) {
        const def = RISC_INSTRUCTIONS[instrName];
        totalCycles += def.cycles;

        if (!instructionBreakdown[def.type]) {
            instructionBreakdown[def.type] = { count: 0, cycles: 0 };
        }
        instructionBreakdown[def.type].count++;
        instructionBreakdown[def.type].cycles += def.cycles;
    }

    const instructionCount = instructions.length;
    const avgCPI = totalCycles / instructionCount;
    const executionTime = totalCycles / (RISC_CLOCK_RATE * 1e9) * 1e9; // nanoseconds
    const codeSize = instructionCount * 4; // Fixed 4 bytes per instruction

    return {
        architecture: 'RISC',
        programName,
        description: program.description,
        instructionCount,
        totalCycles,
        avgCPI: Math.round(avgCPI * 100) / 100,
        clockRate: RISC_CLOCK_RATE,
        executionTime: Math.round(executionTime * 100) / 100,
        codeSize,
        instructionBreakdown,
        instructions: instructions.map(name => ({
            name,
            ...RISC_INSTRUCTIONS[name],
        })),
    };
}
