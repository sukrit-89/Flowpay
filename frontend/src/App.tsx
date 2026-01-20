import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './components/Landing';
import ClientDashboard from './components/ClientDashboard';
import FreelancerDashboard from './components/FreelancerDashboard';

function App() {
    return (
        <BrowserRouter>
            <div className="min-h-screen bg-[#0a0e17] text-gray-50">
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/client" element={<ClientDashboard />} />
                    <Route path="/freelancer" element={<FreelancerDashboard />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
