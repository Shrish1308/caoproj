import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './App.css';

const Home = lazy(() => import('./pages/Home'));
const CpuSimulator = lazy(() => import('./pages/CpuSimulator'));
const RiscCisc = lazy(() => import('./pages/RiscCisc'));
const Calculator = lazy(() => import('./pages/Calculator'));
const PipelineSimulator = lazy(() => import('./pages/PipelineSimulator'));

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Suspense
            fallback={
              <div className="route-loading">
                Loading module...
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/cpu-simulator" element={<CpuSimulator />} />
              <Route path="/risc-cisc" element={<RiscCisc />} />
              <Route path="/calculator" element={<Calculator />} />
              <Route path="/pipeline" element={<PipelineSimulator />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
