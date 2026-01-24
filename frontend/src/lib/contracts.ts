import {
    CONTRACT_IDS,
    TOKEN_ADDRESSES,
    toScVal,
    executeContractCall,
    simulateTransaction,
    buildContractTransaction,
    stringToBytes32,
    server,
    SorobanRpc,
    xdr
} from './stellar';

/**
 * Get the current job counter from the contract
 * This tells us how many jobs have been created
 */
export const getJobCounter = async (): Promise<number> => {
    try {
        const tx = await buildContractTransaction(
            CONTRACT_IDS.ESCROW_CORE,
            'get_job_counter',
            [],
            'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF'
        );

        const built = tx.build();
        const simResult = await server.simulateTransaction(built);
        
        if (SorobanRpc.Api.isSimulationError(simResult)) {
            console.error('Simulation error getting job counter:', simResult);
            return 0;
        }

        // Extract the result
        const simSuccess = simResult as SorobanRpc.Api.SimulateTransactionSuccessResponse;
        if (simSuccess.result) {
            const retval = (simSuccess.result as any).retval;
            if (retval) {
                // u32 value
                const val = retval._value !== undefined ? Number(retval._value) : 0;
                console.log('📊 Current job counter:', val);
                return val;
            }
        }
        return 0;
    } catch (e) {
        console.warn('Could not get job counter:', e);
        return 0;
    }
};

/**
 * Compute job_id from counter (1-based)
 * On-chain format: 32 bytes with counter at end (big-endian u32 in last 4 bytes)
 */
export const computeJobId = (counter: number): string => {
    // counter as big-endian 4-byte hex, padded to 64 chars total
    const counterHex = counter.toString(16).padStart(8, '0');
    return '0'.repeat(56) + counterHex;
};

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
    // Get current job counter BEFORE creating job
    // After creation, the new job will have counter = previousCounter + 1
    const previousCounter = await getJobCounter();
    const expectedJobId = computeJobId(previousCounter + 1);
    console.log('📊 Expected job_id after creation:', expectedJobId);
    
    // Use proper token addresses for both USDC and XLM (wrapped native)
    const assetAddress = TOKEN_ADDRESSES[assetType];
    const amountStroops = assetType === 'XLM' 
        ? Math.floor(totalAmount * 10_000_000) // XLM uses 7 decimals
        : Math.floor(totalAmount * 1_000_000); // USDC uses 6 decimals

    const params = [
        toScVal(clientAddress, 'address'),
        toScVal(freelancerAddress, 'address'),
        toScVal(amountStroops, 'i128'),
        toScVal(assetAddress, 'address'), // Always pass as address
        toScVal(milestoneCount, 'u32')
    ];

    const result = await executeContractCall(
        CONTRACT_IDS.ESCROW_CORE,
        'create_job',
        params,
        clientAddress,
        signTransaction
    );

    // Check for trustline error and provide helpful message
    if (!result.success && result.error) {
        const errorMsg = result.error.toLowerCase();
        if (errorMsg.includes('trustline') || errorMsg.includes('contract, #13')) {
            return {
                success: false,
                error: `⚠️ USDC Not Added to Wallet\n\nYou need to add USDC to your Freighter wallet first.\n\nSteps:\n1. Open Freighter → Manage Assets\n2. Add USDC with address:\nCBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA\n\nTip: You can also use XLM which doesn't require this step!`
            };
        }
    }

    // If successful, use the pre-computed expected job_id
    // This is the most reliable way since the contract counter was read before the transaction
    if (result.success) {
        console.log('✅ Job created successfully! Using computed job_id:', expectedJobId);
        return {
            ...result,
            jobId: expectedJobId, // Use the pre-computed job_id
        } as any;
    }

    return {
        ...result,
        jobId: result.txHash, // Fallback to txHash if job creation failed
    } as any;
};

