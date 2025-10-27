/**
 * Environment variable validation utility
 * Gracefully checks for missing environment variables
 */

export interface EnvCheck {
  key: string;
  name: string;
  required: boolean;
  present: boolean;
  description: string;
  docsUrl?: string;
}

export interface EnvValidationResult {
  allPresent: boolean;
  missing: EnvCheck[];
  optional: EnvCheck[];
  checks: EnvCheck[];
}

/**
 * Check if an environment variable is present and non-empty
 */
function isEnvPresent(key: string): boolean {
  const value = process.env[key];
  return value !== undefined && value !== '';
}

/**
 * Validate all environment variables for the SaaS starter
 */
export function validateEnvironment(): EnvValidationResult {
  const checks: EnvCheck[] = [
    {
      key: 'STRIPE_SECRET_KEY',
      name: 'Stripe Secret Key',
      required: false, // Optional - billing features won't work without it
      present: isEnvPresent('STRIPE_SECRET_KEY'),
      description: 'Required for payment processing and billing features',
      docsUrl: 'https://docs.stripe.com/keys',
    },
    {
      key: 'STRIPE_WEBHOOK_SECRET',
      name: 'Stripe Webhook Secret',
      required: false,
      present: isEnvPresent('STRIPE_WEBHOOK_SECRET'),
      description: 'Required to receive Stripe webhook events',
      docsUrl: 'https://docs.stripe.com/webhooks',
    },
    {
      key: 'POSTGRES_URL',
      name: 'PostgreSQL Database URL',
      required: true, // Critical - app won't work without it
      present: isEnvPresent('POSTGRES_URL'),
      description: 'Database connection string (required for app to function)',
      docsUrl: 'https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING',
    },
    {
      key: 'AUTH_SECRET',
      name: 'Authentication Secret',
      required: true, // Critical - auth won't work
      present: isEnvPresent('AUTH_SECRET'),
      description: 'Secret key for authentication tokens (required)',
    },
    {
      key: 'BASE_URL',
      name: 'Base URL',
      required: false,
      present: isEnvPresent('BASE_URL'),
      description: 'Your app\'s public URL (defaults to localhost in dev)',
    },
  ];

  const missing = checks.filter((check) => !check.present);
  const optional = missing.filter((check) => !check.required);
  const allPresent = missing.filter((check) => check.required).length === 0;

  return {
    allPresent,
    missing,
    optional,
    checks,
  };
}
