import { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useContracts } from '../hooks/useContracts';

interface JobCreationModalProps {
    onClose: () => void;
}

export default function JobCreationModal({ onClose }: JobCreationModalProps) {
    const [jobTitle, setJobTitle] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [freelancerAddress, setFreelancerAddress] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [milestones, setMilestones] = useState(3);
    const [category, setCategory] = useState('Development');
    const [duration, setDuration] = useState('1-3 months');

    const { address, connected } = useWallet();
    const { createJob, loading, error } = useContracts();

    useEffect(() => {
        console.log('JobCreationModal - Wallet State:', { address, connected });
    }, [address, connected]);

    const handleSubmit = async () => {
        if (!connected || !address) {
            alert('Please connect your wallet first');
            return;
        }

        if (!jobTitle || !jobDescription || !freelancerAddress || !totalAmount) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            const result = await createJob(
                freelancerAddress,
                parseFloat(totalAmount),
                milestones,
                'USDC'  // Changed to USDC for better stability
            );

            if (result.success) {
                // Save job to localStorage for demo purposes
                const newJob = {
                    id: result.txHash || `job-${Date.now()}`,
                    title: jobTitle,
                    description: jobDescription,
                    totalAmount: parseFloat(totalAmount),
                    milestones: milestones,
                    status: 'pending' as const,
                    freelancerAddress: freelancerAddress,
                    clientAddress: address,
                    createdAt: new Date().toISOString(),
                    txHash: result.txHash,
                    category: category,
                    duration: duration
                };

                // Store in localStorage
                const existingJobs = localStorage.getItem('yieldra_jobs');
                const jobs = existingJobs ? JSON.parse(existingJobs) : [];
                jobs.push(newJob);
                localStorage.setItem('yieldra_jobs', JSON.stringify(jobs));

                console.log('🔍 Debug: Job saved:', newJob);
                console.log('🔍 Debug: Total jobs:', jobs.length);

                alert(`Job created successfully! Transaction: ${result.txHash}`);
                onClose();
                
                // Refresh the jobs list by dispatching a custom event
                window.dispatchEvent(new CustomEvent('jobCreated', { detail: { job: newJob } }));
            } else {
                alert(`Failed to create job: ${result.error}`);
            }
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New  Job</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* Form */}
                <div className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-600 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Job Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Job Title *
                        </label>
                        <input
                            type="text"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            placeholder="e.g., Build a Smart Contract for DeFi Protocol"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                            disabled={loading}
                        />
                    </div>

                    {/* Category & Duration */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Category
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                disabled={loading}
                            >
                                <option>Development</option>
                                <option>Design</option>
                                <option>Writing</option>
                                <option>Marketing</option>
                                <option>Admin Support</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Duration
                            </label>
                            <select
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                disabled={loading}
                            >
                                <option>Less than 1 month</option>
                                <option>1-3 months</option>
                                <option>3-6 months</option>
                                <option>More than 6 months</option>
                            </select>
                        </div>
                    </div>

                    {/* Job Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Job Description *
                        </label>
                        <textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Describe what you need done, required skills, deliverables, etc."
                            rows={5}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white resize-none"
                            disabled={loading}
                        />
                    </div>

                    {/* Freelancer Address */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Freelancer Stellar Address *
                        </label>
                        <input
                            type="text"
                            value={freelancerAddress}
                            onChange={(e) => setFreelancerAddress(e.target.value)}
                            placeholder="G..."
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white font-mono text-sm"
                            disabled={loading}
                        />
                    </div>

                    {/* Budget & Milestones */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Total Budget (USDC) *
                            </label>
                            <input
                                type="number"
                                value={totalAmount}
                                onChange={(e) => setTotalAmount(e.target.value)}
                                placeholder="100"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Milestones
                            </label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => setMilestones(num)}
                                        disabled={loading}
                                        className={`flex-1 py-3 rounded-lg font-medium transition-colors ${milestones === num
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 py-3 px-6 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !connected}
                            className="flex-1 py-3 px-6 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating Job...' : connected ? 'Create Job & Lock Funds' : 'Connect Wallet First'}
                        </button>
                    </div>

                    {!connected && (
                        <p className="text-sm text-center text-gray-500">
                            Please connect your wallet to create a job
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
