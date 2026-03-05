import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Home.css';

const features = [
    {
        icon: '🔧',
        title: 'CPU Architecture Simulator',
        desc: 'Visualize the inner workings of a CPU — ALU, Control Unit, Registers, and Memory. Watch instructions flow through the Fetch-Decode-Execute cycle in real time.',
        path: '/cpu-simulator',
        color: 'blue',
    },
    {
        icon: '📊',
        title: 'RISC vs CISC Simulator',
        desc: 'Run identical programs on RISC and CISC architectures side by side. Compare instruction counts, clock cycles, and execution times with interactive charts.',
        path: '/risc-cisc',
        color: 'purple',
    },
    {
        icon: '🧮',
        title: 'Performance Calculator',
        desc: 'Input clock rate, CPI, and instruction count to compute execution time, MIPS, and speedup. Compare multiple processor configurations at once.',
        path: '/calculator',
        color: 'emerald',
    },
    {
        icon: '🔀',
        title: 'Pipeline Simulator',
        desc: 'Visualize how instructions flow through the 5-stage pipeline. Detect data & control hazards, see stall cycles, and compare pipelined vs sequential performance.',
        path: '/pipeline',
        color: 'orange',
    },
];

const concepts = [
    { label: 'ALU Operations', icon: '⚙️' },
    { label: 'Fetch-Decode-Execute', icon: '🔄' },
    { label: 'Registers & Memory', icon: '💾' },
    { label: 'Pipeline Stages', icon: '📐' },
    { label: 'Instruction Sets', icon: '📋' },
    { label: "Amdahl's Law", icon: '📈' },
];

const container = {
    hidden: {},
    show: {
        transition: { staggerChildren: 0.15 },
    },
};

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export default function Home() {
    return (
        <div className="home-page">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-bg-grid" />
                <motion.div
                    className="hero-content"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                >
                    <div className="hero-badge">
                        <span className="badge-dot" />
                        Interactive Learning Platform
                    </div>
                    <h1 className="hero-title">
                        Understand <span className="gradient-text">CPU Architecture</span><br />
                        Through Simulation
                    </h1>
                    <p className="hero-subtitle">
                        Explore how processors work from the ground up. Visualize data movement,
                        compare architectures, and calculate performance metrics — all in your browser.
                    </p>
                    <div className="hero-actions">
                        <Link to="/cpu-simulator" className="btn-primary hero-btn">
                            Launch Simulator →
                        </Link>
                        <Link to="/calculator" className="btn-secondary hero-btn">
                            Try Calculator
                        </Link>
                    </div>

                    {/* Concept chips */}
                    <div className="concept-chips">
                        {concepts.map((c, i) => (
                            <motion.span
                                key={c.label}
                                className="chip"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
                            >
                                {c.icon} {c.label}
                            </motion.span>
                        ))}
                    </div>
                </motion.div>

                {/* Animated CPU graphic */}
                <motion.div
                    className="hero-visual"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                >
                    <div className="cpu-chip">
                        <div className="chip-core">
                            <div className="core-grid">
                                <div className="core-cell c1"><span>ALU</span></div>
                                <div className="core-cell c2"><span>CU</span></div>
                                <div className="core-cell c3"><span>REG</span></div>
                                <div className="core-cell c4"><span>L1$</span></div>
                            </div>
                        </div>
                        <div className="chip-pins top">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="pin" />)}</div>
                        <div className="chip-pins bottom">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="pin" />)}</div>
                        <div className="chip-pins left">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="pin" />)}</div>
                        <div className="chip-pins right">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="pin" />)}</div>
                        <div className="data-pulse p1" />
                        <div className="data-pulse p2" />
                        <div className="data-pulse p3" />
                    </div>
                </motion.div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <motion.div
                    className="features-header"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="section-title">
                        Four Powerful <span className="gradient-text">Simulators</span>
                    </h2>
                    <p className="section-subtitle">
                        Dive deep into processor architecture with hands-on tools
                    </p>
                </motion.div>

                <motion.div
                    className="features-grid"
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                >
                    {features.map((f) => (
                        <motion.div key={f.title} variants={fadeUp}>
                            <Link to={f.path} className={`feature-card glass-card color-${f.color}`}>
                                <div className="feature-icon">{f.icon}</div>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                                <span className="feature-arrow">Explore →</span>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* How it works */}
            <section className="how-section">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="section-title" style={{ textAlign: 'center' }}>
                        How a CPU <span className="gradient-text">Executes</span> Instructions
                    </h2>
                    <p className="section-subtitle" style={{ textAlign: 'center' }}>
                        The Fetch → Decode → Execute cycle is the heartbeat of every processor
                    </p>
                </motion.div>

                <motion.div
                    className="pipeline-visual"
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                >
                    {[
                        { step: '1', title: 'Fetch', desc: 'The Control Unit retrieves the next instruction from memory using the Program Counter (PC).', color: 'blue' },
                        { step: '2', title: 'Decode', desc: 'The instruction is interpreted — opcode identifies the operation, operands identify the data.', color: 'purple' },
                        { step: '3', title: 'Execute', desc: 'The ALU performs the operation, registers are updated, and memory may be accessed.', color: 'emerald' },
                    ].map((s) => (
                        <motion.div key={s.step} className={`pipeline-step glass-card color-${s.color}`} variants={fadeUp}>
                            <div className="step-number">{s.step}</div>
                            <h3>{s.title}</h3>
                            <p>{s.desc}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </section>
        </div >
    );
}
