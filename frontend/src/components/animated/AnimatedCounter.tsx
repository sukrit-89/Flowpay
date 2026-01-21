import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';

interface AnimatedCounterProps {
    value: number;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    duration?: number;
    className?: string;
}

export default function AnimatedCounter({
    value,
    prefix = '',
    suffix = '',
    decimals = 0,
    duration = 2,
    className = ''
}: AnimatedCounterProps) {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.5
    });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5 }}
            className={className}
        >
            {inView && (
                <CountUp
                    start={0}
                    end={value}
                    prefix={prefix}
                    suffix={suffix}
                    decimals={decimals}
                    duration={duration}
                    separator=","
                />
            )}
        </motion.div>
    );
}
