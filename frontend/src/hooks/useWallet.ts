import { useState, useEffect } from 'react';
import { STELLAR_NETWORK } from '../lib/stellar';

declare global {
    interface Window {
        freighter?: {
            isConnected: () => Promise<boolean>;
            getPublicKey: () => Promise<string>;
            signTransaction: (xdr: string, options: { network: string; networkPassphrase: string }) => Promise<string>;
            getNetwork: () => Promise<string>;
        };
    }
}

export function useWallet() {
    const [address, setAddress] = useState<string>('');
    const [connected, setConnected] = useState(false);
    const [isFreighterInstalled, setIsFreighterInstalled] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        const timeouts: NodeJS.Timeout[] = [];

        const checkFreighter = (attemptNum: number) => {
            if (!mounted) return;

            const isInstalled = !!(window as any).freighter;
            setIsFreighterInstalled(isInstalled);

            if (isInstalled) {
                console.log('✅ Freighter wallet detected on attempt', attemptNum);
            } else {
                console.log(`⏳ Freighter not detected (attempt ${attemptNum})...`);
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
            if (!(window as any).freighter) {
                throw new Error('Freighter wallet not installed. Install from https://www.freighter.app/');
            }

            let publicKey;
            try {
                publicKey = await (window as any).freighter.getPublicKey();
            } catch (freighterErr: any) {
                console.error('Freighter API error:', freighterErr);
                if (freighterErr.message?.includes('message channel')) {
                    throw new Error('Freighter error. Please: 1) Refresh page, 2) Restart Freighter, or 3) Restart browser');
                }
                throw freighterErr;
            }

            if (!publicKey) {
                throw new Error('Connection cancelled. Please approve in Freighter popup.');
            }

            console.log('📝 Public key received:', publicKey.slice(0, 8) + '...');

            try {
                const network = await (window as any).freighter.getNetwork();
                console.log('🌐 Network:', network);

                if (network.toUpperCase() !== STELLAR_NETWORK.toUpperCase()) {
                    setError(`⚠️ Please switch Freighter to ${STELLAR_NETWORK}. Currently on: ${network}`);
                }
            } catch (netErr) {
                console.warn('Network check failed (continuing):', netErr);
            }

            setAddress(publicKey);
            setConnected(true);
            console.log('✅ Wallet connected!');

            return { success: true, address: publicKey };
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
            if (!(window as any).freighter) throw new Error('Freighter not found');

            const signedXdr = await (window as any).freighter.signTransaction(xdr, {
                network: STELLAR_NETWORK,
                networkPassphrase,
            });

            return { success: true, signedXdr };
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
