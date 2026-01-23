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
            // Try to fetch from blockchain first
            const result = await getJobContract(jobId);
            
            if (result.success && result.result) {
                // Parse blockchain result
                const jobData = parseJobFromContract(result.result);
                setJob(jobData);
            } else {
                // Fallback to localStorage for demo purposes
                const storedJobs = localStorage.getItem('yieldra_jobs');
                const jobs = storedJobs ? JSON.parse(storedJobs) : [];
                
                const foundJob = jobs.find((j: any) => j.id === jobId);
                
                if (foundJob) {
                    // Generate milestones if not present or not an array
                    const milestoneAmounts = [
                        foundJob.totalAmount * 0.3,  // 30%
                        foundJob.totalAmount * 0.4,  // 40%
                        foundJob.totalAmount * 0.3   // 30%
                    ];
                    
                    // Check if milestones is an array, otherwise generate default milestones
                    const milestones = Array.isArray(foundJob.milestones) 
                        ? foundJob.milestones 
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
                    
                    const jobWithMilestones = {
                        ...foundJob,
                        milestones
                    };
                    
                    setJob(jobWithMilestones);
                } else {
                    showToast('Job not found', 'error');
                }
            }
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
            // Call smart contract to submit proof
            const result = await submitProofContract(
                address,
                job.id,
                milestoneId,
                proofUrl,
                signTransaction
            );

            if (result.success) {
                showToast('Proof submitted successfully!', 'success');
                
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

                // Update localStorage
                const storedJobs = localStorage.getItem('yieldra_jobs');
                const jobs = storedJobs ? JSON.parse(storedJobs) : [];
                const updatedJobs = jobs.map((j: any) => {
                    if (j.id === job.id) {
                        return {
                            ...j,
                            milestones: j.milestones.map((m: any) =>
                                m.id === milestoneId
                                    ? { ...m, status: 'submitted', proofUrl, submittedAt: new Date().toISOString() }
                                    : m
                            )
                        };
                    }
                    return j;
                });
                localStorage.setItem('yieldra_jobs', JSON.stringify(updatedJobs));

                // Clear input
                setProofUrls(prev => ({ ...prev, [milestoneId]: '' }));

                // Optionally refresh job data from blockchain
                await fetchJobDetails();
            } else {
                showToast(result.error || 'Failed to submit proof', 'error');
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
            <div className="flex min-h-screen bg-[#090C10]">
                <Sidebar userType="freelancer" />
                <div className="flex-1 ml-64 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-500 mx-auto mb-4"></div>
                        <p className="text-[#94A3B8]">Loading job details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="flex min-h-screen bg-[#090C10]">
                <Sidebar userType="freelancer" />
                <div className="flex-1 ml-64 flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        <div className="text-6xl mb-4">❌</div>
                        <h2 className="text-2xl font-bold text-white mb-4">Job Not Found</h2>
                        <p className="text-[#94A3B8] mb-8">The job you're looking for doesn't exist.</p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/freelancer')}
                            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg font-semibold"
                        >
                            ← Back to Dashboard
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#090C10]">
            <Sidebar userType="freelancer" />

            <div className="flex-1 ml-64 p-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <button
                        onClick={() => navigate('/freelancer')}
                        className="text-[#94A3B8] hover:text-teal-400 mb-4 flex items-center gap-2 transition-colors"
                    >
                        <span>←</span> Back to Dashboard
                    </button>
                    <h1 className="text-4xl font-bold text-white mb-2">{job.title}</h1>
                    <p className="text-[#94A3B8]">{job.description}</p>
                </motion.div>

                {/* Job Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-xl p-6 border border-white/10 mb-8"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-[#94A3B8] text-sm mb-1">Total Amount</p>
                            <p className="text-2xl font-bold text-white">
                                ${job.totalAmount.toLocaleString()} <span className="text-lg text-[#94A3B8]">{job.assetType || 'USDC'}</span>
                            </p>
                        </div>
                        <div>
                            <p className="text-[#94A3B8] text-sm mb-1">Client</p>
                            <p className="text-white font-mono text-sm">
                                {job.clientAddress.slice(0, 8)}...{job.clientAddress.slice(-8)}
                            </p>
                        </div>
                        <div>
                            <p className="text-[#94A3B8] text-sm mb-1">Status</p>
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(job.status)}`}>
                                {job.status.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>
                    </div>

                    {!isFreelancer && connected && (
                        <div className="mt-6 p-4 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
                            <p className="text-yellow-400 text-sm">
                                ⚠️ You are not the assigned freelancer for this job.
                            </p>
                        </div>
                    )}
                </motion.div>

                {/* Milestones */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h2 className="text-2xl font-bold text-white mb-6">Milestones</h2>
                    
                    <div className="space-y-4">
                        {job.milestones && Array.isArray(job.milestones) && job.milestones.map((milestone, index) => (
                            <motion.div
                                key={milestone.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + index * 0.1 }}
                                className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-xl p-6 border border-white/10"
                            >
                                {/* Milestone Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 font-bold">
                                                {milestone.id}
                                            </span>
                                            <h3 className="text-xl font-bold text-white">{milestone.title}</h3>
                                        </div>
                                        <p className="text-[#94A3B8] ml-11">{milestone.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-white">
                                            ${milestone.amount.toFixed(2)}
                                        </p>
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border mt-2 ${getStatusColor(milestone.status)}`}>
                                            {getStatusText(milestone.status)}
                                        </span>
                                    </div>
                                </div>

                                {/* Proof URL if submitted */}
                                {milestone.proofUrl && (
                                    <div className="ml-11 mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                        <p className="text-sm text-[#94A3B8] mb-1">Proof of Work:</p>
                                        <a
                                            href={milestone.proofUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300 text-sm break-all underline"
                                        >
                                            {milestone.proofUrl}
                                        </a>
                                        {milestone.submittedAt && (
                                            <p className="text-xs text-[#94A3B8] mt-2">
                                                Submitted: {new Date(milestone.submittedAt).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Submission Form - Only show if user is freelancer and milestone is pending */}
                                {isFreelancer && milestone.status === 'pending' && (
                                    <div className="ml-11 mt-4 p-4 bg-teal-500/10 border border-teal-500/30 rounded-lg">
                                        <label className="block text-sm font-semibold text-white mb-2">
                                            Submit Proof of Work
                                        </label>
                                        <div className="flex gap-3">
                                            <input
                                                type="url"
                                                placeholder="https://github.com/... or https://drive.google.com/..."
                                                value={proofUrls[milestone.id] || ''}
                                                onChange={(e) => setProofUrls(prev => ({
                                                    ...prev,
                                                    [milestone.id]: e.target.value
                                                }))}
                                                disabled={submittingProof === milestone.id}
                                                className="flex-1 px-4 py-2 bg-[#0F172A] border border-white/10 rounded-lg text-white placeholder-[#94A3B8] focus:outline-none focus:border-teal-500 disabled:opacity-50"
                                            />
                                            <motion.button
                                                whileHover={submittingProof === milestone.id ? {} : { scale: 1.05 }}
                                                whileTap={submittingProof === milestone.id ? {} : { scale: 0.95 }}
                                                onClick={() => handleSubmitProof(milestone.id)}
                                                disabled={submittingProof === milestone.id}
                                                className="px-6 py-2 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-teal-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                {submittingProof === milestone.id ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                        Submitting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>📤</span> Submit Proof
                                                    </>
                                                )}
                                            </motion.button>
                                        </div>
                                        <p className="text-xs text-[#94A3B8] mt-2">
                                            💡 Provide a link to your completed work (GitHub repo, Google Drive, etc.)
                                        </p>
                                    </div>
                                )}

                                {/* Show waiting message for submitted milestones */}
                                {isFreelancer && milestone.status === 'submitted' && (
                                    <div className="ml-11 mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                        <p className="text-blue-400 text-sm">
                                            ⏳ Waiting for client approval...
                                        </p>
                                    </div>
                                )}

                                {/* Show approved message */}
                                {milestone.status === 'approved' && (
                                    <div className="ml-11 mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                                        <p className="text-green-400 text-sm">
                                            ✅ Approved! Waiting for payment release...
                                        </p>
                                    </div>
                                )}

                                {/* Show paid message */}
                                {milestone.status === 'paid' && (
                                    <div className="ml-11 mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                                        <p className="text-emerald-400 text-sm">
                                            💰 Payment received!
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                        
                        {(!job.milestones || !Array.isArray(job.milestones) || job.milestones.length === 0) && (
                            <div className="p-8 bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-xl border border-white/10 text-center">
                                <p className="text-[#94A3B8]">No milestones found for this job.</p>
                            </div>
                        )}
                    </div>
                </motion.div>
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
