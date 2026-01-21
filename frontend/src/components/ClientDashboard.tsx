import { useState } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '../hooks/useWallet';
import JobCreationModal from './JobCreationModal';
import FadeInUp from './animated/FadeInUp';
import AnimatedCounter from './animated/AnimatedCounter';
import { hoverLift, staggerContainer, fadeInUp } from '../animations/variants';
import Sidebar from './shared/Sidebar';

export default function ClientDashboard() {
    const { connected, disconnect, error } = useWallet();
    const [showJobModal, setShowJobModal] = useState(false);

    // Mock data - replace with real blockchain data
    const earnings = {
        totalLocked: 25000,
        totalYield: 312.5,
        activeJobs: 3,
        completedJobs: 12
    };

    const activeJobs = [
        { id: 1, title: 'Smart Contract Audit', freelancer: 'GD7X...9K2L', locked: 12500, yield: 156.25, progress: 60 },
        { id: 2, title: 'DeFi Dashboard Design', freelancer: 'GC3M...4TY8', locked: 8300, yield: 103.75, progress: 40 },
        { id: 3, title: 'Token Economics Research', freelancer: 'GA9L...2XC7', locked: 4200, yield: 52.5, progress: 80 },
    ];

    const stats = [
        { label: 'Total Locked', value: earnings.totalLocked, prefix: '$', color: 'teal' },
        { label: 'Yield Earned', value: earnings.totalYield, prefix: '$', color: 'green' },
        { label: 'Active Jobs', value: earnings.activeJobs, prefix: '', color: 'blue' },
        { label: 'Completed', value: earnings.completedJobs, prefix: '', color: 'purple' }
    ];

    return (
        <div className="flex min-h-screen bg-[#090C10]">
            {/* Sidebar */}
            <Sidebar userType="client" />

            {/* Main Content */}
            <div className="flex-1 flex flex-col ml-64">                {/* Top Bar */}
                <motion.nav
                    initial={{ y: -100 }}
                    animate={{ y: 0 }}
                    className="border-b border-teal-500/10 backdrop-blur-xl bg-[#0F172A]/80 sticky top-0 z-50"
                >
                    <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-white">Dashboard</h1>

                        <div className="flex items-center gap-3">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowJobModal(true)}
                                className="px-6 py-2 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-teal-500/40 transition-all"
                            >
                                + New Job
                            </motion.button>

                            {connected && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={disconnect}
                                    className="px-4 py-2 border border-red-500/50 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20"
                                >
                                    Disconnect
                                </motion.button>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="bg-yellow-500/10 border-t border-yellow-500/20 px-6 py-2">
                            <p className="text-sm text-yellow-400 text-center">{error}</p>
                        </div>
                    )}
                </motion.nav>

                {/* Dashboard Content */}
                <div className="flex-1 overflow-auto">
                    <div className="max-w-7xl mx-auto px-6 py-8">
                        {/* Stats Grid */}
                        <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
                        >
                            {stats.map((stat, i) => (
                                <motion.div
                                    key={i}
                                    variants={fadeInUp}
                                    whileHover={hoverLift.hover}
                                    className="p-6 bg-[#0F172A] backdrop-blur-xl border border-teal-500/10 rounded-2xl"
                                >
                                    <div className="text-sm text-gray-400 mb-2">{stat.label}</div>
                                    <AnimatedCounter
                                        value={stat.value}
                                        prefix={stat.prefix}
                                        className={`text-3xl font-bold text-${stat.color}-400`}
                                    />
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Active Jobs */}
                        <FadeInUp delay={0.3}>
                            <div className="bg-[#0F172A] backdrop-blur-xl border border-teal-500/10 rounded-2xl p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold">Active Jobs</h2>
                                    <div className="text-sm text-gray-400">
                                        {activeJobs.length} active • Earning ${earnings.totalYield.toFixed(2)}/month
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {activeJobs.map((job, i) => (
                                        <motion.div
                                            key={job.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            whileHover={{ scale: 1.02, x: 8 }}
                                            className="p-6 bg-[#121826] border border-teal-500/10 rounded-xl hover:bg-[#1a2332] hover:border-teal-500/30 transition-all cursor-pointer"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-1">{job.title}</h3>
                                                    <p className="text-sm text-gray-400 font-mono">→ {job.freelancer}</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-teal-400">${job.locked}</div>
                                                    <div className="text-sm text-green-400">+${job.yield} yield</div>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="mb-3">
                                                <div className="flex justify-between text-sm text-gray-400 mb-2">
                                                    <span>Progress</span>
                                                    <span>{job.progress}%</span>
                                                </div>
                                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${job.progress}%` }}
                                                        transition={{ duration: 1, delay: i * 0.1 }}
                                                        className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className="flex-1 px-4 py-2 bg-teal-500/20 text-teal-400 rounded-lg hover:bg-teal-500/30"
                                                >
                                                    View Details
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className="flex-1 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"
                                                >
                                                    Release Payment
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </FadeInUp>

                        {/* Yield Tracker */}
                        <FadeInUp delay={0.4}>
                            <div className="mt-8 p-8 bg-gradient-to-br from-green-500/10 to-teal-500/10 backdrop-blur-xl border border-teal-500/10 rounded-2xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold mb-2">💰 Your Real-Time Yield</h3>
                                        <p className="text-gray-400">Earning while you wait for milestones</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-4xl font-bold text-green-400">
                                            <AnimatedCounter value={earnings.totalYield} prefix="$" decimals={2} />
                                        </div>
                                        <div className="text-sm text-gray-400 mt-1">5.0% APY on ${earnings.totalLocked}</div>
                                    </div>
                                </div>
                            </div>
                        </FadeInUp>
                    </div>
                </div>
            </div>

            {/* Job Creation Modal */}
            {showJobModal && <JobCreationModal onClose={() => setShowJobModal(false)} />}
        </div>
    );
}
