import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import FadeInUp from './animated/FadeInUp';
import AnimatedCounter from './animated/AnimatedCounter';

export default function Landing() {
    const navigate = useNavigate();
    const { address, connected, connect, disconnect } = useWallet();

    const features = [
        {
            icon: '💰',
            title: 'Passive Yield',
            description: 'Earn 5% APY on escrowed funds backed by US Treasury tokens'
        },
        {
            icon: '🔒',
            title: 'Secure Escrow',
            description: 'Milestone-based payments protected by blockchain contracts'
        },
        {
            icon: '🌍',
            title: 'Global Payments',
            description: 'Accept XLM, USDC, or stablecoins in INR, KES, NGN'
        },
        {
            icon: '⚡',
            title: 'Instant Settlement',
            description: 'Near-zero fees and immediate transaction confirmation'
        }
    ];

    const stats = [
        { label: 'Value Locked', value: 142.8, suffix: 'M', prefix: '$' },
        { label: 'Average APY', value: 5.0, suffix: '%' },
        { label: 'Active Projects', value: 1247, suffix: '+' },
        { label: 'Freelancers', value: 5890, suffix: '+' }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
            {/* Navigation */}
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur"
            >
                <div className="container-max flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                        <img
                            src="/yieldra_teal_logo_1769009161049.png"
                            alt="Yieldra"
                            className="w-9 h-9 object-contain"
                        />
                        <span className="text-xl font-bold text-slate-900">Yieldra</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium">
                            Features
                        </a>
                        <a href="#how-it-works" className="text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium">
                            How it works
                        </a>
                        <a
                            href="https://github.com/sukrit-89"
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium"
                        >
                            GitHub
                        </a>
                    </div>

                    <div className="flex items-center gap-3">
                        {connected ? (
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-mono text-slate-500">
                                    {address.slice(0, 6)}...{address.slice(-4)}
                                </span>
                                <button
                                    onClick={disconnect}
                                    className="btn btn-secondary btn-sm"
                                >
                                    Disconnect
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={connect}
                                className="btn btn-primary btn-sm"
                            >
                                Connect Wallet
                            </button>
                        )}
                    </div>
                </div>
            </motion.nav>

            {/* Hero Section */}
            <section className="relative py-24 sm:py-32 md:py-40 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Badge */}
                    <FadeInUp delay={0.1}>
                        <motion.div
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-xs font-semibold mb-6"
                            animate={{ scale: [1, 1.01, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse" />
                            Testnet Live
                        </motion.div>
                    </FadeInUp>

                    {/* Headline */}
                    <FadeInUp delay={0.2}>
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight mb-6">
                            Earn yield while you pay
                        </h1>
                    </FadeInUp>

                    {/* Subheading */}
                    <FadeInUp delay={0.3}>
                        <p className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-10 mx-auto max-w-2xl">
                            The only escrow platform that generates passive income on your deposits. Stop losing money on idle funds—earn 5% APY while protecting your payments with blockchain.
                        </p>
                    </FadeInUp>

                    {/* CTA Buttons */}
                    <FadeInUp delay={0.4}>
                        <div className="flex flex-col sm:flex-row gap-4 mb-16 justify-center">
                            <motion.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/client')}
                                className="btn btn-primary btn-lg"
                            >
                                Start Earning Now
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/freelancer')}
                                className="btn btn-tertiary btn-lg"
                            >
                                Browse Opportunities
                            </motion.button>
                        </div>
                    </FadeInUp>

                    {/* Yield Comparison Card */}
                    <FadeInUp delay={0.5}>
                        <motion.div
                            className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-lg mx-auto max-w-2xl"
                            whileHover={{ scale: 1.01, y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                        >
                            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-6">Example: $10,000 for 3 months</p>
                            <div className="grid sm:grid-cols-2 gap-8 sm:gap-12">
                                <div>
                                    <p className="text-sm text-slate-600 font-medium mb-2">Traditional Escrow</p>
                                    <p className="text-4xl font-bold text-slate-900">$0</p>
                                    <p className="text-xs text-slate-500 mt-2">earned in yield</p>
                                </div>
                                <div className="border-l border-slate-200 sm:border-l pl-8 sm:pl-8">
                                    <p className="text-sm text-slate-600 font-medium mb-2">With Yieldra (5% APY)</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-4xl font-bold text-emerald-600">$125</p>
                                        <p className="text-sm text-emerald-600 font-semibold">passive income</p>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">zero extra effort</p>
                                </div>
                            </div>
                        </motion.div>
                    </FadeInUp>
                </div>
            </section>

            {/* Social Proof / Stats Section */}
            <section className="bg-white border-t border-slate-200 py-20 sm:py-28">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1, duration: 0.4 }}
                                viewport={{ once: true }}
                                className="text-center"
                            >
                                <div className="text-sm text-slate-500 font-semibold uppercase tracking-wide mb-3">{stat.label}</div>
                                <div className="flex items-center justify-center gap-1">
                                    <AnimatedCounter
                                        value={stat.value}
                                        prefix={stat.prefix || ''}
                                        className="text-4xl sm:text-5xl font-bold text-slate-900"
                                    />
                                    <span className="text-2xl font-semibold text-slate-600">{stat.suffix}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 sm:py-32 md:py-40 px-4 bg-slate-50">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-16 text-center">
                        <FadeInUp>
                            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-4">
                                Why choose Yieldra?
                            </h2>
                            <p className="text-lg sm:text-xl text-slate-600 mx-auto max-w-2xl">
                                Built for freelancers and clients who deserve better
                            </p>
                        </FadeInUp>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {features.map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1, duration: 0.4 }}
                                viewport={{ once: true }}
                                whileHover={{ scale: 1.02, y: -6 }}
                                className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-sm hover:shadow-lg transition-all duration-200"
                            >
                                <div className="text-5xl mb-6">{feature.icon}</div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-4">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-600 leading-relaxed text-lg">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-24 sm:py-32 md:py-40 px-4 bg-white border-t border-slate-200">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-20">
                        <FadeInUp>
                            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900">
                                Simple workflow
                            </h2>
                        </FadeInUp>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12 sm:gap-16">
                        {[
                            { num: '1', title: 'Create a project', desc: 'Clients define milestones and budget' },
                            { num: '2', title: 'Start earning', desc: 'Your funds automatically earn 5% APY' },
                            { num: '3', title: 'Pay on completion', desc: 'Release payment once work is approved' }
                        ].map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.15, duration: 0.4 }}
                                viewport={{ once: true }}
                                className="relative text-center"
                            >
                                <div className="flex justify-center mb-6">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-700 font-bold text-2xl flex items-center justify-center border-2 border-emerald-200 shadow-sm">
                                        {step.num}
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                                    {step.title}
                                </h3>
                                <p className="text-slate-600 text-lg leading-relaxed">
                                    {step.desc}
                                </p>
                                {i < 2 && (
                                    <div className="hidden md:block absolute top-8 left-full w-12 text-slate-300 text-3xl flex items-center justify-center">
                                        →
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-24 sm:py-32 md:py-40 px-4 bg-slate-50">
                <FadeInUp>
                    <motion.div
                        className="bg-white border-2 border-emerald-200 rounded-3xl p-12 sm:p-16 lg:p-20 shadow-lg max-w-4xl mx-auto text-center"
                        whileHover={{ scale: 1.02, y: -4 }}
                    >
                        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
                            Ready to start earning?
                        </h2>
                        <p className="text-lg sm:text-xl text-slate-600 mb-10 mx-auto max-w-2xl leading-relaxed">
                            Join thousands of users generating passive income on escrow. No setup fees, no complications.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/client')}
                            className="btn btn-primary btn-lg"
                        >
                            Get Started Free
                        </motion.button>
                    </motion.div>
                </FadeInUp>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-white py-12">
                <div className="container-max text-center">
                    <p className="text-sm text-slate-600">
                        Built on Stellar Blockchain · © 2026 Yieldra
                    </p>
                </div>
            </footer>
        </div>
    );
}
