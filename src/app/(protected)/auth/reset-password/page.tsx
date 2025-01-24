import { resetPasswordAction } from "@/actions/auth-actions";
import { AuthFormMessage, AuthMessage } from "@/features/auth/form-message";
import { Button } from "@/ui/primitives/button";
import { Input } from "@/ui/primitives/input";
import { Label } from "@/ui/primitives/label";

export default async function ResetPassword(props: {
  searchParams: Promise<AuthMessage>;
}) {
  const searchParams = await props.searchParams;

  return (
    <div className="mx-auto w-full max-w-md p-4 pt-24">
      <form className="flex w-full flex-col gap-2 [&>input]:mb-4">
        <div>
          <h1 className="text-2xl font-medium">Reset password</h1>
          <p className="text-foreground/60 mb-4 text-sm">
            Please enter your new password below.
          </p>
        </div>
        <Label htmlFor="password">New password</Label>
        <Input
          type="password"
          name="password"
          placeholder="New password"
          required
        />
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          type="password"
          name="confirmPassword"
          placeholder="Confirm password"
          required
        />
        <Button formAction={resetPasswordAction}>Reset password</Button>
      </form>
      <AuthFormMessage className="mt-4" message={searchParams} />
    </div>
  );
}
