"use client";

import { updateUserAction } from "@/actions/user-actions";
import { AuthFormMessage } from "@/components/auth/auth-form-message";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useTimeoutMessage } from "@/hooks/use-timeout-message";
import { useUser } from "@/hooks/use-user";
import { AnimatePresence } from "motion/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";

const formSchema = z.object({
  name: z.string().min(1, "Name cannot be empty"),
});

type FormValues = z.infer<typeof formSchema>;

export function NameSettings() {
  const { user, refetch: refetchUser } = useUser();
  const [message, setMessage] = useTimeoutMessage();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.user_metadata?.name || "",
    },
  });

  const { mutate: updateName, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      const response = await updateUserAction({ name: values.name });
      return response;
    },
    onSuccess: async () => {
      await refetchUser();

      setMessage({ success: "Name updated successfully" });
    },
    onError: (error: Error) => {
      setMessage({ error: error.message });
    },
  });

  if (!user) return null;

  return (
    <Card variant="slate" hideUnderline>
      <CardHeader>
        <CardTitle>Your Name</CardTitle>
        <CardDescription>Will be visible to your team members.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => updateName(values))}
            className="flex items-center gap-2"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Name"
                      className="w-[17rem]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              loading={isPending}
              disabled={form.watch("name") === user?.user_metadata?.name}
              type="submit"
            >
              Save Name
            </Button>
          </form>
        </Form>

        <AnimatePresence initial={false} mode="wait">
          {message && <AuthFormMessage message={message} className="mt-4" />}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
