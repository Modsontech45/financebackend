require('dotenv').config({ path: '.env.local' }); // or '.env.production'
// src/scripts/seed.ts
import 'reflect-metadata';
import { AppDataSource } from '../config/database.config';
import { Currency } from '../models/Currency';
import { Subscription, SubscriptionPlan } from '../models/Subscription';

async function seedDatabase() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();

    const currencyRepository =
      AppDataSource.getRepository<Currency>('Currency');
    const subscriptionRepository =
      AppDataSource.getRepository<Subscription>('Subscription');

    // Seed currencies
    console.log('Seeding currencies...');
    const currencies = [
      { code: 'USD', name: 'US Dollar', symbol: '$', isDefault: true },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'GBP', name: 'British Pound', symbol: '£' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
      { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
      { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
      { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
    ];

    for (const currencyData of currencies) {
      const existingCurrency = await currencyRepository.findOne({
        where: { code: currencyData.code },
      });

      if (!existingCurrency) {
        const currency = currencyRepository.create(currencyData);
        await currencyRepository.save(currency);
        console.log(`✓ Created currency: ${currencyData.code}`);
      } else {
        console.log(`- Currency already exists: ${currencyData.code}`);
      }
    }

    // Seed subscription plans
    console.log('Seeding subscription plans...');
    const subscriptions = [
      {
        plan: SubscriptionPlan.BASIC,
        name: 'Basic Plan',
        price: 0.0,
        maxTeamMembers: 5,
        maxSaves: 100,
        features:
          'Basic financial tracking, Up to 5 team members, 100 transaction limit, Basic analytics, Email support',
      },
      {
        plan: SubscriptionPlan.PREMIUM,
        name: 'Premium Plan',
        price: 29.99,
        maxTeamMembers: 20,
        maxSaves: 1000,
        features:
          'Advanced financial tracking, Up to 20 team members, 1000 transaction limit, Advanced analytics, Priority email support, Export functionality',
      },
      {
        plan: SubscriptionPlan.ENTERPRISE,
        name: 'Enterprise Plan',
        price: 99.99,
        maxTeamMembers: 999999, // Unlimited
        maxSaves: 999999, // Unlimited
        features:
          'Full financial management suite, Unlimited team members, Unlimited transactions, Advanced analytics & reporting, Priority support, Custom integrations, API access',
      },
    ];

    for (const subscriptionData of subscriptions) {
      const existingSubscription = await subscriptionRepository.findOne({
        where: { plan: subscriptionData.plan },
      });

      if (!existingSubscription) {
        const subscription = subscriptionRepository.create(subscriptionData);
        await subscriptionRepository.save(subscription);
        console.log(`✓ Created subscription: ${subscriptionData.name}`);
      } else {
        console.log(`- Subscription already exists: ${subscriptionData.name}`);
      }
    }

    console.log('✅ Database seeding completed successfully');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    process.exit(0);
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };
