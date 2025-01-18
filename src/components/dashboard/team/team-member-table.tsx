"use client";

import {
  getTeamMembersAction,
  removeTeamMemberAction,
} from "@/actions/team-actions";
import { AlertDialog } from "@/components/globals/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QUERY_KEYS } from "@/configs/query-keys";
import { PROTECTED_URLS } from "@/configs/urls";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Loader } from "@/components/ui/loader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTeams } from "@/hooks/use-teams";
import { useUser } from "@/hooks/use-user";

export default function MemberTable() {
  const { refetch: refetchTeams } = useTeams();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const { teamId } = useParams();

  // states
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);

  const {
    data: members,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.TEAM_MEMBERS(teamId as string),
    queryFn: async () => {
      const res = await getTeamMembersAction({ teamId: teamId as string });

      if (res.type === "error") {
        throw new Error(res.message);
      }

      return res.data;
    },
    enabled: !!teamId,
  });

  const { mutate: mutateRemoveMember, isPending: isMutatingRemoveMember } =
    useMutation({
      mutationFn: async (userId: string) => {
        const res = await removeTeamMemberAction({
          teamId: teamId as string,
          userId,
        });

        if (res.type === "error") {
          throw new Error(res.message);
        }

        return userId;
      },
      onSuccess: (removedUserId) => {
        if (removedUserId === user?.id) {
          refetchTeams();

          router.push(PROTECTED_URLS.DASHBOARD);

          return toast({
            title: "You have left the team",
          });
        }

        refetch();
        toast({
          title: "Member removed",
          description: "The member has been removed from the team",
        });
      },
      onError: (error) => {
        toast({
          title: "Could not remove member",
          description: error.message,
          variant: "error",
        });
      },
      onSettled: () => {
        setRemoveDialogOpen(false);
      },
    });

  // TODO: test alert variants in ui

  return (
    <Table className="w-full animate-in fade-in">
      <TableHeader>
        <TableRow>
          <th></th>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Added By</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading && (
          <TableRow>
            <TableCell colSpan={5} className="text-center">
              <div className="flex items-center gap-3">
                Loading members
                <Loader variant="line" />
              </div>
            </TableCell>
          </TableRow>
        )}

        {!isLoading && !error && !members?.length && (
          <TableRow>
            <TableCell colSpan={5} className="text-center">
              <Alert variant="contrast1">
                <AlertDescription>No members found</AlertDescription>
              </Alert>
            </TableCell>
          </TableRow>
        )}

        {error && (
          <TableRow>
            <TableCell colSpan={5} className="text-center">
              <Alert variant="error">
                <AlertDescription>
                  Error loading members: {error?.message}
                </AlertDescription>
              </Alert>
            </TableCell>
          </TableRow>
        )}

        {!isLoading &&
          members &&
          members.map((member) => (
            <TableRow key={member.info.id}>
              <TableCell>
                <Avatar className="size-8">
                  <AvatarImage src={member.info?.avatar_url} />
                  <AvatarFallback>
                    {member.info?.email?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell>
                {member.info.id === user?.id
                  ? "You"
                  : (member.info.name ?? "Anonymous")}
              </TableCell>
              <TableCell className="text-fg-500">{member.info.email}</TableCell>
              <TableCell className="text-fg-300">
                {member.relation.added_by === user?.id
                  ? "You"
                  : (members.find((m) => m.info.id === member.relation.added_by)
                      ?.info.name ?? "")}
              </TableCell>
              <TableCell className="text-end">
                {!member.relation.is_default && user?.id !== member.info.id && (
                  <AlertDialog
                    title="Remove Member"
                    description="Are you sure you want to remove this member from the team?"
                    confirm="Remove"
                    onConfirm={() => mutateRemoveMember(member.info.id)}
                    confirmProps={{
                      loading: isMutatingRemoveMember,
                    }}
                    trigger={
                      <Button variant="muted" size="iconSm">
                        <span className="text-xs">X</span>
                      </Button>
                    }
                    open={removeDialogOpen}
                    onOpenChange={setRemoveDialogOpen}
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
}
