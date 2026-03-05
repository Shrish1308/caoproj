// Pipeline Simulation Engine
// 5-stage pipeline: IF → ID → EX → MEM → WB
// Supports data hazard detection, control hazard detection, stalls, and forwarding

import { parseProgram } from './instructionSet';

export const PIPELINE_STAGES = ['IF', 'ID', 'EX', 'MEM', 'WB'];

const STAGE_COLORS = {
  IF:    '#00d4ff',  // blue
  ID:    '#7c3aed',  // purple
  EX:    '#10b981',  // emerald
  MEM:   '#f59e0b',  // orange
  WB:    '#ec4899',  // pink
};

export { STAGE_COLORS };

/**
 * Determine which registers an instruction writes to (destination)
 */
function getWriteRegs(instr) {
  if (!instr || instr.error) return [];
  const name = instr.name;
  switch (name) {
    case 'LOAD':
    case 'LOADI':
      return [instr.operands[0]]; // Rd
    case 'ADD':
    case 'SUB':
    case 'MUL':
    case 'AND':
    case 'OR':
      return [instr.operands[0]]; // Rd
    default:
      return [];
  }
}

/**
 * Determine which registers an instruction reads from (source)
 */
function getReadRegs(instr) {
  if (!instr || instr.error) return [];
  const name = instr.name;
  switch (name) {
    case 'ADD':
    case 'SUB':
    case 'MUL':
    case 'AND':
    case 'OR':
      return [instr.operands[0], instr.operands[1]]; // Rd (also read), Rs
    case 'CMP':
      return [instr.operands[0], instr.operands[1]];
    case 'STORE':
      return [instr.operands[0]]; // Rs
    case 'LOAD':
      return []; // address is immediate, not register
    default:
      return [];
  }
}

/**
 * Check if instruction is a branch/jump (control flow)
 */
function isBranch(instr) {
  if (!instr) return false;
  return ['JMP', 'JZ'].includes(instr.name);
}

/**
 * Detect data hazards (RAW) between an instruction in ID and instructions in later stages
 */
function detectDataHazards(pipelineState, currentCycle) {
  const hazards = [];
  const idEntry = pipelineState.find(e => e.stage === 'ID');
  if (!idEntry) return hazards;

  const readRegs = getReadRegs(idEntry.instruction);
  if (readRegs.length === 0) return hazards;

  // Check EX, MEM stages for write conflicts
  for (const otherEntry of pipelineState) {
    if (otherEntry === idEntry) continue;
    if (otherEntry.stage === 'EX' || otherEntry.stage === 'MEM') {
      const writeRegs = getWriteRegs(otherEntry.instruction);
      for (const wr of writeRegs) {
        if (wr !== null && wr !== undefined && readRegs.includes(wr)) {
          hazards.push({
            type: 'DATA',
            subtype: 'RAW',
            cycle: currentCycle,
            source: otherEntry.instruction.raw,
            sourceStage: otherEntry.stage,
            dependent: idEntry.instruction.raw,
            register: `R${wr}`,
            description: `RAW hazard: "${idEntry.instruction.raw}" reads R${wr} which "${otherEntry.instruction.raw}" hasn't written back yet`,
          });
        }
      }
    }
  }

  return hazards;
}

/**
 * Detect control hazards from branch/jump instructions
 */
function detectControlHazards(pipelineState, currentCycle) {
  const hazards = [];
  for (const entry of pipelineState) {
    if (entry.stage === 'ID' && isBranch(entry.instruction)) {
      hazards.push({
        type: 'CONTROL',
        subtype: 'BRANCH',
        cycle: currentCycle,
        source: entry.instruction.raw,
        sourceStage: 'ID',
        description: `Control hazard: branch "${entry.instruction.raw}" causes pipeline flush`,
      });
    }
  }
  return hazards;
}

/**
 * Run the full pipeline simulation
 * @param {string} assemblyText - Assembly program text
 * @param {boolean} enableForwarding - Whether to enable data forwarding
 * @returns {{ timeline, hazards, metrics, instructions }}
 */
