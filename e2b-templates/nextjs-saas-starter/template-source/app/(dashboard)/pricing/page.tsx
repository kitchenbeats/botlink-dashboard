import { checkoutAction } from '@/lib/payments/actions';
import { Check } from 'lucide-react';
import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe';
import { SubmitButton } from './submit-button';

// Prices are fresh for one hour max
export const revalidate = 3600;

export default async function PricingPage() {
  const [prices, products] = await Promise.all([
    getStripePrices(),
    getStripeProducts(),
  ]);

  const basePlan = products.find((product) => product.name === 'Base');
  const plusPlan = products.find((product) => product.name === 'Plus');

  const basePrice = prices.find((price) => price.productId === basePlan?.id);
  const plusPrice = prices.find((price) => price.productId === plusPlan?.id);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 relative overflow-hidden">
      {/* 90s background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-40 h-40 border-4 border-purple-600 rotate-45"></div>
        <div className="absolute bottom-40 right-20 w-32 h-32 border-4 border-amber-500 rotate-12"></div>
      </div>

      <div className="text-center mb-12 sm:mb-16 relative z-10">
        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4 uppercase tracking-tight">
          Choose Your Plan
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 font-medium">
          Start with a free trial. No credit card required.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto relative z-10">
        <PricingCard
          name={basePlan?.name || 'Base'}
          price={basePrice?.unitAmount || 800}
          interval={basePrice?.interval || 'month'}
          trialDays={basePrice?.trialPeriodDays || 7}
          features={[
            'Unlimited Usage',
            'Unlimited Workspace Members',
            'Email Support',
          ]}
          priceId={basePrice?.id}
        />
        <PricingCard
          name={plusPlan?.name || 'Plus'}
          price={plusPrice?.unitAmount || 1200}
          interval={plusPrice?.interval || 'month'}
          trialDays={plusPrice?.trialPeriodDays || 7}
          features={[
            'Everything in Base, and:',
            'Early Access to New Features',
            '24/7 Support + Slack Access',
          ]}
          priceId={plusPrice?.id}
        />
      </div>
    </main>
  );
}

function PricingCard({
  name,
  price,
  interval,
  trialDays,
  features,
  priceId,
}: {
  name: string;
  price: number;
  interval: string;
  trialDays: number;
  features: string[];
  priceId?: string;
}) {
  const isPlusPlan = name === 'Plus';

  return (
    <div className={`bg-white rounded-2xl border-4 p-8 relative ${
      isPlusPlan
        ? 'border-purple-900 shadow-[8px_8px_0px_0px_rgba(109,40,217,0.3)]'
        : 'border-gray-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]'
    }`}>
      {isPlusPlan && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider border-3 border-amber-700 shadow-[3px_3px_0px_0px_rgba(217,119,6,0.4)]">
            Popular
          </span>
        </div>
      )}

      <h2 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tight">{name}</h2>
      <p className="text-sm text-gray-600 mb-6 font-bold uppercase tracking-wide">
        {trialDays} Day Free Trial
      </p>
      <div className="mb-8">
        <span className="text-5xl font-black text-gray-900">
          ${price / 100}
        </span>
        <span className="text-lg font-bold text-gray-600 ml-2">
          / {interval}
        </span>
        <p className="text-sm text-gray-500 mt-1 font-medium">per user</p>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <div className={`flex-shrink-0 h-6 w-6 rounded-md flex items-center justify-center mr-3 ${
              isPlusPlan
                ? 'bg-purple-600 border-2 border-purple-900'
                : 'bg-gray-900'
            }`}>
              <Check className="h-4 w-4 text-white" />
            </div>
            <span className="text-gray-700 font-medium">{feature}</span>
          </li>
        ))}
      </ul>
      <form action={checkoutAction}>
        <input type="hidden" name="priceId" value={priceId} />
        <SubmitButton />
      </form>
    </div>
  );
}
