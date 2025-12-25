/**
 * ECONOMY SYSTEM
 * Virtual currency, wallets, and transactions
 */

import { v4 as uuidv4 } from 'uuid';
import { storage } from '@kernel/storage';
import type { Wallet, Currency, Transaction } from '@kernel/types';

export class EconomySystem {
  private static instance: EconomySystem;
  private systemCurrency: Currency | null = null;

  private constructor() {}

  static getInstance(): EconomySystem {
    if (!EconomySystem.instance) {
      EconomySystem.instance = new EconomySystem();
    }
    return EconomySystem.instance;
  }

  async initialize(): Promise<void> {
    // Create system currency if doesn't exist
    const currencies = await this.getAllCurrencies();
    const omniCoin = currencies.find(c => c.symbol === 'OMC');

    if (!omniCoin) {
      this.systemCurrency = await this.createCurrency(
        'OmniCoin',
        'OMC',
        'system',
        1000000000, // 1 billion initial supply
        true
      );
    } else {
      this.systemCurrency = omniCoin;
    }

    console.log('💰 Economy System initialized');
  }

  // ============================================================================
  // WALLET MANAGEMENT
  // ============================================================================

  async createWallet(ownerId: string): Promise<Wallet> {
    const wallet: Wallet = {
      id: uuidv4(),
      ownerId,
      balances: new Map(),
      transactions: [],
      createdAt: new Date(),
    };

    // Give initial balance in system currency
    if (this.systemCurrency) {
      wallet.balances.set(this.systemCurrency.id, 1000);
    }

    await this.saveWallet(wallet);

    console.log(`💳 Created wallet for user: ${ownerId}`);

    return wallet;
  }

  async getWallet(walletId: string): Promise<Wallet | null> {
    const walletsData = await storage.getKV<any[]>('wallets') || [];
    const walletData = walletsData.find((w: any) => w.id === walletId);

    if (!walletData) return null;

    return this.deserializeWallet(walletData);
  }

  async getWalletByOwner(ownerId: string): Promise<Wallet | null> {
    const walletsData = await storage.getKV<any[]>('wallets') || [];
    const walletData = walletsData.find((w: any) => w.ownerId === ownerId);

    if (!walletData) return null;

    return this.deserializeWallet(walletData);
  }

  async getOrCreateWallet(ownerId: string): Promise<Wallet> {
    let wallet = await this.getWalletByOwner(ownerId);

    if (!wallet) {
      wallet = await this.createWallet(ownerId);
    }

    return wallet;
  }

  private async saveWallet(wallet: Wallet): Promise<void> {
    const walletsData = await storage.getKV<any[]>('wallets') || [];
    const index = walletsData.findIndex((w: any) => w.id === wallet.id);

    const serialized = this.serializeWallet(wallet);

    if (index >= 0) {
      walletsData[index] = serialized;
    } else {
      walletsData.push(serialized);
    }

    await storage.setKV('wallets', walletsData);
  }

  // ============================================================================
  // CURRENCY MANAGEMENT
  // ============================================================================

  async createCurrency(
    name: string,
    symbol: string,
    issuer: string,
    initialSupply: number,
    isSystem: boolean = false
  ): Promise<Currency> {
    const currency: Currency = {
      id: uuidv4(),
      name,
      symbol,
      issuer,
      totalSupply: initialSupply,
      circulatingSupply: initialSupply,
      decimals: 2,
      isSystemCurrency: isSystem,
      exchangeRates: new Map(),
      metadata: {},
    };

    const currencies = await storage.getKV<any[]>('currencies') || [];
    currencies.push(this.serializeCurrency(currency));
    await storage.setKV('currencies', currencies);

    console.log(`💎 Created currency: ${name} (${symbol})`);

    return currency;
  }

  async getCurrency(currencyId: string): Promise<Currency | null> {
    const currencies = await storage.getKV<any[]>('currencies') || [];
    const currencyData = currencies.find((c: any) => c.id === currencyId);

    if (!currencyData) return null;

    return this.deserializeCurrency(currencyData);
  }

  async getAllCurrencies(): Promise<Currency[]> {
    const currencies = await storage.getKV<any[]>('currencies') || [];
    return currencies.map(c => this.deserializeCurrency(c));
  }

  async setExchangeRate(
    fromCurrencyId: string,
    toCurrencyId: string,
    rate: number
  ): Promise<void> {
    const currency = await this.getCurrency(fromCurrencyId);
    
    if (!currency) {
      throw new Error(`Currency not found: ${fromCurrencyId}`);
    }

    currency.exchangeRates.set(toCurrencyId, rate);

    const currencies = await storage.getKV<any[]>('currencies') || [];
    const index = currencies.findIndex((c: any) => c.id === fromCurrencyId);

    if (index >= 0) {
      currencies[index] = this.serializeCurrency(currency);
      await storage.setKV('currencies', currencies);
    }
  }

