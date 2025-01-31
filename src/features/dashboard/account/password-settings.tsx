"use client";

import { forgotPasswordAction } from "@/server/auth-actions";
import { AuthFormMessage } from "@/features/auth/form-message";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/primitives/card";
import { Button } from "@/ui/primitives/button";
import { useTimeoutMessage } from "@/lib/hooks/use-timeout-message";
import { useUser } from "@/lib/hooks/use-user";
import { AnimatePresence } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface PasswordSettingsProps {
  className?: string;
}

export function PasswordSettings({ className }: PasswordSettingsProps) {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const [message, setMessage] = useTimeoutMessage();

  useEffect(() => {
    if (
      !searchParams.has("success") &&
      !searchParams.has("error") &&
      !searchParams.has("type")
    )
      return;

    if (searchParams.get("type") === "reset_password") {
      setMessage(
        searchParams.has("success")
          ? {
              success: decodeURIComponent(searchParams.get("success")!),
            }
          : {
              error: decodeURIComponent(searchParams.get("error")!),
            },
      );
    }
  }, [searchParams]);

  if (!user) return null;

  return (
    <Card variant="slate" className={cn(className)}>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>
          Change your account password used to sign in.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Button
          variant="muted"
          onClick={() => {
            if (!user?.email) return;

            const formData = new FormData();
            formData.set("email", user.email);
            formData.set("callbackUrl", "/dashboard/account");

            forgotPasswordAction(formData);
          }}
        >
          Change Password
        </Button>
        <AnimatePresence initial={false} mode="wait">
          {message && <AuthFormMessage className="mt-4" message={message} />}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
