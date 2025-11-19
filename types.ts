import { ethers } from 'ethers';

export interface Token {
  name: string;
  symbol: string;
  address: string;
  abi: any[];
  logo: string;
}

export interface TokenBalance extends Token {
  balance: string;
  balanceUSD: number;
  priceUSD?: number;
}

export interface Transaction {
  hash: string;

  from: string;
  to: string;
  value: string;
  timeStamp: string;
  isError: string;
  tokenSymbol?: string;
  functionName?: string;
}

export interface WalletContextType {
  wallet: ethers.Wallet | null;
  isLocked: boolean;
  address: string;
  provider: ethers.JsonRpcProvider;
  lockWallet: () => void;
  unlockWallet: (password: string) => Promise<boolean>;
  setupWallet: (mnemonic: string, password: string) => Promise<void>;
  encryptedKey: string | null;
  userName: string | null;
  userTokens: Token[];
  addUserToken: (token: Token) => void;
  cardColor: string | null;
  cardIcon: string | null;
}

export interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}
