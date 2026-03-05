import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './Navbar.css';

const navLinks = [
    { path: '/', label: 'Home', icon: '⚡' },
    { path: '/cpu-simulator', label: 'CPU Simulator', icon: '🔧' },
    { path: '/risc-cisc', label: 'RISC vs CISC', icon: '📊' },
    { path: '/calculator', label: 'Calculator', icon: '🧮' },
    { path: '/pipeline', label: 'Pipeline', icon: '🔀' },
];

export default function Navbar() {
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link to="/" className="navbar-logo">
                    <div className="logo-icon">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <rect x="2" y="2" width="28" height="28" rx="6" stroke="url(#logoGrad)" strokeWidth="2" />
                            <rect x="8" y="8" width="6" height="6" rx="1" fill="#00d4ff" />
                            <rect x="18" y="8" width="6" height="6" rx="1" fill="#7c3aed" />
                            <rect x="8" y="18" width="6" height="6" rx="1" fill="#7c3aed" />
                            <rect x="18" y="18" width="6" height="6" rx="1" fill="#00d4ff" />
                            <defs>
                                <linearGradient id="logoGrad" x1="0" y1="0" x2="32" y2="32">
                                    <stop stopColor="#00d4ff" />
                                    <stop offset="1" stopColor="#7c3aed" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <span className="logo-text">CPU<span className="logo-accent">Sim</span></span>
                </Link>

                <div className="navbar-links">
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
                        >
                            <span className="nav-icon">{link.icon}</span>
                            {link.label}
                            {location.pathname === link.path && (
                                <motion.div
                                    className="nav-indicator"
                                    layoutId="navIndicator"
                                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                />
                            )}
                        </Link>
                    ))}
                </div>

                <button
                    className={`hamburger ${mobileOpen ? 'open' : ''}`}
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>

            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        className="mobile-menu"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`mobile-link ${location.pathname === link.path ? 'active' : ''}`}
                                onClick={() => setMobileOpen(false)}
                            >
                                <span className="nav-icon">{link.icon}</span>
                                {link.label}
                            </Link>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
