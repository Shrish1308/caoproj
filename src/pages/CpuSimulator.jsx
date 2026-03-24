import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createCPUState, executeStep } from '../simulation/cpu';
import { parseProgram, SAMPLE_PROGRAMS } from '../simulation/instructionSet';
import './CpuSimulator.css';

const SPEED_OPTIONS = [
    { label: 'Slow', ms: 1500 },
    { label: 'Normal', ms: 800 },
    { label: 'Fast', ms: 300 },
];

export default function CpuSimulator() {
    const [code, setCode] = useState(SAMPLE_PROGRAMS['Simple Addition']);
    const [cpuState, setCpuState] = useState(createCPUState());
    const [instructions, setInstructions] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [speedIdx, setSpeedIdx] = useState(1);
    const [parseErrors, setParseErrors] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const intervalRef = useRef(null);
    const stateRef = useRef(cpuState);

    useEffect(() => {
        stateRef.current = cpuState;
    }, [cpuState]);

    const handleLoad = useCallback(() => {
        const parsed = parseProgram(code);
        const errors = parsed.filter((instr) => instr.error);
        setParseErrors(errors);
        setInstructions(errors.length > 0 ? [] : parsed);
        setCpuState(createCPUState());
        setIsRunning(false);
        setLoaded(errors.length === 0 && parsed.length > 0);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, [code]);

    const stepForward = useCallback(() => {
        if (stateRef.current.halted || instructions.length === 0) return;
        const steps = executeStep(stateRef.current, instructions);
        if (steps.length > 0) {
            const finalState = steps[steps.length - 1];
            setCpuState(finalState);
            stateRef.current = finalState;
        }
    }, [instructions]);

    const handlePlay = useCallback(() => {
        if (stateRef.current.halted || instructions.length === 0) return;
        setIsRunning(true);
    }, [instructions.length]);

    const handlePause = useCallback(() => {
        setIsRunning(false);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const handleReset = useCallback(() => {
        setIsRunning(false);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setCpuState(createCPUState());
    }, []);

    const handleSampleChange = (e) => {
        const name = e.target.value;
        if (SAMPLE_PROGRAMS[name]) {
            setCode(SAMPLE_PROGRAMS[name]);
            setLoaded(false);
            setIsRunning(false);
            setParseErrors([]);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            setCpuState(createCPUState());
        }
    };

    useEffect(() => {
        if (!isRunning) return undefined;
        intervalRef.current = setInterval(() => {
            if (stateRef.current.halted) {
                setIsRunning(false);
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
                return;
            }
            stepForward();
        }, SPEED_OPTIONS[speedIdx].ms);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isRunning, speedIdx, stepForward]);

    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, []);

    const activePhase = cpuState.phase;
    const activeComponent = cpuState.activeComponent;
    const dataPath = cpuState.dataPath;

    // Find non-zero memory cells for display
    const activeMemCells = [];
    for (let i = 0; i < 256; i++) {
        if (cpuState.memory[i] !== 0) {
            activeMemCells.push({ addr: i, val: cpuState.memory[i] });
        }
    }

    return (
        <div className="cpu-sim-page">
            <div className="cpu-sim-header">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    CPU Architecture <span className="gradient-text">Simulator</span>
                </motion.h1>
                <p>Visualize the Fetch → Decode → Execute cycle in real time</p>
            </div>

            <div className="cpu-sim-layout">
                {/* Left Panel - Code Editor */}
                <div className="sim-panel code-panel glass-card">
                    <div className="panel-header">
                        <h3>📝 Assembly Code</h3>
                        <select onChange={handleSampleChange} className="sample-select">
                            {Object.keys(SAMPLE_PROGRAMS).map((name) => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>
                    <textarea
                        className="code-editor"
                        value={code}
                        onChange={(e) => {
                            setCode(e.target.value);
                            setLoaded(false);
                            setParseErrors([]);
                        }}
                        spellCheck={false}
                        rows={14}
                    />
                    <div className="code-controls">
                        <button className="btn-primary" onClick={handleLoad}>
                            ⚡ Load Program
                        </button>
                    </div>
                    {parseErrors.length > 0 && (
                        <div className="parse-errors">
                            {parseErrors.slice(0, 4).map((err, idx) => (
                                <div key={`${err.raw}-${idx}`} className="parse-error">
                                    {err.message}
                                </div>
                            ))}
                            {parseErrors.length > 4 && (
                                <div className="parse-error">+{parseErrors.length - 4} more parsing errors</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Panel - CPU Visualization */}
                <div className="sim-panel vis-panel">
                    {/* Controls Bar */}
                    <div className="controls-bar glass-card">
                        <button className="ctrl-btn" onClick={stepForward} disabled={!loaded || isRunning || cpuState.halted} title="Step Forward">
                            ⏭️ Step
                        </button>
                        {!isRunning ? (
                            <button className="ctrl-btn play" onClick={handlePlay} disabled={!loaded || cpuState.halted} title="Play">
                                ▶️ Play
                            </button>
                        ) : (
                            <button className="ctrl-btn pause" onClick={handlePause} title="Pause">
                                ⏸️ Pause
                            </button>
                        )}
                        <button className="ctrl-btn" onClick={handleReset} disabled={!loaded} title="Reset">
                            🔄 Reset
                        </button>
                        <div className="speed-control">
                            <span>Speed:</span>
                            {SPEED_OPTIONS.map((s, i) => (
                                <button key={s.label} className={`speed-btn ${i === speedIdx ? 'active' : ''}`} onClick={() => setSpeedIdx(i)}>
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Status Bar */}
                    <div className="status-bar glass-card">
                        <div className="status-item">
                            <span className="status-label">PC</span>
                            <span className="status-value mono">{cpuState.pc}</span>
                        </div>
                        <div className="status-item">
                            <span className="status-label">Phase</span>
                            <span className={`status-value phase-badge ${activePhase.toLowerCase()}`}>{activePhase}</span>
                        </div>
                        <div className="status-item">
                            <span className="status-label">Cycles</span>
                            <span className="status-value mono">{cpuState.cycleCount}</span>
                        </div>
                        <div className="status-item">
                            <span className="status-label">Status</span>
                            <span className={`status-value ${cpuState.halted ? 'halted' : 'running-badge'}`}>
                                {cpuState.halted ? '⏹ Halted' : loaded ? '● Active' : '○ Ready'}
                            </span>
                        </div>
                    </div>

                    {/* CPU Diagram */}
                    <div className="cpu-diagram">
                        {/* Data Path Label */}
                        <AnimatePresence>
                            {dataPath && (
                                <motion.div
                                    className="data-path-label"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    key={dataPath.label}
                                >
                                    <span className="path-arrow">→</span> {dataPath.label}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="cpu-components">
                            {/* Control Unit */}
                            <motion.div
                                className={`cpu-component cu-box ${activeComponent === 'CU' ? 'active' : ''}`}
                                animate={activeComponent === 'CU' ? { scale: [1, 1.05, 1], borderColor: ['rgba(124,58,237,0.3)', 'rgba(124,58,237,0.8)', 'rgba(124,58,237,0.3)'] } : {}}
                                transition={{ duration: 0.6 }}
                            >
                                <div className="comp-label">Control Unit</div>
                                <div className="comp-detail mono">
                                    {cpuState.ir ? `IR: ${cpuState.ir.name}` : 'IR: —'}
                                </div>
                                <div className="comp-phase">{activePhase}</div>
                            </motion.div>

                            {/* ALU */}
                            <motion.div
                                className={`cpu-component alu-box ${activeComponent === 'ALU' ? 'active' : ''}`}
                                animate={activeComponent === 'ALU' ? { scale: [1, 1.05, 1], borderColor: ['rgba(0,212,255,0.3)', 'rgba(0,212,255,0.8)', 'rgba(0,212,255,0.3)'] } : {}}
                                transition={{ duration: 0.6 }}
                            >
                                <div className="comp-label">ALU</div>
                                <div className="comp-detail mono">
                                    {cpuState.aluOperation || '—'}
                                </div>
                                <div className="comp-sublabel">
                                    ZF: {cpuState.zeroFlag ? '1' : '0'}
                                </div>
                            </motion.div>

                            {/* Registers */}
                            <motion.div
                                className={`cpu-component reg-box ${activeComponent === 'REGISTERS' ? 'active' : ''}`}
                                animate={activeComponent === 'REGISTERS' ? { scale: [1, 1.03, 1], borderColor: ['rgba(16,185,129,0.3)', 'rgba(16,185,129,0.8)', 'rgba(16,185,129,0.3)'] } : {}}
                                transition={{ duration: 0.6 }}
                            >
                                <div className="comp-label">Registers</div>
                                <div className="reg-grid">
                                    {cpuState.registers.map((val, i) => (
                                        <div key={i} className={`reg-cell ${val !== 0 ? 'has-value' : ''}`}>
                                            <span className="reg-name">R{i}</span>
                                            <span className="reg-val">{val}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Memory */}
                            <motion.div
                                className={`cpu-component mem-box ${activeComponent === 'MEMORY' ? 'active' : ''}`}
                                animate={activeComponent === 'MEMORY' ? { scale: [1, 1.03, 1], borderColor: ['rgba(245,158,11,0.3)', 'rgba(245,158,11,0.8)', 'rgba(245,158,11,0.3)'] } : {}}
                                transition={{ duration: 0.6 }}
                            >
                                <div className="comp-label">Memory</div>
                                {activeMemCells.length > 0 ? (
                                    <div className="mem-cells">
                                        {activeMemCells.slice(0, 8).map(({ addr, val }) => (
                                            <div key={addr} className="mem-cell">
                                                <span className="mem-addr">[{addr}]</span>
                                                <span className="mem-val">{val}</span>
                                            </div>
                                        ))}
                                        {activeMemCells.length > 8 && <span className="mem-more">+{activeMemCells.length - 8} more</span>}
                                    </div>
                                ) : (
                                    <div className="comp-detail">All cells: 0</div>
                                )}
                            </motion.div>
                        </div>

                        {/* Connection lines (SVG) */}
                        <svg className="connections-svg" viewBox="0 0 600 300" preserveAspectRatio="none">
                            <defs>
                                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                                    <polygon points="0 0, 10 3.5, 0 7" fill="rgba(0,212,255,0.6)" />
                                </marker>
                            </defs>
                            {/* CU to ALU */}
                            <line x1="200" y1="70" x2="400" y2="70" className={`conn-line ${dataPath?.from === 'CU' && dataPath?.to === 'ALU' ? 'active' : ''}`} markerEnd="url(#arrowhead)" />
                            {/* CU to Memory */}
                            <line x1="150" y1="100" x2="150" y2="180" className={`conn-line ${dataPath?.from === 'CU' && dataPath?.to === 'MEMORY' ? 'active' : ''}`} markerEnd="url(#arrowhead)" />
                            {/* Registers to ALU */}
                            <line x1="400" y1="200" x2="450" y2="120" className={`conn-line ${dataPath?.from === 'REGISTERS' && dataPath?.to === 'ALU' ? 'active' : ''}`} markerEnd="url(#arrowhead)" />
                            {/* Memory to Registers */}
                            <line x1="200" y1="220" x2="350" y2="220" className={`conn-line ${dataPath?.from === 'MEMORY' && dataPath?.to === 'REGISTERS' ? 'active' : ''}`} markerEnd="url(#arrowhead)" />
                            {/* Registers to Memory */}
                            <line x1="350" y1="240" x2="200" y2="240" className={`conn-line ${dataPath?.from === 'REGISTERS' && dataPath?.to === 'MEMORY' ? 'active' : ''}`} markerEnd="url(#arrowhead)" />
                            {/* CU to Registers */}
                            <line x1="250" y1="100" x2="370" y2="180" className={`conn-line ${dataPath?.from === 'CU' && dataPath?.to === 'REGISTERS' ? 'active' : ''}`} markerEnd="url(#arrowhead)" />
                            {/* Memory to CU */}
                            <line x1="100" y1="180" x2="100" y2="100" className={`conn-line ${dataPath?.from === 'MEMORY' && dataPath?.to === 'CU' ? 'active' : ''}`} markerEnd="url(#arrowhead)" />
                        </svg>
                    </div>

                    {/* Execution Log */}
                    <div className="exec-log glass-card">
                        <h3>📋 Execution Log</h3>
                        <div className="log-entries">
                            {cpuState.log.length === 0 ? (
                                <div className="log-empty">Load a program and step through to see the execution log.</div>
                            ) : (
                                cpuState.log.slice(-10).map((entry, i) => (
                                    <div key={i} className={`log-entry ${entry.includes('ERROR') ? 'error' : ''} ${entry.includes('HALT') ? 'halt' : ''}`}>
                                        {entry}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
