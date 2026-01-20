import { useState, useEffect } from 'react';

interface TransactionModalProps {
    onClose: () => void;
}

export default function TransactionModal({ onClose }: TransactionModalProps) {
    const [currentStep, setCurrentStep] = useState(1);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentStep(prev => (prev < 4 ? prev + 1 : prev));
        }, 2000);
        return () => clearInterval(timer);
    }, []);

    const steps = [
        { id: 1, title: 'Escrow created', subtitle: 'Vault provisioned on Stellar', block: '#12345678' },
        { id: 2, title: 'Proof submitted', subtitle: 'ZK-SNARK identity verified', block: '#12345679' },
        { id: 3, title: 'Payment processing', subtitle: 'Validating on-chain liquidity...', block: '#12345680' },
        { id: 4, title: 'Payment complete', subtitle: 'Awaiting finality', block: null },
    ];

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-8 max-w-3xl w-full">
                <h2 className="text-3xl font-bold mb-2">FlowPay</h2>
                <div className="text-sm text-gray-400 mb-8">TRANSACTION STATUS</div>

                <div className="grid grid-cols-2 gap-8">
                    {/* Timeline */}
                    <div className="space-y-6">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep > step.id ? 'bg-blue-500' :
                                        currentStep === step.id ? 'bg-blue-500 animate-pulse' :
                                            'bg-gray-700'
                                        }`}>
                                        {currentStep > step.id ? '✓' : step.id}
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className={`w-0.5 h-16 ${currentStep > step.id ? 'bg-blue-500' : 'bg-gray-700'
                                            }`}></div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold mb-1">{step.title}</div>
                                    <div className="text-sm text-gray-400">{step.subtitle}</div>
                                    {step.block && (
                                        <div className="text-xs text-blue-400 mt-1">
                                            Block: {step.block} <span className="underline cursor-pointer">(View)</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Details */}
                    <div className="space-y-4">
                        <div>
                            <div className="text-sm text-gray-400 mb-1">TRANSACTION HASH</div>
                            <div className="font-mono text-sm">
                                0x71C...3a42
                                <span className="text-blue-400 ml-2 cursor-pointer">(Copy, Link)</span>
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-400 mb-1">NETWORK</div>
                            <div>Polygon Mainnet</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-400 mb-1">BLOCK HEIGHT</div>
                            <div>
                                #12345680
                                <span className="text-blue-400 ml-2 cursor-pointer">(View)</span>
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-400 mb-1">GAS FEE</div>
                            <div>&lt; $0.01</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-400 mb-1">ESTIMATED TIME</div>
                            <div>Completion in &lt; 30s</div>
                        </div>

                        <button className="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 py-3 rounded-lg font-medium mt-6">
                            VIEW ON EXPLORER ↗
                        </button>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-full bg-blue-500 hover:bg-blue-600 py-3 rounded-lg font-medium mt-8"
                >
                    Return to Dashboard
                </button>
            </div>
        </div>
    );
}
