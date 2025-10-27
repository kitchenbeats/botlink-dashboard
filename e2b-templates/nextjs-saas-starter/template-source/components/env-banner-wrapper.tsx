/**
 * Server Component Wrapper for Environment Banner
 * Shows a simple banner when optional env vars are missing
 */

import { validateEnvironment } from '@/lib/env-validator';
import { EnvBanner } from './env-banner';

export function EnvBannerWrapper() {
  // Validate environment on the server
  const validation = validateEnvironment();

  // Only show optional missing keys (not required ones that would crash the app)
  const optionalMissing = validation.missing.filter((check) => !check.required);

  if (optionalMissing.length === 0) {
    return null;
  }

  return (
    <EnvBanner
      missingKeys={optionalMissing.map((check) => ({
        key: check.key,
        name: check.name,
        description: check.description,
        docsUrl: check.docsUrl,
      }))}
    />
  );
}
