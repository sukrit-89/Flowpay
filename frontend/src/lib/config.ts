/**
 * Configuration management for FlowPay
 * Reads from environment variables with fallbacks
 */

// Helper to get env variable with validation
function getEnvVar(key: string, required: boolean = false): string {
    const value = import.meta.env[key];

    if (required && !value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }

    return value || '';
}

// Network Configuration
export const config = {
    // Stellar Network
    network: {
        name: getEnvVar('VITE_STELLAR_NETWORK', true) || 'TESTNET',
        horizonUrl: getEnvVar('VITE_HORIZON_URL', true) || 'https://horizon-testnet.stellar.org',
        sorobanUrl: getEnvVar('VITE_SOROBAN_URL', true) || 'https://soroban-testnet.stellar.org',
    },

    // Contract Addresses
    contracts: {
        escrowCore: getEnvVar('VITE_CONTRACT_ESCROW_CORE', true),
        liquidityRouter: getEnvVar('VITE_CONTRACT_LIQUIDITY_ROUTER', true),
        yieldHarvester: getEnvVar('VITE_CONTRACT_YIELD_HARVESTER', true),
    },

    // Token Addresses
    tokens: {
        USDC: getEnvVar('VITE_TOKEN_USDC', true),
        XLM: getEnvVar('VITE_TOKEN_XLM', true),
        OUSG: getEnvVar('VITE_TOKEN_OUSG'),
        INR: getEnvVar('VITE_TOKEN_INR'),
        KES: getEnvVar('VITE_TOKEN_KES'),
        NGN: getEnvVar('VITE_TOKEN_NGN'),
    },

    // Feature Flags
    features: {
        yieldHarvester: getEnvVar('VITE_ENABLE_YIELD_HARVESTER') === 'true',
        liquidityRouter: getEnvVar('VITE_ENABLE_LIQUIDITY_ROUTER') === 'true',
        mockData: getEnvVar('VITE_ENABLE_MOCK_DATA') === 'true',
    },
};

// Validation on load
export function validateConfig() {
    const errors: string[] = [];

    // Check required contracts
    if (!config.contracts.escrowCore) {
        errors.push('Escrow Core contract ID is required');
    }

    if (!config.tokens.USDC) {
        errors.push('USDC token address is required');
    }

    if (!config.tokens.XLM) {
        errors.push('XLM token address is required');
    }

    if (errors.length > 0) {
        console.error('Configuration errors:', errors);
        throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
    }

    console.log('✅ Configuration loaded successfully:', {
        network: config.network.name,
        contracts: Object.keys(config.contracts).length,
        tokens: Object.keys(config.tokens).filter(k => config.tokens[k as keyof typeof config.tokens]).length,
    });
}

// Export individual configs for convenience
export const { network, contracts, tokens, features } = config;
