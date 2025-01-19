"use client";

import { useMetadata } from "@/components/providers/metadata-provider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROTECTED_URLS } from "@/configs/urls";
import { useTeams } from "@/hooks/use-teams";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Loader } from "../ui/loader";

interface TeamSelectorProps {
  className?: string;
}

export default function TeamSelector({ className }: TeamSelectorProps) {
  const { teams: loadedTeams, isLoading: teamsLoading } = useTeams();
  const { selectedTeamId } = useMetadata();
  const router = useRouter();

  const defaultTeam = useMemo(
    () => loadedTeams.find((team) => team.is_default),
    [loadedTeams],
  );

  const teams = useMemo(
    () => loadedTeams.filter((team) => team.id !== defaultTeam?.id) ?? [],
    [loadedTeams, defaultTeam],
  );

  return (
    <div className={className}>
      <Select
        value={selectedTeamId}
        onValueChange={(value) => router.push(PROTECTED_URLS.SANDBOXES(value))}
      >
        <SelectTrigger className="mt-1 h-auto w-full border px-2 py-1 pr-4 hover:bg-bg-100">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-sm bg-bg-300" />
            <div className="flex flex-col items-start pb-px">
              <span className="text-[0.65rem] text-fg-500">TEAM</span>
              <SelectValue placeholder="No team selected" />
            </div>
          </div>
        </SelectTrigger>
        <SelectContent className="min-w-[16rem]">
          {defaultTeam && (
            <SelectGroup>
              <SelectLabel>Personal</SelectLabel>
              <SelectItem key={defaultTeam.id} value={defaultTeam.id}>
                {defaultTeam.name}
              </SelectItem>
            </SelectGroup>
          )}
          {teams.length > 0 && (
            <SelectGroup className="mt-2">
              <SelectLabel>Organizations</SelectLabel>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
          <Button variant="muted" size="sm" className="mt-4 w-full">
            <Plus className="h-4 w-4" />
            Create
          </Button>
        </SelectContent>
      </Select>
    </div>
  );
}
