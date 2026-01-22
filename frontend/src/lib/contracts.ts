import {
    CONTRACT_IDS,
    TOKEN_ADDRESSES,
    toScVal,
    executeContractCall,
    simulateTransaction,
    buildContractTransaction
} from './stellar';

/**
 * Escrow Core Contract Interactions
 */

export const createJobContract = async (
    clientAddress: string,
    freelancerAddress: string,
    totalAmount: number,
    assetType: 'USDC' | 'XLM',
    milestoneCount: number,
    signTransaction: (xdr: string, networkPassphrase: string) => Promise<{ success: boolean; signedXdr?: string; error?: string }>
) => {
    // For XLM, use native token handling
    const assetAddress = assetType === 'XLM' ? 'XLM' : TOKEN_ADDRESSES[assetType];
    const amountStroops = assetType === 'XLM' 
        ? Math.floor(totalAmount * 10_000_000) // XLM uses 7 decimals
        : Math.floor(totalAmount * 1_000_000); // USDC uses 6 decimals

    const params = [
        toScVal(clientAddress, 'address'),
        toScVal(freelancerAddress, 'address'),
        toScVal(amountStroops, 'i128'),
        toScVal(assetAddress, assetType === 'XLM' ? 'string' : 'address'),
        toScVal(milestoneCount, 'u32')
    ];

    return await executeContractCall(
        CONTRACT_IDS.ESCROW_CORE,
        'create_job',
        params,
        clientAddress,
        signTransaction
    );
};

export const submitProofContract = async (
    freelancerAddress: string,
    jobId: string,
    milestoneId: number,
    proofUrl: string,
    signTransaction: (xdr: string, networkPassphrase: string) => Promise<{ success: boolean; signedXdr?: string; error?: string }>
) => {
    const params = [
        toScVal(jobId, 'bytes32'),
        toScVal(milestoneId, 'u32'),
        toScVal(proofUrl, 'string')
    ];

    return await executeContractCall(
        CONTRACT_IDS.ESCROW_CORE,
        'submit_proof',
        params,
        freelancerAddress,
        signTransaction
    );
};

export const approveMilestoneContract = async (
    clientAddress: string,
    jobId: string,
    milestoneId: number,
    signTransaction: (xdr: string, networkPassphrase: string) => Promise<{ success: boolean; signedXdr?: string; error?: string }>
) => {
    const params = [
        toScVal(jobId, 'bytes32'),
        toScVal(milestoneId, 'u32')
    ];

    return await executeContractCall(
        CONTRACT_IDS.ESCROW_CORE,
        'approve_milestone',
        params,
        clientAddress,
        signTransaction
    );
};

export const releasePaymentContract = async (
    clientAddress: string,
    jobId: string,
    milestoneId: number,
    signTransaction: (xdr: string, networkPassphrase: string) => Promise<{ success: boolean; signedXdr?: string; error?: string }>
) => {
    const params = [
        toScVal(jobId, 'bytes32'),
        toScVal(milestoneId, 'u32')
    ];

    return await executeContractCall(
        CONTRACT_IDS.ESCROW_CORE,
        'release_payment',
        params,
        clientAddress,
        signTransaction
    );
};