  // ============================================================================
  // TRANSACTIONS
  // ============================================================================

  async transfer(
    fromWalletId: string,
    toWalletId: string,
    amount: number,
    currencyId: string,
    metadata?: any
  ): Promise<Transaction> {
    const fromWallet = await this.getWallet(fromWalletId);
    const toWallet = await this.getWallet(toWalletId);

    if (!fromWallet) {
      throw new Error(`Source wallet not found: ${fromWalletId}`);
    }

    if (!toWallet) {
      throw new Error(`Destination wallet not found: ${toWalletId}`);
    }

    const balance = fromWallet.balances.get(currencyId) || 0;

    if (balance < amount) {
      throw new Error('Insufficient balance');
    }

    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    const transaction: Transaction = {
      id: uuidv4(),
      from: fromWalletId,
      to: toWalletId,
      amount,
      currencyId,
      type: 'transfer',
      status: 'pending',
      timestamp: new Date(),
      metadata: metadata || {},
    };

    // Perform transfer
    fromWallet.balances.set(currencyId, balance - amount);
    toWallet.balances.set(currencyId, (toWallet.balances.get(currencyId) || 0) + amount);

    // Record transaction
    fromWallet.transactions.push(transaction.id);
    toWallet.transactions.push(transaction.id);

    transaction.status = 'completed';

    // Save
    await this.saveWallet(fromWallet);
    await this.saveWallet(toWallet);
    await storage.set('transactions', transaction);

    console.log(`💸 Transfer: ${amount} from ${fromWalletId} to ${toWalletId}`);

    return transaction;
  }

  async mint(
    walletId: string,
    amount: number,
    currencyId: string,
    reason: string = 'reward'
  ): Promise<Transaction> {
    const wallet = await this.getWallet(walletId);

    if (!wallet) {
      throw new Error(`Wallet not found: ${walletId}`);
    }

    const currency = await this.getCurrency(currencyId);

    if (!currency) {
      throw new Error(`Currency not found: ${currencyId}`);
    }

    const transaction: Transaction = {
      id: uuidv4(),
      from: 'system',
      to: walletId,
      amount,
      currencyId,
      type: 'mint',
      status: 'completed',
      timestamp: new Date(),
      metadata: { reason },
    };

    wallet.balances.set(currencyId, (wallet.balances.get(currencyId) || 0) + amount);
    wallet.transactions.push(transaction.id);

    currency.circulatingSupply += amount;

    await this.saveWallet(wallet);
    await storage.set('transactions', transaction);

    return transaction;
  }

  async getBalance(walletId: string, currencyId: string): Promise<number> {
    const wallet = await this.getWallet(walletId);

    if (!wallet) {
      throw new Error(`Wallet not found: ${walletId}`);
    }

    return wallet.balances.get(currencyId) || 0;
  }

  async getTransactionHistory(
    walletId: string,
    limit: number = 50
  ): Promise<Transaction[]> {
    const wallet = await this.getWallet(walletId);

    if (!wallet) {
      throw new Error(`Wallet not found: ${walletId}`);
    }

    const transactions: Transaction[] = [];

    for (const txId of wallet.transactions.slice(-limit)) {
      const tx = await storage.get('transactions', txId);
      if (tx) {
        transactions.push(tx);
      }
    }

    return transactions.reverse();
  }

  // ============================================================================
  // REWARDS & INCENTIVES
  // ============================================================================

  async rewardUser(userId: string, amount: number, reason: string): Promise<void> {
    const wallet = await this.getOrCreateWallet(userId);

    if (this.systemCurrency) {
      await this.mint(wallet.id, amount, this.systemCurrency.id, reason);
      console.log(`🎁 Rewarded ${userId}: ${amount} ${this.systemCurrency.symbol} for ${reason}`);
    }
  }

  // ============================================================================
  // SERIALIZATION (for Map support in IndexedDB)
  // ============================================================================

  private serializeWallet(wallet: Wallet): any {
    return {
      ...wallet,
      balances: Array.from(wallet.balances.entries()),
    };
  }

  private deserializeWallet(data: any): Wallet {
    return {
      ...data,
      balances: new Map(data.balances),
      createdAt: new Date(data.createdAt),
    };
  }

  private serializeCurrency(currency: Currency): any {
    return {
      ...currency,
      exchangeRates: Array.from(currency.exchangeRates.entries()),
    };
  }

  private deserializeCurrency(data: any): Currency {
    return {
      ...data,
      exchangeRates: new Map(data.exchangeRates),
    };
  }

  getSystemCurrency(): Currency | null {
    return this.systemCurrency;
  }
}

export const economySystem = EconomySystem.getInstance();
