"use client";

import { signOutAction } from "@/server/auth/auth-actions";
import { deleteAccountAction } from "@/server/user-actions";
import { AuthFormMessage } from "@/features/auth/form-message";
import { AlertDialog } from "@/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/primitives/card";
import { Button } from "@/ui/primitives/button";
import { Input } from "@/ui/primitives/input";
import { useToast } from "@/lib/hooks/use-toast";
import { useTimeoutMessage } from "@/lib/hooks/use-timeout-message";
import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { useMutation } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface DangerZoneProps {
  className?: string;
}

export function DangerZone({ className }: DangerZoneProps) {
  const { toast } = useToast();
  const [deleteConfirmation, setDeleteConfirmation] = useState<string>("");
  const [message, setMessage] = useTimeoutMessage();

  const { mutate: deleteAccount, isPending } = useMutation({
    mutationFn: async () => {
      const response = await deleteAccountAction();

      if (response.type === "error") {
        throw new Error(response.message);
      }

      return response;
    },
    onSuccess: async () => {
      toast({
        title: "Account deleted",
        description: "You have been signed out",
      });

      await signOutAction();
    },
    onError: (error: Error) => {
      setMessage({ error: error.message });
    },
  });

  return (
    <Card variant="slate" className={cn(className)}>
      <CardHeader>
        <CardTitle>Danger Zone</CardTitle>
        <CardDescription>
          Delete your account and all associated data.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <AlertDialog
          trigger={<Button variant="error">Delete Account</Button>}
          title="Delete Account"
          description={
            <>
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers.
            </>
          }
          confirm="Delete Account"
          onConfirm={() => deleteAccount()}
          confirmProps={{
            disabled: deleteConfirmation !== "delete my account",
            loading: isPending,
          }}
        >
          <>
            <p className="mb-4 text-fg-500">
              Please type{" "}
              <span className="font-medium text-fg">delete my account</span> to
              confirm:
            </p>
            <Input
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="Type 'delete my account' to confirm"
            />
          </>
        </AlertDialog>
        <AnimatePresence initial={false} mode="wait">
          {message && <AuthFormMessage className="mt-4" message={message} />}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
