# Testing Strategy

This project uses a comprehensive testing strategy with different types of tests for different purposes. This README explains the current state of testing and how to extend it.

## Current Test Types

### Integration Tests

Integration tests verify that different parts of the application work together correctly, but they use mocks for external dependencies like databases and APIs. These tests are fast, reliable, and don't require external services to be running.

**Location:** `src/__test__/integration/`

**Run with:** `bun test:integration`

The integration tests use a dummy environment set in `vitest.config.ts` which provides all necessary environment variables with test values. This is sufficient for running integration tests without any additional setup.

**Environment Validation:**
- Integration tests run the `scripts:check-app-env` script before execution to ensure all required application environment variables are set.
- This is configured in `package.json`: `"test:integration": "bun scripts:check-app-env && vitest run src/__test__/integration/"`

**Examples:**
- Authentication tests in `src/__test__/integration/auth.test.ts`
- Middleware tests in `src/__test__/integration/middleware.test.ts`

### End-to-End (E2E) Tests

**Current Status:** E2E tests are not yet implemented. There is a placeholder file at `src/__test__/e2e/placeholder.test.ts`.

**Location:** `src/__test__/e2e/`

**Run with:** `bun test:e2e`

**Environment Validation:**
- E2E tests run the `scripts:check-all-env` script before execution to ensure all required environment variables are set.
- This is configured in `package.json`: `"test:e2e": "bun scripts:check-all-env && vitest run src/__test__/e2e/"`

## Running Tests

### Locally

To run all tests:
```bash
bun test:run
```

To run only integration tests:
```bash
bun test:integration
```

To run only E2E tests (currently just the placeholder):
```bash
bun test:e2e
```

### In CI/CD

Currently, only integration tests are configured to run in CI/CD:

```yaml
# .github/workflows/test.yml
jobs:
  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Run integration tests
        run: bun test:integration
```

## Environment Variables

### For Integration Tests

Integration tests use the environment variables defined in `vitest.config.ts`:

```typescript
env: {
  NODE_ENV: 'test',
  KV_URL: 'redis://localhost:6379',
  KV_REST_API_READ_ONLY_TOKEN: 'test-read-only-token',
  KV_REST_API_TOKEN: 'test-api-token',
  KV_REST_API_URL: 'https://test-kv-api.example.com',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  COOKIE_ENCRYPTION_KEY: 'test-cookie-encryption-key-32-chars-long',
  BILLING_API_URL: 'https://billing.e2b.dev',
  NEXT_PUBLIC_POSTHOG_KEY: 'test-posthog-key',
  NEXT_PUBLIC_SUPABASE_URL: 'https://test-supabase-url.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-supabase-anon-key',
  NEXT_PUBLIC_STRIPE_BILLING_URL: 'https://test-stripe-billing.example.com',
  NEXT_PUBLIC_DEFAULT_API_DOMAIN: 'e2b.dev',
  NEXT_PUBLIC_EXPOSE_STORYBOOK: '0',
  NEXT_PUBLIC_SCAN: '0',
  NEXT_PUBLIC_MOCK_DATA: '1',
}
```

These values are sufficient for running integration tests without any additional setup.

### For E2E Tests (Future Implementation)

When implementing E2E tests, you will need to:

1. Create a `.env.test` file with real credentials for external services
2. Update the `testEnvSchema` in `src/lib/env.ts` to validate the required environment variables
3. Update the GitHub Actions workflow to include E2E tests with the necessary secrets

## Implementing E2E Tests

To start implementing E2E tests:

1. **Create a proper environment setup:**
   - Create a `.env.test.example` file showing required variables
   - Add validation in `scripts/check-e2e-env.ts` to ensure all required variables are present

2. **Update GitHub Actions workflow:**
   - Add a new job for E2E tests in `.github/workflows/test.yml`
   - Configure it to run after integration tests pass
   - Add necessary secrets to GitHub repository settings

3. **Implement actual E2E tests:**
   - Replace the placeholder in `src/__test__/e2e/placeholder.test.ts` with real tests
   - Focus on critical user flows like authentication, team management, etc.
   - Add logic to skip tests if required environment variables are missing

4. **Update this README:**
   - Document the new E2E tests and how to run them
   - Update the environment variables section with the actual requirements

## Best Practices

1. **Write integration tests for most functionality**: They're faster and more reliable.
2. **Use E2E tests for critical paths**: Focus on key user journeys like authentication, payment, etc.
3. **Keep E2E tests minimal**: They're slower and more brittle, so use them sparingly.
4. **Use test data**: Create and clean up test data in your E2E tests to avoid polluting your development/production environment.
5. **Skip E2E tests if environment variables are missing**: This allows the tests to be run in environments without the necessary credentials. 

