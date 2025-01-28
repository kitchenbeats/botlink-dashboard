import { forgotPasswordAction } from "@/server/auth-actions";
import { AuthFormMessage, AuthMessage } from "@/features/auth/form-message";
import { Button } from "@/ui/primitives/button";
import { Input } from "@/ui/primitives/input";
import { Label } from "@/ui/primitives/label";
import { AUTH_URLS } from "@/configs/urls";
import Link from "next/link";

export default async function ForgotPassword(props: {
  searchParams: Promise<AuthMessage>;
}) {
  const searchParam = await props.searchParams;

  return (
    <div className="flex w-full flex-col">
      <h1 className="text-2xl font-medium">Reset Password</h1>
      <p className="text-sm leading-6 text-fg-300">
        Already have an account?{" "}
        <Link
          className="font-medium text-fg underline"
          href={AUTH_URLS.SIGN_IN}
        >
          Sign in
        </Link>
      </p>

      <form className="mt-5 flex flex-col gap-2 [&>input]:mb-1">
        <Label htmlFor="email">Email</Label>
        <Input name="email" placeholder="you@example.com" required />
        <Button formAction={forgotPasswordAction}>Reset Password</Button>
      </form>

      <AuthFormMessage className="mt-4" message={searchParam} />
    </div>
  );
}
