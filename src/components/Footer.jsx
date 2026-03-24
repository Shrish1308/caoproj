import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-inner">
                <div className="footer-brand">
                    <span className="footer-logo">CPU<span className="logo-accent">Sim</span></span>
                    <p className="footer-tagline">Interactive CPU Architecture & Performance Simulator</p>
                </div>
                <div className="footer-links">
                    <div className="footer-col">
                        <h4>Simulators</h4>
                        <Link to="/cpu-simulator">CPU Architecture</Link>
                        <Link to="/risc-cisc">RISC vs CISC</Link>
                        <Link to="/calculator">Performance Calculator</Link>
                    </div>
                    <div className="footer-col">
                        <h4>Concepts</h4>
                        <Link to="/cpu-simulator">Fetch-Decode-Execute</Link>
                        <Link to="/risc-cisc">Instruction Set Comparison</Link>
                        <Link to="/calculator">Amdahl&apos;s Law</Link>
                    </div>
                </div>
            </div>
            <div className="footer-bottom">
                <p>&copy; 2026 CPUSim - Built for Computer Architecture Education</p>
            </div>
        </footer>
    );
}
