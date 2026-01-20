import { useState } from 'react';
import ProofSubmission from './ProofSubmission';

export default function FreelancerDashboard() {
    const [payoutCurrency, setPayoutCurrency] = useState<'USDC' | 'INR'>('USDC');
    const [jobs] = useState([
        {
            id: 1,
            client: 'Protocol Labs',
            title: 'Smart Contract Audit',
            amount: '2,400 USDC',
            progress: { completed: 3, total: 5 }
        },
        {
            id: 2,
            client: 'EigenLayer',
            title: 'AVS Architecture Design',
            amount: '800 USDC',
            progress: { completed: 0, total: 3 }
        },
    ]);

    return (
        <div className="min-h-screen bg-[#0a0e17] text-gray-50 p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg"></div>
                    <span className="text-xl font-bold">FlowPay</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">0x71C...3A21</span>
                    </div>
                    <button className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded-lg font-medium">
                        Connect Wallet
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
                {/* Left Sidebar */}
                <div className="col-span-1 space-y-4">
                    <div className="bg-blue-500 text-white p-4 rounded-lg font-medium">
                        DASH
                    </div>
                    <div className="text-gray-400 p-4 hover:bg-gray-800 rounded-lg cursor-pointer">
                        JOBS
                    </div>
                    <div className="text-gray-400 p-4 hover:bg-gray-800 rounded-lg cursor-pointer">
                        WALLET
                    </div>
                    <div className="text-gray-400 p-4 hover:bg-gray-800 rounded-lg cursor-pointer">
                        ME
                    </div>
                </div>

                {/* Main Content */}
                <div className="col-span-2 space-y-6">
                    {/* Assigned Jobs */}
                    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">ASSIGNED JOBS</h2>
                            <button className="text-blue-400 text-sm">View All</button>
                        </div>

                        <div className="space-y-4">
                            {jobs.map(job => (
                                <div key={job.id} className="bg-gray-800/50 rounded-lg p-4">
                                    <div className="grid grid-cols-4 gap-4 items-center">
                                        <div>
                                            <div className="text-sm text-gray-400">{job.client}</div>
                                            <div className="font-medium">{job.title}</div>
                                        </div>
                                        <div className="text-center font-bold">{job.amount}</div>
                                        <div>
                                            <div className="text-sm text-gray-400 mb-2">
                                                {job.progress.completed}/{job.progress.total} Completed
                                            </div>
                                            <div className="w-full bg-gray-700 rounded-full h-2">
                                                <div
                                                    className="bg-blue-500 h-2 rounded-full"
                                                    style={{ width: `${(job.progress.completed / job.progress.total) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <button className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg">
                                            Details
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Proof Submission */}
                        <ProofSubmission />

                        {/* Payout Preferences */}
                        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                    <span className="text-blue-400">💰</span>
                                </div>
                                <h3 className="font-bold">PAYOUT PREFERENCES</h3>
                            </div>

                            <div className="mb-6">
                                <div className="text-sm text-gray-400 mb-2">Payout Currency</div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPayoutCurrency('USDC')}
                                        className={`flex-1 py-2 rounded-lg font-medium ${payoutCurrency === 'USDC'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-700 text-gray-400'
                                            }`}
                                    >
                                        USDC
                                    </button>
                                    <button
                                        onClick={() => setPayoutCurrency('INR')}
                                        className={`flex-1 py-2 rounded-lg font-medium ${payoutCurrency === 'INR'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-700 text-gray-400'
                                            }`}
                                    >
                                        INR (RWA)
                                    </button>
                                </div>
                            </div>

                            <button className="w-full bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-medium flex items-center justify-center gap-2 mb-4">
                                <span>CLAIM PAYMENT</span>
                                <span>📸</span>
                            </button>

                            <div className="text-center">
                                <div className="text-sm text-gray-400">Available to Claim</div>
                                <div className="text-2xl font-bold">~$1,240.00 USD</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
