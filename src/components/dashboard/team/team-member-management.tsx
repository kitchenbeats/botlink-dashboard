"use client";

import { addTeamMemberAction } from "@/actions/team-actions";
import { AuthFormMessage } from "@/components/auth/auth-form-message";
import MemberTable from "@/components/dashboard/team/team-member-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { QUERY_KEYS } from "@/configs/query-keys";
import { useTimeoutMessage } from "@/hooks/use-timeout-message";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence } from "motion/react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { mutate } from "swr";

const addMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type AddMemberForm = z.infer<typeof addMemberSchema>;

export function MemberManagement() {
  const { teamId } = useParams();
  const [message, setMessage] = useTimeoutMessage();

  const form = useForm<AddMemberForm>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      email: "",
    },
  });

  const { mutate: addMember, isPending } = useMutation({
    mutationFn: async (data: AddMemberForm) => {
      const response = await addTeamMemberAction({
        teamId: teamId as string,
        email: data.email,
      });
      return response;
    },
    onSuccess: () => {
      mutate(QUERY_KEYS.TEAM_MEMBERS(teamId as string));
      setMessage({ success: "Member added to team" });
      form.reset();
    },
    onError: (error: Error) => {
      setMessage({ error: error.message });
    },
  });

  function onSubmit(data: AddMemberForm) {
    addMember(data);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
        <CardDescription>Manage your organization members.</CardDescription>
      </CardHeader>
      <CardContent className="pt-10">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mb-6 flex w-1/2 gap-2"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="relative w-full">
                  <FormLabel className="absolute bottom-[115%] left-1">
                    E-Mail
                  </FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input placeholder="member@acme.com" {...field} />
                    </FormControl>
                    <Button
                      loading={isPending}
                      type="submit"
                      disabled={!form.formState.isValid}
                    >
                      Add Member
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <AnimatePresence mode="wait" initial={false}>
          {message && <AuthFormMessage className="mb-6" message={message} />}
        </AnimatePresence>

        <MemberTable />
      </CardContent>
    </Card>
  );
}
