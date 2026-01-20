import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';

export default function Landing() {
    const navigate = useNavigate();
    const { address, connected, connect, disconnect, isFreighterInstalled, error } = useWallet();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
            {/* Header */}
            <nav className="absolute top-0 w-full p-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                        <span className="text-2xl font-bold">F</span>
                    </div>
                    <span className="text-xl font-semibold">FlowPay</span>
                </div>
                <div className="flex gap-6 items-center">
                    <a href="#" className="text-gray-400 hover:text-white">Docs</a>
                    <a href="https://github.com" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white">Github</a>
                    {connected ? (
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-400">
                                {address.slice(0, 6)}...{address.slice(-4)}
                            </span>
                            <button
                                onClick={disconnect}
                                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-medium text-sm"
                            >
                                Disconnect
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={connect}
                            disabled={!isFreighterInstalled}
                            className={`px-6 py-2 rounded-lg font-medium ${!isFreighterInstalled
                                    ? 'bg-red-500 hover:bg-red-600'
                                    : 'bg-blue-500 hover:bg-blue-600'
                                }`}
                        >
                            {!isFreighterInstalled ? 'Install Freighter' : 'Connect Wallet'}
                        </button>
                    )}
                </div>
                {error && (
                    <div className="absolute top-20 right-6 bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-300 text-sm max-w-xs">
                        {error}
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <div className="text-center max-w-4xl mb-16">
                <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-2 rounded-full mb-8">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    MAINNET LIVE
                </div>
                <h1 className="text-7xl font-bold mb-4">FlowPay</h1>
                <p className="text-2xl text-gray-400">RWA-powered payroll infrastructure</p>
            </div>

            {/* Dashboard Cards */}
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl w-full mb-16">
                {/* Client Dashboard */}
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur border border-gray-700 rounded-2xl p-8 hover:border-blue-500 transition-all">
                    <div className="bg-blue-500/10 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                        <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Client Dashboard</h2>
                    <p className="text-gray-400 mb-6">Manage payroll & compliance</p>
                    <button
                        onClick={() => navigate('/client')}
                        className="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 py-3 rounded-lg font-medium transition-all"
                    >
                        ENTER
                    </button>
                </div>

                {/* Freelancer Dashboard */}
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur border border-gray-700 rounded-2xl p-8 hover:border-blue-500 transition-all">
                    <div className="bg-blue-500/10 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                        <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Freelancer Dashboard</h2>
                    <p className="text-gray-400 mb-6">Claim streams & view RWAs</p>
                    <button
                        onClick={() => navigate('/freelancer')}
                        className="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 py-3 rounded-lg font-medium transition-all"
                    >
                        CLAIM
                    </button>
                </div>
            </div>

            {/* Protocol Stats */}
            <div className="w-full max-w-6xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur border border-gray-700 rounded-2xl p-8">
                <div className="text-sm text-gray-400 mb-4">PROTOCOL ACTIVITY</div>
                <div className="text-2xl font-bold mb-8">Global Real-World Yield Distribution</div>
                <div className="grid grid-cols-3 gap-8">
                    <div>
                        <div className="text-sm text-gray-400 mb-2">TVL LOCKED</div>
                        <div className="text-3xl font-bold">$142.8M</div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-400 mb-2">AVG YIELD</div>
                        <div className="text-3xl font-bold text-green-400">6.4% APY</div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-400 mb-2">GAS PRICE</div>
                        <div className="text-3xl font-bold">12 Gwei</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
