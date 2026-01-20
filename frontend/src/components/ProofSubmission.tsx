import { useState } from 'react';

export default function ProofSubmission() {
    const [proofUrl, setProofUrl] = useState('');

    return (
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-blue-400">🔍</span>
                </div>
                <h3 className="font-bold">PROOF SUBMISSION</h3>
            </div>

            <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">
                    GitHub PR or Document URL
                </label>
                <input
                    type="text"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder="https://github.com/org/repo/pull/..."
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                />
            </div>

            <button className="w-full bg-blue-500 hover:bg-blue-600 py-3 rounded-lg font-medium">
                Submit Proof of Work
            </button>
        </div>
    );
}
