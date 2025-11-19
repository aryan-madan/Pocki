import React, { useContext, useState, useRef, useEffect } from 'react';
import { ethers } from 'ethers';
import { WalletContext } from '../../App';
import { TokenBalance } from '../../types';
import { AnimatedButton } from './Shared';
import { FaXmark, FaDeleteLeft, FaRightLeft, FaCircleCheck, FaTriangleExclamation, FaChevronDown, FaEthereum } from 'react-icons/fa6';
import Loader from '../Loader';
import gsap from 'gsap';

const formatBalance = (balance: string, decimals = 5) => parseFloat(balance).toFixed(decimals);

const Numpad = ({ onKeyPress }: { onKeyPress: (key: string) => void }) => {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];
    return (
        <div className="grid grid-cols-3 gap-1">
            {keys.map((key) => (
                <AnimatedButton 
                    key={key} 
                    onClick={() => onKeyPress(key)} 
                    className="py-4 text-3xl font-light rounded-2xl text-white bg-transparent active:bg-neutral-800 flex justify-center items-center transition-colors duration-200"
                >
                    {key === 'del' ? <FaDeleteLeft className="w-7 h-7"/> : key}
                </AnimatedButton>
            ))}
        </div>
    );
};

const AssetSelector = ({ ethBalance, balances, onSelect, onClose }) => {
    const selectorRef = useRef(null);

    useEffect(() => {
        gsap.fromTo(selectorRef.current, { y: '100%' }, { y: '0%', duration: 0.4, ease: 'power3.out' });
    }, []);

    const allAssets = [ethBalance, ...balances];

    return (
        <div className="absolute inset-0 flex flex-col justify-end z-30">
            <div className="absolute inset-0 bg-black/70" onClick={onClose}></div>
            <div ref={selectorRef} className="bg-neutral-900 rounded-t-3xl p-4 flex flex-col max-h-[75%]">
                <div className="text-center pb-2">
                    <h2 className="text-xl font-bold">Select an Asset</h2>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-neutral-800">
                    {allAssets.map(asset => (
                        <button key={asset.symbol} onClick={() => onSelect(asset)} className="w-full flex items-center gap-4 py-4 text-left">
                           { asset.symbol === 'ETH' ? 
                                <div className="bg-neutral-800 p-2.5 rounded-full flex items-center justify-center w-11 h-11"><FaEthereum className="w-6 h-6"/></div> :
                                <img src={asset.logo} className="w-11 h-11 rounded-full"/>
                            }
                            <div>
                                <p className="font-bold">{asset.name}</p>
                                <p className="text-sm text-neutral-400">{formatBalance(asset.balance)} {asset.symbol}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

const Send = ({ closeModal, balances, ethBalance, initialAsset }) => {
    const { wallet, provider, userTokens } = useContext(WalletContext);
    const [step, setStep] = useState('input');
    const [to, setTo] = useState('');
    const [amount, setAmount] = useState('0');
    const [inputMode, setInputMode] = useState<'USD' | 'TOKEN'>('TOKEN');
    const [selectedAsset, setSelectedAsset] = useState(initialAsset);
    
    const [gasFee, setGasFee] = useState<string | null>(null);
    const [txHash, setTxHash] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isAssetSelectorOpen, setIsAssetSelectorOpen] = useState(false);

    const amountRef = useRef(null);

    const assetBalance = selectedAsset.balance;
    const assetPrice = selectedAsset.priceUSD || 0;
    
    const usdAmount = inputMode === 'USD' ? parseFloat(amount || '0') : parseFloat(amount || '0') * assetPrice;
    const tokenAmount = inputMode === 'TOKEN' ? parseFloat(amount || '0') : (assetPrice > 0 ? parseFloat(amount || '0') / assetPrice : 0);
    const tokenAmountString = isNaN(tokenAmount) ? '0' : tokenAmount.toFixed(18);

    useEffect(() => {
        gsap.fromTo(amountRef.current, { scale: 1.05 }, { scale: 1, duration: 0.2, ease: 'power3.out' });
    }, [amount]);

    const handleNumpad = (key: string) => {
        setError('');
        let newAmount = amount;
        if (key === 'del') {
            newAmount = amount.length > 1 ? amount.slice(0, -1) : '0';
        } else if (key === '.') {
            if (!amount.includes('.')) newAmount = amount + '.';
        } else {
            newAmount = (amount === '0' && key !== '.') ? key : amount + key;
        }
        const parts = newAmount.split('.');
        const maxDecimals = (inputMode === 'USD' || selectedAsset.symbol === 'USDC') ? 2 : 8;
        if (parts[1] && parts[1].length > maxDecimals) return;
        setAmount(newAmount);
    };
    
    const handleSetMax = () => {
        if (inputMode === 'USD') {
          const maxUsd = parseFloat(assetBalance) * assetPrice;
          setAmount(maxUsd.toFixed(2));
        } else {
          setAmount(parseFloat(assetBalance).toFixed(8));
        }
    }
    
    const handleContinue = async () => {
        setError('');
        let checksumAddress;
        try {
            checksumAddress = ethers.getAddress(to);
        } catch {
             setError('Invalid recipient address.'); return;
        }

        if (isNaN(tokenAmount) || tokenAmount <= 0) { setError('Please enter a valid amount.'); return; }
        if (tokenAmount > parseFloat(assetBalance)) { setError('Insufficient funds.'); return; }

        setLoading(true);
        try {
            let feeInEth: string;
            if (selectedAsset.symbol === 'ETH') {
                const value = ethers.parseEther(tokenAmountString);
                const gasLimit = await provider.estimateGas({ to: checksumAddress, value });
                const feeData = await provider.getFeeData();
                if (!feeData.gasPrice) throw new Error("Could not get gas price");
                feeInEth = ethers.formatEther(feeData.gasPrice * gasLimit);
            } else {
                const token = userTokens.find(t => t.symbol === selectedAsset.symbol);
                if(!token) throw new Error("Token not found");
                const contract = new ethers.Contract(ethers.getAddress(token.address), token.abi, provider);
                const decimals = await contract.decimals();
                const value = ethers.parseUnits(tokenAmountString, decimals);
                const gasLimit = await contract.transfer.estimateGas(checksumAddress, value, { from: wallet.address });
                const feeData = await provider.getFeeData();
                if (!feeData.gasPrice) throw new Error("Could not get gas price");
                feeInEth = ethers.formatEther(feeData.gasPrice * gasLimit);
            }
            setGasFee(feeInEth);
            setStep('confirm');
        } catch (e) { console.error(e); setError('Could not estimate transaction fee.'); } 
        finally { setLoading(false); }
    }

    const handleSendTransaction = async () => {
        if (!wallet) return;
        setStep('sending');
        const checksumAddress = ethers.getAddress(to);
        try {
            let tx;
            if (selectedAsset.symbol === 'ETH') {
                tx = await wallet.sendTransaction({ to: checksumAddress, value: ethers.parseEther(tokenAmountString) });
            } else {
                const token = userTokens.find(t => t.symbol === selectedAsset.symbol);
                if(!token) throw new Error("Token not found");
                const contract = new ethers.Contract(ethers.getAddress(token.address), token.abi, wallet);
                const decimals = await contract.decimals();
                const value = ethers.parseUnits(tokenAmountString, decimals);
                tx = await contract.transfer(checksumAddress, value);
            }
            setTxHash(tx.hash);
            await tx.wait();
            setStep('success');
        } catch (e) {
            console.error(e);
            setError('Transaction failed. Please try again.');
            setStep('error');
        }
    }
    
    const handleSelectAsset = (asset: TokenBalance | { symbol: 'ETH', name: 'Ethereum', balance: string }) => {
        setSelectedAsset(asset);
        setAmount('0');
        setIsAssetSelectorOpen(false);
    }
    
    const switchInputMode = () => {
        const newMode = inputMode === 'USD' ? 'TOKEN' : 'USD';
        if (newMode === 'TOKEN') {
            setAmount(tokenAmount.toFixed(8));
        } else {
            setAmount(usdAmount.toFixed(2));
        }
        setInputMode(newMode);
    }

    const renderInputView = () => (
         <div className="h-full flex flex-col bg-black text-white rounded-t-3xl overflow-hidden relative">
            <header className="flex justify-between items-center p-4 mt-2">
                <div className="w-8"/>
                <h1 className="text-xl font-bold">Send</h1>
                <AnimatedButton onClick={closeModal} className="text-2xl text-neutral-500"><FaXmark /></AnimatedButton>
            </header>
            <div className="p-4 pt-0">
                 <div className="relative flex items-center bg-neutral-900 rounded-xl px-4 py-3">
                    <span className="text-neutral-400 mr-2">To</span>
                    <input type="text" placeholder="0xb249...9768" value={to} onChange={e => setTo(e.target.value)} className="w-full bg-transparent focus:outline-none text-white"/>
                 </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                <div ref={amountRef} className="w-full">
                    {inputMode === 'USD' ? (
                        <>
                            <h2 className="text-7xl font-bold tracking-tight break-words">${usdAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                            <button onClick={switchInputMode} className="text-neutral-400 mt-2 flex items-center justify-center gap-2 text-lg w-full">
                                {selectedAsset.symbol !== 'ETH' && <img src={(selectedAsset as TokenBalance).logo} className="w-5 h-5 rounded-full" />}
                                {selectedAsset.symbol === 'ETH' && <FaEthereum className="w-4 h-4"/>}
                                <span>{tokenAmount.toFixed(8)}</span>
                                <FaRightLeft className="w-4 h-4"/>
                            </button>
                        </>
                    ) : (
                         <>
                            <h2 className="text-7xl font-bold tracking-tight break-words flex items-center justify-center gap-2">
                                <span>{amount}</span>
                                <span>{selectedAsset.symbol}</span>
                            </h2>
                            <button onClick={switchInputMode} className="text-neutral-400 mt-2 flex items-center justify-center gap-2 text-lg w-full">
                                <span>${usdAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                <FaRightLeft className="w-4 h-4"/>
                            </button>
                        </>
                    )}
                </div>
            </div>
            <div className="p-4 bg-black rounded-t-3xl numpad-container">
                <div className="flex justify-between items-center bg-neutral-900 p-2 rounded-2xl mb-4">
                     <AnimatedButton onClick={() => setIsAssetSelectorOpen(true)} className="flex items-center gap-3">
                        { selectedAsset.symbol === 'ETH' ? 
                            <div className="bg-neutral-800 p-2.5 rounded-full flex items-center justify-center w-11 h-11"><FaEthereum className="w-6 h-6"/></div> :
                            <img src={(selectedAsset as TokenBalance).logo} className="w-11 h-11 rounded-full"/>
                        }
                        <div>
                            <p className="font-bold text-left">{selectedAsset.name}</p>
                            <p className="text-sm text-neutral-400 text-left">{formatBalance(assetBalance)} {selectedAsset.symbol}</p>
                        </div>
                         <FaChevronDown className="text-neutral-400 ml-2 w-5 h-5"/>
                    </AnimatedButton>
                    <AnimatedButton onClick={handleSetMax} className="bg-neutral-800 active:bg-neutral-700 font-bold py-2 px-4 rounded-xl text-sm">Use Max</AnimatedButton>
                </div>
                <Numpad onKeyPress={handleNumpad}/>
                {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
                <AnimatedButton onClick={handleContinue} disabled={loading || !to || amount === '0'} className={`mt-4 w-full bg-primary text-white font-bold py-4 rounded-2xl text-lg flex justify-center items-center disabled:opacity-50 disabled:bg-neutral-800`}>
                    {loading ? <Loader/> : 'Continue'}
                </AnimatedButton>
            </div>
            {isAssetSelectorOpen && <AssetSelector ethBalance={ethBalance} balances={balances} onSelect={handleSelectAsset} onClose={() => setIsAssetSelectorOpen(false)} />}
         </div>
    );
    
    const renderConfirmView = () => (
        <div className="h-full flex flex-col justify-between p-6 bg-black text-white rounded-t-3xl overflow-hidden relative">
             <h1 className="text-2xl font-bold text-center mt-4">Confirm Send</h1>
             <div className="space-y-4 my-8">
                <div className="bg-neutral-800 p-4 rounded-2xl">
                    <p className="text-sm text-neutral-400">To</p>
                    <p className="font-mono text-sm break-all">{to}</p>
                </div>
                <div className="bg-neutral-800 p-4 rounded-2xl">
                    <p className="text-sm text-neutral-400">Amount</p>
                    <p className="font-bold text-2xl">{tokenAmount.toFixed(6)} {selectedAsset.symbol}</p>
                    <p className="text-neutral-400">${usdAmount.toFixed(2)}</p>
                </div>
                <div className="bg-neutral-800 p-4 rounded-2xl">
                    <p className="text-sm text-neutral-400">Network Fee</p>
                    <p className="font-bold">{gasFee ? parseFloat(gasFee).toFixed(6) : '...'} ETH</p>
                </div>
             </div>
             <div className="flex gap-4">
                <AnimatedButton onClick={() => setStep('input')} className="w-full bg-neutral-800 text-white font-bold py-4 rounded-2xl text-lg">Cancel</AnimatedButton>
                <AnimatedButton onClick={handleSendTransaction} className="w-full bg-primary text-white font-bold py-4 rounded-2xl text-lg">Confirm</AnimatedButton>
             </div>
        </div>
    );
    
    const StatusView = ({ status }: { status: 'sending' | 'success' | 'error' }) => {
        const iconRef = useRef(null);
        const titleRef = useRef(null);
        const textRef = useRef(null);

        useEffect(() => {
            const tl = gsap.timeline();
            if (status === 'success') {
                tl.fromTo(iconRef.current, { scale: 0.5 }, { scale: 1, duration: 0.5, ease: 'back.out(1.7)' });
            } else if (status === 'error') {
                tl.fromTo(iconRef.current, { x: -5 }, { x: 5, duration: 0.05, repeat: 5, yoyo: true, clearProps: 'x' });
            }
            tl.fromTo(titleRef.current, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }, '-=0.2');
            tl.fromTo(textRef.current, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }, '-=0.3');
        }, [status]);
        
        const messages = {
            sending: { icon: <Loader/>, title: 'Sending...', text: 'Your transaction is being submitted.' },
            success: { icon: <FaCircleCheck className="text-primary"/>, title: 'Success!', text: 'Your transaction has been confirmed.' },
            error: { icon: <FaTriangleExclamation className="text-red-500"/>, title: 'Failed!', text: error },
        }
        const { icon, title, text } = messages[status];

        return (
            <div className="h-full flex flex-col justify-between items-center text-center p-6 bg-black text-white rounded-t-3xl overflow-hidden relative">
                <div/>
                <div className="flex flex-col items-center">
                    <div ref={iconRef} className="text-7xl mb-6">{icon}</div>
                    <h2 ref={titleRef} className="text-3xl font-bold mb-2">{title}</h2>
                    <p ref={textRef} className="text-neutral-400">{text}</p>
                    {txHash && (
                        <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-primary mt-4 font-bold text-sm">
                            View on Etherscan
                        </a>
                    )}
                </div>
                <AnimatedButton onClick={closeModal} className="w-full bg-primary text-white font-bold py-4 rounded-2xl text-lg">
                    Done
                </AnimatedButton>
            </div>
        )
    };
    
    const pageContent = () => {
        switch(step) {
            case 'input': return renderInputView();
            case 'confirm': return renderConfirmView();
            case 'sending': return <StatusView status="sending" />;
            case 'success': return <StatusView status="success" />;
            case 'error': return <StatusView status="error" />;
            default: return null;
        }
    }
    
    return (
        <div className="h-full">
            {pageContent()}
        </div>
    )
};

export default Send;