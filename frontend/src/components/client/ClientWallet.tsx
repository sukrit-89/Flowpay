import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../shared/Sidebar';

export default function ClientWallet() {
    const navigate = useNavigate();

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
                        <div className="text-6xl mb-4">💳</div>
                        <h1 className="text-3xl font-bold text-white mb-4">Wallet</h1>
                        <p className="text-[#94A3B8] mb-8">
                            Manage your funds, view transaction history, and track your yield earnings.
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
