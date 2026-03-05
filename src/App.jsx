import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import CpuSimulator from './pages/CpuSimulator';
import RiscCisc from './pages/RiscCisc';
import Calculator from './pages/Calculator';
import PipelineSimulator from './pages/PipelineSimulator';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cpu-simulator" element={<CpuSimulator />} />
            <Route path="/risc-cisc" element={<RiscCisc />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/pipeline" element={<PipelineSimulator />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
