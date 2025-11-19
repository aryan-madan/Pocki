import React, { useContext, useEffect, useState, useRef } from 'react';
import { WalletContext, ThemeContext } from '../../App';
import { TokenBalance, Transaction as TxType } from '../../types';
import { ethers } from 'ethers';
import { FaPaperPlane, FaArrowDown, FaArrowUp, FaEthereum, FaLock, FaClock, FaWallet, FaCompass, FaCircleUser, FaQrcode, FaSun, FaMoon, FaArrowRotateRight } from 'react-icons/fa6';
import { AnimatedButton, AssetSkeleton, ActivitySkeleton, ICON_MAP } from './Shared';
import gsap from 'gsap';

// --- UTILITY FUNCTIONS ---
const formatBalance = (balance: string, decimals = 5) => parseFloat(balance).toFixed(decimals);
const timeAgo = (timestamp: string) => {
    const seconds = Math.floor((new Date().getTime() - parseInt(timestamp) * 1000) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}y ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}mo ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}d ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)}m ago`;
    return `${Math.floor(seconds)}s ago`;
};

// --- HEADER ---
const Header = ({ onScan, onProfileClick, userName }: { onScan: () => void, onProfileClick: () => void, userName: string | null }) => {
    const { lockWallet, cardIcon } = useContext(WalletContext);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const CardIcon = cardIcon ? ICON_MAP[cardIcon] : FaCircleUser;
    
    return (
        <header className="flex justify-between items-center p-4 pt-6 relative z-10">
            <button onClick={onProfileClick} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <CardIcon className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold">{userName ? `${userName}'s` : 'My Wallet'}</h1>
            </button>
            <div className="flex items-center gap-4 text-xl text-text-primary">
                 <button onClick={toggleTheme} className="text-text-primary">
                    {theme === 'dark' ? <FaSun /> : <FaMoon />}
                 </button>
                 <button onClick={lockWallet} className="text-text-primary">
                    <FaLock />
                 </button>
                <button onClick={onScan} className="text-text-primary">
                    <FaQrcode />
                </button>
            </div>
        </header>
    );
};

// --- BOTTOM NAV ---
const BottomNav = ({ activeTab, onTabChange }: { activeTab: string, onTabChange: (view: 'wallet' | 'activity' | 'explore') => void }) => (
    <div className="absolute bottom-0 left-0 right-0 bg-surface/80 dark:bg-surface/80 backdrop-blur-sm border-t border-separator z-20">
        <div className="flex justify-around items-center h-20 pb-4">
            <button onClick={() => onTabChange('activity')} className={`transition-colors p-4 ${activeTab === 'activity' ? 'text-text-primary' : 'text-text-secondary'}`}><FaClock className="w-7 h-7" /></button>
            <button onClick={() => onTabChange('wallet')} className={`transition-colors p-4 ${activeTab === 'wallet' ? 'text-text-primary' : 'text-text-secondary'}`}><FaWallet className="w-7 h-7" /></button>
            <button onClick={() => onTabChange('explore')} className={`transition-colors p-4 ${activeTab === 'explore' ? 'text-text-primary' : 'text-text-secondary'}`}><FaCompass className="w-7 h-7" /></button>
        </div>
    </div>
);

const AssetsList = ({ ethBalance, balances, loading, onAddToken }) => {
    const listRef = useRef(null);
    
    useEffect(() => {
        if (!loading && listRef.current) {
            gsap.fromTo((listRef.current as HTMLElement).children,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: 'power3.out' }
            );
        }
    }, [loading]);

    if (loading) return <div className="divide-y divide-separator">{Array(5).fill(0).map((_, i) => <AssetSkeleton key={i} />)}</div>;

    return (
        <div ref={listRef} className="divide-y divide-separator pb-24">
            <div className="w-full text-left cursor-default">
                <div className="flex justify-between items-center py-3 px-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-surface-light p-2 rounded-full flex items-center justify-center w-11 h-11"><FaEthereum className="w-7 h-7"/></div>
                        <div>
                            <p className="font-semibold text-lg">Ethereum</p>
                            <p className="text-sm text-text-secondary">{formatBalance(ethBalance.balance)} ETH</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold text-lg">${(ethBalance.balanceUSD).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                </div>
            </div>
            {balances.map(token => (
                 <div key={token.symbol} className="w-full text-left cursor-default">
                     <div className="flex justify-between items-center py-3 px-4">
                         <div className="flex items-center gap-4">
                             <img src={token.logo} alt={token.name} className="w-11 h-11 rounded-full bg-white"/>
                             <div>
                                 <p className="font-semibold text-lg">{token.name}</p>
                                 <p className="text-sm text-text-secondary">{formatBalance(token.balance)} {token.symbol}</p>
                             </div>
                         </div>
                         <div className="text-right">
                             <p className="font-semibold text-lg">${token.balanceUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                         </div>
                     </div>
                 </div>
                )
            )}
             <div className="py-4 text-center">
                <button onClick={onAddToken} className="text-primary font-bold active:opacity-80 transition-opacity">
                    + Add Token
                </button>
            </div>
        </div>
    );
};

