'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CircleIcon, Loader2 } from 'lucide-react';
import { signIn, signUp } from './actions';
import { ActionState } from '@/lib/auth/middleware';

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const priceId = searchParams.get('priceId');
  const inviteId = searchParams.get('inviteId');
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === 'signin' ? signIn : signUp,
    { error: '' }
  );

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 relative overflow-hidden">
      {/* 90s background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 right-10 w-40 h-40 border-4 border-purple-600 rotate-45"></div>
        <div className="absolute bottom-20 left-10 w-32 h-32 border-4 border-amber-500 rotate-12"></div>
        <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-purple-200 rounded-full"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 border-4 border-purple-900 shadow-[6px_6px_0px_0px_rgba(109,40,217,0.4)] flex items-center justify-center">
            <CircleIcon className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-4xl font-black text-gray-900 uppercase tracking-tight">
          {mode === 'signin'
            ? 'Sign In'
            : 'Sign Up'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 font-medium">
          {mode === 'signin'
            ? 'Welcome back to ReactWrite'
            : 'Join ReactWrite today'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] border-4 border-gray-900 rounded-2xl">
          <form className="space-y-6" action={formAction}>
          <input type="hidden" name="redirect" value={redirect || ''} />
          <input type="hidden" name="priceId" value={priceId || ''} />
          <input type="hidden" name="inviteId" value={inviteId || ''} />
          <div>
            <Label
              htmlFor="email"
              className="block text-sm font-bold text-gray-900 uppercase tracking-wide mb-2"
            >
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={state.email}
              required
              maxLength={50}
              className="appearance-none rounded-lg w-full px-4 py-3 border-3 border-gray-900 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-4 focus:ring-purple-500 focus:border-purple-600 font-medium shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)]"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <Label
              htmlFor="password"
              className="block text-sm font-bold text-gray-900 uppercase tracking-wide mb-2"
            >
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={
                mode === 'signin' ? 'current-password' : 'new-password'
              }
              defaultValue={state.password}
              required
              minLength={8}
              maxLength={100}
              className="appearance-none rounded-lg w-full px-4 py-3 border-3 border-gray-900 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-4 focus:ring-purple-500 focus:border-purple-600 font-medium shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)]"
              placeholder="••••••••"
            />
          </div>

          {state?.error && (
            <div className="bg-red-50 border-3 border-red-600 rounded-lg p-3 text-red-700 text-sm font-bold shadow-[2px_2px_0px_0px_rgba(220,38,38,0.3)]">
              {state.error}
            </div>
          )}

          <div>
            <Button
              type="submit"
              className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-base font-black uppercase tracking-wide text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 border-4 border-purple-900 shadow-[6px_6px_0px_0px_rgba(109,40,217,0.4)] hover:shadow-[3px_3px_0px_0px_rgba(109,40,217,0.4)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
              disabled={pending}
            >
              {pending ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-5 w-5" />
                  Loading...
                </>
              ) : mode === 'signin' ? (
                'Sign In'
              ) : (
                'Sign Up'
              )}
            </Button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-gray-500 font-bold uppercase tracking-wider">
                {mode === 'signin'
                  ? 'New here?'
                  : 'Have an account?'}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href={`${mode === 'signin' ? '/sign-up' : '/sign-in'}${
                redirect ? `?redirect=${redirect}` : ''
              }${priceId ? `&priceId=${priceId}` : ''}`}
              className="w-full flex justify-center py-3 px-4 border-3 border-gray-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] hover:translate-x-[2px] hover:translate-y-[2px] text-sm font-black uppercase tracking-wide text-gray-900 bg-white hover:bg-gray-50 transition-all"
            >
              {mode === 'signin'
                ? 'Create Account'
                : 'Sign In'}
            </Link>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
