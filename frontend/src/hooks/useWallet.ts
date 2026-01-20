import { useState } from 'react';

export function useWallet() {
    const [address, setAddress] = useState<string>('');
    const [connected, setConnected] = useState(false);

    const connect = async () => {
        try {
            if ((window as any).freighter) {
                const publicKey = await (window as any).freighter.getPublicKey();
                setAddress(publicKey);
                setConnected(true);
            }
        } catch (error) {
            console.error('Failed to connect wallet:', error);
        }
    };

    return { address, connected, connect };
}
