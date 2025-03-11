import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { middleware } from '@/middleware'
import { checkUserTeamAuthorization } from '@/lib/utils/server'
import { kv } from '@/lib/clients/kv'
import { supabaseAdmin } from '@/lib/clients/supabase/admin'
import { COOKIE_KEYS } from '@/configs/keys'
import { PROTECTED_URLS } from '@/configs/urls'
import { createServerClient } from '@supabase/ssr'
import { AUTH_URLS } from '@/configs/urls'

// Mock dependencies
vi.mock('@/lib/utils/server', () => ({
  checkUserTeamAuthorization: vi.fn(),
  resolveTeamId: vi.fn((id) => Promise.resolve(id)),
}))

vi.mock('@/lib/clients/kv', () => ({
  kv: {
    get: vi.fn(),
    set: vi.fn(),
  },
}))

vi.mock('@/lib/clients/supabase/admin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
  })),
}))

// Mock NextResponse
vi.mock('next/server', async () => {
  const actual =
    await vi.importActual<typeof import('next/server')>('next/server')

  const mockRedirect = vi.fn((url: URL | string) => {
    const response = new actual.NextResponse(null, {
      status: 307,
      headers: {
        location: url.toString(),
      },
    })

    // Add cookies property
    Object.defineProperty(response, 'cookies', {
      value: {
        set: vi.fn(),
        get: vi.fn(),
      },
      writable: true,
    })

    return response
  })

  const mockNext = vi.fn(() => {
    const response = new actual.NextResponse()

    // Add cookies property
    Object.defineProperty(response, 'cookies', {
      value: {
        set: vi.fn(),
      },
      writable: true,
    })

    return response
  })

  return {
    ...actual,
    NextResponse: {
      ...actual.NextResponse,
      redirect: mockRedirect,
      next: mockNext,
    },
  }
})

// Helper to create mock requests
function createMockRequest({
  url = 'https://app.e2b.dev',
  path = '/',
  cookies = {},
  headers = {},
}: {
  url?: string
  path?: string
  cookies?: Record<string, string>
  headers?: Record<string, string>
} = {}): NextRequest {
  const fullUrl = `${url}${path}`

  // Create request with cookies
  const req = new NextRequest(fullUrl, {
    headers: new Headers(headers),
  })

  // Add cookies
  Object.entries(cookies).forEach(([key, value]) => {
    vi.spyOn(req.cookies, 'get').mockImplementation((name) => {
      if (name === key) {
        return { name, value } as { name: string; value: string }
      }
      return undefined
    })
  })

  return req
}

