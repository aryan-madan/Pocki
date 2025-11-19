import React, { useRef, useEffect, useState } from 'react';
import { TokenBalance } from '../../types';
import { AnimatedButton } from './Shared';
import { FaPaperPlane, FaArrowDown, FaEthereum, FaCircleCheck, FaChevronLeft, FaStar, FaEllipsisVertical } from 'react-icons/fa6';
import gsap from 'gsap';

// --- MOCK PRICE HISTORY ---
const generateMockPriceHistory = (basePrice) => {
    const data = [];
    let price = basePrice + Math.random() * 50 - 25;
    for (let i = 0; i < 24; i++) {
        data.push({ time: i, price: price });
        price += Math.random() * 20 - 10;
    }
    return data;
};

const formatBalance = (balance: string, decimals = 5) => parseFloat(balance).toFixed(decimals);

const Chart = ({ data }) => {
    const svgRef = useRef(null);
    const [activePoint, setActivePoint] = useState(null);

    useEffect(() => {
        if (!data || data.length === 0) return;
        const svg = svgRef.current;
        const width = svg.clientWidth;
        const height = svg.clientHeight;

        const maxPrice = Math.max(...data.map(d => d.price));
        const minPrice = Math.min(...data.map(d => d.price));
        const priceRange = maxPrice - minPrice || 1;

        const getX = (i) => (i / (data.length - 1)) * width;
        const getY = (price) => height - ((price - minPrice) / priceRange) * height;

        const pathData = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.price)}`).join(' ');

        const path = svg.querySelector('path');
        path.setAttribute('d', pathData);

        gsap.fromTo(path, { strokeDasharray: 500, strokeDashoffset: 500 }, { strokeDashoffset: 0, duration: 1.5, ease: 'power2.out' });
    }, [data]);
    
    // This is a simplified touch handler. A more robust solution would use a library like d3-selection.
    const handleMouseMove = (e) => {
        const svg = svgRef.current;
        const rect = svg.getBoundingClientRect();
        const x = e.clientX - rect.left;
        
        const index = Math.round((x / rect.width) * (data.length - 1));
        setActivePoint(data[index]);
    }
    
    const handleMouseLeave = () => setActivePoint(null);
    
    if (!data || data.length === 0) return null;

    const maxPrice = Math.max(...data.map(d => d.price));
    const minPrice = Math.min(...data.map(d => d.price));
    const priceRange = maxPrice - minPrice || 1;
    
    const getX = (i) => (i / (data.length - 1)) * 100;
    const getY = (price) => 100 - ((price - minPrice) / priceRange) * 100;


    return (
        <div className="relative h-40 w-full" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
             <svg ref={svgRef} className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="" fill="none" stroke="currentColor" strokeWidth="1"/>
            </svg>
            {activePoint && (
                <div 
                    className="absolute top-0 pointer-events-none"
                    style={{ left: `${getX(activePoint.time)}%`, transform: 'translateX(-50%)' }}
                >
                    <div className="bg-text-primary text-background text-xs rounded-full px-2 py-1">${activePoint.price.toFixed(2)}</div>
                    <div className="w-px h-40 bg-text-primary/50 mx-auto"></div>
                    <div className="w-3 h-3 rounded-full bg-text-primary border-2 border-surface absolute"
                        style={{
                            top: `${getY(activePoint.price)}%`,
                            left: '50%',
                            transform: 'translate(-50%, -50%)'
                        }}
                    ></div>
                </div>
            )}
        </div>
    )
}

const Detail = ({ token, onBack, onSend, onReceive }: { token: TokenBalance, onBack: () => void, onSend: () => void, onReceive: () => void }) => {
    const [priceData, setPriceData] = useState([]);
    const [timeframe, setTimeframe] = useState('1D');
    
    useEffect(() => {
        setPriceData(generateMockPriceHistory(token.priceUSD || 0));
    }, [timeframe, token.priceUSD]);

    const pageRef = useRef(null);
    useEffect(() => {
        gsap.fromTo(pageRef.current, {x: '100%'}, {x: '0%', duration: 0.4, ease: 'power3.out'});
    }, []);

    const handleBack = () => {
        gsap.to(pageRef.current, {x: '100%', duration: 0.4, ease: 'power3.in', onComplete: onBack });
    }
    
    const isEth = token.symbol === 'ETH';

    return (
        <div ref={pageRef} className="absolute inset-0 bg-surface z-10 flex flex-col">
            <header className="flex justify-between items-center p-4">
                <button onClick={handleBack}><FaChevronLeft className="w-7 h-7" /></button>
                <div className="flex items-center gap-4 text-2xl text-text-primary">
                    <button><FaStar className="w-6 h-6" /></button>
                    <button><FaEllipsisVertical className="w-6 h-6" /></button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4">
                <div className="flex items-center gap-4">
                    {isEth ? <div className="bg-surface-light p-3 rounded-full"><FaEthereum className="w-8 h-8"/></div> : <img src={token.logo} alt={token.name} className="w-14 h-14 rounded-full"/>}
                    <div>
                        <div className="flex items-center gap-2">
                           <h1 className="text-3xl font-bold">{token.name}</h1>
                           <FaCircleCheck className="w-6 h-6 text-blue-500" />
                        </div>
                    </div>
                </div>
                
                <div className="my-3">
                    <h2 className="text-4xl font-bold">${(token.priceUSD || 0).toLocaleString()}</h2>
                </div>

                <div className="text-primary">
                    <Chart data={priceData} />
                </div>

                <div className="flex justify-around items-center my-4 bg-surface-light p-1 rounded-full">
                    {['1H', '1D', '1W', '1M', '1Y'].map(tf => (
                        <button key={tf} onClick={() => setTimeframe(tf)} className={`w-full py-1.5 rounded-full text-sm font-bold transition-colors ${timeframe === tf ? 'bg-background dark:bg-neutral-600 shadow' : 'text-text-secondary'}`}>
                            {tf}
                        </button>
                    ))}
                </div>
                
                <div className="grid grid-cols-2 gap-px bg-separator my-6 border border-separator rounded-xl overflow-hidden">
                    <div className="bg-surface p-4">
                        <p className="text-sm text-text-secondary">Balance</p>
                        <div className="flex items-center gap-2 mt-1">
                            {isEth ? <FaEthereum className="w-5 h-5"/> : <img src={token.logo} className="w-5 h-5 rounded-full"/>}
                            <p className="text-lg font-bold">{formatBalance(token.balance, 7)}</p>
                        </div>
                    </div>
                     <div className="bg-surface p-4">
                        <p className="text-sm text-text-secondary">Value</p>
                        <p className="text-lg font-bold mt-1">${token.balanceUSD.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                    </div>
                </div>
                
                 <div className="bg-surface-light p-3 rounded-lg flex items-center gap-2">
                    <span className="text-sm">Owned by</span><span className="font-bold text-sm">You</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 border-t border-separator">
                <AnimatedButton onClick={onReceive} className="w-full bg-surface-light dark:bg-neutral-800 text-text-primary font-bold py-4 rounded-2xl text-lg flex items-center justify-center gap-2">
                    <FaArrowDown /> Receive
                </AnimatedButton>
                <AnimatedButton onClick={onSend} className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-4 rounded-2xl text-lg flex items-center justify-center gap-2">
                    <FaPaperPlane /> Send
                </AnimatedButton>
            </div>
        </div>
    );
};

export default Detail;