export const getJobContract = async (jobId: string) => {
    // Read-only call - no signature needed
    try {
        const tx = await buildContractTransaction(
            CONTRACT_IDS.ESCROW_CORE,
            'get_job',
            [toScVal(jobId, 'bytes32')],
            'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF' // Dummy address for read-only
        );

        const built = tx.build();
        const simulated = await simulateTransaction(built);

        return {
            success: true,
            result: (simulated as any).returnValue
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Liquidity Router Contract Interactions
 */

export const getExchangeRate = async (
    fromCurrency: string,
    toCurrency: string,
    amount: number
): Promise<{ success: boolean; rate?: number; outputAmount?: number; error?: string }> => {
    try {
        const fromAddress = TOKEN_ADDRESSES[fromCurrency as keyof typeof TOKEN_ADDRESSES];
        const toAddress = TOKEN_ADDRESSES[toCurrency as keyof typeof TOKEN_ADDRESSES];
        const amountStroops = Math.floor(amount * 10_000_000);

        const tx = await buildContractTransaction(
            CONTRACT_IDS.LIQUIDITY_ROUTER,
            'get_exchange_rate',
            [
                toScVal(fromAddress, 'address'),
                toScVal(toAddress, 'address'),
                toScVal(amountStroops, 'i128')
            ],
            'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF' // Dummy for read-only
        );

        const built = tx.build();
        const simulated = await simulateTransaction(built);

        // Extract output amount from result
        const outputStroops = parseInt((simulated as any).returnValue?.toString() || '0');
        const outputAmount = outputStroops / 10_000_000;
        const rate = outputAmount / amount;

        return {
            success: true,
            rate,
            outputAmount
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message
        };
    }
};

export const convertAndSend = async (
    senderAddress: string,
    fromCurrency: string,
    toCurrency: string,
    amount: number,
    recipientAddress: string,
    maxSlippagePercent: number,
    signTransaction: (xdr: string, networkPassphrase: string) => Promise<{ success: boolean; signedXdr?: string; error?: string }>
) => {
    const fromAddress = TOKEN_ADDRESSES[fromCurrency as keyof typeof TOKEN_ADDRESSES];
    const toAddress = TOKEN_ADDRESSES[toCurrency as keyof typeof TOKEN_ADDRESSES];
    const amountStroops = Math.floor(amount * 10_000_000);
    const slippageBps = Math.floor(maxSlippagePercent * 100); // 1% = 100 bps

    const params = [
        toScVal(fromAddress, 'address'),
        toScVal(toAddress, 'address'),
        toScVal(amountStroops, 'i128'),
        toScVal(recipientAddress, 'address'),
        toScVal(slippageBps, 'i128')
    ];

    return await executeContractCall(
        CONTRACT_IDS.LIQUIDITY_ROUTER,
        'convert_and_send',
        params,
        senderAddress,
        signTransaction
    );
};

/**
 * RWA Yield Harvester Contract Interactions
 */

export const depositForYield = async (
    fromAddress: string,
    usdcAmount: number,
    signTransaction: (xdr: string, networkPassphrase: string) => Promise<{ success: boolean; signedXdr?: string; error?: string }>
) => {
    const amountStroops = Math.floor(usdcAmount * 10_000_000);

    const params = [
        toScVal(fromAddress, 'address'),
        toScVal(amountStroops, 'i128'),
        toScVal(TOKEN_ADDRESSES.USDC, 'address'),
        toScVal(TOKEN_ADDRESSES.OUSG, 'address')
    ];

    return await executeContractCall(
        CONTRACT_IDS.YIELD_HARVESTER,
        'deposit',
        params,
        fromAddress,
        signTransaction
    );
};

export const calculateYield = async (ownerAddress: string): Promise<{ success: boolean; yieldAmount?: number; error?: string }> => {
    try {
        const tx = await buildContractTransaction(
            CONTRACT_IDS.YIELD_HARVESTER,
            'calculate_yield',
            [toScVal(ownerAddress, 'address')],
            'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF'
        );

        const built = tx.build();
        const simulated = await simulateTransaction(built);

        const yieldStroops = parseInt((simulated as any).returnValue?.toString() || '0');
        const yieldAmount = yieldStroops / 10_000_000;

        return {
            success: true,
            yieldAmount
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message
        };
    }
};

export const harvestYield = async (
    ownerAddress: string,
    signTransaction: (xdr: string, networkPassphrase: string) => Promise<{ success: boolean; signedXdr?: string; error?: string }>
) => {
    const params = [toScVal(ownerAddress, 'address')];

    return await executeContractCall(
        CONTRACT_IDS.YIELD_HARVESTER,
        'harvest_yield',
        params,
        ownerAddress,
        signTransaction
    );
};

export const withdrawFromYield = async (
    ownerAddress: string,
    ousgAmount: number,
    signTransaction: (xdr: string, networkPassphrase: string) => Promise<{ success: boolean; signedXdr?: string; error?: string }>
) => {
    const amountStroops = Math.floor(ousgAmount * 10_000_000);

    const params = [
        toScVal(ownerAddress, 'address'),
        toScVal(amountStroops, 'i128'),
        toScVal(TOKEN_ADDRESSES.OUSG, 'address'),
        toScVal(TOKEN_ADDRESSES.USDC, 'address')
    ];

    return await executeContractCall(
        CONTRACT_IDS.YIELD_HARVESTER,
        'withdraw',
        params,
        ownerAddress,
        signTransaction
    );
};

export const getYieldPosition = async (ownerAddress: string) => {
    try {
        const tx = await buildContractTransaction(
            CONTRACT_IDS.YIELD_HARVESTER,
            'get_position',
            [toScVal(ownerAddress, 'address')],
            'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF'
        );

        const built = tx.build();
        const simulated = await simulateTransaction(built);

        return {
            success: true,
            position: (simulated as any).returnValue
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message
        };
    }
};

