// CISC Architecture Simulator

const CISC_CLOCK_RATE = 1.2; // GHz - lower clock rate for complex instructions

/**
 * CISC characteristics:
 * - Variable-length instructions
 * - Memory-to-memory operations
 * - Complex instructions that do more per instruction
 * - Fewer instructions needed but each takes more cycles
 */

const CISC_INSTRUCTIONS = {
    MOVMEM: { name: 'MOVMEM', cycles: 4, type: 'memory', description: 'Move memory to memory' },
    LOADMUL: { name: 'LOADMUL', cycles: 5, type: 'arithmetic', description: 'Load and multiply in one' },
    ADDMEM: { name: 'ADDMEM', cycles: 4, type: 'arithmetic', description: 'Add memory to register' },
    SUBMEM: { name: 'SUBMEM', cycles: 4, type: 'arithmetic', description: 'Subtract memory from register' },
    MULMEM: { name: 'MULMEM', cycles: 5, type: 'arithmetic', description: 'Multiply memory with register' },
    LOAD: { name: 'LOAD', cycles: 3, type: 'memory', description: 'Load from memory' },
    STORE: { name: 'STORE', cycles: 3, type: 'memory', description: 'Store to memory' },
    MOV: { name: 'MOV', cycles: 1, type: 'data', description: 'Move/load immediate' },
    ADD: { name: 'ADD', cycles: 1, type: 'arithmetic', description: 'Add two registers' },
    MUL: { name: 'MUL', cycles: 3, type: 'arithmetic', description: 'Multiply two registers' },
    LOOP: { name: 'LOOP', cycles: 3, type: 'control', description: 'Loop with auto-decrement' },
    CMP: { name: 'CMP', cycles: 1, type: 'control', description: 'Compare values' },
    JNZ: { name: 'JNZ', cycles: 2, type: 'control', description: 'Jump if not zero' },
    PUSH: { name: 'PUSH', cycles: 2, type: 'memory', description: 'Push to stack' },
    POP: { name: 'POP', cycles: 2, type: 'memory', description: 'Pop from stack' },
    CALL: { name: 'CALL', cycles: 4, type: 'control', description: 'Function call' },
    RET: { name: 'RET', cycles: 3, type: 'control', description: 'Return from function' },
    MADD: { name: 'MADD', cycles: 6, type: 'arithmetic', description: 'Multiply-accumulate' },
};

/**
 * Programs represented as sequences of instruction names
 * Each program shows CISC using fewer but more complex instructions
 */
export const CISC_PROGRAMS = {
    'Array Sum': {
        description: 'Sum 10 elements of an array',
        instructions: [
            'MOV', 'MOV',                    // Init: base addr, sum=0
            'ADDMEM',                         // Add memory directly to register (combined load+add)
            'ADDMEM',                         // iteration 2
            'ADDMEM',                         // iteration 3
            'ADDMEM',                         // iteration 4
            'ADDMEM',                         // iteration 5
            'ADDMEM',                         // iteration 6
            'ADDMEM',                         // iteration 7
            'ADDMEM',                         // iteration 8
            'ADDMEM',                         // iteration 9
            'ADDMEM',                         // iteration 10
            'STORE',                          // Store result
        ],
    },
    'Factorial': {
        description: 'Calculate factorial of 6',
        instructions: [
            'MOV', 'MOV',                     // Init: n=6, result=1
            'MULMEM',                          // result *= n; n-- (complex instruction)
            'LOOP',                            // Auto-decrement and branch
            'MULMEM', 'LOOP',                 // iteration 2
            'MULMEM', 'LOOP',                 // iteration 3
            'MULMEM', 'LOOP',                 // iteration 4
            'MULMEM', 'LOOP',                 // iteration 5
            'STORE',                           // Store result
        ],
    },
    'Fibonacci': {
        description: 'Calculate 8th Fibonacci number',
        instructions: [
            'MOV', 'MOV', 'MOV',              // Init: a=0, b=1, counter=8
            'ADDMEM',                           // temp = a+b (memory-to-memory)
            'MOVMEM',                           // shift values
            'LOOP',                             // auto-dec counter + branch
            'ADDMEM', 'MOVMEM', 'LOOP',       // iter 2
            'ADDMEM', 'MOVMEM', 'LOOP',       // iter 3
            'ADDMEM', 'MOVMEM', 'LOOP',       // iter 4
            'ADDMEM', 'MOVMEM', 'LOOP',       // iter 5
            'ADDMEM', 'MOVMEM', 'LOOP',       // iter 6
            'ADDMEM', 'MOVMEM', 'LOOP',       // iter 7
            'STORE',
        ],
    },
    'Matrix Multiply (2x2)': {
        description: 'Multiply two 2x2 matrices',
        instructions: [
            // CISC can do multiply-accumulate and memory-to-memory
            // C[0][0]
            'MADD', 'MADD', 'STORE',
            // C[0][1]
            'MADD', 'MADD', 'STORE',
            // C[1][0]
            'MADD', 'MADD', 'STORE',
            // C[1][1]
            'MADD', 'MADD', 'STORE',
        ],
    },
};

/**
 * Run a CISC program and return performance metrics
 */
export function runCISCProgram(programName) {
    const program = CISC_PROGRAMS[programName];
    if (!program) return null;

    const instructions = program.instructions;
    let totalCycles = 0;
    const instructionBreakdown = {};

    for (const instrName of instructions) {
        const def = CISC_INSTRUCTIONS[instrName];
        totalCycles += def.cycles;

        if (!instructionBreakdown[def.type]) {
            instructionBreakdown[def.type] = { count: 0, cycles: 0 };
        }
        instructionBreakdown[def.type].count++;
        instructionBreakdown[def.type].cycles += def.cycles;
    }

    const instructionCount = instructions.length;
    const avgCPI = totalCycles / instructionCount;
    const executionTime = totalCycles / (CISC_CLOCK_RATE * 1e9) * 1e9; // nanoseconds

    // CISC has variable-length instructions (1-6 bytes)
    const bytesPerType = { memory: 5, arithmetic: 6, data: 3, control: 4 };
    let codeSize = 0;
    for (const instrName of instructions) {
        const def = CISC_INSTRUCTIONS[instrName];
        codeSize += bytesPerType[def.type] || 4;
    }

    return {
        architecture: 'CISC',
        programName,
        description: program.description,
        instructionCount,
        totalCycles,
        avgCPI: Math.round(avgCPI * 100) / 100,
        clockRate: CISC_CLOCK_RATE,
        executionTime: Math.round(executionTime * 100) / 100,
        codeSize,
        instructionBreakdown,
        instructions: instructions.map(name => ({
            name,
            ...CISC_INSTRUCTIONS[name],
        })),
    };
}