const ActivityList = ({ transactions, loading, address }: { transactions: TxType[], loading: boolean, address: string }) => {
    const listRef = useRef(null);

    useEffect(() => {
        if (!loading && transactions.length > 0 && listRef.current) {
            gsap.fromTo((listRef.current as HTMLElement).children,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: 'power3.out' }
            );
        }
    }, [loading, transactions]);

    if (loading) return <div className="divide-y divide-separator">{Array(5).fill(0).map((_, i) => <ActivitySkeleton key={i} />)}</div>;
    if (transactions.length === 0) return <p className="text-center text-text-secondary mt-8">No transactions yet.</p>;

    return (
        <div ref={listRef} className="divide-y divide-separator pb-24">
            {transactions.map(tx => {
                const isSent = tx.from.toLowerCase() === address.toLowerCase();
                const valueInEth = ethers.formatEther(tx.value);
                return (
                    <a key={tx.hash} href={`https://sepolia.etherscan.io/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="flex justify-between items-center p-4">
                        <div className="flex items-center gap-4">
                            <div className={`p-2.5 rounded-full ${isSent ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
                                {isSent ? <FaArrowUp /> : <FaArrowDown />}
                            </div>
                            <div>
                                <p className="font-semibold capitalize">{isSent ? 'Sent' : 'Received'}</p>
                                <p className="text-sm text-text-secondary">{timeAgo(tx.timeStamp)}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className={`font-semibold`}>
                                {isSent ? '-' : '+'} {parseFloat(valueInEth).toFixed(4)} ETH
                            </p>
                            {tx.isError === "1" && <p className="text-xs text-red-500">Failed</p>}
                        </div>
                    </a>
                );
            })}
        </div>
    );
};

const Home = ({ userName, totalBalanceUSD, ethBalance, balances, transactions, loading, address, onOpenModal, onRefresh }) => {
    const [activeTab, setActiveTab] = useState<'wallet' | 'activity' | 'explore'>('wallet');

    return (
        <div className="h-full flex flex-col">
            <Header onScan={() => onOpenModal('receive')} onProfileClick={() => onOpenModal('card')} userName={userName} />
            { activeTab === 'wallet' ? (
                    <div className="flex-1 flex flex-col overflow-y-auto">
                        <div className="flex justify-between items-start px-4">
                             <div>
                                <button className={`py-2 px-1 text-lg font-bold text-text-primary`}>Tokens</button>
                                <button className="py-2 px-3 text-lg font-bold text-text-secondary opacity-50 cursor-not-allowed">Collectibles</button>
                            </div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-3xl font-bold text-right pt-1">${totalBalanceUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                                <button onClick={onRefresh} disabled={loading.balances || loading.prices || loading.txs} className="text-text-secondary p-2 disabled:opacity-50">
                                    <FaArrowRotateRight className={`w-5 h-5 ${(loading.balances || loading.prices) ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto pt-2">
                             <AssetsList 
                                ethBalance={ethBalance} 
                                balances={balances} 
                                loading={loading.balances || loading.prices}
                                onAddToken={() => onOpenModal('addToken')} 
                             />
                        </div>
                    </div>
                ) : activeTab === 'activity' ? (
                    <div className="flex-1 flex flex-col">
                        <h2 className="text-3xl font-bold px-4 pt-2">Activity</h2>
                        <div className="flex-1 overflow-y-auto pt-2">
                            <ActivityList transactions={transactions} loading={loading.txs} address={address} />
                        </div>
                    </div>
                ) : (
                     <div className="flex-1 flex flex-col items-center justify-center text-text-secondary">
                        <FaCompass className="w-12 h-12 mb-4"/>
                        <p>Explore coming soon</p>
                    </div>
                )}
                <div className="absolute bottom-24 right-6 z-10">
                    <AnimatedButton onClick={() => onOpenModal('send', ethBalance)} className="bg-black dark:bg-white text-white dark:text-black w-16 h-16 rounded-full flex items-center justify-center shadow-xl">
                        <FaPaperPlane className="w-7 h-7" />
                    </AnimatedButton>
                </div>
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
};

export default Home;