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
                        <a href="/cpu-simulator">CPU Architecture</a>
                        <a href="/risc-cisc">RISC vs CISC</a>
                        <a href="/calculator">Performance Calculator</a>
                    </div>
                    <div className="footer-col">
                        <h4>Concepts</h4>
                        <a href="/cpu-simulator">Fetch-Decode-Execute</a>
                        <a href="/risc-cisc">Instruction Set Comparison</a>
                        <a href="/calculator">Amdahl's Law</a>
                    </div>
                </div>
            </div>
            <div className="footer-bottom">
                <p>&copy; 2026 CPUSim — Built for Computer Architecture Education</p>
            </div>
        </footer>
    );
}