describe('Middleware Integration Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks()

    // Default mocks
    vi.mocked(createServerClient).mockImplementation(
      () =>
        ({
          auth: {
            getUser: vi.fn().mockResolvedValue({
              data: { user: { id: 'user-123' } },
              error: null,
            }),
          },
        }) as ReturnType<typeof createServerClient>
    )
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Authentication Flow', () => {
    it('redirects unauthenticated users to sign in', async () => {
      // Mock unauthenticated user
      vi.mocked(createServerClient).mockImplementation(
        () =>
          ({
            auth: {
              getUser: vi.fn().mockResolvedValue({
                data: { user: null },
                error: { message: 'Not authenticated' },
              }),
            },
          }) as ReturnType<typeof createServerClient>
      )

      const request = createMockRequest({
        path: PROTECTED_URLS.DASHBOARD,
      })

      await middleware(request)

      // Verify that NextResponse.redirect was called
      const redirectCalls = vi.mocked(NextResponse.redirect).mock.calls
      expect(redirectCalls.length).toBeGreaterThan(0)

      // Verify the redirect URL contains the sign-in path
      if (redirectCalls.length > 0) {
        const redirectUrl = redirectCalls[0][0].toString()
        expect(redirectUrl).toContain(AUTH_URLS.SIGN_IN)
      }
    })

    it('allows authenticated users to access protected routes', async () => {
      const request = createMockRequest({
        path: PROTECTED_URLS.DASHBOARD,
      })

      // Mock team data
      vi.mocked(supabaseAdmin.from).mockImplementation(
        () =>
          ({
            select: vi.fn(() => ({
              eq: vi.fn(() =>
                Promise.resolve({
                  data: [
                    {
                      team_id: 'default-team-id',
                      is_default: true,
                      team: { slug: 'default-team' },
                    },
                  ],
                  error: null,
                })
              ),
            })),
          }) as unknown as ReturnType<typeof supabaseAdmin.from>
      )

      await middleware(request)

      // Check if NextResponse.redirect was called with a URL containing the default team
      const redirectCalls = vi.mocked(NextResponse.redirect).mock.calls
      expect(redirectCalls.length).toBeGreaterThan(0)
      if (redirectCalls.length > 0) {
        expect(redirectCalls[0][0].toString()).toContain('default-team')
      }
    })
  })

  describe('Team Access Control', () => {
    it('handles tampered team cookies securely', async () => {
      const request = createMockRequest({
        path: '/dashboard/tampered-team-id/sandboxes',
        cookies: {
          [COOKIE_KEYS.SELECTED_TEAM_ID]: 'tampered-team-id',
        },
      })

      // Mock user has no access to the tampered team
      vi.mocked(checkUserTeamAuthorization).mockResolvedValue(false)

      await middleware(request)

      // Verify we're redirected away from the tampered team
      const redirectCalls = vi.mocked(NextResponse.redirect).mock.calls
      expect(redirectCalls.length).toBeGreaterThan(0)
      if (redirectCalls.length > 0) {
        const url = redirectCalls[0][0].toString()
        expect(url).toContain(PROTECTED_URLS.DASHBOARD)
        expect(url).not.toContain('tampered-team-id')
      }
    })

    it('uses cached team access when available', async () => {
      const request = createMockRequest({
        path: '/dashboard/cached-team-id/sandboxes',
      })

      // Mock cached access value
      vi.mocked(kv.get).mockImplementation((key: string) => {
        if (key.includes('user-123') && key.includes('cached-team-id')) {
          return Promise.resolve(true)
        }
        return Promise.resolve(null)
      })

      await middleware(request)

      // Verify checkUserTeamAuthorization was not called since we used the cache
      expect(checkUserTeamAuthorization).not.toHaveBeenCalled()
    })
  })

  describe('Team Resolution and Routing', () => {
    it('redirects to default team when no team is specified', async () => {
      const request = createMockRequest({
        path: PROTECTED_URLS.DASHBOARD,
      })

      // Mock no teams for this user
      vi.mocked(supabaseAdmin.from).mockImplementation(
        () =>
          ({
            select: vi.fn(() => ({
              eq: vi.fn(() =>
                Promise.resolve({
                  data: [
                    {
                      team_id: 'default-team-id',
                      is_default: true,
                      team: { slug: 'default-team' },
                    },
                  ] as Array<{
                    team_id: string
                    is_default: boolean
                    team: { slug: string }
                  }>,
                  error: null,
                })
              ),
            })),
          }) as unknown as ReturnType<typeof supabaseAdmin.from>
      )

      await middleware(request)

      // Check if NextResponse.redirect was called with a URL containing the default team
      const redirectCalls = vi.mocked(NextResponse.redirect).mock.calls
      expect(redirectCalls.length).toBeGreaterThan(0)
      if (redirectCalls.length > 0) {
        expect(redirectCalls[0][0].toString()).toContain('default-team')
      }
    })

    it('redirects to new team page when user has no teams', async () => {
      const request = createMockRequest({
        path: PROTECTED_URLS.DASHBOARD,
      })

      // Mock no teams for this user
      vi.mocked(supabaseAdmin.from).mockImplementation(
        () =>
          ({
            select: vi.fn(() => ({
              eq: vi.fn(() =>
                Promise.resolve({
                  data: [] as Array<never>,
                  error: null,
                })
              ),
            })),
          }) as unknown as ReturnType<typeof supabaseAdmin.from>
      )

      await middleware(request)

      // Check if NextResponse.redirect was called with the new team URL
      const redirectCalls = vi.mocked(NextResponse.redirect).mock.calls
      expect(redirectCalls.length).toBeGreaterThan(0)
      if (redirectCalls.length > 0) {
        expect(redirectCalls[0][0].toString()).toContain(
          PROTECTED_URLS.NEW_TEAM
        )
      }
    })
  })

  describe('Error Handling', () => {
    it('handles database errors gracefully', async () => {
      const request = createMockRequest({
        path: PROTECTED_URLS.DASHBOARD,
      })

      // Mock database error
      vi.mocked(supabaseAdmin.from).mockImplementation(
        () =>
          ({
            select: vi.fn(() => ({
              eq: vi.fn(() =>
                Promise.resolve({
                  data: null,
                  error: { message: 'Database error' },
                })
              ),
            })),
          }) as unknown as ReturnType<typeof supabaseAdmin.from>
      )

      await middleware(request)

      // Should redirect to home on error
      const redirectCalls = vi.mocked(NextResponse.redirect).mock.calls
      expect(redirectCalls.length).toBeGreaterThan(0)
      if (redirectCalls.length > 0) {
        expect(redirectCalls[0][0].toString()).toContain('/')
      }
    })
  })
})
