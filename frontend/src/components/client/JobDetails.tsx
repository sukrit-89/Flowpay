import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../shared/Sidebar';
import { useWallet } from '../../hooks/useWallet';
import { useContracts } from '../../hooks/useContracts';
import Toast from '../Toast';

interface Milestone {
    id: number;
    title: string;
    description: string;
    amount: number;
    status: 'pending' | 'submitted' | 'approved' | 'paid';
    proofUrl?: string;
    submittedAt?: string;
    approvedAt?: string;
}

interface Job {
    id: string;
    title: string;
    description: string;
    totalAmount: number;
    milestones: Milestone[];
    status: 'pending' | 'in_progress' | 'completed';
    freelancerAddress: string;
    clientAddress: string;
    createdAt: string;
}

export default function JobDetails() {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();
    const { address } = useWallet();
    const { approveMilestone, releasePayment, loading } = useContracts();
    const [job, setJob] = useState<Job | null>(null);
    const [loadingJob, setLoadingJob] = useState(true);
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });

    useEffect(() => {
        const fetchJob = async () => {
            try {
                // Fetch job from localStorage (in production, this would query the contract)
                const storedJobs = localStorage.getItem('yieldra_jobs');
                const jobs = storedJobs ? JSON.parse(storedJobs) : [];
                
                const foundJob = jobs.find((job: any) => job.id === jobId);
                
                if (foundJob) {
                    // Calculate milestones based on job amount
                    const milestoneAmounts = [
                        foundJob.totalAmount * 0.3,  // 30% for first milestone
                        foundJob.totalAmount * 0.4,  // 40% for second milestone  
                        foundJob.totalAmount * 0.3   // 30% for third milestone
                    ];
                    
                    const jobWithMilestones = {
                        ...foundJob,
                        milestones: foundJob.milestones || [
                            {
                                id: 1,
                                title: 'Initial Setup & Planning',
                                description: 'Project setup, requirements gathering, and initial planning',
                                amount: milestoneAmounts[0],
                                status: 'pending' as const
                            },
                            {
                                id: 2,
                                title: 'Core Development',
                                description: 'Main implementation and development work',
                                amount: milestoneAmounts[1],
                                status: 'pending' as const
                            },
                            {
                                id: 3,
                                title: 'Testing & Delivery',
                                description: 'Final testing, bug fixes, and project delivery',
                                amount: milestoneAmounts[2],
                                status: 'pending' as const
                            }
                        ]
                    };
                    setJob(jobWithMilestones);
                } else {
                    setJob(null);
                }
            } catch (error) {
                console.error('Failed to fetch job:', error);
                showToast('Failed to load job details', 'error');
            } finally {
                setLoadingJob(false);
            }
        };

        if (jobId && address) {
            fetchJob();
        } else {
            setLoadingJob(false);
        }
    }, [jobId, address]);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ ...toast, show: false }), 3000);
    };

    const handleApproveMilestone = async (milestoneId: number) => {
        if (!job) return;

        try {
            const result = await approveMilestone(job.id, milestoneId);
            
            if (result.success) {
                showToast('Milestone approved successfully!', 'success');
                // Update local state
                setJob(prev => prev ? {
                    ...prev,
                    milestones: prev.milestones.map(m => 
                        m.id === milestoneId 
                            ? { ...m, status: 'approved', approvedAt: new Date().toISOString() }
                            : m
                    )
                } : null);
            } else {
                showToast(`Failed to approve: ${result.error}`, 'error');
            }
        } catch (error: any) {
            showToast(`Error: ${error.message}`, 'error');
        }
    };

    const handleReleasePayment = async (milestoneId: number) => {
        if (!job) return;

        try {
            const result = await releasePayment(job.id, milestoneId);
            
            if (result.success) {
                showToast('Payment released successfully!', 'success');
                // Update local state
                setJob(prev => prev ? {
                    ...prev,
                    milestones: prev.milestones.map(m => 
                        m.id === milestoneId 
                            ? { ...m, status: 'paid' }
                            : m
                    )
                } : null);
            } else {
                showToast(`Failed to release payment: ${result.error}`, 'error');
            }
        } catch (error: any) {
            showToast(`Error: ${error.message}`, 'error');
        }
    };

    const getStatusColor = (status: Milestone['status']) => {
        switch (status) {
            case 'pending': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
            case 'submitted': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'approved': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'paid': return 'bg-green-500/20 text-green-400 border-green-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const getStatusText = (status: Milestone['status']) => {
        switch (status) {
            case 'pending': return 'Pending';
            case 'submitted': return 'Proof Submitted';
            case 'approved': return 'Approved';
            case 'paid': return 'Paid';
            default: return 'Unknown';
        }
    };

    if (loadingJob) {
        return (
            <div className="flex min-h-screen bg-[#090C10]">
                <Sidebar userType="client" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-white">Loading job details...</div>
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="flex min-h-screen bg-[#090C10]">
                <Sidebar userType="client" />
                <div className="flex-1 flex items-center justify-center p-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-md"
                    >
                        <div className="text-6xl mb-4">❌</div>
                        <h1 className="text-3xl font-bold text-white mb-4">Job Not Found</h1>
                        <p className="text-[#94A3B8] mb-8">
                            The job you're looking for doesn't exist or you don't have access to it.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/client/jobs')}
                            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-teal-500/40"
                        >
                            ← Back to Jobs
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#090C10]">
            <Sidebar userType="client" />
            
            <div className="flex-1 flex flex-col ml-64">
                <div className="p-8">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <button
                            onClick={() => navigate('/client/jobs')}
                            className="text-teal-400 hover:text-teal-300 mb-4 flex items-center gap-2"
                        >
                            ← Back to Jobs
                        </button>
                        <h1 className="text-4xl font-bold text-white mb-2">{job.title}</h1>
                        <p className="text-[#94A3B8] mb-4">{job.description}</p>
                        <div className="flex items-center gap-6">
                            <div className="text-2xl font-bold text-teal-400">${job.totalAmount}</div>
                            <div className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(job.milestones[0]?.status || 'pending')}`}>
                                {job.milestones.filter(m => m.status === 'paid').length} / {job.milestones.length} Paid
                            </div>
                        </div>
                    </motion.div>

                    {/* Milestones */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-white mb-4">Milestones</h2>
                        
                        {job.milestones.map((milestone, index) => (
                            <motion.div
                                key={milestone.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-[#1A1F2E] border border-[#2A3441] rounded-xl p-6"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-white mb-2">
                                            Milestone {milestone.id}: {milestone.title}
                                        </h3>
                                        <p className="text-[#94A3B8] mb-3">{milestone.description}</p>
                                        
                                        {milestone.proofUrl && (
                                            <div className="mb-3">
                                                <a
                                                    href={milestone.proofUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-teal-400 hover:text-teal-300 underline"
                                                >
                                                    View Proof →
                                                </a>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 text-sm">
                                            <div className={`px-3 py-1 rounded-full border ${getStatusColor(milestone.status)}`}>
                                                {getStatusText(milestone.status)}
                                            </div>
                                            <div className="text-[#94A3B8]">
                                                Amount: ${milestone.amount}
                                            </div>
                                            {milestone.submittedAt && (
                                                <div className="text-[#94A3B8]">
                                                    Submitted: {new Date(milestone.submittedAt).toLocaleDateString()}
                                                </div>
                                            )}
                                            {milestone.approvedAt && (
                                                <div className="text-[#94A3B8]">
                                                    Approved: {new Date(milestone.approvedAt).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-teal-400">${milestone.amount}</div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 mt-4">
                                    {milestone.status === 'submitted' && (
                                        <>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleApproveMilestone(milestone.id)}
                                                disabled={loading}
                                                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                                            >
                                                {loading ? 'Approving...' : 'Approve Milestone'}
                                            </motion.button>
                                        </>
                                    )}
                                    
                                    {milestone.status === 'approved' && (
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleReleasePayment(milestone.id)}
                                            disabled={loading}
                                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                                        >
                                            {loading ? 'Releasing...' : 'Release Payment'}
                                        </motion.button>
                                    )}
                                    
                                    {milestone.status === 'paid' && (
                                        <div className="px-4 py-2 bg-gray-500/30 text-gray-400 rounded-lg font-medium">
                                            ✓ Paid
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Toast */}
            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}
        </div>
    );
}
