import { useState } from 'react';

export default function ProofSubmission() {
    const [proofUrl, setProofUrl] = useState('');

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🔍</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">PROOF SUBMISSION</h3>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    GitHub PR or Document URL
                </label>
                <input
                    type="text"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder="https://github.com/org/repo/pull/..."
                    className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                />
            </div>

            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-full font-semibold shadow-md hover:shadow-lg transition-all duration-200">
                Submit Proof of Work
            </button>
        </div>
    );
}
