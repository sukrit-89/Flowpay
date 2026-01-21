import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import AnimatedGradient from './animated/AnimatedGradient';
import FadeInUp from './animated/FadeInUp';
import AnimatedCounter from './animated/AnimatedCounter';
import { fadeInUp, staggerContainer, hoverLift } from '../animations/variants';

export default function Landing() {
    const navigate = useNavigate();
    const { address, connected, connect, disconnect } = useWallet();

    const features = [
        {
            icon: '💰',
            title: '5% APY Yield',
            description: 'Your escrowed funds automatically earn yield from US Treasury-backed OUSG tokens'
        },
        {
            icon: '🔒',
            title: 'Smart Escrow',
            description: 'Milestone-based payments protected by blockchain smart contracts'
        },
        {
            icon: '🌍',
            title: 'Multi-Currency',
            description: 'Pay in XLM, USDC, or convert to INR, KES, NGN  via Stellar DEX'
        },
        {
            icon: '⚡',
            title: 'Instant Settlement',
            description: 'Near-zero fees (~$0.01) and instant payment confirmation'
        }
    ];

    const stats = [
        { label: 'Total Value Locked', value: 142800000, prefix: '$', suffix: '' },
        { label: 'Average Yield', value: 5.0, prefix: '', suffix: '% APY' },
        { label: 'Active Jobs', value: 1247, prefix: '', suffix: '+' },
        { label: 'Happy Freelancers', value: 5890, prefix: '', suffix: '+' }
    ];

    return (
        <div className="min-h-screen bg-[#090C10] text-[#E2E8F0] overflow-hidden relative">
            {/* Animated Background */}
            <AnimatedGradient />

            {/* Navigation */}
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="relative z-50 border-b border-teal-500/10 backdrop-blur-lg bg-[#0F172A]/80"
            >
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
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

                    <div className="flex items-center gap-6">
                        <a href="#features" className="text-[#94A3B8] hover:text-teal-400 transition-colors">Features</a>
                        <a href="#how-it-works" className="text-[#94A3B8] hover:text-teal-400 transition-colors">How It Works</a>
                        <a href="https://github.com/sukrit-89" target="_blank" rel="noreferrer" className="text-[#94A3B8] hover:text-teal-400 transition-colors">GitHub</a>

                        {connected ? (
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-500 font-mono">
                                    {address.slice(0, 6)}...{address.slice(-4)}
                                </span>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={disconnect}
                                    className="px-4 py-2 border border-red-600/50 bg-red-600/10 text-red-400 rounded-lg hover:bg-red-600/20 transition-colors"
                                >
                                    Disconnect
                                </motion.button>
                            </div>
                        ) : (
                            <motion.button
                                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(20, 184, 166, 0.6)' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={connect}
                                className="px-6 py-2 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg font-semibold hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg shadow-teal-500/40"
                            >
                                Connect Wallet
                            </motion.button>
                        )}
                    </div>
                </div>
            </motion.nav>

            {/* Hero Section */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 py-24 sm:py-32">
                <div className="text-center">
                    {/* Badge */}
                    <FadeInUp delay={0.2}>
                        <motion.div
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/5 border border-green-500/20 rounded-full text-green-400 mb-8"
                            animate={{ scale: [1, 1.02, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            TESTNET LIVE
                        </motion.div>
                    </FadeInUp>

                    {/* Main Headline */}
                    <FadeInUp delay={0.3}>
                        <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold mb-6">
                            <span className="bg-gradient-to-r from-teal-400 via-teal-500 to-cyan-300 bg-clip-text text-transparent">
                                Earn 5% APY
                            </span>
                            <br />
                            <span className="text-white">
                                while paying freelancers
                            </span>
                        </h1>
                    </FadeInUp>

                    <FadeInUp delay={0.4}>
                        <p className="text-xl sm:text-2xl text-gray-400 mb-4 max-w-3xl mx-auto">
                            First yield-generating escrow on Stellar
                        </p>
                        <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
                            Your escrowed funds earn real yields from US Treasury-backed OUSG tokens. Stop losing money on idle escrow.
                        </p>
                    </FadeInUp>

                    {/* CTAs */}
                    <FadeInUp delay={0.5}>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                            <motion.button
                                whileHover={{ scale: 1.05, boxShadow: '0 20px 50px rgba(20, 184, 166, 0.5)' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/client')}
                                className="px-8 py-4 bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl font-semibold text-lg shadow-lg shadow-teal-500/40 transition-all"
                            >
                                🚀 Start Earning Now
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05, borderColor: 'rgba(20, 184, 166, 0.5)' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/freelancer')}
                                className="px-8 py-4 border-2 border-teal-500/20 backdrop-blur rounded-xl font-semibold text-lg hover:bg-white/5 hover:border-teal-500/50 transition-all"
                            >
                                💼 Browse Jobs
                            </motion.button>
                        </div>
                    </FadeInUp>

                    {/* Yield Calculator Visual */}
                    <FadeInUp delay={0.6}>
                        <motion.div
                            className="max-w-2xl mx-auto p-8 bg-[#0F172A] backdrop-blur-xl border border-teal-500/10 rounded-2xl"
                            whileHover={hoverLift.hover}
                            initial={hoverLift.rest}
                        >
                            <div className="text-sm text-gray-500 mb-4">Example: 3-month project</div>
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <div className="text-gray-500 text-sm mb-2">Traditional Escrow</div>
                                    <div className="text-3xl font-bold text-gray-600">$0</div>
                                    <div className="text-sm text-gray-700">yield earned</div>
                                </div>
                                <div>
                                    <div className="text-gray-500 text-sm mb-2">Yieldra</div>
                                    <AnimatedCounter
                                        value={125}
                                        prefix="$"
                                        className="text-3xl font-bold text-teal-400"
                                    />
                                    <div className="text-sm text-cyan-400">yield earned (5% APY)</div>
                                </div>
                            </div>
                        </motion.div>
                    </FadeInUp>
                </div>
            </section>

            {/* Statistics Section */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 py-16">
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            variants={fadeInUp}
                            whileHover={hoverLift.hover}
                            className="p-6 bg-[#0F172A] backdrop-blur-xl border border-teal-500/10 rounded-xl text-center hover:border-teal-500/30 transition-all"
                        >
                            <AnimatedCounter
                                value={stat.value}
                                prefix={stat.prefix}
                                suffix={stat.suffix}
                                decimals={stat.suffix.includes('%') ? 1 : 0}
                                className="text-3xl font-bold text-orange-500"
                            />
                            <div className="text-sm text-gray-500 mt-2">{stat.label}</div>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* Features Section */}
            <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-24">
                <FadeInUp>
                    <h2 className="text-4xl sm:text-5xl font-bold text-center mb-4">
                        <span className="bg-gradient-to-r from-teal-400 to-cyan-300 bg-clip-text text-transparent">
                            Why Yieldra?
                        </span>
                    </h2>
                    <p className="text-gray-500 text-center text-lg mb-16 max-w-2xl mx-auto">
                        The only escrow platform that makes YOU money while protecting your payments
                    </p>
                </FadeInUp>

                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            variants={fadeInUp}
                            whileHover={{ scale: 1.05, y: -8, borderColor: 'rgba(249, 115, 22, 0.3)' }}
                            className="p-6 bg-[#0F172A] backdrop-blur-xl border border-teal-500/10 rounded-xl hover:bg-[#1a2332] hover:border-teal-500/30 transition-all cursor-pointer"
                        >
                            <div className="text-5xl mb-4">{feature.icon}</div>
                            <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
                            <p className="text-gray-500 text-sm">{feature.description}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* CTA Section */}
            <section className="relative z-10 max-w-4xl mx-auto px-6 py-24">
                <FadeInUp>
                    <motion.div
                        className="p-12 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 backdrop-blur-xl border border-teal-500/20 rounded-3xl text-center"
                        whileHover={{ scale: 1.02, borderColor: 'rgba(249, 115, 22, 0.4)' }}
                    >
                        <h2 className="text-4xl font-bold mb-4">
                            Ready to earn while you pay?
                        </h2>
                        <p className="text-gray-500 text-lg mb-8">
                            Join thousands earning passive income on their escrow
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: '0 20px 50px rgba(249, 115, 22, 0.5)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/client')}
                            className="px-10 py-5 bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl font-bold text-xl shadow-xl shadow-teal-500/40 transition-all"
                        >
                            Get Started Free →
                        </motion.button>
                    </motion.div>
                </FadeInUp>
            </section>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/5 mt-24 py-12">
                <div className="max-w-7xl mx-auto px-6 text-center text-gray-600">
                    <p>Built with ❤️ on Stellar Blockchain</p>
                    <p className="mt-2 text-sm">© 2026 Yieldra. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
