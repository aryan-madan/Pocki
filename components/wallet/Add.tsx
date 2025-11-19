import React, { useContext, useState, useMemo } from 'react';
import { ethers } from 'ethers';
import { WalletContext } from '../../App';
import { MINIMAL_ERC20_ABI, POPULAR_TOKENS } from '../../constants';
import { Token } from '../../types';
// fix: Replaced FaSearch with FaMagnifyingGlass as it is the correct icon name in react-icons/fa6.
import { FaXmark, FaMagnifyingGlass } from 'react-icons/fa6';
import Loader from '../Loader';
import { AnimatedButton } from './Shared';

const Add = ({ closeModal, addUserToken }: { closeModal: () => void, addUserToken: (token: Token) => void }) => {
    const { provider, userTokens } = useContext(WalletContext);
    const [address, setAddress] = useState('');
    const [tokenInfo, setTokenInfo] = useState<Omit<Token, 'logo' | 'abi'> | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = async () => {
        setLoading(true);
        setError('');
        setTokenInfo(null);

        if (!ethers.isAddress(address)) {
            setError('Invalid contract address.');
            setLoading(false);
            return;
        }

        const checksumAddress = ethers.getAddress(address);

        if (userTokens.some(t => ethers.getAddress(t.address) === checksumAddress)) {
            setError('Token has already been added.');
            setLoading(false);
            return;
        }

        try {
            const contract = new ethers.Contract(checksumAddress, MINIMAL_ERC20_ABI, provider);
            const [name, symbol] = await Promise.all([
                contract.name(),
                contract.symbol(),
            ]);

            setTokenInfo({ name, symbol, address: checksumAddress });
        } catch (e) {
            console.error(e);
            setError('Could not find token. Make sure it is on Sepolia testnet.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleAdd = async () => {
        if (!tokenInfo) return;
        
        const newToken: Token = {
            ...tokenInfo,
            abi: MINIMAL_ERC20_ABI,
            logo: `https://ui-avatars.com/api/?name=${tokenInfo.symbol.charAt(0)}&background=random&size=64&color=fff&font-size=0.5`
        };

        addUserToken(newToken);
        closeModal();
    };

    const handleSelectToken = (token: Omit<Token, 'abi' | 'logo'>) => {
        setError('');
        const checksumAddress = ethers.getAddress(token.address);
         if (userTokens.some(t => ethers.getAddress(t.address) === checksumAddress)) {
            setError('Token has already been added.');
            setTokenInfo(null);
            return;
        }
        setTokenInfo(token);
        setAddress(''); // Clear manual address input
    };

    const filteredTokens = useMemo(() => {
        if (!searchTerm) return POPULAR_TOKENS;
        return POPULAR_TOKENS.filter(token => 
            token.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    return (
      <div className="h-full flex flex-col p-4 bg-black text-white relative rounded-t-3xl overflow-hidden">
        <header className="flex justify-between items-center mb-6 mt-4">
          <h1 className="text-xl font-bold">Add Token</h1>
          <AnimatedButton onClick={closeModal} className="text-2xl text-neutral-500"><FaXmark /></AnimatedButton>
        </header>
        <div className="flex flex-col flex-1">
          {/* Search Popular Tokens */}
          <div className="bg-neutral-900 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
            <FaMagnifyingGlass className="text-neutral-500" />
            <input
              type="text"
              placeholder="Search popular tokens..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-transparent focus:outline-none text-white"
            />
          </div>
          <div className="flex-1 overflow-y-auto -mx-4 px-4 divide-y divide-neutral-800">
            {filteredTokens.map(token => (
                <button key={token.address} onClick={() => handleSelectToken(token)} className="w-full flex items-center gap-4 py-3 text-left">
                    <img src={`https://ui-avatars.com/api/?name=${token.symbol.charAt(0)}&background=random&size=64&color=fff&font-size=0.5`} alt={token.symbol} className="w-10 h-10 rounded-full" />
                    <div>
                        <p className="font-bold">{token.name}</p>
                        <p className="text-sm text-neutral-400">{token.symbol}</p>
                    </div>
                </button>
            ))}
          </div>

          <div className="py-4">
             <div className="h-px bg-neutral-800 my-2" />
             <p className="text-center text-sm text-neutral-500 my-3">OR</p>
             <div className="bg-neutral-900 rounded-xl px-4 py-3">
                <label className="text-sm text-neutral-400">Add with Contract Address</label>
                <input
                type="text"
                placeholder="0x..."
                value={address}
                onChange={e => {
                    setAddress(e.target.value);
                    setTokenInfo(null); // Clear popular token selection
                }}
                className="w-full bg-transparent focus:outline-none text-white mt-1"
                />
            </div>
          </div>
          

          {error && <p className="text-red-500 text-sm text-center my-2">{error}</p>}

          {tokenInfo && (
            <div className="bg-neutral-800 p-4 rounded-2xl my-2">
                <p className="text-sm text-neutral-400 mb-2">Token Selected</p>
                <div className="flex items-center gap-3">
                    <img src={`https://ui-avatars.com/api/?name=${tokenInfo.symbol.charAt(0)}&background=random&size=64&color=fff&font-size=0.5`} alt={tokenInfo.symbol} className="w-10 h-10 rounded-full" />
                    <div>
                        <p className="font-bold text-lg">{tokenInfo.name} ({tokenInfo.symbol})</p>
                        <p className="text-sm text-neutral-400 break-all">{tokenInfo.address}</p>
                    </div>
                </div>
            </div>
          )}

          <div className="flex-1" />

          {tokenInfo ? (
             <AnimatedButton onClick={handleAdd} className="w-full bg-primary text-white font-bold py-4 rounded-2xl text-lg">
                Add Token
            </AnimatedButton>
          ) : (
            <AnimatedButton onClick={handleSearch} disabled={loading || !address} className="w-full bg-primary text-white font-bold py-4 rounded-2xl text-lg flex justify-center items-center disabled:opacity-50">
              {loading ? <Loader /> : 'Find Token'}
            </AnimatedButton>
          )}
        </div>
      </div>
    );
};

export default Add;