export function runPipelineSimulation(assemblyText, enableForwarding = false) {
  const instructions = parseProgram(assemblyText);
  if (instructions.length === 0) {
    return { timeline: [], hazards: [], metrics: getEmptyMetrics(), instructions: [] };
  }

  // Remove any error instructions
  const validInstructions = instructions.filter(i => !i.error);
  if (validInstructions.length === 0) {
    return { timeline: [], hazards: [], metrics: getEmptyMetrics(), instructions: [] };
  }

  const timeline = [];       // Array of cycle snapshots
  const allHazards = [];     // All detected hazards
  let totalStalls = 0;

  // Pipeline register: each slot holds { instruction, instrIndex, stage } or null
  let pipeline = [];         // Active pipeline entries
  let nextInstrIndex = 0;    // Next instruction to fetch
  let cycle = 0;
  const maxCycles = 200;     // Safety limit
  let halted = false;
  let fetchBlocked = false;

  while (cycle < maxCycles) {
    cycle++;
    let stallThisCycle = false;
    let flushThisCycle = false;

    // ---- Advance pipeline: move each instruction to the next stage ----
    // Process from WB backwards to avoid conflicts

    // Remove completed (WB) instructions
    pipeline = pipeline.filter(e => e.stage !== 'WB');

    // Advance stages (backwards to avoid double-advancing)
    for (const entry of pipeline) {
      if (entry.stage === 'MEM') entry.stage = 'WB';
      else if (entry.stage === 'EX') entry.stage = 'MEM';
      else if (entry.stage === 'ID') entry.stage = 'EX';
      else if (entry.stage === 'IF') entry.stage = 'ID';
    }

    // ---- Hazard Detection ----
    const dataHazards = detectDataHazards(pipeline, cycle);
    const controlHazards = detectControlHazards(pipeline, cycle);

    // Handle data hazards
    if (dataHazards.length > 0 && !enableForwarding) {
      // Need to stall: keep ID instruction in ID, don't fetch new
      stallThisCycle = true;
      totalStalls++;

      // Revert the ID instruction back (it was just moved to EX)
      const exEntry = pipeline.find(e =>
        e.stage === 'EX' && dataHazards.some(h => h.dependent === e.instruction.raw)
      );
      if (exEntry) {
        exEntry.stage = 'ID'; // Push back to ID
        // Insert bubble in EX (remove the reverted one from EX perspective)
      }
    } else if (dataHazards.length > 0 && enableForwarding) {
      // With forwarding, only LOAD-use hazards cause stalls
      const loadUseHazards = dataHazards.filter(h => {
        const srcInstr = pipeline.find(e => e.instruction.raw === h.source);
        return srcInstr && srcInstr.instruction.name === 'LOAD' && h.sourceStage === 'EX';
      });
      if (loadUseHazards.length > 0) {
        stallThisCycle = true;
        totalStalls++;
        const exEntry = pipeline.find(e =>
          e.stage === 'EX' && loadUseHazards.some(h => h.dependent === e.instruction.raw)
        );
        if (exEntry) {
          exEntry.stage = 'ID';
        }
      }
      // Non-load hazards are resolved by forwarding — mark them but don't stall
    }

    // Handle control hazards
    if (controlHazards.length > 0) {
      flushThisCycle = true;
      // Flush any instruction in IF stage (fetched speculatively)
      pipeline = pipeline.filter(e => e.stage !== 'IF');
      totalStalls++;
    }

    allHazards.push(...dataHazards, ...controlHazards);

    // ---- Fetch new instruction ----
    if (!stallThisCycle && !halted && !fetchBlocked && nextInstrIndex < validInstructions.length) {
      const instr = validInstructions[nextInstrIndex];
      pipeline.push({
        instruction: instr,
        instrIndex: nextInstrIndex,
        stage: 'IF',
      });

      if (instr.name === 'HALT') {
        halted = true;
      }
      nextInstrIndex++;
    }

    // Build cycle snapshot
    const snapshot = {
      cycle,
      stages: pipeline.map(e => ({
        instruction: e.instruction,
        instrIndex: e.instrIndex,
        stage: e.stage,
        label: e.instruction.raw || e.instruction.name,
      })),
      hazards: [...dataHazards, ...controlHazards],
      stall: stallThisCycle,
      flush: flushThisCycle,
    };
    timeline.push(snapshot);

    // Check if pipeline is fully drained
    if (halted && pipeline.length === 0) break;
    if (nextInstrIndex >= validInstructions.length && pipeline.length === 0) break;
  }

  // Calculate metrics
  const totalCycles = timeline.length;
  const instrCount = validInstructions.length;
  const sequentialCycles = instrCount * PIPELINE_STAGES.length;
  const cpi = instrCount > 0 ? (totalCycles / instrCount).toFixed(2) : 0;
  const speedup = totalCycles > 0 ? (sequentialCycles / totalCycles).toFixed(2) : 0;

  const metrics = {
    totalCycles,
    instructionCount: instrCount,
    stallCycles: totalStalls,
    cpi: parseFloat(cpi),
    sequentialCycles,
    pipelinedCycles: totalCycles,
    speedup: parseFloat(speedup),
    dataHazards: allHazards.filter(h => h.type === 'DATA').length,
    controlHazards: allHazards.filter(h => h.type === 'CONTROL').length,
  };

  return { timeline, hazards: allHazards, metrics, instructions: validInstructions };
}

