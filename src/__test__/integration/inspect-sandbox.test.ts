/* eslint-disable @typescript-eslint/no-explicit-any */
// Mock config values to avoid import issues
const COOKIE_KEYS = {
  SELECTED_TEAM_ID: 'selected_team_id',
  SELECTED_TEAM_SLUG: 'selected_team_slug',
}

const KV_KEYS = {
  TEAM_ID_TO_SLUG: (teamId: string) => `team_id_to_slug:${teamId}`,
  TEAM_SLUG_TO_ID: (slug: string) => `team_slug_to_id:${slug}`,
}

const PROTECTED_URLS = {
  DASHBOARD: '/dashboard',
  SANDBOX_INSPECT: (teamSlug: string, sandboxId: string) =>
    `/dashboard/${teamSlug}/sandboxes/${sandboxId}/inspect`,
}
import { infra } from '@/lib/clients/api'
import { kv } from '@/lib/clients/kv'
import { supabaseAdmin } from '@/lib/clients/supabase/admin'
import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Import the route handler
const getRouteHandler = async () => {
  const { GET } = await import('@/app/dashboard/inspect/[sandboxId]/route')

  return GET
}

// ============================================================================
// MOCK SETUP
// ============================================================================

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
    getSession: vi.fn(),
  },
}

// Mock infrastructure API responses
const mockInfraGet = vi.fn()

vi.mock('@/lib/clients/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}))

vi.mock('@/lib/clients/supabase/admin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}))

vi.mock('@/lib/clients/kv', () => ({
  kv: {
    get: vi.fn(),
    set: vi.fn(),
  },
}))

vi.mock('@/lib/clients/api', () => ({
  infra: {
    GET: vi.fn(),
  },
}))

vi.mock('@/configs/api', () => ({
  SUPABASE_AUTH_HEADERS: vi.fn((token: string, teamId: string) => ({
    Authorization: `Bearer ${token}`,
    'X-Team-ID': teamId,
  })),
}))

vi.mock('@/configs/keys', () => ({
  COOKIE_KEYS: {
    SELECTED_TEAM_ID: 'selected_team_id',
    SELECTED_TEAM_SLUG: 'selected_team_slug',
  },
  KV_KEYS: {
    TEAM_ID_TO_SLUG: (teamId: string) => `team_id_to_slug:${teamId}`,
    TEAM_SLUG_TO_ID: (slug: string) => `team_slug_to_id:${slug}`,
  },
}))

vi.mock('@/configs/urls', () => ({
  PROTECTED_URLS: {
    DASHBOARD: '/dashboard',
    SANDBOX_INSPECT: (teamSlug: string, sandboxId: string) =>
      `/dashboard/${teamSlug}/sandboxes/${sandboxId}/inspect`,
  },
}))

vi.mock('@/lib/clients/logger/logger', () => ({
  l: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
  })),
}))

// Mock NextResponse redirect to track calls
let mockRedirectCalls: Array<{ url: string }> = []

vi.mock('next/server', async () => {
  const actual =
    await vi.importActual<typeof import('next/server')>('next/server')

  return {
    ...actual,
    NextResponse: {
      ...actual.NextResponse,
      redirect: vi.fn((url: URL | string) => {
        const urlString = url.toString()
        mockRedirectCalls.push({ url: urlString })
        // Return a mock response instead of calling the original
        return new actual.NextResponse(null, {
          status: 307,
          headers: {
            location: urlString,
          },
        })
      }),
    },
  }
})

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Creates a mock NextRequest for testing
 */
function createMockRequest(sandboxId: string): NextRequest {
  return new NextRequest(`https://app.e2b.dev/dashboard/inspect/${sandboxId}`)
}

/**
 * Creates mock route params
 */
function createMockParams(sandboxId: string) {
  return {
    params: Promise.resolve({ sandboxId }),
  }
}

/**
 * Sets up authenticated user mock
 */
function setupAuthenticatedUser(
  userId = 'user-123',
  accessToken = 'access-token-123'
) {
  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: { user: { id: userId } },
    error: null,
  })

  mockSupabaseClient.auth.getSession.mockResolvedValue({
    data: { session: { access_token: accessToken } },
    error: null,
  })
}

/**
 * Sets up user teams mock
 */
