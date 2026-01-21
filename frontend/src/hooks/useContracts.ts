import { useState } from 'react';
import {
    createJobContract,
    submitProofContract,
    approveMilestoneContract,
    releasePaymentContract,
    getJobContract,
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

            return {
                success: true,
                jobId: result.txHash, // Use tx hash as job ID for now
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

            const result = await approveMilestoneContract(
                address,
                jobId,
                milestoneId,
                signTransaction
            );

            if (!result.success) {
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

            const result = await releasePaymentContract(
                address,
                jobId,
                milestoneId,
                signTransaction
            );

            if (!result.success) {
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
