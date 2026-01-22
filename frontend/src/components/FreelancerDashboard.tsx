import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '../hooks/useWallet';
import { useNavigate } from 'react-router-dom';
import FadeInUp from './animated/FadeInUp';
import AnimatedCounter from './animated/AnimatedCounter';
import { hoverLift, staggerContainer, fadeInUp } from '../animations/variants';
import Sidebar from './shared/Sidebar';

interface Job {
    id: string;
    title: string;
    description: string;
    totalAmount: number;
    milestones: number;
    status: 'pending' | 'in_progress' | 'completed';
    freelancerAddress: string;
    clientAddress: string;
    createdAt: string;
    txHash?: string;
}

export default function FreelancerDashboard() {
    const { address, connected, connect, disconnect, error } = useWallet();
    const [activeTab, setActiveTab] = useState('available');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [jobs, setJobs] = useState<Job[]>([]);
    const navigate = useNavigate();

    // Fetch real jobs from localStorage
    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const storedJobs = localStorage.getItem('yieldra_jobs');
                let parsedJobs: Job[] = storedJobs ? JSON.parse(storedJobs) : [];
                
                // Show all jobs (freelancer can see all available jobs)
                setJobs(parsedJobs);
            } catch (error) {
                console.error('Failed to fetch jobs:', error);
            }
        };

        const handleJobCreated = () => {
            fetchJobs();
        };

        fetchJobs();
        window.addEventListener('jobCreated', handleJobCreated);

        return () => {
            window.removeEventListener('jobCreated', handleJobCreated);
        };
    }, []);

    // Calculate real stats (for freelancer, this would be different in production)
    const stats = {
        totalEarned: jobs.reduce((sum, job) => sum + (job.status === 'completed' ? job.totalAmount : 0), 0),
        activeJobs: jobs.filter(job => job.status === 'in_progress').length,
        completedJobs: jobs.filter(job => job.status === 'completed').length,
        avgRating: 4.9 // Would come from reputation system
    };

    const categories = ['All', 'Development', 'Design', 'Writing', 'Marketing'];

    // Filter jobs based on category
    const filteredJobs = selectedCategory === 'All' 
        ? jobs 
        : jobs.filter(job => job.category === selectedCategory);

    const availableJobs = filteredJobs.map((job, index) => ({
        id: job.id,
        title: job.title,
        category: job.category || 'Development',
        client: job.clientAddress?.slice(0, 8) + '...' + job.clientAddress?.slice(-8),
        budget: job.totalAmount,
        duration: job.duration || '1-3 months',
        description: job.description,
        skills: ['Stellar', 'Smart Contracts', 'Rust'],
        proposals: Math.floor(Math.random() * 20), // Mock proposal count
        posted: new Date(job.createdAt).toLocaleDateString(),
        verified: true
    }));

    const myProposals = [
        { id: 1, job: 'Token Swap Integration', status: 'pending', amount: 2500, submitted: '2 days ago' },
        { id: 2, job: 'Landing Page Redesign', status: 'accepted', amount: 1800, submitted: '1 week ago' }
    ];

    const activeContracts = [
        { id: 1, job: 'DeFi Protocol Development', client: 'GD7X...9K2L', amount: 5000, deadline: '2 weeks', progress: 75 },
        { id: 2, job: 'NFT Marketplace UI', client: 'GC3M...4TY8', amount: 3000, deadline: '1 week', progress: 40 }
    ];

    return (
        <div className="flex min-h-screen bg-[#090C10]">
            {/* Sidebar */}
            <Sidebar userType="freelancer" />

            {/* Main Content */}
            <div className="flex-1 flex flex-col ml-64">                {/* Navigation */}
                <motion.nav
                    initial={{ y: -100 }}
                    animate={{ y: 0 }}
                    className="border-b border-teal-500/10 backdrop-blur-xl bg-[#0F172A]/80 sticky top-0 z-50"
                >
                    <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                        {/* Page Title */}
                        <h1 className="text-2xl font-bold text-white capitalize">{activeTab} Jobs</h1>

                        {/* Wallet */}
                        <div className="flex items-center gap-3">
                            {connected ? (
                                <>
                                    <div className="hidden sm:block px-4 py-2 bg-white/5 rounded-lg font-mono text-sm text-gray-400">
                                        {address.slice(0, 6)}...{address.slice(-4)}
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={disconnect}
                                        className="px-4 py-2 border border-red-500/50 bg-red-500/10 text-red-400 rounded-lg"
                                    >
                                        Disconnect
                                    </motion.button>
                                </>
                            ) : (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={connect}
                                    className="px-6 py-2 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-teal-500/40"
                                >
                                    Connect Wallet
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
                        {/* Stats Overview */}
                        <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
                        >
                            {[
                                { label: 'Total Earned', value: stats.totalEarned, prefix: '$', color: 'green' },
                                { label: 'Active Jobs', value: stats.activeJobs, prefix: '', color: 'blue' },
                                { label: 'Completed', value: stats.completedJobs, prefix: '', color: 'purple' },
                                { label: 'Rating', value: stats.avgRating, prefix: '', suffix: '⭐', color: 'yellow' }
                            ].map((stat, i) => (
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
                                        suffix={stat.suffix}
                                        decimals={stat.suffix?.includes('⭐') ? 1 : 0}
                                        className={`text-3xl font-bold text-${stat.color}-400`}
                                    />
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Available Jobs */}
                        {activeTab === 'available' && (
                            <FadeInUp>
                                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                                    {/* Header */}
                                    <div className="mb-6">
                                        <h2 className="text-3xl font-bold mb-4">Browse Jobs</h2>

                                        {/* Categories */}
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                            {categories.map(cat => (
                                                <button
                                                    key={cat}
                                                    onClick={() => setSelectedCategory(cat)}
                                                    className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${selectedCategory === cat
                                                        ? 'bg-teal-500 text-white'
                                                        : 'bg-white/5 border border-teal-500/20 text-[#94A3B8] hover:border-teal-500'
                                                        }`}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Job Cards */}
                                    <div className="space-y-4">
                                        {availableJobs.map((job, i) => (
                                            <motion.div
                                                key={job.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                whileHover={{ scale: 1.01, x: 4 }}
                                                className="p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all"
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h3 className="text-xl font-bold">{job.title}</h3>
                                                            {job.verified && (
                                                                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <p className="text-gray-400 mb-3">{job.description}</p>
                                                        <div className="flex flex-wrap gap-2 mb-3">
                                                            {job.skills.map(skill => (
                                                                <span key={skill} className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                                                                    {skill}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <div className="flex gap-4 text-sm text-gray-500">
                                                            <span>⏱ {job.duration}</span>
                                                            <span>💼 {job.proposals} proposals</span>
                                                            <span>📅 {job.posted}</span>
                                                            <span className="font-mono">From: {job.client}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right ml-6">
                                                        <div className="text-3xl font-bold text-green-400">${job.budget}</div>
                                                        <span className="inline-block mt-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                                                            {job.category}
                                                        </span>
                                                    </div>
                                                </div>
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className="w-full py-3 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-teal-500/50 transition-all"
                                                >
                                                    Submit Proposal →
                                                </motion.button>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </FadeInUp>
                        )}

                        {/* My Proposals */}
                        {activeTab === 'proposals' && (
                            <FadeInUp>
                                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                                    <h2 className="text-2xl font-bold mb-6">My Proposals</h2>
                                    <div className="space-y-4">
                                        {myProposals.map(proposal => (
                                            <motion.div
                                                key={proposal.id}
                                                whileHover={{ scale: 1.01 }}
                                                className="p-6 bg-white/5 border border-white/10 rounded-xl"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h3 className="text-lg font-semibold mb-1">{proposal.job}</h3>
                                                        <p className="text-sm text-gray-400">Submitted {proposal.submitted}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-2xl font-bold text-green-400">${proposal.amount}</div>
                                                        <span className={`inline-block px-3 py-1 rounded-full text-sm ${proposal.status === 'accepted'
                                                            ? 'bg-green-500/20 text-green-400'
                                                            : 'bg-yellow-500/20 text-yellow-400'
                                                            }`}>
                                                            {proposal.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </FadeInUp>
                        )}

                        {/* Active Contracts */}
                        {activeTab === 'active' && (
                            <FadeInUp>
                                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                                    <h2 className="text-2xl font-bold mb-6">Active Contracts</h2>
                                    <div className="space-y-4">
                                        {activeContracts.map((contract, i) => (
                                            <motion.div
                                                key={contract.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: i * 0.1 }}
                                                whileHover={{ scale: 1.01 }}
                                                className="p-6 bg-white/5 border border-white/10 rounded-xl"
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h3 className="text-lg font-semibold mb-1">{contract.title}</h3>
                                                        <p className="text-sm text-gray-400 font-mono">Client: {contract.client}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-green-400 font-bold">${contract.earned}</div>
                                                        <div className="text-sm text-gray-400">of ${contract.total}</div>
                                                    </div>
                                                </div>
                                                <div className="mb-4">
                                                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                                                        <span>Progress</span>
                                                        <span>{contract.progress}%</span>
                                                    </div>
                                                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${contract.progress}%` }}
                                                            className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                                                        />
                                                    </div>
                                                </div>
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    className="w-full py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"
                                                >
                                                    Submit Milestone Proof
                                                </motion.button>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </FadeInUp>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