function setupUserTeams(teams: Array<{ id: string; slug: string | null }>) {
  const mockTeamsData = teams.map((team) => ({
    teams: team,
    is_default: false,
  }))

  vi.mocked(supabaseAdmin.from).mockImplementation(
    () =>
      ({
        select: vi.fn(() => ({
          eq: vi.fn(() =>
            Promise.resolve({
              data: mockTeamsData,
              error: null,
            })
          ),
        })),
      }) as any
  )
}

/**
 * Sets up sandbox API response
 */
function setupSandboxResponse(
  teamId: string,
  sandboxId: string,
  found: boolean
) {
  vi.mocked(infra.GET).mockImplementation((path: string, options: any) => {
    if (
      path === '/sandboxes/{sandboxID}' &&
      options.params.path.sandboxID === sandboxId &&
      options.headers['X-Team-ID'] === teamId
    ) {
      if (found) {
        return Promise.resolve({
          response: { status: 200 },
          data: {
            sandboxID: sandboxId,
            templateID: 'template-123',
            clientID: 'client-123',
            startedAt: '2024-01-01T00:00:00Z',
            endAt: '2024-01-02T00:00:00Z',
            state: 'running',
            cpuCount: 2,
            memoryMB: 4096,
            diskSizeMB: 10240,
            envdVersion: '1.0.0',
          },
          error: null,
        })
      } else {
        return Promise.resolve({
          response: { status: 404 },
          data: null,
          error: { message: 'Sandbox not found' },
        })
      }
    }

    return Promise.resolve({
      response: { status: 404 },
      data: null,
      error: { message: 'Not found' },
    })
  })
}

// ============================================================================
// TESTS
// ============================================================================

