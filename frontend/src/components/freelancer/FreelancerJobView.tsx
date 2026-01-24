import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../shared/Sidebar';
import { useWallet } from '../../hooks/useWallet';
import { getJobContract, submitProofContract } from '../../lib/contracts';
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
    assetType?: 'USDC' | 'XLM';
}

export default function FreelancerJobView() {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();
    const { address, connected, signTransaction } = useWallet();
    
    const [job, setJob] = useState<Job | null>(null);
    const [loadingJob, setLoadingJob] = useState(true);
    const [submittingProof, setSubmittingProof] = useState<number | null>(null);
    const [proofUrls, setProofUrls] = useState<Record<number, string>>({});
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });

    // Fetch job details on mount
    useEffect(() => {
        fetchJobDetails();
    }, [jobId]);

    const fetchJobDetails = async () => {
        if (!jobId) {
            setLoadingJob(false);
            return;
        }

        setLoadingJob(true);
        try {
            // First check if this job exists in localStorage (demo job)
            const storedJobs = localStorage.getItem('yieldra_jobs');
            const jobs = storedJobs ? JSON.parse(storedJobs) : [];
            const foundLocalJob = jobs.find((j: any) => j.id === jobId);
            
            if (foundLocalJob) {
                // Load from localStorage if found
                const milestoneAmounts = [
                    foundLocalJob.totalAmount * 0.3,
                    foundLocalJob.totalAmount * 0.4,
                    foundLocalJob.totalAmount * 0.3
                ];
                
                const milestones = Array.isArray(foundLocalJob.milestones) 
                    ? foundLocalJob.milestones 
                    : [
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
                            title: 'Testing & Deployment',
                            description: 'Testing, bug fixes, and final deployment',
                            amount: milestoneAmounts[2],
                            status: 'pending' as const
                        }
                    ];
                
                setJob({
                    ...foundLocalJob,
                    milestones
                });
                setLoadingJob(false);
                return;
            }

            // Try to fetch from contract if not found locally
            try {
                const result = await getJobContract(jobId);
                
                if (result.success && result.result) {
                    // Parse blockchain result
                    const jobData = parseJobFromContract(result.result);
                    setJob(jobData);
                    setLoadingJob(false);
                    return;
                }
            } catch (contractError) {
                console.log('Contract job not found, checked localStorage already');
            }
            
            showToast('Job not found', 'error');
        } catch (error: any) {
            console.error('Error fetching job:', error);
            showToast(error.message || 'Failed to fetch job details', 'error');
        } finally {
            setLoadingJob(false);
        }
    };

    // Parse job data from smart contract result
    const parseJobFromContract = (contractResult: any): Job => {
        // This would need to match your actual contract's return structure
        // Parse the ScVal result from the contract
        try {
            // Example parsing - adjust based on your actual contract structure
            console.log('Contract result:', contractResult);
            
            // For now, returning a basic structure until we have the actual contract response format
            return {
                id: jobId || '',
                title: 'Job from Contract',
                description: 'Job details fetched from blockchain',
                totalAmount: 1000,
                milestones: [],
                status: 'in_progress',
                freelancerAddress: contractResult.freelancer || '',
                clientAddress: contractResult.client || '',
                createdAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error parsing contract result:', error);
            throw error;
        }
    };

    // Handle proof submission
    const handleSubmitProof = async (milestoneId: number) => {
        if (!connected) {
            showToast('Please connect your wallet first', 'error');
            return;
        }

        if (!job) {
            showToast('Job data not loaded', 'error');
            return;
        }

        const proofUrl = proofUrls[milestoneId];
        if (!proofUrl || proofUrl.trim() === '') {
            showToast('Please enter a proof URL', 'error');
            return;
        }

        // Validate URL format
        try {
            new URL(proofUrl);
        } catch {
            showToast('Please enter a valid URL', 'error');
            return;
        }

        setSubmittingProof(milestoneId);

        try {
            // Check if this is a demo job (from localStorage)
            const storedJobs = localStorage.getItem('yieldra_jobs');
            const jobs = storedJobs ? JSON.parse(storedJobs) : [];
            const isDemoJob = jobs.some((j: any) => j.id === job.id);
            
            if (isDemoJob) {
                // This is a demo/localStorage job - save locally without contract call
                setJob(prevJob => {
                    if (!prevJob) return null;
                    return {
                        ...prevJob,
                        milestones: prevJob.milestones.map(m =>
                            m.id === milestoneId
                                ? { ...m, status: 'submitted', proofUrl, submittedAt: new Date().toISOString() }
                                : m
                        )
                    };
                });

                // Update localStorage
                const updatedJobs = jobs.map((j: any) => {
                    if (j.id === job.id) {
                        // Generate milestones if they don't exist or aren't an array
                        const milestonesToUpdate = Array.isArray(j.milestones) 
                            ? j.milestones 
                            : [
                                {
                                    id: 1,
                                    title: 'Initial Setup & Planning',
                                    description: 'Project setup, requirements gathering, and initial planning',
                                    amount: j.totalAmount * 0.3,
                                    status: 'pending' as const
                                },
                                {
                                    id: 2,
                                    title: 'Core Development',
                                    description: 'Main implementation and development work',
                                    amount: j.totalAmount * 0.4,
                                    status: 'pending' as const
                                },
                                {
                                    id: 3,
                                    title: 'Testing & Deployment',
                                    description: 'Testing, bug fixes, and final deployment',
                                    amount: j.totalAmount * 0.3,
                                    status: 'pending' as const
                                }
                            ];

                        return {
                            ...j,
                            milestones: milestonesToUpdate.map((m: any) =>
                                m.id === milestoneId
                                    ? { ...m, status: 'submitted', proofUrl, submittedAt: new Date().toISOString() }
                                    : m
                            )
                        };
                    }
                    return j;
                });
                localStorage.setItem('yieldra_jobs', JSON.stringify(updatedJobs));
                
                setProofUrls(prev => ({ ...prev, [milestoneId]: '' }));
                showToast(
                    '✅ Proof saved! In production, jobs created through the app would be stored on-chain and this would be submitted to the smart contract.',
                    'success'
                );
                setSubmittingProof(null);
                return;
            }

            // For contract jobs, call smart contract
            const result = await submitProofContract(
                address,
                job.id,
                milestoneId,
                proofUrl,
                signTransaction
            );

            if (result.success) {
                showToast('✅ Proof submitted successfully to smart contract!', 'success');
                
                // Update local state
                setJob(prevJob => {
                    if (!prevJob) return null;
                    return {
                        ...prevJob,
                        milestones: prevJob.milestones.map(m =>
                            m.id === milestoneId
                                ? { ...m, status: 'submitted', proofUrl, submittedAt: new Date().toISOString() }
                                : m
                        )
                    };
                });

                setProofUrls(prev => ({ ...prev, [milestoneId]: '' }));
                await fetchJobDetails();
            } else {
                // If contract call fails, check if we should fall back to demo mode
                if (result.error?.includes('UnreachableCodeReached') || result.error?.includes('InvalidAction')) {
                    // Job not found on contract - treat as demo job
                    setJob(prevJob => {
                        if (!prevJob) return null;
                        return {
                            ...prevJob,
                            milestones: prevJob.milestones.map(m =>
                                m.id === milestoneId
                                    ? { ...m, status: 'submitted', proofUrl, submittedAt: new Date().toISOString() }
                                    : m
                            )
                        };
                    });

                    setProofUrls(prev => ({ ...prev, [milestoneId]: '' }));
                    showToast(
                        '✅ Proof saved in demo mode! This job will need to be created on-chain for smart contract submission.',
                        'success'
                    );
                } else {
                    showToast(result.error || 'Failed to submit proof', 'error');
                }
            }
        } catch (error: any) {
            console.error('Error submitting proof:', error);
            showToast(error.message || 'Failed to submit proof', 'error');
        } finally {
            setSubmittingProof(null);
        }
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ show: true, message, type });
    };

    const isFreelancer = connected && job && address.toLowerCase() === job.freelancerAddress.toLowerCase();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
            case 'submitted': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
            case 'approved': return 'text-green-400 bg-green-400/10 border-green-400/30';
            case 'paid': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
            default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending': return '⏳ Pending';
            case 'submitted': return '📝 Submitted';
            case 'approved': return '✅ Approved';
            case 'paid': return '💰 Paid';
            default: return status;
        }
    };

    if (loadingJob) {
        return (
            <div className="flex min-h-screen bg-slate-50">
                <Sidebar userType="freelancer" />
                <div className="flex-1 flex items-center justify-center">
                    <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-center"
                    >
                        <div className="inline-block w-12 h-12 border-3 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-600 font-medium">Loading job details...</p>
                    </motion.div>
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="flex min-h-screen bg-slate-50">
                <Sidebar userType="freelancer" />
                <div className="flex-1 flex items-center justify-center p-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-md"
                    >
                        <div className="text-6xl mb-6">📋</div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-3">Job Not Found</h2>
                        <p className="text-slate-600 mb-8">The job you're looking for doesn't exist.</p>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/freelancer')}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                            ← Back to Dashboard
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar userType="freelancer" />

            <div className="flex-1 flex flex-col">
                {/* Header Section */}
                <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                    <div className="max-w-6xl mx-auto px-8 py-6">
                        <motion.button
                            whileHover={{ x: -4 }}
                            onClick={() => navigate('/freelancer')}
                            className="text-indigo-600 hover:text-indigo-700 mb-4 flex items-center gap-2 font-medium transition-colors"
                        >
                            ← Back to Dashboard
                        </motion.button>
                        <h1 className="text-4xl font-bold text-slate-900 mb-2">{job.title}</h1>
                        <p className="text-slate-600 text-lg">{job.description}</p>
                    </div>
                </div>

                {/* Job Info Card */}
                <div className="max-w-6xl mx-auto px-8 py-8 w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-indigo-50 to-slate-50 rounded-2xl p-8 border border-slate-200 mb-8"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div>
                                <p className="text-sm text-slate-600 font-semibold mb-2">Total Contract Value</p>
                                <p className="text-3xl font-bold text-indigo-600">
                                    ${job.totalAmount.toLocaleString()} <span className="text-sm text-slate-500 font-normal">{job.assetType || 'USDC'}</span>
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-600 font-semibold mb-2">Hiring Client</p>
                                <p className="text-slate-900 font-mono text-sm font-semibold">
                                    {job.clientAddress.slice(0, 8)}...{job.clientAddress.slice(-8)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-600 font-semibold mb-2">Contract Status</p>
                                <span className="inline-block px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold">
                                    {job.status.replace('_', ' ')}
                                </span>
                            </div>
                        </div>

                        {!isFreelancer && connected && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl"
                            >
                                <p className="text-amber-800 text-sm font-medium">
                                    ⚠️ You are not the assigned freelancer for this contract.
                                </p>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Milestones Section */}
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Milestone Payments</h2>
                    
                    <div className="space-y-4">
                        {job.milestones && Array.isArray(job.milestones) && job.milestones.map((milestone, index) => (
                            <motion.div
                                key={milestone.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.08 }}
                                whileHover={{ boxShadow: milestone.status !== 'paid' ? '0 10px 25px rgba(0, 0, 0, 0.08)' : undefined }}
                                className="bg-white rounded-2xl p-6 border border-slate-100 transition-all duration-200 hover:border-slate-200 relative"
                            >
                                {/* Status Badge */}
                                <div className="absolute top-6 right-6">
                                    {milestone.status === 'pending' && (
                                        <span className="inline-block px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-semibold">
                                            Pending
                                        </span>
                                    )}
                                    {milestone.status === 'submitted' && (
                                        <span className="inline-block px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold">
                                            📤 Submitted
                                        </span>
                                    )}
                                    {milestone.status === 'approved' && (
                                        <span className="inline-block px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-semibold">
                                            ✓ Approved
                                        </span>
                                    )}
                                    {milestone.status === 'paid' && (
                                        <span className="inline-block px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-semibold">
                                            ✨ Paid
                                        </span>
                                    )}
                                </div>

                                <div className="pr-40">
                                    {/* Milestone Header */}
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-bold flex-shrink-0">
                                            {milestone.id}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-slate-900 mb-1">{milestone.title}</h3>
                                            <p className="text-slate-600">{milestone.description}</p>
                                        </div>
                                    </div>

                                    {/* Amount */}
                                    <div className="mb-6 pt-4 border-t border-slate-100">
                                        <p className="text-sm text-slate-500 font-semibold mb-1">Milestone Amount</p>
                                        <p className="text-2xl font-bold text-indigo-600">${milestone.amount.toFixed(2)}</p>
                                    </div>

                                    {/* Proof of Work Display */}
                                    {milestone.proofUrl && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl"
                                        >
                                            <p className="text-sm text-blue-900 font-semibold mb-2">📄 Proof of Work Submitted</p>
                                            <a
                                                href={milestone.proofUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-indigo-600 hover:text-indigo-700 font-medium break-all underline transition-colors"
                                            >
                                                {milestone.proofUrl}
                                            </a>
                                            {milestone.submittedAt && (
                                                <p className="text-xs text-slate-600 mt-3">
                                                    Submitted {new Date(milestone.submittedAt).toLocaleDateString()} at {new Date(milestone.submittedAt).toLocaleTimeString()}
                                                </p>
                                            )}
                                        </motion.div>
                                    )}

                                    {/* Proof Submission Form */}
                                    {isFreelancer && milestone.status === 'pending' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-4 p-6 bg-indigo-50 border border-indigo-200 rounded-xl"
                                        >
                                            <div>
                                                <label className="block text-sm font-bold text-slate-900 mb-3">
                                                    📤 Send Proof of Work
                                                </label>
                                                <p className="text-xs text-slate-600 mb-4">Share a link to your completed work (GitHub, Google Drive, portfolio, etc.)</p>
                                                <input
                                                    type="url"
                                                    placeholder="https://github.com/... or https://drive.google.com/..."
                                                    value={proofUrls[milestone.id] || ''}
                                                    onChange={(e) => setProofUrls(prev => ({
                                                        ...prev,
                                                        [milestone.id]: e.target.value
                                                    }))}
                                                    disabled={submittingProof === milestone.id}
                                                    className="w-full px-4 py-3 bg-white border-2 border-indigo-200 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 disabled:opacity-50 transition-all duration-200"
                                                />
                                            </div>
                                            <motion.button
                                                whileHover={submittingProof === milestone.id ? {} : { scale: 1.02 }}
                                                whileTap={submittingProof === milestone.id ? {} : { scale: 0.95 }}
                                                onClick={() => handleSubmitProof(milestone.id)}
                                                disabled={submittingProof === milestone.id}
                                                className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-full font-semibold transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {submittingProof === milestone.id ? (
                                                    <>
                                                        <motion.div
                                                            animate={{ rotate: 360 }}
                                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                                        />
                                                        Submitting...
                                                    </>
                                                ) : (
                                                    <>Send Proof</>
                                                )}
                                            </motion.button>
                                        </motion.div>
                                    )}

                                    {/* Status Messages */}
                                    {isFreelancer && milestone.status === 'submitted' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-4 bg-blue-50 border border-blue-200 rounded-xl"
                                        >
                                            <p className="text-blue-700 text-sm font-medium">
                                                🔍 Your proof is under review. The client will approve or request changes soon.
                                            </p>
                                        </motion.div>
                                    )}

                                    {milestone.status === 'approved' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-4 bg-amber-50 border border-amber-200 rounded-xl"
                                        >
                                            <p className="text-amber-700 text-sm font-medium">
                                                ✓ Approved! Waiting for the client to release payment...
                                            </p>
                                        </motion.div>
                                    )}

                                    {milestone.status === 'paid' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl"
                                        >
                                            <p className="text-emerald-700 text-sm font-bold flex items-center gap-2">
                                                ✨ Payment received! Congratulations on completing this milestone.
                                            </p>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                        
                        {(!job.milestones || !Array.isArray(job.milestones) || job.milestones.length === 0) && (
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-12 bg-slate-50 rounded-2xl border border-slate-200 text-center"
                            >
                                <div className="text-5xl mb-4">📋</div>
                                <p className="text-slate-600 font-medium">No milestones found for this contract.</p>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* Toast Notification */}
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
