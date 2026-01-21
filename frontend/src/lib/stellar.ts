import {
    SorobanRpc,
    TransactionBuilder,
    Transaction,
    Networks,
    Contract,
    Address,
    nativeToScVal,
    xdr
} from '@stellar/stellar-sdk';
import { config } from './config';

// Stellar Network Configuration (from environment)
export const STELLAR_NETWORK = config.network.name;
export const NETWORK_PASSPHRASE = config.network.name === 'MAINNET' ? Networks.PUBLIC : Networks.TESTNET;
export const HORIZON_URL = config.network.horizonUrl;
export const SOROBAN_URL = config.network.sorobanUrl;

// Initialize Soroban RPC Server
export const server = new SorobanRpc.Server(SOROBAN_URL);

// Contract IDs (from environment)
export const CONTRACT_IDS = {
    ESCROW_CORE: config.contracts.escrowCore,
    LIQUIDITY_ROUTER: config.contracts.liquidityRouter,
    YIELD_HARVESTER: config.contracts.yieldHarvester,
};

// Token Addresses (from environment)
export const TOKEN_ADDRESSES = {
    USDC: config.tokens.USDC,
    XLM: config.tokens.XLM,
    OUSG: config.tokens.OUSG,
    INR: config.tokens.INR,
    KES: config.tokens.KES,
    NGN: config.tokens.NGN,
};

/**
 * Build a Soroban contract transaction (returns TransactionBuilder for flexibility)
 */
export async function buildContractTransaction(
    contractId: string,
    method: string,
    params: xdr.ScVal[],
    signerAddress: string
): Promise<TransactionBuilder> {
    // Load account
    const account = await server.getAccount(signerAddress);

    // Create contract instance
    const contract = new Contract(contractId);

    // Build operation
    const operation = contract.call(method, ...params);

    // Build transaction builder (NOT built yet for simulation)
    const transaction = new TransactionBuilder(account, {
        fee: '10000000', // 1 XLM max fee
        networkPassphrase: NETWORK_PASSPHRASE
    })
        .addOperation(operation)
        .setTimeout(180);

    return transaction;
}

/**
 * Simulate and prepare transaction
 */
export async function simulateTransaction(tx: Transaction): Promise<Transaction> {
    const simulated = await server.simulateTransaction(tx);

    if (SorobanRpc.Api.isSimulationError(simulated)) {
        throw new Error(`Simulation failed: ${simulated.error}`);
    }

    // assembleTransaction returns a Transaction
    const assembled: any = SorobanRpc.assembleTransaction(tx, simulated);
    return assembled as Transaction;
}

/**
 * Submit transaction to network
 */
export async function submitTransaction(signedTxXdr: string) {
    const signedTx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
    const result = await server.sendTransaction(signedTx as any);

    return result;
}

/**
 * Wait for transaction confirmation
 */
export async function waitForTransaction(txHash: string): Promise<SorobanRpc.Api.GetTransactionResponse> {
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
        const status = await server.getTransaction(txHash);

        if (status.status !== 'NOT_FOUND') {
            return status;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
    }

    throw new Error('Transaction timeout');
}

/**
 * Convert native JS values to ScVal for contract calls
 */
export function toScVal(value: any, type?: string): xdr.ScVal {
    if (type === 'address') {
        // Address.fromString() handles both G-addresses and C-addresses
        const addr = Address.fromString(value);
        return nativeToScVal(addr, { type: 'address' });
    } else if (type === 'i128') {
        return nativeToScVal(value, { type: 'i128' });
    } else if (type === 'u32') {
        return nativeToScVal(value, { type: 'u32' });
    } else if (type === 'string') {
        return nativeToScVal(value, { type: 'string' });
    } else if (type === 'bytes32') {
        return nativeToScVal(value, { type: 'bytes' });
    }

    // Auto-detect
    return nativeToScVal(value);
}

/**
 * Convert ScVal result to native JS value
 */
export function fromScVal(scVal: xdr.ScVal): any {
    // This is simplified - in production, use proper decoding
    try {
        return scVal;
    } catch (e) {
        console.error('Failed to decode ScVal:', e);
        return null;
    }
}

/**
 * Get account info
 */
export async function getAccount(address: string) {
    return await server.getAccount(address);
}

/**
 * Build and execute a complete contract call workflow
 */
export async function executeContractCall(
    contractId: string,
    method: string,
    params: xdr.ScVal[],
    signerAddress: string,
    signFunction: (xdr: string, networkPassphrase: string) => Promise<{ success: boolean; signedXdr?: string; error?: string }>
): Promise<{ success: boolean; txHash?: string; result?: any; error?: string }> {
    try {
        // Build transaction builder
        const txBuilder = await buildContractTransaction(contractId, method, params, signerAddress);
        const tx = txBuilder.build();

        // Simulate - returns Transaction
        console.log('Simulating transaction...');
        const prepared = await simulateTransaction(tx);

        // Sign
        console.log('Requesting signature...');
        const preparedXdr = prepared.toXDR(); // Transaction has toXDR method
        const signResult = await signFunction(preparedXdr, NETWORK_PASSPHRASE);

        if (!signResult.success || !signResult.signedXdr) {
            return { success: false, error: signResult.error || 'Signature failed' };
        }

        // Submit
        console.log('Submitting transaction...');
        const submitResult = await submitTransaction(signResult.signedXdr);

        // Wait for confirmation
        console.log('Waiting for confirmation...');
        const status = await waitForTransaction(submitResult.hash);

        if (status.status === 'SUCCESS') {
            return {
                success: true,
                txHash: submitResult.hash,
                result: (status as any).returnValue
            };
        } else {
            return {
                success: false,
                error: `Transaction failed: ${status.status}`
            };
        }
    } catch (error: any) {
        console.error('Contract call failed:', error);
        return {
            success: false,
            error: error.message || 'Unknown error'
        };
    }
}
