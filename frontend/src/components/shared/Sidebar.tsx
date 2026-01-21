import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWallet } from '../../hooks/useWallet';

interface SidebarProps {
    userType: 'client' | 'freelancer';
}

export default function Sidebar({ userType }: SidebarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { connected } = useWallet();

    const clientMenuItems = [
        { icon: '📊', label: 'Dashboard', path: '/client' },
        { icon: '💼', label: 'Jobs', path: '/client/jobs' },
        { icon: '💳', label: 'Wallet', path: '/client/wallet' },
        { icon: '⚙️', label: 'Settings', path: '/client/settings' }
    ];

    const freelancerMenuItems = [
        { icon: '📊', label: 'Dashboard', path: '/freelancer' },
        { icon: '💼', label: 'Jobs', path: '/freelancer/jobs' },
        { icon: '💳', label: 'Wallet', path: '/freelancer/wallet' },
        { icon: '⚙️', label: 'Settings', path: '/freelancer/settings' }
    ];

    const menuItems = userType === 'client' ? clientMenuItems : freelancerMenuItems;

    return (
        <div className="w-64 h-screen bg-[#0B0F14] border-r border-teal-500/10 flex flex-col fixed left-0 top-0 overflow-y-auto z-50">
            {/* Logo */}
            <div className="p-6 border-b border-teal-500/10">
                <div className="flex items-center gap-3">
                    <img
                        src="/yieldra_teal_logo_1769009161049.png"
                        alt="Yieldra"
                        className="w-10 h-10 object-contain"
                    />
                    <span className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-cyan-300 bg-clip-text text-transparent">
                        Yieldra
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item, index) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <motion.button
                            key={index}
                            onClick={() => navigate(item.path)}
                            whileHover={{ scale: 1.02, x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${isActive
                                    ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                                    : 'text-[#94A3B8] hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="flex-1 text-left">{item.label}</span>
                        </motion.button>
                    );
                })}
            </nav>

            {/* User Info */}
            {connected && (
                <div className="p-4 border-t border-teal-500/10">
                    <div className="flex items-center gap-3 p-3 bg-[#0F172A] rounded-xl border border-teal-500/10">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold">
                            {userType === 'client' ? 'C' : 'F'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-white capitalize">
                                {userType}
                            </div>
                            <div className="text-xs text-[#94A3B8] truncate">
                                Stellar Testnet
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
