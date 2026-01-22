import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../shared/Sidebar';
import { useWallet } from '../../hooks/useWallet';

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

export default function ClientJobs() {
    const navigate = useNavigate();
    const { address } = useWallet();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch real job data from contract events
    useEffect(() => {
        const fetchJobs = async () => {
            try {
                // For now, we'll store created jobs in localStorage as a simple database
                // In production, this would query contract events or use a proper backend
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

    const getStatusColor = (status: Job['status']) => {
        switch (status) {
            case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'in_progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const getStatusText = (status: Job['status']) => {
        switch (status) {
            case 'pending': return 'Pending';
            case 'in_progress': return 'In Progress';
            case 'completed': return 'Completed';
            default: return 'Unknown';
        }
    };

    if (!address) {
        return (
            <div className="flex min-h-screen bg-[#090C10]">
                <Sidebar userType="client" />
                <div className="flex-1 flex flex-col ml-64">
                    <div className="flex-1 flex items-center justify-center p-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center max-w-md"
                        >
                            <div className="text-6xl mb-4">🔌</div>
                            <h1 className="text-3xl font-bold text-white mb-4">Connect Wallet</h1>
                            <p className="text-[#94A3B8] mb-8">
                                Please connect your wallet to view your jobs.
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/client')}
                                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-teal-500/40"
                            >
                                ← Back to Dashboard
                            </motion.button>
                        </motion.div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#090C10]">
            <Sidebar userType="client" />

            <div className="flex-1 flex flex-col ml-64">
                <div className="p-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <h1 className="text-4xl font-bold text-white mb-2">Your Jobs</h1>
                        <p className="text-[#94A3B8]">
                            Manage all your job postings and track progress
                        </p>
                    </motion.div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-white">Loading jobs...</div>
                        </div>
                    ) : jobs.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-12"
                        >
                            <div className="text-6xl mb-4">📝</div>
                            <h2 className="text-2xl font-bold text-white mb-4">No Jobs Yet</h2>
                            <p className="text-[#94A3B8] mb-8">
                                Create your first job to get started with Yieldra.
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/client')}
                                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-teal-500/40"
                            >
                                Create Your First Job
                            </motion.button>
                        </motion.div>
                    ) : (
                        <div className="space-y-6">
                            {jobs.map((job, index) => (
                                <motion.div
                                    key={job.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-[#1A1F2E] border border-[#2A3441] rounded-xl p-6 hover:border-teal-500/50 transition-colors"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-white mb-2">{job.title}</h3>
                                            <p className="text-[#94A3B8] mb-4">{job.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-teal-400">${job.totalAmount}</div>
                                            <div className="text-sm text-[#94A3B8]">{job.milestones} milestones</div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center space-x-4">
                                            <div className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(job.status)}`}>
                                                {getStatusText(job.status)}
                                            </div>
                                            <div className="text-sm text-[#94A3B8]">
                                                Created: {new Date(job.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => navigate(`/client/jobs/${job.id}`)}
                                            className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-colors"
                                        >
                                            View Details
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
