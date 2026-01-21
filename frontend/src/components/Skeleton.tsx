import { motion } from 'framer-motion';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string;
    height?: string;
}

export default function Skeleton({
    className = '',
    variant = 'rectangular',
    width,
    height
}: SkeletonProps) {
    const baseClasses = 'bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-pulse';

    const variantClasses = {
        text: 'h-4 rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-lg'
    };

    const style = {
        width: width || (variant === 'circular' ? '40px' : '100%'),
        height: height || (variant === 'text' ? '1rem' : variant === 'circular' ? '40px' : '200px')
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
        />
    );
}

// Pre-built skeleton components
export function JobCardSkeleton() {
    return (
        <div className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-4">
            <div className="flex justify-between">
                <div className="flex-1 space-y-3">
                    <Skeleton variant="text" width="60%" height="24px" />
                    <Skeleton variant="text" width="100%" />
                    <Skeleton variant="text" width="80%" />
                    <div className="flex gap-2">
                        <Skeleton variant="rectangular" width="80px" height="24px" />
                        <Skeleton variant="rectangular" width="80px" height="24px" />
                        <Skeleton variant="rectangular" width="80px" height="24px" />
                    </div>
                </div>
                <Skeleton variant="rectangular" width="100px" height="80px" />
            </div>
            <Skeleton variant="rectangular" width="100%" height="40px" />
        </div>
    );
}

export function DashboardStatSkeleton() {
    return (
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-2">
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" height="36px" />
        </div>
    );
}
