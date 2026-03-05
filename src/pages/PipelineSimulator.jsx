import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { runPipelineSimulation, buildPipelineGrid, PIPELINE_STAGES, STAGE_COLORS, PIPELINE_SAMPLE_PROGRAMS } from '../simulation/pipeline';
import './PipelineSimulator.css';

const SPEED_OPTIONS = [
    { label: 'Slow', ms: 1200 },
    { label: 'Normal', ms: 600 },
    { label: 'Fast', ms: 200 },
];

const stageColorMap = {
    IF: 'var(--accent-blue)',
    ID: 'var(--accent-purple)',
    EX: 'var(--accent-emerald)',
    MEM: 'var(--accent-orange)',
    WB: 'var(--accent-pink)',
};

const stageBgMap = {
    IF: 'var(--accent-blue-dim)',
    ID: 'var(--accent-purple-dim)',
    EX: 'var(--accent-emerald-dim)',
    MEM: 'var(--accent-orange-dim)',
    WB: 'var(--accent-pink-dim)',
};

export default function PipelineSimulator() {
    const [code, setCode] = useState(Object.values(PIPELINE_SAMPLE_PROGRAMS)[0]);
    const [simResult, setSimResult] = useState(null);
    const [currentCycle, setCurrentCycle] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speedIdx, setSpeedIdx] = useState(1);
    const [forwarding, setForwarding] = useState(false);
    const [hasRun, setHasRun] = useState(false);
    const intervalRef = useRef(null);
    const gridRef = useRef(null);

    // Run simulation
    const handleRun = useCallback(() => {
        stopPlayback();
        const result = runPipelineSimulation(code, forwarding);
        setSimResult(result);
        setCurrentCycle(0);
        setHasRun(true);
    }, [code, forwarding]);

    const handleReset = useCallback(() => {
        stopPlayback();
        setSimResult(null);
        setCurrentCycle(0);
        setHasRun(false);
    }, []);

    const stopPlayback = useCallback(() => {
        setIsPlaying(false);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const handleStep = useCallback(() => {
        if (!simResult) return;
        stopPlayback();
        setCurrentCycle(prev => Math.min(prev + 1, simResult.timeline.length - 1));
    }, [simResult, stopPlayback]);

    const handlePlay = useCallback(() => {
        if (!simResult) return;
        if (isPlaying) {
            stopPlayback();
        } else {
            setIsPlaying(true);
        }
    }, [simResult, isPlaying, stopPlayback]);

    // Auto-advance when playing
    useEffect(() => {
        if (isPlaying && simResult) {
            intervalRef.current = setInterval(() => {
                setCurrentCycle(prev => {
                    if (prev >= simResult.timeline.length - 1) {
                        stopPlayback();
                        return prev;
                    }
                    return prev + 1;
                });
            }, SPEED_OPTIONS[speedIdx].ms);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isPlaying, speedIdx, simResult, stopPlayback]);

    // Auto-scroll pipeline grid
    useEffect(() => {
        if (gridRef.current && simResult) {
            const cell = gridRef.current.querySelector(`.cycle-col-${currentCycle}`);
            if (cell) {
                cell.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        }
    }, [currentCycle, simResult]);

    const handleSampleChange = (e) => {
        const val = e.target.value;
        if (PIPELINE_SAMPLE_PROGRAMS[val]) {
            setCode(PIPELINE_SAMPLE_PROGRAMS[val]);
            handleReset();
        }
    };

    // Build pipeline grid data
    const gridData = simResult ? buildPipelineGrid(simResult.timeline, simResult.instructions) : null;

    // Get current cycle hazards
    const currentHazards = simResult && simResult.timeline[currentCycle]
        ? simResult.timeline[currentCycle].hazards
        : [];

    // Performance comparison chart data
    const perfData = simResult ? [
        {
            name: 'Total Cycles',
            Sequential: simResult.metrics.sequentialCycles,
            Pipelined: simResult.metrics.pipelinedCycles,
        },
        {
            name: 'CPI',
            Sequential: PIPELINE_STAGES.length,
            Pipelined: simResult.metrics.cpi,
        },
    ] : [];

    const speedupData = simResult ? [
        {
            name: 'Speedup',
            value: simResult.metrics.speedup,
        },
    ] : [];

    return (
        <div className="pipeline-page">
            <motion.div
                className="pipeline-header"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1>
                    <span className="gradient-text">Pipeline</span> Simulator
                </h1>
                <p>Visualize the 5-stage instruction pipeline with hazard detection and stall analysis</p>
            </motion.div>

            <div className="pipeline-layout">
                {/* Left Panel: Code Editor */}
                <motion.div
                    className="code-panel glass-card"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <div className="panel-header">
                        <h3>📝 Assembly Code</h3>
                        <select className="sample-select" onChange={handleSampleChange} defaultValue="">
                            <option value="" disabled>Load Sample…</option>
                            {Object.keys(PIPELINE_SAMPLE_PROGRAMS).map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>
                    <textarea
                        className="code-editor"
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        spellCheck={false}
                        placeholder="Enter assembly instructions..."
                    />

                    <div className="forwarding-toggle">
                        <label className="toggle-label">
                            <input
                                type="checkbox"
                                checked={forwarding}
                                onChange={e => setForwarding(e.target.checked)}
                            />
                            <span className="toggle-switch" />
                            <span>Data Forwarding</span>
                        </label>
                    </div>

                    <div className="code-controls">
                        <button className="btn-primary" onClick={handleRun}>
                            🚀 Run Pipeline
                        </button>
                    </div>

                    {/* Stage Legend */}
                    <div className="stage-legend">
                        {PIPELINE_STAGES.map(stage => (
                            <div key={stage} className="legend-item">
                                <span className={`legend-dot stage-${stage.toLowerCase()}`} />
                                <span className="legend-label">{stage}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Right Panel: Visualization */}
                <div className="vis-panel">
                    {/* Controls */}
                    {hasRun && simResult && (
                        <motion.div
                            className="controls-bar glass-card"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <button
                                className={`ctrl-btn ${isPlaying ? 'pause' : 'play'}`}
                                onClick={handlePlay}
                            >
                                {isPlaying ? '⏸ Pause' : '▶ Play'}
                            </button>
                            <button className="ctrl-btn" onClick={handleStep}
                                disabled={!simResult || currentCycle >= simResult.timeline.length - 1}>
                                ⏭ Step
                            </button>
                            <button className="ctrl-btn" onClick={handleReset}>
                                ↺ Reset
                            </button>

                            <div className="cycle-indicator">
                                <span className="cycle-label">Cycle</span>
                                <span className="cycle-value">{currentCycle + 1}</span>
                                <span className="cycle-total">/ {simResult.timeline.length}</span>
                            </div>

                            <div className="speed-control">
                                <span>Speed:</span>
                                {SPEED_OPTIONS.map((opt, i) => (
                                    <button
                                        key={opt.label}
                                        className={`speed-btn ${speedIdx === i ? 'active' : ''}`}
                                        onClick={() => setSpeedIdx(i)}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Pipeline Diagram */}
                    {hasRun && simResult && gridData && (
                        <motion.div
                            className="pipeline-grid-container glass-card"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h3 className="grid-title">🔀 Pipeline Diagram</h3>
                            <div className="pipeline-grid-scroll" ref={gridRef}>
                                <table className="pipeline-grid">
                                    <thead>
                                        <tr>
                                            <th className="instr-header">Instruction</th>
                                            {Array.from({ length: gridData.totalCycles }).map((_, i) => (
                                                <th
                                                    key={i}
                                                    className={`cycle-header ${i === currentCycle ? 'current' : ''} cycle-col-${i}`}
                                                >
                                                    C{i + 1}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {simResult.instructions.map((instr, instrIdx) => (
                                            <tr key={instrIdx}>
                                                <td className="instr-cell">
                                                    <span className="instr-index">#{instrIdx + 1}</span>
                                                    <span className="instr-text">{instr.raw || instr.name}</span>
                                                </td>
                                                {gridData.grid[instrIdx].map((stage, cycleIdx) => {
                                                    const isCurrent = cycleIdx === currentCycle;
                                                    const isVisible = cycleIdx <= currentCycle;
                                                    return (
                                                        <td
                                                            key={cycleIdx}
                                                            className={`stage-cell cycle-col-${cycleIdx} ${isCurrent ? 'current-cycle' : ''} ${stage && isVisible ? `stage-${stage.toLowerCase()} filled` : ''} ${!isVisible ? 'future' : ''}`}
                                                        >
                                                            {stage && isVisible && (
                                                                <motion.div
                                                                    className="stage-badge"
                                                                    initial={{ scale: 0.5, opacity: 0 }}
                                                                    animate={{ scale: 1, opacity: 1 }}
                                                                    transition={{ duration: 0.2 }}
                                                                >
                                                                    {stage}
                                                                </motion.div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {/* Hazards Panel */}
                    {hasRun && simResult && simResult.hazards.length > 0 && (
                        <motion.div
                            className="hazards-panel glass-card"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <h3 className="hazards-title">⚠️ Detected Hazards</h3>
                            <div className="hazards-list">
                                {simResult.hazards.map((hazard, i) => (
                                    <motion.div
                                        key={i}
                                        className={`hazard-item ${hazard.type.toLowerCase()}`}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <span className={`hazard-badge ${hazard.type.toLowerCase()}`}>
                                            {hazard.type}
                                        </span>
                                        {hazard.subtype && (
                                            <span className="hazard-subtype">{hazard.subtype}</span>
                                        )}
                                        <span className="hazard-cycle">Cycle {hazard.cycle}</span>
                                        <p className="hazard-desc">{hazard.description}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Metrics & Performance */}
                    {hasRun && simResult && (
                        <motion.div
                            className="metrics-section"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            {/* Stats Cards */}
                            <div className="stats-grid">
                                {[
                                    { label: 'Instructions', value: simResult.metrics.instructionCount, icon: '📋', color: 'blue' },
                                    { label: 'Total Cycles', value: simResult.metrics.pipelinedCycles, icon: '🔄', color: 'purple' },
                                    { label: 'CPI', value: simResult.metrics.cpi, icon: '📊', color: 'emerald' },
                                    { label: 'Stalls', value: simResult.metrics.stallCycles, icon: '⏸️', color: 'orange' },
                                    { label: 'Speedup', value: `${simResult.metrics.speedup}×`, icon: '⚡', color: 'pink' },
                                    { label: 'Data Hazards', value: simResult.metrics.dataHazards, icon: '🔴', color: 'red' },
                                ].map((stat, i) => (
                                    <motion.div
                                        key={stat.label}
                                        className={`stat-card glass-card color-${stat.color}`}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 + i * 0.05 }}
                                    >
                                        <div className="stat-icon">{stat.icon}</div>
                                        <div className="stat-value">{stat.value}</div>
                                        <div className="stat-label">{stat.label}</div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Performance Comparison Chart */}
                            <div className="perf-chart glass-card">
                                <h3>📈 Performance Comparison</h3>
                                <p className="chart-subtitle">Sequential (no pipeline) vs Pipelined execution</p>
                                <div className="chart-wrapper">
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart data={perfData} barGap={8}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                            <XAxis dataKey="name" stroke="#8b949e" fontSize={12} />
                                            <YAxis stroke="#8b949e" fontSize={12} />
                                            <Tooltip
                                                contentStyle={{
                                                    background: '#0d1117',
                                                    border: '1px solid rgba(48,54,61,0.6)',
                                                    borderRadius: '8px',
                                                    color: '#e6edf3',
                                                    fontSize: '0.85rem',
                                                }}
                                            />
                                            <Legend />
                                            <Bar dataKey="Sequential" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="Pipelined" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Execution Log */}
                    {hasRun && simResult && (
                        <motion.div
                            className="exec-log glass-card"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <h3>📜 Cycle-by-Cycle Log</h3>
                            <div className="log-entries">
                                {simResult.timeline.slice(0, currentCycle + 1).map((snap, i) => (
                                    <div key={i} className={`log-entry ${snap.stall ? 'stall' : ''} ${snap.flush ? 'flush' : ''}`}>
                                        <span className="log-cycle">Cycle {snap.cycle}:</span>
                                        {snap.stages.map((s, j) => (
                                            <span key={j} className={`log-stage stage-text-${s.stage.toLowerCase()}`}>
                                                {s.stage}({s.label})
                                            </span>
                                        ))}
                                        {snap.stall && <span className="log-tag stall-tag">STALL</span>}
                                        {snap.flush && <span className="log-tag flush-tag">FLUSH</span>}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Empty state */}
                    {!hasRun && (
                        <motion.div
                            className="empty-state glass-card"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="empty-icon">🔀</div>
                            <h3>Ready to Simulate</h3>
                            <p>Write or select an assembly program and click <strong>Run Pipeline</strong> to visualize the 5-stage pipeline execution.</p>
                            <div className="pipeline-stages-preview">
                                {PIPELINE_STAGES.map((stage, i) => (
                                    <div key={stage} className="preview-stage">
                                        <div className={`preview-dot stage-${stage.toLowerCase()}`} />
                                        <span>{stage}</span>
                                        {i < PIPELINE_STAGES.length - 1 && <span className="preview-arrow">→</span>}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
