import { WalletInfo } from './types';

export const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Germany", "France", 
  "Spain", "Italy", "Australia", "India", "Brazil", "UAE", "Saudi Arabia",
  "Philippines", "Indonesia", "Nigeria", "South Africa"
];

export const BRANDS = [
  "Huawei", "ZTE", "TP-Link", "Netgear", "Alcatel", "D-Link", 
  "Samsung", "Novatel", "Sierra Wireless", "Franklin"
];

export const CRYPTO_WALLETS: WalletInfo[] = [
  {
    currency: "USDT (TRC20)",
    address: "T9yG1234567890abcdef1234567890TrC2",
    network: "Tron",
    qrCodeUrl: "https://picsum.photos/200/200?grayscale",
    price: 25.00
  },
  {
    currency: "Bitcoin (BTC)",
    address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    network: "Bitcoin",
    qrCodeUrl: "https://picsum.photos/200/200?grayscale&blur=1",
    price: 0.00085
  }
];

export const APP_NAME = "UnlockGlobal";