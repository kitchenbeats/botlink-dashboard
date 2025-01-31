"use client";

import { signInAction } from "@/server/auth-actions";
import { AuthFormMessage, AuthMessage } from "@/features/auth/form-message";
import { OAuthProviders } from "@/features/auth/oauth-provider-buttons";
import TextSeparator from "@/ui/text-separator";
import { Button } from "@/ui/primitives/button";
import { Input } from "@/ui/primitives/input";
import { Label } from "@/ui/primitives/label";
import { AUTH_URLS } from "@/configs/urls";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef, useEffect } from "react";

export default function Login() {
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Handle email prefill from forgot password flow
  useEffect(() => {
    const email = searchParams.get("email");
    if (email && emailRef.current) {
      emailRef.current.value = email;
      // Focus password field if email is prefilled
      passwordRef.current?.focus();
    } else {
      // Focus email field if no prefill
      emailRef.current?.focus();
    }
  }, [searchParams]);

  const handleForgotPassword = () => {
    const email = emailRef.current?.value;
    const searchParams = email ? `?email=${encodeURIComponent(email)}` : "";
    window.location.href = `${AUTH_URLS.FORGOT_PASSWORD}${searchParams}`;
  };

  // Parse search params into AuthMessage
  const message: AuthMessage | undefined = (() => {
    const error = searchParams.get("error");
    const success = searchParams.get("success");
    if (error) return { error: decodeURIComponent(error) };
    if (success) return { success: decodeURIComponent(success) };
    return undefined;
  })();

  return (
    <div className="flex w-full flex-col">
      <h1 className="text-2xl font-medium">Sign in</h1>
      <p className="text-fg-300 text-sm leading-6">
        Don&apos;t have an account?{" "}
        <Link
          className="text-fg font-medium underline"
          href={AUTH_URLS.SIGN_UP}
        >
          Sign up
        </Link>
      </p>

      <OAuthProviders />

      <TextSeparator text="or" />

      <form ref={formRef} className="flex flex-col gap-2 [&>input]:mb-3">
        <Label htmlFor="email">Email</Label>
        <Input
          ref={emailRef}
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
        />
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-xs underline underline-offset-[3px]"
            tabIndex={-1}
          >
            Forgot Password?
          </button>
        </div>
        <Input
          ref={passwordRef}
          id="password"
          type="password"
          name="password"
          placeholder="Your password"
          required
        />
        <Button formAction={signInAction}>Sign in</Button>
      </form>

      {message && <AuthFormMessage className="mt-4" message={message} />}
    </div>
  );
}
