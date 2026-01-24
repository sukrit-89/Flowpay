import { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useContracts } from '../hooks/useContracts';

interface JobCreationFormProps {
    onSubmit: (hash?: string) => void;
}

export default function JobCreationForm({ onSubmit }: JobCreationFormProps) {
    const [jobTitle, setJobTitle] = useState('');
    const [freelancerAddress, setFreelancerAddress] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [milestones, setMilestones] = useState(1);
    const [payoutCurrency, setPayoutCurrency] = useState<'USDC' | 'INR'>('USDC');

    const { address, connected } = useWallet();
    const { createJob, loading, error } = useContracts();

    const handleSubmit = async () => {
        if (!connected || !address) {
            alert('Please connect your wallet first');
            return;
        }

        if (!jobTitle || !freelancerAddress || !totalAmount) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            const result = await createJob(
                freelancerAddress,
                parseFloat(totalAmount),
                milestones,
                'XLM' // assetType
            );

            if (result.success) {
                alert(`Job created successfully! Transaction hash: ${result.txHash}`);
                onSubmit(result.txHash);

                // Reset form
                setJobTitle('');
                setFreelancerAddress('');
                setTotalAmount('');
                setMilestones(1);
            } else {
                alert(`Failed to create job: ${result.error}`);
            }
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Create Job</h2>
                    <div className="text-sm text-slate-600">Technical Client Web Dashboard</div>
                </div>
                <button className="text-indigo-600 text-sm flex items-center gap-1 font-semibold">
                    ⓘ Technical
                </button>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Job Title</label>
                    <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="Job Title"
                        className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                        disabled={loading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Freelancer Stellar Address</label>
                    <input
                        type="text"
                        value={freelancerAddress}
                        onChange={(e) => setFreelancerAddress(e.target.value)}
                        placeholder="G..."
                        className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 text-slate-900 font-mono focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                        disabled={loading}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Total Amount (XLM)</label>
                        <input
                            type="number"
                            value={totalAmount}
                            onChange={(e) => setTotalAmount(e.target.value)}
                            placeholder="100"
                            className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Asset</label>
                        <select
                            className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                            disabled={loading}
                        >
                            <option>Native XLM</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Milestones</label>
                    <div className="flex gap-2">
                        {[1, 2, 3].map(num => (
                            <button
                                key={num}
                                onClick={() => setMilestones(num)}
                                disabled={loading}
                                className={`flex-1 py-2 rounded-full font-semibold transition-all duration-200 ${milestones === num ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Payout Currency</label>
                    <div className="flex items-center gap-4">
                        <span className={payoutCurrency === 'USDC' ? 'text-white' : 'text-gray-400'}>USDC</span>
                        <button
                            onClick={() => setPayoutCurrency(prev => prev === 'USDC' ? 'INR' : 'USDC')}
                            disabled={loading}
                            className={`w-14 h-7 rounded-full relative transition-colors ${payoutCurrency === 'INR' ? 'bg-blue-500' : 'bg-gray-600'
                                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div className={`absolute w-5 h-5 bg-white rounded-full top-1 transition-transform ${payoutCurrency === 'INR' ? 'translate-x-8' : 'translate-x-1'
                                }`}></div>
                        </button>
                        <span className={payoutCurrency === 'INR' ? 'text-white' : 'text-gray-400'}>INR</span>
                    </div>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={loading || !connected}
                    className={`w-full py-3 rounded-lg font-medium ${loading || !connected
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                >
                    {loading ? 'Submitting to Chain...' : connected ? 'Submit Job to Chain' : 'Connect Wallet First'}
                </button>
            </div>
        </div>
    );
}
