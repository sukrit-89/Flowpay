import { useState } from 'react';

interface JobCreationFormProps {
    onSubmit: () => void;
}

export default function JobCreationForm({ onSubmit }: JobCreationFormProps) {
    const [jobTitle, setJobTitle] = useState('');
    const [freelancerAddress, setFreelancerAddress] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [milestones, setMilestones] = useState(1);
    const [payoutCurrency, setPayoutCurrency] = useState<'USDC' | 'INR'>('USDC');

    const handleSubmit = () => {
        // TODO: Call smart contract
        onSubmit();
    };

    return (
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold">Create Job</h2>
                    <div className="text-sm text-gray-400">Technical Client Web Dashboard</div>
                </div>
                <button className="text-blue-400 text-sm flex items-center gap-1">
                    ⓘ Technical
                </button>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm mb-2">Job Title</label>
                    <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="Job Title"
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm mb-2">Freelancer Stellar Address</label>
                    <input
                        type="text"
                        value={freelancerAddress}
                        onChange={(e) => setFreelancerAddress(e.target.value)}
                        placeholder="Freelancer Stellar Address"
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm mb-2">Total Amount</label>
                        <input
                            type="number"
                            value={totalAmount}
                            onChange={(e) => setTotalAmount(e.target.value)}
                            placeholder="Total Amount"
                            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-2">Asset</label>
                        <select className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500">
                            <option>OUSG, etc.</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm mb-2">Milestones</label>
                    <div className="flex gap-2">
                        {[1, 2, 3].map(num => (
                            <button
                                key={num}
                                onClick={() => setMilestones(num)}
                                className={`flex-1 py-2 rounded-lg font-medium ${milestones === num ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'
                                    }`}
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm mb-2">Payout Currency</label>
                    <div className="flex items-center gap-4">
                        <span className={payoutCurrency === 'USDC' ? 'text-white' : 'text-gray-400'}>USDC</span>
                        <button
                            onClick={() => setPayoutCurrency(prev => prev === 'USDC' ? 'INR' : 'USDC')}
                            className={`w-14 h-7 rounded-full relative transition-colors ${payoutCurrency === 'INR' ? 'bg-blue-500' : 'bg-gray-600'
                                }`}
                        >
                            <div className={`absolute w-5 h-5 bg-white rounded-full top-1 transition-transform ${payoutCurrency === 'INR' ? 'translate-x-8' : 'translate-x-1'
                                }`}></div>
                        </button>
                        <span className={payoutCurrency === 'INR' ? 'text-white' : 'text-gray-400'}>INR</span>
                    </div>
                </div>

                <button
                    onClick={handleSubmit}
                    className="w-full bg-blue-500 hover:bg-blue-600 py-3 rounded-lg font-medium"
                >
                    Submit Job to Chain
                </button>
            </div>
        </div>
    );
}
