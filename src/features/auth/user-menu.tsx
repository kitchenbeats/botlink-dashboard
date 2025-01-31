"use client";

import { Button } from "@/ui/primitives/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/primitives/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/primitives/dropdown-menu";
import { signOutAction } from "@/server/auth-actions";
import Link from "next/link";
import { PROTECTED_URLS } from "@/configs/urls";
import UserDetailsTile from "./user-details-tile";
import DeveloperSettingsDialog from "@/features/dashboard/developer-settings/settings-dialog";
import { useState } from "react";
import { User } from "@supabase/supabase-js";

interface UserMenuProps {
  user: User;
  apiDomain?: string;
}

export default function UserMenu({ user, apiDomain }: UserMenuProps) {
  const [developerSettingsOpen, setDeveloperSettingsOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="iconSm"
            className="min-h-8 min-w-8 cursor-pointer"
            variant="ghost"
            asChild
          >
            <Avatar>
              <AvatarImage src={user?.user_metadata.avatar_url} />
              <AvatarFallback>
                {user?.email?.charAt(0).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem asChild className="p-1">
            <Link href={PROTECTED_URLS.ACCOUNT_SETTINGS}>
              <UserDetailsTile user={user} />
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setDeveloperSettingsOpen(true)}>
            Developer Settings
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="text-error"
            onClick={() => signOutAction()}
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeveloperSettingsDialog
        open={developerSettingsOpen}
        onOpenChange={setDeveloperSettingsOpen}
        apiDomain={apiDomain}
      />
    </>
  );
}
