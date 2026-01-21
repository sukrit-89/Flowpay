import { motion } from 'framer-motion';

export default function AnimatedGradient() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Main dark background */}
            <div className="absolute inset-0 bg-[#090C10]" />

            {/* Teal glow orbs */}
            <motion.div
                className="absolute -top-20 -left-20 w-[500px] h-[500px] rounded-full blur-3xl opacity-20"
                style={{
                    background: 'radial-gradient(circle, rgba(20, 184, 166, 0.4) 0%, transparent 70%)'
                }}
                animate={{
                    x: [0, 100, 0],
                    y: [0, -50, 0],
                    scale: [1, 1.2, 1]
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: 'easeInOut'
                }}
            />

            <motion.div
                className="absolute bottom-20 right-20 w-[600px] h-[600px] rounded-full blur-3xl opacity-15"
                style={{
                    background: 'radial-gradient(circle, rgba(94, 234, 212, 0.3) 0%, transparent 70%)'
                }}
                animate={{
                    x: [0, -80, 0],
                    y: [0, 50, 0],
                    scale: [1, 1.3, 1]
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 2
                }}
            />

            <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-3xl opacity-10"
                style={{
                    background: 'radial-gradient(circle, rgba(20, 184, 166, 0.5) 0%, transparent 70%)'
                }}
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.08, 0.12, 0.08]
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: 'easeInOut'
                }}
            />

            {/* Subtle animated grid */}
            <motion.div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(20, 184, 166, 0.3) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(20, 184, 166, 0.3) 1px, transparent 1px)
                    `,
                    backgroundSize: '60px 60px'
                }}
                animate={{
                    backgroundPosition: ['0px 0px', '60px 60px']
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: 'linear'
                }}
            />

            {/* Vignette effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#090C10]/90 via-transparent to-[#090C10]/70" />

            {/* Top accent glow line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />
        </div>
    );
}
