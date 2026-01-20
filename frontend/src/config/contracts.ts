// FlowPay Contract Addresses - Stellar Testnet
export const CONTRACTS = {
    ESCROW_CORE: 'CA63NBJU756G7ZKSFUVXEKALCI7MVO6WXSGDY2CUQGY26LWGWWGTBHQ7',
    RWA_YIELD_HARVESTER: 'CDYLM2I4J6K57CDK3AFZXKL4H4QTKECSEKRNALY6U6TA7ODPQCS35PPX',
    LIQUIDITY_ROUTER: 'CCCYIVHMEBEY5TGZYKV3DFPYR4OG3HZXBT5MFFNJUDLF7ZZEGCVZMIAX',
} as const;

export const NETWORK_CONFIG = {
    network: 'TESTNET',
    networkPassphrase: 'Test SDF Network ; September 2015',
    sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
} as const;
