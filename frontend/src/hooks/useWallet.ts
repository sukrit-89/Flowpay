import { useState, useEffect } from 'react';
import {
    isConnected,
    requestAccess,
    signTransaction as freighterSignTransaction,
    getNetwork
} from '@stellar/freighter-api';
import { STELLAR_NETWORK } from '../lib/stellar';

export function useWallet() {
    const [address, setAddress] = useState<string>('');
    const [connected, setConnected] = useState(false);
    const [isFreighterInstalled, setIsFreighterInstalled] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        const timeouts: NodeJS.Timeout[] = [];

        const checkFreighter = async (attemptNum: number) => {
            if (!mounted) return;

            try {
                const result = await isConnected();
                const installed = result.isConnected;
                setIsFreighterInstalled(installed);

                if (installed) {
                    console.log('✅ Freighter wallet detected on attempt', attemptNum);
                } else {
                    console.log(`⏳ Freighter not detected (attempt ${attemptNum})...`);
                }
            } catch (err) {
                console.log(`⏳ Freighter not detected (attempt ${attemptNum})...`, err);
                setIsFreighterInstalled(false);
            }
        };

        // Check immediately and at increasing intervals for Chrome extension loading
        checkFreighter(1);
        timeouts.push(setTimeout(() => checkFreighter(2), 500));
        timeouts.push(setTimeout(() => checkFreighter(3), 1500));
        timeouts.push(setTimeout(() => checkFreighter(4), 3000));

        return () => {
            mounted = false;
            timeouts.forEach(clearTimeout);
        };
    }, []);

    const connect = async () => {
        setError(null);
        console.log('🔌 Attempting to connect wallet...');

        try {
            // Check if Freighter is installed
            const connectedResult = await isConnected();
            if (!connectedResult.isConnected) {
                throw new Error('Freighter wallet not installed. Install from https://www.freighter.app/');
            }

            // Request access (this will show Freighter popup and return address)
            let addressResult;
            try {
                addressResult = await requestAccess();

                if (addressResult.error) {
                    throw new Error(addressResult.error);
                }
            } catch (freighterErr: any) {
                console.error('Freighter API error:', freighterErr);
                if (freighterErr.message?.includes('User declined')) {
                    throw new Error('Connection cancelled. Please approve in Freighter popup.');
                }
                throw new Error('Freighter error. Please try: 1) Refresh page, 2) Restart Freighter, or 3) Restart browser');
            }

            if (!addressResult.address) {
                throw new Error('Connection cancelled. Please approve in Freighter popup.');
            }

            console.log('📝 Public key received:', addressResult.address.slice(0, 8) + '...');

            // Check network
            try {
                const networkResult = await getNetwork();
                if (networkResult.error) {
                    console.warn('Network check error:', networkResult.error);
                } else {
                    console.log('🌐 Network:', networkResult.network);

                    if (networkResult.network.toUpperCase() !== STELLAR_NETWORK.toUpperCase()) {
                        setError(`⚠️ Please switch Freighter to ${STELLAR_NETWORK}. Currently on: ${networkResult.network}`);
                    }
                }
            } catch (netErr) {
                console.warn('Network check failed (continuing):', netErr);
            }

            setAddress(addressResult.address);
            setConnected(true);
            console.log('✅ Wallet connected!');

            return { success: true, address: addressResult.address };
        } catch (err: any) {
            const errorMsg = err.message || 'Failed to connect wallet';
            console.error('❌ Connection failed:', err);
            setError(errorMsg);
            return { success: false, error: errorMsg };
        }
    };

    const disconnect = () => {
        setAddress('');
        setConnected(false);
        setError(null);
        console.log('👋 Wallet disconnected');
    };

    const signTransaction = async (xdr: string, networkPassphrase: string) => {
        try {
            if (!connected) throw new Error('Wallet not connected');

            const result = await freighterSignTransaction(xdr, {
                networkPassphrase,
                address,
            });

            if (result.error) {
                throw new Error(result.error);
            }

            return { success: true, signedXdr: result.signedTxXdr };
        } catch (err: any) {
            console.error('Failed to sign transaction:', err);
            return { success: false, error: err.message || 'Failed to sign transaction' };
        }
    };

    return {
        address,
        connected,
        isFreighterInstalled,
        error,
        connect,
        disconnect,
        signTransaction,
    };
}
