'use client';

import { X, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export interface MissingEnvKey {
  key: string;
  name: string;
  description: string;
  docsUrl?: string;
}

interface EnvBannerProps {
  missingKeys: MissingEnvKey[];
}

export function EnvBanner({ missingKeys }: EnvBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  // Don't show if no missing optional keys or if dismissed
  if (missingKeys.length === 0 || dismissed) {
    return null;
  }

  // Focus on Stripe keys for the main message
  const stripeKeys = missingKeys.filter((key) =>
    key.key.startsWith('STRIPE_')
  );
  const hasStripe = stripeKeys.length > 0;

  return (
    <div className="relative bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-amber-900">
                {hasStripe ? (
                  <>
                    Add your Stripe API keys to enable billing.{' '}
                    <a
                      href="https://docs.stripe.com/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:no-underline font-medium"
                    >
                      Get API keys →
                    </a>
                  </>
                ) : (
                  <>
                    Some features require additional environment variables.
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="flex-shrink-0 p-0.5 hover:bg-amber-100 rounded transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4 text-amber-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
