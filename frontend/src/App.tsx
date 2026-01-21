import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './components/Landing';
import ClientDashboard from './components/ClientDashboard';
import FreelancerDashboard from './components/FreelancerDashboard';
import ClientJobs from './components/client/ClientJobs';
import ClientWallet from './components/client/ClientWallet';
import ClientSettings from './components/client/ClientSettings';
import FreelancerJobs from './components/freelancer/FreelancerJobs';
import FreelancerWallet from './components/freelancer/FreelancerWallet';
import FreelancerSettings from './components/freelancer/FreelancerSettings';

function App() {
    return (
        <BrowserRouter>
            <div className="min-h-screen bg-[#0a0e17] text-gray-50">
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/client" element={<ClientDashboard />} />
                    <Route path="/client/jobs" element={<ClientJobs />} />
                    <Route path="/client/wallet" element={<ClientWallet />} />
                    <Route path="/client/settings" element={<ClientSettings />} />
                    <Route path="/freelancer" element={<FreelancerDashboard />} />
                    <Route path="/freelancer/jobs" element={<FreelancerJobs />} />
                    <Route path="/freelancer/wallet" element={<FreelancerWallet />} />
                    <Route path="/freelancer/settings" element={<FreelancerSettings />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
