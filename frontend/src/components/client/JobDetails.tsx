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
                    
                    // Check if all milestones are paid and update status if needed
                    const allPaid = jobWithMilestones.milestones.every((m: any) => m.status === 'paid');
                    if (allPaid && jobWithMilestones.status !== 'completed') {
                        jobWithMilestones.status = 'completed';
                        // Update in localStorage
                        const updatedJobs = jobs.map((j: any) => 
                            j.id === jobId ? jobWithMilestones : j
                        );
                        localStorage.setItem('yieldra_jobs', JSON.stringify(updatedJobs));
                    }
                    
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
                const updatedJob = {
                    ...job,
                    milestones: job.milestones.map(m => 
                        m.id === milestoneId 
                            ? { ...m, status: 'paid' as const }
                            : m
                    )
                };
                
                // Check if all milestones are paid
                const allPaid = updatedJob.milestones.every(m => m.status === 'paid');
                if (allPaid) {
                    updatedJob.status = 'completed';
                }
                
                setJob(updatedJob);
                
                // Update in localStorage
                const storedJobs = localStorage.getItem('yieldra_jobs');
                if (storedJobs) {
                    const jobs = JSON.parse(storedJobs);
                    const updatedJobs = jobs.map((j: any) => 
                        j.id === job.id ? updatedJob : j
                    );
                    localStorage.setItem('yieldra_jobs', JSON.stringify(updatedJobs));
                }
                
                // If job is completed, show success message
                if (allPaid) {
                    setTimeout(() => {
                        showToast('🎉 All milestones completed! Job is now complete.', 'success');
                    }, 1500);
                }
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
            <div className="flex min-h-screen bg-slate-50">
                <Sidebar userType="client" />
                <div className="flex-1 flex items-center justify-center">
                    <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-slate-500"
                    >
                        Loading job details...
                    </motion.div>
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="flex min-h-screen bg-slate-50">
                <Sidebar userType="client" />
                <div className="flex-1 flex items-center justify-center p-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-md"
                    >
                        <div className="text-6xl mb-6">📋</div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-3">Job Not Found</h1>
                        <p className="text-slate-600 mb-8">
                            The job you're looking for doesn't exist or you don't have access to it.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/client/jobs')}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                            ← Back to Jobs
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        );
    }

    const paidCount = job.milestones.filter(m => m.status === 'paid').length;
    const totalMilestones = job.milestones.length;

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar userType="client" />
            
            <div className="flex-1 flex flex-col">
                {/* Back Navigation */}
                <div className="px-8 py-4 bg-white border-b border-slate-100">
                    <motion.button
                        whileHover={{ x: -2 }}
                        onClick={() => navigate('/client/jobs')}
                        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                    >
                        ← Back to Dashboard
                    </motion.button>
                </div>

                {/* Header Section - Full Width */}
                <div className="bg-white border-b border-slate-100 px-8 py-8">
                    <div className="flex justify-between items-start gap-8">
                        {/* Left: Title & ID */}
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">{job.title}</h1>
                            <p className="text-slate-400 text-sm">Job ID: {job.id}</p>
                        </div>

                        {/* Right: Budget & Status */}
                        <div className="text-right">
                            <div className="text-4xl font-bold text-indigo-600 mb-3">
                                ${job.totalAmount.toFixed(2)}
                            </div>
                            <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                                job.status === 'completed' 
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : job.status === 'in_progress'
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            }`}>
                                {job.status === 'completed' ? '✓ Completed' : job.status === 'in_progress' ? '⚙️ In Progress' : '⏳ Active'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area - Two Columns */}
                <div className="flex-1 px-8 py-8 overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl">
                        {/* Left Column - Milestones (2/3 width) */}
                        <div className="lg:col-span-2">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">Milestones</h2>
                            
                            <div className="space-y-5">
                                {job.milestones.map((milestone, index) => (
                                    <motion.div
                                        key={milestone.id}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.08 }}
                                        className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200"
                                    >
                                        {/* Milestone Header */}
                                        <div className="flex justify-between items-start mb-4">
                                            {/* Left: Description */}
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-slate-900 mb-1">
                                                    {milestone.title}
                                                </h3>
                                                <p className="text-slate-600 text-sm mb-3">{milestone.description}</p>
                                                
                                                {/* Details Grid */}
                                                <div className="flex flex-wrap gap-6">
                                                    <div>
                                                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">Amount</p>
                                                        <p className="text-lg font-bold text-indigo-600">${milestone.amount.toFixed(2)}</p>
                                                    </div>
                                                    
                                                    {milestone.submittedAt && (
                                                        <div>
                                                            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">Submitted</p>
                                                            <p className="text-slate-900 font-medium">{new Date(milestone.submittedAt).toLocaleDateString()}</p>
                                                        </div>
                                                    )}
                                                    
                                                    {milestone.approvedAt && (
                                                        <div>
                                                            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">Approved</p>
                                                            <p className="text-slate-900 font-medium">{new Date(milestone.approvedAt).toLocaleDateString()}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right: Status Badge */}
                                            <div className="ml-4 flex-shrink-0">
                                                {milestone.status === 'pending' && (
                                                    <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold whitespace-nowrap">
                                                        Pending
                                                    </span>
                                                )}
                                                {milestone.status === 'submitted' && (
                                                    <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold whitespace-nowrap">
                                                        🔍 Submitted
                                                    </span>
                                                )}
                                                {milestone.status === 'approved' && (
                                                    <span className="inline-block px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold whitespace-nowrap">
                                                        ✓ Approved
                                                    </span>
                                                )}
                                                {milestone.status === 'paid' && (
                                                    <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold whitespace-nowrap">
                                                        ✓ Paid
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        {(milestone.status === 'submitted' || milestone.status === 'approved') && (
                                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                                {milestone.status === 'submitted' && (
                                                    <>
                                                        {milestone.proofUrl && (
                                                            <a
                                                                href={milestone.proofUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                                                            >
                                                                View Proof
                                                            </a>
                                                        )}
                                                        <motion.button
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => handleApproveMilestone(milestone.id)}
                                                            disabled={loading}
                                                            className="ml-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
                                                        >
                                                            {loading ? 'Approving...' : 'Approve'}
                                                        </motion.button>
                                                    </>
                                                )}
                                                
                                                {milestone.status === 'approved' && (
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleReleasePayment(milestone.id)}
                                                        disabled={loading}
                                                        className="ml-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
                                                    >
                                                        {loading ? 'Releasing...' : 'Release Payment'}
                                                    </motion.button>
                                                )}
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>

                            {/* Progress Summary */}
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="mt-8 bg-white rounded-xl p-6 border border-slate-200"
                            >
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Overall Progress</h3>
                                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-3">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(paidCount / totalMilestones) * 100}%` }}
                                        transition={{ duration: 1, ease: 'easeOut' }}
                                        className="h-full bg-indigo-600"
                                    />
                                </div>
                                <p className="text-sm text-slate-600">
                                    <span className="font-bold text-slate-900">{paidCount} of {totalMilestones}</span> milestones completed
                                    <span className="ml-2 font-semibold text-indigo-600">{Math.round((paidCount / totalMilestones) * 100)}%</span>
                                </p>
                            </motion.div>
                        </div>

                        {/* Right Column - Contract Details (1/3 width) */}
                        <div className="lg:col-span-1">
                            <motion.div
                                initial={{ opacity: 0, x: 16 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="sticky top-8 bg-white rounded-xl shadow-sm p-6 border border-slate-200"
                            >
                                <h3 className="text-lg font-bold text-slate-900 mb-6">Contract Details</h3>
                                
                                <div className="space-y-5">
                                    {/* Freelancer Address */}
                                    <div>
                                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Freelancer Address</p>
                                        <p className="text-slate-900 font-mono text-sm break-all bg-slate-50 p-2 rounded border border-slate-200">
                                            {job.freelancerAddress}
                                        </p>
                                    </div>

                                    {/* Client Address */}
                                    <div>
                                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Client Address</p>
                                        <p className="text-slate-900 font-mono text-sm break-all bg-slate-50 p-2 rounded border border-slate-200">
                                            {job.clientAddress}
                                        </p>
                                    </div>

                                    {/* Creation Date */}
                                    <div>
                                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Created</p>
                                        <p className="text-slate-900 font-medium">
                                            {new Date(job.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>

                                    {/* Status */}
                                    <div>
                                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Status</p>
                                        <div className="inline-block">
                                            {job.status === 'pending' && (
                                                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                                                    Pending
                                                </span>
                                            )}
                                            {job.status === 'in_progress' && (
                                                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                                                    In Progress
                                                </span>
                                            )}
                                            {job.status === 'completed' && (
                                                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
                                                    Completed
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
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
