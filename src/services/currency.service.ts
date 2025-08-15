import { AppDataSource } from '../config/database.config';
import { Currency } from '../models/Currency';
import { CacheService } from './cache.service';

export class CurrencyService {
  private currencyRepo = AppDataSource.getRepository<Currency>('Currency');
  // Method to convert currency
  static async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    // Placeholder for actual conversion logic
    // This could involve calling an external API or using a library
    const conversionRate = await this.getConversionRate(
      fromCurrency,
      toCurrency
    );
    return amount * conversionRate;
  }

  // Method to get conversion rate (placeholder)
  private static async getConversionRate(
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    // For now, return a dummy conversion rate
    return 1.2; // Example rate
  }

  async getDefaultCurrency(): Promise<Currency> {
    const key = `defaultCurrency`;
    const defaultCurrency = await CacheService.withCache<Currency | null>(
      key,
      async () => {
        return await this.currencyRepo.findOne({
          where: { isDefault: true },
        });
      }
    );

    if (!defaultCurrency) {
      throw new Error('Default currency not found');
    }

    return defaultCurrency;
  }
}
