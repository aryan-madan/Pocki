import React, { useRef } from 'react';
import { FaSun, FaStar, FaRocket, FaBolt, FaUserAstronaut } from 'react-icons/fa6';
import gsap from 'gsap';

export const ICON_MAP = { FaSun, FaStar, FaRocket, FaBolt, FaUserAstronaut };

export const AnimatedButton = ({ onClick, children, className, disabled = false }: { onClick?: () => void; children: React.ReactNode; className?: string; disabled?: boolean; }) => {
    const btnRef = useRef<HTMLButtonElement>(null);
    const handleTap = () => {
        if(disabled) return;
        gsap.to(btnRef.current, { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 });
        if(onClick) onClick();
    }
    return <button ref={btnRef} onClick={handleTap} className={className} disabled={disabled}>{children}</button>
}

export const AssetSkeleton = () => (
    <div className="flex justify-between items-center py-3 px-4 animate-pulse">
        <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-surface-light"></div>
            <div>
                <div className="h-4 w-20 bg-surface-light rounded"></div>
                <div className="h-3 w-16 bg-surface-light rounded mt-2"></div>
            </div>
        </div>
        <div className="text-right">
            <div className="h-4 w-24 bg-surface-light rounded"></div>
        </div>
    </div>
);

export const ActivitySkeleton = () => (
     <div className="flex justify-between items-center p-4 animate-pulse">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-surface-light"></div>
            <div>
                <div className="h-4 w-20 bg-surface-light rounded"></div>
                <div className="h-3 w-16 bg-surface-light rounded mt-2"></div>
            </div>
        </div>
        <div className="text-right">
            <div className="h-4 w-24 bg-surface-light rounded"></div>
        </div>
    </div>
)