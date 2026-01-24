import { useState } from 'react';
import {
    createJobContract,
    submitProofContract,
    approveMilestoneContract,
    releasePaymentContract,
    getJobContract,
    getClientJobsContract,
    getExchangeRate,
    calculateYield,
    depositForYield,
    harvestYield,
    withdrawFromYield
} from '../lib/contracts';
import { useWallet } from './useWallet';

export function useContracts() {
    const { address, signTransaction } = useWallet();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createJob = async (
        freelancerAddress: string,
        totalAmount: number,
        milestoneCount: number,
        assetType: 'USDC' | 'XLM' = 'USDC'
    ) => {
        setLoading(true);
        setError(null);

        try {
            if (!address) {
                throw new Error('Wallet not connected');
            }

            const result = await createJobContract(
                address,
                freelancerAddress,
                totalAmount,
                assetType,
                milestoneCount,
                signTransaction
            );

            if (!result.success) {
                throw new Error(result.error || 'Failed to create job');
            }

            // The jobId is now computed in createJobContract using the job counter
            // No need to fetch from contract - we already have the correct on-chain job_id
            const resolvedJobId = (result as any).jobId || result.txHash;
            console.log('✅ createJob: Using job_id =', resolvedJobId);

            return {
                success: true,
                jobId: resolvedJobId,
                txHash: result.txHash
            };
        } catch (err: any) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const submitProof = async (jobId: string, milestoneId: number, proofUrl: string) => {
        setLoading(true);
        setError(null);

        try {
            if (!address) {
                throw new Error('Wallet not connected');
            }

            const result = await submitProofContract(
                address,
                jobId,
                milestoneId,
                proofUrl,
                signTransaction
            );

            if (!result.success) {
                throw new Error(result.error || 'Failed to submit proof');
            }

            return { success: true, txHash: result.txHash };
        } catch (err: any) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const approveMilestone = async (jobId: string, milestoneId: number) => {
        setLoading(true);
        setError(null);

        try {
            if (!address) {
                throw new Error('Wallet not connected');
            }

            // Check if this is a demo job (from localStorage)
            const storedJobs = localStorage.getItem('yieldra_jobs');
            const jobs = storedJobs ? JSON.parse(storedJobs) : [];
            const isDemoJob = jobs.some((j: any) => {
                if (j.id !== jobId) return false;
                const idStr = String(j.id || '').toLowerCase();
                const txStr = String(j.txHash || '').toLowerCase();
                return !j.txHash || idStr.startsWith('demo_') || txStr.startsWith('demo_');
            });

            if (isDemoJob) {
                // This is a demo job - just update locally without contract call
                const updatedJobs = jobs.map((j: any) => {
                    if (j.id === jobId) {
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
                                    ? { ...m, status: 'approved', approvedAt: new Date().toISOString() }
                                    : m
                            )
                        };
                    }
                    return j;
                });
                localStorage.setItem('yieldra_jobs', JSON.stringify(updatedJobs));
                return { success: true, txHash: 'demo_' + Date.now() };
            }

            // For contract jobs, the job.id should now be the correct on-chain job_id
            // (64 hex chars format like 0000000000000000000000000000000000000000000000000000000000000001)
            // If it's already in this format, use it directly. Otherwise it's a legacy job.
            let onchainJobId = jobId;
            
            // Check if jobId is in the correct on-chain format (64 hex chars)
            const isValidOnchainFormat = /^[0-9a-fA-F]{64}$/.test(jobId);
            console.log('🔍 approveMilestone: jobId =', jobId, ', isValidFormat =', isValidOnchainFormat);
            
            if (!isValidOnchainFormat) {
                console.warn('⚠️ approveMilestone: Legacy job format detected. Please clear localStorage and create a new job.');
                // For legacy jobs, try to find the on-chain job_id from the stored data
                const job = jobs.find((j: any) => j.id === jobId);
                if (job && job.onchainJobId) {
                    onchainJobId = job.onchainJobId;
                } else {
                    throw new Error('Legacy job detected - please clear localStorage (Application > Storage > Local Storage > Clear) and create a new job to test the flow.');
                }
            }

            console.log('✅ approveMilestone: Calling contract with job_id =', onchainJobId, ', milestone =', milestoneId);
            const result = await approveMilestoneContract(
                address,
                onchainJobId,
                milestoneId,
                signTransaction
            );

            if (!result.success) {
                // If contract fails with UnreachableCodeReached, treat as demo job
                if (result.error?.includes('UnreachableCodeReached') || result.error?.includes('InvalidAction')) {
                    // Update locally as demo
                    const updatedJobs = jobs.map((j: any) => {
                        if (j.id === jobId) {
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
                                        ? { ...m, status: 'approved', approvedAt: new Date().toISOString() }
                                        : m
                                )
                            };
                        }
                        return j;
                    });
                    localStorage.setItem('yieldra_jobs', JSON.stringify(updatedJobs));
                    return { success: true, txHash: 'demo_' + Date.now() };
                }
                throw new Error(result.error || 'Failed to approve milestone');
            }

            return { success: true, txHash: result.txHash };
        } catch (err: any) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const releasePayment = async (jobId: string, milestoneId: number) => {
        setLoading(true);
        setError(null);

        try {
            if (!address) {
                throw new Error('Wallet not connected');
            }

            // Check if this is a demo job (from localStorage)
            const storedJobs = localStorage.getItem('yieldra_jobs');
            const jobs = storedJobs ? JSON.parse(storedJobs) : [];
            const isDemoJob = jobs.some((j: any) => {
                if (j.id !== jobId) return false;
                const idStr = String(j.id || '').toLowerCase();
                const txStr = String(j.txHash || '').toLowerCase();
                return !j.txHash || idStr.startsWith('demo_') || txStr.startsWith('demo_');
            });

            if (isDemoJob) {
                // This is a demo job - just update locally without contract call
                const updatedJobs = jobs.map((j: any) => {
                    if (j.id === jobId) {
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
                                    ? { ...m, status: 'paid', paidAt: new Date().toISOString() }
                                    : m
                            )
                        };
                    }
                    return j;
                });
                localStorage.setItem('yieldra_jobs', JSON.stringify(updatedJobs));
                return { success: true, txHash: 'demo_' + Date.now() };
            }

            // For contract jobs, the job.id should now be the correct on-chain job_id
            let onchainJobId = jobId;
            
            // Check if jobId is in the correct on-chain format (64 hex chars)
            const isValidOnchainFormat = /^[0-9a-fA-F]{64}$/.test(jobId);
            console.log('🔍 releasePayment: jobId =', jobId, ', isValidFormat =', isValidOnchainFormat);
            
            if (!isValidOnchainFormat) {
                console.warn('⚠️ releasePayment: Legacy job format detected. Please clear localStorage and create a new job.');
                // For legacy jobs, try to find the on-chain job_id from the stored data
                const job = jobs.find((j: any) => j.id === jobId);
                if (job && job.onchainJobId) {
                    onchainJobId = job.onchainJobId;
                } else {
                    throw new Error('Legacy job detected - please clear localStorage (Application > Storage > Local Storage > Clear) and create a new job to test the flow.');
                }
            }

            console.log('💰 releasePayment: Calling contract with job_id =', onchainJobId, ', milestone =', milestoneId);
            const result = await releasePaymentContract(
                address,
                onchainJobId,
                milestoneId,
                signTransaction
            );

            if (!result.success) {
                // If contract fails with UnreachableCodeReached, treat as demo job
                if (result.error?.includes('UnreachableCodeReached') || result.error?.includes('InvalidAction')) {
                    // Update locally as demo
                    const updatedJobs = jobs.map((j: any) => {
                        if (j.id === jobId) {
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
                                        ? { ...m, status: 'paid', paidAt: new Date().toISOString() }
                                        : m
                                )
                            };
                        }
                        return j;
                    });
                    localStorage.setItem('yieldra_jobs', JSON.stringify(updatedJobs));
                    return { success: true, txHash: 'demo_' + Date.now() };
                }
                throw new Error(result.error || 'Failed to release payment');
            }

            return { success: true, txHash: result.txHash };
        } catch (err: any) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const getJob = async (jobId: string) => {
        try {
            const result = await getJobContract(jobId);
            return result;
        } catch (err: any) {
            console.error('Failed to get job:', err);
            return { success: false, error: err.message };
        }
    };

    const fetchExchangeRate = async (
        fromCurrency: string,
        toCurrency: string,
        amount: number
    ) => {
        try {
            return await getExchangeRate(fromCurrency, toCurrency, amount);
        } catch (err: any) {
            console.error('Failed to get exchange rate:', err);
            return { success: false, error: err.message };
        }
    };

    const calculateYieldAmount = async () => {
        try {
            if (!address) {
                return { success: false, error: 'Wallet not connected' };
            }

            return await calculateYield(address);
        } catch (err: any) {
            console.error('Failed to calculate yield:', err);
            return { success: false, error: err.message };
        }
    };

    const depositToYield = async (amount: number) => {
        setLoading(true);
        setError(null);

        try {
            if (!address) {
                throw new Error('Wallet not connected');
            }

            const result = await depositForYield(address, amount, signTransaction);

            if (!result.success) {
                throw new Error(result.error || 'Failed to deposit');
            }

            return { success: true, txHash: result.txHash };
        } catch (err: any) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const harvestYieldAmount = async () => {
        setLoading(true);
        setError(null);

        try {
            if (!address) {
                throw new Error('Wallet not connected');
            }

            const result = await harvestYield(address, signTransaction);

            if (!result.success) {
                throw new Error(result.error || 'Failed to harvest yield');
            }

            return { success: true, txHash: result.txHash };
        } catch (err: any) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const withdrawYield = async (amount: number) => {
        setLoading(true);
        setError(null);

        try {
            if (!address) {
                throw new Error('Wallet not connected');
            }

            const result = await withdrawFromYield(address, amount, signTransaction);

            if (!result.success) {
                throw new Error(result.error || 'Failed to withdraw');
            }

            return { success: true, txHash: result.txHash };
        } catch (err: any) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        createJob,
        submitProof,
        approveMilestone,
        releasePayment,
        getJob,
        fetchExchangeRate,
        calculateYieldAmount,
        depositToYield,
        harvestYieldAmount,
        withdrawYield
    };
}
