import { useState } from 'react';
import { invokeContract, CONTRACT_IDS, toScVal } from '../lib/stellar';
import { xdr } from '@stellar/stellar-sdk';

// Hook for interacting with Soroban smart contracts
export function useContracts() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createJob = async (
        clientAddress: string,
        freelancerAddress: string,
        totalAmount: number,
        assetAddress: string,
        milestones: number
    ) => {
        setLoading(true);
        setError(null);

        try {
            // Convert parameters to ScVal
            const params = [
                toScVal.address(clientAddress),
                toScVal.address(freelancerAddress),
                toScVal.i128(BigInt(totalAmount * 10_000_000)), // Convert to stroops
                toScVal.address(assetAddress),
                toScVal.u32(milestones),
            ];

            // Invoke contract
            const result = await invokeContract(
                clientAddress,
                CONTRACT_IDS.ESCROW_CORE,
                'create_job',
                params
            );

            console.log('Job created successfully:', result);
            return { success: true, hash: result.hash };
        } catch (err: any) {
            const errorMsg = err.message || 'Failed to create job';
            console.error('Failed to create job:', err);
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    };

    const submitProof = async (
        freelancerAddress: string,
        jobId: string,
        milestoneId: number,
        proofUrl: string
    ) => {
        setLoading(true);
        setError(null);

        try {
            // Convert job_id string to BytesN<32>
            const jobIdBytes = Buffer.from(jobId, 'hex');

            const params = [
                xdr.ScVal.scvBytes(jobIdBytes),
                toScVal.u32(milestoneId),
                toScVal.string(proofUrl),
            ];

            const result = await invokeContract(
                freelancerAddress,
                CONTRACT_IDS.ESCROW_CORE,
                'submit_proof',
                params
            );

            console.log('Proof submitted successfully:', result);
            return { success: true, hash: result.hash };
        } catch (err: any) {
            const errorMsg = err.message || 'Failed to submit proof';
            console.error('Failed to submit proof:', err);
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    };

    const approveMilestone = async (
        clientAddress: string,
        jobId: string,
        milestoneId: number
    ) => {
        setLoading(true);
        setError(null);

        try {
            // Convert job_id string to BytesN<32>
            const jobIdBytes = Buffer.from(jobId, 'hex');

            const params = [
                xdr.ScVal.scvBytes(jobIdBytes),
                toScVal.u32(milestoneId),
            ];

            const result = await invokeContract(
                clientAddress,
                CONTRACT_IDS.ESCROW_CORE,
                'approve_milestone',
                params
            );

            console.log('Milestone approved successfully:', result);
            return { success: true, hash: result.hash };
        } catch (err: any) {
            const errorMsg = err.message || 'Failed to approve milestone';
            console.error('Failed to approve milestone:', err);
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    };

    const getJob = async (jobId: string) => {
        setLoading(true);
        setError(null);

        try {
            // TODO: Implement proper contract read with simulation
            // For now, this is a placeholder
            console.log('Getting job:', jobId);

            return {
                success: true,
                job: null // Will be implemented with proper contract read
            };
        } catch (err: any) {
            const errorMsg = err.message || 'Failed to get job';
            console.error('Failed to get job:', err);
            setError(errorMsg);
            return { success: false, error: errorMsg };
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
        getJob,
    };
}
