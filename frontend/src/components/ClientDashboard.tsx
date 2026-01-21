import { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import JobCreationForm from './JobCreationForm';
import TransactionModal from './TransactionModal';

export default function ClientDashboard() {
    const { address, connected, connect, disconnect, error } = useWallet();
    const [showTxModal, setShowTxModal] = useState(false);
    const [activeJobs] = useState([
        { id: 1, name: 'Smart Contract Audit', status: 'LOCKED', amount: '12,500.00 OUSG' },
        { id: 2, name: 'Smart Contract Audit 2', status: 'LOCKED', amount: '8,300.00 OUSG' },
        { id: 3, name: 'Smart Contract Audit 3', status: 'LOCKED', amount: '6,200.00 OUSG' },
    ]);

    return (
        <div className="min-h-screen bg-[#0a0e17] text-gray-50 p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg"></div>
                    <span className="text-xl font-bold">FlowPay</span>
                </div>
                <div className="flex items-center gap-3">
                    {connected ? (
                        <>
                            <span className="text-sm text-gray-400">
                                {address.slice(0, 6)}...{address.slice(-4)}
                            </span>
                            <button
                                onClick={disconnect}
                                className="bg-red-500 hover:bg-red-600 px-6 py-2 rounded-lg font-medium"
                            >
                                Disconnect
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={connect}
                            className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded-lg font-medium"
                        >
                            Connect Wallet
                        </button>
                    )}
                </div>
                {error && (
                    <div className="absolute top-20 right-6 bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-300 text-sm max-w-xs">
                        {error}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-3 gap-6">
                {/* Left Sidebar */}
                <div className="col-span-1 space-y-4">
                    <div className="bg-blue-500 text-white p-4 rounded-lg font-medium">
                        Dashboard
                    </div>
                    <div className="text-gray-400 p-4 hover:bg-gray-800 rounded-lg cursor-pointer">
                        Escrow
                    </div>
                    <div className="text-gray-400 p-4 hover:bg-gray-800 rounded-lg cursor-pointer">
                        Logs
                    </div>
                    <div className="text-gray-400 p-4 hover:bg-gray-800 rounded-lg cursor-pointer">
                        Setup
                    </div>
                </div>

                {/* Main Content */}
                <div className="col-span-2 space-y-6">
                    {/* Job Creation Form */}
                    <JobCreationForm onSubmit={() => setShowTxModal(true)} />

                    {/* Escrow Summary */}
                    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-xl p-6">
                        <div className="text-sm text-gray-400 mb-4">Escrow Summary</div>
                        <div className="text-3xl font-bold mb-4">Smart Contract Audit</div>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <div className="text-4xl font-bold">12,500.00 OUSG</div>
                                <div className="text-sm text-gray-400 mt-2 inline-block bg-gray-700 px-3 py-1 rounded-full">
                                    LOCKED
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-gray-400">Users</div>
                            <div className="flex gap-2">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold">C</div>
                                <div className="text-gray-400">&</div>
                                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-sm font-bold">F</div>
                            </div>
                        </div>
                    </div>

                    {/* Active Jobs */}
                    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-xl p-6">
                        <div className="text-xl font-bold mb-4">Active Job Monitoring</div>
                        <div className="space-y-3">
                            {activeJobs.map(job => (
                                <div key={job.id} className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg">
                                    <span>{job.name}</span>
                                    <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm">
                                        {job.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {showTxModal && <TransactionModal onClose={() => setShowTxModal(false)} />}
        </div>
    );
}
