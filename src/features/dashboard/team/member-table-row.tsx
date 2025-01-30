"use client";

import { useToast } from "@/lib/hooks/use-toast";
import { TableCell, TableRow } from "@/ui/primitives/table";
import { Button } from "@/ui/primitives/button";
import { AlertDialog } from "@/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/primitives/avatar";
import { removeTeamMemberAction } from "@/server/team/team-actions";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTeams } from "@/lib/hooks/use-teams";
import { useUser } from "@/lib/hooks/use-user";
import { PROTECTED_URLS } from "@/configs/urls";
import { QUERY_KEYS } from "@/configs/keys";
import { mutate } from "swr";
import { TeamMember } from "@/server/team/types";

interface TableRowProps {
  member: TeamMember;
  index: number;
}

export default function MemberTableRow({ member, index }: TableRowProps) {
  const { toast } = useToast();
  const { teamId } = useParams();
  const router = useRouter();
  const { refetch: refetchTeams } = useTeams();
  const { user } = useUser();
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemoveMember = async (userId: string) => {
    setIsRemoving(true);
    try {
      const res = await removeTeamMemberAction({
        teamId: teamId as string,
        userId,
      });

      if (res.type === "error") {
        throw new Error(res.message);
      }

      if (userId === user?.id) {
        refetchTeams();
        router.push(PROTECTED_URLS.DASHBOARD);
        toast({
          title: "You have left the team",
        });
      } else {
        await mutate(QUERY_KEYS.TEAM_MEMBERS(teamId as string));
        toast({
          title: "Member removed",
          description: "The member has been removed from the team",
        });
      }
    } catch (error: any) {
      toast({
        title: "Could not remove member",
        description: error.message,
        variant: "error",
      });
    } finally {
      setIsRemoving(false);
      setRemoveDialogOpen(false);
    }
  };

  return (
    <TableRow key={`${member.info.id}-${index}`}>
      <TableCell>
        <Avatar className="size-8">
          <AvatarImage src={member.info?.avatar_url} />
          <AvatarFallback>
            {member.info?.email?.charAt(0).toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
      </TableCell>
      <TableCell className="min-w-36">
        {member.info.id === user?.id
          ? "You"
          : (member.info.name ?? "Anonymous")}
      </TableCell>
      <TableCell className="text-fg-500">{member.info.email}</TableCell>
      <TableCell className="text-fg-300">
        {member.relation.added_by === user?.id
          ? "You"
          : (member.relation.added_by ?? "")}
      </TableCell>
      <TableCell className="text-end">
        {!member.relation.is_default && user?.id !== member.info.id && (
          <AlertDialog
            title="Remove Member"
            description="Are you sure you want to remove this member from the team?"
            confirm="Remove"
            onConfirm={() => handleRemoveMember(member.info.id)}
            confirmProps={{
              loading: isRemoving,
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
  );
}
