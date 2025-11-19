
import { Token } from './types';

export const SEPOLIA_RPC_URL = '';
// IMPORTANT: Replace with your free Etherscan API key to fetch transaction history.
// Get one here: https://etherscan.io/apis
export const ETHERSCAN_API_KEY: string = '';
export const ETHERSCAN_API_URL = 'https://api.etherscan.io/v2/api';
export const SEPOLIA_CHAIN_ID = '11155111';

export const ALCHEMY_PRICES_API_KEY = '';
export const ALCHEMY_PRICES_API_URL = 'https://api.g.alchemy.com/prices/v1/tokens/by-symbol';

export const POPULAR_TOKENS: Omit<Token, 'abi' | 'logo'>[] = [
  {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    address: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9'
  },
  {
    name: 'USD Coin',
    symbol: 'USDC',
    address: '0x94a9D9AC8a22534E3FaCa4E4343A411678912391'
  },
  {
    name: 'Dai Stablecoin',
    symbol: 'DAI',
    address: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357'
  }
];

export const MINIMAL_ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
];