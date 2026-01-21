import { Address } from '@stellar/stellar-sdk';

// Test address conversions
console.log('=== Address Conversion Test ===');

// Test G-address (account)
const clientAddr = 'GDA3T73YA7D2FPZ7TXPFFQ7VONKHQCRRHD6ZPE7LWVKR7EYE747TOXGM';
try {
    const addr1 = Address.fromString(clientAddr);
    console.log('✅ G-address (account):', addr1.toString());
} catch (e) {
    console.error('❌ G-address failed:', e);
}

// Test C-address (contract)
const xlmAddr = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
try {
    const addr2 = Address.fromString(xlmAddr);
    console.log('✅ C-address (contract):', addr2.toString());
} catch (e) {
    console.error('❌ C-address failed:', e);
}

export { };
