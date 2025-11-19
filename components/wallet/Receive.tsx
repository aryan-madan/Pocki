import React, { useContext, useState, useEffect, useRef } from 'react';
import { WalletContext } from '../../App';
import { AnimatedButton } from './Shared';
import { FaXmark, FaCopy } from 'react-icons/fa6';
import QRCode from 'react-qr-code';
import gsap from 'gsap';

const colorOptions = [
    { name: 'black', fg: '#000000', bg: '#FFFFFF' },
    { name: 'blue', fg: '#007AFF', bg: '#003366' },
    { name: 'green', fg: '#34C759', bg: '#103F1D' },
    { name: 'purple', fg: '#AF52DE', bg: '#351844' },
    { name: 'red', fg: '#FF3B30', bg: '#4D110E' },
    { name: 'orange', fg: '#FF9500', bg: '#4D2D00' },
    { name: 'white', fg: '#FFFFFF', bg: '#1C1C1E' },
];

const ColorSwatch = ({ fgColor, bgColor, selected, onClick }: { fgColor: string, bgColor: string, selected: boolean, onClick: () => void }) => (
    <button 
        onClick={onClick} 
        className={`w-14 h-14 rounded-full border-2 transition-all duration-200 flex items-center justify-center
            ${selected ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-neutral-800' : 'border-neutral-700'}`} 
        style={{ background: bgColor }}
    >
        <div className="w-10 h-10 rounded-full" style={{ background: fgColor }}></div>
    </button>
);

const Receive = ({ closeModal }: { closeModal: () => void }) => {
    const { address } = useContext(WalletContext);
    const [copied, setCopied] = useState(false);
    const [activeColor, setActiveColor] = useState(() => {
        const savedColorName = localStorage.getItem('pocki_qr_color');
        if (savedColorName) {
            const savedColor = colorOptions.find(c => c.name === savedColorName);
            if (savedColor) return savedColor;
        }
        return colorOptions[0]; // Default
    });
    const [isCustomizing, setIsCustomizing] = useState(false);
    
    const panelRef = useRef<HTMLDivElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);
    const pressTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Cleanup function to clear the timer when the component unmounts.
        // This prevents a state update on an unmounted component, which can lead to errors.
        return () => {
            if (pressTimer.current) {
                clearTimeout(pressTimer.current);
            }
        };
    }, []); // Empty dependency array ensures this runs only on mount and unmount.

    // Save selected color to localStorage
    useEffect(() => {
        localStorage.setItem('pocki_qr_color', activeColor.name);
    }, [activeColor]);

    // GSAP animation for customizer panel
    useEffect(() => {
        if (isCustomizing) {
            gsap.to(backdropRef.current, { autoAlpha: 1, duration: 0.3 });
            gsap.fromTo(panelRef.current, { y: '100%' }, { y: '0%', duration: 0.4, ease: 'power3.out' });
        }
    }, [isCustomizing]);

    const closeCustomizer = () => {
        if (!isCustomizing) return;
        gsap.to(backdropRef.current, { autoAlpha: 0, duration: 0.3 });
        gsap.to(panelRef.current, { y: '100%', duration: 0.4, ease: 'power3.in', onComplete: () => {
            setIsCustomizing(false);
        }});
    };

    const handlePressStart = () => {
        pressTimer.current = setTimeout(() => {
            setIsCustomizing(true);
        }, 500); // 500ms for long press
    };

    const handlePressEnd = () => {
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="h-full flex flex-col p-4 bg-black text-white rounded-t-3xl overflow-hidden relative">
            <header className="flex justify-between items-center mb-4 mt-2">
                <h1 className="text-xl font-bold">Receive</h1>
                <AnimatedButton onClick={closeModal} className="text-2xl text-neutral-500"><FaXmark /></AnimatedButton>
            </header>
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                <div 
                    onPointerDown={handlePressStart}
                    onPointerUp={handlePressEnd}
                    onPointerLeave={handlePressEnd}
                    onTouchStart={handlePressStart}
                    onTouchEnd={handlePressEnd}
                    className="p-10 rounded-3xl transition-all duration-300 flex items-center justify-center cursor-pointer select-none" 
                    style={{ background: activeColor.bg }}
                >
                     <QRCode
                        value={address}
                        size={256}
                        bgColor={activeColor.bg}
                        fgColor={activeColor.fg}
                        level="H"
                    />
                </div>
                <p className="text-sm text-neutral-500 mt-4">Press and hold QR code to customize</p>
            </div>

            <div className="p-4 pt-0">
                <p className="text-sm text-neutral-400 mb-2">Your Address</p>
                <div className="bg-neutral-800 p-3 rounded-2xl flex items-center justify-between w-full">
                    <span className="text-sm break-all font-mono">{address}</span>
                    <AnimatedButton onClick={copyToClipboard} className="text-primary ml-2"><FaCopy className="w-4 h-4" /></AnimatedButton>
                </div>
                {copied && <p className="text-sm text-primary mt-3 text-center">Copied to clipboard!</p>}
            </div>

            {isCustomizing && (
                <>
                    <div ref={backdropRef} onClick={closeCustomizer} className="absolute inset-0 bg-black/50 invisible opacity-0" />
                    <div ref={panelRef} className="absolute bottom-0 left-0 right-0 bg-neutral-800 rounded-t-3xl p-6 transform translate-y-full">
                        <div className="w-12 h-1.5 bg-neutral-700 rounded-full mx-auto mb-4"></div>
                        <p className="font-bold text-center mb-6">Customize QR Code</p>
                        <div className="flex justify-center flex-wrap gap-4">
                            {colorOptions.map(opt => 
                                <ColorSwatch 
                                    key={opt.name} 
                                    fgColor={opt.fg}
                                    bgColor={opt.bg}
                                    selected={activeColor.name === opt.name} 
                                    onClick={() => setActiveColor(opt)} 
                                />
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Receive;