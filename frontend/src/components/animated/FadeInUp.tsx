import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { fadeInUp } from '../../animations/variants';
import { useInView } from 'react-intersection-observer';

interface FadeInUpProps {
    children: ReactNode;
    delay?: number;
    className?: string;
}

export default function FadeInUp({ children, delay = 0, className = '' }: FadeInUpProps) {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1
    });

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            variants={fadeInUp}
            transition={{ delay }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
