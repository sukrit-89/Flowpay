import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../shared/Sidebar';
import { useWallet } from '../../hooks/useWallet';
import AnimatedCounter from '../animated/AnimatedCounter';

interface TokenBalance {
    symbol: string;
    balance: number;
    valueUSD: number;
    address: string;
}

interface Transaction {
    id: string;
    type: 'job_created' | 'payment_sent' | 'payment_received' | 'yield_earned';
    amount: number;
    token: string;
    status: 'pending' | 'completed';
    timestamp: string;
    description: string;
}

interface YieldPosition {
    ousgAmount: number;
    usdcEquivalent: number;
    apy: number;
    dailyYield: number;
}

export default function ClientWallet() {
    const navigate = useNavigate();
    const { address, connected } = useWallet();
    const [balances, setBalances] = useState<TokenBalance[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [yieldPosition, setYieldPosition] = useState<YieldPosition | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWalletData = async () => {
            if (!address) return;

            try {
                // Fetch real balances from Stellar
                const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${address}`);
                const accountData = await response.json();
                
                const balances: TokenBalance[] = [];
                let totalValue = 0;

                // Process balances from Stellar
                for (const balance of accountData.balances) {
                    if (balance.asset_type === 'native') {
                        // XLM balance
                        const xlmBalance = parseFloat(balance.balance);
                        const xlmValue = xlmBalance * 0.15; // ~$0.15 per XLM
                        balances.push({
                            symbol: 'XLM',
                            balance: xlmBalance,
                            valueUSD: xlmValue,
                            address: 'XLM-Native'
                        });
                        totalValue += xlmValue;
                    } else if (balance.asset_code === 'USDC') {
                        // USDC balance
                        const usdcBalance = parseFloat(balance.balance);
                        balances.push({
                            symbol: 'USDC',
                            balance: usdcBalance,
                            valueUSD: usdcBalance,
                            address: balance.asset_issuer || 'USDC-Token'
                        });
                        totalValue += usdcBalance;
                    }
                }

                // Add OUSG position only if user has yield holdings (in production, fetch from yield contract)
                const ousgBalance = balances.find(b => b.symbol === 'OUSG');
                if (!ousgBalance) {
                    balances.push({
                        symbol: 'OUSG',
                        balance: 0,
                        valueUSD: 0,
                        address: 'COUSG...'
                    });
                }

                // Fetch real transactions from Stellar
                const transactionsResponse = await fetch(`https://horizon-testnet.stellar.org/accounts/${address}/transactions?limit=10&order=desc`);
                const transactionsData = await transactionsResponse.json();
                
                const transactions: Transaction[] = transactionsData._embedded.records.map((tx: any) => {
                    // Determine transaction type based on memo and operations
                    let type: Transaction['type'] = 'payment_sent';
                    let amount = 0;
                    let description = 'Transaction';
                    
                    if (tx.memo) {
                        const memo = tx.memo.toLowerCase();
                        if (memo.includes('job') || memo.includes('escrow')) {
                            type = 'job_created';
                            description = 'Escrow deposit for job';
                        } else if (memo.includes('milestone')) {
                            type = 'payment_sent';
                            description = 'Milestone payment';
                        } else if (memo.includes('yield')) {
                            type = 'yield_earned';
                            description = 'Yield earnings';
                        }
                    }

                    // Extract amount from operations (simplified)
                    if (tx.operations && tx.operations.length > 0) {
                        const op = tx.operations[0];
                        if (op.amount) {
                            amount = parseFloat(op.amount);
                            if (op.from === address) {
                                amount = -amount; // Outgoing
                            } else {
                                type = 'payment_received';
                                amount = Math.abs(amount); // Incoming
                            }
                        }
                    }

                    return {
                        id: tx.id,
                        type,
                        amount,
                        token: 'USDC',
                        status: tx.successful ? 'completed' : 'pending',
                        timestamp: tx.created_at,
                        description
                    };
                });

                // Calculate yield position based on actual OUSG holdings
                const ousgBalanceObj = balances.find(b => b.symbol === 'OUSG');
                const yieldPosition: YieldPosition | null = ousgBalanceObj ? {
                    ousgAmount: ousgBalanceObj.balance,
                    usdcEquivalent: ousgBalanceObj.valueUSD,
                    apy: 5.0,
                    dailyYield: ousgBalanceObj.valueUSD * 0.05 / 365
                } : null;

                setBalances(balances);
                setTransactions(transactions);
                setYieldPosition(yieldPosition);

            } catch (error) {
                console.error('Failed to fetch wallet data:', error);
                // Fallback to mock data if API fails
                const mockBalances: TokenBalance[] = [
                    {
                        symbol: 'USDC',
                        balance: 0,
                        valueUSD: 0,
                        address: 'GBBD47F6QVJKKQHLGOBFYI6J2XEEQP4AJYEVYZZNGQKEBHQY7T3S6Y5'
                    },
                    {
                        symbol: 'XLM',
                        balance: 0,
                        valueUSD: 0,
                        address: 'XLM-Native'
                    }
                ];
                setBalances(mockBalances);
                setTransactions([]);
                setYieldPosition(null);
            } finally {
                setLoading(false);
            }
        };

        if (connected && address) {
            fetchWalletData();
        } else {
            setLoading(false);
        }
    }, [address, connected]);

    const getTotalValue = () => {
        return balances.reduce((total, balance) => total + balance.valueUSD, 0);
    };

    const getTransactionIcon = (type: Transaction['type']) => {
        switch (type) {
            case 'job_created': return '💼';
            case 'payment_sent': return '📤';
            case 'payment_received': return '📥';
            case 'yield_earned': return '🌱';
            default: return '🔄';
        }
    };

    const getTransactionColor = (type: Transaction['type']) => {
        switch (type) {
            case 'job_created': return 'text-blue-400';
            case 'payment_sent': return 'text-red-400';
            case 'payment_received': return 'text-green-400';
            case 'yield_earned': return 'text-green-400';
            default: return 'text-gray-400';
        }
    };

    if (!connected) {
        return (
            <div className="flex min-h-screen bg-[#090C10]">
                <Sidebar userType="client" />
                <div className="flex-1 flex flex-col ml-64">
                    <div className="flex-1 flex items-center justify-center p-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center max-w-md"
                        >
                            <div className="text-6xl mb-4">🔌</div>
                            <h1 className="text-3xl font-bold text-white mb-4">Connect Wallet</h1>
                            <p className="text-[#94A3B8] mb-8">
                                Please connect your wallet to view your balances and transactions.
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/client')}
                                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-teal-500/40"
                            >
                                ← Back to Dashboard
                            </motion.button>
                        </motion.div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#090C10]">
            <Sidebar userType="client" />

            <div className="flex-1 flex flex-col ml-64">
                <div className="p-8">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <h1 className="text-4xl font-bold text-white mb-2">Wallet</h1>
                        <p className="text-[#94A3B8]">
                            Manage your funds, view transaction history, and track your yield earnings.
                        </p>
                    </motion.div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-white">Loading wallet data...</div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Total Value Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-r from-teal-500/20 to-blue-500/20 border border-teal-500/30 rounded-xl p-6"
                            >
                                <div className="text-center">
                                    <div className="text-[#94A3B8] mb-2">Total Portfolio Value</div>
                                    <div className="text-5xl font-bold text-white mb-2">
                                        $<AnimatedCounter value={getTotalValue()} />
                                    </div>
                                    <div className="text-[#94A3B8] text-sm">
                                        Across {balances.length} assets
                                    </div>
                                </div>
                            </motion.div>

                            {/* Balances */}
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-4">Token Balances</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {balances.map((balance, index) => (
                                        <motion.div
                                            key={balance.symbol}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="bg-[#1A1F2E] border border-[#2A3441] rounded-xl p-4"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="text-xl font-bold text-white">{balance.symbol}</div>
                                                    <div className="text-[#94A3B8] text-sm">
                                                        {balance.balance.toLocaleString()} tokens
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-teal-400">
                                                        ${balance.valueUSD.toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-xs text-[#94A3B8] font-mono">
                                                {balance.address.slice(0, 8)}...{balance.address.slice(-8)}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Yield Position */}
                            {yieldPosition && (
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-4">Yield Position</h2>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-[#1A1F2E] border border-[#2A3441] rounded-xl p-6"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                            <div>
                                                <div className="text-[#94A3B8] mb-1">OUSG Amount</div>
                                                <div className="text-xl font-bold text-white">
                                                    {yieldPosition.ousgAmount.toLocaleString()}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[#94A3B8] mb-1">USDC Equivalent</div>
                                                <div className="text-xl font-bold text-teal-400">
                                                    ${yieldPosition.usdcEquivalent.toLocaleString()}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[#94A3B8] mb-1">APY</div>
                                                <div className="text-xl font-bold text-green-400">
                                                    {yieldPosition.apy}%
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[#94A3B8] mb-1">Daily Yield</div>
                                                <div className="text-xl font-bold text-green-400">
                                                    ${yieldPosition.dailyYield.toFixed(4)}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            )}

                            {/* Recent Transactions */}
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-4">Recent Transactions</h2>
                                <div className="space-y-3">
                                    {transactions.map((tx, index) => (
                                        <motion.div
                                            key={tx.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="bg-[#1A1F2E] border border-[#2A3441] rounded-xl p-4"
                                        >
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-2xl">{getTransactionIcon(tx.type)}</div>
                                                    <div>
                                                        <div className="text-white font-medium">{tx.description}</div>
                                                        <div className="text-[#94A3B8] text-sm">
                                                            {new Date(tx.timestamp).toLocaleDateString()} • {tx.token}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`font-bold ${getTransactionColor(tx.type)}`}>
                                                        {tx.amount > 0 ? '+' : ''}{tx.amount} {tx.token}
                                                    </div>
                                                    <div className={`text-xs px-2 py-1 rounded-full ${
                                                        tx.status === 'completed' 
                                                            ? 'bg-green-500/20 text-green-400' 
                                                            : 'bg-yellow-500/20 text-yellow-400'
                                                    }`}>
                                                        {tx.status}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