export const submitProofContract = async (
    freelancerAddress: string,
    jobId: string,
    milestoneId: number,
    proofUrl: string,
    signTransaction: (xdr: string, networkPassphrase: string) => Promise<{ success: boolean; signedXdr?: string; error?: string }>
) => {
    // Convert jobId string to bytes32
    const jobIdBytes = stringToBytes32(jobId);
    
    const params = [
        toScVal(jobIdBytes, 'bytes32'),
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
    // Convert jobId string to bytes32
    const jobIdBytes = stringToBytes32(jobId);
    
    const params = [
        toScVal(jobIdBytes, 'bytes32'),
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
    console.log('💰 === RELEASE PAYMENT INITIATED ===');
    console.log('Client:', clientAddress);
    console.log('Job ID:', jobId);
    console.log('Milestone:', milestoneId);
    console.log('Escrow Contract:', CONTRACT_IDS.ESCROW_CORE);
    console.log('YieldHarvester Contract:', CONTRACT_IDS.YIELD_HARVESTER);

    // Convert jobId string to bytes32
    const jobIdBytes = stringToBytes32(jobId);
    
    const params = [
        toScVal(jobIdBytes, 'bytes32'),
        toScVal(milestoneId, 'u32')
    ];

    const result = await executeContractCall(
        CONTRACT_IDS.ESCROW_CORE,
        'release_payment',
        params,
        clientAddress,
        signTransaction
    );

    if (result.success) {
        console.log('✅ Payment released! TX:', result.txHash);
        console.log('🔗 View on explorer: https://stellar.expert/explorer/testnet/tx/' + result.txHash);
    } else {
        console.error('❌ Payment release failed:', result.error);
    }

    return result;
};

// Fetch all jobs for a client (read-only)
export const getClientJobsContract = async (clientAddress: string) => {
    try {
        console.log('📋 Fetching on-chain jobs for client:', clientAddress);
        const tx = await buildContractTransaction(
            CONTRACT_IDS.ESCROW_CORE,
            'get_client_jobs',
            [toScVal(clientAddress, 'address')],
            'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF'
        );

        const built = tx.build();
        const simResult = await server.simulateTransaction(built);
        
        if (SorobanRpc.Api.isSimulationError(simResult)) {
            console.error('Simulation error:', simResult);
            return { success: false, error: 'Simulation error' };
        }

        // Get the result from simulation - check multiple possible locations
        const simSuccess = simResult as SorobanRpc.Api.SimulateTransactionSuccessResponse;
        console.log('📋 Simulation result keys:', Object.keys(simSuccess));
        console.log('📋 Full simSuccess:', JSON.stringify(simSuccess, (key, value) => {
            if (typeof value === 'bigint') return value.toString();
            if (value instanceof Uint8Array) return Array.from(value);
            return value;
        }, 2).substring(0, 2000));
        
        // The result is in simSuccess.result which contains retval (not returnValue)
        let returnValue: any;
        
        // Method 1: Check result.retval
        if (simSuccess.result && (simSuccess.result as any).retval) {
            returnValue = (simSuccess.result as any).retval;
            console.log('📋 Found result.retval');
        }
        // Method 2: Check result.results array
        else if (simSuccess.result && Array.isArray((simSuccess.result as any).results)) {
            const results = (simSuccess.result as any).results;
            if (results.length > 0 && results[0].xdr) {
                // Decode XDR
                const { xdr } = await import('@stellar/stellar-sdk');
                const scVal = xdr.ScVal.fromXDR(results[0].xdr, 'base64');
                returnValue = scVal;
                console.log('📋 Found result.results[0].xdr');
            }
        }
        // Method 3: Direct result property (older SDK)
        else if (simSuccess.result) {
            returnValue = simSuccess.result;
            console.log('📋 Using direct result');
        }
        
        // Try to decode
        if (returnValue) {
            try {
                const { scValToNative } = await import('./stellar');
                const decoded = scValToNative(returnValue);
                console.log('📋 Decoded on-chain jobs:', JSON.stringify(decoded, null, 2));
                return { success: true, result: decoded };
            } catch (e) {
                console.warn('Could not decode ScVal:', e);
            }
        }

        // Fallback: manually fetch via CLI-style approach
        // Return empty array if we can't decode
        console.log('📋 Could not get jobs from simulation, will use hardcoded job_id');
        return { success: false, error: 'Could not decode simulation result' };
    } catch (error: any) {
        console.error('Failed to fetch client jobs:', error);
        return { success: false, error: error.message };
    }
};

export const getJobContract = async (jobId: string) => {
    // Read-only call - no signature needed
    // Silently fail and return null if job not found (common in demo mode)
    try {
        // Convert jobId string to bytes32
        const jobIdBytes = stringToBytes32(jobId);
        
        const tx = await buildContractTransaction(
            CONTRACT_IDS.ESCROW_CORE,
            'get_job',
            [toScVal(jobIdBytes, 'bytes32')],
            'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF' // Dummy address for read-only
        );

        const built = tx.build();
        
        // Simulate without logging errors (this is expected to fail for demo jobs)
        const simulated = await new Promise<any>((resolve, reject) => {
            server.simulateTransaction(built)
                .then(result => {
                    if (SorobanRpc.Api.isSimulationError(result)) {
                        // Silently return failure for read-only calls
                        resolve({ success: false, error: 'Job not found' });
                    } else {
                        resolve({ success: true, result });
                    }
                })
                .catch(err => {
                    // Silently return failure
                    resolve({ success: false, error: err.message });
                });
        });

        if (!simulated.success) {
            return { success: false, error: 'Job not found on contract' };
        }

        return {
            success: true,
            result: (simulated.result as any).returnValue
        };
    } catch (error: any) {
        // Silently return failure for read-only calls
        return {
            success: false,
            error: 'Job not found on contract'
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

