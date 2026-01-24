import { useState, useEffect } from 'react';

interface TransactionModalProps {
    hash?: string;
    onClose: () => void;
}

export default function TransactionModal({ hash, onClose }: TransactionModalProps) {
    const [currentStep, setCurrentStep] = useState(1);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentStep(prev => (prev < 4 ? prev + 1 : prev));
        }, 2000);
        return () => clearInterval(timer);
    }, []);

    const explorerUrl = hash
        ? `https://stellar.expert/explorer/testnet/tx/${hash}`
        : '#';

    const steps = [
        { id: 1, title: 'Escrow created', subtitle: 'Vault provisioned on Stellar', block: hash },
        { id: 2, title: 'Proof submitted', subtitle: 'ZK-SNARK identity verified', block: hash },
        { id: 3, title: 'Payment processing', subtitle: 'Validating on-chain liquidity...', block: hash },
        { id: 4, title: 'Payment complete', subtitle: 'Awaiting finality', block: null },
    ];

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-3xl w-full shadow-2xl">
                <h2 className="text-3xl font-bold text-slate-900 mb-2">FlowPay</h2>
                <div className="text-sm text-slate-500 mb-8">TRANSACTION STATUS</div>

                <div className="grid grid-cols-2 gap-8">
                    {/* Timeline */}
                    <div className="space-y-6">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${currentStep > step.id ? 'bg-indigo-600 text-white' :
                                        currentStep === step.id ? 'bg-indigo-600 text-white animate-pulse' :
                                            'bg-slate-200 text-slate-600'
                                        }`}>
                                        {currentStep > step.id ? '✓' : step.id}
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className={`w-0.5 h-16 ${currentStep > step.id ? 'bg-indigo-600' : 'bg-slate-200'
                                            }`}></div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-slate-900 mb-1">{step.title}</div>
                                    <div className="text-sm text-slate-600">{step.subtitle}</div>
                                    {step.block && (
                                        <div className="text-xs text-indigo-600 mt-1 font-mono">
                                            Hash: {step.block.slice(0, 8)}... <a href={explorerUrl} target="_blank" rel="noreferrer" className="underline cursor-pointer hover:text-indigo-700">(View)</a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Details */}
                    <div className="space-y-4">
                        <div>
                            <div className="text-sm font-semibold text-slate-500 mb-1">TRANSACTION HASH</div>
                            <div className="font-mono text-sm break-all text-slate-900">
                                {hash ? `${hash.slice(0, 16)}...${hash.slice(-8)}` : 'N/A'}
                                {hash && <a href={explorerUrl} target="_blank" rel="noreferrer" className="text-indigo-600 ml-2 cursor-pointer hover:text-indigo-700">(View)</a>}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-slate-500 mb-1">NETWORK</div>
                            <div className="text-slate-900">Stellar Testnet</div>
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-slate-500 mb-1">VIEW EXPLORER</div>
                            <div>
                                <a href={explorerUrl} target="_blank" rel="noreferrer" className="text-indigo-600 cursor-pointer hover:underline hover:text-indigo-700">
                                    View on Stellar Expert ↗
                                </a>
                            </div>
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-slate-500 mb-1">GAS FEE</div>
                            <div className="text-slate-900">&lt; $0.01</div>
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-slate-500 mb-1">ESTIMATED TIME</div>
                            <div className="text-slate-900">Completion in &lt; 30s</div>
                        </div>

                        <button className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-2 border-indigo-200 py-3 rounded-full font-semibold mt-6 transition-all duration-200">
                            VIEW ON EXPLORER ↗
                        </button>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-full font-semibold mt-8 shadow-md hover:shadow-lg transition-all duration-200"
                >
                    Return to Dashboard
                </button>
            </div>
        </div>
    );
}
