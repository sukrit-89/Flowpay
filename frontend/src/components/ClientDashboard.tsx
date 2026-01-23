import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '../hooks/useWallet';
import { useNavigate } from 'react-router-dom';
import JobCreationModal from './JobCreationModal';
import FadeInUp from './animated/FadeInUp';
import AnimatedCounter from './animated/AnimatedCounter';
import { hoverLift, staggerContainer, fadeInUp } from '../animations/variants';
import Sidebar from './shared/Sidebar';

interface Job {
    id: string;
    title: string;
    description: string;
    totalAmount: number;
    milestones: any[] | number;  // Can be array or number
    status: 'pending' | 'in_progress' | 'completed';
    freelancerAddress: string;
    clientAddress: string;
    createdAt: string;
    txHash?: string;
}

export default function ClientDashboard() {
    const { connected, disconnect, address, error } = useWallet();
    const [showJobModal, setShowJobModal] = useState(false);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Fetch real jobs from localStorage
    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const storedJobs = localStorage.getItem('yieldra_jobs');
                let parsedJobs: Job[] = storedJobs ? JSON.parse(storedJobs) : [];
                
                // Filter jobs created by this address
                const clientJobs = parsedJobs.filter(job => 
                    job.clientAddress?.toLowerCase() === address?.toLowerCase()
                );
                
                setJobs(clientJobs);
            } catch (error) {
                console.error('Failed to fetch jobs:', error);
            } finally {
                setLoading(false);
            }
        };

        const handleJobCreated = () => {
            fetchJobs();
        };

        if (address) {
            fetchJobs();
            window.addEventListener('jobCreated', handleJobCreated);
        } else {
            setLoading(false);
        }

        return () => {
            window.removeEventListener('jobCreated', handleJobCreated);
        };
    }, [address]);

    // Calculate real stats
    const totalLocked = jobs.reduce((sum, job) => sum + job.totalAmount, 0);
    const totalYield = totalLocked * 0.05; // 5% APY estimate
    const activeJobs = jobs.filter(job => job.status !== 'completed').length;
    const completedJobs = jobs.filter(job => job.status === 'completed').length;

    const stats = [
        { label: 'Total Locked', value: totalLocked, prefix: '$', color: 'teal' },
        { label: 'Yield Earned', value: totalYield, prefix: '$', color: 'green' },
        { label: 'Active Jobs', value: activeJobs, prefix: '', color: 'blue' },
        { label: 'Completed', value: completedJobs, prefix: '', color: 'purple' }
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
                                        {activeJobs} active • Earning ${totalYield.toFixed(2)}/month
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {jobs.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="text-6xl mb-4">📝</div>
                                            <h3 className="text-xl font-semibold text-white mb-2">No Jobs Yet</h3>
                                            <p className="text-gray-400 mb-6">Create your first job to get started</p>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setShowJobModal(true)}
                                                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-teal-500/40"
                                            >
                                                Create Job
                                            </motion.button>
                                        </div>
                                    ) : (
                                        jobs.slice(0, 3).map((job: any, i: number) => (
                                            <motion.div
                                                key={job.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                whileHover={{ scale: 1.02, x: 8 }}
                                                onClick={() => navigate(`/client/jobs/${job.id}`)}
                                                className="p-6 bg-[#121826] border border-teal-500/10 rounded-xl hover:bg-[#1a2332] hover:border-teal-500/30 transition-all cursor-pointer"
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h3 className="text-lg font-semibold mb-1">{job.title}</h3>
                                                        <p className="text-sm text-gray-400 font-mono">→ {job.freelancerAddress?.slice(0, 8)}...{job.freelancerAddress?.slice(-8)}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-2xl font-bold text-teal-400">${job.totalAmount}</div>
                                                        <div className="text-sm text-green-400">+${(job.totalAmount * 0.05).toFixed(2)} yield</div>
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="mb-3">
                                                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                                                        <span>Status</span>
                                                        <span className="capitalize">{job.status.replace('_', ' ')}</span>
                                                    </div>
                                                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: job.status === 'completed' ? '100%' : job.status === 'in_progress' ? '60%' : '20%' }}
                                                            transition={{ duration: 1, delay: i * 0.1 }}
                                                            className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    <span className="px-3 py-1 bg-teal-500/20 text-teal-400 rounded-full text-sm">
                                                        {Array.isArray(job.milestones) ? job.milestones.length : job.milestones} milestones
                                                    </span>
                                                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                                                        ${job.totalAmount} budget
                                                    </span>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>

                                {jobs.length > 3 && (
                                    <div className="mt-6 text-center">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => navigate('/client/jobs')}
                                            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-teal-500/40"
                                        >
                                            View All Jobs →
                                        </motion.button>
                                    </div>
                                )}
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
                                            <AnimatedCounter value={totalYield} prefix="$" decimals={2} />
                                        </div>
                                        <div className="text-sm text-gray-400 mt-1">5.0% APY on ${totalLocked}</div>
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
