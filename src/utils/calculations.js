// Performance Calculation Utilities

/**
 * Calculate CPU execution time.
 * @param {number} clockRateGHz - Clock rate in GHz
 * @param {number} cpi - Average Cycles Per Instruction
 * @param {number} instructionCount - Total number of instructions
 * @returns {number} Execution time in seconds
 */
export function executionTime(clockRateGHz, cpi, instructionCount) {
    const clockRateHz = clockRateGHz * 1e9;
    return (instructionCount * cpi) / clockRateHz;
}

/**
 * Calculate MIPS (Million Instructions Per Second).
 * @param {number} clockRateGHz - Clock rate in GHz
 * @param {number} cpi - Average Cycles Per Instruction
 * @returns {number} MIPS value
 */
export function mips(clockRateGHz, cpi) {
    const clockRateHz = clockRateGHz * 1e9;
    return clockRateHz / (cpi * 1e6);
}

/**
 * Calculate speedup ratio.
 * @param {number} oldTime - Original execution time
 * @param {number} newTime - New execution time
 * @returns {number} Speedup ratio
 */
export function speedup(oldTime, newTime) {
    if (newTime === 0) return Infinity;
    return oldTime / newTime;
}

/**
 * Amdahl's Law - calculate theoretical speedup.
 * @param {number} fractionEnhanced - Fraction of execution time that can be enhanced (0-1)
 * @param {number} speedupEnhanced - Speedup of the enhanced portion
 * @returns {number} Overall speedup
 */
export function amdahlSpeedup(fractionEnhanced, speedupEnhanced) {
    return 1 / ((1 - fractionEnhanced) + (fractionEnhanced / speedupEnhanced));
}

/**
 * Calculate total clock cycles.
 * @param {number} cpi - Average CPI
 * @param {number} instructionCount - Total instructions
 * @returns {number} Total clock cycles
 */
export function totalClockCycles(cpi, instructionCount) {
    return cpi * instructionCount;
}

/**
 * Calculate throughput (instructions per second).
 * @param {number} instructionCount - Total instructions executed
 * @param {number} execTime - Execution time in seconds
 * @returns {number} Throughput in instructions/second
 */
export function throughput(instructionCount, execTime) {
    if (execTime === 0) return Infinity;
    return instructionCount / execTime;
}

/**
 * Format a large number with appropriate units.
 */
export function formatNumber(num) {
    if (!Number.isFinite(num)) return String(num);
    const abs = Math.abs(num);
    if (abs >= 1e12) return `${(num / 1e12).toFixed(2)} T`;
    if (abs >= 1e9) return `${(num / 1e9).toFixed(2)} G`;
    if (abs >= 1e6) return `${(num / 1e6).toFixed(2)} M`;
    if (abs >= 1e3) return `${(num / 1e3).toFixed(2)} K`;
    return num.toFixed(4);
}

/**
 * Format time with appropriate units.
 */
export function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return String(seconds);
    const abs = Math.abs(seconds);
    if (abs >= 1) return `${seconds.toFixed(4)} s`;
    if (abs >= 1e-3) return `${(seconds * 1e3).toFixed(4)} ms`;
    if (abs >= 1e-6) return `${(seconds * 1e6).toFixed(4)} us`;
    if (abs >= 1e-9) return `${(seconds * 1e9).toFixed(4)} ns`;
    return `${seconds.toExponential(4)} s`;
}
