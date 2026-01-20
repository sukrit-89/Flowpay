import { useState } from 'react';

interface Transaction {
    id: string;
    status: 'pending' | 'confirmed' | 'failed';
    hash?: string;
}

// Hook for tracking transaction status
export function useTransactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    const addTransaction = (tx: Transaction) => {
        setTransactions(prev => [...prev, tx]);
    };

    const updateTransaction = (id: string, updates: Partial<Transaction>) => {
        setTransactions(prev =>
            prev.map(tx => (tx.id === id ? { ...tx, ...updates } : tx))
        );
    };

    return {
        transactions,
        addTransaction,
        updateTransaction,
    };
}
