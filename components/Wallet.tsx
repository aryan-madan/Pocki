import React, { useContext, useEffect, useState, useCallback, useRef } from 'react';
import { WalletContext } from '../App';
import { TokenBalance, Transaction as TxType } from '../types';
import { ETHERSCAN_API_KEY, ETHERSCAN_API_URL, SEPOLIA_CHAIN_ID, ALCHEMY_PRICES_API_URL, ALCHEMY_PRICES_API_KEY } from '../constants';
import { ethers } from 'ethers';
import Loader from './Loader';

import Home from './wallet/Home';
import Send from './wallet/Send';
import Receive from './wallet/Receive';
import Add from './wallet/Add';
import Card from './wallet/Card';
import gsap from 'gsap';

const Wallet: React.FC = () => {
    const { wallet, address, provider, userName, userTokens, addUserToken } = useContext(WalletContext);
    const [balances, setBalances] = useState<TokenBalance[]>([]);
    const [ethBalance, setEthBalance] = useState({ balance: '0', priceUSD: 0 });
    const [transactions, setTransactions] = useState<TxType[]>([]);
    const [loading, setLoading] = useState({ balances: true, txs: true, prices: true });
    const [error, setError] = useState('');
    const [activeModal, setActiveModal] = useState<{ type: 'send' | 'receive' | 'addToken' | 'card', asset?: TokenBalance | null } | null>(null);

    const modalBackdropRef = useRef<HTMLDivElement>(null);
    const modalContentRef = useRef<HTMLDivElement>(null);

    const closeModal = useCallback((callback?: () => void) => {
        const tl = gsap.timeline({
            onComplete: () => {
                setActiveModal(null);
                if (callback) callback();
            }
        });
        tl.to(modalContentRef.current, { y: '100vh', duration: 0.4, ease: 'power3.in' });
        tl.to(modalBackdropRef.current, { opacity: 0, duration: 0.4, ease: 'power2.inOut' }, "<");
    }, []);

    const openModal = (type: 'send' | 'receive' | 'addToken' | 'card', asset: TokenBalance | null = null) => {
        setActiveModal({ type, asset });
    }
    
    useEffect(() => {
        if (activeModal && activeModal.type !== 'card' && modalContentRef.current) {
            const tl = gsap.timeline();
            tl.fromTo(modalBackdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.inOut' });
            tl.fromTo(modalContentRef.current, { y: '100vh' }, { y: '0', duration: 0.5, ease: 'power3.out' }, "<");
        }
    }, [activeModal]);
    
    const fetchAll = useCallback(async () => {
        if (!wallet) return;
        setLoading(prev => ({ ...prev, balances: true, txs: true, prices: true }));
        
        const fetchTokenPrices = async (symbols: string[]): Promise<Record<string, number>> => {
            if (symbols.length === 0) return {};
            const url = `${ALCHEMY_PRICES_API_URL}?symbols=${symbols.join(',')}`;
            try {
                const response = await fetch(url, { headers: { 'Authorization': `Bearer ${ALCHEMY_PRICES_API_KEY}` }});
                if(!response.ok) throw new Error("Price API request failed");
                const data = await response.json();
                const prices: Record<string, number> = {};
                if (data.data) {
                    data.data.forEach(item => {
                        if (item.symbol && item.prices?.[0]?.value) {
                            prices[item.symbol] = parseFloat(item.prices[0].value);
                        }
                    });
                }
                return prices;
            } catch (e) { console.error("Failed to fetch token prices:", e); return {}; }
        };

        const symbolsToFetch = ['ETH', ...userTokens.map(t => t.symbol.toUpperCase())];
        const prices = await fetchTokenPrices(symbolsToFetch);
        setLoading(prev => ({ ...prev, prices: false }));
        
        const fetchBalances = async () => {
            try {
                const ethBal = await provider.getBalance(wallet.address);
                const ethPrice = prices['ETH'] || 0;
                setEthBalance({ balance: ethers.formatEther(ethBal), priceUSD: ethPrice });
                
                const tokenBalances = await Promise.all(userTokens.map(async (token): Promise<TokenBalance> => {
                    try {
                        const checksumAddress = ethers.getAddress(token.address);
                        const contract = new ethers.Contract(checksumAddress, token.abi, provider);
                        const [balance, decimals] = await Promise.all([ contract.balanceOf(wallet.address), contract.decimals() ]);
                        const formattedBalance = ethers.formatUnits(balance, decimals);
                        const price = prices[token.symbol.toUpperCase()] || 0;
                        const balanceUSD = parseFloat(formattedBalance) * price;
                        return { ...token, balance: formattedBalance, balanceUSD, priceUSD: price };
                    } catch (e) {
                        console.error(`Failed to fetch balance for ${token.symbol}:`, e);
                        return { ...token, balance: '0', balanceUSD: 0, priceUSD: 0 };
                    }
                }));
                setBalances(tokenBalances);
            } catch (e) { console.error("Balance fetch error:", e); setError("Failed to fetch balances."); }
            finally { setLoading(prev => ({ ...prev, balances: false })); }
        };

        const fetchTransactions = async () => {
            if (!address || ETHERSCAN_API_KEY === 'YOUR_ETHERSCAN_API_KEY') {
                if(ETHERSCAN_API_KEY === 'YOUR_ETHERSCAN_API_KEY') console.warn("Etherscan API key not set.");
                setLoading(prev => ({ ...prev, txs: false })); return;
            }
            try {
                const url = `${ETHERSCAN_API_URL}?chainid=${SEPOLIA_CHAIN_ID}&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&page=1&offset=20&apikey=${ETHERSCAN_API_KEY}`;
                const res = await fetch(url);
                const data = await res.json();
                if (data.status === "1") {
                    setTransactions(data.result);
                } else if (data.status === "0" && data.message === "No transactions found") {
                    setTransactions([]);
                } else if (data.status === "0") {
                    console.warn("Etherscan API error:", data.message, data.result);
                }
            } catch (e) { console.error(e); setError("Failed to fetch transactions."); }
            finally { setLoading(prev => ({ ...prev, txs: false })); }
        };
        
        await Promise.all([fetchBalances(), fetchTransactions()]);
    }, [wallet, provider, address, userTokens]);

    useEffect(() => { fetchAll(); }, [fetchAll]);
    
    if (!wallet) return <div className="h-full flex items-center justify-center"><Loader /></div>;
    
    const ethTokenBalance: TokenBalance = {
      name: 'Ethereum', symbol: 'ETH', address: '', abi: [], logo: '',
      balance: ethBalance.balance, balanceUSD: parseFloat(ethBalance.balance) * ethBalance.priceUSD, priceUSD: ethBalance.priceUSD
    };

    const totalBalanceUSD = balances.reduce((acc, token) => acc + token.balanceUSD, parseFloat(ethBalance.balance) * ethBalance.priceUSD);

    const renderModalContent = () => {
        if (!activeModal) return null;
        switch (activeModal.type) {
            case 'send':
                return <Send closeModal={() => closeModal(fetchAll)} balances={balances} ethBalance={ethTokenBalance} initialAsset={activeModal.asset || ethTokenBalance}/>;
            case 'receive':
                return <Receive closeModal={closeModal} />;
            case 'addToken':
                return <Add closeModal={() => closeModal(fetchAll)} addUserToken={addUserToken} />;
            case 'card':
                 return <Card onClose={() => setActiveModal(null)} />;
            default:
                return null;
        }
    };

    return (
        <div className="h-full flex flex-col bg-surface relative overflow-hidden">
             <Home 
                userName={userName}
                totalBalanceUSD={totalBalanceUSD}
                ethBalance={ethTokenBalance}
                balances={balances}
                transactions={transactions}
                loading={loading}
                address={address}
                onOpenModal={openModal}
                onRefresh={fetchAll}
            />

            {/* Modals */}
            {activeModal && activeModal.type !== 'card' && (
                 <div className="absolute inset-0 z-20 flex flex-col justify-end">
                    <div 
                        ref={modalBackdropRef} 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                        onClick={() => closeModal()}
                    ></div>
                    <div ref={modalContentRef} className="absolute inset-0">
                        {renderModalContent()}
                    </div>
                </div>
            )}
            {activeModal && activeModal.type === 'card' && renderModalContent()}
        </div>
    );
};

export default Wallet;