function getEmptyMetrics() {
  return {
    totalCycles: 0,
    instructionCount: 0,
    stallCycles: 0,
    cpi: 0,
    sequentialCycles: 0,
    pipelinedCycles: 0,
    speedup: 0,
    dataHazards: 0,
    controlHazards: 0,
  };
}

/**
 * Build a 2D pipeline grid for visualization
 * Rows = instructions, Columns = cycles
 * Each cell = stage name or 'STALL' or null
 */
export function buildPipelineGrid(timeline, instructions) {
  if (!timeline.length || !instructions.length) return { grid: [], totalCycles: 0 };

  const totalCycles = timeline.length;
  const grid = instructions.map(() => new Array(totalCycles).fill(null));

  for (let c = 0; c < timeline.length; c++) {
    const snapshot = timeline[c];
    for (const entry of snapshot.stages) {
      if (entry.instrIndex >= 0 && entry.instrIndex < instructions.length) {
        grid[entry.instrIndex][c] = entry.stage;
      }
    }
    // Mark stall cycles
    if (snapshot.stall) {
      for (let i = 0; i < instructions.length; i++) {
        if (grid[i][c] === null && c > 0 && grid[i][c - 1] !== null && grid[i][c - 1] !== 'WB') {
          // This instruction was stalled — it stayed in its previous stage
        }
      }
    }
  }

  return { grid, totalCycles };
}


/**
 * Sample programs specifically designed for pipeline demonstration
 */
export const PIPELINE_SAMPLE_PROGRAMS = {
  'No Hazards': `; Simple program with no hazards
LOADI R0, #10
LOADI R1, #20
LOADI R2, #30
LOADI R3, #40
HALT`,

  'Data Hazard (RAW)': `; R0 is written by ADD, then read by SUB
LOADI R0, #5
LOADI R1, #3
ADD R0, R1
SUB R2, R0
STORE R2, [10]
HALT`,

  'Load-Use Hazard': `; Load followed immediately by use
LOADI R1, #42
STORE R1, [10]
LOAD R0, [10]
ADD R0, R1
STORE R0, [20]
HALT`,

  'Control Hazard': `; Branch causes pipeline flush
LOADI R0, #5
LOADI R1, #1
LOADI R2, #0
CMP R0, R2
JZ 7
SUB R0, R1
JMP 3
HALT`,

  'Multiple Hazards': `; Program with both data and control hazards
LOADI R0, #10
LOADI R1, #3
ADD R2, R0
SUB R3, R2
LOADI R4, #0
CMP R3, R4
JZ 9
ADD R0, R1
JMP 5
HALT`,

  'Pipeline Stress Test': `; Many dependent instructions
LOADI R0, #1
LOADI R1, #2
ADD R0, R1
MUL R0, R1
SUB R1, R0
ADD R2, R1
STORE R2, [100]
LOAD R3, [100]
ADD R3, R0
STORE R3, [101]
HALT`,
};
