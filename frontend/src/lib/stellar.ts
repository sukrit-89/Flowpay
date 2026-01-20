import {
    SorobanRpc,
    Contract,
    TransactionBuilder,
    Networks,
    BASE_FEE,
    xdr,
    Address,
    nativeToScVal,
} from '@stellar/stellar-sdk';

// Network configuration
export const STELLAR_NETWORK = import.meta.env.VITE_STELLAR_NETWORK || 'testnet';
export const SOROBAN_RPC_URL = STELLAR_NETWORK === 'testnet'
    ? 'https://soroban-testnet.stellar.org'
    : 'https://soroban-mainnet.stellar.org';

export const NETWORK_PASSPHRASE = STELLAR_NETWORK === 'testnet'
    ? Networks.TESTNET
    : Networks.PUBLIC;

// Contract addresses from environment
export const CONTRACT_IDS = {
    ESCROW_CORE: import.meta.env.VITE_ESCROW_CONTRACT,
    RWA_YIELD_HARVESTER: import.meta.env.VITE_YIELD_CONTRACT,
    LIQUIDITY_ROUTER: import.meta.env.VITE_ROUTER_CONTRACT,
};

// Initialize Soroban RPC Server
let rpcServer: SorobanRpc.Server | null = null;

export const getRpcServer = () => {
    if (!rpcServer) {
        rpcServer = new SorobanRpc.Server(SOROBAN_RPC_URL);
    }
    return rpcServer;
};

// Get contract instance
export const getContract = (contractId: string) => {
    return new Contract(contractId);
};

// Build a contract invocation transaction
export const buildContractTransaction = async (
    sourceAccount: string,
    contractId: string,
    method: string,
    params: xdr.ScVal[]
): Promise<TransactionBuilder> => {
    const server = getRpcServer();
    const contract = getContract(contractId);

    // Get account details
    const account = await server.getAccount(sourceAccount);

    // Build transaction
    const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
    })
        .addOperation(contract.call(method, ...params))
        .setTimeout(30);

    return transaction;
};

// Sign transaction with Freighter
export const signWithFreighter = async (xdr: string, network: string): Promise<string> => {
    if (!(window as any).freighter) {
        throw new Error('Freighter wallet not installed');
    }

    const signedXdr = await (window as any).freighter.signTransaction(xdr, {
        network,
        networkPassphrase: NETWORK_PASSPHRASE,
    });

    return signedXdr;
};

// Submit transaction to network
export const submitTransaction = async (signedXdr: string) => {
    const server = getRpcServer();
    const transaction = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

    const response = await server.sendTransaction(transaction as any);

    // Poll for result
    if (response.status === 'PENDING') {
        let getResponse = await server.getTransaction(response.hash);

        // Poll until transaction is completed
        while (getResponse.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            getResponse = await server.getTransaction(response.hash);
        }

        if (getResponse.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
            return { success: true, hash: response.hash, result: getResponse };
        } else {
            throw new Error(`Transaction failed: ${getResponse.status}`);
        }
    }

    return { success: true, hash: response.hash };
};

// Helper to convert JavaScript values to ScVal
export const toScVal = {
    address: (addr: string) => new Address(addr).toScVal(),
    u32: (num: number) => nativeToScVal(num, { type: 'u32' }),
    i128: (num: bigint) => nativeToScVal(num, { type: 'i128' }),
    string: (str: string) => nativeToScVal(str, { type: 'string' }),
};

// Get account balance  
export const getAccountBalance = async (address: string): Promise<string> => {
    try {
        // Note: SorobanRpc.Server.getAccount() doesn't provide balance info
        // For balances, you would need to use Horizon API
        // This is a placeholder for future implementation
        console.log('Balance check for:', address);
        return '0';
    } catch (error) {
        console.error('Error fetching balance:', error);
        return '0';
    }
};

// Invoke contract and return result
export const invokeContract = async (
    sourceAccount: string,
    contractId: string,
    method: string,
    params: xdr.ScVal[]
) => {
    try {
        // Build transaction
        const txBuilder = await buildContractTransaction(sourceAccount, contractId, method, params);
        const tx = txBuilder.build();

        // Get XDR
        const xdr = tx.toXDR();

        // Sign with Freighter
        const signedXdr = await signWithFreighter(xdr, STELLAR_NETWORK);

        // Submit to network
        const result = await submitTransaction(signedXdr);

        return result;
    } catch (error) {
        console.error('Contract invocation failed:', error);
        throw error;
    }
};