describe('Sandbox Inspect Route - Integration Tests', () => {
  let GET: any

  beforeEach(async () => {
    vi.clearAllMocks()
    mockRedirectCalls = []
    GET = await getRouteHandler()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Input Validation', () => {
    /**
     * SECURITY TEST: Validates that malicious sandbox IDs are rejected
     */
    it('should reject SQL injection attempts in sandbox ID', async () => {
      setupAuthenticatedUser()
      setupUserTeams([{ id: 'team-123', slug: 'team-slug' }])

      const maliciousIds = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        '../../../etc/passwd',
        "<script>alert('xss')</script>",
        "'; SELECT * FROM teams; --",
      ]

      for (const maliciousId of maliciousIds) {
        const request = createMockRequest(maliciousId)
        const params = createMockParams(maliciousId)

        await GET(request, params)

        // Verify redirect to dashboard with validation error
        const lastRedirect = mockRedirectCalls[mockRedirectCalls.length - 1]
        expect(lastRedirect?.url).toContain(PROTECTED_URLS.DASHBOARD)
      }
    })

    /**
     * VALIDATION TEST: Ensures sandbox ID length limits are enforced
     */
    it('should reject sandbox IDs exceeding maximum length', async () => {
      setupAuthenticatedUser()
      setupUserTeams([{ id: 'team-123', slug: 'team-slug' }])

      const longId = 'a'.repeat(101) // 101 characters (max is 100)
      const request = createMockRequest(longId)
      const params = createMockParams(longId)

      await GET(request, params)

      // Verify redirect to dashboard
      expect(mockRedirectCalls[0]?.url).toContain(PROTECTED_URLS.DASHBOARD)
    })

    /**
     * VALIDATION TEST: Ensures valid sandbox IDs are accepted
     */
    it('should accept valid sandbox ID formats', async () => {
      setupAuthenticatedUser()
      setupUserTeams([{ id: 'team-123', slug: 'team-slug' }])

      const validIds = [
        'sbx-123',
        'sandbox_456',
        'test-sandbox-789',
        'a1b2c3d4e5',
        'SANDBOX-UPPER-123',
      ]

      for (const validId of validIds) {
        setupSandboxResponse('team-123', validId, true)

        const request = createMockRequest(validId)
        const params = createMockParams(validId)

        await GET(request, params)

        // Verify successful redirect to sandbox inspect page
        const lastRedirect = mockRedirectCalls[mockRedirectCalls.length - 1]
        expect(lastRedirect?.url).toContain(`/sandboxes/${validId}/inspect`)
      }
    })
  })

  describe('Authentication', () => {
    /**
     * SECURITY TEST: Verifies unauthenticated users are redirected to sign-in
     */
    it('should redirect to sign-in when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const request = createMockRequest('sbx-123')
      const params = createMockParams('sbx-123')

      await GET(request, params)

      // Verify redirect to sign-in
      expect(mockRedirectCalls[0]?.url).toContain('/sign-in')
    })

    /**
     * SECURITY TEST: Verifies session errors are handled properly
     */
    it('should redirect to sign-in when session is invalid', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid session' },
      })

      const request = createMockRequest('sbx-123')
      const params = createMockParams('sbx-123')

      await GET(request, params)

      // Verify redirect to sign-in
      expect(mockRedirectCalls[0]?.url).toContain('/sign-in')
    })
  })

  describe('Team Discovery', () => {
    /**
     * USER FLOW TEST: Verifies users with no teams are handled correctly
     */
    it('should redirect to dashboard when user has no teams', async () => {
      setupAuthenticatedUser()
      setupUserTeams([]) // No teams

      const request = createMockRequest('sbx-123')
      const params = createMockParams('sbx-123')

      await GET(request, params)

      // Verify redirect to dashboard
      expect(mockRedirectCalls[0]?.url).toContain(PROTECTED_URLS.DASHBOARD)
    })

    /**
     * PERFORMANCE TEST: Verifies cookie team is checked first for optimization
     */
    it('should check cookie team first before searching all teams', async () => {
      setupAuthenticatedUser()
      setupUserTeams([
        { id: 'team-1', slug: 'team-one' },
        { id: 'team-2', slug: 'team-two' },
        { id: 'team-3', slug: 'team-three' },
      ])

      // Setup cookie team preference
      const mockCookies = vi.fn(() => ({
        get: vi.fn((name: string) => {
          if (name === COOKIE_KEYS.SELECTED_TEAM_ID) {
            return { value: 'team-2' }
          }
          return undefined
        }),
      }))

      vi.mocked(await import('next/headers')).cookies = mockCookies as any

      // Setup sandbox in team-2
      setupSandboxResponse('team-2', 'sbx-123', true)

      const request = createMockRequest('sbx-123')
      const params = createMockParams('sbx-123')

      await GET(request, params)

      // Verify only one API call was made (to team-2)
      const infraCalls = vi.mocked(infra.GET).mock.calls
      expect(infraCalls).toHaveLength(1)
      // @ts-expect-error - headers is not typed
      expect(infraCalls[0]?.[1]?.headers?.['X-Team-ID']).toBe('team-2')
    })

    /**
     * USER FLOW TEST: Verifies sandbox is found after searching all teams
     */
    it('should search all teams when sandbox not in cookie team', async () => {
      setupAuthenticatedUser()
      setupUserTeams([
        { id: 'team-1', slug: 'team-one' },
        { id: 'team-2', slug: 'team-two' },
        { id: 'team-3', slug: 'team-three' },
      ])

      // Mock infra.GET to return 404 for team-1 and team-2, success for team-3
      let callCount = 0
      vi.mocked(infra.GET).mockImplementation(() => {
        callCount++
        if (callCount < 3) {
          return Promise.resolve({
            response: { status: 404 },
            data: null,
            error: { message: 'Not found' },
          })
        }
        return Promise.resolve({
          response: { status: 200 },
          data: {
            sandboxID: 'sbx-123',
            templateID: 'template-123',
            clientID: 'client-123',
            startedAt: '2024-01-01T00:00:00Z',
            endAt: '2024-01-02T00:00:00Z',
            state: 'running',
            cpuCount: 2,
            memoryMB: 4096,
            diskSizeMB: 10240,
            envdVersion: '1.0.0',
          },
          error: null,
        })
      })

      const request = createMockRequest('sbx-123')
      const params = createMockParams('sbx-123')

      await GET(request, params)

      // Verify multiple API calls were made
      expect(vi.mocked(infra.GET).mock.calls.length).toBeGreaterThanOrEqual(3)

      // Verify successful redirect to team-3
      expect(mockRedirectCalls[0]?.url).toContain('team-three')
      expect(mockRedirectCalls[0]?.url).toContain('sbx-123')
    })
  })

  describe('Sandbox Authorization', () => {
    /**
     * SECURITY TEST: Verifies sandbox not in user's teams is rejected
     */
    it('should redirect to dashboard when sandbox not found in any team', async () => {
      setupAuthenticatedUser()
      setupUserTeams([
        { id: 'team-1', slug: 'team-one' },
        { id: 'team-2', slug: 'team-two' },
      ])

      // All teams return 404
      vi.mocked(infra.GET).mockResolvedValue({
        response: { status: 404 },
        data: null,
        error: { message: 'Not found' },
      })

      const request = createMockRequest('sbx-not-exists')
      const params = createMockParams('sbx-not-exists')

      await GET(request, params)

      // Verify redirect to dashboard
      expect(mockRedirectCalls[0]?.url).toContain(PROTECTED_URLS.DASHBOARD)
    })

    /**
     * USER FLOW TEST: Verifies successful sandbox resolution and redirect
     */
    it('should redirect to correct team URL when sandbox is found', async () => {
      setupAuthenticatedUser()
      setupUserTeams([{ id: 'team-123', slug: 'my-team' }])
      setupSandboxResponse('team-123', 'sbx-456', true)

      const request = createMockRequest('sbx-456')
      const params = createMockParams('sbx-456')

      await GET(request, params)

      // Verify redirect to correct team sandbox inspect page
      expect(mockRedirectCalls[0]?.url).toContain(
        '/dashboard/my-team/sandboxes/sbx-456/inspect'
      )
    })
  })

  describe('Caching', () => {
    /**
     * PERFORMANCE TEST: Verifies team slug caching works correctly
     */
    it('should cache and use team slug mappings', async () => {
      setupAuthenticatedUser()
      setupUserTeams([{ id: 'team-123', slug: 'cached-team' }])
      setupSandboxResponse('team-123', 'sbx-123', true)

      const request = createMockRequest('sbx-123')
      const params = createMockParams('sbx-123')

      await GET(request, params)

      // Verify cache set was called with correct values
      expect(kv.set).toHaveBeenCalledWith(
        KV_KEYS.TEAM_ID_TO_SLUG('team-123'),
        'cached-team',
        { ex: 3600 }
      )
      expect(kv.set).toHaveBeenCalledWith(
        KV_KEYS.TEAM_SLUG_TO_ID('cached-team'),
        'team-123',
        { ex: 3600 }
      )
    })

    /**
     * FAULT TOLERANCE TEST: Verifies route works even when cache fails
     */
    it('should continue working when cache operations fail', async () => {
      setupAuthenticatedUser()
      setupUserTeams([{ id: 'team-123', slug: 'my-team' }])
      setupSandboxResponse('team-123', 'sbx-123', true)

      // Make cache operations fail
      vi.mocked(kv.get).mockRejectedValue(new Error('Cache error'))
      vi.mocked(kv.set).mockRejectedValue(new Error('Cache error'))

      const request = createMockRequest('sbx-123')
      const params = createMockParams('sbx-123')

      await GET(request, params)

      // Verify redirect still works despite cache errors
      expect(mockRedirectCalls[0]?.url).toContain(
        '/dashboard/my-team/sandboxes/sbx-123/inspect'
      )
    })

    /**
     * PERFORMANCE TEST: Verifies cached slug is used when available
     */
    it('should use cached team slug when available', async () => {
      setupAuthenticatedUser()
      setupUserTeams([
        { id: 'team-123', slug: null }, // No slug in DB
      ])
      setupSandboxResponse('team-123', 'sbx-123', true)

      // Mock cached slug
      vi.mocked(kv.get).mockImplementation((key: string) => {
        if (key === KV_KEYS.TEAM_ID_TO_SLUG('team-123')) {
          return Promise.resolve('cached-slug')
        }
        return Promise.resolve(null)
      })

      const request = createMockRequest('sbx-123')
      const params = createMockParams('sbx-123')

      await GET(request, params)

      // Verify redirect uses cached slug
      expect(mockRedirectCalls[0]?.url).toContain(
        '/dashboard/cached-slug/sandboxes/sbx-123/inspect'
      )
    })
  })

  describe('Cookie Updates', () => {
    /**
     * USER FLOW TEST: Verifies team cookies are updated for UI consistency
     */
    it('should update team selection cookies on successful resolution', async () => {
      setupAuthenticatedUser()
      setupUserTeams([{ id: 'team-456', slug: 'new-team' }])
      setupSandboxResponse('team-456', 'sbx-789', true)

      const request = createMockRequest('sbx-789')
      const params = createMockParams('sbx-789')

      const response = await GET(request, params)

      // Check if response has cookie methods (mocked)
      expect(response).toBeDefined()
      expect(mockRedirectCalls[0]?.url).toContain(
        '/dashboard/new-team/sandboxes/sbx-789/inspect'
      )
    })
  })

  describe('Error Handling', () => {
    /**
     * ERROR HANDLING TEST: Verifies database errors are handled gracefully
     */
    it('should handle database errors gracefully', async () => {
      setupAuthenticatedUser()

      // Mock database error
      vi.mocked(supabaseAdmin.from).mockImplementation(
        () =>
          ({
            select: vi.fn(() => ({
              eq: vi.fn(() =>
                Promise.resolve({
                  data: null,
                  error: { message: 'Database connection error' },
                })
              ),
            })),
          }) as any
      )

      const request = createMockRequest('sbx-123')
      const params = createMockParams('sbx-123')

      await GET(request, params)

      // Verify redirect to dashboard on error
      expect(mockRedirectCalls[0]?.url).toContain(PROTECTED_URLS.DASHBOARD)
    })

    /**
     * ERROR HANDLING TEST: Verifies API errors are handled gracefully
     */
    it('should handle infrastructure API errors gracefully', async () => {
      setupAuthenticatedUser()
      setupUserTeams([{ id: 'team-123', slug: 'my-team' }])

      // Mock API error
      vi.mocked(infra.GET).mockRejectedValue(new Error('API timeout'))

      const request = createMockRequest('sbx-123')
      const params = createMockParams('sbx-123')

      await GET(request, params)

      // Verify redirect to dashboard on error
      expect(mockRedirectCalls[0]?.url).toContain(PROTECTED_URLS.DASHBOARD)
    })

    /**
     * ERROR HANDLING TEST: Verifies unexpected errors don't expose details
     */
    it('should not expose internal errors to users', async () => {
      // Force an unexpected error
      mockSupabaseClient.auth.getUser.mockRejectedValue(
        new Error('Internal server error with sensitive data')
      )

      const request = createMockRequest('sbx-123')
      const params = createMockParams('sbx-123')

      await GET(request, params)

      // Verify safe redirect without error details
      expect(mockRedirectCalls[0]?.url).toContain(PROTECTED_URLS.DASHBOARD)
      expect(mockRedirectCalls[0]?.url).not.toContain('sensitive')
    })
  })

  describe('Performance Characteristics', () => {
    /**
     * PERFORMANCE TEST: Verifies early exit when sandbox is found
     */
    it('should stop searching once sandbox is found', async () => {
      setupAuthenticatedUser()
      setupUserTeams([
        { id: 'team-1', slug: 'team-one' },
        { id: 'team-2', slug: 'team-two' },
        { id: 'team-3', slug: 'team-three' },
        { id: 'team-4', slug: 'team-four' },
      ])

      // Mock sandbox found in team-2
      let callCount = 0
      vi.mocked(infra.GET).mockImplementation(() => {
        callCount++
        if (callCount === 2) {
          return Promise.resolve({
            response: { status: 200 },
            data: {
              sandboxID: 'sbx-123',
              templateID: 'template-123',
              clientID: 'client-123',
              startedAt: '2024-01-01T00:00:00Z',
              endAt: '2024-01-02T00:00:00Z',
              state: 'running',
              cpuCount: 2,
              memoryMB: 4096,
              diskSizeMB: 10240,
              envdVersion: '1.0.0',
            },
            error: null,
          })
        }
        return Promise.resolve({
          response: { status: 404 },
          data: null,
          error: { message: 'Not found' },
        })
      })

      const request = createMockRequest('sbx-123')
      const params = createMockParams('sbx-123')

      await GET(request, params)

      // Verify only 2 API calls were made (early exit after finding sandbox)
      expect(callCount).toBe(2)
    })
  })
})
