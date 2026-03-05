import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { runRISCProgram, RISC_PROGRAMS } from '../simulation/risc';
import { runCISCProgram, CISC_PROGRAMS } from '../simulation/cisc';
import './RiscCisc.css';

const PROGRAMS = Object.keys(RISC_PROGRAMS);
const COLORS = {
    risc: '#00d4ff',
    cisc: '#7c3aed',
    memory: '#f59e0b',
    arithmetic: '#10b981',
    control: '#ec4899',
    data: '#00d4ff',
};
const PIE_COLORS = ['#00d4ff', '#7c3aed', '#10b981', '#f59e0b', '#ec4899'];

export default function RiscCisc() {
    const [selectedProgram, setSelectedProgram] = useState(PROGRAMS[0]);
    const [hasRun, setHasRun] = useState(false);

    const riscResult = useMemo(() => runRISCProgram(selectedProgram), [selectedProgram]);
    const ciscResult = useMemo(() => runCISCProgram(selectedProgram), [selectedProgram]);

    const handleRun = () => setHasRun(true);

    // Comparison bar chart data
    const comparisonData = useMemo(() => {
        if (!riscResult || !ciscResult) return [];
        return [
            { name: 'Instruction Count', RISC: riscResult.instructionCount, CISC: ciscResult.instructionCount },
            { name: 'Total Cycles', RISC: riscResult.totalCycles, CISC: ciscResult.totalCycles },
            { name: 'Avg CPI', RISC: riscResult.avgCPI, CISC: ciscResult.avgCPI },
            { name: 'Code Size (bytes)', RISC: riscResult.codeSize, CISC: ciscResult.codeSize },
        ];
    }, [riscResult, ciscResult]);

    const timeComparisonData = useMemo(() => {
        if (!riscResult || !ciscResult) return [];
        return [
            { name: 'Exec Time (ns)', RISC: riscResult.executionTime, CISC: ciscResult.executionTime },
        ];
    }, [riscResult, ciscResult]);

    // Pie data for instruction breakdown
    const riscPieData = useMemo(() => {
        if (!riscResult) return [];
        return Object.entries(riscResult.instructionBreakdown).map(([type, data]) => ({
            name: type.charAt(0).toUpperCase() + type.slice(1),
            value: data.cycles,
        }));
    }, [riscResult]);

    const ciscPieData = useMemo(() => {
        if (!ciscResult) return [];
        return Object.entries(ciscResult.instructionBreakdown).map(([type, data]) => ({
            name: type.charAt(0).toUpperCase() + type.slice(1),
            value: data.cycles,
        }));
    }, [ciscResult]);

    // Radar data
    const radarData = useMemo(() => {
        if (!riscResult || !ciscResult) return [];
        const maxInstr = Math.max(riscResult.instructionCount, ciscResult.instructionCount);
        const maxCycles = Math.max(riscResult.totalCycles, ciscResult.totalCycles);
        const maxCPI = Math.max(riscResult.avgCPI, ciscResult.avgCPI);
        const maxTime = Math.max(riscResult.executionTime, ciscResult.executionTime);
        const maxSize = Math.max(riscResult.codeSize, ciscResult.codeSize);

        return [
            { subject: 'Instructions', RISC: (riscResult.instructionCount / maxInstr) * 100, CISC: (ciscResult.instructionCount / maxInstr) * 100 },
            { subject: 'Cycles', RISC: (riscResult.totalCycles / maxCycles) * 100, CISC: (ciscResult.totalCycles / maxCycles) * 100 },
            { subject: 'CPI', RISC: (riscResult.avgCPI / maxCPI) * 100, CISC: (ciscResult.avgCPI / maxCPI) * 100 },
            { subject: 'Exec Time', RISC: (riscResult.executionTime / maxTime) * 100, CISC: (ciscResult.executionTime / maxTime) * 100 },
            { subject: 'Code Size', RISC: (riscResult.codeSize / maxSize) * 100, CISC: (ciscResult.codeSize / maxSize) * 100 },
        ];
    }, [riscResult, ciscResult]);

    const customTooltipStyle = {
        backgroundColor: 'rgba(13, 17, 23, 0.95)',
        border: '1px solid rgba(48, 54, 61, 0.6)',
        borderRadius: '8px',
        padding: '8px 12px',
        color: '#e6edf3',
        fontSize: '0.85rem',
    };

    return (
        <div className="risc-cisc-page">
            <div className="rc-header">
                <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    RISC vs CISC <span className="gradient-text">Performance</span>
                </motion.h1>
                <p>Compare architectures side-by-side with real program simulations</p>
            </div>

            {/* Program Selector */}
            <div className="program-selector glass-card">
                <div className="selector-row">
                    <label>Select Program:</label>
                    <div className="program-buttons">
                        {PROGRAMS.map((name) => (
                            <button
                                key={name}
                                className={`prog-btn ${selectedProgram === name ? 'active' : ''}`}
                                onClick={() => { setSelectedProgram(name); setHasRun(false); }}
                            >
                                {name}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="selector-desc">
                    <p>{riscResult?.description}</p>
                    <button className="btn-primary run-btn" onClick={handleRun}>
                        ▶️ Run Simulation
                    </button>
                </div>
            </div>

            {hasRun && riscResult && ciscResult && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    {/* Architecture Info Cards */}
                    <div className="arch-cards">
                        <div className="arch-card glass-card risc-card">
                            <div className="arch-badge risc">RISC</div>
                            <h3>Reduced Instruction Set</h3>
                            <ul className="arch-traits">
                                <li>Fixed-length instructions (4 bytes)</li>
                                <li>Load-store architecture</li>
                                <li>Simple instructions, more count</li>
                                <li>Higher clock rate ({riscResult.clockRate} GHz)</li>
                            </ul>
                        </div>
                        <div className="arch-card glass-card cisc-card">
                            <div className="arch-badge cisc">CISC</div>
                            <h3>Complex Instruction Set</h3>
                            <ul className="arch-traits">
                                <li>Variable-length instructions</li>
                                <li>Memory-to-memory operations</li>
                                <li>Complex instructions, fewer count</li>
                                <li>Lower clock rate ({ciscResult.clockRate} GHz)</li>
                            </ul>
                        </div>
                    </div>

                    {/* Comparison Table */}
                    <div className="comparison-table glass-card">
                        <h3>📊 Detailed Comparison</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Metric</th>
                                    <th className="risc-col">RISC</th>
                                    <th className="cisc-col">CISC</th>
                                    <th>Winner</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Instruction Count</td>
                                    <td className="mono">{riscResult.instructionCount}</td>
                                    <td className="mono">{ciscResult.instructionCount}</td>
                                    <td className={`winner ${riscResult.instructionCount < ciscResult.instructionCount ? 'risc' : 'cisc'}`}>
                                        {riscResult.instructionCount < ciscResult.instructionCount ? 'RISC' : 'CISC'}
                                    </td>
                                </tr>
                                <tr>
                                    <td>Average CPI</td>
                                    <td className="mono">{riscResult.avgCPI}</td>
                                    <td className="mono">{ciscResult.avgCPI}</td>
                                    <td className={`winner ${riscResult.avgCPI < ciscResult.avgCPI ? 'risc' : 'cisc'}`}>
                                        {riscResult.avgCPI < ciscResult.avgCPI ? 'RISC' : 'CISC'}
                                    </td>
                                </tr>
                                <tr>
                                    <td>Total Clock Cycles</td>
                                    <td className="mono">{riscResult.totalCycles}</td>
                                    <td className="mono">{ciscResult.totalCycles}</td>
                                    <td className={`winner ${riscResult.totalCycles < ciscResult.totalCycles ? 'risc' : 'cisc'}`}>
                                        {riscResult.totalCycles < ciscResult.totalCycles ? 'RISC' : 'CISC'}
                                    </td>
                                </tr>
                                <tr>
                                    <td>Clock Rate (GHz)</td>
                                    <td className="mono">{riscResult.clockRate}</td>
                                    <td className="mono">{ciscResult.clockRate}</td>
                                    <td className={`winner ${riscResult.clockRate > ciscResult.clockRate ? 'risc' : 'cisc'}`}>
                                        {riscResult.clockRate > ciscResult.clockRate ? 'RISC' : 'CISC'}
                                    </td>
                                </tr>
                                <tr>
                                    <td>Execution Time (ns)</td>
                                    <td className="mono">{riscResult.executionTime}</td>
                                    <td className="mono">{ciscResult.executionTime}</td>
                                    <td className={`winner ${riscResult.executionTime < ciscResult.executionTime ? 'risc' : 'cisc'}`}>
                                        {riscResult.executionTime < ciscResult.executionTime ? 'RISC' : 'CISC'}
                                    </td>
                                </tr>
                                <tr>
                                    <td>Code Size (bytes)</td>
                                    <td className="mono">{riscResult.codeSize}</td>
                                    <td className="mono">{ciscResult.codeSize}</td>
                                    <td className={`winner ${riscResult.codeSize < ciscResult.codeSize ? 'risc' : 'cisc'}`}>
                                        {riscResult.codeSize < ciscResult.codeSize ? 'RISC' : 'CISC'}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Charts */}
                    <div className="charts-grid">
                        {/* Bar Chart */}
                        <div className="chart-card glass-card">
                            <h3>📊 Metrics Comparison</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={comparisonData} barGap={8}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" tick={{ fill: '#8b949e', fontSize: 12 }} />
                                    <YAxis tick={{ fill: '#8b949e', fontSize: 12 }} />
                                    <Tooltip contentStyle={customTooltipStyle} />
                                    <Legend />
                                    <Bar dataKey="RISC" fill={COLORS.risc} radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="CISC" fill={COLORS.cisc} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Execution Time Bar */}
                        <div className="chart-card glass-card">
                            <h3>⏱️ Execution Time (ns)</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={timeComparisonData} barGap={8} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis type="number" tick={{ fill: '#8b949e', fontSize: 12 }} />
                                    <YAxis type="category" dataKey="name" tick={{ fill: '#8b949e', fontSize: 12 }} width={120} />
                                    <Tooltip contentStyle={customTooltipStyle} />
                                    <Legend />
                                    <Bar dataKey="RISC" fill={COLORS.risc} radius={[0, 4, 4, 0]} barSize={40} />
                                    <Bar dataKey="CISC" fill={COLORS.cisc} radius={[0, 4, 4, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Radar Chart */}
                        <div className="chart-card glass-card">
                            <h3>🕸️ Architecture Profile</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <RadarChart data={radarData}>
                                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#8b949e', fontSize: 12 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                                    <Radar name="RISC" dataKey="RISC" stroke={COLORS.risc} fill={COLORS.risc} fillOpacity={0.2} />
                                    <Radar name="CISC" dataKey="CISC" stroke={COLORS.cisc} fill={COLORS.cisc} fillOpacity={0.2} />
                                    <Legend />
                                    <Tooltip contentStyle={customTooltipStyle} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Pie Charts */}
                        <div className="chart-card glass-card pie-charts">
                            <h3>🔵 Cycle Distribution by Instruction Type</h3>
                            <div className="pie-row">
                                <div className="pie-col">
                                    <h4 className="risc-label">RISC</h4>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie data={riscPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                                {riscPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip contentStyle={customTooltipStyle} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="pie-col">
                                    <h4 className="cisc-label">CISC</h4>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie data={ciscPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                                {ciscPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip contentStyle={customTooltipStyle} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
