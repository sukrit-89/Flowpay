// FlowPay Contract Addresses - Stellar Testnet
export const CONTRACTS = {
    ESCROW_CORE: 'CCK5VICBIWM245Q5TLB2FXCJYKVPTLIIB4HO2QPESG7TOF3ZPCZRKCVA',
    RWA_YIELD_HARVESTER: 'CBMU2XVMEJWJTXZBACTBJRGCFPXJCGUNT2VEENSVPN63G4MSMUDRBSMC',
    LIQUIDITY_ROUTER: 'CDTDGS22DS33NPH2GNE4UWPYEJD57MJN6DTPDZXLD46SIKNNCYNKNA3A',
} as const;

export const NETWORK_CONFIG = {
    network: 'TESTNET',
    networkPassphrase: 'Test SDF Network ; September 2015',
    sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
} as const;
