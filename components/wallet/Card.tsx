import React, { useContext, useEffect, useRef } from 'react';
import { WalletContext } from '../../App';
import { ICON_MAP } from './Shared';
import { FaSun } from 'react-icons/fa6';
import gsap from 'gsap';

const Card = ({ onClose }: { onClose: () => void }) => {
    const { userName, address, cardColor, cardIcon } = useContext(WalletContext);
    const containerRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        const card = cardRef.current;
        if (!container || !card) return;

        const handleMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e;
            const { left, top, width, height } = container.getBoundingClientRect();
            const x = clientX - left - width / 2;
            const y = clientY - top - height / 2;
            const rotateX = (y / height) * -20;
            const rotateY = (x / width) * 20;
            
            gsap.to(card, {
                rotationX: rotateX,
                rotationY: rotateY,
                duration: 0.7,
                ease: 'power3.out'
            });
        };

        const handleMouseLeave = () => {
            gsap.to(card, {
                rotationX: 0,
                rotationY: 0,
                duration: 1,
                ease: 'elastic.out(1, 0.5)'
            });
        }
        
        gsap.fromTo(container, { opacity: 0 }, { opacity: 1, duration: 0.3 });
        gsap.fromTo(card, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)', delay: 0.1 });


        container.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            container.removeEventListener('mousemove', handleMouseMove);
            container.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    const handleClose = () => {
        gsap.to(containerRef.current, { opacity: 0, duration: 0.3, onComplete: onClose });
    }

    const CardIcon = ICON_MAP[cardIcon] || FaSun;

    return (
        <div ref={containerRef} className="absolute inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center" onClick={handleClose}>
            <div style={{ perspective: '1000px' }} onClick={e => e.stopPropagation()}>
                <div ref={cardRef} style={{ transformStyle: 'preserve-3d' }} className={`w-80 h-48 bg-gradient-to-br ${cardColor} rounded-3xl p-6 shadow-2xl text-white flex flex-col justify-between`}>
                     <div className="flex justify-between items-start">
                        <div className="p-3 bg-white/30 rounded-full">
                           <CardIcon className="w-5 h-5 text-white" />
                        </div>
                        <p className="font-mono text-sm opacity-80">Sepolia Testnet</p>
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-lg">{userName}</p>
                        <p className="font-mono text-sm">{`${address.slice(0, 6)}...${address.slice(-4)}`}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Card;