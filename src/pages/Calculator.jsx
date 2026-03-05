import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { executionTime, mips, speedup, totalClockCycles, formatTime, formatNumber, amdahlSpeedup } from '../utils/calculations';
import './Calculator.css';

const defaultConfig = () => ({
    id: Date.now(),
    name: '',
    clockRate: 2.0,
    cpi: 1.5,
    instructionCount: 1e9,
    instructionCountExp: 9,
});

export default function Calculator() {
    const [configs, setConfigs] = useState([{ ...defaultConfig(), name: 'Processor A' }]);
    const [amdahlFraction, setAmdahlFraction] = useState(0.8);
    const [amdahlSpeedupVal, setAmdahlSpeedupVal] = useState(4);

    const addConfig = () => {
        if (configs.length >= 4) return;
        const letters = ['A', 'B', 'C', 'D'];
        setConfigs([...configs, { ...defaultConfig(), name: `Processor ${letters[configs.length]}` }]);
    };

    const removeConfig = (id) => {
        if (configs.length <= 1) return;
        setConfigs(configs.filter(c => c.id !== id));
    };

    const updateConfig = (id, field, value) => {
        setConfigs(configs.map(c => {
            if (c.id !== id) return c;
            const updated = { ...c, [field]: value };
            if (field === 'instructionCountExp') {
                updated.instructionCount = Math.pow(10, value);
            }
            return updated;
        }));
    };

    const results = useMemo(() => {
        return configs.map(c => {
            const execTime = executionTime(c.clockRate, c.cpi, c.instructionCount);
            const mipsVal = mips(c.clockRate, c.cpi);
            const cycles = totalClockCycles(c.cpi, c.instructionCount);
            return {
                ...c,
                executionTime: execTime,
                mips: mipsVal,
                totalCycles: cycles,
            };
        });
    }, [configs]);

    // Speedup relative to first processor
    const speedups = useMemo(() => {
        if (results.length < 2) return [];
        const baseline = results[0].executionTime;
        return results.map(r => ({
            name: r.name,
            speedup: Math.round(speedup(baseline, r.executionTime) * 100) / 100,
        }));
    }, [results]);

    // Comparison chart data
    const chartData = useMemo(() => {
        return [
            {
                name: 'Exec Time (s)',
                ...Object.fromEntries(results.map(r => [r.name, parseFloat(r.executionTime.toFixed(4))])),
            },
            {
                name: 'MIPS',
                ...Object.fromEntries(results.map(r => [r.name, Math.round(r.mips)])),
            },
            {
                name: 'Total Cycles (B)',
                ...Object.fromEntries(results.map(r => [r.name, parseFloat((r.totalCycles / 1e9).toFixed(2))])),
            },
        ];
    }, [results]);

    const amdahlResult = useMemo(() => {
        return amdahlSpeedup(amdahlFraction, amdahlSpeedupVal);
    }, [amdahlFraction, amdahlSpeedupVal]);

    const CHART_COLORS = ['#00d4ff', '#7c3aed', '#10b981', '#f59e0b'];

    const customTooltipStyle = {
        backgroundColor: 'rgba(13, 17, 23, 0.95)',
        border: '1px solid rgba(48, 54, 61, 0.6)',
        borderRadius: '8px',
        padding: '8px 12px',
        color: '#e6edf3',
        fontSize: '0.85rem',
    };

    return (
        <div className="calc-page">
            <div className="calc-header">
                <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    Performance <span className="gradient-text">Calculator</span>
                </motion.h1>
                <p>Compute execution time, MIPS, and speedup for different processor configurations</p>
            </div>

            {/* Config Cards */}
            <div className="configs-section">
                <div className="configs-header">
                    <h2>Processor Configurations</h2>
                    <button className="btn-secondary add-btn" onClick={addConfig} disabled={configs.length >= 4}>
                        + Add Processor
                    </button>
                </div>

                <div className="configs-grid">
                    <AnimatePresence>
                        {configs.map((config, idx) => (
                            <motion.div
                                key={config.id}
                                className="config-card glass-card"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="config-card-header">
                                    <input
                                        type="text"
                                        className="config-name"
                                        value={config.name}
                                        onChange={(e) => updateConfig(config.id, 'name', e.target.value)}
                                        placeholder="Processor name"
                                    />
                                    {configs.length > 1 && (
                                        <button className="remove-btn" onClick={() => removeConfig(config.id)}>✕</button>
                                    )}
                                </div>

                                <div className="config-field">
                                    <label>Clock Rate (GHz)</label>
                                    <div className="slider-row">
                                        <input
                                            type="range"
                                            min="0.1"
                                            max="10"
                                            step="0.1"
                                            value={config.clockRate}
                                            onChange={(e) => updateConfig(config.id, 'clockRate', parseFloat(e.target.value))}
                                            className="styled-slider blue-slider"
                                        />
                                        <span className="slider-value mono">{config.clockRate.toFixed(1)}</span>
                                    </div>
                                </div>

                                <div className="config-field">
                                    <label>CPI (Cycles Per Instruction)</label>
                                    <div className="slider-row">
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="20"
                                            step="0.1"
                                            value={config.cpi}
                                            onChange={(e) => updateConfig(config.id, 'cpi', parseFloat(e.target.value))}
                                            className="styled-slider purple-slider"
                                        />
                                        <span className="slider-value mono">{config.cpi.toFixed(1)}</span>
                                    </div>
                                </div>

                                <div className="config-field">
                                    <label>Instruction Count (10^n)</label>
                                    <div className="slider-row">
                                        <input
                                            type="range"
                                            min="3"
                                            max="12"
                                            step="1"
                                            value={config.instructionCountExp}
                                            onChange={(e) => updateConfig(config.id, 'instructionCountExp', parseInt(e.target.value))}
                                            className="styled-slider emerald-slider"
                                        />
                                        <span className="slider-value mono">10<sup>{config.instructionCountExp}</sup></span>
                                    </div>
                                </div>

                                {/* Inline Results */}
                                <div className="inline-results">
                                    <div className="result-item">
                                        <span className="result-label">Execution Time</span>
                                        <span className="result-value blue">{formatTime(results[idx]?.executionTime || 0)}</span>
                                    </div>
                                    <div className="result-item">
                                        <span className="result-label">MIPS</span>
                                        <span className="result-value purple">{formatNumber(results[idx]?.mips || 0)}</span>
                                    </div>
                                    <div className="result-item">
                                        <span className="result-label">Total Cycles</span>
                                        <span className="result-value emerald">{formatNumber(results[idx]?.totalCycles || 0)}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Results Dashboard */}
            <motion.div
                className="results-dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
            >
                {/* Main Metrics */}
                <div className="metrics-row">
                    {results.map((r, i) => (
                        <div key={r.id} className="metric-card glass-card" style={{ borderTopColor: CHART_COLORS[i] }}>
                            <div className="metric-name">{r.name}</div>
                            <div className="metric-big" style={{ color: CHART_COLORS[i] }}>
                                {formatTime(r.executionTime)}
                            </div>
                            <div className="metric-sub">
                                <span>{formatNumber(r.mips)} MIPS</span>
                                <span>•</span>
                                <span>{formatNumber(r.totalCycles)} cycles</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Speedup Table */}
                {speedups.length > 0 && (
                    <div className="speedup-section glass-card">
                        <h3>🚀 Speedup (relative to {results[0]?.name})</h3>
                        <div className="speedup-grid">
                            {speedups.map((s, i) => (
                                <div key={s.name} className="speedup-item">
                                    <span className="speedup-name">{s.name}</span>
                                    <span className="speedup-val" style={{ color: CHART_COLORS[i] }}>
                                        {s.speedup}x
                                    </span>
                                    <div className="speedup-bar-bg">
                                        <motion.div
                                            className="speedup-bar-fill"
                                            style={{ backgroundColor: CHART_COLORS[i] }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min((s.speedup / Math.max(...speedups.map(x => x.speedup))) * 100, 100)}%` }}
                                            transition={{ duration: 0.8, delay: i * 0.1 }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Comparison Chart */}
                {results.length > 1 && (
                    <div className="chart-section glass-card">
                        <h3>📊 Comparison Chart</h3>
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={chartData} barGap={4}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" tick={{ fill: '#8b949e', fontSize: 12 }} />
                                <YAxis tick={{ fill: '#8b949e', fontSize: 12 }} />
                                <Tooltip contentStyle={customTooltipStyle} />
                                <Legend />
                                {results.map((r, i) => (
                                    <Bar key={r.name} dataKey={r.name} fill={CHART_COLORS[i]} radius={[4, 4, 0, 0]} />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </motion.div>

            {/* Amdahl's Law Section */}
            <div className="amdahl-section glass-card">
                <h3>📐 Amdahl's Law Calculator</h3>
                <p className="amdahl-desc">
                    Calculate the theoretical maximum speedup when improving a fraction of execution time.
                </p>
                <div className="amdahl-formula">
                    Speedup = 1 / ((1 - F) + F / S)
                </div>
                <div className="amdahl-inputs">
                    <div className="config-field">
                        <label>Fraction Enhanced (F): {(amdahlFraction * 100).toFixed(0)}%</label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={amdahlFraction}
                            onChange={(e) => setAmdahlFraction(parseFloat(e.target.value))}
                            className="styled-slider blue-slider"
                        />
                    </div>
                    <div className="config-field">
                        <label>Speedup of Enhanced (S): {amdahlSpeedupVal}x</label>
                        <input
                            type="range"
                            min="1"
                            max="100"
                            step="1"
                            value={amdahlSpeedupVal}
                            onChange={(e) => setAmdahlSpeedupVal(parseInt(e.target.value))}
                            className="styled-slider purple-slider"
                        />
                    </div>
                </div>
                <div className="amdahl-result">
                    <span className="amdahl-label">Overall Speedup:</span>
                    <span className="amdahl-value gradient-text">{amdahlResult.toFixed(2)}x</span>
                </div>
            </div>
        </div>
    );
}
