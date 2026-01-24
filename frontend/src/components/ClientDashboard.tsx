import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '../hooks/useWallet';
import { useNavigate } from 'react-router-dom';
import JobCreationModal from './JobCreationModal';
import Sidebar from './shared/Sidebar';

interface Job {
    id: string;
    title: string;
    description: string;
    totalAmount: number;
    milestones: any[] | number;
    status: 'pending' | 'in_progress' | 'completed';
    freelancerAddress: string;
    clientAddress: string;
    createdAt: string;
    txHash?: string;
}

export default function ClientDashboard() {
    const { connected, disconnect, address } = useWallet();
    const [showJobModal, setShowJobModal] = useState(false);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const storedJobs = localStorage.getItem('yieldra_jobs');
                let parsedJobs: Job[] = storedJobs ? JSON.parse(storedJobs) : [];
                
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

    const totalLocked = jobs.reduce((sum, job) => sum + job.totalAmount, 0);
    const totalYield = totalLocked * 0.05;
    const activeJobs = jobs.filter(job => job.status !== 'completed').length;
    const completedJobs = jobs.filter(job => job.status === 'completed').length;

    const stats = [
        { label: 'Total Locked', value: totalLocked, prefix: '$' },
        { label: 'Estimated Yield', value: totalYield, prefix: '$' },
        { label: 'Active Projects', value: activeJobs },
        { label: 'Completed', value: completedJobs }
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-emerald-100 text-emerald-800';
            case 'in_progress':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-slate-100 text-slate-800';
        }
    };

    const getProgressPercent = (status: string) => {
        switch (status) {
            case 'completed':
                return 100;
            case 'in_progress':
                return 60;
            default:
                return 20;
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar - Fixed Width */}
            <div className="w-64 flex-shrink-0">
                <Sidebar userType="client" />
            </div>

            {/* Main Content - Takes Remaining Space */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <motion.header
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="border-b border-slate-200 bg-white sticky top-0 z-40"
                >
                    <div className="px-8 py-4 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                            <p className="text-sm text-slate-600 mt-1">Manage your projects and earnings</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowJobModal(true)}
                                className="btn btn-primary"
                            >
                                + New Project
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={disconnect}
                                className="btn btn-ghost"
                            >
                                Disconnect
                            </motion.button>
                        </div>
                    </div>
                </motion.header>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="px-8 py-8 max-w-7xl">
                        {/* Stats Grid */}
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {stats.map((stat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                                >
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                        {stat.label}
                                    </p>
                                    <div className="flex items-baseline gap-1">
                                        {stat.prefix && <span className="text-slate-600 font-semibold">{stat.prefix}</span>}
                                        <p className="text-3xl font-bold text-slate-900">
                                            {typeof stat.value === 'number' ? stat.value.toFixed(2) : stat.value}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Jobs Section */}
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-8">Your Projects</h2>

                            {loading ? (
                                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                                    <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
                                    <p className="text-slate-600 mt-4 font-medium">Loading projects...</p>
                                </div>
                            ) : jobs.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm"
                                >
                                    <div className="text-6xl mb-4">📋</div>
                                    <h3 className="text-xl font-semibold text-slate-900 mb-2">No projects yet</h3>
                                    <p className="text-slate-600 mb-6">Start by creating your first project to connect with freelancers</p>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setShowJobModal(true)}
                                        className="btn btn-primary"
                                    >
                                        Create Your First Project
                                    </motion.button>
                                </motion.div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {jobs.map((job, i) => (
                                        <motion.div
                                            key={job.id}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            whileHover={{ scale: 1.01, y: -4 }}
                                            onClick={() => navigate(`/client/jobs/${job.id}`)}
                                            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                                                        {job.title}
                                                    </h3>
                                                    <p className="text-sm text-slate-600 line-clamp-2">
                                                        {job.description}
                                                    </p>
                                                </div>
                                                <span className={`badge flex-shrink-0 ml-2 ${getStatusColor(job.status)}`}>
                                                    {job.status.replace('_', ' ')}
                                                </span>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="mb-4">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs text-slate-600 font-medium">Progress</span>
                                                    <span className="text-xs text-slate-600">{getProgressPercent(job.status)}%</span>
                                                </div>
                                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${getProgressPercent(job.status)}%` }}
                                                        transition={{ duration: 0.6, ease: 'easeOut' }}
                                                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600"
                                                    />
                                                </div>
                                            </div>

                                            {/* Details */}
                                            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 mt-auto">
                                                <div>
                                                    <p className="text-xs text-slate-500 font-medium mb-1">Budget</p>
                                                    <p className="font-semibold text-slate-900">
                                                        ${job.totalAmount.toFixed(2)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 font-medium mb-1">Milestones</p>
                                                    <p className="font-semibold text-slate-900">
                                                        {Array.isArray(job.milestones) ? job.milestones.length : job.milestones}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 font-medium mb-1">Potential Yield</p>
                                                    <p className="font-semibold text-emerald-600">
                                                        ${(job.totalAmount * 0.05).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Job Creation Modal */}
            <JobCreationModal
                isOpen={showJobModal}
                onClose={() => setShowJobModal(false)}
                onJobCreated={() => {
                    setShowJobModal(false);
                    const event = new Event('jobCreated');
                    window.dispatchEvent(event);
                }}
            />
        </div>
    );
}
