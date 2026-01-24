import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Wallet, Settings } from 'lucide-react';
import { useWallet } from '../../hooks/useWallet';

interface SidebarProps {
    userType: 'client' | 'freelancer';
}

interface MenuItem {
    icon: React.ReactNode;
    label: string;
    path: string;
}

export default function Sidebar({ userType }: SidebarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { connected } = useWallet();

    const clientMenuItems: MenuItem[] = [
        { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', path: '/client' },
        { icon: <Briefcase className="w-5 h-5" />, label: 'Jobs', path: '/client/jobs' },
        { icon: <Wallet className="w-5 h-5" />, label: 'Wallet', path: '/client/wallet' },
        { icon: <Settings className="w-5 h-5" />, label: 'Settings', path: '/client/settings' }
    ];

    const freelancerMenuItems: MenuItem[] = [
        { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', path: '/freelancer' },
        { icon: <Briefcase className="w-5 h-5" />, label: 'Jobs', path: '/freelancer/jobs' },
        { icon: <Wallet className="w-5 h-5" />, label: 'Wallet', path: '/freelancer/wallet' },
        { icon: <Settings className="w-5 h-5" />, label: 'Settings', path: '/freelancer/settings' }
    ];

    const menuItems = userType === 'client' ? clientMenuItems : freelancerMenuItems;

    return (
        <div className="w-64 md:w-64 lg:w-72 xl:w-80 shrink-0 h-screen bg-white border-r border-slate-200 flex flex-col overflow-y-auto shadow-sm sticky top-0">
            {/* Logo */}
            <div className="p-6 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <img
                        src="/yieldra_teal_logo_1769009161049.png"
                        alt="Yieldra"
                        className="w-10 h-10 object-contain"
                    />
                    <span className="text-2xl font-bold text-indigo-600">
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
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${isActive
                                    ? 'bg-indigo-50 text-indigo-600'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <div className={`transition-colors duration-200 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`}>
                                {item.icon}
                            </div>
                            <span className="flex-1 text-left">{item.label}</span>
                        </motion.button>
                    );
                })}
            </nav>

            {/* User Info */}
            {connected && (
                <div className="p-4 border-t border-slate-200">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                            {userType === 'client' ? 'C' : 'F'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-900 capitalize">
                                {userType}
                            </div>
                            <div className="text-xs text-slate-500 truncate">
                                Stellar Testnet
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
