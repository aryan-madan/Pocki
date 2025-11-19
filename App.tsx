import React, { useState, useEffect, createContext, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { SEPOLIA_RPC_URL } from './constants';
import { WalletContextType, ThemeContextType, Token } from './types';
import { encrypt, decrypt } from './utils/crypto';
import Setup from './components/Setup';
import Wallet from './components/Wallet';
import Loader from './components/Loader';

// @ts-ignore - Create context with a default value
export const WalletContext = createContext<WalletContextType>(null);
// @ts-ignore
export const ThemeContext = createContext<ThemeContextType>(null);

const App: React.FC = () => {
  const [wallet, setWallet] = useState<ethers.Wallet | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [encryptedKey, setEncryptedKey] = useState<string | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userTokens, setUserTokens] = useState<Token[]>([]);
  const [cardColor, setCardColor] = useState<string | null>(null);
  const [cardIcon, setCardIcon] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedTheme = window.localStorage.getItem('theme');
      if (storedTheme === 'light' || storedTheme === 'dark') {
        return storedTheme;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark'; // Default for SSR or environments without localStorage
  });

  const provider = useMemo(() => new ethers.JsonRpcProvider(SEPOLIA_RPC_URL), []);
  
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    const storedKey = localStorage.getItem('pocki_wallet_key');
    const onboardingDone = localStorage.getItem('pocki_onboarding_complete') === 'true';
    const storedName = localStorage.getItem('pocki_user_name');
    const storedTokens = localStorage.getItem('pocki_user_tokens');
    const storedColor = localStorage.getItem('pocki_card_color');
    const storedIcon = localStorage.getItem('pocki_card_icon');
    
    if (storedTokens) {
        try {
            setUserTokens(JSON.parse(storedTokens));
        } catch(e) {
            console.error("Failed to parse stored tokens", e);
            localStorage.removeItem('pocki_user_tokens');
        }
    }

    setOnboardingComplete(onboardingDone);
    setEncryptedKey(storedKey);
    setUserName(storedName);
    setCardColor(storedColor);
    setCardIcon(storedIcon);
    setLoading(false);
  }, []);

  const lockWallet = useCallback(() => {
    setWallet(null);
    setIsLocked(true);
  }, []);

  const unlockWallet = useCallback(async (password: string): Promise<boolean> => {
    if (!encryptedKey) return false;
    setLoading(true);
    // Short delay to give feedback on button press
    await new Promise(res => setTimeout(res, 200));
    try {
      const privateKey = decrypt(encryptedKey, password);
      if (privateKey) {
        const unlockedWallet = new ethers.Wallet(privateKey, provider);
        setWallet(unlockedWallet);
        setIsLocked(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error(error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [encryptedKey, provider]);

  const setupWallet = useCallback(async (mnemonic: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const hdWallet = ethers.Wallet.fromPhrase(mnemonic, provider);
      const newEncryptedKey = encrypt(hdWallet.privateKey, password);
      localStorage.setItem('pocki_wallet_key', newEncryptedKey);
      setEncryptedKey(newEncryptedKey);
      
      const newWallet = new ethers.Wallet(hdWallet.privateKey, provider);
      setWallet(newWallet);
      setIsLocked(false);
    } catch (error) {
      console.error("Failed to setup wallet:", error);
    } finally {
      setLoading(false);
    }
  }, [provider]);
  
  const addUserToken = useCallback((token: Token) => {
    setUserTokens(prevTokens => {
      // Check using checksum address to prevent duplicates
      const checksumAddress = ethers.getAddress(token.address);
      if (prevTokens.some(t => ethers.getAddress(t.address) === checksumAddress)) {
        return prevTokens;
      }
      const newTokens = [...prevTokens, token];
      localStorage.setItem('pocki_user_tokens', JSON.stringify(newTokens));
      return newTokens;
    });
  }, []);

  const handleOnboardingComplete = (data: { name: string; color: string; icon: string; }) => {
    localStorage.setItem('pocki_onboarding_complete', 'true');
    localStorage.setItem('pocki_user_name', data.name);
    localStorage.setItem('pocki_card_color', data.color);
    localStorage.setItem('pocki_card_icon', data.icon);
    setUserName(data.name);
    setCardColor(data.color);
    setCardIcon(data.icon);
    setOnboardingComplete(true);
  };

  const walletContextValue = useMemo(() => ({
    wallet,
    isLocked,
    address: wallet?.address || '',
    provider,
    lockWallet,
    unlockWallet,
    setupWallet,
    encryptedKey,
    userName,
    userTokens,
    addUserToken,
    cardColor,
    cardIcon,
  }), [wallet, isLocked, provider, lockWallet, unlockWallet, setupWallet, encryptedKey, userName, userTokens, addUserToken, cardColor, cardIcon]);

  const themeContextValue = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  const renderContent = () => {
    if (loading) {
      return <div className="h-full flex items-center justify-center"><Loader /></div>;
    }

    if (!onboardingComplete) {
      return <Setup isOnboarding={true} onOnboardingComplete={handleOnboardingComplete} />;
    }

    if (isLocked || !wallet) {
      return <Setup />;
    }

    return <Wallet />;
  };
  
  return (
    <ThemeContext.Provider value={themeContextValue}>
      <WalletContext.Provider value={walletContextValue}>
        <div className="h-full w-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 p-0 md:p-4">
          {/* Fixed width/height container on desktop to simulate mobile device */}
          <div className="w-full h-full md:w-[400px] md:h-[800px] md:max-h-[90vh] bg-surface flex flex-col relative overflow-hidden md:rounded-3xl md:shadow-2xl md:border md:border-neutral-200 dark:md:border-neutral-800 transform-gpu">
            {renderContent()}
          </div>
        </div>
      </WalletContext.Provider>
    </ThemeContext.Provider>
  );
};

export default App;